const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { pool } = require('../config/db');

const DEFAULT_BACKUP_TIME = '00:00';
const TICK_MS = 30 * 1000;
let schedulerTimer = null;
let lastScheduledDate = null;

function pad2(n) {
  return String(n).padStart(2, '0');
}

function getDateParts(date = new Date()) {
  return {
    y: date.getFullYear(),
    m: pad2(date.getMonth() + 1),
    d: pad2(date.getDate()),
    hh: pad2(date.getHours()),
    mm: pad2(date.getMinutes()),
    ss: pad2(date.getSeconds()),
  };
}

function normalizeTimeToHHMM(rawTime) {
  if (!rawTime) return DEFAULT_BACKUP_TIME;
  const str = String(rawTime);
  const parts = str.split(':');
  if (parts.length < 2) return DEFAULT_BACKUP_TIME;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return DEFAULT_BACKUP_TIME;
  }
  return `${pad2(h)}:${pad2(m)}`;
}

async function getBackupSettings() {
  const [rows] = await pool.execute(
    'SELECT backup_time FROM backup_settings WHERE id = 1 LIMIT 1'
  );
  const raw = rows[0] ? rows[0].backup_time : null;
  return {
    backupTimeHHMM: normalizeTimeToHHMM(raw),
  };
}

async function listBackupPaths() {
  const [rows] = await pool.execute(
    'SELECT id, backup_path FROM backup_paths ORDER BY id ASC'
  );
  return rows.map((r) => ({
    id: r.id,
    backupPath: r.backup_path,
  })).filter((r) => r.backupPath);
}

function hasBackupForToday(backupDir, dbName) {
  try {
    const files = fs.readdirSync(backupDir);
    const today = getDateParts();
    const datePrefix = `${today.y}-${today.m}-${today.d}`;
    return files.some((name) => {
      if (!name.endsWith('.sql')) return false;
      if (!name.startsWith(`${dbName}_backup_${datePrefix}`)) return false;
      return true;
    });
  } catch (_) {
    return false;
  }
}

function runSingleBackup(backupDir) {
  return new Promise((resolve, reject) => {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = String(parseInt(process.env.DB_PORT, 10) || 3306);
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '2202122';
    const dbName = process.env.DB_NAME || 'sb_pos';

    fs.mkdirSync(backupDir, { recursive: true });

    const now = getDateParts();
    const filename = `${dbName}_backup_${now.y}-${now.m}-${now.d}_${now.hh}-${now.mm}-${now.ss}.sql`;
    const outputPath = path.join(backupDir, filename);
    const out = fs.createWriteStream(outputPath);

    const args = [
      '-h', dbHost,
      '-P', dbPort,
      '-u', dbUser,
      `-p${dbPassword}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--events',
      dbName,
    ];

    const child = spawn('mysqldump', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += String(chunk || '');
    });

    child.stdout.pipe(out);

    child.on('error', (err) => {
      out.close();
      reject(err);
    });

    child.on('close', (code) => {
      out.close();
      if (code === 0) {
        resolve({ outputPath });
      } else {
        reject(new Error(stderr || `mysqldump exited with code ${code}`));
      }
    });
  });
}

async function ensureDailyBackups(reason) {
  const dbName = process.env.DB_NAME || 'sb_pos';
  const paths = await listBackupPaths();
  if (!paths.length) return;

  for (const row of paths) {
    try {
      const existsToday = hasBackupForToday(row.backupPath, dbName);
      if (existsToday) continue;
      const result = await runSingleBackup(row.backupPath);
      console.log(`[Backup] Created (${reason}):`, result.outputPath);
    } catch (err) {
      console.error(`[Backup] Failed at path "${row.backupPath}":`, err.message || err);
    }
  }
}

async function runManualBackups() {
  const paths = await listBackupPaths();
  if (!paths.length) {
    return {
      successCount: 0,
      failCount: 0,
      details: [],
      message: 'لا توجد مسارات محددة للنسخ الاحتياطي',
    };
  }

  const details = [];
  for (const row of paths) {
    try {
      const result = await runSingleBackup(row.backupPath);
      details.push({
        path: row.backupPath,
        success: true,
        outputPath: result.outputPath,
      });
      console.log('[Backup] Manual backup created:', result.outputPath);
    } catch (err) {
      details.push({
        path: row.backupPath,
        success: false,
        error: err.message || String(err),
      });
      console.error(`[Backup] Manual backup failed at "${row.backupPath}":`, err.message || err);
    }
  }

  const successCount = details.filter((d) => d.success).length;
  const failCount = details.length - successCount;
  return {
    successCount,
    failCount,
    details,
    message: failCount
      ? `تم إنشاء ${successCount} نسخة وفشل ${failCount} مسار`
      : `تم إنشاء النسخة الاحتياطية في ${successCount} مسار`,
  };
}

async function schedulerTick() {
  try {
    const settings = await getBackupSettings();
    const now = new Date();
    const hhmm = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;
    const today = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;

    if (hhmm === settings.backupTimeHHMM && lastScheduledDate !== today) {
      lastScheduledDate = today;
      await ensureDailyBackups('scheduled');
    }
  } catch (err) {
    console.error('[Backup] Scheduler tick error:', err.message || err);
  }
}

async function startBackupScheduler() {
  try {
    await ensureDailyBackups('startup-check');
  } catch (err) {
    console.error('[Backup] Startup check error:', err.message || err);
  }

  if (schedulerTimer) clearInterval(schedulerTimer);
  schedulerTimer = setInterval(schedulerTick, TICK_MS);
}

module.exports = {
  startBackupScheduler,
  runManualBackups,
  DEFAULT_BACKUP_TIME,
  normalizeTimeToHHMM,
};

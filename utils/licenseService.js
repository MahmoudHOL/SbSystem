const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { pool } = require('../config/db');

const LICENSE_DB_PEPPER = process.env.LICENSE_DB_PEPPER || 'SB_SMART_DB_ONLY_LICENSE_v1';
let schemaEnsured = false;

function getMachineGuid() {
  try {
    const output = execSync(
      'reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid',
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const parts = String(output).trim().split(/\s+/);
    return parts[parts.length - 1] || '';
  } catch (_) {
    return '';
  }
}

function getFingerprintSource() {
  const cpuInfo = (os.cpus() || []).map((c) => c.model).join('|');
  return [
    os.hostname(),
    os.platform(),
    os.arch(),
    getMachineGuid(),
    cpuInfo,
  ].join('||');
}

function getMachineFingerprint() {
  return crypto
    .createHash('sha256')
    .update(getFingerprintSource(), 'utf8')
    .digest('hex');
}

function nowIso() {
  return new Date().toISOString();
}

function deriveDeviceKey(fingerprint) {
  return crypto
    .createHash('sha256')
    .update(`${fingerprint}::${LICENSE_DB_PEPPER}`, 'utf8')
    .digest();
}

function encryptForDevice(licenseObj, fingerprint) {
  const key = deriveDeviceKey(fingerprint);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(licenseObj);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    payload: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
  };
}

function decryptForDevice(row, fingerprint) {
  const key = deriveDeviceKey(fingerprint);
  const iv = Buffer.from(String(row.payload_iv || ''), 'base64');
  const tag = Buffer.from(String(row.payload_tag || ''), 'base64');
  const payload = Buffer.from(String(row.encrypted_payload || ''), 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(payload), decipher.final()]).toString('utf8');
  return JSON.parse(decrypted);
}

async function getStoredLicenseRow() {
  await ensureLicenseSchema();
  const [rows] = await pool.execute(
    `SELECT id, machine_fingerprint, license_type, license_status, reason_code, issued_at, expires_at, signature, encrypted_payload, payload_iv, payload_tag
     FROM app_license_state
     WHERE id = 1
     LIMIT 1`
  );
  return rows && rows[0] ? rows[0] : null;
}

async function columnExists(columnName) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS cnt
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'app_license_state'
       AND COLUMN_NAME = ?`,
    [columnName]
  );
  return Number(rows[0]?.cnt || 0) > 0;
}

async function ensureLicenseSchema() {
  if (schemaEnsured) return;
  const hasEncryptedPayload = await columnExists('encrypted_payload');
  if (!hasEncryptedPayload) {
    await pool.execute('ALTER TABLE app_license_state ADD COLUMN encrypted_payload LONGTEXT NULL AFTER signature');
  }
  const hasPayloadIv = await columnExists('payload_iv');
  if (!hasPayloadIv) {
    await pool.execute('ALTER TABLE app_license_state ADD COLUMN payload_iv VARCHAR(64) NULL AFTER encrypted_payload');
  }
  const hasPayloadTag = await columnExists('payload_tag');
  if (!hasPayloadTag) {
    await pool.execute('ALTER TABLE app_license_state ADD COLUMN payload_tag VARCHAR(64) NULL AFTER payload_iv');
  }
  schemaEnsured = true;
}

async function touchLicenseState(status) {
  await ensureLicenseSchema();
  await pool.execute(
    `UPDATE app_license_state
     SET machine_fingerprint = ?,
         license_status = ?,
         reason_code = ?,
         last_checked_at = NOW(),
         updated_at = NOW()
     WHERE id = 1`,
    [status.fingerprint || null, status.ok ? 'active' : 'blocked', status.reason || null]
  );
}

async function getLicenseStatus() {
  const fingerprint = getMachineFingerprint();
  const now = new Date();
  const row = await getStoredLicenseRow();

  if (!row || !row.encrypted_payload || !row.payload_iv || !row.payload_tag) {
    return {
      ok: false,
      mode: 'missing',
      reason: 'license_missing',
      fingerprint,
      checked_at: nowIso(),
    };
  }

  let lic;
  try {
    lic = decryptForDevice(row, fingerprint);
  } catch (_) {
    return { ok: false, mode: 'invalid', reason: 'device_mismatch', fingerprint, checked_at: nowIso() };
  }

  if (String(lic.machine_fingerprint || '') !== fingerprint) {
    return { ok: false, mode: 'invalid', reason: 'device_mismatch', fingerprint, checked_at: nowIso() };
  }
  if (String(lic.status || 'active') !== 'active') {
    return { ok: false, mode: 'invalid', reason: 'disabled', fingerprint, checked_at: nowIso() };
  }
  if (lic.type === 'trial' && lic.expires_at && now > new Date(lic.expires_at)) {
    return {
      ok: false,
      mode: 'expired',
      reason: 'trial_expired',
      expires_at: lic.expires_at,
      fingerprint,
      checked_at: nowIso(),
    };
  }

  return {
    ok: true,
    mode: lic.type === 'permanent' ? 'permanent' : 'trial',
    expires_at: lic.expires_at || null,
    fingerprint,
    checked_at: nowIso(),
    license: lic,
  };
}

async function applyLicenseToken(licenseObj) {
  await ensureLicenseSchema();
  const fingerprint = getMachineFingerprint();
  if (String(licenseObj.machine_fingerprint || '') !== fingerprint) {
    throw new Error('device_mismatch');
  }
  const enc = encryptForDevice(licenseObj, fingerprint);
  await pool.execute(
    `
    INSERT INTO app_license_state (
      id,
      machine_fingerprint,
      license_type,
      license_status,
      reason_code,
      issued_at,
      expires_at,
      signature,
      encrypted_payload,
      payload_iv,
      payload_tag,
      raw_license_json,
      last_checked_at,
      updated_at
    ) VALUES (
      1, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, NULL, NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE
      machine_fingerprint = VALUES(machine_fingerprint),
      license_type = VALUES(license_type),
      license_status = VALUES(license_status),
      reason_code = NULL,
      issued_at = VALUES(issued_at),
      expires_at = VALUES(expires_at),
      signature = VALUES(signature),
      encrypted_payload = VALUES(encrypted_payload),
      payload_iv = VALUES(payload_iv),
      payload_tag = VALUES(payload_tag),
      raw_license_json = NULL,
      last_checked_at = NOW(),
      updated_at = NOW()
    `,
    [
      fingerprint,
      licenseObj.type || null,
      licenseObj.status === 'active' ? 'active' : 'blocked',
      licenseObj.issued_at || null,
      licenseObj.expires_at || null,
      licenseObj.signature || null,
      enc.payload,
      enc.iv,
      enc.tag,
    ]
  );
  return getLicenseStatus();
}

async function resetLicenseState() {
  await ensureLicenseSchema();
  await pool.execute(
    `
    INSERT INTO app_license_state (
      id,
      machine_fingerprint,
      license_type,
      license_status,
      reason_code,
      issued_at,
      expires_at,
      signature,
      encrypted_payload,
      payload_iv,
      payload_tag,
      raw_license_json,
      last_checked_at,
      updated_at
    ) VALUES (
      1, NULL, NULL, 'blocked', 'manual_reset', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW(), NOW()
    )
    ON DUPLICATE KEY UPDATE
      machine_fingerprint = NULL,
      license_type = NULL,
      license_status = 'blocked',
      reason_code = 'manual_reset',
      issued_at = NULL,
      expires_at = NULL,
      signature = NULL,
      encrypted_payload = NULL,
      payload_iv = NULL,
      payload_tag = NULL,
      raw_license_json = NULL,
      last_checked_at = NOW(),
      updated_at = NOW()
    `
  );
  return getLicenseStatus();
}

module.exports = {
  getLicenseStatus,
  getMachineFingerprint,
  applyLicenseToken,
  touchLicenseState,
  resetLicenseState,
};

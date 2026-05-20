/**
 * إفراغ جميع جداول قاعدة البيانات الحالية ثم إنشاء مستخدم admin فقط.
 * يستخدم إعدادات config/db.js ومتغيرات البيئة (.env).
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const ADMIN_USER = 'admin';
const ADMIN_PASSWORD = '123456';

function quoteId(name) {
  return '`' + String(name).replace(/`/g, '``') + '`';
}

async function insertAdminUser(conn, passwordHash) {
  const [cols] = await conn.query('SHOW COLUMNS FROM users');
  const fields = new Set((cols || []).map((c) => c.Field));
  const parts = [];
  const vals = [];
  const push = (col, val) => {
    parts.push(quoteId(col));
    vals.push(val);
  };
  push('username', ADMIN_USER);
  if (fields.has('email')) push('email', null);
  push('password_hash', passwordHash);
  if (fields.has('full_name')) push('full_name', null);
  if (fields.has('is_active')) push('is_active', 1);
  const sql = `INSERT INTO users (${parts.join(', ')}) VALUES (${parts.map(() => '?').join(', ')})`;
  await conn.query(sql, vals);
}

async function main() {
  const dbName = process.env.DB_NAME || 'sb_pos';
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    const [tables] = await conn.query(
      `SELECT TABLE_NAME AS name FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [dbName]
    );

    const names = (tables || []).map((r) => r.name).filter(Boolean);
    for (const name of names) {
      await conn.query(`TRUNCATE TABLE ${quoteId(name)}`);
      console.log('تم تفريغ:', name);
    }

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await insertAdminUser(conn, hash);
    console.log('تم إنشاء المستخدم: admin / 123456');

    try {
      await conn.query(
        'INSERT IGNORE INTO minimum_stock_default (id, default_minimum_quantity) VALUES (1, 0)'
      );
    } catch (_) {
      /* الجدول قد لا يكون موجوداً في نسخ قديمة */
    }

    console.log('تمت إعادة التهيئة بنجاح.');
  } catch (err) {
    console.error('خطأ:', err.message || err);
    process.exitCode = 1;
  } finally {
    if (conn) conn.release();
    await pool.end();
  }
}

main();

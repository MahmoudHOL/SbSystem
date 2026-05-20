/**
 * إنشاء مستخدم تجريبي في sb_pos.users
 * تشغيل: node scripts/seed-user.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const DEFAULT_PASSWORD = '2202122';

async function seed() {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  try {
    await pool.execute(
      `INSERT INTO users (username, password_hash, full_name) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE username = VALUES(username), password_hash = VALUES(password_hash), full_name = VALUES(full_name), updated_at = CURRENT_TIMESTAMP`,
      ['panda', hash, 'panda']
    );
    console.log('تم إنشاء/تحديث المستخدم: panda / كلمة المرور: 2202122');
  } catch (err) {
    console.error('خطأ:', err.message);
  } finally {
    process.exit(0);
  }
}

seed();

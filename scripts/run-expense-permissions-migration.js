/**
 * إضافة صلاحيات «تعديل المصروفات» و«حذف المصروفات» إلى جدول permissions
 * تشغيل: node scripts/run-expense-permissions-migration.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { pool } = require('../config/db');

async function run() {
  try {
    await pool.execute(
      `INSERT IGNORE INTO permissions (name, slug, is_enabled) VALUES (?, ?, 1), (?, ?, 1), (?, ?, 1)`,
      ['إضافة مصروف', 'add_expenses', 'تعديل المصروفات', 'edit_expenses', 'حذف المصروفات', 'delete_expenses']
    );
    console.log('تمت إضافة صلاحيات: إضافة مصروف، تعديل المصروفات، حذف المصروفات');
    console.log('الآن فعّل الصلاحيات للموظف من: الإعدادات → الصلاحيات');
  } catch (err) {
    console.error('خطأ:', err.message);
  } finally {
    process.exit(0);
  }
}

run();

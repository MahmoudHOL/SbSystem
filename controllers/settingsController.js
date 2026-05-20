/**
 * صفحة الإعدادات - المستخدمون وغيرها
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { getPublicDirForSendFile } = require('../utils/paths');
const {
  DEFAULT_BACKUP_TIME,
  normalizeTimeToHHMM,
  runManualBackups,
} = require('../utils/backupScheduler');

const publicDir = getPublicDirForSendFile();

function getSettingsPage(req, res) {
  res.sendFile('settings.html', { root: publicDir });
}

function getUsersPage(req, res) {
  res.sendFile('users.html', { root: publicDir });
}

function getSystemPage(req, res) {
  res.sendFile('system.html', { root: publicDir });
}

async function getSettingsHomeAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }
  if (username === 'admin') {
    return res.json({ success: true, data: { permissions_manage: true } });
  }
  try {
    const [rows] = await pool.execute(
      `
      SELECT EXISTS(
        SELECT 1
        FROM permissions p
        LEFT JOIN user_permission_overrides upo
          ON upo.permission_id = p.id
         AND upo.user_id = ?
        LEFT JOIN user_roles ur
          ON ur.user_id = ?
        LEFT JOIN role_permissions rp
          ON rp.role_id = ur.role_id
         AND rp.permission_id = p.id
        WHERE p.module_key = 'settings.permissions'
          AND p.action_key = 'manage'
          AND COALESCE(upo.is_allowed, rp.is_allowed, 0) = 1
        LIMIT 1
      ) AS allowed
      `,
      [userId, userId]
    );
    return res.json({
      success: true,
      data: { permissions_manage: !!(rows && rows[0] && Number(rows[0].allowed) === 1) },
    });
  } catch (err) {
    console.error('Get settings home access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات الإعدادات' });
  }
}

/**
 * نسب الخصم
 */
async function getDiscountConfig(req, res) {
  try {
    const [globalRows] = await pool.execute(
      'SELECT rate_percent FROM discount_rates WHERE is_global = 1 ORDER BY id DESC LIMIT 1'
    );
    const globalRate = globalRows[0] ? Number(globalRows[0].rate_percent) : 0;

    const [userRows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, dr.rate_percent
       FROM users u
       LEFT JOIN discount_rates dr ON dr.user_id = u.id
       ORDER BY u.username`
    );

    res.json({
      success: true,
      data: {
        global_rate: globalRate,
        users: userRows.map((u) => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name || null,
          rate_percent: u.rate_percent != null ? Number(u.rate_percent) : null,
        })),
      },
    });
  } catch (err) {
    console.error('Get discount config error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب نسب الخصم' });
  }
}

async function setGlobalDiscount(req, res) {
  const percent = req.body && req.body.percent != null ? Number(req.body.percent) : NaN;
  if (Number.isNaN(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ success: false, message: 'نسبة الخصم العام يجب أن تكون بين 0 و 100' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT id FROM discount_rates WHERE is_global = 1 LIMIT 1'
    );
    if (rows[0]) {
      await pool.execute(
        'UPDATE discount_rates SET rate_percent = ?, updated_at = NOW() WHERE id = ?',
        [percent, rows[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO discount_rates (user_id, rate_percent, is_global) VALUES (NULL, ?, 1)',
        [percent]
      );
    }
    res.json({ success: true, message: 'تم حفظ الخصم العام' });
  } catch (err) {
    console.error('Set global discount error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ الخصم العام' });
  }
}

async function setUserDiscount(req, res) {
  const userId = req.body && req.body.userId ? parseInt(req.body.userId, 10) : NaN;
  const percentRaw = req.body ? req.body.percent : null;

  if (!userId) {
    return res.status(400).json({ success: false, message: 'معرف المستخدم غير صالح' });
  }

  // إذا لم تُرسل نسبة، نحذف أي نسبة خاصة ونعود للعام
  if (percentRaw === null || percentRaw === '' || typeof percentRaw === 'undefined') {
    try {
      await pool.execute(
        'DELETE FROM discount_rates WHERE user_id = ? AND is_global = 0',
        [userId]
      );
      return res.json({ success: true, message: 'تم إرجاع المستخدم إلى الخصم العام' });
    } catch (err) {
      console.error('Clear user discount error:', err);
      return res.status(500).json({ success: false, message: 'خطأ في تحديث خصم المستخدم' });
    }
  }

  const percent = Number(percentRaw);
  if (Number.isNaN(percent) || percent < 0 || percent > 100) {
    return res.status(400).json({ success: false, message: 'نسبة خصم المستخدم يجب أن تكون بين 0 و 100' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id FROM discount_rates WHERE user_id = ? AND is_global = 0 LIMIT 1',
      [userId]
    );
    if (rows[0]) {
      await pool.execute(
        'UPDATE discount_rates SET rate_percent = ?, updated_at = NOW() WHERE id = ?',
        [percent, rows[0].id]
      );
    } else {
      await pool.execute(
        'INSERT INTO discount_rates (user_id, rate_percent, is_global) VALUES (?, ?, 0)',
        [userId, percent]
      );
    }
    res.json({ success: true, message: 'تم حفظ خصم المستخدم' });
  } catch (err) {
    console.error('Set user discount error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ خصم المستخدم' });
  }
}

/**
 * قائمة طرق الدفع
 */
async function listPaymentMethods(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM payment_methods ORDER BY name'
    );
    let defaultId = null;
    try {
      const [def] = await pool.execute(
        'SELECT id FROM payment_methods WHERE is_default_pos = 1 LIMIT 1'
      );
      if (def.length) defaultId = def[0].id;
    } catch (_) {
      /* عمود is_default_pos غير موجود بعد تشغيل migration 019 */
    }
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        name: r.name,
        created_at: r.created_at,
        is_default_pos: r.id === defaultId,
      })),
    });
  } catch (err) {
    console.error('List payment methods error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب طرق الدفع' });
  }
}

/**
 * إنشاء طريقة دفع
 */
async function createPaymentMethod(req, res) {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  if (!name || name.length < 1) {
    return res.status(400).json({ success: false, message: 'اسم طريقة الدفع مطلوب' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO payment_methods (name) VALUES (?)',
      [name]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM payment_methods WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({
      success: true,
      message: 'تمت إضافة طريقة الدفع',
      data: rows[0] || { id: result.insertId, name, created_at: new Date() },
    });
  } catch (err) {
    console.error('Create payment method error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الإضافة' });
  }
}

/**
 * تعيين طريقة الدفع الافتراضية لنقطة البيع (واحدة فقط)
 */
async function setDefaultPaymentMethodForPos(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) {
    return res.status(400).json({ success: false, message: 'معرف طريقة الدفع غير صالح' });
  }
  try {
    const [exists] = await pool.execute('SELECT id FROM payment_methods WHERE id = ?', [id]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: 'طريقة الدفع غير موجودة' });
    }
    await pool.execute('UPDATE payment_methods SET is_default_pos = 0');
    await pool.execute('UPDATE payment_methods SET is_default_pos = 1 WHERE id = ?', [id]);
    res.json({
      success: true,
      message: 'تم تعيين طريقة الدفع الافتراضية لنقطة البيع',
      data: { id },
    });
  } catch (err) {
    console.error('Set default payment method for POS error:', err);
    const msg = err.code === 'ER_BAD_FIELD_ERROR' || err.message && err.message.includes('is_default_pos')
      ? 'يجب تشغيل تحديث قاعدة البيانات (ملف 019) أولاً'
      : 'خطأ في التعيين';
    res.status(500).json({ success: false, message: msg });
  }
}

/**
 * قائمة المستخدمين (النشطين وغير النشطين للعرض في الإعدادات)
 */
async function listUsers(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, u.is_active, u.created_at
       FROM users u
       ORDER BY is_active DESC, created_at DESC`
    );
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        username: r.username,
        full_name: r.full_name || null,
        is_active: Boolean(r.is_active),
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب المستخدمين' });
  }
}

/**
 * إنشاء مستخدم جديد
 */
async function createUser(req, res) {
  const username = (req.body && req.body.username) ? String(req.body.username).trim() : '';
  const password = req.body && req.body.password ? String(req.body.password) : '';
  const full_name = (req.body && req.body.full_name) ? String(req.body.full_name).trim() : null;

  if (!username || username.length < 2) {
    return res.status(400).json({ success: false, message: 'اسم المستخدم مطلوب (حرفان على الأقل)' });
  }
  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, message: 'كلمة المرور مطلوبة (4 أحرف على الأقل)' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, full_name, is_active)
       VALUES (?, ?, ?, 1)`,
      [username, hash, full_name || null]
    );
    const newUserId = result.insertId;
    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, u.is_active, u.created_at
       FROM users u
       WHERE u.id = ? LIMIT 1`,
      [newUserId]
    );
    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: rows[0] ? {
        id: rows[0].id,
        username: rows[0].username,
        full_name: rows[0].full_name || null,
        is_active: true,
        created_at: rows[0].created_at,
      } : null,
    });
  } catch (err) {
    console.error('Create user error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'اسم المستخدم مستخدم مسبقاً' });
    }
    res.status(500).json({ success: false, message: 'خطأ في إنشاء المستخدم' });
  }
}

/**
 * تعديل بيانات مستخدم: اسم المستخدم + الاسم الكامل + كلمة المرور (اختياري) + الحالة
 */
async function updateUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المستخدم غير صالح' });
  }

  const username = (req.body && req.body.username) ? String(req.body.username).trim() : '';
  const full_name = (req.body && req.body.full_name != null) ? String(req.body.full_name).trim() : null;
  const password = (req.body && req.body.password) ? String(req.body.password) : '';
  const isActiveRaw = req.body ? req.body.is_active : undefined;

  if (!username || username.length < 2) {
    return res.status(400).json({ success: false, message: 'اسم المستخدم مطلوب (حرفان على الأقل)' });
  }
  if (password && password.length < 4) {
    return res.status(400).json({ success: false, message: 'كلمة المرور يجب أن تكون 4 أحرف على الأقل' });
  }

  let isActive = null;
  if (typeof isActiveRaw !== 'undefined') {
    isActive = Boolean(isActiveRaw);
  }

  const currentUserId = req.session && req.session.userId ? req.session.userId : null;
  if (currentUserId === id && isActive === false) {
    return res.status(400).json({ success: false, message: 'لا يمكن تعطيل حسابك أنت' });
  }

  try {
    const [exists] = await pool.execute('SELECT id, username FROM users WHERE id = ? LIMIT 1', [id]);
    if (!exists.length) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    const currentUsername = String(exists[0].username || '').toLowerCase();
    if (currentUsername === 'admin' && username.toLowerCase() !== 'admin') {
      return res.status(400).json({ success: false, message: 'لا يمكن تغيير اسم المستخدم admin' });
    }

    const fields = ['username = ?', 'full_name = ?'];
    const params = [username, full_name || null];

    if (typeof isActiveRaw !== 'undefined') {
      fields.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      params.push(hash);
    }

    params.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      params
    );

    const [rows] = await pool.execute(
      `SELECT id, username, full_name, is_active, created_at
       FROM users
       WHERE id = ? LIMIT 1`,
      [id]
    );

    return res.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم',
      data: rows[0] ? {
        id: rows[0].id,
        username: rows[0].username,
        full_name: rows[0].full_name || null,
        is_active: Boolean(rows[0].is_active),
        created_at: rows[0].created_at,
      } : null,
    });
  } catch (err) {
    console.error('Update user error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'اسم المستخدم مستخدم مسبقاً' });
    }
    return res.status(500).json({ success: false, message: 'خطأ في تحديث المستخدم' });
  }
}

/**
 * حذف ناعم: تعطيل المستخدم (is_active = 0) ليبقى مرتبطاً بالعمليات
 */
async function softDeleteUser(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المستخدم غير صالح' });
  }

  const currentUserId = req.session && req.session.userId ? req.session.userId : null;
  if (currentUserId === id) {
    return res.status(400).json({ success: false, message: 'لا يمكن تعطيل حسابك أنت' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE users SET is_active = 0, updated_at = NOW() WHERE id = ?',
      [id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    res.json({
      success: true,
      message: 'تم تعطيل المستخدم (حذف ناعم). يبقى مرتبطاً بالعمليات السابقة.',
    });
  } catch (err) {
    console.error('Soft delete user error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تعطيل المستخدم' });
  }
}

/**
 * جلب المستخدمين مع المخازن المرتبطة بهم + قائمة المخازن (لتبويب تحديد مخزن لي المستخدم)
 */
async function getUserWarehousesConfig(req, res) {
  try {
    const [usersRows] = await pool.execute(
      'SELECT id, username, full_name FROM users WHERE is_active = 1 ORDER BY username'
    );
    const [warehousesRows] = await pool.execute(
      'SELECT id, name FROM warehouses ORDER BY name'
    );
    const [linksRows] = await pool.execute(
      'SELECT user_id, warehouse_id FROM user_warehouses'
    );

    const warehouseMap = new Map(warehousesRows.map((w) => [w.id, { id: w.id, name: w.name }]));

    const users = usersRows.map((u) => {
      const userLinks = linksRows.filter((l) => l.user_id === u.id);
      const warehouses = userLinks
        .map((l) => warehouseMap.get(l.warehouse_id))
        .filter(Boolean);
      return {
        id: u.id,
        username: u.username,
        full_name: u.full_name || null,
        warehouses,
      };
    });

    res.json({
      success: true,
      data: {
        users,
        warehouses: warehousesRows.map((w) => ({ id: w.id, name: w.name })),
      },
    });
  } catch (err) {
    console.error('Get user warehouses config error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات المستخدمين والمخازن' });
  }
}

/**
 * ربط مستخدم بمخزن
 */
async function addUserWarehouse(req, res) {
  const userId = req.body && req.body.user_id != null ? parseInt(req.body.user_id, 10) : NaN;
  const warehouseId = req.body && req.body.warehouse_id != null ? parseInt(req.body.warehouse_id, 10) : NaN;
  if (!userId || !warehouseId) {
    return res.status(400).json({ success: false, message: 'معرف المستخدم والمخزن مطلوبان' });
  }
  try {
    await pool.execute(
      'INSERT INTO user_warehouses (user_id, warehouse_id) VALUES (?, ?)',
      [userId, warehouseId]
    );
    res.json({ success: true, message: 'تم ربط المستخدم بالمخزن' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'المستخدم مرتبط بهذا المخزن مسبقاً' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'المستخدم أو المخزن غير موجود' });
    }
    console.error('Add user warehouse error:', err);
    res.status(500).json({ success: false, message: 'خطأ في ربط المستخدم بالمخزن' });
  }
}

/**
 * إلغاء ربط مستخدم بمخزن (يدعم query أو body)
 */
async function removeUserWarehouse(req, res) {
  const userId = (req.query && req.query.user_id != null) || (req.body && req.body.user_id != null)
    ? parseInt(req.query?.user_id || req.body?.user_id, 10) : NaN;
  const warehouseId = (req.query && req.query.warehouse_id != null) || (req.body && req.body.warehouse_id != null)
    ? parseInt(req.query?.warehouse_id || req.body?.warehouse_id, 10) : NaN;
  if (!userId || !warehouseId) {
    return res.status(400).json({ success: false, message: 'معرف المستخدم والمخزن مطلوبان' });
  }
  try {
    const [result] = await pool.execute(
      'DELETE FROM user_warehouses WHERE user_id = ? AND warehouse_id = ?',
      [userId, warehouseId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'الربط غير موجود' });
    }
    res.json({ success: true, message: 'تم إلغاء ربط المستخدم بالمخزن' });
  } catch (err) {
    console.error('Remove user warehouse error:', err);
    res.status(500).json({ success: false, message: 'خطأ في إلغاء الربط' });
  }
}

/**
 * قائمة فئات المصروفات (للإعدادات وللوحة التحكم)
 */
async function listExpenseCategories(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM expense_categories ORDER BY name'
    );
    res.json({
      success: true,
      data: rows.map((r) => ({ id: r.id, name: r.name, created_at: r.created_at })),
    });
  } catch (err) {
    console.error('List expense categories error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب فئات المصروفات' });
  }
}

/**
 * إنشاء فئة مصروفات جديدة
 */
async function createExpenseCategory(req, res) {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  if (!name || name.length < 1) {
    return res.status(400).json({ success: false, message: 'اسم الفئة مطلوب' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO expense_categories (name) VALUES (?)',
      [name]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM expense_categories WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({
      success: true,
      message: 'تمت إضافة فئة المصروفات',
      data: rows[0] || { id: result.insertId, name, created_at: new Date() },
    });
  } catch (err) {
    console.error('Create expense category error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'اسم الفئة مستخدم مسبقاً' });
    }
    res.status(500).json({ success: false, message: 'خطأ في الإضافة' });
  }
}

/**
 * مسارات النسخ الاحتياطي
 */
async function listBackupPaths(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, backup_path, created_at FROM backup_paths ORDER BY id DESC'
    );
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        backup_path: r.backup_path,
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error('List backup paths error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب مسارات النسخ الاحتياطي' });
  }
}

async function createBackupPath(req, res) {
  const backupPath = (req.body && req.body.backup_path) ? String(req.body.backup_path).trim() : '';
  if (!backupPath) {
    return res.status(400).json({ success: false, message: 'مسار النسخ الاحتياطي مطلوب' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO backup_paths (backup_path) VALUES (?)',
      [backupPath]
    );
    const [rows] = await pool.execute(
      'SELECT id, backup_path, created_at FROM backup_paths WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({
      success: true,
      message: 'تم حفظ مسار النسخ الاحتياطي',
      data: rows[0] || { id: result.insertId, backup_path: backupPath, created_at: new Date() },
    });
  } catch (err) {
    console.error('Create backup path error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'هذا المسار محفوظ مسبقاً' });
    }
    res.status(500).json({ success: false, message: 'خطأ في حفظ مسار النسخ الاحتياطي' });
  }
}

async function deleteBackupPath(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id || id < 1) {
    return res.status(400).json({ success: false, message: 'معرف المسار غير صالح' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM backup_paths WHERE id = ?',
      [id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, message: 'المسار غير موجود' });
    }
    res.json({ success: true, message: 'تم حذف المسار' });
  } catch (err) {
    console.error('Delete backup path error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف المسار' });
  }
}

async function getBackupSettings(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT backup_time FROM backup_settings WHERE id = 1 LIMIT 1'
    );
    const backupTime = rows[0] ? normalizeTimeToHHMM(rows[0].backup_time) : DEFAULT_BACKUP_TIME;
    res.json({
      success: true,
      data: {
        backup_time: backupTime,
      },
    });
  } catch (err) {
    console.error('Get backup settings error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب إعدادات النسخ الاحتياطي' });
  }
}

async function updateBackupSettings(req, res) {
  const rawTime = req.body && req.body.backup_time ? String(req.body.backup_time).trim() : '';
  const backupTime = normalizeTimeToHHMM(rawTime || DEFAULT_BACKUP_TIME);
  const dbTime = `${backupTime}:00`;

  try {
    await pool.execute(
      `INSERT INTO backup_settings (id, backup_time)
       VALUES (1, ?)
       ON DUPLICATE KEY UPDATE backup_time = VALUES(backup_time), updated_at = NOW()`,
      [dbTime]
    );
    res.json({
      success: true,
      message: 'تم حفظ وقت النسخ الاحتياطي اليومي',
      data: { backup_time: backupTime },
    });
  } catch (err) {
    console.error('Update backup settings error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ وقت النسخ الاحتياطي' });
  }
}

async function runBackupNow(req, res) {
  try {
    const result = await runManualBackups();
    if (!result.successCount && !result.failCount) {
      return res.status(400).json({ success: false, message: result.message });
    }
    return res.json({
      success: result.failCount === 0,
      message: result.message,
      data: result,
    });
  } catch (err) {
    console.error('Run backup now error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في تنفيذ النسخ الاحتياطي الآن' });
  }
}

async function importDatabaseBackup(req, res) {
  const file = req.file || null;
  if (!file || !file.path) {
    return res.status(400).json({ success: false, message: 'ملف النسخة الاحتياطية مطلوب' });
  }

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = String(parseInt(process.env.DB_PORT, 10) || 3306);
  const dbUser = process.env.DB_USER || 'root';
  const dbPassword = process.env.DB_PASSWORD || '2202122';
  const dbName = process.env.DB_NAME || 'sb_pos';

  try {
    await new Promise((resolve, reject) => {
      const args = [
        '-h', dbHost,
        '-P', dbPort,
        '-u', dbUser,
        `-p${dbPassword}`,
        dbName,
      ];
      const child = spawn('mysql', args, { stdio: ['pipe', 'pipe', 'pipe'] });
      const input = fs.createReadStream(file.path);
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += String(chunk || '');
      });

      child.on('error', (err) => reject(err));
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr || `mysql exited with code ${code}`));
      });

      input.on('error', (err) => reject(err));
      input.pipe(child.stdin);
    });

    return res.json({
      success: true,
      message: 'تم استيراد البيانات إلى قاعدة البيانات بنجاح',
    });
  } catch (err) {
    console.error('Import database backup error:', err);
    return res.status(500).json({
      success: false,
      message: 'فشل استيراد النسخة. تأكد من صلاحية ملف SQL وتوفر mysql client.',
    });
  } finally {
    try {
      fs.unlinkSync(file.path);
    } catch (_) {
      // تجاهل خطأ حذف الملف المؤقت
    }
  }
}

/**
 * بيانات المنشأة (الاسم + شعار اختياري)
 * نتوقع وجود جدول company_profile يحتوي على:
 * id (PK), name VARCHAR, logo_path VARCHAR NULL, created_at, updated_at
 */
async function getCompanyProfile(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, logo_path FROM company_profile ORDER BY id ASC LIMIT 1'
    );
    if (!rows[0]) {
      return res.json({ success: true, data: null });
    }
    const row = rows[0];
    res.json({
      success: true,
      data: {
        name: row.name || '',
        logo_url: row.logo_path || null,
      },
    });
  } catch (err) {
    console.error('Get company profile error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب بيانات المنشأة' });
  }
}

async function updateCompanyProfile(req, res) {
  const name =
    req.body && req.body.company_name ? String(req.body.company_name).trim() : '';

  if (!name || name.length < 1) {
    return res
      .status(400)
      .json({ success: false, message: 'اسم المنشأة مطلوب' });
  }

  const file = req.file || null;
  let logoPath = null;

  if (file) {
    // المسار النسبي الذي سيُستخدم في الواجهة (يخدم من مجلد public)
    logoPath = '/uploads/company/' + file.filename;
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, logo_path FROM company_profile ORDER BY id ASC LIMIT 1'
    );

    if (rows[0]) {
      const id = rows[0].id;
      const fields = ['name = ?'];
      const params = [name];
      if (logoPath) {
        fields.push('logo_path = ?');
        params.push(logoPath);
      }
      params.push(id);
      await pool.execute(
        `UPDATE company_profile SET ${fields.join(
          ', '
        )}, updated_at = NOW() WHERE id = ?`,
        params
      );
    } else {
      await pool.execute(
        'INSERT INTO company_profile (name, logo_path, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
        [name, logoPath]
      );
    }

    res.json({
      success: true,
      message: 'تم حفظ بيانات المنشأة',
    });
  } catch (err) {
    console.error('Update company profile error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ بيانات المنشأة' });
  }
}

async function listPermissionRoles(req, res) {
  try {
    const looksBrokenEncoding = (value) => {
      const s = String(value || '');
      if (!s) return false;
      // أشهر حروف التشويه عند مشاكل الترميز العربية
      return /[Ï┘╣╚╔]/.test(s);
    };
    const [rows] = await pool.execute(
      `SELECT id, code, name, description, is_active, is_system, created_at
       FROM permission_roles
       ORDER BY is_system DESC, name ASC, id ASC`
    );
    res.json({
      success: true,
      data: (rows || []).map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        display_name: looksBrokenEncoding(r.name) ? (r.code || r.name) : r.name,
        description: r.description || '',
        is_active: Boolean(r.is_active),
        is_system: Boolean(r.is_system),
        created_at: r.created_at,
      })),
    });
  } catch (err) {
    console.error('List permission roles error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب أنواع الصلاحيات' });
  }
}

async function createPermissionRole(req, res) {
  const code = req.body && req.body.code ? String(req.body.code).trim().toLowerCase() : '';
  const name = req.body && req.body.name ? String(req.body.name).trim() : '';
  const description = req.body && req.body.description ? String(req.body.description).trim() : null;
  if (!/^[a-z0-9_]{2,100}$/.test(code)) {
    return res.status(400).json({ success: false, message: 'رمز نوع الصلاحية يجب أن يكون أحرف/أرقام/شرطة سفلية فقط' });
  }
  if (!name || name.length < 2) {
    return res.status(400).json({ success: false, message: 'اسم نوع الصلاحية مطلوب' });
  }
  try {
    const [ins] = await pool.execute(
      'INSERT INTO permission_roles (code, name, description, is_system, is_active) VALUES (?, ?, ?, 0, 1)',
      [code, name, description || null]
    );
    res.status(201).json({
      success: true,
      message: 'تم إنشاء نوع الصلاحية',
      data: { id: ins.insertId, code, name, description: description || '' },
    });
  } catch (err) {
    console.error('Create permission role error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'رمز نوع الصلاحية مستخدم مسبقاً' });
    }
    res.status(500).json({ success: false, message: 'خطأ في إنشاء نوع الصلاحية' });
  }
}

async function listPermissions(req, res) {
  const moduleKey = req.query && req.query.module_key ? String(req.query.module_key).trim() : '';
  try {
    let sql = 'SELECT id, module_key, action_key, title, description FROM permissions';
    const params = [];
    if (moduleKey) {
      sql += ' WHERE module_key = ?';
      params.push(moduleKey);
    }
    sql += ' ORDER BY module_key ASC, action_key ASC';
    const [rows] = await pool.execute(sql, params);
    res.json({
      success: true,
      data: (rows || []).map((r) => ({
        id: r.id,
        module_key: r.module_key,
        action_key: r.action_key,
        title: r.title,
        description: r.description || '',
      })),
    });
  } catch (err) {
    console.error('List permissions error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب الصلاحيات' });
  }
}

async function getRolePermissionsMatrix(req, res) {
  const roleId = req.query && req.query.role_id ? parseInt(req.query.role_id, 10) : NaN;
  if (!roleId) {
    return res.status(400).json({ success: false, message: 'معرف نوع الصلاحية مطلوب' });
  }
  try {
    const actionTitleMap = {
      'settings.users:view': 'عرض المستخدمين',
      'settings.users:create': 'إنشاء مستخدم',
      'settings.users:update': 'تعديل مستخدم',
      'settings.users:disable': 'تعطيل مستخدم',
      'warehouses.tabs.warehouses:view': 'فتح تاب المخازن',
      'warehouses.tabs.dispatch:view': 'فتح تاب إذن توريد',
      'warehouses.dispatch:create_supplier': 'إنشاء مورد (إذن توريد)',
      'warehouses.dispatch:search': 'بحث منتج (إذن توريد)',
      'warehouses.dispatch:add_product': 'إضافة صنف (إذن توريد)',
      'warehouses.products:minimum_stock': 'الحد الأدنى (قائمة المنتجات)',
      'warehouses.products:edit': 'تعديل منتج (قائمة المنتجات)',
      'warehouses.products:suppliers': 'الموردين (قائمة المنتجات)',
      'warehouses.products:delete': 'حذف منتج (قائمة المنتجات)',
      'warehouses.tabs.suppliers_list:view': 'فتح تاب قائمة الموردين',
      'warehouses.suppliers:statement': 'كشف حساب المورد',
      'warehouses.log:edit_amount': 'سجل الشراء/البيع: زر المبلغ',
      'warehouses.log:edit_invoice': 'سجل الشراء/البيع: زر التعديل',
      'warehouses.log:delete_invoice': 'سجل الشراء/البيع: زر الحذف',
      'pos.page:view': 'دخول صفحة نقطة البيع',
      'pos.tabs.sales_log:view': 'POS: عرض تبويب سجل المبيعات',
      'pos.tabs.returns:view': 'POS: عرض تبويب استرجاع/تعديل',
      'pos.tabs.credit_customers:view': 'POS: عرض تبويب ملف عملاء الأجل',
      'pos.sales_log:edit_quantity': 'POS: تعديل الكمية من التفاصيل',
      'expenses:create': 'المصروفات: إضافة مصروف',
      'expenses:update': 'المصروفات: تعديل مصروف',
      'expenses:delete': 'المصروفات: حذف مصروف',
      'credit_customers:details': 'ملف عملاء الأجل: التفاصيل',
      'credit_customers:settle': 'ملف عملاء الأجل: السداد',
      'shift_close.tabs.payment_summary:view': 'تقفيل الشفت: تبويب ملخص طرق الدفع',
      'shift_close.tabs.receive_amounts:view': 'تقفيل الشفت: تبويب استلام المبالغ',
      'shift_close.tabs.shift_log:view': 'تقفيل الشفت: تبويب سجل تقفيل الشفت',
      'reports.pos_profit:view': 'التقارير: تقرير المبيعات',
      'reports.warehouse_report:view': 'التقارير: تقرير الجرد',
      'settings.permissions:manage': 'الإعدادات: إدارة الصلاحيات',
    };
    const [rows] = await pool.execute(
      `SELECT
         p.id AS permission_id,
         p.module_key,
         p.action_key,
         p.title,
         COALESCE(rp.is_allowed, 0) AS is_allowed
       FROM permissions p
       LEFT JOIN role_permissions rp
         ON rp.permission_id = p.id AND rp.role_id = ?
       WHERE p.module_key = 'settings.users'
          OR p.module_key LIKE 'settings.system.%'
          OR p.module_key LIKE 'warehouses.%'
       ORDER BY p.module_key, p.action_key`,
      [roleId]
    );
    res.json({
      success: true,
      data: (rows || []).map((r) => ({
        permission_id: r.permission_id,
        module_key: r.module_key,
        action_key: r.action_key,
        title: actionTitleMap[r.module_key + ':' + r.action_key] || r.title || r.action_key,
        is_allowed: Boolean(r.is_allowed),
      })),
    });
  } catch (err) {
    console.error('Get role permissions matrix error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب مصفوفة الصلاحيات' });
  }
}

async function getSystemTabsAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }

  const tabs = [
    { key: 'payment_methods', module_key: 'settings.system.payment_methods', action_key: 'view' },
    { key: 'discounts', module_key: 'settings.system.discounts', action_key: 'view' },
    { key: 'user_warehouses', module_key: 'settings.system.user_warehouses', action_key: 'view' },
    { key: 'expense_categories', module_key: 'settings.system.expense_categories', action_key: 'view' },
    { key: 'company_profile', module_key: 'settings.system.company_profile', action_key: 'view' },
    { key: 'backup', module_key: 'settings.system.backup', action_key: 'view' },
  ];

  if (username === 'admin') {
    const all = {};
    tabs.forEach((t) => { all[t.key] = true; });
    return res.json({ success: true, data: all });
  }

  try {
    const data = {};
    for (let i = 0; i < tabs.length; i += 1) {
      const t = tabs[i];
      // eslint-disable-next-line no-await-in-loop
      const [rows] = await pool.execute(
        `
        SELECT EXISTS(
          SELECT 1
          FROM permissions p
          LEFT JOIN user_permission_overrides upo
            ON upo.permission_id = p.id
           AND upo.user_id = ?
          LEFT JOIN user_roles ur
            ON ur.user_id = ?
          LEFT JOIN role_permissions rp
            ON rp.role_id = ur.role_id
           AND rp.permission_id = p.id
          WHERE p.module_key = ?
            AND p.action_key = ?
            AND COALESCE(upo.is_allowed, rp.is_allowed, 0) = 1
          LIMIT 1
        ) AS allowed
        `,
        [userId, userId, t.module_key, t.action_key]
      );
      data[t.key] = !!(rows && rows[0] && Number(rows[0].allowed) === 1);
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get system tabs access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات التبويبات' });
  }
}

async function setRolePermission(req, res) {
  const roleId = req.body && req.body.role_id ? parseInt(req.body.role_id, 10) : NaN;
  const permissionId = req.body && req.body.permission_id ? parseInt(req.body.permission_id, 10) : NaN;
  const isAllowed = !!(req.body && (req.body.is_allowed === true || req.body.is_allowed === 1 || req.body.is_allowed === '1'));
  if (!roleId || !permissionId) {
    return res.status(400).json({ success: false, message: 'بيانات الصلاحية غير صالحة' });
  }
  try {
    await pool.execute(
      `INSERT INTO role_permissions (role_id, permission_id, is_allowed)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE is_allowed = VALUES(is_allowed), updated_at = NOW()`,
      [roleId, permissionId, isAllowed ? 1 : 0]
    );
    res.json({ success: true, message: 'تم تحديث الصلاحية' });
  } catch (err) {
    console.error('Set role permission error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الصلاحية' });
  }
}

async function listUsersWithRoles(req, res) {
  try {
    const looksBrokenEncoding = (value) => {
      const s = String(value || '');
      if (!s) return false;
      return /[Ï┘╣╚╔]/.test(s);
    };
    const [rows] = await pool.execute(
      `SELECT
         u.id AS user_id,
         u.username,
         u.full_name,
         u.is_active,
         pr.id AS role_id,
         pr.code AS role_code,
         pr.name AS role_name
       FROM users u
       LEFT JOIN user_roles ur ON ur.user_id = u.id
       LEFT JOIN permission_roles pr ON pr.id = ur.role_id
       ORDER BY u.is_active DESC, COALESCE(u.full_name, u.username) ASC`
    );
    const mapped = (rows || []).map((r) => ({
      user_id: r.user_id,
      username: r.username,
      full_name: r.full_name || '',
      is_active: Boolean(r.is_active),
      role_id: r.role_id || null,
      role_code: r.role_code || null,
      role_name: r.role_name || null,
      role_display_name: looksBrokenEncoding(r.role_name) ? (r.role_code || r.role_name || null) : (r.role_name || null),
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    console.error('List users with roles error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب ربط المستخدمين بالصلاحيات' });
  }
}

async function assignUserRole(req, res) {
  const userId = req.body && req.body.user_id ? parseInt(req.body.user_id, 10) : NaN;
  const roleId = req.body && req.body.role_id ? parseInt(req.body.role_id, 10) : NaN;
  if (!userId || !roleId) {
    return res.status(400).json({ success: false, message: 'بيانات الربط غير صالحة' });
  }
  try {
    const [uRows] = await pool.execute('SELECT id, username FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!uRows.length) {
      return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
    }
    if (String(uRows[0].username || '').toLowerCase() === 'admin') {
      return res.status(400).json({ success: false, message: 'حساب admin لديه صلاحيات كاملة ولا يحتاج ربط دور' });
    }
    await pool.execute('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    await pool.execute('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
    res.json({ success: true, message: 'تم ربط نوع الصلاحية بالمستخدم' });
  } catch (err) {
    console.error('Assign user role error:', err);
    res.status(500).json({ success: false, message: 'خطأ في ربط المستخدم بالصلاحية' });
  }
}

module.exports = {
  getSettingsPage,
  getUsersPage,
  getSystemPage,
  getSettingsHomeAccess,
  getDiscountConfig,
  setGlobalDiscount,
  setUserDiscount,
  listUsers,
  createUser,
  updateUser,
  softDeleteUser,
  listPaymentMethods,
  createPaymentMethod,
  setDefaultPaymentMethodForPos,
  getUserWarehousesConfig,
  addUserWarehouse,
  removeUserWarehouse,
  listExpenseCategories,
  createExpenseCategory,
  listBackupPaths,
  createBackupPath,
  deleteBackupPath,
  getBackupSettings,
  updateBackupSettings,
  runBackupNow,
  importDatabaseBackup,
  getCompanyProfile,
  updateCompanyProfile,
  listPermissionRoles,
  createPermissionRole,
  listPermissions,
  getRolePermissionsMatrix,
  setRolePermission,
  listUsersWithRoles,
  assignUserRole,
  getSystemTabsAccess,
};

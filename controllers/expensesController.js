/**
 * المصروفات - إضافة وسرد المصروفات
 */

const { pool } = require('../config/db');

/**
 * قائمة المصروفات (مع فلتر تاريخ اختياري)
 */
async function listExpenses(req, res) {
  try {
    const fromDate = req.query.from;
    const toDate = req.query.to;
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

    let sql = `
      SELECT e.id, e.amount, e.direction, e.note, e.expense_date, e.created_at, e.warehouse_id,
             ec.name AS category_name,
             pm.name AS payment_method_name,
             w.name AS warehouse_name,
             COALESCE(u.full_name, u.username, '—') AS user_name
      FROM expenses e
      JOIN expense_categories ec ON ec.id = e.expense_category_id
      LEFT JOIN payment_methods pm ON pm.id = e.payment_method_id
      LEFT JOIN warehouses w ON w.id = e.warehouse_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE 1=1
    `;
    const params = [];

    if (fromDate) {
      sql += ' AND e.expense_date >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      sql += ' AND e.expense_date <= ?';
      params.push(toDate);
    }

    const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
    sql += ' ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ' + safeLimit;

    const [rows] = await pool.execute(sql, params);
    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        amount: Number(r.amount),
        direction: r.direction === 'in' ? 'in' : 'out',
        direction_label: r.direction === 'in' ? 'وارد' : 'خارج',
        note: r.note || null,
        expense_date: r.expense_date,
        created_at: r.created_at,
        category_name: r.category_name || '—',
        payment_method_name: r.payment_method_name || '—',
        warehouse_name: r.warehouse_name || '—',
        user_name: r.user_name || '—',
      })),
    });
  } catch (err) {
    console.error('List expenses error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب المصروفات' });
  }
}

/**
 * جلب مصروف واحد (للتعديل)
 */
async function getExpenseById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المصروف مطلوب' });
  }
  try {
    const [rows] = await pool.execute(
      `SELECT e.id, e.amount, e.direction, e.note, e.expense_date, e.warehouse_id, e.expense_category_id, e.payment_method_id
       FROM expenses e WHERE e.id = ?`,
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'المصروف غير موجود' });
    }
    const r = rows[0];
    res.json({
      success: true,
      data: {
        id: r.id,
        amount: Number(r.amount),
        direction: r.direction === 'in' ? 'in' : 'out',
        note: r.note || null,
        expense_date: r.expense_date || null,
        warehouse_id: r.warehouse_id,
        expense_category_id: r.expense_category_id,
        payment_method_id: r.payment_method_id || null,
      },
    });
  } catch (err) {
    console.error('Get expense error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب المصروف' });
  }
}

/**
 * تعديل مصروف
 */
async function updateExpense(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المصروف مطلوب' });
  }
  const expenseCategoryId = req.body && req.body.expense_category_id != null
    ? parseInt(req.body.expense_category_id, 10) : NaN;
  const paymentMethodId = req.body && req.body.payment_method_id !== undefined && req.body.payment_method_id !== ''
    ? parseInt(req.body.payment_method_id, 10) : null;
  const amount = req.body && req.body.amount != null ? parseFloat(req.body.amount) : NaN;
  const note = req.body && req.body.note != null ? String(req.body.note).trim().slice(0, 1000) : null;
  const expenseDate = req.body && req.body.expense_date ? String(req.body.expense_date).trim() : null;
  const direction = (req.body && req.body.direction === 'in') ? 'in' : 'out';
  const warehouseId = req.body && req.body.warehouse_id != null ? parseInt(req.body.warehouse_id, 10) : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!expenseCategoryId) {
    return res.status(400).json({ success: false, message: 'فئة المصروف مطلوبة' });
  }
  if (amount === undefined || amount === null || Number.isNaN(amount) || amount < 0) {
    return res.status(400).json({ success: false, message: 'المبلغ مطلوب ويجب أن يكون عدداً موجباً' });
  }
  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'اختر المخزن' });
  }

  const dateToUse = expenseDate || new Date().toISOString().slice(0, 10);

  try {
    const [existing] = await pool.execute('SELECT id FROM expenses WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'المصروف غير موجود' });
    }
    const [userWarehouses] = await pool.execute(
      'SELECT warehouse_id FROM user_warehouses WHERE user_id = ?',
      [userId]
    );
    const [allWh] = await pool.execute('SELECT id FROM warehouses');
    const allowedIds = userWarehouses.length > 0
      ? userWarehouses.map((r) => r.warehouse_id)
      : (allWh || []).map((r) => r.id);
    if (!allowedIds.includes(warehouseId)) {
      return res.status(403).json({ success: false, message: 'المخزن المختار غير مسموح لك' });
    }

    await pool.execute(
      `UPDATE expenses SET expense_category_id = ?, payment_method_id = ?, amount = ?, direction = ?, note = ?, warehouse_id = ?, expense_date = ?
       WHERE id = ?`,
      [expenseCategoryId, paymentMethodId, amount, direction, note, warehouseId, dateToUse, id]
    );
    res.json({
      success: true,
      message: 'تم تحديث المصروف',
      data: { id, amount, expense_date: dateToUse },
    });
  } catch (err) {
    console.error('Update expense error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تحديث المصروف' });
  }
}

/**
 * حذف مصروف
 */
async function deleteExpense(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المصروف مطلوب' });
  }
  try {
    const [existing] = await pool.execute('SELECT id FROM expenses WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ success: false, message: 'المصروف غير موجود' });
    }
    await pool.execute('DELETE FROM expenses WHERE id = ?', [id]);
    res.json({ success: true, message: 'تم حذف المصروف' });
  } catch (err) {
    console.error('Delete expense error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف المصروف' });
  }
}

/**
 * إضافة مصروف جديد
 */
async function createExpense(req, res) {
  const expenseCategoryId = req.body && req.body.expense_category_id != null
    ? parseInt(req.body.expense_category_id, 10) : NaN;
  const paymentMethodId = req.body && req.body.payment_method_id !== undefined && req.body.payment_method_id !== ''
    ? parseInt(req.body.payment_method_id, 10) : null;
  const amount = req.body && req.body.amount != null ? parseFloat(req.body.amount) : NaN;
  const note = req.body && req.body.note ? String(req.body.note).trim().slice(0, 1000) : null;
  const expenseDate = req.body && req.body.expense_date ? String(req.body.expense_date).trim() : null;
  const direction = (req.body && req.body.direction === 'in') ? 'in' : 'out';
  const warehouseId = req.body && req.body.warehouse_id != null ? parseInt(req.body.warehouse_id, 10) : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!expenseCategoryId) {
    return res.status(400).json({ success: false, message: 'فئة المصروف مطلوبة' });
  }
  if (amount === undefined || amount === null || Number.isNaN(amount) || amount < 0) {
    return res.status(400).json({ success: false, message: 'المبلغ مطلوب ويجب أن يكون عدداً موجباً' });
  }
  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'اختر المخزن' });
  }

  const dateToUse = expenseDate || new Date().toISOString().slice(0, 10);

  try {
    const [userWarehouses] = await pool.execute(
      'SELECT warehouse_id FROM user_warehouses WHERE user_id = ?',
      [userId]
    );
    const [allWh] = await pool.execute('SELECT id FROM warehouses');
    const allowedIds = userWarehouses.length > 0
      ? userWarehouses.map((r) => r.warehouse_id)
      : (allWh || []).map((r) => r.id);
    if (!allowedIds.includes(warehouseId)) {
      return res.status(403).json({ success: false, message: 'المخزن المختار غير مسموح لك' });
    }

    const [result] = await pool.execute(
      `INSERT INTO expenses (expense_category_id, payment_method_id, amount, direction, note, user_id, warehouse_id, expense_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [expenseCategoryId, paymentMethodId, amount, direction, note, userId, warehouseId, dateToUse]
    );
    res.status(201).json({
      success: true,
      message: 'تم تسجيل المصروف',
      data: { id: result.insertId, amount, expense_date: dateToUse },
    });
  } catch (err) {
    console.error('Create expense error:', err);
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ success: false, message: 'فئة المصروف أو طريقة الدفع غير موجودة' });
    }
    res.status(500).json({ success: false, message: 'خطأ في حفظ المصروف' });
  }
}

async function getExpensesAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }

  const checks = [
    { key: 'create', module_key: 'expenses', action_key: 'create' },
    { key: 'update', module_key: 'expenses', action_key: 'update' },
    { key: 'delete', module_key: 'expenses', action_key: 'delete' },
  ];

  if (username === 'admin') {
    return res.json({ success: true, data: { create: true, update: true, delete: true } });
  }

  try {
    const data = {};
    for (let i = 0; i < checks.length; i += 1) {
      const c = checks[i];
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
        [userId, userId, c.module_key, c.action_key]
      );
      data[c.key] = !!(rows && rows[0] && Number(rows[0].allowed) === 1);
    }
    return res.json({ success: true, data });
  } catch (err) {
    console.error('Get expenses access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات المصروفات' });
  }
}

module.exports = {
  listExpenses,
  createExpense,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getExpensesAccess,
};

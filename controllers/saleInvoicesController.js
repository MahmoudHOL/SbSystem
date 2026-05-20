/**
 * فواتير البيع - لا نبيع منتج بكمية 0، نخصم من المخزن، منطق المدفوع عكس المورد
 */

const { pool } = require('../config/db');
const { getCanonicalSalePrice } = require('../utils/getCanonicalSalePrice');

async function ensurePosShiftClosuresTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS pos_shift_closures (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      payment_method_id INT UNSIGNED NULL,
      employee_user_id INT UNSIGNED NOT NULL,
      closed_by_user_id INT UNSIGNED NOT NULL,
      required_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      received_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      remaining_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
      note VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      KEY idx_psc_payment_method (payment_method_id),
      KEY idx_psc_employee_user (employee_user_id),
      KEY idx_psc_closed_by (closed_by_user_id),
      CONSTRAINT fk_psc_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
      CONSTRAINT fk_psc_employee_user FOREIGN KEY (employee_user_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT fk_psc_closed_by FOREIGN KEY (closed_by_user_id) REFERENCES users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

// ملخص تقفيل شفت نقطة البيع (حسب المستخدم الحالي)
async function getPosShiftSummary(req, res) {
  const userId = req.session && req.session.userId ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }

  try {
    await ensurePosShiftClosuresTable();

    // إجمالي فواتير نقطة البيع حسب طريقة الدفع
    const [invoiceAggRows] = await pool.execute(
      `
      SELECT
        pm.id AS payment_method_id,
        COALESCE(pm.name, 'بدون تحديد') AS payment_method_name,
        COUNT(*) AS invoices_count,
        SUM(si.total_amount) AS total_amount
      FROM sale_invoices si
      LEFT JOIN payment_methods pm ON pm.id = si.payment_method_id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        AND si.user_id = ?
      GROUP BY pm.id, pm.name
      ORDER BY payment_method_name
      `,
      [userId]
    );

    // إجمالي ما تم استلامه (تقفيله) حسب طريقة الدفع
    const [closureAggRows] = await pool.execute(
      `
      SELECT
        payment_method_id,
        SUM(received_amount) AS received_total
      FROM pos_shift_closures
      WHERE closed_by_user_id = ?
      GROUP BY payment_method_id
      `,
      [userId]
    );

    const closureMap = new Map();
    (closureAggRows || []).forEach((r) => {
      const key = r.payment_method_id == null ? 'null' : String(r.payment_method_id);
      closureMap.set(key, Number(r.received_total || 0));
    });

    let grandTotalAmount = 0;
    const payments = (invoiceAggRows || []).map((r) => {
      const key = r.payment_method_id == null ? 'null' : String(r.payment_method_id);
      const invoiceTotal = Number(r.total_amount || 0);
      const received = Number(closureMap.get(key) || 0);
      const remaining = Math.max(0, invoiceTotal - received);
      grandTotalAmount += remaining;
      return {
        payment_method_id: r.payment_method_id,
        payment_method_name: r.payment_method_name || 'بدون تحديد',
        invoices_count: Number(r.invoices_count || 0),
        total_amount: remaining,
      };
    });

    res.json({
      success: true,
      data: {
        payments,
        totals: {
          total_amount: grandTotalAmount,
        },
      },
    });
  } catch (err) {
    console.error('getPosShiftSummary error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب ملخص الشفت' });
  }
}

// قائمة الموظفين النشطين مع نسبة كل موظف (إن وجدت) لاستخدامها في استلام المبالغ
async function listShiftEmployees(req, res) {
  try {
    const [globalRows] = await pool.execute(
      'SELECT rate_percent FROM discount_rates WHERE is_global = 1 ORDER BY id DESC LIMIT 1'
    );
    const globalRate = globalRows[0] ? Number(globalRows[0].rate_percent || 0) : 0;

    const [rows] = await pool.execute(
      `SELECT u.id, u.username, u.full_name, dr.rate_percent
       FROM users u
       LEFT JOIN discount_rates dr ON dr.user_id = u.id AND dr.is_global = 0
       WHERE u.is_active = 1
       ORDER BY COALESCE(u.full_name, u.username)`
    );

    res.json({
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        username: r.username,
        full_name: r.full_name || null,
        rate_percent: r.rate_percent != null ? Number(r.rate_percent) : globalRate,
      })),
    });
  } catch (err) {
    console.error('listShiftEmployees error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب الموظفين' });
  }
}

async function createPosShiftClosure(req, res) {
  const closedByUserId = req.session && req.session.userId ? req.session.userId : null;
  if (!closedByUserId) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }

  const employeeUserId = req.body && req.body.employee_user_id ? parseInt(req.body.employee_user_id, 10) : NaN;
  const paymentMethodIdRaw = req.body ? req.body.payment_method_id : null;
  const paymentMethodId = paymentMethodIdRaw === null || paymentMethodIdRaw === '' ? null : parseInt(paymentMethodIdRaw, 10);
  const receivedAmount = req.body && req.body.received_amount != null ? Number(req.body.received_amount) : NaN;
  const note = req.body && req.body.note ? String(req.body.note).trim().slice(0, 255) : null;

  if (!employeeUserId || Number.isNaN(employeeUserId)) {
    return res.status(400).json({ success: false, message: 'اختر الموظف' });
  }
  if (Number.isNaN(receivedAmount) || receivedAmount <= 0) {
    return res.status(400).json({ success: false, message: 'المبلغ المستلم غير صالح' });
  }
  if (paymentMethodId !== null && (Number.isNaN(paymentMethodId) || paymentMethodId <= 0)) {
    return res.status(400).json({ success: false, message: 'طريقة الدفع غير صالحة' });
  }

  try {
    await ensurePosShiftClosuresTable();

    const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND is_active = 1 LIMIT 1', [employeeUserId]);
    if (!userRows.length) {
      return res.status(404).json({ success: false, message: 'الموظف غير موجود أو غير نشط' });
    }
    if (paymentMethodId !== null) {
      const [pmRows] = await pool.execute('SELECT id FROM payment_methods WHERE id = ? LIMIT 1', [paymentMethodId]);
      if (!pmRows.length) {
        return res.status(404).json({ success: false, message: 'طريقة الدفع غير موجودة' });
      }
    }

    // حساب المطلوب الحالي (المتبقي) لنفس طريقة الدفع بعد خصم السجلات السابقة
    const [invRows] = await pool.execute(
      `
      SELECT COALESCE(SUM(si.total_amount), 0) AS invoice_total
      FROM sale_invoices si
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        AND si.user_id = ?
        AND (
          (? IS NULL AND si.payment_method_id IS NULL)
          OR si.payment_method_id = ?
        )
      `,
      [closedByUserId, paymentMethodId, paymentMethodId]
    );
    const invoiceTotal = Number(invRows[0] && invRows[0].invoice_total ? invRows[0].invoice_total : 0);

    const [clRows] = await pool.execute(
      `
      SELECT COALESCE(SUM(received_amount), 0) AS received_total
      FROM pos_shift_closures
      WHERE closed_by_user_id = ?
        AND (
          (? IS NULL AND payment_method_id IS NULL)
          OR payment_method_id = ?
        )
      `,
      [closedByUserId, paymentMethodId, paymentMethodId]
    );
    const alreadyReceived = Number(clRows[0] && clRows[0].received_total ? clRows[0].received_total : 0);
    const requiredAmount = Math.max(0, invoiceTotal - alreadyReceived);

    if (receivedAmount > requiredAmount) {
      return res.status(400).json({ success: false, message: 'المبلغ المستلم أكبر من المطلوب الحالي' });
    }

    const remainingAmount = Math.max(0, requiredAmount - receivedAmount);
    const [ins] = await pool.execute(
      `
      INSERT INTO pos_shift_closures
        (payment_method_id, employee_user_id, closed_by_user_id, required_amount, received_amount, remaining_amount, note)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [paymentMethodId, employeeUserId, closedByUserId, requiredAmount, receivedAmount, remainingAmount, note]
    );

    res.status(201).json({
      success: true,
      message: 'تم حفظ عملية تقفيل الشفت',
      data: {
        id: ins.insertId,
        required_amount: requiredAmount,
        received_amount: receivedAmount,
        remaining_amount: remainingAmount,
      },
    });
  } catch (err) {
    console.error('createPosShiftClosure error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ عملية التقفيل' });
  }
}

async function listPosShiftClosures(req, res) {
  const userId = req.session && req.session.userId ? req.session.userId : null;
  if (!userId) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }
  try {
    await ensurePosShiftClosuresTable();
    const [rows] = await pool.execute(
      `
      SELECT
        psc.id,
        psc.payment_method_id,
        COALESCE(pm.name, 'بدون تحديد') AS payment_method_name,
        psc.employee_user_id,
        COALESCE(u.full_name, u.username, '—') AS employee_name,
        psc.closed_by_user_id,
        COALESCE(uc.full_name, uc.username, '—') AS closed_by_name,
        psc.required_amount,
        psc.received_amount,
        psc.remaining_amount,
        psc.created_at
      FROM pos_shift_closures psc
      LEFT JOIN payment_methods pm ON pm.id = psc.payment_method_id
      LEFT JOIN users u ON u.id = psc.employee_user_id
      LEFT JOIN users uc ON uc.id = psc.closed_by_user_id
      WHERE psc.closed_by_user_id = ?
      ORDER BY psc.created_at DESC
      LIMIT 500
      `,
      [userId]
    );
    const pad2 = (n) => String(n).padStart(2, '0');
    const formatCreatedAtForClient = (raw) => {
      if (raw == null) return null;
      if (raw instanceof Date) {
        return `${raw.getFullYear()}-${pad2(raw.getMonth() + 1)}-${pad2(raw.getDate())}T${pad2(raw.getHours())}:${pad2(raw.getMinutes())}:${pad2(raw.getSeconds())}`;
      }
      const s = String(raw);
      return s.includes('T') ? s : s.replace(' ', 'T');
    };

    res.json({
      success: true,
      data: (rows || []).map((r) => ({
          id: r.id,
          payment_method_id: r.payment_method_id,
          payment_method_name: r.payment_method_name || 'بدون تحديد',
          employee_user_id: r.employee_user_id,
          employee_name: r.employee_name || '—',
          closed_by_user_id: r.closed_by_user_id,
          closed_by_name: r.closed_by_name || '—',
          required_amount: Number(r.required_amount || 0),
          received_amount: Number(r.received_amount || 0),
          remaining_amount: Number(r.remaining_amount || 0),
          created_at: formatCreatedAtForClient(r.created_at),
        })),
    });
  } catch (err) {
    console.error('listPosShiftClosures error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب سجل التقفيل' });
  }
}

// تقرير أرباح نقطة البيع: إجمالي + حسب طريقة الدفع (على مستوى كل المستخدمين)
async function getPosProfitReport(req, res) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ success: false, message: 'غير مسجل الدخول' });
  }
  try {
    const allFlag = req.query && (req.query.all === '1' || req.query.all === 'true');
    const fromDateRaw = req.query && req.query.from_date ? String(req.query.from_date).trim().slice(0, 10) : '';
    const toDateRaw = req.query && req.query.to_date ? String(req.query.to_date).trim().slice(0, 10) : '';
    const hasFromDate = /^\d{4}-\d{2}-\d{2}$/.test(fromDateRaw);
    const hasToDate = /^\d{4}-\d{2}-\d{2}$/.test(toDateRaw);

    let dateCondition = '';
    const dateParams = [];
    let expenseDateCondition = '';
    const expenseDateParams = [];
    if (!allFlag) {
      if (hasFromDate && hasToDate) {
        dateCondition = ' AND DATE(si.created_at) BETWEEN ? AND ?';
        dateParams.push(fromDateRaw, toDateRaw);
        expenseDateCondition = ' AND e.expense_date BETWEEN ? AND ?';
        expenseDateParams.push(fromDateRaw, toDateRaw);
      } else if (hasFromDate) {
        dateCondition = ' AND DATE(si.created_at) >= ?';
        dateParams.push(fromDateRaw);
        expenseDateCondition = ' AND e.expense_date >= ?';
        expenseDateParams.push(fromDateRaw);
      } else if (hasToDate) {
        dateCondition = ' AND DATE(si.created_at) <= ?';
        dateParams.push(toDateRaw);
        expenseDateCondition = ' AND e.expense_date <= ?';
        expenseDateParams.push(toDateRaw);
      }
    }

    // إجمالي قبل أي خصم = مجموع (كمية × سعر قبل خصم البند) من البنود؛ الخصم = ذلك الناتج − total_amount (يشمل خصم البنود وخصم الفاتورة)
    const [totalsRows] = await pool.execute(
      `
      SELECT
        COALESCE(SUM(COALESCE(item_g.items_gross, COALESCE(si.total_before_discount, si.total_amount))), 0) AS gross_sales_before_discount,
        COALESCE(SUM(si.total_amount), 0) AS net_sales_after_discount,
        COALESCE(SUM(COALESCE(item_g.items_gross, COALESCE(si.total_before_discount, si.total_amount)) - si.total_amount), 0) AS discounts_total
      FROM sale_invoices si
      LEFT JOIN (
        SELECT sale_invoice_id,
               SUM(sii.quantity * COALESCE(sii.unit_price_before_discount, sii.unit_sale_price)) AS items_gross
        FROM sale_invoice_items sii
        GROUP BY sale_invoice_id
      ) item_g ON item_g.sale_invoice_id = si.id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      `,
      dateParams
    );

    // إجمالي الربح التقريبي: صافي سعر البيع الفعلي (بعد خصم البند) − شراء
    const [profitRows] = await pool.execute(
      `
      SELECT
        COALESCE(SUM(
          (COALESCE(sii.unit_sale_price, 0) - COALESCE(pp.purchase_price, 0)) * sii.quantity
        ), 0) AS total_profit
      FROM sale_invoice_items sii
      JOIN sale_invoices si ON si.id = sii.sale_invoice_id
      LEFT JOIN (
        SELECT p1.product_id, p1.purchase_price
        FROM product_prices p1
        INNER JOIN (
          SELECT product_id, MAX(id) AS max_id
          FROM product_prices
          WHERE deleted_at IS NULL
          GROUP BY product_id
        ) p2 ON p2.max_id = p1.id
      ) pp ON pp.product_id = sii.product_id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      `,
      dateParams
    );

    const [paymentRows] = await pool.execute(
      `
      SELECT
        pm.id AS payment_method_id,
        COALESCE(pm.name, 'بدون تحديد') AS payment_method_name,
        COUNT(DISTINCT si.id) AS invoices_count,
        COALESCE(SUM(COALESCE(item_g.items_gross, COALESCE(si.total_before_discount, si.total_amount))), 0) AS gross_sales_before_discount,
        COALESCE(SUM(si.total_amount), 0) AS net_sales_after_discount,
        COALESCE(SUM(COALESCE(item_g.items_gross, COALESCE(si.total_before_discount, si.total_amount)) - si.total_amount), 0) AS discounts_total
      FROM sale_invoices si
      LEFT JOIN (
        SELECT sale_invoice_id,
               SUM(sii.quantity * COALESCE(sii.unit_price_before_discount, sii.unit_sale_price)) AS items_gross
        FROM sale_invoice_items sii
        GROUP BY sale_invoice_id
      ) item_g ON item_g.sale_invoice_id = si.id
      LEFT JOIN payment_methods pm ON pm.id = si.payment_method_id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      GROUP BY pm.id, pm.name
      ORDER BY payment_method_name
      `,
      dateParams
    );

    const [paymentProfitRows] = await pool.execute(
      `
      SELECT
        si.payment_method_id,
        COALESCE(SUM(
          (COALESCE(sii.unit_sale_price, 0) - COALESCE(pp.purchase_price, 0)) * sii.quantity
        ), 0) AS profit
      FROM sale_invoice_items sii
      JOIN sale_invoices si ON si.id = sii.sale_invoice_id
      LEFT JOIN (
        SELECT p1.product_id, p1.purchase_price
        FROM product_prices p1
        INNER JOIN (
          SELECT product_id, MAX(id) AS max_id
          FROM product_prices
          WHERE deleted_at IS NULL
          GROUP BY product_id
        ) p2 ON p2.max_id = p1.id
      ) pp ON pp.product_id = sii.product_id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      GROUP BY si.payment_method_id
      `,
      dateParams
    );

    const [expensesRows] = await pool.execute(
      `
      SELECT
        e.id,
        e.expense_date,
        e.created_at,
        e.amount,
        e.direction,
        COALESCE(ec.name, '—') AS category_name,
        COALESCE(pm.name, '—') AS payment_method_name,
        COALESCE(u.full_name, u.username, '—') AS user_name,
        COALESCE(e.note, '') AS note
      FROM expenses e
      LEFT JOIN expense_categories ec ON ec.id = e.expense_category_id
      LEFT JOIN payment_methods pm ON pm.id = e.payment_method_id
      LEFT JOIN users u ON u.id = e.user_id
      WHERE 1=1
      ${expenseDateCondition}
      ORDER BY e.expense_date DESC, e.created_at DESC, e.id DESC
      LIMIT 2000
      `,
      expenseDateParams
    );

    const [creditCustomersRows] = await pool.execute(
      `
      SELECT
        COALESCE(SUM(cci.invoice_total_amount - cci.amount_paid - cci.amount_settled), 0) AS customers_credit_remaining
      FROM credit_customer_invoices cci
      JOIN sale_invoices si ON si.id = cci.sale_invoice_id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      `,
      dateParams
    );

    const [supplierBalanceRows] = await pool.execute(
      `
      SELECT COALESCE(SUM(net), 0) AS suppliers_balance
      FROM (
        SELECT (COALESCE(pi.total_amount, 0) - COALESCE(pi.amount_paid, 0)) AS net
        FROM purchase_invoices pi
        WHERE pi.supplier_id IS NOT NULL
          AND pi.deleted_at IS NULL
          ${dateCondition.replace(/si\./g, 'pi.')}

        UNION ALL

        SELECT (COALESCE(si2.amount_paid, 0) - COALESCE(si2.total_amount, 0)) AS net
        FROM sale_invoices si2
        WHERE si2.supplier_id IS NOT NULL
          AND si2.deleted_at IS NULL
          ${dateCondition.replace(/si\./g, 'si2.')}

        UNION ALL

        SELECT CASE
          WHEN sp.direction = 'to_supplier' THEN -COALESCE(sp.amount, 0)
          WHEN sp.direction = 'from_supplier' THEN COALESCE(sp.amount, 0)
          ELSE 0
        END AS net
        FROM supplier_payments sp
        WHERE 1 = 1
          ${expenseDateCondition.replace(/e\./g, 'sp.')}
      ) t
      `
      ,
      dateParams.concat(dateParams).concat(expenseDateParams)
    );

    const [invoiceRows] = await pool.execute(
      `
      SELECT
        si.id AS invoice_id,
        si.created_at,
        COALESCE(si.customer_name, '—') AS customer_name,
        COALESCE(pm.name, 'بدون تحديد') AS payment_method_name,
        COALESCE(item_g.items_gross, COALESCE(si.total_before_discount, si.total_amount)) AS gross_total,
        COALESCE(si.total_amount, 0) AS net_total,
        COALESCE(
          COALESCE(item_g.items_gross, COALESCE(si.total_before_discount, si.total_amount)) - si.total_amount,
          0
        ) AS discount_total,
        COALESCE(sie.edit_count, 0) AS edit_count
      FROM sale_invoices si
      LEFT JOIN (
        SELECT sale_invoice_id,
               SUM(sii.quantity * COALESCE(sii.unit_price_before_discount, sii.unit_sale_price)) AS items_gross
        FROM sale_invoice_items sii
        GROUP BY sale_invoice_id
      ) item_g ON item_g.sale_invoice_id = si.id
      LEFT JOIN payment_methods pm ON pm.id = si.payment_method_id
      LEFT JOIN (
        SELECT sale_invoice_id, COUNT(*) AS edit_count
        FROM sale_invoice_edit_log
        GROUP BY sale_invoice_id
      ) sie ON sie.sale_invoice_id = si.id
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      ORDER BY si.created_at DESC, si.id DESC
      LIMIT 2000
      `,
      dateParams
    );

    const profitByMethod = new Map();
    (paymentProfitRows || []).forEach((r) => {
      const key = r.payment_method_id == null ? 'null' : String(r.payment_method_id);
      profitByMethod.set(key, Number(r.profit || 0));
    });

    const [productSoldRows] = await pool.execute(
      `
      SELECT
        sii.product_id,
        COALESCE(MAX(p.name), CONCAT('منتج #', sii.product_id)) AS product_name,
        COALESCE(SUM(sii.quantity), 0) AS quantity_sold,
        COALESCE(SUM(sii.line_total), 0) AS amount_total
      FROM sale_invoice_items sii
      INNER JOIN sale_invoices si ON si.id = sii.sale_invoice_id
      LEFT JOIN products p ON p.id = sii.product_id AND p.deleted_at IS NULL
      WHERE si.is_pos = 1
        AND si.deleted_at IS NULL
        ${dateCondition}
      GROUP BY sii.product_id
      HAVING SUM(sii.quantity) > 0
      ORDER BY SUM(sii.line_total) DESC, MAX(p.name) ASC
      `,
      dateParams
    );

    const productsSold = (productSoldRows || []).map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name || '—',
      quantity_sold: Number(r.quantity_sold || 0),
      amount_total: Number(r.amount_total || 0),
    }));

    const productsSummary = {
      distinct_products: productsSold.length,
      total_quantity_sold: productsSold.reduce((s, x) => s + x.quantity_sold, 0),
      total_amount: productsSold.reduce((s, x) => s + x.amount_total, 0),
    };

    const totals = totalsRows && totalsRows[0] ? totalsRows[0] : {};
    const totalProfit = profitRows && profitRows[0] ? Number(profitRows[0].total_profit || 0) : 0;
    const customersCreditRemaining = creditCustomersRows && creditCustomersRows[0]
      ? Number(creditCustomersRows[0].customers_credit_remaining || 0)
      : 0;
    const suppliersBalance = supplierBalanceRows && supplierBalanceRows[0]
      ? Number(supplierBalanceRows[0].suppliers_balance || 0)
      : 0;
    const suppliersBalancePayable = suppliersBalance > 0 ? suppliersBalance : 0;
    const suppliersBalanceReceivable = suppliersBalance < 0 ? Math.abs(suppliersBalance) : 0;
    const expensesList = (expensesRows || []).map((r) => ({
      id: r.id,
      expense_date: r.expense_date,
      created_at: r.created_at,
      amount: Number(r.amount || 0),
      direction: r.direction === 'in' ? 'in' : 'out',
      direction_label: r.direction === 'in' ? 'وارد' : 'مصروف',
      category_name: r.category_name || '—',
      payment_method_name: r.payment_method_name || '—',
      user_name: r.user_name || '—',
      note: r.note || '',
    }));
    const expensesTotalOut = expensesList
      .filter((x) => x.direction === 'out')
      .reduce((s, x) => s + Number(x.amount || 0), 0);
    const expensesTotalIn = expensesList
      .filter((x) => x.direction === 'in')
      .reduce((s, x) => s + Number(x.amount || 0), 0);
    const netExpenses = expensesTotalOut - expensesTotalIn;
    const netProfitAfterExpenses = totalProfit - netExpenses;
    const netProfitAfterCreditAndSuppliers =
      netProfitAfterExpenses + customersCreditRemaining - suppliersBalancePayable + suppliersBalanceReceivable;

    res.json({
      success: true,
      data: {
        filters: {
          all: !!allFlag,
          from_date: hasFromDate ? fromDateRaw : null,
          to_date: hasToDate ? toDateRaw : null,
        },
        totals: {
          gross_sales_before_discount: Number(totals.gross_sales_before_discount || 0),
          net_sales_after_discount: Number(totals.net_sales_after_discount || 0),
          discounts_total: Number(totals.discounts_total || 0),
          total_profit: totalProfit,
          expenses_total_out: expensesTotalOut,
          expenses_total_in: expensesTotalIn,
          net_expenses: netExpenses,
          net_profit_after_expenses: netProfitAfterExpenses,
          customers_credit_remaining: customersCreditRemaining,
          suppliers_balance: suppliersBalance,
          suppliers_balance_payable: suppliersBalancePayable,
          suppliers_balance_receivable: suppliersBalanceReceivable,
          net_profit_after_credit_and_suppliers: netProfitAfterCreditAndSuppliers,
        },
        expenses: expensesList,
        products_summary: productsSummary,
        products_sold: productsSold,
        invoices: (invoiceRows || []).map((r) => ({
          invoice_id: r.invoice_id,
          created_at: r.created_at,
          customer_name: r.customer_name || '—',
          payment_method_name: r.payment_method_name || 'بدون تحديد',
          gross_total: Number(r.gross_total || 0),
          net_total: Number(r.net_total || 0),
          discount_total: Number(r.discount_total || 0),
          edit_count: Number(r.edit_count || 0),
          is_edited: Number(r.edit_count || 0) > 0,
        })),
        payments: (paymentRows || []).map((r) => ({
          payment_method_id: r.payment_method_id,
          payment_method_name: r.payment_method_name || 'بدون تحديد',
          invoices_count: Number(r.invoices_count || 0),
          gross_sales_before_discount: Number(r.gross_sales_before_discount || 0),
          net_sales_after_discount: Number(r.net_sales_after_discount || 0),
          discounts_total: Number(r.discounts_total || 0),
          profit: Number(profitByMethod.get(r.payment_method_id == null ? 'null' : String(r.payment_method_id)) || 0),
        })),
      },
    });
  } catch (err) {
    console.error('getPosProfitReport error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب تقرير أرباح نقطة البيع' });
  }
}

async function createPosSaleVersion(saleInvoiceId, actionType, saleReturnId = null) {
  if (!saleInvoiceId) {
    return;
  }
  try {
    const [invRows] = await pool.execute(
      `SELECT id, customer_name, customer_phone, total_amount,
              discount_percent, discount_value, total_before_discount,
              payment_method_id, user_id, is_pos
       FROM sale_invoices
       WHERE id = ?`,
      [saleInvoiceId]
    );
    if (!invRows.length) {
      return;
    }
    const invoice = invRows[0];
    if (!invoice.is_pos) {
      return;
    }

    const [verRows] = await pool.execute(
      'SELECT COALESCE(MAX(version_no), 0) AS max_ver FROM pos_sale_versions WHERE sale_invoice_id = ?',
      [saleInvoiceId]
    );
    const nextVersion = Number(verRows[0].max_ver || 0) + 1;

    const totalBefore =
      invoice.total_before_discount != null
        ? Number(invoice.total_before_discount)
        : Number(invoice.total_amount || 0);

    const [insVer] = await pool.execute(
      `INSERT INTO pos_sale_versions
        (sale_invoice_id, version_no, action_type,
         customer_name, customer_phone,
         total_before_discount, discount_value, discount_percent, total_amount,
         payment_method_id, user_id, sale_return_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        saleInvoiceId,
        nextVersion,
        actionType,
        invoice.customer_name || null,
        invoice.customer_phone || null,
        totalBefore,
        Number(invoice.discount_value || 0),
        Number(invoice.discount_percent || 0),
        Number(invoice.total_amount || 0),
        invoice.payment_method_id || null,
        invoice.user_id || null,
        saleReturnId || null,
      ]
    );

    const versionId = insVer.insertId;

    const [items] = await pool.execute(
      'SELECT product_id, quantity, unit_sale_price, line_total FROM sale_invoice_items WHERE sale_invoice_id = ?',
      [saleInvoiceId]
    );
    if (!items.length) {
      return;
    }

    for (const row of items) {
      await pool.execute(
        `INSERT INTO pos_sale_item_versions
           (version_id, product_id, quantity, unit_sale_price, line_total)
         VALUES (?, ?, ?, ?, ?)`,
        [
          versionId,
          row.product_id,
          Number(row.quantity || 0),
          Number(row.unit_sale_price || 0),
          Number(row.line_total || 0),
        ]
      );
    }
  } catch (err) {
    console.error('createPosSaleVersion error:', err);
  }
}

/** سعر الوحدة بعد خصم البند — نفس منطق نقطة البيع (نسبة لها أولوية على القيمة). */
function posLineUnitAfterDiscount(base, itemDiscountPercent, itemDiscountValue) {
  const b = Number(base) || 0;
  if (b <= 0) return 0;
  let pct = Number(itemDiscountPercent) || 0;
  let val = Number(itemDiscountValue) || 0;
  if (pct > 0) {
    pct = Math.max(0, Math.min(100, pct));
    const discountAmount = (b * pct) / 100;
    const p2 = b - discountAmount;
    return p2 > 0 ? p2 : 0;
  }
  if (val > 0) {
    val = Math.min(val, b);
    const p = b - val;
    return p > 0 ? p : 0;
  }
  return b;
}

async function createSaleInvoice(req, res) {
  const warehouseId = parseInt(req.body && req.body.warehouse_id, 10);
  const supplierId = req.body.supplier_id !== undefined && req.body.supplier_id !== '' && req.body.supplier_id !== null
    ? parseInt(req.body.supplier_id, 10)
    : null;
  const customerId = req.body.customer_id !== undefined && req.body.customer_id !== '' && req.body.customer_id !== null
    ? parseInt(req.body.customer_id, 10)
    : null;
  const customerName =
    req.body && req.body.customer_name ? String(req.body.customer_name).trim().slice(0, 200) : null;
  const customerPhone =
    req.body && req.body.customer_phone ? String(req.body.customer_phone).trim().slice(0, 50) : null;
  const paymentMethodId = req.body && req.body.payment_method_id
    ? parseInt(req.body.payment_method_id, 10)
    : null;
  const amountPaid = parseFloat(req.body && req.body.amount_paid) || 0;
  const isAjel = !!(req.body && (req.body.ajel === true || req.body.ajel === 1 || req.body.ajel === '1'));
  const rawDiscountPercent =
    req.body && req.body.discount_percent != null ? parseFloat(req.body.discount_percent) : NaN;
  const rawDiscountValue =
    req.body && req.body.discount_value != null ? parseFloat(req.body.discount_value) : NaN;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'اختر المخزن' });
  }
  if (!items.length) {
    return res.status(400).json({ success: false, message: 'السلة فارغة' });
  }
  if (isAjel && !customerName) {
    return res.status(400).json({ success: false, message: 'اسم العميل إجباري في فاتورة الأجل' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let totalAmount = 0;
    const invoiceItems = [];
    const isPosSale = !!(req.body && req.body.source === 'pos');
    const POS_PRICE_EPS = 0.03;

    for (const row of items) {
      const qty = parseFloat(row.quantity) || 0;
      if (qty <= 0) continue;
      const productId = row.product_id ? parseInt(row.product_id, 10) : null;
      if (!productId) continue;

      const itemDiscountPercent =
        row.item_discount_percent != null ? Math.max(0, Math.min(100, parseFloat(row.item_discount_percent))) : 0;
      const itemDiscountValue =
        row.item_discount_value != null ? Math.max(0, parseFloat(row.item_discount_value)) : 0;

      let salePrice;
      let unitPriceBeforeDiscount;
      if (isPosSale) {
        const canonical = await getCanonicalSalePrice(conn, productId);
        if (canonical == null || Number.isNaN(canonical)) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({
            success: false,
            message:
              'لا يوجد سعر بيع معتمد في السجل للمنتج. راجع أسعار المنتجات أو نفّذ ترحيل جدول product_price_history.',
          });
        }
        unitPriceBeforeDiscount = canonical;
        salePrice = posLineUnitAfterDiscount(canonical, itemDiscountPercent, itemDiscountValue);
        const clientSale = parseFloat(row.sale_price) || 0;
        if (Math.abs(clientSale - salePrice) > POS_PRICE_EPS) {
          const [pn] = await conn.execute('SELECT name FROM products WHERE id = ?', [productId]);
          const nm = pn.length ? pn[0].name : 'المنتج';
          await conn.rollback();
          conn.release();
          return res.status(400).json({
            success: false,
            message:
              'سعر أو خصم الصنف «' +
              nm +
              '» لا يطابق السعر المعتمد حالياً (' +
              canonical.toFixed(2) +
              ' ج.م). حدّث صفحة نقطة البيع وأعد إضافة المنتج للسلة.',
          });
        }
      } else {
        salePrice = parseFloat(row.sale_price) || 0;
        unitPriceBeforeDiscount =
          row.unit_price_before_discount != null ? parseFloat(row.unit_price_before_discount) : null;
      }

      const lineTotal = qty * salePrice;
      totalAmount += lineTotal;

      const [stock] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, warehouseId]
      );
      const available = stock.length ? Number(stock[0].quantity) : 0;
      if (available < qty) {
        const [prodName] = await conn.execute('SELECT name FROM products WHERE id = ?', [productId]);
        const name = prodName.length ? prodName[0].name : 'المنتج';
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'الكمية غير متوفرة في المخزن للمنتج: ' + name + ' (المتاح: ' + available + ')',
        });
      }

      invoiceItems.push({
        product_id: productId,
        quantity: qty,
        unit_sale_price: salePrice,
        line_total: lineTotal,
        unit_price_before_discount: unitPriceBeforeDiscount,
        item_discount_percent: itemDiscountPercent,
        item_discount_value: itemDiscountValue,
      });

      const qBefore = available;
      const qAfter = qBefore - qty;
      await conn.execute('UPDATE warehouse_stock SET quantity = quantity - ?, updated_at = NOW() WHERE id = ?', [qty, stock[0].id]);
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, warehouseId, qBefore, qAfter, userId]
      );
    }

    if (invoiceItems.length === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'لا توجد أصناف صالحة' });
    }

    const totalBeforeDiscount = totalAmount;
    let discountPercent = 0;
    let discountValue = 0;

    const nPct = Number.isFinite(rawDiscountPercent) ? rawDiscountPercent : 0;
    const nVal = Number.isFinite(rawDiscountValue) ? rawDiscountValue : 0;
    if (nPct > 0) {
      discountPercent = Math.max(0, Math.min(100, nPct));
      discountValue = (totalBeforeDiscount * discountPercent) / 100;
    } else if (nVal > 0) {
      discountValue = Math.min(nVal, totalBeforeDiscount);
      discountPercent = totalBeforeDiscount > 0 ? (discountValue / totalBeforeDiscount) * 100 : 0;
    }

    if (discountValue > 0) {
      totalAmount = Math.max(0, totalBeforeDiscount - discountValue);
    }

    const totalItems = invoiceItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
    const safeAmountPaid = Math.max(0, Math.min(Number(amountPaid || 0), totalAmount));

    const isPos = isPosSale ? 1 : 0;
    let invoiceDate = req.body && req.body.invoice_date ? String(req.body.invoice_date).trim().slice(0, 10) : null;
    if (!invoiceDate || !/^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)) {
      invoiceDate = new Date().toISOString().slice(0, 10);
    }

    let effectiveCustomerId = customerId || null;
    if (isAjel && !effectiveCustomerId) {
      if (customerPhone) {
        const [customerRows] = await conn.execute(
          'SELECT id, name FROM customers WHERE phone = ? ORDER BY id DESC LIMIT 1',
          [customerPhone]
        );
        if (customerRows.length) {
          effectiveCustomerId = customerRows[0].id;
          await conn.execute(
            'UPDATE customers SET name = ? WHERE id = ?',
            [customerName, effectiveCustomerId]
          );
        }
      }
      if (!effectiveCustomerId) {
        const fallbackPhone = customerPhone || ('AJEL-' + Date.now());
        const [insCustomer] = await conn.execute(
          'INSERT INTO customers (name, phone) VALUES (?, ?)',
          [customerName, fallbackPhone.slice(0, 50)]
        );
        effectiveCustomerId = insCustomer.insertId;
      }
    }

    const [inv] = await conn.execute(
      `INSERT INTO sale_invoices
        (warehouse_id, supplier_id, customer_id, customer_name, customer_phone,
         total_amount, amount_paid, payment_method_id,
         discount_percent, discount_value, total_before_discount, total_items, user_id, is_pos, ajel, invoice_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        warehouseId,
        supplierId,
        effectiveCustomerId || null,
        customerName || null,
        customerPhone || null,
        totalAmount,
        safeAmountPaid,
        paymentMethodId || null,
        discountPercent,
        discountValue,
        totalBeforeDiscount,
        totalItems,
        userId,
        isPos,
        isAjel ? 1 : 0,
        invoiceDate,
      ]
    );
    const invoiceId = inv.insertId;

    for (const it of invoiceItems) {
      await conn.execute(
        `INSERT INTO sale_invoice_items
          (sale_invoice_id, product_id, quantity, unit_sale_price, unit_price_before_discount, line_total, item_discount_percent, item_discount_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoiceId,
          it.product_id,
          it.quantity,
          it.unit_sale_price,
          it.unit_price_before_discount != null ? it.unit_price_before_discount : null,
          it.line_total,
          it.item_discount_percent != null ? it.item_discount_percent : 0,
          it.item_discount_value != null ? it.item_discount_value : 0,
        ]
      );
    }

    if (isAjel) {
      const remaining = Math.max(0, totalAmount - safeAmountPaid);
      const status = remaining <= 0 ? 'settled' : (safeAmountPaid > 0 ? 'partial' : 'open');
      await conn.execute(
        `INSERT INTO credit_customer_invoices
          (customer_id, sale_invoice_id, invoice_total_amount, amount_paid, amount_settled, status, user_id)
         VALUES (?, ?, ?, ?, 0, ?, ?)`,
        [effectiveCustomerId, invoiceId, totalAmount, safeAmountPaid, status, userId]
      );
    }

    await conn.commit();
    conn.release();

    if (isPos) {
      await createPosSaleVersion(invoiceId, 'created');
    }

    res.status(201).json({
      success: true,
      message: 'تم تسجيل فاتورة البيع',
      data: {
        id: invoiceId,
        total_amount: totalAmount,
        amount_paid: safeAmountPaid,
        remaining_amount: Math.max(0, totalAmount - safeAmountPaid),
        ajel: isAjel,
        total_before_discount: totalBeforeDiscount,
        discount_percent: discountPercent,
        discount_value: discountValue,
        total_items: totalItems,
      },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Create sale invoice error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ الفاتورة' });
  }
}

async function listCreditCustomersProfile(req, res) {
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        c.id AS customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        COUNT(cci.id) AS invoices_count,
        COALESCE(SUM(cci.invoice_total_amount), 0) AS total_required,
        COALESCE(SUM(cci.amount_paid), 0) AS total_paid_at_invoice,
        COALESCE(SUM(cci.amount_settled), 0) AS total_settled,
        COALESCE(SUM(cci.invoice_total_amount - cci.amount_paid - cci.amount_settled), 0) AS total_remaining
      FROM credit_customer_invoices cci
      JOIN customers c ON c.id = cci.customer_id
      JOIN sale_invoices si ON si.id = cci.sale_invoice_id
      WHERE si.deleted_at IS NULL
        AND si.is_pos = 1
      GROUP BY c.id, c.name, c.phone
      HAVING COALESCE(SUM(cci.invoice_total_amount - cci.amount_paid - cci.amount_settled), 0) > 0
      ORDER BY total_remaining DESC, c.name ASC
      `
    );
    return res.json({
      success: true,
      data: (rows || []).map((r) => ({
        customer_id: r.customer_id,
        customer_name: r.customer_name || '—',
        customer_phone: r.customer_phone || '—',
        invoices_count: Number(r.invoices_count || 0),
        total_required: Number(r.total_required || 0),
        total_paid_at_invoice: Number(r.total_paid_at_invoice || 0),
        total_settled: Number(r.total_settled || 0),
        total_remaining: Number(r.total_remaining || 0),
      })),
    });
  } catch (err) {
    console.error('listCreditCustomersProfile error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب ملف عملاء الأجل' });
  }
}

async function listCreditInvoicesByCustomer(req, res) {
  const customerId = parseInt(req.params.customerId, 10);
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'معرف العميل غير صالح' });
  }
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        cci.id,
        cci.customer_id,
        cci.sale_invoice_id,
        cci.invoice_total_amount,
        cci.amount_paid,
        cci.amount_settled,
        cci.status,
        cci.created_at,
        si.created_at AS invoice_created_at
      FROM credit_customer_invoices cci
      JOIN sale_invoices si ON si.id = cci.sale_invoice_id
      WHERE cci.customer_id = ?
        AND cci.status IN ('open', 'partial')
        AND si.deleted_at IS NULL
        AND si.is_pos = 1
      ORDER BY si.created_at DESC, cci.id DESC
      `,
      [customerId]
    );
    return res.json({
      success: true,
      data: (rows || []).map((r) => ({
        id: r.id,
        customer_id: r.customer_id,
        sale_invoice_id: r.sale_invoice_id,
        invoice_total_amount: Number(r.invoice_total_amount || 0),
        amount_paid: Number(r.amount_paid || 0),
        amount_settled: Number(r.amount_settled || 0),
        remaining_amount: Math.max(0, Number(r.invoice_total_amount || 0) - Number(r.amount_paid || 0) - Number(r.amount_settled || 0)),
        status: r.status,
        created_at: r.created_at,
        invoice_created_at: r.invoice_created_at,
      })),
    });
  } catch (err) {
    console.error('listCreditInvoicesByCustomer error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب فواتير الأجل' });
  }
}

async function createCreditSettlement(req, res) {
  const creditInvoiceId = parseInt(req.params.creditInvoiceId, 10);
  const amount = Number(req.body && req.body.amount);
  const paymentMethodId = req.body && req.body.payment_method_id ? parseInt(req.body.payment_method_id, 10) : null;
  const note = req.body && req.body.note ? String(req.body.note).trim().slice(0, 255) : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;
  if (!creditInvoiceId) {
    return res.status(400).json({ success: false, message: 'معرف فاتورة الأجل غير صالح' });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'مبلغ السداد غير صالح' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.execute(
      `SELECT cci.id, cci.customer_id, cci.sale_invoice_id, cci.invoice_total_amount, cci.amount_paid, cci.amount_settled
       FROM credit_customer_invoices cci
       JOIN sale_invoices si ON si.id = cci.sale_invoice_id
       WHERE cci.id = ?
         AND si.is_pos = 1
         AND si.deleted_at IS NULL
       FOR UPDATE`,
      [creditInvoiceId]
    );
    if (!rows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'سجل الأجل غير موجود' });
    }
    const inv = rows[0];
    const remaining = Math.max(0, Number(inv.invoice_total_amount || 0) - Number(inv.amount_paid || 0) - Number(inv.amount_settled || 0));
    if (amount > remaining) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'مبلغ السداد أكبر من المتبقي' });
    }
    const newSettled = Number(inv.amount_settled || 0) + amount;
    const newRemaining = Math.max(0, Number(inv.invoice_total_amount || 0) - Number(inv.amount_paid || 0) - newSettled);
    const status = newRemaining <= 0 ? 'settled' : 'partial';

    await conn.execute(
      `INSERT INTO credit_customer_settlements
        (credit_invoice_id, customer_id, sale_invoice_id, amount, payment_method_id, note, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [inv.id, inv.customer_id, inv.sale_invoice_id, amount, paymentMethodId, note, userId]
    );
    await conn.execute(
      'UPDATE credit_customer_invoices SET amount_settled = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [newSettled, status, inv.id]
    );
    await conn.commit();
    conn.release();
    return res.json({
      success: true,
      message: 'تم تسجيل السداد بنجاح',
      data: { credit_invoice_id: inv.id, amount_settled: newSettled, remaining_amount: newRemaining, status },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('createCreditSettlement error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في تسجيل السداد' });
  }
}

async function createExternalCreditSettlement(req, res) {
  const customerId = parseInt(req.params.customerId, 10);
  const amount = Number(req.body && req.body.amount);
  const paymentMethodId = req.body && req.body.payment_method_id ? parseInt(req.body.payment_method_id, 10) : null;
  const note = req.body && req.body.note ? String(req.body.note).trim().slice(0, 255) : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'معرف العميل غير صالح' });
  }
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'مبلغ السداد غير صالح' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [openInvoices] = await conn.execute(
      `SELECT cci.id, cci.customer_id, cci.sale_invoice_id, cci.invoice_total_amount, cci.amount_paid, cci.amount_settled
       FROM credit_customer_invoices cci
       JOIN sale_invoices si ON si.id = cci.sale_invoice_id
       WHERE cci.customer_id = ?
         AND cci.status IN ('open', 'partial')
         AND si.is_pos = 1
         AND si.deleted_at IS NULL
       ORDER BY cci.created_at ASC, cci.id ASC
       FOR UPDATE`,
      [customerId]
    );
    if (!openInvoices.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'لا توجد فواتير أجل مفتوحة لهذا العميل' });
    }
    let remainingToAllocate = amount;
    const applied = [];
    for (const inv of openInvoices) {
      const remaining = Math.max(0, Number(inv.invoice_total_amount || 0) - Number(inv.amount_paid || 0) - Number(inv.amount_settled || 0));
      if (remaining <= 0) continue;
      const chunk = Math.min(remainingToAllocate, remaining);
      if (chunk <= 0) break;
      const newSettled = Number(inv.amount_settled || 0) + chunk;
      const newRemaining = Math.max(0, Number(inv.invoice_total_amount || 0) - Number(inv.amount_paid || 0) - newSettled);
      const status = newRemaining <= 0 ? 'settled' : 'partial';
      await conn.execute(
        `INSERT INTO credit_customer_settlements
          (credit_invoice_id, customer_id, sale_invoice_id, amount, payment_method_id, note, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [inv.id, inv.customer_id, inv.sale_invoice_id, chunk, paymentMethodId, note || 'سداد خارجي', userId]
      );
      await conn.execute(
        'UPDATE credit_customer_invoices SET amount_settled = ?, status = ?, updated_at = NOW() WHERE id = ?',
        [newSettled, status, inv.id]
      );
      applied.push({ credit_invoice_id: inv.id, sale_invoice_id: inv.sale_invoice_id, amount: chunk });
      remainingToAllocate -= chunk;
      if (remainingToAllocate <= 0) break;
    }
    if (!applied.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'لا يوجد متبقي قابل للسداد حالياً' });
    }
    await conn.commit();
    conn.release();
    return res.json({
      success: true,
      message: remainingToAllocate > 0
        ? 'تم توزيع جزء من السداد على الفواتير المفتوحة'
        : 'تم توزيع السداد على فواتير العميل',
      data: {
        requested_amount: amount,
        applied_amount: amount - remainingToAllocate,
        unapplied_amount: remainingToAllocate,
        applied,
      },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('createExternalCreditSettlement error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في تسجيل السداد الخارجي' });
  }
}

async function listCreditSettlementsByCustomer(req, res) {
  const customerId = parseInt(req.params.customerId, 10);
  if (!customerId) {
    return res.status(400).json({ success: false, message: 'معرف العميل غير صالح' });
  }
  try {
    const [rows] = await pool.execute(
      `
      SELECT
        ccs.id,
        ccs.credit_invoice_id,
        ccs.sale_invoice_id,
        ccs.amount,
        ccs.note,
        ccs.created_at,
        COALESCE(pm.name, 'بدون تحديد') AS payment_method_name,
        COALESCE(u.full_name, u.username, '—') AS user_name
      FROM credit_customer_settlements ccs
      JOIN sale_invoices si ON si.id = ccs.sale_invoice_id
      LEFT JOIN payment_methods pm ON pm.id = ccs.payment_method_id
      LEFT JOIN users u ON u.id = ccs.user_id
      WHERE ccs.customer_id = ?
        AND si.is_pos = 1
        AND si.deleted_at IS NULL
      ORDER BY ccs.created_at DESC, ccs.id DESC
      LIMIT 2000
      `,
      [customerId]
    );
    return res.json({
      success: true,
      data: (rows || []).map((r) => ({
        id: r.id,
        credit_invoice_id: r.credit_invoice_id,
        sale_invoice_id: r.sale_invoice_id,
        amount: Number(r.amount || 0),
        note: r.note || '',
        created_at: r.created_at,
        payment_method_name: r.payment_method_name || 'بدون تحديد',
        user_name: r.user_name || '—',
      })),
    });
  } catch (err) {
    console.error('listCreditSettlementsByCustomer error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب عمليات السداد' });
  }
}

async function createSaleReturn(req, res) {
  const invoiceId = parseInt(req.params.id, 10);
  if (!invoiceId) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة غير صالح' });
  }

  const rawItems = Array.isArray(req.body && req.body.items) ? req.body.items : [];
  const note = req.body && req.body.note ? String(req.body.note).trim() : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!rawItems.length) {
    return res.status(400).json({ success: false, message: 'لا توجد أصناف مرتجعة' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [invRows] = await conn.execute(
      'SELECT supplier_id, warehouse_id FROM sale_invoices WHERE id = ?',
      [invoiceId]
    );
    if (!invRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    const supplierId = invRows[0].supplier_id || null;
    const warehouseId = invRows[0].warehouse_id;

    const [itemsRows] = await conn.execute(
      'SELECT product_id, quantity, unit_sale_price FROM sale_invoice_items WHERE sale_invoice_id = ?',
      [invoiceId]
    );
    const itemMap = new Map();
    itemsRows.forEach((r) => {
      itemMap.set(r.product_id, {
        quantity: Number(r.quantity),
        unit_sale_price: Number(r.unit_sale_price),
      });
    });

    let totalReturnAmount = 0;
    const returnLines = [];

    for (const row of rawItems) {
      const productId = row && row.product_id ? parseInt(row.product_id, 10) : NaN;
      const qtyRequested = row && row.quantity != null ? parseFloat(row.quantity) : NaN;
      if (!productId || isNaN(qtyRequested) || qtyRequested <= 0) continue;

      const invItem = itemMap.get(productId);
      if (!invItem) continue;

      const invoiceQty = invItem.quantity;

      const [retAgg] = await conn.execute(
        `SELECT COALESCE(SUM(sri.quantity_returned), 0) AS returned
         FROM sale_return_items sri
         JOIN sale_returns sr ON sr.id = sri.sale_return_id
         WHERE sr.sale_invoice_id = ? AND sri.product_id = ?`,
        [invoiceId, productId]
      );
      const alreadyReturned = Number(retAgg[0].returned || 0);
      const remainingQty = invoiceQty - alreadyReturned;

      if (remainingQty <= 0) continue;
      if (qtyRequested > remainingQty) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'الكمية المرتجعة تتجاوز الكمية المتبقية في الفاتورة لأحد الأصناف',
        });
      }

      const [stockRows] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, warehouseId]
      );
      const quantityBefore = stockRows.length ? Number(stockRows[0].quantity) : 0;
      const quantityAfter = quantityBefore + qtyRequested;

      if (stockRows.length) {
        await conn.execute(
          'UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?',
          [quantityAfter, stockRows[0].id]
        );
      } else {
        await conn.execute(
          'INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
          [productId, warehouseId, quantityAfter]
        );
      }

      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, warehouseId, quantityBefore, quantityAfter, userId]
      );

      const unitPrice = invItem.unit_sale_price;
      const lineTotal = qtyRequested * unitPrice;
      totalReturnAmount += lineTotal;

      returnLines.push({
        product_id: productId,
        quantity_before: quantityBefore,
        quantity_returned: qtyRequested,
        quantity_after: quantityAfter,
        unit_sale_price: unitPrice,
        line_total: lineTotal,
      });
    }

    if (!returnLines.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'لا توجد أصناف مرتجعة صالحة' });
    }

    const [retIns] = await conn.execute(
      'INSERT INTO sale_returns (sale_invoice_id, supplier_id, warehouse_id, total_return_amount, user_id, note) VALUES (?, ?, ?, ?, ?, ?)',
      [invoiceId, supplierId, warehouseId, totalReturnAmount, userId, note || null]
    );
    const returnId = retIns.insertId;

    for (const line of returnLines) {
      await conn.execute(
        `INSERT INTO sale_return_items
         (sale_return_id, product_id, quantity_before, quantity_returned, quantity_after, unit_sale_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          returnId,
          line.product_id,
          line.quantity_before,
          line.quantity_returned,
          line.quantity_after,
          line.unit_sale_price,
          line.line_total,
        ]
      );
    }

    await conn.commit();
    conn.release();

    await createPosSaleVersion(invoiceId, 'returned', returnId);

    res.status(201).json({
      success: true,
      message: 'تم تسجيل مرتجع فاتورة البيع',
      data: { id: returnId, total_return_amount: totalReturnAmount },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Create sale return error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ مرتجع الفاتورة' });
  }
}

function listSaleInvoices(req, res) {
  const supplierId = req.query.supplier_id;
  const allDates = req.query.all === '1' || req.query.all === 'true';
  const source = req.query.source;
  let sql = `
    SELECT
      si.id,
      si.warehouse_id,
      si.supplier_id,
      si.total_amount,
      si.amount_paid,
      si.discount_percent,
      si.discount_value,
      si.total_before_discount,
      si.total_items,
      si.invoice_date,
      si.created_at,
      w.name AS warehouse_name,
      s.name AS supplier_name,
      c.name AS customer_name,
      pm.name AS payment_method_name,
      COALESCE(u.full_name, u.username, '—') AS user_name,
      (SELECT COUNT(*) FROM sale_invoice_edit_log WHERE sale_invoice_id = si.id) AS edit_count,
      (SELECT COALESCE(SUM(sii.quantity * COALESCE(sii.unit_price_before_discount, sii.unit_sale_price)), 0)
       FROM sale_invoice_items sii
       WHERE sii.sale_invoice_id = si.id) AS gross_before_all_discounts
    FROM sale_invoices si
    JOIN warehouses w ON w.id = si.warehouse_id
    LEFT JOIN suppliers s ON s.id = si.supplier_id
    LEFT JOIN customers c ON c.id = si.customer_id
    LEFT JOIN payment_methods pm ON pm.id = si.payment_method_id
    LEFT JOIN users u ON u.id = si.user_id
    WHERE 1=1
  `;
  const params = [];
  if (!allDates) {
    sql += ' AND DATE(si.created_at) = CURDATE()';
  }
  sql += ' AND (si.deleted_at IS NULL)';
  if (source === 'pos') {
    sql += ' AND si.is_pos = 1';
  } else if (source === 'warehouses') {
    sql += ' AND si.is_pos = 0';
  }
  if (supplierId === 'none' || supplierId === 'null') {
    sql += ' AND si.supplier_id IS NULL';
  } else if (supplierId !== undefined && supplierId !== '') {
    sql += ' AND si.supplier_id = ?';
    params.push(supplierId);
  }
  sql += ' ORDER BY si.created_at DESC LIMIT 500';
  pool
    .execute(sql, params)
    .then(([rows]) => res.json({ success: true, data: rows }))
    .catch((err) => {
      console.error('List sale invoices error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب الفواتير' });
    });
}

function getSaleInvoiceById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة مطلوب' });
  }

  const sqlHead = `
    SELECT
      si.id,
      si.warehouse_id,
      si.supplier_id,
      si.customer_id,
      si.customer_name,
      si.customer_phone,
      si.total_amount,
      si.amount_paid,
      si.discount_percent,
      si.discount_value,
      si.total_before_discount,
      si.total_items,
      si.payment_method_id,
      si.invoice_date,
      si.created_at,
      w.name AS warehouse_name,
      s.name AS supplier_name,
      c.name AS customer_name_db,
      pm.name AS payment_method_name
    FROM sale_invoices si
    JOIN warehouses w ON w.id = si.warehouse_id
    LEFT JOIN suppliers s ON s.id = si.supplier_id
    LEFT JOIN customers c ON c.id = si.customer_id
    LEFT JOIN payment_methods pm ON pm.id = si.payment_method_id
    WHERE si.id = ? AND (si.deleted_at IS NULL)
  `;
  pool
    .execute(sqlHead, [id])
    .then(([rows]) => {
      if (!rows || rows.length === 0) {
        return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة أو محذوفة' });
      }
      const invoice = rows[0];
      return pool
        .execute(
          `SELECT sii.product_id, sii.quantity, sii.unit_sale_price, sii.unit_price_before_discount,
                  sii.line_total, sii.item_discount_percent, sii.item_discount_value,
                  p.name AS product_name, p.barcode
           FROM sale_invoice_items sii
           JOIN products p ON p.id = sii.product_id
           WHERE sii.sale_invoice_id = ?
           ORDER BY sii.id`,
          [id]
        )
        .then(([items]) => {
          const itemsArr = (items || []).map((r) => ({
            product_id: r.product_id,
            product_name: r.product_name,
            barcode: r.barcode,
            quantity: Number(r.quantity),
            unit_sale_price: Number(r.unit_sale_price),
            unit_price_before_discount: r.unit_price_before_discount != null ? Number(r.unit_price_before_discount) : null,
            line_total: Number(r.line_total),
            item_discount_percent: Number(r.item_discount_percent || 0),
            item_discount_value: Number(r.item_discount_value || 0),
          }));
          const grossBeforeAll = itemsArr.reduce((sum, it) => {
            const qty = Number(it.quantity || 0);
            const unit =
              it.unit_price_before_discount != null
                ? Number(it.unit_price_before_discount)
                : Number(it.unit_sale_price || 0);
            return sum + qty * unit;
          }, 0);
          res.json({
            success: true,
            data: {
              id: invoice.id,
              warehouse_id: invoice.warehouse_id,
              supplier_id: invoice.supplier_id,
              customer_id: invoice.customer_id,
              warehouse_name: invoice.warehouse_name || '—',
              supplier_name: invoice.supplier_name || '—',
              customer_name:
                invoice.customer_name ||
                invoice.customer_name_db ||
                null,
              customer_phone: invoice.customer_phone || null,
              total_amount: Number(invoice.total_amount),
              amount_paid: Number(invoice.amount_paid),
              discount_percent: Number(invoice.discount_percent || 0),
              discount_value: Number(invoice.discount_value || 0),
              total_before_discount: Number(invoice.total_before_discount || invoice.total_amount),
              gross_before_all_discounts: grossBeforeAll,
              total_items: Number(invoice.total_items || 0),
              payment_method_id: invoice.payment_method_id || null,
              payment_method_name: invoice.payment_method_name || null,
              invoice_date: invoice.invoice_date || null,
              created_at: invoice.created_at,
              entered_at: invoice.created_at,
              items: itemsArr,
            },
          });
        });
    })
    .catch((err) => {
      console.error('Get sale invoice error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب الفاتورة' });
    });
}

/**
 * تعديل فاتورة البيع بالكامل (رأس + أصناف) مع تصحيح المخزون في قاعدة البيانات
 */
async function updateSaleInvoice(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة غير صالح' });
  }

  const warehouseId = parseInt(req.body && req.body.warehouse_id, 10);
  const supplierId = req.body.supplier_id !== undefined && req.body.supplier_id !== '' && req.body.supplier_id !== null
    ? parseInt(req.body.supplier_id, 10) : null;
  const amountPaid = parseFloat(req.body && req.body.amount_paid) || 0;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'اختر المخزن' });
  }
  if (!items.length) {
    return res.status(400).json({ success: false, message: 'يجب وجود صنف واحد على الأقل' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [invRows] = await conn.execute(
      'SELECT id, warehouse_id FROM sale_invoices WHERE id = ?',
      [id]
    );
    if (!invRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    const oldWarehouseId = invRows[0].warehouse_id;

    const [oldItems] = await conn.execute(
      'SELECT product_id, quantity FROM sale_invoice_items WHERE sale_invoice_id = ?',
      [id]
    );

    // عكس الحركة: إرجاع الكميات التي خُصمت عند البيع (إضافة للمخزن)
    for (const row of oldItems) {
      const productId = row.product_id;
      const qty = Number(row.quantity);
      const [st] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, oldWarehouseId]
      );
      const qBefore = st.length ? Number(st[0].quantity) : 0;
      const qAfter = qBefore + qty;
      if (st.length) {
        await conn.execute('UPDATE warehouse_stock SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?', [qty, st[0].id]);
      } else {
        await conn.execute('INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, oldWarehouseId, qAfter]);
      }
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, oldWarehouseId, qBefore, qAfter, userId]
      );
    }

    await conn.execute('DELETE FROM sale_invoice_items WHERE sale_invoice_id = ?', [id]);

    let totalAmount = 0;

    for (const row of items) {
      const qty = parseFloat(row.quantity) || 0;
      if (qty <= 0) continue;
      const productId = row.product_id ? parseInt(row.product_id, 10) : null;
      if (!productId) continue;

      const salePrice = parseFloat(row.sale_price) || 0;
      const lineTotal = qty * salePrice;
      totalAmount += lineTotal;
      const unitPriceBeforeDiscount = row.unit_price_before_discount != null ? parseFloat(row.unit_price_before_discount) : null;
      const itemDiscountPercent = row.item_discount_percent != null ? Math.max(0, Math.min(100, parseFloat(row.item_discount_percent))) : 0;
      const itemDiscountValue = row.item_discount_value != null ? Math.max(0, parseFloat(row.item_discount_value)) : 0;

      const [prod] = await conn.execute('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
      if (!prod.length) continue;

      const [stock] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, warehouseId]
      );
      const available = stock.length ? Number(stock[0].quantity) : 0;
      if (available < qty) {
        const [prodName] = await conn.execute('SELECT name FROM products WHERE id = ?', [productId]);
        const name = prodName.length ? prodName[0].name : 'المنتج';
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'الكمية غير متوفرة في المخزن للمنتج: ' + name + ' (المتاح: ' + available + ')',
        });
      }

      await conn.execute(
        `INSERT INTO sale_invoice_items
          (sale_invoice_id, product_id, quantity, unit_sale_price, unit_price_before_discount, line_total, item_discount_percent, item_discount_value)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, productId, qty, salePrice, unitPriceBeforeDiscount, lineTotal, itemDiscountPercent, itemDiscountValue]
      );

      const qBefore = available;
      const qAfter = qBefore - qty;
      await conn.execute('UPDATE warehouse_stock SET quantity = quantity - ?, updated_at = NOW() WHERE id = ?', [qty, stock[0].id]);
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, warehouseId, qBefore, qAfter, userId]
      );
    }

    await conn.execute(
      'UPDATE sale_invoices SET warehouse_id = ?, supplier_id = ?, total_amount = ?, amount_paid = ?, updated_at = NOW() WHERE id = ?',
      [warehouseId, supplierId, totalAmount, amountPaid, id]
    );

    await conn.execute(
      'INSERT INTO sale_invoice_edit_log (sale_invoice_id, user_id) VALUES (?, ?)',
      [id, userId]
    );

    await conn.commit();
    conn.release();

    await createPosSaleVersion(id, 'edited');

    res.json({
      success: true,
      message: 'تم حفظ تعديل الفاتورة في قاعدة البيانات',
      data: { id, total_amount: totalAmount, amount_paid: amountPaid },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Update sale invoice error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ تعديل الفاتورة' });
  }
}

async function deleteSaleInvoice(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة مطلوب' });
  }
  try {
    const [rows] = await pool.execute('SELECT id FROM sale_invoices WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة أو محذوفة' });
    }
    await pool.execute('UPDATE sale_invoices SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ success: true, message: 'تم حذف الفاتورة' });
  } catch (err) {
    console.error('Delete sale invoice error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف الفاتورة' });
  }
}

function getSaleInvoiceEditLog(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة مطلوب' });
  }
  const sql = `
    SELECT siel.id, siel.user_id, siel.edited_at,
           COALESCE(u.full_name, u.username, '—') AS user_name
    FROM sale_invoice_edit_log siel
    LEFT JOIN users u ON u.id = siel.user_id
    WHERE siel.sale_invoice_id = ?
    ORDER BY siel.edited_at DESC
  `;
  pool
    .execute(sql, [id])
    .then(([rows]) => {
      res.json({
        success: true,
        data: (rows || []).map((r) => ({
          id: r.id,
          user_id: r.user_id,
          user_name: r.user_name || '—',
          edited_at: r.edited_at,
        })),
      });
    })
    .catch((err) => {
      console.error('Get sale invoice edit log error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب سجل التعديلات' });
    });
}

async function getCreditCustomersAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }
  if (username === 'admin') {
    return res.json({ success: true, data: { details: true, settle: true } });
  }
  try {
    const checks = [
      { key: 'details', module_key: 'credit_customers', action_key: 'details' },
      { key: 'settle', module_key: 'credit_customers', action_key: 'settle' },
    ];
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
    console.error('Get credit customers access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات ملف عملاء الأجل' });
  }
}

async function getShiftCloseAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }
  if (username === 'admin') {
    return res.json({ success: true, data: { tab_payment_summary: true, tab_receive_amounts: true, tab_shift_log: true } });
  }
  try {
    const checks = [
      { key: 'tab_payment_summary', module_key: 'shift_close.tabs.payment_summary', action_key: 'view' },
      { key: 'tab_receive_amounts', module_key: 'shift_close.tabs.receive_amounts', action_key: 'view' },
      { key: 'tab_shift_log', module_key: 'shift_close.tabs.shift_log', action_key: 'view' },
    ];
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
    console.error('Get shift close access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات تقفيل الشفت' });
  }
}

module.exports = {
  createSaleInvoice,
  listSaleInvoices,
  getSaleInvoiceById,
  getSaleInvoiceEditLog,
  createSaleReturn,
  updateSaleInvoice,
  deleteSaleInvoice,
  getPosShiftSummary,
  listShiftEmployees,
  createPosShiftClosure,
  listPosShiftClosures,
  getPosProfitReport,
  listCreditCustomersProfile,
  getCreditCustomersAccess,
  getShiftCloseAccess,
  listCreditInvoicesByCustomer,
  createCreditSettlement,
  createExternalCreditSettlement,
  listCreditSettlementsByCustomer,
};

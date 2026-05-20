/**
 * تحكم الموردين - قائمة، إضافة، وكشف حساب
 */

const { pool } = require('../config/db');

function listSuppliers(req, res) {
  pool
    .execute('SELECT id, name, phone, note, created_at FROM suppliers ORDER BY name')
    .then(([rows]) => {
      res.json({ success: true, data: rows });
    })
    .catch((err) => {
      console.error('List suppliers error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب الموردين' });
    });
}

function createSupplier(req, res) {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  const phone = (req.body && req.body.phone) ? String(req.body.phone).trim() : '';
  const note = (req.body && req.body.note) ? String(req.body.note).trim() : null;

  if (!name) {
    return res.status(400).json({ success: false, message: 'اسم المورد مطلوب' });
  }
  if (!phone) {
    return res.status(400).json({ success: false, message: 'رقم الهاتف مطلوب' });
  }

  pool
    .execute('INSERT INTO suppliers (name, phone, note) VALUES (?, ?, ?)', [name, phone, note || null])
    .then(([result]) => {
      return pool.execute(
        'SELECT id, name, phone, note, created_at FROM suppliers WHERE id = ?',
        [result.insertId]
      );
    })
    .then(([rows]) => {
      res.status(201).json({
        success: true,
        message: 'تم إضافة المورد بنجاح',
        data: rows[0],
      });
    })
    .catch((err) => {
      console.error('Create supplier error:', err);
      res.status(500).json({ success: false, message: 'خطأ في إضافة المورد' });
    });
}

/**
 * كشف حساب مورد: مدين / دائن لكل فاتورة
 * يحسب الرصيد التراكمي بناءً على (المطلوب - المدفوع)
 */
function getSupplierStatement(req, res) {
  const supplierId = parseInt(req.params.id, 10);
  if (!supplierId) {
    return res.status(400).json({ success: false, message: 'معرف المورد غير صالح' });
  }

  const sql = `
    SELECT
      pi.id,
      'invoice' AS kind,
      pi.total_amount,
      pi.amount_paid,
      0 AS pay_amount,
      NULL AS pay_direction,
      pi.created_at,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      COUNT(DISTINCT pii.product_id) AS products_count,
      u.username AS user_name
    FROM purchase_invoices pi
    JOIN suppliers s ON s.id = pi.supplier_id
    LEFT JOIN purchase_invoice_items pii ON pii.purchase_invoice_id = pi.id
    LEFT JOIN users u ON u.id = pi.user_id
    WHERE pi.supplier_id = ?
    GROUP BY pi.id

    UNION ALL

    SELECT
      si.id,
      'sale' AS kind,
      si.total_amount,
      si.amount_paid,
      0 AS pay_amount,
      NULL AS pay_direction,
      si.created_at,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      (SELECT COUNT(*) FROM sale_invoice_items WHERE sale_invoice_id = si.id) AS products_count,
      u.username AS user_name
    FROM sale_invoices si
    JOIN suppliers s ON s.id = si.supplier_id
    LEFT JOIN users u ON u.id = si.user_id
    WHERE si.supplier_id = ?

    UNION ALL

    SELECT
      pi.id,
      'invoice_payment' AS kind,
      0 AS total_amount,
      0 AS amount_paid,
      pi.amount_paid AS pay_amount,
      'to_supplier' AS pay_direction,
      pi.created_at,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      0 AS products_count,
      u.username AS user_name
    FROM purchase_invoices pi
    JOIN suppliers s ON s.id = pi.supplier_id
    LEFT JOIN users u ON u.id = pi.user_id
    WHERE pi.supplier_id = ? AND pi.amount_paid > 0

    UNION ALL

    SELECT
      sp.id,
      'payment' AS kind,
      0 AS total_amount,
      0 AS amount_paid,
      sp.amount AS pay_amount,
      sp.direction AS pay_direction,
      sp.created_at,
      s.name AS supplier_name,
      s.phone AS supplier_phone,
      0 AS products_count,
      u.username AS user_name
    FROM supplier_payments sp
    JOIN suppliers s ON s.id = sp.supplier_id
    LEFT JOIN users u ON u.id = sp.user_id
    WHERE sp.supplier_id = ?

    ORDER BY created_at ASC, id ASC
  `;

  pool
    .execute(sql, [supplierId, supplierId, supplierId, supplierId])
    .then(([rows]) => {
      if (!rows || rows.length === 0) {
        return res.json({
          success: true,
          data: {
            supplier: null,
            movements: [],
            totals: { debit: 0, credit: 0, balance: 0 },
          },
        });
      }

      let balance = 0;

      const movements = rows.map((r) => {
        const total = Number(r.total_amount) || 0;
        const paid = Number(r.amount_paid) || 0;
        const payAmount = Number(r.pay_amount) || 0;
        let net = 0;
        if (r.kind === 'invoice') {
          net = total - paid; // شراء: >0 علينا، <0 له عندنا
        } else if (r.kind === 'sale') {
          net = paid - total; // بيع: إذا دفع أقل = سالب (المورد مدين لنا)، إذا دفع أكثر = موجب (له عندنا)
        } else if (r.kind === 'payment') {
          if (r.pay_direction === 'to_supplier') {
            // نحن ندفع للمورد → يقل ما علينا
            net = -payAmount;
          } else if (r.pay_direction === 'from_supplier') {
            // المورد يدفع لنا → يزيد ما له عندنا
            net = payAmount;
          }
        } else if (r.kind === 'invoice_payment') {
          // هذه الحركة للعرض في سجل المدفوعات فقط؛ لا تؤثر على الرصيد
          // لأن رصيد الفاتورة محسوب مسبقاً من (المطلوب - المدفوع)
          net = 0;
        }
        let debit = 0;
        let credit = 0;
        if (net > 0) {
          debit = net;
        } else if (net < 0) {
          credit = -net;
        }
        balance += net;
        return {
          id: r.id,
          kind: r.kind,
          total_amount: total,
          amount_paid: paid,
          pay_amount: payAmount,
          pay_direction: r.pay_direction || null,
          created_at: r.created_at,
          products_count: Number(r.products_count) || 0,
          user_name: r.user_name || null,
          debit,
          credit,
          balance_after: balance,
        };
      });

      res.json({
        success: true,
        data: {
          supplier: {
            id: supplierId,
            name: rows[0].supplier_name || '',
            phone: rows[0].supplier_phone || '',
          },
          movements,
          totals: (function () {
            let debitTotal = 0;
            let creditTotal = 0;
            if (balance > 0) {
              // رصيد موجب = ما زلنا مدينين للمورد
              debitTotal = balance;
            } else if (balance < 0) {
              // رصيد سالب = المورد مدين لنا
              creditTotal = -balance;
            }
            return {
              debit: debitTotal,
              credit: creditTotal,
              balance,
            };
          })(),
        },
      });
    })
    .catch((err) => {
      console.error('Supplier statement error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب كشف الحساب' });
    });
}

/**
 * إنشاء حركة تسديد/استلام مع مورد
 */
function createSupplierPayment(req, res) {
  const supplierId = parseInt(req.params.id, 10);
  if (!supplierId) {
    return res.status(400).json({ success: false, message: 'معرف المورد غير صالح' });
  }
  const amount = parseFloat(req.body && req.body.amount);
  const direction = req.body && req.body.direction;
  const note = (req.body && req.body.note) ? String(req.body.note).trim() : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ success: false, message: 'قيمة المبلغ غير صحيحة' });
  }
  if (direction !== 'to_supplier' && direction !== 'from_supplier') {
    return res.status(400).json({ success: false, message: 'اتجاه الحركة غير صحيح' });
  }

  pool
    .execute(
      'INSERT INTO supplier_payments (supplier_id, amount, direction, note, user_id) VALUES (?, ?, ?, ?, ?)',
      [supplierId, amount, direction, note || null, userId]
    )
    .then(() => {
      res.status(201).json({ success: true, message: 'تم تسجيل حركة التسديد بنجاح' });
    })
    .catch((err) => {
      console.error('Create supplier payment error:', err);
      res.status(500).json({ success: false, message: 'خطأ في تسجيل التسديد' });
    });
}

module.exports = {
  listSuppliers,
  createSupplier,
  getSupplierStatement,
  createSupplierPayment,
};

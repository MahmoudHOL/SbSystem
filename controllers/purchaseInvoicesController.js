/**
 * فواتير الشراء - إنشاء وتسجيل الفواتير التي تخص المورد
 */

const { pool } = require('../config/db');
const { recordProductPriceHistoryIfChanged } = require('../utils/recordProductPriceHistory');

const BARCODE_LENGTH = 12;
function normalizeBarcode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, BARCODE_LENGTH);
}

async function createPurchaseInvoice(req, res) {
  const rawSupplier = req.body && req.body.supplier_id;
  let supplierId = null;
  if (rawSupplier !== undefined && rawSupplier !== null && rawSupplier !== '') {
    const parsed = parseInt(rawSupplier, 10);
    if (!isNaN(parsed) && parsed > 0) supplierId = parsed;
  }
  const warehouseId = parseInt(req.body && req.body.warehouse_id, 10);
  const amountPaid = parseFloat(req.body && req.body.amount_paid) || 0;
  const paymentMethodId =
    req.body && req.body.payment_method_id != null && req.body.payment_method_id !== ''
      ? parseInt(req.body.payment_method_id, 10)
      : null;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'اختر المخزن' });
  }

  if (!items.length) {
    return res.status(400).json({ success: false, message: 'السلة فارغة' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [inv] = await conn.execute(
      'INSERT INTO purchase_invoices (supplier_id, warehouse_id, total_amount, amount_paid, payment_method_id, user_id) VALUES (?, ?, 0, ?, ?, ?)',
      [supplierId, warehouseId, amountPaid, paymentMethodId || null, userId]
    );
    const invoiceId = inv.insertId;

    let totalAmount = 0;
    let linesCount = 0;

    for (const row of items) {
      const qty = parseFloat(row.quantity) || 0;
      if (qty <= 0) continue;
      const purchasePrice = parseFloat(row.purchase_price) || 0;
      const salePrice = parseFloat(row.sale_price) || 0;
      const lineTotal = qty * purchasePrice;
      const useSerial = !!(row && (row.use_serial || (Array.isArray(row.serials) && row.serials.length)));
      const rowSerials = Array.isArray(row && row.serials) ? row.serials.map((s) => String(s || '').trim()).filter(Boolean) : [];
      if (useSerial) {
        if (!Number.isInteger(qty)) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ success: false, message: 'الكمية يجب أن تكون عدداً صحيحاً عند استخدام Serial' });
        }
        if (rowSerials.length !== qty) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ success: false, message: 'عدد حقول Serial يجب أن يساوي الكمية لكل صنف' });
        }
        const uniqueSerials = new Set(rowSerials);
        if (uniqueSerials.size !== rowSerials.length) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ success: false, message: 'يوجد Serial مكرر لنفس الصنف' });
        }
      }

      let productId = row.product_id ? parseInt(row.product_id, 10) : null;
      let createdNewProduct = false;

      if (productId) {
        const [prod] = await conn.execute('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
        if (prod.length === 0) productId = null;
      }

      if (!productId && (row.barcode || row.name)) {
        const barcodeDigits = normalizeBarcode(row.barcode || '');
        if (barcodeDigits && barcodeDigits.length !== BARCODE_LENGTH) {
          await conn.rollback();
          conn.release();
          return res.status(400).json({ success: false, message: 'الباركود إن وُجد يجب أن يكون 12 خانة (حروف أو أرقام)' });
        }
        const barcode = barcodeDigits || null;
        const name = (row.name || '').trim() || 'منتج جديد';
        const [ins] = await conn.execute('INSERT INTO products (name, barcode) VALUES (?, ?)', [name, barcode]);
        productId = ins.insertId;
        createdNewProduct = true;
        await conn.execute(
          'INSERT INTO product_prices (product_id, purchase_price, sale_price) VALUES (?, ?, ?)',
          [productId, purchasePrice, salePrice]
        );
      }

      if (!productId) continue;

      if (supplierId) {
        await conn.execute(
          'INSERT IGNORE INTO product_suppliers (product_id, supplier_id) VALUES (?, ?)',
          [productId, supplierId]
        );
      }

      const [ex] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, warehouseId]
      );
      const qBefore = ex.length ? Number(ex[0].quantity) : 0;
      const qAfter = qBefore + qty;
      if (ex.length) {
        await conn.execute('UPDATE warehouse_stock SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?', [qty, ex[0].id]);
      } else {
        await conn.execute('INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, warehouseId, qty]);
      }
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, warehouseId, qBefore, qAfter, userId]
      );

      if (createdNewProduct) {
        await recordProductPriceHistoryIfChanged(conn, {
          productId,
          purchaseBefore: 0,
          saleBefore: 0,
          purchaseAfter: purchasePrice,
          saleAfter: salePrice,
          source: 'purchase_invoice',
          referenceId: invoiceId,
          userId,
        });
      } else {
        const [ppRows] = await conn.execute(
          'SELECT purchase_price, sale_price FROM product_prices WHERE product_id = ? AND deleted_at IS NULL LIMIT 1',
          [productId]
        );
        const oldPur = ppRows.length ? Number(ppRows[0].purchase_price) : 0;
        const oldSale = ppRows.length ? Number(ppRows[0].sale_price) : 0;
        await recordProductPriceHistoryIfChanged(conn, {
          productId,
          purchaseBefore: oldPur,
          saleBefore: oldSale,
          purchaseAfter: purchasePrice,
          saleAfter: salePrice,
          source: 'purchase_invoice',
          referenceId: invoiceId,
          userId,
        });
        if (ppRows.length) {
          await conn.execute(
            'UPDATE product_prices SET purchase_price = ?, sale_price = ?, updated_at = NOW() WHERE product_id = ? AND deleted_at IS NULL',
            [purchasePrice, salePrice, productId]
          );
        } else {
          await conn.execute(
            'INSERT INTO product_prices (product_id, purchase_price, sale_price) VALUES (?, ?, ?)',
            [productId, purchasePrice, salePrice]
          );
        }
      }

      await conn.execute(
        'INSERT INTO purchase_invoice_items (purchase_invoice_id, product_id, quantity, unit_purchase_price, unit_sale_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [invoiceId, productId, qty, purchasePrice, salePrice, lineTotal]
      );
      if (useSerial && rowSerials.length) {
        for (const serialValue of rowSerials) {
          await conn.execute(
            'INSERT INTO `serial` (product_id, serial) VALUES (?, ?)',
            [productId, serialValue]
          );
        }
      }
      linesCount += 1;
      totalAmount += lineTotal;
    }

    if (linesCount === 0) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'لا توجد أصناف صالحة' });
    }

    await conn.execute(
      'UPDATE purchase_invoices SET total_amount = ? WHERE id = ?',
      [totalAmount, invoiceId]
    );

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      message: 'تم تسجيل فاتورة الشراء',
      data: { id: invoiceId, total_amount: totalAmount, amount_paid: amountPaid },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Create purchase invoice error:', err);
    if (err && err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'يوجد Serial مكرر مسبقاً في النظام' });
    }
    res.status(500).json({ success: false, message: 'خطأ في حفظ الفاتورة' });
  }
}

async function createPurchaseReturn(req, res) {
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
      'SELECT supplier_id, warehouse_id FROM purchase_invoices WHERE id = ?',
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
      'SELECT product_id, quantity, unit_purchase_price FROM purchase_invoice_items WHERE purchase_invoice_id = ?',
      [invoiceId]
    );
    const itemMap = new Map();
    itemsRows.forEach((r) => {
      itemMap.set(r.product_id, {
        quantity: Number(r.quantity),
        unit_purchase_price: Number(r.unit_purchase_price),
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
        `SELECT COALESCE(SUM(pri.quantity_returned), 0) AS returned
         FROM purchase_return_items pri
         JOIN purchase_returns pr ON pr.id = pri.purchase_return_id
         WHERE pr.purchase_invoice_id = ? AND pri.product_id = ?`,
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
      if (quantityBefore < qtyRequested) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'الكمية المتاحة في المخزن أقل من الكمية المطلوب إرجاعها لأحد الأصناف',
        });
      }
      const quantityAfter = quantityBefore - qtyRequested;

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

      const unitPrice = invItem.unit_purchase_price;
      const lineTotal = qtyRequested * unitPrice;
      totalReturnAmount += lineTotal;

      returnLines.push({
        product_id: productId,
        quantity_before: quantityBefore,
        quantity_returned: qtyRequested,
        quantity_after: quantityAfter,
        unit_purchase_price: unitPrice,
        line_total: lineTotal,
      });
    }

    if (!returnLines.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'لا توجد أصناف مرتجعة صالحة' });
    }

    const [retIns] = await conn.execute(
      'INSERT INTO purchase_returns (purchase_invoice_id, supplier_id, warehouse_id, total_return_amount, user_id, note) VALUES (?, ?, ?, ?, ?, ?)',
      [invoiceId, supplierId, warehouseId, totalReturnAmount, userId, note || null]
    );
    const returnId = retIns.insertId;

    for (const line of returnLines) {
      await conn.execute(
        `INSERT INTO purchase_return_items
         (purchase_return_id, product_id, quantity_before, quantity_returned, quantity_after, unit_purchase_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          returnId,
          line.product_id,
          line.quantity_before,
          line.quantity_returned,
          line.quantity_after,
          line.unit_purchase_price,
          line.line_total,
        ]
      );
    }

    await conn.commit();
    conn.release();

    res.status(201).json({
      success: true,
      message: 'تم تسجيل مرتجع فاتورة الشراء',
      data: { id: returnId, total_return_amount: totalReturnAmount },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Create purchase return error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ مرتجع الفاتورة' });
  }
}

function listPurchaseInvoices(req, res) {
  const supplierId = req.query.supplier_id;
  const allDates = req.query.all === '1' || req.query.all === 'true';
  let sql = `
    SELECT pi.id, pi.supplier_id, pi.warehouse_id, pi.total_amount, pi.amount_paid, pi.payment_method_id, pi.created_at,
           s.name AS supplier_name, w.name AS warehouse_name,
           pm.name AS payment_method_name,
           (SELECT COUNT(*) FROM purchase_invoice_edit_log WHERE purchase_invoice_id = pi.id) AS edit_count
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON s.id = pi.supplier_id
    LEFT JOIN warehouses w ON w.id = pi.warehouse_id
    LEFT JOIN payment_methods pm ON pm.id = pi.payment_method_id
    WHERE 1=1 AND (pi.deleted_at IS NULL)
  `;
  const params = [];
  if (!allDates) {
    sql += ' AND DATE(pi.created_at) = CURDATE()';
  }
  if (supplierId === 'none' || supplierId === 'null') {
    sql += ' AND pi.supplier_id IS NULL';
  } else if (supplierId !== undefined && supplierId !== '') {
    sql += ' AND pi.supplier_id = ?';
    params.push(supplierId);
  }
  sql += ' ORDER BY pi.created_at DESC LIMIT 500';

  pool
    .execute(sql, params)
    .then(([rows]) => res.json({ success: true, data: rows }))
    .catch((err) => {
      console.error('List purchase invoices error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب الفواتير' });
    });
}

function getPurchaseInvoiceById(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة مطلوب' });
  }

  const sqlHead = `
    SELECT pi.id,
           pi.supplier_id,
           pi.warehouse_id,
           pi.total_amount,
           pi.amount_paid,
           pi.payment_method_id,
           pi.created_at,
           s.name AS supplier_name,
           w.name AS warehouse_name,
           pm.name AS payment_method_name
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON s.id = pi.supplier_id
    LEFT JOIN warehouses w ON w.id = pi.warehouse_id
    LEFT JOIN payment_methods pm ON pm.id = pi.payment_method_id
    WHERE pi.id = ? AND (pi.deleted_at IS NULL)
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
          `SELECT pii.product_id,
                  pii.quantity,
                  pii.unit_purchase_price,
                  pii.unit_sale_price,
                  pii.line_total,
                  p.name AS product_name,
                  p.barcode
           FROM purchase_invoice_items pii
           JOIN products p ON p.id = pii.product_id
           WHERE pii.purchase_invoice_id = ?
           ORDER BY pii.id`,
          [id]
        )
        .then(([items]) => {
          res.json({
            success: true,
            data: {
              id: invoice.id,
              supplier_id: invoice.supplier_id != null ? invoice.supplier_id : '',
              warehouse_id: invoice.warehouse_id,
              supplier_name: invoice.supplier_name || 'بدون مورد',
              warehouse_name: invoice.warehouse_name || '—',
              payment_method_id: invoice.payment_method_id || null,
              payment_method_name: invoice.payment_method_name || null,
              total_amount: Number(invoice.total_amount),
              amount_paid: Number(invoice.amount_paid),
              created_at: invoice.created_at,
              items: (items || []).map((r) => ({
                product_id: r.product_id,
                product_name: r.product_name,
                barcode: r.barcode,
                quantity: Number(r.quantity),
                unit_purchase_price: Number(r.unit_purchase_price),
                unit_sale_price: Number(r.unit_sale_price),
                line_total: Number(r.line_total),
              })),
            },
          });
        });
    })
    .catch((err) => {
      console.error('Get purchase invoice error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب الفاتورة' });
    });
}

/**
 * تعديل فاتورة الشراء بالكامل (رأس + أصناف) مع تصحيح المخزون في قاعدة البيانات
 */
async function updatePurchaseInvoice(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة غير صالح' });
  }

  const rawSupplier = req.body && req.body.supplier_id;
  let supplierId = null;
  if (rawSupplier !== undefined && rawSupplier !== null && rawSupplier !== '') {
    const parsed = parseInt(rawSupplier, 10);
    if (!isNaN(parsed) && parsed > 0) supplierId = parsed;
  }
  const warehouseId = parseInt(req.body && req.body.warehouse_id, 10);
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
      'SELECT id, warehouse_id, supplier_id FROM purchase_invoices WHERE id = ?',
      [id]
    );
    if (!invRows.length) {
      await conn.rollback();
      conn.release();
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
    }
    const oldWarehouseId = invRows[0].warehouse_id;

    const [oldItems] = await conn.execute(
      'SELECT product_id, quantity FROM purchase_invoice_items WHERE purchase_invoice_id = ?',
      [id]
    );

    // عكس الحركة: إرجاع الكميات التي أُضيفت عند إنشاء الفاتورة (خصم من المخزن)
    for (const row of oldItems) {
      const productId = row.product_id;
      const qty = Number(row.quantity);
      const [st] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, oldWarehouseId]
      );
      if (st.length) {
        const newQty = Math.max(0, Number(st[0].quantity) - qty);
        await conn.execute('UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?', [newQty, st[0].id]);
        await conn.execute(
          'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
          [productId, oldWarehouseId, Number(st[0].quantity), newQty, userId]
        );
      }
    }

    await conn.execute('DELETE FROM purchase_invoice_items WHERE purchase_invoice_id = ?', [id]);

    let totalAmount = 0;
    const newWarehouseId = warehouseId;

    for (const row of items) {
      const qty = parseFloat(row.quantity) || 0;
      if (qty <= 0) continue;
      const purchasePrice = parseFloat(row.purchase_price) || 0;
      const salePrice = parseFloat(row.sale_price) || 0;
      const lineTotal = qty * purchasePrice;
      totalAmount += lineTotal;

      const productId = row.product_id ? parseInt(row.product_id, 10) : null;
      if (!productId) continue;

      const [prod] = await conn.execute('SELECT id FROM products WHERE id = ? AND deleted_at IS NULL', [productId]);
      if (!prod.length) continue;

      await conn.execute(
        'INSERT INTO purchase_invoice_items (purchase_invoice_id, product_id, quantity, unit_purchase_price, unit_sale_price, line_total) VALUES (?, ?, ?, ?, ?, ?)',
        [id, productId, qty, purchasePrice, salePrice, lineTotal]
      );

      const [ex] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, newWarehouseId]
      );
      const qBefore = ex.length ? Number(ex[0].quantity) : 0;
      const qAfter = qBefore + qty;
      if (ex.length) {
        await conn.execute('UPDATE warehouse_stock SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?', [qty, ex[0].id]);
      } else {
        await conn.execute('INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)', [productId, newWarehouseId, qty]);
      }
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, newWarehouseId, qBefore, qAfter, userId]
      );

      const [ppRows] = await conn.execute(
        'SELECT purchase_price, sale_price FROM product_prices WHERE product_id = ? AND deleted_at IS NULL LIMIT 1',
        [productId]
      );
      const oldPur = ppRows.length ? Number(ppRows[0].purchase_price) : 0;
      const oldSale = ppRows.length ? Number(ppRows[0].sale_price) : 0;
      await recordProductPriceHistoryIfChanged(conn, {
        productId,
        purchaseBefore: oldPur,
        saleBefore: oldSale,
        purchaseAfter: purchasePrice,
        saleAfter: salePrice,
        source: 'purchase_invoice',
        referenceId: id,
        userId,
      });
      if (ppRows.length) {
        await conn.execute(
          'UPDATE product_prices SET purchase_price = ?, sale_price = ?, updated_at = NOW() WHERE product_id = ? AND deleted_at IS NULL',
          [purchasePrice, salePrice, productId]
        );
      } else {
        await conn.execute(
          'INSERT INTO product_prices (product_id, purchase_price, sale_price) VALUES (?, ?, ?)',
          [productId, purchasePrice, salePrice]
        );
      }
    }

    await conn.execute(
      'UPDATE purchase_invoices SET supplier_id = ?, warehouse_id = ?, total_amount = ?, amount_paid = ?, updated_at = NOW() WHERE id = ?',
      [supplierId, newWarehouseId, totalAmount, amountPaid, id]
    );

    await conn.execute(
      'INSERT INTO purchase_invoice_edit_log (purchase_invoice_id, user_id) VALUES (?, ?)',
      [id, userId]
    );

    await conn.commit();
    conn.release();

    res.json({
      success: true,
      message: 'تم حفظ تعديل الفاتورة في قاعدة البيانات',
      data: { id, total_amount: totalAmount, amount_paid: amountPaid },
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Update purchase invoice error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ تعديل الفاتورة' });
  }
}

function getPurchaseInvoiceEditLog(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة مطلوب' });
  }
  const sql = `
    SELECT piel.id, piel.user_id, piel.edited_at,
           COALESCE(u.full_name, u.username, '—') AS user_name
    FROM purchase_invoice_edit_log piel
    LEFT JOIN users u ON u.id = piel.user_id
    WHERE piel.purchase_invoice_id = ?
    ORDER BY piel.edited_at DESC
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
      console.error('Get purchase invoice edit log error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب سجل التعديلات' });
    });
}

async function deletePurchaseInvoice(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف الفاتورة مطلوب' });
  }
  try {
    const [rows] = await pool.execute('SELECT id FROM purchase_invoices WHERE id = ? AND deleted_at IS NULL', [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة أو محذوفة' });
    }
    await pool.execute('UPDATE purchase_invoices SET deleted_at = NOW() WHERE id = ?', [id]);
    res.json({ success: true, message: 'تم حذف الفاتورة' });
  } catch (err) {
    console.error('Delete purchase invoice error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حذف الفاتورة' });
  }
}

module.exports = {
  createPurchaseInvoice,
  listPurchaseInvoices,
  getPurchaseInvoiceById,
  getPurchaseInvoiceEditLog,
  createPurchaseReturn,
  updatePurchaseInvoice,
  deletePurchaseInvoice,
  // تعديل مبلغ المدفوع فقط (للاستخدام من واجهة سجل الفواتير)
  updateAmountPaid(req, res) {
    const id = parseInt(req.params.id, 10);
    if (!id) {
      return res.status(400).json({ success: false, message: 'معرف الفاتورة غير صالح' });
    }
    const amountPaid = parseFloat(req.body && req.body.amount_paid);
    if (isNaN(amountPaid) || amountPaid < 0) {
      return res.status(400).json({ success: false, message: 'قيمة المدفوع غير صحيحة' });
    }
    pool
      .execute('UPDATE purchase_invoices SET amount_paid = ? WHERE id = ?', [amountPaid, id])
      .then(([result]) => {
        if (!result.affectedRows) {
          return res.status(404).json({ success: false, message: 'الفاتورة غير موجودة' });
        }
        return pool
          .execute(
            'SELECT id, total_amount, amount_paid FROM purchase_invoices WHERE id = ?',
            [id]
          )
          .then(([rows]) => {
            const row = rows[0];
            res.json({
              success: true,
              message: 'تم تحديث المبلغ المدفوع',
              data: {
                id: row.id,
                total_amount: Number(row.total_amount),
                amount_paid: Number(row.amount_paid),
              },
            });
          });
      })
      .catch((err) => {
        console.error('Update amount paid error:', err);
        res.status(500).json({ success: false, message: 'خطأ في تحديث المبلغ المدفوع' });
      });
  },
};

/**
 * تحكم المخازن - عرض القائمة وإضافة مخزن
 */

const { pool } = require('../config/db');
const { getPublicDirForSendFile } = require('../utils/paths');
const publicDir = getPublicDirForSendFile();

function getWarehousesPage(req, res) {
  res.sendFile('warehouses.html', { root: publicDir });
}

function getTransferLogPage(req, res) {
  res.sendFile('transfer-log.html', { root: publicDir });
}

async function listWarehouses(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM warehouses ORDER BY name'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('List warehouses error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب المخازن' });
  }
}

async function createWarehouse(req, res) {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  if (!name) {
    return res.status(400).json({ success: false, message: 'اسم المخزن مطلوب' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO warehouses (name) VALUES (?)',
      [name]
    );
    const [rows] = await pool.execute(
      'SELECT id, name, created_at FROM warehouses WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({
      success: true,
      message: 'تم إضافة المخزن بنجاح',
      data: rows[0],
    });
  } catch (err) {
    console.error('Create warehouse error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'اسم المخزن مستخدم مسبقاً' });
    }
    res.status(500).json({ success: false, message: 'خطأ في إضافة المخزن' });
  }
}

/**
 * جلب كميات المنتجات في مخزن معيّن (للمستخدم لملء حقول الكمية)
 */
async function getWarehouseStock(req, res) {
  const warehouseId = parseInt(req.query.warehouse_id, 10);
  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'معرف المخزن مطلوب' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT product_id, quantity FROM warehouse_stock WHERE warehouse_id = ? AND deleted_at IS NULL',
      [warehouseId]
    );
    const map = {};
    rows.forEach((r) => { map[r.product_id] = Number(r.quantity); });
    res.json({ success: true, data: map });
  } catch (err) { 
    console.error('Get warehouse stock error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب الكميات' });
  }
}

/**
 * تعيين / تحديث كمية المنتج في مخزن (وتسجيل الحركة في stock_movements)
 */
async function setProductStock(req, res) {
  const productId = parseInt(req.body && req.body.product_id, 10);
  const warehouseId = parseInt(req.body && req.body.warehouse_id, 10);
  const quantity = parseFloat(req.body && req.body.quantity);
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!productId || !warehouseId || quantity == null || isNaN(quantity) || quantity < 0) {
    return res.status(400).json({ success: false, message: 'معرف المنتج والمخزن والكمية (عدد ≥ 0) مطلوبة' });
  }

  try {
    const [existing] = await pool.execute(
      'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
      [productId, warehouseId]
    );
    const quantityBefore = existing.length ? Number(existing[0].quantity) : 0;
    const quantityAfter = quantity;

    if (existing.length) {
      await pool.execute('UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?', [quantityAfter, existing[0].id]);
    } else {
      await pool.execute(
        'INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
        [productId, warehouseId, quantityAfter]
      );
    }

    await pool.execute(
      'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
      [productId, warehouseId, quantityBefore, quantityAfter, userId]
    );

    res.json({
      success: true,
      message: 'تم تحديث الكمية',
      data: { product_id: productId, warehouse_id: warehouseId, quantity: quantityAfter },
    });
  } catch (err) {
    console.error('Set product stock error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تحديث الكمية' });
  }
}

/**
 * نقل كميات من مخزن إلى آخر مع التحقق من توفر الكمية
 * يدعم وضعين:
 * - mode = 'partial' مع items [{ product_id, quantity }]
 * - mode = 'all'  لنقل كل الكميات من المخزن المصدر إلى المخزن الهدف
 */
async function transferStock(req, res) {
  const fromWarehouseId = parseInt(req.body && req.body.from_warehouse_id, 10);
  const toWarehouseId = parseInt(req.body && req.body.to_warehouse_id, 10);
  const mode = (req.body && req.body.mode) || 'partial';
  const items = Array.isArray(req.body && req.body.items) ? req.body.items : [];
  const userId = req.session && req.session.userId ? req.session.userId : null;

  if (!fromWarehouseId || !toWarehouseId || fromWarehouseId === toWarehouseId) {
    return res.status(400).json({ success: false, message: 'اختر مخزنين مختلفين للنقل' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // تأكد أن المخازن موجودة
    const [whRows] = await conn.execute(
      'SELECT id FROM warehouses WHERE id IN (?, ?)',
      [fromWarehouseId, toWarehouseId]
    );
    if (!whRows || whRows.length < 2) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'أحد المخازن غير موجود' });
    }

    const transferLines = [];

    if (mode === 'all') {
      // نقل كل كميات المخزن المصدر (خصم من المصدر وإضافة للهدف)
      const [stockRows] = await conn.execute(
        'SELECT id, product_id, quantity FROM warehouse_stock WHERE warehouse_id = ? AND deleted_at IS NULL',
        [fromWarehouseId]
      );
      if (!stockRows.length) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: 'لا توجد كميات في المخزن المصدر' });
      }

      for (const row of stockRows) {
        const productId = row.product_id;
        const qty = Number(row.quantity) || 0;
        if (qty <= 0) continue;
        transferLines.push({ product_id: productId, quantity: qty });

        // خصم من المخزن المصدر
        const quantityBeforeFrom = qty;
        const quantityAfterFrom = 0;
        await conn.execute(
          'UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?',
          [quantityAfterFrom, row.id]
        );
        await conn.execute(
          'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
          [productId, fromWarehouseId, quantityBeforeFrom, quantityAfterFrom, userId]
        );

        // إضافة الكمية إلى المخزن الهدف
        const [destRows] = await conn.execute(
          'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
          [productId, toWarehouseId]
        );
        const quantityBeforeTo = destRows.length ? Number(destRows[0].quantity) : 0;
        const quantityAfterTo = quantityBeforeTo + qty;

        if (destRows.length) {
          await conn.execute(
            'UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?',
            [quantityAfterTo, destRows[0].id]
          );
        } else {
          await conn.execute(
            'INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
            [productId, toWarehouseId, quantityAfterTo]
          );
        }
        await conn.execute(
          'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
          [productId, toWarehouseId, quantityBeforeTo, quantityAfterTo, userId]
        );
      }

      const [ins] = await conn.execute(
        'INSERT INTO stock_transfers (from_warehouse_id, to_warehouse_id, user_id) VALUES (?, ?, ?)',
        [fromWarehouseId, toWarehouseId, userId]
      );
      const transferId = ins.insertId;
      for (const line of transferLines) {
        await conn.execute(
          'INSERT INTO stock_transfer_items (stock_transfer_id, product_id, quantity) VALUES (?, ?, ?)',
          [transferId, line.product_id, line.quantity]
        );
      }

      await conn.commit();
      conn.release();
      return res.json({
        success: true,
        message: 'تم نقل كل كميات المخزن بنجاح',
      });
    }

    // mode = 'partial' نقل أصناف محددة
    if (!items.length) {
      await conn.rollback();
      conn.release();
      return res.status(400).json({ success: false, message: 'أضف صنفاً واحداً على الأقل للنقل' });
    }

    for (const item of items) {
      const productId = item && item.product_id ? parseInt(item.product_id, 10) : NaN;
      const qty = item && item.quantity != null ? parseFloat(item.quantity) : NaN;
      if (!productId || isNaN(qty) || qty <= 0) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({ success: false, message: 'بيانات الأصناف غير صحيحة' });
      }

      const [fromRows] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, fromWarehouseId]
      );
      const available = fromRows.length ? Number(fromRows[0].quantity) : 0;
      if (available < qty) {
        await conn.rollback();
        conn.release();
        return res.status(400).json({
          success: false,
          message: 'الكمية المطلوب نقلها تتجاوز المتاح في المخزن المصدر لأحد الأصناف',
        });
      }

      // خصم من المخزن المصدر
      const quantityBeforeFrom = available;
      const quantityAfterFrom = quantityBeforeFrom - qty;
      await conn.execute(
        'UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?',
        [quantityAfterFrom, fromRows[0].id]
      );
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, fromWarehouseId, quantityBeforeFrom, quantityAfterFrom, userId]
      );

      // إضافة إلى المخزن الهدف
      const [toRows] = await conn.execute(
        'SELECT id, quantity FROM warehouse_stock WHERE product_id = ? AND warehouse_id = ? AND deleted_at IS NULL',
        [productId, toWarehouseId]
      );
      const quantityBeforeTo = toRows.length ? Number(toRows[0].quantity) : 0;
      const quantityAfterTo = quantityBeforeTo + qty;

      if (toRows.length) {
        await conn.execute(
          'UPDATE warehouse_stock SET quantity = ?, updated_at = NOW() WHERE id = ?',
          [quantityAfterTo, toRows[0].id]
        );
      } else {
        await conn.execute(
          'INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
          [productId, toWarehouseId, quantityAfterTo]
        );
      }
      await conn.execute(
        'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, ?, ?, ?)',
        [productId, toWarehouseId, quantityBeforeTo, quantityAfterTo, userId]
      );
      transferLines.push({ product_id: productId, quantity: qty });
    }

    const [ins] = await conn.execute(
      'INSERT INTO stock_transfers (from_warehouse_id, to_warehouse_id, user_id) VALUES (?, ?, ?)',
      [fromWarehouseId, toWarehouseId, userId]
    );
    const transferId = ins.insertId;
    for (const line of transferLines) {
      await conn.execute(
        'INSERT INTO stock_transfer_items (stock_transfer_id, product_id, quantity) VALUES (?, ?, ?)',
        [transferId, line.product_id, line.quantity]
      );
    }

    await conn.commit();
    conn.release();
    return res.json({
      success: true,
      message: 'تم نقل الكميات بنجاح',
    });
  } catch (err) {
    await conn.rollback();
    conn.release();
    console.error('Transfer stock error:', err);
    res.status(500).json({ success: false, message: 'خطأ في تنفيذ عملية النقل' });
  }
}

/**
 * سجل عمليات نقل المخزون (من أين إلى أين، من قام، تفاصيل المنتجات والكميات)
 */
async function listStockTransfers(req, res) {
  const fromId = req.query.from_warehouse_id;
  const toId = req.query.to_warehouse_id;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);

  let sql = `
    SELECT st.id, st.from_warehouse_id, st.to_warehouse_id, st.user_id, st.transferred_at,
           fw.name AS from_warehouse_name, tw.name AS to_warehouse_name,
           COALESCE(u.full_name, u.username, '—') AS user_name
    FROM stock_transfers st
    JOIN warehouses fw ON fw.id = st.from_warehouse_id
    JOIN warehouses tw ON tw.id = st.to_warehouse_id
    LEFT JOIN users u ON u.id = st.user_id
    WHERE 1=1
  `;
  const params = [];
  if (fromId) { sql += ' AND st.from_warehouse_id = ?'; params.push(fromId); }
  if (toId) { sql += ' AND st.to_warehouse_id = ?'; params.push(toId); }
  sql += ' ORDER BY st.transferred_at DESC LIMIT ' + parseInt(limit, 10);

  try {
    const [rows] = await pool.execute(sql, params);
    const ids = (rows || []).map((r) => r.id);
    if (ids.length === 0) {
      return res.json({ success: true, data: [] });
    }
    const placeholders = ids.map(() => '?').join(',');
    const [itemsRows] = await pool.execute(
      `SELECT sti.stock_transfer_id, sti.product_id, sti.quantity, p.name AS product_name, p.barcode
       FROM stock_transfer_items sti
       JOIN products p ON p.id = sti.product_id
       WHERE sti.stock_transfer_id IN (${placeholders})
       ORDER BY sti.stock_transfer_id, sti.id`,
      ids
    );
    const itemsByTransfer = {};
    (itemsRows || []).forEach((r) => {
      const tid = r.stock_transfer_id;
      if (!itemsByTransfer[tid]) itemsByTransfer[tid] = [];
      itemsByTransfer[tid].push({
        product_id: r.product_id,
        product_name: r.product_name || '—',
        barcode: r.barcode || '—',
        quantity: Number(r.quantity),
      });
    });
    const data = (rows || []).map((r) => ({
      id: r.id,
      from_warehouse_id: r.from_warehouse_id,
      to_warehouse_id: r.to_warehouse_id,
      from_warehouse_name: r.from_warehouse_name || '—',
      to_warehouse_name: r.to_warehouse_name || '—',
      user_name: r.user_name || '—',
      transferred_at: r.transferred_at,
      items: itemsByTransfer[r.id] || [],
    }));
    res.json({ success: true, data });
  } catch (err) {
    console.error('List stock transfers error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب سجل النقل' });
  }
}

/**
 * تقرير المخازن: عدد المنتجات (الأصناف) وإجمالي الكمية بكل مخزن
 */
async function getWarehousesProductsReport(req, res) {
  try {
    const [rows] = await pool.execute(
      `SELECT
         w.id,
         w.name,
         COUNT(DISTINCT CASE WHEN ws.deleted_at IS NULL AND ws.quantity > 0 THEN ws.product_id END) AS products_count,
         COALESCE(SUM(CASE WHEN ws.deleted_at IS NULL THEN ws.quantity ELSE 0 END), 0) AS total_quantity
       FROM warehouses w
       LEFT JOIN warehouse_stock ws ON ws.warehouse_id = w.id
       GROUP BY w.id, w.name
       ORDER BY w.name`
    );

    const data = (rows || []).map((r) => ({
      id: r.id,
      name: r.name || '—',
      products_count: Number(r.products_count) || 0,
      total_quantity: Number(r.total_quantity) || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Get warehouses products report error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب تقرير المخازن' });
  }
}

/**
 * تفاصيل مخزون مخزن معيّن: كل منتج وكميته داخل المخزن
 */
async function getWarehouseProductsDetails(req, res) {
  const warehouseId = parseInt(req.query.warehouse_id, 10);
  if (!warehouseId) {
    return res.status(400).json({ success: false, message: 'معرف المخزن مطلوب' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         p.barcode,
         ws.quantity,
         COALESCE(pp.sale_price, 0) AS unit_price
       FROM warehouse_stock ws
       JOIN products p ON p.id = ws.product_id
       LEFT JOIN (
         SELECT pp1.product_id, pp1.sale_price
         FROM product_prices pp1
         INNER JOIN (
           SELECT product_id, MAX(id) AS max_id
           FROM product_prices
           WHERE deleted_at IS NULL
           GROUP BY product_id
         ) pp2 ON pp2.max_id = pp1.id
       ) pp ON pp.product_id = p.id
       WHERE ws.warehouse_id = ?
         AND ws.deleted_at IS NULL
         AND p.deleted_at IS NULL
         AND ws.quantity > 0
       ORDER BY p.name`,
      [warehouseId]
    );

    const data = (rows || []).map((r) => ({
      product_id: r.product_id,
      product_name: r.product_name || '—',
      barcode: r.barcode || '—',
      quantity: Number(r.quantity) || 0,
      unit_price: Number(r.unit_price) || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error('Get warehouse products details error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب تفاصيل مخزن المنتجات' });
  }
}

/**
 * ملخص «كل المخازن»: عدد أصناف فريدة، صفوف وصلت للحد الأدنى (كمية > 0 و ≤ الحد)، صفوف نفدت (كمية ≤ 0)
 */
async function getWarehousesGlobalStockSummary(req, res) {
  try {
    const [d1] = await pool.execute(
      'SELECT COUNT(*) AS total_products FROM products WHERE deleted_at IS NULL'
    );

    const [d2] = await pool.execute(
      `SELECT COUNT(*) AS at_minimum_lines
       FROM warehouse_stock ws
       INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
       LEFT JOIN product_minimum_stock pms ON pms.product_id = p.id
       LEFT JOIN (SELECT default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1) mdef ON 1=1
       WHERE ws.deleted_at IS NULL
         AND ws.quantity > 0
         AND ws.quantity <= COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0)`
    );

    const [d3] = await pool.execute(
      `SELECT COUNT(*) AS out_of_stock_lines
       FROM warehouse_stock ws
       INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
       WHERE ws.deleted_at IS NULL AND ws.quantity <= 0`
    );

    res.json({
      success: true,
      data: {
        total_products_count: Number(d1[0] && d1[0].total_products) || 0,
        at_minimum_count: Number(d2[0] && d2[0].at_minimum_lines) || 0,
        out_of_stock_count: Number(d3[0] && d3[0].out_of_stock_lines) || 0,
      },
    });
  } catch (err) {
    console.error('Get warehouses global stock summary error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب ملخص المخازن' });
  }
}

/**
 * قائمة تفصيلية: type=at_minimum | out_of_stock
 */
async function getWarehousesStockAlertsList(req, res) {
  const type = (req.query.type || '').trim();
  if (type !== 'at_minimum' && type !== 'out_of_stock') {
    return res.status(400).json({ success: false, message: 'type غير صالح (at_minimum | out_of_stock)' });
  }

  try {
    let sql;
    if (type === 'at_minimum') {
      sql = `
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.barcode,
          w.id AS warehouse_id,
          w.name AS warehouse_name,
          ws.quantity AS quantity,
          COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0) AS effective_minimum
        FROM warehouse_stock ws
        INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
        INNER JOIN warehouses w ON w.id = ws.warehouse_id
        LEFT JOIN product_minimum_stock pms ON pms.product_id = p.id
        LEFT JOIN (SELECT default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1) mdef ON 1=1
        WHERE ws.deleted_at IS NULL
          AND ws.quantity > 0
          AND ws.quantity <= COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0)
        ORDER BY w.name, p.name`;
    } else {
      sql = `
        SELECT
          p.id AS product_id,
          p.name AS product_name,
          p.barcode,
          w.id AS warehouse_id,
          w.name AS warehouse_name,
          ws.quantity AS quantity
        FROM warehouse_stock ws
        INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
        INNER JOIN warehouses w ON w.id = ws.warehouse_id
        WHERE ws.deleted_at IS NULL AND ws.quantity <= 0
        ORDER BY w.name, p.name`;
    }

    const [rows] = await pool.execute(sql);
    const data = (rows || []).map((r) => {
      const base = {
        product_id: r.product_id,
        product_name: r.product_name || '—',
        barcode: r.barcode || '—',
        warehouse_id: r.warehouse_id,
        warehouse_name: r.warehouse_name || '—',
        quantity: Number(r.quantity) || 0,
      };
      if (type === 'at_minimum') {
        base.effective_minimum = Number(r.effective_minimum) || 0;
      }
      return base;
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('Get warehouses stock alerts list error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب قائمة التنبيهات' });
  }
}

/**
 * الحد الأدنى الافتراضي العام للمخزون
 */
async function getMinimumStockDefault(req, res) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1'
    );
    if (!rows || !rows.length) {
      return res.json({ success: true, data: { default_minimum_quantity: 0 } });
    }
    res.json({
      success: true,
      data: { default_minimum_quantity: Number(rows[0].default_minimum_quantity) || 0 },
    });
  } catch (err) {
    console.error('Get minimum stock default error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب الحد الأدنى الافتراضي' });
  }
}

async function setMinimumStockDefault(req, res) {
  const v = req.body && req.body.default_minimum_quantity != null
    ? parseFloat(req.body.default_minimum_quantity)
    : NaN;
  if (Number.isNaN(v) || v < 0) {
    return res.status(400).json({ success: false, message: 'قيمة الحد الأدنى الافتراضي يجب أن تكون رقماً ≥ 0' });
  }
  try {
    await pool.execute(
      'UPDATE minimum_stock_default SET default_minimum_quantity = ? WHERE id = 1',
      [v]
    );
    res.json({ success: true, message: 'تم حفظ الحد الأدنى الافتراضي', data: { default_minimum_quantity: v } });
  } catch (err) {
    console.error('Set minimum stock default error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ الحد الأدنى الافتراضي' });
  }
}

/**
 * حد أدنى لمنتج واحد: رقم محدد، أو إزالة الصف للاعتماد على الافتراضي العام
 */
async function setProductMinimumStock(req, res) {
  const productId = parseInt(req.params.productId, 10);
  if (!productId) {
    return res.status(400).json({ success: false, message: 'معرف المنتج غير صالح' });
  }

  const raw = req.body && Object.prototype.hasOwnProperty.call(req.body, 'minimum_quantity')
    ? req.body.minimum_quantity
    : undefined;

  try {
    const [prod] = await pool.execute(
      'SELECT id FROM products WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [productId]
    );
    if (!prod || !prod.length) {
      return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
    }

    if (raw === null || raw === '' || (typeof raw === 'string' && raw.trim() === '')) {
      await pool.execute('DELETE FROM product_minimum_stock WHERE product_id = ?', [productId]);
      return res.json({
        success: true,
        message: 'تم الإبقاء على الحد الافتراضي العام لهذا المنتج',
      });
    }

    const qty = parseFloat(raw);
    if (Number.isNaN(qty) || qty < 0) {
      return res.status(400).json({ success: false, message: 'الحد الأدنى يجب أن يكون رقماً ≥ 0' });
    }

    await pool.execute(
      `INSERT INTO product_minimum_stock (product_id, minimum_quantity)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE minimum_quantity = VALUES(minimum_quantity), updated_at = NOW()`,
      [productId, qty]
    );
    res.json({ success: true, message: 'تم حفظ الحد الأدنى للمنتج' });
  } catch (err) {
    console.error('Set product minimum stock error:', err);
    res.status(500).json({ success: false, message: 'خطأ في حفظ الحد الأدنى' });
  }
}

/**
 * تطبيق حد أدنى على المنتجات التي ليس لها حد محدد (لا صف أو minimum_quantity = NULL)
 */
async function applyMinimumStockToUnsetProducts(req, res) {
  const v = req.body && req.body.minimum_quantity != null
    ? parseFloat(req.body.minimum_quantity)
    : NaN;
  if (Number.isNaN(v) || v < 0) {
    return res.status(400).json({ success: false, message: 'أدخل قيمة حد أدنى صالحة (≥ 0)' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO product_minimum_stock (product_id, minimum_quantity)
       SELECT p.id, ?
       FROM products p
       WHERE p.deleted_at IS NULL
         AND (
           NOT EXISTS (SELECT 1 FROM product_minimum_stock x WHERE x.product_id = p.id)
           OR EXISTS (
             SELECT 1 FROM product_minimum_stock x
             WHERE x.product_id = p.id AND x.minimum_quantity IS NULL
           )
         )
       ON DUPLICATE KEY UPDATE
         minimum_quantity = VALUES(minimum_quantity),
         updated_at = NOW()`,
      [v]
    );
    const affected = result.affectedRows != null ? result.affectedRows : 0;
    res.json({
      success: true,
      message: 'تم تطبيق الحد الأدنى على المنتجات التي لم يكن لها حد محدد',
      data: { affected_rows: affected },
    });
  } catch (err) {
    console.error('Apply minimum stock to unset error:', err);
    res.status(500).json({ success: false, message: 'خطأ في التطبيق الجماعي' });
  }
}

/**
 * إشعارات لوحة التحكم للمخزون:
 * - منتهي (quantity <= 0)
 * - أوشك على الانتهاء (quantity > 0 && quantity <= الحد الأدنى الفعّال)
 */
async function getDashboardStockNotifications(req, res) {
  const limit = Math.min(parseInt(req.query.limit, 10) || 60, 200);

  try {
    const [countsRows] = await pool.execute(
      `SELECT
         SUM(CASE WHEN ws.quantity <= 0 THEN 1 ELSE 0 END) AS out_of_stock_count,
         SUM(
           CASE
             WHEN ws.quantity > 0
                  AND ws.quantity <= COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0)
             THEN 1 ELSE 0
           END
         ) AS low_stock_count
       FROM warehouse_stock ws
       INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
       LEFT JOIN product_minimum_stock pms ON pms.product_id = p.id
       LEFT JOIN (SELECT default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1) mdef ON 1=1
       WHERE ws.deleted_at IS NULL`
    );

    const [rows] = await pool.execute(
      `(
         SELECT
           'out_of_stock' AS alert_type,
           p.id AS product_id,
           p.name AS product_name,
           p.barcode,
           w.id AS warehouse_id,
           w.name AS warehouse_name,
           ws.quantity AS quantity,
           COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0) AS effective_minimum
         FROM warehouse_stock ws
         INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
         INNER JOIN warehouses w ON w.id = ws.warehouse_id
         LEFT JOIN product_minimum_stock pms ON pms.product_id = p.id
         LEFT JOIN (SELECT default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1) mdef ON 1=1
         WHERE ws.deleted_at IS NULL AND ws.quantity <= 0
       )
       UNION ALL
       (
         SELECT
           'low_stock' AS alert_type,
           p.id AS product_id,
           p.name AS product_name,
           p.barcode,
           w.id AS warehouse_id,
           w.name AS warehouse_name,
           ws.quantity AS quantity,
           COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0) AS effective_minimum
         FROM warehouse_stock ws
         INNER JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
         INNER JOIN warehouses w ON w.id = ws.warehouse_id
         LEFT JOIN product_minimum_stock pms ON pms.product_id = p.id
         LEFT JOIN (SELECT default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1) mdef ON 1=1
         WHERE ws.deleted_at IS NULL
           AND ws.quantity > 0
           AND ws.quantity <= COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0)
       )
       LIMIT ${parseInt(limit, 10)}`
    );

    const data = (rows || []).map((r) => ({
      alert_type: r.alert_type === 'out_of_stock' ? 'out_of_stock' : 'low_stock',
      product_id: r.product_id,
      product_name: r.product_name || '—',
      barcode: r.barcode || '—',
      warehouse_id: r.warehouse_id,
      warehouse_name: r.warehouse_name || '—',
      quantity: Number(r.quantity) || 0,
      effective_minimum: Number(r.effective_minimum) || 0,
    }));

    const counts = countsRows && countsRows[0] ? countsRows[0] : {};
    res.json({
      success: true,
      data: {
        counts: {
          out_of_stock: Number(counts.out_of_stock_count) || 0,
          low_stock: Number(counts.low_stock_count) || 0,
        },
        items: data,
      },
    });
  } catch (err) {
    console.error('Get dashboard stock notifications error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب إشعارات المخزون' });
  }
}

async function getWarehousesAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }

  const checks = [
    { key: 'tab_warehouses', module_key: 'warehouses.tabs.warehouses', action_key: 'view' },
    { key: 'tab_dispatch', module_key: 'warehouses.tabs.dispatch', action_key: 'view' },
    { key: 'tab_suppliers_list', module_key: 'warehouses.tabs.suppliers_list', action_key: 'view' },
    { key: 'dispatch_create_supplier', module_key: 'warehouses.dispatch', action_key: 'create_supplier' },
    { key: 'dispatch_search', module_key: 'warehouses.dispatch', action_key: 'search' },
    { key: 'dispatch_add_product', module_key: 'warehouses.dispatch', action_key: 'add_product' },
    { key: 'products_minimum_stock', module_key: 'warehouses.products', action_key: 'minimum_stock' },
    { key: 'products_edit', module_key: 'warehouses.products', action_key: 'edit' },
    { key: 'products_suppliers', module_key: 'warehouses.products', action_key: 'suppliers' },
    { key: 'products_delete', module_key: 'warehouses.products', action_key: 'delete' },
    { key: 'suppliers_statement', module_key: 'warehouses.suppliers', action_key: 'statement' },
    { key: 'log_edit_amount', module_key: 'warehouses.log', action_key: 'edit_amount' },
    { key: 'log_edit_invoice', module_key: 'warehouses.log', action_key: 'edit_invoice' },
    { key: 'log_delete_invoice', module_key: 'warehouses.log', action_key: 'delete_invoice' },
  ];

  if (username === 'admin') {
    const all = {};
    checks.forEach((c) => { all[c.key] = true; });
    return res.json({ success: true, data: all });
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
    console.error('Get warehouses access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات المخازن' });
  }
}

async function getInventorySalesInsights(req, res) {
  const warehouseIdRaw = (req.query && req.query.warehouse_id) ? String(req.query.warehouse_id).trim() : 'all';
  const useAllWarehouses = !warehouseIdRaw || warehouseIdRaw === 'all';
  const warehouseId = useAllWarehouses ? null : parseInt(warehouseIdRaw, 10);
  if (!useAllWarehouses && !warehouseId) {
    return res.status(400).json({ success: false, message: 'معرف المخزن غير صالح' });
  }

  const fromDateRaw = req.query && req.query.from_date ? String(req.query.from_date).trim().slice(0, 10) : '';
  const toDateRaw = req.query && req.query.to_date ? String(req.query.to_date).trim().slice(0, 10) : '';
  const hasFrom = /^\d{4}-\d{2}-\d{2}$/.test(fromDateRaw);
  const hasTo = /^\d{4}-\d{2}-\d{2}$/.test(toDateRaw);

  let saleDateCondition = '';
  const saleDateParams = [];
  if (hasFrom && hasTo) {
    saleDateCondition = ' AND DATE(si.created_at) BETWEEN ? AND ?';
    saleDateParams.push(fromDateRaw, toDateRaw);
  } else if (hasFrom) {
    saleDateCondition = ' AND DATE(si.created_at) >= ?';
    saleDateParams.push(fromDateRaw);
  } else if (hasTo) {
    saleDateCondition = ' AND DATE(si.created_at) <= ?';
    saleDateParams.push(toDateRaw);
  }

  const inventoryWhere = useAllWarehouses ? '' : ' AND ws.warehouse_id = ?';
  const inventoryParams = useAllWarehouses ? [] : [warehouseId];

  const salesWarehouseWhere = useAllWarehouses ? '' : ' AND si.warehouse_id = ?';
  const salesWarehouseParams = useAllWarehouses ? [] : [warehouseId];

  try {
    const [totalValueRows] = await pool.execute(
      `SELECT
         COALESCE(SUM(ws.quantity * COALESCE(pp.purchase_price, 0)), 0) AS inventory_value
       FROM warehouse_stock ws
       JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
       LEFT JOIN (
         SELECT pp1.product_id, pp1.purchase_price
         FROM product_prices pp1
         INNER JOIN (
           SELECT product_id, MAX(id) AS max_id
           FROM product_prices
           WHERE deleted_at IS NULL
           GROUP BY product_id
         ) pp2 ON pp2.max_id = pp1.id
       ) pp ON pp.product_id = ws.product_id
       WHERE ws.deleted_at IS NULL`,
      []
    );

    const [selectedValueRows] = await pool.execute(
      `SELECT
         COALESCE(SUM(ws.quantity * COALESCE(pp.purchase_price, 0)), 0) AS inventory_value
       FROM warehouse_stock ws
       JOIN products p ON p.id = ws.product_id AND p.deleted_at IS NULL
       LEFT JOIN (
         SELECT pp1.product_id, pp1.purchase_price
         FROM product_prices pp1
         INNER JOIN (
           SELECT product_id, MAX(id) AS max_id
           FROM product_prices
           WHERE deleted_at IS NULL
           GROUP BY product_id
         ) pp2 ON pp2.max_id = pp1.id
       ) pp ON pp.product_id = ws.product_id
       WHERE ws.deleted_at IS NULL${inventoryWhere}`,
      inventoryParams
    );

    const topSellingParams = [];
    topSellingParams.push.apply(topSellingParams, salesWarehouseParams);
    topSellingParams.push.apply(topSellingParams, saleDateParams);
    const [topSellingRows] = await pool.execute(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         COUNT(DISTINCT si.id) AS sale_times,
         COALESCE(SUM(sii.quantity), 0) AS quantity_sold,
         COALESCE(SUM(sii.line_total), 0) AS sales_amount
       FROM sale_invoice_items sii
       INNER JOIN sale_invoices si ON si.id = sii.sale_invoice_id
       INNER JOIN products p ON p.id = sii.product_id
       WHERE si.deleted_at IS NULL
         AND p.deleted_at IS NULL
         ${salesWarehouseWhere}
         ${saleDateCondition}
       GROUP BY p.id, p.name
       ORDER BY quantity_sold DESC, sale_times DESC, p.name
       LIMIT 10`,
      topSellingParams
    );

    const allProductsParams = [];
    allProductsParams.push.apply(allProductsParams, salesWarehouseParams);
    allProductsParams.push.apply(allProductsParams, saleDateParams);
    const [allProductsRows] = await pool.execute(
      `SELECT
         p.id AS product_id,
         p.name AS product_name,
         COUNT(DISTINCT si.id) AS sale_times,
         COALESCE(SUM(sii.quantity), 0) AS quantity_sold,
         COALESCE(SUM(sii.line_total), 0) AS sales_amount
       FROM sale_invoice_items sii
       INNER JOIN sale_invoices si ON si.id = sii.sale_invoice_id
       INNER JOIN products p ON p.id = sii.product_id
       WHERE si.deleted_at IS NULL
         AND p.deleted_at IS NULL
         ${salesWarehouseWhere}
         ${saleDateCondition}
       GROUP BY p.id, p.name
       ORDER BY sale_times DESC, quantity_sold DESC, p.name`,
      allProductsParams
    );

    const totalsParams = [];
    totalsParams.push.apply(totalsParams, salesWarehouseParams);
    totalsParams.push.apply(totalsParams, saleDateParams);
    const [totalsRows] = await pool.execute(
      `SELECT
         COALESCE(SUM(sii.quantity), 0) AS total_sold_items
       FROM sale_invoice_items sii
       INNER JOIN sale_invoices si ON si.id = sii.sale_invoice_id
       INNER JOIN products p ON p.id = sii.product_id
       WHERE si.deleted_at IS NULL
         AND p.deleted_at IS NULL
         ${salesWarehouseWhere}
         ${saleDateCondition}`,
      totalsParams
    );

    res.json({
      success: true,
      data: {
        inventory_value_total: Number(totalValueRows[0] && totalValueRows[0].inventory_value) || 0,
        inventory_value_selected: Number(selectedValueRows[0] && selectedValueRows[0].inventory_value) || 0,
        total_sold_items: Number(totalsRows[0] && totalsRows[0].total_sold_items) || 0,
        top_selling: (topSellingRows || []).map((r) => ({
          product_id: r.product_id,
          product_name: r.product_name || '—',
          sale_times: Number(r.sale_times) || 0,
          quantity_sold: Number(r.quantity_sold) || 0,
          sales_amount: Number(r.sales_amount) || 0,
        })),
        products_sales: (allProductsRows || []).map((r) => ({
          product_id: r.product_id,
          product_name: r.product_name || '—',
          sale_times: Number(r.sale_times) || 0,
          quantity_sold: Number(r.quantity_sold) || 0,
          sales_amount: Number(r.sales_amount) || 0,
        })),
      },
    });
  } catch (err) {
    console.error('Get inventory sales insights error:', err);
    res.status(500).json({ success: false, message: 'خطأ في جلب تحليل البضاعة والمبيعات' });
  }
}

module.exports = {
  getWarehousesPage,
  getTransferLogPage,
  listWarehouses,
  createWarehouse,
  getWarehouseStock,
  setProductStock,
  transferStock,
  listStockTransfers,
  getWarehousesProductsReport,
  getWarehouseProductsDetails,
  getWarehousesGlobalStockSummary,
  getWarehousesStockAlertsList,
  getMinimumStockDefault,
  setMinimumStockDefault,
  setProductMinimumStock,
  applyMinimumStockToUnsetProducts,
  getDashboardStockNotifications,
  getInventorySalesInsights,
  getWarehousesAccess,
};

/**
 * تحكم المنتجات - قائمة، إضافة، حذف ناعم
 * مع أسعار الشراء والبيع من product_prices
 */

const { pool } = require('../config/db');
const { recordProductPriceHistoryIfChanged } = require('../utils/recordProductPriceHistory');

const BARCODE_LENGTH = 12;
const SUPPLIER_NAME_SEPARATOR = '، ';

function normalizeBarcode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, BARCODE_LENGTH);
}

function parseSupplierIdsFromBody(body) {
  if (!body || !Object.prototype.hasOwnProperty.call(body, 'supplier_ids')) return null;
  const raw = body.supplier_ids;
  const values = Array.isArray(raw) ? raw : [raw];
  const ids = values
    .map((v) => parseInt(v, 10))
    .filter((v) => !Number.isNaN(v) && v > 0);
  return Array.from(new Set(ids));
}

function fetchProductWithSuppliers(conn, productId) {
  return conn.execute(
    `SELECT p.id, p.name, p.barcode, p.created_at,
            pp.purchase_price, pp.sale_price,
            GROUP_CONCAT(ps.supplier_id ORDER BY ps.supplier_id SEPARATOR ',') AS supplier_ids_csv,
            GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR ?) AS supplier_names
     FROM products p
     LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.deleted_at IS NULL
     LEFT JOIN product_suppliers ps ON ps.product_id = p.id
     LEFT JOIN suppliers s ON s.id = ps.supplier_id
     WHERE p.id = ?
     GROUP BY p.id, p.name, p.barcode, p.created_at, pp.purchase_price, pp.sale_price`,
    [SUPPLIER_NAME_SEPARATOR, productId]
  );
}

function listProducts(req, res) {
  const includeDeleted = req.query.deleted === '1';

  let sql = `
    SELECT p.id, p.name, p.barcode, p.deleted_at, p.created_at,
           pp.purchase_price, pp.sale_price,
           COALESCE(ws.total_quantity, 0) AS total_quantity,
           mdef.default_minimum_quantity AS default_minimum_quantity,
           pms.minimum_quantity AS minimum_stock_override,
           COALESCE(pms.minimum_quantity, mdef.default_minimum_quantity, 0) AS effective_minimum_quantity,
           (pms.minimum_quantity IS NOT NULL) AS has_custom_minimum,
           GROUP_CONCAT(ps.supplier_id ORDER BY ps.supplier_id SEPARATOR ',') AS supplier_ids_csv,
           GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR '${SUPPLIER_NAME_SEPARATOR}') AS supplier_names
    FROM products p
    LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.deleted_at IS NULL
    LEFT JOIN product_suppliers ps ON ps.product_id = p.id
    LEFT JOIN suppliers s ON s.id = ps.supplier_id
    LEFT JOIN (
      SELECT product_id, SUM(quantity) AS total_quantity
      FROM warehouse_stock
      WHERE deleted_at IS NULL
      GROUP BY product_id
    ) ws ON ws.product_id = p.id
    LEFT JOIN product_minimum_stock pms ON pms.product_id = p.id
    LEFT JOIN (SELECT default_minimum_quantity FROM minimum_stock_default WHERE id = 1 LIMIT 1) mdef ON 1=1
    WHERE 1=1
  `;
  if (!includeDeleted) {
    sql += ' AND p.deleted_at IS NULL';
  }
  sql += `
    GROUP BY
      p.id, p.name, p.barcode, p.deleted_at, p.created_at,
      pp.purchase_price, pp.sale_price,
      ws.total_quantity,
      mdef.default_minimum_quantity,
      pms.minimum_quantity
    ORDER BY p.name
  `;

  pool
    .execute(sql)
    .then(([rows]) => {
      res.json({ success: true, data: rows });
    })
    .catch((err) => {
      console.error('List products error:', err);
      res.status(500).json({ success: false, message: 'خطأ في جلب المنتجات' });
    });
}

function createProduct(req, res) {
  const name = (req.body && req.body.name) ? String(req.body.name).trim() : '';
  let barcode = (req.body && req.body.barcode) ? normalizeBarcode(req.body.barcode) : '';
  const purchasePrice = parseFloat(req.body && req.body.purchase_price) || 0;
  const salePrice = parseFloat(req.body && req.body.sale_price) || 0;
  const warehouseId = req.body && req.body.warehouse_id ? parseInt(req.body.warehouse_id, 10) : 0;
  const quantity = req.body && req.body.quantity != null ? parseFloat(req.body.quantity) : null;
  const userId = req.session && req.session.userId ? req.session.userId : null;
  const supplierIds = parseSupplierIdsFromBody(req.body) || [];

  if (!name) {
    return res.status(400).json({ success: false, message: 'اسم المنتج مطلوب' });
  }
  if (barcode.length !== BARCODE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: 'الباركود يجب أن يكون 12 خانة (حروف أو أرقام) بالضبط',
    });
  }

  pool
    .getConnection()
    .then((conn) => {
      const verifySupplier = () => {
        if (!supplierIds.length) return Promise.resolve();
        const placeholders = supplierIds.map(() => '?').join(',');
        return conn
          .execute(`SELECT id FROM suppliers WHERE id IN (${placeholders})`, supplierIds)
          .then(([srows]) => {
            if ((srows || []).length !== supplierIds.length) {
              const err = new Error('INVALID_SUPPLIER');
              err.code = 'INVALID_SUPPLIER';
              throw err;
            }
          });
      };
      return verifySupplier()
        .then(() => conn.execute('INSERT INTO products (name, barcode) VALUES (?, ?)', [name, barcode]))
        .then(([insertResult]) => {
          const productId = insertResult.insertId;
          return conn
            .execute(
              'INSERT INTO product_prices (product_id, purchase_price, sale_price) VALUES (?, ?, ?)',
              [productId, purchasePrice, salePrice]
            )
            .then(() =>
              recordProductPriceHistoryIfChanged(conn, {
                productId,
                purchaseBefore: 0,
                saleBefore: 0,
                purchaseAfter: purchasePrice,
                saleAfter: salePrice,
                source: 'product_create',
                referenceId: null,
                userId,
              })
            )
            .then(() => {
              if (warehouseId && quantity != null && !isNaN(quantity) && quantity >= 0) {
                return conn
                  .execute(
                    'INSERT INTO warehouse_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updated_at = NOW()',
                    [productId, warehouseId, quantity]
                  )
                  .then(() =>
                    conn.execute(
                      'INSERT INTO stock_movements (product_id, warehouse_id, quantity_before, quantity_after, user_id) VALUES (?, ?, 0, ?, ?)',
                      [productId, warehouseId, quantity, userId]
                    )
                  )
                  .then(() => productId);
              }
              return productId;
            })
            .then((id) => {
              if (!supplierIds.length) return id;
              const placeholders = supplierIds.map(() => '(?, ?)').join(',');
              const params = [];
              supplierIds.forEach((sid) => {
                params.push(id, sid);
              });
              return conn
                .execute(
                  `INSERT INTO product_suppliers (product_id, supplier_id) VALUES ${placeholders}`,
                  params
                )
                .then(() => id);
            })
            .then(() =>
              fetchProductWithSuppliers(conn, productId)
            )
            .then(([rows]) => {
              conn.release();
              return rows[0];
            });
        })
        .catch((err) => {
          conn.release();
          throw err;
        });
    })
    .then((product) => {
      res.status(201).json({
        success: true,
        message: 'تم إضافة المنتج بنجاح',
        data: product,
      });
    })
    .catch((err) => {
      console.error('Create product error:', err);
      if (err.code === 'INVALID_SUPPLIER') {
        return res.status(400).json({ success: false, message: 'المورد غير موجود' });
      }
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ success: false, message: 'الباركود مستخدم مسبقاً' });
      }
      res.status(500).json({ success: false, message: 'خطأ في إضافة المنتج' });
    });
}

function softDeleteProduct(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المنتج غير صالح' });
  }

  pool
    .getConnection()
    .then((conn) => {
      return conn
        .execute('SELECT id, barcode FROM products WHERE id = ? AND deleted_at IS NULL', [id])
        .then(([rows]) => {
          if (!rows.length) {
            conn.release();
            return res.status(404).json({ success: false, message: 'المنتج غير موجود أو محذوف مسبقاً' });
          }
          // تغيـير الباركود لقيمة جديدة بطول 12 حرفاً حتى لا يتصادم مع المنتجات الجديدة
          // مثال: DEL + id مبطّن بـ 9 خانات => DEL000000123
          const newBarcode = `DEL${String(id).padStart(9, '0')}`.slice(0, 12);
          return conn
            .execute('UPDATE products SET deleted_at = NOW(), barcode = ? WHERE id = ?', [newBarcode, id])
            .then(() => conn.execute('UPDATE product_prices SET deleted_at = NOW() WHERE product_id = ?', [id]))
            .then(() => {
              conn.release();
              res.json({ success: true, message: 'تم حذف المنتج (حذف ناعم)' });
            });
        })
        .catch((err) => {
          conn.release();
          throw err;
        });
    })
    .catch((err) => {
      console.error('Soft delete product error:', err);
      res.status(500).json({ success: false, message: 'خطأ في حذف المنتج' });
    });
}

/**
 * تعديل بيانات منتج (اسم، باركود، أسعار)
 */
function updateProduct(req, res) {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ success: false, message: 'معرف المنتج غير صالح' });
  }

  const name = req.body && req.body.name ? String(req.body.name).trim() : '';
  const rawBarcode = req.body && req.body.barcode ? normalizeBarcode(req.body.barcode) : '';
  const purchasePrice = parseFloat(req.body && req.body.purchase_price);
  const salePrice = parseFloat(req.body && req.body.sale_price);
  const userId = req.session && req.session.userId ? req.session.userId : null;
  const supplierIdsUpdate = parseSupplierIdsFromBody(req.body);

  if (!name) {
    return res.status(400).json({ success: false, message: 'اسم المنتج مطلوب' });
  }
  if (rawBarcode.length !== BARCODE_LENGTH) {
    return res.status(400).json({
      success: false,
      message: 'الباركود يجب أن يكون 12 خانة (حروف أو أرقام) بالضبط',
    });
  }

  const purchase = !isNaN(purchasePrice) && purchasePrice >= 0 ? purchasePrice : 0;
  const sale = !isNaN(salePrice) && salePrice >= 0 ? salePrice : 0;

  pool
    .getConnection()
    .then((conn) => {
      return conn
        .execute(
          `SELECT p.id, p.name, p.barcode,
                  COALESCE(pp.purchase_price, 0) AS purchase_price,
                  COALESCE(pp.sale_price, 0) AS sale_price
           FROM products p
           LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.deleted_at IS NULL
           WHERE p.id = ? AND p.deleted_at IS NULL
           LIMIT 1`,
          [id]
        )
        .then(([rows]) => {
          if (!rows.length) {
            conn.release();
            return res.status(404).json({ success: false, message: 'المنتج غير موجود' });
          }
          const current = rows[0];
          // تحقق من عدم وجود منتج آخر بنفس الباركود
          return conn
            .execute(
              'SELECT id FROM products WHERE barcode = ? AND id <> ? AND deleted_at IS NULL LIMIT 1',
              [rawBarcode, id]
            )
            .then(([dupRows]) => {
              if (dupRows.length) {
                conn.release();
                return res
                  .status(409)
                  .json({ success: false, message: 'الباركود مستخدم لمنتج آخر' });
              }

              const resolveFinalSupplierIds = () => {
                if (supplierIdsUpdate !== null) return Promise.resolve(supplierIdsUpdate);
                return conn
                  .execute('SELECT supplier_id FROM product_suppliers WHERE product_id = ?', [id])
                  .then(([rowsSup]) => (rowsSup || []).map((r) => Number(r.supplier_id)));
              };

              const verifySupplierForUpdate = (supplierIds) => {
                if (!supplierIds.length) return Promise.resolve(supplierIds);
                const placeholders = supplierIds.map(() => '?').join(',');
                return conn
                  .execute(`SELECT id FROM suppliers WHERE id IN (${placeholders})`, supplierIds)
                  .then(([srows]) => {
                    if ((srows || []).length !== supplierIds.length) {
                      const err = new Error('INVALID_SUPPLIER');
                      err.code = 'INVALID_SUPPLIER';
                      throw err;
                    }
                    return supplierIds;
                  });
              };

              return resolveFinalSupplierIds()
                .then((finalSupplierIds) => verifySupplierForUpdate(finalSupplierIds))
                .then((finalSupplierIds) =>
                  conn
                // حفظ البيانات القديمة في جدول السجل قبل التعديل
                .execute(
                  `INSERT INTO product_edit_logs
                     (product_id, old_name, old_barcode, old_purchase_price, old_sale_price, user_id)
                   VALUES (?, ?, ?, ?, ?, ?)`,
                  [
                    id,
                    current.name,
                    current.barcode,
                    Number(current.purchase_price) || 0,
                    Number(current.sale_price) || 0,
                    userId,
                  ]
                )
                .then(() =>
                  conn.execute(
                    'UPDATE products SET name = ?, barcode = ?, updated_at = NOW() WHERE id = ?',
                    [name, rawBarcode, id]
                  )
                )
                .then(() => conn.execute('DELETE FROM product_suppliers WHERE product_id = ?', [id]))
                .then(() => {
                  if (!finalSupplierIds.length) return null;
                  const placeholders = finalSupplierIds.map(() => '(?, ?)').join(',');
                  const params = [];
                  finalSupplierIds.forEach((sid) => {
                    params.push(id, sid);
                  });
                  return conn.execute(
                    `INSERT INTO product_suppliers (product_id, supplier_id) VALUES ${placeholders}`,
                    params
                  );
                })
                .then(() =>
                  recordProductPriceHistoryIfChanged(conn, {
                    productId: id,
                    purchaseBefore: Number(current.purchase_price) || 0,
                    saleBefore: Number(current.sale_price) || 0,
                    purchaseAfter: purchase,
                    saleAfter: sale,
                    source: 'product_update',
                    referenceId: null,
                    userId,
                  })
                )
                .then(() =>
                  conn.execute(
                    `INSERT INTO product_prices (product_id, purchase_price, sale_price)
                     VALUES (?, ?, ?)
                     ON DUPLICATE KEY UPDATE purchase_price = VALUES(purchase_price),
                                             sale_price = VALUES(sale_price),
                                             updated_at = NOW()`,
                    [id, purchase, sale]
                  )
                )
                .then(() =>
                  fetchProductWithSuppliers(conn, id)
                )
                .then(([resultRows]) => {
                  conn.release();
                  return res.json({
                    success: true,
                    message: 'تم حفظ تعديلات المنتج',
                    data: resultRows[0] || null,
                  });
                })
              );
            });
        })
        .catch((err) => {
          conn.release();
          throw err;
        });
    })
    .catch((err) => {
      console.error('Update product error:', err);
      if (err.code === 'INVALID_SUPPLIER') {
        return res.status(400).json({ success: false, message: 'المورد غير موجود' });
      }
      res.status(500).json({ success: false, message: 'خطأ في تعديل المنتج' });
    });
}

function getByBarcode(req, res) {
  const barcode = normalizeBarcode(req.params.barcode || '');
  if (barcode.length !== 12) {
    return res.status(400).json({ success: false, message: 'الباركود 12 خانة (حروف أو أرقام)' });
  }

  const whRaw = req.query && Object.prototype.hasOwnProperty.call(req.query, 'warehouse_id') ? req.query.warehouse_id : null;
  const warehouseId =
    whRaw !== undefined && whRaw !== null && whRaw !== ''
      ? parseInt(String(whRaw), 10)
      : null;
  const whId = warehouseId != null && !Number.isNaN(warehouseId) && warehouseId > 0 ? warehouseId : null;

  const warehouseQtyExpr = whId
    ? `(SELECT COALESCE(quantity, 0) FROM warehouse_stock WHERE product_id = p.id AND warehouse_id = ? AND deleted_at IS NULL LIMIT 1)`
    : 'NULL';

  const params = [];
  if (whId) params.push(whId);
  params.push(barcode);

  pool
    .execute(
      `SELECT p.id, p.name, p.barcode,
              COALESCE(pp.purchase_price, 0) AS purchase_price,
              COALESCE(pp.sale_price, 0) AS sale_price,
              ${warehouseQtyExpr} AS warehouse_quantity,
              (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_stock WHERE product_id = p.id AND deleted_at IS NULL) AS total_quantity,
              GROUP_CONCAT(ps.supplier_id ORDER BY ps.supplier_id SEPARATOR ',') AS supplier_ids_csv,
              GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR '${SUPPLIER_NAME_SEPARATOR}') AS supplier_names
       FROM products p
       LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.deleted_at IS NULL
       LEFT JOIN product_suppliers ps ON ps.product_id = p.id
       LEFT JOIN suppliers s ON s.id = ps.supplier_id
       WHERE p.barcode = ? AND p.deleted_at IS NULL
       GROUP BY p.id, p.name, p.barcode, pp.purchase_price, pp.sale_price
       LIMIT 1`,
      params
    )
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: rows[0] });
    })
    .catch((err) => {
      console.error('Get by barcode error:', err);
      res.status(500).json({ success: false, message: 'خطأ في البحث' });
    });
}

/**
 * بحث منتج بالاسم (تطابق كامل للنص بعد التقليم) — أول نتيجة غير محذوفة
 */
function getByName(req, res) {
  const name = req.query && req.query.name != null ? String(req.query.name).trim() : '';
  if (!name) {
    return res.status(400).json({ success: false, message: 'أدخل اسم المنتج' });
  }

  const whRaw = req.query && Object.prototype.hasOwnProperty.call(req.query, 'warehouse_id') ? req.query.warehouse_id : null;
  const warehouseId =
    whRaw !== undefined && whRaw !== null && whRaw !== ''
      ? parseInt(String(whRaw), 10)
      : null;
  const whId = warehouseId != null && !Number.isNaN(warehouseId) && warehouseId > 0 ? warehouseId : null;

  const warehouseQtyExpr = whId
    ? `(SELECT COALESCE(quantity, 0) FROM warehouse_stock WHERE product_id = p.id AND warehouse_id = ? AND deleted_at IS NULL LIMIT 1)`
    : 'NULL';

  const params = [];
  if (whId) params.push(whId);
  params.push(name);

  pool
    .execute(
      `SELECT p.id, p.name, p.barcode,
              COALESCE(pp.purchase_price, 0) AS purchase_price,
              COALESCE(pp.sale_price, 0) AS sale_price,
              ${warehouseQtyExpr} AS warehouse_quantity,
              (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_stock WHERE product_id = p.id AND deleted_at IS NULL) AS total_quantity,
              GROUP_CONCAT(ps.supplier_id ORDER BY ps.supplier_id SEPARATOR ',') AS supplier_ids_csv,
              GROUP_CONCAT(s.name ORDER BY s.name SEPARATOR '${SUPPLIER_NAME_SEPARATOR}') AS supplier_names
       FROM products p
       LEFT JOIN product_prices pp ON pp.product_id = p.id AND pp.deleted_at IS NULL
       LEFT JOIN product_suppliers ps ON ps.product_id = p.id
       LEFT JOIN suppliers s ON s.id = ps.supplier_id
       WHERE p.name = ? AND p.deleted_at IS NULL
       GROUP BY p.id, p.name, p.barcode, pp.purchase_price, pp.sale_price
       ORDER BY p.id ASC
       LIMIT 1`,
      params
    )
    .then(([rows]) => {
      if (rows.length === 0) {
        return res.json({ success: true, data: null });
      }
      res.json({ success: true, data: rows[0] });
    })
    .catch((err) => {
      console.error('Get by name error:', err);
      res.status(500).json({ success: false, message: 'خطأ في البحث' });
    });
}

/**
 * بحث منتجات بالاسم (يحتوي على النص المُدخل) لاقتراحات أثناء الكتابة
 */
function searchProducts(req, res) {
  const rawQ = req.query && req.query.q != null ? String(req.query.q).trim() : '';
  if (rawQ.length < 1) {
    return res.json({ success: true, data: [] });
  }

  const qSlice = rawQ.slice(0, 120);
  const escaped = qSlice.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  const likeContains = `%${escaped}%`;
  const likeNamePrefix = `${escaped}%`;
  const likeBarcodePrefix = `${escaped}%`;

  const limParsed = parseInt(req.query.limit, 10);
  const limit = Math.min(30, Math.max(1, Number.isFinite(limParsed) && limParsed > 0 ? limParsed : 20));

  const whRaw = req.query && Object.prototype.hasOwnProperty.call(req.query, 'warehouse_id') ? req.query.warehouse_id : null;
  const warehouseId =
    whRaw !== undefined && whRaw !== null && whRaw !== ''
      ? parseInt(String(whRaw), 10)
      : null;
  const whId = warehouseId != null && !Number.isNaN(warehouseId) && warehouseId > 0 ? warehouseId : null;

  const warehouseQtyExpr = whId
    ? `(SELECT COALESCE(quantity, 0) FROM warehouse_stock WHERE product_id = p.id AND warehouse_id = ? AND deleted_at IS NULL LIMIT 1)`
    : 'NULL';

  const params = [];
  if (whId) params.push(whId);
  params.push(likeContains, likeContains, likeNamePrefix, likeBarcodePrefix);

  pool
    .execute(
      `SELECT p.id, p.name, p.barcode,
              COALESCE(pp.purchase_price, 0) AS purchase_price,
              COALESCE(pp.sale_price, 0) AS sale_price,
              ${warehouseQtyExpr} AS warehouse_quantity,
              (SELECT COALESCE(SUM(quantity), 0) FROM warehouse_stock WHERE product_id = p.id AND deleted_at IS NULL) AS total_quantity
       FROM products p
       LEFT JOIN (
         SELECT pp1.product_id, pp1.purchase_price, pp1.sale_price
         FROM product_prices pp1
         INNER JOIN (
           SELECT product_id, MAX(id) AS max_id
           FROM product_prices
           WHERE deleted_at IS NULL
           GROUP BY product_id
         ) pp2 ON pp2.max_id = pp1.id
       ) pp ON pp.product_id = p.id
       WHERE p.deleted_at IS NULL
         AND (p.name LIKE ? OR p.barcode LIKE ?)
       ORDER BY
         (p.name LIKE ?) DESC,
         (p.barcode LIKE ?) DESC,
         p.name ASC
       LIMIT ${limit}`,
      params
    )
    .then(([rows]) => {
      res.json({ success: true, data: rows || [] });
    })
    .catch((err) => {
      console.error('Search products error:', err);
      res.status(500).json({ success: false, message: 'خطأ في البحث' });
    });
}

module.exports = {
  listProducts,
  createProduct,
  softDeleteProduct,
  getByBarcode,
  getByName,
  searchProducts,
  updateProduct,
};

const { pool } = require('../config/db');

/**
 * GET /api/customers/by-phone?phone=...
 * يعيد أول عميل يطابق رقم الهاتف (جزئياً) أو null
 */
async function findByPhone(req, res) {
  const rawPhone = (req.query.phone || '').trim();

  if (!rawPhone) {
    return res.status(400).json({
      success: false,
      message: 'رقم الهاتف مطلوب للبحث.',
    });
  }

  try {
    // نستخدم LIKE للبحث الجزئي، مع حد أعلى للنتائج
    const pattern = `%${rawPhone}%`;
    const [rows] = await pool.execute(
      'SELECT id, name, phone FROM customers WHERE phone LIKE ? ORDER BY id DESC LIMIT 1',
      [pattern]
    );

    if (!rows.length) {
      return res.json({
        success: true,
        customer: null,
      });
    }

    const c = rows[0];
    return res.json({
      success: true,
      customer: {
        id: c.id,
        name: c.name,
        phone: c.phone,
      },
    });
  } catch (err) {
    console.error('findByPhone (customers) error:', err);
    return res.status(500).json({
      success: false,
      message: 'خطأ في البحث عن العميل.',
    });
  }
}

module.exports = {
  findByPhone,
};


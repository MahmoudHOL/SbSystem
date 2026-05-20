const { getPublicDirForSendFile } = require('../utils/paths');
const { pool } = require('../config/db');
const publicDir = getPublicDirForSendFile();

function getPosPage(req, res) {
  res.sendFile('pos/index.html', { root: publicDir });
}

async function getPosAccess(req, res) {
  const userId = req.session && req.session.userId ? Number(req.session.userId) : 0;
  const username = String((req.session && req.session.username) || '').toLowerCase();
  if (!userId) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }

  const checks = [
    { key: 'tab_sales_log', module_key: 'pos.tabs.sales_log', action_key: 'view' },
    { key: 'tab_returns', module_key: 'pos.tabs.returns', action_key: 'view' },
    { key: 'tab_credit_customers', module_key: 'pos.tabs.credit_customers', action_key: 'view' },
    { key: 'sales_log_edit_quantity', module_key: 'pos.sales_log', action_key: 'edit_quantity' },
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
    console.error('Get POS access error:', err);
    return res.status(500).json({ success: false, message: 'خطأ في جلب صلاحيات نقطة البيع' });
  }
}

module.exports = {
  getPosPage,
  getPosAccess,
};


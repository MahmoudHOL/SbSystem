/**
 * تحكم تسجيل الدخول والخروج
 */

const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { getLicenseStatus } = require('../utils/licenseService');

const { getPublicDirForSendFile } = require('../utils/paths');
const publicDir = getPublicDirForSendFile();

/**
 * عرض صفحة الـ Splash (Intro فقط - للاستخدام في Electron أو المتصفح)
 */
function getSplashPage(req, res) {
  res.sendFile('splash.html', { root: publicDir });
}

/**
 * عرض صفحة تسجيل الدخول
 */
async function getLoginPage(req, res) {
  const license = await getLicenseStatus();
  if (!license.ok) {
    return res.redirect('/license-expired');
  }
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.sendFile('login.html', { root: publicDir });
}

/**
 * معالجة تسجيل الدخول
 */
async function postLogin(req, res) {
  const license = await getLicenseStatus();
  if (!license.ok) {
    return res.status(403).json({ success: false, message: 'انتهت فترة الترخيص أو الترخيص غير صالح' });
  }
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'اسم المستخدم وكلمة المرور مطلوبان' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, full_name FROM users WHERE username = ? AND is_active = 1 LIMIT 1',
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'بيانات الدخول غير صحيحة' });
    }

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.fullName = user.full_name || user.username;

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      user: { id: user.id, username: user.username, fullName: req.session.fullName },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'خطأ في الخادم، حاول لاحقاً' });
  }
}

function isLocalRequest(req) {
  const ip = String(req.ip || req.connection?.remoteAddress || '').toLowerCase();
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost');
}

async function resetAdminPassword(req, res) {
  if (!isLocalRequest(req)) {
    return res.status(403).json({ success: false, message: 'غير مسموح من هذا الجهاز' });
  }
  try {
    const hash = await bcrypt.hash('123456', 10);
    await pool.execute(
      `INSERT INTO users (username, password_hash, full_name, is_active)
       VALUES ('admin', ?, 'admin', 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), is_active = 1, updated_at = NOW()`,
      [hash]
    );
    return res.json({ success: true, message: 'تمت إعادة كلمة مرور admin إلى 123456' });
  } catch (err) {
    console.error('Reset admin password error:', err);
    return res.status(500).json({ success: false, message: 'فشل إعادة كلمة مرور admin' });
  }
}

/**
 * تسجيل الخروج
 */
function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/login');
  });
}

/**
 * التحقق من الجلسة (للمسارات المحمية لاحقاً)
 */
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
  }
  res.redirect('/login');
}

function isJsonRequest(req) {
  const accept = String((req && req.headers && req.headers.accept) || '');
  const reqPath = String((req && (req.originalUrl || req.url)) || '');
  return !!(req.xhr || accept.includes('application/json') || reqPath.startsWith('/api/'));
}

function denyPermission(req, res) {
  const message = 'ليس لديك صلاحية';
  if (isJsonRequest(req)) {
    return res.status(403).json({ success: false, message });
  }
  return res.status(403).send(message);
}

async function hasPermissionByKey(userId, moduleKey, actionKey) {
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
    [userId, userId, moduleKey, actionKey]
  );
  return !!(rows && rows[0] && Number(rows[0].allowed) === 1);
}

function withPermissionGuard(checker) {
  return async function permissionGuard(req, res, next) {
    try {
      if (!req.session || !req.session.userId) {
        if (isJsonRequest(req)) {
          return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول' });
        }
        return res.redirect('/login');
      }
      const sessionUsername = String(req.session.username || '').toLowerCase();
      if (sessionUsername === 'admin') {
        return next();
      }
      const userId = Number(req.session.userId);
      if (!userId) {
        return denyPermission(req, res);
      }
      const allowed = await checker(userId);
      if (!allowed) {
        return denyPermission(req, res);
      }
      return next();
    } catch (err) {
      console.error('Permission guard error:', err);
      return res.status(500).json({ success: false, message: 'خطأ في التحقق من الصلاحيات' });
    }
  };
}

function requirePermission(moduleKey, actionKey) {
  return withPermissionGuard(function (userId) {
    return hasPermissionByKey(userId, moduleKey, actionKey);
  });
}

function requireAnyPermission(permissionKeys) {
  const safeList = Array.isArray(permissionKeys) ? permissionKeys : [];
  return withPermissionGuard(async function (userId) {
    for (let i = 0; i < safeList.length; i += 1) {
      const item = safeList[i] || {};
      if (!item.moduleKey || !item.actionKey) continue;
      // eslint-disable-next-line no-await-in-loop
      const allowed = await hasPermissionByKey(userId, item.moduleKey, item.actionKey);
      if (allowed) return true;
    }
    return false;
  });
}

module.exports = {
  getSplashPage,
  getLoginPage,
  postLogin,
  logout,
  requireAuth,
  requirePermission,
  requireAnyPermission,
  resetAdminPassword,
};

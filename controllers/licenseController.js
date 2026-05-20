const { getPublicDirForSendFile } = require('../utils/paths');
const { getLicenseStatus, applyLicenseToken, touchLicenseState, resetLicenseState } = require('../utils/licenseService');

const publicDir = getPublicDirForSendFile();

function getLicenseExpiredPage(req, res) {
  res.sendFile('license-expired.html', { root: publicDir });
}

async function getLicenseStatusApi(req, res) {
  const status = await getLicenseStatus();
  try {
    await touchLicenseState(status);
  } catch (err) {
    console.error('License DB sync error:', err);
  }
  res.json({ success: true, data: status });
}

function isLocalRequest(req) {
  const ip = String(req.ip || req.connection?.remoteAddress || '').toLowerCase();
  return ip.includes('127.0.0.1') || ip.includes('::1') || ip.includes('localhost');
}

async function applyLicenseApi(req, res) {
  if (!isLocalRequest(req)) {
    return res.status(403).json({ success: false, message: 'غير مسموح من خارج الجهاز' });
  }
  try {
    const licenseToken = req.body && req.body.license;
    if (!licenseToken || typeof licenseToken !== 'object') {
      return res.status(400).json({ success: false, message: 'بيانات الترخيص غير صحيحة' });
    }
    const status = await applyLicenseToken(licenseToken);
    return res.json({ success: true, message: 'تم تطبيق الترخيص بنجاح', data: status });
  } catch (err) {
    if (String(err.message || '') === 'device_mismatch') {
      return res.status(400).json({ success: false, message: 'هذا الترخيص ليس لهذا الجهاز' });
    }
    console.error('Apply license error:', err);
    return res.status(500).json({ success: false, message: 'فشل تطبيق الترخيص' });
  }
}

async function resetLicenseApi(req, res) {
  if (!isLocalRequest(req)) {
    return res.status(403).json({ success: false, message: 'غير مسموح من خارج الجهاز' });
  }
  try {
    const status = await resetLicenseState();
    return res.json({ success: true, message: 'تمت إعادة تهيئة الترخيص', data: status });
  } catch (err) {
    console.error('Reset license error:', err);
    return res.status(500).json({ success: false, message: 'فشل إعادة تهيئة الترخيص' });
  }
}

async function requireLicensed(req, res, next) {
  const status = await getLicenseStatus();
  try {
    await touchLicenseState(status);
  } catch (err) {
    console.error('License DB sync error:', err);
  }
  if (status.ok) return next();
  if (req.originalUrl && req.originalUrl.startsWith('/api/')) {
    return res.status(403).json({
      success: false,
      message: 'البرنامج غير مفعل. يرجى إضافة ترخيص صالح.',
      code: 'LICENSE_REQUIRED',
      data: status,
    });
  }
  return res.redirect('/license-expired');
}

module.exports = {
  getLicenseExpiredPage,
  getLicenseStatusApi,
  applyLicenseApi,
  resetLicenseApi,
  requireLicensed,
};

/**
 * مسارات التثبيت: عند التشغيل كـ .exe (pkg) يُخزَّن القابل للكتابة بجانب الملف التنفيذي.
 */

const path = require('path');

/** pkg يضع الكود تحت snapshot؛ أحياناً process.pkg لا يُضبَط فيبدو المسار وكأنه مشروع عادي فيُكتب داخل snapshot فيفشل. */
function isPkgBundledRuntime() {
  if (typeof process.pkg !== 'undefined') return true;
  const norm = String(__dirname).replace(/\\/g, '/');
  return norm.includes('/snapshot/');
}

function getInstallRoot() {
  if (isPkgBundledRuntime()) {
    return path.dirname(process.execPath);
  }
  return path.join(__dirname, '..');
}

/** HTML/CSS/JS المضمّن في الحزمة (لقطعة pkg للقراءة فقط). */
function getBundledPublicDir() {
  return path.join(__dirname, '..', 'public');
}

/** مجلد public للرفوعات؛ بجانب الـ exe عند pkg. */
function getWritablePublicDir() {
  if (isPkgBundledRuntime()) {
    return path.join(getInstallRoot(), 'public');
  }
  return path.join(__dirname, '..', 'public');
}

function getPublicDirForSendFile() {
  if (isPkgBundledRuntime()) {
    // In exe mode, always serve pages from public beside executable.
    return getWritablePublicDir();
  }
  return getBundledPublicDir();
}

/** جلسة واتساب (يجب أن تكون قابلة للكتابة). */
function getWhatsappAuthDir() {
  if (isPkgBundledRuntime()) {
    return path.join(getInstallRoot(), 'whatsapp-auth');
  }
  return path.join(__dirname, '..', 'whatsapp', 'auth');
}

module.exports = {
  isPkgBundledRuntime,
  getInstallRoot,
  getBundledPublicDir,
  getWritablePublicDir,
  getPublicDirForSendFile,
  getWhatsappAuthDir,
};

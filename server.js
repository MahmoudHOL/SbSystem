/**
 * SB Smart - نقطة تشغيل التطبيق
 * conver_lang - صفحة تسجيل الدخول مع Intro
 */

const path = require('path');
const fs = require('fs');
const { getBundledPublicDir, getWritablePublicDir, isPkgBundledRuntime } = require('./utils/paths');
require('dotenv').config(
  isPkgBundledRuntime()
    ? { path: path.join(path.dirname(process.execPath), '.env') }
    : undefined
);
const express = require('express');
const session = require('express-session');
const { getSessionConfig } = require('./config/session');
const authController = require('./controllers/authController');
const posController = require('./controllers/posController');
const routes = require('./routes');
const { startBackupScheduler } = require('./utils/backupScheduler');

const app = express();
const PORT = process.env.PORT || 3000;

// تعطيل ETag لمسارات JSON: تجنّب ردود 304 بجسم فارغ تكسر fetch().then(r => r.json())
app.set('etag', false);

// الجلسة
app.use(session(getSessionConfig()));

// جسم الطلبات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// نقطة البيع محمية قبل الـ static حتى لا تُقدَّم الصفحة بدون تسجيل دخول
app.get(['/pos', '/pos/'], authController.requireAuth, posController.getPosPage);

// ملفات ثابتة: الرفع والنسخ الاحتياطي بجانب الـ exe عند pkg، ثم الأصول من الحزمة
const bundledPublic = getBundledPublicDir();
const writablePublic = getWritablePublicDir();
if (isPkgBundledRuntime()) {
  fs.mkdirSync(path.join(writablePublic, 'uploads', 'company'), { recursive: true });
  fs.mkdirSync(path.join(writablePublic, 'uploads', 'backup-imports'), { recursive: true });
  app.use(express.static(writablePublic));
}
app.use(express.static(bundledPublic));
const vendorDir = isPkgBundledRuntime()
  ? path.join(path.dirname(process.execPath), 'node_modules')
  : path.join(__dirname, 'node_modules');
app.use('/vendor', express.static(vendorDir));

// بقية المسارات
app.use(routes);

// تشغيل الخادم
app.listen(PORT, () => {
  console.log(`SB Smart running at http://localhost:${PORT}`);
  startBackupScheduler();
});

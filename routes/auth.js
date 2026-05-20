/**
 * مسارات المصادقة: تسجيل الدخول والخروج
 */

const express = require('express');
const authController = require('../controllers/authController');
const licenseController = require('../controllers/licenseController');

const router = express.Router();

router.get('/splash', authController.getSplashPage);
router.get('/login', authController.getLoginPage);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/license-expired', licenseController.getLicenseExpiredPage);
router.get('/api/license-status', licenseController.getLicenseStatusApi);
router.post('/api/license/apply', licenseController.applyLicenseApi);
router.post('/api/license/reset', licenseController.resetLicenseApi);
router.post('/api/admin/reset-password', authController.resetAdminPassword);

module.exports = router;

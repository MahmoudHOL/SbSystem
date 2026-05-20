/**
 * تجميع المسارات
 */

const express = require('express');
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const warehousesRoutes = require('./warehouses');
const settingsRoutes = require('./settings');
const whatsappRoutes = require('./whatsapp');
const posRoutes = require('./pos');
const licenseController = require('../controllers/licenseController');

const router = express.Router();

router.use('/', authRoutes);
router.use(licenseController.requireLicensed);
router.use('/', dashboardRoutes);
router.use('/', warehousesRoutes);
router.use('/', settingsRoutes);
router.use('/', whatsappRoutes);
router.use('/', posRoutes);

// الصفحة الرئيسية توجه إلى تسجيل الدخول
router.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    res.redirect('/dashboard');
  } else {
    res.redirect('/login');
  }
});

module.exports = router;

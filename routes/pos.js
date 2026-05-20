/**
 * مسارات نقطة البيع (POS)
 */

const express = require('express');
const authController = require('../controllers/authController');
const posController = require('../controllers/posController');
const saleInvoicesController = require('../controllers/saleInvoicesController');

const router = express.Router();
const canPosPage = authController.requirePermission('pos.page', 'view');
const canPosEditQuantity = authController.requirePermission('pos.sales_log', 'edit_quantity');

// حماية كل من /pos و /pos/ بنفس التحقق من تسجيل الدخول
router.get(['/pos', '/pos/'], authController.requireAuth, canPosPage, posController.getPosPage);
router.get('/api/pos-access', authController.requireAuth, posController.getPosAccess);
router.put('/api/pos/sale-invoices/:id', authController.requireAuth, canPosEditQuantity, saleInvoicesController.updateSaleInvoice);

module.exports = router;


/**
 * لوحة التحكم + واجهة المستخدم الحالي + المصروفات
 */

const express = require('express');
const authController = require('../controllers/authController');
const expensesController = require('../controllers/expensesController');
const saleInvoicesController = require('../controllers/saleInvoicesController');
const warehousesController = require('../controllers/warehousesController');

const router = express.Router();
const { getPublicDirForSendFile } = require('../utils/paths');
const publicDir = getPublicDirForSendFile();
const canCreateExpense = authController.requirePermission('expenses', 'create');
const canUpdateExpense = authController.requirePermission('expenses', 'update');
const canDeleteExpense = authController.requirePermission('expenses', 'delete');
const canShiftSummaryTab = authController.requirePermission('shift_close.tabs.payment_summary', 'view');
const canShiftReceiveTab = authController.requirePermission('shift_close.tabs.receive_amounts', 'view');
const canShiftLogTab = authController.requirePermission('shift_close.tabs.shift_log', 'view');
const canPosProfitReport = authController.requirePermission('reports.pos_profit', 'view');
const canWarehouseReport = authController.requirePermission('reports.warehouse_report', 'view');

router.get('/dashboard', authController.requireAuth, (req, res) => {
  res.sendFile('dashboard.html', { root: publicDir });
});

// صفحة تقفيل الخزن (شفت نقطة البيع)
router.get('/shift-close', authController.requireAuth, (req, res) => {
  res.sendFile('shift-close.html', { root: publicDir });
});

router.get('/reports/pos-profit', authController.requireAuth, canPosProfitReport, (req, res) => {
  res.sendFile('reports/pos-profit-report.html', { root: publicDir });
});

router.get('/reports/warehouse-report', authController.requireAuth, canWarehouseReport, (req, res) => {
  res.sendFile('reports/warehouse-report.html', { root: publicDir });
});

router.get('/expenses', authController.requireAuth, (req, res) => {
  res.sendFile('expenses.html', { root: publicDir });
});

router.get('/credit-customers', authController.requireAuth, (req, res) => {
  res.sendFile('credit-customers.html', { root: publicDir });
});

router.get('/api/me', (req, res) => {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ message: 'غير مسجل الدخول' });
  }
  res.json({
    id: req.session.userId,
    username: req.session.username,
    fullName: req.session.fullName || req.session.username,
  });
});

router.get('/api/expenses', authController.requireAuth, expensesController.listExpenses);
router.get('/api/expenses/:id', authController.requireAuth, expensesController.getExpenseById);
router.get('/api/expenses-access', authController.requireAuth, expensesController.getExpensesAccess);
router.post('/api/expenses', authController.requireAuth, canCreateExpense, expensesController.createExpense);
router.put('/api/expenses/:id', authController.requireAuth, canUpdateExpense, expensesController.updateExpense);
router.delete('/api/expenses/:id', authController.requireAuth, canDeleteExpense, expensesController.deleteExpense);

// ملخص تقفيل شفت نقطة البيع للمستخدم الحالي
router.get('/api/shift-close-access', authController.requireAuth, saleInvoicesController.getShiftCloseAccess);
router.get('/api/pos-shift-summary', authController.requireAuth, canShiftSummaryTab, saleInvoicesController.getPosShiftSummary);
router.get('/api/pos-shift-employees', authController.requireAuth, canShiftReceiveTab, saleInvoicesController.listShiftEmployees);
router.get('/api/pos-shift-closures', authController.requireAuth, canShiftLogTab, saleInvoicesController.listPosShiftClosures);
router.post('/api/pos-shift-closures', authController.requireAuth, canShiftReceiveTab, saleInvoicesController.createPosShiftClosure);
router.get('/api/reports/pos-profit', authController.requireAuth, canPosProfitReport, saleInvoicesController.getPosProfitReport);
router.get('/api/reports/warehouses-products', authController.requireAuth, canWarehouseReport, warehousesController.getWarehousesProductsReport);
router.get('/api/reports/warehouse-products-details', authController.requireAuth, canWarehouseReport, warehousesController.getWarehouseProductsDetails);
router.get('/api/reports/warehouses-stock-summary', authController.requireAuth, canWarehouseReport, warehousesController.getWarehousesGlobalStockSummary);
router.get('/api/reports/warehouses-stock-alerts', authController.requireAuth, canWarehouseReport, warehousesController.getWarehousesStockAlertsList);
router.get('/api/reports/inventory-sales-insights', authController.requireAuth, canWarehouseReport, warehousesController.getInventorySalesInsights);
router.get('/api/dashboard/stock-notifications', authController.requireAuth, warehousesController.getDashboardStockNotifications);

module.exports = router;

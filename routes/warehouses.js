/**
 * مسارات المخازن - الصفحة والـ API
 */

const express = require('express');
const authController = require('../controllers/authController');
const warehousesController = require('../controllers/warehousesController');
const productsController = require('../controllers/productsController');
const suppliersController = require('../controllers/suppliersController');
const customersController = require('../controllers/customersController');
const purchaseInvoicesController = require('../controllers/purchaseInvoicesController');
const saleInvoicesController = require('../controllers/saleInvoicesController');

const router = express.Router();
const canWarehousesTab = authController.requirePermission('warehouses.tabs.warehouses', 'view');
const canDispatchCreateSupplier = authController.requirePermission('warehouses.dispatch', 'create_supplier');
const canDispatchAddProduct = authController.requirePermission('warehouses.dispatch', 'add_product');
const canProductsMinimum = authController.requirePermission('warehouses.products', 'minimum_stock');
const canProductsEdit = authController.requirePermission('warehouses.products', 'edit');
const canProductsDelete = authController.requirePermission('warehouses.products', 'delete');
const canSuppliersStatement = authController.requirePermission('warehouses.suppliers', 'statement');
const canLogEditAmount = authController.requirePermission('warehouses.log', 'edit_amount');
const canLogEditInvoice = authController.requirePermission('warehouses.log', 'edit_invoice');
const canLogDeleteInvoice = authController.requirePermission('warehouses.log', 'delete_invoice');
const canCreditCustomersDetails = authController.requirePermission('credit_customers', 'details');
const canCreditCustomersSettle = authController.requirePermission('credit_customers', 'settle');

router.get('/warehouses', authController.requireAuth, warehousesController.getWarehousesPage);
router.get('/warehouses/transfer-log', authController.requireAuth, warehousesController.getTransferLogPage);
router.get('/api/warehouses-access', authController.requireAuth, warehousesController.getWarehousesAccess);
router.get('/api/warehouses', authController.requireAuth, warehousesController.listWarehouses);
router.post('/api/warehouses', authController.requireAuth, canWarehousesTab, warehousesController.createWarehouse);

router.get('/api/products', authController.requireAuth, productsController.listProducts);
router.get('/api/products/search', authController.requireAuth, productsController.searchProducts);
router.post('/api/products', authController.requireAuth, canDispatchAddProduct, productsController.createProduct);
router.put('/api/products/:id', authController.requireAuth, canProductsEdit, productsController.updateProduct);
router.delete('/api/products/:id', authController.requireAuth, canProductsDelete, productsController.softDeleteProduct);

router.get('/api/minimum-stock/default', authController.requireAuth, canProductsMinimum, warehousesController.getMinimumStockDefault);
router.put('/api/minimum-stock/default', authController.requireAuth, canProductsMinimum, warehousesController.setMinimumStockDefault);
router.put('/api/minimum-stock/product/:productId', authController.requireAuth, canProductsMinimum, warehousesController.setProductMinimumStock);
router.post('/api/minimum-stock/apply-unset', authController.requireAuth, canProductsMinimum, warehousesController.applyMinimumStockToUnsetProducts);

router.get('/api/warehouse-stock', authController.requireAuth, warehousesController.getWarehouseStock);
router.post('/api/warehouse-stock', authController.requireAuth, warehousesController.setProductStock);
router.post('/api/warehouse-transfer', authController.requireAuth, warehousesController.transferStock);
router.get('/api/warehouse-transfers', authController.requireAuth, warehousesController.listStockTransfers);

router.get('/api/suppliers', authController.requireAuth, suppliersController.listSuppliers);
router.post('/api/suppliers', authController.requireAuth, canDispatchCreateSupplier, suppliersController.createSupplier);
router.get('/api/suppliers/:id/statement', authController.requireAuth, canSuppliersStatement, suppliersController.getSupplierStatement);
router.post('/api/suppliers/:id/payments', authController.requireAuth, suppliersController.createSupplierPayment);

// العملاء (للاستخدام في نقطة البيع)
router.get('/api/customers/by-phone', authController.requireAuth, customersController.findByPhone);

router.get('/api/products/by-name', authController.requireAuth, productsController.getByName);
router.get('/api/products/by-barcode/:barcode', authController.requireAuth, productsController.getByBarcode);
router.post('/api/purchase-invoices', authController.requireAuth, purchaseInvoicesController.createPurchaseInvoice);
router.get('/api/purchase-invoices/:id/edit-log', authController.requireAuth, purchaseInvoicesController.getPurchaseInvoiceEditLog);
router.get('/api/purchase-invoices/:id', authController.requireAuth, purchaseInvoicesController.getPurchaseInvoiceById);
router.get('/api/purchase-invoices', authController.requireAuth, purchaseInvoicesController.listPurchaseInvoices);
router.post('/api/purchase-invoices/:id/return', authController.requireAuth, purchaseInvoicesController.createPurchaseReturn);
router.put('/api/purchase-invoices/:id/amount-paid', authController.requireAuth, canLogEditAmount, purchaseInvoicesController.updateAmountPaid);
router.put('/api/purchase-invoices/:id', authController.requireAuth, canLogEditInvoice, purchaseInvoicesController.updatePurchaseInvoice);
router.delete('/api/purchase-invoices/:id', authController.requireAuth, canLogDeleteInvoice, purchaseInvoicesController.deletePurchaseInvoice);

router.post('/api/sale-invoices', authController.requireAuth, saleInvoicesController.createSaleInvoice);
router.get('/api/sale-invoices/:id/edit-log', authController.requireAuth, saleInvoicesController.getSaleInvoiceEditLog);
router.get('/api/sale-invoices/:id', authController.requireAuth, saleInvoicesController.getSaleInvoiceById);
router.get('/api/sale-invoices', authController.requireAuth, saleInvoicesController.listSaleInvoices);
router.post('/api/sale-invoices/:id/return', authController.requireAuth, saleInvoicesController.createSaleReturn);
router.put('/api/sale-invoices/:id', authController.requireAuth, canLogEditInvoice, saleInvoicesController.updateSaleInvoice);
router.delete('/api/sale-invoices/:id', authController.requireAuth, canLogDeleteInvoice, saleInvoicesController.deleteSaleInvoice);
router.get('/api/credit-customers/profile', authController.requireAuth, saleInvoicesController.listCreditCustomersProfile);
router.get('/api/credit-customers-access', authController.requireAuth, saleInvoicesController.getCreditCustomersAccess);
router.get('/api/credit-customers/:customerId/invoices', authController.requireAuth, canCreditCustomersDetails, saleInvoicesController.listCreditInvoicesByCustomer);
router.get('/api/credit-customers/invoices/:id/details', authController.requireAuth, canCreditCustomersDetails, saleInvoicesController.getSaleInvoiceById);
router.get('/api/credit-customers/:customerId/settlements', authController.requireAuth, saleInvoicesController.listCreditSettlementsByCustomer);
router.post('/api/credit-invoices/:creditInvoiceId/settlements', authController.requireAuth, canCreditCustomersSettle, saleInvoicesController.createCreditSettlement);
router.post('/api/credit-customers/:customerId/settlements-external', authController.requireAuth, saleInvoicesController.createExternalCreditSettlement);

module.exports = router;

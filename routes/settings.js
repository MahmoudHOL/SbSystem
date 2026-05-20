/**
 * مسارات الإعدادات + واجهة المستخدمين
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authController = require('../controllers/authController');
const settingsController = require('../controllers/settingsController');
const { getWritablePublicDir } = require('../utils/paths');

const router = express.Router();

// إعداد رفع شعار المنشأة
const uploadDir = path.join(getWritablePublicDir(), 'uploads', 'company');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.png';
    cb(null, 'logo-' + Date.now() + ext.toLowerCase());
  },
});

const uploadCompanyLogo = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new Error('الملف يجب أن يكون صورة'));
    }
    cb(null, true);
  },
});

const backupImportDir = path.join(getWritablePublicDir(), 'uploads', 'backup-imports');
fs.mkdirSync(backupImportDir, { recursive: true });

const backupImportStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, backupImportDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '.sql';
    cb(null, 'import-' + Date.now() + ext.toLowerCase());
  },
});

const uploadBackupImport = multer({
  storage: backupImportStorage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext !== '.sql') {
      return cb(new Error('الملف يجب أن يكون بصيغة .sql'));
    }
    cb(null, true);
  },
});

const canUsersView = authController.requirePermission('settings.users', 'view');
const canUsersCreate = authController.requirePermission('settings.users', 'create');
const canUsersUpdate = authController.requirePermission('settings.users', 'update');
const canUsersDisable = authController.requirePermission('settings.users', 'disable');
const canSystemPaymentMethods = authController.requirePermission('settings.system.payment_methods', 'view');
const canSystemDiscounts = authController.requirePermission('settings.system.discounts', 'view');
const canSystemUserWarehouses = authController.requirePermission('settings.system.user_warehouses', 'view');
const canSystemExpenseCategories = authController.requirePermission('settings.system.expense_categories', 'view');
const canSystemCompanyProfile = authController.requirePermission('settings.system.company_profile', 'view');
const canSystemBackup = authController.requirePermission('settings.system.backup', 'view');
const canPermissionsManage = authController.requirePermission('settings.permissions', 'manage');
const canSystemPage = authController.requireAnyPermission([
  { moduleKey: 'settings.system.payment_methods', actionKey: 'view' },
  { moduleKey: 'settings.system.discounts', actionKey: 'view' },
  { moduleKey: 'settings.system.user_warehouses', actionKey: 'view' },
  { moduleKey: 'settings.system.expense_categories', actionKey: 'view' },
  { moduleKey: 'settings.system.company_profile', actionKey: 'view' },
  { moduleKey: 'settings.system.backup', actionKey: 'view' },
]);

router.get('/settings', authController.requireAuth, settingsController.getSettingsPage);
router.get('/settings/users', authController.requireAuth, canUsersView, settingsController.getUsersPage);
router.get('/settings/system', authController.requireAuth, canSystemPage, settingsController.getSystemPage);

router.get('/api/discount-config', authController.requireAuth, canSystemDiscounts, settingsController.getDiscountConfig);
router.post('/api/discount-global', authController.requireAuth, canSystemDiscounts, settingsController.setGlobalDiscount);
router.post('/api/discount-user', authController.requireAuth, canSystemDiscounts, settingsController.setUserDiscount);
router.get('/api/payment-methods', authController.requireAuth, canSystemPaymentMethods, settingsController.listPaymentMethods);
router.post('/api/payment-methods', authController.requireAuth, canSystemPaymentMethods, settingsController.createPaymentMethod);
router.patch('/api/payment-methods/:id/default-pos', authController.requireAuth, canSystemPaymentMethods, settingsController.setDefaultPaymentMethodForPos);
router.get('/api/users', authController.requireAuth, canUsersView, settingsController.listUsers);
router.post('/api/users', authController.requireAuth, canUsersCreate, settingsController.createUser);
router.put('/api/users/:id', authController.requireAuth, canUsersUpdate, settingsController.updateUser);
router.delete('/api/users/:id', authController.requireAuth, canUsersDisable, settingsController.softDeleteUser);
router.get('/api/settings-home-access', authController.requireAuth, settingsController.getSettingsHomeAccess);
router.get('/api/permission-roles', authController.requireAuth, canPermissionsManage, settingsController.listPermissionRoles);
router.post('/api/permission-roles', authController.requireAuth, canPermissionsManage, settingsController.createPermissionRole);
router.get('/api/permissions', authController.requireAuth, canPermissionsManage, settingsController.listPermissions);
router.get('/api/permission-role-matrix', authController.requireAuth, canPermissionsManage, settingsController.getRolePermissionsMatrix);
router.post('/api/permission-role-matrix', authController.requireAuth, canPermissionsManage, settingsController.setRolePermission);
router.get('/api/permission-users', authController.requireAuth, canPermissionsManage, settingsController.listUsersWithRoles);
router.post('/api/permission-users/assign-role', authController.requireAuth, canPermissionsManage, settingsController.assignUserRole);
router.get('/api/system-tabs-access', authController.requireAuth, settingsController.getSystemTabsAccess);
router.get('/api/user-warehouses', authController.requireAuth, canSystemUserWarehouses, settingsController.getUserWarehousesConfig);
router.post('/api/user-warehouses', authController.requireAuth, canSystemUserWarehouses, settingsController.addUserWarehouse);
router.delete('/api/user-warehouses', authController.requireAuth, canSystemUserWarehouses, settingsController.removeUserWarehouse);
router.get('/api/expense-categories', authController.requireAuth, canSystemExpenseCategories, settingsController.listExpenseCategories);
router.post('/api/expense-categories', authController.requireAuth, canSystemExpenseCategories, settingsController.createExpenseCategory);
router.get('/api/backup-paths', authController.requireAuth, canSystemBackup, settingsController.listBackupPaths);
router.post('/api/backup-paths', authController.requireAuth, canSystemBackup, settingsController.createBackupPath);
router.delete('/api/backup-paths/:id', authController.requireAuth, canSystemBackup, settingsController.deleteBackupPath);
router.get('/api/backup-settings', authController.requireAuth, canSystemBackup, settingsController.getBackupSettings);
router.post('/api/backup-settings', authController.requireAuth, canSystemBackup, settingsController.updateBackupSettings);
router.post('/api/backup-run-now', authController.requireAuth, canSystemBackup, settingsController.runBackupNow);
router.post('/api/backup-import', authController.requireAuth, canSystemBackup, uploadBackupImport.single('backup_file'), settingsController.importDatabaseBackup);

// بيانات المنشأة (اسم + شعار)
router.get(
  '/api/company-profile',
  authController.requireAuth,
  canSystemCompanyProfile,
  settingsController.getCompanyProfile
);

router.post(
  '/api/company-profile',
  authController.requireAuth,
  canSystemCompanyProfile,
  uploadCompanyLogo.single('company_logo'),
  settingsController.updateCompanyProfile
);

module.exports = router;

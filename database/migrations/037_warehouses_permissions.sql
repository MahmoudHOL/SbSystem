-- صلاحيات خاصة بصفحة المخازن /warehouses
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/037_warehouses_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('warehouses.tabs.warehouses', 'view', 'فتح تاب المخازن', 'الدخول إلى تاب إضافة/عرض المخازن'),
  ('warehouses.tabs.dispatch', 'view', 'فتح تاب إذن صرف', 'الدخول إلى تاب إذن صرف'),
  ('warehouses.dispatch', 'create_supplier', 'إنشاء مورد (إذن صرف)', 'إظهار/تنفيذ إنشاء مورد من تاب إذن صرف'),
  ('warehouses.dispatch', 'search', 'بحث منتج (إذن صرف)', 'إظهار/تنفيذ البحث عن منتج من تاب إذن صرف'),
  ('warehouses.dispatch', 'add_product', 'إضافة صنف (إذن صرف)', 'إظهار/تنفيذ إضافة صنف من تاب إذن صرف'),
  ('warehouses.products', 'minimum_stock', 'الحد الأدنى (قائمة المنتجات)', 'إظهار/تنفيذ إعدادات الحد الأدنى للمخزون'),
  ('warehouses.products', 'edit', 'تعديل منتج (قائمة المنتجات)', 'إظهار/تنفيذ تعديل المنتج'),
  ('warehouses.products', 'suppliers', 'الموردين (قائمة المنتجات)', 'إظهار زر الموردين وكشف المورد'),
  ('warehouses.products', 'delete', 'حذف منتج (قائمة المنتجات)', 'إظهار/تنفيذ حذف المنتج')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


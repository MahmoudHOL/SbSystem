-- صلاحيات تبويب قائمة الموردين وكشف الحساب في /warehouses
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/038_suppliers_list_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('warehouses.tabs.suppliers_list', 'view', 'فتح تاب قائمة الموردين', 'الدخول إلى تبويب قائمة الموردين'),
  ('warehouses.suppliers', 'statement', 'كشف حساب المورد', 'إظهار/تنفيذ كشف حساب المورد')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


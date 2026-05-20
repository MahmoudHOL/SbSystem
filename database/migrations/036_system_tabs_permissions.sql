-- صلاحيات تبويبات إعدادات النظام (/settings/system)
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/036_system_tabs_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('settings.system.payment_methods', 'view', 'طرق الدفع', 'الدخول إلى تبويب طرق الدفع'),
  ('settings.system.discounts', 'view', 'الخصم العام ونسب الخصم', 'الدخول إلى تبويب الخصم العام وتعديل خصم الموظف'),
  ('settings.system.user_warehouses', 'view', 'تحديد مخزن لي المستخدم', 'الدخول إلى تبويب ربط المستخدمين بالمخازن'),
  ('settings.system.expense_categories', 'view', 'إضافة فئة مصروفات', 'الدخول إلى تبويب فئات المصروفات'),
  ('settings.system.company_profile', 'view', 'بيانات المنشأة', 'الدخول إلى تبويب بيانات المنشأة'),
  ('settings.system.backup', 'view', 'نسخ احتياطي / استيراد البيانات', 'الدخول إلى تبويب النسخ الاحتياطي والاستيراد')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


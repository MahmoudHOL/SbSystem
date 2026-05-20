-- صلاحيات شاشة المصروفات: إضافة / تعديل / حذف
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/042_expenses_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('expenses', 'create', 'المصروفات: إضافة مصروف', 'السماح بإضافة مصروف جديد'),
  ('expenses', 'update', 'المصروفات: تعديل مصروف', 'السماح بتعديل المصروفات'),
  ('expenses', 'delete', 'المصروفات: حذف مصروف', 'السماح بحذف المصروفات')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


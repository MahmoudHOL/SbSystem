-- صلاحية إدارة الصلاحيات داخل صفحة /settings
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/046_settings_permissions_management.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('settings.permissions', 'manage', 'الإعدادات: إدارة الصلاحيات', 'السماح بفتح لوحة إدارة الصلاحيات والتحكم بالأدوار والصلاحيات')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


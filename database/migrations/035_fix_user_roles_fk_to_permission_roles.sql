-- إصلاح ربط user_roles ليشير إلى permission_roles بدل rbac_roles
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/035_fix_user_roles_fk_to_permission_roles.sql

-- حذف أي روابط Role غير موجودة في جدول permission_roles
DELETE ur
FROM user_roles ur
LEFT JOIN permission_roles pr ON pr.id = ur.role_id
WHERE pr.id IS NULL;

-- إعادة توجيه الـ FK من rbac_roles إلى permission_roles
ALTER TABLE user_roles
  DROP FOREIGN KEY fk_user_roles_role;

ALTER TABLE user_roles
  ADD CONSTRAINT fk_user_roles_role
  FOREIGN KEY (role_id) REFERENCES permission_roles(id)
  ON DELETE CASCADE;


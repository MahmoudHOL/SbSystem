-- حذف جداول الصلاحيات والأدوار بعد إزالة RBAC من الكود
USE sb_pos;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS rbac_role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS rbac_permissions;
DROP TABLE IF EXISTS rbac_roles;
SET FOREIGN_KEY_CHECKS = 1;

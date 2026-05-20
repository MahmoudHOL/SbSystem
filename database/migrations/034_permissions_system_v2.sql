-- نظام صلاحيات جديد (Roles + Permissions)
-- الهدف: تعريف "نوع الصلاحية" وربطه بالموظف مع إمكانيات الفتح/الإغلاق لكل صلاحية.
-- ملاحظة: حساب admin سيُعامل في الكود بصلاحيات كاملة (bypass) ولا يعتمد على هذه الجداول.
--
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/034_permissions_system_v2.sql

CREATE TABLE IF NOT EXISTS permission_roles (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255) NULL,
  is_system TINYINT(1) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permission_roles_code (code),
  KEY idx_permission_roles_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  module_key VARCHAR(100) NOT NULL COMMENT 'مثال: settings.users',
  action_key VARCHAR(50) NOT NULL COMMENT 'مثال: view/create/update/disable',
  title VARCHAR(150) NOT NULL COMMENT 'اسم الصلاحية للعرض',
  description VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_permissions_module_action (module_key, action_key),
  KEY idx_permissions_module (module_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  is_allowed TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 يسمح، 0 يمنع',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_role_permissions_role_permission (role_id, permission_id),
  KEY idx_role_permissions_permission (permission_id),
  CONSTRAINT fk_role_permissions_role FOREIGN KEY (role_id) REFERENCES permission_roles (id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permissions_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_roles (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_roles_user_role (user_id, role_id),
  KEY idx_user_roles_role (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES permission_roles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_permission_overrides (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  is_allowed TINYINT(1) NOT NULL COMMENT '0 منع مباشر، 1 سماح مباشر',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_permission_overrides_user_permission (user_id, permission_id),
  KEY idx_user_permission_overrides_permission (permission_id),
  CONSTRAINT fk_user_permission_overrides_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_user_permission_overrides_permission FOREIGN KEY (permission_id) REFERENCES permissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- صلاحيات البداية المطلوبة لمسار المستخدمين
INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('settings.users', 'view', 'عرض المستخدمين', 'السماح بدخول صفحة المستخدمين وعرض القائمة'),
  ('settings.users', 'create', 'إنشاء مستخدم', 'السماح بإضافة مستخدم جديد'),
  ('settings.users', 'update', 'تعديل مستخدم', 'السماح بتعديل بيانات المستخدم'),
  ('settings.users', 'disable', 'تعطيل مستخدم', 'السماح بتعطيل المستخدم')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);

-- نوع صلاحية افتراضي (موظف عادي) - بدون ربط تلقائي لأي مستخدم
INSERT INTO permission_roles (code, name, description, is_system, is_active)
VALUES ('employee_basic', 'موظف عادي', 'دور افتراضي يمكن تخصيص صلاحياته من الإعدادات', 1, 1)
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  description = VALUES(description),
  is_active = VALUES(is_active);


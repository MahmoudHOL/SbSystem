-- إعدادات النسخ الاحتياطي (الوقت اليومي)
-- تشغيل: mysql -u USER -p DATABASE < database/migrations/031_backup_settings.sql

CREATE TABLE IF NOT EXISTS backup_settings (
  id TINYINT PRIMARY KEY,
  backup_time TIME NOT NULL DEFAULT '00:00:00',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO backup_settings (id, backup_time)
VALUES (1, '00:00:00')
ON DUPLICATE KEY UPDATE backup_time = backup_settings.backup_time;

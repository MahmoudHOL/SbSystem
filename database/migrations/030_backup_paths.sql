-- جدول حفظ مسارات النسخ الاحتياطي
-- تشغيل: mysql -u USER -p DATABASE < database/migrations/030_backup_paths.sql

CREATE TABLE IF NOT EXISTS backup_paths (
  id INT AUTO_INCREMENT PRIMARY KEY,
  backup_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_backup_path (backup_path)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

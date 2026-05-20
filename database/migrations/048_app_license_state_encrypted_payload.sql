SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_license_state'
    AND COLUMN_NAME = 'encrypted_payload'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE app_license_state ADD COLUMN encrypted_payload LONGTEXT NULL AFTER signature', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_license_state'
    AND COLUMN_NAME = 'payload_iv'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE app_license_state ADD COLUMN payload_iv VARCHAR(64) NULL AFTER encrypted_payload', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists := (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'app_license_state'
    AND COLUMN_NAME = 'payload_tag'
);
SET @sql := IF(@col_exists = 0, 'ALTER TABLE app_license_state ADD COLUMN payload_tag VARCHAR(64) NULL AFTER payload_iv', 'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE app_license_state
SET raw_license_json = NULL
WHERE id = 1;

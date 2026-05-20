CREATE TABLE IF NOT EXISTS app_license_state (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  machine_fingerprint VARCHAR(128) NULL,
  license_type ENUM('trial', 'permanent') NULL,
  license_status ENUM('active', 'blocked') NOT NULL DEFAULT 'blocked',
  reason_code VARCHAR(64) NULL,
  issued_at DATETIME NULL,
  expires_at DATETIME NULL,
  signature TEXT NULL,
  raw_license_json JSON NULL,
  last_checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

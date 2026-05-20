-- نسب الخصم (عامة + لكل مستخدم)
CREATE TABLE IF NOT EXISTS discount_rates (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NULL,
  rate_percent  DECIMAL(5,2) NOT NULL COMMENT 'نسبة الخصم بالمائة',
  is_global     TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = خصم عام، 0 = خاص بمستخدم',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_discount_user (user_id),
  KEY idx_discount_global (is_global),
  CONSTRAINT fk_discount_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


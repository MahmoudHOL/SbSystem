-- جدول سيريال المنتج
USE sb_pos;

CREATE TABLE IF NOT EXISTS serial (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  serial VARCHAR(255) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_serial_product (product_id),
  UNIQUE KEY uk_serial_value (serial),
  CONSTRAINT fk_serial_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

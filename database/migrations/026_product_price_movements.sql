-- سجل أسعار المنتج (تراكمي): صف لكل تغيير سعر + تاريخ السريان
-- الملف اسمُه قديماً؛ الجدول الفعلي product_price_history
USE sb_pos;

CREATE TABLE IF NOT EXISTS product_price_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'سعر الشراء الساري من effective_at',
  sale_price DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'سعر البيع الساري من effective_at',
  effective_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'متى أصبح هذا السعر هو النشط',
  source VARCHAR(40) NOT NULL COMMENT 'product_create, product_update, purchase_invoice',
  reference_id INT UNSIGNED NULL COMMENT 'مثلاً رقم فاتورة شراء',
  user_id INT UNSIGNED NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pph_product_effective (product_id, effective_at),
  KEY idx_pph_source_ref (source, reference_id),
  CONSTRAINT fk_pph_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_pph_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

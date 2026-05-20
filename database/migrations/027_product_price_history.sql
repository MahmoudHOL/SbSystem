-- سجل أسعار المنتج: صف تراكمي لكل تغيير، مع effective_at = تاريخ سريان السعر الجديد
-- يحذف الجدول القديم product_price_movements بعد نقل البيانات إن وُجد
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
  COLLATE=utf8mb4_unicode_ci
  COMMENT='كل صف = لقطة سعرية بعد تعديل؛ آلاف الصفوف = آلاف التغييرات';

SET @ppm_exists := (
  SELECT COUNT(*) FROM information_schema.tables
  WHERE table_schema = DATABASE() AND table_name = 'product_price_movements'
);

SET @migrate_sql := IF(
  @ppm_exists > 0,
  'INSERT INTO product_price_history (product_id, purchase_price, sale_price, effective_at, source, reference_id, user_id, created_at)
   SELECT product_id, purchase_price_after, sale_price_after, created_at, source, reference_id, user_id, created_at
   FROM product_price_movements',
  'SELECT 1'
);

PREPARE _mig FROM @migrate_sql;
EXECUTE _mig;
DEALLOCATE PREPARE _mig;

DROP TABLE IF EXISTS product_price_movements;

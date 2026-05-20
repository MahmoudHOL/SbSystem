-- الحد الأدنى للمخزون لكل منتج + قيمة افتراضية عامة للمنتجات بدون حد (NULL أو بدون صف)
-- تشغيل: mysql -u USER -p DATABASE < database/migrations/021_product_minimum_stock.sql

-- --------------------------------------------
-- القيمة الافتراضية العامة (صف واحد id = 1)
-- تُستخدم عندما لا يوجد صف للمنتج في product_minimum_stock أو minimum_quantity = NULL
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS minimum_stock_default (
  id                        TINYINT UNSIGNED NOT NULL PRIMARY KEY COMMENT 'دائماً 1',
  default_minimum_quantity  DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'الحد الأدنى الافتراضي لكل المنتجات',
  updated_at                DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='الحد الأدنى الافتراضي (العام)';

INSERT IGNORE INTO minimum_stock_default (id, default_minimum_quantity) VALUES (1, 0);

-- --------------------------------------------
-- الحد الأدنى لكل منتج (الحد الأدنى للمنتج)
-- minimum_quantity = NULL يعني: استخدم default_minimum_quantity من minimum_stock_default
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS product_minimum_stock (
  product_id         INT UNSIGNED NOT NULL COMMENT 'المنتج',
  minimum_quantity   DECIMAL(15,3) NULL DEFAULT NULL COMMENT 'الحد الأدنى؛ NULL = الافتراضي العام',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  CONSTRAINT fk_pms_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='الحد الأدنى للمخزون لكل منتج';

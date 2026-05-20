-- المنتجات، ربط الكمية بالمخازن، سجل التحديثات، الأسعار
USE sb_pos;

-- --------------------------------------------
-- جدول المنتجات | Products (حذف ناعم)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL COMMENT 'اسم المنتج',
  barcode    CHAR(12) NOT NULL COMMENT 'باركود 12 رقم',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT 'حذف ناعم',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_barcode (barcode),
  KEY idx_products_deleted (deleted_at),
  KEY idx_products_name (name)
) ENGINE=InnoDB;

-- --------------------------------------------
-- ربط المنتجات بالمخازن والكمية | Warehouse Stock (حذف ناعم)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id INT UNSIGNED NOT NULL,
  warehouse_id INT UNSIGNED NOT NULL,
  quantity   DECIMAL(15,3) NOT NULL DEFAULT 0 COMMENT 'الكمية',
  deleted_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_warehouse_stock (product_id, warehouse_id),
  KEY idx_ws_warehouse (warehouse_id),
  KEY idx_ws_deleted (deleted_at),
  CONSTRAINT fk_ws_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_ws_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------
-- سجل تحديث الكميات | Quantity / Stock Movements (لتتبع الأخطاء)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      INT UNSIGNED NOT NULL,
  warehouse_id    INT UNSIGNED NOT NULL,
  quantity_before DECIMAL(15,3) NOT NULL DEFAULT 0,
  quantity_after  DECIMAL(15,3) NOT NULL DEFAULT 0,
  user_id         INT UNSIGNED NULL COMMENT 'من قام بالتحديث',
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sm_product (product_id),
  KEY idx_sm_warehouse (warehouse_id),
  KEY idx_sm_created (created_at),
  CONSTRAINT fk_sm_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_sm_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_sm_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- --------------------------------------------
-- أسعار الشراء والبيع | Product Prices (حذف ناعم)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS product_prices (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id     INT UNSIGNED NOT NULL,
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'سعر الشراء',
  sale_price     DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'سعر البيع',
  deleted_at     DATETIME NULL DEFAULT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pp_product (product_id),
  KEY idx_pp_deleted (deleted_at),
  CONSTRAINT fk_pp_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;

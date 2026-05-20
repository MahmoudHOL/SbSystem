-- ============================================
-- SB POS - قاعدة بيانات النظام
-- Database: sb_pos
-- ============================================

CREATE DATABASE IF NOT EXISTS sb_pos
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE sb_pos;

-- --------------------------------------------
-- جدول المستخدمين | Users Table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  KEY idx_users_active (is_active)
) ENGINE=InnoDB;

-- --------------------------------------------
-- جدول المخازن | Warehouses Table
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS warehouses (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200) NOT NULL COMMENT 'اسم المخزن',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_warehouses_name (name)
) ENGINE=InnoDB;

-- --------------------------------------------
-- جدول طرق الدفع | Payment Methods
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS payment_methods (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name           VARCHAR(200) NOT NULL COMMENT 'اسم طريقة الدفع',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_default_pos TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'الافتراضي لنقطة البيع',
  PRIMARY KEY (id),
  KEY idx_payment_methods_name (name)
) ENGINE=InnoDB;

-- --------------------------------------------
-- جدول المنتجات | Products (حذف ناعم)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(255) NOT NULL COMMENT 'اسم المنتج',
  barcode    CHAR(12) NOT NULL COMMENT 'باركود 12 رقم',
  deleted_at DATETIME NULL DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_barcode (barcode),
  KEY idx_products_deleted (deleted_at)
) ENGINE=InnoDB;

-- --------------------------------------------
-- ربط المنتجات بالمخازن والكمية | Warehouse Stock (حذف ناعم)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_stock (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id  INT UNSIGNED NOT NULL,
  warehouse_id INT UNSIGNED NOT NULL,
  quantity    DECIMAL(15,3) NOT NULL DEFAULT 0,
  deleted_at  DATETIME NULL DEFAULT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_warehouse_stock (product_id, warehouse_id),
  CONSTRAINT fk_ws_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
  CONSTRAINT fk_ws_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------
-- نسب الخصم (عامة + لكل مستخدم)
-- --------------------------------------------
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
) ENGINE=InnoDB;

-- --------------------------------------------
-- سجل تحديث الكميات | Stock Movements (لتتبع الأخطاء)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS stock_movements (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id      INT UNSIGNED NOT NULL,
  warehouse_id    INT UNSIGNED NOT NULL,
  quantity_before DECIMAL(15,3) NOT NULL DEFAULT 0,
  quantity_after  DECIMAL(15,3) NOT NULL DEFAULT 0,
  user_id         INT UNSIGNED NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
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
  purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  sale_price     DECIMAL(12,2) NOT NULL DEFAULT 0,
  deleted_at     DATETIME NULL DEFAULT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_pp_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------
-- الحد الأدنى للمخزون (عام + لكل منتج)
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

CREATE TABLE IF NOT EXISTS product_minimum_stock (
  product_id         INT UNSIGNED NOT NULL COMMENT 'المنتج',
  minimum_quantity   DECIMAL(15,3) NULL DEFAULT NULL COMMENT 'الحد الأدنى؛ NULL = الافتراضي العام',
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  CONSTRAINT fk_pms_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='الحد الأدنى للمخزون لكل منتج';

-- --------------------------------------------
-- جدول الموردين | Suppliers
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200) NOT NULL COMMENT 'اسم المورد',
  phone      VARCHAR(50) NOT NULL COMMENT 'رقم الهاتف',
  note       TEXT NULL COMMENT 'ملاحظة اختيارية',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_suppliers_name (name)
) ENGINE=InnoDB;

-- --------------------------------------------
-- ربط المنتجات بالموردين (علاقة متعدد إلى متعدد)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS product_suppliers (
  product_id  INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, supplier_id),
  KEY idx_ps_supplier (supplier_id),
  CONSTRAINT fk_ps_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- فواتير الشراء + البيع والجداول المرتبطة مهيأة بالمجلات المنفصلة في database/migrations

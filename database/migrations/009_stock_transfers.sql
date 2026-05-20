-- سجل عمليات نقل المخزون (من أين إلى أين، من قام، تفاصيل المنتجات والكميات)
USE sb_pos;

CREATE TABLE IF NOT EXISTS stock_transfers (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  from_warehouse_id INT UNSIGNED NOT NULL COMMENT 'المخزن المصدر',
  to_warehouse_id   INT UNSIGNED NOT NULL COMMENT 'المخزن الهدف',
  user_id           INT UNSIGNED NULL COMMENT 'من قام بالنقل',
  transferred_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_st_from (from_warehouse_id),
  KEY idx_st_to (to_warehouse_id),
  KEY idx_st_date (transferred_at),
  CONSTRAINT fk_st_from FOREIGN KEY (from_warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_st_to FOREIGN KEY (to_warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_st_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  stock_transfer_id INT UNSIGNED NOT NULL,
  product_id        INT UNSIGNED NOT NULL,
  quantity          DECIMAL(15,3) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sti_transfer (stock_transfer_id),
  CONSTRAINT fk_sti_transfer FOREIGN KEY (stock_transfer_id) REFERENCES stock_transfers (id) ON DELETE CASCADE,
  CONSTRAINT fk_sti_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- فواتير الشراء (تسجيل فواتير الشراء من المورد)
USE sb_pos;

CREATE TABLE IF NOT EXISTS purchase_invoices (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_id  INT UNSIGNED NULL COMMENT 'NULL = بدون مورد',
  warehouse_id INT UNSIGNED NOT NULL COMMENT 'المخزن الذي تُضاف إليه الكمية',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'المبلغ المطلوب',
  amount_paid  DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'المبلغ المدفوع',
  user_id      INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pi_supplier (supplier_id),
  KEY idx_pi_warehouse (warehouse_id),
  KEY idx_pi_created (created_at),
  CONSTRAINT fk_pi_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE SET NULL,
  CONSTRAINT fk_pi_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_pi_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_invoice_id INT UNSIGNED NOT NULL,
  product_id          INT UNSIGNED NOT NULL,
  quantity            DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit_purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit_sale_price     DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total          DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_pii_invoice (purchase_invoice_id),
  CONSTRAINT fk_pii_invoice FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_pii_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;

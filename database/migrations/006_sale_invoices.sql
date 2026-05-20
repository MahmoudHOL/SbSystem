-- فواتير البيع
USE sb_pos;

CREATE TABLE IF NOT EXISTS sale_invoices (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  warehouse_id INT UNSIGNED NOT NULL COMMENT 'المخزن الذي يُخصم منه',
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'المبلغ المطلوب',
  amount_paid  DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'المبلغ المدفوع من العميل',
  user_id      INT UNSIGNED NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_si_warehouse (warehouse_id),
  KEY idx_si_created (created_at),
  CONSTRAINT fk_si_warehouse FOREIGN KEY (warehouse_id) REFERENCES warehouses (id) ON DELETE CASCADE,
  CONSTRAINT fk_si_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_invoice_items (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_invoice_id  INT UNSIGNED NOT NULL,
  product_id       INT UNSIGNED NOT NULL,
  quantity         DECIMAL(15,3) NOT NULL DEFAULT 0,
  unit_sale_price  DECIMAL(12,2) NOT NULL DEFAULT 0,
  line_total       DECIMAL(15,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_sii_invoice (sale_invoice_id),
  CONSTRAINT fk_sii_invoice FOREIGN KEY (sale_invoice_id) REFERENCES sale_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_sii_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE=InnoDB;

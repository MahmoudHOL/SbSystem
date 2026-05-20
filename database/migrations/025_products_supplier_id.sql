-- ربط متعدد بين المنتجات والموردين (Many-to-Many)
CREATE TABLE IF NOT EXISTS product_suppliers (
  product_id  INT UNSIGNED NOT NULL,
  supplier_id INT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, supplier_id),
  KEY idx_ps_supplier (supplier_id),
  CONSTRAINT fk_ps_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

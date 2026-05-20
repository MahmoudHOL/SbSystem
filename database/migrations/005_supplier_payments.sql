-- مدفوعات الموردين (تسديد / استلام)
USE sb_pos;

CREATE TABLE IF NOT EXISTS supplier_payments (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  supplier_id INT UNSIGNED NOT NULL COMMENT 'المورد',
  amount      DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'قيمة الحركة',
  direction   ENUM('to_supplier','from_supplier') NOT NULL COMMENT 'to_supplier = نحن ندفع للمورد (مدين علينا), from_supplier = المورد يدفع لنا (دائن لنا)',
  note        VARCHAR(255) NULL,
  user_id     INT UNSIGNED NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sp_supplier (supplier_id),
  CONSTRAINT fk_sp_supplier FOREIGN KEY (supplier_id) REFERENCES suppliers (id) ON DELETE CASCADE,
  CONSTRAINT fk_sp_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;


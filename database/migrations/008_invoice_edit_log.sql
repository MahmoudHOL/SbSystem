-- سجل تعديلات فواتير الشراء والبيع (من قام ومتى)
USE sb_pos;

CREATE TABLE IF NOT EXISTS purchase_invoice_edit_log (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  purchase_invoice_id INT UNSIGNED NOT NULL,
  user_id             INT UNSIGNED NULL COMMENT 'من قام بالتعديل',
  edited_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_piel_invoice (purchase_invoice_id),
  KEY idx_piel_edited (edited_at),
  CONSTRAINT fk_piel_invoice FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_piel_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_invoice_edit_log (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_invoice_id    INT UNSIGNED NOT NULL,
  user_id            INT UNSIGNED NULL COMMENT 'من قام بالتعديل',
  edited_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_siel_invoice (sale_invoice_id),
  KEY idx_siel_edited (edited_at),
  CONSTRAINT fk_siel_invoice FOREIGN KEY (sale_invoice_id) REFERENCES sale_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_siel_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB;

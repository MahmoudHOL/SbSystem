-- جدول الموردين
USE sb_pos;

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

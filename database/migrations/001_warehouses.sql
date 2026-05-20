-- إضافة جدول المخازن إلى sb_pos
USE sb_pos;

CREATE TABLE IF NOT EXISTS warehouses (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(200) NOT NULL COMMENT 'اسم المخزن',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_warehouses_name (name)
) ENGINE=InnoDB;

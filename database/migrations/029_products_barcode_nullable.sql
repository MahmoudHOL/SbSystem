-- السماح بأن يكون الباركود NULL في جدول المنتجات
USE sb_pos;

ALTER TABLE products
  MODIFY COLUMN barcode CHAR(12) NULL COMMENT 'باركود 12 رقم (اختياري)';

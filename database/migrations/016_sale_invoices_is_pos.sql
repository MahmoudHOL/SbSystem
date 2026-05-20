-- إضافة علامة تمييز لفواتير نقطة البيع (POS)
USE sb_pos;

ALTER TABLE sale_invoices
  ADD COLUMN is_pos TINYINT(1) NOT NULL DEFAULT 0 AFTER user_id;


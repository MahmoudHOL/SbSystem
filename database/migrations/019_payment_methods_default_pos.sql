-- طريقة الدفع الافتراضية لنقطة البيع (واحدة فقط)
ALTER TABLE payment_methods
  ADD COLUMN is_default_pos TINYINT(1) NOT NULL DEFAULT 0 AFTER updated_at;

-- توسيع فواتير البيع لواجهة نقطة البيع (POS)
USE sb_pos;

ALTER TABLE sale_invoices
  ADD COLUMN customer_id INT UNSIGNED NULL AFTER supplier_id,
  ADD COLUMN customer_name VARCHAR(200) NULL AFTER customer_id,
  ADD COLUMN customer_phone VARCHAR(50) NULL AFTER customer_name,
  ADD COLUMN payment_method_id INT UNSIGNED NULL AFTER amount_paid,
  ADD COLUMN discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER payment_method_id,
  ADD COLUMN discount_value DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER discount_percent,
  ADD COLUMN total_before_discount DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER discount_value,
  ADD COLUMN total_items DECIMAL(15,3) NOT NULL DEFAULT 0 AFTER total_before_discount,
  ADD CONSTRAINT fk_si_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_si_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL;


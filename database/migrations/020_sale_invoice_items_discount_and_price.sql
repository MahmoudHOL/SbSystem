-- حفظ سعر الوحدة قبل الخصم وخصم البند (خصم المنتج) في بنود فاتورة البيع للاستعمال لاحقاً
ALTER TABLE sale_invoice_items
  ADD COLUMN unit_price_before_discount DECIMAL(12,2) NULL COMMENT 'سعر الوحدة قبل خصم المنتج' AFTER unit_sale_price,
  ADD COLUMN item_discount_percent     DECIMAL(5,2) NOT NULL DEFAULT 0 COMMENT 'نسبة خصم البند %' AFTER line_total,
  ADD COLUMN item_discount_value       DECIMAL(12,2) NOT NULL DEFAULT 0 COMMENT 'قيمة خصم البند' AFTER item_discount_percent;

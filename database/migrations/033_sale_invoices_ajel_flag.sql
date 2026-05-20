-- إضافة علم الأجل لفواتير البيع (0 = نقدي, 1 = أجل)
-- تشغيل: mysql -u root -p sb_pos < database/migrations/033_sale_invoices_ajel_flag.sql

ALTER TABLE sale_invoices
  ADD COLUMN ajel TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'هل الفاتورة أجل؟ 1 نعم، 0 لا'
  AFTER is_pos;

-- مزامنة اختيارية: أي فاتورة مرتبطة بسجل أجل تُعتبر أجل
UPDATE sale_invoices si
JOIN credit_customer_invoices cci ON cci.sale_invoice_id = si.id
SET si.ajel = 1
WHERE si.ajel <> 1;


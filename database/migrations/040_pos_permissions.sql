-- صلاحيات صفحة POS + تبويب سجل المبيعات + تعديل الكمية من التفاصيل
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/040_pos_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('pos.page', 'view', 'دخول صفحة نقطة البيع', 'السماح بالدخول إلى صفحة /pos'),
  ('pos.tabs.sales_log', 'view', 'عرض تبويب سجل المبيعات (POS)', 'السماح بفتح تبويب سجل المبيعات داخل POS'),
  ('pos.sales_log', 'edit_quantity', 'تعديل كمية فاتورة من سجل المبيعات (POS)', 'السماح بتعديل الكمية من زر التفاصيل وحفظ التعديل')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


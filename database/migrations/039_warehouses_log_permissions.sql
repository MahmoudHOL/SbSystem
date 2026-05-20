-- صلاحيات أزرار تبويب سجل الشراء والبيع في /warehouses
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/039_warehouses_log_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('warehouses.log', 'edit_amount', 'تعديل مبلغ الفاتورة (السجل)', 'التحكم بزر المبلغ داخل سجل الشراء والبيع'),
  ('warehouses.log', 'edit_invoice', 'تعديل الفاتورة (السجل)', 'التحكم بزر تعديل الفاتورة داخل سجل الشراء والبيع'),
  ('warehouses.log', 'delete_invoice', 'حذف الفاتورة (السجل)', 'التحكم بزر حذف الفاتورة داخل سجل الشراء والبيع')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


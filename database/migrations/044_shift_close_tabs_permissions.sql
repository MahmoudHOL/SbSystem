-- صلاحيات تبويبات صفحة /shift-close
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/044_shift_close_tabs_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('shift_close.tabs.payment_summary', 'view', 'تقفيل الشفت: تبويب ملخص طرق الدفع', 'السماح بعرض تبويب ملخص طرق الدفع'),
  ('shift_close.tabs.receive_amounts', 'view', 'تقفيل الشفت: تبويب استلام المبالغ', 'السماح بعرض تبويب استلام المبالغ'),
  ('shift_close.tabs.shift_log', 'view', 'تقفيل الشفت: تبويب سجل تقفيل الشفت', 'السماح بعرض تبويب سجل تقفيل الشفت')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


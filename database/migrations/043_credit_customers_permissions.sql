-- صلاحيات صفحة ملف عملاء الأجل: تفاصيل + سداد
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/043_credit_customers_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('credit_customers', 'details', 'ملف عملاء الأجل: التفاصيل', 'السماح بعرض تفاصيل العميل والفواتير وتفاصيل الفاتورة'),
  ('credit_customers', 'settle', 'ملف عملاء الأجل: السداد', 'السماح بتنفيذ سداد فواتير الأجل')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


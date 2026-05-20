-- صلاحيات إظهار/إخفاء تبويبات POS: الاسترجاع + ملف عملاء الأجل
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/041_pos_tabs_returns_credit_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('pos.tabs.returns', 'view', 'POS: عرض تبويب استرجاع/تعديل', 'السماح بفتح تبويب استرجاع / تعديل فواتير نقطة البيع'),
  ('pos.tabs.credit_customers', 'view', 'POS: عرض تبويب ملف عملاء الأجل', 'السماح بفتح تبويب ملف عملاء الأجل داخل POS')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


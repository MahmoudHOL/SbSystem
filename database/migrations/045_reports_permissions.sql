-- صلاحيات كاملة لتقارير المبيعات والجرد
-- تشغيل:
-- mysql -u root -p sb_pos < database/migrations/045_reports_permissions.sql

INSERT INTO permissions (module_key, action_key, title, description)
VALUES
  ('reports.pos_profit', 'view', 'التقارير: تقرير المبيعات', 'السماح بالدخول وعرض بيانات /reports/pos-profit'),
  ('reports.warehouse_report', 'view', 'التقارير: تقرير الجرد', 'السماح بالدخول وعرض بيانات /reports/warehouse-report')
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description);


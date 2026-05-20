-- إزالة نظام الصلاحيات بالكامل (جداول الصلاحيات فقط)
-- ملاحظة: لا نحذف user_warehouses لأنه ليس جزءاً من نظام الصلاحيات.

USE sb_pos;

DROP TABLE IF EXISTS user_permissions;
DROP TABLE IF EXISTS permissions;


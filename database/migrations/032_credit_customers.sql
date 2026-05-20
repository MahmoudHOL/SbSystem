-- عملاء الأجل: ربط فواتير البيع بالمديونية + عمليات السداد
-- تشغيل: mysql -u root -p sb_pos < database/migrations/032_credit_customers.sql

CREATE TABLE IF NOT EXISTS credit_customer_invoices (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id INT UNSIGNED NOT NULL COMMENT 'معرف العميل',
  sale_invoice_id INT UNSIGNED NOT NULL COMMENT 'معرف فاتورة البيع',
  invoice_total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'إجمالي الفاتورة',
  amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'المدفوع وقت إنشاء الفاتورة',
  amount_settled DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'المبلغ المسدد لاحقاً',
  status ENUM('open','partial','settled') NOT NULL DEFAULT 'open' COMMENT 'حالة السداد',
  due_date DATE NULL COMMENT 'تاريخ الاستحقاق (اختياري)',
  note VARCHAR(255) NULL,
  user_id INT UNSIGNED NULL COMMENT 'من أنشأ سجل الأجل',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_cci_sale_invoice (sale_invoice_id),
  KEY idx_cci_customer (customer_id),
  KEY idx_cci_status (status),
  KEY idx_cci_due_date (due_date),
  KEY idx_cci_user (user_id),
  CONSTRAINT fk_cci_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_cci_sale_invoice FOREIGN KEY (sale_invoice_id) REFERENCES sale_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_cci_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT chk_cci_amount_paid CHECK (amount_paid >= 0),
  CONSTRAINT chk_cci_amount_settled CHECK (amount_settled >= 0),
  CONSTRAINT chk_cci_invoice_total CHECK (invoice_total_amount >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS credit_customer_settlements (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  credit_invoice_id INT UNSIGNED NOT NULL COMMENT 'مرجع سجل أجل الفاتورة',
  customer_id INT UNSIGNED NOT NULL COMMENT 'مرجع العميل (للتقارير السريعة)',
  sale_invoice_id INT UNSIGNED NOT NULL COMMENT 'مرجع الفاتورة',
  amount DECIMAL(15,2) NOT NULL COMMENT 'مبلغ عملية السداد',
  payment_method_id INT UNSIGNED NULL COMMENT 'طريقة السداد',
  note VARCHAR(255) NULL,
  user_id INT UNSIGNED NULL COMMENT 'من سجل عملية السداد',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ccs_credit_invoice (credit_invoice_id),
  KEY idx_ccs_customer (customer_id),
  KEY idx_ccs_sale_invoice (sale_invoice_id),
  KEY idx_ccs_user (user_id),
  KEY idx_ccs_payment_method (payment_method_id),
  CONSTRAINT fk_ccs_credit_invoice FOREIGN KEY (credit_invoice_id) REFERENCES credit_customer_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_ccs_customer FOREIGN KEY (customer_id) REFERENCES customers (id) ON DELETE CASCADE,
  CONSTRAINT fk_ccs_sale_invoice FOREIGN KEY (sale_invoice_id) REFERENCES sale_invoices (id) ON DELETE CASCADE,
  CONSTRAINT fk_ccs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL,
  CONSTRAINT fk_ccs_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods (id) ON DELETE SET NULL,
  CONSTRAINT chk_ccs_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


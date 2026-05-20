ALTER TABLE sale_invoices
  ADD COLUMN supplier_id INT UNSIGNED NULL AFTER warehouse_id,
  ADD CONSTRAINT fk_sale_invoices_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL;


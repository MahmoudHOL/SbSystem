-- SB POS - جداول مرتجعات فواتير الشراء والبيع
-- نفِّذ هذا الملف على قاعدة بيانات sb_pos بعد التأكد من بيانات الاتصال

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- مرتجعات فواتير الشراء
CREATE TABLE IF NOT EXISTS `purchase_returns` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `purchase_invoice_id` int unsigned NOT NULL,
  `supplier_id` int unsigned DEFAULT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `user_id` int unsigned DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pr_invoice` (`purchase_invoice_id`),
  CONSTRAINT `fk_pr_invoice`   FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_supplier`  FOREIGN KEY (`supplier_id`)        REFERENCES `suppliers` (`id`)          ON DELETE SET NULL,
  CONSTRAINT `fk_pr_warehouse` FOREIGN KEY (`warehouse_id`)       REFERENCES `warehouses` (`id`)        ON DELETE CASCADE,
  CONSTRAINT `fk_pr_user`      FOREIGN KEY (`user_id`)            REFERENCES `users` (`id`)             ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `purchase_return_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `purchase_return_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `quantity_before` decimal(15,3) NOT NULL,
  `quantity_returned` decimal(15,3) NOT NULL,
  `quantity_after` decimal(15,3) NOT NULL,
  `unit_purchase_price` decimal(12,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pri_return` (`purchase_return_id`),
  CONSTRAINT `fk_pri_return`  FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pri_product` FOREIGN KEY (`product_id`)         REFERENCES `products` (`id`)         ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- مرتجعات فواتير البيع
CREATE TABLE IF NOT EXISTS `sale_returns` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sale_invoice_id` int unsigned NOT NULL,
  `supplier_id` int unsigned DEFAULT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `user_id` int unsigned DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sr_invoice` (`sale_invoice_id`),
  CONSTRAINT `fk_sr_invoice`   FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_supplier`  FOREIGN KEY (`supplier_id`)     REFERENCES `suppliers` (`id`)     ON DELETE SET NULL,
  CONSTRAINT `fk_sr_warehouse` FOREIGN KEY (`warehouse_id`)    REFERENCES `warehouses` (`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_sr_user`      FOREIGN KEY (`user_id`)         REFERENCES `users` (`id`)        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sale_return_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sale_return_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `quantity_before` decimal(15,3) NOT NULL,
  `quantity_returned` decimal(15,3) NOT NULL,
  `quantity_after` decimal(15,3) NOT NULL,
  `unit_sale_price` decimal(12,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_sri_return` (`sale_return_id`),
  CONSTRAINT `fk_sri_return`  FOREIGN KEY (`sale_return_id`) REFERENCES `sale_returns` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sri_product` FOREIGN KEY (`product_id`)     REFERENCES `products` (`id`)    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS=1;


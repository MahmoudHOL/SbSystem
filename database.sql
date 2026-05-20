-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: sb_pos
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'اسم العميل',
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'رقم الهاتف',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customers_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discount_rates`
--

DROP TABLE IF EXISTS `discount_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount_rates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned DEFAULT NULL,
  `rate_percent` decimal(5,2) NOT NULL COMMENT 'نسبة الخصم بالمائة',
  `is_global` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1 = خصم عام، 0 = خاص بمستخدم',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_discount_user` (`user_id`),
  KEY `idx_discount_global` (`is_global`),
  CONSTRAINT `fk_discount_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount_rates`
--

LOCK TABLES `discount_rates` WRITE;
/*!40000 ALTER TABLE `discount_rates` DISABLE KEYS */;
INSERT INTO `discount_rates` VALUES (1,NULL,20.00,1,'2026-02-27 09:38:10','2026-02-27 09:38:42'),(2,2,30.00,0,'2026-02-27 09:38:36','2026-02-27 09:38:40');
/*!40000 ALTER TABLE `discount_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expense_categories`
--

DROP TABLE IF EXISTS `expense_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expense_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES (1,'hello','2026-03-01 09:10:32','2026-03-01 09:10:32');
/*!40000 ALTER TABLE `expense_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `expense_category_id` int unsigned NOT NULL,
  `payment_method_id` int unsigned DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `direction` enum('out','in') NOT NULL DEFAULT 'out',
  `note` text,
  `user_id` int unsigned DEFAULT NULL,
  `warehouse_id` int unsigned DEFAULT NULL,
  `expense_date` date NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_expense_category` (`expense_category_id`),
  KEY `idx_expense_user` (`user_id`),
  KEY `idx_expense_date` (`expense_date`),
  KEY `fk_expense_payment` (`payment_method_id`),
  KEY `idx_expense_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_expense_category` FOREIGN KEY (`expense_category_id`) REFERENCES `expense_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_expense_payment` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_expense_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,1,1,500.00,'out','hello',2,NULL,'2026-03-02','2026-03-01 09:18:23'),(2,1,1,1000.00,'in','alex',2,3,'2026-03-01','2026-03-01 09:32:49');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_methods` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'اسم طريقة الدفع',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payment_methods_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'insta','2026-02-26 23:06:01','2026-02-26 23:06:01');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(50) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'المستخدمين','users',0,'2026-03-01 10:41:57','2026-03-01 11:17:38'),(2,'طرق الدفع','payment_methods',1,'2026-03-01 14:09:23','2026-03-01 14:09:23'),(3,'نسب الخصم','discounts',1,'2026-03-01 14:09:23','2026-03-01 14:09:23'),(4,'تحديد مخزن لي المستخدم','user_warehouses',1,'2026-03-01 14:09:23','2026-03-01 14:09:23'),(5,'فئات المصروفات','expense_categories',1,'2026-03-01 14:09:23','2026-03-01 14:09:23');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pos_sale_item_versions`
--

DROP TABLE IF EXISTS `pos_sale_item_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pos_sale_item_versions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `version_id` bigint unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `unit_sale_price` decimal(12,2) NOT NULL,
  `line_total` decimal(15,2) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pos_item_ver` (`version_id`),
  KEY `idx_pos_item_prod` (`product_id`),
  CONSTRAINT `fk_pos_item_ver` FOREIGN KEY (`version_id`) REFERENCES `pos_sale_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_sale_item_versions`
--

LOCK TABLES `pos_sale_item_versions` WRITE;
/*!40000 ALTER TABLE `pos_sale_item_versions` DISABLE KEYS */;
INSERT INTO `pos_sale_item_versions` VALUES (1,1,1,1.000,12.00,12.00,'2026-02-28 10:53:14');
/*!40000 ALTER TABLE `pos_sale_item_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pos_sale_versions`
--

DROP TABLE IF EXISTS `pos_sale_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pos_sale_versions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `sale_invoice_id` int unsigned NOT NULL,
  `version_no` int unsigned NOT NULL,
  `action_type` enum('created','edited','returned') NOT NULL,
  `customer_name` varchar(200) DEFAULT NULL,
  `customer_phone` varchar(50) DEFAULT NULL,
  `total_before_discount` decimal(15,2) DEFAULT NULL,
  `discount_value` decimal(15,2) DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT NULL,
  `total_amount` decimal(15,2) DEFAULT NULL,
  `payment_method_id` int unsigned DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `sale_return_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pos_ver_invoice` (`sale_invoice_id`,`version_no`),
  KEY `idx_pos_ver_user` (`user_id`),
  KEY `idx_pos_ver_return` (`sale_return_id`),
  CONSTRAINT `fk_pos_ver_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_sale_versions`
--

LOCK TABLES `pos_sale_versions` WRITE;
/*!40000 ALTER TABLE `pos_sale_versions` DISABLE KEYS */;
INSERT INTO `pos_sale_versions` VALUES (1,7,1,'created','amr',NULL,12.00,0.00,0.00,12.00,NULL,2,NULL,'2026-02-28 10:53:14');
/*!40000 ALTER TABLE `pos_sale_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_prices`
--

DROP TABLE IF EXISTS `product_prices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_prices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `purchase_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '?????? ????????????',
  `sale_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT '?????? ??????????',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pp_product` (`product_id`),
  KEY `idx_pp_deleted` (`deleted_at`),
  CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_prices`
--

LOCK TABLES `product_prices` WRITE;
/*!40000 ALTER TABLE `product_prices` DISABLE KEYS */;
INSERT INTO `product_prices` VALUES (1,1,11.00,12.00,NULL,'2026-02-23 09:37:12','2026-02-25 20:04:08'),(2,3,12.00,13.00,NULL,'2026-02-23 10:19:57','2026-02-25 20:04:08'),(3,4,20.00,21.00,NULL,'2026-02-23 10:21:40','2026-02-25 20:04:08'),(4,5,20.00,30.00,NULL,'2026-02-23 10:27:22','2026-02-25 20:04:08'),(5,6,350.00,450.00,NULL,'2026-02-23 14:55:09','2026-02-26 13:59:59');
/*!40000 ALTER TABLE `product_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '?????? ????????????',
  `barcode` char(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '???????????? 12 ??????',
  `deleted_at` datetime DEFAULT NULL COMMENT '?????? ????????',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_barcode` (`barcode`),
  KEY `idx_products_deleted` (`deleted_at`),
  KEY `idx_products_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'hi','123456789012',NULL,'2026-02-23 09:37:12','2026-02-23 09:37:12'),(3,'man','123456789011',NULL,'2026-02-23 10:19:57','2026-02-23 10:19:57'),(4,'nm','123456789778',NULL,'2026-02-23 10:21:40','2026-02-23 10:21:40'),(5,'hello','123456789772',NULL,'2026-02-23 10:27:22','2026-02-23 10:27:22'),(6,'Cam','235098650855',NULL,'2026-02-23 14:55:09','2026-02-23 14:55:09');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_invoice_edit_log`
--

DROP TABLE IF EXISTS `purchase_invoice_edit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_invoice_edit_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `purchase_invoice_id` int unsigned NOT NULL,
  `user_id` int unsigned DEFAULT NULL COMMENT 'من قام بالتعديل',
  `edited_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_piel_invoice` (`purchase_invoice_id`),
  KEY `idx_piel_edited` (`edited_at`),
  KEY `fk_piel_user` (`user_id`),
  CONSTRAINT `fk_piel_invoice` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_piel_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoice_edit_log`
--

LOCK TABLES `purchase_invoice_edit_log` WRITE;
/*!40000 ALTER TABLE `purchase_invoice_edit_log` DISABLE KEYS */;
INSERT INTO `purchase_invoice_edit_log` VALUES (1,13,2,'2026-02-26 13:59:59');
/*!40000 ALTER TABLE `purchase_invoice_edit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_invoice_items`
--

DROP TABLE IF EXISTS `purchase_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_invoice_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `purchase_invoice_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `quantity` decimal(15,3) NOT NULL DEFAULT '0.000',
  `unit_purchase_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unit_sale_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `line_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_pii_invoice` (`purchase_invoice_id`),
  KEY `fk_pii_product` (`product_id`),
  CONSTRAINT `fk_pii_invoice` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pii_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoice_items`
--

LOCK TABLES `purchase_invoice_items` WRITE;
/*!40000 ALTER TABLE `purchase_invoice_items` DISABLE KEYS */;
INSERT INTO `purchase_invoice_items` VALUES (1,1,5,1.000,20.00,30.00,20.00),(2,2,5,1.000,20.00,30.00,20.00),(3,3,5,1.000,20.00,30.00,20.00),(4,5,1,1.000,11.00,12.00,11.00),(5,6,1,15.000,11.00,12.00,165.00),(6,7,6,1.000,350.00,450.00,350.00),(7,8,6,1.000,350.00,450.00,350.00),(8,9,6,200.000,350.00,450.00,70000.00),(9,10,6,11.000,350.00,450.00,3850.00),(20,11,5,6.000,20.00,30.00,120.00),(21,11,1,10.000,11.00,12.00,110.00),(22,11,3,6.000,12.00,13.00,72.00),(23,11,4,6.000,20.00,21.00,120.00),(24,12,6,2.000,350.00,450.00,700.00),(27,13,6,2.000,350.00,450.00,700.00);
/*!40000 ALTER TABLE `purchase_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_invoices`
--

DROP TABLE IF EXISTS `purchase_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_invoices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` int unsigned DEFAULT NULL COMMENT 'NULL = ???????? ????????',
  `warehouse_id` int unsigned NOT NULL COMMENT '???????????? ???????? ?????????? ???????? ????????????',
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '???????????? ??????????????',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '???????????? ??????????????',
  `user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pi_supplier` (`supplier_id`),
  KEY `idx_pi_warehouse` (`warehouse_id`),
  KEY `idx_pi_created` (`created_at`),
  KEY `fk_pi_user` (`user_id`),
  CONSTRAINT `fk_pi_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pi_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoices`
--

LOCK TABLES `purchase_invoices` WRITE;
/*!40000 ALTER TABLE `purchase_invoices` DISABLE KEYS */;
INSERT INTO `purchase_invoices` VALUES (1,1,1,20.00,10.00,1,'2026-02-23 12:57:28','2026-02-23 12:57:28'),(2,1,1,20.00,0.00,1,'2026-02-23 12:57:33','2026-02-23 12:57:33'),(3,1,1,20.00,0.00,1,'2026-02-23 13:08:35','2026-02-23 13:08:35'),(5,1,1,11.00,0.00,1,'2026-02-23 13:20:35','2026-02-23 13:20:35'),(6,NULL,1,165.00,0.00,1,'2026-02-23 13:53:03','2026-02-23 13:53:03'),(7,NULL,1,350.00,500.00,2,'2026-02-24 12:34:42','2026-02-24 12:34:42'),(8,1,3,350.00,500.00,2,'2026-02-24 12:35:58','2026-02-24 12:35:58'),(9,1,3,70000.00,70000.00,2,'2026-02-24 13:41:31','2026-02-24 13:41:31'),(10,2,3,3850.00,3000.00,2,'2026-02-24 14:13:09','2026-02-24 14:13:09'),(11,2,3,422.00,2522.00,2,'2026-02-25 19:42:42','2026-02-25 20:04:08'),(12,NULL,1,700.00,350.00,2,'2026-02-26 03:04:37','2026-02-26 03:04:37'),(13,2,3,700.00,549.00,2,'2026-02-26 03:05:35','2026-02-26 13:59:59');
/*!40000 ALTER TABLE `purchase_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_return_items`
--

DROP TABLE IF EXISTS `purchase_return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_return_items` (
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
  KEY `fk_pri_product` (`product_id`),
  CONSTRAINT `fk_pri_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pri_return` FOREIGN KEY (`purchase_return_id`) REFERENCES `purchase_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_return_items`
--

LOCK TABLES `purchase_return_items` WRITE;
/*!40000 ALTER TABLE `purchase_return_items` DISABLE KEYS */;
INSERT INTO `purchase_return_items` VALUES (1,1,6,200.000,1.000,199.000,350.00,350.00);
/*!40000 ALTER TABLE `purchase_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_returns`
--

DROP TABLE IF EXISTS `purchase_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_returns` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `purchase_invoice_id` int unsigned NOT NULL,
  `supplier_id` int unsigned DEFAULT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `user_id` int unsigned DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pr_invoice` (`purchase_invoice_id`),
  KEY `fk_pr_supplier` (`supplier_id`),
  KEY `fk_pr_warehouse` (`warehouse_id`),
  KEY `fk_pr_user` (`user_id`),
  CONSTRAINT `fk_pr_invoice` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pr_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_returns`
--

LOCK TABLES `purchase_returns` WRITE;
/*!40000 ALTER TABLE `purchase_returns` DISABLE KEYS */;
INSERT INTO `purchase_returns` VALUES (1,13,2,3,350.00,2,NULL,'2026-02-27 14:55:41');
/*!40000 ALTER TABLE `purchase_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_invoice_edit_log`
--

DROP TABLE IF EXISTS `sale_invoice_edit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_invoice_edit_log` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sale_invoice_id` int unsigned NOT NULL,
  `user_id` int unsigned DEFAULT NULL COMMENT 'من قام بالتعديل',
  `edited_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_siel_invoice` (`sale_invoice_id`),
  KEY `idx_siel_edited` (`edited_at`),
  KEY `fk_siel_user` (`user_id`),
  CONSTRAINT `fk_siel_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_siel_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoice_edit_log`
--

LOCK TABLES `sale_invoice_edit_log` WRITE;
/*!40000 ALTER TABLE `sale_invoice_edit_log` DISABLE KEYS */;
INSERT INTO `sale_invoice_edit_log` VALUES (1,6,2,'2026-02-27 22:07:44');
/*!40000 ALTER TABLE `sale_invoice_edit_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_invoice_items`
--

DROP TABLE IF EXISTS `sale_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_invoice_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sale_invoice_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `quantity` decimal(15,3) NOT NULL DEFAULT '0.000',
  `unit_sale_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `line_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  KEY `idx_sii_invoice` (`sale_invoice_id`),
  KEY `fk_sii_product` (`product_id`),
  CONSTRAINT `fk_sii_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sii_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoice_items`
--

LOCK TABLES `sale_invoice_items` WRITE;
/*!40000 ALTER TABLE `sale_invoice_items` DISABLE KEYS */;
INSERT INTO `sale_invoice_items` VALUES (1,1,6,6.000,450.00,2700.00),(2,2,6,1.000,450.00,450.00),(3,3,6,10.000,450.00,4500.00),(4,4,6,10.000,450.00,4500.00),(5,5,6,1.000,450.00,450.00),(7,6,1,2.000,12.00,24.00),(8,7,1,1.000,12.00,12.00);
/*!40000 ALTER TABLE `sale_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_invoices`
--

DROP TABLE IF EXISTS `sale_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_invoices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `warehouse_id` int unsigned NOT NULL COMMENT '???????????? ???????? ?????????? ??????',
  `customer_id` int unsigned DEFAULT NULL,
  `customer_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `supplier_id` int unsigned DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '???????????? ??????????????',
  `global_discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `global_discount_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '???????????? ?????????????? ???? ????????????',
  `payment_method_id` int unsigned DEFAULT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `discount_value` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_before_discount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `total_items` decimal(15,3) NOT NULL DEFAULT '0.000',
  `user_id` int unsigned DEFAULT NULL,
  `is_pos` tinyint(1) NOT NULL DEFAULT '0',
  `invoice_date` date DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_si_warehouse` (`warehouse_id`),
  KEY `idx_si_created` (`created_at`),
  KEY `fk_si_user` (`user_id`),
  KEY `fk_sale_invoices_supplier` (`supplier_id`),
  KEY `fk_si_customer` (`customer_id`),
  KEY `fk_si_payment_method` (`payment_method_id`),
  CONSTRAINT `fk_sale_invoices_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_si_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoices`
--

LOCK TABLES `sale_invoices` WRITE;
/*!40000 ALTER TABLE `sale_invoices` DISABLE KEYS */;
INSERT INTO `sale_invoices` VALUES (1,3,NULL,NULL,NULL,NULL,2700.00,0.00,0.00,2000.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:42:16','2026-03-01 09:44:27'),(2,3,NULL,NULL,NULL,NULL,450.00,0.00,0.00,450.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:47:07','2026-03-01 09:44:27'),(3,3,NULL,NULL,NULL,NULL,4500.00,0.00,0.00,4000.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:56:44','2026-03-01 09:44:27'),(4,3,NULL,NULL,NULL,2,4500.00,0.00,0.00,4000.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:57:42','2026-03-01 09:44:27'),(5,3,NULL,'panda','01227076043',NULL,450.00,0.00,0.00,450.00,NULL,0.00,0.00,450.00,1.000,2,0,'2026-02-27','2026-02-27 20:32:13','2026-03-01 09:44:27'),(6,3,NULL,'hello','01227076043',NULL,24.00,0.00,0.00,12.00,NULL,0.00,0.00,12.00,1.000,2,0,'2026-02-27','2026-02-27 21:49:03','2026-03-01 09:44:27'),(7,3,NULL,'amr',NULL,NULL,12.00,0.00,0.00,12.00,NULL,0.00,0.00,12.00,1.000,2,1,'2026-02-28','2026-02-28 10:53:14','2026-03-01 09:44:27');
/*!40000 ALTER TABLE `sale_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_return_items`
--

DROP TABLE IF EXISTS `sale_return_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_return_items` (
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
  KEY `fk_sri_product` (`product_id`),
  CONSTRAINT `fk_sri_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sri_return` FOREIGN KEY (`sale_return_id`) REFERENCES `sale_returns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_return_items`
--

LOCK TABLES `sale_return_items` WRITE;
/*!40000 ALTER TABLE `sale_return_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_return_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_returns`
--

DROP TABLE IF EXISTS `sale_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_returns` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `sale_invoice_id` int unsigned NOT NULL,
  `supplier_id` int unsigned DEFAULT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `total_return_amount` decimal(15,2) NOT NULL DEFAULT '0.00',
  `user_id` int unsigned DEFAULT NULL,
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sr_invoice` (`sale_invoice_id`),
  KEY `fk_sr_supplier` (`supplier_id`),
  KEY `fk_sr_warehouse` (`warehouse_id`),
  KEY `fk_sr_user` (`user_id`),
  CONSTRAINT `fk_sr_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sr_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sr_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sr_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_returns`
--

LOCK TABLES `sale_returns` WRITE;
/*!40000 ALTER TABLE `sale_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sale_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `quantity_before` decimal(15,3) NOT NULL DEFAULT '0.000',
  `quantity_after` decimal(15,3) NOT NULL DEFAULT '0.000',
  `user_id` int unsigned DEFAULT NULL COMMENT '???? ?????? ????????????????',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sm_product` (`product_id`),
  KEY `idx_sm_warehouse` (`warehouse_id`),
  KEY `idx_sm_created` (`created_at`),
  KEY `fk_sm_user` (`user_id`),
  CONSTRAINT `fk_sm_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_sm_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,4,1,0.000,30.000,1,'2026-02-23 10:21:40'),(2,5,1,0.000,10.000,1,'2026-02-23 10:27:22'),(3,5,1,10.000,11.000,1,'2026-02-23 12:57:28'),(4,5,1,11.000,12.000,1,'2026-02-23 12:57:33'),(5,5,1,12.000,13.000,1,'2026-02-23 13:08:35'),(7,1,1,0.000,1.000,1,'2026-02-23 13:20:35'),(8,1,1,1.000,16.000,1,'2026-02-23 13:53:03'),(9,6,3,0.000,10.000,1,'2026-02-23 14:55:09'),(10,6,1,0.000,1.000,2,'2026-02-24 12:34:42'),(11,6,3,10.000,11.000,2,'2026-02-24 12:35:58'),(12,6,3,11.000,211.000,2,'2026-02-24 13:41:31'),(13,6,3,211.000,205.000,2,'2026-02-24 13:42:16'),(14,6,3,205.000,204.000,2,'2026-02-24 13:47:07'),(15,6,3,204.000,194.000,2,'2026-02-24 13:56:44'),(16,6,3,194.000,184.000,2,'2026-02-24 13:57:42'),(17,6,3,184.000,195.000,2,'2026-02-24 14:13:09'),(18,6,3,195.000,201.000,2,'2026-02-25 19:42:42'),(19,5,3,0.000,6.000,2,'2026-02-25 19:42:42'),(20,1,3,0.000,10.000,2,'2026-02-25 19:42:42'),(21,3,3,0.000,6.000,2,'2026-02-25 19:42:42'),(22,4,3,0.000,6.000,2,'2026-02-25 19:42:42'),(23,6,3,201.000,195.000,2,'2026-02-25 20:03:30'),(24,5,3,6.000,0.000,2,'2026-02-25 20:03:30'),(25,1,3,10.000,0.000,2,'2026-02-25 20:03:30'),(26,3,3,6.000,0.000,2,'2026-02-25 20:03:30'),(27,4,3,6.000,0.000,2,'2026-02-25 20:03:30'),(28,6,3,195.000,200.000,2,'2026-02-25 20:03:30'),(29,5,3,0.000,6.000,2,'2026-02-25 20:03:30'),(30,1,3,0.000,10.000,2,'2026-02-25 20:03:30'),(31,3,3,0.000,6.000,2,'2026-02-25 20:03:30'),(32,4,3,0.000,6.000,2,'2026-02-25 20:03:30'),(33,6,3,200.000,195.000,2,'2026-02-25 20:04:08'),(34,5,3,6.000,0.000,2,'2026-02-25 20:04:08'),(35,1,3,10.000,0.000,2,'2026-02-25 20:04:08'),(36,3,3,6.000,0.000,2,'2026-02-25 20:04:08'),(37,4,3,6.000,0.000,2,'2026-02-25 20:04:08'),(38,5,3,0.000,6.000,2,'2026-02-25 20:04:08'),(39,1,3,0.000,10.000,2,'2026-02-25 20:04:08'),(40,3,3,0.000,6.000,2,'2026-02-25 20:04:08'),(41,4,3,0.000,6.000,2,'2026-02-25 20:04:08'),(42,6,1,1.000,3.000,2,'2026-02-26 03:04:37'),(43,6,3,195.000,197.000,2,'2026-02-26 03:05:35'),(44,6,3,197.000,195.000,2,'2026-02-26 03:06:21'),(45,6,3,195.000,197.000,2,'2026-02-26 03:06:21'),(46,6,3,197.000,195.000,2,'2026-02-26 13:59:59'),(47,6,3,195.000,197.000,2,'2026-02-26 13:59:59'),(48,4,1,30.000,0.000,2,'2026-02-26 18:44:20'),(49,4,3,6.000,36.000,2,'2026-02-26 18:44:20'),(50,5,1,13.000,0.000,2,'2026-02-26 18:44:20'),(51,5,3,6.000,19.000,2,'2026-02-26 18:44:20'),(52,1,1,16.000,0.000,2,'2026-02-26 18:44:20'),(53,1,3,10.000,26.000,2,'2026-02-26 18:44:20'),(54,6,1,3.000,0.000,2,'2026-02-26 18:44:20'),(55,6,3,197.000,200.000,2,'2026-02-26 18:44:20'),(56,6,3,200.000,199.000,2,'2026-02-27 14:55:41'),(58,6,3,199.000,198.000,2,'2026-02-27 20:32:13'),(59,1,3,26.000,25.000,2,'2026-02-27 21:49:03'),(60,1,3,25.000,26.000,2,'2026-02-27 22:07:44'),(61,1,3,26.000,24.000,2,'2026-02-27 22:07:44'),(62,1,3,24.000,23.000,2,'2026-02-28 10:53:14');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfer_items`
--

DROP TABLE IF EXISTS `stock_transfer_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfer_items` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `stock_transfer_id` int unsigned NOT NULL,
  `product_id` int unsigned NOT NULL,
  `quantity` decimal(15,3) NOT NULL DEFAULT '0.000',
  PRIMARY KEY (`id`),
  KEY `idx_sti_transfer` (`stock_transfer_id`),
  KEY `fk_sti_product` (`product_id`),
  CONSTRAINT `fk_sti_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sti_transfer` FOREIGN KEY (`stock_transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
INSERT INTO `stock_transfer_items` VALUES (1,1,4,30.000),(2,1,5,13.000),(3,1,1,16.000),(4,1,6,3.000);
/*!40000 ALTER TABLE `stock_transfer_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_transfers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `from_warehouse_id` int unsigned NOT NULL COMMENT 'المخزن المصدر',
  `to_warehouse_id` int unsigned NOT NULL COMMENT 'المخزن الهدف',
  `user_id` int unsigned DEFAULT NULL COMMENT 'من قام بالنقل',
  `transferred_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_st_from` (`from_warehouse_id`),
  KEY `idx_st_to` (`to_warehouse_id`),
  KEY `idx_st_date` (`transferred_at`),
  KEY `fk_st_user` (`user_id`),
  CONSTRAINT `fk_st_from` FOREIGN KEY (`from_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_st_to` FOREIGN KEY (`to_warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_st_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
INSERT INTO `stock_transfers` VALUES (1,1,3,2,'2026-02-26 18:44:20'),(2,1,3,2,'2026-02-26 18:45:33'),(3,1,3,2,'2026-02-26 18:48:23');
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supplier_payments`
--

DROP TABLE IF EXISTS `supplier_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supplier_payments` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `supplier_id` int unsigned NOT NULL COMMENT '????????????',
  `amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT '???????? ????????????',
  `direction` enum('to_supplier','from_supplier') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'to_supplier = ?????? ???????? ???????????? (???????? ??????????), from_supplier = ???????????? ???????? ?????? (???????? ??????)',
  `note` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sp_supplier` (`supplier_id`),
  KEY `fk_sp_user` (`user_id`),
  CONSTRAINT `fk_sp_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
INSERT INTO `supplier_payments` VALUES (1,1,10.00,'to_supplier','hello',2,'2026-02-24 11:52:57'),(2,1,10.00,'from_supplier','note',2,'2026-02-24 12:22:33'),(3,2,1750.00,'from_supplier',NULL,2,'2026-02-26 03:03:47');
/*!40000 ALTER TABLE `supplier_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '?????? ????????????',
  `phone` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '?????? ????????????',
  `note` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '???????????? ????????????????',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_suppliers_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'panda','+201227076043','none','2026-02-23 10:49:24','2026-02-23 10:49:24'),(2,'هنيدي','+201224944302',NULL,'2026-02-23 14:49:55','2026-02-23 14:49:55');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permissions` (
  `user_id` int unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`user_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES (1,1,1),(1,2,1),(1,3,1),(1,4,1),(1,5,1),(2,1,1),(2,2,1),(2,3,1),(2,4,1),(2,5,1);
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_warehouses`
--

DROP TABLE IF EXISTS `user_warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_warehouses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_warehouse` (`user_id`,`warehouse_id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_warehouse` (`warehouse_id`),
  CONSTRAINT `fk_uw_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_uw_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_warehouses`
--

LOCK TABLES `user_warehouses` WRITE;
/*!40000 ALTER TABLE `user_warehouses` DISABLE KEYS */;
INSERT INTO `user_warehouses` VALUES (1,1,1,'2026-02-28 11:17:53'),(3,2,3,'2026-02-28 11:26:53');
/*!40000 ALTER TABLE `user_warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  KEY `idx_users_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$hZtX/3AiZc1ocSnID6Tsy.bBTpArvr44dFW5X04qO8siEfTRQlrXC','مدير النظام',1,'2026-02-23 08:54:55','2026-02-23 08:54:55'),(2,'panda','$2a$10$vwSSqRwwaSikpiGPEQQ7AuqaJAwk/YAE3yz2MTk/AA12.msb19wzG','panda',1,'2026-02-24 11:17:10','2026-02-24 11:17:10');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_stock`
--

DROP TABLE IF EXISTS `warehouse_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_stock` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `warehouse_id` int unsigned NOT NULL,
  `quantity` decimal(15,3) NOT NULL DEFAULT '0.000' COMMENT '????????????',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_warehouse_stock` (`product_id`,`warehouse_id`),
  KEY `idx_ws_warehouse` (`warehouse_id`),
  KEY `idx_ws_deleted` (`deleted_at`),
  CONSTRAINT `fk_ws_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ws_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_stock`
--

LOCK TABLES `warehouse_stock` WRITE;
/*!40000 ALTER TABLE `warehouse_stock` DISABLE KEYS */;
INSERT INTO `warehouse_stock` VALUES (1,4,1,0.000,NULL,'2026-02-23 10:21:40','2026-02-26 18:44:20'),(2,5,1,0.000,NULL,'2026-02-23 10:27:22','2026-02-26 18:44:20'),(4,1,1,0.000,NULL,'2026-02-23 13:20:35','2026-02-26 18:44:20'),(5,6,3,198.000,NULL,'2026-02-23 14:55:09','2026-02-27 20:32:13'),(6,6,1,0.000,NULL,'2026-02-24 12:34:42','2026-02-26 18:44:20'),(7,5,3,19.000,NULL,'2026-02-25 19:42:42','2026-02-26 18:44:20'),(8,1,3,23.000,NULL,'2026-02-25 19:42:42','2026-02-28 10:53:14'),(9,3,3,6.000,NULL,'2026-02-25 19:42:42','2026-02-25 20:04:08'),(10,4,3,36.000,NULL,'2026-02-25 19:42:42','2026-02-26 18:44:20');
/*!40000 ALTER TABLE `warehouse_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '?????? ????????????',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_warehouses_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'hello','2026-02-23 09:25:41','2026-02-23 09:25:41'),(2,'hunter','2026-02-23 13:26:46','2026-02-23 13:26:46'),(3,'Sb','2026-02-23 14:48:47','2026-02-23 14:48:47');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-01 14:11:28

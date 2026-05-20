-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: localhost    Database: sb_pos
-- ------------------------------------------------------
-- Server version	8.0.45-0ubuntu0.24.04.1

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
-- Table structure for table `company_profile`
--

DROP TABLE IF EXISTS `company_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `company_profile` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `logo_path` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_profile`
--

LOCK TABLES `company_profile` WRITE;
/*!40000 ALTER TABLE `company_profile` DISABLE KEYS */;
INSERT INTO `company_profile` VALUES (1,'sb_smart','/uploads/company/logo-1773238368327.png','2026-03-11 16:12:48','2026-03-11 16:12:48');
/*!40000 ALTER TABLE `company_profile` ENABLE KEYS */;
UNLOCK TABLES;

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
INSERT INTO `expenses` VALUES (2,1,1,1000.00,'in','sss2',2,3,'2026-02-25','2026-03-01 09:32:49');
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `minimum_stock_default`
--

DROP TABLE IF EXISTS `minimum_stock_default`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `minimum_stock_default` (
  `id` tinyint unsigned NOT NULL COMMENT 'دائماً 1',
  `default_minimum_quantity` decimal(15,3) NOT NULL DEFAULT '0.000' COMMENT 'الحد الأدنى الافتراضي لكل المنتجات',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الحد الأدنى الافتراضي (العام)';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `minimum_stock_default`
--

LOCK TABLES `minimum_stock_default` WRITE;
/*!40000 ALTER TABLE `minimum_stock_default` DISABLE KEYS */;
INSERT INTO `minimum_stock_default` VALUES (1,0.000,'2026-03-22 22:08:43');
/*!40000 ALTER TABLE `minimum_stock_default` ENABLE KEYS */;
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
  `is_default_pos` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_payment_methods_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'insta','2026-02-26 23:06:01','2026-03-14 23:58:04',1);
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_sale_item_versions`
--

LOCK TABLES `pos_sale_item_versions` WRITE;
/*!40000 ALTER TABLE `pos_sale_item_versions` DISABLE KEYS */;
INSERT INTO `pos_sale_item_versions` VALUES (1,1,1,1.000,12.00,12.00,'2026-02-28 10:53:14'),(2,2,6,3.000,450.00,1350.00,'2026-03-13 17:07:23'),(3,2,5,1.000,30.00,30.00,'2026-03-13 17:07:23'),(4,2,3,1.000,13.00,13.00,'2026-03-13 17:07:23'),(5,2,4,1.000,21.00,21.00,'2026-03-13 17:07:23'),(6,3,6,1.000,450.00,450.00,'2026-03-13 17:16:39'),(7,4,6,1.000,450.00,450.00,'2026-03-15 00:01:59'),(8,4,5,1.000,30.00,30.00,'2026-03-15 00:01:59'),(9,4,4,1.000,21.00,21.00,'2026-03-15 00:01:59'),(10,4,3,1.000,13.00,13.00,'2026-03-15 00:01:59'),(11,5,5,1.000,30.00,30.00,'2026-03-15 00:14:18'),(12,5,6,1.000,450.00,450.00,'2026-03-15 00:14:18'),(13,5,3,1.000,13.00,13.00,'2026-03-15 00:14:18'),(14,6,6,1.000,450.00,450.00,'2026-03-15 00:28:51'),(15,6,5,1.000,30.00,30.00,'2026-03-15 00:28:51'),(16,6,4,1.000,21.00,21.00,'2026-03-15 00:28:51'),(17,6,3,1.000,13.00,13.00,'2026-03-15 00:28:51');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_sale_versions`
--

LOCK TABLES `pos_sale_versions` WRITE;
/*!40000 ALTER TABLE `pos_sale_versions` DISABLE KEYS */;
INSERT INTO `pos_sale_versions` VALUES (1,7,1,'created','amr',NULL,12.00,0.00,0.00,12.00,NULL,2,NULL,'2026-02-28 10:53:14'),(2,8,1,'created','panda','01227076043',1414.00,0.00,0.00,1414.00,NULL,2,NULL,'2026-03-13 17:07:23'),(3,9,1,'created',NULL,NULL,450.00,0.00,0.00,450.00,NULL,2,NULL,'2026-03-13 17:16:39'),(4,10,1,'created',NULL,NULL,514.00,500.00,97.28,14.00,1,2,NULL,'2026-03-15 00:01:59'),(5,11,1,'created',NULL,NULL,493.00,70.00,14.20,423.00,1,2,NULL,'2026-03-15 00:14:18'),(6,12,1,'created',NULL,NULL,514.00,60.00,11.67,454.00,1,2,NULL,'2026-03-15 00:28:51');
/*!40000 ALTER TABLE `pos_sale_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pos_shift_closures`
--

DROP TABLE IF EXISTS `pos_shift_closures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pos_shift_closures` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `payment_method_id` int unsigned DEFAULT NULL,
  `employee_user_id` int unsigned NOT NULL,
  `closed_by_user_id` int unsigned NOT NULL,
  `required_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `received_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `remaining_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `note` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_psc_payment_method` (`payment_method_id`),
  KEY `idx_psc_employee_user` (`employee_user_id`),
  KEY `idx_psc_closed_by` (`closed_by_user_id`),
  CONSTRAINT `fk_psc_closed_by` FOREIGN KEY (`closed_by_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_psc_employee_user` FOREIGN KEY (`employee_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_psc_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_shift_closures`
--

LOCK TABLES `pos_shift_closures` WRITE;
/*!40000 ALTER TABLE `pos_shift_closures` DISABLE KEYS */;
INSERT INTO `pos_shift_closures` VALUES (1,1,2,2,891.00,800.00,91.00,NULL,'2026-03-19 10:08:58'),(2,1,2,2,91.00,67.00,24.00,NULL,'2026-03-21 20:16:15');
/*!40000 ALTER TABLE `pos_shift_closures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_edit_logs`
--

DROP TABLE IF EXISTS `product_edit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_edit_logs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `old_name` varchar(255) NOT NULL,
  `old_barcode` char(12) NOT NULL,
  `old_purchase_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `old_sale_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pel_product` (`product_id`),
  KEY `idx_pel_user` (`user_id`),
  CONSTRAINT `fk_pel_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pel_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_edit_logs`
--

LOCK TABLES `product_edit_logs` WRITE;
/*!40000 ALTER TABLE `product_edit_logs` DISABLE KEYS */;
INSERT INTO `product_edit_logs` VALUES (1,6,'Cam','235098650855',350.00,450.00,2,'2026-03-11 20:35:19'),(2,6,'Can','235098650855',350.00,450.00,2,'2026-03-11 20:39:29');
/*!40000 ALTER TABLE `product_edit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_minimum_stock`
--

DROP TABLE IF EXISTS `product_minimum_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_minimum_stock` (
  `product_id` int unsigned NOT NULL COMMENT 'المنتج',
  `minimum_quantity` decimal(15,3) DEFAULT NULL COMMENT 'الحد الأدنى؛ NULL = الافتراضي العام',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`),
  CONSTRAINT `fk_pms_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='الحد الأدنى للمخزون لكل منتج';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_minimum_stock`
--

LOCK TABLES `product_minimum_stock` WRITE;
/*!40000 ALTER TABLE `product_minimum_stock` DISABLE KEYS */;
INSERT INTO `product_minimum_stock` VALUES (3,20.000,'2026-03-22 22:23:07','2026-03-22 22:23:07'),(5,20.000,'2026-03-22 22:23:07','2026-03-22 22:23:07'),(6,30.000,'2026-03-22 22:23:07','2026-03-22 22:23:34'),(7,20.000,'2026-03-22 22:23:07','2026-03-22 22:23:07');
/*!40000 ALTER TABLE `product_minimum_stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_price_history`
--

DROP TABLE IF EXISTS `product_price_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_price_history` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `purchase_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'سعر الشراء الساري من effective_at',
  `sale_price` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'سعر البيع الساري من effective_at',
  `effective_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'متى أصبح هذا السعر هو النشط',
  `source` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'product_create, product_update, purchase_invoice',
  `reference_id` int unsigned DEFAULT NULL COMMENT 'مثلاً رقم فاتورة شراء',
  `user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pph_product_effective` (`product_id`,`effective_at`),
  KEY `idx_pph_source_ref` (`source`,`reference_id`),
  KEY `fk_pph_user` (`user_id`),
  CONSTRAINT `fk_pph_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pph_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='كل صف = لقطة سعرية بعد تعديل؛ آلاف الصفوف = آلاف التغييرات';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_price_history`
--

LOCK TABLES `product_price_history` WRITE;
/*!40000 ALTER TABLE `product_price_history` DISABLE KEYS */;
INSERT INTO `product_price_history` VALUES (1,16,700.00,800.00,'2026-03-28 00:12:20','purchase_invoice',19,2,'2026-03-28 00:12:20');
/*!40000 ALTER TABLE `product_price_history` ENABLE KEYS */;
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
  UNIQUE KEY `uk_pp_product` (`product_id`),
  KEY `idx_pp_product` (`product_id`),
  KEY `idx_pp_deleted` (`deleted_at`),
  CONSTRAINT `fk_pp_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_prices`
--

LOCK TABLES `product_prices` WRITE;
/*!40000 ALTER TABLE `product_prices` DISABLE KEYS */;
INSERT INTO `product_prices` VALUES (2,3,12.00,13.00,NULL,'2026-02-23 10:19:57','2026-02-25 20:04:08'),(3,4,20.00,21.00,'2026-03-16 09:03:14','2026-02-23 10:21:40','2026-03-16 09:03:14'),(4,5,20.00,30.00,NULL,'2026-02-23 10:27:22','2026-03-11 08:49:45'),(5,6,350.00,450.00,NULL,'2026-02-23 14:55:09','2026-03-11 23:07:33'),(8,7,11.00,12.00,NULL,'2026-03-16 09:14:07','2026-03-16 09:14:07'),(9,8,250.00,300.00,NULL,'2026-03-27 01:36:11','2026-03-27 01:36:11'),(10,9,4000.00,4500.00,NULL,'2026-03-27 01:41:27','2026-03-27 01:41:27'),(11,10,7800.00,8500.00,NULL,'2026-03-27 02:10:32','2026-03-27 02:10:32'),(12,11,4000.00,5000.00,NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(13,12,1000.00,1100.00,NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(14,13,2500.00,2700.00,NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(15,14,1100.00,1200.00,NULL,'2026-03-27 02:40:59','2026-03-27 02:40:59'),(16,15,3000.00,4000.00,NULL,'2026-03-27 02:40:59','2026-03-27 02:40:59'),(17,16,700.00,800.00,NULL,'2026-03-28 00:12:20','2026-03-28 00:23:02');
/*!40000 ALTER TABLE `product_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_suppliers`
--

DROP TABLE IF EXISTS `product_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_suppliers` (
  `product_id` int unsigned NOT NULL,
  `supplier_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`product_id`,`supplier_id`),
  KEY `idx_ps_supplier` (`supplier_id`),
  CONSTRAINT `fk_ps_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ps_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_suppliers`
--

LOCK TABLES `product_suppliers` WRITE;
/*!40000 ALTER TABLE `product_suppliers` DISABLE KEYS */;
INSERT INTO `product_suppliers` VALUES (14,5,'2026-03-27 02:40:59'),(15,5,'2026-03-27 02:40:59'),(16,2,'2026-03-28 00:23:02'),(16,6,'2026-03-28 00:12:20');
/*!40000 ALTER TABLE `product_suppliers` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'hi','DEL000000001','2026-03-11 17:40:44','2026-02-23 09:37:12','2026-03-11 17:40:44'),(3,'man','123456789011',NULL,'2026-02-23 10:19:57','2026-02-23 10:19:57'),(4,'nm','DEL000000004','2026-03-16 09:03:14','2026-02-23 10:21:40','2026-03-16 09:03:14'),(5,'hello','123456789772',NULL,'2026-02-23 10:27:22','2026-02-23 10:27:22'),(6,'Cam','235098650855',NULL,'2026-02-23 14:55:09','2026-03-11 20:39:29'),(7,'hitner','793333912806',NULL,'2026-03-16 09:14:07','2026-03-16 09:14:07'),(8,'cam 2','446666898036',NULL,'2026-03-27 01:36:11','2026-03-27 01:36:11'),(9,'nano m5','163741794516',NULL,'2026-03-27 01:41:27','2026-03-27 01:41:27'),(10,'nano stashn ac','695113729099',NULL,'2026-03-27 02:10:32','2026-03-27 02:10:32'),(11,'cam 8 mag unv','507497530010',NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(12,'cam 2 mag unv','927670782355',NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(13,'cam 5 mag unv','540758235305',NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(14,'cam 2 mag unv','224551562442',NULL,'2026-03-27 02:40:59','2026-03-27 02:40:59'),(15,'cam 5 mag unv','745284227460',NULL,'2026-03-27 02:40:59','2026-03-27 02:40:59'),(16,'swtsh 8','180820718543',NULL,'2026-03-28 00:12:20','2026-03-28 00:12:20');
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
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoice_items`
--

LOCK TABLES `purchase_invoice_items` WRITE;
/*!40000 ALTER TABLE `purchase_invoice_items` DISABLE KEYS */;
INSERT INTO `purchase_invoice_items` VALUES (1,1,5,1.000,20.00,30.00,20.00),(2,2,5,1.000,20.00,30.00,20.00),(3,3,5,1.000,20.00,30.00,20.00),(4,5,1,1.000,11.00,12.00,11.00),(5,6,1,15.000,11.00,12.00,165.00),(6,7,6,1.000,350.00,450.00,350.00),(7,8,6,1.000,350.00,450.00,350.00),(8,9,6,200.000,350.00,450.00,70000.00),(9,10,6,11.000,350.00,450.00,3850.00),(20,11,5,6.000,20.00,30.00,120.00),(21,11,1,10.000,11.00,12.00,110.00),(22,11,3,6.000,12.00,13.00,72.00),(23,11,4,6.000,20.00,21.00,120.00),(24,12,6,2.000,350.00,450.00,700.00),(27,13,6,2.000,350.00,450.00,700.00),(28,14,5,1.000,20.00,30.00,20.00),(29,14,1,1.000,11.00,12.00,11.00),(30,15,6,1.000,350.00,450.00,350.00),(31,16,6,1.000,350.00,450.00,350.00),(32,17,11,30.000,4000.00,5000.00,120000.00),(33,17,12,20.000,1000.00,1100.00,20000.00),(34,17,13,10.000,2500.00,2700.00,25000.00),(35,18,14,10.000,1100.00,1200.00,11000.00),(36,18,15,10.000,3000.00,4000.00,30000.00),(37,19,16,5.000,700.00,800.00,3500.00),(38,20,16,4.000,700.00,800.00,2800.00);
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
  `payment_method_id` int unsigned DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_pi_supplier` (`supplier_id`),
  KEY `idx_pi_warehouse` (`warehouse_id`),
  KEY `idx_pi_created` (`created_at`),
  KEY `fk_pi_user` (`user_id`),
  KEY `fk_pi_payment_method` (`payment_method_id`),
  CONSTRAINT `fk_pi_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pi_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pi_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_pi_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoices`
--

LOCK TABLES `purchase_invoices` WRITE;
/*!40000 ALTER TABLE `purchase_invoices` DISABLE KEYS */;
INSERT INTO `purchase_invoices` VALUES (1,1,1,20.00,10.00,NULL,1,'2026-02-23 12:57:28','2026-02-23 12:57:28',NULL),(2,1,1,20.00,0.00,NULL,1,'2026-02-23 12:57:33','2026-02-23 12:57:33',NULL),(3,1,1,20.00,0.00,NULL,1,'2026-02-23 13:08:35','2026-02-23 13:08:35',NULL),(5,1,1,11.00,0.00,NULL,1,'2026-02-23 13:20:35','2026-02-23 13:20:35',NULL),(6,NULL,1,165.00,0.00,NULL,1,'2026-02-23 13:53:03','2026-02-23 13:53:03',NULL),(7,NULL,1,350.00,500.00,NULL,2,'2026-02-24 12:34:42','2026-02-24 12:34:42',NULL),(8,1,3,350.00,500.00,NULL,2,'2026-02-24 12:35:58','2026-02-24 12:35:58',NULL),(9,1,3,70000.00,70000.00,NULL,2,'2026-02-24 13:41:31','2026-02-24 13:41:31',NULL),(10,2,3,3850.00,3000.00,NULL,2,'2026-02-24 14:13:09','2026-02-24 14:13:09',NULL),(11,2,3,422.00,2522.00,NULL,2,'2026-02-25 19:42:42','2026-02-25 20:04:08',NULL),(12,NULL,1,700.00,350.00,NULL,2,'2026-02-26 03:04:37','2026-02-26 03:04:37',NULL),(13,2,3,700.00,549.00,NULL,2,'2026-02-26 03:05:35','2026-02-26 13:59:59',NULL),(14,1,3,31.00,120.00,NULL,2,'2026-03-11 08:49:45','2026-03-11 08:49:45',NULL),(15,1,3,350.00,100.00,NULL,2,'2026-03-11 22:38:45','2026-03-11 22:38:45',NULL),(16,1,3,350.00,0.00,NULL,2,'2026-03-11 23:07:33','2026-03-11 23:07:33',NULL),(17,2,3,165000.00,65000.00,1,2,'2026-03-27 02:26:27','2026-03-27 02:26:27',NULL),(18,5,3,41000.00,5000.00,1,2,'2026-03-27 02:40:59','2026-03-27 02:40:59',NULL),(19,6,3,3500.00,500.00,1,2,'2026-03-28 00:12:20','2026-03-28 00:12:20',NULL),(20,2,3,2800.00,5000.00,NULL,2,'2026-03-28 00:23:02','2026-03-28 00:23:02',NULL);
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
-- Table structure for table `rbac_permissions`
--

DROP TABLE IF EXISTS `rbac_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rbac_permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rbac_permissions_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rbac_permissions`
--

LOCK TABLES `rbac_permissions` WRITE;
/*!40000 ALTER TABLE `rbac_permissions` DISABLE KEYS */;
INSERT INTO `rbac_permissions` VALUES (1,'إدارة المستخدمين','manage_users','صفحات وإجراءات المستخدمين','2026-03-23 18:57:48'),(2,'إدارة النظام','manage_system','إعدادات النظام الأساسية','2026-03-23 18:57:48'),(3,'إدارة الأدوار','manage_roles','إنشاء الأدوار وربطها بالصلاحيات والمستخدمين','2026-03-23 18:57:48'),(4,'إضافة مصروف','add_expenses','إنشاء مصروف جديد','2026-03-23 18:57:48'),(5,'تعديل المصروفات','edit_expenses','تعديل المصروفات','2026-03-23 18:57:48'),(6,'حذف المصروفات','delete_expenses','حذف المصروفات','2026-03-23 18:57:48'),(7,'تعديل الفواتير','edit_invoices','تعديل فواتير الشراء/البيع','2026-03-23 18:57:48'),(8,'حذف الفواتير','delete_invoices','حذف فواتير الشراء/البيع','2026-03-23 18:57:48');
/*!40000 ALTER TABLE `rbac_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rbac_role_permissions`
--

DROP TABLE IF EXISTS `rbac_role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rbac_role_permissions` (
  `role_id` int unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `fk_rbac_rp_permission` (`permission_id`),
  CONSTRAINT `fk_rbac_rp_permission` FOREIGN KEY (`permission_id`) REFERENCES `rbac_permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rbac_rp_role` FOREIGN KEY (`role_id`) REFERENCES `rbac_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rbac_role_permissions`
--

LOCK TABLES `rbac_role_permissions` WRITE;
/*!40000 ALTER TABLE `rbac_role_permissions` DISABLE KEYS */;
INSERT INTO `rbac_role_permissions` VALUES (3,1,'2026-03-23 20:50:11'),(4,1,'2026-03-23 22:31:57'),(4,3,'2026-03-23 22:31:57'),(4,6,'2026-03-23 22:31:57');
/*!40000 ALTER TABLE `rbac_role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rbac_roles`
--

DROP TABLE IF EXISTS `rbac_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rbac_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rbac_roles_name` (`name`),
  UNIQUE KEY `uk_rbac_roles_slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rbac_roles`
--

LOCK TABLES `rbac_roles` WRITE;
/*!40000 ALTER TABLE `rbac_roles` DISABLE KEYS */;
INSERT INTO `rbac_roles` VALUES (1,'admin','admin',1,'2026-03-23 18:57:48','2026-03-23 18:57:48'),(2,'cashier','cashier',1,'2026-03-23 18:57:48','2026-03-23 18:57:48'),(3,'tester','tester',0,'2026-03-23 20:50:11','2026-03-23 20:50:11'),(4,'tester2','tester2',0,'2026-03-23 21:23:25','2026-03-23 21:23:25');
/*!40000 ALTER TABLE `rbac_roles` ENABLE KEYS */;
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
  `unit_price_before_discount` decimal(12,2) DEFAULT NULL COMMENT 'سعر الوحدة قبل خصم المنتج',
  `line_total` decimal(15,2) NOT NULL DEFAULT '0.00',
  `item_discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT 'نسبة خصم البند %',
  `item_discount_value` decimal(12,2) NOT NULL DEFAULT '0.00' COMMENT 'قيمة خصم البند',
  PRIMARY KEY (`id`),
  KEY `idx_sii_invoice` (`sale_invoice_id`),
  KEY `fk_sii_product` (`product_id`),
  CONSTRAINT `fk_sii_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sii_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoice_items`
--

LOCK TABLES `sale_invoice_items` WRITE;
/*!40000 ALTER TABLE `sale_invoice_items` DISABLE KEYS */;
INSERT INTO `sale_invoice_items` VALUES (1,1,6,6.000,450.00,NULL,2700.00,0.00,0.00),(2,2,6,1.000,450.00,NULL,450.00,0.00,0.00),(3,3,6,10.000,450.00,NULL,4500.00,0.00,0.00),(4,4,6,10.000,450.00,NULL,4500.00,0.00,0.00),(5,5,6,1.000,450.00,NULL,450.00,0.00,0.00),(7,6,1,2.000,12.00,NULL,24.00,0.00,0.00),(8,7,1,1.000,12.00,NULL,12.00,0.00,0.00),(9,8,6,3.000,450.00,NULL,1350.00,0.00,0.00),(10,8,5,1.000,30.00,NULL,30.00,0.00,0.00),(11,8,3,1.000,13.00,NULL,13.00,0.00,0.00),(12,8,4,1.000,21.00,NULL,21.00,0.00,0.00),(13,9,6,1.000,450.00,NULL,450.00,0.00,0.00),(14,10,6,1.000,450.00,NULL,450.00,0.00,0.00),(15,10,5,1.000,30.00,NULL,30.00,0.00,0.00),(16,10,4,1.000,21.00,NULL,21.00,0.00,0.00),(17,10,3,1.000,13.00,NULL,13.00,0.00,0.00),(18,11,5,1.000,30.00,30.00,30.00,0.00,0.00),(19,11,6,1.000,450.00,450.00,450.00,0.00,0.00),(20,11,3,1.000,13.00,13.00,13.00,0.00,0.00),(21,12,6,1.000,450.00,450.00,450.00,0.00,0.00),(22,12,5,1.000,30.00,30.00,30.00,0.00,0.00),(23,12,4,1.000,21.00,21.00,21.00,0.00,0.00),(24,12,3,1.000,13.00,13.00,13.00,0.00,0.00);
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
  `deleted_at` datetime DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoices`
--

LOCK TABLES `sale_invoices` WRITE;
/*!40000 ALTER TABLE `sale_invoices` DISABLE KEYS */;
INSERT INTO `sale_invoices` VALUES (1,3,NULL,NULL,NULL,NULL,2700.00,0.00,0.00,2000.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:42:16','2026-03-01 09:44:27',NULL),(2,3,NULL,NULL,NULL,NULL,450.00,0.00,0.00,450.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:47:07','2026-03-01 09:44:27',NULL),(3,3,NULL,NULL,NULL,NULL,4500.00,0.00,0.00,4000.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:56:44','2026-03-01 09:44:27',NULL),(4,3,NULL,NULL,NULL,2,4500.00,0.00,0.00,4000.00,NULL,0.00,0.00,0.00,0.000,2,0,'2026-02-24','2026-02-24 13:57:42','2026-03-01 09:44:27',NULL),(5,3,NULL,'panda','01227076043',NULL,450.00,0.00,0.00,450.00,NULL,0.00,0.00,450.00,1.000,2,0,'2026-02-27','2026-02-27 20:32:13','2026-03-01 09:44:27',NULL),(6,3,NULL,'hello','01227076043',NULL,24.00,0.00,0.00,12.00,NULL,0.00,0.00,12.00,1.000,2,0,'2026-02-27','2026-02-27 21:49:03','2026-03-01 09:44:27',NULL),(7,3,NULL,'amr',NULL,NULL,12.00,0.00,0.00,12.00,NULL,0.00,0.00,12.00,1.000,2,1,'2026-02-28','2026-02-28 10:53:14','2026-03-01 09:44:27',NULL),(8,3,NULL,'panda','01227076043',NULL,1414.00,0.00,0.00,1414.00,NULL,0.00,0.00,1414.00,6.000,2,1,'2026-03-13','2026-03-13 17:07:23','2026-03-13 17:07:23',NULL),(9,3,NULL,NULL,NULL,NULL,450.00,0.00,0.00,450.00,NULL,0.00,0.00,450.00,1.000,2,1,'2026-03-13','2026-03-13 17:16:39','2026-03-13 17:16:39',NULL),(10,3,NULL,NULL,NULL,NULL,14.00,0.00,0.00,14.00,1,97.28,500.00,514.00,4.000,2,1,'2026-03-14','2026-03-15 00:01:59','2026-03-15 00:01:59',NULL),(11,3,NULL,NULL,NULL,NULL,423.00,0.00,0.00,423.00,1,14.20,70.00,493.00,3.000,2,1,'2026-03-14','2026-03-15 00:14:18','2026-03-15 00:14:18',NULL),(12,3,NULL,NULL,NULL,NULL,454.00,0.00,0.00,454.00,1,11.67,60.00,514.00,4.000,2,1,'2026-03-14','2026-03-15 00:28:51','2026-03-15 00:28:51',NULL);
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
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,4,1,0.000,30.000,1,'2026-02-23 10:21:40'),(2,5,1,0.000,10.000,1,'2026-02-23 10:27:22'),(3,5,1,10.000,11.000,1,'2026-02-23 12:57:28'),(4,5,1,11.000,12.000,1,'2026-02-23 12:57:33'),(5,5,1,12.000,13.000,1,'2026-02-23 13:08:35'),(7,1,1,0.000,1.000,1,'2026-02-23 13:20:35'),(8,1,1,1.000,16.000,1,'2026-02-23 13:53:03'),(9,6,3,0.000,10.000,1,'2026-02-23 14:55:09'),(10,6,1,0.000,1.000,2,'2026-02-24 12:34:42'),(11,6,3,10.000,11.000,2,'2026-02-24 12:35:58'),(12,6,3,11.000,211.000,2,'2026-02-24 13:41:31'),(13,6,3,211.000,205.000,2,'2026-02-24 13:42:16'),(14,6,3,205.000,204.000,2,'2026-02-24 13:47:07'),(15,6,3,204.000,194.000,2,'2026-02-24 13:56:44'),(16,6,3,194.000,184.000,2,'2026-02-24 13:57:42'),(17,6,3,184.000,195.000,2,'2026-02-24 14:13:09'),(18,6,3,195.000,201.000,2,'2026-02-25 19:42:42'),(19,5,3,0.000,6.000,2,'2026-02-25 19:42:42'),(20,1,3,0.000,10.000,2,'2026-02-25 19:42:42'),(21,3,3,0.000,6.000,2,'2026-02-25 19:42:42'),(22,4,3,0.000,6.000,2,'2026-02-25 19:42:42'),(23,6,3,201.000,195.000,2,'2026-02-25 20:03:30'),(24,5,3,6.000,0.000,2,'2026-02-25 20:03:30'),(25,1,3,10.000,0.000,2,'2026-02-25 20:03:30'),(26,3,3,6.000,0.000,2,'2026-02-25 20:03:30'),(27,4,3,6.000,0.000,2,'2026-02-25 20:03:30'),(28,6,3,195.000,200.000,2,'2026-02-25 20:03:30'),(29,5,3,0.000,6.000,2,'2026-02-25 20:03:30'),(30,1,3,0.000,10.000,2,'2026-02-25 20:03:30'),(31,3,3,0.000,6.000,2,'2026-02-25 20:03:30'),(32,4,3,0.000,6.000,2,'2026-02-25 20:03:30'),(33,6,3,200.000,195.000,2,'2026-02-25 20:04:08'),(34,5,3,6.000,0.000,2,'2026-02-25 20:04:08'),(35,1,3,10.000,0.000,2,'2026-02-25 20:04:08'),(36,3,3,6.000,0.000,2,'2026-02-25 20:04:08'),(37,4,3,6.000,0.000,2,'2026-02-25 20:04:08'),(38,5,3,0.000,6.000,2,'2026-02-25 20:04:08'),(39,1,3,0.000,10.000,2,'2026-02-25 20:04:08'),(40,3,3,0.000,6.000,2,'2026-02-25 20:04:08'),(41,4,3,0.000,6.000,2,'2026-02-25 20:04:08'),(42,6,1,1.000,3.000,2,'2026-02-26 03:04:37'),(43,6,3,195.000,197.000,2,'2026-02-26 03:05:35'),(44,6,3,197.000,195.000,2,'2026-02-26 03:06:21'),(45,6,3,195.000,197.000,2,'2026-02-26 03:06:21'),(46,6,3,197.000,195.000,2,'2026-02-26 13:59:59'),(47,6,3,195.000,197.000,2,'2026-02-26 13:59:59'),(48,4,1,30.000,0.000,2,'2026-02-26 18:44:20'),(49,4,3,6.000,36.000,2,'2026-02-26 18:44:20'),(50,5,1,13.000,0.000,2,'2026-02-26 18:44:20'),(51,5,3,6.000,19.000,2,'2026-02-26 18:44:20'),(52,1,1,16.000,0.000,2,'2026-02-26 18:44:20'),(53,1,3,10.000,26.000,2,'2026-02-26 18:44:20'),(54,6,1,3.000,0.000,2,'2026-02-26 18:44:20'),(55,6,3,197.000,200.000,2,'2026-02-26 18:44:20'),(56,6,3,200.000,199.000,2,'2026-02-27 14:55:41'),(58,6,3,199.000,198.000,2,'2026-02-27 20:32:13'),(59,1,3,26.000,25.000,2,'2026-02-27 21:49:03'),(60,1,3,25.000,26.000,2,'2026-02-27 22:07:44'),(61,1,3,26.000,24.000,2,'2026-02-27 22:07:44'),(62,1,3,24.000,23.000,2,'2026-02-28 10:53:14'),(63,5,3,19.000,20.000,2,'2026-03-11 08:49:45'),(64,1,3,23.000,24.000,2,'2026-03-11 08:49:45'),(65,6,3,198.000,199.000,2,'2026-03-11 22:38:45'),(66,6,3,199.000,200.000,2,'2026-03-11 23:07:33'),(67,6,3,200.000,197.000,2,'2026-03-13 17:07:23'),(68,5,3,20.000,19.000,2,'2026-03-13 17:07:23'),(69,3,3,6.000,5.000,2,'2026-03-13 17:07:23'),(70,4,3,36.000,35.000,2,'2026-03-13 17:07:23'),(71,6,3,197.000,196.000,2,'2026-03-13 17:16:39'),(72,6,3,196.000,195.000,2,'2026-03-15 00:01:59'),(73,5,3,19.000,18.000,2,'2026-03-15 00:01:59'),(74,4,3,35.000,34.000,2,'2026-03-15 00:01:59'),(75,3,3,5.000,4.000,2,'2026-03-15 00:01:59'),(76,5,3,18.000,17.000,2,'2026-03-15 00:14:18'),(77,6,3,195.000,194.000,2,'2026-03-15 00:14:18'),(78,3,3,4.000,3.000,2,'2026-03-15 00:14:18'),(79,6,3,194.000,193.000,2,'2026-03-15 00:28:51'),(80,5,3,17.000,16.000,2,'2026-03-15 00:28:51'),(81,4,3,34.000,33.000,2,'2026-03-15 00:28:51'),(82,3,3,3.000,2.000,2,'2026-03-15 00:28:51'),(83,7,2,0.000,15.000,2,'2026-03-16 09:14:07'),(84,6,3,193.000,183.000,2,'2026-03-16 09:16:53'),(85,6,1,0.000,10.000,2,'2026-03-16 09:16:53'),(86,8,3,0.000,0.003,2,'2026-03-27 01:36:11'),(87,9,3,0.000,2.000,2,'2026-03-27 01:41:27'),(88,10,3,0.000,2.000,2,'2026-03-27 02:10:32'),(89,11,3,0.000,30.000,2,'2026-03-27 02:26:27'),(90,12,3,0.000,20.000,2,'2026-03-27 02:26:27'),(91,13,3,0.000,10.000,2,'2026-03-27 02:26:27'),(92,14,3,0.000,10.000,2,'2026-03-27 02:40:59'),(93,15,3,0.000,10.000,2,'2026-03-27 02:40:59'),(94,16,3,0.000,5.000,2,'2026-03-28 00:12:20'),(95,16,3,5.000,9.000,2,'2026-03-28 00:23:02');
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
INSERT INTO `stock_transfer_items` VALUES (1,1,4,30.000),(2,1,5,13.000),(3,1,1,16.000),(4,1,6,3.000),(5,4,6,10.000);
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
INSERT INTO `stock_transfers` VALUES (1,1,3,2,'2026-02-26 18:44:20'),(2,1,3,2,'2026-02-26 18:45:33'),(3,1,3,2,'2026-02-26 18:48:23'),(4,3,1,2,'2026-03-16 09:16:53');
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (1,'panda','+201227076043','none','2026-02-23 10:49:24','2026-02-23 10:49:24'),(2,'هنيدي','+201224944302',NULL,'2026-02-23 14:49:55','2026-02-23 14:49:55'),(3,'احمد حسين','01222158456','h','2026-03-27 01:35:16','2026-03-27 01:35:16'),(4,'محمد منوفيnano','01061711647','21','2026-03-27 02:08:34','2026-03-27 02:08:34'),(5,'aslam عرب','012225255252','25','2026-03-27 02:37:53','2026-03-27 02:37:53'),(6,'sameh','0122455666',NULL,'2026-03-28 00:02:33','2026-03-28 00:02:33');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `user_id` int unsigned NOT NULL,
  `role_id` int unsigned NOT NULL,
  `assigned_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  KEY `idx_user_roles_role` (`role_id`),
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `rbac_roles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,'2026-03-23 18:57:48'),(2,4,'2026-03-23 21:23:47');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_stock`
--

LOCK TABLES `warehouse_stock` WRITE;
/*!40000 ALTER TABLE `warehouse_stock` DISABLE KEYS */;
INSERT INTO `warehouse_stock` VALUES (1,4,1,0.000,NULL,'2026-02-23 10:21:40','2026-02-26 18:44:20'),(2,5,1,0.000,NULL,'2026-02-23 10:27:22','2026-02-26 18:44:20'),(4,1,1,0.000,NULL,'2026-02-23 13:20:35','2026-02-26 18:44:20'),(5,6,3,183.000,NULL,'2026-02-23 14:55:09','2026-03-16 09:16:53'),(6,6,1,10.000,NULL,'2026-02-24 12:34:42','2026-03-16 09:16:53'),(7,5,3,16.000,NULL,'2026-02-25 19:42:42','2026-03-15 00:28:51'),(8,1,3,24.000,NULL,'2026-02-25 19:42:42','2026-03-11 08:49:45'),(9,3,3,2.000,NULL,'2026-02-25 19:42:42','2026-03-15 00:28:51'),(10,4,3,33.000,NULL,'2026-02-25 19:42:42','2026-03-15 00:28:51'),(11,7,2,15.000,NULL,'2026-03-16 09:14:07','2026-03-16 09:14:07'),(12,8,3,0.003,NULL,'2026-03-27 01:36:11','2026-03-27 01:36:11'),(13,9,3,2.000,NULL,'2026-03-27 01:41:27','2026-03-27 01:41:27'),(14,10,3,2.000,NULL,'2026-03-27 02:10:32','2026-03-27 02:10:32'),(15,11,3,30.000,NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(16,12,3,20.000,NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(17,13,3,10.000,NULL,'2026-03-27 02:26:27','2026-03-27 02:26:27'),(18,14,3,10.000,NULL,'2026-03-27 02:40:59','2026-03-27 02:40:59'),(19,15,3,10.000,NULL,'2026-03-27 02:40:59','2026-03-27 02:40:59'),(20,16,3,9.000,NULL,'2026-03-28 00:12:20','2026-03-28 00:23:02');
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,'hello','2026-02-23 09:25:41','2026-02-23 09:25:41'),(2,'hunter','2026-02-23 13:26:46','2026-02-23 13:26:46'),(3,'Sb','2026-02-23 14:48:47','2026-02-23 14:48:47'),(4,'hello','2026-03-16 09:03:42','2026-03-16 09:03:42'),(5,'hello','2026-03-16 09:08:20','2026-03-16 09:08:20'),(6,'mn','2026-03-16 09:08:32','2026-03-16 09:08:32'),(7,'hunter','2026-03-16 09:09:11','2026-03-16 09:09:11');
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

-- Dump completed on 2026-03-28  0:48:39

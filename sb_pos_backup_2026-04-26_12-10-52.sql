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
-- Table structure for table `app_license_state`
--

DROP TABLE IF EXISTS `app_license_state`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `app_license_state` (
  `id` tinyint unsigned NOT NULL,
  `machine_fingerprint` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_type` enum('trial','permanent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `license_status` enum('active','blocked') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'blocked',
  `reason_code` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `issued_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  `signature` text COLLATE utf8mb4_unicode_ci,
  `raw_license_json` json DEFAULT NULL,
  `last_checked_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_license_state`
--

LOCK TABLES `app_license_state` WRITE;
/*!40000 ALTER TABLE `app_license_state` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_license_state` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_paths`
--

DROP TABLE IF EXISTS `backup_paths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_paths` (
  `id` int NOT NULL AUTO_INCREMENT,
  `backup_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_backup_path` (`backup_path`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_paths`
--

LOCK TABLES `backup_paths` WRITE;
/*!40000 ALTER TABLE `backup_paths` DISABLE KEYS */;
INSERT INTO `backup_paths` VALUES (1,'E:\\sa','2026-04-21 18:32:46'),(3,'C:\\Users\\Administrator\\Desktop\\sb','2026-04-20 05:42:56');
/*!40000 ALTER TABLE `backup_paths` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `backup_settings`
--

DROP TABLE IF EXISTS `backup_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backup_settings` (
  `id` tinyint NOT NULL,
  `backup_time` time NOT NULL DEFAULT '00:00:00',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backup_settings`
--

LOCK TABLES `backup_settings` WRITE;
/*!40000 ALTER TABLE `backup_settings` DISABLE KEYS */;
INSERT INTO `backup_settings` VALUES (1,'22:35:00','2026-04-21 18:33:54');
/*!40000 ALTER TABLE `backup_settings` ENABLE KEYS */;
UNLOCK TABLES;

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `company_profile`
--

LOCK TABLES `company_profile` WRITE;
/*!40000 ALTER TABLE `company_profile` DISABLE KEYS */;
/*!40000 ALTER TABLE `company_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_customer_invoices`
--

DROP TABLE IF EXISTS `credit_customer_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_customer_invoices` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `customer_id` int unsigned NOT NULL COMMENT 'معرف العميل',
  `sale_invoice_id` int unsigned NOT NULL COMMENT 'معرف فاتورة البيع',
  `invoice_total_amount` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'إجمالي الفاتورة',
  `amount_paid` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'المدفوع وقت إنشاء الفاتورة',
  `amount_settled` decimal(15,2) NOT NULL DEFAULT '0.00' COMMENT 'المبلغ المسدد لاحقاً',
  `status` enum('open','partial','settled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open' COMMENT 'حالة السداد',
  `due_date` date DEFAULT NULL COMMENT 'تاريخ الاستحقاق (اختياري)',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL COMMENT 'من أنشأ سجل الأجل',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_cci_sale_invoice` (`sale_invoice_id`),
  KEY `idx_cci_customer` (`customer_id`),
  KEY `idx_cci_status` (`status`),
  KEY `idx_cci_due_date` (`due_date`),
  KEY `idx_cci_user` (`user_id`),
  CONSTRAINT `fk_cci_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cci_sale_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cci_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_cci_amount_paid` CHECK ((`amount_paid` >= 0)),
  CONSTRAINT `chk_cci_amount_settled` CHECK ((`amount_settled` >= 0)),
  CONSTRAINT `chk_cci_invoice_total` CHECK ((`invoice_total_amount` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_customer_invoices`
--

LOCK TABLES `credit_customer_invoices` WRITE;
/*!40000 ALTER TABLE `credit_customer_invoices` DISABLE KEYS */;
INSERT INTO `credit_customer_invoices` VALUES (1,4,3,16.00,5.00,11.00,'settled',NULL,NULL,1,'2026-04-22 11:52:08','2026-04-22 12:36:08'),(2,5,4,2450.00,450.00,500.00,'partial','2026-05-10','دفعة أولى مستلمة بعد الفاتورة',1,'2026-04-22 12:37:34','2026-04-22 12:37:34'),(3,6,5,3120.00,1200.00,0.00,'partial','2026-05-15','عميل ملتزم بسداد أسبوعي',1,'2026-04-22 12:37:34','2026-04-22 12:37:34'),(4,7,6,1780.00,0.00,300.00,'partial','2026-05-20','لا يوجد دفعة مقدمة',1,'2026-04-22 12:37:34','2026-04-22 12:37:34');
/*!40000 ALTER TABLE `credit_customer_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_customer_settlements`
--

DROP TABLE IF EXISTS `credit_customer_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `credit_customer_settlements` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `credit_invoice_id` int unsigned NOT NULL COMMENT 'مرجع سجل أجل الفاتورة',
  `customer_id` int unsigned NOT NULL COMMENT 'مرجع العميل (للتقارير السريعة)',
  `sale_invoice_id` int unsigned NOT NULL COMMENT 'مرجع الفاتورة',
  `amount` decimal(15,2) NOT NULL COMMENT 'مبلغ عملية السداد',
  `payment_method_id` int unsigned DEFAULT NULL COMMENT 'طريقة السداد',
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` int unsigned DEFAULT NULL COMMENT 'من سجل عملية السداد',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ccs_credit_invoice` (`credit_invoice_id`),
  KEY `idx_ccs_customer` (`customer_id`),
  KEY `idx_ccs_sale_invoice` (`sale_invoice_id`),
  KEY `idx_ccs_user` (`user_id`),
  KEY `idx_ccs_payment_method` (`payment_method_id`),
  CONSTRAINT `fk_ccs_credit_invoice` FOREIGN KEY (`credit_invoice_id`) REFERENCES `credit_customer_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ccs_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ccs_payment_method` FOREIGN KEY (`payment_method_id`) REFERENCES `payment_methods` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_ccs_sale_invoice` FOREIGN KEY (`sale_invoice_id`) REFERENCES `sale_invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ccs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_ccs_amount` CHECK ((`amount` > 0))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_customer_settlements`
--

LOCK TABLES `credit_customer_settlements` WRITE;
/*!40000 ALTER TABLE `credit_customer_settlements` DISABLE KEYS */;
INSERT INTO `credit_customer_settlements` VALUES (1,1,4,3,11.00,NULL,'سداد من شاشة عميل الأجل',1,'2026-04-22 12:36:08'),(2,2,5,4,500.00,1,'سداد جزئي أول',1,'2026-04-21 09:30:00'),(3,4,7,6,300.00,2,'سداد جزئي من نفس الفاتورة',1,'2026-04-21 12:10:00');
/*!40000 ALTER TABLE `credit_customer_settlements` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,'Cash Customer','0500000000','2026-04-21 12:35:43','2026-04-21 12:37:54'),(2,'Modern Facade Co.','0553333333','2026-04-21 12:35:43','2026-04-21 12:37:54'),(3,'Solid Build LLC','0554444444','2026-04-21 12:35:43','2026-04-21 12:37:54'),(4,'amr khaled','AJEL-1776851528723','2026-04-22 11:52:08','2026-04-22 11:52:08'),(5,'شركة المدى للمقاولات','0559000001','2026-04-22 12:37:34','2026-04-22 12:37:34'),(6,'مؤسسة واحة البناء','0559000002','2026-04-22 12:37:34','2026-04-22 12:37:34'),(7,'مجموعة الإتقان الهندسية','0559000003','2026-04-22 12:37:34','2026-04-22 12:37:34');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount_rates`
--

LOCK TABLES `discount_rates` WRITE;
/*!40000 ALTER TABLE `discount_rates` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expense_categories`
--

LOCK TABLES `expense_categories` WRITE;
/*!40000 ALTER TABLE `expense_categories` DISABLE KEYS */;
INSERT INTO `expense_categories` VALUES (1,'????????????','2026-04-19 00:01:45','2026-04-19 00:01:45'),(2,'????','2026-04-19 00:01:53','2026-04-19 00:01:53'),(3,'??? ??? ???','2026-04-19 00:02:03','2026-04-19 00:02:03'),(4,'??????','2026-04-19 00:02:13','2026-04-19 00:02:13'),(5,'?????','2026-04-21 22:25:06','2026-04-21 22:25:06'),(6,'????','2026-04-21 22:25:14','2026-04-21 22:25:14'),(7,'?????? ???','2026-04-21 22:25:35','2026-04-21 22:25:35'),(8,'?????','2026-04-22 02:47:04','2026-04-22 02:47:04'),(9,'?????','2026-04-22 02:47:15','2026-04-22 02:47:15'),(10,'????? ????','2026-04-22 02:47:34','2026-04-22 02:47:34');
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
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,2,1,25.00,'out',NULL,1,1,'2026-04-19','2026-04-19 11:49:30'),(2,4,1,300.00,'out','?????',1,1,'2026-04-21','2026-04-21 22:20:34'),(3,3,1,780.00,'out','Utilities bill',2,2,'2026-04-15','2026-04-15 14:00:00'),(4,3,1,1500.00,'out','Digital marketing campaign',3,3,'2026-04-16','2026-04-16 11:30:00'),(5,5,1,75.00,'out',NULL,1,1,'2026-04-22','2026-04-22 02:42:30'),(6,6,1,75.00,'out',NULL,1,1,'2026-04-22','2026-04-22 02:42:48'),(7,7,1,200.00,'out',NULL,1,1,'2026-04-21','2026-04-22 02:43:37'),(8,9,1,50.00,'out',NULL,1,1,'2026-04-22','2026-04-22 02:52:49'),(9,9,1,60.00,'out','?????? 6 ????',1,1,'2026-04-22','2026-04-22 02:53:39'),(10,4,1,250.00,'out',NULL,1,1,'2026-04-22','2026-04-22 13:23:31'),(11,7,1,200.00,'out',NULL,1,1,'2026-04-22','2026-04-22 18:56:18');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES (1,'????','2026-04-19 00:01:10','2026-04-21 22:24:51',1),(2,'?????','2026-04-21 22:21:45','2026-04-21 22:21:45',0),(3,'????','2026-04-21 22:21:57','2026-04-21 22:24:51',0);
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permission_roles`
--

DROP TABLE IF EXISTS `permission_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permission_roles` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permission_roles_code` (`code`),
  KEY `idx_permission_roles_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permission_roles`
--

LOCK TABLES `permission_roles` WRITE;
/*!40000 ALTER TABLE `permission_roles` DISABLE KEYS */;
INSERT INTO `permission_roles` VALUES (1,'employee_basic','┘à┘êÏ©┘ü Ï╣ÏºÏ»┘è','Ï»┘êÏ▒ Ïº┘üÏ¬Ï▒ÏºÏÂ┘è ┘è┘à┘â┘å Ï¬Ï«ÏÁ┘èÏÁ ÏÁ┘äÏºÏ¡┘èÏºÏ¬┘ç ┘à┘å Ïº┘äÏÑÏ╣Ï»ÏºÏ»ÏºÏ¬',1,1,'2026-04-25 12:00:35','2026-04-25 12:00:35');
/*!40000 ALTER TABLE `permission_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `module_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '┘àÏ½Ïº┘ä: settings.users',
  `action_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '┘àÏ½Ïº┘ä: view/create/update/disable',
  `title` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ÏºÏ│┘à Ïº┘äÏÁ┘äÏºÏ¡┘èÏ® ┘ä┘äÏ╣Ï▒ÏÂ',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_permissions_module_action` (`module_key`,`action_key`),
  KEY `idx_permissions_module` (`module_key`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'settings.users','view','Ï╣Ï▒ÏÂ Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à┘è┘å','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï»Ï«┘ê┘ä ÏÁ┘üÏ¡Ï® Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à┘è┘å ┘êÏ╣Ï▒ÏÂ Ïº┘ä┘éÏºÏª┘àÏ®','2026-04-25 12:00:35'),(2,'settings.users','create','ÏÑ┘åÏ┤ÏºÏí ┘àÏ│Ï¬Ï«Ï»┘à','Ïº┘äÏ│┘àÏºÏ¡ Ï¿ÏÑÏÂÏº┘üÏ® ┘àÏ│Ï¬Ï«Ï»┘à Ï¼Ï»┘èÏ»','2026-04-25 12:00:35'),(3,'settings.users','update','Ï¬Ï╣Ï»┘è┘ä ┘àÏ│Ï¬Ï«Ï»┘à','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï¬Ï╣Ï»┘è┘ä Ï¿┘èÏº┘åÏºÏ¬ Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à','2026-04-25 12:00:35'),(4,'settings.users','disable','Ï¬Ï╣ÏÀ┘è┘ä ┘àÏ│Ï¬Ï«Ï»┘à','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï¬Ï╣ÏÀ┘è┘ä Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à','2026-04-25 12:00:35'),(5,'settings.system.payment_methods','view','ÏÀÏ▒┘é Ïº┘äÏ»┘üÏ╣','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ ÏÀÏ▒┘é Ïº┘äÏ»┘üÏ╣','2026-04-25 12:59:16'),(6,'settings.system.discounts','view','Ïº┘äÏ«ÏÁ┘à Ïº┘äÏ╣Ïº┘à ┘ê┘åÏ│Ï¿ Ïº┘äÏ«ÏÁ┘à','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ Ïº┘äÏ«ÏÁ┘à Ïº┘äÏ╣Ïº┘à ┘êÏ¬Ï╣Ï»┘è┘ä Ï«ÏÁ┘à Ïº┘ä┘à┘êÏ©┘ü','2026-04-25 12:59:16'),(7,'settings.system.user_warehouses','view','Ï¬Ï¡Ï»┘èÏ» ┘àÏ«Ï▓┘å ┘ä┘è Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ Ï▒Ï¿ÏÀ Ïº┘ä┘àÏ│Ï¬Ï«Ï»┘à┘è┘å Ï¿Ïº┘ä┘àÏ«ÏºÏ▓┘å','2026-04-25 12:59:16'),(8,'settings.system.expense_categories','view','ÏÑÏÂÏº┘üÏ® ┘üÏªÏ® ┘àÏÁÏ▒┘ê┘üÏºÏ¬','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ ┘üÏªÏºÏ¬ Ïº┘ä┘àÏÁÏ▒┘ê┘üÏºÏ¬','2026-04-25 12:59:16'),(9,'settings.system.company_profile','view','Ï¿┘èÏº┘åÏºÏ¬ Ïº┘ä┘à┘åÏ┤ÏúÏ®','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ Ï¿┘èÏº┘åÏºÏ¬ Ïº┘ä┘à┘åÏ┤ÏúÏ®','2026-04-25 12:59:16'),(10,'settings.system.backup','view','┘åÏ│Ï« ÏºÏ¡Ï¬┘èÏºÏÀ┘è / ÏºÏ│Ï¬┘èÏ▒ÏºÏ» Ïº┘äÏ¿┘èÏº┘åÏºÏ¬','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ Ïº┘ä┘åÏ│Ï« Ïº┘äÏºÏ¡Ï¬┘èÏºÏÀ┘è ┘êÏº┘äÏºÏ│Ï¬┘èÏ▒ÏºÏ»','2026-04-25 12:59:16'),(11,'warehouses.tabs.warehouses','view','┘üÏ¬Ï¡ Ï¬ÏºÏ¿ Ïº┘ä┘àÏ«ÏºÏ▓┘å','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬ÏºÏ¿ ÏÑÏÂÏº┘üÏ®/Ï╣Ï▒ÏÂ Ïº┘ä┘àÏ«ÏºÏ▓┘å','2026-04-25 14:16:38'),(12,'warehouses.tabs.dispatch','view','┘üÏ¬Ï¡ Ï¬ÏºÏ¿ ÏÑÏ░┘å ÏÁÏ▒┘ü','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬ÏºÏ¿ ÏÑÏ░┘å ÏÁÏ▒┘ü','2026-04-25 14:16:38'),(13,'warehouses.dispatch','create_supplier','ÏÑ┘åÏ┤ÏºÏí ┘à┘êÏ▒Ï» (ÏÑÏ░┘å ÏÁÏ▒┘ü)','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ ÏÑ┘åÏ┤ÏºÏí ┘à┘êÏ▒Ï» ┘à┘å Ï¬ÏºÏ¿ ÏÑÏ░┘å ÏÁÏ▒┘ü','2026-04-25 14:16:38'),(14,'warehouses.dispatch','search','Ï¿Ï¡Ï½ ┘à┘åÏ¬Ï¼ (ÏÑÏ░┘å ÏÁÏ▒┘ü)','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ Ïº┘äÏ¿Ï¡Ï½ Ï╣┘å ┘à┘åÏ¬Ï¼ ┘à┘å Ï¬ÏºÏ¿ ÏÑÏ░┘å ÏÁÏ▒┘ü','2026-04-25 14:16:38'),(15,'warehouses.dispatch','add_product','ÏÑÏÂÏº┘üÏ® ÏÁ┘å┘ü (ÏÑÏ░┘å ÏÁÏ▒┘ü)','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ ÏÑÏÂÏº┘üÏ® ÏÁ┘å┘ü ┘à┘å Ï¬ÏºÏ¿ ÏÑÏ░┘å ÏÁÏ▒┘ü','2026-04-25 14:16:38'),(16,'warehouses.products','minimum_stock','Ïº┘äÏ¡Ï» Ïº┘äÏúÏ»┘å┘ë (┘éÏºÏª┘àÏ® Ïº┘ä┘à┘åÏ¬Ï¼ÏºÏ¬)','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ ÏÑÏ╣Ï»ÏºÏ»ÏºÏ¬ Ïº┘äÏ¡Ï» Ïº┘äÏúÏ»┘å┘ë ┘ä┘ä┘àÏ«Ï▓┘ê┘å','2026-04-25 14:16:38'),(17,'warehouses.products','edit','Ï¬Ï╣Ï»┘è┘ä ┘à┘åÏ¬Ï¼ (┘éÏºÏª┘àÏ® Ïº┘ä┘à┘åÏ¬Ï¼ÏºÏ¬)','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ Ï¬Ï╣Ï»┘è┘ä Ïº┘ä┘à┘åÏ¬Ï¼','2026-04-25 14:16:38'),(18,'warehouses.products','suppliers','Ïº┘ä┘à┘êÏ▒Ï»┘è┘å (┘éÏºÏª┘àÏ® Ïº┘ä┘à┘åÏ¬Ï¼ÏºÏ¬)','ÏÑÏ©┘çÏºÏ▒ Ï▓Ï▒ Ïº┘ä┘à┘êÏ▒Ï»┘è┘å ┘ê┘âÏ┤┘ü Ïº┘ä┘à┘êÏ▒Ï»','2026-04-25 14:16:38'),(19,'warehouses.products','delete','Ï¡Ï░┘ü ┘à┘åÏ¬Ï¼ (┘éÏºÏª┘àÏ® Ïº┘ä┘à┘åÏ¬Ï¼ÏºÏ¬)','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ Ï¡Ï░┘ü Ïº┘ä┘à┘åÏ¬Ï¼','2026-04-25 14:16:38'),(20,'warehouses.tabs.suppliers_list','view','┘üÏ¬Ï¡ Ï¬ÏºÏ¿ ┘éÏºÏª┘àÏ® Ïº┘ä┘à┘êÏ▒Ï»┘è┘å','Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë Ï¬Ï¿┘ê┘èÏ¿ ┘éÏºÏª┘àÏ® Ïº┘ä┘à┘êÏ▒Ï»┘è┘å','2026-04-25 14:25:35'),(21,'warehouses.suppliers','statement','┘âÏ┤┘ü Ï¡Ï│ÏºÏ¿ Ïº┘ä┘à┘êÏ▒Ï»','ÏÑÏ©┘çÏºÏ▒/Ï¬┘å┘ü┘èÏ░ ┘âÏ┤┘ü Ï¡Ï│ÏºÏ¿ Ïº┘ä┘à┘êÏ▒Ï»','2026-04-25 14:25:35'),(22,'warehouses.log','edit_amount','Ï¬Ï╣Ï»┘è┘ä ┘àÏ¿┘äÏ║ Ïº┘ä┘üÏºÏ¬┘êÏ▒Ï® (Ïº┘äÏ│Ï¼┘ä)','Ïº┘äÏ¬Ï¡┘â┘à Ï¿Ï▓Ï▒ Ïº┘ä┘àÏ¿┘äÏ║ Ï»ÏºÏ«┘ä Ï│Ï¼┘ä Ïº┘äÏ┤Ï▒ÏºÏí ┘êÏº┘äÏ¿┘èÏ╣','2026-04-25 17:32:56'),(23,'warehouses.log','edit_invoice','Ï¬Ï╣Ï»┘è┘ä Ïº┘ä┘üÏºÏ¬┘êÏ▒Ï® (Ïº┘äÏ│Ï¼┘ä)','Ïº┘äÏ¬Ï¡┘â┘à Ï¿Ï▓Ï▒ Ï¬Ï╣Ï»┘è┘ä Ïº┘ä┘üÏºÏ¬┘êÏ▒Ï® Ï»ÏºÏ«┘ä Ï│Ï¼┘ä Ïº┘äÏ┤Ï▒ÏºÏí ┘êÏº┘äÏ¿┘èÏ╣','2026-04-25 17:32:56'),(24,'warehouses.log','delete_invoice','Ï¡Ï░┘ü Ïº┘ä┘üÏºÏ¬┘êÏ▒Ï® (Ïº┘äÏ│Ï¼┘ä)','Ïº┘äÏ¬Ï¡┘â┘à Ï¿Ï▓Ï▒ Ï¡Ï░┘ü Ïº┘ä┘üÏºÏ¬┘êÏ▒Ï® Ï»ÏºÏ«┘ä Ï│Ï¼┘ä Ïº┘äÏ┤Ï▒ÏºÏí ┘êÏº┘äÏ¿┘èÏ╣','2026-04-25 17:32:56'),(25,'pos.page','view','Ï»Ï«┘ê┘ä ÏÁ┘üÏ¡Ï® ┘å┘éÏÀÏ® Ïº┘äÏ¿┘èÏ╣','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ïº┘äÏ»Ï«┘ê┘ä ÏÑ┘ä┘ë ÏÁ┘üÏ¡Ï® /pos','2026-04-25 17:37:24'),(26,'pos.tabs.sales_log','view','Ï╣Ï▒ÏÂ Ï¬Ï¿┘ê┘èÏ¿ Ï│Ï¼┘ä Ïº┘ä┘àÏ¿┘èÏ╣ÏºÏ¬ (POS)','Ïº┘äÏ│┘àÏºÏ¡ Ï¿┘üÏ¬Ï¡ Ï¬Ï¿┘ê┘èÏ¿ Ï│Ï¼┘ä Ïº┘ä┘àÏ¿┘èÏ╣ÏºÏ¬ Ï»ÏºÏ«┘ä POS','2026-04-25 17:37:24'),(27,'pos.sales_log','edit_quantity','Ï¬Ï╣Ï»┘è┘ä ┘â┘à┘èÏ® ┘üÏºÏ¬┘êÏ▒Ï® ┘à┘å Ï│Ï¼┘ä Ïº┘ä┘àÏ¿┘èÏ╣ÏºÏ¬ (POS)','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï¬Ï╣Ï»┘è┘ä Ïº┘ä┘â┘à┘èÏ® ┘à┘å Ï▓Ï▒ Ïº┘äÏ¬┘üÏºÏÁ┘è┘ä ┘êÏ¡┘üÏ© Ïº┘äÏ¬Ï╣Ï»┘è┘ä','2026-04-25 17:37:24'),(28,'pos.tabs.returns','view','POS: Ï╣Ï▒ÏÂ Ï¬Ï¿┘ê┘èÏ¿ ÏºÏ│Ï¬Ï▒Ï¼ÏºÏ╣/Ï¬Ï╣Ï»┘è┘ä','Ïº┘äÏ│┘àÏºÏ¡ Ï¿┘üÏ¬Ï¡ Ï¬Ï¿┘ê┘èÏ¿ ÏºÏ│Ï¬Ï▒Ï¼ÏºÏ╣ / Ï¬Ï╣Ï»┘è┘ä ┘ü┘êÏºÏ¬┘èÏ▒ ┘å┘éÏÀÏ® Ïº┘äÏ¿┘èÏ╣','2026-04-25 17:39:18'),(29,'pos.tabs.credit_customers','view','POS: Ï╣Ï▒ÏÂ Ï¬Ï¿┘ê┘èÏ¿ ┘à┘ä┘ü Ï╣┘à┘äÏºÏí Ïº┘äÏúÏ¼┘ä','Ïº┘äÏ│┘àÏºÏ¡ Ï¿┘üÏ¬Ï¡ Ï¬Ï¿┘ê┘èÏ¿ ┘à┘ä┘ü Ï╣┘à┘äÏºÏí Ïº┘äÏúÏ¼┘ä Ï»ÏºÏ«┘ä POS','2026-04-25 17:39:18'),(30,'expenses','create','Ïº┘ä┘àÏÁÏ▒┘ê┘üÏºÏ¬: ÏÑÏÂÏº┘üÏ® ┘àÏÁÏ▒┘ê┘ü','Ïº┘äÏ│┘àÏºÏ¡ Ï¿ÏÑÏÂÏº┘üÏ® ┘àÏÁÏ▒┘ê┘ü Ï¼Ï»┘èÏ»','2026-04-26 08:23:06'),(31,'expenses','update','Ïº┘ä┘àÏÁÏ▒┘ê┘üÏºÏ¬: Ï¬Ï╣Ï»┘è┘ä ┘àÏÁÏ▒┘ê┘ü','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï¬Ï╣Ï»┘è┘ä Ïº┘ä┘àÏÁÏ▒┘ê┘üÏºÏ¬','2026-04-26 08:23:06'),(32,'expenses','delete','Ïº┘ä┘àÏÁÏ▒┘ê┘üÏºÏ¬: Ï¡Ï░┘ü ┘àÏÁÏ▒┘ê┘ü','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï¡Ï░┘ü Ïº┘ä┘àÏÁÏ▒┘ê┘üÏºÏ¬','2026-04-26 08:23:06'),(33,'credit_customers','details','┘à┘ä┘ü Ï╣┘à┘äÏºÏí Ïº┘äÏúÏ¼┘ä: Ïº┘äÏ¬┘üÏºÏÁ┘è┘ä','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï╣Ï▒ÏÂ Ï¬┘üÏºÏÁ┘è┘ä Ïº┘äÏ╣┘à┘è┘ä ┘êÏº┘ä┘ü┘êÏºÏ¬┘èÏ▒ ┘êÏ¬┘üÏºÏÁ┘è┘ä Ïº┘ä┘üÏºÏ¬┘êÏ▒Ï®','2026-04-26 08:36:36'),(34,'credit_customers','settle','┘à┘ä┘ü Ï╣┘à┘äÏºÏí Ïº┘äÏúÏ¼┘ä: Ïº┘äÏ│Ï»ÏºÏ»','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï¬┘å┘ü┘èÏ░ Ï│Ï»ÏºÏ» ┘ü┘êÏºÏ¬┘èÏ▒ Ïº┘äÏúÏ¼┘ä','2026-04-26 08:36:36'),(35,'shift_close.tabs.payment_summary','view','Ï¬┘é┘ü┘è┘ä Ïº┘äÏ┤┘üÏ¬: Ï¬Ï¿┘ê┘èÏ¿ ┘à┘äÏ«ÏÁ ÏÀÏ▒┘é Ïº┘äÏ»┘üÏ╣','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï╣Ï▒ÏÂ Ï¬Ï¿┘ê┘èÏ¿ ┘à┘äÏ«ÏÁ ÏÀÏ▒┘é Ïº┘äÏ»┘üÏ╣','2026-04-26 08:40:51'),(36,'shift_close.tabs.receive_amounts','view','Ï¬┘é┘ü┘è┘ä Ïº┘äÏ┤┘üÏ¬: Ï¬Ï¿┘ê┘èÏ¿ ÏºÏ│Ï¬┘äÏº┘à Ïº┘ä┘àÏ¿Ïº┘äÏ║','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï╣Ï▒ÏÂ Ï¬Ï¿┘ê┘èÏ¿ ÏºÏ│Ï¬┘äÏº┘à Ïº┘ä┘àÏ¿Ïº┘äÏ║','2026-04-26 08:40:51'),(37,'shift_close.tabs.shift_log','view','Ï¬┘é┘ü┘è┘ä Ïº┘äÏ┤┘üÏ¬: Ï¬Ï¿┘ê┘èÏ¿ Ï│Ï¼┘ä Ï¬┘é┘ü┘è┘ä Ïº┘äÏ┤┘üÏ¬','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ï╣Ï▒ÏÂ Ï¬Ï¿┘ê┘èÏ¿ Ï│Ï¼┘ä Ï¬┘é┘ü┘è┘ä Ïº┘äÏ┤┘üÏ¬','2026-04-26 08:40:51'),(38,'reports.pos_profit','view','Ïº┘äÏ¬┘éÏºÏ▒┘èÏ▒: Ï¬┘éÏ▒┘èÏ▒ Ïº┘ä┘àÏ¿┘èÏ╣ÏºÏ¬','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ïº┘äÏ»Ï«┘ê┘ä ┘êÏ╣Ï▒ÏÂ Ï¿┘èÏº┘åÏºÏ¬ /reports/pos-profit','2026-04-26 08:42:23'),(39,'reports.warehouse_report','view','Ïº┘äÏ¬┘éÏºÏ▒┘èÏ▒: Ï¬┘éÏ▒┘èÏ▒ Ïº┘äÏ¼Ï▒Ï»','Ïº┘äÏ│┘àÏºÏ¡ Ï¿Ïº┘äÏ»Ï«┘ê┘ä ┘êÏ╣Ï▒ÏÂ Ï¿┘èÏº┘åÏºÏ¬ /reports/warehouse-report','2026-04-26 08:42:23'),(40,'settings.permissions','manage','Ïº┘äÏÑÏ╣Ï»ÏºÏ»ÏºÏ¬: ÏÑÏ»ÏºÏ▒Ï® Ïº┘äÏÁ┘äÏºÏ¡┘èÏºÏ¬','Ïº┘äÏ│┘àÏºÏ¡ Ï¿┘üÏ¬Ï¡ ┘ä┘êÏ¡Ï® ÏÑÏ»ÏºÏ▒Ï® Ïº┘äÏÁ┘äÏºÏ¡┘èÏºÏ¬ ┘êÏº┘äÏ¬Ï¡┘â┘à Ï¿Ïº┘äÏúÏ»┘êÏºÏ▒ ┘êÏº┘äÏÁ┘äÏºÏ¡┘èÏºÏ¬','2026-04-26 08:52:24');
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_sale_item_versions`
--

LOCK TABLES `pos_sale_item_versions` WRITE;
/*!40000 ALTER TABLE `pos_sale_item_versions` DISABLE KEYS */;
INSERT INTO `pos_sale_item_versions` VALUES (1,1,7,3.000,8.00,24.00,'2026-04-18 12:27:43'),(2,1,3,1.000,300.00,300.00,'2026-04-18 12:27:44'),(3,1,5,1.000,500.00,500.00,'2026-04-18 12:27:44'),(4,1,6,6.000,8.00,48.00,'2026-04-18 12:27:44'),(5,1,8,2.000,550.00,1100.00,'2026-04-18 12:27:44'),(6,1,9,2.000,565.00,1130.00,'2026-04-18 12:27:44'),(7,1,1,1.000,2000.00,2000.00,'2026-04-18 12:27:44'),(8,1,2,1.000,700.00,700.00,'2026-04-18 12:27:44'),(9,1,4,100.000,9.00,900.00,'2026-04-18 12:27:44'),(10,2,10,1.000,1300.00,1300.00,'2026-04-18 19:56:46'),(11,3,7,3.000,8.00,24.00,'2026-04-22 01:19:05'),(12,3,3,1.000,300.00,300.00,'2026-04-22 01:19:05'),(13,3,5,1.000,500.00,500.00,'2026-04-22 01:19:05'),(14,3,6,6.000,8.00,48.00,'2026-04-22 01:19:05'),(15,3,8,2.000,550.00,1100.00,'2026-04-22 01:19:05'),(16,3,9,2.000,565.00,1130.00,'2026-04-22 01:19:05'),(17,3,2,1.000,700.00,700.00,'2026-04-22 01:19:05'),(18,3,4,100.000,9.00,900.00,'2026-04-22 01:19:05'),(19,4,10,1.000,2000.00,2000.00,'2026-04-22 01:20:30'),(20,5,10,1.000,2000.00,2000.00,'2026-04-22 01:23:05'),(21,6,10,1.000,2000.00,2000.00,'2026-04-22 01:23:13'),(22,7,10,1.000,2000.00,2000.00,'2026-04-22 01:23:52'),(23,8,10,1.000,2000.00,2000.00,'2026-04-22 01:24:00'),(24,9,7,3.000,8.00,24.00,'2026-04-22 01:30:22'),(25,9,3,1.000,300.00,300.00,'2026-04-22 01:30:22'),(26,9,5,1.000,500.00,500.00,'2026-04-22 01:30:22'),(27,9,6,6.000,8.00,48.00,'2026-04-22 01:30:22'),(28,9,8,2.000,550.00,1100.00,'2026-04-22 01:30:23'),(29,9,9,2.000,565.00,1130.00,'2026-04-22 01:30:23'),(30,9,4,100.000,9.00,900.00,'2026-04-22 01:30:23'),(31,10,10,1.000,1300.00,1300.00,'2026-04-22 01:30:48'),(32,11,7,3.000,8.00,24.00,'2026-04-22 02:17:06'),(33,11,3,1.000,300.00,300.00,'2026-04-22 02:17:06'),(34,11,6,6.000,8.00,48.00,'2026-04-22 02:17:06'),(35,11,8,2.000,550.00,1100.00,'2026-04-22 02:17:06'),(36,11,9,2.000,565.00,1130.00,'2026-04-22 02:17:06'),(37,11,4,100.000,9.00,900.00,'2026-04-22 02:17:06'),(38,12,4,40.000,9.00,360.00,'2026-04-22 02:19:59'),(39,12,2,1.000,700.00,700.00,'2026-04-22 02:19:59'),(40,13,26,1.000,500.00,500.00,'2026-04-22 03:07:52'),(41,14,13,1.000,300.00,300.00,'2026-04-22 03:12:51'),(42,14,25,1.000,650.00,650.00,'2026-04-22 03:12:51'),(43,14,23,40.000,25.00,1000.00,'2026-04-22 03:12:51'),(44,14,24,2.000,40.00,80.00,'2026-04-22 03:12:51'),(45,14,27,2.000,1200.00,2400.00,'2026-04-22 03:12:51'),(46,14,12,65.000,9.00,585.00,'2026-04-22 03:12:51'),(47,15,15,1.000,1700.00,1700.00,'2026-04-22 03:17:41'),(48,15,26,1.000,500.00,500.00,'2026-04-22 03:17:41'),(49,16,15,1.000,1700.00,1700.00,'2026-04-22 03:34:21'),(50,16,26,1.000,500.00,500.00,'2026-04-22 03:34:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_sale_versions`
--

LOCK TABLES `pos_sale_versions` WRITE;
/*!40000 ALTER TABLE `pos_sale_versions` DISABLE KEYS */;
INSERT INTO `pos_sale_versions` VALUES (1,1,1,'created',NULL,NULL,6702.00,0.00,0.00,6702.00,NULL,1,NULL,'2026-04-18 12:27:43'),(2,2,1,'created',NULL,NULL,1300.00,0.00,0.00,1300.00,NULL,1,NULL,'2026-04-18 19:56:46'),(3,1,2,'edited',NULL,NULL,6702.00,0.00,0.00,4702.00,NULL,1,NULL,'2026-04-22 01:19:05'),(4,3,1,'created',NULL,'???',2000.00,0.00,0.00,2000.00,1,1,NULL,'2026-04-22 01:20:30'),(5,3,2,'edited',NULL,'???',2000.00,0.00,0.00,2000.00,1,1,NULL,'2026-04-22 01:23:05'),(6,3,3,'edited',NULL,'???',2000.00,0.00,0.00,2000.00,1,1,NULL,'2026-04-22 01:23:13'),(7,3,4,'edited',NULL,'???',2000.00,0.00,0.00,2000.00,1,1,NULL,'2026-04-22 01:23:52'),(8,3,5,'edited',NULL,'???',2000.00,0.00,0.00,2000.00,1,1,NULL,'2026-04-22 01:24:00'),(9,1,3,'edited',NULL,NULL,6702.00,0.00,0.00,4002.00,NULL,1,NULL,'2026-04-22 01:30:22'),(10,2,2,'edited',NULL,NULL,1300.00,0.00,0.00,1300.00,NULL,1,NULL,'2026-04-22 01:30:48'),(11,1,4,'edited',NULL,NULL,6702.00,0.00,0.00,3502.00,NULL,1,NULL,'2026-04-22 02:17:06'),(12,4,1,'created',NULL,NULL,1060.00,0.00,0.00,1060.00,1,1,NULL,'2026-04-22 02:19:59'),(13,5,1,'created','???? ????',NULL,500.00,0.00,0.00,500.00,1,1,NULL,'2026-04-22 03:07:52'),(14,6,1,'created','??????? ??? ????',NULL,5015.00,15.00,0.30,5000.00,1,1,NULL,'2026-04-22 03:12:51'),(15,7,1,'created','???? ??? ???? ???',NULL,2200.00,0.00,0.00,2200.00,1,1,NULL,'2026-04-22 03:17:41'),(16,7,2,'edited','???? ??? ???? ???',NULL,2200.00,0.00,0.00,2200.00,1,1,NULL,'2026-04-22 03:34:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pos_shift_closures`
--

LOCK TABLES `pos_shift_closures` WRITE;
/*!40000 ALTER TABLE `pos_shift_closures` DISABLE KEYS */;
INSERT INTO `pos_shift_closures` VALUES (1,1,2,2,5525.00,5525.00,0.00,NULL,'2026-04-26 08:39:11');
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_edit_logs`
--

LOCK TABLES `product_edit_logs` WRITE;
/*!40000 ALTER TABLE `product_edit_logs` DISABLE KEYS */;
INSERT INTO `product_edit_logs` VALUES (1,10,'HDD 1TB','896985560711',1650.00,2000.00,1,'2026-04-22 01:33:34'),(2,10,'HDD 1TB','896985560711',1650.00,1950.00,1,'2026-04-22 01:36:39'),(3,1,'DVR HIK 4 CH','287074278519',1515.00,2000.00,1,'2026-04-22 01:42:12'),(4,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:14'),(5,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:44'),(6,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:46'),(7,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:47'),(8,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:48'),(9,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:49'),(10,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:49'),(11,1,'DVR HIK 4 CH','287074278519',1515.00,1700.00,1,'2026-04-22 01:42:50'),(12,25,'?????','513944384108',650.00,650.00,1,'2026-04-22 03:22:06'),(13,25,'?????','513944384108',0.00,650.00,1,'2026-04-22 03:22:10'),(14,25,'?????','513944384108',0.00,650.00,1,'2026-04-22 03:22:14');
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
INSERT INTO `product_minimum_stock` VALUES (2,2.000,'2026-04-22 01:36:18','2026-04-22 01:36:18'),(10,1.000,'2026-04-22 01:36:03','2026-04-22 01:36:03'),(18,2.000,'2026-04-22 01:35:45','2026-04-22 01:35:45'),(19,1.000,'2026-04-22 01:35:34','2026-04-22 01:35:34');
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
  `source` varchar(40) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'product_create, product_update, purchase_invoice',
  `reference_id` int unsigned DEFAULT NULL COMMENT 'مثلاً رقم فاتورة شراء',
  `user_id` int unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pph_product_effective` (`product_id`,`effective_at`),
  KEY `idx_pph_source_ref` (`source`,`reference_id`),
  KEY `fk_pph_user` (`user_id`),
  CONSTRAINT `fk_pph_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pph_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='كل صف = لقطة سعرية بعد تعديل؛ آلاف الصفوف = آلاف التغييرات';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_price_history`
--

LOCK TABLES `product_price_history` WRITE;
/*!40000 ALTER TABLE `product_price_history` DISABLE KEYS */;
INSERT INTO `product_price_history` VALUES (1,1,1515.00,2000.00,'2026-04-18 12:24:33','purchase_invoice',1,1,'2026-04-18 12:24:33'),(2,2,550.00,700.00,'2026-04-18 12:24:33','purchase_invoice',1,1,'2026-04-18 12:24:33'),(3,3,285.00,300.00,'2026-04-18 12:24:33','purchase_invoice',1,1,'2026-04-18 12:24:33'),(4,4,7.00,9.00,'2026-04-18 12:24:34','purchase_invoice',1,1,'2026-04-18 12:24:34'),(5,5,0.00,500.00,'2026-04-18 12:24:34','purchase_invoice',1,1,'2026-04-18 12:24:34'),(6,6,5.00,8.00,'2026-04-18 12:24:34','purchase_invoice',1,1,'2026-04-18 12:24:34'),(7,7,5.00,8.00,'2026-04-18 12:24:34','purchase_invoice',1,1,'2026-04-18 12:24:34'),(8,8,450.00,550.00,'2026-04-18 12:24:34','purchase_invoice',1,1,'2026-04-18 12:24:34'),(9,9,465.00,565.00,'2026-04-18 12:24:34','purchase_invoice',1,1,'2026-04-18 12:24:34'),(10,10,1650.00,2000.00,'2026-04-18 19:50:04','purchase_invoice',2,1,'2026-04-18 19:50:04'),(11,11,850.00,1250.00,'2026-04-18 22:08:56','purchase_invoice',3,1,'2026-04-18 22:08:56'),(12,12,5.00,9.00,'2026-04-18 22:08:56','purchase_invoice',3,1,'2026-04-18 22:08:56'),(13,13,200.00,300.00,'2026-04-18 23:48:08','purchase_invoice',4,1,'2026-04-18 23:48:08'),(14,14,790.00,1200.00,'2026-04-19 15:00:41','purchase_invoice',5,1,'2026-04-19 15:00:41'),(15,15,1300.00,1700.00,'2026-04-19 15:00:41','purchase_invoice',5,1,'2026-04-19 15:00:41'),(16,16,750.00,975.00,'2026-04-19 15:00:41','purchase_invoice',5,1,'2026-04-19 15:00:41'),(17,17,750.00,950.00,'2026-04-19 15:00:41','purchase_invoice',5,1,'2026-04-19 15:00:41'),(18,18,750.00,950.00,'2026-04-22 01:09:10','purchase_invoice',6,1,'2026-04-22 01:09:10'),(19,19,27000.00,27500.00,'2026-04-22 01:14:06','purchase_invoice',7,1,'2026-04-22 01:14:06'),(20,10,1650.00,1950.00,'2026-04-22 01:33:34','product_update',NULL,1,'2026-04-22 01:33:34'),(21,20,4000.00,4500.00,'2026-04-22 01:41:19','purchase_invoice',8,1,'2026-04-22 01:41:19'),(22,1,1515.00,1700.00,'2026-04-22 01:42:12','product_update',NULL,1,'2026-04-22 01:42:12'),(23,21,1700.00,1950.00,'2026-04-22 01:44:59','purchase_invoice',9,1,'2026-04-22 01:44:59'),(24,22,20.00,30.00,'2026-04-22 02:51:51','purchase_invoice',11,1,'2026-04-22 02:51:51'),(25,23,20.00,25.00,'2026-04-22 02:56:42','purchase_invoice',12,1,'2026-04-22 02:56:42'),(26,24,40.00,40.00,'2026-04-22 03:00:38','purchase_invoice',13,1,'2026-04-22 03:00:38'),(27,25,650.00,650.00,'2026-04-22 03:03:22','purchase_invoice',14,1,'2026-04-22 03:03:22'),(28,26,500.00,500.00,'2026-04-22 03:03:22','purchase_invoice',14,1,'2026-04-22 03:03:22'),(29,27,850.00,1200.00,'2026-04-22 03:09:40','purchase_invoice',15,1,'2026-04-22 03:09:40'),(30,26,0.00,500.00,'2026-04-22 03:16:45','purchase_invoice',16,1,'2026-04-22 03:16:45'),(31,25,0.00,650.00,'2026-04-22 03:22:07','product_update',NULL,1,'2026-04-22 03:22:07'),(32,28,200.00,250.00,'2026-04-22 18:57:52','purchase_invoice',17,1,'2026-04-22 18:57:52');
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
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_prices`
--

LOCK TABLES `product_prices` WRITE;
/*!40000 ALTER TABLE `product_prices` DISABLE KEYS */;
INSERT INTO `product_prices` VALUES (1,1,1515.00,1700.00,'2026-04-22 02:27:07','2026-04-18 12:24:33','2026-04-22 02:27:07'),(2,2,550.00,700.00,NULL,'2026-04-18 12:24:33','2026-04-22 01:05:19'),(3,3,285.00,300.00,'2026-04-22 02:28:32','2026-04-18 12:24:33','2026-04-22 02:28:32'),(4,4,7.00,9.00,NULL,'2026-04-18 12:24:33','2026-04-22 02:18:29'),(5,5,0.00,500.00,'2026-04-22 02:28:04','2026-04-18 12:24:34','2026-04-22 02:28:04'),(6,6,5.00,8.00,'2026-04-22 02:26:37','2026-04-18 12:24:34','2026-04-22 02:26:37'),(7,7,5.00,8.00,'2026-04-22 02:28:41','2026-04-18 12:24:34','2026-04-22 02:28:41'),(8,8,450.00,550.00,'2026-04-22 02:26:40','2026-04-18 12:24:34','2026-04-22 02:26:40'),(9,9,465.00,565.00,'2026-04-22 02:26:47','2026-04-18 12:24:34','2026-04-22 02:26:47'),(10,10,1650.00,1950.00,'2026-04-22 01:43:46','2026-04-18 19:50:04','2026-04-22 01:43:46'),(11,11,850.00,1250.00,'2026-04-22 02:27:01','2026-04-18 22:08:56','2026-04-22 02:27:01'),(12,12,5.00,9.00,NULL,'2026-04-18 22:08:56','2026-04-18 22:08:56'),(13,13,200.00,300.00,NULL,'2026-04-18 23:48:08','2026-04-18 23:48:08'),(14,14,790.00,1200.00,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(15,15,1300.00,1700.00,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(16,16,750.00,975.00,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(17,17,750.00,950.00,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(18,18,750.00,950.00,NULL,'2026-04-22 01:09:10','2026-04-22 01:09:10'),(19,19,27000.00,27500.00,NULL,'2026-04-22 01:14:06','2026-04-22 01:14:06'),(22,20,4000.00,4500.00,NULL,'2026-04-22 01:41:19','2026-04-22 01:41:19'),(32,21,1700.00,1950.00,'2026-04-22 02:27:56','2026-04-22 01:44:59','2026-04-22 02:27:56'),(33,22,20.00,30.00,NULL,'2026-04-22 02:51:51','2026-04-22 02:51:51'),(34,23,20.00,25.00,NULL,'2026-04-22 02:56:42','2026-04-22 02:56:42'),(35,24,40.00,40.00,NULL,'2026-04-22 03:00:38','2026-04-22 03:00:38'),(36,25,0.00,650.00,NULL,'2026-04-22 03:03:22','2026-04-22 03:22:14'),(37,26,0.00,500.00,NULL,'2026-04-22 03:03:22','2026-04-22 03:16:45'),(38,27,850.00,1200.00,NULL,'2026-04-22 03:09:40','2026-04-22 03:09:40'),(42,28,200.00,250.00,NULL,'2026-04-22 18:57:52','2026-04-22 18:57:52');
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
INSERT INTO `product_suppliers` VALUES (1,1,'2026-04-22 01:42:50'),(2,1,'2026-04-18 12:24:33'),(3,1,'2026-04-18 12:24:33'),(4,1,'2026-04-18 12:24:33'),(5,1,'2026-04-18 12:24:34'),(6,1,'2026-04-18 12:24:34'),(7,1,'2026-04-18 12:24:34'),(8,1,'2026-04-18 12:24:34'),(9,1,'2026-04-18 12:24:34'),(10,1,'2026-04-22 01:36:39'),(11,1,'2026-04-18 22:08:56'),(12,1,'2026-04-18 22:08:56'),(14,2,'2026-04-19 15:00:41'),(15,2,'2026-04-19 15:00:41'),(16,2,'2026-04-19 15:00:41'),(17,2,'2026-04-19 15:00:41'),(18,3,'2026-04-22 01:09:10'),(19,4,'2026-04-22 01:14:06'),(20,4,'2026-04-22 01:41:19'),(21,1,'2026-04-22 01:44:59'),(22,5,'2026-04-22 02:51:51'),(23,5,'2026-04-22 02:56:42'),(24,5,'2026-04-22 03:00:38'),(25,6,'2026-04-22 03:22:14'),(26,6,'2026-04-22 03:03:22'),(27,1,'2026-04-22 03:09:40'),(28,5,'2026-04-22 18:57:52');
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
  `barcode` char(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'باركود 12 رقم (اختياري)',
  `deleted_at` datetime DEFAULT NULL COMMENT '?????? ????????',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_barcode` (`barcode`),
  KEY `idx_products_deleted` (`deleted_at`),
  KEY `idx_products_name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'DVR HIK 4 CH','DEL000000001','2026-04-22 02:27:07','2026-04-18 12:24:33','2026-04-22 02:27:07'),(2,'HDD500 GB','383422063181',NULL,'2026-04-18 12:24:33','2026-04-18 12:24:33'),(3,'??? ????? 20A','DEL000000003','2026-04-22 02:28:32','2026-04-18 12:24:33','2026-04-22 02:28:32'),(4,'??? ???????','554197612683',NULL,'2026-04-18 12:24:33','2026-04-18 12:24:33'),(5,'?????','DEL000000005','2026-04-22 02:28:04','2026-04-18 12:24:34','2026-04-22 02:28:04'),(6,'BNC','DEL000000006','2026-04-22 02:26:37','2026-04-18 12:24:34','2026-04-22 02:26:37'),(7,'???','DEL000000007','2026-04-22 02:28:40','2026-04-18 12:24:34','2026-04-22 02:28:40'),(8,'CAMER HIK 2M','DEL000000008','2026-04-22 02:26:40','2026-04-18 12:24:34','2026-04-22 02:26:40'),(9,'CAMER IN HIK 2M','DEL000000009','2026-04-22 02:26:47','2026-04-18 12:24:34','2026-04-22 02:26:47'),(10,'HDD 1TB','DEL000000010','2026-04-22 01:43:46','2026-04-18 19:50:04','2026-04-22 01:43:46'),(11,'Camer tepo 2m','DEL000000011','2026-04-22 02:27:00','2026-04-18 22:08:56','2026-04-22 02:27:00'),(12,'Cat 6','523083173280',NULL,'2026-04-18 22:08:56','2026-04-18 22:08:56'),(13,'????? ???????','285025057885',NULL,'2026-04-18 23:48:08','2026-04-18 23:48:08'),(14,'???? mercusys ms106lp','207141461462',NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(15,'???? 9poe tp.link','464814224759',NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(16,'Camer hilook 2m ip','984345994428',NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(17,'Camer hilook uot 2m ip','946741182889',NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(18,'?????? 6??? ???? PRO RAIC','460533863429',NULL,'2026-04-22 01:09:10','2026-04-22 01:09:10'),(19,'?????? PTZ30X','825922319093',NULL,'2026-04-22 01:14:06','2026-04-22 01:14:06'),(20,'nvr dahua 4ch 4k','359470769383',NULL,'2026-04-22 01:41:19','2026-04-22 01:41:19'),(21,'HDD1 TB','DEL000000021','2026-04-22 02:27:56','2026-04-22 01:44:59','2026-04-22 02:27:56'),(22,'??? ??? ???','354529102832',NULL,'2026-04-22 02:51:51','2026-04-22 02:51:51'),(23,'??? ?????? 2??','458556784623',NULL,'2026-04-22 02:56:42','2026-04-22 02:56:42'),(24,'????','371685308965',NULL,'2026-04-22 03:00:38','2026-04-22 03:00:38'),(25,'?????','513944384108',NULL,'2026-04-22 03:03:22','2026-04-22 03:22:14'),(26,'?????500','511692938860',NULL,'2026-04-22 03:03:22','2026-04-22 03:03:22'),(27,'??????? TP.LINL','113504395528',NULL,'2026-04-22 03:09:40','2026-04-22 03:09:40'),(28,'?????','659241037299',NULL,'2026-04-22 18:57:52','2026-04-22 18:57:52');
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
INSERT INTO `purchase_invoice_edit_log` VALUES (1,1,1,'2026-04-22 01:05:19');
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
INSERT INTO `purchase_invoice_items` VALUES (1,1,1,15.000,15.00,16.00,225.00),(2,2,2,300.000,13.50,16.00,4050.00),(3,2,3,220.000,24.00,28.00,5280.00),(4,2,4,30.000,115.00,140.00,3450.00),(5,2,5,150.000,18.00,23.00,2700.00),(10,2,10,2.000,1650.00,2000.00,3300.00),(11,3,11,2.000,850.00,1250.00,1700.00),(12,3,12,300.000,5.00,9.00,1500.00),(13,4,13,1.000,200.00,300.00,200.00),(14,5,14,4.000,790.00,1200.00,3160.00),(15,5,15,4.000,1300.00,1700.00,5200.00),(16,5,16,10.000,750.00,975.00,7500.00),(17,5,17,20.000,750.00,950.00,15000.00),(18,1,2,1.000,550.00,700.00,550.00),(19,1,3,1.000,285.00,300.00,285.00),(20,1,4,109.000,7.00,9.00,763.00),(21,1,5,1.000,0.00,500.00,0.00),(22,1,6,6.000,5.00,8.00,30.00),(23,1,7,3.000,5.00,8.00,15.00),(24,1,8,2.000,450.00,550.00,900.00),(25,1,9,2.000,465.00,565.00,930.00),(26,6,18,1.000,750.00,950.00,750.00),(27,7,19,1.000,27000.00,27500.00,27000.00),(28,8,20,4.000,4000.00,4500.00,16000.00),(29,9,21,1.000,1700.00,1950.00,1700.00),(30,10,4,100.000,7.00,9.00,700.00),(31,11,22,12.000,20.00,30.00,240.00),(32,12,23,100.000,20.00,25.00,2000.00),(33,13,24,2.000,40.00,40.00,80.00),(34,14,25,1.000,650.00,650.00,650.00),(35,14,26,1.000,500.00,500.00,500.00),(36,15,27,2.000,850.00,1200.00,1700.00),(37,16,26,2.000,0.00,500.00,0.00),(38,17,28,5.000,200.00,250.00,1000.00);
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
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoices`
--

LOCK TABLES `purchase_invoices` WRITE;
/*!40000 ALTER TABLE `purchase_invoices` DISABLE KEYS */;
INSERT INTO `purchase_invoices` VALUES (1,1,1,3473.00,0.00,NULL,1,'2026-04-18 12:24:33','2026-04-22 02:24:29','2026-04-22 02:24:29'),(2,1,1,3300.00,0.00,NULL,1,'2026-04-18 19:50:04','2026-04-22 02:25:00','2026-04-22 02:25:00'),(3,1,1,3200.00,0.00,NULL,1,'2026-04-18 22:08:56','2026-04-22 02:24:16','2026-04-22 02:24:16'),(4,NULL,1,200.00,200.00,NULL,1,'2026-04-18 23:48:08','2026-04-18 23:48:08',NULL),(5,2,1,30860.00,0.00,NULL,1,'2026-04-19 15:00:41','2026-04-19 15:00:41',NULL),(6,3,1,750.00,750.00,1,1,'2026-04-22 01:09:10','2026-04-22 01:09:10',NULL),(7,4,1,27000.00,27000.00,1,1,'2026-04-22 01:14:06','2026-04-22 01:14:06',NULL),(8,4,1,16000.00,16000.00,1,1,'2026-04-22 01:41:19','2026-04-22 01:41:19',NULL),(9,1,1,1700.00,0.00,NULL,1,'2026-04-22 01:44:59','2026-04-22 02:23:55','2026-04-22 02:23:55'),(10,1,1,700.00,0.00,NULL,1,'2026-04-22 02:18:29','2026-04-22 02:23:37','2026-04-22 02:23:37'),(11,5,1,240.00,0.00,1,1,'2026-04-22 02:51:51','2026-04-22 02:51:51',NULL),(12,5,1,2000.00,2000.00,1,1,'2026-04-22 02:56:42','2026-04-22 02:56:42',NULL),(13,5,1,80.00,80.00,1,1,'2026-04-22 03:00:38','2026-04-22 03:00:38',NULL),(14,6,1,1150.00,0.00,1,1,'2026-04-22 03:03:22','2026-04-22 03:03:22',NULL),(15,1,1,1700.00,0.00,NULL,1,'2026-04-22 03:09:40','2026-04-22 03:09:40',NULL),(16,6,1,0.00,0.00,1,1,'2026-04-22 03:16:45','2026-04-22 03:16:45',NULL),(17,5,1,1000.00,1000.00,1,1,'2026-04-22 18:57:52','2026-04-22 18:57:52',NULL);
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_return_items`
--

LOCK TABLES `purchase_return_items` WRITE;
/*!40000 ALTER TABLE `purchase_return_items` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_returns`
--

LOCK TABLES `purchase_returns` WRITE;
/*!40000 ALTER TABLE `purchase_returns` DISABLE KEYS */;
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
  `name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rbac_permissions_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rbac_permissions`
--

LOCK TABLES `rbac_permissions` WRITE;
/*!40000 ALTER TABLE `rbac_permissions` DISABLE KEYS */;
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
  `name` varchar(120) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(80) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_system` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_rbac_roles_name` (`name`),
  UNIQUE KEY `uk_rbac_roles_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rbac_roles`
--

LOCK TABLES `rbac_roles` WRITE;
/*!40000 ALTER TABLE `rbac_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `rbac_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `role_id` int unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  `is_allowed` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1 ┘èÏ│┘àÏ¡Ïî 0 ┘è┘à┘åÏ╣',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_permissions_role_permission` (`role_id`,`permission_id`),
  KEY `idx_role_permissions_permission` (`permission_id`),
  CONSTRAINT `fk_role_permissions_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_role_permissions_role` FOREIGN KEY (`role_id`) REFERENCES `permission_roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1,1,0,'2026-04-25 12:14:20','2026-04-25 12:54:19'),(5,1,2,0,'2026-04-25 12:54:20','2026-04-25 12:54:21'),(7,1,10,1,'2026-04-25 13:22:52','2026-04-25 13:22:52');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoice_edit_log`
--

LOCK TABLES `sale_invoice_edit_log` WRITE;
/*!40000 ALTER TABLE `sale_invoice_edit_log` DISABLE KEYS */;
INSERT INTO `sale_invoice_edit_log` VALUES (1,1,1,'2026-04-22 01:19:05'),(2,3,1,'2026-04-22 01:23:05'),(3,3,1,'2026-04-22 01:23:13'),(4,3,1,'2026-04-22 01:23:52'),(5,3,1,'2026-04-22 01:23:59'),(6,1,1,'2026-04-22 01:30:22'),(7,2,1,'2026-04-22 01:30:48'),(8,1,1,'2026-04-22 02:17:06'),(9,7,1,'2026-04-22 03:34:21');
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
) ENGINE=InnoDB AUTO_INCREMENT=51 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoice_items`
--

LOCK TABLES `sale_invoice_items` WRITE;
/*!40000 ALTER TABLE `sale_invoice_items` DISABLE KEYS */;
INSERT INTO `sale_invoice_items` VALUES (1,1,2,40.000,15.50,16.00,620.00,3.13,0.50),(2,1,3,25.000,27.00,28.00,675.00,3.57,1.00),(3,2,3,20.000,27.50,28.00,550.00,1.79,0.50),(4,2,4,8.000,138.75,140.00,1110.00,0.89,1.25),(5,3,1,1.000,16.00,16.00,16.00,0.00,0.00),(6,4,2,20.000,16.00,16.00,320.00,0.00,0.00),(7,4,3,35.000,28.00,28.00,980.00,0.00,0.00),(8,4,4,6.000,140.00,140.00,840.00,0.00,0.00),(9,4,5,15.000,20.67,23.00,310.05,0.00,2.33),(10,5,3,50.000,28.00,28.00,1400.00,0.00,0.00),(11,5,4,8.000,140.00,140.00,1120.00,0.00,0.00),(12,5,2,37.000,16.22,16.00,600.14,0.00,0.00),(13,6,2,40.000,16.00,16.00,640.00,0.00,0.00),(14,6,5,25.000,22.00,23.00,550.00,0.00,1.00),(15,6,3,21.000,28.10,28.00,590.10,0.00,0.00),(23,3,10,1.000,2000.00,NULL,2000.00,0.00,0.00),(31,2,10,1.000,1300.00,NULL,1300.00,0.00,0.00),(32,1,7,3.000,8.00,NULL,24.00,0.00,0.00),(33,1,3,1.000,300.00,NULL,300.00,0.00,0.00),(34,1,6,6.000,8.00,NULL,48.00,0.00,0.00),(35,1,8,2.000,550.00,NULL,1100.00,0.00,0.00),(36,1,9,2.000,565.00,NULL,1130.00,0.00,0.00),(37,1,4,100.000,9.00,NULL,900.00,0.00,0.00),(38,4,4,40.000,9.00,9.00,360.00,0.00,0.00),(39,4,2,1.000,700.00,700.00,700.00,0.00,0.00),(40,5,26,1.000,500.00,500.00,500.00,0.00,0.00),(41,6,13,1.000,300.00,300.00,300.00,0.00,0.00),(42,6,25,1.000,650.00,650.00,650.00,0.00,0.00),(43,6,23,40.000,25.00,25.00,1000.00,0.00,0.00),(44,6,24,2.000,40.00,40.00,80.00,0.00,0.00),(45,6,27,2.000,1200.00,1200.00,2400.00,0.00,0.00),(46,6,12,65.000,9.00,9.00,585.00,0.00,0.00),(49,7,15,1.000,1700.00,NULL,1700.00,0.00,0.00),(50,7,26,1.000,500.00,NULL,500.00,0.00,0.00);
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
  `ajel` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'هل الفاتورة أجل؟ 1 نعم، 0 لا',
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
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_invoices`
--

LOCK TABLES `sale_invoices` WRITE;
/*!40000 ALTER TABLE `sale_invoices` DISABLE KEYS */;
INSERT INTO `sale_invoices` VALUES (1,1,NULL,NULL,NULL,NULL,3502.00,0.00,0.00,6702.00,NULL,0.00,0.00,6702.00,117.000,1,1,0,'2026-04-18','2026-04-18 12:27:43','2026-04-22 02:35:37','2026-04-22 02:35:37'),(2,1,NULL,NULL,NULL,NULL,1300.00,0.00,0.00,2000.00,NULL,0.00,0.00,1300.00,1.000,1,1,0,'2026-04-18','2026-04-18 19:56:46','2026-04-22 01:31:08','2026-04-22 01:31:08'),(3,1,NULL,NULL,'???',NULL,2000.00,0.00,0.00,2000.00,1,0.00,0.00,2000.00,1.000,1,1,0,'2026-04-21','2026-04-22 01:20:30','2026-04-22 01:27:13','2026-04-22 01:27:13'),(4,1,NULL,NULL,NULL,NULL,1060.00,0.00,0.00,1060.00,1,0.00,0.00,1060.00,41.000,1,1,0,'2026-04-22','2026-04-22 02:19:59','2026-04-22 02:35:34','2026-04-22 02:35:34'),(5,1,NULL,'???? ????',NULL,NULL,500.00,0.00,0.00,500.00,1,0.00,0.00,500.00,1.000,1,1,0,'2026-04-22','2026-04-22 03:07:52','2026-04-22 03:07:52',NULL),(6,1,NULL,'??????? ??? ????',NULL,NULL,5000.00,0.00,0.00,5000.00,1,0.30,15.00,5015.00,111.000,1,1,0,'2026-04-22','2026-04-22 03:12:50','2026-04-22 03:12:50',NULL),(7,1,NULL,'???? ??? ???? ???',NULL,NULL,2200.00,0.00,0.00,2200.00,1,0.00,0.00,2200.00,2.000,1,1,0,'2026-04-22','2026-04-22 03:17:41','2026-04-22 03:34:21',NULL);
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
-- Table structure for table `serial`
--

DROP TABLE IF EXISTS `serial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `serial` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int unsigned NOT NULL,
  `serial` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_serial_value` (`serial`),
  KEY `idx_serial_product` (`product_id`),
  CONSTRAINT `fk_serial_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `serial`
--

LOCK TABLES `serial` WRITE;
/*!40000 ALTER TABLE `serial` DISABLE KEYS */;
/*!40000 ALTER TABLE `serial` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES (1,1,1,0.000,1.000,1,'2026-04-18 12:24:33'),(2,2,1,0.000,1.000,1,'2026-04-18 12:24:33'),(3,3,1,0.000,1.000,1,'2026-04-18 12:24:33'),(4,4,1,0.000,109.000,1,'2026-04-18 12:24:34'),(5,5,1,0.000,1.000,1,'2026-04-18 12:24:34'),(6,6,1,0.000,6.000,1,'2026-04-18 12:24:34'),(7,7,1,0.000,3.000,1,'2026-04-18 12:24:34'),(8,8,1,0.000,2.000,1,'2026-04-18 12:24:34'),(9,9,1,0.000,2.000,1,'2026-04-18 12:24:34'),(10,7,1,3.000,0.000,1,'2026-04-18 12:27:43'),(11,3,1,1.000,0.000,1,'2026-04-18 12:27:43'),(12,5,1,1.000,0.000,1,'2026-04-18 12:27:43'),(13,6,1,6.000,0.000,1,'2026-04-18 12:27:43'),(14,8,1,2.000,0.000,1,'2026-04-18 12:27:43'),(15,9,1,2.000,0.000,1,'2026-04-18 12:27:43'),(16,1,1,1.000,0.000,1,'2026-04-18 12:27:43'),(17,2,1,1.000,0.000,1,'2026-04-18 12:27:43'),(18,4,1,109.000,9.000,1,'2026-04-18 12:27:43'),(19,10,1,0.000,2.000,1,'2026-04-18 19:50:04'),(20,10,1,2.000,1.000,1,'2026-04-18 19:56:46'),(21,11,1,0.000,2.000,1,'2026-04-18 22:08:56'),(22,12,1,0.000,300.000,1,'2026-04-18 22:08:56'),(23,13,1,0.000,1.000,1,'2026-04-18 23:48:08'),(24,14,1,0.000,4.000,1,'2026-04-19 15:00:41'),(25,15,1,0.000,4.000,1,'2026-04-19 15:00:41'),(26,16,1,0.000,10.000,1,'2026-04-19 15:00:41'),(27,17,1,0.000,20.000,1,'2026-04-19 15:00:41'),(28,1,1,0.000,0.000,1,'2026-04-22 01:05:19'),(29,2,1,0.000,0.000,1,'2026-04-22 01:05:19'),(30,3,1,0.000,0.000,1,'2026-04-22 01:05:19'),(31,4,1,9.000,0.000,1,'2026-04-22 01:05:19'),(32,5,1,0.000,0.000,1,'2026-04-22 01:05:19'),(33,6,1,0.000,0.000,1,'2026-04-22 01:05:19'),(34,7,1,0.000,0.000,1,'2026-04-22 01:05:19'),(35,8,1,0.000,0.000,1,'2026-04-22 01:05:19'),(36,9,1,0.000,0.000,1,'2026-04-22 01:05:19'),(37,2,1,0.000,1.000,1,'2026-04-22 01:05:19'),(38,3,1,0.000,1.000,1,'2026-04-22 01:05:19'),(39,4,1,0.000,109.000,1,'2026-04-22 01:05:19'),(40,5,1,0.000,1.000,1,'2026-04-22 01:05:19'),(41,6,1,0.000,6.000,1,'2026-04-22 01:05:19'),(42,7,1,0.000,3.000,1,'2026-04-22 01:05:19'),(43,8,1,0.000,2.000,1,'2026-04-22 01:05:19'),(44,9,1,0.000,2.000,1,'2026-04-22 01:05:19'),(45,18,1,0.000,1.000,1,'2026-04-22 01:09:10'),(46,19,1,0.000,1.000,1,'2026-04-22 01:14:06'),(47,7,1,3.000,6.000,1,'2026-04-22 01:19:05'),(48,3,1,1.000,2.000,1,'2026-04-22 01:19:05'),(49,5,1,1.000,2.000,1,'2026-04-22 01:19:05'),(50,6,1,6.000,12.000,1,'2026-04-22 01:19:05'),(51,8,1,2.000,4.000,1,'2026-04-22 01:19:05'),(52,9,1,2.000,4.000,1,'2026-04-22 01:19:05'),(53,1,1,0.000,1.000,1,'2026-04-22 01:19:05'),(54,2,1,1.000,2.000,1,'2026-04-22 01:19:05'),(55,4,1,109.000,209.000,1,'2026-04-22 01:19:05'),(56,7,1,6.000,3.000,1,'2026-04-22 01:19:05'),(57,3,1,2.000,1.000,1,'2026-04-22 01:19:05'),(58,5,1,2.000,1.000,1,'2026-04-22 01:19:05'),(59,6,1,12.000,6.000,1,'2026-04-22 01:19:05'),(60,8,1,4.000,2.000,1,'2026-04-22 01:19:05'),(61,9,1,4.000,2.000,1,'2026-04-22 01:19:05'),(62,2,1,2.000,1.000,1,'2026-04-22 01:19:05'),(63,4,1,209.000,109.000,1,'2026-04-22 01:19:05'),(64,10,1,1.000,0.000,1,'2026-04-22 01:20:30'),(66,10,1,0.000,1.000,1,'2026-04-22 01:23:05'),(67,10,1,1.000,0.000,1,'2026-04-22 01:23:05'),(68,10,1,0.000,1.000,1,'2026-04-22 01:23:13'),(69,10,1,1.000,0.000,1,'2026-04-22 01:23:13'),(70,10,1,0.000,1.000,1,'2026-04-22 01:23:52'),(71,10,1,1.000,0.000,1,'2026-04-22 01:23:52'),(72,10,1,0.000,1.000,1,'2026-04-22 01:23:59'),(73,10,1,1.000,0.000,1,'2026-04-22 01:23:59'),(74,7,1,3.000,6.000,1,'2026-04-22 01:30:22'),(75,3,1,1.000,2.000,1,'2026-04-22 01:30:22'),(76,5,1,1.000,2.000,1,'2026-04-22 01:30:22'),(77,6,1,6.000,12.000,1,'2026-04-22 01:30:22'),(78,8,1,2.000,4.000,1,'2026-04-22 01:30:22'),(79,9,1,2.000,4.000,1,'2026-04-22 01:30:22'),(80,2,1,1.000,2.000,1,'2026-04-22 01:30:22'),(81,4,1,109.000,209.000,1,'2026-04-22 01:30:22'),(82,7,1,6.000,3.000,1,'2026-04-22 01:30:22'),(83,3,1,2.000,1.000,1,'2026-04-22 01:30:22'),(84,5,1,2.000,1.000,1,'2026-04-22 01:30:22'),(85,6,1,12.000,6.000,1,'2026-04-22 01:30:22'),(86,8,1,4.000,2.000,1,'2026-04-22 01:30:22'),(87,9,1,4.000,2.000,1,'2026-04-22 01:30:22'),(88,4,1,209.000,109.000,1,'2026-04-22 01:30:22'),(89,10,1,0.000,1.000,1,'2026-04-22 01:30:48'),(90,10,1,1.000,0.000,1,'2026-04-22 01:30:48'),(91,20,1,0.000,4.000,1,'2026-04-22 01:41:19'),(92,21,1,0.000,1.000,1,'2026-04-22 01:44:59'),(93,7,1,3.000,6.000,1,'2026-04-22 02:17:06'),(94,3,1,1.000,2.000,1,'2026-04-22 02:17:06'),(95,5,1,1.000,2.000,1,'2026-04-22 02:17:06'),(96,6,1,6.000,12.000,1,'2026-04-22 02:17:06'),(97,8,1,2.000,4.000,1,'2026-04-22 02:17:06'),(98,9,1,2.000,4.000,1,'2026-04-22 02:17:06'),(99,4,1,109.000,209.000,1,'2026-04-22 02:17:06'),(100,7,1,6.000,3.000,1,'2026-04-22 02:17:06'),(101,3,1,2.000,1.000,1,'2026-04-22 02:17:06'),(102,6,1,12.000,6.000,1,'2026-04-22 02:17:06'),(103,8,1,4.000,2.000,1,'2026-04-22 02:17:06'),(104,9,1,4.000,2.000,1,'2026-04-22 02:17:06'),(105,4,1,209.000,109.000,1,'2026-04-22 02:17:06'),(106,4,1,109.000,209.000,1,'2026-04-22 02:18:29'),(107,4,1,209.000,169.000,1,'2026-04-22 02:19:59'),(108,2,1,2.000,1.000,1,'2026-04-22 02:19:59'),(109,22,1,0.000,12.000,1,'2026-04-22 02:51:51'),(110,23,1,0.000,100.000,1,'2026-04-22 02:56:42'),(111,24,1,0.000,2.000,1,'2026-04-22 03:00:38'),(112,25,1,0.000,1.000,1,'2026-04-22 03:03:22'),(113,26,1,0.000,1.000,1,'2026-04-22 03:03:22'),(114,26,1,1.000,0.000,1,'2026-04-22 03:07:52'),(115,27,1,0.000,2.000,1,'2026-04-22 03:09:40'),(116,13,1,1.000,0.000,1,'2026-04-22 03:12:50'),(117,25,1,1.000,0.000,1,'2026-04-22 03:12:50'),(118,23,1,100.000,60.000,1,'2026-04-22 03:12:50'),(119,24,1,2.000,0.000,1,'2026-04-22 03:12:50'),(120,27,1,2.000,0.000,1,'2026-04-22 03:12:50'),(121,12,1,300.000,235.000,1,'2026-04-22 03:12:50'),(123,26,1,0.000,2.000,1,'2026-04-22 03:16:45'),(124,15,1,4.000,3.000,1,'2026-04-22 03:17:41'),(125,26,1,2.000,1.000,1,'2026-04-22 03:17:41'),(126,15,1,3.000,4.000,1,'2026-04-22 03:34:21'),(127,26,1,1.000,2.000,1,'2026-04-22 03:34:21'),(128,15,1,4.000,3.000,1,'2026-04-22 03:34:21'),(129,26,1,2.000,1.000,1,'2026-04-22 03:34:21'),(130,28,1,0.000,5.000,1,'2026-04-22 18:57:52');
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfer_items`
--

LOCK TABLES `stock_transfer_items` WRITE;
/*!40000 ALTER TABLE `stock_transfer_items` DISABLE KEYS */;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supplier_payments`
--

LOCK TABLES `supplier_payments` WRITE;
/*!40000 ALTER TABLE `supplier_payments` DISABLE KEYS */;
INSERT INTO `supplier_payments` VALUES (1,1,12373.00,'to_supplier',NULL,1,'2026-04-22 02:31:54');
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
INSERT INTO `suppliers` VALUES (1,'???','010000000',NULL,'2026-04-18 12:10:57','2026-04-18 12:10:57'),(2,'???? ?????','+201004318329',NULL,'2026-04-19 14:55:11','2026-04-19 14:55:11'),(3,'DATA PETA ???? ???? ?????','010000000000',NULL,'2026-04-22 01:07:29','2026-04-22 01:07:29'),(4,'??? ???????','01012395550','????? ????','2026-04-22 01:12:49','2026-04-22 01:12:49'),(5,'??????','012222222222','???? ?? ??????','2026-04-22 02:50:32','2026-04-22 02:50:32'),(6,'?????','01208167927',NULL,'2026-04-22 03:01:22','2026-04-22 03:01:22');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permission_overrides`
--

DROP TABLE IF EXISTS `user_permission_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_permission_overrides` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `permission_id` int unsigned NOT NULL,
  `is_allowed` tinyint(1) NOT NULL COMMENT '0 ┘à┘åÏ╣ ┘àÏ¿ÏºÏ┤Ï▒Ïî 1 Ï│┘àÏºÏ¡ ┘àÏ¿ÏºÏ┤Ï▒',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_permission_overrides_user_permission` (`user_id`,`permission_id`),
  KEY `idx_user_permission_overrides_permission` (`permission_id`),
  CONSTRAINT `fk_user_permission_overrides_permission` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_permission_overrides_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permission_overrides`
--

LOCK TABLES `user_permission_overrides` WRITE;
/*!40000 ALTER TABLE `user_permission_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permission_overrides` ENABLE KEYS */;
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
  CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`role_id`) REFERENCES `permission_roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (2,1,'2026-04-25 12:54:23'),(3,1,'2026-04-25 12:32:42');
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_warehouses`
--

LOCK TABLES `user_warehouses` WRITE;
/*!40000 ALTER TABLE `user_warehouses` DISABLE KEYS */;
INSERT INTO `user_warehouses` VALUES (1,2,2,'2026-04-21 12:35:43'),(2,3,3,'2026-04-21 12:35:43');
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$hZtX/3AiZc1ocSnID6Tsy.bBTpArvr44dFW5X04qO8siEfTRQlrXC','???? ??????',1,'2026-02-23 08:54:55','2026-02-23 08:54:55'),(2,'panda','$2a$10$vwSSqRwwaSikpiGPEQQ7AuqaJAwk/YAE3yz2MTk/AA12.msb19wzG','panda',1,'2026-02-24 11:17:10','2026-02-24 11:17:10');
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
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_stock`
--

LOCK TABLES `warehouse_stock` WRITE;
/*!40000 ALTER TABLE `warehouse_stock` DISABLE KEYS */;
INSERT INTO `warehouse_stock` VALUES (1,1,1,1.000,NULL,'2026-04-18 12:24:33','2026-04-22 01:19:05'),(2,2,1,1.000,NULL,'2026-04-18 12:24:33','2026-04-22 02:19:59'),(3,3,1,1.000,NULL,'2026-04-18 12:24:33','2026-04-22 02:17:06'),(4,4,1,169.000,NULL,'2026-04-18 12:24:34','2026-04-22 02:19:59'),(5,5,1,2.000,NULL,'2026-04-18 12:24:34','2026-04-22 02:17:06'),(6,6,1,6.000,NULL,'2026-04-18 12:24:34','2026-04-22 02:17:06'),(7,7,1,3.000,NULL,'2026-04-18 12:24:34','2026-04-22 02:17:06'),(8,8,1,2.000,NULL,'2026-04-18 12:24:34','2026-04-22 02:17:06'),(9,9,1,2.000,NULL,'2026-04-18 12:24:34','2026-04-22 02:17:06'),(10,10,1,0.000,NULL,'2026-04-18 19:50:04','2026-04-22 01:30:48'),(11,11,1,2.000,NULL,'2026-04-18 22:08:56','2026-04-18 22:08:56'),(12,12,1,235.000,NULL,'2026-04-18 22:08:56','2026-04-22 03:12:50'),(13,13,1,0.000,NULL,'2026-04-18 23:48:08','2026-04-22 03:12:50'),(14,14,1,4.000,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(15,15,1,3.000,NULL,'2026-04-19 15:00:41','2026-04-22 03:34:21'),(16,16,1,10.000,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(17,17,1,20.000,NULL,'2026-04-19 15:00:41','2026-04-19 15:00:41'),(18,18,1,1.000,NULL,'2026-04-22 01:09:10','2026-04-22 01:09:10'),(19,19,1,1.000,NULL,'2026-04-22 01:14:06','2026-04-22 01:14:06'),(20,20,1,4.000,NULL,'2026-04-22 01:41:19','2026-04-22 01:41:19'),(21,21,1,1.000,NULL,'2026-04-22 01:44:59','2026-04-22 01:44:59'),(22,22,1,12.000,NULL,'2026-04-22 02:51:51','2026-04-22 02:51:51'),(23,23,1,60.000,NULL,'2026-04-22 02:56:42','2026-04-22 03:12:50'),(24,24,1,0.000,NULL,'2026-04-22 03:00:38','2026-04-22 03:12:50'),(25,25,1,0.000,NULL,'2026-04-22 03:03:22','2026-04-22 03:12:50'),(26,26,1,1.000,NULL,'2026-04-22 03:03:22','2026-04-22 03:34:21'),(27,27,1,0.000,NULL,'2026-04-22 03:09:40','2026-04-22 03:12:50'),(28,28,1,5.000,NULL,'2026-04-22 18:57:52','2026-04-22 18:57:52');
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
INSERT INTO `warehouses` VALUES (1,'sb','2026-03-31 01:02:01','2026-03-31 01:02:01'),(2,'???','2026-04-22 02:30:14','2026-04-22 02:30:14'),(3,'East Branch Warehouse','2026-04-21 12:35:43','2026-04-21 12:37:54');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'sb_pos'
--

--
-- Dumping routines for database 'sb_pos'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-26 12:10:53

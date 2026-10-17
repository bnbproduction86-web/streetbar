-- ==============================================================================
-- STREET BAR POS - OPTIMIZED MARIADB DATABASE SCHEMA
-- Theme: Luxury Bar & Lounge POS System
-- MariaDB / MySQL 8.0+ Compatible with InnoDB Engine
-- Optimized with UTF8MB4, Decimal precision for finance, B-Tree Indexes & Views
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+07:00";

-- Database Creation (if not exists)
CREATE DATABASE IF NOT EXISTS `streetbar_pos` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `streetbar_pos`;

-- ------------------------------------------------------------------------------
-- 1. TABLE: outlets (Branch & Store Profile)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `outlets`;
CREATE TABLE `outlets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL DEFAULT 'Street Bar & Lounge',
  `legal_name` VARCHAR(150) NULL,
  `phone` VARCHAR(30) NOT NULL DEFAULT '0812-3456-7890',
  `email` VARCHAR(100) NULL DEFAULT 'info@streetbar.pos',
  `address` TEXT NOT NULL,
  `tax_percentage` DECIMAL(5,2) NOT NULL DEFAULT 10.00 COMMENT 'PB1 / PPN 10%',
  `service_percentage` DECIMAL(5,2) NOT NULL DEFAULT 5.00 COMMENT 'Service charge 5%',
  `receipt_header` TEXT NULL COMMENT 'Greeting or promotional banner on top of receipt',
  `receipt_footer` TEXT NULL COMMENT 'WiFi password, thank you message or social media',
  `logo_url` VARCHAR(255) NULL,
  `currency_symbol` VARCHAR(10) NOT NULL DEFAULT 'Rp',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. TABLE: users (Staff, Cashiers, Barista/Bartender & Admin with PIN access)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `outlet_id` BIGINT UNSIGNED NULL,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `password` VARCHAR(255) NOT NULL,
  `pin_code` VARCHAR(6) NOT NULL COMMENT '6-digit fast login PIN for touchscreen POS',
  `role` ENUM('super_admin', 'manager', 'cashier', 'bartender') NOT NULL DEFAULT 'cashier',
  `avatar_url` VARCHAR(255) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `remember_token` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_pin` (`pin_code`),
  CONSTRAINT `fk_users_outlet` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. TABLE: work_shifts (Cashier Shifts & Cash Reconciliation)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `work_shifts`;
CREATE TABLE `work_shifts` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `outlet_id` BIGINT UNSIGNED NOT NULL,
  `cashier_id` BIGINT UNSIGNED NOT NULL,
  `shift_number` VARCHAR(30) NOT NULL COMMENT 'e.g. SHIFT-20261016-01',
  `opening_cash` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Modal Awal Kasir di Laci',
  `closing_cash_actual` DECIMAL(15,2) NULL COMMENT 'Uang tunai fisik saat tutup shift',
  `closing_cash_expected` DECIMAL(15,2) NULL COMMENT 'Kalkulasi sistem: opening + cash sales + cash in - cash out',
  `cash_difference` DECIMAL(15,2) NULL COMMENT 'Selisih uang kas (actual - expected)',
  `total_cash_in` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_cash_out` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_sales_cash` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_sales_non_cash` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_orders_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `status` ENUM('open', 'closed') NOT NULL DEFAULT 'open',
  `opened_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` TIMESTAMP NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_shifts_cashier` (`cashier_id`),
  KEY `idx_shifts_outlet_status` (`outlet_id`, `status`),
  KEY `idx_shifts_opened_at` (`opened_at`),
  CONSTRAINT `fk_shifts_outlet` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_shifts_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. TABLE: cash_movements (Petty Cash / Pengeluaran Operasional & Kas Masuk)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `cash_movements`;
CREATE TABLE `cash_movements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `shift_id` BIGINT UNSIGNED NOT NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('cash_in', 'cash_out') NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `category` VARCHAR(60) NOT NULL COMMENT 'e.g. Pembelian Es Batu, Gas LPG, Kas Tambahan, Tip Karyawan, Setoran Bank',
  `notes` VARCHAR(255) NULL,
  `receipt_proof_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cash_movement_shift` (`shift_id`),
  KEY `idx_cash_movement_type` (`type`),
  CONSTRAINT `fk_cash_movements_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cash_movements_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. TABLE: categories (Menu & Product Categories)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL,
  `slug` VARCHAR(100) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `icon` VARCHAR(50) NULL DEFAULT 'martini' COMMENT 'Icon name for POS touchscreen UI',
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_categories_order` (`sort_order`, `is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. TABLE: products (Menu, Drinks, Liquors, Bar Snacks, Merchandise)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_id` BIGINT UNSIGNED NOT NULL,
  `sku` VARCHAR(50) NOT NULL UNIQUE,
  `barcode` VARCHAR(50) NULL UNIQUE,
  `name` VARCHAR(120) NOT NULL,
  `description` TEXT NULL,
  `image_url` VARCHAR(255) NULL,
  `unit` VARCHAR(20) NOT NULL DEFAULT 'portion' COMMENT 'portion, glass, bottle, shot, can, cup',
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'HPP (Harga Pokok Penjualan)',
  `selling_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `track_stock` TINYINT(1) NOT NULL DEFAULT 1,
  `current_stock` INT NOT NULL DEFAULT 0,
  `min_stock_alert` INT NOT NULL DEFAULT 5,
  `is_favorite` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Show on POS quick favorite bar',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_products_cat_active` (`category_id`, `is_active`),
  KEY `idx_products_barcode` (`barcode`),
  KEY `idx_products_stock_alert` (`track_stock`, `current_stock`, `min_stock_alert`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. TABLE: product_variants (Ukuran, Porsi, Single/Double Shot)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_variants`;
CREATE TABLE `product_variants` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(60) NOT NULL COMMENT 'e.g. Single Shot (30ml), Double Shot (60ml), Pitcher 1L, Bottle 750ml',
  `sku` VARCHAR(60) NULL UNIQUE,
  `additional_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_variants_product` (`product_id`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. TABLE: modifier_groups (Group Modifiers: Tingkat Manis, Es, Add-ons)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `modifier_groups`;
CREATE TABLE `modifier_groups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(80) NOT NULL COMMENT 'e.g. Sugar Level, Ice Level, Extra Mixers, Garnish',
  `selection_type` ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
  `is_required` TINYINT(1) NOT NULL DEFAULT 0,
  `min_select` INT NOT NULL DEFAULT 0,
  `max_select` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. TABLE: modifier_items (Pilihan Modifiers & Biaya Tambahan)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `modifier_items`;
CREATE TABLE `modifier_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_id` BIGINT UNSIGNED NOT NULL,
  `name` VARCHAR(80) NOT NULL COMMENT 'e.g. No Ice, Less Sweet, Extra Tonic Water (+15.000), Extra Olive (+5.000)',
  `price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_modifier_items_group` (`group_id`),
  CONSTRAINT `fk_modifier_items_group` FOREIGN KEY (`group_id`) REFERENCES `modifier_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. TABLE: product_modifier_groups (Pivot Product & Modifiers)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `product_modifier_groups`;
CREATE TABLE `product_modifier_groups` (
  `product_id` BIGINT UNSIGNED NOT NULL,
  `modifier_group_id` BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (`product_id`, `modifier_group_id`),
  CONSTRAINT `fk_pmg_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pmg_modifier` FOREIGN KEY (`modifier_group_id`) REFERENCES `modifier_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. TABLE: inventory_logs (Log Pergerakan Stok & Stock Opname)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `inventory_logs`;
CREATE TABLE `inventory_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `type` ENUM('initial', 'sale', 'sale_void', 'restock', 'adjustment', 'waste_spoilage') NOT NULL,
  `quantity_change` INT NOT NULL COMMENT 'Negatif untuk keluar/terjual, Positif untuk masuk',
  `previous_stock` INT NOT NULL,
  `current_stock` INT NOT NULL,
  `reference_id` VARCHAR(100) NULL COMMENT 'Order ID, PO number, atau Opname note',
  `notes` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_product_date` (`product_id`, `created_at`),
  KEY `idx_inventory_type` (`type`),
  CONSTRAINT `fk_inv_logs_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. TABLE: tables (Meja & Bar Tab Counter)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `tables`;
CREATE TABLE `tables` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `table_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'e.g. BAR-01, T-01, VIP-01',
  `section` VARCHAR(50) NOT NULL DEFAULT 'Bar Counter' COMMENT 'Bar Counter, Lounge, Indoor, Rooftop, VIP',
  `capacity` INT NOT NULL DEFAULT 4,
  `status` ENUM('available', 'occupied', 'reserved', 'open_tab') NOT NULL DEFAULT 'available',
  `current_guest_name` VARCHAR(100) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tables_section_status` (`section`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. TABLE: customers (Member CRM & Loyalty Points)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `customers`;
CREATE TABLE `customers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `phone` VARCHAR(30) NOT NULL UNIQUE,
  `email` VARCHAR(100) NULL,
  `tier` ENUM('regular', 'silver', 'gold', 'platinum_vip') NOT NULL DEFAULT 'regular',
  `loyalty_points` INT NOT NULL DEFAULT 0,
  `total_spend` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `last_visit` TIMESTAMP NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_customers_phone` (`phone`),
  KEY `idx_customers_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 14. TABLE: promotions (Diskon, Promo, Voucher & Happy Hour Rules)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `promotions`;
CREATE TABLE `promotions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(40) NULL UNIQUE COMMENT 'Voucher Code (optional for automatic promos)',
  `type` ENUM('percentage', 'fixed_amount', 'buy_x_get_y', 'happy_hour') NOT NULL,
  `discount_value` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Percentage (e.g. 20.00) or Fixed Amount (e.g. 50000)',
  `min_order_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` DECIMAL(15,2) NULL COMMENT 'Cap limit for percentage discounts',
  `buy_quantity` INT NOT NULL DEFAULT 0,
  `get_quantity` INT NOT NULL DEFAULT 0,
  `applicable_category_id` BIGINT UNSIGNED NULL,
  `start_date` DATE NULL,
  `end_date` DATE NULL,
  `start_time` TIME NULL COMMENT 'e.g. 17:00:00 for Happy Hour start',
  `end_time` TIME NULL COMMENT 'e.g. 20:00:00 for Happy Hour end',
  `days_active` VARCHAR(50) NULL DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `usage_limit` INT NULL,
  `usage_count` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_promotions_active` (`is_active`, `start_date`, `end_date`),
  KEY `idx_promotions_code` (`code`),
  CONSTRAINT `fk_promo_cat` FOREIGN KEY (`applicable_category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 15. TABLE: orders (Transaksi Kasir Utama / Master Order)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'e.g. SBP-20261016-0001',
  `outlet_id` BIGINT UNSIGNED NOT NULL,
  `cashier_id` BIGINT UNSIGNED NOT NULL,
  `shift_id` BIGINT UNSIGNED NOT NULL,
  `customer_id` BIGINT UNSIGNED NULL,
  `table_id` BIGINT UNSIGNED NULL,
  `order_type` ENUM('dine_in', 'takeaway', 'bar_tab', 'delivery') NOT NULL DEFAULT 'dine_in',
  `status` ENUM('pending', 'completed', 'voided', 'refunded') NOT NULL DEFAULT 'completed',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `promotion_id` BIGINT UNSIGNED NULL,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `service_charge` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `total_cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT 'Total HPP untuk kalkulasi Laba Bersih',
  `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `change_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('cash', 'qris', 'debit_card', 'credit_card', 'bank_transfer', 'split') NOT NULL DEFAULT 'cash',
  `payment_reference` VARCHAR(100) NULL COMMENT 'Approval code EDC / QRIS Ref ID',
  `notes` VARCHAR(255) NULL,
  `printed_count` INT NOT NULL DEFAULT 0,
  `void_reason` VARCHAR(255) NULL,
  `voided_by` BIGINT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_invoice` (`invoice_number`),
  KEY `idx_orders_outlet_date_status` (`outlet_id`, `created_at`, `status`),
  KEY `idx_orders_shift` (`shift_id`),
  KEY `idx_orders_customer` (`customer_id`),
  KEY `idx_orders_payment_method` (`payment_method`),
  CONSTRAINT `fk_orders_outlet` FOREIGN KEY (`outlet_id`) REFERENCES `outlets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_shift` FOREIGN KEY (`shift_id`) REFERENCES `work_shifts` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_table` FOREIGN KEY (`table_id`) REFERENCES `tables` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 16. TABLE: order_items (Detail Item Pembelian dalam Struk)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `product_id` BIGINT UNSIGNED NOT NULL,
  `variant_id` BIGINT UNSIGNED NULL,
  `product_name` VARCHAR(120) NOT NULL,
  `variant_name` VARCHAR(80) NULL,
  `cost_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `quantity` INT NOT NULL DEFAULT 1,
  `subtotal_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `notes` VARCHAR(255) NULL COMMENT 'Special bar requests, e.g. Extra Chilled, Lemon slice',
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 17. TABLE: order_item_modifiers (Modifier Item yang dipilih: Topping, Syrup, dll)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_item_modifiers`;
CREATE TABLE `order_item_modifiers` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_item_id` BIGINT UNSIGNED NOT NULL,
  `modifier_item_id` BIGINT UNSIGNED NULL,
  `modifier_name` VARCHAR(80) NOT NULL,
  `additional_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `idx_order_item_mod_item` (`order_item_id`),
  CONSTRAINT `fk_order_item_mod` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 18. TABLE: order_payments (Multi-Payment / Split Bill Support)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `order_payments`;
CREATE TABLE `order_payments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_id` BIGINT UNSIGNED NOT NULL,
  `payment_method` ENUM('cash', 'qris', 'debit_card', 'credit_card', 'bank_transfer') NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `reference_number` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_payments_order` (`order_id`),
  CONSTRAINT `fk_order_payments_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 19. TABLE: system_settings (Pengaturan Sistem, Hardware Thermal & Pajak)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `system_settings`;
CREATE TABLE `system_settings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(60) NOT NULL UNIQUE,
  `setting_value` TEXT NULL,
  `category` VARCHAR(40) NOT NULL DEFAULT 'general',
  `description` VARCHAR(255) NULL,
  `updated_at` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DATABASE VIEWS (Optimized for Fast Analytics & Reporting)
-- ==============================================================================

-- VIEW 1: Daily Sales & Profit Summary
CREATE OR REPLACE VIEW `v_daily_sales_summary` AS
SELECT 
    DATE(o.created_at) AS `sale_date`,
    COUNT(o.id) AS `total_orders`,
    SUM(o.subtotal) AS `gross_subtotal`,
    SUM(o.discount_amount) AS `total_discounts`,
    SUM(o.tax_amount) AS `total_tax`,
    SUM(o.service_charge) AS `total_service_charge`,
    SUM(o.grand_total) AS `total_revenue`,
    SUM(o.total_cost_price) AS `total_cogs`,
    (SUM(o.grand_total) - SUM(o.tax_amount) - SUM(o.total_cost_price)) AS `net_profit`
FROM `orders` o
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at)
ORDER BY `sale_date` DESC;

-- VIEW 2: Top Selling Menu / Beverage Ranking
CREATE OR REPLACE VIEW `v_top_selling_products` AS
SELECT 
    p.id AS `product_id`,
    p.name AS `product_name`,
    c.name AS `category_name`,
    p.selling_price,
    SUM(oi.quantity) AS `total_quantity_sold`,
    SUM(oi.subtotal_price) AS `total_sales_volume`
FROM `order_items` oi
JOIN `products` p ON oi.product_id = p.id
JOIN `categories` c ON p.category_id = c.id
JOIN `orders` o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY p.id, p.name, c.name, p.selling_price
ORDER BY `total_quantity_sold` DESC;

-- VIEW 3: Payment Method Analytics Breakdown
CREATE OR REPLACE VIEW `v_payment_method_breakdown` AS
SELECT 
    DATE(o.created_at) AS `sale_date`,
    o.payment_method,
    COUNT(o.id) AS `transaction_count`,
    SUM(o.grand_total) AS `total_amount`
FROM `orders` o
WHERE o.status = 'completed'
GROUP BY DATE(o.created_at), o.payment_method
ORDER BY `sale_date` DESC, `total_amount` DESC;

-- ==============================================================================
-- STORED PROCEDURE & TRIGGER: Automatic Stock Deduction on Order
-- ==============================================================================

DELIMITER $$

-- Trigger to deduct stock automatically when an order item is inserted
DROP TRIGGER IF EXISTS `trg_after_order_item_insert`$$
CREATE TRIGGER `trg_after_order_item_insert`
AFTER INSERT ON `order_items`
FOR EACH ROW
BEGIN
    -- Check if product tracks stock
    IF (SELECT track_stock FROM products WHERE id = NEW.product_id) = 1 THEN
        -- Record current stock before update
        SET @prev_stock = (SELECT current_stock FROM products WHERE id = NEW.product_id);
        
        -- Deduct product stock
        UPDATE products 
        SET current_stock = current_stock - NEW.quantity 
        WHERE id = NEW.product_id;
        
        -- Insert inventory log
        INSERT INTO inventory_logs (product_id, variant_id, user_id, type, quantity_change, previous_stock, current_stock, reference_id, notes)
        VALUES (NEW.product_id, NEW.variant_id, 1, 'sale', -NEW.quantity, @prev_stock, @prev_stock - NEW.quantity, NEW.order_id, CONCAT('Sold in Order #', NEW.order_id));
    END IF;
END$$

DELIMITER ;

-- ==============================================================================
-- INITIAL SAMPLE DATA SEEDING (Realistic Street Bar & Lounge Setup)
-- ==============================================================================

-- 1. Outlet Info
INSERT INTO `outlets` (`id`, `name`, `legal_name`, `phone`, `email`, `address`, `tax_percentage`, `service_percentage`, `receipt_header`, `receipt_footer`) VALUES
(1, 'Street Bar & Lounge', 'PT Street Bar Hospitality', '0812-8899-7766', 'contact@streetbar.id', 'Jl. Senopati No. 45, Jakarta Selatan', 10.00, 5.00, 'WELCOME TO STREET BAR\nCraft Cocktails & Culinary Vibe', 'Thank you for chilling with us!\nInstagram: @streetbar.jkt\nWiFi: StreetBarGuest / Pass: goldstreet2026');

-- 2. System Settings
INSERT INTO `system_settings` (`setting_key`, `setting_value`, `category`, `description`) VALUES
('printer_thermal_size', '80mm', 'hardware', 'Ukuran thermal printer: 58mm atau 80mm'),
('printer_auto_cut', 'true', 'hardware', 'Potong kertas otomatis setelah cetak struk'),
('tax_enabled', 'true', 'tax', 'Aktifkan PB1 / Resto Tax 10%'),
('service_charge_enabled', 'true', 'tax', 'Aktifkan Service Charge 5%'),
('pos_sound_feedback', 'true', 'touchscreen', 'Suara beep saat tap menu atau selesaikan pembayaran'),
('theme_gold_accent', '#D4AF37', 'ui', 'Warna aksen emas luxury Street Bar');

-- 3. Users / Staff (Password hash for 'admin123' and 'cashier123')
INSERT INTO `users` (`id`, `outlet_id`, `name`, `email`, `phone`, `password`, `pin_code`, `role`) VALUES
(1, 1, 'Bramantyo (Owner)', 'admin@streetbar.id', '081234567891', '$2y$12$N3q7z8pBq7mFzZ8W5z7ULe12HqB5nZ9J0.07XvM0n1B1M1J1H1K1K', '112233', 'super_admin'),
(2, 1, 'Rian Satria (Manager)', 'manager@streetbar.id', '081234567892', '$2y$12$N3q7z8pBq7mFzZ8W5z7ULe12HqB5nZ9J0.07XvM0n1B1M1J1H1K1K', '998877', 'manager'),
(3, 1, 'Nabila Putri (Kasir 1)', 'nabila@streetbar.id', '081234567893', '$2y$12$N3q7z8pBq7mFzZ8W5z7ULe12HqB5nZ9J0.07XvM0n1B1M1J1H1K1K', '123456', 'cashier'),
(4, 1, 'Dimas Prayoga (Head Bartender)', 'dimas@streetbar.id', '081234567894', '$2y$12$N3q7z8pBq7mFzZ8W5z7ULe12HqB5nZ9J0.07XvM0n1B1M1J1H1K1K', '556677', 'bartender');

-- 4. Categories
INSERT INTO `categories` (`id`, `name`, `slug`, `icon`, `sort_order`, `is_active`) VALUES
(1, 'Signature Cocktails', 'signature-cocktails', 'martini', 1, 1),
(2, 'Mocktails & Chillers', 'mocktails-chillers', 'glass-citrus', 2, 1),
(3, 'Beers & Draught', 'beers-draught', 'beer', 3, 1),
(4, 'Whiskey & Spirits', 'whiskey-spirits', 'bottle-wine', 4, 1),
(5, 'Artisan Coffee & Tea', 'coffee-tea', 'coffee', 5, 1),
(6, 'Street Tapas & Bites', 'tapas-bites', 'utensils', 6, 1),
(7, 'Main Kitchen & Steaks', 'main-kitchen', 'flame', 7, 1);

-- 5. Products (Sample Signature Bar Items)
INSERT INTO `products` (`id`, `category_id`, `sku`, `barcode`, `name`, `description`, `image_url`, `unit`, `cost_price`, `selling_price`, `track_stock`, `current_stock`, `min_stock_alert`, `is_favorite`) VALUES
(1, 1, 'CKT-GOLD-01', '899100101', 'Golden Smoked Old Fashioned', 'Bourbon, gold leaf flakes, aromatic bitters, orange peel, oakwood smoke aroma', '/images/menu/gold_old_fashioned.jpg', 'glass', 45000.00, 145000.00, 1, 60, 10, 1),
(2, 1, 'CKT-MID-02', '899100102', 'Midnight Velvet Negroni', 'Botanical Gin, Campari, Sweet Vermouth, dehydrated blood orange wheel', '/images/menu/midnight_negroni.jpg', 'glass', 38000.00, 135000.00, 1, 45, 8, 1),
(3, 1, 'CKT-STR-03', '899100103', 'Street Bar Espresso Martini', 'Vodka, artisanal espresso roast, kahlua, vanilla bean froth', '/images/menu/espresso_martini.jpg', 'glass', 32000.00, 120000.00, 1, 50, 10, 1),
(4, 2, 'MCK-SUN-01', '899200101', 'Golden Sunset Fizz Mocktail', 'Yuzu purée, passion fruit, fresh mint, sparkling tonic, butterfly pea splash', '/images/menu/sunset_fizz.jpg', 'glass', 18000.00, 65000.00, 1, 80, 15, 1),
(5, 2, 'MCK-LYC-02', '899200102', 'Lychee Rose Blossom', 'Fresh lychees, organic rose syrup, pink grapefruit soda, rosemary sprig', '/images/menu/lychee_rose.jpg', 'glass', 16000.00, 58000.00, 1, 75, 12, 1),
(6, 3, 'BER-DRT-01', '899300101', 'Street Craft IPA Pint', 'Fresh draft craft IPA with citrus floral hops aroma (500ml)', '/images/menu/craft_ipa.jpg', 'pint', 28000.00, 85000.00, 1, 120, 20, 1),
(7, 3, 'BER-BTL-02', '899300102', 'Corona Extra Beer Bucket (5 Btls)', '5 chilled Corona bottles served in ice bucket with fresh lime wedges', '/images/menu/corona_bucket.jpg', 'bucket', 120000.00, 320000.00, 1, 30, 5, 0),
(8, 4, 'WHS-MCL-01', '899400101', 'Macallan 12 Double Cask', 'Single malt scotch whiskey with rich honey, citrus, and ginger notes', '/images/menu/macallan_12.jpg', 'shot', 65000.00, 195000.00, 1, 35, 6, 1),
(9, 6, 'TPS-TRF-01', '899600101', 'Truffle Parmesan Hand-cut Fries', 'Crispy Idaho potato fries tossed in white truffle oil, rosemary, aged parmesan', '/images/menu/truffle_fries.jpg', 'portion', 18000.00, 68000.00, 1, 95, 15, 1),
(10, 6, 'TPS-WNG-02', '899600102', 'Korean Honey Butter Glazed Wings', 'Juicy crispy chicken wings coated with sweet savory honey garlic glaze (6 pcs)', '/images/menu/honey_wings.jpg', 'portion', 24000.00, 78000.00, 1, 65, 10, 1),
(11, 7, 'MN-WGY-01', '899700101', 'Wagyu MB5 Tenderloin Steak 200g', 'Grilled premium Australian Wagyu MB5, mashed potato, asparagus, red wine jus', '/images/menu/wagyu_tenderloin.jpg', 'portion', 140000.00, 345000.00, 1, 25, 5, 0);

-- 6. Modifier Groups & Items
INSERT INTO `modifier_groups` (`id`, `name`, `selection_type`, `is_required`, `min_select`, `max_select`) VALUES
(1, 'Ice Preference', 'single', 0, 0, 1),
(2, 'Sugar Level', 'single', 0, 0, 1),
(3, 'Extra Shot / Alcohol Add-on', 'multiple', 0, 0, 3),
(4, 'Steak Doneness', 'single', 1, 1, 1);

INSERT INTO `modifier_items` (`id`, `group_id`, `name`, `price`, `cost_price`) VALUES
(1, 1, 'Normal Ice', 0.00, 0.00),
(2, 1, 'Less Ice', 0.00, 0.00),
(3, 1, 'No Ice', 0.00, 0.00),
(4, 1, 'Artisanal Clear Ice Cube (+10k)', 10000.00, 2000.00),
(5, 2, 'Normal Sweet', 0.00, 0.00),
(6, 2, 'Less Sweet (50%)', 0.00, 0.00),
(7, 2, 'Zero Sugar', 0.00, 0.00),
(8, 3, 'Extra Vodka Shot (+40k)', 40000.00, 15000.00),
(9, 3, 'Extra Bourbon Shot (+50k)', 50000.00, 18000.00),
(10, 4, 'Medium Rare', 0.00, 0.00),
(11, 4, 'Medium', 0.00, 0.00),
(12, 4, 'Medium Well', 0.00, 0.00);

-- 7. Bar Tables & Sections
INSERT INTO `tables` (`id`, `table_number`, `section`, `capacity`, `status`) VALUES
(1, 'BAR-01', 'Bar Counter', 2, 'available'),
(2, 'BAR-02', 'Bar Counter', 2, 'available'),
(3, 'BAR-03', 'Bar Counter', 2, 'occupied'),
(4, 'T-01', 'Indoor Lounge', 4, 'available'),
(5, 'T-02', 'Indoor Lounge', 4, 'available'),
(6, 'T-03', 'Indoor Lounge', 6, 'available'),
(7, 'ROOF-01', 'Rooftop Garden', 4, 'available'),
(8, 'ROOF-02', 'Rooftop Garden', 4, 'available'),
(9, 'VIP-GOLD', 'VIP Mezzanine', 10, 'reserved');

-- 8. Promotions
INSERT INTO `promotions` (`id`, `name`, `code`, `type`, `discount_value`, `min_order_amount`, `max_discount_amount`, `start_time`, `end_time`, `days_active`, `is_active`) VALUES
(1, 'Happy Hour Cocktails 25% Off', 'HAPPYHOUR', 'happy_hour', 25.00, 100000.00, 200000.00, '17:00:00', '20:00:00', 'Mon,Tue,Wed,Thu,Fri', 1),
(2, 'Gold Member Welcome Discount Rp 50.000', 'GOLD50K', 'fixed_amount', 50000.00, 250000.00, 50000.00, NULL, NULL, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 1),
(3, 'Beer Fest 10% Off', 'BEER10', 'percentage', 10.00, 150000.00, 100000.00, NULL, NULL, 'Mon,Tue,Wed,Thu,Fri,Sat,Sun', 1);

-- 9. Customers (VIP Members)
INSERT INTO `customers` (`id`, `name`, `phone`, `email`, `tier`, `loyalty_points`, `total_spend`) VALUES
(1, 'Alexander Wijaya', '08111222333', 'alex.wijaya@gmail.com', 'platinum_vip', 450, 4850000.00),
(2, 'Jessica Tan', '08129876543', 'jessica.tan@hotmail.com', 'gold', 280, 2900000.00),
(3, 'Reza Rahardian', '08137788990', 'reza.rahardian@yahoo.com', 'silver', 110, 1250000.00);

-- 10. Sample Active Shift
INSERT INTO `work_shifts` (`id`, `outlet_id`, `cashier_id`, `shift_number`, `opening_cash`, `total_cash_in`, `total_cash_out`, `total_sales_cash`, `total_sales_non_cash`, `total_orders_count`, `status`, `opened_at`, `notes`) VALUES
(1, 1, 3, 'SHIFT-20261016-01', 500000.00, 100000.00, 50000.00, 850000.00, 1240000.00, 8, 'open', NOW() - INTERVAL 4 HOUR, 'Shift Malam Kasir Nabila. Kas awal laci Rp 500.000.');

-- 11. Sample Cash Movement (Petty Cash Expense)
INSERT INTO `cash_movements` (`id`, `shift_id`, `user_id`, `type`, `amount`, `category`, `notes`) VALUES
(1, 1, 3, 'cash_in', 100000.00, 'Uang Pecahan Kas', 'Penukaran uang kecil Rp 2.000 & Rp 5.000 dari bank'),
(2, 1, 3, 'cash_out', 50000.00, 'Pembelian Es Batu Tube', 'Beli 2 karung es batu kristal darurat');

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

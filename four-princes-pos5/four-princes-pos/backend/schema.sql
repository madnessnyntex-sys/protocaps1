-- Four Princes: Popularity and Stock Tracker
-- MySQL schema (matches backend/models.py exactly)
--
-- NOTE: You do NOT have to run this file by hand. If you point DATABASE_URL
-- at an empty MySQL database and start the Flask app, SQLAlchemy creates all
-- of these tables automatically. This file is provided for your data
-- dictionary / documentation, and as a manual fallback if you prefer to
-- create the schema yourself.

CREATE DATABASE IF NOT EXISTS four_princes_pos
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE four_princes_pos;

-- ---------------------------------------------------------------- users
CREATE TABLE users (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    role          ENUM('admin', 'staff') NOT NULL DEFAULT 'staff',
    is_active     TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- categories
CREATE TABLE categories (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255),
    is_active   TINYINT(1) NOT NULL DEFAULT 1,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- products
CREATE TABLE products (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    category_id    INT,
    name           VARCHAR(150) NOT NULL,
    sku            VARCHAR(50) NOT NULL UNIQUE,
    size           VARCHAR(20),
    color          VARCHAR(40),
    price          DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost           DECIMAL(10,2) NOT NULL DEFAULT 0,
    reorder_level  INT NOT NULL DEFAULT 5,
    current_stock  INT NOT NULL DEFAULT 0,
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_products_category (category_id),
    INDEX idx_products_active (is_active)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- stock_movements
CREATE TABLE stock_movements (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    product_id       INT NOT NULL,
    movement_type    ENUM('initial','restock','sale','adjustment','void_restore') NOT NULL,
    quantity_change  INT NOT NULL,
    resulting_stock  INT NOT NULL,
    reference        VARCHAR(100),
    notes            VARCHAR(255),
    created_by       INT,
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_movements_product (product_id),
    INDEX idx_movements_created (created_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- sales
CREATE TABLE sales (
    id               INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number   VARCHAR(30) NOT NULL UNIQUE,
    cashier_id       INT NOT NULL,
    subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount         DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount     DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method   ENUM('cash','digital') NOT NULL DEFAULT 'cash',
    amount_tendered  DECIMAL(10,2),
    change_amount    DECIMAL(10,2),
    status           ENUM('completed','voided') NOT NULL DEFAULT 'completed',
    created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cashier_id) REFERENCES users(id),
    INDEX idx_sales_created (created_at),
    INDEX idx_sales_cashier (cashier_id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------- sale_items
CREATE TABLE sale_items (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    sale_id     INT NOT NULL,
    product_id  INT NOT NULL,
    quantity    INT NOT NULL,
    unit_price  DECIMAL(10,2) NOT NULL,
    subtotal    DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    INDEX idx_sale_items_sale (sale_id),
    INDEX idx_sale_items_product (product_id)
) ENGINE=InnoDB;

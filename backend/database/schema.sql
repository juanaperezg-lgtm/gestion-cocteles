-- Schema para Sistema de Gestión de Coctelería
-- Base de datos: PostgreSQL

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de productos (cócteles, ingredientes, bebidas)
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  purchase_price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2) NOT NULL,
  category VARCHAR(50), -- 'cocktail', 'ingredient', 'beverage', etc
  stock_quantity DECIMAL(10, 2) DEFAULT 0,
  unit VARCHAR(20), -- 'ml', 'cl', 'unit', 'bottle', etc
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de ventas
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  sale_date DATE NOT NULL,
  sale_time TIME NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de compras de productos
CREATE TABLE IF NOT EXISTS purchases (
  id SERIAL PRIMARY KEY,
  product_name VARCHAR(150) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  consumable_id INTEGER,
  unit VARCHAR(20),
  quantity DECIMAL(10, 2) NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  supplier VARCHAR(100),
  purchase_date DATE NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de insumos consumibles para stock operativo
CREATE TABLE IF NOT EXISTS consumables (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  unit VARCHAR(20) NOT NULL DEFAULT 'unit',
  current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
  low_stock_threshold DECIMAL(10, 2) NOT NULL DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_consumables_name_lower
ON consumables (LOWER(name));

-- Plantilla de insumos por producto vendido
CREATE TABLE IF NOT EXISTS product_consumables (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  consumable_id INTEGER NOT NULL REFERENCES consumables(id) ON DELETE CASCADE,
  quantity_per_sale DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id, consumable_id)
);

-- Movimientos de inventario de insumos
CREATE TABLE IF NOT EXISTS consumable_stock_movements (
  id SERIAL PRIMARY KEY,
  consumable_id INTEGER NOT NULL REFERENCES consumables(id),
  movement_type VARCHAR(20) NOT NULL,
  quantity_change DECIMAL(10, 2) NOT NULL,
  reference_type VARCHAR(30),
  reference_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_sales_sale_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_product_name ON purchases(product_name);

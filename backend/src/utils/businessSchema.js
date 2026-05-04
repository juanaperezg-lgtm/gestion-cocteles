import pool from '../config/database.js';

let businessSchemaMigrationPromise = null;

export const ensureBusinessSchema = async () => {
  if (businessSchemaMigrationPromise) {
    return businessSchemaMigrationPromise;
  }

  businessSchemaMigrationPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consumables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'unit',
        current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
        low_stock_threshold DECIMAL(10, 2) NOT NULL DEFAULT 10,
        avg_unit_cost DECIMAL(10, 4) NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE consumables
      ADD COLUMN IF NOT EXISTS avg_unit_cost DECIMAL(10, 4) NOT NULL DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
    `);

    await pool.query(`
      UPDATE products p
      SET user_id = ownership.user_id
      FROM (
        SELECT product_id, MIN(user_id) AS user_id
        FROM sales
        WHERE product_id IS NOT NULL
          AND user_id IS NOT NULL
        GROUP BY product_id
      ) ownership
      WHERE p.id = ownership.product_id
        AND p.user_id IS NULL
    `);

    await pool.query(`
      UPDATE products p
      SET user_id = ownership.user_id
      FROM (
        SELECT product_id, MIN(user_id) AS user_id
        FROM purchases
        WHERE product_id IS NOT NULL
          AND user_id IS NOT NULL
        GROUP BY product_id
      ) ownership
      WHERE p.id = ownership.product_id
        AND p.user_id IS NULL
    `);

    await pool.query(`
      UPDATE products
      SET user_id = (
        SELECT id
        FROM users
        ORDER BY id
        LIMIT 1
      )
      WHERE user_id IS NULL
        AND EXISTS (SELECT 1 FROM users)
    `);

    await pool.query(`
      ALTER TABLE products
      ALTER COLUMN user_id SET NOT NULL
    `);

    await pool.query(`
      ALTER TABLE consumables
      ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id)
    `);

    await pool.query(`
      UPDATE consumables c
      SET user_id = ownership.user_id
      FROM (
        SELECT consumable_id, MIN(user_id) AS user_id
        FROM purchases
        WHERE consumable_id IS NOT NULL
          AND user_id IS NOT NULL
        GROUP BY consumable_id
      ) ownership
      WHERE c.id = ownership.consumable_id
        AND c.user_id IS NULL
    `);

    await pool.query(`
      UPDATE consumables c
      SET user_id = ownership.user_id
      FROM (
        SELECT consumable_id, MIN(user_id) AS user_id
        FROM consumable_stock_movements
        WHERE consumable_id IS NOT NULL
          AND user_id IS NOT NULL
        GROUP BY consumable_id
      ) ownership
      WHERE c.id = ownership.consumable_id
        AND c.user_id IS NULL
    `);

    await pool.query(`
      UPDATE consumables
      SET user_id = (
        SELECT id
        FROM users
        ORDER BY id
        LIMIT 1
      )
      WHERE user_id IS NULL
        AND EXISTS (SELECT 1 FROM users)
    `);

    await pool.query(`
      DROP INDEX IF EXISTS idx_consumables_name_lower
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_consumables_user_name_lower
      ON consumables (user_id, LOWER(name))
      WHERE user_id IS NOT NULL
    `);

    await pool.query(`
      ALTER TABLE consumables
      ALTER COLUMN user_id SET NOT NULL
    `);

    await pool.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS cogs_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS net_profit DECIMAL(10, 2) NOT NULL DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30)
    `);

    await pool.query(`
      UPDATE sales
      SET payment_method = 'efectivo'
      WHERE payment_method IS NULL
    `);

    await pool.query(`
      ALTER TABLE sales
      ALTER COLUMN payment_method SET DEFAULT 'efectivo'
    `);

    await pool.query(`
      ALTER TABLE sales
      ALTER COLUMN payment_method SET NOT NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS operating_expenses (
        id SERIAL PRIMARY KEY,
        expense_date DATE NOT NULL,
        category VARCHAR(60) NOT NULL,
        description VARCHAR(180) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(30),
        notes TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_operating_expenses_expense_date
      ON operating_expenses (expense_date)
    `);
  })().catch((error) => {
    businessSchemaMigrationPromise = null;
    throw error;
  });

  return businessSchemaMigrationPromise;
};

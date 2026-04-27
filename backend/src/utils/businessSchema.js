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
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS cogs_amount DECIMAL(10, 2) NOT NULL DEFAULT 0
    `);

    await pool.query(`
      ALTER TABLE sales
      ADD COLUMN IF NOT EXISTS net_profit DECIMAL(10, 2) NOT NULL DEFAULT 0
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

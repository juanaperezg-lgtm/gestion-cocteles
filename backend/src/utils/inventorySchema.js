import pool from '../config/database.js';

let inventorySchemaMigrationPromise = null;

export const ensureInventorySchema = async () => {
  if (inventorySchemaMigrationPromise) {
    return inventorySchemaMigrationPromise;
  }

  inventorySchemaMigrationPromise = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consumables (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        unit VARCHAR(20) NOT NULL DEFAULT 'unit',
        current_stock DECIMAL(10, 2) NOT NULL DEFAULT 0,
        low_stock_threshold DECIMAL(10, 2) NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_consumables_name_lower
      ON consumables (LOWER(name))
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS product_consumables (
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        consumable_id INTEGER NOT NULL REFERENCES consumables(id) ON DELETE CASCADE,
        quantity_per_sale DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (product_id, consumable_id)
      )
    `);

    await pool.query(`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS product_name VARCHAR(150)
    `);

    await pool.query(`
      UPDATE purchases p
      SET product_name = pr.name
      FROM products pr
      WHERE p.product_id = pr.id
        AND (p.product_name IS NULL OR BTRIM(p.product_name) = '')
    `);

    await pool.query(`
      ALTER TABLE purchases
      ALTER COLUMN product_id DROP NOT NULL
    `);

    await pool.query(`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS consumable_id INTEGER REFERENCES consumables(id)
    `);

    await pool.query(`
      ALTER TABLE purchases
      ADD COLUMN IF NOT EXISTS unit VARCHAR(20)
    `);

    const consumablesCount = await pool.query('SELECT COUNT(*)::int AS count FROM consumables');
    if (consumablesCount.rows[0].count === 0) {
      await pool.query(`
        INSERT INTO consumables (name, unit, current_stock)
        SELECT
          MIN(BTRIM(product_name)) AS name,
          COALESCE(NULLIF(MIN(BTRIM(unit)), ''), 'unit') AS unit,
          SUM(quantity) AS current_stock
        FROM purchases
        WHERE product_name IS NOT NULL
          AND BTRIM(product_name) <> ''
        GROUP BY LOWER(BTRIM(product_name))
      `);
    }

    await pool.query(`
      UPDATE purchases p
      SET consumable_id = c.id
      FROM consumables c
      WHERE p.consumable_id IS NULL
        AND p.product_name IS NOT NULL
        AND BTRIM(p.product_name) <> ''
        AND LOWER(BTRIM(p.product_name)) = LOWER(c.name)
    `);

    await pool.query(`
      UPDATE purchases p
      SET unit = c.unit
      FROM consumables c
      WHERE p.consumable_id = c.id
        AND (p.unit IS NULL OR BTRIM(p.unit) = '')
    `);
  })().catch((error) => {
    inventorySchemaMigrationPromise = null;
    throw error;
  });

  return inventorySchemaMigrationPromise;
};

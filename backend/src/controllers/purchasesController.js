import pool from '../config/database.js';
import { ensureInventorySchema } from '../utils/inventorySchema.js';
import { ensureBusinessSchema } from '../utils/businessSchema.js';
import { BUSINESS_DATE_SQL } from '../utils/businessTime.js';

const normalizeUnit = (unit) => {
  const unitValue = typeof unit === 'string' ? unit.trim().toLowerCase() : '';
  return unitValue || 'unit';
};

export const createPurchase = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await ensureInventorySchema();
    await ensureBusinessSchema();

    const { product_name, quantity, unit_cost, supplier, notes, unit } = req.body;
    const userId = req.user?.id;
    const productName = typeof product_name === 'string' ? product_name.trim() : '';
    const quantityNumber = Number(quantity);
    const unitCostNumber = Number(unit_cost);
    const normalizedUnit = normalizeUnit(unit);

    if (!productName || !quantity || !unit_cost) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    if (Number.isNaN(quantityNumber) || Number.isNaN(unitCostNumber) || quantityNumber <= 0 || unitCostNumber < 0) {
      return res.status(400).json({ error: 'Cantidad y costo deben ser valores válidos' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const total_cost = quantityNumber * unitCostNumber;
    await client.query('BEGIN');
    transactionStarted = true;

    const existingConsumable = await client.query(
      `SELECT id, unit
             , current_stock
             , avg_unit_cost
       FROM consumables
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1
       FOR UPDATE`,
      [productName]
    );

    let consumableId;
    let consumableUnit = normalizedUnit;
    let previousStock = 0;
    let previousAvgUnitCost = 0;
    if (existingConsumable.rows.length > 0) {
      consumableId = existingConsumable.rows[0].id;
      consumableUnit = existingConsumable.rows[0].unit;
      previousStock = Number(existingConsumable.rows[0].current_stock) || 0;
      previousAvgUnitCost = Number(existingConsumable.rows[0].avg_unit_cost) || 0;
    } else {
      const consumableResult = await client.query(
        `INSERT INTO consumables (name, unit, current_stock, avg_unit_cost)
         VALUES ($1, $2, 0, $3)
         RETURNING id, unit`,
        [productName, normalizedUnit, unitCostNumber]
      );
      consumableId = consumableResult.rows[0].id;
      consumableUnit = consumableResult.rows[0].unit;
    }

    const result = await client.query(
      `INSERT INTO purchases (product_name, consumable_id, unit, quantity, unit_cost, total_cost, supplier, purchase_date, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, ${BUSINESS_DATE_SQL}, $8, $9)
       RETURNING *`,
      [
        productName,
        consumableId,
        consumableUnit,
        quantityNumber,
        unitCostNumber,
        total_cost,
        supplier || null,
        userId,
        notes || null,
      ]
    );

    const nextStock = previousStock + quantityNumber;
    const nextAvgUnitCost = nextStock > 0
      ? ((previousStock * previousAvgUnitCost) + (quantityNumber * unitCostNumber)) / nextStock
      : unitCostNumber;

    await client.query(
      `UPDATE consumables
       SET current_stock = $1,
           avg_unit_cost = $2,
            updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [nextStock, nextAvgUnitCost, consumableId]
    );

    await client.query(
      `INSERT INTO consumable_stock_movements
       (consumable_id, movement_type, quantity_change, reference_type, reference_id, user_id, notes)
       VALUES ($1, 'purchase', $2, 'purchase', $3, $4, $5)`,
      [consumableId, quantityNumber, result.rows[0].id, userId, notes || null]
    );

    await client.query('COMMIT');
    transactionStarted = false;
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error('Error al crear compra:', error);
    res.status(500).json({ error: 'Error al registrar compra' });
  } finally {
    client.release();
  }
};

export const getAllPurchases = async (req, res) => {
  try {
    await ensureInventorySchema();
    await ensureBusinessSchema();

    const result = await pool.query(
      `SELECT
         p.id,
         p.product_id,
         p.quantity,
         p.unit_cost,
         p.total_cost,
         p.supplier,
         TO_CHAR(p.purchase_date, 'YYYY-MM-DD') as purchase_date,
         p.user_id,
         p.notes,
         p.created_at,
         COALESCE(p.product_name, pr.name, c.name) as product_name,
         COALESCE(p.unit, c.unit, 'unit') as unit
         FROM purchases p
        LEFT JOIN products pr ON p.product_id = pr.id
        LEFT JOIN consumables c ON p.consumable_id = c.id
         ORDER BY p.purchase_date DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

export const getPurchasesByDate = async (req, res) => {
  try {
    await ensureInventorySchema();
    await ensureBusinessSchema();

    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Parámetro date requerido' });
    }

    const result = await pool.query(
      `SELECT
         p.id,
         p.product_id,
         p.quantity,
         p.unit_cost,
         p.total_cost,
         p.supplier,
         TO_CHAR(p.purchase_date, 'YYYY-MM-DD') as purchase_date,
         p.user_id,
         p.notes,
         p.created_at,
         COALESCE(p.product_name, pr.name, c.name) as product_name,
         COALESCE(p.unit, c.unit, 'unit') as unit
         FROM purchases p
        LEFT JOIN products pr ON p.product_id = pr.id
        LEFT JOIN consumables c ON p.consumable_id = c.id
         WHERE p.purchase_date = $1
         ORDER BY p.purchase_date DESC`,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener compras:', error);
    res.status(500).json({ error: 'Error al obtener compras' });
  }
};

export const getConsumablesStock = async (req, res) => {
  try {
    await ensureInventorySchema();
    await ensureBusinessSchema();

    const result = await pool.query(
      `SELECT
         id,
         name,
         unit,
         current_stock,
         avg_unit_cost,
         (current_stock * avg_unit_cost) AS inventory_cost,
         low_stock_threshold,
         (current_stock <= low_stock_threshold) AS is_low_stock
       FROM consumables
       ORDER BY name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener stock de insumos:', error);
    res.status(500).json({ error: 'Error al obtener stock de insumos' });
  }
};

import pool from '../config/database.js';
import { ensureInventorySchema } from '../utils/inventorySchema.js';

const parsePositiveNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const createSale = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await ensureInventorySchema();

    const { product_id, quantity, unit_price, notes, consumables_used } = req.body;
    const userId = req.user?.id;
    const quantityNumber = Number(quantity);
    const unitPriceNumber = Number(unit_price);

    // Validaciones
    if (!product_id || !quantity || !unit_price) {
      return res.status(400).json({
        error: 'Producto, cantidad y precio son requeridos'
      });
    }

    if (!userId) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    // Validar que sean números válidos
    if (Number.isNaN(quantityNumber) || Number.isNaN(unitPriceNumber) || quantityNumber <= 0 || unitPriceNumber < 0) {
      return res.status(400).json({
        error: 'Cantidad debe ser mayor a 0 y precio debe ser válido'
      });
    }

    const normalizedConsumables = Array.isArray(consumables_used) ? consumables_used.reduce((acc, item) => {
      const consumableId = Number(item?.consumable_id);
      const consumableQuantity = parsePositiveNumber(item?.quantity);

      if (!Number.isInteger(consumableId) || !consumableQuantity) {
        return acc;
      }

      acc.set(consumableId, (acc.get(consumableId) || 0) + consumableQuantity);
      return acc;
    }, new Map()) : new Map();

    await client.query('BEGIN');
    transactionStarted = true;

    const productCheck = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      throw {
        status: 404,
        message: 'Producto no encontrado',
      };
    }

    const total_amount = quantityNumber * unitPriceNumber;

    const result = await client.query(
      `INSERT INTO sales (product_id, quantity, unit_price, total_amount, user_id, sale_date, sale_time, notes)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME, $6)
       RETURNING *`,
      [product_id, quantityNumber, unitPriceNumber, total_amount, userId, notes || null]
    );

    for (const [consumableId, consumableQuantity] of normalizedConsumables.entries()) {
      const consumableResult = await client.query(
        `SELECT id, name, current_stock
         FROM consumables
         WHERE id = $1
         FOR UPDATE`,
        [consumableId]
      );

      if (consumableResult.rows.length === 0) {
        throw {
          status: 404,
          message: `Insumo no encontrado: ${consumableId}`,
        };
      }

      const consumable = consumableResult.rows[0];
      const availableStock = Number(consumable.current_stock);

      if (!Number.isFinite(availableStock) || availableStock < consumableQuantity) {
        throw {
          status: 400,
          message: `Stock insuficiente para ${consumable.name}. Disponible: ${availableStock || 0}`,
        };
      }

      await client.query(
        `UPDATE consumables
         SET current_stock = current_stock - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [consumableQuantity, consumableId]
      );

      await client.query(
        `INSERT INTO consumable_stock_movements
         (consumable_id, movement_type, quantity_change, reference_type, reference_id, user_id, notes)
         VALUES ($1, 'sale', $2, 'sale', $3, $4, $5)`,
        [consumableId, -consumableQuantity, result.rows[0].id, userId, notes || null]
      );
    }

    await client.query('COMMIT');
    transactionStarted = false;
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error('Error al crear venta:', error.message);
    res.status(error.status || 500).json({
      error: error.message || 'Error al registrar la venta. Intenta de nuevo.'
    });
  } finally {
    client.release();
  }
};

export const getSalesByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        error: 'Parámetro date es requerido (YYYY-MM-DD)'
      });
    }

    // Validar formato de fecha
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: 'Formato de fecha inválido. Usa YYYY-MM-DD'
      });
    }

    const result = await pool.query(
      `SELECT
         s.id,
         s.product_id,
         s.quantity,
         s.unit_price,
         s.total_amount,
         s.user_id,
         TO_CHAR(s.sale_date, 'YYYY-MM-DD') as sale_date,
         TO_CHAR(s.sale_time, 'HH24:MI:SS') as sale_time,
         s.notes,
         s.created_at,
         p.name as product_name
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date = $1
       ORDER BY s.sale_time DESC`,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error.message);
    res.status(500).json({
      error: 'Error al obtener las ventas'
    });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         s.id,
         s.product_id,
         s.quantity,
         s.unit_price,
         s.total_amount,
         s.user_id,
         TO_CHAR(s.sale_date, 'YYYY-MM-DD') as sale_date,
         TO_CHAR(s.sale_time, 'HH24:MI:SS') as sale_time,
         s.notes,
         s.created_at,
         p.name as product_name
       FROM sales s
       JOIN products p ON s.product_id = p.id
       ORDER BY s.sale_date DESC, s.sale_time DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error.message);
    res.status(500).json({
      error: 'Error al obtener las ventas'
    });
  }
};

export const getConsumables = async (req, res) => {
  try {
    await ensureInventorySchema();

    const result = await pool.query(
      `SELECT id, name, unit, current_stock, low_stock_threshold
       FROM consumables
       ORDER BY name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener insumos:', error.message);
    res.status(500).json({
      error: 'Error al obtener insumos'
    });
  }
};

export const getProductConsumablesTemplate = async (req, res) => {
  try {
    await ensureInventorySchema();

    const productId = Number(req.params.productId);
    if (!Number.isInteger(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    const result = await pool.query(
      `SELECT
         pc.product_id,
         pc.consumable_id,
         pc.quantity_per_sale,
         c.name,
         c.unit,
         c.current_stock
       FROM product_consumables pc
       JOIN consumables c ON c.id = pc.consumable_id
       WHERE pc.product_id = $1
       ORDER BY c.name`,
      [productId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener plantilla de insumos:', error.message);
    res.status(500).json({
      error: 'Error al obtener plantilla de insumos'
    });
  }
};

export const saveProductConsumablesTemplate = async (req, res) => {
  const client = await pool.connect();
  let transactionStarted = false;

  try {
    await ensureInventorySchema();

    const productId = Number(req.params.productId);
    const { consumables } = req.body;

    if (!Number.isInteger(productId)) {
      return res.status(400).json({ error: 'ID de producto inválido' });
    }

    if (!Array.isArray(consumables)) {
      return res.status(400).json({ error: 'El campo consumables debe ser una lista' });
    }

    const normalizedConsumables = consumables.reduce((acc, item) => {
      const consumableId = Number(item?.consumable_id);
      const quantityPerSale = parsePositiveNumber(item?.quantity_per_sale);
      if (!Number.isInteger(consumableId) || !quantityPerSale) {
        return acc;
      }

      acc.set(consumableId, (acc.get(consumableId) || 0) + quantityPerSale);
      return acc;
    }, new Map());

    await client.query('BEGIN');
    transactionStarted = true;

    const productCheck = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [productId]
    );

    if (productCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await client.query(
      'DELETE FROM product_consumables WHERE product_id = $1',
      [productId]
    );

    for (const [consumableId, quantityPerSale] of normalizedConsumables.entries()) {
      const consumableCheck = await client.query(
        'SELECT id FROM consumables WHERE id = $1',
        [consumableId]
      );

      if (consumableCheck.rows.length === 0) {
        throw {
          status: 404,
          message: `Insumo no encontrado: ${consumableId}`,
        };
      }

      await client.query(
        `INSERT INTO product_consumables (product_id, consumable_id, quantity_per_sale)
         VALUES ($1, $2, $3)`,
        [productId, consumableId, quantityPerSale]
      );
    }

    await client.query('COMMIT');
    transactionStarted = false;
    res.json({ message: 'Plantilla de insumos actualizada' });
  } catch (error) {
    if (transactionStarted) {
      await client.query('ROLLBACK');
    }
    console.error('Error al guardar plantilla de insumos:', error.message);
    res.status(error.status || 500).json({
      error: error.message || 'Error al guardar plantilla de insumos'
    });
  } finally {
    client.release();
  }
};

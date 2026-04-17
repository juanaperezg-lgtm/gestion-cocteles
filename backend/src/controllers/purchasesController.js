import pool from '../config/database.js';

export const createPurchase = async (req, res) => {
  try {
    const { product_id, quantity, unit_cost, supplier, notes } = req.body;
    const userId = req.user?.id;
    const quantityNumber = Number(quantity);
    const unitCostNumber = Number(unit_cost);

    if (!product_id || !quantity || !unit_cost) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    if (Number.isNaN(quantityNumber) || Number.isNaN(unitCostNumber) || quantityNumber <= 0 || unitCostNumber < 0) {
      return res.status(400).json({ error: 'Cantidad y costo deben ser valores válidos' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const total_cost = quantityNumber * unitCostNumber;

    // Insertar compra
    const result = await pool.query(
      `INSERT INTO purchases (product_id, quantity, unit_cost, total_cost, supplier, purchase_date, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7)
       RETURNING *`,
      [product_id, quantityNumber, unitCostNumber, total_cost, supplier, userId, notes]
    );

    // Actualizar stock del producto
    await pool.query(
      `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2`,
      [quantityNumber, product_id]
    );

    // Actualizar inventario
    await pool.query(
      `UPDATE inventory SET total_stock = total_stock + $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2`,
      [quantityNumber, product_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear compra:', error);
    res.status(500).json({ error: 'Error al registrar compra' });
  }
};

export const getAllPurchases = async (req, res) => {
  try {
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
         pr.name as product_name
       FROM purchases p
       JOIN products pr ON p.product_id = pr.id
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
         pr.name as product_name
       FROM purchases p
       JOIN products pr ON p.product_id = pr.id
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

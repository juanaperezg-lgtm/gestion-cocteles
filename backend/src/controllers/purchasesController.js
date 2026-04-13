import pool from '../config/database.js';

export const createPurchase = async (req, res) => {
  try {
    const { product_id, quantity, unit_cost, supplier, notes, user_id } = req.body;

    if (!product_id || !quantity || !unit_cost) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const total_cost = quantity * unit_cost;
    const purchase_date = new Date().toISOString().split('T')[0];

    // Insertar compra
    const result = await pool.query(
      `INSERT INTO purchases (product_id, quantity, unit_cost, total_cost, supplier, purchase_date, user_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [product_id, quantity, unit_cost, total_cost, supplier, purchase_date, user_id, notes]
    );

    // Actualizar stock del producto
    await pool.query(
      `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2`,
      [quantity, product_id]
    );

    // Actualizar inventario
    await pool.query(
      `UPDATE inventory SET total_stock = total_stock + $1, last_updated = CURRENT_TIMESTAMP WHERE product_id = $2`,
      [quantity, product_id]
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
      `SELECT p.*, pr.name as product_name FROM purchases p
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
      `SELECT p.*, pr.name as product_name FROM purchases p
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

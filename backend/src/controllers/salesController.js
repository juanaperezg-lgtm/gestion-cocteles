import pool from '../config/database.js';

export const createSale = async (req, res) => {
  try {
    const { product_id, quantity, unit_price, user_id, notes } = req.body;

    if (!product_id || !quantity || !unit_price || !user_id) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const total_amount = quantity * unit_price;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const result = await pool.query(
      'INSERT INTO sales (product_id, quantity, unit_price, total_amount, user_id, sale_date, sale_time, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [product_id, quantity, unit_price, total_amount, user_id, today, now, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error al crear venta' });
  }
};

export const getSalesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ error: 'Parámetro date requerido' });
    }

    const result = await pool.query(
      `SELECT s.*, p.name as product_name FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date = $1
       ORDER BY s.sale_time DESC`,
      [date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

export const getAllSales = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.name as product_name FROM sales s
       JOIN products p ON s.product_id = p.id
       ORDER BY s.sale_date DESC, s.sale_time DESC`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    res.status(500).json({ error: 'Error al obtener ventas' });
  }
};

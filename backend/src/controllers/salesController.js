import pool from '../config/database.js';

export const createSale = async (req, res) => {
  try {
    const { product_id, quantity, unit_price, user_id, notes } = req.body;

    // Validaciones
    if (!product_id || !quantity || !unit_price || !user_id) {
      return res.status(400).json({
        error: 'Producto, cantidad, precio y usuario son requeridos'
      });
    }

    // Validar que sean números válidos
    if (isNaN(quantity) || isNaN(unit_price) || quantity <= 0 || unit_price < 0) {
      return res.status(400).json({
        error: 'Cantidad debe ser mayor a 0 y precio debe ser válido'
      });
    }

    // Verificar que el producto existe
    const productCheck = await pool.query(
      'SELECT id, stock_quantity FROM products WHERE id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    const total_amount = quantity * unit_price;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toTimeString().split(' ')[0];

    const result = await pool.query(
      'INSERT INTO sales (product_id, quantity, unit_price, total_amount, user_id, sale_date, sale_time, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [product_id, quantity, unit_price, total_amount, user_id, today, now, notes || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear venta:', error.message);
    res.status(500).json({
      error: 'Error al registrar la venta. Intenta de nuevo.'
    });
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
      `SELECT s.*, p.name as product_name FROM sales s
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
      `SELECT s.*, p.name as product_name FROM sales s
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

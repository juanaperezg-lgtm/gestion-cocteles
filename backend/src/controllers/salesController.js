import pool from '../config/database.js';

export const createSale = async (req, res) => {
  const client = await pool.connect();

  try {
    const { product_id, quantity, unit_price, notes } = req.body;
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

    await client.query('BEGIN');

    // Verificar que el producto existe y bloquear fila para evitar condiciones de carrera
    const productCheck = await client.query(
      'SELECT id, stock_quantity FROM products WHERE id = $1 FOR UPDATE',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    const currentStock = Number(productCheck.rows[0].stock_quantity);
    if (quantityNumber > currentStock) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Stock insuficiente. Disponible: ${currentStock}`
      });
    }

    const total_amount = quantityNumber * unitPriceNumber;

    const result = await client.query(
      `INSERT INTO sales (product_id, quantity, unit_price, total_amount, user_id, sale_date, sale_time, notes)
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME, $6)
       RETURNING *`,
      [product_id, quantityNumber, unitPriceNumber, total_amount, userId, notes || null]
    );

    await client.query(
      'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantityNumber, product_id]
    );

    await client.query('COMMIT');

    res.status(201).json(result.rows[0]);
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error en rollback de venta:', rollbackError.message);
    }

    console.error('Error al crear venta:', error.message);
    res.status(500).json({
      error: 'Error al registrar la venta. Intenta de nuevo.'
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

import pool from '../config/database.js';

export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, description, purchase_price, sale_price, stock_quantity, category, unit } = req.body;
    const purchasePriceNumber = Number(purchase_price);
    const salePriceNumber = Number(sale_price);
    const stockQuantityNumber = stock_quantity === '' || stock_quantity == null ? 0 : Number(stock_quantity);

    if (!name || !purchase_price || !sale_price) {
      return res.status(400).json({ error: 'Campos requeridos: name, purchase_price, sale_price' });
    }

    if (
      Number.isNaN(purchasePriceNumber) ||
      Number.isNaN(salePriceNumber) ||
      Number.isNaN(stockQuantityNumber) ||
      purchasePriceNumber < 0 ||
      salePriceNumber < 0 ||
      stockQuantityNumber < 0
    ) {
      return res.status(400).json({ error: 'Precios y stock deben ser números válidos mayores o iguales a 0' });
    }

    const result = await pool.query(
      `INSERT INTO products (name, description, purchase_price, sale_price, stock_quantity, category, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, description, purchasePriceNumber, salePriceNumber, stockQuantityNumber, category, unit]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    const result = await pool.query(
      'UPDATE products SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [stock_quantity, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ error: 'Error al actualizar stock' });
  }
};

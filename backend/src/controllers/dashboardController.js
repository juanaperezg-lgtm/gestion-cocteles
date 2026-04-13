import pool from '../config/database.js';

export const getDashboardToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Total ventas hoy
    const totalSales = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date = $1`,
      [today]
    );

    // Cantidad de ventas hoy
    const salesCount = await pool.query(
      `SELECT COUNT(*) as count FROM sales WHERE sale_date = $1`,
      [today]
    );

    // Productos más vendidos hoy
    const topProducts = await pool.query(
      `SELECT p.name, SUM(s.quantity) as quantity_sold, SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date = $1
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`,
      [today]
    );

    res.json({
      date: today,
      total_sales: parseFloat(totalSales.rows[0].total),
      sales_count: parseInt(salesCount.rows[0].count),
      top_products: topProducts.rows,
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};

export const getDashboardMonth = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const monthStr = `${year}-${month}`;

    // Total ventas mes
    const totalSales = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales
       WHERE TO_CHAR(sale_date, 'YYYY-MM') = $1`,
      [monthStr]
    );

    // Ganancias (ventas - costo)
    const profitData = await pool.query(
      `SELECT
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.quantity * (p.sale_price - p.purchase_price)), 0) as total_profit
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE TO_CHAR(s.sale_date, 'YYYY-MM') = $1`,
      [monthStr]
    );

    // Productos más vendidos mes
    const topProducts = await pool.query(
      `SELECT p.name, SUM(s.quantity) as quantity_sold, SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE TO_CHAR(s.sale_date, 'YYYY-MM') = $1
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 10`,
      [monthStr]
    );

    const profit = profitData.rows[0];

    res.json({
      month: monthStr,
      total_revenue: parseFloat(profit.total_revenue),
      total_profit: parseFloat(profit.total_profit),
      margin: profit.total_revenue > 0 ? ((profit.total_profit / profit.total_revenue) * 100).toFixed(2) : 0,
      top_products: topProducts.rows,
    });
  } catch (error) {
    console.error('Error en dashboard mes:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};

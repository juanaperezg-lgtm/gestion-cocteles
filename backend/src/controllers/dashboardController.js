import pool from '../config/database.js';

export const getDashboardToday = async (req, res) => {
  try {
    const todayResult = await pool.query(`SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') as today`);
    const today = todayResult.rows[0].today;

    // Total ventas hoy
    const totalSales = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE sale_date = CURRENT_DATE`
    );

    // Cantidad de ventas hoy
    const salesCount = await pool.query(
      `SELECT COUNT(*) as count FROM sales WHERE sale_date = CURRENT_DATE`
    );

    // Productos más vendidos hoy
    const topProducts = await pool.query(
      `SELECT p.name, SUM(s.quantity) as quantity_sold, SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date = CURRENT_DATE
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    res.json({
      date: today,
      total_sales: parseFloat(totalSales.rows[0].total),
      sales_count: parseInt(salesCount.rows[0].count, 10),
      top_products: topProducts.rows,
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};

export const getDashboardMonth = async (req, res) => {
  try {
    const monthResult = await pool.query(`SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM') as month_str`);
    const monthStr = monthResult.rows[0].month_str;

    // Total vendido del mes (ganancia bruta)
    const revenueData = await pool.query(
      `SELECT
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COUNT(*) as sales_count
       FROM sales
       WHERE sale_date >= DATE_TRUNC('month', CURRENT_DATE)::date
         AND sale_date < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date`
    );

    // Productos más vendidos mes
    const topProducts = await pool.query(
      `SELECT p.name, SUM(s.quantity) as quantity_sold, SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date >= DATE_TRUNC('month', CURRENT_DATE)::date
         AND s.sale_date < (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')::date
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 10`
    );

    const revenue = revenueData.rows[0];
    const totalRevenue = parseFloat(revenue.total_revenue);

    res.json({
      month: monthStr,
      total_revenue: totalRevenue,
      gross_earnings: totalRevenue,
      total_profit: totalRevenue, // Compatibilidad temporal con frontend existente
      sales_count: parseInt(revenue.sales_count, 10),
      top_products: topProducts.rows,
    });
  } catch (error) {
    console.error('Error en dashboard mes:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};

export const getInventoryStatus = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.id, p.name, p.stock_quantity, p.purchase_price, p.sale_price,
              (p.stock_quantity * p.purchase_price) as inventory_cost,
              (p.stock_quantity * p.sale_price) as inventory_value
       FROM products p
       ORDER BY p.stock_quantity DESC`
    );

    const totalInventoryCost = result.rows.reduce((sum, p) => sum + (parseFloat(p.inventory_cost) || 0), 0);
    const totalInventoryValue = result.rows.reduce((sum, p) => sum + (parseFloat(p.inventory_value) || 0), 0);

    res.json({
      products: result.rows,
      total_inventory_cost: totalInventoryCost,
      total_inventory_value: totalInventoryValue,
      potential_profit: totalInventoryValue - totalInventoryCost,
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener estado del inventario' });
  }
};

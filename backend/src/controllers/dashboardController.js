import pool from '../config/database.js';
import PDFDocument from 'pdfkit';
import { ensureInventorySchema } from '../utils/inventorySchema.js';
import { ensureBusinessSchema } from '../utils/businessSchema.js';
import {
  BUSINESS_DATE_SQL,
  BUSINESS_MONTH_START_SQL,
  BUSINESS_NEXT_MONTH_START_SQL,
} from '../utils/businessTime.js';

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);
const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getDashboardToday = async (req, res) => {
  try {
    await ensureBusinessSchema();

    const todayResult = await pool.query(`SELECT TO_CHAR(${BUSINESS_DATE_SQL}, 'YYYY-MM-DD') as today`);
    const today = todayResult.rows[0].today;

    const salesSummary = await pool.query(
      `SELECT
         COALESCE(SUM(total_amount), 0) AS total_revenue,
         COALESCE(SUM(cogs_amount), 0) AS total_cogs,
         COALESCE(SUM(net_profit), 0) AS gross_profit,
         COUNT(*) AS sales_count
       FROM sales
       WHERE sale_date = ${BUSINESS_DATE_SQL}`
    );

    const expensesSummary = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM operating_expenses
       WHERE expense_date = ${BUSINESS_DATE_SQL}`
    );

    const topProducts = await pool.query(
      `SELECT p.name, SUM(s.quantity) as quantity_sold, SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date = ${BUSINESS_DATE_SQL}
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    const revenue = parseFloat(salesSummary.rows[0].total_revenue);
    const cogs = parseFloat(salesSummary.rows[0].total_cogs);
    const grossProfit = parseFloat(salesSummary.rows[0].gross_profit);
    const operatingExpenses = parseFloat(expensesSummary.rows[0].total_expenses);
    const netProfitAfterExpenses = grossProfit - operatingExpenses;

    res.json({
      date: today,
      total_sales: revenue,
      total_cogs: cogs,
      gross_profit: grossProfit,
      operating_expenses: operatingExpenses,
      net_profit_after_expenses: netProfitAfterExpenses,
      sales_count: parseInt(salesSummary.rows[0].sales_count, 10),
      top_products: topProducts.rows,
    });
  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({ error: 'Error al obtener datos del dashboard' });
  }
};

export const getDashboardMonth = async (req, res) => {
  try {
    await ensureBusinessSchema();

    const monthResult = await pool.query(`SELECT TO_CHAR(${BUSINESS_DATE_SQL}, 'YYYY-MM') as month_str`);
    const monthStr = monthResult.rows[0].month_str;

    const revenueData = await pool.query(
      `SELECT
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(SUM(cogs_amount), 0) as total_cogs,
         COALESCE(SUM(net_profit), 0) as gross_profit,
         COUNT(*) as sales_count
       FROM sales
       WHERE sale_date >= ${BUSINESS_MONTH_START_SQL}
         AND sale_date < ${BUSINESS_NEXT_MONTH_START_SQL}`
    );

    const expensesData = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_expenses
       FROM operating_expenses
       WHERE expense_date >= ${BUSINESS_MONTH_START_SQL}
         AND expense_date < ${BUSINESS_NEXT_MONTH_START_SQL}`
    );

    const topProducts = await pool.query(
      `SELECT p.name, SUM(s.quantity) as quantity_sold, SUM(s.total_amount) as revenue
       FROM sales s
       JOIN products p ON s.product_id = p.id
       WHERE s.sale_date >= ${BUSINESS_MONTH_START_SQL}
         AND s.sale_date < ${BUSINESS_NEXT_MONTH_START_SQL}
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 10`
    );

    const revenue = revenueData.rows[0];
    const totalRevenue = parseFloat(revenue.total_revenue);
    const totalCogs = parseFloat(revenue.total_cogs);
    const grossProfit = parseFloat(revenue.gross_profit);
    const operatingExpenses = parseFloat(expensesData.rows[0].total_expenses);
    const netProfitAfterExpenses = grossProfit - operatingExpenses;

    res.json({
      month: monthStr,
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      gross_earnings: grossProfit,
      total_profit: netProfitAfterExpenses,
      operating_expenses: operatingExpenses,
      net_profit_after_expenses: netProfitAfterExpenses,
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
    await ensureInventorySchema();
    await ensureBusinessSchema();

    const productsResult = await pool.query(
      `SELECT p.id, p.name, p.stock_quantity, p.purchase_price, p.sale_price,
              (p.stock_quantity * p.purchase_price) as inventory_cost,
              (p.stock_quantity * p.sale_price) as inventory_value
       FROM products p
       ORDER BY p.stock_quantity DESC`
    );

    const consumablesResult = await pool.query(
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

    const totalInventoryCost = productsResult.rows.reduce((sum, p) => sum + (parseFloat(p.inventory_cost) || 0), 0);
    const totalInventoryValue = productsResult.rows.reduce((sum, p) => sum + (parseFloat(p.inventory_value) || 0), 0);

    res.json({
      products: productsResult.rows,
      consumables: consumablesResult.rows,
      total_inventory_cost: totalInventoryCost,
      total_inventory_value: totalInventoryValue,
      potential_profit: totalInventoryValue - totalInventoryCost,
      total_products: productsResult.rows.length,
      total_consumables: consumablesResult.rows.length,
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    res.status(500).json({ error: 'Error al obtener estado del inventario' });
  }
};

const getBusinessSummaryData = async (startDate, endDate) => {
  const salesSummary = await pool.query(
    `SELECT
       COALESCE(SUM(total_amount), 0) AS total_revenue,
       COALESCE(SUM(cogs_amount), 0) AS total_cogs,
       COALESCE(SUM(net_profit), 0) AS gross_profit,
       COUNT(*) AS sales_count
     FROM sales
     WHERE sale_date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  const expensesSummary = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) AS total_expenses
     FROM operating_expenses
     WHERE expense_date BETWEEN $1 AND $2`,
    [startDate, endDate]
  );

  const salesRows = await pool.query(
    `SELECT
       s.id,
       TO_CHAR(s.sale_date, 'YYYY-MM-DD') AS sale_date,
       TO_CHAR(s.sale_time, 'HH24:MI:SS') AS sale_time,
       p.name AS product_name,
       s.quantity,
       s.unit_price,
       s.total_amount,
       s.cogs_amount,
       s.net_profit
     FROM sales s
     JOIN products p ON p.id = s.product_id
     WHERE s.sale_date BETWEEN $1 AND $2
     ORDER BY s.sale_date DESC, s.sale_time DESC`,
    [startDate, endDate]
  );

  const expensesRows = await pool.query(
    `SELECT
       id,
       TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
       category,
       description,
       amount,
       payment_method
     FROM operating_expenses
     WHERE expense_date BETWEEN $1 AND $2
     ORDER BY expense_date DESC, id DESC`,
    [startDate, endDate]
  );

  const topProducts = await pool.query(
    `SELECT
       p.name,
       SUM(s.quantity) AS quantity_sold,
       SUM(s.total_amount) AS revenue,
       SUM(s.net_profit) AS gross_profit
     FROM sales s
     JOIN products p ON p.id = s.product_id
     WHERE s.sale_date BETWEEN $1 AND $2
     GROUP BY p.id, p.name
     ORDER BY revenue DESC
     LIMIT 10`,
    [startDate, endDate]
  );

  const totalRevenue = toNumber(salesSummary.rows[0].total_revenue);
  const totalCogs = toNumber(salesSummary.rows[0].total_cogs);
  const grossProfit = toNumber(salesSummary.rows[0].gross_profit);
  const totalExpenses = toNumber(expensesSummary.rows[0].total_expenses);
  const netProfit = grossProfit - totalExpenses;
  const salesCount = parseInt(salesSummary.rows[0].sales_count, 10);

  return {
    period: { startDate, endDate },
    totals: {
      sales_count: salesCount,
      total_revenue: totalRevenue,
      total_cogs: totalCogs,
      gross_profit: grossProfit,
      total_expenses: totalExpenses,
      net_profit: netProfit,
      average_ticket: salesCount > 0 ? totalRevenue / salesCount : 0,
    },
    top_products: topProducts.rows,
    sales: salesRows.rows,
    expenses: expensesRows.rows,
  };
};

const validateSummaryRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 'startDate y endDate son requeridos';
  }

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return 'Formato de fecha inválido. Usa YYYY-MM-DD';
  }

  return null;
};

export const getBusinessSummaryByRange = async (req, res) => {
  try {
    await ensureBusinessSchema();

    const { startDate, endDate } = req.query;
    const validationError = validateSummaryRange(startDate, endDate);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const summary = await getBusinessSummaryData(startDate, endDate);
    res.json(summary);
  } catch (error) {
    console.error('Error al obtener resumen del negocio:', error.message);
    res.status(500).json({ error: 'Error al obtener resumen del negocio' });
  }
};

export const downloadBusinessSummaryPdf = async (req, res) => {
  try {
    await ensureBusinessSchema();

    const { startDate, endDate } = req.query;
    const validationError = validateSummaryRange(startDate, endDate);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const summary = await getBusinessSummaryData(startDate, endDate);
    const formatCurrency = (value) => `$${toNumber(value).toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
    const fileName = `reporte_financiero_${startDate}_${endDate}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=\"${fileName}\"`);

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    doc.fontSize(18).text('Reporte Financiero', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Periodo: ${startDate} a ${endDate}`);
    doc.text(`Generado: ${new Date().toLocaleString('es-AR')}`);

    doc.moveDown();
    doc.fontSize(13).text('Resumen');
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Ingresos Totales: ${formatCurrency(summary.totals.total_revenue)}`);
    doc.text(`Costo de Ventas (COGS): ${formatCurrency(summary.totals.total_cogs)}`);
    doc.text(`Gastos Operativos: ${formatCurrency(summary.totals.total_expenses)}`);
    doc.text(`Neto Libre: ${formatCurrency(summary.totals.net_profit)}`);

    doc.moveDown();
    doc.fontSize(13).text('Top Productos por Ingresos');
    doc.moveDown(0.5);
    if (summary.top_products.length === 0) {
      doc.fontSize(10).text('Sin datos en el período.');
    } else {
      summary.top_products.slice(0, 10).forEach((product, index) => {
        doc.fontSize(10).text(
          `${index + 1}. ${product.name} — ${formatCurrency(product.revenue)}`
        );
      });
    }

    doc.moveDown();
    doc.fontSize(13).text('Detalle de Ventas');
    doc.moveDown(0.5);
    if (summary.sales.length === 0) {
      doc.fontSize(10).text('Sin ventas en el período.');
    } else {
      summary.sales.slice(0, 40).forEach((sale) => {
        doc.fontSize(9).text(
          `${sale.sale_date} ${sale.sale_time} | ${sale.product_name} | Cant: ${toNumber(sale.quantity)} | Ingreso: ${formatCurrency(sale.total_amount)}`
        );
      });
      if (summary.sales.length > 40) {
        doc.moveDown(0.3);
        doc.fontSize(9).text(`... y ${summary.sales.length - 40} ventas más. Descarga CSV para detalle completo.`);
      }
    }

    doc.moveDown();
    doc.fontSize(13).text('Detalle de Gastos Operativos');
    doc.moveDown(0.5);
    if (summary.expenses.length === 0) {
      doc.fontSize(10).text('Sin gastos operativos en el período.');
    } else {
      summary.expenses.slice(0, 40).forEach((expense) => {
        doc.fontSize(9).text(
          `${expense.expense_date} | ${expense.category} | ${expense.description} | ${formatCurrency(expense.amount)}`
        );
      });
      if (summary.expenses.length > 40) {
        doc.moveDown(0.3);
        doc.fontSize(9).text(`... y ${summary.expenses.length - 40} gastos más. Descarga CSV para detalle completo.`);
      }
    }

    doc.end();
  } catch (error) {
    console.error('Error al generar PDF del resumen:', error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error al generar el reporte PDF' });
    }
  }
};

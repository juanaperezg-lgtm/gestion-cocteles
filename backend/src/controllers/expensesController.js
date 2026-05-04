import pool from '../config/database.js';
import { ensureBusinessSchema } from '../utils/businessSchema.js';

const isValidDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

export const createExpense = async (req, res) => {
  try {
    await ensureBusinessSchema();

    const {
      expense_date,
      category,
      description,
      amount,
      payment_method,
      notes,
    } = req.body;

    const userId = req.user?.id;
    const amountNumber = Number(amount);
    const normalizedCategory = typeof category === 'string' ? category.trim() : '';
    const normalizedDescription = typeof description === 'string' ? description.trim() : '';

    if (!expense_date || !normalizedCategory || !normalizedDescription || !amount) {
      return res.status(400).json({ error: 'Fecha, categoría, descripción y monto son requeridos' });
    }

    if (!isValidDate(expense_date)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD' });
    }

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const result = await pool.query(
      `INSERT INTO operating_expenses
       (expense_date, category, description, amount, payment_method, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        expense_date,
        normalizedCategory,
        normalizedDescription,
        amountNumber,
        payment_method || null,
        notes || null,
        userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al registrar gasto:', error.message);
    res.status(500).json({ error: 'Error al registrar gasto operativo' });
  }
};

export const getAllExpenses = async (req, res) => {
  try {
    await ensureBusinessSchema();
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const result = await pool.query(
      `SELECT
         id,
         TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
         category,
         description,
         amount,
         payment_method,
         notes,
         user_id,
         created_at
        FROM operating_expenses
        WHERE user_id = $1
        ORDER BY expense_date DESC, id DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener gastos:', error.message);
    res.status(500).json({ error: 'Error al obtener gastos operativos' });
  }
};

export const getExpensesByDate = async (req, res) => {
  try {
    await ensureBusinessSchema();
    const userId = req.user?.id;

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate y endDate son requeridos' });
    }

    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ error: 'Formato de fecha inválido. Usa YYYY-MM-DD' });
    }

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const result = await pool.query(
      `SELECT
         id,
         TO_CHAR(expense_date, 'YYYY-MM-DD') AS expense_date,
         category,
         description,
         amount,
         payment_method,
         notes,
         user_id,
         created_at
        FROM operating_expenses
        WHERE expense_date BETWEEN $1 AND $2
          AND user_id = $3
        ORDER BY expense_date DESC, id DESC`,
      [startDate, endDate, userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener gastos por fecha:', error.message);
    res.status(500).json({ error: 'Error al obtener gastos por fecha' });
  }
};

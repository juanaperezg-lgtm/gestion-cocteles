import express from 'express';
import { createExpense, getAllExpenses, getExpensesByDate } from '../controllers/expensesController.js';

const router = express.Router();

router.post('/', createExpense);
router.get('/', getAllExpenses);
router.get('/by-date', getExpensesByDate);

export default router;

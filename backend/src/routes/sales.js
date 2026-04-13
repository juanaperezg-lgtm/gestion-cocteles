import express from 'express';
import { createSale, getSalesByDate, getAllSales } from '../controllers/salesController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/', getAllSales);
router.get('/by-date', getSalesByDate);

export default router;

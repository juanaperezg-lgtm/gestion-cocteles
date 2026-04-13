import express from 'express';
import { createPurchase, getAllPurchases, getPurchasesByDate } from '../controllers/purchasesController.js';

const router = express.Router();

router.post('/', createPurchase);
router.get('/', getAllPurchases);
router.get('/by-date', getPurchasesByDate);

export default router;

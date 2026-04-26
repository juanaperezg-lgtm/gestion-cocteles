import express from 'express';
import {
  createPurchase,
  getAllPurchases,
  getConsumablesStock,
  getPurchasesByDate,
} from '../controllers/purchasesController.js';

const router = express.Router();

router.post('/', createPurchase);
router.get('/', getAllPurchases);
router.get('/by-date', getPurchasesByDate);
router.get('/consumables-stock', getConsumablesStock);

export default router;

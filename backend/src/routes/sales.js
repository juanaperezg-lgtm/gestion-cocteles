import express from 'express';
import {
  createSale,
  getAllSales,
  getConsumables,
  getProductConsumablesTemplate,
  getSalesByDate,
  saveProductConsumablesTemplate,
} from '../controllers/salesController.js';

const router = express.Router();

router.post('/', createSale);
router.get('/', getAllSales);
router.get('/by-date', getSalesByDate);
router.get('/consumables', getConsumables);
router.get('/product-consumables/:productId', getProductConsumablesTemplate);
router.put('/product-consumables/:productId', saveProductConsumablesTemplate);

export default router;

import express from 'express';
import { getAllProducts, createProduct, updateProductStock } from '../controllers/productsController.js';

const router = express.Router();

router.get('/', getAllProducts);
router.post('/', createProduct);
router.put('/:id/stock', updateProductStock);

export default router;

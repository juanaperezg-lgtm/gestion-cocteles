import express from 'express';
import { getDashboardToday, getDashboardMonth } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/today', getDashboardToday);
router.get('/month', getDashboardMonth);

export default router;

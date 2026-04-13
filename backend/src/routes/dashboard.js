import express from 'express';
import { getDashboardToday, getDashboardMonth, getInventoryStatus } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/today', getDashboardToday);
router.get('/month', getDashboardMonth);
router.get('/inventory', getInventoryStatus);

export default router;

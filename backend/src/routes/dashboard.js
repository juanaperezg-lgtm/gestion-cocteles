import express from 'express';
import {
  downloadBusinessSummaryPdf,
  getBusinessSummaryByRange,
  getDashboardMonth,
  getDashboardToday,
  getInventoryStatus,
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/today', getDashboardToday);
router.get('/month', getDashboardMonth);
router.get('/inventory', getInventoryStatus);
router.get('/summary/pdf', downloadBusinessSummaryPdf);
router.get('/summary', getBusinessSummaryByRange);

export default router;

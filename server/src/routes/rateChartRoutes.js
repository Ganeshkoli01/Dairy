import express from 'express';
import {
  getRateCharts,
  saveRateChart,
  lookupRate,
  deleteRateChart,
  clearRateChartMatrix,
} from '../controllers/rateChartController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Rate lookup calculation endpoint
router.post('/lookup', lookupRate);

// Matrix bulk clear endpoint (Owner & Admin)
router.delete('/bulk-clear', authorizeRole(['admin', 'owner']), clearRateChartMatrix);

// Base rate chart collection endpoints
router
  .route('/')
  .get(getRateCharts)
  .post(authorizeRole(['admin', 'owner']), saveRateChart);

// Individual entry endpoints (Owner & Admin)
router
  .route('/:id')
  .delete(authorizeRole(['admin', 'owner']), deleteRateChart);

export default router;

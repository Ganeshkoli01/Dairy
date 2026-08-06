import express from 'express';
import {
  getFarmerLedgerReport,
  getBranchSummaryReport,
  getPaymentDueReport,
  getAdminDashboardStats,
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Owner / Admin dashboard overview statistics
router.get('/admin-dashboard', authorizeRole(['admin', 'dairyOwner']), getAdminDashboardStats);

// Report endpoints
router.get('/farmer-ledger', getFarmerLedgerReport);
router.get('/branch-summary', getBranchSummaryReport);
router.get('/payment-due', getPaymentDueReport);

export default router;

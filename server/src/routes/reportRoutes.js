import express from 'express';
import {
  getFarmerLedgerReport,
  getBranchSummaryReport,
  getPaymentDueReport,
  getAdminDashboardStats,
  getAnalyticsSummary,
  getOrdersReport,
  getPaymentsReport,
  getInventoryReport,
  getStockMovementsReport,
  getStockTransfersReport,
  getProductsReport,
} from '../controllers/reportController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Owner / Admin dashboard overview statistics
router.get('/admin-dashboard', authorizeRole(['admin', 'dairyOwner']), getAdminDashboardStats);

// Existing Report endpoints
router.get('/farmer-ledger', getFarmerLedgerReport);
router.get('/branch-summary', getBranchSummaryReport);
router.get('/payment-due', getPaymentDueReport);

// Comprehensive Analytics endpoints
const adminOrOwner = authorizeRole(['admin', 'dairyOwner']);
router.get('/summary', adminOrOwner, getAnalyticsSummary);
router.get('/orders', adminOrOwner, getOrdersReport);
router.get('/payments', adminOrOwner, getPaymentsReport);
router.get('/inventory', adminOrOwner, getInventoryReport);
router.get('/stock-movements', adminOrOwner, getStockMovementsReport);
router.get('/stock-transfers', adminOrOwner, getStockTransfersReport);
router.get('/products', adminOrOwner, getProductsReport);

export default router;

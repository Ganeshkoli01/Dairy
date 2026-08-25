import express from 'express';
import { getAdminPayments, deleteAdminPayment } from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/admin/payments', protect, authorize('admin'), getAdminPayments);
router.delete('/admin/payments/:id', protect, authorize('admin'), deleteAdminPayment);

export default router;

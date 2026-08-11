import express from 'express';
import { sendStatements } from '../controllers/billingController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to trigger sending of statements
// Protected and restricted to dairyOwner or admin
router.post('/send-statements', protect, authorize('dairyOwner', 'admin'), sendStatements);

export default router;

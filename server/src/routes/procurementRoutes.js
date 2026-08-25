import express from 'express';
import { getProcurements, createProcurement } from '../controllers/procurementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'dairyOwner'), getProcurements)
  .post(protect, authorize('admin', 'dairyOwner'), createProcurement);

export default router;

import express from 'express';
import { getProcurements, createProcurement, dispatchProcurement, receiveProcurement, reportProcurementIssue, deleteProcurement } from '../controllers/procurementController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'dairyOwner'), getProcurements)
  .post(protect, authorize('admin'), createProcurement);

router.route('/:id/dispatch').put(protect, authorize('admin'), dispatchProcurement);
router.route('/:id').delete(protect, authorize('admin'), deleteProcurement);
router.route('/:id/receive').put(protect, authorize('dairyOwner'), receiveProcurement);
router.route('/:id/issue').put(protect, authorize('dairyOwner'), reportProcurementIssue);

export default router;

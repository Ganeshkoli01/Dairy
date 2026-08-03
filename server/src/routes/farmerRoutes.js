import express from 'express';
import {
  getFarmers,
  getFarmerByBranchAndCode,
  createFarmer,
  updateFarmer,
  deleteFarmer,
} from '../controllers/farmerController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth to all farmer routes
router.use(authenticateToken);

// Farmer listing & creation (Admin + Operator can read & create)
router
  .route('/')
  .get(getFarmers)
  .post(createFarmer);

// Lookup single farmer by branch ID and code for operator collection form auto-fill
router.get('/:branchId/:code', getFarmerByBranchAndCode);

// Farmer updates (Admin + Operator) and deletion (Admin only)
router
  .route('/:id')
  .put(updateFarmer)
  .delete(authorizeRole(['admin']), deleteFarmer);

export default router;

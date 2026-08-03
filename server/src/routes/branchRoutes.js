import express from 'express';
import {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
} from '../controllers/branchController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth to all branch routes
router.use(authenticateToken);

// Branch CRUD routes (Admin only)
router
  .route('/')
  .get(getBranches) // Read access for logged in users
  .post(authorizeRole(['admin']), createBranch);

router
  .route('/:id')
  .get(getBranchById)
  .put(authorizeRole(['admin']), updateBranch)
  .delete(authorizeRole(['admin']), deleteBranch);

export default router;

import express from 'express';
import {
  createMilkCollection,
  getMilkCollections,
  updateMilkCollection,
  deleteMilkCollection,
  getMilkCollectionSummary,
} from '../controllers/milkCollectionController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateToken);

// Live aggregation summary endpoint
router.get('/summary', getMilkCollectionSummary);

// Base milk collection routes
router
  .route('/')
  .get(getMilkCollections)
  .post(createMilkCollection);

// Single collection record endpoints
router
  .route('/:id')
  .put(updateMilkCollection)
  .delete(deleteMilkCollection);

export default router;

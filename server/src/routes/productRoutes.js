import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'dairyOwner'), getProducts)
  // Allow both admin and dairyOwner to manage products
  .post(protect, authorize('admin', 'dairyOwner'), createProduct);

router.route('/:id')
  .get(getProductById)
  .put(protect, authorize('admin', 'dairyOwner'), updateProduct)
  .delete(protect, authorize('admin', 'dairyOwner'), deleteProduct);

export default router;

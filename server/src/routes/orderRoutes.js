import express from 'express';
import { createOrder, getOrders, updateOrderStatus, verifyPayment, sendOrderOtp, downloadInvoice, getRazorpayKey, deleteOrder, receiveOrder } from '../controllers/orderController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per window
  message: { success: false, message: 'Too many OTP requests, please try again after 15 minutes' }
});

router.route('/razorpay-key').get(getRazorpayKey);

// Protected route to create order
router.route('/').post(protect, authorize('admin', 'dairyOwner'), createOrder);
router.route('/send-otp').post(protect, authorize('dairyOwner'), otpLimiter, sendOrderOtp);
router.route('/verify-payment').post(verifyPayment);

// Protected routes for admin/owner to manage orders
router.route('/').get(protect, authorize('admin', 'dairyOwner'), getOrders);
router.route('/:id/status').put(protect, authorize('admin', 'dairyOwner'), updateOrderStatus);
router.route('/:id/receive').put(protect, authorize('dairyOwner'), receiveOrder);
router.route('/:id/invoice').get(protect, authorize('admin', 'dairyOwner'), downloadInvoice);
router.route('/:id').delete(protect, authorize('admin', 'dairyOwner'), deleteOrder);

export default router;

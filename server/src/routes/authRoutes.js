import express from 'express';
import { loginUser, registerUser, getMe, sendOtp, forgotPassword, resetPassword, adminCreateOwner, getAdminBranchOwners, adminUpdateOwner, adminDeleteOwner } from '../controllers/authController.js';
import { authenticateToken, authorizeRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/send-otp', sendOtp);
router.post('/register', registerUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', authenticateToken, getMe);
router.post('/admin/create-owner', authenticateToken, authorizeRole('admin'), adminCreateOwner);
router.get('/admin/owners/:branchId', authenticateToken, authorizeRole('admin'), getAdminBranchOwners);
router.put('/admin/owner/:id', authenticateToken, authorizeRole('admin'), adminUpdateOwner);
router.delete('/admin/owner/:id', authenticateToken, authorizeRole('admin'), adminDeleteOwner);

export default router;

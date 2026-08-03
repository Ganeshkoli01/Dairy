import express from 'express';
import { loginUser, registerUser, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', loginUser);
router.post('/register', registerUser);
router.get('/me', authenticateToken, getMe);

export default router;

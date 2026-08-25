import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;

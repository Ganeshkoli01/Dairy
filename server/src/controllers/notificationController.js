import { Notification } from '../models/Notification.js';
import mongoose from 'mongoose';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const { role, _id } = req.user;
    
    let query = {};

    if (role === 'admin') {
      // Admin sees global notifications for admin, plus any 'all'
      query = { recipientRole: { $in: ['admin', 'all'] } };
    } else if (role === 'dairyOwner') {
      // Owner sees branch-specific notifications, user-specific notifications, and 'all'
      const branchId = req.user.dairyOwnerProfile?.branchId;
      query = {
        $or: [
          { recipientRole: 'dairyOwner', branch: new mongoose.Types.ObjectId(branchId) },
          { recipientUser: new mongoose.Types.ObjectId(_id) },
          { recipientRole: 'all' }
        ]
      };
    } else if (role === 'farmer') {
      // Farmer sees only their specific notifications and 'all'
      query = {
        $or: [
          { recipientUser: new mongoose.Types.ObjectId(_id) },
          { recipientRole: 'all' }
        ]
      };
    } else {
      // Fallback for regular users (if any)
      query = { recipientUser: new mongoose.Types.ObjectId(_id) };
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50); // Get latest 50

    res.json({ success: true, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    notification.isRead = !notification.isRead;
    await notification.save();

    res.json({ success: true, message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Mark all unread notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    const { role, _id } = req.user;
    let query = { isRead: false };

    if (role === 'admin') {
      query.recipientRole = { $in: ['admin', 'all'] };
    } else if (role === 'dairyOwner') {
      const branchId = req.user.dairyOwnerProfile?.branchId;
      query.$or = [
        { recipientRole: 'dairyOwner', branch: new mongoose.Types.ObjectId(branchId) },
        { recipientUser: new mongoose.Types.ObjectId(_id) }
      ];
    } else {
      query.recipientUser = new mongoose.Types.ObjectId(_id);
    }

    await Notification.updateMany(query, { $set: { isRead: true } });

    res.json({ success: true, message: 'All marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    await Notification.deleteOne({ _id: notification._id });
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

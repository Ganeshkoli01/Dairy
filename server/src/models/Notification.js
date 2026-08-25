import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipientRole: {
    type: String,
    enum: ['admin', 'dairyOwner', 'farmer', 'all'],
    required: true,
  },
  recipientUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Target a specific user (e.g. specific farmer)
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false, // Used for branch-level isolation (e.g. Owner alerts)
  },
  type: {
    type: String,
    enum: [
      'NEW_ORDER', 
      'PAYMENT_RECEIVED', 
      'PAYMENT_FAILED', 
      'LOW_STOCK', 
      'OUT_OF_STOCK', 
      'STOCK_RECEIVED', 
      'MILK_COLLECTION',
      'FARMER_PAYMENT',
      'SYSTEM_ALERT'
    ],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  referenceType: {
    type: String, // e.g. 'Order', 'Product', 'MilkCollection'
    required: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);

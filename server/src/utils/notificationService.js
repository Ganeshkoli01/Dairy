import { Notification } from '../models/Notification.js';

/**
 * Helper to dispatch a notification safely without blocking the main request thread.
 * 
 * @param {Object} options
 * @param {string} options.recipientRole - 'admin', 'dairyOwner', 'farmer', 'all'
 * @param {string} [options.recipientUser] - Optional specific user ID
 * @param {string} [options.branch] - Optional branch ID to isolate to a specific owner
 * @param {string} options.type - Notification type enum
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} [options.referenceId] - Optional related document ID
 * @param {string} [options.referenceType] - Optional related document type (e.g. 'Order')
 */
export const dispatchNotification = (options) => {
  // Use Promise.resolve().then() to ensure this runs asynchronously and doesn't block the caller
  Promise.resolve().then(async () => {
    try {
      const notification = new Notification(options);
      await notification.save();
    } catch (err) {
      console.error('Failed to dispatch notification:', err);
    }
  });
};

/**
 * Dispatch notification to Admin AND the specific Branch Owner
 */
export const dispatchToAdminAndOwner = (branchId, type, title, message, referenceId = null, referenceType = null) => {
  // Notify Admin
  dispatchNotification({
    recipientRole: 'admin',
    type,
    title,
    message,
    referenceId,
    referenceType
  });

  // Notify specific Branch Owner
  if (branchId) {
    dispatchNotification({
      recipientRole: 'dairyOwner',
      branch: branchId,
      type,
      title,
      message,
      referenceId,
      referenceType
    });
  }
};

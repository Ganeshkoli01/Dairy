import api from './axios';

export interface NotificationData {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceId?: string;
  referenceType?: string;
}

export const notificationApi = {
  getNotifications: async (): Promise<NotificationData[]> => {
    const response = await api.get('/notifications');
    return response.data.data;
  },
  markAsRead: async (id: string): Promise<void> => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  }
};

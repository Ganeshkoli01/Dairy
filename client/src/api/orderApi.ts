import api from './axios';
import { Order } from '../types/product';

export const orderApi = {
  createOrder: async (orderData: Partial<Order>) => {
    const response = await api.post<{ success: boolean; data: Order; razorpayOrderId?: string }>('/orders', orderData);
    return response.data;
  },

  sendOrderOtp: async () => {
    const response = await api.post<{ success: boolean }>('/orders/send-otp');
    return response.data;
  },

  getRazorpayKey: async () => {
    const response = await api.get<{ key: string }>('/orders/razorpay-key');
    return response.data;
  },

  getOrders: async () => {
    const response = await api.get<{ success: boolean; data: Order[] }>('/orders');
    return response.data;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}/status`, { status });
    return response.data;
  },

  receiveOrder: async (id: string) => {
    const response = await api.put<{ success: boolean; data: Order }>(`/orders/${id}/receive`);
    return response.data;
  },

  deleteOrder: async (id: string) => {
    const response = await api.delete<{ success: boolean }>(`/orders/${id}`);
    return response.data;
  },

  verifyPayment: async (data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
    const response = await api.post<{ success: boolean; message: string }>('/orders/verify-payment', data);
    return response.data;
  },

  downloadInvoice: async (id: string, invoiceNumber?: string) => {
    const response = await api.get(`/orders/${id}/invoice`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GK-Dairy-Invoice-${invoiceNumber || id.slice(-6).toUpperCase()}.pdf`);
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    window.URL.revokeObjectURL(url);
    link.parentNode?.removeChild(link);
  },
};

import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments`;

// Set token for authenticated requests
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const paymentApi = {
  getAdminPayments: async (params: any) => {
    try {
      const response = await axios.get(`${API_URL}/admin/payments`, {
        ...getAuthHeaders(),
        params,
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: 'API Error' };
    }
  },
  
  exportPaymentsToCsv: async (params: any) => {
    try {
      const response = await axios.get(`${API_URL}/admin/payments`, {
        ...getAuthHeaders(),
        params: { ...params, export: 'csv' },
        responseType: 'blob', // Important for file download
      });
      return response;
    } catch (error: any) {
      throw error;
    }
  },

  deletePayment: async (id: string, recordType: string) => {
    try {
      const response = await axios.delete(`${API_URL}/admin/payments/${id}?recordType=${recordType}`, getAuthHeaders());
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, message: error.message };
    }
  }
};

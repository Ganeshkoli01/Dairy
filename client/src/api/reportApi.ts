import api from './axios';
import { FarmerLedgerResponse, BranchSummaryResponse, PaymentDueResponse } from '../types/reports';
import { AdminDashboardData } from '../types/adminDashboard';

export const reportApi = {
  getAdminDashboardStats: async (): Promise<AdminDashboardData> => {
    const response = await api.get<AdminDashboardData>('/reports/admin-dashboard');
    return response.data;
  },

  getFarmerLedger: async (
    branch: string | undefined,
    farmerCode: string,
    from?: string,
    to?: string,
    milkType?: string
  ): Promise<FarmerLedgerResponse> => {
    const response = await api.get<FarmerLedgerResponse>('/reports/farmer-ledger', {
      params: { branch, farmerCode, from, to, milkType },
    });
    return response.data;
  },

  getBranchSummary: async (
    branch?: string,
    from?: string,
    to?: string
  ): Promise<BranchSummaryResponse> => {
    const response = await api.get<BranchSummaryResponse>('/reports/branch-summary', {
      params: { branch, from, to },
    });
    return response.data;
  },

  getPaymentDue: async (
    branch?: string,
    from?: string,
    to?: string
  ): Promise<PaymentDueResponse> => {
    const response = await api.get<PaymentDueResponse>('/reports/payment-due', {
      params: { branch, from, to },
    });
    return response.data;
  },

  exportCSV: async (reportType: string, params: any) => {
    const response = await api.get(`/reports/${reportType}`, {
      params: { ...params, export: 'csv' },
      responseType: 'text',
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent(response.data);
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', `${reportType}_report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  getAnalyticsSummary: async (branch?: string, from?: string, to?: string) => {
    const response = await api.get('/reports/summary', { params: { branch, from, to } });
    return response.data;
  },
  getOrdersReport: async (branch?: string, from?: string, to?: string) => {
    const response = await api.get('/reports/orders', { params: { branch, from, to } });
    return response.data;
  },
  getPaymentsReport: async (branch?: string, from?: string, to?: string) => {
    const response = await api.get('/reports/payments', { params: { branch, from, to } });
    return response.data;
  },
  getInventoryReport: async (branch?: string) => {
    const response = await api.get('/reports/inventory', { params: { branch } });
    return response.data;
  },
  getStockMovementsReport: async (branch?: string, from?: string, to?: string) => {
    const response = await api.get('/reports/stock-movements', { params: { branch, from, to } });
    return response.data;
  },
  getStockTransfersReport: async (branch?: string, from?: string, to?: string) => {
    const response = await api.get('/reports/stock-transfers', { params: { branch, from, to } });
    return response.data;
  },
  getProductsReport: async (branch?: string, from?: string, to?: string) => {
    const response = await api.get('/reports/products', { params: { branch, from, to } });
    return response.data;
  },
};

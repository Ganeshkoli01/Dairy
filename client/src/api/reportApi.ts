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

  exportCSV: async (reportType: 'farmer-ledger' | 'branch-summary' | 'payment-due', params: any) => {
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
};

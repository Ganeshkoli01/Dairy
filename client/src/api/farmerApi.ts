import api from './axios';
import { Farmer, FarmerInput } from '../types/farmer';

export const farmerApi = {
  getFarmers: async (params?: { branch?: string; search?: string; isActive?: boolean }): Promise<Farmer[]> => {
    const response = await api.get<{ success: boolean; data: Farmer[] }>('/farmers', { params });
    return response.data.data;
  },

  getFarmerByBranchAndCode: async (branchId: string, code: string, milkType?: string): Promise<Farmer> => {
    let url = `/farmers/${branchId}/${code}`;
    if (milkType) {
      url += `?milkType=${milkType}`;
    }
    const response = await api.get<{ success: boolean; data: Farmer }>(url);
    return response.data.data;
  },

  createFarmer: async (data: FarmerInput): Promise<Farmer> => {
    const response = await api.post<{ success: boolean; data: Farmer }>('/farmers', data);
    return response.data.data;
  },

  updateFarmer: async (id: string, data: Partial<FarmerInput>): Promise<Farmer> => {
    const response = await api.put<{ success: boolean; data: Farmer }>(`/farmers/${id}`, data);
    return response.data.data;
  },

  deleteFarmer: async (id: string): Promise<void> => {
    await api.delete(`/farmers/${id}`);
  },
};

import api from './axios';
import { Branch, BranchInput } from '../types/branch';

export const branchApi = {
  getBranches: async (isActive?: boolean): Promise<Branch[]> => {
    const params = isActive !== undefined ? { isActive } : {};
    const response = await api.get<{ success: boolean; data: Branch[] }>('/branches', { params });
    let branches = response.data.data;

    // Filter branches so Dairy Owners only see their assigned branch
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.role === 'dairyOwner' && user.dairyOwnerProfile?.branchId) {
          branches = branches.filter(b => b._id === user.dairyOwnerProfile.branchId);
        }
      }
    } catch (e) {
      console.error("Error filtering branches for dairyOwner", e);
    }

    return branches;
  },

  getBranchById: async (id: string): Promise<Branch> => {
    const response = await api.get<{ success: boolean; data: Branch }>(`/branches/${id}`);
    return response.data.data;
  },

  createBranch: async (data: BranchInput): Promise<Branch> => {
    const response = await api.post<{ success: boolean; data: Branch }>('/branches', data);
    return response.data.data;
  },

  updateBranch: async (id: string, data: Partial<BranchInput>): Promise<Branch> => {
    const response = await api.put<{ success: boolean; data: Branch }>(`/branches/${id}`, data);
    return response.data.data;
  },

  deleteBranch: async (id: string): Promise<void> => {
    await api.delete(`/branches/${id}`);
  },
};

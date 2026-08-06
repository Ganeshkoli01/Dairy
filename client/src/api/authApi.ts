import api from './axios';
import { AuthResponse, HealthCheckResponse, LoginCredentials, RegisterCredentials, User } from '../types/auth';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', credentials);
    return response.data;
  },

  adminCreateOwner: async (data: any): Promise<{ success: boolean; message: string; user: User }> => {
    const response = await api.post('/auth/admin/create-owner', data);
    return response.data;
  },

  sendOtp: async (email: string): Promise<{ success: boolean; message: string; previewUrl?: string }> => {
    const response = await api.post('/auth/send-otp', { email });
    return response.data;
  },

  forgotPassword: async (email: string): Promise<{ success: boolean; message: string; previewUrl?: string }> => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: { email: string; otp: string; newPassword: string }): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/auth/reset-password', data);
    return response.data;
  },

  getMe: async (): Promise<{ success: boolean; user: User & { displayName?: string } }> => {
    const response = await api.get<{ success: boolean; user: User & { displayName?: string } }>('/auth/me');
    return response.data;
  },

  checkHealth: async (): Promise<HealthCheckResponse> => {
    const response = await api.get<HealthCheckResponse>('/health');
    return response.data;
  },

  getOwnersByBranch: async (branchId: string): Promise<{ success: boolean; data: User[] }> => {
    const response = await api.get(`/auth/admin/owners/${branchId}`);
    return response.data;
  },

  updateOwner: async (ownerId: string, data: any): Promise<{ success: boolean; message: string; data: User }> => {
    const response = await api.put(`/auth/admin/owner/${ownerId}`, data);
    return response.data;
  },

  deleteOwner: async (ownerId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/auth/admin/owner/${ownerId}`);
    return response.data;
  },
};

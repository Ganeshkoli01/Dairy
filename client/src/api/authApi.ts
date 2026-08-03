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

  getMe: async (): Promise<{ success: boolean; user: User }> => {
    const response = await api.get<{ success: boolean; user: User }>('/auth/me');
    return response.data;
  },

  checkHealth: async (): Promise<HealthCheckResponse> => {
    const response = await api.get<HealthCheckResponse>('/health');
    return response.data;
  },
};

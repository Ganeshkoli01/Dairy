export type Role = 'owner' | 'user' | 'admin' | 'operator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface AuthResponse {
  success: boolean;
  token: string;
  role: Role;
  user: User;
  message?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: Role;
  branch?: string;
}

export interface HealthCheckResponse {
  status: string;
  message: string;
  timestamp: string;
  environment: string;
  database: {
    status: string;
  };
  version: string;
}

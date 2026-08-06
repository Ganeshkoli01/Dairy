export type Role = 'farmer' | 'dairyOwner' | 'admin';

export interface User {
  id: string;
  email: string;
  role: Role;
  name?: string; // legacy support
  displayName?: string;
  farmerProfile?: {
    farmerCode: string;
    farmerName: string;
    branch: string;
  };
  dairyOwnerProfile?: {
    ownerName: string;
    branchName: string;
    branchNumber: string;
  };
  adminProfile?: {
    name: string;
  };
}

export interface AuthResponse {
  success: boolean;
  token: string;
  role: Role;
  displayName: string;
  user: User;
  message?: string;
  field?: string; // used for field-level errors
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  role: Role;
  email: string;
  password: string;
  phone?: string;
  
  // Farmer specific
  farmerCode?: string;
  farmerName?: string;
  milkType?: 'cow' | 'buffalo' | 'both';
  branch?: string;

  // Dairy Owner specific
  ownerName?: string;
  branchName?: string;
  branchNumber?: string;

  // Admin specific
  name?: string;
  adminSignupSecret?: string;
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

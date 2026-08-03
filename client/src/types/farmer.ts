import { Branch } from './branch';

export type MilkType = 'cow' | 'buffalo' | 'both';

export interface Farmer {
  _id: string;
  farmerCode: string;
  name: string;
  branch: Branch | string;
  defaultMilkType: MilkType;
  mobile?: string;
  isActive: boolean;
  joinedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FarmerInput {
  farmerCode: string;
  name: string;
  branch: string;
  defaultMilkType: MilkType;
  mobile?: string;
  isActive?: boolean;
}

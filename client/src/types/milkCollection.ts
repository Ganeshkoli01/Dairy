import { MilkType } from './farmer';
import { Branch } from './branch';

export type SessionType = 'morning' | 'evening';

export interface MilkCollectionEntry {
  _id: string;
  branch: Branch | string;
  date: string;
  session: SessionType;
  farmer?: string;
  farmerCode: string;
  farmerName: string;
  milkType: MilkType;
  weight: number;
  fat: number;
  snf: number;
  degree?: number;
  rate: number;
  amount: number;
  autoFat?: boolean;
  autoWeight?: boolean;
  enteredBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MilkCollectionInput {
  branch: string;
  date: string;
  session: SessionType;
  farmerCode: string;
  farmerName?: string;
  farmerId?: string;
  milkType: MilkType;
  weight: number;
  fat: number;
  snf: number;
  degree?: number;
  useClr?: boolean;
  autoFat?: boolean;
  autoWeight?: boolean;
}

export interface TypeSummary {
  totalLiters: number;
  totalAmount: number;
  weightedAvgFat: number;
  weightedAvgSnf: number;
  weightedAvgRate: number;
  entryCount: number;
}

export interface MilkCollectionSummary {
  cow: TypeSummary;
  buffalo: TypeSummary;
  combined: TypeSummary;
}

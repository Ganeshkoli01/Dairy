import { MilkType } from './farmer';
import { Branch } from './branch';

export interface RateChartEntry {
  _id?: string;
  milkType: MilkType;
  fat: number;
  snf: number;
  rate: number;
  effectiveFrom?: string;
  branch?: Branch | string | null;
}

export interface RateLookupQuery {
  milkType: MilkType;
  fat: number;
  snf?: number;
  clr?: number;
  useClr?: boolean;
  branchId?: string | null;
  date?: string;
}

export interface RateLookupResponse {
  success: boolean;
  milkType: MilkType;
  fat: number;
  snf: number;
  clrUsed?: number | null;
  result: {
    success: boolean;
    rate: number | null;
    matchedFat?: number;
    matchedSnf?: number;
    effectiveFrom?: string;
    isBranchSpecific?: boolean;
    message: string;
  };
}

export interface LedgerRow {
  _id: string;
  date: string;
  session: string;
  farmerCode: string;
  farmerName: string;
  milkType: string;
  weight: number;
  fat: number;
  snf: number;
  rate: number;
  amount: number;
  runningTotalLiters: number;
  runningTotalAmount: number;
}

export interface FarmerLedgerResponse {
  success: boolean;
  farmerCode: string;
  farmerName: string;
  period: { from: string; to: string };
  summary: {
    totalLiters: number;
    totalAmount: number;
    weightedAvgFat: number;
    weightedAvgSnf: number;
    weightedAvgRate: number;
    entryCount: number;
  };
  data: LedgerRow[];
}

export interface BranchSummaryRow {
  date: string;
  totalLiters: number;
  cowLiters: number;
  buffaloLiters: number;
  weightedAvgFat: number;
  weightedAvgSnf: number;
  totalAmount: number;
  entryCount: number;
}

export interface BranchSummaryResponse {
  success: boolean;
  period: { from: string; to: string };
  data: BranchSummaryRow[];
}

export interface PaymentDueRow {
  farmerCode: string;
  farmerName: string;
  totalLiters: number;
  cowLiters: number;
  buffaloLiters: number;
  avgFat: number;
  avgSnf: number;
  avgRate: number;
  totalAmount: number;
  entryCount: number;
}

export interface PaymentDueResponse {
  success: boolean;
  period: { from: string; to: string };
  summary: {
    totalFarmers: number;
    grandTotalLiters: number;
    grandTotalAmount: number;
  };
  data: PaymentDueRow[];
}

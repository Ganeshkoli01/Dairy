export interface TodayStats {
  totalLiters: number;
  totalAmount: number;
  totalEntries: number;
  cowLiters: number;
  cowAmount: number;
  buffaloLiters: number;
  buffaloAmount: number;
}

export interface BranchWiseToday {
  _id: string;
  branchName: string;
  branchCode: string;
  totalLiters: number;
  cowLiters: number;
  buffaloLiters: number;
  totalAmount: number;
  entryCount: number;
}

export interface TrendPoint {
  date: string;
  totalLiters: number;
  cowLiters: number;
  buffaloLiters: number;
  totalAmount: number;
}

export interface AdminDashboardData {
  success: boolean;
  today: TodayStats;
  branchWiseToday: BranchWiseToday[];
  trend14Days: TrendPoint[];
}

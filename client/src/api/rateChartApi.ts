import api from './axios';
import { MilkType } from '../types/farmer';
import { RateChartEntry, RateLookupQuery, RateLookupResponse } from '../types/rateChart';

export const rateChartApi = {
  getRateCharts: async (milkType?: MilkType, branch?: string): Promise<RateChartEntry[]> => {
    const params: any = {};
    if (milkType) params.milkType = milkType;
    if (branch !== undefined) params.branch = branch;

    const response = await api.get<{ success: boolean; data: RateChartEntry[] }>('/rate-chart', { params });
    return response.data.data;
  },

  saveRateCharts: async (entries: RateChartEntry[]): Promise<{ success: boolean; count: number }> => {
    const response = await api.post<{ success: boolean; count: number }>('/rate-chart', entries);
    return response.data;
  },

  lookupRate: async (query: RateLookupQuery): Promise<RateLookupResponse> => {
    const response = await api.post<RateLookupResponse>('/rate-chart/lookup', query);
    return response.data;
  },

  clearMatrix: async (milkType: MilkType, branch?: string): Promise<void> => {
    const params: any = { milkType };
    if (branch !== undefined) params.branch = branch;
    await api.delete('/rate-chart/bulk-clear', { params });
  },
};

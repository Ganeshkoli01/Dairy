import api from './axios';
import { MilkCollectionEntry, MilkCollectionInput, MilkCollectionSummary, SessionType } from '../types/milkCollection';

export const milkCollectionApi = {
  getMilkCollections: async (
    branch: string,
    date: string,
    session: SessionType
  ): Promise<MilkCollectionEntry[]> => {
    const response = await api.get<{ success: boolean; data: MilkCollectionEntry[] }>('/milk-collection', {
      params: { branch, date, session },
    });
    return response.data.data;
  },

  getFarmerPreviousSession: async (farmerCode: string): Promise<MilkCollectionEntry | null> => {
    const response = await api.get<{ success: boolean; data: MilkCollectionEntry | null }>('/milk-collection', {
      params: { farmer: farmerCode, isPreviousSession: 'true' },
    });
    return response.data.data;
  },

  createMilkCollection: async (data: MilkCollectionInput): Promise<MilkCollectionEntry> => {
    const response = await api.post<{ success: boolean; data: MilkCollectionEntry }>('/milk-collection', data);
    return response.data.data;
  },

  updateMilkCollection: async (id: string, data: Partial<MilkCollectionInput>): Promise<MilkCollectionEntry> => {
    const response = await api.put<{ success: boolean; data: MilkCollectionEntry }>(`/milk-collection/${id}`, data);
    return response.data.data;
  },

  deleteMilkCollection: async (id: string): Promise<void> => {
    await api.delete(`/milk-collection/${id}`);
  },

  getSummary: async (
    branch: string,
    date: string,
    session: SessionType
  ): Promise<MilkCollectionSummary> => {
    const response = await api.get<{ success: boolean; data: MilkCollectionSummary }>('/milk-collection/summary', {
      params: { branch, date, session },
    });
    return response.data.data;
  },
};

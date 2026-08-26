import api from './axios';

export const procurementApi = {
  getProcurements: () => api.get('/procurements'),
  createProcurement: (data: any) => api.post('/procurements', data),
  dispatchProcurement: (id: string) => api.put(`/procurements/${id}/dispatch`),
  receiveProcurement: (id: string) => api.put(`/procurements/${id}/receive`),
  reportIssue: (id: string, data: { actualReceivedQuantity: number; issueReason: string }) => 
    api.put(`/procurements/${id}/issue`, data),
  deleteProcurement: (id: string) => api.delete(`/procurements/${id}`),
};

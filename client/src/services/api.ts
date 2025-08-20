import { apiRequest } from "@/lib/queryClient";

// Sample Bidding Services
export const sampleService = {
  getAll: () => fetch('/api/samples', { credentials: 'include' }).then(res => res.json()),
  getById: (id: string) => fetch(`/api/samples/${id}`, { credentials: 'include' }).then(res => res.json()),
  create: (data: any) => apiRequest('POST', '/api/samples', data),
  update: (id: string, data: any) => apiRequest('PUT', `/api/samples/${id}`, data),
  delete: (id: string) => apiRequest('DELETE', `/api/samples/${id}`),
  
  // Sample Items
  getItems: (biddingId: string) => 
    fetch(`/api/samples/${biddingId}/items`, { credentials: 'include' }).then(res => res.json()),
  createItem: (biddingId: string, data: any) => 
    apiRequest('POST', `/api/samples/${biddingId}/items`, data),
  updateItem: (biddingId: string, id: string, data: any) => 
    apiRequest('PUT', `/api/samples/${biddingId}/items/${id}`, data),
  deleteItem: (biddingId: string, id: string) => 
    apiRequest('DELETE', `/api/samples/${biddingId}/items/${id}`),
};

// Process Services
export const processService = {
  getAll: () => fetch('/api/processes', { credentials: 'include' }).then(res => res.json()),
  getById: (id: string) => fetch(`/api/processes/${id}`, { credentials: 'include' }).then(res => res.json()),
  getExpiring: (days: number = 30) => 
    fetch(`/api/processes/expiring?days=${days}`, { credentials: 'include' }).then(res => res.json()),
  create: (data: any) => apiRequest('POST', '/api/processes', data),
  update: (id: string, data: any) => apiRequest('PUT', `/api/processes/${id}`, data),
  delete: (id: string) => apiRequest('DELETE', `/api/processes/${id}`),
  
  // Process Items
  createItem: (processId: string, data: any) => 
    apiRequest('POST', `/api/processes/${processId}/items`, data),
  updateItem: (processId: string, id: string, data: any) => 
    apiRequest('PUT', `/api/processes/${processId}/items/${id}`, data),
  deleteItem: (processId: string, id: string) => 
    apiRequest('DELETE', `/api/processes/${processId}/items/${id}`),
};

// Catalog Services
export const catalogService = {
  getAll: () => fetch('/api/catalog', { credentials: 'include' }).then(res => res.json()),
  search: (query: string) => 
    fetch(`/api/catalog/search?q=${encodeURIComponent(query)}`, { credentials: 'include' }).then(res => res.json()),
  create: (data: any) => apiRequest('POST', '/api/catalog', data),
  update: (id: string, data: any) => apiRequest('PUT', `/api/catalog/${id}`, data),
  delete: (id: string) => apiRequest('DELETE', `/api/catalog/${id}`),
};

// Commitment Services
export const commitmentService = {
  getAll: (processId?: string) => {
    const url = processId ? `/api/commitments?processId=${processId}` : '/api/commitments';
    return fetch(url, { credentials: 'include' }).then(res => res.json());
  },
  create: (data: any) => apiRequest('POST', '/api/commitments', data),
  update: (id: string, data: any) => apiRequest('PUT', `/api/commitments/${id}`, data),
  delete: (id: string) => apiRequest('DELETE', `/api/commitments/${id}`),
  
  // Commitment Items
  createItem: (commitmentId: string, data: any) => 
    apiRequest('POST', `/api/commitments/${commitmentId}/items`, data),
  updateItem: (commitmentId: string, id: string, data: any) => 
    apiRequest('PUT', `/api/commitments/${commitmentId}/items/${id}`, data),
  deleteItem: (commitmentId: string, id: string) => 
    apiRequest('DELETE', `/api/commitments/${commitmentId}/items/${id}`),
};

// History and ML Services
export const historyService = {
  findSimilar: (query: string) => 
    fetch(`/api/history/similar?q=${encodeURIComponent(query)}`, { credentials: 'include' }).then(res => res.json()),
  getMlPrediction: (itemId: string, type: 'sample' | 'process') => 
    fetch(`/api/ml/prediction/${itemId}?type=${type}`, { credentials: 'include' }).then(res => res.json()),
};

// Dashboard Services
export const dashboardService = {
  getStats: () => fetch('/api/dashboard/stats', { credentials: 'include' }).then(res => res.json()),
};

// Import Service
export const importService = {
  uploadFile: async (file: File, type: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await fetch('/api/import', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(await response.text());
    }
    
    return response.json();
  }
};

// Export all services as default
export default {
  sample: sampleService,
  process: processService,
  catalog: catalogService,
  commitment: commitmentService,
  history: historyService,
  dashboard: dashboardService,
  import: importService,
};

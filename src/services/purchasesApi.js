import { createApiMethods } from './api'
import apiService from './api'

// Purchases API using centralized authentication
const purchasesApi = {
  ...createApiMethods('/api/v1/purchases'),
  // Custom endpoints specific to purchases
  create: (purchaseData) => apiService.post('/api/v1/purchases/create', purchaseData),
  updateItem: (purchaseId, itemId, itemData) => apiService.put(`/api/v1/purchases/${purchaseId}/items/${itemId}`, itemData),
  updateStatus: (id, updateData) => apiService.put(`/api/v1/purchases/${id}`, updateData),
  confirm: (id) => apiService.put(`/api/v1/purchases/${id}/confirm`),
  cancel: (id) => apiService.put(`/api/v1/purchases/${id}/cancel`),
}

export default purchasesApi

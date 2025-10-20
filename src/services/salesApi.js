import { createApiMethods } from './api'
import apiService from './api'

// Sales API using centralized authentication
// Backend: @RequestMapping("/api/v1/sales")
const salesApi = {
  ...createApiMethods('/api/v1/sales'),
  // Custom endpoints specific to sales
  create: (payload) => apiService.post('/api/v1/sales/create', payload),
  confirm: (id) => apiService.post(`/api/v1/sales/${id}/confirm`),
  void: (id, reason) => apiService.post(`/api/v1/sales/${id}/void`, { reason }),
  cancel: (id) => apiService.post(`/api/v1/sales/${id}/cancel`),
}

export default salesApi


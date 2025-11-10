import { createApiMethods } from './api'
import apiService from './api'

// Customers API using centralized authentication
// Backend: @RequestMapping("/api/v1/customers")
const customersApi = {
  ...createApiMethods('/api/v1/customers'),
  // Custom endpoints specific to customers
  getWalkIn: () => apiService.get('/api/v1/customers/walkIn'),
  getActive: () => apiService.get('/api/v1/customers/active'),
  create: (payload) => apiService.post('/api/v1/customers/create', payload),
  deactivate: (id) => apiService.put(`/api/v1/customers/deactivate/${id}`),
  activate: (id) => apiService.put(`/api/v1/customers/activate/${id}`),
}

export default customersApi

import { createApiMethods } from './api'
import apiService from './api'

// Suppliers API using centralized authentication
const suppliersApi = {
  ...createApiMethods('/api/v1/suppliers'),
  // Custom endpoints specific to suppliers
  create: (supplierData) => apiService.post('/api/v1/suppliers/create', supplierData),
}

export default suppliersApi


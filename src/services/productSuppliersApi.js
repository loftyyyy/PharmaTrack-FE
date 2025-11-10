import { createApiMethods } from './api'
import apiService from './api'

// Product Suppliers API using centralized authentication
const productSuppliersApi = {
  ...createApiMethods('/api/v1/productSuppliers'),
  // Custom endpoints specific to product suppliers
  create: (productSupplierData) => apiService.post('/api/v1/productSuppliers/create', productSupplierData),
}

export default productSuppliersApi

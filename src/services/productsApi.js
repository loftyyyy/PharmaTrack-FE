import { createApiMethods } from './api'
import apiService from './api'

// Products API using centralized authentication
const productsApi = {
  ...createApiMethods('/api/v1/products'),
  // Custom endpoints specific to products
  create: (productData) => apiService.post('/api/v1/products/create', productData),
}

export default productsApi

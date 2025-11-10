import { createApiMethods } from './api'
import apiService from './api'

// Categories API using centralized authentication
// Backend: @RequestMapping("/api/v1/categories")
const categoriesApi = {
  ...createApiMethods('/api/v1/categories'),
  // Custom endpoints specific to categories
  create: (categoryData) => apiService.post('/api/v1/categories/create', categoryData),
}

export default categoriesApi

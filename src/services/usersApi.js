import { createApiMethods } from './api'
import apiService from './api'

// Users API using centralized authentication
const usersApi = {
  ...createApiMethods('/api/v1/users'),
  // Custom endpoints specific to users
  getProfile: () => apiService.get('/api/v1/users/me'),
  create: (userData) => apiService.post('/api/v1/users/signup', userData),
}

export default usersApi

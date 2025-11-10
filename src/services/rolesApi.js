import { createApiMethods } from './api'
import apiService from './api'

// Roles API using centralized authentication
const rolesApi = {
  ...createApiMethods('/api/v1/roles'),
  // Custom endpoints specific to roles
  getUserCount: (roleId) => apiService.get(`/api/v1/roles/${roleId}/users/count`),
}

export default rolesApi

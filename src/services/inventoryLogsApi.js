import { createApiMethods } from './api'
import apiService from './api'

// Inventory Logs API using centralized authentication
// Backend: @RequestMapping("/api/v1/inventoryLogs")
const inventoryLogsApi = {
  // Override getAll to use the correct endpoint with trailing slash
  getAll: () => apiService.get('/api/v1/inventoryLogs/'),
  getById: (id) => apiService.get(`/api/v1/inventoryLogs/${id}`),
  create: (inventoryLogData) => apiService.post('/api/v1/inventoryLogs/create', inventoryLogData),
}

export default inventoryLogsApi

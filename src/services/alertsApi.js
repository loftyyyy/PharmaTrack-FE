import { createApiMethods } from './api'
import apiService from './api'

// Low Stock Alerts API using centralized authentication
// Backend: @RequestMapping("/api/v1/alerts")
const alertsApi = {
  // Custom endpoints specific to alerts
  getCount: () => apiService.get('/api/v1/alerts/count'),
  getUnresolved: () => apiService.get('/api/v1/alerts/unresolved'),
  getResolved: () => apiService.get('/api/v1/alerts/resolved'),
  resolve: (id) => apiService.put(`/api/v1/alerts/${id}/resolve`),
  createOrUpdate: () => apiService.post('/api/v1/alerts/createOrUpdate'),
}

export default alertsApi

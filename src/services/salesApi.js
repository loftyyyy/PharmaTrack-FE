import { API_BASE_URL } from '../utils/config'

const BASE_URL = API_BASE_URL

function getAuthHeaders() {
  const accessToken = localStorage.getItem('pharma_access_token')
  return {
    'Content-Type': 'application/json',
    ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) }
  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`
    const data = await response.json().catch(() => null)
    if (data) message = data.message || data.error || message
    throw new Error(message)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) return response.json()
  return response.text()
}

const salesApi = {
  // Get all sales transactions
  getAll: () => request('/api/v1/sales', { method: 'GET' }),
  
  // Get sales transaction by ID
  getById: (id) => request(`/api/v1/sales/${id}`, { method: 'GET' }),
  
  // Create new sale
  create: (payload) => request('/api/v1/sales/create', { method: 'POST', body: JSON.stringify(payload) }),
  
  // Update sale
  update: (id, payload) => request(`/api/v1/sales/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  
  // Confirm sale (for CASH payments)
  confirm: (id) => request(`/api/v1/sales/${id}/confirm`, { method: 'POST' }),
  
  // Void/Cancel sale
  void: (id, reason) => request(`/api/v1/sales/${id}/void`, { 
    method: 'PUT', 
    body: JSON.stringify({ reason }) 
  }),
  
  // Get sales by date range
  getByDateRange: (startDate, endDate) => request(
    `/api/v1/sales/date-range?startDate=${startDate}&endDate=${endDate}`, 
    { method: 'GET' }
  ),
  
  // Get sales by status
  getByStatus: (status) => request(`/api/v1/sales/status/${status}`, { method: 'GET' }),
  
  // Get sales by customer
  getByCustomer: (customerId) => request(`/api/v1/sales/customer/${customerId}`, { method: 'GET' }),
}

export default salesApi


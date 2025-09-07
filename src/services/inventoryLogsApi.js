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
  const headers = {
    ...getAuthHeaders(),
    ...(options.headers || {}),
  }
  
  console.log('🌐 Making request to:', url)
  console.log('📋 Request headers:', headers)
  console.log('📦 Request body:', options.body)
  
  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`
    const data = await response.json().catch(() => null)
    if (data) {
      message = data.message || data.error || message
    }
    throw new Error(message)
  }

  if (response.status === 204) return null
  const contentType = response.headers.get('content-type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

const inventoryLogsApi = {
  getAll: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/inventoryLogs/${queryString}`, { method: 'GET' })
  },
  getById: (id) => request(`/api/v1/inventoryLogs/${id}`, { method: 'GET' }),
  getByProduct: (productId, params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/inventoryLogs/product/${productId}${queryString}`, { method: 'GET' })
  },
  getByBatch: (batchId, params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/inventoryLogs/batch/${batchId}${queryString}`, { method: 'GET' })
  },
  getByChangeType: (changeType, params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/inventoryLogs/change-type/${changeType}${queryString}`, { method: 'GET' })
  },
  getByDateRange: (startDate, endDate, params) => {
    const queryParams = { startDate, endDate, ...params }
    const queryString = '?' + new URLSearchParams(queryParams).toString()
    return request(`/api/v1/inventoryLogs/date-range${queryString}`, { method: 'GET' })
  },
  export: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/inventoryLogs/export${queryString}`, { method: 'GET' })
  }
}

export default inventoryLogsApi

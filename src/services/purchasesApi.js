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
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
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

const purchasesApi = {
  getAll: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/purchases${queryString}`, { method: 'GET' })
  },
  getById: (id) => request(`/api/v1/purchases/${id}`, { method: 'GET' }),
  create: (purchaseData) => request('/api/v1/purchases/create', { method: 'POST', body: JSON.stringify(purchaseData) }),
  update: (id, purchaseData) => request(`/api/v1/purchases/${id}`, { method: 'PUT', body: JSON.stringify(purchaseData) }),
  delete: (id) => request(`/api/v1/purchases/${id}`, { method: 'DELETE' }),
  updateStatus: (id, status) => request(`/api/v1/purchases/${id}/status`, { method: 'PATCH', body: JSON.stringify({ purchaseStatus: status }) }),
}

export default purchasesApi

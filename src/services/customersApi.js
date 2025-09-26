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

const customersApi = {
  getAll: () => request('/api/v1/customers', { method: 'GET' }),
  getById: (id) => request(`/api/v1/customers/${id}`, { method: 'GET' }),
  create: (payload) => request('/api/v1/customers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/api/v1/customers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/api/v1/customers/${id}`, { method: 'DELETE' }),
  deactivate: (id) => request(`/api/v1/customers/deactivate/${id}`, { method: 'PUT' }),
}

export default customersApi



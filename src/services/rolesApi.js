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
    
    // Add more specific error information
    if (response.status === 403) {
      message = `Access denied (403): You don't have permission to access this resource. Required role: ADMIN`
    } else if (response.status === 401) {
      message = `Unauthorized (401): Please log in again`
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

const rolesApi = {
  getAll: () => request('/api/v1/roles', { method: 'GET' }),
  getById: (id) => request(`/api/v1/roles/${id}`, { method: 'GET' }),
}

export default rolesApi

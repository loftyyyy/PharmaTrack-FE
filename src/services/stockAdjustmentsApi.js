import { API_BASE_URL } from '../utils/config'

const BASE_URL = API_BASE_URL

function getAuthHeaders() {
  const token = localStorage.getItem('pharma_token')
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
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

const stockAdjustmentsApi = {
  getAll: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return request(`/api/v1/stockAdjustments${queryString}`, { method: 'GET' })
  },
  getById: (id) => request(`/api/v1/stockAdjustments/${id}`, { method: 'GET' }),
  create: async (dto) => {
    const token = localStorage.getItem('pharma_token')
    console.log('🔑 Using token for create stock adjustment:', token ? `${token.substring(0, 20)}...` : 'No token found')
    console.log('📤 Sending stock adjustment data:', JSON.stringify(dto, null, 2))
    
    try {
      const result = await request('/api/v1/stockAdjustments/create', { method: 'POST', body: JSON.stringify(dto) })
      console.log('✅ Stock adjustment created successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Failed to create stock adjustment:', error)
      throw error
    }
  },
}

export default stockAdjustmentsApi

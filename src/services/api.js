// API service for Spring Boot backend communication

import { API_BASE_URL } from '../utils/config'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.logoutCallback = null
    this.refreshTokenCallback = null
  }

  // Set logout callback to be called when token expires
  setLogoutCallback(callback) {
    this.logoutCallback = callback
  }

  // Set refresh token callback to be called when token needs refresh
  setRefreshTokenCallback(callback) {
    this.refreshTokenCallback = callback
  }

  // Get auth headers from localStorage
  getAuthHeaders() {
    const accessToken = localStorage.getItem('pharma_access_token')
    return {
      'Content-Type': 'application/json',
      ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
    }
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      // Handle token expiration (401 Unauthorized)
      if (response.status === 401) {
        console.warn('Access token expired or invalid, attempting refresh...')
        
        // Try to refresh token first
        if (this.refreshTokenCallback) {
          try {
            await this.refreshTokenCallback()
            // Retry the original request with new token
            const retryConfig = {
              ...config,
              headers: {
                ...this.getAuthHeaders(),
                ...config.headers,
              },
            }
            const retryResponse = await fetch(url, retryConfig)
            
            if (retryResponse.ok) {
              return retryResponse
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError)
          }
        }
        
        // If refresh failed or no callback, trigger logout
        console.warn('Token refresh failed, triggering auto logout')
        if (this.logoutCallback) {
          this.logoutCallback('Session expired. Please log in again.')
        }
        throw new Error('Session expired. Please log in again.')
      }
      
      // Handle different response types
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      // Handle empty responses (like 204 No Content)
      if (response.status === 204) {
        return null
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }

      return await response.text()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  // POST request
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // PUT request
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // PATCH request
  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  // Authentication endpoints
  auth = {
    login: (credentials) => this.post('/auth/login', credentials),
    register: (userData) => this.post('/auth/register', userData),
    logout: () => this.post('/auth/logout'),
    refresh: () => this.post('/auth/refresh'),
    forgotPassword: (email) => this.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => this.post('/auth/reset-password', { token, password }),
  }

  // User management endpoints (v1 API - requires Authorization)
  users = {
    getProfile: () => this.get('/v1/users/profile'),
    updateProfile: (userData) => this.put('/v1/users/profile', userData),
    getAll: () => this.get('/v1/users'),
    getById: (id) => this.get(`/v1/users/${id}`),
    create: (userData) => this.post('/v1/users', userData), // { username, password, role }
    update: (id, userData) => this.put(`/v1/users/${id}`, userData),
    delete: (id) => this.delete(`/v1/users/${id}`),
  }

  // Customer/Orders endpoints (v1 API - requires Authorization)
  customers = {
    getAll: (params) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/v1/customers${queryString}`)
    },
    getById: (id) => this.get(`/v1/customers/${id}`),
    create: (customerData) => this.post('/v1/customers', customerData),
    update: (id, customerData) => this.put(`/v1/customers/${id}`, customerData),
    delete: (id) => this.delete(`/v1/customers/${id}`),
    getOrders: (id) => this.get(`/v1/customers/${id}/orders`),
  }

  // Orders endpoints (v1 API - requires Authorization)
  orders = {
    getAll: (params) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
      return this.get(`/v1/orders${queryString}`)
    },
    getById: (id) => this.get(`/v1/orders/${id}`),
    create: (orderData) => this.post('/v1/orders', orderData),
    update: (id, orderData) => this.put(`/v1/orders/${id}`, orderData),
    delete: (id) => this.delete(`/v1/orders/${id}`),
    updateStatus: (id, status) => this.patch(`/v1/orders/${id}/status`, { status }),
    getByStatus: (status) => this.get(`/v1/orders/status/${status}`),
    getByCustomer: (customerId) => this.get(`/v1/orders/customer/${customerId}`),
  }

  // Suppliers endpoints (v1 API - requires Authorization)
  suppliers = {
    getAll: () => this.get('/v1/suppliers'),
    getById: (id) => this.get(`/v1/suppliers/${id}`),
    create: (supplierData) => this.post('/v1/suppliers', supplierData),
    update: (id, supplierData) => this.put(`/v1/suppliers/${id}`, supplierData),
    delete: (id) => this.delete(`/v1/suppliers/${id}`),
  }

  // Dashboard/Analytics endpoints (v1 API - requires Authorization)
  dashboard = {
    getKPIs: () => this.get('/v1/dashboard/kpis'),
    getSalesOverview: (period = '30d') => this.get(`/v1/dashboard/sales?period=${period}`),
    getTopProducts: (limit = 10) => this.get(`/v1/dashboard/top-products?limit=${limit}`),
    getRecentActivity: (limit = 20) => this.get(`/v1/dashboard/activity?limit=${limit}`),
    getAlerts: () => this.get('/v1/dashboard/alerts'),
  }

  // Reports endpoints (v1 API - requires Authorization)
  reports = {
    getSalesReport: (params) => {
      const queryString = '?' + new URLSearchParams(params).toString()
      return this.get(`/v1/reports/sales${queryString}`)
    },
    getInventoryReport: (params) => {
      const queryString = '?' + new URLSearchParams(params).toString()
      return this.get(`/v1/reports/inventory${queryString}`)
    },
    getProductReport: (params) => {
      const queryString = '?' + new URLSearchParams(params).toString()
      return this.get(`/v1/reports/products${queryString}`)
    },
    getCustomerReport: (params) => {
      const queryString = '?' + new URLSearchParams(params).toString()
      return this.get(`/v1/reports/customers${queryString}`)
    },
    getExpiryReport: () => this.get('/v1/reports/expiry'),
    downloadReport: async (reportType, params) => {
      const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
      const response = await this.request(`/v1/reports/${reportType}/download${queryString}`, {
        method: 'GET',
      })
      return response
    },
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService

// Export individual service categories for convenience
export const {
  auth,
  users,
  customers,
  orders,
  suppliers,
  dashboard,
  reports,
} = apiService

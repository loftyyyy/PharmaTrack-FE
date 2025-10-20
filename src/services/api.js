// Centralized API service for Spring Boot backend communication
// This service handles all authentication, token refresh, and API requests

import { API_BASE_URL } from '../utils/config'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
    this.logoutCallback = null
    this.refreshTokenCallback = null
    this.isRefreshing = false
    this.failedQueue = []
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

  // Process failed queue after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error)
      } else {
        resolve(token)
      }
    })
    
    this.failedQueue = []
  }

  // Generic request method with proper token refresh handling
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
        // If we're already refreshing, queue this request
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject })
          }).then(() => {
            return this.request(endpoint, options)
          })
        }

        this.isRefreshing = true
        
        try {
          // Try to refresh token
        if (this.refreshTokenCallback) {
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
              this.processQueue(null, retryResponse)
              return retryResponse
            } else if (retryResponse.status === 401) {
              // Still getting 401 after refresh - tokens are invalid
              this.processQueue(new Error('Authentication failed after token refresh'), null)
              throw new Error('Authentication failed after token refresh')
            } else {
              this.processQueue(null, retryResponse)
              return retryResponse
            }
          } else {
            // No refresh callback available
            this.processQueue(new Error('No refresh token callback'), null)
            throw new Error('No refresh token callback available')
          }
        } catch (refreshError) {
          this.processQueue(refreshError, null)
          
          // If refresh failed, trigger logout
        if (this.logoutCallback) {
          this.logoutCallback('Session expired. Please log in again.')
        }
        throw new Error('Session expired. Please log in again.')
        } finally {
          this.isRefreshing = false
        }
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

  // Download method that returns a Blob and handles token refresh on 401
  async download(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`

    const buildHeaders = () => {
      const accessToken = localStorage.getItem('pharma_access_token')
      return {
        ...(accessToken && { 'Authorization': `Bearer ${accessToken}` }),
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'text/csv, application/octet-stream',
        ...(options.headers || {}),
      }
    }

    const makeRequest = async () => fetch(url, { ...options, headers: buildHeaders() })

    let response = await makeRequest()

      // Only 401 is an authentication failure that should attempt refresh
      const isAuthFailure = (resp) => resp.status === 401
      const looksLikeLoginHtml = async (resp) => {
        try {
          const contentType = resp.headers.get('content-type') || ''
          if (!contentType.includes('text/html')) return false
          const text = await resp.clone().text()
          return /<title>.*login.*<\/title>/i.test(text) || /name=["']username["']|name=["']password["']/i.test(text)
        } catch {
          return false
        }
      }

      if (isAuthFailure(response)) {
        // Attempt token refresh
        if (this.refreshTokenCallback) {
          await this.refreshTokenCallback()
          await new Promise(resolve => setTimeout(resolve, 300))
          response = await makeRequest()
        }
      }

      if (isAuthFailure(response) || (response.redirected && response.url && /login/i.test(response.url)) || (await looksLikeLoginHtml(response))) {
        // Do not auto-logout on download endpoints; surface an auth error to the caller instead
        throw new Error('401 Unauthorized')
      }

      // Surface 403 Forbidden as a normal error (do not logout)
      if (response.status === 403) {
        const text = await response.text().catch(() => '')
        throw new Error(text || '403 Forbidden: You do not have permission to export inventory logs.')
      }

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        throw new Error(text || `HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.blob()
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
    refresh: (refreshToken) => {
      // Properly format the refresh token request according to backend expectations
      return this.post('/auth/refresh', { refreshToken })
    },
    forgotPassword: (email) => this.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => this.post('/auth/reset-password', { token, password }),
  }

  // User management endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/users")
  users = {
    getProfile: () => this.get('/api/v1/users/me'),
    getAll: () => this.get('/api/v1/users'),
    getById: (id) => this.get(`/api/v1/users/${id}`),
    create: (userData) => this.post('/api/v1/users/signup', userData),
    update: (id, userData) => this.put(`/api/v1/users/${id}`, userData),
  }

  // Customer endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/customers")
  customers = {
    getAll: () => this.get('/api/v1/customers'),
    getById: (id) => this.get(`/api/v1/customers/${id}`),
    getWalkIn: () => this.get('/api/v1/customers/walkIn'),
    getActive: () => this.get('/api/v1/customers/active'),
    create: (customerData) => this.post('/api/v1/customers/create', customerData),
    update: (id, customerData) => this.put(`/api/v1/customers/${id}`, customerData),
    deactivate: (id) => this.put(`/api/v1/customers/deactivate/${id}`),
    activate: (id) => this.put(`/api/v1/customers/activate/${id}`),
  }

  // Suppliers endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/suppliers")
  suppliers = {
    getAll: () => this.get('/api/v1/suppliers'),
    getById: (id) => this.get(`/api/v1/suppliers/${id}`),
    create: (supplierData) => this.post('/api/v1/suppliers/create', supplierData),
    update: (id, supplierData) => this.put(`/api/v1/suppliers/${id}`, supplierData),
  }

  // Products endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/products")
  products = {
    getAll: () => this.get('/api/v1/products'),
    getById: (id) => this.get(`/api/v1/products/${id}`),
    create: (productData) => this.post('/api/v1/products/create', productData),
    update: (id, productData) => this.put(`/api/v1/products/${id}`, productData),
  }

  // Categories endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/categories")
  categories = {
    getAll: () => this.get('/api/v1/categories'),
    getById: (id) => this.get(`/api/v1/categories/${id}`),
    create: (categoryData) => this.post('/api/v1/categories/create', categoryData),
    update: (id, categoryData) => this.put(`/api/v1/categories/${id}`, categoryData),
  }

  // Sales endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/sales")
  sales = {
    getAll: () => this.get('/api/v1/sales'),
    getById: (id) => this.get(`/api/v1/sales/${id}`),
    create: (saleData) => this.post('/api/v1/sales/create', saleData),
    confirm: (id) => this.post(`/api/v1/sales/${id}/confirm`),
    void: (id, reason) => this.post(`/api/v1/sales/${id}/void`, { reason }),
    cancel: (id) => this.post(`/api/v1/sales/${id}/cancel`),
  }

  // Purchases endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/purchases")
  purchases = {
    getAll: () => this.get('/api/v1/purchases'),
    getById: (id) => this.get(`/api/v1/purchases/${id}`),
    create: (purchaseData) => this.post('/api/v1/purchases/create', purchaseData),
    update: (id, purchaseData) => this.put(`/api/v1/purchases/${id}`, purchaseData),
    confirm: (id) => this.put(`/api/v1/purchases/${id}/confirm`),
    cancel: (id) => this.put(`/api/v1/purchases/${id}/cancel`),
  }

  // Purchase Items endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/purchaseItems")
  purchaseItems = {
    getAll: () => this.get('/api/v1/purchaseItems'),
    getById: (id) => this.get(`/api/v1/purchaseItems/${id}`),
    update: (id, itemData) => this.put(`/api/v1/purchaseItems/${id}`, itemData),
    delete: (id) => this.delete(`/api/v1/purchaseItems/${id}`),
  }

  // Product Batches endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/productBatches")
  productBatches = {
    getAll: () => this.get('/api/v1/productBatches'),
    getById: (id) => this.get(`/api/v1/productBatches/${id}`),
    getByProductId: (productId) => this.get(`/api/v1/productBatches/${productId}/batches`),
    getEarliest: () => this.get('/api/v1/productBatches/earliest'),
    update: (id, batchData) => this.put(`/api/v1/productBatches/${id}`, batchData),
    checkExists: (payload) => this.post('/api/v1/productBatches/check', payload),
  }

  // Product Suppliers endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/productSuppliers")
  productSuppliers = {
    getAll: () => this.get('/api/v1/productSuppliers'),
    getById: (id) => this.get(`/api/v1/productSuppliers/${id}`),
    create: (productSupplierData) => this.post('/api/v1/productSuppliers/create', productSupplierData),
    update: (id, productSupplierData) => this.put(`/api/v1/productSuppliers/${id}`, productSupplierData),
  }

  // Roles endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/roles")
  roles = {
    getAll: () => this.get('/api/v1/roles'),
    getById: (id) => this.get(`/api/v1/roles/${id}`),
    getUserCount: (roleId) => this.get(`/api/v1/roles/${roleId}/users/count`),
    create: (roleData) => this.post('/api/v1/roles/create', roleData),
    update: (id, roleData) => this.put(`/api/v1/roles/${id}`, roleData),
  }

  // Stock Adjustments endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/stockAdjustments")
  stockAdjustments = {
    getAll: () => this.get('/api/v1/stockAdjustments'),
    getById: (id) => this.get(`/api/v1/stockAdjustments/${id}`),
    create: (adjustmentData) => this.post('/api/v1/stockAdjustments/create', adjustmentData),
  }

  // Inventory Logs endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/inventoryLogs")
  inventoryLogs = {
    getAll: () => this.get('/api/v1/inventoryLogs/'), // Note: trailing slash for @RequestMapping("/")
    getById: (id) => this.get(`/api/v1/inventoryLogs/${id}`),
    create: (logData) => this.post('/api/v1/inventoryLogs/create', logData),
  }

  // Low Stock Alerts endpoints (v1 API - requires Authorization)
  // Backend: @RequestMapping("/api/v1/alerts")
  alerts = {
    getCount: () => this.get('/api/v1/alerts/count'),
    getUnresolved: () => this.get('/api/v1/alerts/unresolved'),
    getResolved: () => this.get('/api/v1/alerts/resolved'),
    resolve: (id) => this.put(`/api/v1/alerts/${id}/resolve`),
    createOrUpdate: () => this.post('/api/v1/alerts/createOrUpdate'),
  }
}

// Create and export a singleton instance
const apiService = new ApiService()
export default apiService

// Helper function to create API methods for individual services
export const createApiMethods = (basePath) => ({
  getAll: (params) => {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : ''
    return apiService.get(`${basePath}${queryString}`)
  },
  getById: (id) => apiService.get(`${basePath}/${id}`),
  create: (data) => apiService.post(`${basePath}`, data),
  update: (id, data) => apiService.put(`${basePath}/${id}`, data),
  delete: (id) => apiService.delete(`${basePath}/${id}`),
  patch: (id, data) => apiService.patch(`${basePath}/${id}`, data),
})

// Export individual service categories for convenience
export const {
  auth,
  users,
  customers,
  suppliers,
  products,
  categories,
  sales,
  purchases,
  purchaseItems,
  productBatches,
  productSuppliers,
  roles,
  stockAdjustments,
  inventoryLogs,
  alerts,
} = apiService

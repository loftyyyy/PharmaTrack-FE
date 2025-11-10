// Debug utility for testing API endpoints
// Use this in browser console to test your backend

export const debugAPI = {
  // Test if backend is running
  async testBackend() {
    console.log('🧪 Testing backend connectivity...')
    
    try {
      const response = await fetch('http://localhost:8080/api/v1/inventoryLogs/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pharma_access_token')}`
        }
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers))
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Backend is running! Data:', data)
        return true
      } else {
        const errorText = await response.text()
        console.log('❌ Backend error:', response.status, errorText)
        return false
      }
    } catch (error) {
      console.log('❌ Network error:', error.message)
      console.log('💡 Make sure your Spring Boot backend is running on port 8080')
      return false
    }
  },

  // Test authentication
  async testAuth() {
    console.log('🧪 Testing authentication...')
    
    const token = localStorage.getItem('pharma_access_token')
    console.log('🔑 Token exists:', !!token)
    
    if (token) {
      console.log('🔑 Token preview:', token.substring(0, 20) + '...')
    } else {
      console.log('❌ No access token found. Please log in first.')
      return false
    }
    
    return true
  },

  // Test specific endpoint
  async testEndpoint(endpoint) {
    console.log(`🧪 Testing endpoint: ${endpoint}`)
    
    try {
      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pharma_access_token')}`
        }
      })
      
      console.log('📡 Response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        url: response.url
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Success! Data:', data)
        return data
      } else {
        const errorText = await response.text()
        console.log('❌ Error:', errorText)
        return null
      }
    } catch (error) {
      console.log('❌ Network error:', error.message)
      return null
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all API tests...')
    console.log('=' .repeat(50))
    
    const authTest = await this.testAuth()
    if (!authTest) return
    
    const backendTest = await this.testBackend()
    if (!backendTest) return
    
    console.log('=' .repeat(50))
    console.log('✅ All tests completed!')
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.debugAPI = debugAPI
}

export default debugAPI

// Token Testing Utilities
// Use these functions in browser console to test refresh token functionality

import apiService from '../services/api'

export const tokenTestUtils = {
  // Test 1: Simulate token expiry and make API call
  async testTokenRefresh() {
    console.log('🧪 Testing token refresh functionality...')
    
    // Store current tokens
    const originalAccessToken = localStorage.getItem('pharma_access_token')
    const originalRefreshToken = localStorage.getItem('pharma_refresh_token')
    const originalExpiry = localStorage.getItem('pharma_token_expiry')
    
    console.log('📋 Current tokens:', {
      accessToken: originalAccessToken ? `${originalAccessToken.substring(0, 20)}...` : 'NONE',
      refreshToken: originalRefreshToken ? `${originalRefreshToken.substring(0, 20)}...` : 'NONE',
      expiry: originalExpiry
    })
    
    if (!originalAccessToken || !originalRefreshToken) {
      console.error('❌ No tokens found. Please log in first.')
      return false
    }
    
    try {
      // Simulate expired token
      console.log('⏰ Simulating expired access token...')
      localStorage.setItem('pharma_token_expiry', '1') // Set to 1 second ago
      
      // Make API call that should trigger refresh
      console.log('🔄 Making API call to trigger refresh...')
      const result = await apiService.get('/api/v1/categories')
      
      // Check if new tokens were generated
      const newAccessToken = localStorage.getItem('pharma_access_token')
      const newRefreshToken = localStorage.getItem('pharma_refresh_token')
      const newExpiry = localStorage.getItem('pharma_token_expiry')
      
      console.log('✅ Test completed successfully!')
      console.log('📋 New tokens:', {
        accessToken: newAccessToken ? `${newAccessToken.substring(0, 20)}...` : 'NONE',
        refreshToken: newRefreshToken ? `${newRefreshToken.substring(0, 20)}...` : 'NONE',
        expiry: newExpiry
      })
      
      const tokensChanged = newAccessToken !== originalAccessToken || 
                           newRefreshToken !== originalRefreshToken
      
      if (tokensChanged) {
        console.log('🎉 SUCCESS: Tokens were refreshed!')
        return true
      } else {
        console.log('⚠️ WARNING: Tokens were not refreshed')
        return false
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      
      // Restore original tokens
      localStorage.setItem('pharma_access_token', originalAccessToken)
      localStorage.setItem('pharma_refresh_token', originalRefreshToken)
      localStorage.setItem('pharma_token_expiry', originalExpiry)
      
      return false
    }
  },

  // Test 2: Test with invalid refresh token
  async testInvalidRefreshToken() {
    console.log('🧪 Testing invalid refresh token handling...')
    
    const originalRefreshToken = localStorage.getItem('pharma_refresh_token')
    
    if (!originalRefreshToken) {
      console.error('❌ No refresh token found. Please log in first.')
      return false
    }
    
    try {
      // Corrupt the refresh token
      console.log('🔧 Corrupting refresh token...')
      localStorage.setItem('pharma_refresh_token', 'invalid_token_12345')
      localStorage.setItem('pharma_token_expiry', '1') // Expire access token
      
      // Make API call
      console.log('🔄 Making API call with invalid refresh token...')
      await apiService.get('/api/v1/categories')
      
      console.log('⚠️ WARNING: API call succeeded with invalid refresh token!')
      return false
      
    } catch (error) {
      console.log('✅ SUCCESS: Invalid refresh token properly rejected')
      console.log('📝 Error message:', error.message)
      
      // Check if user was logged out
      const currentToken = localStorage.getItem('pharma_access_token')
      if (!currentToken) {
        console.log('🎉 SUCCESS: User was properly logged out')
        return true
      } else {
        console.log('⚠️ WARNING: User was not logged out')
        return false
      }
    } finally {
      // Restore original refresh token
      localStorage.setItem('pharma_refresh_token', originalRefreshToken)
    }
  },

  // Test 3: Test multiple simultaneous requests during refresh
  async testConcurrentRequests() {
    console.log('🧪 Testing concurrent requests during token refresh...')
    
    if (!localStorage.getItem('pharma_access_token')) {
      console.error('❌ No tokens found. Please log in first.')
      return false
    }
    
    try {
      // Expire the token
      localStorage.setItem('pharma_token_expiry', '1')
      
      console.log('🔄 Making 5 concurrent API calls...')
      
      // Make multiple concurrent requests
      const promises = [
        apiService.get('/api/v1/categories'),
        apiService.get('/api/v1/users'),
        apiService.get('/api/v1/products'),
        apiService.get('/api/v1/suppliers'),
        apiService.get('/api/v1/roles')
      ]
      
      const results = await Promise.all(promises)
      
      console.log('✅ SUCCESS: All concurrent requests completed!')
      console.log('📊 Results:', results.map((result, index) => ({
        request: index + 1,
        success: !!result,
        dataLength: result ? (Array.isArray(result) ? result.length : Object.keys(result).length) : 0
      })))
      
      return true
      
    } catch (error) {
      console.error('❌ Concurrent requests test failed:', error)
      return false
    }
  },

  // Test 4: Check token expiry timing
  checkTokenTiming() {
    console.log('🧪 Checking token timing...')
    
    const accessToken = localStorage.getItem('pharma_access_token')
    const expiry = localStorage.getItem('pharma_token_expiry')
    
    if (!accessToken || !expiry) {
      console.error('❌ No tokens found. Please log in first.')
      return false
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const expiryTime = parseInt(expiry)
    const timeUntilExpiry = expiryTime - currentTime
    
    console.log('📊 Token timing info:', {
      currentTime,
      expiryTime,
      timeUntilExpiry: `${timeUntilExpiry} seconds`,
      timeUntilExpiryMinutes: `${Math.round(timeUntilExpiry / 60)} minutes`,
      isExpired: timeUntilExpiry <= 0
    })
    
    if (timeUntilExpiry <= 0) {
      console.log('⚠️ Token is currently expired')
    } else if (timeUntilExpiry <= 60) {
      console.log('⚠️ Token expires in less than 1 minute')
    } else {
      console.log('✅ Token is valid')
    }
    
    return true
  },

  // Test 5: Manual refresh test
  async testManualRefresh() {
    console.log('🧪 Testing manual token refresh...')
    
    const refreshToken = localStorage.getItem('pharma_refresh_token')
    
    if (!refreshToken) {
      console.error('❌ No refresh token found. Please log in first.')
      return false
    }
    
    try {
      console.log('🔄 Calling refresh endpoint directly...')
      const result = await apiService.auth.refresh(refreshToken)
      
      console.log('✅ Manual refresh successful!')
      console.log('📋 Response:', {
        accessToken: result.accessToken ? `${result.accessToken.substring(0, 20)}...` : 'NONE',
        refreshToken: result.refreshToken ? `${result.refreshToken.substring(0, 20)}...` : 'NONE',
        expiresIn: result.expiresIn
      })
      
      return true
      
    } catch (error) {
      console.error('❌ Manual refresh failed:', error)
      return false
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Running all token refresh tests...')
    console.log('=' .repeat(50))
    
    const results = {
      tokenRefresh: await this.testTokenRefresh(),
      invalidRefresh: await this.testInvalidRefreshToken(),
      concurrentRequests: await this.testConcurrentRequests(),
      tokenTiming: this.checkTokenTiming(),
      manualRefresh: await this.testManualRefresh()
    }
    
    console.log('=' .repeat(50))
    console.log('📊 Test Results Summary:')
    console.log(results)
    
    const passedTests = Object.values(results).filter(Boolean).length
    const totalTests = Object.keys(results).length
    
    console.log(`🎯 Tests passed: ${passedTests}/${totalTests}`)
    
    return results
  }
}

// Make it available globally for console testing
if (typeof window !== 'undefined') {
  window.tokenTestUtils = tokenTestUtils
}

export default tokenTestUtils

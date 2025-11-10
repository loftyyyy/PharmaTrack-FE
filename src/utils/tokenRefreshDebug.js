// Token Refresh Debug Utility
// Use this to test and debug the refresh token flow

export const tokenRefreshDebug = {
  // Monitor token refresh in real-time
  startMonitoring() {
    console.log('🔍 Starting token refresh monitoring...')
    
    const monitorInterval = setInterval(() => {
      const accessToken = localStorage.getItem('pharma_access_token')
      const refreshToken = localStorage.getItem('pharma_refresh_token')
      const expiry = localStorage.getItem('pharma_token_expiry')
      
      if (accessToken && expiry) {
        const currentTime = Math.floor(Date.now() / 1000)
        const expiryTime = parseInt(expiry)
        const timeLeft = expiryTime - currentTime
        
        console.log(`🕐 Token Status: ${timeLeft} seconds remaining`, {
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          timeLeft,
          isExpired: timeLeft <= 0
        })
        
        if (timeLeft <= 0) {
          console.warn('⚠️ Token has expired!')
        } else if (timeLeft <= 15) {
          console.warn(`⚠️ Token expires in ${timeLeft} seconds!`)
        }
      } else {
        console.log('❌ No tokens found')
      }
    }, 2000) // Check every 2 seconds
    
    // Return cleanup function
    return () => {
      clearInterval(monitorInterval)
      console.log('🛑 Stopped token refresh monitoring')
    }
  },

  // Test manual refresh
  async testManualRefresh() {
    console.log('🧪 Testing manual token refresh...')
    
    const refreshToken = localStorage.getItem('pharma_refresh_token')
    if (!refreshToken) {
      console.error('❌ No refresh token found')
      return false
    }
    
    try {
      const response = await fetch('http://localhost:8080/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      })
      
      console.log('📡 Refresh response:', {
        status: response.status,
        ok: response.ok
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Refresh successful:', data)
        return true
      } else {
        const errorText = await response.text()
        console.error('❌ Refresh failed:', errorText)
        return false
      }
    } catch (error) {
      console.error('❌ Network error:', error.message)
      return false
    }
  },

  // Simulate token expiry
  simulateExpiry() {
    console.log('🧪 Simulating token expiry...')
    localStorage.setItem('pharma_token_expiry', '1') // Set to 1 second ago
    console.log('✅ Token expiry simulated')
  },

  // Check current token status
  getTokenStatus() {
    const accessToken = localStorage.getItem('pharma_access_token')
    const refreshToken = localStorage.getItem('pharma_refresh_token')
    const expiry = localStorage.getItem('pharma_token_expiry')
    
    if (!accessToken || !expiry) {
      return { status: 'NO_TOKEN', message: 'No access token or expiry found' }
    }
    
    const currentTime = Math.floor(Date.now() / 1000)
    const expiryTime = parseInt(expiry)
    const timeLeft = expiryTime - currentTime
    
    return {
      status: timeLeft <= 0 ? 'EXPIRED' : timeLeft <= 15 ? 'EXPIRING_SOON' : 'VALID',
      timeLeft,
      hasRefreshToken: !!refreshToken,
      message: timeLeft <= 0 ? 'Token expired' : timeLeft <= 15 ? `Token expires in ${timeLeft}s` : `Token valid for ${timeLeft}s`
    }
  },

  // Run comprehensive test
  async runComprehensiveTest() {
    console.log('🚀 Running comprehensive token refresh test...')
    console.log('=' .repeat(60))
    
    // 1. Check initial status
    const initialStatus = this.getTokenStatus()
    console.log('1️⃣ Initial token status:', initialStatus)
    
    if (initialStatus.status === 'NO_TOKEN') {
      console.log('❌ No tokens found. Please log in first.')
      return
    }
    
    // 2. Test manual refresh
    console.log('2️⃣ Testing manual refresh...')
    const refreshSuccess = await this.testManualRefresh()
    
    if (!refreshSuccess) {
      console.log('❌ Manual refresh failed. Check backend and tokens.')
      return
    }
    
    // 3. Simulate expiry and monitor
    console.log('3️⃣ Simulating token expiry...')
    this.simulateExpiry()
    
    // 4. Start monitoring
    console.log('4️⃣ Starting monitoring...')
    const stopMonitoring = this.startMonitoring()
    
    // Stop monitoring after 30 seconds
    setTimeout(() => {
      stopMonitoring()
      console.log('✅ Test completed')
    }, 30000)
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.tokenRefreshDebug = tokenRefreshDebug
}

export default tokenRefreshDebug

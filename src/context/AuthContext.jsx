import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE_URL } from '../utils/config'
import { parseJwt } from '../utils/jwt'
import apiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [refreshToken, setRefreshToken] = useState(null)
  const [tokenExpiry, setTokenExpiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showExpiryWarning, setShowExpiryWarning] = useState(false)
  const tokenCheckInterval = useRef(null)
  const warningTimeout = useRef(null)

  // Initialize auth state from localStorage
  useEffect(() => {
    console.log('🔄 Initializing auth from localStorage') // Debug log
    
    const savedAccessToken = localStorage.getItem('pharma_access_token')
    const savedRefreshToken = localStorage.getItem('pharma_refresh_token')
    const savedUser = localStorage.getItem('pharma_user')
    const savedTokenExpiry = localStorage.getItem('pharma_token_expiry')
    
    console.log('💾 Saved data from localStorage:', { 
      savedAccessToken: savedAccessToken ? `${savedAccessToken.substring(0, 20)}...` : null, 
      savedRefreshToken: savedRefreshToken ? `${savedRefreshToken.substring(0, 20)}...` : null,
      savedUser,
      savedTokenExpiry,
      accessTokenExists: !!savedAccessToken,
      refreshTokenExists: !!savedRefreshToken,
      userExists: !!savedUser
    })
    
    if (savedAccessToken && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(savedUser)
        const parsedExpiry = savedTokenExpiry ? parseInt(savedTokenExpiry) : null
        
        console.log('Parsed user:', parsedUser) // Debug log
        console.log('Parsed token expiry:', parsedExpiry) // Debug log
        
        setAccessToken(savedAccessToken)
        setRefreshToken(savedRefreshToken)
        setUser(parsedUser)
        setTokenExpiry(parsedExpiry)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        // Clear invalid data
        localStorage.removeItem('pharma_access_token')
        localStorage.removeItem('pharma_refresh_token')
        localStorage.removeItem('pharma_user')
        localStorage.removeItem('pharma_token_expiry')
      }
    } else {
      // Clear any invalid data
      if (savedAccessToken || savedRefreshToken || savedUser) {
        console.log('Clearing invalid localStorage data')
        localStorage.removeItem('pharma_access_token')
        localStorage.removeItem('pharma_refresh_token')
        localStorage.removeItem('pharma_user')
        localStorage.removeItem('pharma_token_expiry')
      }
    }
    setLoading(false)
  }, [])

  // Stop checking token expiry
  const stopTokenExpiryChecking = useCallback(() => {
    if (tokenCheckInterval.current) {
      clearInterval(tokenCheckInterval.current)
      tokenCheckInterval.current = null
    }
    if (warningTimeout.current) {
      clearTimeout(warningTimeout.current)
      warningTimeout.current = null
    }
    setShowExpiryWarning(false)
  }, [])

  // Handle auto logout
  const handleAutoLogout = useCallback((message) => {
    console.log('Handling auto logout:', message)
    stopTokenExpiryChecking()
    
    // Clear state and localStorage
    setAccessToken(null)
    setRefreshToken(null)
    setTokenExpiry(null)
    setUser(null)
    setShowExpiryWarning(false)
    localStorage.removeItem('pharma_access_token')
    localStorage.removeItem('pharma_refresh_token')
    localStorage.removeItem('pharma_token_expiry')
    localStorage.removeItem('pharma_user')
    
    // Optional: Show notification to user
    if (window.alert) {
      alert(message)
    }
  }, [stopTokenExpiryChecking])

  // Check if access token is expired using stored expiry time
  const isAccessTokenExpired = useCallback(() => {
    if (!accessToken || !tokenExpiry) return true
    const currentTime = Math.floor(Date.now() / 1000)
    return tokenExpiry < currentTime
  }, [accessToken, tokenExpiry])

  // Get time until access token expires
  const getAccessTokenTimeUntilExpiry = useCallback(() => {
    if (!accessToken || !tokenExpiry) return 0
    const currentTime = Math.floor(Date.now() / 1000)
    return Math.max(0, tokenExpiry - currentTime)
  }, [accessToken, tokenExpiry])

  // Check if access token is expiring soon
  const isAccessTokenExpiringSoon = useCallback((minutesThreshold = 5) => {
    const timeUntilExpiry = getAccessTokenTimeUntilExpiry()
    return timeUntilExpiry > 0 && timeUntilExpiry <= (minutesThreshold * 60)
  }, [getAccessTokenTimeUntilExpiry])

  // Handle token refresh
  const handleTokenRefresh = useCallback(async () => {
    if (!refreshToken) {
      console.warn('No refresh token available, logging out')
      handleAutoLogout('Session expired. Please log in again.')
      return
    }

    try {
      console.log('🔄 Attempting to refresh access token...')
      
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const authResponse = await response.json()
      console.log('✅ Token refresh successful:', authResponse)

      // Update tokens and expiry
      const newAccessToken = authResponse.accessToken
      const newRefreshToken = authResponse.refreshToken || refreshToken // Keep existing refresh token if not provided
      const newExpiry = Math.floor(Date.now() / 1000) + (authResponse.expiresIn || 900) // Default 15 minutes

      setAccessToken(newAccessToken)
      setRefreshToken(newRefreshToken)
      setTokenExpiry(newExpiry)
      setShowExpiryWarning(false)

      // Update localStorage
      localStorage.setItem('pharma_access_token', newAccessToken)
      localStorage.setItem('pharma_refresh_token', newRefreshToken)
      localStorage.setItem('pharma_token_expiry', newExpiry.toString())

      console.log('🔄 Token refresh completed successfully')
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      handleAutoLogout('Session expired. Please log in again.')
    }
  }, [refreshToken, handleAutoLogout])

  // Start checking token expiry every 30 seconds
  const startTokenExpiryChecking = useCallback(() => {
    stopTokenExpiryChecking() // Clear any existing interval
    
    tokenCheckInterval.current = setInterval(() => {
      if (!accessToken) return
      
      // Check if token is expired
      if (isAccessTokenExpired()) {
        console.warn('Access token has expired, attempting refresh...')
        handleTokenRefresh()
        return
      }
      
      // Check if token is expiring soon (within 5 minutes)
      if (isAccessTokenExpiringSoon(5)) {
        const timeLeft = getAccessTokenTimeUntilExpiry()
        const minutesLeft = Math.ceil(timeLeft / 60)
        
        if (!showExpiryWarning) {
          console.warn(`Access token expires in ${minutesLeft} minutes`)
          setShowExpiryWarning(true)
          
          // Try to refresh token when it's about to expire
          warningTimeout.current = setTimeout(() => {
            if (isAccessTokenExpired()) {
              handleTokenRefresh()
            }
          }, timeLeft * 1000)
        }
      }
    }, 30000) // Check every 30 seconds
  }, [accessToken, showExpiryWarning, stopTokenExpiryChecking, isAccessTokenExpired, isAccessTokenExpiringSoon, getAccessTokenTimeUntilExpiry, handleTokenRefresh])

  // Auto logout functionality
  useEffect(() => {
    // Set up API service callbacks
    apiService.setLogoutCallback((message) => {
      console.warn('Auto logout triggered:', message)
      handleAutoLogout(message)
    })

    apiService.setRefreshTokenCallback(() => {
      console.log('API service requesting token refresh')
      return handleTokenRefresh()
    })

    // Start token expiry checking if user is authenticated
    if (accessToken && user) {
      startTokenExpiryChecking()
    } else {
      stopTokenExpiryChecking()
    }

    // Cleanup on unmount
    return () => {
      stopTokenExpiryChecking()
    }
  }, [accessToken, user, handleAutoLogout, startTokenExpiryChecking, stopTokenExpiryChecking, handleTokenRefresh])

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('🚀 AuthContext login attempt for:', email)
      console.log('🌐 API_BASE_URL:', API_BASE_URL)
      
      // API call to Spring Boot backend
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      })

      console.log('📡 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      })

      if (!response.ok) {
        let errorMessage = 'Login failed'
        try {
          const errorData = await response.json()
          console.log('📄 Error response data:', errorData)
          
          // Use the actual error message from the server
          errorMessage = errorData.message || errorData.error || 'Login failed'
        } catch {
          // If we can't parse the error response, use status-based messages
          if (response.status === 401) {
            errorMessage = 'Invalid username or password'
          } else if (response.status === 403) {
            errorMessage = 'Access denied'
          } else if (response.status >= 500) {
            errorMessage = 'SERVER_ERROR: Server is temporarily unavailable. Please try again later.'
          } else if (response.status === 0) {
            errorMessage = 'NETWORK_ERROR: Unable to connect to the server. Please check if the backend is running.'
          } else {
            errorMessage = `Login failed (${response.status})`
          }
        }
        console.log('❌ Login failed with error:', errorMessage)
        return { success: false, error: errorMessage }
      }

      const authResponse = await response.json()
      console.log('=== LOGIN RESPONSE DEBUG ===')
      console.log('Raw response status:', response.status)
      console.log('Raw response headers:', Object.fromEntries(response.headers))
      console.log('Full login response:', authResponse)
      console.log('Response type:', typeof authResponse)
      console.log('Response keys:', Object.keys(authResponse))
      console.log('authResponse.accessToken exists:', !!authResponse.accessToken)
      console.log('authResponse.refreshToken exists:', !!authResponse.refreshToken)
      console.log('authResponse.user exists:', !!authResponse.user)
      console.log('authResponse.expiresIn:', authResponse.expiresIn)
      
      // Handle new AuthResponse format
      if (!authResponse.accessToken) {
        throw new Error('No access token received from server')
      }

      const accessToken = authResponse.accessToken
      const refreshToken = authResponse.refreshToken
      const expiresIn = authResponse.expiresIn || 900 // Default 15 minutes
      const tokenExpiry = Math.floor(Date.now() / 1000) + expiresIn

      let userData
      
      if (authResponse.user) {
        // Use complete user object from backend
        const userObj = authResponse.user
        userData = {
          id: userObj.id,
          username: userObj.username,
          name: userObj.name || userObj.username,
          email: userObj.email,
          role: userObj.role, // Role object from backend
          roleName: userObj.role?.name || userObj.roleName, // Extract role name
          createdAt: userObj.createdAt,
          updatedAt: userObj.updatedAt,
          lastLogin: userObj.lastLogin || new Date().toISOString(),
          // Add any other fields your backend provides
          ...userObj
        }
        console.log('=== CREATED USER DATA FROM BACKEND ===')
        console.log('Final userData object:', userData)
        console.log('userData.role:', userData.role)
        console.log('userData.roleName:', userData.roleName)
      } else {
        // Fallback: Try to decode JWT token to get user information
        const decodedToken = parseJwt(accessToken)
        console.log('Decoded JWT (fallback):', decodedToken) // Debug log
        
        // Extract role from various possible JWT structures
        let extractedRole = 'USER' // default fallback
        
        if (decodedToken) {
          // Try different common JWT role structures
          extractedRole = decodedToken.role || 
                         decodedToken.roles?.[0] ||
                         decodedToken.authorities?.[0] ||
                         decodedToken.scope?.split(' ')?.[0] ||
                         decodedToken.permissions?.[0] ||
                         'USER'
          
          // Handle Spring Security authorities format: "ROLE_ADMIN" -> "ADMIN"
          if (typeof extractedRole === 'string' && extractedRole.startsWith('ROLE_')) {
            extractedRole = extractedRole.replace('ROLE_', '')
          }
        }
        
        // Create user data from JWT payload and login info
        userData = {
          username: email, // Use the login username
          name: decodedToken?.name || decodedToken?.username || email,
          role: extractedRole,
          email: decodedToken?.email || email,
          id: decodedToken?.sub || decodedToken?.userId,
          lastLogin: new Date().toISOString(),
          exp: decodedToken?.exp,
          iat: decodedToken?.iat
        }
        console.log('Created user data from JWT (fallback):', userData)
      }
      
      // Store in state
      setAccessToken(accessToken)
      setRefreshToken(refreshToken)
      setTokenExpiry(tokenExpiry)
      setUser(userData)
      
      console.log('=== STORING USER DATA ===')
      console.log('Setting user state to:', userData)
      console.log('About to store in localStorage:', JSON.stringify(userData))
      
      // Store in localStorage
      localStorage.setItem('pharma_access_token', accessToken)
      localStorage.setItem('pharma_refresh_token', refreshToken)
      localStorage.setItem('pharma_token_expiry', tokenExpiry.toString())
      localStorage.setItem('pharma_user', JSON.stringify(userData))
      
      // If we only have basic user data, try to fetch complete profile
      if (!authResponse.user) {
        console.log('Fetching complete user profile after login...')
        // Don't await this - let it happen in background
        setTimeout(() => {
          fetchUserProfile().catch(err => 
            console.log('Background profile fetch failed:', err)
          )
        }, 100)
      }
      
      return { success: true }
    } catch (error) {
      console.error('💥 Login error caught:', error)
      console.error('💥 Error type:', error.name)
      console.error('💥 Error message:', error.message)
      console.error('💥 Error stack:', error.stack)
      
      // Handle different types of errors
      let errorMessage = error.message || 'An unexpected error occurred'
      
      // Network errors (server not running, no internet, etc.)
      if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
        errorMessage = 'NETWORK_ERROR: Unable to connect to the server. Please check if the backend server is running and try again.'
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = 'NETWORK_ERROR: Network error. Please check your connection and try again.'
      } else if (error.message.includes('CORS')) {
        errorMessage = 'NETWORK_ERROR: Connection blocked. Please check server configuration.'
      } else if (error.name === 'TypeError' && error.message.includes('Load failed')) {
        errorMessage = 'NETWORK_ERROR: Unable to reach the server. Please check if the backend is running.'
      }
      
      console.log('🔴 Returning login error:', errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Demo login function (for development/testing)
  const demoLogin = () => {
    console.log('Demo login triggered') // Debug log
    
    const demoUser = {
      id: 1,
      username: 'admin',
      email: 'dr.sarah@pharmatrack.com',
      name: 'Dr. Sarah Wilson',
      role: 'ADMIN', // Make sure demo user has ADMIN role
      lastLogin: new Date().toISOString()
    }
    
    const demoAccessToken = 'demo_access_token_' + Date.now()
    const demoRefreshToken = 'demo_refresh_token_' + Date.now()
    const demoExpiry = Math.floor(Date.now() / 1000) + 900 // 15 minutes
    
    console.log('Setting demo user and tokens:', { demoUser, demoAccessToken, demoRefreshToken, demoExpiry }) // Debug log
    
    setAccessToken(demoAccessToken)
    setRefreshToken(demoRefreshToken)
    setTokenExpiry(demoExpiry)
    setUser(demoUser)
    
    localStorage.setItem('pharma_access_token', demoAccessToken)
    localStorage.setItem('pharma_refresh_token', demoRefreshToken)
    localStorage.setItem('pharma_token_expiry', demoExpiry.toString())
    localStorage.setItem('pharma_user', JSON.stringify(demoUser))
    
    console.log('Demo login completed, localStorage updated') // Debug log
    
    return { success: true }
  }

  // Logout function
  const logout = async () => {
    try {
      // Stop token checking
      stopTokenExpiryChecking()
      
      // Optional: Call logout endpoint to invalidate token on server
      if (accessToken) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore errors on logout API call
        })
      }
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Always clear local state and storage
      setAccessToken(null)
      setRefreshToken(null)
      setTokenExpiry(null)
      setUser(null)
      setShowExpiryWarning(false)
      localStorage.removeItem('pharma_access_token')
      localStorage.removeItem('pharma_refresh_token')
      localStorage.removeItem('pharma_token_expiry')
      localStorage.removeItem('pharma_user')
    }
  }

  // Helper function to get authorization headers for API requests
  const getAuthHeaders = () => {
    if (!accessToken) return {}
    
    return {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }
  }

  // Helper function to make authenticated API requests
  const apiRequest = async (url, options = {}) => {
    const headers = {
      ...getAuthHeaders(),
      ...options.headers,
    }

    // Add base URL if the URL is relative
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    })

    // Handle token expiration
    if (response.status === 401) {
      // Token expired or invalid
      logout()
      throw new Error('Session expired. Please log in again.')
    }

    return response
  }

  // Fetch complete user profile from backend
  const fetchUserProfile = async () => {
    if (!accessToken) return null
    
    const response = await apiRequest(`${API_BASE_URL}/v1/users/me`)
    if (response.ok) {
      const userProfile = await response.json()
      console.log('Fetched user profile:', userProfile)
      
      // Update user state with complete profile
      const completeUserData = {
        ...user,
        ...userProfile,
        role: userProfile.role || user.role // Ensure role is properly set
      }
      
      setUser(completeUserData)
      localStorage.setItem('pharma_user', JSON.stringify(completeUserData))
      
      return completeUserData
    }
    return user
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    const authenticated = !!(accessToken && user)
    console.log('🔐 isAuthenticated check:', { 
      accessToken: !!accessToken, 
      user: !!user, 
      authenticated,
      accessTokenValue: accessToken ? `${accessToken.substring(0, 10)}...` : null,
      userValue: user ? { id: user.id, username: user.username } : null
    })
    return authenticated
  }

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!user || !user.role) return false
    return user.role === requiredRole || user.role === 'ADMIN'
  }

  // Refresh token function (now using the new handleTokenRefresh)
  const refreshAccessToken = async () => {
    return handleTokenRefresh()
  }

  const value = {
    user,
    accessToken,
    refreshToken,
    tokenExpiry,
    loading,
    showExpiryWarning,
    login,
    demoLogin,
    logout,
    getAuthHeaders,
    apiRequest,
    fetchUserProfile,
    isAuthenticated,
    hasRole,
    refreshAccessToken,
    handleTokenRefresh,
    dismissExpiryWarning: () => setShowExpiryWarning(false),
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

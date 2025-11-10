/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { API_BASE_URL } from '../utils/config'
import { parseJwt } from '../utils/jwt'
import apiService from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    console.error('🚨 useAuth called outside AuthProvider!')
    console.error('🚨 Current component tree:', document.querySelector('#root')?.innerHTML?.substring(0, 200))
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
  const isRefreshing = useRef(false)

  // Debug logging for AuthProvider initialization
  console.log('🔄 AuthProvider initializing...', { 
    hasChildren: !!children,
    childrenType: typeof children
  })

  // Prevent AuthProvider from unmounting unexpectedly
  useEffect(() => {
    console.log('🔄 AuthProvider mounted')
    return () => {
      console.log('🚨 AuthProvider unmounting - this should not happen!')
    }
  }, [])

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
    console.log('🚨 AUTO LOGOUT TRIGGERED:', message)
    console.log('🚨 Current user before logout:', user)
    console.log('🚨 Current access token before logout:', accessToken ? `${accessToken.substring(0, 20)}...` : 'NONE')
    console.log('🚨 Stack trace:', new Error().stack)
    
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
    
    // Silent logout - no alert box
  }, [stopTokenExpiryChecking, user, accessToken])

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

  // Check if access token is expiring soon (currently unused but kept for future use)
  // const isAccessTokenExpiringSoon = useCallback((minutesThreshold = 5) => {
  //   const timeUntilExpiry = getAccessTokenTimeUntilExpiry()
  //   return timeUntilExpiry > 0 && timeUntilExpiry <= (minutesThreshold * 60)
  // }, [getAccessTokenTimeUntilExpiry])

  // Handle token refresh - aligned with backend TokenRefreshResponse
  const handleTokenRefresh = useCallback(async () => {
    // Prevent multiple simultaneous refresh attempts
    if (isRefreshing.current) {
      console.log('🔄 Token refresh already in progress, waiting...')
      // Wait for ongoing refresh to complete
      let attempts = 0
      while (isRefreshing.current && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 200))
        attempts++
      }
      return
    }

    if (!refreshToken) {
      console.warn('❌ No refresh token available, logging out')
      handleAutoLogout('Session expired. Please log in again.')
      return
    }

    console.log('🔄 Starting token refresh process...')
    isRefreshing.current = true

    try {
      console.log('🔄 Attempting to refresh access token...')
      console.log('🔄 Current refresh token:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NONE')
      
      // Use the centralized API service for refresh
      const tokenResponse = await apiService.auth.refresh(refreshToken)
      console.log('✅ Token refresh successful:', tokenResponse)

      // Extract tokens from TokenRefreshResponse format
      const newAccessToken = tokenResponse.accessToken
      const newRefreshToken = tokenResponse.refreshToken // Backend provides new refresh token (token rotation)
      const expiresIn = tokenResponse.expiresIn || 900 // Default 15 minutes
      const newExpiry = Math.floor(Date.now() / 1000) + expiresIn
      
      // Validate new token
      if (!newAccessToken) {
        throw new Error('No access token received in refresh response')
      }

      console.log('🔄 Updating tokens:', {
        newAccessToken: newAccessToken ? `${newAccessToken.substring(0, 20)}...` : 'NONE',
        newRefreshToken: newRefreshToken ? `${newRefreshToken.substring(0, 20)}...` : 'NONE',
        newExpiry,
        expiresInSeconds: expiresIn,
        currentTime: Math.floor(Date.now() / 1000)
      })

      setAccessToken(newAccessToken)
      setRefreshToken(newRefreshToken)
      setTokenExpiry(newExpiry)
      setShowExpiryWarning(false)

      // Update localStorage
      localStorage.setItem('pharma_access_token', newAccessToken)
      localStorage.setItem('pharma_refresh_token', newRefreshToken)
      localStorage.setItem('pharma_token_expiry', newExpiry.toString())

      console.log('✅ Token refresh completed successfully - localStorage updated')
      console.log('✅ New access token in localStorage:', localStorage.getItem('pharma_access_token') ? 'EXISTS' : 'NOT FOUND')
    } catch (error) {
      console.error('❌ Token refresh failed:', error)
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'NONE'
      })
      
      // Handle specific refresh token errors from backend
      if (error.message.includes('Refresh token was expired') || 
          error.message.includes('Refresh token is not in database') ||
          error.message.includes('Token is not a refresh token') ||
          error.message.includes('Invalid refresh token')) {
        console.warn('❌ Refresh token is invalid/expired, logging out')
        handleAutoLogout('Session expired. Please log in again.')
      } else if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        console.warn('❌ Network error during refresh, keeping user logged in')
        // Don't logout on network errors, just log the error
      } else {
        console.warn('❌ Unknown refresh error, logging out')
        handleAutoLogout('Session expired. Please log in again.')
      }
    } finally {
      isRefreshing.current = false
    }
  }, [refreshToken, handleAutoLogout])

  // Start checking token expiry every 5 seconds for short-lived tokens
  const startTokenExpiryChecking = useCallback(() => {
    stopTokenExpiryChecking() // Clear any existing interval
    
    console.log('🔄 Starting token expiry checking interval...')
    
    tokenCheckInterval.current = setInterval(() => {
      if (!accessToken) {
        console.log('🔄 No access token, skipping expiry check')
        return
      }
      
      const timeLeft = getAccessTokenTimeUntilExpiry()
      console.log(`🔄 Token expiry check - ${timeLeft} seconds remaining`)
      
      // Check if token is expired
      if (isAccessTokenExpired()) {
        console.warn('⚠️ Access token has expired, attempting refresh...')
        handleTokenRefresh()
        return
      }
      
      // Proactively refresh 30 seconds before expiry
      if (timeLeft > 0 && timeLeft <= 30) {
        console.log(`⚠️ Access token expires in ${timeLeft} seconds, refreshing proactively (30s window)...`)
        handleTokenRefresh()
        return
      }
    }, 5000) // Check every 5 seconds for more responsive token refresh with short-lived tokens
  }, [accessToken, stopTokenExpiryChecking, isAccessTokenExpired, getAccessTokenTimeUntilExpiry, handleTokenRefresh])

  // Auto logout functionality
  useEffect(() => {
    console.log('🔄 Setting up API service callbacks...')
    
    // Set up API service callbacks
    apiService.setLogoutCallback((message) => {
      console.warn('Auto logout triggered:', message)
      handleAutoLogout(message)
    })

    apiService.setRefreshTokenCallback(async () => {
      console.log('API service requesting token refresh')
      try {
        await handleTokenRefresh()
        console.log('✅ Token refresh completed for API service')
      } catch (error) {
        console.error('❌ Token refresh failed for API service:', error)
        throw error
      }
    })
    
    console.log('✅ API service callbacks set up successfully')

    // Start token expiry checking if user is authenticated
    if (accessToken && user) {
      console.log('🔄 Starting token expiry checking...')
      startTokenExpiryChecking()
    } else {
      console.log('🔄 Stopping token expiry checking - no auth')
      stopTokenExpiryChecking()
    }

    // Cleanup on unmount
    return () => {
      console.log('🔄 Cleaning up token expiry checking')
      stopTokenExpiryChecking()
    }
  }, [accessToken, user, handleAutoLogout, handleTokenRefresh, startTokenExpiryChecking, stopTokenExpiryChecking])

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)
      console.log('🚀 AuthContext login attempt for:', email)
      console.log('🌐 API_BASE_URL:', API_BASE_URL)
      
      // Use centralized API service for login
      const authResponse = await apiService.auth.login({ username: email, password })
      console.log('=== LOGIN RESPONSE DEBUG ===')
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
        console.log('userData.role type:', typeof userData.role)
        console.log('userData.role.name:', userData.role?.name)
        console.log('Extracted role for roleUtils:', typeof userData.role === 'string' ? userData.role : userData.role?.name || userData.roleName)
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
        await apiService.auth.logout().catch(() => {
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
    const buildHeaders = () => ({
      ...getAuthHeaders(),
      ...options.headers,
    })

    // Add base URL if the URL is relative
    const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`

    const makeRequest = () => fetch(fullUrl, { ...options, headers: buildHeaders() })

    let response = await makeRequest()

    if (response.status === 401) {
      console.warn('⚠️ 401 Unauthorized received. Attempting token refresh...')
      try {
        await handleTokenRefresh()
      } catch {
        console.warn('❌ Refresh failed during 401 handling. Logging out...')
        await logout()
        throw new Error('Session expired. Please log in again.')
      }

      // Retry once with updated token
      response = await makeRequest()
      if (response.status === 401) {
        console.warn('❌ Retry after refresh still returned 401. Logging out...')
        await logout()
        throw new Error('Session expired. Please log in again.')
      }
    }

    return response
  }

  // Fetch complete user profile from backend
  const fetchUserProfile = async () => {
    if (!accessToken) return null
    
    try {
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
      } else {
        console.warn('Profile fetch failed with status:', response.status)
        // Don't logout on profile fetch failure - user might not have permission
        return user
      }
    } catch (error) {
      console.warn('Profile fetch error:', error.message)
      // Don't logout on profile fetch error - user might not have permission
      return user
    }
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    const authenticated = !!(accessToken && user)
    console.log('🔐 isAuthenticated check:', { 
      accessToken: !!accessToken, 
      user: !!user, 
      authenticated,
      accessTokenValue: accessToken ? `${accessToken.substring(0, 10)}...` : null,
      userValue: user ? { id: user.id, username: user.username, role: user.role } : null,
      userRoleType: user?.role ? typeof user.role : 'no role',
      userRoleName: user?.role?.name || user?.roleName || 'no role name'
    })
    return authenticated
  }

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!user || !user.role) return false
    
    // Handle both role objects and role strings
    const userRole = typeof user.role === 'string' ? user.role : user.role?.name || user.roleName
    return userRole === requiredRole || userRole === 'ADMIN'
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

  console.log('🔄 AuthProvider rendering with value:', { 
    hasUser: !!user, 
    hasAccessToken: !!accessToken, 
    loading,
    isAuthenticated: !!(accessToken && user),
    childrenType: typeof children,
    childrenCount: React.Children.count(children)
  })

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

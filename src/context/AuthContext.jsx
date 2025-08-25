import { createContext, useContext, useState, useEffect } from 'react'
import { API_BASE_URL } from '../utils/config'

// Utility function to decode JWT token (client-side only for display purposes)
const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
    return JSON.parse(jsonPayload)
  } catch (error) {
    console.error('Error parsing JWT:', error)
    return null
  }
}

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
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // Initialize auth state from localStorage
  useEffect(() => {
    console.log('Initializing auth from localStorage') // Debug log
    
    const savedToken = localStorage.getItem('pharma_token')
    const savedUser = localStorage.getItem('pharma_user')
    
    console.log('Saved data:', { savedToken: !!savedToken, savedUser }) // Debug log
    
    if (savedToken && savedUser && savedUser !== 'undefined' && savedUser !== 'null') {
      try {
        const parsedUser = JSON.parse(savedUser)
        console.log('Parsed user:', parsedUser) // Debug log
        setToken(savedToken)
        setUser(parsedUser)
      } catch (error) {
        console.error('Error parsing saved user data:', error)
        // Clear invalid data
        localStorage.removeItem('pharma_token')
        localStorage.removeItem('pharma_user')
      }
    } else {
      // Clear any invalid data
      if (savedToken || savedUser) {
        console.log('Clearing invalid localStorage data')
        localStorage.removeItem('pharma_token')
        localStorage.removeItem('pharma_user')
      }
    }
    setLoading(false)
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true)
      
      // API call to Spring Boot backend
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Login failed')
      }

      const data = await response.json()
      console.log('=== LOGIN RESPONSE DEBUG ===')
      console.log('Raw response status:', response.status)
      console.log('Raw response headers:', Object.fromEntries(response.headers))
      console.log('Full login response:', data)
      console.log('Response type:', typeof data)
      console.log('Response keys:', Object.keys(data))
      console.log('data.token exists:', !!data.token)
      console.log('data.token value:', data.token)
      console.log('data.user exists:', !!data.user)
      console.log('data.user value:', data.user)
      
      if (data.user || data.userResponseDTO) {
        const userObj = data.user || data.userResponseDTO
        console.log('✅ USER OBJECT FOUND IN RESPONSE')
        console.log('User object from backend:', userObj)
        console.log('User object keys:', Object.keys(userObj))
        console.log('User roleName field:', userObj.roleName)
        console.log('User role field:', userObj.role)
      } else {
        console.log('❌ NO USER OBJECT IN RESPONSE - WILL USE JWT FALLBACK')
        console.log('This is why you get USER role instead of ADMIN')
      }
      
      // Handle Spring Boot AuthResponse format: { token: "jwt_token_string" }
      let jwtToken, userData
      
      if (data.token) {
        jwtToken = data.token
        
        // Check if backend also returned user object (recommended approach)
        if (data.user || data.userResponseDTO) {
          // Use complete user object from backend (handle both 'user' and 'userResponseDTO' field names)
          const userObj = data.user || data.userResponseDTO
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
          const decodedToken = parseJwt(jwtToken)
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
        
      } else if (typeof data === 'string') {
        // Format: just a token string (fallback)
        jwtToken = data
        userData = {
          username: email,
          name: email,
          role: 'USER',
          lastLogin: new Date().toISOString()
        }
      } else {
        throw new Error('Unexpected response format from server')
      }
      
      // Store in state
      setToken(jwtToken)
      setUser(userData)
      
      console.log('=== STORING USER DATA ===')
      console.log('Setting user state to:', userData)
      console.log('About to store in localStorage:', JSON.stringify(userData))
      
      // Store in localStorage
      localStorage.setItem('pharma_token', jwtToken)
      localStorage.setItem('pharma_user', JSON.stringify(userData))
      
      // If we only have basic user data, try to fetch complete profile
      if (!data.user && !data.userResponseDTO) {
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
      console.error('Login error:', error)
      return { success: false, error: error.message }
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
    
    const demoToken = 'demo_jwt_token_' + Date.now()
    
    console.log('Setting demo user and token:', { demoUser, demoToken }) // Debug log
    
    setToken(demoToken)
    setUser(demoUser)
    
    localStorage.setItem('pharma_token', demoToken)
    localStorage.setItem('pharma_user', JSON.stringify(demoUser))
    
    console.log('Demo login completed, localStorage updated') // Debug log
    
    return { success: true }
  }

  // Logout function
  const logout = async () => {
    try {
      // Optional: Call logout endpoint to invalidate token on server
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
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
      setToken(null)
      setUser(null)
      localStorage.removeItem('pharma_token')
      localStorage.removeItem('pharma_user')
    }
  }

  // Helper function to get authorization headers for API requests
  const getAuthHeaders = () => {
    if (!token) return {}
    
    return {
      'Authorization': `Bearer ${token}`,
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

    try {
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
    } catch (error) {
      throw error
    }
  }

  // Fetch complete user profile from backend
  const fetchUserProfile = async () => {
    if (!token) return null
    
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
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error)
    }
    return user
  }

  // Check if user is authenticated
  const isAuthenticated = () => {
    const authenticated = !!(token && user)
    console.log('Authentication check:', { token: !!token, user: !!user, authenticated }) // Debug log
    return authenticated
  }

  // Check if user has specific role
  const hasRole = (requiredRole) => {
    if (!user || !user.role) return false
    return user.role === requiredRole || user.role === 'ADMIN'
  }

  // Refresh token function (optional - implement if your backend supports it)
  const refreshToken = async () => {
    try {
      if (!token) throw new Error('No token to refresh')

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const newToken = data.token

      setToken(newToken)
      localStorage.setItem('pharma_token', newToken)

      return newToken
    } catch (error) {
      console.error('Token refresh error:', error)
      logout() // Force logout if refresh fails
      throw error
    }
  }

  const value = {
    user,
    token,
    loading,
    login,
    demoLogin,
    logout,
    getAuthHeaders,
    apiRequest,
    fetchUserProfile,
    isAuthenticated,
    hasRole,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

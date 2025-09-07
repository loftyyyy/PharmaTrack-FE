// Utility function to decode JWT token (client-side only for display purposes)
export const parseJwt = (token) => {
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

// Check if JWT token is expired
export const isTokenExpired = (token) => {
  if (!token) return true
  
  try {
    const decoded = parseJwt(token)
    if (!decoded || !decoded.exp) return true
    
    const currentTime = Math.floor(Date.now() / 1000)
    return decoded.exp < currentTime
  } catch (error) {
    console.error('Error checking token expiry:', error)
    return true
  }
}

// Get time until token expires (in seconds)
export const getTokenTimeUntilExpiry = (token) => {
  if (!token) return 0
  
  try {
    const decoded = parseJwt(token)
    if (!decoded || !decoded.exp) return 0
    
    const currentTime = Math.floor(Date.now() / 1000)
    return Math.max(0, decoded.exp - currentTime)
  } catch (error) {
    console.error('Error getting token expiry time:', error)
    return 0
  }
}

// Check if token will expire within specified minutes
export const isTokenExpiringSoon = (token, minutesThreshold = 5) => {
  const timeUntilExpiry = getTokenTimeUntilExpiry(token)
  return timeUntilExpiry > 0 && timeUntilExpiry <= (minutesThreshold * 60)
}
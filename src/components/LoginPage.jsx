import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { auth as authService } from '../services/api'

const LoginPage = ({ isDarkMode, isSystemTheme, toggleDarkMode }) => {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  
  // Use localStorage to persist error across re-renders
  const [error, setError] = useState(() => {
    const savedError = localStorage.getItem('pharma_login_error')
    return savedError || ''
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState({ success: '', error: '' })
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false)
  
  // Persist error to localStorage whenever it changes
  useEffect(() => {
    if (error) {
      localStorage.setItem('pharma_login_error', error)
    } else {
      localStorage.removeItem('pharma_login_error')
    }
  }, [error])
  
  // Clear error when component unmounts
  useEffect(() => {
    return () => {
      localStorage.removeItem('pharma_login_error')
    }
  }, [])
  
  // Function to clear error (when user starts typing)
  const clearError = () => {
    setError('')
    localStorage.removeItem('pharma_login_error')
  }

  const getForgotPasswordErrorMessage = (message) => {
    if (!message) {
      return 'Unable to start the reset process. Please try again.'
    }

    const lower = message.toLowerCase()

    if (lower.includes('not found')) {
      return 'We could not find an account with that email address.'
    }

    if (lower.includes('invalid')) {
      return 'Please enter a valid email address.'
    }

    if (lower.includes('network') || lower.includes('fetch') || lower.includes('timeout')) {
      return 'Unable to reach the server. Please check your connection and try again.'
    }

    return 'Unable to send reset instructions. Please try again in a moment.'
  }

  const handleForgotPasswordClick = () => {
    setShowForgotPassword(true)
    setForgotStatus({ success: '', error: '' })
    setForgotEmail(formData.username || '')
  }

  const handleForgotPasswordClose = () => {
    setShowForgotPassword(false)
    setForgotStatus({ success: '', error: '' })
    setForgotEmail('')
  }

  const handleForgotPasswordSubmit = async () => {
    if (!forgotEmail || !forgotEmail.trim()) {
      setForgotStatus({
        success: '',
        error: 'Please enter the email associated with your account.'
      })
      return
    }

    setIsForgotSubmitting(true)
    setForgotStatus({ success: '', error: '' })

    try {
      await authService.forgotPassword(forgotEmail.trim())
      setForgotStatus({
        success: 'If an account exists for that email, we just sent password reset instructions.',
        error: ''
      })
    } catch (err) {
      const friendly = getForgotPasswordErrorMessage(err?.message)
      setForgotStatus({ success: '', error: friendly })
    } finally {
      setIsForgotSubmitting(false)
    }
  }

  // Handle form submission for real login
  const handleSubmit = async (e) => {
    // Prevent default form submission
    e.preventDefault()
    e.stopPropagation()
    
    // Clear any existing error and set submitting state
    clearError()
    setIsSubmitting(true)

    try {
      const result = await login(formData.username, formData.password)
      
      if (!result || !result.success) {
        // Convert technical errors to user-friendly messages
        const errorMessage = result?.error || 'Login failed - no error message received'
        const friendlyError = getFriendlyErrorMessage(errorMessage)
        
        // Set error immediately and persist it
        setError(friendlyError)
        localStorage.setItem('pharma_login_error', friendlyError)
        
        return false
      } else {
        clearError()
      }
    } catch (err) {
      const friendlyError = getFriendlyErrorMessage(err?.message || 'An unexpected error occurred')
      
      // Set error immediately and persist it
      setError(friendlyError)
      localStorage.setItem('pharma_login_error', friendlyError)
      
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Convert technical error messages to user-friendly ones
  const getFriendlyErrorMessage = (error) => {
    if (!error) return 'Something went wrong. Please try again.'
    
    const errorStr = error.toLowerCase()
    
    // Handle prefixed error types from AuthContext
    if (errorStr.startsWith('network_error:')) {
      return '🌐 Unable to connect to the server. Please check if the backend server is running and try again.'
    }
    
    if (errorStr.startsWith('server_error:')) {
      return '🔧 Server is temporarily unavailable. Please try again in a few minutes.'
    }
    
    if (errorStr.startsWith('auth_error:')) {
      return '🔐 Invalid username or password. Please check your credentials and try again.'
    }
    
    // Spring Boot specific errors - check FIRST before generic server errors
    if (errorStr.includes('bad credentials') || errorStr.includes('badcredentialsexception')) {
      return '🔐 Invalid username or password. Please try again.'
    }
    
    // Authentication-related errors - check before server errors
    if (errorStr.includes('unauthorized') || errorStr.includes('401')) {
      return '🔐 Invalid username or password. Please check your credentials and try again.'
    }
    
    if (errorStr.includes('forbidden') || errorStr.includes('403')) {
      return '🚫 Access denied. Please contact your administrator.'
    }
    
    // Login specific errors
    if (errorStr.includes('login failed') || errorStr.includes('authentication failed')) {
      return '🔐 Invalid username or password. Please try again.'
    }
    
    if (errorStr.includes('invalid credentials')) {
      return '🔐 Invalid username or password. Please try again.'
    }
    
    // Network/Connection errors
    if (errorStr.includes('network') || errorStr.includes('fetch') || errorStr.includes('failed to fetch')) {
      return '🌐 Unable to connect to the server. Please check your internet connection and try again.'
    }
    
    // Server errors (check after authentication errors)
    if (errorStr.includes('500') || errorStr.includes('internal server error')) {
      return '🔧 Server is temporarily unavailable. Please try again in a few minutes.'
    }
    
    if (errorStr.includes('503') || errorStr.includes('service unavailable')) {
      return '🔧 Service is temporarily down for maintenance. Please try again later.'
    }
    
    // Validation errors
    if (errorStr.includes('bad request') || errorStr.includes('400')) {
      return '📝 Please check your username and password format.'
    }
    
    // Timeout errors
    if (errorStr.includes('timeout')) {
      return '⏱️ Request took too long. Please check your connection and try again.'
    }
    
    // CORS errors
    if (errorStr.includes('cors') || errorStr.includes('cross-origin')) {
      return '🌐 Connection issue. Please refresh the page and try again.'
    }
    
    // JWT/Token errors
    if (errorStr.includes('jwt') || errorStr.includes('token')) {
      return '🔐 Authentication error. Please try logging in again.'
    }
    

    
    // Handle NullPointerException when user is not found
    if (errorStr.includes('nullpointerexception') || errorStr.includes('cannot invoke') || 
        (errorStr.includes('null') && errorStr.includes('user'))) {
      return '🔐 Invalid username or password. Please try again.'
    }
    
    if (errorStr.includes('user not found')) {
      return '👤 Username not found. Please check your username or contact support.'
    }
    
    if (errorStr.includes('account locked') || errorStr.includes('locked')) {
      return '🔒 Your account has been locked. Please contact support for assistance.'
    }
    
    if (errorStr.includes('account disabled') || errorStr.includes('disabled')) {
      return '🚫 Your account is disabled. Please contact support for assistance.'
    }
    
    // Default fallback for any other error
    return '❌ Unable to sign in. Please check your credentials and try again.'
  }


  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-pharma-light bg-gray-50'
    }`}>
      <div className={`max-w-md w-full mx-4 p-8 rounded-xl shadow-2xl transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-pharma-teal to-pharma-medium rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2h2V6h5v5h2v2h-2v5H11v-2H9v2H4v-5H2v-2h2V6zm5 5H7v2h2v-2z"/>
            </svg>
          </div>
          <h1 className={`text-3xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>PharmaTrack</h1>
          <p className={`text-sm mt-2 transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Inventory Management System</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className={`mb-4 p-4 rounded-lg border-l-4 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-red-900/10 border-red-500/50 border-l-red-500' 
              : 'bg-red-50 border-red-200 border-l-red-500'
          }`}>
            <div className="flex items-start">
              <svg className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                isDarkMode ? 'text-red-400' : 'text-red-500'
              }`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <div>
                <h4 className={`text-sm font-medium ${
                  isDarkMode ? 'text-red-300' : 'text-red-800'
                }`}>
                  Sign In Error
                </h4>
                <p className={`text-sm mt-1 ${
                  isDarkMode ? 'text-red-400' : 'text-red-700'
                }`}>
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Username
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => {
                setFormData({ ...formData, username: e.target.value })
                if (error) clearError()
              }}
              className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
              }`}
              placeholder="Enter your username"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value })
                  if (error) clearError()
                }}
                className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
                }`}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 right-0 pr-3 flex items-center transition-colors duration-200 ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-gray-300' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                disabled={isSubmitting}
              >
                {showPassword ? (
                  // Eye Slash Icon (Hide Password)
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                  </svg>
                ) : (
                  // Eye Icon (Show Password)
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input type="checkbox" className="w-4 h-4 text-pharma-teal bg-gray-100 border-gray-300 rounded focus:ring-pharma-medium focus:ring-2" />
              <span className={`ml-2 text-sm transition-colors duration-200 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPasswordClick}
              className="text-sm text-pharma-teal hover:text-pharma-medium transition-colors duration-200"
            >
              Forgot password?
            </button>
          </div>

          {showForgotPassword && (
            <div className={`p-4 rounded-lg border transition-colors duration-200 ${
              isDarkMode
                ? 'bg-gray-800/80 border-gray-700'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-800'
                  }`}>
                    Reset your password
                  </p>
                  <p className={`text-xs mt-1 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Enter the email associated with your account and we will send reset instructions.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPasswordClose}
                  className={`p-1 rounded transition-colors duration-200 ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/60'
                  }`}
                  aria-label="Close password reset panel"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 011.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                  </svg>
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <label className={`block text-xs font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => {
                      setForgotEmail(e.target.value)
                      if (forgotStatus.error) {
                        setForgotStatus((prev) => ({ ...prev, error: '' }))
                      }
                    }}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
                    }`}
                    placeholder="you@example.com"
                    disabled={isForgotSubmitting}
                  />
                </div>

                {forgotStatus.error && (
                  <div className={`p-3 rounded-lg text-xs ${
                    isDarkMode ? 'bg-red-900/20 text-red-300 border border-red-500/40' : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {forgotStatus.error}
                  </div>
                )}

                {forgotStatus.success && (
                  <div className={`p-3 rounded-lg text-xs ${
                    isDarkMode ? 'bg-green-900/20 text-green-300 border border-green-500/40' : 'bg-green-50 text-green-700 border border-green-200'
                  }`}>
                    {forgotStatus.success}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleForgotPasswordSubmit}
                  disabled={isForgotSubmitting}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    isForgotSubmitting
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:from-pharma-medium hover:to-pharma-teal hover:shadow-lg'
                  }`}
                >
                  {isForgotSubmitting ? 'Sending reset link...' : 'Send reset link'}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
             <button
               type="submit"
               disabled={isSubmitting}
               className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 shadow-lg border-2 ${
                 isSubmitting
                   ? 'bg-gray-400 border-gray-400 cursor-not-allowed text-gray-600'
                   : isDarkMode
                     ? 'bg-gradient-to-r from-pharma-teal to-pharma-medium text-white border-pharma-teal hover:from-pharma-medium hover:to-pharma-teal hover:border-pharma-medium transform hover:scale-105 hover:shadow-xl hover:shadow-pharma-teal/25'
                     : 'bg-gradient-to-r from-pharma-teal to-pharma-medium text-white border-pharma-teal hover:from-pharma-medium hover:to-pharma-teal hover:border-pharma-medium transform hover:scale-105 hover:shadow-xl hover:shadow-pharma-teal/25'
               }`}
             >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

          </div>
        </form>


        {/* Theme Toggle for Login Page */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-lg transition-colors duration-200 relative ${
              isDarkMode 
                ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={
              isSystemTheme 
                ? `Following system theme (${isDarkMode ? 'Dark' : 'Light'}). Click to override.`
                : isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'
            }
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
              </svg>
            )}
            {isSystemTheme && (
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage

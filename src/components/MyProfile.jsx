import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../utils/config'

const MyProfile = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [formData, setFormData] = useState({
    username: '',
    currentPassword: '',
    password: '',
    email: ''
  })
  const [originalData, setOriginalData] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [errors, setErrors] = useState({})

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      const initialData = {
        username: user.username || '',
        currentPassword: '',
        password: '',
        email: user.email || ''
      }
      setFormData(initialData)
      setOriginalData({
        username: user.username || '',
        email: user.email || ''
      })
    }
  }, [user])

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    // Clear specific field error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
    
    // Clear messages when user starts editing
    if (message.text) {
      setMessage({ type: '', text: '' })
    }
  }

  // Validate form data
  const validateForm = () => {
    const newErrors = {}

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required'
    }

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = 'Current password is required to verify your identity'
    }

    // Only validate new password if user wants to change it
    if (formData.password.trim() && formData.password.length < 8) {
      newErrors.password = 'New password must be at least 8 characters'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setMessage({ type: '', text: '' })

    try {
      console.log('Making API request to update user:', user.id)
      console.log('Using apiRequest from AuthContext')
      
      // Use the apiRequest function from AuthContext which handles auth and routing
      const response = await apiRequest(`/api/v1/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          currentPassword: formData.currentPassword,
          ...(formData.password.trim() && { password: formData.password }),
          email: formData.email
        })
      })

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: 'Profile updated successfully!' 
        })
        
        // Update original data to reflect changes
        setOriginalData({
          username: formData.username,
          email: formData.email
        })
        
        // Clear password field after successful update
        setFormData(prev => ({
          ...prev,
          password: ''
        }))
      } else {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to update profile. Please try again.' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if form has changes
  const hasChanges = () => {
    return formData.username !== originalData.username ||
           formData.email !== originalData.email ||
           formData.password.trim() !== ''
  }

  // Format user role for display
  const formatRole = (role, roleName) => {
    if (roleName) return roleName
    if (typeof role === 'string') return role
    if (typeof role === 'object' && role.name) return role.name
    return 'USER'
  }

  // Get user position based on role
  const getUserPosition = (role, roleName) => {
    const roleStr = formatRole(role, roleName).toUpperCase()
    return roleStr === 'ADMIN' ? 'Pharmacist' : 'Staff Member'
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return 'Unknown'
    }
  }

  // Format date without time
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'Unknown'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (error) {
      return 'Unknown'
    }
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Loading profile...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          My Profile
        </h1>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Manage your account settings and personal information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info Card */}
        <div className={`lg:col-span-1 p-6 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <div className="text-center">
            {/* Profile Avatar */}
            <div className={`w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center ${
              isDarkMode 
                ? 'bg-gray-800' 
                : 'bg-pharma-dark'
            }`}>
              <span className={`text-2xl font-bold ${
                isDarkMode 
                  ? 'text-white drop-shadow-sm' 
                  : 'text-white drop-shadow-lg'
              }`}>
                {user.name ? 
                  user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
                  user.username?.substring(0, 2).toUpperCase() || 'U'
                }
              </span>
            </div>
            
            {/* User Info */}
            <h3 className={`text-xl font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {user.name || user.username}
            </h3>
            <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {getUserPosition(user.role, user.roleName)} • {formatRole(user.role, user.roleName)}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              Member since {formatDate(user.createdAt)}
            </p>
          </div>
          
          {/* Account Stats */}
          <div className={`mt-6 pt-6 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Account ID
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  #{user.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Created
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatDateOnly(user.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last Updated
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatDateOnly(user.updatedAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Last Login
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatDateOnly(user.lastLogin)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Form */}
        <div className={`lg:col-span-2 p-6 rounded-lg border ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h2 className={`text-xl font-semibold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Edit Profile
          </h2>

          {/* Success/Error Messages */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg border-l-4 ${
              message.type === 'success'
                ? isDarkMode
                  ? 'bg-green-900/10 border-green-500/50 border-l-green-500'
                  : 'bg-green-50 border-green-200 border-l-green-500'
                : isDarkMode
                  ? 'bg-red-900/10 border-red-500/50 border-l-red-500'
                  : 'bg-red-50 border-red-200 border-l-red-500'
            }`}>
              <div className="flex items-start">
                <svg className={`w-5 h-5 mt-0.5 mr-3 flex-shrink-0 ${
                  message.type === 'success'
                    ? isDarkMode ? 'text-green-400' : 'text-green-500'
                    : isDarkMode ? 'text-red-400' : 'text-red-500'
                }`} fill="currentColor" viewBox="0 0 20 20">
                  {message.type === 'success' ? (
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  ) : (
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  )}
                </svg>
                <div>
                  <p className={`text-sm ${
                    message.type === 'success'
                      ? isDarkMode ? 'text-green-300' : 'text-green-800'
                      : isDarkMode ? 'text-red-300' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  errors.username
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
                }`}
                placeholder="Enter your username"
                disabled={isSubmitting}
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-500">{errors.username}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  errors.email
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
                }`}
                placeholder="Enter your email address"
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Current Password Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Current Password *
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  errors.currentPassword
                    ? 'border-red-500 focus:border-red-500'
                    : isDarkMode 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
                }`}
                placeholder="Enter your current password to verify"
                disabled={isSubmitting}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>
              )}
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Required to verify your identity before making changes
              </p>
            </div>

            {/* New Password Field */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                New Password (Optional)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 pr-12 rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    errors.password
                      ? 'border-red-500 focus:border-red-500'
                      : isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-pharma-medium' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-pharma-medium'
                  }`}
                  placeholder="Leave blank to keep current password"
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
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
              <p className={`mt-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Only fill this if you want to change your password. Must be at least 8 characters if provided.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    username: originalData.username,
                    email: originalData.email,
                    currentPassword: '',
                    password: ''
                  })
                  setErrors({})
                  setMessage({ type: '', text: '' })
                }}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
                disabled={isSubmitting || !hasChanges()}
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !hasChanges()}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isSubmitting || !hasChanges()
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:from-pharma-medium hover:to-pharma-teal shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </div>
                ) : (
                  'Update Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default MyProfile

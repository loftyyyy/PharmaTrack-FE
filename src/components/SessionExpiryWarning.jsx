import React from 'react'
import { useAuth } from '../context/AuthContext'

const SessionExpiryWarning = () => {
  const { showExpiryWarning, dismissExpiryWarning, logout } = useAuth()

  if (!showExpiryWarning) return null

  const handleLogout = () => {
    logout()
  }

  const handleRefresh = () => {
    // Refresh the page to potentially get a new token
    window.location.reload()
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 px-4 py-3 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">
            Your session will expire soon. Please save your work and refresh the page or log in again.
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleRefresh}
            className="bg-yellow-600 hover:bg-yellow-700 text-yellow-100 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            Logout
          </button>
          <button
            onClick={dismissExpiryWarning}
            className="text-yellow-800 hover:text-yellow-900 px-2 py-1 text-sm font-medium"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionExpiryWarning

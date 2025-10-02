import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import usersApi from '../services/usersApi'
import ErrorDisplay from '../components/ErrorDisplay'

const UsersPage = ({ isDarkMode }) => {
  const { isAuthenticated, user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [showUserModal, setShowUserModal] = useState(false)

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      setError(null)
      setLoadingError(null)
      const data = await usersApi.getAll()
      console.log('📥 Users data:', data)
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setLoadingError(error)
      setUsers([])
      
      // Check if it's a permission error
      if (error.message.includes('403') || error.message.includes('Access denied')) {
        setError('You need ADMIN role to access user management. Please contact your administrator.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    // Only load data if user is authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping users load')
      return
    }
    fetchUsers()
  }, [isAuthenticated])

  // Handle user click
  const handleUserClick = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  // Check if selected user is the current user
  const isCurrentUser = (user) => {
    if (!currentUser || !user) return false
    return currentUser.id === user.id || currentUser.username === user.username
  }

  // Handle update button click - redirect to profile page
  const handleUpdateProfile = () => {
    setShowUserModal(false)
    setSelectedUser(null)
    // Navigate to profile page
    window.location.href = '/profile'
  }

  // Format date from backend (handles both array and string formats)
  const formatDate = (dateValue) => {
    if (Array.isArray(dateValue)) {
      // Backend returns [year, month, day, hour, minute, second] format
      const [year, month, day, hour = 0, minute = 0, second = 0] = dateValue
      return new Date(year, month - 1, day, hour, minute, second).toLocaleString()
    } else if (dateValue) {
      // Frontend expects string format
      return new Date(dateValue).toLocaleString()
    }
    return 'N/A'
  }

  // Get role display name
  const getRoleDisplayName = (role) => {
    if (!role) return 'Unknown Role'
    return role.name || role.roleName || 'Unknown Role'
  }

  // Get role color
  const getRoleColor = (role) => {
    const roleName = getRoleDisplayName(role).toLowerCase()
    if (roleName.includes('admin')) return 'bg-red-100 text-red-800'
    if (roleName.includes('manager')) return 'bg-blue-100 text-blue-800'
    if (roleName.includes('employee')) return 'bg-green-100 text-green-800'
    if (roleName.includes('user')) return 'bg-gray-100 text-gray-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading users...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View and manage system users
          </p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading || refreshing}
          className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
            loading || refreshing
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:shadow-lg'
          } ${
            isDarkMode
              ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className={`w-5 h-5 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Error Display */}
      <ErrorDisplay 
        error={loadingError} 
        onDismiss={() => setLoadingError(null)}
        isDarkMode={isDarkMode}
      />

      <ErrorDisplay 
        error={error ? { message: error } : null} 
        onDismiss={() => setError(null)}
        isDarkMode={isDarkMode}
      />

      {/* Users Grid */}
      {users.length === 0 && !loading ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">No users found</h3>
          <p className="text-sm">No users are currently registered in the system.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div 
              key={user.id} 
              className={`rounded-lg border p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => handleUserClick(user)}
            >
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {getRoleDisplayName(user.role)}
                  </span>
                </div>
                
                <p className={`text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
                
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Created:</span> {formatDate(user.createdAt)}
                </p>
              </div>

              <div className="flex items-center text-sm text-pharma-teal">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                Click to view details
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">User Details</h2>
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isDarkMode
                    ? 'hover:bg-gray-700 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center space-x-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                }`}>
                  {selectedUser.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.username}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedUser.email}
                  </p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="flex items-center space-x-2">
                <span className="font-medium">Role:</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(selectedUser.role)}`}>
                  {getRoleDisplayName(selectedUser.role)}
                </span>
              </div>

              {/* User ID */}
              <div className="flex items-center space-x-2">
                <span className="font-medium">User ID:</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedUser.id}
                </span>
              </div>

              {/* Created Date */}
              <div className="flex items-center space-x-2">
                <span className="font-medium">Created:</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(selectedUser.createdAt)}
                </span>
              </div>

              {/* Updated Date */}
              <div className="flex items-center space-x-2">
                <span className="font-medium">Last Updated:</span>
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {formatDate(selectedUser.updatedAt)}
                </span>
              </div>

              {/* Role Details */}
              {selectedUser.role && (
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <h4 className="font-medium mb-2">Role Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Role ID:</span>
                      <span>{selectedUser.role.id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Role Name:</span>
                      <span>{getRoleDisplayName(selectedUser.role)}</span>
                    </div>
                    {selectedUser.role.description && (
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Description:</span>
                        <span>{selectedUser.role.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              {isCurrentUser(selectedUser) && (
                <button
                  onClick={handleUpdateProfile}
                  className="px-4 py-2 rounded-lg font-medium transition-colors bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Update Profile
                </button>
              )}
              <button
                onClick={() => {
                  setShowUserModal(false)
                  setSelectedUser(null)
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UsersPage
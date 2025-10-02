import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import rolesApi from '../services/rolesApi'
import ErrorDisplay from '../components/ErrorDisplay'

const RolesPage = ({ isDarkMode }) => {
  const { isAuthenticated } = useAuth()
  const [roles, setRoles] = useState([])
  const [roleUserCounts, setRoleUserCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [loadingError, setLoadingError] = useState(null)

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      setError(null)
      setLoadingError(null)
      const data = await rolesApi.getAll()
      console.log('📥 Roles data:', data)
      const rolesArray = Array.isArray(data) ? data : []
      setRoles(rolesArray)
      
      // Fetch user counts for each role
      const userCounts = {}
      for (const role of rolesArray) {
        try {
          const count = await rolesApi.getUserCount(role.id)
          userCounts[role.id] = count
        } catch (countError) {
          console.warn(`Failed to fetch user count for role ${role.id}:`, countError)
          userCounts[role.id] = 0
        }
      }
      setRoleUserCounts(userCounts)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      setLoadingError(error)
      setRoles([])
      setRoleUserCounts({})
      
      // Check if it's a permission error
      if (error.message.includes('403') || error.message.includes('Access denied')) {
        setError('You need ADMIN role to access role management. Please contact your administrator.')
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
      console.log('User not authenticated, skipping roles load')
      return
    }
    fetchRoles()
  }, [isAuthenticated])

  // Handle refresh button click
  const handleRefresh = () => {
    fetchRoles()
  }


  // Loading state
  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading roles...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pharma-teal mb-2">Roles Management</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              View and manage system roles
            </p>
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              refreshing
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <svg
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {(error || loadingError) && (
        <div className="mb-6">
          <ErrorDisplay
            error={error || loadingError}
            onDismiss={() => {
              setError(null)
              setLoadingError(null)
            }}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      {/* Roles Display */}
      {roles.length > 0 ? (
        <div className="space-y-6">
          {/* Header Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {roles.map((role) => (
              <div
                key={role.id}
                className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                  role.name?.toUpperCase() === 'ADMIN' 
                    ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' 
                    : role.name?.toUpperCase() === 'STAFF'
                    ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : role.name?.toUpperCase() === 'MANAGER'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
                    : 'bg-gradient-to-br from-gray-500 to-gray-600 text-white'
                }`}
              >
                <div className="absolute top-0 right-0 w-20 h-20 opacity-20">
                  <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold">{role.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold">{roleUserCounts[role.id] || 0}</span>
                      </div>
                      <div className="w-6 h-6 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold">#{role.id}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm opacity-90">
{roleUserCounts[role.id] || 0} {roleUserCounts[role.id] === 1 ? 'user' : 'users'} • {role.name?.toUpperCase() === 'ADMIN' 
                      ? 'Full system access and control'
                      : role.name?.toUpperCase() === 'STAFF'
                      ? 'Operational access and management'
                      : role.name?.toUpperCase() === 'MANAGER'
                      ? 'Supervisory and reporting access'
                      : 'Basic user access'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Roles Table */}
          <div className={`rounded-xl shadow-lg overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`px-6 py-4 border-b ${
              isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h2 className={`text-lg font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Role Details
              </h2>
              <p className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Complete overview of all system roles
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Role
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      ID
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Description
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      Users
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${
                  isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
                }`}>
                  {roles.map((role) => (
                    <tr key={role.id} className={`transition-colors duration-200 hover:${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-3 ${
                            role.name?.toUpperCase() === 'ADMIN' ? 'bg-red-500' :
                            role.name?.toUpperCase() === 'STAFF' ? 'bg-blue-500' :
                            role.name?.toUpperCase() === 'MANAGER' ? 'bg-purple-500' :
                            'bg-gray-500'
                          }`}></div>
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {role.name}
                          </div>
                        </div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        #{role.id}
                      </td>
                      <td className={`px-6 py-4 text-sm ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {role.name?.toUpperCase() === 'ADMIN' 
                          ? 'Complete system administration and control'
                          : role.name?.toUpperCase() === 'STAFF'
                          ? 'Day-to-day operations and inventory management'
                          : role.name?.toUpperCase() === 'MANAGER'
                          ? 'Team supervision and reporting oversight'
                          : 'Basic user access and limited functionality'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            role.name?.toUpperCase() === 'ADMIN' 
                              ? 'bg-red-100 text-red-800'
                              : role.name?.toUpperCase() === 'STAFF'
                              ? 'bg-blue-100 text-blue-800'
                              : role.name?.toUpperCase() === 'MANAGER'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {roleUserCounts[role.id] || 0}
                          </div>
                          <span className={`ml-2 text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-500'
                          }`}>
                            {roleUserCounts[role.id] === 1 ? 'user' : 'users'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 mb-4 flex items-center justify-center">
            <svg
              className={`w-16 h-16 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-900'
          }`}>
            No roles found
          </h3>
          <p className={`text-sm ${
            isDarkMode ? 'text-gray-500' : 'text-gray-600'
          }`}>
            There are no roles available in the system.
          </p>
        </div>
      )}

      {/* Stats */}
      {roles.length > 0 && (
        <div className="mt-8">
          <div className={`rounded-xl p-6 shadow-lg ${
            isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  System Overview
                </h4>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {roles.length} role{roles.length !== 1 ? 's' : ''} configured in the system
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className={`text-3xl font-bold ${
                    isDarkMode ? 'text-pharma-teal' : 'text-pharma-teal'
                  }`}>
                    {roles.length}
                  </div>
                  <div className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Total Roles
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${isDarkMode ? 'text-pharma-teal' : 'text-pharma-teal'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RolesPage

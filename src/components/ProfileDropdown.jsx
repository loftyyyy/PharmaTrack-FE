import React from 'react'

const ProfileDropdown = ({ isDarkMode, showProfileDropdown, setShowProfileDropdown, onLogout, user, onNavigate }) => {
  // Safety check to prevent crashes
  if (!user) {
    console.warn('ProfileDropdown: No user data provided')
    return (
      <div className="relative">
        <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${
          isDarkMode 
            ? 'bg-gradient-to-br from-pharma-medium to-pharma-teal border-pharma-light/20' 
            : 'bg-gradient-to-br from-pharma-teal to-pharma-medium border-pharma-teal/30'
        }`}>
          <span className="text-white text-sm font-bold">?</span>
        </button>
      </div>
    )
  }
  // Helper function to get user initials
  const getUserInitials = (name, username) => {
    if (name && name.trim()) {
      const nameParts = name.trim().split(' ')
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
      }
      return nameParts[0].substring(0, 2).toUpperCase()
    }
    if (username) {
      return username.substring(0, 2).toUpperCase()
    }
    return 'U'
  }

  // Helper function to format last login time
  const formatLastLogin = (lastLogin) => {
    if (!lastLogin) return 'Recently'
    
    try {
      const loginDate = new Date(lastLogin)
      const now = new Date()
      const diffMs = now - loginDate
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} min ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays === 1) return 'Yesterday'
      if (diffDays < 7) return `${diffDays} days ago`
      
      return loginDate.toLocaleDateString()
    } catch (error) {
      return 'Recently'
    }
  }

  // Helper function to get user position/title based on role
  const getUserPosition = (role) => {
    try {
      // Handle null, undefined, or non-string values
      if (!role) return 'Staff Member'
      
      // Extract role string from different formats
      let roleStr = ''
      if (typeof role === 'string') {
        roleStr = role
      } else if (typeof role === 'object') {
        // Handle Role entity object {id, name} from backend
        roleStr = role.name || role.roleName || role.toString()
      } else {
        roleStr = String(role)
      }
      
      // Safely convert to uppercase
      const upperRole = roleStr.toUpperCase()
      
      switch (upperRole) {
        case 'ADMIN':
        case 'ADMINISTRATOR':
          return 'Pharmacist' // Admin is automatically a pharmacist
        default:
          return 'Staff Member' // Everyone else is staff member
      }
    } catch (error) {
      console.error('Error in getUserPosition:', error, 'role:', role)
      return 'Staff Member' // Safe fallback
    }
  }

  // Debug logging to see what user data we're receiving (using useEffect to avoid render issues)
  React.useEffect(() => {
    console.log('=== PROFILE DROPDOWN DEBUG ===')
    console.log('ProfileDropdown received user:', user)
    console.log('user.role:', user?.role)
    console.log('user.role type:', typeof user?.role)
    console.log('user.roleName:', user?.roleName)
    console.log('user.roleName type:', typeof user?.roleName)
  }, [user])

  // Helper function to extract role string safely
  const getRoleString = (role, roleName) => {
    // First try the roleName field
    if (roleName) return roleName
    // Then try role.name if it's an object
    if (typeof role === 'object' && role?.name) return role.name
    // Then try if role is already a string
    if (typeof role === 'string') return role
    // Finally try other possible fields
    if (typeof role === 'object' && role?.roleName) return role.roleName
    return 'USER'
  }

  // Process user data with fallbacks
  const displayUser = user ? {
    name: user.name || user.username || 'User',
    username: user.username || 'user',
    position: getUserPosition(user.role || user.roleName),
    role: getRoleString(user.role, user.roleName),
    email: user.email || user.username || '',
    lastLogin: formatLastLogin(user.lastLogin),
    initials: getUserInitials(user.name, user.username)
  } : {
    name: 'Guest User',
    username: 'guest',
    position: 'Guest',
    role: 'GUEST',
    email: '',
    lastLogin: 'Never',
    initials: 'GU'
  }

  // Debug logging for displayUser (using useEffect to avoid render issues)
  React.useEffect(() => {
    console.log('=== PROFILE DISPLAY USER ===')
    console.log('displayUser object:', displayUser)
    console.log('displayUser.role:', displayUser.role)
    console.log('displayUser.position:', displayUser.position)
    console.log('getUserPosition called with:', user?.role || user?.roleName, '-> result:', displayUser.position)
  }, [displayUser, user])
  return (
    <div className="relative">
      <div className="group relative">
        <button 
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-105 border-2 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-pharma-medium to-pharma-teal border-pharma-light/20 hover:border-pharma-light/40' 
              : 'bg-gradient-to-br from-pharma-teal to-pharma-medium border-pharma-teal/30 hover:border-pharma-teal/50'
          }`}>
          <span className="text-white text-sm font-bold drop-shadow-sm">{displayUser.initials}</span>
        </button>
        
        {/* Hover Tooltip - only shows when dropdown is closed */}
        {!showProfileDropdown && (
          <div className={`absolute right-0 top-12 w-48 rounded-lg shadow-xl border opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 pointer-events-none z-40 ${
            isDarkMode 
              ? 'bg-gray-800 border-gray-600' 
              : 'bg-white border-gray-300 shadow-lg'
          }`}>
            <div className="p-3">
              <div className="flex items-center space-x-3 mb-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-pharma-teal to-pharma-medium`}>
                  <span className="text-white text-xs font-bold">{displayUser.initials}</span>
                </div>
                <div>
                                              <p className={`text-sm font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>{displayUser.name}</p>
                            <p className={`text-xs ${
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>{displayUser.position}</p>
                </div>
              </div>
              <div className={`text-xs border-t pt-2 ${
                isDarkMode ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'
              }`}>
                <p>Last login: {displayUser.lastLogin}</p>
                <p>Role: {displayUser.role}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Dropdown Menu */}
      {showProfileDropdown && (
        <div className={`absolute right-0 top-12 w-64 rounded-lg shadow-xl border z-50 transition-all duration-200 ${
          isDarkMode 
            ? 'bg-gray-800 border-gray-600' 
            : 'bg-white border-gray-300'
        }`}>
          {/* User Info Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-pharma-teal to-pharma-medium`}>
                <span className="text-white font-bold">{displayUser.initials}</span>
              </div>
              <div>
                                  <p className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{displayUser.name}</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{displayUser.position} • {displayUser.role}</p>
                  {displayUser.email && (
                    <p className={`text-xs ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-500'
                    }`}>{displayUser.email}</p>
                  )}
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>Last login: {displayUser.lastLogin}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button 
              onClick={() => {
                onNavigate?.('My Profile')
                setShowProfileDropdown(false)
              }}
              className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200 ${
                isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path>
              </svg>
              <span>My Profile</span>
            </button>
            
            <button className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
            }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"></path>
              </svg>
              <span>Settings</span>
            </button>

            <button className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700'
            }`}>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
              </svg>
              <span>Help & Support</span>
            </button>

            <div className={`border-t my-2 ${
              isDarkMode ? 'border-gray-600' : 'border-gray-200'
            }`}></div>

            <button 
              onClick={() => {
                onLogout()
                setShowProfileDropdown(false)
              }}
              className={`w-full px-4 py-3 text-left flex items-center space-x-3 transition-colors duration-200 ${
                isDarkMode ? 'hover:bg-red-900/20 text-red-400' : 'hover:bg-red-50 text-red-600'
              }`}
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path>
              </svg>
              <span>Sign Out</span>
            </button>
          </div>

          {/* Close button */}
          <button
            onClick={() => setShowProfileDropdown(false)}
            className={`absolute top-2 right-2 p-1 rounded-full transition-colors duration-200 ${
              isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

export default ProfileDropdown

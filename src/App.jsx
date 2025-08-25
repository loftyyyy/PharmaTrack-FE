import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import MyProfile from './components/MyProfile'

// Protected App Component
const ProtectedApp = () => {
  const { user, logout, isAuthenticated } = useAuth()
  
  // Debug logging for user data in App component
  console.log('=== APP COMPONENT USER DATA ===')
  console.log('App component user:', user)
  console.log('App user.role:', user?.role)
  console.log('App user.roleName:', user?.roleName)
  const [activeSection, setActiveSection] = useState('Dashboard')
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  
  // Initialize dark mode based on system preference
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Track if user has manually overridden system preference
  const [isSystemTheme, setIsSystemTheme] = useState(true)

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e) => {
      if (isSystemTheme) {
        setIsDarkMode(e.matches)
      }
    }

    // Add listener for theme changes
    mediaQuery.addEventListener('change', handleChange)

    // Cleanup listener on unmount
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [isSystemTheme])

  // Toggle dark mode manually
  const toggleDarkMode = () => {
    setIsSystemTheme(false)
    setIsDarkMode(!isDarkMode)
  }

  // Notifications state
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Low Stock Alert',
      message: 'Paracetamol 500mg is running low',
      time: '5 minutes ago'
    },
    {
      id: 2,
      title: 'New Order',
      message: 'Order #1234 has been placed',
      time: '10 minutes ago'
    },
    {
      id: 3,
      title: 'System Update',
      message: 'System maintenance scheduled for tonight',
      time: '1 hour ago'
    }
  ])

  // Sidebar items
  const sidebarItems = [
    { 
      name: 'Dashboard', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>
    },
    { 
      name: 'My Profile', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
    },
    { 
      name: 'Inventory', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
    },
    { 
      name: 'Orders', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path></svg>
    },
    { 
      name: 'Suppliers', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    },
    { 
      name: 'Reports', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h2a2 2 0 002-2V3a2 2 0 012 2v6.5l1.707 1.707A1 1 0 0116 16v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 01.293-.707L6 13.5V5z" clipRule="evenodd"></path></svg>
    },
    { 
      name: 'Users', 
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>
    }
  ]

  // Show login page if not authenticated
  if (!isAuthenticated()) {
    return (
      <LoginPage 
        isDarkMode={isDarkMode}
        isSystemTheme={isSystemTheme}
        toggleDarkMode={toggleDarkMode}
      />
    )
  }

  // Render main content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'Dashboard':
        return <Dashboard isDarkMode={isDarkMode} />
      case 'My Profile':
        return <MyProfile isDarkMode={isDarkMode} />
      case 'Inventory':
        return (
          <div className="p-6">
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Inventory Management
            </h1>
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Inventory management features coming soon...
              </p>
            </div>
          </div>
        )
      case 'Orders':
        return (
          <div className="p-6">
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Orders
            </h1>
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Order management features coming soon...
              </p>
            </div>
          </div>
        )
      case 'Suppliers':
        return (
          <div className="p-6">
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Suppliers
            </h1>
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Supplier management features coming soon...
              </p>
            </div>
          </div>
        )
      case 'Reports':
        return (
          <div className="p-6">
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Reports
            </h1>
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                Reporting features coming soon...
              </p>
            </div>
          </div>
        )
      case 'Users':
        return (
          <div className="p-6">
            <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              User Management
            </h1>
            <div className={`p-8 rounded-lg text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                User management features coming soon...
              </p>
            </div>
          </div>
        )
      default:
        return <Dashboard isDarkMode={isDarkMode} />
    }
  }

  return (
    <div className={`flex h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-pharma-light bg-gray-50'}`}>
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar 
          isDarkMode={isDarkMode}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          sidebarItems={sidebarItems}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <Header 
            isDarkMode={isDarkMode}
            isSystemTheme={isSystemTheme}
            toggleDarkMode={toggleDarkMode}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            notifications={notifications}
            setNotifications={setNotifications}
            showProfileDropdown={showProfileDropdown}
            setShowProfileDropdown={setShowProfileDropdown}
            onLogout={logout}
            user={user}
            onNavigate={setActiveSection}
          />

          {/* Main Content Area */}
          <main 
            className={`flex-1 overflow-y-auto scrollbar-hide transition-colors duration-300 ${
              isDarkMode ? 'bg-gray-900' : 'bg-pharma-light bg-gray-50'
            }`}
            style={{
              msOverflowStyle: 'none',
              scrollbarWidth: 'none'
            }}
          >
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  )
}

// Main App Component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  )
}

export default App
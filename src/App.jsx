import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './components/LoginPage'
import Header from './components/Header'
import Sidebar from './components/Sidebar'


// Import page components
import DashboardPage from './pages/DashboardPage'
import ProfilePage from './pages/ProfilePage'
import InventoryPage from './pages/InventoryPage'
import OrdersPage from './pages/OrdersPage'
import SuppliersPage from './pages/SuppliersPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'

// Protected App Component
const ProtectedApp = () => {
  const { user, logout, isAuthenticated, loading } = useAuth()
  
  // Debug logging for user data in App component
  console.log('=== APP COMPONENT USER DATA ===')
  console.log('App component user:', user)
  console.log('App user.role:', user?.role)
  console.log('App user.roleName:', user?.roleName)
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

  // Sidebar items with routing paths
  const sidebarItems = [
    { 
      name: 'Dashboard',
      path: '/dashboard',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>
    },
    { 
      name: 'My Profile',
      path: '/profile',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
    },
    { 
      name: 'Inventory',
      path: '/inventory',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
    },
    { 
      name: 'Orders',
      path: '/orders',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path></svg>
    },
    { 
      name: 'Suppliers',
      path: '/suppliers',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
    },
    { 
      name: 'Reports',
      path: '/reports',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h2a2 2 0 002-2V3a2 2 0 012 2v6.5l1.707 1.707A1 1 0 0116 16v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 01.293-.707L6 13.5V5z" clipRule="evenodd"></path></svg>
    },
    { 
      name: 'Users',
      path: '/users',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>
    }
  ]

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-pharma-light bg-gray-50'
      }`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pharma-teal to-pharma-medium rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2h2V6h5v5h2v2h-2v5H11v-2H9v2H4v-5H2v-2h2V6zm5 5H7v2h2v-2z"/>
            </svg>
          </div>
          <h1 className={`text-2xl font-bold transition-colors duration-200 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>PharmaTrack</h1>
          <p className={`text-sm mt-2 transition-colors duration-200 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>Loading...</p>
        </div>
      </div>
    )
  }

  // Show login page if not authenticated
  const authenticated = isAuthenticated()
  console.log('🔍 App authentication check:', {
    authenticated,
    user: !!user,
    loading,
    userObject: user
  })
  
  if (!authenticated) {
    console.log('🚪 Showing login page - user not authenticated')
    return (
      <LoginPage 
        isDarkMode={isDarkMode}
        isSystemTheme={isSystemTheme}
        toggleDarkMode={toggleDarkMode}
      />
    )
  }

  // Show main app if authenticated
  return (
    <div className={`flex h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-pharma-light bg-gray-50'}`}>
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar 
          isDarkMode={isDarkMode}
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
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage isDarkMode={isDarkMode} />} />
              <Route path="/profile" element={<ProfilePage isDarkMode={isDarkMode} />} />
              <Route path="/inventory" element={<InventoryPage isDarkMode={isDarkMode} />} />
              <Route path="/orders" element={<OrdersPage isDarkMode={isDarkMode} />} />
              <Route path="/suppliers" element={<SuppliersPage isDarkMode={isDarkMode} />} />
              <Route path="/reports" element={<ReportsPage isDarkMode={isDarkMode} />} />
              <Route path="/users" element={<UsersPage isDarkMode={isDarkMode} />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </div>
  )
}

// Main App Component with AuthProvider and Router
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedApp />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
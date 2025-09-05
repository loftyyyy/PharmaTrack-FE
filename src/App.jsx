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

// Import new role-based pages
import AllProductsPage from './pages/AllProductsPage'
import CategoriesPage from './pages/CategoriesPage'
import ProductBatchesPage from './pages/ProductBatchesPage'
import StockLevelsPage from './pages/StockLevelsPage'
import StockAdjustmentsPage from './pages/StockAdjustmentsPage'
import InventoryLogsPage from './pages/InventoryLogsPage'
import PurchasesPage from './pages/PurchasesPage'
import CustomersPage from './pages/CustomersPage'
import SalesPOSPage from './pages/SalesPOSPage'

// Import ProtectedRoute component
import ProtectedRoute from './components/ProtectedRoute'

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
              
              {/* Admin-only routes */}
              
              {/* Products Routes */}
              <Route path="/all-products" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AllProductsPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/categories" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <CategoriesPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/product-batches" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <ProductBatchesPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              
              {/* Inventory Routes */}
              <Route path="/stock-levels" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <StockLevelsPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/stock-adjustments" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <StockAdjustmentsPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/inventory-logs" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <InventoryLogsPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              
              {/* Suppliers Routes */}
              <Route path="/suppliers" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <SuppliersPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/supplier-mapping" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Product-Supplier Mapping</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Manage which suppliers provide which products with CRUD operations.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Purchases Routes */}
              <Route path="/purchases" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <PurchasesPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/purchase-items" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Purchase Items</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Detailed view and management of individual items within purchase orders.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Sales Routes */}
              <Route path="/sales-transactions" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Sales Transactions</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      View, edit, and manage all sales transactions with void/cancel handling.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Users & Roles Routes */}
              <Route path="/users" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <UsersPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/roles" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Roles Management</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Create, edit, and delete user roles with permission management.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Reports Routes */}
              <Route path="/sales-reports" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Sales Reports</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Filter sales reports by date, customer, and payment method.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/purchase-reports" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Purchase Reports</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Filter purchase reports by supplier, status, and date range.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              <Route path="/inventory-reports" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
                    <h1 className="text-2xl font-bold">Inventory Reports</h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Reports for expiring products, low stock alerts, and adjustment logs.
                    </p>
                    <div className="mt-4 p-4 rounded-lg border border-dashed border-gray-300">
                      <p className="text-center text-gray-500">This page is under development.</p>
                    </div>
                  </div>
                </ProtectedRoute>
              } />
              
              {/* Legacy routes for backward compatibility */}
              <Route path="/inventory" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <InventoryPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <OrdersPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/reports" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <ReportsPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              
              {/* Routes accessible by both Admin and Staff */}
              <Route path="/sales-pos" element={
                <ProtectedRoute requiredPermission="pos.access">
                  <SalesPOSPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              <Route path="/customers" element={
                <ProtectedRoute requiredPermission="customers.view">
                  <CustomersPage isDarkMode={isDarkMode} />
                </ProtectedRoute>
              } />
              
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
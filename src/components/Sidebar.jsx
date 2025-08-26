import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin, hasPermission, getUserRole, getRoleDisplayName } from '../utils/roleUtils'

const Sidebar = ({ isDarkMode }) => {
  const location = useLocation()
  const { user } = useAuth()
  const [expandedDropdowns, setExpandedDropdowns] = useState({})

  const toggleDropdown = (key) => {
    setExpandedDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Define navigation structure based on user role
  const getNavigationItems = () => {
    const items = []

    // Dashboard - available to all authenticated users
    items.push({
      name: 'Dashboard',
      path: '/dashboard',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>
    })

    // Admin-only sections
    if (isAdmin(user)) {
      // Products dropdown
      items.push({
        name: 'Products',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>,
        dropdown: true,
        key: 'products',
        children: [
          { name: 'All Products', path: '/all-products' },
          { name: 'Categories', path: '/categories' },
          { name: 'Product Batches', path: '/product-batches' }
        ]
      })

      // Inventory dropdown
      items.push({
        name: 'Inventory',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>,
        dropdown: true,
        key: 'inventory',
        children: [
          { name: 'Stock Levels', path: '/stock-levels' },
          { name: 'Stock Adjustments', path: '/stock-adjustments' },
          { name: 'Inventory Logs', path: '/inventory-logs' }
        ]
      })

      // Suppliers dropdown
      items.push({
        name: 'Suppliers',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>,
        dropdown: true,
        key: 'suppliers',
        children: [
          { name: 'All Suppliers', path: '/suppliers' },
          { name: 'Product-Supplier Mapping', path: '/supplier-mapping' }
        ]
      })

      // Purchases dropdown
      items.push({
        name: 'Purchases',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path></svg>,
        dropdown: true,
        key: 'purchases',
        children: [
          { name: 'Purchase Orders', path: '/purchases' },
          { name: 'Purchase Items', path: '/purchase-items' }
        ]
      })

      // Users & Roles dropdown
      items.push({
        name: 'Users & Roles',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"></path></svg>,
        dropdown: true,
        key: 'users-roles',
        children: [
          { name: 'Users', path: '/users' },
          { name: 'Roles', path: '/roles' }
        ]
      })

      // Reports dropdown
      items.push({
        name: 'Reports',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path><path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a2 2 0 002 2h2a2 2 0 002-2V3a2 2 0 012 2v6.5l1.707 1.707A1 1 0 0116 16v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2a1 1 0 01.293-.707L6 13.5V5z" clipRule="evenodd"></path></svg>,
        dropdown: true,
        key: 'reports',
        children: [
          { name: 'Sales Reports', path: '/sales-reports' },
          { name: 'Purchase Reports', path: '/purchase-reports' },
          { name: 'Inventory Reports', path: '/inventory-reports' }
        ]
      })
    }

    // Sales/POS - available to both admin and staff
    if (hasPermission(user, 'pos.access')) {
      if (isAdmin(user)) {
        items.push({
          name: 'Sales / POS',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8a2 2 0 012 2v2H6V8zM8 8v4h2V8H8zM12 8a2 2 0 012 2v2h-2V8z"></path></svg>,
          dropdown: true,
          key: 'sales',
          children: [
            { name: 'Point of Sale', path: '/sales-pos' },
            { name: 'Sales Transactions', path: '/sales-transactions' }
          ]
        })
      } else {
        items.push({
          name: 'Sales / POS',
          path: '/sales-pos',
          icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zM14 6a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h8zM6 8a2 2 0 012 2v2H6V8zM8 8v4h2V8H8zM12 8a2 2 0 012 2v2h-2V8z"></path></svg>
        })
      }
    }

    // Customers - available to both admin and staff
    if (hasPermission(user, 'customers.view')) {
      items.push({
        name: 'Customers',
        path: '/customers',
        icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
      })
    }

    // Profile - available to all users
    items.push({
      name: 'My Profile',
      path: '/profile',
      icon: <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>
    })

    return items
  }

  const navigationItems = getNavigationItems()

  return (
    <div className={`w-64 text-white shadow-lg flex flex-col border-r transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-pharma-dark bg-slate-800 border-gray-300'
    }`}>
      {/* Logo and Brand */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-pharma-medium to-pharma-teal rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 6h5v2h2V6h5v5h2v2h-2v5H11v-2H9v2H4v-5H2v-2h2V6zm5 5H7v2h2v-2z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold">PharmaTrack</h1>
            <p className="text-xs text-white/60">Inventory Management</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-6 py-3 border-b border-white/10">
          <div className="text-sm">
            <div className="font-medium text-white">{user.name || user.username}</div>
            <div className="text-white/60">{getRoleDisplayName(getUserRole(user)) || 'User'}</div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => (
            <li key={item.name}>
              {item.dropdown ? (
                <div>
                  <button
                    onClick={() => toggleDropdown(item.key)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group text-white/70 hover:bg-white/5 hover:text-white`}
                  >
                    <div className="flex items-center">
                      <span className="mr-3">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        expandedDropdowns[item.key] ? 'rotate-180' : ''
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                  {expandedDropdowns[item.key] && (
                    <ul className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => (
                        <li key={child.name}>
                          <Link
                            to={child.path}
                            className={`block px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
                              location.pathname === child.path
                                ? 'bg-white/10 text-white shadow-sm'
                                : 'text-white/60 hover:bg-white/5 hover:text-white'
                            }`}
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 group ${
                    location.pathname === item.path
                      ? 'bg-white/10 text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="font-medium">{item.name}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="text-center text-white/40 text-xs">
          <p>&copy; 2024 PharmaTrack</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}

export default Sidebar

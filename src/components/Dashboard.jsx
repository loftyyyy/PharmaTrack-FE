import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../utils/roleUtils'

const Dashboard = ({ isDarkMode }) => {
  const { user } = useAuth()
  const userIsAdmin = isAdmin(user)

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Message */}
      <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <h1 className={`text-2xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Welcome back, {user?.name || user?.username}!
        </h1>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {userIsAdmin 
            ? 'You have full administrative access to PharmaTrack.' 
            : 'You have staff access to sales and customer management.'
          }
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Show Total Products only to admins */}
        {userIsAdmin && (
          <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Total Products</p>
                <p className={`text-2xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>2,847</p>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Today */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Revenue Today</p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{userIsAdmin ? '$12,847' : '$847'}</p>
            </div>
          </div>
        </div>

        {/* Show Low Stock Items only to admins */}
        {userIsAdmin && (
          <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.268 16.5C3.498 18.333 4.46 20 6 20z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Low Stock Items</p>
                <p className={`text-2xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>23</p>
              </div>
            </div>
          </div>
        )}

        {/* Customer Interactions for Staff */}
        {!userIsAdmin && (
          <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-indigo-100 dark:bg-indigo-900/20">
                <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                </svg>
              </div>
              <div className="ml-4">
                <p className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Customers Served</p>
                <p className={`text-2xl font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>47</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders/Sales Today */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
              </svg>
            </div>
            <div className="ml-4">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>{userIsAdmin ? 'Orders Today' : 'Sales Today'}</p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{userIsAdmin ? '156' : '32'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Overview - Full Width Row */}
      <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{userIsAdmin ? 'Sales Overview' : 'My Sales Performance'}</h3>
        <div className="h-80 flex items-center justify-center">
          <div className={`text-center ${
            isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <svg className="w-20 h-20 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
            </svg>
            <p className="text-lg">Chart visualization will be here</p>
            {!userIsAdmin && (
              <p className="text-sm mt-2">Track your daily sales performance</p>
            )}
          </div>
        </div>
      </div>

      {/* Analytics and Products - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products / Recent Sales */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{userIsAdmin ? 'Top Selling Products' : 'Recent Sales'}</h3>
          <div className="space-y-4">
            {(userIsAdmin ? [
              { name: 'Paracetamol 500mg', units: '2,847', revenue: '$4,235' },
              { name: 'Amoxicillin 250mg', units: '1,923', revenue: '$3,847' },
              { name: 'Ibuprofen 400mg', units: '1,654', revenue: '$2,976' },
              { name: 'Aspirin 75mg', units: '1,234', revenue: '$1,847' }
            ] : [
              { name: 'Paracetamol 500mg', units: '12', revenue: '$30.00', time: '2 hours ago' },
              { name: 'Vitamin C 1000mg', units: '8', revenue: '$10.00', time: '3 hours ago' },
              { name: 'Ibuprofen 400mg', units: '5', revenue: '$15.00', time: '4 hours ago' },
              { name: 'Cough Syrup', units: '2', revenue: '$24.00', time: '5 hours ago' }
            ]).map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{product.name}</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {userIsAdmin ? `${product.units} units sold` : `${product.units} units • ${product.time}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>{product.revenue}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Analytics */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Revenue Analytics</h3>
          <div className="space-y-6">
            {/* Revenue by Period */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>Today</span>
                <span className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{userIsAdmin ? '$12,847' : '$847'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>This Week</span>
                <span className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{userIsAdmin ? '$89,234' : '$5,234'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>This Month</span>
                <span className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>{userIsAdmin ? '$345,678' : '$23,456'}</span>
              </div>
            </div>
            
            {/* Performance Metrics */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>+12.5%</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>vs Last Month</p>
                </div>
                <div className="text-center">
                  <p className={`text-2xl font-bold ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>{userIsAdmin ? '156' : '32'}</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>Transactions</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Alerts, Quick Actions, and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* System Alerts - Only for Admins */}
        {userIsAdmin && (
          <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>System Alerts</h3>
            <div className="space-y-3">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-red-900/20 border border-red-500/30' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex">
                  <svg className={`w-5 h-5 mt-0.5 mr-3 ${
                    isDarkMode ? 'text-red-400' : 'text-red-500'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                  <div>
                    <p className={`font-medium ${
                      isDarkMode ? 'text-red-300' : 'text-red-800'
                    }`}>Critical Stock Level</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>Paracetamol 500mg is running low (12 units remaining)</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-yellow-900/20 border border-yellow-500/30' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <div className="flex">
                  <svg className={`w-5 h-5 mt-0.5 mr-3 ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  <div>
                    <p className={`font-medium ${
                      isDarkMode ? 'text-yellow-300' : 'text-yellow-800'
                    }`}>Expiry Warning</p>
                    <p className={`text-sm ${
                      isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                    }`}>5 products expiring within 30 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions for Staff */}
        {!userIsAdmin && (
          <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 lg:col-span-2 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Quick Actions</h3>
            <div className="space-y-3">
              <button className={`w-full p-4 rounded-lg text-left transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-pharma-teal/10 border border-pharma-teal/30 hover:bg-pharma-teal/20' 
                  : 'bg-pharma-teal/10 border border-pharma-teal/30 hover:bg-pharma-teal/20'
              }`}>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-pharma-teal mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6"></path>
                  </svg>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      New Sale
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Process a new customer sale
                    </p>
                  </div>
                </div>
              </button>
              
              <button className={`w-full p-4 rounded-lg text-left transition-colors duration-200 ${
                isDarkMode 
                  ? 'bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20' 
                  : 'bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20'
              }`}>
                <div className="flex items-center">
                  <svg className="w-6 h-6 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <div>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Add Customer
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Register a new customer
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          userIsAdmin ? 'lg:col-span-2' : 'lg:col-span-1'
        } ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>{userIsAdmin ? 'Recent Activity' : 'Today\'s Summary'}</h3>
          <div className="space-y-4">
            {(userIsAdmin ? [
              { action: 'New stock received', item: 'Amoxicillin 250mg', time: '2 hours ago', type: 'stock' },
              { action: 'Sale completed', item: 'Paracetamol 500mg', time: '3 hours ago', type: 'sale' },
              { action: 'Low stock alert', item: 'Ibuprofen 400mg', time: '5 hours ago', type: 'alert' },
              { action: 'Product updated', item: 'Aspirin 75mg', time: '1 day ago', type: 'update' }
            ] : [
              { action: 'Sales completed', item: '32 transactions', time: 'Today', type: 'sale' },
              { action: 'Revenue generated', item: '$847.50', time: 'Today', type: 'sale' },
              { action: 'Customers served', item: '47 customers', time: 'Today', type: 'sale' },
              { action: 'Average sale', item: '$26.48 per transaction', time: 'Today', type: 'sale' }
            ]).map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'stock' ? (isDarkMode ? 'bg-green-900/20' : 'bg-green-100') :
                  activity.type === 'sale' ? (isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100') :
                  activity.type === 'alert' ? (isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100') :
                  (isDarkMode ? 'bg-gray-700' : 'bg-gray-100')
                }`}>
                  <svg className={`w-4 h-4 ${
                    activity.type === 'stock' ? (isDarkMode ? 'text-green-400' : 'text-green-600') :
                    activity.type === 'sale' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                    activity.type === 'alert' ? (isDarkMode ? 'text-yellow-400' : 'text-yellow-600') :
                    (isDarkMode ? 'text-gray-400' : 'text-gray-600')
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{activity.action}</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{activity.item}</p>
                  <p className={`text-xs ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
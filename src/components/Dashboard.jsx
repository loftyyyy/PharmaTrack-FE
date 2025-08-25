const Dashboard = ({ isDarkMode }) => {
  return (
    <div className="p-6 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
              }`}>$12,847</p>
            </div>
          </div>
        </div>

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
              }`}>Orders Today</p>
              <p className={`text-2xl font-semibold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>156</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Sales Overview</h3>
          <div className="h-64 flex items-center justify-center">
            <div className={`text-center ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              <p>Chart visualization will be here</p>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Top Selling Products</h3>
          <div className="space-y-4">
            {[
              { name: 'Paracetamol 500mg', units: '2,847', revenue: '$4,235' },
              { name: 'Amoxicillin 250mg', units: '1,923', revenue: '$3,847' },
              { name: 'Ibuprofen 400mg', units: '1,654', revenue: '$2,976' },
              { name: 'Aspirin 75mg', units: '1,234', revenue: '$1,847' }
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className={`font-medium ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{product.name}</p>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>{product.units} units sold</p>
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
      </div>

      {/* System Alerts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Alerts */}
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

        {/* Recent Activity */}
        <div className={`p-6 rounded-xl shadow-sm transition-colors duration-300 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New stock received', item: 'Amoxicillin 250mg', time: '2 hours ago', type: 'stock' },
              { action: 'Sale completed', item: 'Paracetamol 500mg', time: '3 hours ago', type: 'sale' },
              { action: 'Low stock alert', item: 'Ibuprofen 400mg', time: '5 hours ago', type: 'alert' },
              { action: 'Product updated', item: 'Aspirin 75mg', time: '1 day ago', type: 'update' }
            ].map((activity, index) => (
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

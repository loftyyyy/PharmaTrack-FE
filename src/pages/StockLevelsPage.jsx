import { useState, useEffect } from 'react'
import { stockLevelsApi } from '../services/stockLevelsApi'

const StockLevelsPage = ({ isDarkMode }) => {
  const [stockItems, setStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, low, out
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch stock levels from API
  const fetchStockLevels = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      setError(null)
      const data = await stockLevelsApi.getAll()
      console.log('📥 Stock levels data:', data)
      setStockItems(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch stock levels:', error)
      setError(error.message || 'Failed to fetch stock levels')
      setStockItems([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchStockLevels()
  }, [])

  const getStockStatus = (item) => {
    if (item.currentStock === 0) return 'out'
    if (item.currentStock < item.minStock) return 'low'
    return 'normal'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'normal': return 'bg-green-100 text-green-800'
      case 'low': return 'bg-yellow-100 text-yellow-800'
      case 'out': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'normal': return '✅'
      case 'low': return '⚠️'
      case 'out': return '❌'
      default: return '❓'
    }
  }

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filter === 'all' || getStockStatus(item) === filter
    return matchesSearch && matchesFilter
  })

  const stockSummary = {
    total: stockItems.length,
    normal: stockItems.filter(item => getStockStatus(item) === 'normal').length,
    low: stockItems.filter(item => getStockStatus(item) === 'low').length,
    out: stockItems.filter(item => getStockStatus(item) === 'out').length
  }

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Stock Levels</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor and manage inventory stock levels
          </p>
        </div>
        <button
          onClick={fetchStockLevels}
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

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <div className="flex items-center">
            <span className="mr-2">❌</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Items</p>
              <p className="text-2xl font-bold">{stockSummary.total}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Normal Stock</p>
              <p className="text-2xl font-bold text-green-600">{stockSummary.normal}</p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stockSummary.low}</p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>

                 <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
           <div className="flex items-center justify-between">
             <div>
               <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</p>
               <p className="text-2xl font-bold text-red-600">{stockSummary.out}</p>
             </div>
             <div className="text-2xl">❌</div>
           </div>
         </div>
       </div>

       {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'All', icon: '📦' },
            { key: 'normal', label: 'Normal', icon: '✅' },
            { key: 'low', label: 'Low Stock', icon: '⚠️' },
            { key: 'out', label: 'Out of Stock', icon: '❌' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-pharma-teal text-white'
                  : isDarkMode
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
              } border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}
            >
              <span className="mr-1">{filterOption.icon}</span>
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stock Items Table */}
      <div className={`rounded-lg border overflow-hidden ${
        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Product
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Current Stock
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Stock Range
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Location
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Created
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredItems.map((item) => {
                const status = getStockStatus(item)
                return (
                  <tr key={item.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">{item.productName}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.category}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${
                            status === 'out' ? 'bg-red-500' :
                            status === 'low' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ 
                            width: `${Math.min((item.currentStock / Math.max(item.minStock, 1)) * 100, 100)}%` 
                          }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div>Min: {item.minStock} {item.unit}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">{item.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {getStatusIcon(status)} {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {(() => {
                        if (!item.batches || item.batches.length === 0) return 'N/A'
                        const batch = item.batches[0]
                        console.log('🔍 Batch data:', batch)
                        console.log('📅 createdAt value:', batch.createdAt)
                        console.log('📅 createdAt type:', typeof batch.createdAt)
                        
                        if (!batch.createdAt) return 'N/A'
                        
                        try {
                          // Handle LocalDateTime format from Spring Boot backend
                          let dateString = batch.createdAt
                          
                          // If it's an array with date/time components [year, month, day, hour, minute, second]
                          if (Array.isArray(dateString)) {
                            const [year, month, day, hour = 0, minute = 0, second = 0] = dateString
                            // Note: month is 0-indexed in JavaScript Date, but Spring Boot sends 1-indexed
                            dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:${second.toString().padStart(2, '0')}`
                          }
                          // If it's an object with date/time properties, construct the string
                          else if (typeof dateString === 'object' && dateString !== null) {
                            // Handle LocalDateTime object format
                            if (dateString.date && dateString.time) {
                              dateString = `${dateString.date}T${dateString.time}`
                            } else if (dateString.year && dateString.monthValue && dateString.dayOfMonth) {
                              // Handle LocalDateTime with individual components
                              const month = dateString.monthValue.toString().padStart(2, '0')
                              const day = dateString.dayOfMonth.toString().padStart(2, '0')
                              const hour = (dateString.hour || 0).toString().padStart(2, '0')
                              const minute = (dateString.minute || 0).toString().padStart(2, '0')
                              const second = (dateString.second || 0).toString().padStart(2, '0')
                              dateString = `${dateString.year}-${month}-${day}T${hour}:${minute}:${second}`
                            }
                          }
                          
                          const date = new Date(dateString)
                          console.log('📅 Parsed date:', date)
                          if (isNaN(date.getTime())) return 'N/A'
                          return date.toLocaleDateString()
                        } catch {
                          console.error('Invalid date format:', batch.createdAt)
                          return 'N/A'
                        }
                      })()}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No items found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  )
}

export default StockLevelsPage

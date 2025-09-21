import { useState, useEffect } from 'react'
import purchaseItemsApi from '../services/purchaseItemsApi'

const PurchaseItemsPage = ({ isDarkMode }) => {
  const [purchaseItems, setPurchaseItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState('ALL')
  const [productFilter, setProductFilter] = useState('ALL')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Load purchase items
  useEffect(() => {
    loadPurchaseItems()
  }, [])

  // Auto-clear error and success messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000) // 5 seconds

      return () => clearTimeout(timer)
    }
  }, [error, success])

  const loadPurchaseItems = async () => {
    try {
      setLoading(true)
      const data = await purchaseItemsApi.getAll()
      setPurchaseItems(data)
    } catch (err) {
      console.error('Error loading purchase items:', err)
      setError('Failed to load purchase items: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  // Filter and search logic
  const getFilteredPurchaseItems = () => {
    return purchaseItems.filter(item => {
      // Text search (purchase ID, product name, batch number)
      const matchesSearch = !searchTerm || 
        item.purchase?.purchaseId?.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productBatch?.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.productBatch?.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())

      // Purchase filter
      const matchesPurchase = purchaseFilter === 'ALL' || 
        item.purchase?.purchaseId?.toString() === purchaseFilter

      // Product filter
      const matchesProduct = productFilter === 'ALL' || 
        item.productBatch?.product?.productId?.toString() === productFilter

      return matchesSearch && matchesPurchase && matchesProduct
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setPurchaseFilter('ALL')
    setProductFilter('ALL')
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
      {/* Error/Success Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
          <button 
            onClick={() => setSuccess(null)}
            className="float-right text-green-500 hover:text-green-700"
          >
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Purchase Items</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage individual purchase items and their details
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Search Purchase Items
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by purchase ID, product name, or batch number..."
                className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-end">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showAdvancedFilters
                  ? isDarkMode
                    ? 'bg-pharma-teal text-white'
                    : 'bg-pharma-teal text-white'
                  : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"></path>
              </svg>
              Advanced Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="border-t pt-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Purchase Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Filter by Purchase
                </label>
                <select
                  value={purchaseFilter}
                  onChange={(e) => setPurchaseFilter(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="ALL">All Purchases</option>
                  {[...new Set(purchaseItems.map(item => item.purchase?.purchaseId))].filter(Boolean).map(purchaseId => (
                    <option key={purchaseId} value={purchaseId.toString()}>
                      Purchase #{purchaseId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Filter */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Filter by Product
                </label>
                <select
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="ALL">All Products</option>
                  {[...new Set(purchaseItems.map(item => item.productBatch?.product?.productId))].filter(Boolean).map(productId => {
                    const product = purchaseItems.find(item => item.productBatch?.product?.productId === productId)?.productBatch?.product
                    return (
                      <option key={productId} value={productId.toString()}>
                        {product?.name || `Product #${productId}`}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            <div className="flex justify-end mt-4">
              <button
                onClick={clearFilters}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Search Results Count */}
        <div className="mt-4 pt-4 border-t">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {getFilteredPurchaseItems().length} of {purchaseItems.length} purchase items
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Items</p>
              <p className="text-2xl font-bold">{purchaseItems.length}</p>
            </div>
            <div className="text-2xl">📦</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unique Products</p>
              <p className="text-2xl font-bold text-pharma-teal">
                {new Set(purchaseItems.map(item => item.productBatch?.product?.productId)).size}
              </p>
            </div>
            <div className="text-2xl">🏷️</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Quantity</p>
              <p className="text-2xl font-bold text-blue-600">
                {purchaseItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}
              </p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
              <p className="text-2xl font-bold text-green-600">
                ₱{purchaseItems
                  .reduce((sum, item) => sum + ((item.quantity || 0) * (item.purchasePricePerUnit || 0)), 0)
                  .toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* Purchase Items List */}
      {getFilteredPurchaseItems().length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">No purchase items found</h3>
          <p className="mb-4">
            {searchTerm || purchaseFilter !== 'ALL' || productFilter !== 'ALL'
              ? 'Try adjusting your search criteria or clear the filters.'
              : 'No purchase items have been created yet.'}
          </p>
          {(searchTerm || purchaseFilter !== 'ALL' || productFilter !== 'ALL') && (
            <button
              onClick={clearFilters}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-pharma-teal text-white hover:bg-pharma-medium'
                  : 'bg-pharma-teal text-white hover:bg-pharma-medium'
              }`}
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {getFilteredPurchaseItems().map((item) => (
            <div key={item.purchaseItemId} className={`rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              {/* Card Header */}
              <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-pharma-teal">Item #{item.purchaseItemId}</h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Purchase #{item.purchase?.purchaseId}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.purchase?.purchaseStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    item.purchase?.purchaseStatus === 'ORDERED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    item.purchase?.purchaseStatus === 'RECEIVED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    item.purchase?.purchaseStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    RECEIVED
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-pharma-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.productBatch?.product?.name || 'Unknown Product'}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-pharma-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Batch: {item.productBatch?.batchNumber || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6">
                {/* Quantity and Price */}
                <div className="text-center mb-6">
                  <div className={`text-3xl font-bold ${isDarkMode ? 'text-pharma-teal' : 'text-pharma-teal'}`}>
                    {item.quantity || 0}
                  </div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity</p>
                </div>

                {/* Price Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unit Price:</span>
                    <span className="font-semibold">₱{Number(item.unitPrice || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Value:</span>
                    <span className="font-bold text-green-600">
                      ₱{Number((item.quantity || 0) * (item.purchasePricePerUnit || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Batch Details */}
                {item.productBatch && (
                  <div className={`p-3 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      Batch Information
                    </h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Batch Qty:</span>
                        <span>{item.productBatch.quantity || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Purchase Price:</span>
                        <span>₱{Number(item.productBatch.purchasePricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Manufacturing:</span>
                        <span>{item.productBatch.manufacturingDate ? new Date(item.productBatch.manufacturingDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Expiry:</span>
                        <span>{item.productBatch.expiryDate ? new Date(item.productBatch.expiryDate).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {item.productBatch.location && (
                        <div className="flex justify-between">
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Location:</span>
                          <span>{item.productBatch.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PurchaseItemsPage

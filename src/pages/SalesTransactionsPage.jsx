import { useState, useEffect } from 'react'
import salesApi from '../services/salesApi'

const SalesTransactionsPage = ({ isDarkMode }) => {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedSale, setSelectedSale] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showVoidModal, setShowVoidModal] = useState(false)
  const [voidReason, setVoidReason] = useState('')
  const [dateFilter, setDateFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    loadSales()
  }, [])

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  const loadSales = async () => {
    try {
      setLoading(true)
      const data = await salesApi.getAll()
      setSales(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Error loading sales:', err)
      setError('Failed to load sales transactions: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (sale) => {
    setSelectedSale(sale)
    setShowDetailsModal(true)
  }

  const handleVoidSale = async () => {
    if (!voidReason.trim()) {
      setError('Please provide a reason for voiding this transaction')
      return
    }

    try {
      await salesApi.void(selectedSale.saleId, voidReason)
      setSuccess('Sale transaction voided successfully!')
      setShowVoidModal(false)
      setVoidReason('')
      setSelectedSale(null)
      loadSales()
    } catch (err) {
      console.error('Error voiding sale:', err)
      setError('Failed to void sale: ' + err.message)
    }
  }

  const getFilteredSales = () => {
    return sales.filter(sale => {
      // Search filter
      const matchesSearch = !searchTerm || 
        sale.saleId?.toString().includes(searchTerm) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase())

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || sale.saleStatus === statusFilter

      // Date filter
      let matchesDate = true
      if (dateFilter === 'CUSTOM' && startDate && endDate) {
        const saleDate = new Date(sale.saleDate)
        matchesDate = saleDate >= new Date(startDate) && saleDate <= new Date(endDate)
      } else if (dateFilter === 'TODAY') {
        const today = new Date().toDateString()
        matchesDate = new Date(sale.saleDate).toDateString() === today
      } else if (dateFilter === 'WEEK') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        matchesDate = new Date(sale.saleDate) >= weekAgo
      } else if (dateFilter === 'MONTH') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        matchesDate = new Date(sale.saleDate) >= monthAgo
      }

      return matchesSearch && matchesStatus && matchesDate
    })
  }

  const getStatusBadge = (status) => {
    const badges = {
      COMPLETED: 'bg-green-100 text-green-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      VOIDED: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'CASH':
        return '💵'
      case 'CARD':
        return '💳'
      case 'GCASH':
        return '📱'
      default:
        return '💰'
    }
  }

  const getTotalRevenue = () => {
    return getFilteredSales()
      .filter(s => s.saleStatus === 'COMPLETED')
      .reduce((sum, sale) => sum + (sale.grandTotal || 0), 0)
  }

  const filteredSales = getFilteredSales()

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
      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="float-right text-red-500 hover:text-red-700">×</button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {success}
          <button onClick={() => setSuccess(null)} className="float-right text-green-500 hover:text-green-700">×</button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Transactions</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            View and manage all sales transactions
          </p>
        </div>
        <button
          onClick={loadSales}
          className="px-4 py-2 bg-pharma-teal text-white rounded-lg hover:bg-pharma-medium transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Sales</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {sales.filter(s => s.saleStatus === 'COMPLETED').length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Voided</p>
              <p className="text-2xl font-bold text-red-600">
                {sales.filter(s => s.saleStatus === 'VOIDED').length}
              </p>
            </div>
            <div className="text-2xl">❌</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Revenue</p>
              <p className="text-2xl font-bold text-pharma-teal">
                ₱{getTotalRevenue().toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or customer name..."
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="ALL">All Status</option>
              <option value="COMPLETED">Completed</option>
              <option value="PENDING">Pending</option>
              <option value="VOIDED">Voided</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Date Range
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="ALL">All Time</option>
              <option value="TODAY">Today</option>
              <option value="WEEK">Last 7 Days</option>
              <option value="MONTH">Last 30 Days</option>
              <option value="CUSTOM">Custom Range</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('ALL')
                setDateFilter('ALL')
                setStartDate('')
                setEndDate('')
              }}
              className={`w-full px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t">
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Showing {filteredSales.length} of {sales.length} transactions
          </p>
        </div>
      </div>

      {/* Sales Table */}
      {filteredSales.length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">No sales transactions found</h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
            {searchTerm || statusFilter !== 'ALL' || dateFilter !== 'ALL'
              ? 'Try adjusting your filters.'
              : 'Sales transactions will appear here.'}
          </p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Transaction
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Customer
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Date
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Payment
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Total
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700 bg-gray-800' : 'divide-gray-200 bg-white'}`}>
              {filteredSales.map((sale) => (
                <tr key={sale.saleId} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">#{sale.saleId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">{sale.customerName || 'Walk-in Customer'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="mr-2">{getPaymentMethodIcon(sale.paymentMethod)}</span>
                      <span className="text-sm">{sale.paymentMethod || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-pharma-teal">
                    ₱{Number(sale.grandTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(sale.saleStatus)}`}>
                      {sale.saleStatus || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(sale)}
                        className="text-pharma-teal hover:text-pharma-medium"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                      </button>
                      {sale.saleStatus === 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setSelectedSale(sale)
                            setShowVoidModal(true)
                          }}
                          className="text-red-600 hover:text-red-800"
                          title="Void Transaction"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetailsModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className={`rounded-xl p-6 w-full max-w-3xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Sale Details #{selectedSale.saleId}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Transaction Info */}
            <div className={`p-4 rounded-lg mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sale ID</p>
                  <p className="font-semibold">#{selectedSale.saleId}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date</p>
                  <p className="font-semibold">
                    {selectedSale.saleDate ? new Date(selectedSale.saleDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer</p>
                  <p className="font-semibold">{selectedSale.customerName || 'Walk-in Customer'}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method</p>
                  <p className="font-semibold">
                    {getPaymentMethodIcon(selectedSale.paymentMethod)} {selectedSale.paymentMethod}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(selectedSale.saleStatus)}`}>
                    {selectedSale.saleStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* Sale Items */}
            <div className="mb-4">
              <h3 className="font-semibold mb-3">Items</h3>
              <div className={`border rounded-lg ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                {selectedSale.saleItems && selectedSale.saleItems.length > 0 ? (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Product</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Quantity</th>
                        <th className={`px-4 py-2 text-left text-xs font-medium uppercase ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedSale.saleItems.map((item) => (
                        <tr key={item.saleItemId}>
                          <td className="px-4 py-2">{item.productName || 'Unknown'}</td>
                          <td className="px-4 py-2">{item.quantity}</td>
                          <td className="px-4 py-2 font-semibold">₱{Number(item.subTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="p-4 text-center text-gray-500">No items found</p>
                )}
              </div>
            </div>

            {/* Total */}
            <div className={`p-4 rounded-lg space-y-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  ₱{Number(selectedSale.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              {selectedSale.discountAmount > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span>Discount:</span>
                  <span className="font-semibold">
                    -₱{Number(selectedSale.discountAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {selectedSale.taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span>Tax:</span>
                  <span className="font-semibold">
                    ₱{Number(selectedSale.taxAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-xl font-bold pt-2 border-t">
                <span>Grand Total:</span>
                <span className="text-pharma-teal">
                  ₱{Number(selectedSale.grandTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {selectedSale.voidReason && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm font-semibold text-red-800">Void Reason:</p>
                <p className="text-sm text-red-700">{selectedSale.voidReason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Void Modal */}
      {showVoidModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Void Transaction</h2>
            <p className="mb-4">Are you sure you want to void this transaction?</p>
            <p className="mb-4 font-semibold">Sale #{selectedSale.saleId} - ₱{Number(selectedSale.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Reason for Voiding *
              </label>
              <textarea
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                rows="3"
                placeholder="Enter reason for voiding this transaction..."
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowVoidModal(false)
                  setVoidReason('')
                  setSelectedSale(null)
                }}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleVoidSale}
                className="flex-1 py-2 px-4 rounded-lg font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                Void Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesTransactionsPage


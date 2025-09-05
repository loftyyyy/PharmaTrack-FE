import { useState, useEffect } from 'react'
import inventoryLogsApi from '../services/inventoryLogsApi'

// Simple professional-looking inline SVG icons (no external deps)
const IconChartBars = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 21h18" />
    <rect x="6" y="10" width="3" height="7" rx="1" />
    <rect x="11" y="6" width="3" height="11" rx="1" />
    <rect x="16" y="13" width="3" height="4" rx="1" />
  </svg>
)

const IconPlusCircle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
)

const IconMinusCircle = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12h8" />
  </svg>
)

const IconAdjustments = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="6" y1="5" x2="6" y2="19" />
    <circle cx="6" cy="9" r="1.5" fill="currentColor" stroke="none" />
    <line x1="12" y1="5" x2="12" y2="19" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
    <line x1="18" y1="5" x2="18" y2="19" />
    <circle cx="18" cy="8" r="1.5" fill="currentColor" stroke="none" />
  </svg>
)

const IconEye = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

const IconDownload = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

const IconFilter = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46" />
  </svg>
)

const InventoryLogsPage = ({ isDarkMode }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterChangeType, setFilterChangeType] = useState('all')
  const [filterDateRange, setFilterDateRange] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Date range options
  const dateRangeOptions = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'yesterday', label: 'Yesterday' },
    { value: '7days', label: 'Last 7 Days' },
    { value: '30days', label: 'Last 30 Days' },
    { value: '90days', label: 'Last 90 Days' }
  ]

  // Change type options
  const changeTypeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'IN', label: 'Stock In' },
    { value: 'OUT', label: 'Stock Out' },
    { value: 'SALE', label: 'Sale' },
    { value: 'PURCHASE', label: 'Purchase' },
    { value: 'ADJUSTMENT', label: 'Adjustment' },
    { value: 'TRANSFER_IN', label: 'Transfer In' },
    { value: 'TRANSFER_OUT', label: 'Transfer Out' },
    { value: 'RETURN', label: 'Return' },
    { value: 'EXPIRED', label: 'Expired' }
  ]

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Build query parameters
      const params = {}
      if (filterChangeType !== 'all') {
        params.changeType = filterChangeType
      }
      if (filterDateRange !== 'all') {
        const now = new Date()
        switch (filterDateRange) {
          case 'today':
            params.startDate = now.toISOString().split('T')[0]
            params.endDate = now.toISOString().split('T')[0]
            break
          case 'yesterday':
            const yesterday = new Date(now)
            yesterday.setDate(yesterday.getDate() - 1)
            params.startDate = yesterday.toISOString().split('T')[0]
            params.endDate = yesterday.toISOString().split('T')[0]
            break
          case '7days':
            const weekAgo = new Date(now)
            weekAgo.setDate(weekAgo.getDate() - 7)
            params.startDate = weekAgo.toISOString().split('T')[0]
            params.endDate = now.toISOString().split('T')[0]
            break
          case '30days':
            const monthAgo = new Date(now)
            monthAgo.setDate(monthAgo.getDate() - 30)
            params.startDate = monthAgo.toISOString().split('T')[0]
            params.endDate = now.toISOString().split('T')[0]
            break
          case '90days':
            const quarterAgo = new Date(now)
            quarterAgo.setDate(quarterAgo.getDate() - 90)
            params.startDate = quarterAgo.toISOString().split('T')[0]
            params.endDate = now.toISOString().split('T')[0]
            break
        }
      }

      const logsData = await inventoryLogsApi.getAll(params)
      
      // Normalize logs for table rendering
      const normalized = Array.isArray(logsData) ? logsData.map(log => ({
        id: log.id || Math.random(),
        product: log.product || {},
        productBatch: log.productBatch || {},
        changeType: log.changeType || 'UNKNOWN',
        quantityChanged: log.quantityChanged || 0,
        reason: log.reason || '—',
        saleId: log.saleId || null,
        purchaseId: log.purchaseId || null,
        adjustmentReference: log.adjustmentReference || null,
        createdAt: log.createdAt ? (Array.isArray(log.createdAt) ? new Date(...log.createdAt).toISOString() : log.createdAt) : new Date().toISOString(),
      })) : []
      
      setLogs(normalized)
    } catch (e) {
      // Check if it's a 500 error (endpoint not implemented)
      if (e.message.includes('500') || e.message.includes('Internal Server Error')) {
        setError('Inventory logs endpoint is not yet implemented on the backend. Please implement the InventoryLogController first.')
        setLogs([]) // Set empty array to show the "no data" state
      } else {
        setError(e.message || 'Failed to load inventory logs')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const params = {}
      if (filterChangeType !== 'all') params.changeType = filterChangeType
      if (filterDateRange !== 'all') {
        // Add date range logic here similar to loadLogs
      }
      
      const blob = await inventoryLogsApi.export(params)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventory-logs-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      setError(e.message || 'Failed to export logs')
    } finally {
      setExporting(false)
    }
  }

  const handleViewDetails = (log) => {
    setSelectedLog(log)
    setShowDetailsModal(true)
  }

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case 'IN':
      case 'PURCHASE':
      case 'TRANSFER_IN':
      case 'RETURN':
        return 'bg-green-100 text-green-800'
      case 'OUT':
      case 'SALE':
      case 'TRANSFER_OUT':
        return 'bg-red-100 text-red-800'
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800'
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getChangeTypeIcon = (changeType) => {
    switch (changeType) {
      case 'IN':
      case 'PURCHASE':
      case 'TRANSFER_IN':
      case 'RETURN':
        return <IconPlusCircle className="w-4 h-4 mr-1" />
      case 'OUT':
      case 'SALE':
      case 'TRANSFER_OUT':
        return <IconMinusCircle className="w-4 h-4 mr-1" />
      case 'ADJUSTMENT':
        return <IconAdjustments className="w-4 h-4 mr-1" />
      default:
        return null
    }
  }

  const getChangeTypeLabel = (changeType) => {
    const option = changeTypeOptions.find(opt => opt.value === changeType)
    return option ? option.label : changeType
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.product?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.adjustmentReference || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesChangeType = filterChangeType === 'all' || log.changeType === filterChangeType
    
    return matchesSearch && matchesChangeType
  })

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
          <h1 className="text-2xl font-bold">Inventory Logs</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Complete audit trail of all inventory changes and transactions
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {error && (
            <span className="text-red-500 text-sm">{error}</span>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <IconFilter className="w-4 h-4 inline mr-2" />
            Filters
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${
              exporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 hover:shadow-lg'
            }`}
          >
            <IconDownload className="w-4 h-4 inline mr-2" />
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Logs</p>
              <p className="text-2xl font-bold">{logs.length}</p>
            </div>
            <IconChartBars className={`w-7 h-7 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock In</p>
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(log => ['IN', 'PURCHASE', 'TRANSFER_IN', 'RETURN'].includes(log.changeType)).length}
              </p>
            </div>
            <IconPlusCircle className="w-7 h-7 text-green-600" />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Stock Out</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(log => ['OUT', 'SALE', 'TRANSFER_OUT'].includes(log.changeType)).length}
              </p>
            </div>
            <IconMinusCircle className="w-7 h-7 text-red-600" />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Adjustments</p>
              <p className="text-2xl font-bold text-blue-600">
                {logs.filter(log => log.changeType === 'ADJUSTMENT').length}
              </p>
            </div>
            <IconAdjustments className={`w-7 h-7 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className={`rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Change Type
              </label>
              <select
                value={filterChangeType}
                onChange={(e) => setFilterChangeType(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {changeTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Date Range
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                  isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                {dateRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadLogs}
                className="w-full bg-gradient-to-r from-pharma-teal to-pharma-medium text-white px-4 py-2 rounded-lg hover:from-pharma-medium hover:to-pharma-dark transition-all duration-200"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by product name, SKU, reason, or reference..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Logs Table */}
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
                  Product & Batch
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Change Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Reference
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Date & Time
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredLogs.map((log) => (
                <tr key={log.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium">{log.product?.name || 'Unknown Product'}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        SKU: {log.product?.sku || '—'}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Batch: {log.productBatch?.batchNumber || log.productBatch?.id || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(log.changeType)}`}>
                        {getChangeTypeIcon(log.changeType)} {getChangeTypeLabel(log.changeType)}
                      </span>
                      <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Qty: {log.quantityChanged > 0 ? `+${log.quantityChanged}` : log.quantityChanged}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {log.reason || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {log.saleId && (
                        <div className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Sale #{log.saleId}
                        </div>
                      )}
                      {log.purchaseId && (
                        <div className={`${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          Purchase #{log.purchaseId}
                        </div>
                      )}
                      {log.adjustmentReference && (
                        <div className={`${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                          {log.adjustmentReference}
                        </div>
                      )}
                      {!log.saleId && !log.purchaseId && !log.adjustmentReference && (
                        <span className={`${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium">
                        {log.createdAt ? new Date(log.createdAt).toLocaleDateString() : '—'}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleViewDetails(log)}
                      className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        isDarkMode
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <IconEye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredLogs.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No inventory logs found matching your search criteria.
          </p>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Inventory Log Details</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Product Information
                </h3>
                <div className={`mt-1 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p><strong>Name:</strong> {selectedLog.product?.name || 'Unknown'}</p>
                  <p><strong>SKU:</strong> {selectedLog.product?.sku || '—'}</p>
                  <p><strong>Batch:</strong> {selectedLog.productBatch?.batchNumber || selectedLog.productBatch?.id || '—'}</p>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Change Information
                </h3>
                <div className={`mt-1 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p><strong>Type:</strong> {getChangeTypeLabel(selectedLog.changeType)}</p>
                  <p><strong>Quantity Changed:</strong> {selectedLog.quantityChanged > 0 ? `+${selectedLog.quantityChanged}` : selectedLog.quantityChanged}</p>
                  <p><strong>Reason:</strong> {selectedLog.reason || '—'}</p>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  References
                </h3>
                <div className={`mt-1 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {selectedLog.saleId && <p><strong>Sale ID:</strong> {selectedLog.saleId}</p>}
                  {selectedLog.purchaseId && <p><strong>Purchase ID:</strong> {selectedLog.purchaseId}</p>}
                  {selectedLog.adjustmentReference && <p><strong>Adjustment Reference:</strong> {selectedLog.adjustmentReference}</p>}
                  {!selectedLog.saleId && !selectedLog.purchaseId && !selectedLog.adjustmentReference && (
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No references available</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Timestamp
                </h3>
                <div className={`mt-1 p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p><strong>Date:</strong> {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleDateString() : '—'}</p>
                  <p><strong>Time:</strong> {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleTimeString() : '—'}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InventoryLogsPage

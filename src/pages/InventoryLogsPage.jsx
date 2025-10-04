import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import inventoryLogsApi from '../services/inventoryLogsApi'
import ErrorDisplay from '../components/ErrorDisplay'

// Converts backend array timestamp [yyyy, MM, dd, HH, mm, ss, nanos?] to ISO string
function toIsoFromBackendTimestamp(timestamp) {
  try {
    if (!timestamp) return null
    if (Array.isArray(timestamp)) {
      const [year, monthOneBased, day, hour = 0, minute = 0, second = 0, nano = 0] = timestamp
      const monthIndex = (monthOneBased || 1) - 1 // JS Date months are 0-based
      const millisecond = Math.floor((nano || 0) / 1_000_000)
      // Use UTC to avoid local timezone shifting raw components
      const date = new Date(Date.UTC(year, monthIndex, day, hour, minute, second, millisecond))
      return date.toISOString()
    }
    // If already string/number, attempt to parse and normalize to ISO
    const date = new Date(timestamp)
    if (isNaN(date.getTime())) return null
    return date.toISOString()
  } catch {
    return null
  }
}

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


const InventoryLogsPage = ({ isDarkMode }) => {
  const { isAuthenticated } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [exporting, setExporting] = useState(false)

  const downloadBlob = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const exportClientCsv = () => {
    const headers = [
      'Product','SKU','Batch','ChangeType','QuantityChanged','Reason','SaleId','PurchaseId','AdjustmentReference','CreatedAt'
    ]
    const rows = filteredLogs.map(log => [
      (log.product?.name || ''),
      (log.product?.sku || ''),
      (log.productBatch?.batchNumber || log.productBatch?.id || ''),
      (log.changeType || ''),
      (log.quantityChanged ?? ''),
      (log.reason || ''),
      (log.saleId || ''),
      (log.purchaseId || ''),
      (log.adjustmentReference || ''),
      (log.createdAt ? new Date(log.createdAt).toISOString() : '')
    ])

    const escapeCsv = (val) => {
      const s = String(val)
      if (/[",\n]/.test(s)) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }

    const csv = [headers, ...rows]
      .map(row => row.map(escapeCsv).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    downloadBlob(blob, `inventory-logs-${new Date().toISOString().split('T')[0]}.csv`)
  }

  useEffect(() => {
    // Only load data if user is authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping inventory logs load')
      return
    }
    loadLogs()
  }, [isAuthenticated])

  const loadLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      setLoadingError(null)
      
      const logsData = await inventoryLogsApi.getAll()
      
      // Normalize logs for table rendering
      const normalized = Array.isArray(logsData) ? logsData.map(log => ({
        id: log.id || Math.random(),
        product: log.product || {},
        productBatch: log.productBatch || {},
        changeType: log.changeType || 'UNKNOWN',
        quantityChanged: log.quantityChanged || 0,
        reason: log.reason || '—',
        sale: log.sale || null,
        purchase: log.purchase || null,
        saleId: log.sale?.saleId || null,
        purchaseId: log.purchase?.purchaseId || null,
        adjustmentReference: log.adjustmentReference || null,
        createdAt: toIsoFromBackendTimestamp(log.createdAt) || new Date().toISOString(),
      })) : []
      
      setLogs(normalized)
    } catch (e) {
      console.error('Failed to load inventory logs:', e)
      setLoadingError(e)
      setLogs([]) // Set empty array to show the "no data" state
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      // Direct client-side export of currently filtered rows
      exportClientCsv()
      setError(null)
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
    const labels = {
      'IN': 'Stock In',
      'OUT': 'Stock Out',
      'SALE': 'Sale',
      'PURCHASE': 'Purchase',
      'ADJUSTMENT': 'Adjustment',
      'TRANSFER_IN': 'Transfer In',
      'TRANSFER_OUT': 'Transfer Out',
      'RETURN': 'Return',
      'EXPIRED': 'Expired'
    }
    return labels[changeType] || changeType
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      (log.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.product?.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.adjustmentReference || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
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

      {/* Error Display */}
      <ErrorDisplay 
        error={loadingError} 
        onDismiss={() => setLoadingError(null)}
        isDarkMode={isDarkMode}
      />

      <ErrorDisplay 
        error={error ? { message: error } : null} 
        onDismiss={() => setError(null)}
        isDarkMode={isDarkMode}
      />

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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDetailsModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className={`rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Inventory Log Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Product Information */}
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Product Information
                </h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Product Name</p>
                      <p className="font-semibold">{selectedLog.product?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>SKU</p>
                      <p className="font-semibold">{selectedLog.product?.sku || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Batch Number</p>
                      <p className="font-semibold">{selectedLog.productBatch?.batchNumber || '—'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Batch Quantity</p>
                      <p className="font-semibold">{selectedLog.productBatch?.quantity || '—'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Change Information */}
              <div>
                <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Change Information
                </h3>
                <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Change Type</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChangeTypeColor(selectedLog.changeType)}`}>
                        {getChangeTypeIcon(selectedLog.changeType)} {getChangeTypeLabel(selectedLog.changeType)}
                      </span>
                    </div>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity Changed</p>
                      <p className="font-semibold text-lg">{selectedLog.quantityChanged > 0 ? `+${selectedLog.quantityChanged}` : selectedLog.quantityChanged}</p>
                    </div>
                    <div className="col-span-2">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reason</p>
                      <p className="font-semibold">{selectedLog.reason || '—'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Date & Time</p>
                      <p className="font-semibold">
                        {selectedLog.createdAt ? new Date(selectedLog.createdAt).toLocaleString() : '—'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sale Details - Only show if sale exists */}
              {selectedLog.sale && (
              <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sale Details
                </h3>
                  <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'bg-gray-700 border-blue-600' : 'bg-blue-50 border-blue-300'}`}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sale ID</p>
                        <p className="font-semibold text-blue-600">#{selectedLog.sale.saleId}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer</p>
                        <p className="font-semibold">{selectedLog.sale.customerName || 'Walk-in'}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sale Date</p>
                        <p className="font-semibold">
                          {selectedLog.sale.saleDate ? new Date(selectedLog.sale.saleDate).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method</p>
                        <p className="font-semibold">{selectedLog.sale.paymentMethod || '—'}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                        <p className="font-semibold">
                          ₱{Number(selectedLog.sale.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Grand Total</p>
                        <p className="font-bold text-lg text-pharma-teal">
                          ₱{Number(selectedLog.sale.grandTotal || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedLog.sale.saleStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          selectedLog.sale.saleStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          selectedLog.sale.saleStatus === 'VOIDED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedLog.sale.saleStatus || 'PENDING'}
                        </span>
                      </div>
                    </div>

                    {/* Sale Items */}
                    {selectedLog.sale.saleItems && selectedLog.sale.saleItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Sale Items ({selectedLog.sale.saleItems.length})
                        </p>
                        <div className="space-y-1">
                          {selectedLog.sale.saleItems.map((item) => (
                            <div key={item.saleItemId} className="flex justify-between text-sm">
                              <span>{item.productName}</span>
                              <span>
                                {item.quantity} × ₱{Number(item.subTotal / item.quantity).toLocaleString('en-PH', { minimumFractionDigits: 2 })} = 
                                <strong className="ml-1">₱{Number(item.subTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Purchase Details - Only show if purchase exists */}
              {selectedLog.purchase && (
                <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Purchase Details
                  </h3>
                  <div className={`p-4 rounded-lg border-2 ${isDarkMode ? 'bg-gray-700 border-green-600' : 'bg-green-50 border-green-300'}`}>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Purchase ID</p>
                        <p className="font-semibold text-green-600">#{selectedLog.purchase.purchaseId}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Supplier</p>
                        <p className="font-semibold">{selectedLog.purchase.supplier?.name || '—'}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Purchase Date</p>
                        <p className="font-semibold">
                          {selectedLog.purchase.purchaseDate ? new Date(selectedLog.purchase.purchaseDate).toLocaleDateString() : '—'}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created By</p>
                        <p className="font-semibold">{selectedLog.purchase.createdBy || '—'}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                        <p className="font-bold text-lg text-pharma-teal">
                          ₱{Number(selectedLog.purchase.totalAmount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Status</p>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          selectedLog.purchase.purchaseStatus === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                          selectedLog.purchase.purchaseStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          selectedLog.purchase.purchaseStatus === 'ORDERED' ? 'bg-blue-100 text-blue-800' :
                          selectedLog.purchase.purchaseStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedLog.purchase.purchaseStatus || 'PENDING'}
                        </span>
                </div>
              </div>

                    {/* Purchase Items */}
                    {selectedLog.purchase.purchaseItems && selectedLog.purchase.purchaseItems.length > 0 && (
                      <div className="mt-3 pt-3 border-t">
                        <p className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Purchase Items ({selectedLog.purchase.purchaseItems.length})
                        </p>
                        <div className="space-y-1">
                          {selectedLog.purchase.purchaseItems.map((item) => (
                            <div key={item.purchaseItemId} className="flex justify-between text-sm">
                              <span>{item.productName || item.product?.name}</span>
                              <span>
                                {item.quantity} × ₱{Number(item.purchasePricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })} = 
                                <strong className="ml-1">₱{Number((item.quantity * item.purchasePricePerUnit) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Adjustment Reference - Only show if no sale or purchase */}
              {!selectedLog.sale && !selectedLog.purchase && selectedLog.adjustmentReference && (
              <div>
                  <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Adjustment Details
                </h3>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Adjustment Reference</p>
                      <p className="font-semibold">{selectedLog.adjustmentReference}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetailsModal(false)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
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

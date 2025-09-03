import { useState, useEffect } from 'react'
import productsApi from '../services/productsApi'
import { productBatchesApi } from '../services/productBatchesApi'
import stockAdjustmentsApi from '../services/stockAdjustmentsApi'

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

const IconArrowRight = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
)

const StockAdjustmentsPage = ({ isDarkMode }) => {
  const [adjustments, setAdjustments] = useState([])
  const [products, setProducts] = useState([])
  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    productBatchId: '',
    type: 'IN',
    quantity: '',
    reason: '',
  })

  const normalizeType = (backendType) => {
    if (!backendType) return 'IN'
    const t = backendType.toString().toUpperCase()
    if (t === 'IN' || t === 'OUT' || t === 'CORRECTION') return t
    if (t.includes('ADD') || t === 'INCREMENT' || t === '+') return 'IN'
    if (t.includes('REDUC') || t === 'DECREMENT' || t === '-') return 'OUT'
    return 'CORRECTION'
  }

  useEffect(() => {
    const loadInitial = async () => {
      try {
        setLoading(true)
        setError(null)
        const [productsData, adjustmentsData] = await Promise.all([
          productsApi.getAll().catch(() => []),
          stockAdjustmentsApi.getAll().catch(() => []),
        ])
        setProducts(Array.isArray(productsData) ? productsData : [])
        // Normalize adjustments for table rendering
        const normalized = Array.isArray(adjustmentsData) ? adjustmentsData.map(a => ({
          id: a.stockAdjustmentId ?? a.id ?? Math.random(),
          productId: a.product?.id,
          productName: a.product?.name || 'Unknown Product',
          productSku: a.product?.sku || a.product?.barcode || '—',
          type: normalizeType(a.adjustmentType),
          quantityChanged: a.quantityChanged,
          reason: a.reason,
          productBatchId: a.productBatchId,
          adjustedBy: a.createdBy || '—',
          adjustedAt: a.createdAt ? (Array.isArray(a.createdAt) ? new Date(...a.createdAt).toISOString() : a.createdAt) : new Date().toISOString(),
        })) : []
        setAdjustments(normalized)
      } catch (e) {
        setError(e.message || 'Failed to load stock adjustments')
      } finally {
        setLoading(false)
      }
    }
    loadInitial()
  }, [])

  // Load batches whenever product changes
  useEffect(() => {
    const loadBatches = async () => {
      if (!formData.productId) {
        setBatches([])
        setFormData(prev => ({ ...prev, productBatchId: '' }))
        return
      }
      try {
        setBatchesLoading(true)
        const list = await productBatchesApi.getByProductId(formData.productId)
        setBatches(Array.isArray(list) ? list : [])
      } catch {
        setBatches([])
      } finally {
        setBatchesLoading(false)
      }
    }
    loadBatches()
  }, [formData.productId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      const selectedBatch = batches.find(b => String(b.productBatchId || b.id) === String(formData.productBatchId))
      const qtyInput = parseInt(formData.quantity)
      if (!selectedBatch || isNaN(qtyInput)) throw new Error('Please select a batch and enter a valid quantity')

      const dto = {
        productId: parseInt(formData.productId),
        productBatchId: parseInt(formData.productBatchId),
        quantityChanged: qtyInput,
        adjustmentType: formData.type,
        reason: formData.reason,
      }

      console.log('📋 Frontend DTO being sent:', dto)
      console.log('🔍 Form data values:', {
        productId: formData.productId,
        productBatchId: formData.productBatchId,
        quantity: formData.quantity,
        type: formData.type,
        reason: formData.reason,
        qtyInput: qtyInput
      })

      const result = await stockAdjustmentsApi.create(dto)
      
      setSuccess('Stock adjustment created successfully!')
      setError(null)

      const refreshed = await stockAdjustmentsApi.getAll().catch(() => [])
      const normalized = Array.isArray(refreshed) ? refreshed.map(a => ({
        id: a.stockAdjustmentId ?? a.id ?? Math.random(),
        productId: a.product?.id,
        productName: a.product?.name || 'Unknown Product',
        productSku: a.product?.sku || a.product?.barcode || '—',
        type: normalizeType(a.adjustmentType),
        quantityChanged: a.quantityChanged,
        reason: a.reason,
        productBatchId: a.productBatchId,
        adjustedBy: a.createdBy || '—',
        adjustedAt: a.createdAt ? (Array.isArray(a.createdAt) ? new Date(...a.createdAt).toISOString() : a.createdAt) : new Date().toISOString(),
      })) : []
      setAdjustments(normalized)

      resetForm()
    } catch (err) {
      setError(err.message || 'Failed to save stock adjustment')
      setSuccess(null)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setShowAddModal(false)
    setEditingAdjustment(null)
    setFormData({
      productId: '',
      productBatchId: '',
      type: 'IN',
      quantity: '',
      reason: '',
    })
    setError(null)
    setSuccess(null)
  }

  const handleEdit = (adjustment) => {
    setEditingAdjustment(adjustment)
    setFormData({
      productId: adjustment.productId ? String(adjustment.productId) : '',
      productBatchId: adjustment.productBatchId ? String(adjustment.productBatchId) : '',
      type: normalizeType(adjustment.type),
      quantity: adjustment.quantityChanged ? String(Math.abs(adjustment.quantityChanged)) : '',
      reason: adjustment.reason || '',
    })
    setShowAddModal(true)
  }



  const getTypeColor = (type) => {
    switch (type) {
      case 'IN': return 'bg-green-100 text-green-800'
      case 'OUT': return 'bg-red-100 text-red-800'
      case 'CORRECTION': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'IN':
        return <IconPlusCircle className="w-4 h-4 mr-1" />
      case 'OUT':
        return <IconMinusCircle className="w-4 h-4 mr-1" />
      case 'CORRECTION':
        return <IconAdjustments className="w-4 h-4 mr-1" />
      default:
        return null
    }
  }

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = (adjustment.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (adjustment.productSku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (adjustment.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || adjustment.type === filterType
    return matchesSearch && matchesType
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
          <h1 className="text-2xl font-bold">Stock Adjustments</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage inventory adjustments for stock corrections, additions, and reductions
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {error && (
            <span className="text-red-500 text-sm">{error}</span>
          )}
          {success && (
            <span className="text-green-500 text-sm">{success}</span>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            New Adjustment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Adjustments</p>
              <p className="text-2xl font-bold">{adjustments.length}</p>
            </div>
            <IconChartBars className={`w-7 h-7 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`} />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>IN</p>
              <p className="text-2xl font-bold text-green-600">
                {adjustments.filter(a => a.type === 'IN' && a.quantityChanged > 0).length}
              </p>
            </div>
            <IconPlusCircle className="w-7 h-7 text-green-600" />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>OUT</p>
              <p className="text-2xl font-bold text-red-600">
                {adjustments.filter(a => a.type === 'OUT' && a.quantityChanged < 0).length}
              </p>
            </div>
            <IconMinusCircle className="w-7 h-7 text-red-600" />
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>CORRECTION</p>
              <p className="text-2xl font-bold text-blue-600">
                {adjustments.filter(a => a.type === 'CORRECTION').length}
              </p>
            </div>
            <IconAdjustments className={`w-7 h-7 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by product name, SKU, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Types</option>
            <option value="IN">IN</option>
            <option value="OUT">OUT</option>
            <option value="CORRECTION">CORRECTION</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
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
                  Product & Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Adjustment
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Adjusted By
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredAdjustments.map((adjustment) => (
                <tr key={adjustment.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium">{adjustment.productName}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        SKU: {adjustment.productSku}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        Batch: {adjustment.productBatchId || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(adjustment.type)}`}>
                        {getTypeIcon(adjustment.type)} {adjustment.type}
                      </span>
                      <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Qty change: {adjustment.quantityChanged > 0 ? `+${adjustment.quantityChanged}` : adjustment.quantityChanged}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {adjustment.reason || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium">{adjustment.adjustedBy || '—'}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {adjustment.adjustedAt ? new Date(adjustment.adjustedAt).toLocaleString() : '—'}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAdjustments.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No adjustments found matching your search criteria.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingAdjustment ? 'Edit Stock Adjustment' : 'New Stock Adjustment'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Product *
                  </label>
                  <select
                    required
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value, productBatchId: '' })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Product Batch *
                  </label>
                  <select
                    required
                    disabled={!formData.productId || batchesLoading}
                    value={formData.productBatchId}
                    onChange={(e) => setFormData({ ...formData, productBatchId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${(!formData.productId || batchesLoading) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {!formData.productId && (
                      <option value="">Select a product first</option>
                    )}
                    {formData.productId && batchesLoading && (
                      <option value="">Loading batches...</option>
                    )}
                    {formData.productId && !batchesLoading && (
                      <>
                        <option value="">Select Batch</option>
                        {batches.map((batch) => (
                          <option key={batch.productBatchId || batch.id} value={batch.productBatchId || batch.id}>
                            {batch.batchNumber || `Batch #${batch.productBatchId || batch.id}`} • Qty: {batch.quantity ?? '0'}
                          </option>
                        ))}
                        {batches.length === 0 && (
                          <option value="" disabled>No batches found for this product</option>
                        )}
                      </>
                    )}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Adjustment Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="IN">IN (+)</option>
                    <option value="OUT">OUT (-)</option>
                    <option value="CORRECTION">Stock CORRECTION</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {formData.type === 'CORRECTION' ? 'New Stock Level *' : 'Quantity *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder={formData.type === 'CORRECTION' ? 'Enter correct stock level for this batch' : 'Enter quantity to adjust'}
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Reason *
                </label>
                <select
                  required
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select Reason</option>
                  <option value="Stock replenishment">Stock replenishment</option>
                  <option value="Damaged items">Damaged items</option>
                  <option value="Expired items">Expired items</option>
                  <option value="Stock count correction">Stock count correction</option>
                  <option value="Theft/Loss">Theft/Loss</option>
                  <option value="Transfer out">Transfer out</option>
                  <option value="Transfer in">Transfer in</option>
                  <option value="Return to supplier">Return to supplier</option>
                  <option value="Customer return">Customer return</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    submitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg'
                  }`}
                >
                  {submitting ? 'Saving...' : (editingAdjustment ? 'Update Adjustment' : 'Create Adjustment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default StockAdjustmentsPage


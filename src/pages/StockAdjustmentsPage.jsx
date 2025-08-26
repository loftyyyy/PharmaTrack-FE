import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const StockAdjustmentsPage = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [adjustments, setAdjustments] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAdjustment, setEditingAdjustment] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [formData, setFormData] = useState({
    productId: '',
    type: 'addition',
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
  })

  // Mock products data
  const mockProducts = [
    { id: 1, name: 'Paracetamol 500mg', sku: 'PARA500', currentStock: 150, unit: 'tablets' },
    { id: 2, name: 'Amoxicillin 250mg', sku: 'AMOX250', currentStock: 25, unit: 'capsules' },
    { id: 3, name: 'Vitamin C 1000mg', sku: 'VITC1000', currentStock: 0, unit: 'tablets' },
    { id: 4, name: 'Ibuprofen 400mg', sku: 'IBU400', currentStock: 200, unit: 'tablets' },
    { id: 5, name: 'Cough Syrup', sku: 'COUGH001', currentStock: 75, unit: 'bottles' }
  ]

  // Mock adjustments data
  useEffect(() => {
    const mockAdjustments = [
      {
        id: 1,
        productId: 1,
        productName: 'Paracetamol 500mg',
        productSku: 'PARA500',
        type: 'addition',
        quantity: 100,
        previousStock: 50,
        newStock: 150,
        reason: 'Stock replenishment',
        reference: 'PO-2024-001',
        notes: 'Received from supplier',
        adjustedBy: 'Dr. Sarah Wilson',
        adjustedAt: '2024-01-20T10:30:00',
        status: 'completed'
      },
      {
        id: 2,
        productId: 2,
        productName: 'Amoxicillin 250mg',
        productSku: 'AMOX250',
        type: 'reduction',
        quantity: 5,
        previousStock: 30,
        newStock: 25,
        reason: 'Damaged items',
        reference: 'ADJ-2024-001',
        notes: 'Found 5 damaged capsules during inspection',
        adjustedBy: 'John Smith',
        adjustedAt: '2024-01-19T14:20:00',
        status: 'completed'
      },
      {
        id: 3,
        productId: 4,
        productName: 'Ibuprofen 400mg',
        productSku: 'IBU400',
        type: 'correction',
        quantity: 50,
        previousStock: 150,
        newStock: 200,
        reason: 'Stock count correction',
        reference: 'SC-2024-001',
        notes: 'Physical count showed 200 units, system had 150',
        adjustedBy: 'Dr. Sarah Wilson',
        adjustedAt: '2024-01-18T09:15:00',
        status: 'completed'
      }
    ]
    
    setTimeout(() => {
      setAdjustments(mockAdjustments)
      setProducts(mockProducts)
      setLoading(false)
    }, 500)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    const selectedProduct = products.find(p => p.id === parseInt(formData.productId))
    
    if (!selectedProduct) return

    let newStock = selectedProduct.currentStock
    let adjustmentQuantity = parseInt(formData.quantity)

    switch (formData.type) {
      case 'addition':
        newStock += adjustmentQuantity
        break
      case 'reduction':
        newStock = Math.max(0, newStock - adjustmentQuantity)
        adjustmentQuantity = -adjustmentQuantity // Store as negative for reduction
        break
      case 'correction':
        adjustmentQuantity = parseInt(formData.quantity) - selectedProduct.currentStock
        newStock = parseInt(formData.quantity)
        break
    }

    if (editingAdjustment) {
      // Update existing adjustment
      setAdjustments(adjustments.map(adjustment => 
        adjustment.id === editingAdjustment.id 
          ? { 
              ...adjustment, 
              ...formData,
              productName: selectedProduct.name,
              productSku: selectedProduct.sku,
              quantity: Math.abs(adjustmentQuantity),
              previousStock: selectedProduct.currentStock,
              newStock: newStock,
              adjustedBy: user?.name || user?.username,
              adjustedAt: new Date().toISOString()
            }
          : adjustment
      ))
    } else {
      // Add new adjustment
      const newAdjustment = {
        id: Date.now(),
        productId: parseInt(formData.productId),
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        type: formData.type,
        quantity: Math.abs(adjustmentQuantity),
        previousStock: selectedProduct.currentStock,
        newStock: newStock,
        reason: formData.reason,
        reference: formData.reference,
        notes: formData.notes,
        adjustedBy: user?.name || user?.username,
        adjustedAt: new Date().toISOString(),
        status: 'completed'
      }
      setAdjustments([newAdjustment, ...adjustments])

      // Update product stock in mock data
      setProducts(products.map(p => 
        p.id === parseInt(formData.productId) 
          ? { ...p, currentStock: newStock }
          : p
      ))
    }
    
    resetForm()
  }

  const resetForm = () => {
    setShowAddModal(false)
    setEditingAdjustment(null)
    setFormData({
      productId: '',
      type: 'addition',
      quantity: '',
      reason: '',
      reference: '',
      notes: ''
    })
  }

  const handleEdit = (adjustment) => {
    setEditingAdjustment(adjustment)
    setFormData({
      productId: adjustment.productId.toString(),
      type: adjustment.type,
      quantity: adjustment.type === 'correction' ? adjustment.newStock.toString() : adjustment.quantity.toString(),
      reason: adjustment.reason,
      reference: adjustment.reference,
      notes: adjustment.notes
    })
    setShowAddModal(true)
  }

  const handleDelete = (adjustmentId) => {
    if (window.confirm('Are you sure you want to delete this adjustment? This action cannot be undone.')) {
      setAdjustments(adjustments.filter(adjustment => adjustment.id !== adjustmentId))
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'addition': return 'bg-green-100 text-green-800'
      case 'reduction': return 'bg-red-100 text-red-800'
      case 'correction': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'addition': return '+'
      case 'reduction': return '-'
      case 'correction': return '⚖️'
      default: return '?'
    }
  }

  const filteredAdjustments = adjustments.filter(adjustment => {
    const matchesSearch = adjustment.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.productSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         adjustment.reference.toLowerCase().includes(searchTerm.toLowerCase())
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
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-pharma-teal to-pharma-medium text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Adjustment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Adjustments</p>
              <p className="text-2xl font-bold">{adjustments.length}</p>
            </div>
            <div className="text-2xl">📊</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Additions</p>
              <p className="text-2xl font-bold text-green-600">
                {adjustments.filter(a => a.type === 'addition').length}
              </p>
            </div>
            <div className="text-2xl">➕</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reductions</p>
              <p className="text-2xl font-bold text-red-600">
                {adjustments.filter(a => a.type === 'reduction').length}
              </p>
            </div>
            <div className="text-2xl">➖</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Corrections</p>
              <p className="text-2xl font-bold text-blue-600">
                {adjustments.filter(a => a.type === 'correction').length}
              </p>
            </div>
            <div className="text-2xl">⚖️</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
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
            <option value="addition">Additions</option>
            <option value="reduction">Reductions</option>
            <option value="correction">Corrections</option>
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
                  Stock Change
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Adjusted By
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
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
                        {adjustment.reference && `Ref: ${adjustment.reference}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(adjustment.type)}`}>
                        {getTypeIcon(adjustment.type)} {adjustment.type.charAt(0).toUpperCase() + adjustment.type.slice(1)}
                      </span>
                      <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Qty: {adjustment.quantity}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {adjustment.reason}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="flex items-center space-x-2">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                          {adjustment.previousStock}
                        </span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                        </svg>
                        <span className="font-medium">
                          {adjustment.newStock}
                        </span>
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {adjustment.type === 'addition' && `+${adjustment.quantity}`}
                        {adjustment.type === 'reduction' && `-${adjustment.quantity}`}
                        {adjustment.type === 'correction' && `${adjustment.newStock - adjustment.previousStock > 0 ? '+' : ''}${adjustment.newStock - adjustment.previousStock}`}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div className="font-medium">{adjustment.adjustedBy}</div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {new Date(adjustment.adjustedAt).toLocaleDateString()} {new Date(adjustment.adjustedAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(adjustment)}
                        className="text-pharma-teal hover:text-pharma-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(adjustment.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.sku}) - Current: {product.currentStock} {product.unit}
                      </option>
                    ))}
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
                    <option value="addition">Addition (+)</option>
                    <option value="reduction">Reduction (-)</option>
                    <option value="correction">Stock Correction</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {formData.type === 'correction' ? 'New Stock Level *' : 'Quantity *'}
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
                    placeholder={formData.type === 'correction' ? 'Enter correct stock level' : 'Enter quantity to adjust'}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Reference
                  </label>
                  <input
                    type="text"
                    value={formData.reference}
                    onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="PO number, batch reference, etc."
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
              
              <div className="mt-4">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  rows="3"
                  placeholder="Additional notes about this adjustment..."
                />
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
                  className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:shadow-lg transition-all duration-200"
                >
                  {editingAdjustment ? 'Update' : 'Create'} Adjustment
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

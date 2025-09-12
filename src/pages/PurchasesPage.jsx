import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import purchasesApi from '../services/purchasesApi'
import suppliersApi from '../services/suppliersApi'

const PurchasesPage = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPurchase, setSelectedPurchase] = useState(null)
  const [filter, setFilter] = useState('all')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Form state for creating/editing purchases
  const [formData, setFormData] = useState({
    supplierId: '',
    totalAmount: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseItems: []
  })

  // Load purchases and suppliers
  useEffect(() => {
    loadPurchases()
    loadSuppliers()
  }, [])

  const loadPurchases = async () => {
    try {
      setLoading(true)
      const data = await purchasesApi.getAll()
      setPurchases(data)
    } catch (err) {
      console.error('Error loading purchases:', err)
      setError('Failed to load purchases: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliers = async () => {
    try {
      const data = await suppliersApi.getAll()
      setSuppliers(data)
    } catch (err) {
      console.error('Error loading suppliers:', err)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ORDERED': return 'bg-blue-100 text-blue-800'
      case 'CANCELLED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCreatePurchase = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      await purchasesApi.create(formData)
      setSuccess('Purchase created successfully!')
      setShowAddModal(false)
      resetForm()
      loadPurchases()
    } catch (err) {
      console.error('Error creating purchase:', err)
      setError('Failed to create purchase: ' + err.message)
    }
  }

  const handleUpdatePurchase = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      await purchasesApi.update(selectedPurchase.purchaseId, formData)
      setSuccess('Purchase updated successfully!')
      setShowEditModal(false)
      setSelectedPurchase(null)
      resetForm()
      loadPurchases()
    } catch (err) {
      console.error('Error updating purchase:', err)
      setError('Failed to update purchase: ' + err.message)
    }
  }

  const handleDeletePurchase = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase?')) {
      return
    }
    try {
      setError(null)
      await purchasesApi.delete(id)
      setSuccess('Purchase deleted successfully!')
      loadPurchases()
    } catch (err) {
      console.error('Error deleting purchase:', err)
      setError('Failed to delete purchase: ' + err.message)
    }
  }

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setError(null)
      await purchasesApi.updateStatus(id, newStatus)
      setSuccess('Purchase status updated successfully!')
      loadPurchases()
    } catch (err) {
      console.error('Error updating purchase status:', err)
      setError('Failed to update purchase status: ' + err.message)
    }
  }

  const resetForm = () => {
    setFormData({
      supplierId: '',
      totalAmount: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseItems: []
    })
  }

  const openEditModal = (purchase) => {
    setSelectedPurchase(purchase)
    setFormData({
      supplierId: purchase.supplier?.supplierId || '',
      totalAmount: purchase.totalAmount?.toString() || '',
      purchaseDate: purchase.purchaseDate || new Date().toISOString().split('T')[0],
      purchaseItems: purchase.purchaseItems || []
    })
    setShowEditModal(true)
  }

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'all') return true
    return purchase.purchaseStatus === filter
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
          <h1 className="text-2xl font-bold">All Purchases</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage purchases and supplier transactions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-pharma-teal to-pharma-medium text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Purchase
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Orders</p>
              <p className="text-2xl font-bold">{purchases.length}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {purchases.filter(p => p.purchaseStatus === 'PENDING').length}
              </p>
            </div>
            <div className="text-2xl">⏳</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivered</p>
              <p className="text-2xl font-bold text-green-600">
                {purchases.filter(p => p.purchaseStatus === 'DELIVERED').length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Value</p>
              <p className="text-2xl font-bold text-pharma-teal">
                ${purchases.reduce((sum, p) => sum + p.totalAmount, 0).toFixed(2)}
              </p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All Purchases' },
          { key: 'PENDING', label: 'Pending' },
          { key: 'ORDERED', label: 'Ordered' },
          { key: 'DELIVERED', label: 'Delivered' },
          { key: 'CANCELLED', label: 'Cancelled' }
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
            {filterOption.label}
          </button>
        ))}
      </div>

      {/* Purchases List */}
      <div className="space-y-4">
        {filteredPurchases.map((purchase) => (
          <div key={purchase.purchaseId} className={`rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">Purchase #{purchase.purchaseId}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Supplier: {purchase.supplier?.supplierName || 'Unknown'} [{purchase.supplier?.contactPerson || 'No Contact'}]
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.purchaseStatus)}`}>
                {purchase.purchaseStatus?.charAt(0).toUpperCase() + purchase.purchaseStatus?.slice(1).toLowerCase()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Purchase Date</p>
                <p className="font-medium">{new Date(purchase.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Created By</p>
                <p className="font-medium">User #{purchase.createdBy}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                <p className="font-bold text-pharma-teal text-lg">${purchase.totalAmount?.toFixed(2) || '0.00'}</p>
              </div>
            </div>

            {/* Items */}
            {purchase.purchaseItems && purchase.purchaseItems.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Items:</h4>
                <div className="space-y-2">
                  {purchase.purchaseItems.map((item, index) => (
                    <div key={index} className={`flex justify-between items-center py-2 px-3 rounded ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}>
                      <div>
                        <span className="font-medium">{item.productName || 'Unknown Product'}</span>
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Qty: {item.quantity || 0}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">${item.totalPrice?.toFixed(2) || '0.00'}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          ${item.unitPrice?.toFixed(2) || '0.00'}/unit
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-2">
                <select
                  value={purchase.purchaseStatus}
                  onChange={(e) => handleUpdateStatus(purchase.purchaseId, e.target.value)}
                  className={`px-3 py-1 rounded text-sm border ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="PENDING">Pending</option>
                  <option value="ORDERED">Ordered</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => openEditModal(purchase)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-pharma-teal text-white hover:bg-pharma-medium'
                      : 'bg-pharma-teal text-white hover:bg-pharma-medium'
                  }`}
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDeletePurchase(purchase.purchaseId)}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto border-2 border-green-500 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-green-600">Create New Purchase</h2>
            </div>
            
            <form onSubmit={handleCreatePurchase} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Supplier *
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.supplierName} [{supplier.contactPerson || 'No Contact'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Purchase Date *
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:shadow-lg transition-all duration-200"
                >
                  Create Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Purchase Modal */}
      {showEditModal && selectedPurchase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Edit Purchase #{selectedPurchase.purchaseId}</h2>
            
            <form onSubmit={handleUpdatePurchase} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Supplier *
                </label>
                <select
                  value={formData.supplierId}
                  onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="">Select a supplier</option>
                  {suppliers.map(supplier => (
                    <option key={supplier.supplierId} value={supplier.supplierId}>
                      {supplier.supplierName} [{supplier.contactPerson || 'No Contact'}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Total Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                  required
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Purchase Date *
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedPurchase(null)
                    resetForm()
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:shadow-lg transition-all duration-200"
                >
                  Update Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasesPage

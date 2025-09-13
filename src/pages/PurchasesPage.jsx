import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import purchasesApi from '../services/purchasesApi'
import suppliersApi from '../services/suppliersApi'
import productsApi from '../services/productsApi'

const PurchasesPage = ({ isDarkMode }) => {
  const navigate = useNavigate()
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [products, setProducts] = useState([])
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

  // State for managing purchase items in the form
  const [newPurchaseItem, setNewPurchaseItem] = useState({
    productId: '',
    batchNumber: '',
    quantity: '',
    unitPrice: '',
    purchasePricePerUnit: '',
    expiryDate: '',
    manufacturingDate: '',
    location: ''
  })

  // Load purchases, suppliers, and products
  useEffect(() => {
    loadPurchases()
    loadSuppliers()
    loadProducts()
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

  const loadProducts = async () => {
    try {
      const data = await productsApi.getAll()
      setProducts(data)
    } catch (err) {
      console.error('Error loading products:', err)
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
      
      // Validate required fields
      if (!formData.supplierId || formData.supplierId === '') {
        setError('Please select a supplier')
        return
      }

      if (!formData.totalAmount || parseFloat(formData.totalAmount) < 0) {
        setError('Please enter a valid total amount (must be at least 0.00)')
        return
      }

      if (!formData.purchaseDate) {
        setError('Please select a purchase date')
        return
      }

      // Validate that we have at least one purchase item
      if (!formData.purchaseItems || formData.purchaseItems.length === 0) {
        setError('Please add at least one purchase item')
        return
      }

      // Validate supplierId is a valid number
      const supplierId = parseInt(formData.supplierId)
      if (isNaN(supplierId) || supplierId <= 0) {
        setError('Invalid supplier selected')
        return
      }

      // Format data according to PurchaseCreateDTO structure
      const purchaseData = {
        supplierId: supplierId,
        totalAmount: parseFloat(formData.totalAmount),
        purchaseDate: formData.purchaseDate,
        purchaseItems: formData.purchaseItems.map(item => {
          // Validate that productBatch has all required fields
          if (!item.productBatch.productId || !item.productBatch.batchNumber) {
            throw new Error('Invalid product batch data: missing productId or batchNumber')
          }
          
          return {
            productBatch: {
              productId: parseInt(item.productBatch.productId),
              batchNumber: item.productBatch.batchNumber,
              quantity: parseInt(item.productBatch.quantity),
              purchasePricePerUnit: parseFloat(item.productBatch.purchasePricePerUnit),
              expiryDate: item.productBatch.expiryDate,
              manufacturingDate: item.productBatch.manufacturingDate,
              location: item.productBatch.location || null
            },
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice)
          }
        })
      }

      await purchasesApi.create(purchaseData)
      
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
    setNewPurchaseItem({
      productId: '',
      batchNumber: '',
      quantity: '',
      unitPrice: '',
      purchasePricePerUnit: '',
      expiryDate: '',
      manufacturingDate: '',
      location: ''
    })
  }

  const addPurchaseItem = () => {
    // Validate required fields
    if (!newPurchaseItem.productId || !newPurchaseItem.batchNumber || !newPurchaseItem.quantity || 
        !newPurchaseItem.unitPrice || !newPurchaseItem.purchasePricePerUnit || 
        !newPurchaseItem.expiryDate || !newPurchaseItem.manufacturingDate) {
      setError('Please fill in all required purchase item fields')
      return
    }

    // Validate quantity (must be at least 1)
    const quantity = parseInt(newPurchaseItem.quantity)
    if (quantity < 1) {
      setError('Quantity must be at least 1')
      return
    }

    // Validate unit price (must be positive)
    const unitPrice = parseFloat(newPurchaseItem.unitPrice)
    if (unitPrice < 0) {
      setError('Unit price must be a positive value')
      return
    }

    // Validate purchase price per unit (must be positive)
    const purchasePricePerUnit = parseFloat(newPurchaseItem.purchasePricePerUnit)
    if (purchasePricePerUnit <= 0) {
      setError('Purchase price per unit must be greater than 0')
      return
    }

    // Validate batch number length
    if (newPurchaseItem.batchNumber.length > 100) {
      setError('Batch number must not exceed 100 characters')
      return
    }

    // Validate location length if provided
    if (newPurchaseItem.location && newPurchaseItem.location.length > 50) {
      setError('Location must not exceed 50 characters')
      return
    }

    // Validate date logic
    const manufacturingDate = new Date(newPurchaseItem.manufacturingDate)
    const expiryDate = new Date(newPurchaseItem.expiryDate)
    if (manufacturingDate >= expiryDate) {
      setError('Manufacturing date must be before expiry date')
      return
    }

    const selectedProduct = products.find(p => p.productId === parseInt(newPurchaseItem.productId))

    // Create ProductBatchCreateDTO
    const productBatch = {
      productId: parseInt(newPurchaseItem.productId),
      batchNumber: newPurchaseItem.batchNumber,
      quantity: quantity,
      purchasePricePerUnit: purchasePricePerUnit,
      expiryDate: newPurchaseItem.expiryDate,
      manufacturingDate: newPurchaseItem.manufacturingDate,
      location: newPurchaseItem.location || null
    }

    // Create purchase item matching PurchaseItemCreateDTO structure
    const purchaseItem = {
      productBatch: productBatch,
      quantity: quantity,
      unitPrice: unitPrice
      // Note: purchaseId will be set when the purchase is created
    }

    // For display purposes, we'll store additional info separately
    const displayItem = {
      ...purchaseItem,
      productId: parseInt(newPurchaseItem.productId),
      productName: selectedProduct?.name || 'Unknown Product',
      batchNumber: newPurchaseItem.batchNumber
    }

    setFormData({
      ...formData,
      purchaseItems: [...formData.purchaseItems, displayItem]
    })

    // Reset the new purchase item form
    setNewPurchaseItem({
      productId: '',
      batchNumber: '',
      quantity: '',
      unitPrice: '',
      purchasePricePerUnit: '',
      expiryDate: '',
      manufacturingDate: '',
      location: ''
    })
    setError(null) // Clear any previous errors
  }

  const removePurchaseItem = (index) => {
    const updatedItems = formData.purchaseItems.filter((_, i) => i !== index)
    setFormData({
      ...formData,
      purchaseItems: updatedItems
    })
  }

  const handleProductChange = (productId) => {
    setNewPurchaseItem({
      ...newPurchaseItem,
      productId
    })
  }

  const handleCreateProduct = () => {
    navigate('/all-products')
  }

  const handleCreateSupplier = () => {
    navigate('/suppliers')
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
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
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
                  Supplier: {purchase.supplier?.name || 'Unknown'} [{purchase.supplier?.contactPerson || 'No Contact'}]
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
          <div className={`rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-6">Create New Purchase</h2>
            
            <form onSubmit={handleCreatePurchase}>
              {/* Purchase Header Section */}
              <div className={`rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className="text-lg font-semibold mb-4">Purchase Header</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Supplier *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={formData.supplierId}
                        onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                        required
                        className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                          isDarkMode
                            ? 'bg-gray-600 border-gray-500 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map((supplier, index) => (
                          <option key={supplier.supplierId || supplier.id || `supplier-${index}`} value={supplier.supplierId || supplier.id}>
                            {supplier.name} [{supplier.contactPerson || 'No Contact'}]
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleCreateSupplier}
                        className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-pharma-teal text-white border-pharma-teal hover:bg-pharma-medium'
                            : 'bg-pharma-teal text-white border-pharma-teal hover:bg-pharma-medium'
                        }`}
                        title="Create new supplier"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Purchase Date *
                    </label>
                    <input
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                      required
                      max={new Date().toISOString().split('T')[0]}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                        isDarkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Total Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                      required
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                        isDarkMode
                          ? 'bg-gray-600 border-gray-500 text-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Purchase Items Section */}
              <div className={`rounded-lg p-4 mb-6 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Purchase Items</h3>
                  <div className={`px-2 py-1 rounded text-sm ${
                    formData.purchaseItems.length > 0 
                      ? isDarkMode 
                        ? 'bg-green-900 text-green-400' 
                        : 'bg-green-100 text-green-800'
                      : isDarkMode 
                        ? 'bg-gray-600 text-gray-400' 
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {formData.purchaseItems.length} item{formData.purchaseItems.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {/* Add New Item Form */}
                <div className="space-y-4 mb-4">
                    {/* First Row: Product and Batch Number */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Product *
                        </label>
                        <div className="flex gap-2">
                          <select
                            value={newPurchaseItem.productId}
                            onChange={(e) => handleProductChange(e.target.value)}
                            className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                              isDarkMode
                                ? 'bg-gray-600 border-gray-500 text-white'
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          >
                            <option value="">Select product</option>
                            {products.map((product, index) => (
                              <option key={product.productId || `product-${index}`} value={product.productId}>
                                {product.sku} [{product.barcode}] - {product.name}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleCreateProduct}
                            className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
                              isDarkMode
                                ? 'bg-pharma-teal text-white border-pharma-teal hover:bg-pharma-medium'
                                : 'bg-pharma-teal text-white border-pharma-teal hover:bg-pharma-medium'
                            }`}
                            title="Create new product"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Batch Number *
                        </label>
                        <input
                          type="text"
                          maxLength="100"
                          value={newPurchaseItem.batchNumber}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, batchNumber: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Enter batch number"
                        />
                      </div>
                    </div>

                    {/* Second Row: Quantity, Unit Price, Purchase Price */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={newPurchaseItem.quantity}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, quantity: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="1"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Unit Price *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={newPurchaseItem.unitPrice}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, unitPrice: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Purchase Price Per Unit *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={newPurchaseItem.purchasePricePerUnit}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, purchasePricePerUnit: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Third Row: Manufacturing Date, Expiry Date, Location */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Manufacturing Date *
                        </label>
                        <input
                          type="date"
                          value={newPurchaseItem.manufacturingDate}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, manufacturingDate: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={newPurchaseItem.expiryDate}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, expiryDate: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      </div>

                      <div>
                        <label className={`block text-sm font-medium mb-2 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          Location (Optional)
                        </label>
                        <input
                          type="text"
                          maxLength="50"
                          value={newPurchaseItem.location}
                          onChange={(e) => setNewPurchaseItem({...newPurchaseItem, location: e.target.value})}
                          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                            isDarkMode
                              ? 'bg-gray-600 border-gray-500 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Enter location (optional)"
                        />
                      </div>
                    </div>

                    {/* Add Item Button */}
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={addPurchaseItem}
                        className="bg-gradient-to-r from-pharma-teal to-pharma-medium text-white px-8 py-3 rounded-lg hover:from-pharma-medium hover:to-pharma-teal hover:shadow-lg transition-all duration-200 font-medium"
                      >
                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Item
                      </button>
                    </div>
                </div>

                {/* Added Items List */}
                {formData.purchaseItems.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Added Items:</h4>
                    <div className="space-y-2">
                      {formData.purchaseItems.map((item, index) => (
                        <div key={index} className={`py-3 px-4 rounded ${
                          isDarkMode ? 'bg-gray-600' : 'bg-white'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <span className="font-medium text-lg">{item.productName}</span>
                              <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                                <div>Batch: {item.batchNumber}</div>
                                <div>Qty: {item.quantity} | Unit Price: ${item.unitPrice.toFixed(2)} | Purchase Price: ${item.productBatch.purchasePricePerUnit.toFixed(2)}</div>
                                <div>Manufacturing: {new Date(item.productBatch.manufacturingDate).toLocaleDateString()} | Expiry: {new Date(item.productBatch.expiryDate).toLocaleDateString()}</div>
                                {item.productBatch.location && <div>Location: {item.productBatch.location}</div>}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-lg">
                                ${(item.quantity * item.unitPrice).toFixed(2)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removePurchaseItem(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
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
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
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
            
            <form onSubmit={handleUpdatePurchase}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier *
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier, index) => (
                      <option key={supplier.supplierId || supplier.id || `edit-supplier-${index}`} value={supplier.supplierId || supplier.id}>
                        {supplier.name} [{supplier.contactPerson || 'No Contact'}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Total Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.totalAmount}
                    onChange={(e) => setFormData({...formData, totalAmount: e.target.value})}
                    required
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    required
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedPurchase(null)
                    resetForm()
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
                  type="submit"
                  className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
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

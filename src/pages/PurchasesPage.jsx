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
  const [editingItemIndex, setEditingItemIndex] = useState(null)
  const [editingItem, setEditingItem] = useState({ quantity: '', unitPrice: '' })
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
      
      // Prepare the PurchaseUpdateDTO data
      const updateData = {
        purchaseStatus: newStatus
      }
      
      await purchasesApi.updateStatus(id, updateData)
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

  const startEditingItem = (index) => {
    const item = formData.purchaseItems[index]
    setEditingItemIndex(index)
    setEditingItem({
      quantity: item.quantity?.toString() || '',
      unitPrice: item.unitPrice?.toString() || ''
    })
  }

  const cancelEditingItem = () => {
    setEditingItemIndex(null)
    setEditingItem({ quantity: '', unitPrice: '' })
  }

  const saveEditingItem = async () => {
    if (!editingItem.quantity || !editingItem.unitPrice) {
      setError('Please fill in all required fields')
      return
    }

    try {
      setError(null)
      
      // Prepare the PurchaseItemUpdateDTO data
      const itemUpdateData = {
        quantity: parseInt(editingItem.quantity),
        unitPrice: parseFloat(editingItem.unitPrice)
      }

      // Get the current item to find its ID
      const currentItem = formData.purchaseItems[editingItemIndex]
      
      // Use the correct item ID field (could be purchaseItemId, id, or itemId)
      const itemId = currentItem.purchaseItemId || currentItem.id || currentItem.itemId || editingItemIndex
      
      // Call the API to update the item
      await purchasesApi.updateItem(selectedPurchase.purchaseId, itemId, itemUpdateData)

      // Update local state
      const updatedItems = [...formData.purchaseItems]
      updatedItems[editingItemIndex] = {
        ...updatedItems[editingItemIndex],
        quantity: itemUpdateData.quantity,
        unitPrice: itemUpdateData.unitPrice
      }

      setFormData({
        ...formData,
        purchaseItems: updatedItems
      })

      setEditingItemIndex(null)
      setEditingItem({ quantity: '', unitPrice: '' })
      setSuccess('Item updated successfully!')
      
      // Reload purchases to get updated data
      loadPurchases()
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Failed to update item: ' + err.message)
    }
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
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Received</p>
              <p className="text-2xl font-bold text-green-600">
                {purchases.filter(p => p.purchaseStatus === 'RECEIVED').length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Ordered</p>
              <p className="text-2xl font-bold text-blue-600">
                {purchases.filter(p => p.purchaseStatus === 'ORDERED').length}
              </p>
            </div>
            <div className="text-2xl">📦</div>
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


      {/* Purchases List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {purchases.map((purchase) => (
          <div key={purchase.purchaseId} className={`rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            {/* Card Header */}
            <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-pharma-teal">#{purchase.purchaseId}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {new Date(purchase.purchaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  purchase.purchaseStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  purchase.purchaseStatus === 'ORDERED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                  purchase.purchaseStatus === 'RECEIVED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  purchase.purchaseStatus === 'CANCELLED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}>
                  {purchase.purchaseStatus}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-pharma-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {purchase.supplier?.name || 'Unknown Supplier'}
                  </span>
                </div>
                
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-pharma-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    User #{purchase.createdBy}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6">
              {/* Total Amount */}
              <div className="text-center mb-6">
                <div className={`text-3xl font-bold ${isDarkMode ? 'text-pharma-teal' : 'text-pharma-teal'}`}>
                  ${purchase.totalAmount?.toFixed(2) || '0.00'}
                </div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
              </div>

              {/* Items Preview */}
              {purchase.purchaseItems && purchase.purchaseItems.length > 0 && (
                <div className="mb-6">
                  <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Items ({purchase.purchaseItems.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {purchase.purchaseItems.slice(0, 3).map((item, index) => (
                      <div key={index} className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.productName || 'Unknown Product'}</p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Qty: {item.quantity || 0} × ${item.unitPrice?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                        <div className="text-right ml-2">
                          <div className="font-semibold text-sm">
                            ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {purchase.purchaseItems.length > 3 && (
                      <p className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        +{purchase.purchaseItems.length - 3} more items
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => openEditModal(purchase)}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-pharma-teal text-white hover:bg-pharma-medium hover:shadow-lg'
                      : 'bg-pharma-teal text-white hover:bg-pharma-medium hover:shadow-lg'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit
                </button>
                <button
                  onClick={() => handleDeletePurchase(purchase.purchaseId)}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
                      : 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
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
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status *
                  </label>
                  <select
                    value={selectedPurchase?.purchaseStatus || 'PENDING'}
                    onChange={(e) => handleUpdateStatus(selectedPurchase.purchaseId, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="ORDERED">Ordered</option>
                    <option value="RECEIVED">Received</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Purchase Items */}
              {formData.purchaseItems && formData.purchaseItems.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Purchase Items</h3>
                  <div className="space-y-4">
                    {formData.purchaseItems.map((item, index) => (
                      <div key={index} className={`p-4 rounded-lg border ${
                        isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.productName || 'Unknown Product'}</h4>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              Batch: {item.batchNumber || 'N/A'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditingItem(index)}
                            className="px-2 py-1 bg-pharma-teal text-white text-xs rounded hover:bg-pharma-medium"
                          >
                            Edit
                          </button>
                        </div>

                        {editingItemIndex === index ? (
                          <div className="mt-3 p-3 bg-gray-100 dark:bg-gray-600 rounded">
                            <div className="flex gap-4 items-center">
                              <div className="flex-1">
                                <label className={`block text-sm font-medium mb-1 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Quantity *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editingItem.quantity}
                                  onChange={(e) => setEditingItem({...editingItem, quantity: e.target.value})}
                                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                                    isDarkMode
                                      ? 'bg-gray-700 border-gray-500 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="Enter quantity"
                                />
                              </div>
                              <div className="flex-1">
                                <label className={`block text-sm font-medium mb-1 ${
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  Unit Price *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={editingItem.unitPrice}
                                  onChange={(e) => setEditingItem({...editingItem, unitPrice: e.target.value})}
                                  className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                                    isDarkMode
                                      ? 'bg-gray-700 border-gray-500 text-white'
                                      : 'bg-white border-gray-300 text-gray-900'
                                  }`}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveEditingItem}
                                  className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 font-medium"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingItem}
                                  className="px-4 py-2 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Quantity: </span>
                              <span className="font-medium">{item.quantity || 0}</span>
                            </div>
                            <div>
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Unit Price: </span>
                              <span className="font-medium">${item.unitPrice?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="md:col-span-2">
                              <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total: </span>
                              <span className="font-bold text-pharma-teal">
                                ${((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setSelectedPurchase(null)
                    setEditingItemIndex(null)
                    setEditingItem({ quantity: '', unitPrice: '' })
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

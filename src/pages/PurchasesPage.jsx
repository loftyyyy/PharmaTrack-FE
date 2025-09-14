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
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

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

  // Filter and search logic
  const getFilteredPurchases = () => {
    return purchases.filter(purchase => {
      // Text search (purchase ID, supplier name, or product names)
      const matchesSearch = !searchTerm || 
        purchase.purchaseId.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.supplier?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (purchase.purchaseItems || []).some(item => 
          (item.productName || '').toLowerCase().includes(searchTerm.toLowerCase())
        )

      // Status filter
      const matchesStatus = statusFilter === 'ALL' || purchase.purchaseStatus === statusFilter

      // Date range filter
      const purchaseDate = new Date(purchase.purchaseDate)
      const matchesDateFrom = !dateFrom || purchaseDate >= new Date(dateFrom)
      const matchesDateTo = !dateTo || purchaseDate <= new Date(dateTo)

      // Amount range filter
      const totalAmount = purchase.totalAmount || 0
      const matchesAmountMin = !amountMin || totalAmount >= parseFloat(amountMin)
      const matchesAmountMax = !amountMax || totalAmount <= parseFloat(amountMax)

      return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax
    })
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('ALL')
    setDateFrom('')
    setDateTo('')
    setAmountMin('')
    setAmountMax('')
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
        purchaseItems: formData.purchaseItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          batchNumber: item.batchNumber,
          batchQuantity: item.batchQuantity,
          purchasePricePerUnit: item.purchasePricePerUnit,
          expiryDate: item.expiryDate,
          manufacturingDate: item.manufacturingDate,
          location: item.location
        }))
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
      setSuccess(null) // Clear any previous success messages
      
      const purchaseId = selectedPurchase.purchaseId
      const newStatus = formData.purchaseStatus
      
      // Use different endpoints based on status
      if (newStatus === 'RECEIVED') {
        await purchasesApi.confirm(purchaseId)
        setSuccess('Purchase confirmed successfully!')
      } else if (newStatus === 'CANCELLED') {
        await purchasesApi.cancel(purchaseId)
        setSuccess('Purchase cancelled successfully!')
      } else {
        // For PENDING and ORDERED, use the general updateStatus endpoint
        const updateData = {
          purchaseStatus: newStatus
        }
        await purchasesApi.updateStatus(purchaseId, updateData)
        setSuccess('Purchase status updated successfully!')
      }
      
      // Close modal and reset on success
      setShowEditModal(false)
      setSelectedPurchase(null)
      resetForm()
      loadPurchases()
    } catch (err) {
      console.error('Error updating purchase status:', err)
      setError('Failed to update purchase status: ' + err.message)
      // Close modal on error and show error on main page
      setShowEditModal(false)
      setSelectedPurchase(null)
      resetForm()
    }
  }




  const resetForm = () => {
    setFormData({
      supplierId: '',
      totalAmount: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      purchaseItems: [],
      purchaseStatus: 'PENDING'
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

    // Validate batch quantity (must be at least 1)
    const batchQuantity = parseInt(newPurchaseItem.quantity) // Using same value for now
    if (batchQuantity < 1) {
      setError('Batch quantity must be at least 1')
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

    // Create purchase item matching new PurchaseItemCreateDTO structure
    const purchaseItem = {
      productId: parseInt(newPurchaseItem.productId),
      quantity: quantity,
      unitPrice: unitPrice,
      batchNumber: newPurchaseItem.batchNumber,
      batchQuantity: batchQuantity,
      purchasePricePerUnit: purchasePricePerUnit,
      expiryDate: newPurchaseItem.expiryDate,
      manufacturingDate: newPurchaseItem.manufacturingDate,
      location: newPurchaseItem.location || null
      // Note: purchaseId will be set when the purchase is created
    }

    // For display purposes, we'll store additional info separately
    const displayItem = {
      ...purchaseItem,
      productName: selectedProduct?.name || 'Unknown Product'
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
      supplierId: '',
      totalAmount: '',
      purchaseDate: '',
      purchaseItems: [],
      purchaseStatus: purchase.purchaseStatus || 'PENDING'
    })
    setShowEditModal(true)
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

      {/* Search and Filters */}
      <div className={`rounded-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          {/* Search Input */}
          <div className="flex-1">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Search Purchases
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by purchase ID, supplier, or product name..."
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

          {/* Status Filter */}
          <div className="lg:w-48">
            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Date From */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Date To */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>

              {/* Amount Min */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Min Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountMin}
                  onChange={(e) => setAmountMin(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>

              {/* Amount Max */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Max Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amountMax}
                  onChange={(e) => setAmountMax(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
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
            Showing {getFilteredPurchases().length} of {purchases.length} purchases
          </p>
        </div>
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
      {getFilteredPurchases().length === 0 ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">No purchases found</h3>
          <p className="mb-4">
            {searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo || amountMin || amountMax
              ? 'Try adjusting your search criteria or clear the filters.'
              : 'No purchases have been created yet.'}
          </p>
          {(searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo || amountMin || amountMax) && (
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
          {getFilteredPurchases().map((purchase) => (
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
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Batch: {item.batchNumber || 'N/A'}
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

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => openEditModal(purchase)}
                  className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-pharma-teal text-white hover:bg-pharma-medium hover:shadow-lg'
                      : 'bg-pharma-teal text-white hover:bg-pharma-medium hover:shadow-lg'
                  }`}
                >
                  <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  Edit Status
                </button>
              </div>
            </div>
          </div>
        ))}
        </div>
      )}

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
                                <div>Qty: {item.quantity} | Unit Price: ${item.unitPrice.toFixed(2)} | Purchase Price: ${item.purchasePricePerUnit.toFixed(2)}</div>
                                <div>Manufacturing: {new Date(item.manufacturingDate).toLocaleDateString()} | Expiry: {new Date(item.expiryDate).toLocaleDateString()}</div>
                                {item.location && <div>Location: {item.location}</div>}
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
            <h2 className="text-xl font-bold mb-4">Update Purchase Status #{selectedPurchase.purchaseId}</h2>
            
            <form onSubmit={handleUpdatePurchase}>
              <div className="max-w-md mx-auto">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Update Purchase Status *
                  </label>
                  <select
                    value={formData.purchaseStatus || 'PENDING'}
                    onChange={(e) => setFormData({...formData, purchaseStatus: e.target.value})}
                    required
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
                  Update Status
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

import { useState, useEffect, useRef, useCallback } from 'react'
import { productBatchesApi } from '../services/productBatchesApi'
import customersApi from '../services/customersApi'
import salesApi from '../services/salesApi'

const SalesPOSPage = ({ isDarkMode }) => {
  const [cart, setCart] = useState([])
  const [productBatches, setProductBatches] = useState([])
  const [customers, setCustomers] = useState([])
  const [walkInCustomer, setWalkInCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [customerSearchTerm, setCustomerSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingCustomers, setLoadingCustomers] = useState(false)
  const [error, setError] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [amountReceived, setAmountReceived] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [parkedTransactions, setParkedTransactions] = useState([])
  const [showParkedModal, setShowParkedModal] = useState(false)
  const [editingQuantity, setEditingQuantity] = useState(null)
  const [quantityInput, setQuantityInput] = useState('')
  const [processingPayment, setProcessingPayment] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  const searchInputRef = useRef(null)
  const amountInputRef = useRef(null)
  const customerSearchInputRef = useRef(null)

  // Fetch earliest product batches and walk-in customer
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch product batches and walk-in customer in parallel
        const [batches, walkIn] = await Promise.all([
          productBatchesApi.getEarliest(),
          customersApi.getWalkIn()
        ])
        
        setProductBatches(batches)
        setWalkInCustomer(walkIn)
        console.log('Walk-in customer loaded:', walkIn)
      } catch (err) {
        console.error('Error fetching initial data:', err)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Auto-focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  // Focus amount input when payment modal opens
  useEffect(() => {
    if (showPaymentModal && paymentMethod === 'CASH') {
      setTimeout(() => amountInputRef.current?.focus(), 100)
    }
  }, [showPaymentModal, paymentMethod])

  const fetchCustomers = useCallback(async () => {
    try {
      setLoadingCustomers(true)
      const data = await customersApi.getAll()
      // Filter only active customers
      const activeCustomers = Array.isArray(data) ? data.filter(c => c.active !== false) : []
      setCustomers(activeCustomers)
    } catch (err) {
      console.error('Error fetching customers:', err)
      showNotification('Failed to load customers', 'error')
    } finally {
      setLoadingCustomers(false)
    }
  }, [])

  // Fetch customers when modal opens
  useEffect(() => {
    if (showCustomerModal && customers.length === 0) {
      fetchCustomers()
    }
  }, [showCustomerModal, customers.length, fetchCustomers])

  // Focus customer search when modal opens
  useEffect(() => {
    if (showCustomerModal) {
      setTimeout(() => customerSearchInputRef.current?.focus(), 100)
    }
  }, [showCustomerModal])

  const addToCart = (batch, quantity = 1) => {
    if (batch.quantity <= 0) {
      showNotification('Product batch is out of stock!', 'error')
      return
    }

    const existingItem = cart.find(item => item.productBatchId === batch.productBatchId)
    if (existingItem) {
      const newQuantity = existingItem.cartQuantity + quantity
      if (newQuantity > batch.quantity) {
        showNotification('Cannot add more items than available in stock!', 'error')
        return
      }
      setCart(cart.map(item => 
        item.productBatchId === batch.productBatchId 
          ? { ...item, cartQuantity: newQuantity }
          : item
      ))
    } else {
      setCart([...cart, { ...batch, cartQuantity: quantity }])
    }
    
    // Clear search after adding
    setSearchTerm('')
    searchInputRef.current?.focus()
  }

  const updateQuantity = (batchId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(batchId)
      return
    }

    const batch = productBatches.find(b => b.productBatchId === batchId) || cart.find(item => item.productBatchId === batchId)
    if (newQuantity > batch.quantity) {
      showNotification('Cannot exceed available stock!', 'error')
      return
    }

    setCart(cart.map(item => 
      item.productBatchId === batchId 
        ? { ...item, cartQuantity: newQuantity }
        : item
    ))
    setEditingQuantity(null)
  }

  const removeFromCart = (batchId) => {
    setCart(cart.filter(item => item.productBatchId !== batchId))
  }

  const clearCart = () => {
    if (window.confirm('Clear cart? This action cannot be undone.')) {
      setCart([])
      setSelectedCustomer(null)
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.sellingPricePerUnit || 0
      return total + (price * item.cartQuantity)
    }, 0)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.cartQuantity, 0)
  }

  const parkTransaction = useCallback(() => {
    if (cart.length === 0) {
      showNotification('Cart is empty!', 'error')
      return
    }
    
    const parkedTransaction = {
      id: Date.now(),
      cart: [...cart],
      customer: selectedCustomer,
      timestamp: new Date()
    }
    
    setParkedTransactions([...parkedTransactions, parkedTransaction])
    setCart([])
    setSelectedCustomer(null)
    showNotification('Transaction parked successfully!', 'success')
  }, [cart, selectedCustomer, parkedTransactions])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' && e.target !== searchInputRef.current) return
      
      // F1 - Focus search
      if (e.key === 'F1') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      // F2 - Select customer
      else if (e.key === 'F2') {
        e.preventDefault()
        setShowCustomerModal(true)
      }
      // F3 - Park transaction
      else if (e.key === 'F3') {
        e.preventDefault()
        parkTransaction()
      }
      // F4 - View parked
      else if (e.key === 'F4') {
        e.preventDefault()
        setShowParkedModal(true)
      }
      // F9 - Clear cart
      else if (e.key === 'F9') {
        e.preventDefault()
        if (cart.length > 0) clearCart()
      }
      // F12 or Enter - Process payment
      else if ((e.key === 'F12' || e.key === 'Enter') && cart.length > 0 && e.target === searchInputRef.current) {
        e.preventDefault()
        setShowPaymentModal(true)
      }
      // ESC - Close modals
      else if (e.key === 'Escape') {
        setShowCustomerModal(false)
        setShowPaymentModal(false)
        setShowParkedModal(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [cart, parkTransaction])

  const loadParkedTransaction = (transaction) => {
    setCart(transaction.cart)
    setSelectedCustomer(transaction.customer)
    setParkedTransactions(parkedTransactions.filter(t => t.id !== transaction.id))
    setShowParkedModal(false)
    showNotification('Transaction loaded!', 'success')
  }

  const deleteParkedTransaction = (transactionId) => {
    if (window.confirm('Delete this parked transaction?')) {
      setParkedTransactions(parkedTransactions.filter(t => t.id !== transactionId))
    }
  }

  const processSale = async () => {
    if (cart.length === 0) {
      showNotification('Cart is empty!', 'error')
      return
    }

    const total = getCartTotal()
    
    if (paymentMethod === 'CASH') {
      const received = parseFloat(amountReceived) || 0
      if (received < total) {
        showNotification('Insufficient payment amount!', 'error')
        return
      }
    }

    try {
      setProcessingPayment(true)
      setErrorMessage('')
      
      // Map cart items to SaleItemCreateDTO format
      const items = cart.map(item => ({
        productId: item.product?.productId || item.product?.id,
        productBatchId: item.productBatchId,
        quantity: item.cartQuantity,
        unitPrice: item.sellingPricePerUnit
      }))

      // Create SaleCreateDTO
      // If no customer is selected, use walk-in customer ID
      const customerId = selectedCustomer?.customerId || walkInCustomer?.customerId || null
      
      const saleData = {
        customerId: customerId,
        saleDate: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
        paymentMethod: paymentMethod,
        discountAmount: 0.00, // You can add discount functionality later
        items: items
      }

      console.log('Creating sale with data:', saleData)
      console.log('Customer Info:', {
        selectedCustomer: selectedCustomer,
        walkInCustomer: walkInCustomer,
        usingCustomerId: customerId
      })

      // Call API to create sale
      const result = await salesApi.create(saleData)
      
      console.log('Sale created successfully:', result)
      
      // If payment method is CASH, automatically confirm the sale
      if (paymentMethod === 'CASH') {
        try {
          console.log('Confirming cash sale #', result.saleId)
          await salesApi.confirm(result.saleId)
          console.log('Sale confirmed successfully')
          
          // Show success message with confirmation
          setSuccessMessage(`Sale #${result.saleId} confirmed successfully! Total: ₱${Number(result.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)
        } catch (confirmErr) {
          console.error('Error confirming sale:', confirmErr)
          // Sale was created but confirmation failed - show warning
          setSuccessMessage(`Sale #${result.saleId} created but confirmation failed. Please confirm manually. Total: ₱${Number(result.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)
        }
      } else {
        // For CARD/GCASH, just show success (no confirmation needed)
        setSuccessMessage(`Sale #${result.saleId} processed successfully! Total: ₱${Number(result.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)
      }
      
      // Clear cart and close modal after 2.5 seconds
      setTimeout(() => {
        setShowPaymentModal(false)
        setCart([])
        setSelectedCustomer(null)
        setAmountReceived('')
        setPaymentMethod('CASH')
        setSuccessMessage('')
        searchInputRef.current?.focus()
      }, 2500)

    } catch (err) {
      console.error('Error processing sale:', err)
      setErrorMessage('Failed to process sale: ' + err.message)
    } finally {
      setProcessingPayment(false)
    }
  }

  const showNotification = (message, type = 'info') => {
    // You could implement a toast notification system here
    if (type === 'error') {
      alert(message)
    }
  }

  const getCategories = () => {
    const categories = new Set(productBatches.map(batch => batch.product?.category?.name).filter(Boolean))
    return ['ALL', ...Array.from(categories)]
  }

  const filteredBatches = productBatches.filter(batch => {
    const matchesSearch = !searchTerm || 
      batch.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = selectedCategory === 'ALL' || 
      batch.product?.category?.name === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getChange = () => {
    const total = getCartTotal()
    const received = parseFloat(amountReceived) || 0
    return Math.max(0, received - total)
  }

  const quickAmounts = [50, 100, 200, 500, 1000]

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Top Bar - Keyboard Shortcuts */}
      <div className={`border-b px-6 py-2 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6 text-xs">
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F1</kbd> Search
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F2</kbd> Customer
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F3</kbd> Park
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F4</kbd> Parked
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">F9</kbd> Clear
            </span>
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
              <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> Pay
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Cashier:</span> Admin User
            </div>
            {parkedTransactions.length > 0 && (
              <button
                onClick={() => setShowParkedModal(true)}
                className="px-3 py-1 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600"
              >
                {parkedTransactions.length} Parked
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Products */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Search and Quick Actions */}
          <div className="mb-4 space-y-3">
            <div className="relative">
            <input
                ref={searchInputRef}
              type="text"
                placeholder="Scan barcode or search product (F1)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-4 py-3 pl-12 text-lg rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
              <svg className="absolute left-4 top-3.5 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            {/* Categories */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {getCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-pharma-teal text-white'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-pharma-teal border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredBatches.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                    </p>
                  </div>
                ) : (
                  filteredBatches.map((batch) => (
                    <button
                      key={batch.productBatchId}
                      onClick={() => addToCart(batch)}
                      disabled={batch.quantity <= 0}
                      className={`text-left rounded-xl border-2 p-4 transition-all duration-200 ${
                        batch.quantity <= 0
                          ? 'opacity-40 cursor-not-allowed'
                          : 'hover:shadow-xl hover:scale-105 active:scale-95'
                } ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-pharma-teal' 
                    : 'bg-white border-gray-200 hover:border-pharma-teal'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2 flex-1 mr-2">
                          {batch.product?.name || 'Unknown Product'}
                        </h3>
                        <span className={`flex-shrink-0 text-xs px-2 py-1 rounded-full font-bold ${
                          batch.quantity > 10 ? 'bg-green-100 text-green-800' :
                          batch.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                          {batch.quantity}
                  </span>
                </div>
                      <p className="text-xl font-bold text-pharma-teal mb-1">
                        ₱{Number(batch.sellingPricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        SKU: {batch.product?.sku || batch.batchNumber}
                </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart (Fixed) */}
        <div className={`w-96 flex flex-col border-l ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Customer Info */}
          <div className="p-4 border-b">
            <button
              onClick={() => setShowCustomerModal(true)}
              className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                selectedCustomer
                  ? 'border-pharma-teal bg-pharma-teal/10'
                  : isDarkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {selectedCustomer ? (
                <div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-pharma-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span className="font-semibold">{selectedCustomer.name}</span>
                  </div>
                  <div className={`text-sm mt-1 ml-7 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedCustomer.phoneNumber}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Add Customer (F2)</span>
                </div>
              )}
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Cart is empty<br />
                  Add products to start
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productBatchId} className={`rounded-lg border p-3 ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 mr-2">
                      <div className="font-semibold text-sm line-clamp-2">
                        {item.product?.name || 'Unknown'}
                      </div>
                      <div className="text-pharma-teal font-bold text-lg">
                        ₱{Number(item.sellingPricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productBatchId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                        onClick={() => updateQuantity(item.productBatchId, item.cartQuantity - 1)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                        −
                      </button>
                      
                      {editingQuantity === item.productBatchId ? (
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          onBlur={() => {
                            const qty = parseInt(quantityInput) || 1
                            updateQuantity(item.productBatchId, qty)
                            setQuantityInput('')
                          }}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const qty = parseInt(quantityInput) || 1
                              updateQuantity(item.productBatchId, qty)
                              setQuantityInput('')
                            }
                          }}
                          autoFocus
                          className="w-16 text-center py-2 border rounded-lg font-bold"
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingQuantity(item.productBatchId)
                            setQuantityInput(item.cartQuantity.toString())
                          }}
                          className={`w-16 text-center py-2 rounded-lg font-bold text-lg ${
                            isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                          }`}
                        >
                          {item.cartQuantity}
                    </button>
                      )}
                      
                    <button
                        onClick={() => updateQuantity(item.productBatchId, item.cartQuantity + 1)}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      +
                    </button>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        ₱{Number((item.sellingPricePerUnit * item.cartQuantity) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary and Actions */}
          <div className={`p-4 border-t space-y-3 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Items:</span>
                <span className="font-medium">{getCartItemCount()}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold">
                  <span>Total:</span>
                <span className="text-pharma-teal">
                  ₱{Number(getCartTotal()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
                </div>

            {/* Action Buttons */}
            {cart.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={parkTransaction}
                  className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                    isDarkMode
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  🅿️ Park (F3)
                </button>
                <button
                  onClick={clearCart}
                  className="py-3 px-4 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  🗑️ Clear (F9)
                </button>
              </div>
            )}

              <button
              onClick={() => cart.length > 0 && setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className={`w-full py-4 px-4 rounded-xl font-bold text-lg transition-all ${
                cart.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:shadow-lg hover:scale-105 active:scale-95'
              }`}
            >
              💳 Pay Now (Enter)
              </button>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowCustomerModal(false)
          setCustomerSearchTerm('')
        }}>
          <div onClick={(e) => e.stopPropagation()} className={`rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl max-h-[80vh] flex flex-col ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Select Customer</h2>
              <button onClick={() => {
                setShowCustomerModal(false)
                setCustomerSearchTerm('')
              }} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Customer Search */}
            <div className="mb-4">
              <div className="relative">
                <input
                  ref={customerSearchInputRef}
                  type="text"
                  placeholder="Search customers by name, email, or phone..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className={`w-full px-4 py-2 pl-10 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
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
            
            {/* Customers List */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {/* Walk-in Customer */}
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setShowCustomerModal(false)
                  setCustomerSearchTerm('')
                }}
                className={`w-full p-4 rounded-lg text-left transition-colors border-2 ${
                  !selectedCustomer 
                    ? 'border-pharma-teal bg-pharma-teal/10'
                    : isDarkMode
                      ? 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                      : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="font-medium">Walk-in Customer</div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {walkInCustomer ? `Default customer (ID: ${walkInCustomer.customerId})` : 'No customer record'}
                </div>
              </button>
              
              {/* Loading State */}
              {loadingCustomers && (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-pharma-teal border-t-transparent"></div>
                  <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading customers...</p>
                </div>
              )}

              {/* Customers */}
              {!loadingCustomers && (() => {
                const filteredCustomers = customers.filter(customer => {
                  const searchLower = customerSearchTerm.toLowerCase()
                  return !customerSearchTerm || 
                    customer.name?.toLowerCase().includes(searchLower) ||
                    customer.email?.toLowerCase().includes(searchLower) ||
                    customer.phoneNumber?.includes(searchLower)
                })

                if (filteredCustomers.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {customerSearchTerm ? 'No customers found matching your search.' : 'No customers available.'}
                      </p>
                    </div>
                  )
                }

                return filteredCustomers.map((customer) => (
                <button
                    key={customer.customerId}
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setShowCustomerModal(false)
                      setCustomerSearchTerm('')
                    }}
                    className={`w-full p-4 rounded-lg text-left transition-colors border-2 ${
                      selectedCustomer?.customerId === customer.customerId
                        ? 'border-pharma-teal bg-pharma-teal/10'
                        : isDarkMode
                          ? 'border-gray-700 bg-gray-700 hover:bg-gray-600'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-medium">{customer.name}</div>
                    <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {customer.phoneNumber}
                    </div>
                    {customer.email && (
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        {customer.email}
                      </div>
                    )}
                  </button>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Process Payment</h2>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                disabled={processingPayment}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  {successMessage}
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {['CASH', 'CARD', 'GCASH'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-lg border-2 font-semibold transition-all ${
                      paymentMethod === method
                        ? 'border-pharma-teal bg-pharma-teal text-white'
                        : isDarkMode
                          ? 'border-gray-600 bg-gray-700 hover:bg-gray-600'
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {method === 'CASH' && '💵'}
                    {method === 'CARD' && '💳'}
                    {method === 'GCASH' && '📱'}
                    <div className="mt-1">{method}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Section */}
            {paymentMethod === 'CASH' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">Amount Received</label>
                  <input
                    ref={amountInputRef}
                    type="number"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-4 text-2xl font-bold text-center rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-pharma-teal ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmountReceived(amount.toString())}
                      className={`py-3 rounded-lg font-semibold transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                      ₱{amount}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Summary */}
            <div className={`p-4 rounded-lg mb-6 space-y-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex justify-between text-lg">
                <span>Subtotal:</span>
                <span className="font-bold">₱{Number(getCartTotal()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              {paymentMethod === 'CASH' && amountReceived && (
                <>
                  <div className="flex justify-between text-lg">
                    <span>Amount Received:</span>
                    <span className="font-bold">₱{Number(amountReceived || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-pharma-teal border-t pt-3">
                    <span>Change:</span>
                    <span>₱{Number(getChange()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-4">
            <button
                onClick={() => setShowPaymentModal(false)}
                disabled={processingPayment}
                className={`py-4 px-6 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
                Cancel (ESC)
              </button>
              <button
                onClick={processSale}
                disabled={processingPayment}
                className={`py-4 px-6 rounded-lg font-semibold bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  processingPayment ? 'cursor-wait' : ''
                }`}
              >
                {processingPayment ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Complete Sale ✓'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parked Transactions Modal */}
      {showParkedModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowParkedModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className={`rounded-xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[80vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Parked Transactions</h2>
              <button onClick={() => setShowParkedModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {parkedTransactions.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No parked transactions
              </p>
            ) : (
              <div className="space-y-3">
                {parkedTransactions.map((transaction) => (
                  <div key={transaction.id} className={`p-4 rounded-lg border-2 ${
                    isDarkMode ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold">
                          {transaction.customer?.name || 'Walk-in Customer'}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {transaction.timestamp.toLocaleString()}
                        </div>
                        <div className="text-sm mt-1">
                          {transaction.cart.length} items • ₱
                          {transaction.cart.reduce((sum, item) => sum + (item.sellingPricePerUnit * item.cartQuantity), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadParkedTransaction(transaction)}
                          className="px-4 py-2 bg-pharma-teal text-white rounded-lg hover:bg-pharma-medium transition-colors"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteParkedTransaction(transaction.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
            </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesPOSPage
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

  // Function to refresh product batches
  const refreshProductBatches = useCallback(async () => {
    try {
      const batches = await productBatchesApi.getEarliest()
      setProductBatches(batches)
      console.log('Product batches refreshed')
      return batches
    } catch (err) {
      console.error('Error refreshing product batches:', err)
      return null
    }
  }, [])

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
    // Get the latest batch data from productBatches state to ensure we have current stock
    const latestBatch = productBatches.find(b => b.productBatchId === batch.productBatchId) || batch
    
    if (latestBatch.quantity <= 0) {
      showNotification('Product batch is out of stock!', 'error')
      return
    }

    const existingItem = cart.find(item => item.productBatchId === batch.productBatchId)
    if (existingItem) {
      const newQuantity = existingItem.cartQuantity + quantity
      if (newQuantity > latestBatch.quantity) {
        showNotification('Cannot add more items than available in stock!', 'error')
        return
      }
      setCart(cart.map(item => 
        item.productBatchId === batch.productBatchId 
          ? { ...item, cartQuantity: newQuantity, ...latestBatch }
          : item
      ))
    } else {
      setCart([...cart, { ...latestBatch, cartQuantity: quantity }])
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

    // Get the latest batch data from productBatches state to ensure we have current stock
    const latestBatch = productBatches.find(b => b.productBatchId === batchId)
    const cartItem = cart.find(item => item.productBatchId === batchId)
    const batch = latestBatch || cartItem
    
    if (!batch) {
      showNotification('Product batch not found!', 'error')
      return
    }

    // Use the latest stock quantity from productBatches if available
    const availableStock = latestBatch ? latestBatch.quantity : batch.quantity
    if (newQuantity > availableStock) {
      showNotification('Cannot exceed available stock!', 'error')
      return
    }

    // Update cart with latest batch data if available
    setCart(cart.map(item => 
      item.productBatchId === batchId 
        ? { ...item, cartQuantity: newQuantity, ...(latestBatch ? latestBatch : {}) }
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

  const getCartSubtotal = () => {
    return cart.reduce((total, item) => {
      const price = item.sellingPricePerUnit || 0
      return total + (price * item.cartQuantity)
    }, 0)
  }

  const getCartTax = () => {
    const subtotal = getCartSubtotal()
    return subtotal * 0.12 // 12% tax
  }

  const getCartTotal = () => {
    return getCartSubtotal() + getCartTax()
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

  const loadParkedTransaction = async (transaction) => {
    // Refresh batches first to ensure we have latest stock levels
    const latestBatches = await refreshProductBatches()
    
    // Update cart items with latest batch data
    const updatedCart = transaction.cart.map(cartItem => {
      const latestBatch = latestBatches?.find(b => b.productBatchId === cartItem.productBatchId)
      return latestBatch ? { ...cartItem, ...latestBatch } : cartItem
    })
    
    setCart(updatedCart)
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

    const total = getCartTotal() // Total includes 12% tax
    
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
          
          // Refresh product batches to get updated stock levels
          await refreshProductBatches()
          
          // Show success message with confirmation
          setSuccessMessage(`Sale #${result.saleId} confirmed successfully! Total: ₱${Number(result.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)
        } catch (confirmErr) {
          console.error('Error confirming sale:', confirmErr)
          // Even if confirmation fails, refresh batches since sale was created
          await refreshProductBatches()
          // Sale was created but confirmation failed - show warning
          setSuccessMessage(`Sale #${result.saleId} created but confirmation failed. Please confirm manually. Total: ₱${Number(result.grandTotal).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`)
        }
      } else {
        // For CARD/GCASH, refresh batches after sale creation
        await refreshProductBatches()
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
    const total = getCartTotal() // Total includes tax
    const received = parseFloat(amountReceived) || 0
    return Math.max(0, received - total)
  }

  const quickAmounts = [50, 100, 200, 500, 1000]

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#fafafa] text-gray-900'}`}>
      {/* Minimal Top Bar */}
      <div className={`border-b ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} backdrop-blur-xl`}>
        <div className="px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8 text-xs font-medium">
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
              <kbd className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>F1</kbd>
              <span className="ml-1.5">Search</span>
            </span>
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
              <kbd className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>F2</kbd>
              <span className="ml-1.5">Customer</span>
            </span>
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
              <kbd className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>F3</kbd>
              <span className="ml-1.5">Park</span>
            </span>
            <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>
              <kbd className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>Enter</kbd>
              <span className="ml-1.5">Pay</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              Cashier: <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Admin User</span>
            </div>
            {parkedTransactions.length > 0 && (
              <button
                onClick={() => setShowParkedModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20"
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-8 pb-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or search product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full px-5 py-4 pl-14 text-base rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-teal/50 ${
                  isDarkMode
                    ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-pharma-teal/50'
                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pharma-teal/50 shadow-sm'
                }`}
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>

            {/* Categories - Minimal Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {getCategories().map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-pharma-teal text-white shadow-lg shadow-pharma-teal/20'
                      : isDarkMode
                        ? 'bg-gray-900/50 text-gray-400 hover:bg-gray-800/50 hover:text-gray-300 border border-gray-700'
                        : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 border border-gray-200 shadow-sm'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="mx-8 mb-4 px-4 py-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto px-8 pb-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-pharma-teal border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                {filteredBatches.length === 0 ? (
                  <div className="col-span-full text-center py-20">
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                    </p>
                  </div>
                ) : (
                  filteredBatches.map((batch) => (
                    <button
                      key={batch.productBatchId}
                      onClick={() => addToCart(batch)}
                      disabled={batch.quantity <= 0}
                      className={`group text-left rounded-2xl p-4 transition-all duration-300 ${
                        batch.quantity <= 0
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:shadow-xl hover:shadow-pharma-teal/5 hover:-translate-y-1 active:translate-y-0'
                      } ${
                        isDarkMode 
                          ? 'bg-gray-900/50 border border-gray-700 hover:border-pharma-teal/30' 
                          : 'bg-white border border-gray-200 hover:border-pharma-teal/30 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1 mr-2 text-left">
                          {batch.product?.name || 'Unknown Product'}
                        </h3>
                        <span className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-lg font-semibold ${
                          batch.quantity > 10 
                            ? 'bg-emerald-500/10 text-emerald-600' 
                            : batch.quantity > 0 
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-red-500/10 text-red-600'
                        }`}>
                          {batch.quantity}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-pharma-teal mb-2">
                        ₱{Number(batch.sellingPricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-[11px] font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {batch.product?.sku || batch.batchNumber}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart (Fixed) */}
        <div className={`w-[420px] flex flex-col border-l ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} shadow-xl`}>
          {/* Customer Info */}
          <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <button
              onClick={() => setShowCustomerModal(true)}
              className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                selectedCustomer
                  ? 'bg-pharma-teal/10 border-2 border-pharma-teal/30'
                  : isDarkMode
                    ? 'bg-gray-900/50 border-2 border-gray-700 hover:border-gray-600'
                    : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {selectedCustomer ? (
                <div>
                  <div className="flex items-center mb-1">
                    <svg className="w-4 h-4 mr-2 text-pharma-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span className="font-semibold text-sm">{selectedCustomer.name}</span>
                  </div>
                  <div className={`text-xs ml-6 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    {selectedCustomer.phoneNumber}
                  </div>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Add Customer</span>
                </div>
              )}
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                }`}>
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Cart is empty
                </p>
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                  Add products to start
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.productBatchId} className={`rounded-2xl p-4 transition-all duration-200 ${
                  isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 mr-3">
                      <div className="font-semibold text-sm leading-tight line-clamp-2 mb-1.5">
                        {item.product?.name || 'Unknown'}
                      </div>
                      <div className="text-pharma-teal font-bold text-base">
                        ₱{Number(item.sellingPricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productBatchId)}
                      className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productBatchId, item.cartQuantity - 1)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-base transition-all duration-200 ${
                          isDarkMode
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
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
                          className={`w-14 text-center py-2 rounded-xl font-semibold text-sm border transition-all ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-700 text-white'
                              : 'bg-white border-gray-200 text-gray-900'
                          }`}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            setEditingQuantity(item.productBatchId)
                            setQuantityInput(item.cartQuantity.toString())
                          }}
                          className={`w-14 text-center py-2 rounded-xl font-semibold text-sm transition-all ${
                            isDarkMode
                              ? 'bg-gray-800 text-gray-300'
                              : 'bg-white text-gray-700 border border-gray-200'
                          }`}
                        >
                          {item.cartQuantity}
                        </button>
                      )}
                      
                      <button
                        onClick={() => updateQuantity(item.productBatchId, item.cartQuantity + 1)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-base transition-all duration-200 ${
                          isDarkMode
                            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                            : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                        }`}
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-bold text-base text-pharma-teal">
                        ₱{Number((item.sellingPricePerUnit * item.cartQuantity) || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Summary and Actions - Fixed at Bottom */}
          <div className={`p-6 border-t space-y-4 ${isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`}>
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-medium">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Items</span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{getCartItemCount()}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Subtotal</span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>₱{Number(getCartSubtotal()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs font-medium">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Tax (12%)</span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>₱{Number(getCartTax()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`flex justify-between items-baseline pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total</span>
                <span className="text-2xl font-bold text-pharma-teal">
                  ₱{Number(getCartTotal()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {cart.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={parkTransaction}
                  className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-800 border border-gray-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  Park
                </button>
                <button
                  onClick={clearCart}
                  className="py-3 px-4 rounded-xl font-semibold text-sm bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 transition-all duration-200"
                >
                  Clear
                </button>
              </div>
            )}

            <button
              onClick={() => cart.length > 0 && setShowPaymentModal(true)}
              disabled={cart.length === 0}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-base transition-all duration-200 ${
                cart.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-pharma-teal text-white hover:bg-pharma-medium shadow-lg shadow-pharma-teal/20 hover:shadow-xl hover:shadow-pharma-teal/30 hover:-translate-y-0.5 active:translate-y-0'
              }`}
            >
              Process Payment
            </button>
          </div>
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => {
          setShowCustomerModal(false)
          setCustomerSearchTerm('')
        }}>
          <div onClick={(e) => e.stopPropagation()} className={`rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl max-h-[85vh] flex flex-col ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Select Customer</h2>
              <button onClick={() => {
                setShowCustomerModal(false)
                setCustomerSearchTerm('')
              }} className={`p-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-900/50 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Customer Search */}
            <div className="mb-6">
              <div className="relative">
                <input
                  ref={customerSearchInputRef}
                  type="text"
                  placeholder="Search customers..."
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  className={`w-full px-5 py-3 pl-12 rounded-2xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-teal/50 ${
                    isDarkMode
                      ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-500 focus:border-pharma-teal/50'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pharma-teal/50'
                  }`}
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                  !selectedCustomer 
                    ? 'bg-pharma-teal/10 border-2 border-pharma-teal/30'
                    : isDarkMode
                      ? 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800/50'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                <div className="font-semibold text-sm mb-1">Walk-in Customer</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {walkInCustomer ? `Default customer (ID: ${walkInCustomer.customerId})` : 'No customer record'}
                </div>
              </button>
              
              {/* Loading State */}
              {loadingCustomers && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-pharma-teal border-t-transparent"></div>
                  <p className={`mt-3 text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Loading customers...</p>
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
                    <div className="text-center py-12">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
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
                    className={`w-full p-4 rounded-2xl text-left transition-all duration-200 ${
                      selectedCustomer?.customerId === customer.customerId
                        ? 'bg-pharma-teal/10 border-2 border-pharma-teal/30'
                        : isDarkMode
                          ? 'bg-gray-900/50 border border-gray-700 hover:bg-gray-800/50'
                          : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-semibold text-sm mb-1">{customer.name}</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {customer.phoneNumber}
                    </div>
                    {customer.email && (
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className={`rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Process Payment</h2>
              <button 
                onClick={() => setShowPaymentModal(false)} 
                disabled={processingPayment}
                className={`p-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode ? 'hover:bg-gray-900/50 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm font-medium">{successMessage}</span>
                </div>
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-sm font-medium">{errorMessage}</span>
                </div>
              </div>
            )}

            {/* Payment Methods */}
            <div className="mb-8">
              <label className="block text-sm font-semibold mb-4">Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {['CASH', 'CARD', 'GCASH'].map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-5 rounded-2xl border-2 font-semibold text-sm transition-all duration-200 ${
                      paymentMethod === method
                        ? 'border-pharma-teal bg-pharma-teal text-white shadow-lg shadow-pharma-teal/20'
                        : isDarkMode
                          ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50 text-gray-300'
                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="text-2xl mb-2">
                      {method === 'CASH' && '💵'}
                      {method === 'CARD' && '💳'}
                      {method === 'GCASH' && '📱'}
                    </div>
                    <div>{method}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Amount Section */}
            {paymentMethod === 'CASH' && (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-semibold mb-4">Amount Received</label>
                  <input
                    ref={amountInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountReceived}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || parseFloat(value) >= 0) {
                        setAmountReceived(value)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e' || e.key === 'E') {
                        e.preventDefault()
                      }
                    }}
                    placeholder="0.00"
                    className={`w-full px-6 py-5 text-3xl font-bold text-center rounded-2xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pharma-teal/50 ${
                      isDarkMode
                        ? 'bg-gray-900/50 border-gray-700 text-white placeholder-gray-600 focus:border-pharma-teal/50'
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-pharma-teal/50'
                    }`}
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-3 mb-8">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setAmountReceived(amount.toString())}
                      className={`py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isDarkMode
                          ? 'bg-gray-900/50 hover:bg-gray-800/50 text-gray-300 border border-gray-700'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
                      }`}
                    >
                      ₱{amount}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Summary */}
            <div className={`p-6 rounded-2xl mb-8 space-y-4 ${isDarkMode ? 'bg-gray-900/50 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
              <div className="flex justify-between text-base font-medium">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Subtotal</span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>₱{Number(getCartSubtotal()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-medium">
                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Tax (12%)</span>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>₱{Number(getCartTax()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className={`flex justify-between text-lg font-bold pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>Total</span>
                <span className="text-pharma-teal">₱{Number(getCartTotal()).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
              {paymentMethod === 'CASH' && amountReceived && (
                <>
                  <div className={`flex justify-between text-base font-medium pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>Amount Received</span>
                    <span className={isDarkMode ? 'text-gray-200' : 'text-gray-900'}>₱{Number(amountReceived || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className={`flex justify-between text-2xl font-bold text-pharma-teal pt-3 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span>Change</span>
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
                className={`py-4 px-6 rounded-2xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDarkMode
                    ? 'bg-gray-900/50 text-gray-300 hover:bg-gray-800/50 border border-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={processSale}
                disabled={processingPayment}
                className={`py-4 px-6 rounded-2xl font-semibold bg-pharma-teal text-white hover:bg-pharma-medium shadow-lg shadow-pharma-teal/20 hover:shadow-xl hover:shadow-pharma-teal/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
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
                  'Complete Sale'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Parked Transactions Modal */}
      {showParkedModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowParkedModal(false)}>
          <div onClick={(e) => e.stopPropagation()} className={`rounded-3xl p-8 w-full max-w-2xl mx-4 shadow-2xl max-h-[85vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Parked Transactions</h2>
              <button onClick={() => setShowParkedModal(false)} className={`p-2 rounded-xl transition-all duration-200 ${isDarkMode ? 'hover:bg-gray-900/50 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            {parkedTransactions.length === 0 ? (
              <div className="text-center py-16">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                }`}>
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                </div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  No parked transactions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {parkedTransactions.map((transaction) => (
                  <div key={transaction.id} className={`p-5 rounded-2xl border transition-all duration-200 ${
                    isDarkMode ? 'border-gray-700 bg-gray-900/50 hover:bg-gray-800/50' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                  }`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-sm mb-1">
                          {transaction.customer?.name || 'Walk-in Customer'}
                        </div>
                        <div className={`text-xs mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {transaction.timestamp.toLocaleString()}
                        </div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {transaction.cart.length} items • ₱
                          {transaction.cart.reduce((sum, item) => sum + (item.sellingPricePerUnit * item.cartQuantity), 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => loadParkedTransaction(transaction)}
                          className="px-4 py-2 bg-pharma-teal text-white rounded-xl hover:bg-pharma-medium transition-all duration-200 text-sm font-semibold shadow-lg shadow-pharma-teal/20"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => deleteParkedTransaction(transaction.id)}
                          className="px-4 py-2 bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition-all duration-200 text-sm font-semibold"
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
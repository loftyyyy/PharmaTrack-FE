import { useState, useEffect } from 'react'
import { productBatchesApi } from '../services/productBatchesApi'

const SalesPOSPage = ({ isDarkMode }) => {
  const [cart, setCart] = useState([])
  const [productBatches, setProductBatches] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch earliest product batches
  useEffect(() => {
    const fetchProductBatches = async () => {
      try {
        setLoading(true)
        setError(null)
        const batches = await productBatchesApi.getEarliest()
        setProductBatches(batches)
      } catch (err) {
        console.error('Error fetching product batches:', err)
        setError('Failed to load products. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProductBatches()
  }, [])

  const addToCart = (batch) => {
    if (batch.quantity <= 0) {
      alert('Product batch is out of stock!')
      return
    }

    const existingItem = cart.find(item => item.productBatchId === batch.productBatchId)
    if (existingItem) {
      if (existingItem.cartQuantity >= batch.quantity) {
        alert('Cannot add more items than available in stock!')
        return
      }
      setCart(cart.map(item => 
        item.productBatchId === batch.productBatchId 
          ? { ...item, cartQuantity: item.cartQuantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...batch, cartQuantity: 1 }])
    }
  }

  const updateQuantity = (batchId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(batchId)
      return
    }

    const batch = productBatches.find(b => b.productBatchId === batchId)
    if (newQuantity > batch.quantity) {
      alert('Cannot exceed available stock!')
      return
    }

    setCart(cart.map(item => 
      item.productBatchId === batchId 
        ? { ...item, cartQuantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (batchId) => {
    setCart(cart.filter(item => item.productBatchId !== batchId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = item.sellingPricePerUnit || 0
      return total + (price * item.cartQuantity)
    }, 0)
  }

  const processSale = () => {
    if (cart.length === 0) {
      alert('Cart is empty!')
      return
    }

    const total = getCartTotal()
    const customerInfo = selectedCustomer ? ` for ${selectedCustomer.name}` : ''
    
    if (window.confirm(`Process sale of ₱${total.toFixed(2)}${customerInfo}?`)) {
      // Here you would typically send the sale data to your backend
      alert('Sale processed successfully!')
      clearCart()
    }
  }

  const filteredBatches = productBatches.filter(batch =>
    batch.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.product?.sku?.includes(searchTerm) ||
    batch.batchNumber?.includes(searchTerm)
  )

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Point of Sale</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Process sales and manage transactions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2">
          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search products by name, SKU, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-pharma-teal border-t-transparent"></div>
              <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Loading products...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredBatches.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                    {searchTerm ? 'No products found matching your search.' : 'No products available.'}
                  </p>
                </div>
              ) : (
                filteredBatches.map((batch) => (
                  <div
                    key={batch.productBatchId}
                    onClick={() => addToCart(batch)}
                    className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      batch.quantity <= 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-105'
                    } ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-700 hover:border-pharma-teal' 
                        : 'bg-white border-gray-200 hover:border-pharma-teal'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{batch.product?.name || 'Unknown Product'}</h3>
                      <span className={`text-xs px-2 py-1 rounded ${
                        batch.quantity > 10 ? 'bg-green-100 text-green-800' :
                        batch.quantity > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {batch.quantity} left
                      </span>
                    </div>
                    <p className="text-lg font-bold text-pharma-teal">
                      ₱{Number(batch.sellingPricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {batch.product?.sku || batch.batchNumber}
                    </p>
                    {batch.expiryDate && (
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Cart Section */}
        <div className={`rounded-lg border p-6 ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Cart</h2>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div className="mb-4">
            <button
              onClick={() => setShowCustomerModal(true)}
              className={`w-full p-3 rounded-lg border text-left transition-colors ${
                selectedCustomer
                  ? 'border-pharma-teal bg-pharma-teal/10'
                  : isDarkMode
                    ? 'border-gray-600 hover:border-gray-500'
                    : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {selectedCustomer ? (
                <div>
                  <div className="font-medium">{selectedCustomer.name}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedCustomer.phone}
                  </div>
                </div>
              ) : (
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  + Select Customer (Optional)
                </div>
              )}
            </button>
          </div>

          {/* Cart Items */}
          <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
            {cart.length === 0 ? (
              <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Cart is empty
              </p>
            ) : (
              cart.map((item) => (
                <div key={item.productBatchId} className={`flex justify-between items-center p-3 rounded border ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.product?.name || 'Unknown'}</div>
                    <div className="text-pharma-teal font-bold">
                      ₱{Number(item.sellingPricePerUnit || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Batch: {item.batchNumber}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.productBatchId, item.cartQuantity - 1)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.cartQuantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productBatchId, item.cartQuantity + 1)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.productBatchId)}
                      className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600 hover:bg-red-200"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Cart Total */}
          {cart.length > 0 && (
            <>
              <div className={`border-t pt-4 mb-4 ${
                isDarkMode ? 'border-gray-600' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-pharma-teal">₱{Number(getCartTotal() || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <button
                onClick={processSale}
                className="w-full py-3 px-4 rounded-lg font-semibold bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:shadow-lg transition-all duration-200"
              >
                Process Sale
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer Selection Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Select Customer</h2>
            
            <div className="space-y-2 mb-4">
              <button
                onClick={() => {
                  setSelectedCustomer(null)
                  setShowCustomerModal(false)
                }}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Walk-in Customer (No customer record)
              </button>
              
              {/* Mock customers */}
              {[
                { id: 1, name: 'John Smith', phone: '+1-555-0123' },
                { id: 2, name: 'Sarah Johnson', phone: '+1-555-0456' },
                { id: 3, name: 'Michael Brown', phone: '+1-555-0789' }
              ].map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setSelectedCustomer(customer)
                    setShowCustomerModal(false)
                  }}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <div className="font-medium">{customer.name}</div>
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {customer.phone}
                  </div>
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCustomerModal(false)}
              className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default SalesPOSPage

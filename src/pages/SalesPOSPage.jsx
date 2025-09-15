import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const SalesPOSPage = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [cart, setCart] = useState([])
  const [products, setProducts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [showCustomerModal, setShowCustomerModal] = useState(false)

  // Mock products data
  useEffect(() => {
    const mockProducts = [
      { id: 1, name: 'Paracetamol 500mg', price: 2.50, stock: 150, barcode: '123456789001' },
      { id: 2, name: 'Amoxicillin 250mg', price: 5.75, stock: 25, barcode: '123456789002' },
      { id: 3, name: 'Vitamin C 1000mg', price: 1.25, stock: 0, barcode: '123456789003' },
      { id: 4, name: 'Ibuprofen 400mg', price: 3.00, stock: 200, barcode: '123456789004' },
      { id: 5, name: 'Cough Syrup', price: 12.00, stock: 75, barcode: '123456789005' }
    ]
    setProducts(mockProducts)
  }, [])

  const addToCart = (product) => {
    if (product.stock <= 0) {
      alert('Product is out of stock!')
      return
    }

    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        alert('Cannot add more items than available in stock!')
        return
      }
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    const product = products.find(p => p.id === productId)
    if (newQuantity > product.stock) {
      alert('Cannot exceed available stock!')
      return
    }

    setCart(cart.map(item => 
      item.id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode.includes(searchTerm)
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
              placeholder="Search products by name or barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                isDarkMode
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product)}
                className={`rounded-lg border p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  product.stock <= 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-105'
                } ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-700 hover:border-pharma-teal' 
                    : 'bg-white border-gray-200 hover:border-pharma-teal'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-sm">{product.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${
                    product.stock > 10 ? 'bg-green-100 text-green-800' :
                    product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.stock} left
                  </span>
                </div>
                <p className="text-lg font-bold text-pharma-teal">₱{product.price.toFixed(2)}</p>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {product.barcode}
                </p>
              </div>
            ))}
          </div>
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
                <div key={item.id} className={`flex justify-between items-center p-3 rounded border ${
                  isDarkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className="text-pharma-teal font-bold">₱{item.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      -
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isDarkMode
                          ? 'bg-gray-600 hover:bg-gray-500'
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
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
                  <span className="text-pharma-teal">₱{getCartTotal().toFixed(2)}</span>
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

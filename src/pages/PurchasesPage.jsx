import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const PurchasesPage = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState('all')

  // Mock data for now
  useEffect(() => {
    const mockPurchases = [
      {
        id: 1,
        purchaseNumber: 'PO-2024-001',
        supplier: 'PharmaCorp Ltd',
        orderDate: '2024-01-15',
        deliveryDate: '2024-01-20',
        status: 'delivered',
        totalAmount: 2500.00,
        items: [
          { product: 'Paracetamol 500mg', quantity: 1000, unitCost: 2.00, total: 2000.00 },
          { product: 'Vitamin C 1000mg', quantity: 200, unitCost: 2.50, total: 500.00 }
        ]
      },
      {
        id: 2,
        purchaseNumber: 'PO-2024-002',
        supplier: 'MediSupply Inc',
        orderDate: '2024-01-18',
        deliveryDate: '2024-01-25',
        status: 'pending',
        totalAmount: 1800.00,
        items: [
          { product: 'Amoxicillin 250mg', quantity: 300, unitCost: 6.00, total: 1800.00 }
        ]
      },
      {
        id: 3,
        purchaseNumber: 'PO-2024-003',
        supplier: 'HealthCorp',
        orderDate: '2024-01-20',
        deliveryDate: '2024-01-27',
        status: 'ordered',
        totalAmount: 3200.00,
        items: [
          { product: 'Ibuprofen 400mg', quantity: 500, unitCost: 4.00, total: 2000.00 },
          { product: 'Cough Syrup', quantity: 100, unitCost: 12.00, total: 1200.00 }
        ]
      }
    ]
    setTimeout(() => {
      setPurchases(mockPurchases)
      setLoading(false)
    }, 500)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'ordered': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredPurchases = purchases.filter(purchase => {
    if (filter === 'all') return true
    return purchase.status === filter
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
          <h1 className="text-2xl font-bold">Purchase Orders</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage purchase orders and supplier transactions
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-pharma-teal to-pharma-medium text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          New Purchase Order
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
                {purchases.filter(p => p.status === 'pending').length}
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
                {purchases.filter(p => p.status === 'delivered').length}
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
          { key: 'all', label: 'All Orders' },
          { key: 'pending', label: 'Pending' },
          { key: 'ordered', label: 'Ordered' },
          { key: 'delivered', label: 'Delivered' },
          { key: 'cancelled', label: 'Cancelled' }
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
          <div key={purchase.id} className={`rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{purchase.purchaseNumber}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Supplier: {purchase.supplier}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(purchase.status)}`}>
                {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Order Date</p>
                <p className="font-medium">{new Date(purchase.orderDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Delivery Date</p>
                <p className="font-medium">{new Date(purchase.deliveryDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Amount</p>
                <p className="font-bold text-pharma-teal text-lg">${purchase.totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Items */}
            <div className="mt-4">
              <h4 className="font-medium mb-2">Items:</h4>
              <div className="space-y-2">
                {purchase.items.map((item, index) => (
                  <div key={index} className={`flex justify-between items-center py-2 px-3 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div>
                      <span className="font-medium">{item.product}</span>
                      <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${item.total.toFixed(2)}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${item.unitCost.toFixed(2)}/unit
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 mt-4">
              <button className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}>
                View Details
              </button>
              <button className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-pharma-teal text-white hover:bg-pharma-medium'
                  : 'bg-pharma-teal text-white hover:bg-pharma-medium'
              }`}>
                Edit Order
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Purchase Order Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Create New Purchase Order</h2>
            
            <div className="text-center py-8">
              <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Purchase Order form would go here
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                This would include supplier selection, product selection, quantities, etc.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-pharma-teal to-pharma-medium text-white hover:shadow-lg transition-all duration-200"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PurchasesPage

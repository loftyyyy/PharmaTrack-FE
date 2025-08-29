import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { products as productsApi } from '../services/api'
import { productBatchesApi } from '../services/productBatchesApi'

const ProductBatchesPage = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [batches, setBatches] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [formData, setFormData] = useState({
    batchNumber: '',
    productId: '',
    manufacturingDate: '',
    expiryDate: '',
    quantity: '',
    costPerUnit: '',
    location: '',
    status: 'active'
  })

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const data = await productsApi.getAll()
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setProducts([])
    }
  }

  // Fetch batches from API
  const fetchBatches = async () => {
    try {
      const data = await productBatchesApi.getAll()
      setBatches(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch batches:', error)
      setBatches([])
    }
  }

  // Helper function to format product display
  const formatProductDisplay = (product) => {
    if (!product) return ''
    const barcode = product.barcode || 'No Barcode'
    const name = product.name || 'Unknown Product'
    const brand = product.brand || 'Unknown Brand'
    const strength = product.strength || 'Unknown Strength'
    return `[${barcode}] ${name} – ${brand} – ${strength}`
  }

  // Helper function to get product by ID
  const getProductById = (productId) => {
    return products.find(p => p.id === parseInt(productId))
  }

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([fetchProducts(), fetchBatches()])
      } catch (error) {
        console.error('Failed to load data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

         const handleSubmit = async (e) => {
       e.preventDefault()
       
       setSubmitting(true)
       try {
         const batchData = {
           batchNumber: formData.batchNumber,
           productId: parseInt(formData.productId),
           manufacturingDate: formData.manufacturingDate,
           expiryDate: formData.expiryDate,
           quantity: parseInt(formData.quantity),
           costPerUnit: parseFloat(formData.costPerUnit),
           location: formData.location,
           status: formData.status
         }
         
         if (editingBatch) {
           // Update existing batch
           const updatedBatch = await productBatchesApi.update(editingBatch.id, batchData)
           setBatches(batches.map(batch => 
             batch.id === editingBatch.id ? updatedBatch : batch
           ))
         } else {
           // Add new batch
           const newBatch = await productBatchesApi.create(batchData)
           setBatches([...batches, newBatch])
         }
         
         setShowAddModal(false)
         setEditingBatch(null)
         setFormData({
           batchNumber: '',
           productId: '',
           manufacturingDate: '',
           expiryDate: '',
           quantity: '',
           costPerUnit: '',
           location: '',
           status: 'active'
         })
       } catch (error) {
         console.error('Failed to save batch:', error)
         // You could add a toast notification here to show the error to the user
         alert('Failed to save batch. Please try again.')
       } finally {
         setSubmitting(false)
       }
     }

  const handleEdit = (batch) => {
    setEditingBatch(batch)
    setFormData({
      batchNumber: batch.batchNumber,
      productId: batch.productId?.toString() || '',
      manufacturingDate: batch.manufacturingDate,
      expiryDate: batch.expiryDate,
      quantity: batch.quantity.toString(),
      costPerUnit: batch.costPerUnit.toString(),
      location: batch.location || '',
      status: batch.status
    })
    setShowAddModal(true)
  }



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'expired': return 'bg-red-100 text-red-800'
      case 'recalled': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isExpiringSoon = (expiryDate) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0
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
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Batches</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage product batches, expiry dates, and batch tracking
          </p>
        </div>
                 <button
           onClick={() => setShowAddModal(true)}
           className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
         >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Batch
        </button>
      </div>

      {/* Batches Table */}
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
                  Batch Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Dates
                </th>
                                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Quantity & Cost
                 </th>
                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Location
                 </th>
                 <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                   isDarkMode ? 'text-gray-300' : 'text-gray-500'
                 }`}>
                   Status
                 </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {batches.map((batch) => (
                <tr key={batch.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div>
                       <div className="text-sm font-medium">{batch.batchNumber}</div>
                       <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                         {getProductById(batch.productId) ? formatProductDisplay(getProductById(batch.productId)) : batch.productName || 'Unknown Product'}
                       </div>
                       
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      <div>Mfg: {new Date(batch.manufacturingDate).toLocaleDateString()}</div>
                      <div className={isExpiringSoon(batch.expiryDate) ? 'text-yellow-600' : ''}>
                        Exp: {new Date(batch.expiryDate).toLocaleDateString()}
                        {isExpiringSoon(batch.expiryDate) && (
                          <span className="ml-1 text-xs">⚠️</span>
                        )}
                      </div>
                    </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm">
                       <div>Qty: {batch.quantity}</div>
                       <div>${batch.costPerUnit}/unit</div>
                       <div className="text-xs text-gray-500">
                         Total: ${(batch.quantity * batch.costPerUnit).toFixed(2)}
                       </div>
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm">
                       {batch.location || '-'}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                       {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                     </span>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(batch)}
                        className="text-pharma-teal hover:text-pharma-medium"
                      >
                        Edit
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingBatch ? 'Edit Batch' : 'Add New Batch'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter batch number"
                  />
                </div>
                
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
                         {formatProductDisplay(product)}
                       </option>
                     ))}
                   </select>
                 </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Manufacturing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
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
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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
                    Quantity *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter quantity"
                  />
                </div>
                
                                 <div>
                   <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Cost Per Unit *
                   </label>
                   <input
                     type="number"
                     required
                     min="0"
                     step="0.01"
                     value={formData.costPerUnit}
                     onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                     className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                       isDarkMode
                         ? 'bg-gray-700 border-gray-600 text-white'
                         : 'bg-white border-gray-300 text-gray-900'
                     }`}
                     placeholder="Enter cost per unit"
                   />
                 </div>
                 
                 <div>
                   <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Location
                   </label>
                   <input
                     type="text"
                     maxLength="50"
                     value={formData.location}
                     onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                     className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                       isDarkMode
                         ? 'bg-gray-700 border-gray-600 text-white'
                         : 'bg-white border-gray-300 text-gray-900'
                     }`}
                     placeholder="Enter storage location"
                   />
                 </div>
                 
                 <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="active">Active</option>
                    <option value="expired">Expired</option>
                    <option value="recalled">Recalled</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingBatch(null)
                    setFormData({
                      batchNumber: '',
                      productId: '',
                      manufacturingDate: '',
                      expiryDate: '',
                      quantity: '',
                      costPerUnit: '',
                      location: '',
                      status: 'active'
                    })
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
                   disabled={submitting}
                   className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                     submitting
                       ? 'bg-gray-400 cursor-not-allowed'
                       : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg'
                   }`}
                 >
                   {submitting ? (
                     <span className="flex items-center justify-center">
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       {editingBatch ? 'Updating...' : 'Adding...'}
                     </span>
                   ) : (
                     `${editingBatch ? 'Update' : 'Add'} Batch`
                   )}
                 </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductBatchesPage

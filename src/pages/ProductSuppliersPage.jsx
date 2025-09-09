import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import productSuppliersApi from '../services/productSuppliersApi'
import productsApi from '../services/productsApi'
import suppliersApi from '../services/suppliersApi'
import productBatchesApi from '../services/productBatchesApi'
import ErrorDisplay from '../components/ErrorDisplay'
import { getErrorMessage } from '../utils/errorHandler'

const ProductSuppliersPage = ({ isDarkMode }) => {
  const { isAuthenticated } = useAuth()
  const [productSuppliers, setProductSuppliers] = useState([])
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [productIdToBatchNumber, setProductIdToBatchNumber] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProductSupplier, setEditingProductSupplier] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    productId: '',
    supplierId: '',
    preferredSupplier: false,
    supplierProductCode: ''
  })

  // Form validation
  const [formErrors, setFormErrors] = useState({})

  const validateForm = () => {
    const errors = {}
    
    // Product validation
    if (!formData.productId) {
      errors.productId = 'Product is required'
    }

    // Supplier validation
    if (!formData.supplierId) {
      errors.supplierId = 'Supplier is required'
    }

    // Supplier product code validation
    if (!formData.supplierProductCode.trim()) {
      errors.supplierProductCode = 'Supplier product code is required'
    } else if (formData.supplierProductCode.length > 100) {
      errors.supplierProductCode = 'Supplier product code must not exceed 100 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Fetch data from APIs
  useEffect(() => {
    // Only load data if user is authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping data load')
      return
    }
    fetchInitialData()
  }, [isAuthenticated])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setError(null)
      setLoadingError(null)
      
      // Fetch all data in parallel
      const [productSuppliersResponse, productsResponse, suppliersResponse, batchesResponse] = await Promise.all([
        productSuppliersApi.getAll(),
        productsApi.getAll(),
        suppliersApi.getAll(),
        productBatchesApi.getAll().catch(() => [])
      ])
      
      setProductSuppliers(productSuppliersResponse || [])
      setProducts(productsResponse || [])
      setSuppliers(suppliersResponse || [])
      // Map first seen batch number per product for quick display
      const mapping = {}
      ;(batchesResponse || []).forEach((batch) => {
        const pid = batch.product?.id || batch.productId
        if (pid && !mapping[pid]) {
          mapping[pid] = batch.batchNumber || '—'
        }
      })
      setProductIdToBatchNumber(mapping)
    } catch (err) {
      console.error('Error fetching data:', err)
      setLoadingError(err)
      setProductSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProductSuppliers = async () => {
    try {
      if (!loading) {
        setRefreshing(true)
      }
      setError(null)
      setLoadingError(null)
      const response = await productSuppliersApi.getAll()
      setProductSuppliers(response || [])
    } catch (err) {
      console.error('Error fetching product suppliers:', err)
      setLoadingError(err)
      setProductSuppliers([])
    } finally {
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      
      const submitData = {
        productId: parseInt(formData.productId),
        supplierId: parseInt(formData.supplierId),
        preferredSupplier: formData.preferredSupplier,
        supplierProductCode: formData.supplierProductCode.trim()
      }
      
      if (editingProductSupplier) {
        // Update existing product supplier (only send updatable fields)
        const updateData = {
          preferredSupplier: formData.preferredSupplier,
          supplierProductCode: formData.supplierProductCode.trim()
        }
        const updatedProductSupplier = await productSuppliersApi.update(editingProductSupplier.productSupplierId, updateData)
        setProductSuppliers(productSuppliers.map(ps => 
          ps.productSupplierId === editingProductSupplier.productSupplierId ? updatedProductSupplier : ps
        ))
        setSuccess('Product supplier updated successfully!')
      } else {
        // Add new product supplier
        const newProductSupplier = await productSuppliersApi.create(submitData)
        setProductSuppliers([...productSuppliers, newProductSupplier])
        setSuccess('Product supplier created successfully!')
      }
      
      // Close modal and reset form on success
      setShowAddModal(false)
      setEditingProductSupplier(null)
      setFormData({
        productId: '',
        supplierId: '',
        preferredSupplier: false,
        supplierProductCode: ''
      })
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving product supplier:', err)
      const errorInfo = getErrorMessage(err)
      setError(errorInfo.message)
      
      // Close modal immediately on error so user can see the error message
      setShowAddModal(false)
      setEditingProductSupplier(null)
      setFormData({
        productId: '',
        supplierId: '',
        preferredSupplier: false,
        supplierProductCode: ''
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (productSupplier) => {
    setEditingProductSupplier(productSupplier)
    setFormData({
      productId: productSupplier.product?.id || '',
      supplierId: productSupplier.supplier?.id || '',
      preferredSupplier: productSupplier.preferredSupplier || false,
      supplierProductCode: productSupplier.supplierProductCode || ''
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  // Deletion not allowed for product supplier relationships per policy

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading product suppliers...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Supplier</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage product-supplier relationships and preferences
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchProductSuppliers}
            disabled={loading || refreshing}
            className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
              loading || refreshing
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:shadow-lg'
            } ${
              isDarkMode
                ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className={`w-5 h-5 inline mr-2 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => {
              setEditingProductSupplier(null)
              setFormData({
                productId: '',
                supplierId: '',
                preferredSupplier: false,
                supplierProductCode: ''
              })
              setFormErrors({})
              setShowAddModal(true)
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Product Supplier
          </button>
        </div>
      </div>

      {/* Error Display */}
      <ErrorDisplay 
        error={loadingError} 
        onDismiss={() => setLoadingError(null)}
        isDarkMode={isDarkMode}
      />

      <ErrorDisplay 
        error={error ? { message: error } : null} 
        onDismiss={() => setError(null)}
        isDarkMode={isDarkMode}
      />

      {/* Success Display */}
      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
            <button
              onClick={() => setSuccess(null)}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Product Suppliers Table */}
      {productSuppliers.length === 0 && !loading ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">No product suppliers found</h3>
          <p className="text-sm">Get started by adding your first product supplier relationship.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Product
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Supplier
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Supplier Product Code
                </th>
                <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Preferred
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'}`}>
              {productSuppliers.map((productSupplier) => (
                <tr key={productSupplier.productSupplierId} className={
                  isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {productSupplier.product?.name || 'N/A'}
                    </div>
                    {productSupplier.product?.dosageForm && (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {productSupplier.product.dosageForm}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">
                      {productSupplier.supplier?.name || 'N/A'}
                    </div>
                    {productSupplier.supplier?.contactPerson && (
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Contact: {productSupplier.supplier.contactPerson}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {productSupplier.supplierProductCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {productSupplier.preferredSupplier ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Preferred
                      </span>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                      }`}>
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Not Preferred
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleEdit(productSupplier)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Edit
                      </button>
                      {/* Delete action removed by policy */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingProductSupplier ? 'Edit Product Supplier' : 'Add New Product Supplier'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                {/* Product Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Product *
                  </label>
                  <select
                    required
                    disabled={editingProductSupplier} // Cannot change product when editing
                    value={formData.productId}
                    onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.productId ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${
                      editingProductSupplier ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => {
                      const batchNum = productIdToBatchNumber[product.id] || '—'
                      const sku = product.sku || '—'
                      return (
                        <option key={product.id} value={product.id}>
                          [{batchNum}] - {sku}
                        </option>
                      )
                    })}
                  </select>
                  {formErrors.productId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.productId}</p>
                  )}
                </div>

                {/* Supplier Selection */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier *
                  </label>
                  <select
                    required
                    disabled={editingProductSupplier} // Cannot change supplier when editing
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.supplierId ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } ${
                      editingProductSupplier ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.supplierId && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.supplierId}</p>
                  )}
                </div>

                {/* Supplier Product Code */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier Product Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.supplierProductCode}
                    onChange={(e) => setFormData({ ...formData, supplierProductCode: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.supplierProductCode ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter supplier's product code"
                    maxLength={100}
                  />
                  {formErrors.supplierProductCode && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.supplierProductCode}</p>
                  )}
                </div>

                {/* Preferred Supplier Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="preferredSupplier"
                    checked={formData.preferredSupplier}
                    onChange={(e) => setFormData({ ...formData, preferredSupplier: e.target.checked })}
                    className={`h-4 w-4 text-pharma-medium focus:ring-pharma-medium border-gray-300 rounded ${
                      isDarkMode ? 'bg-gray-700 border-gray-600' : ''
                    }`}
                  />
                  <label htmlFor="preferredSupplier" className={`ml-2 block text-sm ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Preferred Supplier
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingProductSupplier(null)
                    setFormData({
                      productId: '',
                      supplierId: '',
                      preferredSupplier: false,
                      supplierProductCode: ''
                    })
                    setFormErrors({})
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
                      ? 'opacity-50 cursor-not-allowed bg-gray-400'
                      : 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg'
                  }`}
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {editingProductSupplier ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    `${editingProductSupplier ? 'Update' : 'Add'} Product Supplier`
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

export default ProductSuppliersPage

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import productsApi from '../services/productsApi'
import categoriesApi from '../services/categoriesApi'
import ErrorDisplay from '../components/ErrorDisplay'
import { getErrorMessage } from '../utils/errorHandler'

const AllProductsPage = ({ isDarkMode }) => {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterBatchManaged, setFilterBatchManaged] = useState('all')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    manufacturer: '',
    dosageForm: '',
    strength: '',
    minimumStock: '',
    drugClassification: '',
    description: '',
    category: '',
    barcode: '',
    active: true,
  })



  // Drug classifications enum values that match backend
  const drugClassifications = [
    { id: 'OTC', name: 'Over the Counter' },
    { id: 'RX', name: 'Prescription Required' }
  ]



  // Load products and categories from backend
  const fetchProducts = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      setLoadingError(null)
      const data = await productsApi.getAll()
      // Normalize products: map productId to id for consistency
      const normalizedProducts = Array.isArray(data) 
        ? data.map(product => ({
            ...product,
            id: product.productId || product.id // Use productId from backend, fallback to id if present
          }))
        : []
      setProducts(normalizedProducts)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setLoadingError(error)
      setProducts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const data = await categoriesApi.getAll()
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Don't set loading error for categories as it's not critical
      setCategories([])
    }
  }





  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return
      }
      
      // Only load data if user is authenticated
      if (!isAuthenticated()) {
        return
      }
      
      setLoading(true)
      setLoadingError(null)
      try {
        await Promise.all([fetchProducts(), fetchCategories()])
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoadingError(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isAuthenticated, authLoading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      const dto = {
        name: formData.name,
        brand: formData.brand,
        manufacturer: formData.manufacturer,
        dosageForm: formData.dosageForm,
        strength: formData.strength,
        minimumStock: parseInt(formData.minimumStock),
        drugClassification: formData.drugClassification,
        description: formData.description,
        categoryId: parseInt(formData.category),
        barcode: formData.barcode,
        active: editingProduct ? formData.active : true, // New products are always active
      }
      
      if (editingProduct) {
        // Validate that editingProduct has a valid ID
        const productId = editingProduct.id
        if (!productId && productId !== 0) {
          throw new Error('Product ID is missing. Cannot update product.')
        }
        // Ensure ID is a number (convert if string)
        const numericId = typeof productId === 'string' ? parseInt(productId, 10) : productId
        if (isNaN(numericId)) {
          throw new Error(`Invalid product ID: ${productId}. Cannot update product.`)
        }
        await productsApi.update(numericId, dto)
        setSuccess('Product updated successfully!')
      } else {
        await productsApi.create(dto)
        setSuccess('Product created successfully!')
      }
      
      await fetchProducts() // Refresh products list
      
      // Close modal and reset form, but keep success message visible
      setShowAddModal(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        brand: '',
        manufacturer: '',
        dosageForm: '',
        strength: '',
        minimumStock: '',
        drugClassification: '',
        description: '',
        category: '',
        barcode: '',
        active: true,
      })
      
      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Failed to save product:', err)
      const errorInfo = getErrorMessage(err)
      setError(errorInfo.message)
      
      // Close modal immediately on error so user can see the error message
      setShowAddModal(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        brand: '',
        manufacturer: '',
        dosageForm: '',
        strength: '',
        minimumStock: '',
        drugClassification: '',
        description: '',
        category: '',
        barcode: '',
        active: true,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setShowAddModal(false)
    setEditingProduct(null)
    setError(null)
    // Don't clear success message here - let it auto-hide
    setFormData({
      name: '',
      brand: '',
      manufacturer: '',
      dosageForm: '',
      strength: '',
      minimumStock: '',
      drugClassification: '',
      description: '',
      category: '',
      barcode: '',
      active: true,
    })
  }

  const handleEdit = (product) => {
    // Validate that product has a valid ID
    if (!product || (!product.id && product.id !== 0)) {
      console.error('Cannot edit product: Product ID is missing', product)
      setError('Cannot edit product: Product ID is missing')
      return
    }
    
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      brand: product.brand || '',
      description: product.description || '',
      category: product.category?.id?.toString() || '',
      barcode: product.barcode || '',
      manufacturer: product.manufacturer || '',
      dosageForm: product.dosageForm || '',
      strength: product.strength || '',
      minimumStock: product.minimumStock || 0,
      drugClassification: product.drugClassification || '',
      active: product.active !== undefined ? product.active : true
    })
    setShowAddModal(true)
  }

  const getStockStatus = (product) => {
    // Check if product is batch managed based on the new batchManaged field
    if (product.batchManaged === true) {
      return { 
        status: 'batch-managed', 
        color: 'bg-blue-100 text-blue-800', 
        text: 'Batch Managed',
        urgent: false
      }
    }
    
    if (product.batchManaged === false) {
      return { 
        status: 'batch-not-managed', 
        color: 'bg-orange-100 text-orange-800', 
        text: 'Batch Not Managed',
        urgent: true
      }
    }
    
    // Fallback for products without batchManaged field (legacy behavior)
    if (!product.currentStock && product.currentStock !== 0) {
      return { 
        status: 'batch-managed', 
        color: 'bg-blue-100 text-blue-800', 
        text: 'Batch Managed',
        urgent: false
      }
    }
    
    if (product.currentStock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', text: 'Out of Stock', urgent: false }
    if (product.minimumStock && product.currentStock < product.minimumStock) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock', urgent: false }
    }
    return { status: 'normal', color: 'bg-green-100 text-green-800', text: 'In Stock', urgent: false }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm) ||
                         product.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.category?.id === parseInt(filterCategory)
    const matchesBatchManaged = filterBatchManaged === 'all' || 
                               (filterBatchManaged === 'managed' && product.batchManaged === true) ||
                               (filterBatchManaged === 'not-managed' && product.batchManaged === false)
    return matchesSearch && matchesCategory && matchesBatchManaged
  })

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading products...
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
          <h1 className="text-2xl font-bold">All Products</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your complete product catalog with pricing, stock levels, and details
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              setError(null)
              setSuccess(null)
              fetchProducts()
            }}
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
              setError(null)
              setSuccess(null)
              setShowAddModal(true)
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Product
          </button>
        </div>
      </div>

      {/* Loading Error Display */}
      <ErrorDisplay 
        error={loadingError} 
        onDismiss={() => setLoadingError(null)}
        isDarkMode={isDarkMode}
      />

      {/* Form Error Display */}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="text-pharma-teal">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Products</p>
              <p className="text-2xl font-bold text-green-600">
                {products.filter(p => p.isActive).length}
              </p>
            </div>
            <div className="text-2xl">✅</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">
                {products.filter(p => p.currentStock < p.minStockLevel).length}
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">
                {products.filter(p => p.currentStock === 0).length}
              </p>
            </div>
            <div className="text-2xl">❌</div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Not Batch Managed</p>
              <p className="text-2xl font-bold text-orange-600">
                {products.filter(p => p.batchManaged === false).length}
              </p>
            </div>
            <div className="text-2xl">⚠️</div>
          </div>
        </div>

      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products by name, SKU, barcode, or manufacturer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
          />
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Categories</option>
            {categories.filter(category => category.active !== false).map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <select
            value={filterBatchManaged}
            onChange={(e) => setFilterBatchManaged(e.target.value)}
            className={`px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
              isDarkMode
                ? 'bg-gray-800 border-gray-600 text-white'
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Products</option>
            <option value="managed">Batch Managed</option>
            <option value="not-managed">Not Batch Managed</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
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
                  Product Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Medical Info
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Stock Status
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
              {filteredProducts.map((product) => {
                const stockStatus = getStockStatus(product)
                return (
                  <tr key={product.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">{product.name}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.category?.name || 'Unknown Category'} • {product.sku || 'No SKU'}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {product.barcode || 'No Barcode'} • {product.brand || 'Unknown Brand'}
                        </div>
                        {(product.requiresPrescription || product.drugClassification === 'RX') && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Prescription Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {product.manufacturer || 'Unknown Manufacturer'}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {product.dosageForm || 'Unknown Form'} • {product.strength || 'Unknown Strength'}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Min Stock: {product.minimumStock || 'Not Set'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">
                          {product.currentStock !== undefined ? `${product.currentStock} ${product.unit || 'units'}` : 
                           product.batchManaged === true ? 'Managed by Batches' : 
                           product.batchManaged === false ? 'Not Batch Managed' : 'Managed by Batches'}
                        </div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Min Stock: {product.minimumStock || 'Not Set'}
                        </div>
                        <span 
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} mt-1 ${
                            stockStatus.urgent ? 'cursor-help' : ''
                          }`}
                          title={stockStatus.urgent ? 'This product needs batch tracking for proper inventory management. Add product batches to enable accurate stock tracking and expiry monitoring.' : ''}
                        >
                          {stockStatus.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.active !== undefined 
                          ? (product.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.active !== undefined 
                          ? (product.active ? 'Active' : 'Inactive') 
                          : 'Unknown Status'
                        }
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          disabled={product.batchManaged === false}
                          className={`${
                            product.batchManaged === false
                              ? 'text-gray-400 cursor-not-allowed opacity-50'
                              : 'text-pharma-teal hover:text-pharma-medium'
                          }`}
                          title={product.batchManaged === false ? 'Cannot edit: Product needs batch management first' : 'Edit product'}
                        >
                          Edit
                        </button>
                        {product.batchManaged === false && (
                          <button
                            onClick={() => {
                              // Navigate to Product Batches page - this would need to be implemented with routing
                              window.location.href = '/product-batches'
                            }}
                            className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all duration-200 ${
                              isDarkMode
                                ? 'text-orange-400 hover:text-orange-300 hover:bg-orange-900/30'
                                : 'text-orange-600 hover:text-orange-800 hover:bg-orange-100'
                            }`}
                            title="Add product batches to enable proper inventory tracking"
                          >
                            Manage Batches
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No products found matching your search criteria.
          </p>
        </div>
      )}



      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto scrollbar-hide ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add New Product'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Basic Information */}
                <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="150"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Category *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Brand *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter brand"
                  />
                </div>
                
                <div className="lg:col-span-3">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    rows="3"
                    placeholder="Enter product description"
                  />
                </div>

                {/* Identification */}
                <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-3 mt-4">Identification</h3>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Barcode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="50"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter barcode"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Manufacturer *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="100"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter manufacturer"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Minimum Stock *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="0"
                  />
                </div>

                {/* Medical Information */}
                <div className="lg:col-span-3">
                  <h3 className="text-lg font-semibold mb-3 mt-4">Medical Information</h3>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Strength *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="50"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., 500mg, 250ml"
                  />
                </div>
                
                <div>
                  <label className={`block text sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Dosage Form *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="50"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="e.g., tablet, capsule, syrup"
                  />
                </div>
                  
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Drug Classification *
                  </label>
                  <select
                    required
                    value={formData.drugClassification}
                    onChange={(e) => setFormData({ ...formData, drugClassification: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="">Select Classification</option>
                    {drugClassifications.map((classification) => (
                      <option key={classification.id} value={classification.id}>
                        {classification.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status - Only show when editing */}
                {editingProduct && (
                  <>
                    <div className="lg:col-span-3">
                      <h3 className="text-lg font-semibold mb-3 mt-4">Status</h3>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Active Status *
                      </label>
                      <select
                        required
                        value={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.value === 'true' })}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                          isDarkMode
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="">Select Status</option>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
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
                      {editingProduct ? 'Updating...' : 'Adding...'}
                    </span>
                  ) : (
                    `${editingProduct ? 'Update' : 'Add'} Product`
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

export default AllProductsPage
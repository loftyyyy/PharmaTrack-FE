import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { products as productsApi } from '../services/api'

const AllProductsPage = ({ isDarkMode }) => {
  const { user, apiRequest } = useAuth()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
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

  // Mock data for categories
  const mockCategories = [
    { id: 1, name: 'Analgesics' },
    { id: 2, name: 'Antibiotics' },
    { id: 3, name: 'Vitamins' },
    { id: 4, name: 'Antacids' },
    { id: 5, name: 'Antiseptics' }
  ]

  // Mock data for drug classifications
  const mockDrugClassifications = [
    { id: 'OTC', name: 'Over the Counter' },
    { id: 'PRESCRIPTION', name: 'Prescription Required' }
  ]

  // Load products from backend with fallback to mock
  useEffect(() => {
    const mockProducts = [
      {
        id: 1,
        name: 'Paracetamol 500mg',
        description: 'Pain relief and fever reducer',
        category: 'Analgesics',
        categoryId: 1,
        sku: 'PARA500',
        barcode: '123456789001',
        unitPrice: 2.50,
        costPrice: 1.75,
        currentStock: 150,
        minStockLevel: 50,
        maxStockLevel: 500,
        unit: 'tablets',
        isActive: true,
        requiresPrescription: false,
        manufacturer: 'PharmaCorp Ltd',
        activeIngredient: 'Paracetamol',
        strength: '500mg',
        dosageForm: 'tablet',
        createdAt: '2024-01-15T10:30:00',
        updatedAt: '2024-01-20T14:20:00'
      },
      {
        id: 2,
        name: 'Amoxicillin 250mg',
        description: 'Antibiotic for bacterial infections',
        category: 'Antibiotics',
        categoryId: 2,
        sku: 'AMOX250',
        barcode: '123456789002',
        unitPrice: 5.75,
        costPrice: 4.20,
        currentStock: 25,
        minStockLevel: 30,
        maxStockLevel: 200,
        unit: 'capsules',
        isActive: true,
        requiresPrescription: true,
        manufacturer: 'MediSupply Inc',
        activeIngredient: 'Amoxicillin',
        strength: '250mg',
        dosageForm: 'capsule',
        createdAt: '2024-01-10T09:15:00',
        updatedAt: '2024-01-18T16:45:00'
      },
      {
        id: 3,
        name: 'Vitamin C 1000mg',
        description: 'Vitamin C supplement',
        category: 'Vitamins',
        categoryId: 3,
        sku: 'VITC1000',
        barcode: '123456789003',
        unitPrice: 1.25,
        costPrice: 0.85,
        currentStock: 0,
        minStockLevel: 25,
        maxStockLevel: 300,
        unit: 'tablets',
        isActive: true,
        requiresPrescription: false,
        manufacturer: 'HealthCorp',
        activeIngredient: 'Ascorbic Acid',
        strength: '1000mg',
        dosageForm: 'tablet',
        createdAt: '2024-01-05T11:20:00',
        updatedAt: '2024-01-15T13:30:00'
      }
    ]
    
    const load = async () => {
      try {
        const data = await productsApi.getAll()
        // Normalize minimal fields expected by UI; backend DTO may differ
        const normalized = Array.isArray(data) ? data.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          category: p.category?.name || p.categoryName || p.category || '',
          categoryId: p.category?.id || p.categoryId || 0,
          sku: p.sku || '',
          barcode: p.barcode || '',
          unitPrice: typeof p.unitPrice === 'number' ? p.unitPrice : parseFloat(p.unitPrice || 0),
          costPrice: typeof p.costPrice === 'number' ? p.costPrice : parseFloat(p.costPrice || 0),
          currentStock: p.currentStock ?? 0,
          minStockLevel: p.minStockLevel ?? 0,
          maxStockLevel: p.maxStockLevel ?? 0,
          unit: p.unit || 'tablets',
          isActive: p.isActive !== undefined ? p.isActive : true,
          requiresPrescription: p.requiresPrescription || false,
          manufacturer: p.manufacturer || '',
          activeIngredient: p.activeIngredient || '',
          strength: p.strength || '',
          dosageForm: p.dosageForm || 'tablet',
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })) : []
        setProducts(normalized)
        setCategories(mockCategories) // keep mock categories until backend endpoint exists
      } catch (e) {
        // Fallback to mock on error
        setProducts(mockProducts)
        setCategories(mockCategories)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

     const handleSubmit = async (e) => {
     e.preventDefault()
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
       active: formData.active,
     }
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, dto)
      } else {
        await productsApi.create(dto)
      }
      await fetchProducts()
      resetForm()
    } catch (err) {
      alert(err.message || 'Failed to save product')
    }
  }

     const resetForm = () => {
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
   }

     const handleEdit = (product) => {
     setEditingProduct(product)
     setFormData({
       name: product.name,
       brand: product.brand || '',
       description: product.description,
       category: product.categoryId.toString(),
       barcode: product.barcode,
       manufacturer: product.manufacturer,
       dosageForm: product.dosageForm,
       strength: product.strength,
       minimumStock: product.minStockLevel || 0,
       drugClassification: product.drugClassification || '',
       active: product.isActive
     })
     setShowAddModal(true)
   }

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      setProducts(products.filter(product => product.id !== productId))
    }
  }

  const toggleStatus = (productId) => {
    setProducts(products.map(product =>
      product.id === productId
        ? { ...product, isActive: !product.isActive, updatedAt: new Date().toISOString() }
        : product
    ))
  }

  const getStockStatus = (product) => {
    if (product.currentStock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', text: 'Out of Stock' }
    if (product.currentStock < product.minStockLevel) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' }
    if (product.currentStock > product.maxStockLevel) return { status: 'over', color: 'bg-blue-100 text-blue-800', text: 'Overstocked' }
    return { status: 'normal', color: 'bg-green-100 text-green-800', text: 'Normal' }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode.includes(searchTerm) ||
                         product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = filterCategory === 'all' || product.categoryId === parseInt(filterCategory)
    return matchesSearch && matchesCategory
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
          <h1 className="text-2xl font-bold">All Products</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your complete product catalog with pricing, stock levels, and details
          </p>
        </div>
                 <button
           onClick={() => setShowAddModal(true)}
           className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
         >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Product
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
            <div className="text-2xl">📦</div>
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
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
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
                  Pricing
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Stock
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
                          {product.category} • {product.sku}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {product.manufacturer} • {product.strength}
                        </div>
                        {product.requiresPrescription && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                            Prescription Required
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">${product.unitPrice}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Cost: ${product.costPrice}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          Margin: {((product.unitPrice - product.costPrice) / product.costPrice * 100).toFixed(1)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium">{product.currentStock} {product.unit}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Min: {product.minStockLevel} • Max: {product.maxStockLevel}
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color} mt-1`}>
                          {stockStatus.text}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                                         <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                       <button
                         onClick={() => handleEdit(product)}
                         className="text-pharma-teal hover:text-pharma-medium"
                       >
                         Edit
                       </button>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto ${
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
                   <label className={`block text-sm font-medium mb-2 ${
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
                     {mockDrugClassifications.map((classification) => (
                       <option key={classification.id} value={classification.id}>
                         {classification.name}
                       </option>
                     ))}
                   </select>
                 </div>

                 {/* Status */}
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
                   className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
                 >
                  {editingProduct ? 'Update' : 'Add'} Product
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


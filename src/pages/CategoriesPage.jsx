import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import categoriesApi from '../services/categoriesApi'
import ErrorDisplay from '../components/ErrorDisplay'
import { getErrorMessage } from '../utils/errorHandler'

const CategoriesPage = ({ isDarkMode }) => {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    active: true
  })

  // Fetch categories from API
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      if (!loading) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)
      setLoadingError(null)
      const response = await categoriesApi.getAll()
      setCategories(response || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      setLoadingError(err)
      setCategories([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError(null)
      
      if (editingCategory) {
        // Update existing category
        const updatedCategory = await categoriesApi.update(editingCategory.id, formData)
        setCategories(categories.map(cat => 
          cat.id === editingCategory.id ? updatedCategory : cat
        ))
        setSuccess('Category updated successfully!')
        
        // Close modal and reset form on success
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({ name: '', active: true })
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        // Add new category
        const newCategory = await categoriesApi.create(formData)
        setCategories([...categories, newCategory])
        setSuccess('Category created successfully!')
        
        // Close modal and reset form on success
        setShowAddModal(false)
        setEditingCategory(null)
        setFormData({ name: '', active: true })
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Error saving category:', err)
      const errorInfo = getErrorMessage(err)
      setError(errorInfo.message)
      
      // Close modal immediately on error so user can see the error message
      setShowAddModal(false)
      setEditingCategory(null)
      setFormData({ name: '', active: true })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      active: category.active !== undefined ? category.active : true
    })
    setShowAddModal(true)
  }





  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading categories...
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
          <h1 className="text-2xl font-bold">Product Categories</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your product categories and classifications
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchCategories}
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
               setEditingCategory(null)
               setFormData({ name: '', active: true })
               setShowAddModal(true)
             }}
             className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
           >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Category
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

      {/* Categories Grid */}
      {categories.length === 0 && !loading ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">No categories found</h3>
          <p className="text-sm">Get started by creating your first product category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
                         <div key={category.id} className={`rounded-lg border p-6 ${
               isDarkMode 
                 ? 'bg-gray-800 border-gray-700' 
                 : 'bg-white border-gray-200'
             }`}>
               <div className="mb-4">
                 <h3 className="text-lg font-semibold">{category.name}</h3>
                 <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                   category.active !== false
                     ? 'bg-green-100 text-green-800'
                     : 'bg-red-100 text-red-800'
                 }`}>
                   {category.active !== false ? 'Active' : 'Inactive'}
                 </span>
               </div>

               <div className="flex space-x-2">
                 <button
                   onClick={() => handleEdit(category)}
                   className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                     isDarkMode
                       ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                       : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                   }`}
                 >
                   Edit
                 </button>
               </div>
             </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md mx-4 ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </h2>
            
                         <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter category name"
                />
              </div>
              
                              {editingCategory && (
                 <div className="mb-6">
                   <label className="flex items-center">
                     <input
                       type="checkbox"
                       checked={formData.active}
                       onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                       className="w-4 h-4 text-pharma-teal bg-gray-100 border-gray-300 rounded focus:ring-pharma-medium focus:ring-2"
                     />
                     <span className={`ml-2 text-sm ${
                       isDarkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                       Active Category
                     </span>
                   </label>
                 </div>
               )}
             
             <div className="flex space-x-3">
                                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCategory(null)
                    setFormData({ name: '', active: true })
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
                     {editingCategory ? 'Updating...' : 'Adding...'}
                   </>
                 ) : (
                   `${editingCategory ? 'Update' : 'Add'} Category`
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

export default CategoriesPage

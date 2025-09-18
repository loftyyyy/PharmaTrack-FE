import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import productsApi from '../services/productsApi'
import { productBatchesApi } from '../services/productBatchesApi'
import ErrorDisplay from '../components/ErrorDisplay'
import { getErrorMessage } from '../utils/errorHandler'

const ProductBatchesPage = ({ isDarkMode }) => {
  const { isAuthenticated } = useAuth()
  const [batches, setBatches] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBatch, setEditingBatch] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [resolvedProduct, setResolvedProduct] = useState(null)
  const [formData, setFormData] = useState({
    batchNumber: '',
    productId: '',
    manufacturingDate: '',
    expiryDate: '',
    quantity: '',
    costPerUnit: '',
    location: '',
    status: 'AVAILABLE'
  })

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setError(null)
      const data = await productsApi.getAll()
      // Filter only active products for batch creation
      const activeProducts = Array.isArray(data) ? data.filter(product => product.active === true) : []
      setProducts(activeProducts)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      // Don't set loading error for products as it's not critical
      setProducts([])
    }
  }

     // Fetch batches from API
   const fetchBatches = async () => {
     try {
       setError(null)
       setLoadingError(null)
       const data = await productBatchesApi.getAll()
       console.log('📥 Raw data from fetchBatches:', data)
       console.log('🔍 First batch structure:', data?.[0])
               console.log('🏷️ Status fields in first batch:', data?.[0] ? {
         status: data[0].status,
         hasStatus: 'status' in (data[0] || {})
       } : 'No batches')
       
       setBatches(Array.isArray(data) ? data : [])
     } catch (error) {
       console.error('Failed to fetch batches:', error)
       setLoadingError(error)
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
      // Only load data if user is authenticated
      if (!isAuthenticated()) {
        console.log('User not authenticated, skipping product batches load')
        return
      }
      
      setLoading(true)
      setLoadingError(null)
      try {
        await Promise.all([fetchProducts(), fetchBatches()])
      } catch (error) {
        console.error('Failed to load data:', error)
        setLoadingError(error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [isAuthenticated])

         const handleSubmit = async (e) => {
       e.preventDefault()
       
               setSubmitting(true)
        setError(null)
        try {
          // Send all fields back using the values as fetched/populated in the form
          const batchData = {
            batchNumber: formData.batchNumber,
            productId: parseInt(formData.productId),
            manufacturingDate: formData.manufacturingDate,
            expiryDate: formData.expiryDate,
            quantity: parseInt(formData.quantity),
            purchasePricePerUnit: parseFloat(formData.costPerUnit),
            location: formData.location,
            batchStatus: formData.status
          }
          
                     // Debug: Log the data being sent
           console.log('📋 Form data before processing:', formData)
           console.log('📤 Processed batch data:', batchData)
           console.log('🔍 Data types:', {
             batchNumber: typeof batchData.batchNumber,
             productId: typeof batchData.productId,
             manufacturingDate: typeof batchData.manufacturingDate,
             expiryDate: typeof batchData.expiryDate,
             quantity: typeof batchData.quantity,
             purchasePricePerUnit: typeof batchData.purchasePricePerUnit,
             location: typeof batchData.location,
             batchStatus: typeof batchData.batchStatus
           })
                       console.log('🎯 Operation type:', editingBatch ? 'UPDATE' : 'CREATE')
            console.log('🏷️ Status being sent:', editingBatch ? batchData.batchStatus : 'Backend handles automatically')
          
                     if (editingBatch) {
             // Update existing batch - use the correct ID field
             const batchId = editingBatch.productBatchId || editingBatch.id
             console.log('🔍 Updating batch with ID:', batchId, 'editingBatch:', editingBatch)
             
             const updatedBatch = await productBatchesApi.update(batchId, batchData)
             
                          // Debug: Log the updated batch response
             console.log('🔍 Backend response for updated batch:', updatedBatch)
             console.log('🔍 Backend response keys:', Object.keys(updatedBatch))
             console.log('🏷️ Status fields in updated response:', {
               status: updatedBatch.status,
               hasStatus: 'status' in updatedBatch
             })
             
             // Instead of manually updating the local state, refresh from backend to ensure consistency
             await fetchBatches()
             
             // Debug: Log what we got after refresh
             console.log('🔄 After refresh - all batches:', batches)
             console.log('🔍 Updated batch after refresh:', batches.find(b => (b.productBatchId || b.id) === batchId))
             
             setSuccess('Batch updated successfully!')
             
             // Close modal and reset form on success
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
               status: 'AVAILABLE'
             })
             
             // Auto-hide success message after 3 seconds
             setTimeout(() => setSuccess(null), 3000)
         } else {
           // Creation disabled
           throw new Error('Batch creation is disabled')
         }
        } catch (error) {
          console.error('Failed to save batch:', error)
          const errorInfo = getErrorMessage(error)
          setError(errorInfo.message)
          
          // Close modal immediately on error so user can see the error message
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
            status: 'AVAILABLE'
          })
        } finally {
          setSubmitting(false)
        }
     }

     const handleEdit = (batch) => {
     // Debug: Log the batch object being edited
     console.log('🔍 Editing batch object:', batch)
     console.log('🏷️ Batch ID fields:', {
       productBatchId: batch.productBatchId,
       id: batch.id,
       hasProductBatchId: 'productBatchId' in batch,
       hasId: 'id' in batch
     })
     
    setEditingBatch(batch)
    // Resolve and display the product tied to this batch
    const pid = batch.product?.id || batch.productId
    const local = getProductById(pid)
    if (batch.product) {
      setResolvedProduct(batch.product)
    } else if (local) {
      setResolvedProduct(local)
    } else if (pid) {
      productsApi.getById(pid).then(setResolvedProduct).catch(() => setResolvedProduct(null))
    } else {
      setResolvedProduct(null)
    }
     
     // Convert backend date format to frontend format for form inputs
     const convertDateForForm = (dateValue) => {
       if (Array.isArray(dateValue)) {
         const [year, month, day] = dateValue
         // Month is 0-indexed in Date constructor, so subtract 1
         const date = new Date(year, month - 1, day)
         return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
       }
       return dateValue
     }
     
                                               // Debug: Log what status is being loaded into the form
        const formStatus = batch.status || 'AVAILABLE'
        console.log('🏷️ Loading status into form:', {
          originalStatus: batch.status,
          finalFormStatus: formStatus
        })
        
        // If product is inactive, force status to UNAVAILABLE
        const effectiveStatus = (batch.product && batch.product.active === false) ? 'UNAVAILABLE' : formStatus
        console.log('🏷️ Effective status (considering product active status):', {
          originalStatus: formStatus,
          productActive: batch.product?.active,
          effectiveStatus: effectiveStatus
        })
       
       setFormData({
         batchNumber: batch.batchNumber,
         productId: (batch.product?.id || batch.productId)?.toString() || '',
         manufacturingDate: convertDateForForm(batch.manufacturingDate),
         expiryDate: convertDateForForm(batch.expiryDate),
         quantity: batch.quantity.toString(),
         costPerUnit: (batch.purchasePricePerUnit || batch.costPerUnit).toString(),
         location: batch.location || '',
         status: effectiveStatus
       })
     setShowAddModal(true)
   }





  // Helper function to format dates from backend (handles both array and string formats)
  const formatDate = (dateValue) => {
    if (Array.isArray(dateValue)) {
      // Backend returns [year, month, day] format
      const [year, month, day] = dateValue
      return new Date(year, month - 1, day).toLocaleDateString()
    } else if (dateValue) {
      // Frontend expects string format
      return new Date(dateValue).toLocaleDateString()
    }
    return 'N/A'
  }

  // Helper function to get effective status (considers product active status)
  const getEffectiveStatus = (batch) => {
    // If product is inactive, batch should be unavailable regardless of its actual status
    if (batch.product && batch.product.active === false) {
      return 'UNAVAILABLE'
    }
    return batch.status || 'AVAILABLE'
  }

  // Helper function to get status color and display
  const getStatusColor = (status, isDark) => {
    const key = status?.toUpperCase()
    if (isDark) {
      switch (key) {
        case 'AVAILABLE':
          return 'bg-emerald-900/30 text-emerald-300 border border-emerald-700'
        case 'SOLD_OUT':
          return 'bg-rose-900/30 text-rose-300 border border-rose-700'
        case 'EXPIRED':
          return 'bg-orange-900/30 text-orange-300 border border-orange-700'
        case 'RECALLED':
          return 'bg-amber-900/30 text-amber-300 border border-amber-700'
        case 'UNAVAILABLE':
          return 'bg-slate-800 text-slate-300 border border-slate-700'
        default:
          return 'bg-slate-800 text-slate-300 border border-slate-700'
      }
    }
    // Light mode
    switch (key) {
      case 'AVAILABLE':
        return 'bg-emerald-100 text-emerald-800'
      case 'SOLD_OUT':
        return 'bg-rose-100 text-rose-800'
      case 'EXPIRED':
        return 'bg-orange-100 text-orange-800'
      case 'RECALLED':
        return 'bg-amber-100 text-amber-800'
      case 'UNAVAILABLE':
        return 'bg-slate-200 text-slate-700'
      default:
        return 'bg-slate-200 text-slate-700'
    }
  }

  const isExpiringSoon = (expiryDate) => {
    const today = new Date()
    let expiry
    if (Array.isArray(expiryDate)) {
      const [year, month, day] = expiryDate
      expiry = new Date(year, month - 1, day)
    } else {
      expiry = new Date(expiryDate)
    }
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0
  }

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading batches...
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
           <h1 className="text-2xl font-bold">Product Batches</h1>
           <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
             Manage product batches, expiry dates, and batch tracking
           </p>
         </div>
         <div className="flex space-x-3">
           <button
             onClick={() => {
               setError(null)
               setSuccess(null)
               fetchBatches()
             }}
             disabled={loading}
             className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
               loading
                 ? 'opacity-50 cursor-not-allowed'
                 : 'hover:shadow-lg'
             } ${
               isDarkMode
                 ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                 : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
             }`}
           >
             <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
             </svg>
             Refresh
           </button>
          {/* Add Batch button removed as per requirement */}
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
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}>
                    Location
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
                 <tr key={batch.productBatchId || batch.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                                      <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium">{batch.batchNumber}</div>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {batch.product ? formatProductDisplay(batch.product) : 
                           getProductById(batch.productId) ? formatProductDisplay(getProductById(batch.productId)) : 
                           batch.productName || 'Unknown Product'}
                        </div>
                        
                      </div>
                    </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm">
                       <div>Mfg: {formatDate(batch.manufacturingDate)}</div>
                       <div className={isExpiringSoon(batch.expiryDate) ? 'text-yellow-600' : ''}>
                         Exp: {formatDate(batch.expiryDate)}
                         {isExpiringSoon(batch.expiryDate) && (
                           <span className="ml-1 text-xs">⚠️</span>
                         )}
                       </div>
                     </div>
                   </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div>Qty: {batch.quantity}</div>
                        <div>${batch.purchasePricePerUnit || batch.costPerUnit}/unit</div>
                        <div className="text-xs text-gray-500">
                          Total: ${(batch.quantity * (batch.purchasePricePerUnit || batch.costPerUnit)).toFixed(2)}
                        </div>
                      </div>
                                         </td>
                                                                                   <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getEffectiveStatus(batch), isDarkMode)}`}>
                            {getEffectiveStatus(batch)}
                          </span>
                          {batch.product && batch.product.active === false && (
                            <div className="text-xs text-gray-500 mt-1">
                              (Product inactive)
                            </div>
                          )}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {batch.location || '-'}
                      </div>
                    </td>

                                     <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <div className="flex space-x-2">
                       <button
                         onClick={() => handleEdit(batch)}
                         disabled={batch.product && batch.product.active === false}
                         className={`${
                           batch.product && batch.product.active === false
                             ? 'text-gray-400 cursor-not-allowed opacity-50'
                             : 'text-pharma-teal hover:text-pharma-medium'
                         }`}
                         title={batch.product && batch.product.active === false ? 'Cannot edit: Product is inactive' : 'Edit batch'}
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

      {batches.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No batches found. Create your first batch to get started.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">Edit Batch</h2>
            
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none opacity-60 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled
                    placeholder="Enter batch number"
                  />
                </div>
                
                <div>
                   <label className={`block text-sm font-medium mb-2 ${
                     isDarkMode ? 'text-gray-300' : 'text-gray-700'
                   }`}>
                     Product *
                   </label>
                  <input
                    type="text"
                    value={formatProductDisplay(resolvedProduct || (products.find(p => p.id === parseInt(formData.productId)) || editingBatch?.product))}
                    readOnly
                    disabled
                    className={`w-full px-3 py-2 border rounded-lg opacity-60 ${
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
                    Manufacturing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none opacity-60 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none opacity-60 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none opacity-60 ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    disabled
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none opacity-60 ${
                       isDarkMode
                         ? 'bg-gray-700 border-gray-600 text-white'
                         : 'bg-white border-gray-300 text-gray-900'
                     }`}
                    disabled
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none opacity-60 ${
                       isDarkMode
                         ? 'bg-gray-700 border-gray-600 text-white'
                         : 'bg-white border-gray-300 text-gray-900'
                     }`}
                    disabled
                     placeholder="Enter storage location"
                   />
                 </div>
                 
                                                                       <div>
                     <label className={`block text-sm font-medium mb-2 ${
                       isDarkMode ? 'text-gray-300' : 'text-gray-700'
                     }`}>
                       Status {!editingBatch && <span className="text-xs text-gray-500">(New batches default to Available)</span>}
                       {editingBatch && editingBatch.product && editingBatch.product.active === false && (
                         <span className="text-xs text-red-500 ml-2">(Product inactive - status locked)</span>
                       )}
                     </label>
                                        <select
                       value={formData.status}
                       onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                       disabled={!editingBatch || (editingBatch && editingBatch.product && editingBatch.product.active === false)}
                       className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                         isDarkMode
                           ? 'bg-gray-700 border-gray-600 text-white'
                           : 'bg-white border-gray-300 text-gray-900'
                       } ${(!editingBatch || (editingBatch && editingBatch.product && editingBatch.product.active === false)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                     >
                       <option value="AVAILABLE">Available</option>
                       <option value="SOLD_OUT">Sold Out</option>
                       <option value="EXPIRED">Expired</option>
                       <option value="RECALLED">Recalled</option>
                       <option value="UNAVAILABLE">Unavailable</option>
                     </select>
                     {editingBatch && editingBatch.product && editingBatch.product.active === false && (
                       <p className="text-xs text-red-500 mt-1">
                         This batch is automatically unavailable because the product is inactive. 
                         Reactivate the product to change batch status.
                       </p>
                     )}
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
                      status: 'AVAILABLE'
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

import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import suppliersApi from '../services/suppliersApi'
import ErrorDisplay from '../components/ErrorDisplay'
import { getErrorMessage } from '../utils/errorHandler'

const SuppliersPage = ({ isDarkMode }) => {
  const { user, isAuthenticated } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [loadingError, setLoadingError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phoneNumber: '',
    email: '',
    addressStreetBarangay: '',
    addressCityMunicipality: '',
    addressProvince: '',
    addressPostalCode: ''
  })

  // Form validation
  const [formErrors, setFormErrors] = useState({})

  // Search
  const [searchTerm, setSearchTerm] = useState('')

  const validateForm = () => {
    const errors = {}
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    } else if (formData.name.length > 150) {
      errors.name = 'Name must not exceed 150 characters'
    }

    // Contact person validation
    if (formData.contactPerson && formData.contactPerson.length > 100) {
      errors.contactPerson = 'Contact person must not exceed 100 characters'
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else if (formData.phoneNumber.length > 20) {
      errors.phoneNumber = 'Phone number must not exceed 20 characters'
    }

    // Email validation
    if (formData.email) {
      if (formData.email.length > 100) {
        errors.email = 'Email must not exceed 100 characters'
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
          errors.email = 'Invalid email format'
        }
      }
    }

    // Address validations
    if (formData.addressStreetBarangay && formData.addressStreetBarangay.length > 255) {
      errors.addressStreetBarangay = 'Street address or Barangay must not exceed 255 characters'
    }
    if (formData.addressCityMunicipality && formData.addressCityMunicipality.length > 100) {
      errors.addressCityMunicipality = 'City or Municipality must not exceed 100 characters'
    }
    if (formData.addressProvince && formData.addressProvince.length > 100) {
      errors.addressProvince = 'Province must not exceed 100 characters'
    }
    if (formData.addressPostalCode && formData.addressPostalCode.length > 20) {
      errors.addressPostalCode = 'Postal code must not exceed 20 characters'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Fetch suppliers from API
  useEffect(() => {
    // Only load data if user is authenticated
    if (!isAuthenticated()) {
      console.log('User not authenticated, skipping suppliers load')
      return
    }
    fetchSuppliers()
  }, [isAuthenticated])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      setRefreshing(true)
      setError(null)
      setLoadingError(null)
      const response = await suppliersApi.getAll()
      setSuppliers(response || [])
    } catch (err) {
      console.error('Error fetching suppliers:', err)
      setLoadingError(err)
      setSuppliers([])
    } finally {
      setLoading(false)
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
      
      if (editingSupplier) {
        // Update existing supplier
        const updatedSupplier = await suppliersApi.update(editingSupplier.supplierId, formData)
        setSuppliers(suppliers.map(supplier => 
          supplier.supplierId === editingSupplier.supplierId ? updatedSupplier : supplier
        ))
        setSuccess('Supplier updated successfully!')
        
        // Close modal and reset form on success
        setShowAddModal(false)
        setEditingSupplier(null)
        setFormData({
          name: '',
          contactPerson: '',
          phoneNumber: '',
          email: '',
          addressStreetBarangay: '',
          addressCityMunicipality: '',
          addressProvince: '',
          addressPostalCode: ''
        })
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      } else {
        // Add new supplier
        const newSupplier = await suppliersApi.create(formData)
        setSuppliers([...suppliers, newSupplier])
        setSuccess('Supplier created successfully!')
        
        // Close modal and reset form on success
        setShowAddModal(false)
        setEditingSupplier(null)
        setFormData({
          name: '',
          contactPerson: '',
          phoneNumber: '',
          email: '',
          addressStreetBarangay: '',
          addressCityMunicipality: '',
          addressProvince: '',
          addressPostalCode: ''
        })
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      console.error('Error saving supplier:', err)
      const errorInfo = getErrorMessage(err)
      setError(errorInfo.message)
      
      // Close modal immediately on error so user can see the error message
      setShowAddModal(false)
      setEditingSupplier(null)
      setFormData({
        name: '',
        contactPerson: '',
        phoneNumber: '',
        email: '',
        addressStreetBarangay: '',
        addressCityMunicipality: '',
        addressProvince: '',
        addressPostalCode: ''
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (supplier) => {
    setEditingSupplier(supplier)
    setFormData({
      name: supplier.name || '',
      contactPerson: supplier.contactPerson || '',
      phoneNumber: supplier.phoneNumber || '',
      email: supplier.email || '',
      addressStreetBarangay: supplier.addressStreetBarangay || '',
      addressCityMunicipality: supplier.addressCityMunicipality || '',
      addressProvince: supplier.addressProvince || '',
      addressPostalCode: supplier.addressPostalCode || ''
    })
    setFormErrors({})
    setShowAddModal(true)
  }

  const formatAddress = (supplier) => {
    const addressParts = [
      supplier.addressStreetBarangay,
      supplier.addressCityMunicipality,
      supplier.addressProvince,
      supplier.addressPostalCode
    ].filter(part => part && part.trim())
    
    return addressParts.length > 0 ? addressParts.join(', ') : 'No address provided'
  }

  const filteredSuppliers = suppliers.filter((s) => {
    const q = (searchTerm || '').toLowerCase()
    if (!q) return true
    const address = [s.addressStreetBarangay, s.addressCityMunicipality, s.addressProvince, s.addressPostalCode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return (
      s.name?.toLowerCase().includes(q) ||
      s.contactPerson?.toLowerCase().includes(q) ||
      s.phoneNumber?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      address.includes(q)
    )
  })

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pharma-teal mx-auto mb-4"></div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Loading suppliers...
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
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage your suppliers and vendor relationships
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchSuppliers}
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
              setEditingSupplier(null)
              setFormData({
                name: '',
                contactPerson: '',
                phoneNumber: '',
                email: '',
                addressStreetBarangay: '',
                addressCityMunicipality: '',
                addressProvince: '',
                addressPostalCode: ''
              })
              setFormErrors({})
              setShowAddModal(true)
            }}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
          >
            <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Add Supplier
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

      {/* Search */}
      <div className="flex mb-6">
        <input
          type="text"
          placeholder="Search suppliers by name, contact, phone, email, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

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

      {/* Suppliers Grid */}
      {filteredSuppliers.length === 0 && !loading ? (
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <svg className="mx-auto h-12 w-12 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <h3 className="text-lg font-medium mb-2">
            {searchTerm ? 'No suppliers match your search' : 'No suppliers found'}
          </h3>
          <p className="text-sm">
            {searchTerm ? 'Try different keywords or clearing the search.' : 'Get started by adding your first supplier.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuppliers.map((supplier) => (
            <div key={supplier.supplierId} className={`rounded-lg border p-6 ${
              isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">{supplier.name}</h3>
                
                {supplier.contactPerson && (
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-medium">Contact:</span> {supplier.contactPerson}
                  </p>
                )}
                
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <span className="font-medium">Phone:</span> {supplier.phoneNumber}
                </p>
                
                {supplier.email && (
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <span className="font-medium">Email:</span> {supplier.email}
                  </p>
                )}
                
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="font-medium">Address:</span> {formatAddress(supplier)}
                </p>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(supplier)}
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
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Supplier Name */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.name ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter supplier name"
                    maxLength={150}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Contact Person */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.contactPerson ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter contact person"
                    maxLength={100}
                  />
                  {formErrors.contactPerson && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.contactPerson}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.phoneNumber ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter phone number"
                    maxLength={20}
                  />
                  {formErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phoneNumber}</p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.email ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter email address"
                    maxLength={100}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
              </div>

              {/* Address Section */}
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Street Address */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Street/Barangay
                  </label>
                  <input
                    type="text"
                    value={formData.addressStreetBarangay}
                    onChange={(e) => setFormData({ ...formData, addressStreetBarangay: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.addressStreetBarangay ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter street/barangay"
                    maxLength={255}
                  />
                  {formErrors.addressStreetBarangay && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.addressStreetBarangay}</p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    City/Municipality
                  </label>
                  <input
                    type="text"
                    value={formData.addressCityMunicipality}
                    onChange={(e) => setFormData({ ...formData, addressCityMunicipality: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.addressCityMunicipality ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter city/municipality"
                    maxLength={100}
                  />
                  {formErrors.addressCityMunicipality && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.addressCityMunicipality}</p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Province
                  </label>
                  <input
                    type="text"
                    value={formData.addressProvince}
                    onChange={(e) => setFormData({ ...formData, addressProvince: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.addressProvince ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter province"
                    maxLength={100}
                  />
                  {formErrors.addressProvince && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.addressProvince}</p>
                  )}
                </div>

                {/* Zip Code */}
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.addressPostalCode}
                    onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      formErrors.addressPostalCode ? 'border-red-500' : ''
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter postal code"
                    maxLength={20}
                  />
                  {formErrors.addressPostalCode && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.addressPostalCode}</p>
                  )}
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingSupplier(null)
                    setFormData({
                      name: '',
                      contactPerson: '',
                      phoneNumber: '',
                      email: '',
                      addressStreetBarangay: '',
                      addressCityMunicipality: '',
                      addressProvince: '',
                      addressPostalCode: ''
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
                      {editingSupplier ? 'Updating...' : 'Adding...'}
                    </>
                  ) : (
                    `${editingSupplier ? 'Update' : 'Add'} Supplier`
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

export default SuppliersPage

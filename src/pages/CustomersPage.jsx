import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import customersApi from '../services/customersApi'
import ErrorDisplay from '../components/ErrorDisplay'

const CustomersPage = ({ isDarkMode }) => {
  useAuth()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    addressStreetBarangay: '',
    addressCityMunicipality: '',
    addressProvince: '',
    addressPostalCode: '',
    isActive: true
  })

  const loadCustomers = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await customersApi.getAll()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (e) {
      setCustomers([])
      setError({ message: e.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError(null)
      const payload = {
        name: formData.name,
        phoneNumber: formData.phoneNumber || '',
        email: formData.email || '',
        addressStreetBarangay: formData.addressStreetBarangay || '',
        addressCityMunicipality: formData.addressCityMunicipality || '',
        addressProvince: formData.addressProvince || '',
        addressPostalCode: formData.addressPostalCode || '',
        isActive: typeof formData.isActive === 'boolean' ? formData.isActive : true
      }
      if (editingCustomer) {
        await customersApi.update(editingCustomer.customerId, payload)
      } else {
        await customersApi.create(payload)
      }
      setShowAddModal(false)
      setEditingCustomer(null)
      setFormData({ name: '', email: '', phoneNumber: '', addressStreetBarangay: '', addressCityMunicipality: '', addressProvince: '', addressPostalCode: '', isActive: true })
      loadCustomers()
    } catch (e) {
      setError({ message: e.message })
    }
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name || '',
      email: customer.email || '',
      phoneNumber: customer.phoneNumber || '',
      addressStreetBarangay: customer.addressStreetBarangay || '',
      addressCityMunicipality: customer.addressCityMunicipality || '',
      addressProvince: customer.addressProvince || '',
      addressPostalCode: customer.addressPostalCode || '',
      isActive: typeof customer.isActive === 'boolean' ? customer.isActive : true
    })
    setShowAddModal(true)
  }

  const handleToggleActive = async (customer) => {
    const nextActive = !customer.isActive
    if (!window.confirm(`Are you sure you want to ${nextActive ? 'activate' : 'deactivate'} this customer?`)) return
    try {
      if (!nextActive) {
        // Use dedicated deactivate endpoint
        await customersApi.deactivate(customer.customerId)
      } else {
        await customersApi.activate(customer.customerId)
      }
      loadCustomers()
    } catch (e) {
      setError({ message: e.message })
    }
  }

  const filteredCustomers = customers.filter(customer =>
    (customer.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phoneNumber || '').includes(searchTerm)
  )

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
          <h1 className="text-2xl font-bold">Customers</h1>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage customer information and purchase history
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
        >
          <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
          </svg>
          Add Customer
        </button>
      </div>

      <ErrorDisplay 
        error={error}
        onDismiss={() => setError(null)}
        isDarkMode={isDarkMode}
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <div className="text-2xl text-pharma-teal">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>With Email</p>
              <p className="text-2xl font-bold text-green-600">
                {customers.filter(c => c.email).length}
              </p>
            </div>
            <div className="text-2xl text-green-600">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
          </div>
        </div>

        <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>With Phone</p>
              <p className="text-2xl font-bold text-pharma-teal">
                {customers.filter(c => c.phoneNumber).length}
              </p>
            </div>
            <div className="text-2xl text-pharma-teal">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search customers by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
            isDarkMode
              ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCustomers.map((customer) => (
          <div key={customer.customerId} className={`rounded-lg border p-6 ${
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{customer.name}</h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {customer.email}
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {customer.phoneNumber}
                </p>
              </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {customer.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium bg-slate-200 text-slate-700`}>
                Created {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''}
              </span>
            </div>
            </div>

            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              <p className="mb-1">📍 {[
                customer.addressStreetBarangay,
                customer.addressCityMunicipality,
                customer.addressProvince,
                customer.addressPostalCode
              ].filter(Boolean).join(', ') || '—'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Customer ID</p>
                <p className="font-medium">#{customer.customerId}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Email</p>
                <p className="font-bold text-pharma-teal">{customer.email || '—'}</p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEdit(customer)}
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Edit
              </button>
              <button
                onClick={() => handleToggleActive(customer)}
                className={`py-2 px-3 rounded text-sm font-medium transition-colors ${customer.isActive ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
              >
                {customer.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="text-center py-8">
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No customers found matching your search.
          </p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Full Name *
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
                    placeholder="Enter full name"
                  />
                </div>
                
                <div>
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
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter email address"
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter street/barangay"
                  />
                </div>
                
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
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter city/municipality"
                  />
                </div>
                
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
                    className={`w-full px-3 py-2 border rounded-lg focus:outline:none focus:ring-2 focus:ring-pharma-medium ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter province"
                  />
                </div>
                
                <div>
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
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
              
            <div className="mt-4">
              <label className={`inline-flex items-center gap-2 text-sm font-medium ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <input
                  type="checkbox"
                  checked={!!formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                />
                Active
              </label>
            </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setEditingCustomer(null)
                  setFormData({ name: '', email: '', phoneNumber: '', addressStreetBarangay: '', addressCityMunicipality: '', addressProvince: '', addressPostalCode: '', isActive: true })
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
                  className="flex-1 py-2 px-4 rounded-lg font-medium bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 hover:shadow-lg transition-all duration-200"
                >
                  {editingCustomer ? 'Update' : 'Add'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomersPage


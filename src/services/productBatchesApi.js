// Product Batches API Service
// Replace these mock functions with actual backend API calls

const BASE_URL = 'http://localhost:8080/api' // Update this URL to match your backend

export const productBatchesApi = {
  // Get all batches for a specific product
  getByProductId: async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/product-batches/product/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch product batches:', error)
      // Return mock data for development
      return [
        {
          id: 1,
          batchNumber: 'B001-2024',
          quantity: 100,
          purchasePricePerUnit: 2.50,
          expiryDate: '2025-12-31',
          manufacturingDate: '2024-01-15',
          location: 'Warehouse A',
          batchStatus: 'AVAILABLE',
          createdAt: '2024-01-15T10:00:00',
          createdById: 1
        },
        {
          id: 2,
          batchNumber: 'B002-2024',
          quantity: 75,
          purchasePricePerUnit: 2.75,
          expiryDate: '2025-06-30',
          manufacturingDate: '2024-02-01',
          location: 'Warehouse B',
          batchStatus: 'AVAILABLE',
          createdAt: '2024-02-01T10:00:00',
          createdById: 1
        }
      ]
    }
  },

  // Create a new product batch
  create: async (batchData) => {
    try {
      const response = await fetch(`${BASE_URL}/product-batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(batchData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to create product batch:', error)
      throw error
    }
  },

  // Update an existing product batch
  update: async (batchId, batchData) => {
    try {
      const response = await fetch(`${BASE_URL}/product-batches/${batchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(batchData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to update product batch:', error)
      throw error
    }
  },



  // Get all batches (for admin purposes)
  getAll: async () => {
    try {
      const response = await fetch(`${BASE_URL}/product-batches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch all product batches:', error)
      throw error
    }
  }
}

export default productBatchesApi

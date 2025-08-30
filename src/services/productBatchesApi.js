// Product Batches API Service
// Replace these mock functions with actual backend API calls

const BASE_URL = 'http://localhost:8080/api/v1' // Update this URL to match your backend

export const productBatchesApi = {
  // Get all batches for a specific product
  // Note: Your controller doesn't have this endpoint, so we'll filter from getAll
  getByProductId: async (productId) => {
    try {
      const allBatches = await this.getAll()
      return allBatches.filter(batch => batch.productId === parseInt(productId))
    } catch (error) {
      console.error('Failed to fetch product batches by product ID:', error)
      return []
    }
  },

  // Create a new product batch
  create: async (batchData) => {
    try {
      const response = await fetch(`${BASE_URL}/productBatches/create`, {
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

  // Get a specific product batch by ID
  getById: async (id) => {
    try {
      const response = await fetch(`${BASE_URL}/productBatches/${id}`, {
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
      console.error('Failed to fetch product batch by ID:', error)
      throw error
    }
  },

  // Update an existing product batch
  update: async (batchId, batchData) => {
    try {
      const response = await fetch(`${BASE_URL}/productBatches/${batchId}`, {
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
      const response = await fetch(`${BASE_URL}/productBatches`, {
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

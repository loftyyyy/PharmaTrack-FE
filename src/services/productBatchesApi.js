// Product Batches API Service
// Backend is ready - using actual API endpoints

const BASE_URL = 'http://localhost:8080/api/v1'

export const productBatchesApi = {
  // Check if a product batch exists for a given productId and batchNumber
  checkExists: async ({ productId, batchNumber }) => {
    try {
      const accessToken = localStorage.getItem('pharma_access_token')
      const payload = {
        productId: Number(productId),
        batchNumber: String(batchNumber)
      }
      const response = await fetch(`${BASE_URL}/productBatches/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      })
      if (!response.ok) {
        let message = `HTTP error! status: ${response.status}`
        try {
          const data = await response.json()
          message = data.message || data.error || message
        } catch {
          console.debug('No JSON body in error response for checkExists')
        }
        throw new Error(message)
      }
      return await response.json() // { exists: boolean }
    } catch (error) {
      console.error('Failed to check product batch existence:', error)
      throw error
    }
  },

  // Get all batches for a specific product via backend endpoint
  getByProductId: async (productId) => {
    try {
      const response = await fetch(`${BASE_URL}/productBatches/${productId}/batches`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('pharma_access_token')}`
        }
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch product batches by product ID:', error)
      return []
    }
  },

  // Create a new product batch
  create: async (batchData) => {
    try {
      const accessToken = localStorage.getItem('pharma_access_token')
      console.log('🔑 Using token for create batch:', accessToken ? `${accessToken.substring(0, 20)}...` : 'No token found')
      console.log('📤 Sending batch data:', JSON.stringify(batchData, null, 2))
      
      const response = await fetch(`${BASE_URL}/productBatches/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(batchData)
      })
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        try {
          const errorData = await response.json()
          console.log('📄 Backend error response:', errorData)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch (parseError) {
          console.log('Could not parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }
      
      const result = await response.json()
      console.log('✅ Batch created successfully:', result)
      return result
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
          'Authorization': `Bearer ${localStorage.getItem('pharma_access_token')}`
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
          'Authorization': `Bearer ${localStorage.getItem('pharma_access_token')}`
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
          'Authorization': `Bearer ${localStorage.getItem('pharma_access_token')}`
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

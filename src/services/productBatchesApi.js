// Product Batches API Service
// Backend: @RequestMapping("/api/v1/productBatches")

import apiService from './api'

export const productBatchesApi = {
  // Check if a product batch exists for a given productId and batchNumber
  checkExists: async ({ productId, batchNumber }) => {
    try {
      const payload = {
        productId: Number(productId),
        batchNumber: String(batchNumber)
      }
      return await apiService.post('/api/v1/productBatches/check', payload)
    } catch (error) {
      console.error('Failed to check product batch existence:', error)
      throw error
    }
  },

  // Get all batches for a specific product via backend endpoint
  getByProductId: async (productId) => {
    try {
      return await apiService.get(`/api/v1/productBatches/${productId}/batches`)
    } catch (error) {
      console.error('Failed to fetch product batches by product ID:', error)
      return []
    }
  },

  // Get a specific product batch by ID
  getById: async (id) => {
    try {
      return await apiService.get(`/api/v1/productBatches/${id}`)
    } catch (error) {
      console.error('Failed to fetch product batch by ID:', error)
      throw error
    }
  },

  // Update an existing product batch
  update: async (batchId, batchData) => {
    try {
      return await apiService.put(`/api/v1/productBatches/${batchId}`, batchData)
    } catch (error) {
      console.error('Failed to update product batch:', error)
      throw error
    }
  },

  // Get all batches (for admin purposes)
  getAll: async () => {
    try {
      return await apiService.get('/api/v1/productBatches')
    } catch (error) {
      console.error('Failed to fetch all product batches:', error)
      throw error
    }
  },

  // Get earliest batches (for POS - FIFO inventory management)
  getEarliest: async () => {
    try {
      return await apiService.get('/api/v1/productBatches/earliest')
    } catch (error) {
      console.error('Failed to fetch earliest product batches:', error)
      throw error
    }
  }
}

export default productBatchesApi

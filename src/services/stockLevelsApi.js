// Stock Levels API Service
// Aggregates data from product batches to calculate stock levels

import { productBatchesApi } from './productBatchesApi'

const BASE_URL = 'http://localhost:8080/api/v1'

export const stockLevelsApi = {
  // Get all stock levels with aggregated data
  getAll: async () => {
    try {
      // Fetch all product batches (which include product information)
      const batches = await productBatchesApi.getAll()
      
      // Group batches by product ID to calculate stock levels
      const stockLevelsByProduct = batches.reduce((acc, batch) => {
        const productId = batch.product?.id || batch.productId
        
        if (!acc[productId]) {
          // Initialize stock level for this product
          acc[productId] = {
            id: productId,
            productName: batch.product?.name || 'Unknown Product',
            category: batch.product?.category?.name || 'Uncategorized',
            currentStock: 0,
            minStock: batch.product?.minimumStock || 0,
            unit: batch.product?.unit || 'units',
            location: batch.location || batch.product?.location || 'N/A',
            lastUpdated: null,
            status: 'normal',
            product: batch.product,
            batches: []
          }
        }
        
        // Add this batch to the product's batch list
        acc[productId].batches.push(batch)
        
        // Add to current stock if batch is available
        if (batch.status) {
          acc[productId].currentStock += batch.quantity || 0
        }
        
        // Update last updated timestamp
        const batchDate = batch.createdAt || batch.manufacturingDate
        if (batchDate) {
          const batchTime = new Date(batchDate).getTime()
          if (!acc[productId].lastUpdated || batchTime > acc[productId].lastUpdated) {
            acc[productId].lastUpdated = batchTime
          }
        }
        
        return acc
      }, {})
      
      // Convert to array and calculate status for each product
      const stockLevels = Object.values(stockLevelsByProduct).map(item => {
        // Determine stock status
        let status = 'normal'
        if (item.currentStock === 0) {
          status = 'out'
        } else if (item.currentStock < item.minStock) {
          status = 'low'
        }
        
        return {
          ...item,
          status,
          lastUpdated: item.lastUpdated ? new Date(item.lastUpdated).toISOString() : new Date().toISOString()
        }
      })
      
      return stockLevels
    } catch (error) {
      console.error('Failed to fetch stock levels:', error)
      throw error
    }
  },

  // Get stock levels by status (low, out, overstocked, normal)
  getByStatus: async (status) => {
    try {
      const allStockLevels = await stockLevelsApi.getAll()
      return allStockLevels.filter(item => item.status === status)
    } catch (error) {
      console.error(`Failed to fetch stock levels by status ${status}:`, error)
      throw error
    }
  },

  // Get low stock items
  getLowStock: async () => {
    return stockLevelsApi.getByStatus('low')
  },

  // Get out of stock items
  getOutOfStock: async () => {
    return stockLevelsApi.getByStatus('out')
  },

  // Get overstocked items
  getOverstocked: async () => {
    return stockLevelsApi.getByStatus('overstocked')
  },

  // Get stock summary statistics
  getSummary: async () => {
    try {
      const allStockLevels = await stockLevelsApi.getAll()
      
      const summary = {
        total: allStockLevels.length,
        normal: allStockLevels.filter(item => item.status === 'normal').length,
        low: allStockLevels.filter(item => item.status === 'low').length,
        out: allStockLevels.filter(item => item.status === 'out').length,
        totalValue: allStockLevels.reduce((sum, item) => {
          const avgPrice = item.product?.sellingPrice || 0
          return sum + (item.currentStock * avgPrice)
        }, 0)
      }
      
      return summary
    } catch (error) {
      console.error('Failed to fetch stock summary:', error)
      throw error
    }
  },

  // Search stock levels by product name or category
  search: async (searchTerm) => {
    try {
      const allStockLevels = await stockLevelsApi.getAll()
      const lowerSearchTerm = searchTerm.toLowerCase()
      
      return allStockLevels.filter(item => 
        item.productName.toLowerCase().includes(lowerSearchTerm) ||
        item.category.toLowerCase().includes(lowerSearchTerm)
      )
    } catch (error) {
      console.error('Failed to search stock levels:', error)
      throw error
    }
  }
}

export default stockLevelsApi

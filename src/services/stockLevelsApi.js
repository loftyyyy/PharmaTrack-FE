// Stock Levels API Service
// Aggregates data from products and product batches to calculate stock levels

import { products as productsApi } from './api'
import { productBatchesApi } from './productBatchesApi'

const BASE_URL = 'http://localhost:8080/api/v1'

export const stockLevelsApi = {
  // Get all stock levels with aggregated data
  getAll: async () => {
    try {
      const token = localStorage.getItem('pharma_token')
      
      // Fetch products and batches in parallel
      const [products, batches] = await Promise.all([
        productsApi.getAll(),
        productBatchesApi.getAll()
      ])

      // Create a map of product batches by product ID
      const batchesByProduct = batches.reduce((acc, batch) => {
        const productId = batch.product?.id || batch.productId
        if (!acc[productId]) {
          acc[productId] = []
        }
        acc[productId].push(batch)
        return acc
      }, {})

      // Calculate stock levels for each product
      const stockLevels = products.map(product => {
        const productBatches = batchesByProduct[product.id] || []
        
        // Calculate current stock (sum of all available batches)
        const currentStock = productBatches
          .filter(batch => batch.batchStatus === 'AVAILABLE' || batch.status === 'AVAILABLE')
          .reduce((sum, batch) => sum + (batch.quantity || 0), 0)
        
        // Get min and max stock from product
        const minStock = product.minStock || 0
        const maxStock = product.maxStock || 1000
        
        // Determine stock status
        let status = 'normal'
        if (currentStock === 0) {
          status = 'out'
        } else if (currentStock < minStock) {
          status = 'low'
        } else if (currentStock > maxStock) {
          status = 'overstocked'
        }
        
        // Get location from the first available batch, or use product location
        const firstAvailableBatch = productBatches.find(batch => 
          batch.batchStatus === 'AVAILABLE' || batch.status === 'AVAILABLE'
        )
        const location = firstAvailableBatch?.location || product.location || 'N/A'
        
        // Get last updated from the most recent batch
        const lastUpdated = productBatches.length > 0 
          ? Math.max(...productBatches.map(batch => new Date(batch.createdAt || batch.manufacturingDate).getTime()))
          : new Date().getTime()

        return {
          id: product.id,
          productName: product.name,
          category: product.category?.name || 'Uncategorized',
          currentStock,
          minStock,
          maxStock,
          unit: product.unit || 'units',
          location,
          lastUpdated: new Date(lastUpdated).toISOString(),
          status,
          product: product,
          batches: productBatches
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
        overstocked: allStockLevels.filter(item => item.status === 'overstocked').length,
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

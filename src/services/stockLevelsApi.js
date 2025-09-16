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
      
      // Helper: robust key for grouping to avoid merging different products
      const getProductGroupKey = (batch) => {
        const product = batch.product || {}
        const productId = product.id || batch.productId
        if (productId !== undefined && productId !== null) return `id:${productId}`
        const sku = product.sku || batch.sku
        if (sku) return `sku:${sku}`
        const name = product.name || batch.productName
        if (name) return `name:${name}`
        // Fallback to batch id to prevent accidental merging
        return `batch:${batch.id || Math.random().toString(36).slice(2)}`
      }

      // Helper: parse array/object timestamps safely to milliseconds
      const toTimeMs = (value) => {
        try {
          if (!value) return null
          if (Array.isArray(value)) {
            const [year, monthOneBased, day, hour = 0, minute = 0, second = 0, nano = 0] = value
            const monthIndex = (monthOneBased || 1) - 1
            const ms = Math.floor((nano || 0) / 1_000_000)
            return Date.UTC(year, monthIndex, day, hour, minute, second, ms)
          }
          if (typeof value === 'object') {
            if (value.date && value.time) {
              return new Date(`${value.date}T${value.time}`).getTime()
            }
            if (value.year && value.monthValue && value.dayOfMonth) {
              const m = String(value.monthValue).padStart(2, '0')
              const d = String(value.dayOfMonth).padStart(2, '0')
              const hh = String(value.hour || 0).padStart(2, '0')
              const mm = String(value.minute || 0).padStart(2, '0')
              const ss = String(value.second || 0).padStart(2, '0')
              return new Date(`${value.year}-${m}-${d}T${hh}:${mm}:${ss}Z`).getTime()
            }
          }
          return new Date(value).getTime()
        } catch {
          return null
        }
      }

      // Group batches by product ID to calculate stock levels
      const stockLevelsByProduct = batches.reduce((acc, batch) => {
        const groupKey = getProductGroupKey(batch)
        
        if (!acc[groupKey]) {
          // Initialize stock level for this product
          acc[groupKey] = {
            id: (batch.product && batch.product.id != null) ? batch.product.id : groupKey,
            productName: batch.product?.name || batch.productName || 'Unknown Product',
            category: batch.product?.category?.name || batch.category?.name || 'Uncategorized',
            currentStock: 0,
            minStock: batch.product?.minimumStock || batch.minimumStock || 0,
            unit: batch.product?.unit || batch.unit || 'units',
            location: batch.location || batch.product?.location || 'N/A',
            lastUpdated: null,
            status: 'normal',
            product: batch.product,
            batches: []
          }
        }
        
        // Add this batch to the product's batch list
        acc[groupKey].batches.push(batch)
        
        // Add to current stock if batch is available
        if (batch.status) {
          acc[groupKey].currentStock += batch.quantity || 0
        }
        
        // Update last updated timestamp
        const batchDate = batch.createdAt || batch.manufacturingDate || batch.updatedAt
        const batchTime = toTimeMs(batchDate)
        if (batchTime) {
          if (!acc[groupKey].lastUpdated || batchTime > acc[groupKey].lastUpdated) {
            acc[groupKey].lastUpdated = batchTime
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

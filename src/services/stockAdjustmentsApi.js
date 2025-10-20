import { createApiMethods } from './api'
import apiService from './api'

// Stock Adjustments API using centralized authentication
const stockAdjustmentsApi = {
  ...createApiMethods('/api/v1/stockAdjustments'),
  // Custom endpoints specific to stock adjustments
  create: async (dto) => {
    console.log('📤 Sending stock adjustment data:', JSON.stringify(dto, null, 2))
    
    try {
      const result = await apiService.post('/api/v1/stockAdjustments/create', dto)
      console.log('✅ Stock adjustment created successfully:', result)
      return result
    } catch (error) {
      console.error('❌ Failed to create stock adjustment:', error)
      throw error
    }
  },
}

export default stockAdjustmentsApi

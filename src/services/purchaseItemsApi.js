import { createApiMethods } from './api'

// Purchase Items API using centralized authentication
const purchaseItemsApi = {
  ...createApiMethods('/api/v1/purchaseItems'),
}

export default purchaseItemsApi

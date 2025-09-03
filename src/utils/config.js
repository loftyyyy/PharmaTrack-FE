// Configuration for Vite environment
// Vite uses import.meta.env for environment variables

// API Base URL - use relative URLs in development (proxy) or full URL in production
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Other configuration constants
export const CONFIG = {
  API_BASE_URL,
  APP_NAME: 'PharmaTrack',
  VERSION: '1.0.0',
  // Environment info
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
}

// Configuration for Vite environment
// Vite uses import.meta.env for environment variables

// API Base URL - in dev use relative path so Vite proxy handles CORS; in prod use VITE_API_URL or fallback
export const API_BASE_URL = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_URL || 'http://localhost:8080')

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

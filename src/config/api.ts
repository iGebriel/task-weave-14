/**
 * API Configuration
 */

export const API_CONFIG = {
  // Base URL for the API
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',

  // Authentication settings
  USE_MOCK_AUTH: import.meta.env.VITE_USE_MOCK_AUTH === 'true',

  // Request timeout (in milliseconds)
  TIMEOUT: 30000,

  // Default headers
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },

  // Rate limiting settings
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  },

  // Retry settings
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
  },
} as const;

/**
 * Check if we're in development mode
 */
export const isDevelopment = import.meta.env.NODE_ENV === 'development';

/**
 * Check if we're in production mode
 */
export const isProduction = import.meta.env.NODE_ENV === 'production';

/**
 * Check if we should use mock authentication
 */
export const shouldUseMockAuth = API_CONFIG.USE_MOCK_AUTH || isDevelopment;

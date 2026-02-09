// Production-safe logging utility
// Automatically disables debug logs in production builds

const __DEV__ = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: any[]) => {
    console.log('[INFO]', ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    // In production, you might want to send errors to a service like Sentry
    console.error('[ERROR]', ...args);
  },
};

// Usage:
// import { logger } from '@/lib/logger';
// logger.debug('Debug info'); // Only shows in development
// logger.error('Error occurred'); // Shows in all environments

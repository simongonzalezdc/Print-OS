/**
 * Centralized Logger Utility
 * Handles application logging with environment-aware filtering
 */

const isDev = process.env.NODE_ENV === 'development';

export const log = {
  /**
   * Log info messages (development only)
   */
  info: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },

  /**
   * Log warning messages (development only)
   */
  warn: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },

  /**
   * Log error messages (always logged)
   */
  error: (message: string, error?: unknown, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, error, ...args);
    // Future: Integrate with Sentry or other error tracking service
  },

  /**
   * Debug messages (development only, verbose)
   */
  debug: (message: string, ...args: unknown[]) => {
    if (isDev) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};


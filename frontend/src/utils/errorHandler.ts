/**
 * Error handling utilities for user-friendly error messages
 */

export interface ErrorInfo {
  title: string;
  message: string;
  retryable: boolean;
  action?: string;
}

/**
 * Convert API errors to user-friendly messages
 */
export function getErrorMessage(error: any): ErrorInfo {
  // Network errors
  if (!error.response) {
    return {
      title: 'Connection Error',
      message: 'Unable to connect to the server. Please check your internet connection.',
      retryable: true,
      action: 'Retry',
    };
  }

  const status = error.response?.status;
  const detail = error.response?.data?.detail || error.message || 'An unexpected error occurred';

  switch (status) {
    case 400:
      return {
        title: 'Invalid Request',
        message: detail || 'Please check your input and try again.',
        retryable: false,
      };
    
    case 401:
      return {
        title: 'Authentication Required',
        message: 'Your session has expired. Please login again.',
        retryable: false,
        action: 'Login',
      };
    
    case 403:
      return {
        title: 'Permission Denied',
        message: detail || 'You don\'t have permission to perform this action.',
        retryable: false,
      };
    
    case 404:
      return {
        title: 'Not Found',
        message: detail || 'The requested resource was not found.',
        retryable: false,
      };
    
    case 422:
      return {
        title: 'Validation Error',
        message: detail || 'Please check your input and try again.',
        retryable: false,
      };
    
    case 429:
      return {
        title: 'Too Many Requests',
        message: 'You\'re making requests too quickly. Please wait a moment and try again.',
        retryable: true,
        action: 'Retry',
      };
    
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        title: 'Server Error',
        message: 'The server is experiencing issues. Please try again later.',
        retryable: true,
        action: 'Retry',
      };
    
    default:
      return {
        title: 'Error',
        message: detail || 'An unexpected error occurred. Please try again.',
        retryable: true,
        action: 'Retry',
      };
  }
}

/**
 * Format error message for display
 */
export function formatErrorMessage(error: any): string {
  const errorInfo = getErrorMessage(error);
  return errorInfo.message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  return getErrorMessage(error).retryable;
}

/**
 * Get user-friendly error title
 */
export function getErrorTitle(error: any): string {
  return getErrorMessage(error).title;
}

/**
 * Location-specific error messages
 */
export function getLocationErrorMessage(error: any): ErrorInfo {
  const baseError = getErrorMessage(error);
  
  // Location-specific error codes or messages
  if (error.message?.includes('location') || error.message?.includes('GPS')) {
    return {
      ...baseError,
      title: 'Location Error',
      message: 'Unable to get your location. Please ensure location services are enabled and try again.',
      retryable: true,
      action: 'Retry',
    };
  }
  
  if (error.message?.includes('permission')) {
    return {
      title: 'Permission Denied',
      message: 'Location permission is required. Please enable it in your device settings.',
      retryable: false,
      action: 'Settings',
    };
  }
  
  return baseError;
}


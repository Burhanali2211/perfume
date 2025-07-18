import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
  type: 'network' | 'database' | 'validation' | 'authentication' | 'authorization' | 'unknown';
  message: string;
  userMessage: string;
  code?: string;
  details?: Record<string, unknown>;
}

export const handleSupabaseError = (error: PostgrestError | Error): AppError => {
  // Handle Supabase PostgrestError
  if ('code' in error && 'details' in error) {
    const pgError = error as PostgrestError;
    
    switch (pgError.code) {
      case 'PGRST116':
        return {
          type: 'database',
          message: pgError.message,
          userMessage: 'The requested resource was not found.',
          code: pgError.code,
          details: pgError.details
        };
      
      case 'PGRST301':
        return {
          type: 'database',
          message: pgError.message,
          userMessage: 'Database connection failed. Please try again later.',
          code: pgError.code,
          details: pgError.details
        };
      
      case '23505': // Unique constraint violation
        return {
          type: 'validation',
          message: pgError.message,
          userMessage: 'This item already exists. Please use a different value.',
          code: pgError.code,
          details: pgError.details
        };
      
      case '23503': // Foreign key constraint violation
        return {
          type: 'validation',
          message: pgError.message,
          userMessage: 'Cannot complete this action due to related data.',
          code: pgError.code,
          details: pgError.details
        };
      
      case '42501': // Insufficient privilege
        return {
          type: 'authorization',
          message: pgError.message,
          userMessage: 'You do not have permission to perform this action.',
          code: pgError.code,
          details: pgError.details
        };
      
      default:
        return {
          type: 'database',
          message: pgError.message,
          userMessage: 'A database error occurred. Please try again.',
          code: pgError.code,
          details: pgError.details
        };
    }
  }
  
  // Handle network errors
  if (error.message.includes('fetch')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Network connection failed. Please check your internet connection and try again.'
    };
  }
  
  // Handle authentication errors
  if (error.message.includes('JWT') || error.message.includes('auth')) {
    return {
      type: 'authentication',
      message: error.message,
      userMessage: 'Your session has expired. Please sign in again.'
    };
  }
  
  // Handle infinite recursion errors (common RLS issue)
  if (error.message.includes('infinite recursion')) {
    return {
      type: 'database',
      message: error.message,
      userMessage: 'Database configuration error. Please contact support.'
    };
  }
  
  // Default error handling
  return {
    type: 'unknown',
    message: error.message,
    userMessage: 'An unexpected error occurred. Please try again.'
  };
};

export const logError = (error: AppError, context?: string) => {
  console.error(`[${error.type.toUpperCase()}] ${context || 'Error'}:`, {
    message: error.message,
    userMessage: error.userMessage,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString()
  });
  
  // In production, you would send this to an error tracking service
  // like Sentry, LogRocket, or Bugsnag
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error);
  }
};

export const createRetryableAction = <T>(
  action: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
) => {
  return async (): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
    
    throw lastError!;
  };
};

export const validateFormData = (data: Record<string, unknown>, rules: Record<string, unknown>): string[] => {
  const errors: string[] = [];
  
  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field];
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors.push(`${field} must be at least ${rule.minLength} characters`);
    }
    
    if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors.push(`${field} must be no more than ${rule.maxLength} characters`);
    }
    
    if (value && rule.pattern && !rule.pattern.test(value.toString())) {
      errors.push(`${field} format is invalid`);
    }
    
    if (value && rule.min && Number(value) < rule.min) {
      errors.push(`${field} must be at least ${rule.min}`);
    }
    
    if (value && rule.max && Number(value) > rule.max) {
      errors.push(`${field} must be no more than ${rule.max}`);
    }
  }
  
  return errors;
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

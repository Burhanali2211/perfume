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
      
      case 'PGRST204': // RLS policy violation
        return {
          type: 'authorization',
          message: pgError.message,
          userMessage: 'Access denied. You do not have permission to access this resource.',
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
  if (error.message.includes('fetch') || error.message.includes('Network')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Network connection failed. Please check your internet connection and try again.'
    };
  }
  
  // Handle authentication errors
  if (error.message.includes('JWT') || error.message.includes('auth') || error.message.includes('token')) {
    return {
      type: 'authentication',
      message: error.message,
      userMessage: 'Your session has expired. Please sign in again.'
    };
  }
  
  // Enhanced infinite recursion error detection
  if (error.message.includes('infinite recursion') || 
      error.message.includes('maximum recursion depth') ||
      error.message.includes('stack depth limit') ||
      error.message.includes('too much recursion')) {
    return {
      type: 'database',
      message: error.message,
      userMessage: 'Database configuration error detected. Row Level Security policies may have infinite recursion. Please run the RLS fixes script.'
    };
  }
  
  // Handle timeout errors
  if (error.message.includes('timeout') || error.message.includes('timed out')) {
    return {
      type: 'network',
      message: error.message,
      userMessage: 'Request timed out. Please try again.'
    };
  }
  
  // Handle RLS policy errors
  if (error.message.includes('row-level security') || 
      error.message.includes('policy') ||
      error.message.includes('RLS')) {
    return {
      type: 'authorization',
      message: error.message,
      userMessage: 'Access restricted by security policies. Please check your permissions.'
    };
  }
  
  // Default error handling
  return {
    type: 'unknown',
    message: error.message,
    userMessage: 'An unexpected error occurred. Please try again.'
  };
};

// Enhanced RLS error detection and reporting
export const detectRLSRecursionError = (error: Error): boolean => {
  const errorPatterns = [
    'infinite recursion',
    'maximum recursion depth',
    'stack depth limit',
    'too much recursion',
    'recursive policy',
    'circular dependency in policies'
  ];
  
  return errorPatterns.some(pattern => 
    error.message.toLowerCase().includes(pattern.toLowerCase())
  );
};

// Function to suggest RLS fixes
export const generateRLSFixSuggestion = (error: Error): string => {
  if (detectRLSRecursionError(error)) {
    return `
🔧 RLS Infinite Recursion Detected!

This error is caused by Row Level Security policies that reference the same table they protect.

To fix this:
1. Run the 'rls_policies_fix.sql' script in your Supabase SQL Editor
2. This will replace problematic policies with safe, non-recursive alternatives
3. The fix includes role caching to prevent recursion

The error occurred in: ${error.message.substring(0, 100)}...
    `;
  }
  
  if (error.message.includes('row-level security') || error.message.includes('policy')) {
    return `
🛡️ RLS Policy Issue Detected!

This appears to be a Row Level Security policy restriction.

To troubleshoot:
1. Check if you have the correct role/permissions
2. Verify RLS policies are properly configured
3. Run 'rls_policies_fix.sql' to ensure policies are correct

Error details: ${error.message}
    `;
  }
  
  return '';
};

// Enhanced logging with RLS detection
export const logError = (error: AppError, context?: string) => {
  const isRLSError = error.message.includes('infinite recursion') || 
                     error.message.includes('row-level security');
  
  const logLevel = isRLSError ? 'error' : 'warn';
  const emoji = isRLSError ? '🚨' : '⚠️';
  
  console[logLevel](`${emoji} [${error.type.toUpperCase()}] ${context || 'Error'}:`, {
    message: error.message,
    userMessage: error.userMessage,
    code: error.code,
    details: error.details,
    timestamp: new Date().toISOString(),
    isRLSError
  });
  
  // Show RLS-specific guidance
  if (isRLSError) {
    console.error('🔧 RLS Fix Required:', generateRLSFixSuggestion(new Error(error.message)));
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { extra: { context, isRLSError } });
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

// Enhanced form validation with RLS awareness
export const validateFormData = (data: Record<string, unknown>, rules: Record<string, any>): string[] => {
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
    
    // RLS-aware role validation
    if (field === 'role' && value) {
      const validRoles = ['admin', 'seller', 'customer'];
      if (!validRoles.includes(value.toString())) {
        errors.push(`${field} must be one of: ${validRoles.join(', ')}`);
      }
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

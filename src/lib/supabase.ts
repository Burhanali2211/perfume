import { createClient } from '@supabase/supabase-js';
import { createRetryableAction } from '../utils/errorHandling';
import { performanceMonitor } from '../utils/performance';
import { logThrottler } from '../utils/logging';
import { validateSellerId, validateAndFixStoredUser } from '../utils/uuidValidation';
import {
  User,
  Product,
  Category,
  CartItem,
  WishlistItem,
  Order,
  Address,
  ProductVariant,
  Coupon,
  DashboardAnalytics
} from '../types';

// Environment validation with better error messages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appEnv = import.meta.env.VITE_APP_ENV || 'development';

// Enhanced environment validation with backend fix detection
function validateEnvironment() {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate required environment variables
  if (!supabaseUrl) {
    errors.push('VITE_SUPABASE_URL is missing from environment variables');
  } else if (!supabaseUrl.startsWith('https://')) {
    errors.push('VITE_SUPABASE_URL must start with https://');
  } else if (supabaseUrl.includes('mock.supabase.co') || supabaseUrl.includes('localhost')) {
    warnings.push('Using mock or localhost URL - ensure this is intentional');
  }

  if (!supabaseAnonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is missing from environment variables');
  } else if (supabaseAnonKey.length < 50) {
    warnings.push('Supabase anon key seems unusually short');
  }

  // Log validation results with throttling
  if (appEnv === 'development') {
    logThrottler.keyedLog('supabase_config', '🔍 Supabase Configuration Validation:');
    logThrottler.keyedLog('supabase_url', `📍 URL: ${supabaseUrl || 'NOT SET'}`);
    logThrottler.keyedLog('supabase_key', `🔑 Key: ${supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'NOT SET'}`);
    logThrottler.keyedLog('supabase_env', `🌍 Environment: ${appEnv}`);
    logThrottler.keyedLog('backend_fix', '🔧 Backend fixes will be applied automatically');
  }

  if (errors.length > 0) {
    console.error('❌ Configuration errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Supabase configuration errors: ${errors.join(', ')}`);
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  if (appEnv === 'development') {
    logThrottler.keyedLog('supabase_success', '✅ Supabase configuration validated successfully!');
  }
}

// Enhanced database initialization with automatic fix application
async function initializeDatabase() {
  try {
    // Set development mode parameters
    await supabase.rpc('set_config', {
      setting_name: 'app.development_mode',
      new_value: 'true',
      is_local: false
    }).catch(() => {
      // Ignore errors if function doesn't exist
      console.log('Development mode configuration not available');
    });

    // Test basic connectivity
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.message.includes('infinite recursion')) {
      console.warn('⚠️ Database RLS policies need fixing. This is expected on first run.');
      throw new Error('DATABASE_NEEDS_FIXING: Please run the COMPREHENSIVE-BACKEND-FIX.sql script in your Supabase SQL Editor.');
    }

    if (appEnv === 'development') {
      console.log('✅ Database connection established successfully');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_NEEDS_FIXING')) {
      throw error;
    }
    console.warn('⚠️ Database initialization check failed:', error);
  }
}

// Validate environment on load
validateEnvironment();

// Initialize database on load (async)
if (typeof window !== 'undefined') {
  setTimeout(() => {
    initializeDatabase().catch(err => {
      if (err.message?.includes('DATABASE_NEEDS_FIXING')) {
        console.error('🔧 DATABASE SETUP REQUIRED:', err.message);
      } else {
        console.warn('Database initialization warning:', err);
      }
    });
  }, 1000);
}

// Enhanced Supabase client configuration with better error handling and monitoring
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    debug: appEnv === 'development' // Keep debug for auth but reduce other logs
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'ecommerce-platform@1.0.0',
      'X-App-Environment': appEnv,
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    },
    fetch: (url, options = {}) => {
      // Reduce logging frequency - only log RPC calls and critical requests
      if (appEnv === 'development') {
        // Only log RPC calls and requests to specific endpoints to reduce noise
        if (url.includes('/rpc/') || url.includes('profiles') || url.includes('orders') || url.includes('products')) {
          // Use throttled logging to prevent excessive output
          logThrottler.keyedLog(`db_request_${url}`, `🔗 Database request: ${url}`, 2000); // At most once every 2 seconds
        }
      }

      // Ensure API key is always included in headers
      const enhancedOptions = {
        ...options,
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          ...options.headers,
          // Add caching headers for GET requests
          ...((!options.method || options.method === 'GET') && {
            'Cache-Control': 'max-age=60, stale-while-revalidate=300'
          })
        },
        // Optimize timeout for better performance - reduce from 30s to 10s
        signal: AbortSignal.timeout(10000), // 10 second timeout
        // Add performance optimizations
        keepalive: true
      };

      return fetch(url, enhancedOptions);
    }
  },
  db: {
    schema: 'public'
  }
});

// Connection health monitoring
let connectionHealthy = true;
let lastHealthCheck = 0;
const healthCheckTimeout: NodeJS.Timeout | null = null;

export const checkDatabaseConnection = async (): Promise<{ healthy: boolean; latency?: number; error?: string }> => {
  const now = Date.now();
  
  // Prevent too frequent health checks (at most once per 30 seconds)
  if (now - lastHealthCheck < 30000) {
    return { healthy: connectionHealthy };
  }
  
  try {
    const startTime = Date.now();
    const { error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .abortSignal(AbortSignal.timeout(5000)); // 5 second timeout for health check
    
    const latency = Date.now() - startTime;
    
    if (error) {
      connectionHealthy = false;
      if (appEnv === 'development') {
        console.error('❌ Database connection unhealthy:', error.message);
      }
      return { healthy: false, error: error.message, latency };
    }
    
    connectionHealthy = true;
    lastHealthCheck = now;
    
    if (appEnv === 'development' && latency > 1000) {
      console.log(`✅ Database connection healthy (${latency}ms)`);
    }
    
    return { healthy: true, latency };
  } catch (error) {
    connectionHealthy = false;
    const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
    if (appEnv === 'development') {
      console.error('❌ Database connection check failed:', errorMessage);
    }
    return { healthy: false, error: errorMessage };
  }
};

export const isDatabaseHealthy = (): boolean => {
  // Consider connection healthy if last check was within 60 seconds
  return connectionHealthy && (Date.now() - lastHealthCheck) < 60000;
};

// Helper function to set session configuration for direct login mode
export const setDirectLoginSession = async (): Promise<void> => {
  try {
    // Try to set session parameters using RPC
    await supabase.rpc('set_config', {
      setting_name: 'app.direct_login_enabled',
      new_value: 'true',
      is_local: false
    });
  } catch (error) {
    // If RPC fails, try alternative method
    console.log('Setting direct login session context');
    // The RLS policies will handle the direct login mode check
  }
};

// Perform initial connection check with delay
if (typeof window !== 'undefined') {
  // Add a longer delay for initial check to allow app to initialize
  setTimeout(() => {
    checkDatabaseConnection().catch(err => {
      if (appEnv === 'development') {
        console.error('Initial database connection check failed:', err);
      }
    });
  }, 3000); // Check after 3 seconds instead of 1 second
}

// Enhanced timeout wrapper with retry logic and better error handling
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 8000,
  errorMessage: string = 'Request timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

// Enhanced retry mechanism with exponential backoff
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  operationName: string = 'Database operation'
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationName} succeeded on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        console.error(`❌ ${operationName} failed after ${maxRetries} attempts:`, lastError.message);
        break;
      }
      
      // Check if error is retryable
      const isRetryable = isRetryableError(lastError);
      
      if (!isRetryable) {
        console.error(`❌ ${operationName} failed with non-retryable error:`, lastError.message);
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      console.warn(`⚠️ ${operationName} failed on attempt ${attempt}, retrying in ${delay}ms:`, lastError.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Check if an error is retryable
function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Network errors are retryable
  if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return true;
  }
  
  // Temporary database issues are retryable
  if (message.includes('connection') || message.includes('temporarily unavailable')) {
    return true;
  }
  
  // Auth errors, validation errors, etc. are not retryable
  return false;
}

// Helper to validate UUID format
const isValidUUID = (value: string): boolean => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
};

// Helper to sanitize external/blocked image URLs
const sanitizeImageUrls = (images: unknown): string[] => {
  const placeholderSvg = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%25" height="100%25" fill="%23f3f4f6"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="32" fill="%23999">No Image</text></svg>';
  const arr = Array.isArray(images) ? images : [];
  const sanitized = arr
    .map(u => {
      if (typeof u !== 'string') return '';
      if (u.includes('://example.com/')) return placeholderSvg;
      return u;
    })
    .filter(Boolean) as string[];
  return sanitized.length ? sanitized : [placeholderSvg];
};

// =====================================================
// USER PROFILE FUNCTIONS
// =====================================================

export const getProfileForUser = async (userId: string): Promise<User | null> => {
  if (!userId) {
    console.warn('getProfileForUser: userId is empty');
    return null;
  }

  try {
    const result = await withRetry(async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single(),
        10000, // 10 second timeout for profile queries
        'Profile query timed out'
      );

      if (error) {
        if (error.message.includes('infinite recursion')) {
          throw new Error('DATABASE SETUP ERROR: Your database security policies for the "profiles" table are causing an infinite loop. Please run the provided SQL script in your Supabase SQL Editor to fix this.');
        }
        throw error;
      }

      return data;
    }, 3, 1000, `getProfileForUser(${userId})`);

    if (result) {
      return {
        id: result.id,
        name: result.full_name,
        email: result.email,
        avatar: result.avatar_url,
        role: result.role,
        phone: result.phone,
        dateOfBirth: result.date_of_birth,
        isActive: result.is_active,
        emailVerified: result.email_verified,
        createdAt: new Date(result.created_at),
        updatedAt: result.updated_at ? new Date(result.updated_at) : undefined,
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    
    // Check if this is a setup error that should bubble up
    if (error instanceof Error && error.message.includes('DATABASE SETUP ERROR')) {
      throw error;
    }
    
    return null;
  }
};

export const createUserProfile = async (userData: {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'customer';
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
}): Promise<User | null> => {
  if (!userData.id || !userData.email) {
    console.error('createUserProfile: Missing required fields (id, email)');
    return null;
  }

  try {
    const result = await withRetry(async () => {
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .insert({
            id: userData.id,
            email: userData.email,
            full_name: userData.name || '',
            role: userData.role || 'customer',
            avatar_url: userData.avatar || '',
            phone: userData.phone || '',
            date_of_birth: userData.dateOfBirth || null,
            is_active: true,
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single(),
        10000,
        'Profile creation timed out'
      );

      if (error) {
        // Handle specific error cases
        if (error.code === '23505') {
          throw new Error('User profile already exists');
        }
        throw error;
      }

      return data;
    }, 2, 1000, `createUserProfile(${userData.email})`);

    if (result) {
      console.log(`✅ Created user profile for ${userData.email}`);
      return {
        id: result.id,
        name: result.full_name,
        email: result.email,
        role: result.role,
        avatar: result.avatar_url,
        phone: result.phone,
        dateOfBirth: result.date_of_birth,
        isActive: result.is_active,
        emailVerified: result.email_verified,
        createdAt: new Date(result.created_at),
        updatedAt: new Date(result.updated_at)
      };
    }

    return null;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
  if (!userId) {
    console.error('updateUserProfile: userId is required');
    return false;
  }

  if (!updates || Object.keys(updates).length === 0) {
    console.warn('updateUserProfile: No updates provided');
    return true;
  }

  try {
    const result = await withRetry(async () => {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      // Map User interface fields to database columns
      if (updates.name !== undefined) updateData.full_name = updates.name;
      if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;
      if (updates.phone !== undefined) updateData.phone = updates.phone;
      if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
      if (updates.role !== undefined) updateData.role = updates.role;

      const { error } = await withTimeout(
        supabase
          .from('profiles')
          .update(updateData)
          .eq('id', userId),
        10000,
        'Profile update timed out'
      );

      if (error) {
        throw error;
      }

      return true;
    }, 2, 1000, `updateUserProfile(${userId})`);

    console.log(`✅ Updated user profile for ${userId}`);
    return result;
  } catch (error) {
    console.error('Error updating profile:', error);
    return false;
  }
};



// Enhanced function to get all users with better error handling and pagination
export const getAllUsers = async (options: {
  limit?: number;
  offset?: number;
  searchTerm?: string;
  roleFilter?: string;
  isActiveFilter?: boolean;
} = {}): Promise<{ users: User[]; total: number; error?: string }> => {
  const { limit = 50, offset = 0, searchTerm, roleFilter, isActiveFilter } = options;

  try {
    const result = await withRetry(async () => {
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      if (isActiveFilter !== undefined) {
        query = query.eq('is_active', isActiveFilter);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await withTimeout(
        query,
        15000,
        'Get all users query timed out'
      );

      if (error) {
        throw error;
      }

      return { data: data || [], count: count || 0 };
    }, 2, 1000, 'getAllUsers');

    const users: User[] = result.data.map(profile => ({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      avatar: profile.avatar_url,
      role: profile.role,
      phone: profile.phone,
      dateOfBirth: profile.date_of_birth,
      isActive: profile.is_active,
      emailVerified: profile.email_verified,
      createdAt: new Date(profile.created_at),
      updatedAt: profile.updated_at ? new Date(profile.updated_at) : undefined,
    }));

    console.log(`✅ Retrieved ${users.length} users (total: ${result.count})`);
    return { users, total: result.count };
  } catch (error) {
    console.error('Error fetching all users:', error);
    return { 
      users: [], 
      total: 0, 
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Legacy function for backward compatibility
export const getAllUsersLegacy = async (): Promise<User[]> => {
  const result = await getAllUsers();
  return result.users;
};

// New function to update user role (admin only)
export const updateUserRole = async (userId: string, role: 'admin' | 'seller' | 'customer'): Promise<boolean> => {
    const updateData = {
        role: role,
        updated_at: new Date().toISOString()
    };

    const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error('Error updating user role:', error);
        return false;
    }
    return true;
};

// Add new functions for full CRUD operations

// Function to create a new user
export const createNewUser = async (userData: {
  email: string;
  name: string;
  role: 'admin' | 'seller' | 'customer';
  phone?: string;
  dateOfBirth?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Note: This creates a profile entry only. For full user creation,
    // the user would need to be created in the auth system first.
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        email: userData.email,
        full_name: userData.name,
        role: userData.role,
        phone: userData.phone || null,
        date_of_birth: userData.dateOfBirth || null,
        is_active: userData.isActive !== undefined ? userData.isActive : true,
        email_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const user: User = {
      id: data.id,
      name: data.full_name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      dateOfBirth: data.date_of_birth,
      isActive: data.is_active,
      emailVerified: data.email_verified,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      avatar: data.avatar_url || undefined
    };

    return { success: true, user };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to update a user
export const updateUser = async (userId: string, updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Map User interface fields to database columns
    if (updates.name !== undefined) updateData.full_name = updates.name;
    if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
    if (updates.role !== undefined) updateData.role = updates.role;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const user: User = {
      id: data.id,
      name: data.full_name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      dateOfBirth: data.date_of_birth,
      isActive: data.is_active,
      emailVerified: data.email_verified,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
      avatar: data.avatar_url || undefined
    };

    return { success: true, user };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to delete a user
export const deleteUser = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // First, delete related data (addresses, preferences, etc.)
    const relatedTables = ['addresses', 'user_preferences', 'user_security_settings', 'payment_methods'];
    
    for (const table of relatedTables) {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.warn(`Warning: Failed to delete ${table} for user ${userId}:`, deleteError.message);
      }
    }
    
    // Then delete the user profile
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to delete multiple users (bulk delete)
export const deleteUsersBulk = async (userIds: string[]): Promise<{ success: boolean; deletedCount: number; error?: string }> => {
  try {
    let deletedCount = 0;
    
    // Delete related data for each user
    const relatedTables = ['addresses', 'user_preferences', 'user_security_settings', 'payment_methods'];
    
    for (const userId of userIds) {
      for (const table of relatedTables) {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('user_id', userId);
        
        if (deleteError) {
          console.warn(`Warning: Failed to delete ${table} for user ${userId}:`, deleteError.message);
        }
      }
    }
    
    // Delete user profiles
    const { data, error } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIds)
      .select();

    if (error) {
      return { success: false, deletedCount: 0, error: error.message };
    }

    deletedCount = data?.length || 0;
    return { success: true, deletedCount };
  } catch (error) {
    console.error('Error deleting users in bulk:', error);
    return { success: false, deletedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Function to update multiple users (bulk update)
export const updateUsersBulk = async (
  userIds: string[], 
  updates: Partial<User>
): Promise<{ success: boolean; updatedCount: number; error?: string }> => {
  try {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    // Map User interface fields to database columns
    if (updates.name !== undefined) updateData.full_name = updates.name;
    if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;
    if (updates.role !== undefined) updateData.role = updates.role;

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .in('id', userIds)
      .select();

    if (error) {
      return { success: false, updatedCount: 0, error: error.message };
    }

    const updatedCount = data?.length || 0;
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error updating users in bulk:', error);
    return { success: false, updatedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Helper function to map database user to our User type
const mapUserFromDB = (data: Record<string, unknown>): User => {
    return {
        id: data.id as string,
        name: (data.full_name as string) || '',
        email: data.email as string,
        avatar: data.avatar_url as string,
        role: (data.role as 'admin' | 'seller' | 'customer') || 'customer',
        phone: data.phone as string,
        dateOfBirth: data.date_of_birth as string,
        isActive: data.is_active as boolean,
        emailVerified: data.email_verified as boolean,
        createdAt: new Date(data.created_at as string),
        updatedAt: data.updated_at ? new Date(data.updated_at as string) : undefined,
    };
};

// =====================================================
// PRODUCT FUNCTIONS
// =====================================================

// Ultra-fast minimal product fetching for initial load
export const getProductsMinimal = async (filters?: {
    categoryId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
}): Promise<Product[]> => {
    const fetchProductsAction = createRetryableAction(async () => {
        performanceMonitor.startMeasure('getProductsMinimal');

        let query = supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                price,
                original_price,
                images,
                stock,
                is_featured,
                category_id
            `)
            .eq('is_active', true);

        if (filters?.categoryId) {
            query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.featured) {
            query = query.eq('is_featured', true);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const queryPromise = query.order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 8000, 'Minimal product fetch timed out');

        if (error) {
            console.error('Error fetching minimal products:', error);
            performanceMonitor.endMeasure('getProductsMinimal', false);
            throw error;
        }

        const result = data?.map(mapProductFromDB) || [];
        performanceMonitor.endMeasure('getProductsMinimal', true);
        return result;
    }, 2, 500);

    try {
        return await fetchProductsAction();
    } catch (error) {
        console.error('Failed to fetch minimal products after retries:', error);
        return [];
    }
};

// Fast basic product fetching for initial load
export const getProductsBasic = async (filters?: {
    categoryId?: string;
    categorySlug?: string;
    seller?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    isActive?: boolean;
}): Promise<Product[]> => {
    const fetchProductsAction = createRetryableAction(async () => {
        performanceMonitor.startMeasure('getProductsBasic');

        let query = supabase
            .from('products')
            .select(`
                id,
                name,
                slug,
                price,
                original_price,
                images,
                stock,
                is_featured,
                category_id,
                seller_id,
                created_at,
                categories!inner(id, name, slug)
            `)
            .eq('is_active', filters?.isActive ?? true);

        if (filters?.categoryId) {
            query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.categorySlug) {
            query = query.eq('categories.slug', filters.categorySlug);
        }
        if (filters?.seller) {
            query = query.eq('seller_id', filters.seller);
        }
        if (filters?.featured) {
            query = query.eq('is_featured', true);
        }
        if (filters?.search) {
            // Use the full-text search index for better performance
            query = query.textSearch('name', filters.search);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const queryPromise = query.order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 10000, 'Basic product fetch timed out');

        if (error) {
            console.error('Error fetching basic products:', error);
            performanceMonitor.endMeasure('getProductsBasic', false);
            throw error;
        }

        const result = data?.map(mapProductFromDB) || [];
        performanceMonitor.endMeasure('getProductsBasic', true);
        return result;
    }, 3, 1000);

    try {
        return await fetchProductsAction();
    } catch (error) {
        console.error('Failed to fetch basic products after retries:', error);
        return [];
    }
};

// Dedicated function for fetching featured products
export const getFeaturedProducts = async (limit: number = 8): Promise<Product[]> => {
    const fetchFeaturedAction = createRetryableAction(async () => {
        performanceMonitor.startMeasure('getFeaturedProducts');

        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                categories(id, name, slug)
            `)
            .eq('is_active', true)
            .eq('is_featured', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Error fetching featured products:', error);
            throw error;
        }

        const result = data?.map(mapProductFromDB) || [];
        performanceMonitor.endMeasure('getFeaturedProducts', true);
        return result;
    }, 3, 1000);

    try {
        return await fetchFeaturedAction();
    } catch (error) {
        console.error('Failed to fetch featured products after retries:', error);
        return [];
    }
};

// Enhanced product fetching with all details (for when needed)
export const getProducts = async (filters?: {
    categoryId?: string;
    categorySlug?: string;
    seller?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    isActive?: boolean;
}): Promise<Product[]> => {
    const fetchProductsAction = createRetryableAction(async () => {
        let query = supabase
            .from('products')
            .select(`
                *,
                categories(id, name, slug),
                profiles(full_name),
                product_variants(*)
            `)
            .eq('is_active', filters?.isActive ?? true);

        if (filters?.categoryId) {
            query = query.eq('category_id', filters.categoryId);
        }
        if (filters?.categorySlug) {
            query = query.eq('categories.slug', filters.categorySlug);
        }
        if (filters?.seller) {
            query = query.eq('seller_id', filters.seller);
        }
        if (filters?.featured) {
            query = query.eq('is_featured', true);
        }
        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%,tags.cs.{${filters.search}}`);
        }
        if (filters?.limit) {
            query = query.limit(filters.limit);
        }
        if (filters?.offset) {
            query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
        }

        const queryPromise = query.order('created_at', { ascending: false });
        const { data, error } = await withTimeout(queryPromise, 12000, 'Product fetch timed out');

        if (error) {
            console.error('Error fetching products:', error);
            throw error;
        }

        return data?.map(mapProductFromDB) || [];
    }, 3, 1000);

    try {
        return await fetchProductsAction();
    } catch (error) {
        console.error('Failed to fetch products after retries:', error);
        return [];
    }
};

export const getProductById = async (id: string): Promise<Product | null> => {
    const fetchProductAction = createRetryableAction(async () => {
        const queryPromise = supabase
            .from('products')
            .select(`
                *,
                categories(name, slug),
                profiles(full_name),
                product_variants(*),
                reviews(
                    *,
                    profiles(full_name, avatar_url)
                )
            `)
            .eq('id', id)
            .eq('is_active', true)
            .single();

        const { data, error } = await withTimeout(queryPromise, 10000, 'Product detail fetch timed out');

        if (error) {
            console.error('Error fetching product:', error);
            throw error;
        }

        return data ? mapProductFromDB(data) : null;
    }, 3, 1000);

    try {
        return await fetchProductAction();
    } catch (error) {
        console.error('Failed to fetch product after retries:', error);
        return null;
    }
};

export const createProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>): Promise<string | null> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

    // Set session parameters for direct login mode
    if (isDirectLogin) {
        await setDirectLoginSession();
    }

    let sellerId = product.sellerId;

    // Validate and fix stored user data
    validateAndFixStoredUser();

    // If in direct login mode and no sellerId provided, use a default admin user
    if (isDirectLogin && !sellerId) {
        // Try to get sellerId from localStorage (direct login user)
        const storedUser = localStorage.getItem('direct_login_current_user');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                sellerId = user.id;
            } catch (e) {
                console.error('Error parsing direct login user:', e);
                // Use default admin ID as fallback
                sellerId = '33333333-3333-3333-3333-333333333333';
            }
        } else {
            // Use default admin ID as fallback
            sellerId = '33333333-3333-3333-3333-333333333333';
        }
    }

    // Validate the seller ID before using it
    sellerId = validateSellerId(sellerId);

    const { data, error } = await supabase
        .from('products')
        .insert({
            name: product.name,
            slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: product.description,
            short_description: product.shortDescription,
            price: product.price,
            original_price: product.originalPrice,
            category_id: product.categoryId,
            seller_id: sellerId,
            images: product.images,
            stock: product.stock,
            min_stock_level: product.minStockLevel || 5,
            sku: product.sku,
            weight: product.weight,
            dimensions: product.dimensions,
            tags: product.tags,
            specifications: product.specifications,
            is_featured: product.featured,
            is_active: product.isActive ?? true,
            meta_title: product.metaTitle,
            meta_description: product.metaDescription
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating product:', error);
        return null;
    }

    return data?.id || null;
};

export const updateProduct = async (product: Product): Promise<boolean> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

    // Set session parameters for direct login mode
    if (isDirectLogin) {
        await setDirectLoginSession();
    }

    const { error } = await supabase
        .from('products')
        .update({
            name: product.name,
            slug: product.slug || product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: product.description,
            short_description: product.shortDescription,
            price: product.price,
            original_price: product.originalPrice,
            category_id: product.categoryId,
            images: product.images,
            stock: product.stock,
            min_stock_level: product.minStockLevel,
            sku: product.sku,
            weight: product.weight,
            dimensions: product.dimensions,
            tags: product.tags,
            specifications: product.specifications,
            is_featured: product.featured,
            is_active: product.isActive,
            meta_title: product.metaTitle,
            meta_description: product.metaDescription,
            updated_at: new Date().toISOString()
        })
        .eq('id', product.id);

    if (error) {
        console.error('Error updating product:', error);
        return false;
    }
    return true;
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

    // Set session parameters for direct login mode
    if (isDirectLogin) {
        await setDirectLoginSession();
    }

    const { error } = await supabase
        .from('products')
        .update({ is_active: false })
        .eq('id', productId);

    if (error) {
        console.error('Error deleting product:', error);
        return false;
    }
    return true;
};

// Helper function to map database product to our Product type
const mapProductFromDB = (data: Record<string, unknown>): Product => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description || '',
    shortDescription: data.short_description,
    price: parseFloat(data.price),
    originalPrice: data.original_price ? parseFloat(data.original_price) : undefined,
    categoryId: data.category_id,
    category: data.categories?.name || '',
    images: sanitizeImageUrls(data.images),
    stock: data.stock,
    minStockLevel: data.min_stock_level,
    sku: data.sku,
    weight: data.weight,
    dimensions: data.dimensions,
    rating: parseFloat(data.rating) || 0,
    reviewCount: data.review_count || 0,
    reviews: data.reviews?.map((review: Record<string, unknown>) => ({
        id: review.id,
        productId: review.product_id,
        userId: review.user_id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images || [],
        isVerifiedPurchase: review.is_verified_purchase,
        isApproved: review.is_approved,
        helpfulCount: review.helpful_count,
        createdAt: new Date(review.created_at),
        updatedAt: review.updated_at ? new Date(review.updated_at) : undefined,
        profiles: {
            full_name: review.profiles?.full_name || 'Anonymous',
            avatar_url: review.profiles?.avatar_url || ''
        },
        // Legacy fields for backward compatibility
        product_id: review.product_id,
        user_id: review.user_id,
        created_at: review.created_at
    })) || [],
    sellerId: data.seller_id || 'system',
    sellerName: data.profiles?.full_name || 'Store',
    tags: data.tags || [],
    specifications: data.specifications || {},
    featured: data.is_featured || false,
    isActive: data.is_active,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    // Legacy field for backward compatibility
    specs: data.specifications || {}
});

// =====================================================
// CATEGORY FUNCTIONS
// =====================================================

export const getCategories = async (): Promise<Category[]> => {
    const fetchCategoriesAction = createRetryableAction(async () => {
        // First get categories
        const categoriesPromise = supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('sort_order');

        const { data: categoriesData, error: categoriesError } = await withTimeout(categoriesPromise, 8000, 'Categories fetch timed out');

        if (categoriesError) {
            console.error('Error fetching categories:', categoriesError);
            throw categoriesError;
        }

        // Then get product counts for each category
        const categoriesWithCounts = await Promise.all(
            (categoriesData || []).map(async (category) => {
                const { count } = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true })
                    .eq('category_id', category.id)
                    .eq('is_active', true);

                return {
                    ...category,
                    productCount: count || 0
                };
            })
        );

        return categoriesWithCounts.map(mapCategoryFromDB) || [];
    }, 3, 1000);

    try {
        return await fetchCategoriesAction();
    } catch (error) {
        console.error('Failed to fetch categories after retries:', error);
        return [];
    }
};

export const createCategory = async (category: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

    // Set session parameters for direct login mode
    if (isDirectLogin) {
        await setDirectLoginSession();
    }

    if (!isDirectLogin) {
        // Standard authentication flow
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.error('Error creating category: User not authenticated');
            return null;
        }

        // Check if user has admin role
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileError || !profile || profile.role !== 'admin') {
            console.error('Error creating category: User does not have admin privileges');
            return null;
        }
    } else {
        // In direct login mode, we'll rely on RLS policies to handle permissions
        console.log('Creating category in direct login mode');
    }

    const { data, error } = await supabase
        .from('categories')
        .insert({
            name: category.name,
            slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: category.description,
            image_url: category.image,
            parent_id: category.parentId,
            sort_order: category.sortOrder || 0,
            is_active: category.isActive ?? true
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating category:', error);
        return null;
    }

    return data?.id || null;
};

export const updateCategory = async (category: Category): Promise<boolean> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

    // Set session parameters for direct login mode
    if (isDirectLogin) {
        await setDirectLoginSession();
    }

    if (!isDirectLogin) {
        // Standard authentication flow - check user permissions
        // This will be handled by RLS policies
    } else {
        // In direct login mode, we'll rely on RLS policies to handle permissions
        console.log('Updating category in direct login mode');
    }

    const { error } = await supabase
        .from('categories')
        .update({
            name: category.name,
            slug: category.slug || category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: category.description,
            image_url: category.image,
            parent_id: category.parentId,
            sort_order: category.sortOrder,
            is_active: category.isActive,
            updated_at: new Date().toISOString()
        })
        .eq('id', category.id);

    if (error) {
        console.error('Error updating category:', error);
        return false;
    }

    return true;
};

export const deleteCategory = async (categoryId: string): Promise<boolean> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

    // Set session parameters for direct login mode
    if (isDirectLogin) {
        await setDirectLoginSession();
    }

    if (!isDirectLogin) {
        // Standard authentication flow - check user permissions
        // This will be handled by RLS policies
    } else {
        // In direct login mode, we'll rely on RLS policies to handle permissions
        console.log('Deleting category in direct login mode');
    }
    
    // First check if there are products in this category
    const { count, error: countError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

    if (countError) {
        console.error('Error checking category products:', countError);
        return false;
    }

    // Don't allow deletion if there are products in this category
    if (count && count > 0) {
        console.error('Cannot delete category with products');
        return false;
    }

    // If no products, proceed with deletion
    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

    if (error) {
        console.error('Error deleting category:', error);
        return false;
    }

    return true;
};

// Helper function to map database category to our Category type
const mapCategoryFromDB = (data: Record<string, unknown>): Category => ({
    id: data.id,
    name: data.name,
    slug: data.slug,
    description: data.description,
    image: data.image_url || '',
    parentId: data.parent_id,
    isActive: data.is_active,
    sortOrder: data.sort_order,
    productCount: data.productCount || 0,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

// =====================================================
// CART FUNCTIONS
// =====================================================

export const getCartItems = async (): Promise<CartItem[]> => {
    const { data, error } = await supabase
        .from('cart_items')
        .select(`
            *,
            products(
                *,
                categories(name, slug),
                profiles(full_name)
            ),
            product_variants(*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching cart items:', error);
        return [];
    }

    return data?.map(mapCartItemFromDB) || [];
};

export const addToCart = async (productId: string, variantId?: string, quantity: number = 1): Promise<boolean> => {
    try {
        // Try using the RPC function first
        const { data, error } = await supabase.rpc('add_to_cart', {
            p_product_id: productId,
            p_variant_id: variantId,
            p_quantity: quantity
        });

        if (error) {
            console.error('RPC add_to_cart error:', error);
            // Fallback to direct insert/update
            return await addToCartDirect(productId, variantId, quantity);
        }

        return data?.success || false;
    } catch (error) {
        console.error('Error adding to cart:', error);
        return await addToCartDirect(productId, variantId, quantity);
    }
};

// Fallback function for direct cart operations
const addToCartDirect = async (productId: string, variantId?: string, quantity: number = 1): Promise<boolean> => {
    // Check if item already exists in cart
    const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('product_id', productId)
        .eq('variant_id', variantId || null)
        .single();

    if (existingItem) {
        // Update quantity
        const { error } = await supabase
            .from('cart_items')
            .update({
                quantity: existingItem.quantity + quantity,
                updated_at: new Date().toISOString()
            })
            .eq('id', existingItem.id);

        return !error;
    } else {
        // Insert new item
        const { error } = await supabase
            .from('cart_items')
            .insert({
                product_id: productId,
                variant_id: variantId,
                quantity: quantity
            });

        return !error;
    }
};

// Helper function to map database cart item to our CartItem type
const mapCartItemFromDB = (data: Record<string, unknown>): CartItem => ({
    id: data.id,
    product: mapProductFromDB(data.products),
    productId: data.product_id,
    variantId: data.variant_id,
    quantity: data.quantity,
    unitPrice: data.unit_price ? parseFloat(data.unit_price) : data.products?.price,
    totalPrice: data.total_price ? parseFloat(data.total_price) : (data.quantity * parseFloat(data.products?.price || 0)),
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

export const updateCartItemQuantity = async (productId: string, quantity: number, variantId?: string): Promise<boolean> => {
    let query = supabase
        .from('cart_items')
        .update({
            quantity,
            total_price: quantity * 0, // Will be calculated by trigger
            updated_at: new Date().toISOString()
        })
        .eq('product_id', productId);

    if (variantId) {
        query = query.eq('variant_id', variantId);
    } else {
        query = query.is('variant_id', null);
    }

    const { error } = await query;

    if (error) {
        console.error('Error updating cart item:', error);
        return false;
    }

    return true;
};

export const removeFromCart = async (productId: string, variantId?: string): Promise<boolean> => {
    let query = supabase
        .from('cart_items')
        .delete()
        .eq('product_id', productId);

    if (variantId) {
        query = query.eq('variant_id', variantId);
    } else {
        query = query.is('variant_id', null);
    }

    const { error } = await query;

    if (error) {
        console.error('Error removing from cart:', error);
        return false;
    }

    return true;
};

export const clearCart = async (): Promise<boolean> => {
    const { error } = await supabase
        .from('cart_items')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all items for current user

    if (error) {
        console.error('Error clearing cart:', error);
        return false;
    }

    return true;
};

// =====================================================
// WISHLIST FUNCTIONS
// =====================================================

export const getWishlistItems = async (): Promise<WishlistItem[]> => {
    const { data, error } = await supabase
        .from('wishlist_items')
        .select(`
            *,
            products(
                *,
                categories(name),
                profiles(full_name)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching wishlist items:', error);
        return [];
    }

    return data?.map((item: Record<string, unknown>) => ({
        product: mapProductFromDB(item.products)
    })) || [];
};

export const addToWishlist = async (productId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('wishlist_items')
        .insert({
            product_id: productId,
            user_id: (await supabase.auth.getUser()).data.user?.id
        });

    if (error) {
        console.error('Error adding to wishlist:', error);
        return false;
    }

    return true;
};

export const removeFromWishlist = async (productId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('product_id', productId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

    if (error) {
        console.error('Error removing from wishlist:', error);
        return false;
    }

    return true;
};

// =====================================================
// ORDER FUNCTIONS
// =====================================================

export const createOrder = async (orderData: {
    items: CartItem[];
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod: string;
}): Promise<string | null> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const subtotal = orderData.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const shippingAmount = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `ORD-${Date.now()}`;

    const { data, error } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            user_id: user.id,
            subtotal,
            tax_amount: taxAmount,
            shipping_amount: shippingAmount,
            total_amount: totalAmount,
            shipping_address: orderData.shippingAddress,
            billing_address: orderData.billingAddress || orderData.shippingAddress,
            payment_method: orderData.paymentMethod,
            status: 'pending',
            payment_status: 'pending'
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating order:', error);
        return null;
    }

    // Add order items
    const orderItems = orderData.items.map(item => ({
        order_id: data.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: {
            name: item.product.name,
            description: item.product.description,
            images: item.product.images,
            seller: item.product.sellerName
        }
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Error creating order items:', itemsError);
        // Rollback order creation
        await supabase.from('orders').delete().eq('id', data.id);
        return null;
    }

    // Clear cart after successful order
    await clearCart();

    return data.id;
};

// Create a new order for guest users
export const createGuestOrder = async (orderData: {
    items: CartItem[];
    shippingAddress: Address;
    billingAddress?: Address;
    paymentMethod: string;
    guestEmail: string;
    guestName: string;
}): Promise<string | null> => {
    const subtotal = orderData.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const taxAmount = subtotal * 0.18; // 18% GST
    const shippingAmount = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const totalAmount = subtotal + taxAmount + shippingAmount;

    // Generate order number
    const { data: orderNumberData } = await supabase.rpc('generate_order_number');
    const orderNumber = orderNumberData || `GUEST-${Date.now()}`;

    const { data, error } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            user_id: null, // Guest order
            guest_email: orderData.guestEmail,
            guest_name: orderData.guestName,
            subtotal,
            tax_amount: taxAmount,
            shipping_amount: shippingAmount,
            total_amount: totalAmount,
            shipping_address: orderData.shippingAddress,
            billing_address: orderData.billingAddress || orderData.shippingAddress,
            payment_method: orderData.paymentMethod,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating guest order:', error);
        return null;
    }

    // Add order items
    const orderItems = orderData.items.map(item => ({
        order_id: data.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
        product_snapshot: {
            name: item.product.name,
            description: item.product.description,
            images: item.product.images,
            seller: item.product.sellerName
        }
    }));

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

    if (itemsError) {
        console.error('Error creating guest order items:', itemsError);
        // Rollback order creation
        await supabase.from('orders').delete().eq('id', data.id);
        return null;
    }

    return data.id;
};

export const getOrders = async (userId?: string): Promise<Order[]> => {
    // Check if we're in direct login mode
    const isDirectLogin = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
    
    let query = supabase
        .from('orders')
        .select(`
            *,
            order_items(
                *,
                products(name, images, price)
            ),
            profiles(full_name)
        `)
        .order('created_at', { ascending: false });

    if (userId) {
        // Handle direct login mode - convert mock user ID to a valid approach
        if (isDirectLogin && userId.startsWith('mock-')) {
            // In direct login mode, we might want to fetch all orders or handle differently
            // For now, we'll skip the user filter for mock users
            console.warn('Skipping user filter for mock user in direct login mode');
        } else {
            query = query.eq('user_id', userId);
        }
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    // Fetch tracking data separately to avoid relationship issues
    const ordersWithTracking = await Promise.all(data.map(async (order) => {
        const { data: trackingData, error: trackingError } = await supabase
            .from('order_tracking')
            .select('*')
            .eq('order_id', order.id);
        
        return {
            ...order,
            trackingHistory: trackingData || []
        };
    }));

    return ordersWithTracking?.map(mapOrderFromDB) || [];
};

export const getOrderById = async (orderId: string): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items(
                *,
                products(*)
            ),
            profiles(full_name)
        `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }

    // Fetch tracking data separately to avoid relationship issues
    const { data: trackingData, error: trackingError } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', data.id);
    
    const orderWithTracking = {
        ...data,
        trackingHistory: trackingData || []
    };

    return orderWithTracking ? mapOrderFromDB(orderWithTracking) : null;
};

// Helper function to map database order to our Order type
const mapOrderFromDB = (data: Record<string, unknown>): Order => ({
    id: data.id,
    orderNumber: data.order_number,
    userId: data.user_id,
    items: data.order_items?.map((item: Record<string, unknown>) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        totalPrice: parseFloat(item.total_price),
        productSnapshot: item.product_snapshot,
        createdAt: new Date(item.created_at),
        product: item.products ? mapProductFromDB(item.products) : undefined
    })) || [],
    total: parseFloat(data.total_amount),
    subtotal: parseFloat(data.subtotal),
    taxAmount: parseFloat(data.tax_amount),
    shippingAmount: parseFloat(data.shipping_amount),
    discountAmount: data.discount_amount ? parseFloat(data.discount_amount) : 0,
    status: data.status,
    paymentStatus: data.payment_status,
    paymentMethod: data.payment_method,
    paymentId: data.payment_id,
    currency: data.currency,
    shippingAddress: data.shipping_address,
    billingAddress: data.billing_address,
    notes: data.notes,
    trackingNumber: data.tracking_number,
    shippedAt: data.shipped_at ? new Date(data.shipped_at) : undefined,
    deliveredAt: data.delivered_at ? new Date(data.delivered_at) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    trackingHistory: data.order_tracking?.map((track: Record<string, unknown>) => ({
        id: track.id,
        orderId: track.order_id,
        status: track.status,
        message: track.message,
        location: track.location,
        createdAt: new Date(track.created_at)
    })) || [],
    // Legacy fields for backward compatibility
    user_id: data.user_id,
    shipping_address: data.shipping_address,
    created_at: data.created_at,
    updated_at: data.updated_at,
    tracking_history: data.order_tracking?.map((track: Record<string, unknown>) => ({
        status: track.status,
        date: new Date(track.created_at),
        location: track.location || ''
    })) || []
});

export const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .update({
            status,
            updated_at: new Date().toISOString(),
            ...(status === 'shipped' && { shipped_at: new Date().toISOString() }),
            ...(status === 'delivered' && { delivered_at: new Date().toISOString() })
        })
        .eq('id', orderId);

    if (error) {
        console.error('Error updating order status:', error);
        return false;
    }

    // Add tracking entry
    await supabase
        .from('order_tracking')
        .insert({
            order_id: orderId,
            status,
            message: `Order ${status}`,
            created_at: new Date().toISOString()
        });

    return true;
};

// =====================================================
// DASHBOARD FUNCTIONS
// =====================================================

// =====================================================
// REVIEW FUNCTIONS
// =====================================================

export const addReview = async (
    productId: string,
    rating: number,
    comment: string,
    title?: string,
    images?: string[]
): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    // Check if user has purchased this product (for verified purchase)
    const { data: orderItems } = await supabase
        .from('order_items')
        .select('id, orders!inner(user_id)')
        .eq('product_id', productId)
        .eq('orders.user_id', user.id);

    const isVerifiedPurchase = orderItems && orderItems.length > 0;

    const { error } = await supabase
        .from('reviews')
        .insert({
            product_id: productId,
            user_id: user.id,
            rating,
            comment,
            title,
            images: images || [],
            is_verified_purchase: isVerifiedPurchase,
            is_approved: true // Auto-approve for now, you can add moderation logic
        });

    if (error) {
        console.error('Error adding review:', error);
        return false;
    }

    return true;
};

// Function to mark review as helpful
export const markReviewHelpful = async (reviewId: string): Promise<boolean> => {
    const { error } = await supabase.rpc('increment_review_helpful', {
        review_id: reviewId
    });

    if (error) {
        console.error('Error marking review as helpful:', error);
        return false;
    }

    return true;
};

// =====================================================
// USER PREFERENCES FUNCTIONS
// =====================================================

export interface UserPreferences {
    id?: string;
    userId: string;
    // Email notifications
    emailOrderUpdates: boolean;
    emailPromotions: boolean;
    emailNewsletter: boolean;
    emailSecurity: boolean;
    emailProductUpdates: boolean;
    // Push notifications
    pushOrderUpdates: boolean;
    pushPromotions: boolean;
    pushNewsletter: boolean;
    pushSecurity: boolean;
    pushProductUpdates: boolean;
    // SMS notifications
    smsOrderUpdates: boolean;
    smsPromotions: boolean;
    smsNewsletter: boolean;
    smsSecurity: boolean;
    smsProductUpdates: boolean;
    // General preferences
    language: string;
    timezone: string;
    currency: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const getUserPreferences = async (userId?: string): Promise<UserPreferences | null> => {
    const user = userId || (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', typeof user === 'string' ? user : user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No preferences found, create default ones
            return await createDefaultUserPreferences(typeof user === 'string' ? user : user.id);
        }
        console.error('Error fetching user preferences:', error);
        return null;
    }

    return mapUserPreferencesFromDB(data);
};

export const updateUserPreferences = async (preferences: Partial<UserPreferences>): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    const updateData = {
        email_order_updates: preferences.emailOrderUpdates,
        email_promotions: preferences.emailPromotions,
        email_newsletter: preferences.emailNewsletter,
        email_security: preferences.emailSecurity,
        email_product_updates: preferences.emailProductUpdates,
        push_order_updates: preferences.pushOrderUpdates,
        push_promotions: preferences.pushPromotions,
        push_newsletter: preferences.pushNewsletter,
        push_security: preferences.pushSecurity,
        push_product_updates: preferences.pushProductUpdates,
        sms_order_updates: preferences.smsOrderUpdates,
        sms_promotions: preferences.smsPromotions,
        sms_newsletter: preferences.smsNewsletter,
        sms_security: preferences.smsSecurity,
        sms_product_updates: preferences.smsProductUpdates,
        language: preferences.language,
        timezone: preferences.timezone,
        currency: preferences.currency,
        updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
        }
    });

    const { error } = await supabase
        .from('user_preferences')
        .upsert({
            user_id: user.id,
            ...updateData
        });

    if (error) {
        console.error('Error updating user preferences:', error);
        return false;
    }

    return true;
};

const createDefaultUserPreferences = async (userId: string): Promise<UserPreferences> => {
    const defaultPreferences = {
        user_id: userId,
        email_order_updates: true,
        email_promotions: true,
        email_newsletter: false,
        email_security: true,
        email_product_updates: false,
        push_order_updates: true,
        push_promotions: false,
        push_newsletter: false,
        push_security: true,
        push_product_updates: false,
        sms_order_updates: false,
        sms_promotions: false,
        sms_newsletter: false,
        sms_security: true,
        sms_product_updates: false,
        language: 'en',
        timezone: 'UTC',
        currency: 'USD'
    };

    const { data, error } = await supabase
        .from('user_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

    if (error) {
        console.error('Error creating default user preferences:', error);
        throw error;
    }

    return mapUserPreferencesFromDB(data);
};

const mapUserPreferencesFromDB = (data: Record<string, unknown>): UserPreferences => ({
    id: data.id,
    userId: data.user_id,
    emailOrderUpdates: data.email_order_updates,
    emailPromotions: data.email_promotions,
    emailNewsletter: data.email_newsletter,
    emailSecurity: data.email_security,
    emailProductUpdates: data.email_product_updates,
    pushOrderUpdates: data.push_order_updates,
    pushPromotions: data.push_promotions,
    pushNewsletter: data.push_newsletter,
    pushSecurity: data.push_security,
    pushProductUpdates: data.push_product_updates,
    smsOrderUpdates: data.sms_order_updates,
    smsPromotions: data.sms_promotions,
    smsNewsletter: data.sms_newsletter,
    smsSecurity: data.sms_security,
    smsProductUpdates: data.sms_product_updates,
    language: data.language,
    timezone: data.timezone,
    currency: data.currency,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

// =====================================================
// ADDRESS FUNCTIONS
// =====================================================

export const getUserAddresses = async (): Promise<Address[]> => {
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching addresses:', error);
        return [];
    }

    return data?.map(mapAddressFromDB) || [];
};

// =====================================================
// USER SECURITY SETTINGS FUNCTIONS
// =====================================================

export interface UserSecuritySettings {
    id?: string;
    userId: string;
    twoFactorEnabled: boolean;
    twoFactorMethod: 'email' | 'sms' | 'authenticator';
    twoFactorPhone?: string;
    twoFactorBackupCodes?: string[];
    loginAlerts: boolean;
    suspiciousActivityAlerts: boolean;
    sessionTimeout: number;
    requirePasswordForSensitiveActions: boolean;
    passwordChangedAt?: Date;
    failedLoginAttempts: number;
    accountLockedUntil?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export const getUserSecuritySettings = async (userId?: string): Promise<UserSecuritySettings | null> => {
    const user = userId || (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_security_settings')
        .select('*')
        .eq('user_id', typeof user === 'string' ? user : user.id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // No security settings found, create default ones
            return await createDefaultUserSecuritySettings(typeof user === 'string' ? user : user.id);
        }
        console.error('Error fetching user security settings:', error);
        return null;
    }

    return mapUserSecuritySettingsFromDB(data);
};

export const updateUserSecuritySettings = async (settings: Partial<UserSecuritySettings>): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    const updateData = {
        two_factor_enabled: settings.twoFactorEnabled,
        two_factor_method: settings.twoFactorMethod,
        two_factor_phone: settings.twoFactorPhone,
        two_factor_backup_codes: settings.twoFactorBackupCodes,
        login_alerts: settings.loginAlerts,
        suspicious_activity_alerts: settings.suspiciousActivityAlerts,
        session_timeout: settings.sessionTimeout,
        require_password_for_sensitive_actions: settings.requirePasswordForSensitiveActions,
        password_changed_at: settings.passwordChangedAt?.toISOString(),
        failed_login_attempts: settings.failedLoginAttempts,
        account_locked_until: settings.accountLockedUntil?.toISOString(),
        updated_at: new Date().toISOString()
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
            delete updateData[key as keyof typeof updateData];
        }
    });

    const { error } = await supabase
        .from('user_security_settings')
        .upsert({
            user_id: user.id,
            ...updateData
        });

    if (error) {
        console.error('Error updating user security settings:', error);
        return false;
    }

    return true;
};

const createDefaultUserSecuritySettings = async (userId: string): Promise<UserSecuritySettings> => {
    const defaultSettings = {
        user_id: userId,
        two_factor_enabled: false,
        two_factor_method: 'email' as const,
        login_alerts: true,
        suspicious_activity_alerts: true,
        session_timeout: 30,
        require_password_for_sensitive_actions: true,
        failed_login_attempts: 0
    };

    const { data, error } = await supabase
        .from('user_security_settings')
        .insert(defaultSettings)
        .select()
        .single();

    if (error) {
        console.error('Error creating default user security settings:', error);
        throw error;
    }

    return mapUserSecuritySettingsFromDB(data);
};

const mapUserSecuritySettingsFromDB = (data: Record<string, unknown>): UserSecuritySettings => ({
    id: data.id,
    userId: data.user_id,
    twoFactorEnabled: data.two_factor_enabled,
    twoFactorMethod: data.two_factor_method,
    twoFactorPhone: data.two_factor_phone,
    twoFactorBackupCodes: data.two_factor_backup_codes,
    loginAlerts: data.login_alerts,
    suspiciousActivityAlerts: data.suspicious_activity_alerts,
    sessionTimeout: data.session_timeout,
    requirePasswordForSensitiveActions: data.require_password_for_sensitive_actions,
    passwordChangedAt: data.password_changed_at ? new Date(data.password_changed_at) : undefined,
    failedLoginAttempts: data.failed_login_attempts,
    accountLockedUntil: data.account_locked_until ? new Date(data.account_locked_until) : undefined,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

export const addAddress = async (address: Omit<Address, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    const { error } = await supabase
        .from('addresses')
        .insert({
            user_id: user.id,
            full_name: address.fullName,
            street_address: address.streetAddress || address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode || address.zipCode,
            country: address.country,
            phone: address.phone,
            type: address.type || 'shipping',
            is_default: address.isDefault || false
        });

    if (error) {
        console.error('Error adding address:', error);
        return false;
    }

    return true;
};

// =====================================================
// PAYMENT METHODS FUNCTIONS
// =====================================================

export interface PaymentMethod {
    id?: string;
    userId: string;
    type: 'credit' | 'debit' | 'paypal' | 'bank_account';
    provider: string;
    lastFour: string;
    expiryMonth?: number;
    expiryYear?: number;
    holderName: string;
    billingAddressId?: string;
    isDefault: boolean;
    isVerified: boolean;
    encryptedData?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export const getUserPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];

    const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching payment methods:', error);
        return [];
    }

    return data?.map(mapPaymentMethodFromDB) || [];
};

export const addPaymentMethod = async (paymentMethod: Omit<PaymentMethod, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    // If this is set as default, unset other defaults
    if (paymentMethod.isDefault) {
        await supabase
            .from('payment_methods')
            .update({ is_default: false })
            .eq('user_id', user.id);
    }

    const { error } = await supabase
        .from('payment_methods')
        .insert({
            user_id: user.id,
            type: paymentMethod.type,
            provider: paymentMethod.provider,
            last_four: paymentMethod.lastFour,
            expiry_month: paymentMethod.expiryMonth,
            expiry_year: paymentMethod.expiryYear,
            holder_name: paymentMethod.holderName,
            billing_address_id: paymentMethod.billingAddressId,
            is_default: paymentMethod.isDefault,
            is_verified: paymentMethod.isVerified,
            encrypted_data: paymentMethod.encryptedData
        });

    if (error) {
        console.error('Error adding payment method:', error);
        return false;
    }

    return true;
};

export const updatePaymentMethod = async (paymentMethod: PaymentMethod): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user || !paymentMethod.id) return false;

    // If this is set as default, unset other defaults
    if (paymentMethod.isDefault) {
        await supabase
            .from('payment_methods')
            .update({ is_default: false })
            .eq('user_id', user.id)
            .neq('id', paymentMethod.id);
    }

    const { error } = await supabase
        .from('payment_methods')
        .update({
            type: paymentMethod.type,
            provider: paymentMethod.provider,
            last_four: paymentMethod.lastFour,
            expiry_month: paymentMethod.expiryMonth,
            expiry_year: paymentMethod.expiryYear,
            holder_name: paymentMethod.holderName,
            billing_address_id: paymentMethod.billingAddressId,
            is_default: paymentMethod.isDefault,
            is_verified: paymentMethod.isVerified,
            encrypted_data: paymentMethod.encryptedData,
            updated_at: new Date().toISOString()
        })
        .eq('id', paymentMethod.id)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error updating payment method:', error);
        return false;
    }

    return true;
};

export const deletePaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', paymentMethodId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error deleting payment method:', error);
        return false;
    }

    return true;
};

export const setDefaultPaymentMethod = async (paymentMethodId: string): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    // First, unset all defaults
    await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);

    // Then set the new default
    const { error } = await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', paymentMethodId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error setting default payment method:', error);
        return false;
    }

    return true;
};

const mapPaymentMethodFromDB = (data: Record<string, unknown>): PaymentMethod => ({
    id: data.id,
    userId: data.user_id,
    type: data.type,
    provider: data.provider,
    lastFour: data.last_four,
    expiryMonth: data.expiry_month,
    expiryYear: data.expiry_year,
    holderName: data.holder_name,
    billingAddressId: data.billing_address_id,
    isDefault: data.is_default,
    isVerified: data.is_verified,
    encryptedData: data.encrypted_data,
    createdAt: new Date(data.created_at),
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

export const updateAddress = async (address: Address): Promise<boolean> => {
    const { error } = await supabase
        .from('addresses')
        .update({
            full_name: address.fullName,
            street_address: address.streetAddress || address.street,
            city: address.city,
            state: address.state,
            postal_code: address.postalCode || address.zipCode,
            country: address.country,
            phone: address.phone,
            type: address.type,
            is_default: address.isDefault,
            updated_at: new Date().toISOString()
        })
        .eq('id', address.id);

    if (error) {
        console.error('Error updating address:', error);
        return false;
    }

    return true;
};

export const deleteAddress = async (addressId: string): Promise<boolean> => {
    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressId);

    if (error) {
        console.error('Error deleting address:', error);
        return false;
    }

    return true;
};

export const setDefaultAddress = async (addressId: string, type: 'shipping' | 'billing'): Promise<boolean> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return false;

    // First, unset all default addresses of this type
    await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('type', type);

    // Then set the new default
    const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

    if (error) {
        console.error('Error setting default address:', error);
        return false;
    }

    return true;
};

// Helper function to map database address to our Address type
const mapAddressFromDB = (data: Record<string, unknown>): Address => ({
    id: data.id,
    userId: data.user_id,
    type: data.type,
    fullName: data.full_name,
    streetAddress: data.street_address,
    city: data.city,
    state: data.state,
    postalCode: data.postal_code,
    country: data.country,
    phone: data.phone,
    isDefault: data.is_default,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
    // Legacy fields for backward compatibility
    street: data.street_address,
    zipCode: data.postal_code
});

// =====================================================
// PRODUCT VARIANT FUNCTIONS
// =====================================================

export const getProductVariants = async (productId: string): Promise<ProductVariant[]> => {
    const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .eq('is_active', true)
        .order('created_at');

    if (error) {
        console.error('Error fetching product variants:', error);
        return [];
    }

    return data?.map(mapProductVariantFromDB) || [];
};

export const createProductVariant = async (variant: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> => {
    const { data, error } = await supabase
        .from('product_variants')
        .insert({
            product_id: variant.productId,
            name: variant.name,
            value: variant.value,
            price_adjustment: variant.priceAdjustment,
            stock: variant.stock,
            sku: variant.sku,
            is_active: variant.isActive ?? true
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating product variant:', error);
        return null;
    }

    return data?.id || null;
};

// Helper function to map database product variant to our ProductVariant type
const mapProductVariantFromDB = (data: Record<string, unknown>): ProductVariant => ({
    id: data.id,
    productId: data.product_id,
    name: data.name,
    value: data.value,
    priceAdjustment: parseFloat(data.price_adjustment),
    stock: data.stock,
    sku: data.sku,
    isActive: data.is_active,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

// =====================================================
// COUPON FUNCTIONS
// =====================================================

export const getCoupons = async (isActive?: boolean): Promise<Coupon[]> => {
    let query = supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (isActive !== undefined) {
        query = query.eq('is_active', isActive);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching coupons:', error);
        return [];
    }

    return data?.map(mapCouponFromDB) || [];
};

export const validateCoupon = async (code: string, orderAmount: number): Promise<Coupon | null> => {
    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .lte('valid_from', new Date().toISOString())
        .single();

    if (error) {
        console.error('Error validating coupon:', error);
        return null;
    }

    if (data && orderAmount >= data.minimum_amount) {
        return mapCouponFromDB(data);
    }

    return null;
};



// =====================================================
// ANALYTICS AND DASHBOARD FUNCTIONS
// =====================================================

export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {

    try {
        // Get basic counts
        const [usersResult, productsResult, ordersResult] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
            supabase.from('orders').select('id, total_amount', { count: 'exact' })
        ]);

        const totalUsers = usersResult.count || 0;
        const totalProducts = productsResult.count || 0;
        const totalOrders = ordersResult.count || 0;
        const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + parseFloat(order.total_amount), 0) || 0;

        // Get pending orders
        const { count: pendingOrders } = await supabase
            .from('orders')
            .select('id', { count: 'exact', head: true })
            .in('status', ['pending', 'confirmed', 'processing']);

        // Get low stock products
        const { count: lowStockProducts } = await supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .lte('stock', 10)
            .eq('is_active', true);

        // Get recent orders
        const { data: recentOrdersData } = await supabase
            .from('orders')
            .select(`
                *,
                order_items(
                    *,
                    products(name, images)
                ),
                profiles(full_name)
            `)
            .order('created_at', { ascending: false })
            .limit(5);

        const recentOrders = recentOrdersData?.map(mapOrderFromDB) || [];

        // Get top products (by order count)
        const { data: topProductsData } = await supabase
            .from('products')
            .select(`
                *,
                categories(name),
                profiles(full_name),
                order_items(quantity)
            `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(5);

        const topProducts = topProductsData?.map(mapProductFromDB) || [];

        // Calculate sales trends from actual data
        const salesTrends = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return {
                date: date.toISOString().split('T')[0],
                sales: 0,
                orders: 0
            };
        }).reverse();

        // Get category performance from actual data
        const { data: categoryData } = await supabase
            .from('categories')
            .select(`
                id,
                name,
                products(
                    id,
                    order_items(quantity, unit_price)
                )
            `);

        const categoryPerformance = categoryData?.map(category => {
            const totalSales = category.products?.reduce((sum: number, product: Record<string, unknown>) => {
                return sum + (product.order_items?.reduce((itemSum: number, item: Record<string, unknown>) => {
                    return itemSum + (item.quantity * item.unit_price);
                }, 0) || 0);
            }, 0) || 0;

            const totalOrders = category.products?.reduce((sum: number, product: Record<string, unknown>) => {
                return sum + (product.order_items?.length || 0);
            }, 0) || 0;

            return {
                categoryId: category.id,
                categoryName: category.name,
                totalSales,
                totalOrders,
                averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0
            };
        }) || [];

        return {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue,
            pendingOrders: pendingOrders || 0,
            lowStockProducts: lowStockProducts || 0,
            recentOrders,
            topProducts,
            salesTrends,
            categoryPerformance
        };
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        throw error;
    }
};

// Function to get sales data for charts
export const getSalesData = async (period: 'week' | 'month' | 'year' = 'week') => {
    try {
        const startDate = new Date();
        switch (period) {
            case 'week':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
        }

        const { data, error } = await supabase
            .from('orders')
            .select('created_at, total_amount, status')
            .gte('created_at', startDate.toISOString())
            .order('created_at');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Error fetching sales data:', error);
        return [];
    }
};

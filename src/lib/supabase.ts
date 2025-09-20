import { createClient } from '@supabase/supabase-js';
// import { createRetryableAction } from '../utils/errorHandling'; // Unused import
// import { performanceMonitor } from '../utils/performance'; // Unused import
// Removed logging import
// Removed uuidValidation import
import {
  User,
  Product,
  Category,
  // CartItem, // Unused import
  // WishlistItem, // Unused import
  Order,
  Address,
  // ProductVariant, // Unused import
  // Coupon, // Unused import
  DashboardAnalytics
} from '../types';

// Environment validation with better error messages
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gtnpmxlnzpfqbhfzuitj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0bnBteGxuenBmcWJoZnp1aXRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MjExNTQsImV4cCI6MjA3MzM5NzE1NH0.cREEJprRj9dnCk5zc9vqsyiSAdFt3ih7aTUUnpkNjB8';
const appEnv = import.meta.env.VITE_APP_ENV || 'development';

// Validate required environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing required Supabase environment variables');
  throw new Error('Supabase configuration is incomplete. Please check your environment variables.');
}

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

// Enhanced database initialization with better error handling and timeouts
async function initializeDatabase() {
  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database initialization timeout')), 5000)
    );

    // Test basic connectivity with timeout
    const connectivityTest = supabase
      .from('profiles')
      .select('count')
      .limit(1);

    const { error } = await Promise.race([connectivityTest, timeoutPromise]);

    if (error) {
      if (error.message.includes('infinite recursion')) {
        console.warn('⚠️ Database RLS policies need fixing. This is expected on first run.');
        throw new Error('DATABASE_NEEDS_FIXING: Please run the COMPREHENSIVE-BACKEND-FIX.sql script in your Supabase SQL Editor.');
      } else if (error.message.includes('timeout')) {
        console.warn('⚠️ Database connection timeout. Continuing with limited functionality.');
        return false; // Continue without database
      } else {
        console.warn('⚠️ Database connection issue:', error.message);
        return false; // Continue without database
      }
    }

    // Only set development mode if basic connectivity works
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.development_mode',
        new_value: 'true',
        is_local: false
      });
    } catch (configError) {
      // Ignore errors if function doesn't exist
      console.log('Development mode configuration not available');
    }

    // Check if we're in direct login mode
    if (import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true') {
      console.log('🔧 Direct login mode enabled - bypassing some database checks');
      return;
    }

    if (appEnv === 'development') {
      console.log('✅ Database connection established successfully');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('DATABASE_NEEDS_FIXING')) {
      throw error;
    }
    // In direct login mode, we can ignore database errors
    if (import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true') {
      console.log('🔧 Direct login mode: Ignoring database initialization error');
      return;
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
      // Simplified logging
      if (appEnv === 'development') {
        // Basic console logging for development
        if (url.includes('/rpc/') || url.includes('profiles') || url.includes('orders') || url.includes('products')) {
          console.log(`🔗 Database request: ${url}`);
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
  } catch {
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

// Helper to validate UUID format - currently unused
// const isValidUUID = (value: string): boolean => {
//   return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
// };

// Enhanced product fetching with all details (for when needed)
export const getProducts = async (filters?: {
    categoryId?: string;
    categorySlug?: string;
    seller?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
}) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        categories!inner(name, slug),
        product_variants(*)
      `)
      .eq('active', true);

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
      query = query.eq('featured', filters.featured);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.short_description,
      price: parseFloat(product.price),
      originalPrice: product.original_price ? parseFloat(product.original_price) : undefined,
      images: product.image_url ? [product.image_url] : [],
      stock: product.stock || 0,
      minStockLevel: product.min_stock_level,
      sku: product.sku,
      weight: product.weight,
      dimensions: product.dimensions,
      rating: parseFloat(product.rating || '0'),
      reviewCount: product.review_count || 0,
      reviews: product.reviews || [],
      categoryId: product.category_id,
      category: product.categories?.name || '',
      sellerId: product.seller_id,
      sellerName: 'Sufi Essences',
      tags: product.tags || [],
      specifications: product.specifications || {},
      featured: product.featured || false,
      createdAt: new Date(product.created_at),
      updatedAt: new Date(product.updated_at)
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// Enhanced product fetching with all details (for when needed)
export const getProductById = async (id: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        product_variants(*),
        reviews(*, profiles(display_name))
      `)
      .eq('id', id)
      .eq('active', true)
      .single();

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      shortDescription: data.short_description,
      price: parseFloat(data.price),
      originalPrice: data.original_price ? parseFloat(data.original_price) : undefined,
      images: data.image_url ? [data.image_url] : [],
      stock: data.stock || 0,
      minStockLevel: data.min_stock_level,
      sku: data.sku,
      weight: data.weight,
      dimensions: data.dimensions,
      rating: parseFloat(data.rating || '0'),
      reviewCount: data.review_count || 0,
      reviews: data.reviews || [],
      categoryId: data.category_id,
      category: data.categories?.name || '',
      sellerId: data.seller_id,
      sellerName: 'Sufi Essences',
      tags: data.tags || [],
      specifications: data.specifications || {},
      featured: data.featured || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return mappedData;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

// Enhanced product fetching with all details (for when needed)
export const getProductBySlug = async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        product_variants(*),
        reviews(*, profiles(display_name))
      `)
      .eq('slug', slug)
      .eq('active', true)
      .single();

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      shortDescription: data.short_description,
      price: parseFloat(data.price),
      originalPrice: data.original_price ? parseFloat(data.original_price) : undefined,
      images: data.image_url ? [data.image_url] : [],
      stock: data.stock || 0,
      minStockLevel: data.min_stock_level,
      sku: data.sku,
      weight: data.weight,
      dimensions: data.dimensions,
      rating: parseFloat(data.rating || '0'),
      reviewCount: data.review_count || 0,
      reviews: data.reviews || [],
      categoryId: data.category_id,
      category: data.categories?.name || '',
      sellerId: data.seller_id,
      sellerName: 'Sufi Essences',
      tags: data.tags || [],
      specifications: data.specifications || {},
      featured: data.featured || false,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };

    return mappedData;
  } catch (error) {
    console.error('Error fetching product by slug:', error);
    return null;
  }
};

// Enhanced category fetching with all details (for when needed)
export const getCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      image: category.image_url || '',
      productCount: 0, // Will be calculated separately if needed
      parentId: category.parent_id,
      sortOrder: category.sort_order || 0,
      isActive: category.is_active,
      createdAt: new Date(category.created_at),
      updatedAt: new Date(category.updated_at)
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
};

// Enhanced category fetching with all details (for when needed)
export const getCategoryBySlug = async (slug: string) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
};

// Enhanced user profile fetching with all details (for when needed)
export const getProfileForUser = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Enhanced cart items fetching with all details (for when needed)
export const getCartItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .select(`
        *,
        products(name, price, image_url, slug, stock)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      variantId: item.variant_id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.products?.name || '',
        price: parseFloat(item.products?.price || '0'),
        images: item.products?.image_url ? [item.products.image_url] : [],
        slug: item.products?.slug || '',
        stock: item.products?.stock || 0,
        description: '',
        rating: 0,
        reviewCount: 0,
        categoryId: '',
        sellerId: '',
        sellerName: 'Sufi Essences',
        reviews: [],
        tags: [],
        specifications: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at)
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching cart items:', error);
    return [];
  }
};

// Enhanced wishlist items fetching with all details (for when needed)
export const getWishlistItems = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .select(`
        *,
        products(name, price, image_url, slug, stock, rating, review_count)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(item => ({
      id: item.id,
      productId: item.product_id,
      product: {
        id: item.product_id,
        name: item.products?.name || '',
        price: parseFloat(item.products?.price || '0'),
        images: item.products?.image_url ? [item.products.image_url] : [],
        slug: item.products?.slug || '',
        stock: item.products?.stock || 0,
        rating: parseFloat(item.products?.rating || '0'),
        reviewCount: item.products?.review_count || 0,
        description: '',
        categoryId: '',
        sellerId: '',
        sellerName: 'Sufi Essences',
        reviews: [],
        tags: [],
        specifications: {},
        createdAt: new Date(),
        updatedAt: new Date()
      },
      createdAt: new Date(item.created_at)
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching wishlist items:', error);
    return [];
  }
};

// Enhanced orders fetching with all details (for when needed)
export const getOrders = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(name, image_url, slug))
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      status: order.status,
      totalAmount: parseFloat(order.total_amount || '0'),
      subtotal: parseFloat(order.subtotal || '0'),
      taxAmount: parseFloat(order.tax_amount || '0'),
      shippingAmount: parseFloat(order.shipping_amount || '0'),
      discountAmount: parseFloat(order.discount_amount || '0'),
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      billingAddress: order.billing_address,
      notes: order.notes,
      items: (order.order_items || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price || '0'),
        totalPrice: parseFloat(item.total_price || '0'),
        productName: item.product_name,
        productImage: item.product_image,
        product: item.products ? {
          id: item.product_id,
          name: item.products.name,
          images: item.products.image_url ? [item.products.image_url] : [],
          slug: item.products.slug,
          price: parseFloat(item.unit_price || '0'),
          description: '',
          rating: 0,
          reviewCount: 0,
          categoryId: '',
          sellerId: '',
          sellerName: 'Sufi Essences',
          stock: 0,
          reviews: [],
          tags: [],
          specifications: {},
          createdAt: new Date(),
          updatedAt: new Date()
        } : undefined
      })),
      createdAt: new Date(order.created_at),
      updatedAt: new Date(order.updated_at)
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

// Enhanced order fetching with all details (for when needed)
export const getOrderById = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*, products(name, image_url, slug)),
        profiles(display_name, email)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
};

// Enhanced addresses fetching with all details (for when needed)
export const getAddresses = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
};

// Enhanced dashboard analytics fetching with all details (for when needed)
export const getDashboardAnalytics = async (userId: string, role: string) => {
  try {
    // Different analytics based on user role
    const data: DashboardAnalytics = {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      recentOrders: [],
      topProducts: [],
      salesData: []
    };

    if (role === 'admin') {
      // Admin gets comprehensive analytics using direct queries
      const [ordersResult, productsResult, customersResult] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('products').select('id').eq('active', true),
        supabase.from('profiles').select('id').eq('role', 'customer')
      ]);

      // Calculate total revenue
      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0;

      data.totalRevenue = totalRevenue;
      data.totalOrders = ordersResult.data?.length || 0;
      data.totalProducts = productsResult.data?.length || 0;
      data.totalCustomers = customersResult.data?.length || 0;
    } else if (role === 'seller') {
      // Seller gets their own analytics
      const [ordersResult, productsResult] = await Promise.all([
        supabase.from('orders').select('total_amount').eq('payment_status', 'paid'),
        supabase.from('products').select('id').eq('seller_id', userId).eq('active', true)
      ]);

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + parseFloat(order.total_amount || '0'), 0) || 0;

      data.totalRevenue = totalRevenue;
      data.totalOrders = ordersResult.data?.length || 0;
      data.totalProducts = productsResult.data?.length || 0;
    }

    // Get recent orders
    const { data: recentOrders } = await supabase
      .from('orders')
      .select(`
        id,
        total_amount,
        status,
        created_at,
        profiles(display_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    data.recentOrders = recentOrders || [];

    // Get top products
    const { data: topProducts } = await supabase
      .from('products')
      .select('id, name, price, image_url, slug, sales_count')
      .eq('active', true)
      .order('sales_count', { ascending: false })
      .limit(5);

    data.topProducts = topProducts || [];

    // Get sales data from orders (simplified)
    const { data: salesOrders } = await supabase
      .from('orders')
      .select('created_at, total_amount')
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: true })
      .limit(30);

    // Transform orders into sales data format
    data.salesData = (salesOrders || []).map(order => ({
      date: order.created_at.split('T')[0], // Extract date part
      sales: parseFloat(order.total_amount || '0'),
      orders: 1
    }));

    return data;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalCustomers: 0,
      recentOrders: [],
      topProducts: [],
      salesData: []
    };
  }
};

// Enhanced user role update with all details (for when needed)
export const updateUserRole = async (userId: string, newRole: string) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user role:', error);
    return null;
  }
};

// Enhanced user profile creation with all details (for when needed)
export const createUserProfile = async (profile: Partial<User>) => {
  try {
    // Simplified validation
    const fixedProfile = profile;
    
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...fixedProfile,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating user profile:', error);
    return null;
  }
};

// Enhanced user profile update with all details (for when needed)
export const updateUserProfile = async (userId: string, updates: Partial<User>) => {
  try {
    // Simplified validation
    const fixedUpdates = updates;
    
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...fixedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return null;
  }
};

// Enhanced product creation with all details (for when needed)
export const createProduct = async (product: Partial<Product>, sellerId: string) => {
  try {
    // Simplified seller ID validation
    if (!sellerId || typeof sellerId !== 'string') {
      throw new Error('Invalid seller ID format');
    }

    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        seller_id: sellerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating product:', error);
    return null;
  }
};

// Enhanced product update with all details (for when needed)
export const updateProduct = async (productId: string, updates: Partial<Product>, sellerId?: string) => {
  try {
    let query = supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    // If seller ID is provided, ensure they can only update their own products
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { data, error } = await query.select().single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating product:', error);
    return null;
  }
};

// Enhanced product deletion with all details (for when needed)
export const deleteProduct = async (productId: string, sellerId?: string) => {
  try {
    let query = supabase
      .from('products')
      .delete()
      .eq('id', productId);

    // If seller ID is provided, ensure they can only delete their own products
    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    const { error } = await query;

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    return false;
  }
};

// Enhanced cart item addition with all details (for when needed)
export const addToCart = async (userId: string, productId: string, quantity: number = 1, variantId?: string) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .upsert({
        user_id: userId,
        product_id: productId,
        quantity,
        variant_id: variantId,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,product_id,variant_id'
      })
      .select();

    if (error) throw error;

    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return null;
  }
};

// Enhanced cart item update with all details (for when needed)
export const updateCartItem = async (userId: string, productId: string, quantity: number, variantId?: string) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null)
      .select();

    if (error) throw error;

    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating cart item:', error);
    return null;
  }
};

// Enhanced cart item quantity update with all details (for when needed)
export const updateCartItemQuantity = async (productId: string, quantity: number, variantId?: string) => {
  try {
    const { data, error } = await supabase
      .from('cart')
      .update({
        quantity,
        updated_at: new Date().toISOString()
      })
      .eq('product_id', productId)
      .eq('variant_id', variantId || null)
      .select();

    if (error) throw error;

    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    return null;
  }
};

// Enhanced cart item removal with all details (for when needed)
export const removeFromCart = async (userId: string, productId: string, variantId?: string) => {
  try {
    const { error } = await supabase
      .from('cart')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)
      .eq('variant_id', variantId || null);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};

// Enhanced cart clearing with all details (for when needed)
export const clearCart = async () => {
  try {
    const { error } = await supabase
      .from('cart')
      .delete();

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error clearing cart:', error);
    return false;
  }
};

// Enhanced wishlist item addition with all details (for when needed)
export const addToWishlist = async (userId: string, productId: string) => {
  try {
    const { data, error } = await supabase
      .from('wishlist')
      .upsert({
        user_id: userId,
        product_id: productId,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,product_id'
      })
      .select();

    if (error) throw error;

    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    return null;
  }
};

// Enhanced wishlist item removal with all details (for when needed)
export const removeFromWishlist = async (userId: string, productId: string) => {
  try {
    const { error } = await supabase
      .from('wishlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    return false;
  }
};

// Enhanced order creation with all details (for when needed)
export const createOrder = async (order: Partial<Order>, orderItems: Record<string, unknown>[]) => {
  try {
    // Start a transaction
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Add order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: orderData.id,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) throw itemsError;

    // Clear cart
    if (order.user_id) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', order.user_id);
    }

    return orderData;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

// Enhanced guest order creation with all details (for when needed)
export const createGuestOrder = async (order: Partial<Order>, orderItems: Record<string, unknown>[]) => {
  try {
    // For guest orders, we still create the order in the database
    // but without associating it with a user ID
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        ...order,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Add order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: orderData.id,
      created_at: new Date().toISOString()
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) throw itemsError;

    return orderData;
  } catch (error) {
    console.error('Error creating guest order:', error);
    return null;
  }
};

// Enhanced address creation with all details (for when needed)
export const createAddress = async (userId: string, address: Partial<Address>) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...address,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating address:', error);
    return null;
  }
};

// Enhanced address update with all details (for when needed)
export const updateAddress = async (addressId: string, userId: string, updates: Partial<Address>) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating address:', error);
    return null;
  }
};

// Enhanced address deletion with all details (for when needed)
export const deleteAddress = async (addressId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting address:', error);
    return false;
  }
};

// Enhanced coupon validation with all details (for when needed)
export const validateCoupon = async (code: string) => {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code)
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error validating coupon:', error);
    return null;
  }
};

// Enhanced sales data fetching with all details (for when needed)
export const getSalesData = async (sellerId?: string, limit: number = 30) => {
  try {
    let query = supabase
      .from('sales_data_view')
      .select('*')
      .order('date', { ascending: true });

    if (sellerId) {
      query = query.eq('seller_id', sellerId);
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return [];
  }
};

// Enhanced featured products fetching with all details (for when needed)
export const getFeaturedProducts = async (limit: number = 8) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        price,
        image_url,
        slug,
        featured,
        rating,
        review_count,
        category_id,
        seller_id,
        stock
      `)
      .eq('featured', true)
      .eq('active', true)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      images: product.image_url ? [product.image_url] : [],
      slug: product.slug,
      featured: product.featured,
      rating: parseFloat(product.rating || '0'),
      reviewCount: product.review_count || 0,
      categoryId: product.category_id,
      sellerId: product.seller_id,
      sellerName: 'Sufi Essences', // Default seller name
      stock: product.stock || 0,
      reviews: [], // Empty array for basic fetch
      tags: [],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
};

// Enhanced basic products fetching with all details (for when needed)
export const getProductsBasic = async (filters?: {
    categoryId?: string;
    categorySlug?: string;
    seller?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
}) => {
  try {
    // Simplified query for better performance - avoid joins when possible
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        image_url,
        slug,
        featured,
        rating,
        review_count,
<<<<<<< HEAD
        tags,
        categories!inner(name, slug)
=======
        category_id
>>>>>>> 13bec73a9cb2635c288b31c9e3205ab1de5a01a7
      `)
      .eq('active', true);

    if (filters?.categoryId) {
      query = query.eq('category_id', filters.categoryId);
    }

    if (filters?.seller) {
      query = query.eq('seller_id', filters.seller);
    }

    if (filters?.featured) {
      query = query.eq('featured', filters.featured);
    }

    if (filters?.search) {
      query = query.ilike('name', `%${filters.search}%`);
    }

    // Add pagination support
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 20)) - 1);
    }

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Query timeout')), 8000)
    );

    const { data, error } = await Promise.race([
      query.order('created_at', { ascending: false }),
      timeoutPromise
    ]);

    if (error) {
      console.error('Database query error:', error);
      throw error;
    }

    // Map database fields to interface fields with simplified data
    const mappedData = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price || '0'),
      images: product.image_url ? [product.image_url] : [],
      slug: product.slug,
      featured: product.featured || false,
      rating: parseFloat(product.rating || '0'),
      reviewCount: product.review_count || 0,
      categoryId: product.category_id,
      category: '', // Will be populated separately if needed
      sellerId: '',
      sellerName: 'Sufi Essences',
      stock: 100, // Default stock for basic view
      description: '', // Not needed for basic view
      reviews: [],
      tags: [],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching basic products:', error);
    return [];
  }
};

// Enhanced minimal products fetching with all details (for when needed)
export const getProductsMinimal = async (limit?: number) => {
  try {
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        price,
        image_url,
        slug,
        tags
      `)
      .eq('active', true);

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    // Map database fields to interface fields
    const mappedData = (data || []).map(product => ({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      images: product.image_url ? [product.image_url] : [],
      slug: product.slug,
      description: '',
      rating: 0,
      reviewCount: 0,
      categoryId: '',
      sellerId: '',
      sellerName: 'Sufi Essences',
      stock: 0,
      reviews: [],
      tags: [],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return mappedData;
  } catch (error) {
    console.error('Error fetching minimal products:', error);
    return [];
  }
};

// Enhanced review addition with all details (for when needed)
export const addReview = async (review: Partial<Review>) => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        ...review,
        created_at: new Date().toISOString()
      })
      .select();

    if (error) throw error;

    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding review:', error);
    return null;
  }
};

// Enhanced category creation with all details (for when needed)
export const createCategory = async (category: Partial<Category>) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert({
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating category:', error);
    return null;
  }
};

// Enhanced category update with all details (for when needed)
export const updateCategory = async (categoryId: string, updates: Partial<Category>) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating category:', error);
    return null;
  }
};

// Enhanced category deletion with all details (for when needed)
export const deleteCategory = async (categoryId: string) => {
  try {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    return false;
  }
};

// Enhanced order status update with all details (for when needed)
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
};

// Enhanced user addresses fetching with all details (for when needed)
export const getUserAddresses = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user addresses:', error);
    return [];
  }
};

// Enhanced address addition with all details (for when needed)
export const addAddress = async (address: Partial<Address>) => {
  try {
    const { data, error } = await supabase
      .from('addresses')
      .insert({
        ...address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error adding address:', error);
    return null;
  }
};

// Enhanced default address setting with all details (for when needed)
export const setDefaultAddress = async (userId: string, addressId: string) => {
  try {
    // First, unset all other default addresses for this user
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Then, set this address as default
    const { data, error } = await supabase
      .from('addresses')
      .update({ is_default: true })
      .eq('id', addressId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error setting default address:', error);
    return null;
  }
};

// Enhanced users fetching with all details (for when needed)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
};

// Enhanced user creation with all details (for when needed)
export const createNewUser = async (user: Partial<User>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        ...user,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error creating new user:', error);
    return null;
  }
};

// Enhanced user update with all details (for when needed)
export const updateUser = async (userId: string, updates: Partial<User>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
};

// Enhanced user deletion with all details (for when needed)
export const deleteUser = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
};

// Enhanced bulk user deletion with all details (for when needed)
export const deleteUsersBulk = async (userIds: string[]) => {
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .in('id', userIds);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting users in bulk:', error);
    return false;
  }
};

// Enhanced bulk user update with all details (for when needed)
export const updateUsersBulk = async (updates: { id: string; data: Partial<User> }[]) => {
  try {
    // Update each user individually
    const results = await Promise.all(
      updates.map(({ id, data }) => 
        supabase
          .from('profiles')
          .update({
            ...data,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single()
      )
    );

    // Check for errors
    const errors = results.filter(result => result.error);
    if (errors.length > 0) {
      throw new Error(`Failed to update ${errors.length} users`);
    }

    return results.map(result => result.data);
  } catch (error) {
    console.error('Error updating users in bulk:', error);
    return null;
  }
};

// Enhanced user preferences fetching with all details (for when needed)
export const getUserPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return null;
  }
};

// Enhanced user preferences update with all details (for when needed)
export const updateUserPreferences = async (userId: string, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return null;
  }
};

// Enhanced user security settings fetching with all details (for when needed)
export const getUserSecuritySettings = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_security_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching user security settings:', error);
    return null;
  }
};

// Enhanced user security settings update with all details (for when needed)
export const updateUserSecuritySettings = async (userId: string, updates: Partial<any>) => {
  try {
    const { data, error } = await supabase
      .from('user_security_settings')
      .upsert({
        user_id: userId,
        ...updates,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error updating user security settings:', error);
    return null;
  }
};

// Enhanced user payment methods fetching with all details (for when needed)
export const getUserPaymentMethods = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching user payment methods:', error);
    return [];
  }
};

// Enhanced payment method deletion with all details (for when needed)
export const deletePaymentMethod = async (paymentMethodId: string, userId: string) => {
  try {
    const { error } = await supabase
      .from('user_payment_methods')
      .delete()
      .eq('id', paymentMethodId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return false;
  }
};

// Enhanced default payment method setting with all details (for when needed)
export const setDefaultPaymentMethod = async (paymentMethodId: string, userId: string) => {
  try {
    // First, unset all other default payment methods for this user
    await supabase
      .from('user_payment_methods')
      .update({ is_default: false })
      .eq('user_id', userId);

    // Then, set this payment method as default
    const { data, error } = await supabase
      .from('user_payment_methods')
      .update({ is_default: true })
      .eq('id', paymentMethodId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return null;
  }
};

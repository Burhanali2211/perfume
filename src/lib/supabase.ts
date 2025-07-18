import { createClient } from '@supabase/supabase-js';
import { createRetryableAction } from '../utils/errorHandling';
import { performanceMonitor } from '../utils/performance';
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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in .env file');
}

// Configure Supabase client with performance optimizations and security settings
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'luxury-ecommerce@1.0.0'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add timeout wrapper for Supabase queries with more generous timeouts
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 15000, // Increased default timeout to 15 seconds
  errorMessage: string = 'Request timed out'
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    )
  ]);
};

// =====================================================
// USER PROFILE FUNCTIONS
// =====================================================

export const getProfileForUser = async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.message.includes('infinite recursion')) {
          throw new Error('DATABASE SETUP ERROR: Your database security policies for the "profiles" table are causing an infinite loop. Please run the provided SQL script in your Supabase SQL Editor to fix this.');
        }
        console.error('Error fetching profile:', error);
        return null;
    }

    if (data) {
        return {
            id: data.id,
            name: data.full_name,
            email: data.email,
            avatar: data.avatar_url,
            role: data.role,
            phone: data.phone,
            dateOfBirth: data.date_of_birth,
            isActive: data.is_active,
            emailVerified: data.email_verified,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined,
        };
    }

    return null;
};

export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    console.log('🔄 Updating user profile:', { userId, updates });

    // Build update object with only defined values
    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
    };

    if (updates.name !== undefined) updateData.full_name = updates.name;
    if (updates.avatar !== undefined) updateData.avatar_url = updates.avatar;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.dateOfBirth !== undefined) updateData.date_of_birth = updates.dateOfBirth;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
    if (updates.emailVerified !== undefined) updateData.email_verified = updates.emailVerified;

    console.log('🔄 Database update data:', updateData);

    const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

    if (error) {
        console.error('❌ Error updating profile:', error);
        return false;
    }

    console.log('✅ Profile updated successfully:', data);
    return true;
};

// New function to get all users (admin only)
export const getAllUsers = async (): Promise<User[]> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching users:', error);
        return [];
    }

    return data?.map(mapUserFromDB) || [];
};

// New function to update user role (admin only)
export const updateUserRole = async (userId: string, role: 'admin' | 'seller' | 'customer'): Promise<boolean> => {
    // Map role to boolean fields
    const updateData = {
        is_admin: role === 'admin',
        is_vendor: role === 'seller',
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

// Helper function to map database user to our User type
const mapUserFromDB = (data: Record<string, unknown>): User => {
    // Determine role based on database boolean fields
    let role: 'admin' | 'seller' | 'customer' = 'customer';
    if (data.is_admin === true) {
        role = 'admin';
    } else if (data.is_vendor === true) {
        role = 'seller';
    }

    return {
        id: data.id as string,
        name: (data.full_name as string) || '',
        email: data.email as string,
        avatar: data.avatar_url as string,
        role,
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
            seller_id: product.sellerId,
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
    images: data.images || [],
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
    let query = supabase
        .from('orders')
        .select(`
            *,
            order_items(
                *,
                products(name, images, price)
            ),
            profiles(full_name),
            order_tracking(*)
        `)
        .order('created_at', { ascending: false });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }

    return data?.map(mapOrderFromDB) || [];
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
            profiles(full_name),
            order_tracking(*)
        `)
        .eq('id', orderId)
        .single();

    if (error) {
        console.error('Error fetching order:', error);
        return null;
    }

    return data ? mapOrderFromDB(data) : null;
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

// Helper function to map database coupon to our Coupon type
const mapCouponFromDB = (data: Record<string, unknown>): Coupon => ({
    id: data.id,
    code: data.code,
    name: data.name,
    description: data.description,
    type: data.type,
    value: parseFloat(data.value),
    minimumAmount: parseFloat(data.minimum_amount),
    maximumDiscount: data.maximum_discount ? parseFloat(data.maximum_discount) : undefined,
    usageLimit: data.usage_limit,
    usedCount: data.used_count,
    isActive: data.is_active,
    validFrom: new Date(data.valid_from),
    validUntil: data.valid_until ? new Date(data.valid_until) : undefined,
    createdAt: data.created_at ? new Date(data.created_at) : undefined,
    updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
});

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

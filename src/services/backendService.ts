/**
 * Comprehensive Backend Service
 * Handles all CRUD operations with proper error handling and validation
 */

import { supabase } from '../lib/supabase';
import { User, Product, Category, CartItem, WishlistItem, Order, Review, Address, Coupon } from '../types';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const handleDatabaseError = (error: any, operation: string) => {
  console.error(`Database error in ${operation}:`, error);
  
  if (error.message?.includes('infinite recursion')) {
    throw new Error('Database configuration error. Please run the database fix script.');
  }
  
  if (error.message?.includes('permission denied')) {
    throw new Error('Permission denied. Please check your authentication.');
  }
  
  if (error.message?.includes('violates foreign key constraint')) {
    throw new Error('Invalid reference. Please check related data exists.');
  }
  
  throw new Error(`${operation} failed: ${error.message || 'Unknown error'}`);
};

export const validateRequired = (data: any, fields: string[]) => {
  const missing = fields.filter(field => !data[field]);
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
};

// ==========================================
// USER MANAGEMENT
// ==========================================

export const userService = {
  async getAll(options: {
    limit?: number;
    offset?: number;
    searchTerm?: string;
    roleFilter?: string;
    isActiveFilter?: boolean;
  } = {}) {
    try {
      const { limit = 50, offset = 0, searchTerm, roleFilter, isActiveFilter } = options;
      
      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }
      
      if (roleFilter) {
        query = query.eq('role', roleFilter);
      }
      
      if (isActiveFilter !== undefined) {
        query = query.eq('is_active', isActiveFilter);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      return {
        users: data?.map(this.mapFromDB) || [],
        total: count || 0
      };
    } catch (error) {
      handleDatabaseError(error, 'Get users');
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? this.mapFromDB(data) : null;
    } catch (error) {
      handleDatabaseError(error, 'Get user by ID');
    }
  },

  async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      validateRequired(userData, ['email', 'name']);
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          email: userData.email,
          full_name: userData.name,
          role: userData.role || 'customer',
          avatar_url: userData.avatar || null,
          phone: userData.phone || null,
          date_of_birth: userData.dateOfBirth || null,
          is_active: userData.isActive !== undefined ? userData.isActive : true,
          email_verified: userData.emailVerified || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDB(data);
    } catch (error) {
      handleDatabaseError(error, 'Create user');
    }
  },

  async update(id: string, updates: Partial<User>) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

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
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDB(data);
    } catch (error) {
      handleDatabaseError(error, 'Update user');
    }
  },

  async delete(id: string) {
    try {
      // First delete related data
      const relatedTables = ['addresses', 'cart_items', 'wishlist_items', 'orders', 'reviews'];
      
      for (const table of relatedTables) {
        await supabase.from(table).delete().eq('user_id', id);
      }
      
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleDatabaseError(error, 'Delete user');
    }
  },

  mapFromDB(data: any): User {
    return {
      id: data.id,
      name: data.full_name || '',
      email: data.email,
      role: data.role,
      avatar: data.avatar_url,
      phone: data.phone,
      dateOfBirth: data.date_of_birth,
      isActive: data.is_active,
      emailVerified: data.email_verified,
      createdAt: new Date(data.created_at),
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }
};

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

export const categoryService = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      // Get product counts for each category
      const categoriesWithCounts = await Promise.all(
        (data || []).map(async (category) => {
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

      return categoriesWithCounts.map(this.mapFromDB);
    } catch (error) {
      handleDatabaseError(error, 'Get categories');
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data ? this.mapFromDB(data) : null;
    } catch (error) {
      handleDatabaseError(error, 'Get category by ID');
    }
  },

  async create(categoryData: Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>) {
    try {
      validateRequired(categoryData, ['name']);
      
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: categoryData.name,
          slug: categoryData.slug || categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: categoryData.description || null,
          image_url: categoryData.image || null,
          parent_id: categoryData.parentId || null,
          sort_order: categoryData.sortOrder || 0,
          is_active: categoryData.isActive !== undefined ? categoryData.isActive : true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDB(data);
    } catch (error) {
      handleDatabaseError(error, 'Create category');
    }
  },

  async update(id: string, updates: Partial<Category>) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.image !== undefined) updateData.image_url = updates.image;
      if (updates.parentId !== undefined) updateData.parent_id = updates.parentId;
      if (updates.sortOrder !== undefined) updateData.sort_order = updates.sortOrder;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

      const { data, error } = await supabase
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDB(data);
    } catch (error) {
      handleDatabaseError(error, 'Update category');
    }
  },

  async delete(id: string) {
    try {
      // Check if category has products
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', id);

      if (count && count > 0) {
        throw new Error('Cannot delete category with products. Please move or delete products first.');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleDatabaseError(error, 'Delete category');
    }
  },

  mapFromDB(data: any): Category {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      image: data.image_url || '',
      parentId: data.parent_id,
      isActive: data.is_active,
      sortOrder: data.sort_order || 0,
      productCount: data.productCount || 0,
      createdAt: data.created_at ? new Date(data.created_at) : undefined,
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }
};

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

export const productService = {
  async getAll(filters: {
    categoryId?: string;
    categorySlug?: string;
    seller?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
    isActive?: boolean;
  } = {}) {
    try {
      const { limit = 50, offset = 0 } = filters;

      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug),
          profiles(full_name)
        `)
        .eq('is_active', filters.isActive ?? true);

      if (filters.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters.categorySlug) {
        query = query.eq('categories.slug', filters.categorySlug);
      }
      if (filters.seller) {
        query = query.eq('seller_id', filters.seller);
      }
      if (filters.featured) {
        query = query.eq('is_featured', true);
      }
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      return data?.map(this.mapFromDB) || [];
    } catch (error) {
      handleDatabaseError(error, 'Get products');
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(name, slug),
          profiles(full_name),
          reviews(
            *,
            profiles(full_name, avatar_url)
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      return data ? this.mapFromDB(data) : null;
    } catch (error) {
      handleDatabaseError(error, 'Get product by ID');
    }
  },

  async create(productData: Omit<Product, 'id' | 'createdAt' | 'reviews' | 'rating' | 'reviewCount'>) {
    try {
      validateRequired(productData, ['name', 'price', 'categoryId']);

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productData.name,
          slug: productData.slug || productData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: productData.description || '',
          short_description: productData.shortDescription || null,
          price: productData.price,
          original_price: productData.originalPrice || null,
          category_id: productData.categoryId,
          seller_id: productData.sellerId,
          images: productData.images || [],
          stock: productData.stock || 0,
          min_stock_level: productData.minStockLevel || 5,
          sku: productData.sku || null,
          weight: productData.weight || null,
          dimensions: productData.dimensions || null,
          tags: productData.tags || [],
          specifications: productData.specifications || {},
          is_featured: productData.featured || false,
          is_active: productData.isActive !== undefined ? productData.isActive : true,
          meta_title: productData.metaTitle || null,
          meta_description: productData.metaDescription || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDB(data);
    } catch (error) {
      handleDatabaseError(error, 'Create product');
    }
  },

  async update(id: string, updates: Partial<Product>) {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.slug !== undefined) updateData.slug = updates.slug;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.shortDescription !== undefined) updateData.short_description = updates.shortDescription;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.originalPrice !== undefined) updateData.original_price = updates.originalPrice;
      if (updates.categoryId !== undefined) updateData.category_id = updates.categoryId;
      if (updates.images !== undefined) updateData.images = updates.images;
      if (updates.stock !== undefined) updateData.stock = updates.stock;
      if (updates.minStockLevel !== undefined) updateData.min_stock_level = updates.minStockLevel;
      if (updates.sku !== undefined) updateData.sku = updates.sku;
      if (updates.weight !== undefined) updateData.weight = updates.weight;
      if (updates.dimensions !== undefined) updateData.dimensions = updates.dimensions;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.specifications !== undefined) updateData.specifications = updates.specifications;
      if (updates.featured !== undefined) updateData.is_featured = updates.featured;
      if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
      if (updates.metaTitle !== undefined) updateData.meta_title = updates.metaTitle;
      if (updates.metaDescription !== undefined) updateData.meta_description = updates.metaDescription;

      const { data, error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return this.mapFromDB(data);
    } catch (error) {
      handleDatabaseError(error, 'Update product');
    }
  },

  async delete(id: string) {
    try {
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleDatabaseError(error, 'Delete product');
    }
  },

  mapFromDB(data: any): Product {
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

    return {
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
      stock: data.stock || 0,
      minStockLevel: data.min_stock_level,
      sku: data.sku,
      weight: data.weight,
      dimensions: data.dimensions,
      rating: parseFloat(data.rating) || 0,
      reviewCount: data.review_count || 0,
      reviews: data.reviews?.map((review: any) => ({
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
        }
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
      updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
    };
  }
};

export default {
  user: userService,
  category: categoryService,
  product: productService
};

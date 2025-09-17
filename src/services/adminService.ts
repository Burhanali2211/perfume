/**
 * Enhanced Admin Service
 * Provides comprehensive CRUD operations with real-time updates and cache invalidation
 */

import { supabase } from '../lib/supabase';
import { handleDatabaseError, validateRequired } from './backendService';
import { invalidateProductCache, invalidateCategoryCache } from '../utils/cache';

// ==========================================
// REAL-TIME UPDATES SERVICE
// ==========================================

export class AdminRealtimeService {
  private subscriptions: Map<string, unknown> = new Map();

  // Subscribe to table changes
  subscribeToTable(tableName: string, callback: (payload: Record<string, unknown>) => void) {
    const subscription = supabase
      .channel(`admin-${tableName}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: tableName },
        callback
      )
      .subscribe();

    this.subscriptions.set(tableName, subscription);
    return subscription;
  }

  // Unsubscribe from table changes
  unsubscribeFromTable(tableName: string) {
    const subscription = this.subscriptions.get(tableName);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(tableName);
    }
  }

  // Unsubscribe from all tables
  unsubscribeAll() {
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();
  }
}

// ==========================================
// ENHANCED ADMIN CRUD SERVICE
// ==========================================

export class AdminCRUDService {
  private realtimeService = new AdminRealtimeService();

  // Generic CRUD operations for any table
  async create(tableName: string, data: Record<string, unknown>, requiredFields: string[] = []) {
    try {
      if (requiredFields.length > 0) {
        validateRequired(data, requiredFields);
      }

      const insertData = {
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Invalidate relevant caches
      this.invalidateCache(tableName);

      return result;
    } catch (error) {
      handleDatabaseError(error, `Create ${tableName}`);
    }
  }

  async read(tableName: string, options: {
    select?: string;
    filters?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      let query = supabase.from(tableName);

      if (options.select) {
        query = query.select(options.select);
      } else {
        query = query.select('*');
      }

      // Apply filters
      if (options.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }

      // Apply pagination
      if (options.limit) {
        const offset = options.offset || 0;
        query = query.range(offset, offset + options.limit - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data: data || [], count };
    } catch (error) {
      handleDatabaseError(error, `Read ${tableName}`);
    }
  }

  async update(tableName: string, id: string, data: Record<string, unknown>) {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Invalidate relevant caches
      this.invalidateCache(tableName);

      return result;
    } catch (error) {
      handleDatabaseError(error, `Update ${tableName}`);
    }
  }

  async delete(tableName: string, id: string) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Invalidate relevant caches
      this.invalidateCache(tableName);

      return true;
    } catch (error) {
      handleDatabaseError(error, `Delete ${tableName}`);
    }
  }

  async bulkDelete(tableName: string, ids: string[]) {
    try {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .in('id', ids);

      if (error) throw error;

      // Invalidate relevant caches
      this.invalidateCache(tableName);

      return true;
    } catch (error) {
      handleDatabaseError(error, `Bulk delete ${tableName}`);
    }
  }

  async bulkUpdate(tableName: string, updates: Array<{ id: string; data: Record<string, unknown> }>) {
    try {
      const promises = updates.map(({ id, data }) => 
        this.update(tableName, id, data)
      );

      const results = await Promise.all(promises);

      // Invalidate relevant caches
      this.invalidateCache(tableName);

      return results;
    } catch (error) {
      handleDatabaseError(error, `Bulk update ${tableName}`);
    }
  }

  // Cache invalidation
  private invalidateCache(tableName: string) {
    switch (tableName) {
      case 'products':
        invalidateProductCache();
        break;
      case 'categories':
        invalidateCategoryCache();
        break;
      // Add more cache invalidation as needed
    }
  }

  // Subscribe to real-time updates
  subscribeToUpdates(tableName: string, callback: (payload: Record<string, unknown>) => void) {
    return this.realtimeService.subscribeToTable(tableName, callback);
  }

  // Cleanup subscriptions
  cleanup() {
    this.realtimeService.unsubscribeAll();
  }
}

// Export singleton instance
export const adminService = new AdminCRUDService();

// ==========================================
// SPECIALIZED ADMIN OPERATIONS
// ==========================================

export const adminOperations = {
  // Product operations
  async toggleProductStatus(productId: string, isActive: boolean) {
    return adminService.update('products', productId, { is_active: isActive });
  },

  async toggleProductFeatured(productId: string, isFeatured: boolean) {
    return adminService.update('products', productId, { is_featured: isFeatured });
  },

  async updateProductStock(productId: string, stock: number) {
    return adminService.update('products', productId, { stock });
  },

  // Category operations
  async toggleCategoryStatus(categoryId: string, isActive: boolean) {
    return adminService.update('categories', categoryId, { is_active: isActive });
  },

  // User operations
  async toggleUserStatus(userId: string, isActive: boolean) {
    return adminService.update('profiles', userId, { is_active: isActive });
  },

  async changeUserRole(userId: string, role: string) {
    return adminService.update('profiles', userId, { role });
  },

  // Order operations
  async updateOrderStatus(orderId: string, status: string) {
    return adminService.update('orders', orderId, { status });
  },

  async updatePaymentStatus(orderId: string, paymentStatus: string) {
    return adminService.update('orders', orderId, { payment_status: paymentStatus });
  }
};

export default adminService;

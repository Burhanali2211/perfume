import { supabase } from '../lib/supabase';

/**
 * Cache Invalidation Service
 * Manages cache invalidation across the application to ensure
 * frontend-backend synchronization and real-time updates
 */

interface CacheEntry {
  key: string;
  timestamp: number;
  data: unknown;
}

interface CacheInvalidationEvent {
  type: 'invalidate' | 'update' | 'delete';
  table: string;
  id?: string;
  data?: unknown;
  timestamp: number;
}

class CacheInvalidationService {
  private cache = new Map<string, CacheEntry>();
  private subscribers = new Map<string, Set<(data: unknown) => void>>();
  private realtimeSubscriptions = new Map<string, unknown>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.setupRealtimeSubscriptions();
  }

  /**
   * Set up real-time subscriptions for automatic cache invalidation
   */
  private setupRealtimeSubscriptions() {
    const tables = ['products', 'categories', 'collections', 'new_arrivals', 'offers', 'orders', 'profiles'];
    
    tables.forEach(table => {
      const subscription = supabase
        .channel(`cache-invalidation-${table}`)
        .on('postgres_changes', 
          { event: '*', schema: 'public', table },
          (payload) => {
            this.handleRealtimeEvent(table, payload);
          }
        )
        .subscribe();

      this.realtimeSubscriptions.set(table, subscription);
    });
  }

  /**
   * Handle real-time database events
   */
  private handleRealtimeEvent(table: string, payload: Record<string, unknown>) {
    const event: CacheInvalidationEvent = {
      type: payload.eventType === 'INSERT' ? 'update' : 
            payload.eventType === 'UPDATE' ? 'update' : 'delete',
      table,
      id: payload.new?.id || payload.old?.id,
      data: payload.new,
      timestamp: Date.now()
    };

    this.processInvalidationEvent(event);
  }

  /**
   * Process cache invalidation events
   */
  private processInvalidationEvent(event: CacheInvalidationEvent) {
    // Invalidate specific item cache
    if (event.id) {
      this.invalidateCache(`${event.table}:${event.id}`);
    }

    // Invalidate list caches
    this.invalidateCache(`${event.table}:list`);
    this.invalidateCache(`${event.table}:all`);

    // Invalidate related caches
    this.invalidateRelatedCaches(event.table, event.id);

    // Notify subscribers
    this.notifySubscribers(event.table, event);
  }

  /**
   * Invalidate related caches based on table relationships
   */
  private invalidateRelatedCaches(table: string, id?: string) {
    switch (table) {
      case 'products':
        // Invalidate category caches when products change
        this.invalidateCache('categories:list');
        this.invalidateCache('categories:with-products');
        // Invalidate collection caches
        this.invalidateCache('collections:list');
        this.invalidateCache('new_arrivals:list');
        break;

      case 'categories':
        // Invalidate product caches when categories change
        this.invalidateCache('products:list');
        this.invalidateCache('products:by-category');
        break;

      case 'orders':
        // Invalidate user and product caches
        this.invalidateCache('profiles:list');
        this.invalidateCache('products:list');
        break;

      case 'collections':
      case 'new_arrivals':
      case 'offers':
        // Invalidate product caches
        this.invalidateCache('products:list');
        this.invalidateCache('products:featured');
        break;
    }
  }

  /**
   * Set cache entry
   */
  setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      key,
      timestamp: Date.now(),
      data
    });
  }

  /**
   * Get cache entry
   */
  getCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalidate specific cache entry
   */
  invalidateCache(key: string): void {
    this.cache.delete(key);
    console.log(`Cache invalidated: ${key}`);
  }

  /**
   * Invalidate all cache entries for a table
   */
  invalidateTableCache(table: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.startsWith(`${table}:`)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    console.log(`Table cache invalidated: ${table} (${keysToDelete.length} entries)`);
  }

  /**
   * Clear all cache
   */
  clearAllCache(): void {
    this.cache.clear();
    console.log('All cache cleared');
  }

  /**
   * Subscribe to cache invalidation events
   */
  subscribe(table: string, callback: (data: unknown) => void): () => void {
    if (!this.subscribers.has(table)) {
      this.subscribers.set(table, new Set());
    }

    this.subscribers.get(table)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.get(table)?.delete(callback);
    };
  }

  /**
   * Notify subscribers of cache invalidation events
   */
  private notifySubscribers(table: string, event: CacheInvalidationEvent): void {
    const tableSubscribers = this.subscribers.get(table);
    if (tableSubscribers) {
      tableSubscribers.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in cache invalidation subscriber:', error);
        }
      });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    totalEntries: number;
    expiredEntries: number;
    tables: Record<string, number>;
  } {
    const now = Date.now();
    let expiredEntries = 0;
    const tables: Record<string, number> = {};

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        expiredEntries++;
      }

      const table = key.split(':')[0];
      tables[table] = (tables[table] || 0) + 1;
    }

    return {
      totalEntries: this.cache.size,
      expiredEntries,
      tables
    };
  }

  /**
   * Cleanup expired cache entries
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup: removed ${keysToDelete.length} expired entries`);
    }
  }

  /**
   * Destroy the service and cleanup subscriptions
   */
  destroy(): void {
    // Unsubscribe from all real-time subscriptions
    for (const [table, subscription] of this.realtimeSubscriptions) {
      supabase.removeChannel(subscription);
    }

    this.realtimeSubscriptions.clear();
    this.subscribers.clear();
    this.cache.clear();
  }
}

// Create singleton instance
export const cacheInvalidationService = new CacheInvalidationService();

// Setup periodic cleanup
setInterval(() => {
  cacheInvalidationService.cleanup();
}, 60000); // Cleanup every minute

export default cacheInvalidationService;

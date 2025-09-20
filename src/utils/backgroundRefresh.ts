/**
 * Background refresh system for keeping cache data fresh
 */

import { getProductsBasic, getCategories } from '../lib/supabase';
import { productCache, categoryCache, generateCacheKey } from './cache';

interface RefreshConfig {
  interval: number; // milliseconds
  enabled: boolean;
  maxRetries: number;
}

class BackgroundRefreshManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRefreshing: Map<string, boolean> = new Map();
  private retryCount: Map<string, number> = new Map();

  private defaultConfig: RefreshConfig = {
    interval: 30 * 60 * 1000, // 30 minutes (much less aggressive)
    enabled: false, // Temporarily disabled to prevent conflicts
    maxRetries: 1 // Minimal retries
  };

  /**
   * Start background refresh for products
   */
  startProductRefresh(config: Partial<RefreshConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Disable background refresh in development to avoid conflicts
    if (import.meta.env.DEV) {
      console.log('🔄 Background product refresh disabled in development');
      return;
    }
    
    if (!finalConfig.enabled) return;

    this.stopRefresh('products');
    
    const interval = setInterval(async () => {
      await this.refreshProducts(finalConfig.maxRetries);
    }, finalConfig.interval);

    this.intervals.set('products', interval);
    console.log('🔄 Started background product refresh');
  }

  /**
   * Start background refresh for categories
   */
  startCategoryRefresh(config: Partial<RefreshConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    // Disable background refresh in development to avoid conflicts
    if (import.meta.env.DEV) {
      console.log('🔄 Background category refresh disabled in development');
      return;
    }
    
    if (!finalConfig.enabled) return;

    this.stopRefresh('categories');
    
    const interval = setInterval(async () => {
      await this.refreshCategories(finalConfig.maxRetries);
    }, finalConfig.interval);

    this.intervals.set('categories', interval);
    console.log('🔄 Started background category refresh');
  }

  /**
   * Refresh products in background
   */
  private async refreshProducts(maxRetries: number) {
    const key = 'products';
    
    if (this.isRefreshing.get(key)) {
      return; // Already refreshing
    }

    this.isRefreshing.set(key, true);

    try {
      // Only refresh if we have cached data (don't fetch if cache is empty)
      const cacheKey = generateCacheKey('products-basic');
      const hasCache = productCache.has(cacheKey);

      if (!hasCache) {
        this.isRefreshing.set(key, false);
        return;
      }

      console.log('🔄 Background refreshing products...');
      const freshProducts = await getProductsBasic();
      
      // Update cache with fresh data
      productCache.set(cacheKey, freshProducts);
      
      // Reset retry count on success
      this.retryCount.set(key, 0);
      
      console.log('✅ Products refreshed in background');
    } catch (error) {
      console.warn('⚠️ Background product refresh failed:', error);
      
      const retries = this.retryCount.get(key) || 0;
      this.retryCount.set(key, retries + 1);

      // Stop refreshing if max retries reached
      if (retries >= maxRetries) {
        console.error('❌ Max retries reached for product refresh, stopping...');
        this.stopRefresh(key);
      }
    } finally {
      this.isRefreshing.set(key, false);
    }
  }

  /**
   * Refresh categories in background
   */
  private async refreshCategories(maxRetries: number) {
    const key = 'categories';
    
    if (this.isRefreshing.get(key)) {
      return; // Already refreshing
    }

    this.isRefreshing.set(key, true);

    try {
      // Only refresh if we have cached data
      const cacheKey = generateCacheKey('categories');
      const hasCache = categoryCache.has(cacheKey);

      if (!hasCache) {
        this.isRefreshing.set(key, false);
        return;
      }

      console.log('🔄 Background refreshing categories...');
      const freshCategories = await getCategories();
      
      // Update cache with fresh data
      categoryCache.set(cacheKey, freshCategories);
      
      // Reset retry count on success
      this.retryCount.set(key, 0);
      
      console.log('✅ Categories refreshed in background');
    } catch (error) {
      console.warn('⚠️ Background category refresh failed:', error);
      
      const retries = this.retryCount.get(key) || 0;
      this.retryCount.set(key, retries + 1);

      // Stop refreshing if max retries reached
      if (retries >= maxRetries) {
        console.error('❌ Max retries reached for category refresh, stopping...');
        this.stopRefresh(key);
      }
    } finally {
      this.isRefreshing.set(key, false);
    }
  }

  /**
   * Stop background refresh for a specific key
   */
  stopRefresh(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
      this.isRefreshing.delete(key);
      this.retryCount.delete(key);
      console.log(`🛑 Stopped background refresh for ${key}`);
    }
  }

  /**
   * Stop all background refreshes
   */
  stopAllRefreshes() {
    for (const key of this.intervals.keys()) {
      this.stopRefresh(key);
    }
    console.log('🛑 Stopped all background refreshes');
  }

  /**
   * Get refresh status
   */
  getStatus() {
    const status: Record<string, { active: boolean; refreshing: boolean; lastRefresh?: Date; nextRefresh?: Date }> = {};
    
    for (const [key, interval] of this.intervals.entries()) {
      status[key] = {
        active: !!interval,
        refreshing: this.isRefreshing.get(key) || false,
        retryCount: this.retryCount.get(key) || 0
      };
    }
    
    return status;
  }

  /**
   * Force refresh now (not in background)
   */
  async forceRefresh(type: 'products' | 'categories' | 'all') {
    if (type === 'products' || type === 'all') {
      await this.refreshProducts(1);
    }
    
    if (type === 'categories' || type === 'all') {
      await this.refreshCategories(1);
    }
  }
}

// Create singleton instance
export const backgroundRefreshManager = new BackgroundRefreshManager();

// Auto-start refreshes when module loads (only in browser)
if (typeof window !== 'undefined') {
  // Start with a delay to allow initial page load
  setTimeout(() => {
    backgroundRefreshManager.startProductRefresh({
      interval: 30 * 60 * 1000, // 30 minutes for products in production
      enabled: !import.meta.env.DEV // Disable in development
    });
    
    backgroundRefreshManager.startCategoryRefresh({
      interval: 60 * 60 * 1000, // 60 minutes for categories in production
      enabled: !import.meta.env.DEV // Disable in development
    });
  }, 30000); // Start after 30 seconds

  // Stop refreshes when page is about to unload
  window.addEventListener('beforeunload', () => {
    backgroundRefreshManager.stopAllRefreshes();
  });

  // Pause refreshes when page is not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      backgroundRefreshManager.stopAllRefreshes();
    } else {
      // Restart when page becomes visible again
      setTimeout(() => {
        backgroundRefreshManager.startProductRefresh();
        backgroundRefreshManager.startCategoryRefresh();
      }, 5000);
    }
  });
}

export default backgroundRefreshManager;
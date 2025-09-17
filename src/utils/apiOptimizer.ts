/**
 * API Optimizer - Reduces redundant API calls and optimizes network requests
 */

interface RequestCache {
  [key: string]: {
    data: any;
    timestamp: number;
    promise?: Promise<any>;
  };
}

interface RequestQueue {
  [key: string]: Promise<any> | undefined;
}

class APIOptimizer {
  private cache: RequestCache = {};
  private requestQueue: RequestQueue = {};
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly REQUEST_TIMEOUT = 30000; // Increased from 10 seconds to 30 seconds

  /**
   * Deduplicate identical requests
   */
  async deduplicateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // If request is already in progress, return the existing promise
    if (this.requestQueue[key]) {
      console.log(`🔄 Deduplicating request: ${key}`);
      return this.requestQueue[key]!;
    }

    // Check cache first
    const cached = this.getFromCache(key);
    if (cached) {
      console.log(`📦 Using cached data: ${key}`);
      return cached;
    }

    // Create new request with timeout
    const requestPromise = this.withTimeout(requestFn(), this.REQUEST_TIMEOUT);
    
    // Store in queue to prevent duplicates
    this.requestQueue[key] = requestPromise;

    try {
      const result = await requestPromise;
      
      // Cache the result
      this.setCache(key, result);
      
      return result;
    } catch (error) {
      console.error(`❌ Request failed: ${key}`, error);
      throw error;
    } finally {
      // Remove from queue
      delete this.requestQueue[key];
    }
  }

  /**
   * Batch multiple requests together
   */
  async batchRequests<T>(requests: Array<{ key: string; fn: () => Promise<T> }>): Promise<T[]> {
    console.log(`🔄 Batching ${requests.length} requests`);
    
    const promises = requests.map(({ key, fn }) => 
      this.deduplicateRequest(key, fn)
    );

    try {
      return await Promise.all(promises);
    } catch (error) {
      console.error('❌ Batch request failed:', error);
      throw error;
    }
  }

  /**
   * Get data from cache if valid
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache[key];
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    if (isExpired) {
      delete this.cache[key];
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache[key] = {
      data,
      timestamp: Date.now()
    };

    // Clean up old cache entries
    this.cleanupCache();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > this.CACHE_DURATION) {
        delete this.cache[key];
      }
    });
  }

  /**
   * Add timeout to promises
   */
  private withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), timeout)
      )
    ]);
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache = {};
    console.log('🗑️ Cache cleared');
  }

  /**
   * Clear specific cache entry
   */
  clearCacheEntry(key: string): void {
    delete this.cache[key];
    console.log(`🗑️ Cache entry cleared: ${key}`);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { entries: number; size: string } {
    const entries = Object.keys(this.cache).length;
    const size = JSON.stringify(this.cache).length;
    return {
      entries,
      size: `${(size / 1024).toFixed(2)} KB`
    };
  }

  /**
   * Preload data for better performance
   */
  async preloadData(requests: Array<{ key: string; fn: () => Promise<any> }>): Promise<void> {
    console.log(`🚀 Preloading ${requests.length} data requests`);
    
    // Run preload requests in background without blocking
    requests.forEach(({ key, fn }) => {
      this.deduplicateRequest(key, fn).catch(error => {
        console.warn(`⚠️ Preload failed for ${key}:`, error);
      });
    });
  }

  /**
   * Create optimized fetch function
   */
  createOptimizedFetch() {
    return async (url: string, options?: RequestInit) => {
      const key = `fetch:${url}:${JSON.stringify(options)}`;
      
      return this.deduplicateRequest(key, async () => {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(this.REQUEST_TIMEOUT)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
      });
    };
  }

  /**
   * Retry failed requests with exponential backoff
   */
  async retryRequest<T>(
    requestFn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
}

// Create singleton instance
export const apiOptimizer = new APIOptimizer();

// Export utility functions
export const deduplicateRequest = apiOptimizer.deduplicateRequest.bind(apiOptimizer);
export const batchRequests = apiOptimizer.batchRequests.bind(apiOptimizer);
export const optimizedFetch = apiOptimizer.createOptimizedFetch();
export const retryRequest = apiOptimizer.retryRequest.bind(apiOptimizer);

// Export for manual cache management
export const clearCache = apiOptimizer.clearCache.bind(apiOptimizer);
export const clearCacheEntry = apiOptimizer.clearCacheEntry.bind(apiOptimizer);
export const getCacheStats = apiOptimizer.getCacheStats.bind(apiOptimizer);
export const preloadData = apiOptimizer.preloadData.bind(apiOptimizer);

export default apiOptimizer;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of items in cache
}

class Cache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private defaultTTL: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || 5 * 60 * 1000; // 5 minutes default
    this.maxSize = options.maxSize || 100;
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    // Remove oldest items if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    
    if (!item) {
      return false;
    }

    // Check if item has expired
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Get all keys that match a pattern
  getKeysMatching(pattern: string): string[] {
    const regex = new RegExp(pattern);
    return Array.from(this.cache.keys()).filter(key => regex.test(key));
  }

  // Invalidate all keys that match a pattern
  invalidatePattern(pattern: string): void {
    const keysToDelete = this.getKeysMatching(pattern);
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let validItems = 0;
    let expiredItems = 0;

    for (const [, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredItems++;
      } else {
        validItems++;
      }
    }

    return {
      totalItems: this.cache.size,
      validItems,
      expiredItems,
      maxSize: this.maxSize,
      usage: (this.cache.size / this.maxSize) * 100
    };
  }

  // Clean up expired items
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }
}

// Create cache instances for different data types
export const productCache = new Cache({
  ttl: 3 * 60 * 1000, // 3 minutes for products (faster updates)
  maxSize: 300
});

export const categoryCache = new Cache({
  ttl: 10 * 60 * 1000, // 10 minutes for categories
  maxSize: 50
});

export const userCache = new Cache({
  ttl: 5 * 60 * 1000, // 5 minutes for user data
  maxSize: 100
});

// Utility functions for cache key generation
export const generateCacheKey = (prefix: string, params: Record<string, unknown> = {}): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return sortedParams ? `${prefix}:${sortedParams}` : prefix;
};

// Cache invalidation helpers
export const invalidateProductCache = (productId?: string) => {
  if (productId) {
    productCache.invalidatePattern(`.*${productId}.*`);
  } else {
    productCache.clear();
  }
};

export const invalidateCategoryCache = () => {
  categoryCache.clear();
};

export const invalidateUserCache = (userId?: string) => {
  if (userId) {
    userCache.invalidatePattern(`.*${userId}.*`);
  } else {
    userCache.clear();
  }
};

// Periodic cleanup
setInterval(() => {
  productCache.cleanup();
  categoryCache.cleanup();
  userCache.cleanup();
}, 5 * 60 * 1000); // Cleanup every 5 minutes

export default Cache;

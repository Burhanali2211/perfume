import { Product } from '../types';

const RECENTLY_VIEWED_KEY = 'recentlyViewed';
const MAX_RECENTLY_VIEWED = 20;

export interface RecentlyViewedItem {
  productId: string;
  viewedAt: number;
  sessionId: string;
}

class RecentlyViewedService {
  private sessionId: string;

  constructor() {
    // Generate a session ID for this browsing session
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add a product to recently viewed list
   */
  addProduct(productId: string): void {
    try {
      const recentlyViewed = this.getRecentlyViewed();
      
      // Remove existing entry if it exists
      const filteredItems = recentlyViewed.filter(item => item.productId !== productId);
      
      // Add new entry at the beginning
      const newItem: RecentlyViewedItem = {
        productId,
        viewedAt: Date.now(),
        sessionId: this.sessionId
      };
      
      const updatedItems = [newItem, ...filteredItems].slice(0, MAX_RECENTLY_VIEWED);
      
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updatedItems));
      
      // Dispatch custom event for components to listen to
      window.dispatchEvent(new CustomEvent('recentlyViewedUpdated', {
        detail: { productId, items: updatedItems }
      }));
    } catch (error) {
      console.error('Error adding product to recently viewed:', error);
    }
  }

  /**
   * Get recently viewed products
   */
  getRecentlyViewed(): RecentlyViewedItem[] {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (!stored) return [];
      
      const items: RecentlyViewedItem[] = JSON.parse(stored);
      
      // Filter out items older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const validItems = items.filter(item => item.viewedAt > thirtyDaysAgo);
      
      // Update storage if we filtered out old items
      if (validItems.length !== items.length) {
        localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(validItems));
      }
      
      return validItems;
    } catch (error) {
      console.error('Error getting recently viewed products:', error);
      return [];
    }
  }

  /**
   * Get recently viewed product IDs only
   */
  getRecentlyViewedIds(): string[] {
    return this.getRecentlyViewed().map(item => item.productId);
  }

  /**
   * Remove a product from recently viewed
   */
  removeProduct(productId: string): void {
    try {
      const recentlyViewed = this.getRecentlyViewed();
      const filteredItems = recentlyViewed.filter(item => item.productId !== productId);
      
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(filteredItems));
      
      window.dispatchEvent(new CustomEvent('recentlyViewedUpdated', {
        detail: { productId, items: filteredItems, action: 'removed' }
      }));
    } catch (error) {
      console.error('Error removing product from recently viewed:', error);
    }
  }

  /**
   * Clear all recently viewed products
   */
  clearAll(): void {
    try {
      localStorage.removeItem(RECENTLY_VIEWED_KEY);
      
      window.dispatchEvent(new CustomEvent('recentlyViewedUpdated', {
        detail: { items: [], action: 'cleared' }
      }));
    } catch (error) {
      console.error('Error clearing recently viewed products:', error);
    }
  }

  /**
   * Get recently viewed products with full product data
   */
  getRecentlyViewedProducts(allProducts: Product[]): Product[] {
    const recentlyViewedIds = this.getRecentlyViewedIds();
    
    // Maintain the order from recently viewed
    return recentlyViewedIds
      .map(id => allProducts.find(product => product.id === id))
      .filter((product): product is Product => product !== undefined);
  }

  /**
   * Get analytics data for recently viewed products
   */
  getAnalytics(): {
    totalViewed: number;
    uniqueProducts: number;
    averageViewsPerSession: number;
    topViewedCategories: { category: string; count: number }[];
    viewingPatterns: { hour: number; count: number }[];
  } {
    const items = this.getRecentlyViewed();
    const uniqueProducts = new Set(items.map(item => item.productId)).size;
    const sessions = new Set(items.map(item => item.sessionId)).size;
    
    // Calculate viewing patterns by hour
    const hourCounts: Record<number, number> = {};
    items.forEach(item => {
      const hour = new Date(item.viewedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const viewingPatterns = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => a.hour - b.hour);
    
    return {
      totalViewed: items.length,
      uniqueProducts,
      averageViewsPerSession: sessions > 0 ? items.length / sessions : 0,
      topViewedCategories: [], // Would need product data to calculate
      viewingPatterns
    };
  }

  /**
   * Get recommendations based on recently viewed products
   */
  getViewingBasedRecommendations(allProducts: Product[], maxRecommendations: number = 8): Product[] {
    const recentlyViewedProducts = this.getRecentlyViewedProducts(allProducts);
    
    if (recentlyViewedProducts.length === 0) {
      // Return popular products if no viewing history
      return allProducts
        .filter(p => p.featured || p.rating >= 4.0)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, maxRecommendations);
    }
    
    // Get categories and brands from recently viewed
    const viewedCategories = [...new Set(recentlyViewedProducts.map(p => p.category))];
    const viewedBrands = [...new Set(recentlyViewedProducts.map(p => p.brand).filter(Boolean))];
    const viewedIds = new Set(recentlyViewedProducts.map(p => p.id));
    
    // Score products based on similarity to viewing history
    const scoredProducts = allProducts
      .filter(product => !viewedIds.has(product.id))
      .map(product => {
        let score = 0;
        
        // Category match
        if (viewedCategories.includes(product.category)) score += 30;
        
        // Brand match
        if (product.brand && viewedBrands.includes(product.brand)) score += 20;
        
        // Rating boost
        score += product.rating * 10;
        
        // Featured product boost
        if (product.featured) score += 15;
        
        // Price similarity to viewed products
        const avgViewedPrice = recentlyViewedProducts.reduce((sum, p) => sum + p.price, 0) / recentlyViewedProducts.length;
        const priceDiff = Math.abs(product.price - avgViewedPrice) / avgViewedPrice;
        if (priceDiff <= 0.5) score += 10; // Within 50% of average viewed price
        
        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
      .map(item => item.product);
    
    return scoredProducts;
  }

  /**
   * Check if a product was recently viewed
   */
  isRecentlyViewed(productId: string): boolean {
    return this.getRecentlyViewedIds().includes(productId);
  }

  /**
   * Get the last viewed timestamp for a product
   */
  getLastViewedTime(productId: string): number | null {
    const items = this.getRecentlyViewed();
    const item = items.find(item => item.productId === productId);
    return item ? item.viewedAt : null;
  }
}

// Export singleton instance
export const recentlyViewedService = new RecentlyViewedService();

// Export hook for React components
export const useRecentlyViewed = () => {
  return {
    addProduct: (productId: string) => recentlyViewedService.addProduct(productId),
    getRecentlyViewed: () => recentlyViewedService.getRecentlyViewed(),
    getRecentlyViewedIds: () => recentlyViewedService.getRecentlyViewedIds(),
    getRecentlyViewedProducts: (allProducts: Product[]) => recentlyViewedService.getRecentlyViewedProducts(allProducts),
    removeProduct: (productId: string) => recentlyViewedService.removeProduct(productId),
    clearAll: () => recentlyViewedService.clearAll(),
    isRecentlyViewed: (productId: string) => recentlyViewedService.isRecentlyViewed(productId),
    getLastViewedTime: (productId: string) => recentlyViewedService.getLastViewedTime(productId),
    getViewingBasedRecommendations: (allProducts: Product[], maxRecommendations?: number) => 
      recentlyViewedService.getViewingBasedRecommendations(allProducts, maxRecommendations),
    getAnalytics: () => recentlyViewedService.getAnalytics()
  };
};

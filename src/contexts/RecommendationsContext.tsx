import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '../types';
import { useProducts } from './ProductContext';
import { recentlyViewedService } from '../services/recentlyViewedService';

interface RecommendationData {
  related: Product[];
  frequentlyBought: Product[];
  youMayLike: Product[];
  recentlyViewed: Product[];
  trending: Product[];
  newArrivals: Product[];
}

interface RecommendationsContextType {
  recommendations: RecommendationData;
  loading: boolean;
  error: string | null;
  
  // Methods
  getRelatedProducts: (productId: string, maxItems?: number) => Product[];
  getFrequentlyBoughtTogether: (productId: string, maxItems?: number) => Product[];
  getPersonalizedRecommendations: (maxItems?: number) => Product[];
  getRecentlyViewed: (maxItems?: number) => Product[];
  getTrendingProducts: (maxItems?: number) => Product[];
  getNewArrivals: (maxItems?: number) => Product[];
  
  // Recently viewed management
  addToRecentlyViewed: (productId: string) => void;
  removeFromRecentlyViewed: (productId: string) => void;
  clearRecentlyViewed: () => void;
  
  // Analytics
  getRecommendationAnalytics: () => any;
  
  // Refresh recommendations
  refreshRecommendations: (productId?: string) => void;
}

const RecommendationsContext = createContext<RecommendationsContextType | undefined>(undefined);

interface RecommendationsProviderProps {
  children: ReactNode;
}

export const RecommendationsProvider: React.FC<RecommendationsProviderProps> = ({ children }) => {
  const { products } = useProducts();
  const [recommendations, setRecommendations] = useState<RecommendationData>({
    related: [],
    frequentlyBought: [],
    youMayLike: [],
    recentlyViewed: [],
    trending: [],
    newArrivals: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Advanced recommendation algorithms
  const calculateProductSimilarity = (product1: Product, product2: Product): number => {
    let score = 0;
    
    // Category similarity (40% weight)
    if (product1.category === product2.category) score += 40;
    
    // Price similarity (25% weight) - within 30% range
    const priceDiff = Math.abs(product1.price - product2.price) / Math.max(product1.price, product2.price);
    if (priceDiff <= 0.3) score += 25;
    
    // Brand similarity (20% weight) - using seller name
    if (product1.sellerName && product2.sellerName && product1.sellerName === product2.sellerName) score += 20;
    
    // Rating similarity (10% weight)
    const ratingDiff = Math.abs(product1.rating - product2.rating);
    if (ratingDiff <= 0.5) score += 10;
    
    // Tag similarity (5% weight)
    if (product1.tags && product2.tags) {
      const commonTags = product1.tags.filter(tag => product2.tags!.includes(tag));
      score += (commonTags.length / Math.max(product1.tags.length, product2.tags.length)) * 5;
    }
    
    return score;
  };

  const getRelatedProducts = (productId: string, maxItems: number = 4): Product[] => {
    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return [];

    return products
      .filter(p => p.id !== productId)
      .map(product => ({
        product,
        score: calculateProductSimilarity(currentProduct, product)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(item => item.product);
  };

  const getFrequentlyBoughtTogether = (productId: string, maxItems: number = 3): Product[] => {
    const currentProduct = products.find(p => p.id === productId);
    if (!currentProduct) return [];

    // Simulate frequently bought together logic
    const complementaryCategories: Record<string, string[]> = {
      'Oudh Attars': ['Amber Attars', 'Sandalwood Attars', 'Musk Attars'],
      'Floral Attars': ['Jasmine Attars', 'Rose Attars', 'Attar Blends'],
      'Musk Attars': ['Oudh Attars', 'Amber Attars', 'Heritage Attars'],
      'Amber Attars': ['Oudh Attars', 'Saffron Attars', 'Musk Attars'],
      'Saffron Attars': ['Amber Attars', 'Heritage Attars', 'Attar Blends'],
      'Sandalwood Attars': ['Oudh Attars', 'Musk Attars', 'Floral Attars'],
      'Jasmine Attars': ['Floral Attars', 'Attar Blends', 'Seasonal Attars'],
      'Attar Blends': ['Heritage Attars', 'Saffron Attars', 'Seasonal Attars'],
      'Seasonal Attars': ['Attar Blends', 'Floral Attars', 'Jasmine Attars'],
      'Heritage Attars': ['Oudh Attars', 'Saffron Attars', 'Attar Blends']
    };

    return products
      .filter(p => p.id !== productId)
      .map(product => {
        let score = 0;
        
        // Complementary categories get higher scores
        if (currentProduct.category && product.category && complementaryCategories[currentProduct.category]?.includes(product.category)) {
          score += 50;
        } else if (currentProduct.category === product.category) {
          score += 30;
        }
        
        // Price complementarity (accessories should be cheaper)
        const priceRatio = product.price / currentProduct.price;
        if (priceRatio >= 0.1 && priceRatio <= 0.6) score += 30;
        
        // High-rated products get priority
        score += product.rating * 10;
        
        // In-stock products get priority
        if (product.stock > 0) score += 10;
        
        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(item => item.product);
  };

  const getPersonalizedRecommendations = (maxItems: number = 8): Product[] => {
    const recentlyViewedProducts = recentlyViewedService.getRecentlyViewedProducts(products);
    
    if (recentlyViewedProducts.length === 0) {
      // Return trending/featured products for new users
      return products
        .filter(p => p.featured || p.rating >= 4.0)
        .sort((a, b) => {
          // Prioritize featured products, then by rating
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return b.rating - a.rating;
        })
        .slice(0, maxItems);
    }

    // Get user preferences from viewing history
    const viewedCategories = [...new Set(recentlyViewedProducts.map(p => p.category))];
    const viewedBrands = [...new Set(recentlyViewedProducts.map(p => p.sellerName).filter(Boolean))];
    const avgViewedPrice = recentlyViewedProducts.reduce((sum, p) => sum + p.price, 0) / recentlyViewedProducts.length;
    const viewedIds = new Set(recentlyViewedProducts.map(p => p.id));

    return products
      .filter(product => !viewedIds.has(product.id))
      .map(product => {
        let score = 0;
        
        // Category preference (30% weight)
        if (viewedCategories.includes(product.category)) score += 30;
        
        // Brand preference (20% weight) - using seller name
        if (product.sellerName && viewedBrands.includes(product.sellerName)) score += 20;
        
        // Rating boost (25% weight)
        score += product.rating * 5;
        
        // Featured product boost (10% weight)
        if (product.featured) score += 10;
        
        // Price similarity (10% weight)
        const priceDiff = Math.abs(product.price - avgViewedPrice) / avgViewedPrice;
        if (priceDiff <= 0.5) score += 10;
        
        // Stock availability (5% weight)
        if (product.stock > 0) score += 5;
        
        // Add some randomness for discovery
        score += Math.random() * 5;
        
        return { product, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(item => item.product);
  };

  const getRecentlyViewed = (maxItems: number = 6): Product[] => {
    return recentlyViewedService.getRecentlyViewedProducts(products).slice(0, maxItems);
  };

  const getTrendingProducts = (maxItems: number = 8): Product[] => {
    // Simulate trending based on rating, featured status, and random factor
    return products
      .map(product => ({
        product,
        score: (product.rating * 20) + (product.featured ? 30 : 0) + (Math.random() * 50)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, maxItems)
      .map(item => item.product);
  };

  const getNewArrivals = (maxItems: number = 8): Product[] => {
    // Sort by creation date (newest first)
    return products
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, maxItems);
  };

  const addToRecentlyViewed = (productId: string): void => {
    recentlyViewedService.addProduct(productId);
    // Update recently viewed in recommendations
    setRecommendations(prev => ({
      ...prev,
      recentlyViewed: getRecentlyViewed()
    }));
  };

  const removeFromRecentlyViewed = (productId: string): void => {
    recentlyViewedService.removeProduct(productId);
    setRecommendations(prev => ({
      ...prev,
      recentlyViewed: getRecentlyViewed()
    }));
  };

  const clearRecentlyViewed = (): void => {
    recentlyViewedService.clearAll();
    setRecommendations(prev => ({
      ...prev,
      recentlyViewed: []
    }));
  };

  const getRecommendationAnalytics = () => {
    return {
      recentlyViewed: recentlyViewedService.getAnalytics(),
      totalRecommendations: Object.values(recommendations).flat().length,
      categoriesRepresented: [...new Set(Object.values(recommendations).flat().map(p => p.category))].length,
      averageRating: Object.values(recommendations).flat().reduce((sum, p) => sum + p.rating, 0) / Object.values(recommendations).flat().length || 0
    };
  };

  const refreshRecommendations = (productId?: string): void => {
    setLoading(true);
    setError(null);

    try {
      const newRecommendations: RecommendationData = {
        related: productId ? getRelatedProducts(productId) : [],
        frequentlyBought: productId ? getFrequentlyBoughtTogether(productId) : [],
        youMayLike: getPersonalizedRecommendations(),
        recentlyViewed: getRecentlyViewed(),
        trending: getTrendingProducts(),
        newArrivals: getNewArrivals()
      };

      setRecommendations(newRecommendations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  // Initialize recommendations when products are loaded
  useEffect(() => {
    if (products.length > 0) {
      refreshRecommendations();
    }
  }, [products]);

  // Listen for recently viewed updates
  useEffect(() => {
    const handleRecentlyViewedUpdate = () => {
      setRecommendations(prev => ({
        ...prev,
        recentlyViewed: getRecentlyViewed(),
        youMayLike: getPersonalizedRecommendations() // Update personalized recommendations too
      }));
    };

    window.addEventListener('recentlyViewedUpdated', handleRecentlyViewedUpdate);
    return () => window.removeEventListener('recentlyViewedUpdated', handleRecentlyViewedUpdate);
  }, [products]);

  const value: RecommendationsContextType = {
    recommendations,
    loading,
    error,
    getRelatedProducts,
    getFrequentlyBoughtTogether,
    getPersonalizedRecommendations,
    getRecentlyViewed,
    getTrendingProducts,
    getNewArrivals,
    addToRecentlyViewed,
    removeFromRecentlyViewed,
    clearRecentlyViewed,
    getRecommendationAnalytics,
    refreshRecommendations
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
};

export const useRecommendations = (): RecommendationsContextType => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendations must be used within a RecommendationsProvider');
  }
  return context;
};

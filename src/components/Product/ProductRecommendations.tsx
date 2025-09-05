import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  ShoppingCart, 
  Heart, 
  Star, 
  TrendingUp,
  Users,
  Package,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product } from '../../types';
import { useProducts } from '../../contexts/ProductContext';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useNotification } from '../../contexts/NotificationContext';
import { MobileCompactCarousel } from '../Mobile/MobileProductCarousel';
import { useMobileDetection } from '../../hooks/useMobileGestures';

interface ProductRecommendationsProps {
  currentProduct?: Product;
  type: 'related' | 'frequently-bought' | 'you-may-like' | 'recently-viewed';
  title?: string;
  subtitle?: string;
  maxItems?: number;
  className?: string;
  showAddToCart?: boolean;
  layout?: 'horizontal' | 'grid';
}

interface RecommendationAlgorithm {
  calculateSimilarity: (product1: Product, product2: Product) => number;
  getRecommendations: (currentProduct: Product, allProducts: Product[], maxItems: number) => Product[];
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({
  currentProduct,
  type,
  title,
  subtitle,
  maxItems = 4,
  className = '',
  showAddToCart = true,
  layout = 'horizontal'
}) => {
  const { products } = useProducts();
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { showNotification } = useNotification();
  const { isMobile } = useMobileDetection();
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Recommendation algorithms
  const algorithms: Record<string, RecommendationAlgorithm> = {
    related: {
      calculateSimilarity: (product1: Product, product2: Product) => {
        let score = 0;
        
        // Category similarity (highest weight)
        if (product1.category === product2.category) score += 40;
        
        // Price similarity (within 30% range)
        const priceDiff = Math.abs(product1.price - product2.price) / Math.max(product1.price, product2.price);
        if (priceDiff <= 0.3) score += 25;
        
        // Brand similarity - using seller name
        if (product1.sellerName && product2.sellerName && product1.sellerName === product2.sellerName) score += 20;
        
        // Tag similarity
        if (product1.tags && product2.tags) {
          const commonTags = product1.tags.filter(tag => product2.tags!.includes(tag));
          score += (commonTags.length / Math.max(product1.tags.length, product2.tags.length)) * 15;
        }
        
        return score;
      },
      getRecommendations: (currentProduct: Product, allProducts: Product[], maxItems: number) => {
        return allProducts
          .filter(p => p.id !== currentProduct.id)
          .map(product => ({
            product,
            score: algorithms.related.calculateSimilarity(currentProduct, product)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, maxItems)
          .map(item => item.product);
      }
    },
    
    'frequently-bought': {
      calculateSimilarity: (product1: Product, product2: Product) => {
        // Simulate frequently bought together based on category and price complementarity
        let score = 0;
        
        // Complementary categories get higher scores
        const complementaryCategories: Record<string, string[]> = {
          'Oudh Attars': ['Amber Attars', 'Sandalwood Attars'],
          'Floral Attars': ['Jasmine Attars', 'Attar Blends'],
          'Musk Attars': ['Oudh Attars', 'Amber Attars'],
          'Amber Attars': ['Oudh Attars', 'Saffron Attars'],
          'Saffron Attars': ['Amber Attars', 'Heritage Attars'],
          'Sandalwood Attars': ['Oudh Attars', 'Musk Attars'],
          'Jasmine Attars': ['Floral Attars', 'Attar Blends'],
          'Attar Blends': ['Heritage Attars', 'Seasonal Attars'],
          'Seasonal Attars': ['Attar Blends', 'Floral Attars'],
          'Heritage Attars': ['Oudh Attars', 'Saffron Attars']
        };
        
        if (product1.category && product2.category && complementaryCategories[product1.category]?.includes(product2.category)) {
          score += 50;
        } else if (product1.category === product2.category) {
          score += 30;
        }
        
        // Price complementarity (accessories should be cheaper than main items)
        const priceRatio = product2.price / product1.price;
        if (priceRatio >= 0.1 && priceRatio <= 0.5) score += 30; // Good accessory price range
        
        // Rating similarity
        const ratingDiff = Math.abs(product1.rating - product2.rating);
        if (ratingDiff <= 0.5) score += 20;
        
        return score;
      },
      getRecommendations: (currentProduct: Product, allProducts: Product[], maxItems: number) => {
        return allProducts
          .filter(p => p.id !== currentProduct.id)
          .map(product => ({
            product,
            score: algorithms['frequently-bought'].calculateSimilarity(currentProduct, product)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, maxItems)
          .map(item => item.product);
      }
    },
    
    'you-may-like': {
      calculateSimilarity: (product1: Product, product2: Product) => {
        // Personalized recommendations based on user behavior patterns
        let score = 0;
        
        // High-rated products get priority
        score += product2.rating * 15;
        
        // Featured products get boost
        if (product2.featured) score += 25;
        
        // Category diversity (explore new categories)
        if (product1.category !== product2.category) score += 20;
        
        // Price exploration (similar or slightly higher price points)
        const priceRatio = product2.price / product1.price;
        if (priceRatio >= 0.8 && priceRatio <= 1.5) score += 20;
        
        // Trending products (simulate with random factor)
        score += Math.random() * 20;
        
        return score;
      },
      getRecommendations: (currentProduct: Product, allProducts: Product[], maxItems: number) => {
        return allProducts
          .filter(p => p.id !== currentProduct.id)
          .map(product => ({
            product,
            score: algorithms['you-may-like'].calculateSimilarity(currentProduct, product)
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, maxItems)
          .map(item => item.product);
      }
    },
    
    'recently-viewed': {
      calculateSimilarity: () => 0, // Not used for recently viewed
      getRecommendations: (currentProduct: Product, allProducts: Product[], maxItems: number) => {
        // Get recently viewed products from localStorage
        const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]') as string[];
        return allProducts
          .filter(p => recentlyViewed.includes(p.id) && p.id !== currentProduct?.id)
          .slice(0, maxItems);
      }
    }
  };

  // Generate recommendations
  useEffect(() => {
    if (type === 'recently-viewed') {
      // For recently viewed, we don't need a current product
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]') as string[];
      const recentProducts = products.filter(p => recentlyViewed.includes(p.id)).slice(0, maxItems);
      setRecommendedProducts(recentProducts);
      setIsLoading(false);
    } else if (currentProduct && products.length > 0) {
      setIsLoading(true);
      // Simulate API delay for realistic UX
      setTimeout(() => {
        const recommendations = algorithms[type].getRecommendations(currentProduct, products, maxItems);
        setRecommendedProducts(recommendations);
        setIsLoading(false);
      }, 300);
    }
  }, [currentProduct, products, type, maxItems]);

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    showNotification({
      type: 'success',
      title: 'Added to Cart',
      message: `${product.name} has been added to your cart.`
    });
  };

  const handleWishlistToggle = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToWishlist(product);
  };

  const getRecommendationIcon = () => {
    switch (type) {
      case 'related': return <Package className="h-4 w-4" />;
      case 'frequently-bought': return <Users className="h-4 w-4" />;
      case 'you-may-like': return <TrendingUp className="h-4 w-4" />;
      case 'recently-viewed': return <Eye className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getDefaultTitle = () => {
    switch (type) {
      case 'related': return 'Related Products';
      case 'frequently-bought': return 'Frequently Bought Together';
      case 'you-may-like': return 'You May Also Like';
      case 'recently-viewed': return 'Recently Viewed';
      default: return 'Recommended Products';
    }
  };

  const getDefaultSubtitle = () => {
    switch (type) {
      case 'related': return 'Similar products you might be interested in';
      case 'frequently-bought': return 'Customers who bought this item also bought';
      case 'you-may-like': return 'Personalized recommendations just for you';
      case 'recently-viewed': return 'Continue where you left off';
      default: return 'Discover more great products';
    }
  };

  if (isLoading) {
    return (
      <div className={`${className}`}>
        <div className="flex items-center space-x-2 mb-3 sm:mb-4">
          <div className="text-neutral-600">{getRecommendationIcon()}</div>
          <div>
            <div className="h-4 sm:h-5 bg-neutral-200 rounded w-32 sm:w-40 animate-pulse"></div>
            <div className="h-2.5 sm:h-3 bg-neutral-100 rounded w-36 sm:w-48 mt-1 animate-pulse"></div>
          </div>
        </div>
        <div className={`grid gap-3 sm:gap-4 ${layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {Array.from({ length: maxItems }).map((_, index) => (
            <div key={index} className="bg-white rounded-lg border border-neutral-200 p-2.5 sm:p-3 animate-pulse">
              <div className="aspect-square bg-neutral-200 rounded-md mb-2.5 sm:mb-3"></div>
              <div className="h-2.5 sm:h-3 bg-neutral-200 rounded mb-1.5"></div>
              <div className="h-2.5 sm:h-3 bg-neutral-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className={`${className}`}>
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <div className="flex items-center space-x-2">
          <div className="text-neutral-600">{getRecommendationIcon()}</div>
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-neutral-900">
              {title || getDefaultTitle()}
            </h3>
            <p className="text-[10px] sm:text-xs text-neutral-600 mt-0.5">
              {subtitle || getDefaultSubtitle()}
            </p>
          </div>
        </div>
        
        {recommendedProducts.length > maxItems && (
          <Link 
            to="/products" 
            className="flex items-center space-x-1.5 text-primary-600 hover:text-primary-700 transition-colors text-xs sm:text-sm touch-manipulation"
          >
            <span className="font-medium">View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Products Display */}
      {isMobile ? (
        <MobileCompactCarousel
          products={recommendedProducts}
          title={title || getDefaultTitle()}
        />
      ) : (
        <div className={`grid gap-3 sm:gap-4 ${layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
          {recommendedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="touch-manipulation"
            >
              <Link to={`/products/${product.id}`} className="group block">
                <div className="bg-white rounded-lg border border-neutral-200 hover:border-neutral-300 transition-all duration-200 hover:shadow-md overflow-hidden">
                  {/* Product Image */}
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Wishlist Button */}
                    <button
                      onClick={(e) => handleWishlistToggle(product, e)}
                      className={`absolute top-1.5 sm:top-2 right-1.5 sm:right-2 p-1 rounded-full transition-all ${
                        isInWishlist(product.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-white/80 text-neutral-600 hover:bg-white'
                      } touch-manipulation`}
                    >
                      <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                    </button>

                    {/* Quick Add to Cart */}
                    {showAddToCart && product.stock > 0 && (
                      <button
                        onClick={(e) => handleAddToCart(product, e)}
                        className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 right-1.5 sm:right-2 bg-neutral-900 text-white py-1 px-2 sm:py-1.5 sm:px-3 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center space-x-1 hover:bg-neutral-800 active:bg-neutral-700 touch-manipulation"
                      >
                        <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="text-[10px] sm:text-xs font-medium">Add to Cart</span>
                      </button>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5 sm:p-3">
                    <h4 className="font-medium text-neutral-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors text-xs sm:text-sm">
                      {product.name}
                    </h4>

                    {/* Rating */}
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-neutral-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-neutral-500">({product.rating})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm sm:text-base font-semibold text-neutral-900">
                        ${product.price}
                      </span>
                      {product.originalPrice && (
                        <span className="text-[10px] sm:text-xs text-neutral-500 line-through">
                          ${product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Stock Status */}
                    {product.stock <= 5 && product.stock > 0 && (
                      <p className="text-[10px] text-orange-600 mt-1">
                        Only {product.stock} left in stock
                      </p>
                    )}
                    {product.stock === 0 && (
                      <p className="text-[10px] text-red-600 mt-1">Out of stock</p>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};
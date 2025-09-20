import React from 'react';
import { motion } from 'framer-motion';
import { Eye, ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRecommendations } from '../../contexts/RecommendationsContext';
import { ProductRecommendations } from '../Product/ProductRecommendations';

interface RecentlyViewedProps {
  maxItems?: number;
  showClearButton?: boolean;
  className?: string;
  layout?: 'horizontal' | 'grid';
}

export const RecentlyViewed: React.FC<RecentlyViewedProps> = ({
  maxItems = 6,
  showClearButton = true,
  className = '',
  layout = 'horizontal'
}) => {
  const { 
    recommendations, 
    clearRecentlyViewed, 
    getRecentlyViewed 
  } = useRecommendations();

  const recentlyViewedProducts = getRecentlyViewed(maxItems);

  // Don't render if no recently viewed products
  if (recentlyViewedProducts.length === 0) {
    return null;
  }

  return (
    <section className={`py-6 sm:py-8 ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="p-1.5 sm:p-2 bg-neutral-100 rounded-lg">
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-neutral-600" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900">
                Recently Viewed
              </h2>
              <p className="text-neutral-600 text-[10px] sm:text-xs mt-0.5">
                Continue where you left off
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3">
            {showClearButton && (
              <button
                onClick={clearRecentlyViewed}
                className="flex items-center space-x-1 sm:space-x-1.5 text-neutral-500 hover:text-neutral-700 transition-colors text-[10px] sm:text-xs touch-manipulation"
              >
                <X className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Clear All</span>
              </button>
            )}
            
            {recentlyViewedProducts.length > maxItems && (
              <Link 
                to="/products" 
                className="flex items-center space-x-1 sm:space-x-1.5 text-primary-600 hover:text-primary-700 transition-colors text-[10px] sm:text-xs touch-manipulation"
              >
                <span className="font-medium">View All</span>
                <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              </Link>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <ProductRecommendations
          type="recently-viewed"
          maxItems={maxItems}
          layout={layout}
          showAddToCart={true}
          className="bg-transparent"
        />
      </div>
    </section>
  );
};

// Compact version for sidebars or smaller spaces
export const RecentlyViewedCompact: React.FC<{
  maxItems?: number;
  className?: string;
}> = ({ maxItems = 3, className = '' }) => {
  const { getRecentlyViewed, removeFromRecentlyViewed } = useRecommendations();
  const recentlyViewedProducts = getRecentlyViewed(maxItems);

  if (recentlyViewedProducts.length === 0) {
    return (
      <div className={`bg-white rounded-xl border border-neutral-200 p-6 ${className}`}>
        <div className="flex items-center space-x-3 mb-4">
          <Eye className="h-5 w-5 text-neutral-600" />
          <h3 className="font-semibold text-neutral-900">Recently Viewed</h3>
        </div>
        <div className="text-center py-8">
          <Eye className="h-12 w-12 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-500 text-sm">No recently viewed products</p>
          <p className="text-neutral-400 text-xs mt-1">
            Products you view will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Eye className="h-5 w-5 text-neutral-600" />
          <h3 className="font-semibold text-neutral-900">Recently Viewed</h3>
        </div>
        <Link 
          to="/products" 
          className="text-primary-600 hover:text-primary-700 transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {recentlyViewedProducts.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link 
              to={`/products/${product.id}`}
              className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <img
                src={(product.images && product.images.length > 0 ? product.images[0] : '') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-neutral-900 text-sm truncate group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h4>
                <p className="text-primary-600 font-semibold text-sm">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  removeFromRecentlyViewed(product.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-all"
              >
                <X className="h-3 w-3 text-neutral-500" />
              </button>
            </Link>
          </motion.div>
        ))}
      </div>

      {recentlyViewedProducts.length >= maxItems && (
        <div className="mt-4 pt-4 border-t border-neutral-200">
          <Link
            to="/products"
            className="block text-center text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium"
          >
            View All Recently Viewed
          </Link>
        </div>
      )}
    </div>
  );
};

// Widget for dashboard or profile pages
export const RecentlyViewedWidget: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const { getRecentlyViewed, getRecommendationAnalytics } = useRecommendations();
  const recentlyViewedProducts = getRecentlyViewed(5);
  const analytics = getRecommendationAnalytics();

  return (
    <div className={`bg-white rounded-xl border border-neutral-200 p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Eye className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Browsing Activity</h3>
            <p className="text-neutral-600 text-sm">Your recent product views</p>
          </div>
        </div>
      </div>

      {/* Analytics Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">
            {analytics.recentlyViewed?.totalViewed || 0}
          </p>
          <p className="text-xs text-neutral-600">Total Views</p>
        </div>
        <div className="text-center p-3 bg-neutral-50 rounded-lg">
          <p className="text-2xl font-bold text-neutral-900">
            {analytics.recentlyViewed?.uniqueProducts || 0}
          </p>
          <p className="text-xs text-neutral-600">Unique Products</p>
        </div>
      </div>

      {/* Recent Products */}
      {recentlyViewedProducts.length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-medium text-neutral-900 text-sm">Recent Products</h4>
          {recentlyViewedProducts.slice(0, 3).map((product) => (
            <Link
              key={product.id}
              to={`/products/${product.id}`}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 text-sm truncate">
                  {product.name}
                </p>
                <p className="text-primary-600 font-semibold text-xs">
                  ₹{product.price.toLocaleString('en-IN')}
                </p>
              </div>
            </Link>
          ))}
          
          {recentlyViewedProducts.length > 3 && (
            <Link
              to="/products"
              className="block text-center text-sm text-primary-600 hover:text-primary-700 transition-colors font-medium pt-2"
            >
              View {recentlyViewedProducts.length - 3} more
            </Link>
          )}
        </div>
      ) : (
        <div className="text-center py-6">
          <Eye className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-neutral-500 text-sm">No recent activity</p>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Star, Heart, ShoppingCart, GitCompare } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCompare } from '../../contexts/CompareContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import { dataPreloader } from '../../utils/preloader';
import { MiniTrustIndicators, TrendingIndicator } from '../Trust';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';
import { useAddToCompareWithAuth } from '../../hooks/useAddToCompareWithAuth';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isInWishlist } = useWishlist();
  const { isInCompare } = useCompare();
  const { showSuccess } = useNotification();
  const { handleAddToCart } = useAddToCartWithAuth();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const { handleAddToCompare } = useAddToCompareWithAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToWishlist(product);
  };
  
  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    handleAddToCompare(product);
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const getStockStatus = () => {
    if (product.stock === 0) return { text: 'Out of Stock', color: 'bg-red-500', textColor: 'text-red-600' };
    if (product.stock <= 5) return { text: 'Low Stock', color: 'bg-orange-500', textColor: 'text-orange-600' };
    return { text: 'In Stock', color: 'bg-green-500', textColor: 'text-green-600' };
  };

  const stockStatus = getStockStatus();

  return (
    <div
      className="product-card group flex flex-col h-full bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 touch-manipulation"
      onMouseEnter={() => {
        // Preload product details on hover
        dataPreloader.preloadProduct(product.id, { priority: 'high' });
      }}
    >
      <div className="relative overflow-hidden group/image bg-gray-50">
        <Link to={`/products/${product.id}`} className="block">
          {/* Amazon-style 4:3 aspect ratio for better grid display */}
          <div className="aspect-[4/3] relative overflow-hidden">
            <img
              key={currentImageIndex}
              src={(product.images && product.images.length > 0 ? product.images[currentImageIndex] || product.images[0] : '') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4=';
              }}
            />

            {/* Image Navigation - Amazon Style with mobile optimization */}
            {product.images && product.images.length > 1 && (
              <div className="absolute bottom-1.5 sm:bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {product.images.map((_, index) => (
                  <button
                    key={`${product.id}-image-${index}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full transition-all duration-150 ${
                      index === currentImageIndex
                        ? 'bg-white shadow-md'
                        : 'bg-white/70 hover:bg-white/90'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Subtle Overlay */}
            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </Link>

        {/* Amazon-Style Status Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1 z-10">
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm">
              -{discount}% OFF
            </span>
          )}

          {product.featured && (
            <TrendingIndicator isHot={true} className="shadow-sm" />
          )}

          {product.stock <= 0 && (
            <span className="bg-gray-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium shadow-sm">
              Out of Stock
            </span>
          )}
        </div>

        {/* Amazon-Style Action Buttons with mobile touch optimization */}
        <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 flex flex-col space-y-1 sm:space-y-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={handleWishlistToggle}
            className={`p-1 sm:p-1.5 rounded-full shadow-sm border transition-colors duration-200 ${
              isInWishlist(product.id)
                ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-white text-gray-600 hover:text-red-500 border-gray-200 hover:border-red-200'
            } touch-manipulation`}
          >
            <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompareToggle}
            className={`p-1 sm:p-1.5 rounded-full shadow-sm border transition-colors duration-200 ${
              isInCompare(product.id)
                ? 'bg-blue-50 text-blue-600 border-blue-200'
                : 'bg-white text-gray-600 hover:text-blue-500 border-gray-200 hover:border-blue-200'
            } touch-manipulation`}
          >
            <GitCompare className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
        
        {/* Amazon-Style Add to Cart Button with mobile touch optimization */}
        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-200 bg-gradient-to-t from-white via-white/95 to-transparent">
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              if (product.stock > 0) {
                handleAddToCart(product);
              }
            }}
            disabled={product.stock === 0}
            className={`w-full flex items-center justify-center space-x-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-md sm:rounded-lg font-medium transition-colors duration-200 ${
              product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm active:bg-orange-700'
            } touch-manipulation`}
          >
            <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs font-medium">
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </span>
          </button>
        </div>
      </div>

      {/* Amazon-Style Product Information with mobile optimization */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-grow space-y-1.5 sm:space-y-2">
        <div className="space-y-1">
          <span className="text-[10px] sm:text-xs text-gray-600 uppercase tracking-wide font-medium">
            {product.category}
          </span>
          <Link to={`/products/${product.id}`}>
            <h3 className="text-xs sm:text-sm font-medium text-gray-900 line-clamp-2 leading-4 group-hover:text-blue-600 transition-colors duration-200">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex-grow"></div>

        <div className="space-y-1.5 sm:space-y-2">
          {/* Rating */}
          <div className="flex items-center space-x-0.5 sm:space-x-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={`${product.id}-star-${i}`}
                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                  i < Math.floor(product.rating)
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-[10px] text-gray-600 ml-0.5">({product.rating})</span>
          </div>

          {/* Price */}
          <div className="flex items-center space-x-1.5">
            <span className="text-sm sm:text-base font-bold text-gray-900">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] sm:text-xs text-gray-500 line-through">
                ₹{product.originalPrice.toLocaleString('en-IN')}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-medium ${
              product.stock > 0 ? 'text-green-600' : 'text-red-500'
            }`}>
              {product.stock > 0 ? (product.stock > 10 ? 'In Stock' : `Only ${product.stock} left`) : 'Out of stock'}
            </span>
            {discount > 0 && (
              <span className="bg-red-100 text-red-700 text-[10px] font-semibold px-1 py-0.5 rounded">
                {discount}% OFF
              </span>
            )}
          </div>

          {/* Trust Indicators */}
          <div className="pt-1.5 border-t border-gray-100">
            <MiniTrustIndicators
              freeShipping={product.price >= 2000}
              warranty={true}
              returns={true}
              className="justify-center scale-75"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
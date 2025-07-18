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

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addItem: addToCart } = useCart();
  const { addItem: addToWishlist, isInWishlist } = useWishlist();
  const { addItem: addToCompare, isInCompare } = useCompare();
  const { showNotification } = useNotification();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);


  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (product.stock > 0) {
      addToCart(product);
      showNotification({
        type: 'success',
        title: 'Added to Cart',
        message: `${product.name} has been added to your cart.`
      });
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToWishlist(product);
  };
  
  const handleCompareToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    addToCompare(product);
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
      className="product-card group flex flex-col h-full"
      onMouseEnter={() => {
        // Preload product details on hover
        dataPreloader.preloadProduct(product.id, { priority: 'high' });
      }}
    >
      <div className="relative overflow-hidden group/image">
        <Link to={`/products/${product.id}`} className="block">
          <div className="product-card-image">
            <img
              key={currentImageIndex}
              src={product.images[currentImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Image Navigation Dots */}
            {product.images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </Link>

        {/* Luxury Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2">
          {discount > 0 && (
            <span className="bg-neutral-900 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-lg backdrop-blur-sm">
              -{discount}% OFF
            </span>
          )}

          {product.featured && (
            <TrendingIndicator isHot={true} className="shadow-lg" />
          )}

          {product.stock > 0 ? (
            <span className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-lg flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              <span>In Stock</span>
            </span>
          ) : (
            <span className="bg-neutral-500 text-white text-xs px-3 py-1.5 rounded-md font-medium shadow-lg flex items-center space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <span>Out of Stock</span>
            </span>
          )}
        </div>

        <div className="absolute top-3 right-3 flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleWishlistToggle}
            className={`p-2 rounded-full shadow-medium transition-colors duration-200 ${
              isInWishlist(product.id)
                ? 'bg-state-error text-text-inverse'
                : 'bg-background-tertiary/90 backdrop-blur-sm text-text-tertiary hover:text-state-error'
            }`}
          >
            <Heart className="h-4 w-4" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={handleCompareToggle}
            className={`p-2 rounded-full shadow-medium transition-colors duration-200 ${
              isInCompare(product.id)
                ? 'bg-primary-600 text-text-inverse'
                : 'bg-background-tertiary/90 backdrop-blur-sm text-text-tertiary hover:text-primary-600'
            }`}
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
              product.stock === 0
                ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                : 'bg-neutral-900 text-white hover:bg-neutral-800 shadow-lg hover:shadow-xl'
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
          </button>
        </div>
      </div>

      <div className="p-6 flex flex-col flex-grow space-y-4">
        <div className="space-y-2">
          <span className="text-xs text-text-tertiary font-medium tracking-wide uppercase">
            {product.category}
          </span>
          <Link to={`/products/${product.id}`}>
            <h3 className="font-medium text-text-primary text-lg leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors duration-200">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex-grow"></div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-semibold text-text-primary">${product.price}</span>
              {product.originalPrice && (
                <span className="text-sm text-text-tertiary line-through">${product.originalPrice}</span>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 text-state-warning fill-current" />
              <span className="text-sm text-text-secondary font-medium">{product.rating}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className={`font-medium ${product.stock > 0 ? 'text-state-success' : 'text-state-error'}`}>
              {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="bg-state-error/10 text-state-error text-xs font-medium px-2 py-1 rounded-full">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Trust Indicators */}
          <MiniTrustIndicators
            freeShipping={product.price >= 50}
            warranty={true}
            returns={true}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
};

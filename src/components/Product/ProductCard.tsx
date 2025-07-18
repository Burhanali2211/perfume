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
      className="product-card group flex flex-col h-full bg-white rounded-luxury-lg overflow-hidden shadow-subtle hover:shadow-luxury transition-all duration-500 ease-out hover:-translate-y-2"
      onMouseEnter={() => {
        // Preload product details on hover
        dataPreloader.preloadProduct(product.id, { priority: 'high' });
      }}
    >
      <div className="relative overflow-hidden group/image bg-neutral-50">
        <Link to={`/products/${product.id}`} className="block">
          <div className="aspect-square relative overflow-hidden">
            <img
              key={currentImageIndex}
              src={product.images[currentImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
              loading="lazy"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4=';
              }}
            />

            {/* Luxury Image Navigation */}
            {product.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                      index === currentImageIndex
                        ? 'bg-white shadow-lg scale-125'
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Luxury Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        </Link>

        {/* Luxury Status Badges */}
        <div className="absolute top-4 left-4 flex flex-col space-y-2 z-10">
          {discount > 0 && (
            <span className="bg-neutral-900/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-luxury font-medium shadow-luxury border border-white/10">
              -{discount}% OFF
            </span>
          )}

          {product.featured && (
            <TrendingIndicator isHot={true} className="shadow-luxury backdrop-blur-md" />
          )}

          {product.stock > 0 ? (
            <span className="bg-emerald-600/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-luxury font-medium shadow-luxury border border-white/10 flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
              <span>In Stock</span>
            </span>
          ) : (
            <span className="bg-neutral-500/90 backdrop-blur-md text-white text-xs px-3 py-2 rounded-luxury font-medium shadow-luxury border border-white/10 flex items-center space-x-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
              <span>Out of Stock</span>
            </span>
          )}
        </div>

        {/* Luxury Action Buttons */}
        <div className="absolute top-4 right-4 flex flex-col space-y-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
          <button
            onClick={handleWishlistToggle}
            className={`p-3 rounded-full backdrop-blur-md shadow-luxury border transition-all duration-200 hover:scale-110 ${
              isInWishlist(product.id)
                ? 'bg-red-500/90 text-white border-red-400/20'
                : 'bg-white/90 text-neutral-600 hover:bg-white hover:text-red-500 border-white/20'
            }`}
          >
            <Heart className={`h-4 w-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleCompareToggle}
            className={`p-3 rounded-full backdrop-blur-md shadow-luxury border transition-all duration-200 hover:scale-110 ${
              isInCompare(product.id)
                ? 'bg-blue-500/90 text-white border-blue-400/20'
                : 'bg-white/90 text-neutral-600 hover:bg-white hover:text-blue-500 border-white/20'
            }`}
          >
            <GitCompare className="h-4 w-4" />
          </button>
        </div>
        
        {/* Luxury Add to Cart Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-out bg-gradient-to-t from-black/80 via-black/60 to-transparent backdrop-blur-sm">
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className={`w-full flex items-center justify-center space-x-3 px-6 py-4 rounded-luxury font-medium transition-all duration-300 ${
              product.stock === 0
                ? 'bg-neutral-400/80 text-neutral-200 cursor-not-allowed backdrop-blur-md'
                : 'bg-white/95 text-neutral-900 hover:bg-white hover:scale-105 shadow-luxury hover:shadow-xl backdrop-blur-md'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-wide">
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </span>
          </button>
        </div>
      </div>

      {/* Luxury Product Information */}
      <div className="p-6 lg:p-8 flex flex-col flex-grow space-y-5">
        <div className="space-y-3">
          <span className="product-category">
            {product.category}
          </span>
          <Link to={`/products/${product.id}`}>
            <h3 className="product-title text-lg lg:text-xl line-clamp-2 group-hover:text-neutral-700 transition-colors duration-300">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="flex-grow"></div>

        <div className="space-y-4">
          {/* Price and Rating */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-3">
              <span className="product-price text-2xl">
                ${product.price}
              </span>
              {product.originalPrice && (
                <span className="text-base text-neutral-400 line-through">
                  ${product.originalPrice}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              <Star className="h-4 w-4 text-yellow-400 fill-current" />
              <span className="text-sm text-neutral-600 font-medium">{product.rating}</span>
            </div>
          </div>

          {/* Stock Status and Discount */}
          <div className="flex items-center justify-between">
            <span className={`text-sm font-medium ${
              product.stock > 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="bg-red-50 text-red-600 text-xs font-semibold px-3 py-1.5 rounded-full border border-red-100">
                {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
              </span>
            )}
          </div>

          {/* Enhanced Trust Indicators */}
          <div className="pt-2 border-t border-neutral-100">
            <MiniTrustIndicators
              freeShipping={product.price >= 50}
              warranty={true}
              returns={true}
              className="justify-center"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

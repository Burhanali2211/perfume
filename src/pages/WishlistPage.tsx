import React, { useState } from 'react';
import { Heart, ShoppingCart, Trash2, Share2 } from 'lucide-react';
import { useWishlist } from '../contexts/WishlistContext';
import { useCart } from '../contexts/CartContext';
import { useNotification } from '../contexts/NotificationContext';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductDetails } from '../components/Product/ProductDetails';
import { Product } from '../types';
import { Link } from 'react-router-dom';

export const WishlistPage: React.FC = () => {
  const { items, clearWishlist } = useWishlist();
  const { addItem: addToCart } = useCart();
  const { showInfo, showSuccess } = useNotification();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleAddAllToCart = () => {
    const inStockItems = items.filter(item => item.product.stock > 0);
    if (inStockItems.length === 0) {
      showInfo('None of your wishlist items are currently in stock.', 'No Items in Stock');
      return;
    }
    inStockItems.forEach(item => addToCart(item.product));
    showSuccess(`${inStockItems.length} items added to your cart.`, 'Added to Cart');
  };

  const handleClearWishlist = () => {
    if (items.length > 0) {
      clearWishlist();
      showInfo('All items have been removed from your wishlist.', 'Wishlist Cleared');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-red-100 rounded-xl">
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                <p className="text-gray-600 mt-1">
                  {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
                </p>
              </div>
            </div>
            
            {items.length > 0 && (
              <div className="flex items-center space-x-4 mt-6 lg:mt-0">
                <button
                  onClick={handleAddAllToCart}
                  className="btn-primary"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  <span>Add All to Cart</span>
                </button>
                <button
                  onClick={handleClearWishlist}
                  className="btn-secondary"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  <span>Clear All</span>
                </button>
                <button className="border border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Your wishlist is empty</h3>
              <p className="text-gray-600 mb-8">
                Save items you love by clicking the heart icon on any product. 
                They'll appear here for easy access later.
              </p>
              <Link to="/products">
                <button className="btn-primary">
                  Start Shopping
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.product.id}>
                <ProductCard
                  product={item.product}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      
      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default WishlistPage;

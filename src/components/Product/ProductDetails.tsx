import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, Heart, ShoppingCart, Minus, Plus, Share2, Shield, Truck, RotateCcw } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAddToCartWithAuth } from '../../hooks/useAddToCartWithAuth';
import { useAddToWishlistWithAuth } from '../../hooks/useAddToWishlistWithAuth';

interface ProductDetailsProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, isOpen, onClose }) => {
  const { handleAddToCart } = useAddToCartWithAuth();
  const { handleAddToWishlist } = useAddToWishlistWithAuth();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const handleAddToCartClick = () => {
    handleAddToCart(product, quantity);
    onClose();
  };

  const handleAddToWishlistClick = () => {
    handleAddToWishlist(product);
  };

  const features = [
    { icon: Truck, text: 'Free shipping on orders over $50' },
    { icon: RotateCcw, text: '30-day return policy' },
    { icon: Shield, text: '2-year warranty included' },
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-md hover:bg-gray-50"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
                {/* Images Section */}
                <div>
                  <div className="aspect-square mb-4">
                    <img
                      src={product.images[selectedImage]}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  {product.images.length > 1 && (
                    <div className="flex space-x-2">
                      {product.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImage(index)}
                          className={`w-16 h-16 rounded border-2 overflow-hidden ${
                            selectedImage === index ? 'border-indigo-500' : 'border-gray-200'
                          }`}
                        >
                          <img src={image} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product Info Section */}
                <div className="flex flex-col">
                  <div className="mb-4">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <p className="text-gray-600 mb-4">{product.description}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center mb-4">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.floor(product.rating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-600 ml-2">({product.rating}) • {product.reviews.length} reviews</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center space-x-3 mb-6">
                      <span className="text-3xl font-bold text-gray-900">${product.price}</span>
                      {product.originalPrice && (
                        <>
                          <span className="text-xl text-gray-500 line-through">${product.originalPrice}</span>
                          <span className="bg-red-100 text-red-600 px-2 py-1 rounded-lg text-sm font-semibold">
                            Save ${(product.originalPrice - product.price).toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-2 border border-gray-300 rounded-lg min-w-[60px] text-center">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        disabled={quantity >= product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <span className="text-sm text-gray-600">
                        {product.stock} available
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 mb-8">
                    <motion.button
                      onClick={handleAddToCartClick}
                      disabled={product.stock === 0}
                      className={`flex-1 btn-primary btn-lg flex items-center justify-center space-x-2 ${
                        product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      whileHover={product.stock > 0 ? { scale: 1.02 } : {}}
                      whileTap={product.stock > 0 ? { scale: 0.98 } : {}}
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                    </motion.button>

                    <motion.button
                      onClick={handleAddToWishlistClick}
                      className="btn-secondary p-4 hover:text-red-500"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Heart className="h-5 w-5" />
                    </motion.button>

                    <motion.button
                      className="btn-secondary p-4"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Share2 className="h-5 w-5" />
                    </motion.button>
                  </div>

                  {/* Features */}
                  <div className="bg-neutral-50 rounded-xl p-6 space-y-4">
                    <h3 className="font-semibold text-neutral-900 mb-4">Product Features</h3>
                    {features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3 text-sm text-neutral-700">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <feature.icon className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="font-medium">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Seller Info */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Sold by</p>
                        <p className="font-semibold text-gray-900">{product.sellerName}</p>
                      </div>
                      <button className="text-indigo-600 text-sm hover:text-indigo-700">
                        View Store
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
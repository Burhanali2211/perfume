import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Star, Heart, ShieldCheck, Truck, RotateCcw, Plus, Minus, MessageSquare, Edit } from 'lucide-react';
import { useProducts } from '../contexts/ProductContext';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';
import { useRecommendations } from '../contexts/RecommendationsContext';
import { useNotification } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { ProductReview } from '../components/Product/ProductReview';
import { ReviewForm } from '../components/Product/ReviewForm';
import { ProductRecommendations } from '../components/Product/ProductRecommendations';
import { Modal } from '../components/Common/Modal';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { Review } from '../types';
import {
  SocialProof,
  ReviewSummary,
  TrendingIndicator,
  StockUrgency,
  TrustBadges,
  ProductTrustSignals,
  MiniTrustIndicators
} from '../components/Trust';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products, loading: productsLoading, fetchReviewsForProduct, submitReview } = useProducts();
  const { user } = useAuth();
  const product = products.find(p => p.id === id);

  const { addItem: addToCart } = useCart();
  const { addItem: toggleWishlistItem, isInWishlist } = useWishlist();
  const { addToRecentlyViewed, getRelatedProducts, getFrequentlyBoughtTogether } = useRecommendations();
  const { showNotification } = useNotification();
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    if (product) {
      // Add to recently viewed
      addToRecentlyViewed(product.id);

      const getReviews = async () => {
        setReviewsLoading(true);
        const fetchedReviews = await fetchReviewsForProduct(product.id);
        setReviews(fetchedReviews);
        setReviewsLoading(false);
      };
      getReviews();
    }
  }, [product, fetchReviewsForProduct, addToRecentlyViewed]);

  if (productsLoading) {
    return <div className="min-h-screen"><LoadingSpinner /></div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <p className="text-gray-600">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleToggleWishlist = () => {
    toggleWishlistItem(product);
  };
  
  const handleReviewSubmit = async (rating: number, comment: string) => {
    if (!user) {
      showNotification({ type: 'error', title: 'Login Required', message: 'You must be logged in to submit a review.' });
      return;
    }
    await submitReview({ product_id: product.id, user_id: user.id, rating, comment });
    const updatedReviews = await fetchReviewsForProduct(product.id);
    setReviews(updatedReviews);
    showNotification({ type: 'success', title: 'Review Submitted', message: 'Thank you for your feedback!' });
    setIsReviewModalOpen(false);
  };

  const features = [
    { icon: Truck, text: 'Free shipping on orders over $50' },
    { icon: RotateCcw, text: '30-day return policy' },
    { icon: ShieldCheck, text: '2-year warranty included' },
  ];

  const tabs = [
    { id: 'description', name: 'Description' },
    { id: 'reviews', name: `Reviews (${reviews.length})` },
    { id: 'shipping', name: 'Shipping Info' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square mb-4">
              <img src={(product.images && product.images.length > 0 ? product.images[selectedImage] || product.images[0] : '') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='} alt={product.name} className="w-full h-full object-cover rounded-xl shadow-lg"/>
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-4">
                {product.images.map((image, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${ selectedImage === index ? 'border-indigo-500 scale-105' : 'border-gray-200' }`}>
                    <img src={image} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center space-x-2">
                  <TrendingIndicator isHot={product.is_featured} salesIncrease={15} />
                  <MiniTrustIndicators
                    freeShipping={product.price >= 50}
                    warranty={true}
                    returns={true}
                  />
                </div>
              </div>

              {/* Enhanced Rating with Review Summary */}
              <div className="mb-4">
                <ReviewSummary
                  rating={product.rating}
                  reviewCount={reviews.length}
                  className="mb-3"
                />
                <a href="#reviews" onClick={() => setActiveTab('reviews')} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Read all reviews →
                </a>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <span className="text-4xl font-bold text-gray-900">${product.price}</span>
                {product.originalPrice && (
                  <span className="text-2xl text-gray-500 line-through">${product.originalPrice}</span>
                )}
              </div>

              {/* Stock Urgency */}
              <StockUrgency stock={product.stock} lowStockThreshold={10} className="mb-4" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Quantity</label>
              <div className="flex items-center space-x-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-gray-50 transition-colors"><Minus className="h-4 w-4" /></button>
                  <span className="px-6 py-3 border-x border-gray-300 min-w-[80px] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} className="p-3 hover:bg-gray-50 transition-colors" disabled={quantity >= product.stock}><Plus className="h-4 w-4" /></button>
                </div>
                <span className="text-sm text-gray-600">{product.stock} available</span>
              </div>
            </div>
            <div className="flex space-x-4">
              <motion.button onClick={handleAddToCart} disabled={product.stock === 0} className="flex-1 btn-primary !text-lg" whileHover={product.stock > 0 ? { scale: 1.02 } : {}} whileTap={product.stock > 0 ? { scale: 0.98 } : {}}>
                <span>{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
              </motion.button>
              <motion.button onClick={handleToggleWishlist} className={`p-4 border rounded-xl transition-colors ${ isInWishlist(product.id) ? 'border-red-300 bg-red-50 text-red-500' : 'border-gray-300 hover:bg-gray-50' }`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Heart className="h-6 w-6" fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </motion.button>
            </div>
            {/* Trust Signals */}
            <div className="space-y-4 pt-6 border-t border-gray-200">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3"><feature.icon className="h-5 w-5 text-green-500" /> <span className="text-gray-700">{feature.text}</span></div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="pt-6">
              <TrustBadges variant="compact" className="justify-start" />
            </div>
          </motion.div>
        </div>

        {/* Social Proof Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SocialProof
              productId={product.id}
              showRecentPurchases={true}
              showViewingCount={true}
              showCustomerCount={true}
            />
            <ProductTrustSignals />
          </div>
        </motion.div>

        <motion.div id="reviews" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-16">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-4 px-1 border-b-2 font-medium text-sm ${ activeTab === tab.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700' }`}>{tab.name}</button>
                ))}
              </nav>
            </div>
            <div className="p-6">
              {activeTab === 'description' && (
                <div className="prose max-w-none"><p className="text-gray-700 leading-relaxed">{product.description}</p></div>
              )}
              {activeTab === 'reviews' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">Customer Reviews</h3>
                    <button onClick={() => setIsReviewModalOpen(true)} className="btn-primary"><Edit className="h-4 w-4 mr-2"/><span>Write a Review</span></button>
                  </div>
                  {reviewsLoading ? <LoadingSpinner /> : reviews.length > 0 ? (
                    <div className="space-y-4">
                      {reviews.map(review => <ProductReview key={review.id} review={review} />)}
                    </div>
                  ) : (
                    <div className="text-center py-12"><MessageSquare className="mx-auto h-12 w-12 text-gray-400" /><h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3><p className="mt-1 text-sm text-gray-500">Be the first to share your thoughts on this product.</p></div>
                  )}
                </div>
              )}
              {activeTab === 'shipping' && (
                <div className="prose max-w-none"><p>Shipping info goes here...</p></div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Product Recommendations */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
        {/* Frequently Bought Together */}
        <ProductRecommendations
          currentProduct={product}
          type="frequently-bought"
          maxItems={3}
          showAddToCart={true}
          className="bg-neutral-50 rounded-2xl p-8"
        />

        {/* Related Products */}
        <ProductRecommendations
          currentProduct={product}
          type="related"
          maxItems={4}
          showAddToCart={true}
        />

        {/* You May Also Like */}
        <ProductRecommendations
          currentProduct={product}
          type="you-may-like"
          maxItems={6}
          showAddToCart={true}
          layout="grid"
        />
      </div>

      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Write a Review">
        <ReviewForm onSubmit={handleReviewSubmit} />
      </Modal>
    </div>
  );
};

export default ProductDetailPage;
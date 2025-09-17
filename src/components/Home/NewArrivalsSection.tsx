import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowRight, Star, ShoppingBag } from 'lucide-react';
import { ProductCard } from '../Product/ProductCard';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { MobileFeaturedCarousel } from '../Mobile/MobileProductCarousel';
import { useMobileDetection } from '../../hooks/useMobileGestures';
import { supabase } from '../../lib/supabase';
import { Product } from '../../types';
import { Link } from 'react-router-dom';

interface NewArrival {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_price: number;
  product_original_price?: number;
  product_images: string[];
  product_rating: number;
  featured_until?: string;
  sort_order: number;
  created_at: string;
}

interface NewArrivalsSectionProps {
  className?: string;
  maxItems?: number;
}

export const NewArrivalsSection: React.FC<NewArrivalsSectionProps> = ({ 
  className = '', 
  maxItems = 8 
}) => {
  const [newArrivals, setNewArrivals] = useState<NewArrival[]>([]);
  const [loading, setLoading] = useState(true);
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    const fetchNewArrivals = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_active_new_arrivals', { 
          limit_count: maxItems 
        });
        
        if (error) throw error;
        
        setNewArrivals(data || []);
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNewArrivals();
  }, [maxItems]);

  // Transform new arrivals to Product format for ProductCard
  const products: Product[] = newArrivals.map(arrival => ({
    id: arrival.product_id,
    name: arrival.product_name,
    slug: arrival.product_slug,
    description: '',
    price: arrival.product_price,
    originalPrice: arrival.product_original_price,
    categoryId: '',
    images: arrival.product_images,
    stock: 0,
    rating: arrival.product_rating,
    reviews: [],
    sellerId: '',
    sellerName: '',
    tags: ['new-arrival'],
    isFeatured: true,
    isActive: true,
    createdAt: new Date(arrival.created_at),
    reviewCount: 0
  }));

  if (loading) {
    return (
      <section className={`py-8 sm:py-12 md:py-16 bg-gradient-to-br from-emerald-50 to-teal-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (newArrivals.length === 0) {
    return null; // Don't render section if no new arrivals
  }

  return (
    <section className={`py-8 sm:py-12 md:py-16 bg-gradient-to-br from-emerald-50 to-teal-50 ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8 md:mb-10"
        >
          <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            <span className="text-emerald-600 font-medium text-xs sm:text-sm uppercase tracking-wide">
              Just Arrived
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            New Arrivals
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3 sm:px-0 leading-relaxed">
            Discover our latest collection of premium attars, freshly curated for the discerning connoisseur
          </p>
        </motion.div>

        {/* Products Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {isMobile ? (
            <MobileFeaturedCarousel
              products={products}
              title="New Arrivals"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {products.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="touch-manipulation"
                >
                  <div className="relative">
                    <ProductCard product={product} />
                    {/* New Arrival Badge */}
                    <div className="absolute top-2 left-2 z-10">
                      <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-sm">
                        New
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6 sm:mt-8 md:mt-10"
        >
          <Link to="/products?filter=new-arrivals">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-emerald-600 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:bg-emerald-700 transition-all duration-300 flex items-center space-x-2 mx-auto active:bg-emerald-800 touch-manipulation"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>View All New Arrivals</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 sm:mt-10 md:mt-12"
        >
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mb-1">
              {newArrivals.length}+
            </div>
            <div className="text-xs sm:text-sm text-gray-600">New Products</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mb-1">
              100%
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Authentic</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mb-1">
              24h
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Fresh Stock</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-emerald-600 mb-1">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 inline text-yellow-400 fill-current" />
              4.9
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

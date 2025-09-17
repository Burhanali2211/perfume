import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Gift, ArrowRight, Percent, Tag, Truck, Star, Clock, Users } from 'lucide-react';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface Offer {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  offer_type: 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'free_shipping' | 'bundle';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  image_url?: string;
  banner_image_url?: string;
  is_featured: boolean;
  usage_limit?: number;
  usage_count: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until?: string;
  applicable_to: 'all_products' | 'specific_products' | 'specific_categories' | 'specific_collections';
  sort_order: number;
  created_at: string;
}

interface SpecialOffersSectionProps {
  className?: string;
  maxItems?: number;
}

export const SpecialOffersSection: React.FC<SpecialOffersSectionProps> = ({ 
  className = '', 
  maxItems = 6 
}) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase.rpc('get_active_offers', { 
          limit_count: maxItems 
        });
        
        if (error) throw error;
        
        setOffers(data || []);
      } catch (error) {
        console.error('Error fetching offers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOffers();
  }, [maxItems]);

  const getOfferIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-5 w-5" />;
      case 'fixed_amount': return <Tag className="h-5 w-5" />;
      case 'buy_one_get_one': return <Gift className="h-5 w-5" />;
      case 'free_shipping': return <Truck className="h-5 w-5" />;
      case 'bundle': return <Star className="h-5 w-5" />;
      default: return <Gift className="h-5 w-5" />;
    }
  };

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Percentage Off';
      case 'fixed_amount': return 'Fixed Discount';
      case 'buy_one_get_one': return 'BOGO Offer';
      case 'free_shipping': return 'Free Shipping';
      case 'bundle': return 'Bundle Deal';
      default: return type;
    }
  };

  const formatDiscountValue = (type: string, value: number) => {
    switch (type) {
      case 'percentage': return `${value}% OFF`;
      case 'fixed_amount': return `₹${value} OFF`;
      case 'free_shipping': return 'FREE SHIPPING';
      case 'buy_one_get_one': return 'BUY 1 GET 1';
      default: return `${value}% OFF`;
    }
  };

  const getTimeRemaining = (validUntil?: string) => {
    if (!validUntil) return null;
    
    const now = new Date();
    const end = new Date(validUntil);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h left`;
    return 'Ending soon';
  };

  if (loading) {
    return (
      <section className={`py-8 sm:py-12 md:py-16 bg-gradient-to-br from-orange-50 to-red-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return null; // Don't render section if no offers
  }

  return (
    <section className={`py-8 sm:py-12 md:py-16 bg-gradient-to-br from-orange-50 to-red-50 ${className}`}>
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
            <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
            <span className="text-orange-600 font-medium text-xs sm:text-sm uppercase tracking-wide">
              Limited Time
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            Special Offers
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3 sm:px-0 leading-relaxed">
            Don't miss out on these exclusive deals and limited-time offers on premium attars
          </p>
        </motion.div>

        {/* Offers Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
        >
          {offers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100"
            >
              {/* Background Image */}
              {offer.image_url && (
                <div className="absolute inset-0 opacity-10">
                  <img
                    src={offer.image_url}
                    alt={offer.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="relative p-4 sm:p-5 md:p-6">
                {/* Offer Type Badge */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                    {getOfferIcon(offer.offer_type)}
                    <span>{getOfferTypeLabel(offer.offer_type)}</span>
                  </div>
                  {offer.is_featured && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                </div>

                {/* Discount Value */}
                <div className="mb-3">
                  <div className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">
                    {formatDiscountValue(offer.offer_type, offer.discount_value)}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {offer.title}
                  </h3>
                  {offer.short_description && (
                    <p className="text-sm text-gray-600">
                      {offer.short_description}
                    </p>
                  )}
                </div>

                {/* Offer Details */}
                <div className="space-y-2 mb-4">
                  {offer.minimum_order_amount > 0 && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Tag className="h-3 w-3 mr-1" />
                      <span>Min order: ₹{offer.minimum_order_amount}</span>
                    </div>
                  )}
                  {offer.usage_limit && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Users className="h-3 w-3 mr-1" />
                      <span>{offer.usage_limit - offer.usage_count} uses left</span>
                    </div>
                  )}
                  {getTimeRemaining(offer.valid_until) && (
                    <div className="flex items-center text-xs text-red-600 font-medium">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>{getTimeRemaining(offer.valid_until)}</span>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Link to="/products">
                  <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-orange-700 transition-colors duration-200 group-hover:bg-orange-700">
                    Shop Now
                  </button>
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* View All Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center mt-6 sm:mt-8 md:mt-10"
        >
          <Link to="/offers">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-orange-600 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:bg-orange-700 transition-all duration-300 flex items-center space-x-2 mx-auto active:bg-orange-800 touch-manipulation"
            >
              <Gift className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>View All Offers</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

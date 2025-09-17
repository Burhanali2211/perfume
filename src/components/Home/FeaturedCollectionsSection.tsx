import React from 'react';
import { motion } from 'framer-motion';
import { Crown, ArrowRight, Star, Users, Calendar, Sparkles } from 'lucide-react';
import { useCollections } from '../../contexts/CollectionContext';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { Link } from 'react-router-dom';

interface FeaturedCollectionsSectionProps {
  className?: string;
  maxItems?: number;
}

export const FeaturedCollectionsSection: React.FC<FeaturedCollectionsSectionProps> = ({ 
  className = '', 
  maxItems = 6 
}) => {
  const { featuredCollections, loading } = useCollections();

  // Limit the number of collections to display
  const displayCollections = featuredCollections.slice(0, maxItems);

  const getCollectionTypeIcon = (type: string) => {
    switch (type) {
      case 'heritage': return <Crown className="h-4 w-4" />;
      case 'limited': return <Star className="h-4 w-4" />;
      case 'exclusive': return <Sparkles className="h-4 w-4" />;
      case 'seasonal': return <Calendar className="h-4 w-4" />;
      default: return <Crown className="h-4 w-4" />;
    }
  };

  const getCollectionTypeLabel = (type: string) => {
    switch (type) {
      case 'heritage': return 'Heritage';
      case 'limited': return 'Limited Edition';
      case 'exclusive': return 'Exclusive';
      case 'seasonal': return 'Seasonal';
      case 'signature': return 'Signature';
      case 'modern': return 'Modern';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'coming_soon': return 'bg-blue-100 text-blue-800';
      case 'sold_out': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <section className={`py-8 sm:py-12 md:py-16 bg-gradient-to-br from-purple-50 to-indigo-50 ${className}`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </section>
    );
  }

  if (displayCollections.length === 0) {
    return null; // Don't render section if no featured collections
  }

  return (
    <section className={`py-8 sm:py-12 md:py-16 bg-gradient-to-br from-purple-50 to-indigo-50 ${className}`}>
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
            <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            <span className="text-purple-600 font-medium text-xs sm:text-sm uppercase tracking-wide">
              Curated Collections
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            Featured Collections
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-3 sm:px-0 leading-relaxed">
            Explore our carefully curated collections, each telling a unique story through exquisite fragrances
          </p>
        </motion.div>

        {/* Collections Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
        >
          {displayCollections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border border-purple-100"
            >
              <Link to={`/collections/${collection.slug}`}>
                {/* Collection Image */}
                <div className="relative h-48 sm:h-56 overflow-hidden">
                  <img
                    src={collection.image}
                    alt={collection.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(collection.status)}`}>
                      {collection.status === 'coming_soon' ? 'Coming Soon' : collection.status.replace('_', ' ')}
                    </span>
                    {collection.isExclusive && (
                      <span className="bg-gold-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                        Exclusive
                      </span>
                    )}
                  </div>

                  {/* Collection Type */}
                  <div className="absolute top-3 right-3">
                    <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
                      {getCollectionTypeIcon(collection.type)}
                      <span>{getCollectionTypeLabel(collection.type)}</span>
                    </div>
                  </div>

                  {/* Collection Info Overlay */}
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 group-hover:text-purple-200 transition-colors">
                      {collection.name}
                    </h3>
                    {collection.shortDescription && (
                      <p className="text-sm text-gray-200 line-clamp-2">
                        {collection.shortDescription}
                      </p>
                    )}
                  </div>
                </div>

                {/* Collection Details */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4" />
                        <span>{collection.productCount} items</span>
                      </div>
                      {collection.price && (
                        <div className="flex items-center space-x-1">
                          <span>From ₹{collection.price}</span>
                          {collection.originalPrice && collection.originalPrice > collection.price && (
                            <span className="text-xs text-gray-400 line-through">
                              ₹{collection.originalPrice}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {collection.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {collection.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {collection.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{collection.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}

                  {/* CTA */}
                  <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors duration-200 group-hover:bg-purple-700 flex items-center justify-center space-x-2">
                    <span>Explore Collection</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </Link>
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
          <Link to="/collections">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-purple-600 text-white px-6 py-3 rounded-full font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl hover:bg-purple-700 transition-all duration-300 flex items-center space-x-2 mx-auto active:bg-purple-800 touch-manipulation"
            >
              <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>View All Collections</span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </motion.button>
          </Link>
        </motion.div>

        {/* Collection Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 sm:mt-10 md:mt-12"
        >
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-purple-600 mb-1">
              {displayCollections.length}+
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Collections</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-purple-600 mb-1">
              {displayCollections.reduce((sum, col) => sum + col.productCount, 0)}+
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Products</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-purple-600 mb-1">
              {displayCollections.filter(col => col.isExclusive).length}
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Exclusive</div>
          </div>
          <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl">
            <div className="text-lg sm:text-xl font-bold text-purple-600 mb-1">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 inline text-yellow-400 fill-current" />
              5.0
            </div>
            <div className="text-xs sm:text-sm text-gray-600">Avg Rating</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

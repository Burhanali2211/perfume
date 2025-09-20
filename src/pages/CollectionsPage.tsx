import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  ArrowRight,
  Calendar,
  Tag,
  Star,
  Crown,
  Gift,
  Zap,
  Award,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { useCollections } from '../contexts/CollectionContext';
import { Collection } from '../types';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

const getTypeIcon = (type: Collection['type']) => {
  switch (type) {
    case 'heritage': return Crown;
    case 'seasonal': return Calendar;
    case 'limited': return Zap;
    case 'exclusive': return Award;
    case 'signature': return Star;
    case 'modern': return Sparkles;
    default: return Gift;
  }
};

const getStatusBadge = (status: Collection['status']) => {
  const badges = {
    active: { text: 'Available', color: 'bg-green-100 text-green-800' },
    inactive: { text: 'Unavailable', color: 'bg-gray-100 text-gray-800' },
    coming_soon: { text: 'Coming Soon', color: 'bg-blue-100 text-blue-800' },
    sold_out: { text: 'Sold Out', color: 'bg-red-100 text-red-800' }
  };
  return badges[status] || badges.active;
};

export const CollectionsPage: React.FC = () => {
  const { collections, loading } = useCollections();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter and sort collections
  const filteredCollections = useMemo(() => {
    let filtered = collections.filter(collection => {
      const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter === 'all' || collection.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
      
      return matchesSearch && matchesType && matchesStatus;
    });

    // Sort collections
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'type':
          return a.type.localeCompare(b.type);
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'newest':
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
        case 'featured':
          return Number(b.featured) - Number(a.featured);
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return filtered;
  }, [collections, searchTerm, typeFilter, statusFilter, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              Exclusive Collections
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-3xl mx-auto">
              Discover our curated special collections featuring limited editions, seasonal blends, 
              and exclusive collaborations crafted for the discerning connoisseur
            </p>
          </motion.div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="heritage">Heritage</option>
                <option value="seasonal">Seasonal</option>
                <option value="limited">Limited</option>
                <option value="exclusive">Exclusive</option>
                <option value="signature">Signature</option>
                <option value="modern">Modern</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Available</option>
                <option value="coming_soon">Coming Soon</option>
                <option value="sold_out">Sold Out</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="name">Name</option>
                <option value="type">Type</option>
                <option value="price">Price</option>
                <option value="newest">Newest</option>
                <option value="featured">Featured</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-3 ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-3 ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing {filteredCollections.length} of {collections.length} collections
          </p>
        </div>

        {/* Collections Grid/List */}
        {filteredCollections.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            : "space-y-6"
          }>
            {filteredCollections.map((collection, index) => {
              const TypeIcon = getTypeIcon(collection.type);
              const statusBadge = getStatusBadge(collection.status);

              return (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
                    viewMode === 'list' ? 'flex' : ''
                  }`}
                >
                  {/* Collection Image */}
                  <div className={`relative overflow-hidden ${
                    viewMode === 'list' ? 'w-48 h-32' : 'h-48'
                  }`}>
                    <img
                      src={collection.image}
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-collection.jpg';
                      }}
                    />
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                        {statusBadge.text}
                      </span>
                    </div>
                    
                    {/* Discount Badge */}
                    {collection.discount && collection.discount > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                          -{collection.discount}%
                        </span>
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    {collection.featured && (
                      <div className="absolute bottom-3 left-3">
                        <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                          <Star className="h-3 w-3" />
                          <span>Featured</span>
                        </span>
                      </div>
                    )}

                    {/* Exclusive Badge */}
                    {collection.isExclusive && (
                      <div className="absolute bottom-3 right-3">
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center space-x-1">
                          <Crown className="h-3 w-3" />
                          <span>Exclusive</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Collection Content */}
                  <div className={`p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                    {/* Type and Icon */}
                    <div className="flex items-center space-x-2 mb-2">
                      <TypeIcon className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
                        {collection.type}
                      </span>
                    </div>
                    
                    {/* Collection Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {collection.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {collection.shortDescription || collection.description}
                    </p>
                    
                    {/* Product Count */}
                    <div className="flex items-center space-x-1 mb-4">
                      <Tag className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-500">
                        {collection.productCount} products
                      </span>
                    </div>
                    
                    {/* Price */}
                    {collection.price && (
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-lg font-bold text-gray-900">
                          ${collection.price}
                        </span>
                        {collection.originalPrice && collection.originalPrice > collection.price && (
                          <span className="text-sm text-gray-500 line-through">
                            ${collection.originalPrice}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* CTA Button */}
                    <Link
                      to={`/collections/${collection.slug}`}
                      className="w-full inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 group"
                    >
                      <span>Explore Collection</span>
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsPage;

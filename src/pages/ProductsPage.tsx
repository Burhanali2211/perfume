import React, { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, SlidersHorizontal, X, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductFilters, FilterState } from '../components/Product/ProductFilters';
import { EnhancedSearch } from '../components/Product/EnhancedSearch';
import { MobileProductGrid } from '../components/Mobile/MobileProductCarousel';
import { useMobileDetection } from '../hooks/useMobileGestures';
import { useProducts } from '../contexts/ProductContext';
import { useError } from '../contexts/ErrorContext';
import { EnhancedLoadingSpinner, ProgressiveLoading } from '../components/Common/EnhancedLoadingSpinner';
import { ProductGridError, NetworkStatus } from '../components/Common/ErrorFallback';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { ProductPageTrustSignals, RecentPurchaseNotification } from '../components/Trust';

// Legacy FiltersSidebar component removed - now using enhanced ProductFilters component

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, categories, loading, basicLoading, detailsLoading, fetchProducts } = useProducts();
  const { error, clearError } = useError();
  const { isMobile } = useMobileDetection();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || 'all',
    priceRange: [0, 1000] as [number, number],
    rating: 0,
    inStock: false,
    brands: [],
    tags: [],
    features: [],
    sortBy: 'featured',
    search: searchParams.get('q') || ''
  });
  const isOnline = useNetworkStatus();

  const handleRetry = () => {
    clearError();
    fetchProducts(true); // Force refresh
  };

  // Extract available filter options from products
  const availableBrands = useMemo(() => {
    return [...new Set(products.map(p => p.brand).filter(Boolean))];
  }, [products]);

  const availableTags = useMemo(() => {
    return [...new Set(products.flatMap(p => p.tags || []))];
  }, [products]);

  const availableFeatures = useMemo(() => {
    // Extract features from product descriptions or specifications
    const features = ['Free Shipping', 'Warranty', 'Eco-Friendly', 'Premium Quality', 'Fast Delivery'];
    return features;
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev, search: query }));
    setSearchParams(prev => {
      if (query) {
        prev.set('q', query);
      } else {
        prev.delete('q');
      }
      return prev;
    });
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    // Update URL params
    setSearchParams(prev => {
      if (newFilters.category !== 'all') {
        prev.set('category', newFilters.category);
      } else {
        prev.delete('category');
      }
      if (newFilters.search) {
        prev.set('q', newFilters.search);
      } else {
        prev.delete('q');
      }
      return prev;
    });
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filtering
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        p.category?.toLowerCase().includes(searchTerm) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (p.brand && p.brand.toLowerCase().includes(searchTerm))
      );
    }

    // Category filtering
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter(p =>
        p.category?.toLowerCase() === filters.category.toLowerCase() ||
        p.categoryId === filters.category
      );
    }

    // Price range filtering
    filtered = filtered.filter(p =>
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Rating filtering
    if (filters.rating > 0) {
      filtered = filtered.filter(p => p.rating >= filters.rating);
    }

    // Stock filtering
    if (filters.inStock) {
      filtered = filtered.filter(p => p.stock > 0);
    }

    // Brand filtering
    if (filters.brands.length > 0) {
      filtered = filtered.filter(p => p.brand && filters.brands.includes(p.brand));
    }

    // Tags filtering
    if (filters.tags.length > 0) {
      filtered = filtered.filter(p =>
        p.tags && filters.tags.some(tag => p.tags!.includes(tag))
      );
    }

    // Features filtering (simplified - in real app, this would check product specifications)
    if (filters.features.length > 0) {
      // For demo purposes, randomly assign features to products
      filtered = filtered.filter(p => Math.random() > 0.3);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.price - b.price);
      case 'price-high':
        return filtered.sort((a, b) => b.price - a.price);
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      case 'newest':
        return filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      default:
        return filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
  }, [products, filters]);

  // Legacy filter functions for backward compatibility
  const updateFilter = (key: string, value: unknown) => setFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => setFilters({
    category: 'all',
    priceRange: [0, 1000],
    rating: 0,
    inStock: false,
    brands: [],
    tags: [],
    features: [],
    sortBy: 'featured',
    search: ''
  });

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Luxury Header Section */}
      <div className="bg-white shadow-subtle border-b border-neutral-200">
        <div className="container-luxury py-8 lg:py-12">
          {/* Enhanced Header with Luxury Typography */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <div className="space-y-3">
              <h1 className="heading-luxury text-4xl lg:text-5xl font-light tracking-tight text-text-primary">
                Products
              </h1>
              <p className="text-luxury-muted text-lg">
                {loading ? 'Curating our collection...' : `${filteredProducts.length} exceptional products`}
              </p>
            </div>

            {/* Luxury Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFiltersChange({ ...filters, sortBy: e.target.value })}
                  className="form-input-luxury min-w-[200px] appearance-none bg-white border border-neutral-300 rounded-luxury px-4 py-3 pr-10 text-sm font-medium text-text-primary focus:ring-2 focus:ring-neutral-200 focus:border-neutral-400 transition-all duration-200"
                >
                  <option value="featured">Featured Selection</option>
                  <option value="newest">Latest Arrivals</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="name">Alphabetical</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex bg-neutral-100 rounded-luxury p-1 border border-neutral-200">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center justify-center w-10 h-10 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsFilterOpen(true)}
                className="lg:hidden btn-secondary flex items-center space-x-2 px-6 py-3 bg-white border border-neutral-300 rounded-luxury hover:bg-neutral-50 transition-all duration-200"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-medium">Filters</span>
              </button>
            </div>
          </div>

          {/* Enhanced Search */}
          <div className="max-w-2xl">
            <EnhancedSearch
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={handleSearch}
              showFilters={true}
              onFiltersToggle={() => setIsFilterOpen(true)}
              placeholder="Search products, brands, categories..."
            />
          </div>
        </div>
      </div>

      {/* Network Status */}
      <NetworkStatus isOnline={isOnline} onRetry={handleRetry} />

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-red-800">Error Loading Products</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
              <button
                onClick={handleRetry}
                className="ml-4 inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Luxury Main Content Layout */}
      <div className="container-luxury py-8 lg:py-12">
        <div className="flex gap-6 lg:gap-8 xl:gap-12">
          {/* Mobile Filter Sidebar */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
                onClick={() => setIsFilterOpen(false)}
              />
            )}
          </AnimatePresence>
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed top-0 left-0 w-80 h-full bg-white shadow-luxury z-50 lg:hidden overflow-y-auto"
              >
                <ProductFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  categories={categories}
                  availableBrands={availableBrands}
                  availableTags={availableTags}
                  availableFeatures={availableFeatures}
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(false)}
                  productCount={filteredProducts.length}
                  className="h-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Desktop Filter Sidebar - Responsive Width */}
          <aside className="hidden lg:block w-72 xl:w-80 flex-shrink-0">
            <div className="sticky top-28">
              <ProductFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                availableBrands={availableBrands}
                availableTags={availableTags}
                availableFeatures={availableFeatures}
                isOpen={true}
                onToggle={() => {}}
                productCount={filteredProducts.length}
              />
            </div>
          </aside>

          {/* Luxury Product Grid - Optimized for All Screen Sizes */}
          <div className="flex-1 min-w-0">
            {error && !products.length ? (
              <ProductGridError error={error} onRetry={handleRetry} />
            ) : basicLoading ? (
              <div className="space-y-8">
                <EnhancedLoadingSpinner
                  text="Curating products..."
                  subText="Discovering exceptional pieces for you"
                  stage={!isOnline ? 'offline' : 'loading'}
                  showProgress={true}
                  progress={products.length > 0 ? 50 : 25}
                />
                <ProductGridError showSkeleton={true} />
              </div>
            ) : (
              <>
                {detailsLoading && (
                  <ProgressiveLoading
                    className="mb-6"
                    stages={[
                      { name: 'Product catalog', completed: true, loading: false },
                      { name: 'Product details', completed: false, loading: true, description: 'Loading descriptions, reviews, and specifications' },
                      { name: 'Category information', completed: false, loading: false }
                    ]}
                  />
                )}

                {/* Luxury Responsive Product Grid */}
                <div className="block sm:hidden">
                  {/* Mobile-Optimized Grid */}
                  <MobileProductGrid
                    products={filteredProducts}
                    columns={viewMode === 'list' ? 1 : 2}
                    variant="luxury"
                  />
                </div>

                <div className="hidden sm:block">
                  {/* Desktop/Tablet Grid */}
                  <div className={`
                    ${viewMode === 'grid'
                      ? `grid gap-6 lg:gap-8 xl:gap-10
                         grid-cols-2
                         md:grid-cols-2
                         lg:grid-cols-2
                         xl:grid-cols-3
                         2xl:grid-cols-4
                         auto-rows-fr`
                      : 'space-y-8'
                    }
                  `}>
                    {filteredProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.4,
                          ease: "easeOut"
                        }}
                        className={viewMode === 'list' ? 'w-full' : ''}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Luxury Empty State */}
                {filteredProducts.length === 0 && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 lg:py-24"
                  >
                    <div className="text-neutral-300 text-8xl mb-6">🔍</div>
                    <h3 className="heading-luxury text-2xl lg:text-3xl font-light text-text-primary mb-4">
                      No products found
                    </h3>
                    <p className="text-luxury-muted text-lg max-w-md mx-auto leading-relaxed">
                      We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                    </p>
                    <button
                      onClick={() => handleFiltersChange({
                        category: 'all',
                        priceRange: [0, 1000],
                        rating: 0,
                        inStock: false,
                        brands: [],
                        tags: [],
                        features: [],
                        sortBy: 'featured',
                        search: ''
                      })}
                      className="btn-primary mt-8"
                    >
                      Clear All Filters
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Trust Signals Section */}
        <div className="mt-16 lg:mt-20">
          <ProductPageTrustSignals />
        </div>
      </div>

      {/* Social Proof Notifications */}
      <RecentPurchaseNotification
        productName="Premium Wireless Headphones"
        customerLocation="New York"
        timeAgo="2 minutes ago"
      />
    </div>
  );
};

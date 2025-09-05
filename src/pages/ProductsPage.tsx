import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, List, X, AlertCircle, RefreshCw } from 'lucide-react';
import { ProductCard } from '../components/Product/ProductCard';
import { ProductListCard } from '../components/Product/ProductListCard';
import { AttrFilters, AttrFilterState } from '../components/Product/AttrFilters';
import { MobileProductGrid } from '../components/Mobile/MobileProductCarousel';
import { useProducts } from '../contexts/ProductContext';
import { useError } from '../contexts/ErrorContext';
import { LoadingSpinner, ProgressiveLoading } from '../components/Common/LoadingSpinner';
import { ProductGridError, NetworkStatus } from '../components/Common/ErrorFallback';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { ProductPageTrustSignals, RecentPurchaseNotification } from '../components/Trust';

// Legacy FiltersSidebar component removed - now using enhanced ProductFilters component

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug } = useParams<{ slug?: string }>();
  const { products, categories, loading, basicLoading, detailsLoading, fetchProducts } = useProducts();
  const { error, clearError } = useError();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debug: Log when component mounts and when products/categories change
  useEffect(() => {
    console.log('ProductsPage mounted');
  }, []);

  useEffect(() => {
    console.log('Products updated:', products.length);
  }, [products]);

  useEffect(() => {
    console.log('Categories updated:', categories.length);
  }, [categories]);

  // Determine initial category from URL slug or search params
  const getInitialCategory = () => {
    if (slug) {
      // Find category by slug
      const category = categories.find(cat => cat.slug === slug);
      console.log('Finding category by slug:', slug, category);
      return category ? category.name : '';
    }
    const categoryParam = searchParams.get('category');
    console.log('Category param from URL:', categoryParam);
    return categoryParam || '';
  };

  const [filters, setFilters] = useState<AttrFilterState>({
    category: '',
    priceRange: [0, 25000] as [number, number],
    rating: 0,
    inStock: false,
    brands: [],
    longevity: [],
    sillage: [],
    concentration: [],
    origins: [],
    fragranceFamily: [],
    sortBy: 'featured',
    search: searchParams.get('q') || ''
  });

  // Debug: Log initial filters
  useEffect(() => {
    console.log('Initial filters set:', filters);
  }, []);

  // Update filters when URL changes
  useEffect(() => {
    const initialCategory = getInitialCategory();
    // Only update category if it's different to prevent infinite loops
    setFilters(prev => {
      // If we're on the main products page with no category, show all products
      if (!slug && !searchParams.get('category')) {
        if (prev.category !== '') {
          console.log('Resetting category filter to show all products');
          return { ...prev, category: '' };
        }
      } else if (prev.category !== initialCategory) {
        console.log('Updating category filter:', initialCategory);
        return { ...prev, category: initialCategory };
      }
      return prev;
    });
  }, [slug, searchParams, categories, getInitialCategory]);
  
  // Debug: Log products and filters to see what's happening
  useEffect(() => {
    console.log('Products loaded:', products.length);
    console.log('Categories loaded:', categories.length);
    console.log('Current filters:', filters);
  }, [products, categories, filters]);

  const isOnline = useNetworkStatus();

  const handleRetry = () => {
    clearError();
    fetchProducts(true); // Force refresh
  };

  // Attar-specific filter options extracted from products
  // Remove these unused variables
  /*
  const availableOrigins = useMemo(() => {
    return [...new Set(products.map(p => {
      const origin = p.specifications?.Origin;
      return typeof origin === 'string' ? origin : '';
    }).filter(Boolean))];
  }, [products]);

  const availableLongevity = useMemo(() => {
    return [...new Set(products.map(p => {
      const longevity = p.specifications?.Longevity;
      if (typeof longevity !== 'string') return '';
      if (longevity.includes('12+') || longevity.includes('14+') || longevity.includes('16+')) return 'very-long';
      if (longevity.includes('8+') || longevity.includes('10+')) return 'long';
      if (longevity.includes('4+') || longevity.includes('6+') || longevity.includes('7+')) return 'moderate';
      if (longevity.includes('2+')) return 'light';
      return '';
    }).filter(Boolean))];
  }, [products]);

  const availableSillage = useMemo(() => {
    return [...new Set(products.map(p => {
      const sillage = p.specifications?.Sillage;
      if (typeof sillage !== 'string') return '';
      if (sillage.includes('Very Strong')) return 'very-strong';
      if (sillage.includes('Strong')) return 'strong';
      if (sillage.includes('Moderate')) return 'moderate';
      return 'intimate';
    }).filter(Boolean))];
  }, [products]);

  const availableConcentration = useMemo(() => {
    return [...new Set(products.map(p => {
      const concentration = p.specifications?.Concentration;
      if (typeof concentration !== 'string') return '';
      if (concentration.includes('Pure Oil') || concentration.includes('Pure')) return 'pure-oil';
      if (concentration.includes('Concentrated')) return 'concentrated';
      if (concentration.includes('Blend')) return 'blend';
      return 'diluted';
    }).filter(Boolean))];
  }, [products]);
  */

  const handleFiltersChange = (newFilters: AttrFilterState) => {
    setFilters(newFilters);
    // Update URL params
    setSearchParams(prev => {
      if (newFilters.category && newFilters.category !== '' && newFilters.category !== 'all') {
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
    
    console.log('Filtering products:', {
      totalProducts: products.length,
      currentFilters: filters,
      categories: categories.map(c => c.name)
    });

    // Search filtering with enhanced attar-specific terms
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm) ||
        (p.category && p.category.toLowerCase().includes(searchTerm)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(searchTerm))) ||
        (p.sellerName && p.sellerName.toLowerCase().includes(searchTerm)) ||
        // Enhanced attar-specific search terms
        (p.specifications?.Origin && typeof p.specifications.Origin === 'string' && p.specifications.Origin.toLowerCase().includes(searchTerm)) ||
        (p.specifications?.Concentration && typeof p.specifications.Concentration === 'string' && p.specifications.Concentration.toLowerCase().includes(searchTerm)) ||
        (p.specifications?.Longevity && typeof p.specifications.Longevity === 'string' && p.specifications.Longevity.toLowerCase().includes(searchTerm)) ||
        (p.specifications?.Sillage && typeof p.specifications.Sillage === 'string' && p.specifications.Sillage.toLowerCase().includes(searchTerm)) ||
        // Search in fragrance notes and characteristics
        (searchTerm.includes('floral') && p.tags?.some(tag => ['rose', 'jasmine', 'mogra', 'floral'].includes(tag.toLowerCase()))) ||
        (searchTerm.includes('woody') && p.tags?.some(tag => ['oudh', 'sandalwood', 'woody'].includes(tag.toLowerCase()))) ||
        (searchTerm.includes('oriental') && p.tags?.some(tag => ['amber', 'saffron', 'oriental'].includes(tag.toLowerCase()))) ||
        (searchTerm.includes('musky') && p.tags?.some(tag => ['musk', 'white'].includes(tag.toLowerCase())))
      );
    }

    // Category filtering - only apply if a category is actually selected
    if (filters.category && filters.category !== '' && filters.category.toLowerCase() !== 'all') {
      console.log('Applying category filter:', filters.category);
      filtered = filtered.filter(p => {
        // Handle case where category might be undefined
        if (!p.category) {
          console.log('Product without category:', p.id, p.name);
          return false;
        }
        
        // Try exact match first
        if (p.category === filters.category) {
          console.log('Exact category match:', p.name, p.category);
          return true;
        }
        // Try case-insensitive match
        if (p.category?.toLowerCase() === filters.category.toLowerCase()) {
          console.log('Case-insensitive category match:', p.name, p.category);
          return true;
        }
        // Try category ID match
        if (p.categoryId === filters.category) {
          console.log('Category ID match:', p.name, p.categoryId);
          return true;
        }
        // Try finding category by name and matching ID
        const categoryByName = categories.find(cat => 
          cat.name && cat.name.toLowerCase() === filters.category.toLowerCase()
        );
        const result = categoryByName && p.categoryId === categoryByName.id;
        if (result) {
          console.log('Category by name match:', p.name, categoryByName.name);
        }
        return result;
      });
    }

    // Price range filtering
    filtered = filtered.filter(p =>
      p.price >= filters.priceRange[0] && p.price <= filters.priceRange[1]
    );

    // Longevity filtering
    if (filters.longevity.length > 0) {
      filtered = filtered.filter(p => {
        const longevity = p.specifications?.Longevity;
        if (typeof longevity !== 'string') return false;
        return filters.longevity.some(selectedLongevity => {
          switch (selectedLongevity) {
            case 'very-long': return longevity.includes('12+') || longevity.includes('14+') || longevity.includes('16+');
            case 'long': return longevity.includes('8+') || longevity.includes('10+');
            case 'moderate': return longevity.includes('4+') || longevity.includes('6+') || longevity.includes('7+');
            case 'light': return longevity.includes('2+') || longevity.includes('3+');
            default: return false;
          }
        });
      });
    }

    // Sillage filtering
    if (filters.sillage.length > 0) {
      filtered = filtered.filter(p => {
        const sillage = p.specifications?.Sillage;
        if (typeof sillage !== 'string') return false;
        return filters.sillage.some(selectedSillage => {
          switch (selectedSillage) {
            case 'very-strong': return sillage.includes('Very Strong');
            case 'strong': return sillage.includes('Strong') && !sillage.includes('Very Strong');
            case 'moderate': return sillage.includes('Moderate');
            case 'intimate': return !sillage.includes('Strong') && !sillage.includes('Moderate');
            default: return false;
          }
        });
      });
    }

    // Concentration filtering
    if (filters.concentration.length > 0) {
      filtered = filtered.filter(p => {
        const concentration = p.specifications?.Concentration;
        if (typeof concentration !== 'string') return false;
        return filters.concentration.some(selectedConcentration => {
          switch (selectedConcentration) {
            case 'pure-oil': return concentration.includes('Pure Oil') || concentration.includes('Pure');
            case 'concentrated': return concentration.includes('Concentrated');
            case 'blend': return concentration.includes('Blend');
            case 'diluted': return !concentration.includes('Pure') && !concentration.includes('Concentrated') && !concentration.includes('Blend');
            default: return false;
          }
        });
      });
    }

    // Origins filtering
    if (filters.origins.length > 0) {
      filtered = filtered.filter(p => {
        const origin = p.specifications?.Origin;
        if (typeof origin !== 'string') return false;
        return filters.origins.some(selectedOrigin => {
          switch (selectedOrigin) {
            case 'kannauj': return origin.toLowerCase().includes('kannauj');
            case 'mysore': return origin.toLowerCase().includes('mysore');
            case 'kashmir': return origin.toLowerCase().includes('kashmir');
            case 'assam': return origin.toLowerCase().includes('assam');
            case 'bulgarian': return origin.toLowerCase().includes('bulgaria');
            case 'cambodian': return origin.toLowerCase().includes('cambodia');
            case 'arabian': return origin.toLowerCase().includes('arab');
            default: return false;
          }
        });
      });
    }

    // Fragrance Family filtering
    if (filters.fragranceFamily.length > 0) {
      filtered = filtered.filter(p => {
        const tags = p.tags || [];
        const name = p.name.toLowerCase();
        const description = p.description.toLowerCase();
        
        return filters.fragranceFamily.some(family => {
          switch (family) {
            case 'floral': return tags.some(tag => ['rose', 'jasmine', 'mogra', 'floral'].includes(tag.toLowerCase())) || name.includes('rose') || name.includes('jasmine');
            case 'woody': return tags.some(tag => ['oudh', 'sandalwood', 'woody'].includes(tag.toLowerCase())) || name.includes('oudh') || name.includes('sandalwood');
            case 'oriental': return tags.some(tag => ['amber', 'saffron', 'oriental'].includes(tag.toLowerCase())) || name.includes('amber') || name.includes('saffron');
            case 'spicy': return tags.some(tag => ['saffron', 'spicy'].includes(tag.toLowerCase())) || description.includes('spicy');
            case 'fresh': return tags.some(tag => ['fresh', 'clean'].includes(tag.toLowerCase())) || description.includes('fresh');
            case 'musky': return tags.some(tag => ['musk', 'white'].includes(tag.toLowerCase())) || name.includes('musk');
            case 'citrus': return tags.some(tag => ['citrus', 'lemon'].includes(tag.toLowerCase())) || description.includes('citrus');
            case 'herbal': return tags.some(tag => ['herbal', 'herb'].includes(tag.toLowerCase())) || description.includes('herbal');
            default: return false;
          }
        });
      });
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
  }, [products, filters, categories]);

  // Calculate active filter count for UI
  const activeFilterCount = [
    filters.category && filters.category !== '' && filters.category.toLowerCase() !== 'all' ? 1 : 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 25000 ? 1 : 0,
    filters.longevity.length,
    filters.sillage.length,
    filters.concentration.length,
    filters.origins.length,
    filters.fragranceFamily.length,
    filters.search ? 1 : 0
  ].reduce((sum, count) => sum + count, 0);

  // Legacy filter functions for backward compatibility
  const clearFilters = () => {
    const resetFilters: AttrFilterState = {
      category: '',
      priceRange: [0, 25000],
      longevity: [],
      sillage: [],
      concentration: [],
      origins: [],
      fragranceFamily: [],
      sortBy: 'featured',
      search: '',
      // Keep for compatibility
      rating: 0,
      inStock: false,
      brands: []
    };
    setFilters(resetFilters);
    
    // Also clear URL parameters
    setSearchParams({});
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-background-primary">
      {/* Network Status */}
      <NetworkStatus isOnline={isOnline} onRetry={handleRetry} />

      {/* Page Header */}
      <div className="bg-white shadow-sm border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-br from-purple-100 to-blue-100 rounded-xl">
                <Grid className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {filters.category && filters.category !== '' 
                    ? `${filters.category} Collection` 
                    : 'All Products'
                  }
                </h1>
                <p className="text-gray-600 mt-1">
                  {filters.category && filters.category !== ''
                    ? `Discover premium ${filters.category.toLowerCase()} attars`
                    : `Explore our complete collection of ${filteredProducts.length} premium attars`
                  }
                </p>
              </div>
            </div>
            
            {/* Quick Action Buttons */}
            <div className="flex items-center space-x-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters ({activeFilterCount})
                </button>
              )}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

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

      {/* Amazon-Style Main Content Layout */}
      <div className="container-luxury-wide py-6 lg:py-8">
        <div className="flex gap-4 lg:gap-6 xl:gap-8">
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
                <AttrFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  categories={categories}
                  availableBrands={[]} // Keep for compatibility
                  isOpen={isFilterOpen}
                  onToggle={() => setIsFilterOpen(false)}
                  productCount={filteredProducts.length}
                  className="h-full"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Improved Amazon-Style Filter Sidebar - Optimized Width and Sticky Position */}
          <aside className="filter-sidebar hidden lg:block w-64 xl:w-72 2xl:w-80 flex-shrink-0">
            <div className="filter-sidebar-sticky sticky top-24 h-[calc(100vh-120px)] overflow-hidden flex flex-col">
              <AttrFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
                availableBrands={[]} // Keep for compatibility
                isOpen={true}
                onToggle={() => {}}
                productCount={filteredProducts.length}
                className="flex-1 flex flex-col h-full"
              />
            </div>
          </aside>

          {/* Amazon-Style Product Grid - Optimized for All Screen Sizes */}
          <div className="flex-1 min-w-0">
            {error && !products.length ? (
              <ProductGridError error={error} onRetry={handleRetry} />
            ) : basicLoading ? (
              <div className="space-y-8">
                <LoadingSpinner
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

                {/* Amazon-Style Responsive Product Grid */}
                <div className="block sm:hidden">
                  {/* Mobile-Optimized Grid */}
                  <MobileProductGrid
                    products={filteredProducts}
                    columns={viewMode === 'list' ? 1 : 2}
                    variant="luxury"
                  />
                </div>

                <div className="hidden sm:block">
                  {/* Amazon-Style Desktop/Tablet Grid */}
                  <div className={`
                    ${viewMode === 'grid'
                      ? 'grid-luxury-products'
                      : 'list-luxury-products'
                    }
                  `}>
                    {filteredProducts && filteredProducts.length > 0 ? (
                      filteredProducts.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            delay: index * 0.03,
                            duration: 0.4,
                            ease: "easeOut"
                          }}
                          className={`${viewMode === 'list' ? 'w-full' : 'h-full'}`}
                        >
                          {viewMode === 'list' ? (
                            <ProductListCard product={product} />
                          ) : (
                            <ProductCard product={product} />
                          )}
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full text-center py-12">
                        <p className="text-gray-500">
                          {loading ? 'Loading products...' : 'No products found matching your criteria.'}
                        </p>
                        {loading && (
                          <div className="mt-4">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Luxury Empty State */}
                {!loading && filteredProducts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 lg:py-24"
                  >
                    <div className="text-neutral-300 text-8xl mb-6">🌸</div>
                    <h3 className="heading-luxury text-2xl lg:text-3xl font-light text-text-primary mb-4">
                      No attars found
                    </h3>
                    <p className="text-luxury-muted text-lg max-w-md mx-auto leading-relaxed">
                      We couldn't find any attars matching your criteria. Try exploring different fragrance families or price ranges.
                    </p>
                    <button
                      onClick={clearFilters}
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

export default ProductsPage;

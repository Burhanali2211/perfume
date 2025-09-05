import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  TrendingUp, 
  Clock, 
  Star,
  ArrowRight,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, Category } from '../../types';
import { useProducts } from '../../contexts/ProductContext';

interface SearchSuggestion {
  type: 'product' | 'category' | 'brand' | 'trending';
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  price?: number;
  rating?: number;
  url: string;
}

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
  placeholder?: string;
  showFilters?: boolean;
  onFiltersToggle?: () => void;
  className?: string;
  autoFocus?: boolean;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = "Search for products, brands, categories...",
  showFilters = false,
  onFiltersToggle,
  className = '',
  autoFocus = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { products, categories } = useProducts();

  // Trending searches - could be fetched from analytics
  const trendingSearches = [
    'Wireless Headphones',
    'Smart Watch',
    'Running Shoes',
    'Organic Coffee',
    'Yoga Mat',
    'Bluetooth Speaker'
  ];

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Generate suggestions based on search query
    if (value.length > 1) {
      setIsLoading(true);
      const timer = setTimeout(() => {
        generateSuggestions(value);
        setIsLoading(false);
      }, 150); // Debounce

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
    }
  }, [value, products, categories]);

  const generateSuggestions = (query: string) => {
    const searchTerm = query.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Product suggestions
    const productMatches = products
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        (product.tags && product.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      )
      .slice(0, 4)
      .map(product => ({
        type: 'product' as const,
        id: product.id,
        title: product.name,
        subtitle: `₹${product.price.toLocaleString('en-IN')}`,
        image: product.images[0],
        price: product.price,
        rating: product.rating,
        url: `/products/${product.id}`
      }));

    // Category suggestions
    const categoryMatches = categories
      .filter(category => category.name.toLowerCase().includes(searchTerm))
      .slice(0, 2)
      .map(category => ({
        type: 'category' as const,
        id: category.id,
        title: category.name,
        subtitle: `${category.productCount} products`,
        url: `/products?category=${encodeURIComponent(category.name)}`
      }));

    // Brand suggestions (extract from products)
    const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
    const brandMatches = brands
      .filter(brand => brand && brand.toLowerCase().includes(searchTerm))
      .slice(0, 2)
      .map(brand => ({
        type: 'brand' as const,
        id: brand!,
        title: brand!,
        subtitle: 'Brand',
        url: `/search?q=${encodeURIComponent(brand!)}`
      }));

    newSuggestions.push(...productMatches, ...categoryMatches, ...brandMatches);
    setSuggestions(newSuggestions);
  };

  const handleSearch = (query: string) => {
    if (query.trim()) {
      // Save to recent searches
      const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('recentSearches', JSON.stringify(updated));
      
      onSearch(query);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-neutral-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-20 py-3 border border-neutral-300 rounded-xl bg-white text-neutral-900 placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
        />

        <div className="absolute inset-y-0 right-0 flex items-center space-x-2 pr-4">
          {value && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-neutral-400" />
            </button>
          )}
          
          {showFilters && onFiltersToggle && (
            <button
              onClick={onFiltersToggle}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
              aria-label="Toggle filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-neutral-600" />
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-neutral-200 rounded-xl shadow-lg z-50 overflow-hidden"
          >
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                <p className="text-sm text-neutral-600 mt-2">Searching...</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {/* Product Suggestions */}
                {suggestions.filter(s => s.type === 'product').length > 0 && (
                  <div className="p-4 border-b border-neutral-100">
                    <h4 className="text-sm font-medium text-neutral-700 mb-3">Products</h4>
                    <div className="space-y-2">
                      {suggestions.filter(s => s.type === 'product').map((suggestion) => (
                        <Link
                          key={suggestion.id}
                          to={suggestion.url}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          {suggestion.image && (
                            <img
                              src={suggestion.image}
                              alt={suggestion.title}
                              className="w-10 h-10 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-neutral-900 truncate">{suggestion.title}</p>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-primary-600 font-medium">{suggestion.subtitle}</span>
                              {suggestion.rating && (
                                <div className="flex items-center">
                                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                                  <span className="text-xs text-neutral-500 ml-1">{suggestion.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Category & Brand Suggestions */}
                {suggestions.filter(s => s.type === 'category' || s.type === 'brand').length > 0 && (
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-neutral-700 mb-3">Categories & Brands</h4>
                    <div className="space-y-1">
                      {suggestions.filter(s => s.type === 'category' || s.type === 'brand').map((suggestion) => (
                        <Link
                          key={suggestion.id}
                          to={suggestion.url}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <div>
                            <p className="font-medium text-neutral-900">{suggestion.title}</p>
                            <p className="text-sm text-neutral-500">{suggestion.subtitle}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-neutral-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : value.length > 1 ? (
              <div className="p-4 text-center">
                <p className="text-neutral-600">No results found for "{value}"</p>
                <button
                  onClick={() => handleSearch(value)}
                  className="mt-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  Search anyway
                </button>
              </div>
            ) : (
              <div className="p-4">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      Recent Searches
                    </h4>
                    <div className="space-y-1">
                      {recentSearches.map((search, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            onChange(search);
                            handleSearch(search);
                          }}
                          className="w-full text-left p-2 rounded-lg hover:bg-neutral-50 transition-colors"
                        >
                          <span className="text-neutral-700">{search}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trending Searches */}
                <div>
                  <h4 className="text-sm font-medium text-neutral-700 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Trending Searches
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {trendingSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => {
                          onChange(search);
                          handleSearch(search);
                        }}
                        className="px-3 py-1 bg-neutral-100 text-neutral-700 rounded-full text-sm hover:bg-neutral-200 transition-colors"
                      >
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

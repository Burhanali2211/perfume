import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, X, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts } from '../../contexts/ProductContext';

import { Product } from '../../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products } = useProducts();

  const [suggestions, setSuggestions] = useState<Product[]>([]);

  useEffect(() => {
    if (query.length > 1) {
      const filtered = products
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, products]);

  const trendingSearches = ['Wireless Headphones', 'Smart Watch', 'Running Shoes', 'Organic Coffee'];

  return (
    <>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xl"
          onClick={onClose}
        >
          <div className="max-w-3xl mx-auto mt-24 px-6" onClick={(e) => e.stopPropagation()}>
            <motion.div
              initial={{ y: -30, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -30, opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for luxury products..."
                  className="w-full pl-16 pr-6 py-6 text-lg rounded-3xl shadow-2xl border-2 border-neutral-200/50 bg-white/95 backdrop-blur-xl focus:border-neutral-400 focus:ring-4 focus:ring-neutral-200/30 transition-all duration-300 font-medium tracking-wide placeholder:text-neutral-400"
                  autoFocus
                />
                {/* Luxury close button */}
                <motion.button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5" />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-6 card-luxury p-6 shadow-2xl"
            >
              {suggestions.length > 0 ? (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold px-2 text-neutral-600 uppercase tracking-wide">Product Suggestions</h3>
                  {suggestions.map(product => (
                    <Link
                      key={product.id}
                      to={`/products/${product.id}`}
                      onClick={onClose}
                      className="flex items-center space-x-4 p-4 rounded-xl transition-all duration-200 hover:bg-neutral-50 hover:shadow-md luxury-hover-lift"
                    >
                      <img src={(product.images && product.images.length > 0 ? product.images[0] : '') || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMjAwIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjM3MzgwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pgo8L3N2Zz4='} alt={product.name} className="w-14 h-14 object-cover rounded-lg shadow-sm" />
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{product.name}</p>
                        <p className="text-lg font-bold text-neutral-700">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold flex items-center text-neutral-600 uppercase tracking-wide">
                    <TrendingUp className="h-4 w-4 mr-2" />Trending Searches
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {trendingSearches.map(term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-5 py-3 rounded-full transition-all duration-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-900 hover:text-white font-medium shadow-sm hover:shadow-md"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full transition-colors text-gray-300 hover:text-white hover:bg-black/20"
          >
            <X className="h-8 w-8" />
          </button>
        </motion.div>
      )}
    </>
  );
};

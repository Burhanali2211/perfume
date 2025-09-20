import React, { useState } from 'react';
// Removed framer-motion import
import { TrendingUp, ArrowRight } from 'lucide-react';
import { Product } from '../../types';
import { ProductCard } from '../Product/ProductCard';
import { ProductDetails } from '../Product/ProductDetails';
import { useProducts } from '../../contexts/ProductContext';
import { MobileCompactCarousel } from '../Mobile/MobileProductCarousel';
import { useMobileDetection } from '../../hooks/useMobileGestures';

export const TrendingSection: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { products } = useProducts();
  const { isMobile } = useMobileDetection();

  const trendingProducts = products.filter(p => p.tags && Array.isArray(p.tags) && p.tags.includes('trending')).slice(0, 6);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-blue-600 via-purple-700 to-indigo-800 text-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          {/* Removed motion animations */}
          <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-3">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-200" />
            <span className="text-blue-200 font-medium text-xs sm:text-sm">TRENDING NOW</span>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight">
            What's Hot Right Now
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-blue-200 max-w-2xl mx-auto px-3 sm:px-0 leading-relaxed">
            Don't miss out on the most popular products that everyone's talking about
          </p>
        </div>

        {isMobile ? (
          <MobileCompactCarousel
            products={trendingProducts}
            title="Trending Products"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {trendingProducts.map((product) => (
              <div key={product.id} className="touch-manipulation">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg sm:rounded-xl p-0.5">
                  <ProductCard
                    product={product}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Removed motion animations */}
        <div className="text-center mt-6 sm:mt-8 md:mt-10">
          <button className="btn-accent-darkbg !text-sm sm:!text-base active:bg-white/20 touch-manipulation">
            <span>View All Trending</span>
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-1.5" />
          </button>
        </div>
      </div>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </section>
  );
};
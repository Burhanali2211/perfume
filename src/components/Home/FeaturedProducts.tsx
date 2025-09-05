import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../Product/ProductCard';
import { ProductDetails } from '../Product/ProductDetails';
import { useProducts } from '../../contexts/ProductContext';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { MobileFeaturedCarousel } from '../Mobile/MobileProductCarousel';
import { useMobileDetection } from '../../hooks/useMobileGestures';

export const FeaturedProducts: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { featuredProducts, featuredLoading, fetchFeaturedProducts } = useProducts();
  const { isMobile } = useMobileDetection();

  useEffect(() => {
    fetchFeaturedProducts(8);
  }, [fetchFeaturedProducts]);

  return (
    <section className="py-6 sm:py-8 md:py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            Featured Attars & Perfumes
          </h2>
          <p className="text-sm sm:text-base text-gray-600 px-3 sm:px-0">
            Handpicked authentic Indian attars and premium perfumes
          </p>
        </div>

        {featuredLoading ? (
          <div className="flex justify-center py-8 sm:py-10">
            <LoadingSpinner />
          </div>
        ) : featuredProducts.length > 0 ? (
          isMobile ? (
            <MobileFeaturedCarousel
              products={featuredProducts}
              title="Featured Attars"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="touch-manipulation"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-8 sm:py-10">
            <p className="text-gray-600">No featured products available at the moment.</p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">Check back soon for our latest featured items!</p>
          </div>
        )}

        {selectedProduct && (
          <ProductDetails
            product={selectedProduct}
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
          />
        )}
      </div>
    </section>
  );
};
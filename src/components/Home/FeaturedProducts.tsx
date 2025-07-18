import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { ProductCard } from '../Product/ProductCard';
import { ProductDetails } from '../Product/ProductDetails';
import { motion } from 'framer-motion';
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
    <section className="py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Featured Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-600"
          >
            Handpicked products just for you
          </motion.p>
        </div>

        {featuredLoading ? (
          <LoadingSpinner />
        ) : featuredProducts.length > 0 ? (
          isMobile ? (
            <MobileFeaturedCarousel
              products={featuredProducts}
              title="Featured Products"
            />
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No featured products available at the moment.</p>
            <p className="text-sm text-gray-500 mt-2">Check back soon for our latest featured items!</p>
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

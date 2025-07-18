import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

  const trendingProducts = products.filter(p => p.tags.includes('trending')).slice(0, 6);

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center space-x-2 mb-4"
          >
            <TrendingUp className="h-6 w-6 text-yellow-400" />
            <span className="text-yellow-400 font-medium">TRENDING NOW</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            What's Hot Right Now
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-300 max-w-2xl mx-auto"
          >
            Don't miss out on the most popular products that everyone's talking about
          </motion.p>
        </div>

        {isMobile ? (
          <MobileCompactCarousel
            products={trendingProducts}
            title="Trending Products"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {trendingProducts.map((product) => (
              <div key={product.id}>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-1">
                  <ProductCard
                    product={product}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-accent-darkbg !text-lg"
          >
            <span>View All Trending</span>
            <ArrowRight className="h-5 w-5 ml-2" />
          </motion.button>
        </motion.div>
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

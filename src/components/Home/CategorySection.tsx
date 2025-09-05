import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Category } from '../../types';

interface CategorySectionProps {
  categories: Category[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ categories }) => {
  // Limit to exactly 6 categories
  const limitedCategories = categories.slice(0, 6);

  return (
    <section className="py-8 sm:py-12 md:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-neutral-900 mb-2 sm:mb-3 font-luxury leading-tight"
          >
            Curated Collections
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed px-3 sm:px-0"
          >
            Explore our thoughtfully curated collections, each designed to elevate your lifestyle with sophisticated elegance.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
          {limitedCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="touch-manipulation"
            >
              <Link to={`/products?category=${encodeURIComponent(category.name)}`}>
                <div className="card-interactive group relative h-48 sm:h-56 md:h-64 overflow-hidden rounded-lg sm:rounded-xl">
                  <div className="absolute inset-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Luxury gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white">
                    <h3 className="text-base sm:text-lg font-bold mb-1 text-white drop-shadow-lg">{category.name}</h3>
                    <p className="text-[10px] sm:text-xs text-gray-100 mb-2 drop-shadow-md">
                      {category.productCount} products
                    </p>
                    <div className="flex items-center text-[10px] sm:text-xs font-medium text-white drop-shadow-md">
                      <span>Explore Now</span>
                      <ArrowRight className="ml-1 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-white/95 text-neutral-900 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-md backdrop-blur-sm">
                    {category.productCount}+ items
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
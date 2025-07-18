import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Category } from '../../types';

interface CategorySectionProps {
  categories: Category[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ categories }) => {
  return (
    <section className="section-padding bg-neutral-50">
      <div className="container-luxury">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6 font-luxury"
          >
            Curated Collections
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed"
          >
            Explore our thoughtfully curated collections, each designed to elevate your lifestyle with sophisticated elegance.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link to={`/products?category=${encodeURIComponent(category.name)}`}>
                <div className="card-interactive group relative h-80 overflow-hidden">
                  <div className="absolute inset-0">
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>

                  {/* Luxury gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2 text-white drop-shadow-lg">{category.name}</h3>
                  <p className="text-sm text-gray-100 mb-4 drop-shadow-md">
                    {category.productCount} products
                  </p>
                  <div className="flex items-center text-sm font-medium text-white drop-shadow-md">
                    <span>Explore Now</span>
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-white/95 text-neutral-900 px-3 py-1 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm">
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

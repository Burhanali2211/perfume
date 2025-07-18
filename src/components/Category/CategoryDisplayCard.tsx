import React from 'react';
import { Link } from 'react-router-dom';
import { Category } from '../../types';
import { ArrowRight } from 'lucide-react';

interface CategoryDisplayCardProps {
  category: Category;
}

export const CategoryDisplayCard: React.FC<CategoryDisplayCardProps> = ({ category }) => {
  return (
    <Link to={`/products?category=${encodeURIComponent(category.name)}`}>
      <div className="group relative bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer h-80 flex flex-col justify-end">
        <img
          src={category.image}
          alt={category.name}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Enhanced gradient overlay for better text contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-transparent"></div>

        <div className="relative p-6 text-white z-10">
          <h3 className="text-2xl font-bold mb-2 text-white drop-shadow-lg">{category.name}</h3>
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
  );
};

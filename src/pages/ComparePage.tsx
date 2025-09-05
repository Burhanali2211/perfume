import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Check, X, GitCompare, Trash2 } from 'lucide-react';
import { useCompare } from '../contexts/CompareContext';
import { motion } from 'framer-motion';

export const ComparePage: React.FC = () => {
  const { items, clearCompare, removeItem } = useCompare();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <GitCompare className="h-12 w-12 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Nothing to Compare</h1>
          <p className="text-gray-600 mb-8">Add some products to the compare list to see them here.</p>
          <Link to="/products">
            <motion.button
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Browse Products
            </motion.button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const allSpecKeys = [...new Set(items.flatMap(item => Object.keys(item.specs || {})))];
  
  const mainFeatures = ['Price', 'Rating', 'Stock', ...allSpecKeys];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Compare Products</h1>
          <button
            onClick={clearCompare}
            className="flex items-center space-x-2 text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-5 w-5" />
            <span>Clear All</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-4 text-left font-semibold text-lg w-1/5">Features</th>
                {items.map((item, index) => (
                  <motion.th
                    key={item.id}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 w-1/5 border-l"
                  >
                    <div className="relative">
                      <Link to={`/products/${item.id}`}>
                        <img src={item.images[0]} alt={item.name} className="w-full h-40 object-cover rounded-lg mb-2" />
                        <h3 className="font-semibold text-gray-800 hover:text-indigo-600">{item.name}</h3>
                      </Link>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full text-gray-600 hover:bg-red-500 hover:text-white transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mainFeatures.map((feature, featureIndex) => (
                <tr key={feature} className="border-t">
                  <td className="p-4 font-medium text-gray-700">{feature}</td>
                  {items.map((item, itemIndex) => {
                    let value;
                    switch (feature) {
                      case 'Price':
                        value = <span className="font-bold text-xl text-gray-900">${item.price}</span>;
                        break;
                      case 'Rating':
                        value = (
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`h-5 w-5 ${i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            ))}
                            <span className="ml-2 text-gray-600">({item.rating})</span>
                          </div>
                        );
                        break;
                      case 'Stock':
                        value = item.stock > 0
                          ? <span className="text-green-600 flex items-center"><Check className="h-5 w-5 mr-1" /> In Stock</span>
                          : <span className="text-red-600 flex items-center"><X className="h-5 w-5 mr-1" /> Out of Stock</span>;
                        break;
                      default:
                        value = item.specs?.[feature] || <span className="text-gray-400">-</span>;
                    }
                    return (
                      <motion.td
                        key={item.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: (featureIndex * 0.05) + (itemIndex * 0.1) }}
                        className="p-4 text-center border-l"
                      >
                        {value}
                      </motion.td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t">
                <td></td>
                {items.map(item => (
                  <td key={item.id} className="p-4 border-l">
                    <motion.button
                      className="w-full btn-primary !py-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Add to Cart
                    </motion.button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;

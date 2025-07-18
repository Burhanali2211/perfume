import React from 'react';
import { Link } from 'react-router-dom';
import { X, GitCompare } from 'lucide-react';
import { useCompare } from '../../contexts/CompareContext';

export const CompareTray: React.FC = () => {
  const { items, removeItem, clearCompare } = useCompare();

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-lg shadow-[0_-5px_20px_rgba(0,0,0,0.1)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-semibold text-gray-900">Compare Products ({items.length}/4)</h3>
              <div className="flex -space-x-4">
                {items.map(item => (
                  <div key={item.id} className="relative group">
                    <img
                      src={item.images[0]}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-full border-2 border-white shadow-md"
                    />
                    <button
                      onClick={() => removeItem(item.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={clearCompare}
                className="text-sm text-gray-600 hover:text-red-600"
              >
                Clear All
              </button>
              <Link to="/compare">
                <button className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2 font-medium">
                  <GitCompare className="h-5 w-5" />
                  <span>Compare Now</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
};

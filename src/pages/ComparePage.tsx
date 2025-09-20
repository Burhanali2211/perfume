import React from 'react';
import { Link } from 'react-router-dom';
import { GitCompare } from 'lucide-react';

export const ComparePage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-8 flex items-center justify-center">
          <GitCompare className="h-12 w-12 text-gray-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Compare Products</h1>
        <p className="text-gray-600 mb-8">Compare feature will be available soon</p>
        <Link
          to="/products"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    </div>
  );
};

export default ComparePage;

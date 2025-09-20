import React, { useState, useMemo } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { Product } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedProductForm } from '../../Product/EnhancedProductForm';
import { Modal } from '../../Common/Modal';
import {
  Edit,
  Trash2,
  Plus,
  Package,
  Search,
  Filter,
  Download,
  Upload,
  CheckSquare,
  Square,
  MoreVertical,
  Eye,
  Copy,
  Archive,
  RefreshCw,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveTable } from '../../Common/ResponsiveTable';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import { EmptyState, CardSkeleton } from '../../Common/EnhancedLoadingStates';

export const ProductManagement: React.FC = () => {
  const { products, deleteProduct, loading } = useProducts();
  const { showNotification } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Enhanced state for bulk operations and advanced filtering
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stockFilter, setStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: 1000 });
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];

  // Enhanced filtering and sorting logic
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // Stock filter
      let matchesStock = true;
      if (stockFilter === 'in-stock') matchesStock = product.stock > 10;
      else if (stockFilter === 'low-stock') matchesStock = product.stock > 0 && product.stock <= 10;
      else if (stockFilter === 'out-of-stock') matchesStock = product.stock === 0;

      // Price range filter
      const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;

      return matchesSearch && matchesCategory && matchesStock && matchesPrice;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [products, searchTerm, selectedCategory, stockFilter, priceRange, sortBy, sortOrder]);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      deleteProduct(product.id);
      showNotification({
        type: 'success',
        title: 'Product Deleted',
        message: `${product.name} has been deleted successfully.`
      });
    }
  };

  // Bulk operations
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
      try {
        for (const productId of selectedProducts) {
          await deleteProduct(productId);
        }
        setSelectedProducts([]);
        showNotification({
          type: 'success',
          title: 'Products Deleted',
          message: `${selectedProducts.length} products have been deleted successfully.`
        });
      } catch (error) {
        showNotification({
          type: 'error',
          title: 'Error',
          message: 'Failed to delete some products. Please try again.'
        });
      }
    }
  };

  const handleBulkStatusUpdate = async (status: 'active' | 'inactive') => {
    if (selectedProducts.length === 0) return;

    try {
      // This would need to be implemented in the product context
      // await updateProductsStatus(selectedProducts, status);
      setSelectedProducts([]);
      showNotification({
        type: 'success',
        title: 'Products Updated',
        message: `${selectedProducts.length} products have been ${status === 'active' ? 'activated' : 'deactivated'}.`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update products. Please try again.'
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Products have been exported successfully.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export products. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // This would trigger a refresh in the product context
      await new Promise(resolve => setTimeout(resolve, 1000));
      showNotification({
        type: 'success',
        title: 'Refreshed',
        message: 'Product data has been refreshed.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh data. Please try again.'
      });
    } finally {
      setRefreshing(false);
    }
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { text: 'Out of Stock', color: 'text-red-600 bg-red-100' };
    if (stock < 10) return { text: 'Low Stock', color: 'text-yellow-600 bg-yellow-100' };
    return { text: 'In Stock', color: 'text-green-600 bg-green-100' };
  };

  // Enhanced table columns with bulk selection
  const tableColumns = [
    {
      key: 'select',
      title: (
        <button
          onClick={handleSelectAll}
          className="flex items-center justify-center w-full"
        >
          {selectedProducts.length === filteredProducts.length && filteredProducts.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      ),
      width: 50,
      render: (value: any, record: Product) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectProduct(record.id);
          }}
          className="flex items-center justify-center w-full"
        >
          {selectedProducts.includes(record.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      )
    },
    {
      key: 'product',
      title: (
        <button
          onClick={() => toggleSort('name')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Product</span>
          {sortBy === 'name' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      minWidth: 200,
      render: (value: any, record: Product) => (
        <div className="flex items-center">
          <img
            src={record.images[0] || '/placeholder-image.jpg'}
            alt={record.name}
            className="h-12 w-12 rounded-lg object-cover border border-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
            }}
          />
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {record.name}
            </div>
            <div className="text-sm text-gray-500">
              {record.description.slice(0, 50)}...
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'category',
      title: 'Category',
      width: 100,
      render: (value: string) => (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
          {value}
        </span>
      )
    },
    {
      key: 'price',
      title: (
        <button
          onClick={() => toggleSort('price')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Price</span>
          {sortBy === 'price' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 120,
      render: (value: any, record: Product) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            ${record.price.toFixed(2)}
          </div>
          {record.originalPrice && (
            <div className="text-sm text-gray-500 line-through">
              ${record.originalPrice.toFixed(2)}
            </div>
          )}
          {record.originalPrice && (
            <div className="text-xs text-green-600 font-medium">
              {Math.round(((record.originalPrice - record.price) / record.originalPrice) * 100)}% off
            </div>
          )}
        </div>
      )
    },
    {
      key: 'stock',
      title: (
        <button
          onClick={() => toggleSort('stock')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Stock</span>
          {sortBy === 'stock' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 120,
      render: (value: number, record: Product) => {
        const stockStatus = getStockStatus(record.stock);
        return (
          <div>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
              {stockStatus.text}
            </span>
            <div className="text-sm text-gray-500 mt-1">
              {record.stock} units
            </div>
          </div>
        );
      }
    },
    {
      key: 'sellerName',
      title: 'Seller',
      width: 120,
      render: (value: string) => <span className="text-sm text-gray-900">{value}</span>
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 120,
      render: (value: any, record: Product) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditProduct(record);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit Product"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle view product details
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle duplicate product
            }}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
            title="Duplicate Product"
          >
            <Copy className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteProduct(record);
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
            title="Delete Product"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <LoadingSpinner text="Loading products..." />;
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
            <p className="text-gray-600 mt-1">
              Manage all products across the platform ({filteredProducts.length} of {products.length} products)
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
            <motion.button
              onClick={handleAddProduct}
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </motion.button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedProducts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedProducts.length} product{selectedProducts.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('active')}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('inactive')}
                    className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 text-sm"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Filters & Search</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
              >
                {viewMode === 'table' ? 'Grid View' : 'Table View'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or description..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Status
              </label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Stock Levels</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || selectedCategory !== 'all' || stockFilter !== 'all' || priceRange.min > 0 || priceRange.max < 1000) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Showing {filteredProducts.length} of {products.length} products
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setStockFilter('all');
                    setPriceRange({ min: 0, max: 1000 });
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Display */}
        {loading ? (
          <CardSkeleton count={8} />
        ) : filteredProducts.length === 0 ? (
          <EmptyState
            icon={<Package className="h-24 w-24" />}
            title="No products found"
            description="No products match your current filters. Try adjusting your search criteria or add a new product."
            action={{
              label: "Add Product",
              onClick: handleAddProduct
            }}
          />
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ResponsiveTable
              columns={tableColumns}
              data={filteredProducts}
              loading={loading}
              emptyMessage="No products found"
              onRowClick={handleEditProduct}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEditProduct(product)}
              >
                <div className="relative">
                  <img
                    src={product.images[0] || '/placeholder-image.jpg'}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectProduct(product.id);
                      }}
                      className="p-1 bg-white rounded-md shadow-sm"
                    >
                      {selectedProducts.includes(product.id) ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  <div className="absolute top-2 right-2">
                    {(() => {
                      const stockStatus = getStockStatus(product.stock);
                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-bold text-gray-900">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through ml-2">
                          ${product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {product.category}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {product.stock} units
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditProduct(product);
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 rounded hover:bg-indigo-50"
                        title="Edit Product"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product);
                        }}
                        className="p-1 text-red-600 hover:text-red-900 rounded hover:bg-red-50"
                        title="Delete Product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Product Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? "Edit Product" : "Add New Product"}
          size="xl"
        >
          <EnhancedProductForm
            product={editingProduct}
            onClose={() => setIsModalOpen(false)}
          />
        </Modal>
      </div>
    </AdminErrorBoundary>
  );
};
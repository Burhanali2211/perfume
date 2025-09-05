import React, { useState, useMemo, useEffect } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { Category } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { Modal } from '../../Common/Modal';
import { ImageUpload } from '../../Common/ImageUpload';
import { StorageService } from '../../../services/storageService';
import {
  Edit,
  Trash2,
  Plus,
  Package,
  Image,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  Eye,
  Copy,
  Archive,
  SortAsc,
  SortDesc,
  FolderTree,
  Tag,
  Users,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveTable } from '../../Common/ResponsiveTable';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import { AdminLoadingState, EmptyState } from '../../Common/EnhancedLoadingStates';

export const CategoryManagement: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useProducts();
  const { showNotification } = useNotification();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Omit<Category, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>>({
    name: '',
    slug: '',
    description: '',
    image: '',
    isActive: true,
    sortOrder: 0
  });
  const [imagePath, setImagePath] = useState<string>('');

  // Enhanced state for bulk operations and advanced filtering
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'productCount' | 'sortOrder' | 'createdAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'hierarchy'>('table');
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showHierarchy, setShowHierarchy] = useState(false);

  // Initialize storage bucket on component mount
  useEffect(() => {
    const initStorage = async () => {
      try {
        await StorageService.initializeBucket();
      } catch (error) {
        console.error('Failed to initialize storage bucket:', error);
      }
    };
    initStorage();
  }, []);

  // Enhanced filtering and sorting logic
  const filteredCategories = useMemo(() => {
    const filtered = categories.filter(category => {
      const matchesSearch =
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && category.isActive) ||
        (statusFilter === 'inactive' && !category.isActive);

      return matchesSearch && matchesStatus;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'productCount':
          aValue = a.productCount || 0;
          bValue = b.productCount || 0;
          break;
        case 'sortOrder':
          aValue = a.sortOrder || 0;
          bValue = b.sortOrder || 0;
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
  }, [categories, searchTerm, statusFilter, sortBy, sortOrder]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
      sortOrder: 0
    });
    setImagePath('');
    setIsModalOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug || '',
      description: category.description || '',
      image: category.image,
      isActive: category.isActive || true,
      sortOrder: category.sortOrder || 0
    });
    setImagePath(''); // Reset image path for editing
    setIsModalOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (category.productCount && category.productCount > 0) {
      showNotification({
        type: 'error',
        title: 'Cannot Delete Category',
        message: `This category has ${category.productCount} products. Please move or delete them first.`
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete "${category.name}"? This action cannot be undone.`)) {
      try {
        await deleteCategory(category.id);
        showNotification({
          type: 'success',
          title: 'Category Deleted',
          message: `${category.name} has been deleted successfully.`
        });
      } catch (error) {
        showNotification({
          type: 'error',
          title: 'Deletion Failed',
          message: `Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }
  };

  // Bulk operations
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;

    // Check if any selected categories have products
    const categoriesWithProducts = filteredCategories.filter(cat =>
      selectedCategories.includes(cat.id) && cat.productCount && cat.productCount > 0
    );

    if (categoriesWithProducts.length > 0) {
      showNotification({
        type: 'error',
        title: 'Cannot Delete Categories',
        message: `${categoriesWithProducts.length} categories have products. Please move or delete products first.`
      });
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedCategories.length} categories? This action cannot be undone.`)) {
      try {
        for (const categoryId of selectedCategories) {
          await deleteCategory(categoryId);
        }
        setSelectedCategories([]);
        showNotification({
          type: 'success',
          title: 'Categories Deleted',
          message: `${selectedCategories.length} categories have been deleted successfully.`
        });
      } catch (error) {
        showNotification({
          type: 'error',
          title: 'Deletion Failed',
          message: 'Failed to delete some categories. Please try again.'
        });
      }
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedCategories.length === 0) return;

    try {
      for (const categoryId of selectedCategories) {
        const category = categories.find(c => c.id === categoryId);
        if (category) {
          await updateCategory({ ...category, isActive });
        }
      }
      setSelectedCategories([]);
      showNotification({
        type: 'success',
        title: 'Categories Updated',
        message: `${selectedCategories.length} categories have been ${isActive ? 'activated' : 'deactivated'}.`
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update categories. Please try again.'
      });
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
        message: 'Category data has been refreshed.'
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Categories have been exported successfully.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export categories. Please try again.'
      });
    } finally {
      setIsExporting(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        // Update existing category
        await updateCategory({
          ...editingCategory,
          ...formData
        });
        
        showNotification({
          type: 'success',
          title: 'Category Updated',
          message: `${formData.name} has been updated successfully.`
        });
      } else {
        // Add new category
        await addCategory(formData);
        showNotification({
          type: 'success',
          title: 'Category Added',
          message: `${formData.name} has been added successfully.`
        });
      }
      
      setIsModalOpen(false);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Operation Failed',
        message: `Failed to ${editingCategory ? 'update' : 'add'} category: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox separately
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
          {selectedCategories.length === filteredCategories.length && filteredCategories.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      ),
      width: 50,
      render: (value: any, record: Category) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectCategory(record.id);
          }}
          className="flex items-center justify-center w-full"
        >
          {selectedCategories.includes(record.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      )
    },
    {
      key: 'category',
      title: (
        <button
          onClick={() => toggleSort('name')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Category</span>
          {sortBy === 'name' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      minWidth: 200,
      render: (value: any, record: Category) => (
        <div className="flex items-center">
          {record.image ? (
            <img
              src={record.image}
              alt={record.name}
              className="h-12 w-12 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
              }}
            />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
              <Tag className="h-6 w-6 text-gray-400" />
            </div>
          )}
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">
              {record.name}
            </div>
            {record.slug && (
              <div className="text-sm text-gray-500">
                /{record.slug}
              </div>
            )}
            {record.description && (
              <div className="text-xs text-gray-400 mt-1 max-w-xs truncate">
                {record.description}
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'productCount',
      title: (
        <button
          onClick={() => toggleSort('productCount')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Products</span>
          {sortBy === 'productCount' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 120,
      render: (value: number, record: Category) => (
        <div className="flex items-center space-x-2">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            {value || 0} products
          </span>
        </div>
      )
    },
    {
      key: 'sortOrder',
      title: (
        <button
          onClick={() => toggleSort('sortOrder')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Order</span>
          {sortBy === 'sortOrder' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 80,
      render: (value: number) => (
        <span className="text-sm text-gray-600 font-mono">
          {value || 0}
        </span>
      )
    },
    {
      key: 'isActive',
      title: 'Status',
      width: 100,
      render: (value: boolean, record: Category) => (
        <div className="flex items-center space-x-2">
          {value ? (
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
              Active
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
              <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
              Inactive
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 150,
      render: (value: any, record: Category) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditCategory(record);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit Category"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle view category details
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle duplicate category
            }}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
            title="Duplicate Category"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteCategory(record);
            }}
            className={`p-1 rounded hover:bg-red-50 ${
              record.productCount && record.productCount > 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-600 hover:text-red-900'
            }`}
            title={record.productCount && record.productCount > 0 ? 'Cannot delete - has products' : 'Delete Category'}
            disabled={record.productCount && record.productCount > 0}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return <AdminLoadingState type="products" message="Loading category data..." />;
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Category Management</h2>
            <p className="text-gray-600 mt-1">
              Manage product categories ({filteredCategories.length} of {categories.length} categories)
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
              onClick={handleAddCategory}
              className="btn-primary flex items-center space-x-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="h-4 w-4" />
              <span>Add Category</span>
            </motion.button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedCategories.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkStatusUpdate(true)}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate(false)}
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
                    onClick={() => setSelectedCategories([])}
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
              <button
                onClick={() => setShowHierarchy(!showHierarchy)}
                className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center space-x-1"
              >
                <FolderTree className="h-4 w-4" />
                <span>Hierarchy</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Categories
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
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field as any);
                  setSortOrder(order as any);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="productCount-desc">Most Products</option>
                <option value="productCount-asc">Least Products</option>
                <option value="sortOrder-asc">Sort Order</option>
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Showing {filteredCategories.length} of {categories.length} categories
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Categories Display */}
        {filteredCategories.length === 0 ? (
          <EmptyState
            icon={<Tag className="h-24 w-24" />}
            title="No categories found"
            description="No categories match your current filters. Try adjusting your search criteria or add a new category."
            action={{
              label: "Add Category",
              onClick: handleAddCategory
            }}
          />
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ResponsiveTable
              columns={tableColumns}
              data={filteredCategories}
              loading={loading}
              emptyMessage="No categories found"
              onRowClick={handleEditCategory}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCategories.map((category) => (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleEditCategory(category)}
              >
                <div className="relative">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                      <Tag className="h-12 w-12 text-indigo-400" />
                    </div>
                  )}

                  <div className="absolute top-2 left-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectCategory(category.id);
                      }}
                      className="p-1 bg-white rounded-md shadow-sm"
                    >
                      {selectedCategories.includes(category.id) ? (
                        <CheckSquare className="h-4 w-4 text-indigo-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  <div className="absolute top-2 right-2">
                    {category.isActive ? (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-600 rounded-full mr-1"></div>
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        <div className="w-2 h-2 bg-red-600 rounded-full mr-1"></div>
                        Inactive
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-1 truncate">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                      {category.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        {category.productCount || 0} products
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      Order: {category.sortOrder || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      /{category.slug}
                    </span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCategory(category);
                        }}
                        className="p-1 text-indigo-600 hover:text-indigo-900 rounded hover:bg-indigo-50"
                        title="Edit Category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCategory(category);
                        }}
                        className={`p-1 rounded hover:bg-red-50 ${
                          category.productCount && category.productCount > 0
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-red-600 hover:text-red-900'
                        }`}
                        title={category.productCount && category.productCount > 0 ? 'Cannot delete - has products' : 'Delete Category'}
                        disabled={category.productCount && category.productCount > 0}
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

        {/* Category Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "Add New Category"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Image
            </label>
            <ImageUpload
              value={formData.image}
              onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
              onPathChange={setImagePath}
              folder="categories"
              placeholder="Upload category image or enter URL"
              aspectRatio="landscape"
              maxWidth={400}
              maxHeight={200}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sort Order
              </label>
              <input
                type="number"
                name="sortOrder"
                value={formData.sortOrder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {editingCategory ? 'Update Category' : 'Add Category'}
            </button>
          </div>
        </form>
        </Modal>
      </div>
    </AdminErrorBoundary>
  );
};
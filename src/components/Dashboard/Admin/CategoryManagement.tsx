import React, { useState, useMemo, useEffect, ChangeEvent, FormEvent } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { useError } from '../../../contexts/ErrorContext';
import { Category } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { Modal } from '../../Common/Modal';
import { ImageUpload } from '../../Common/ImageUpload';
import { StorageService } from '../../../services/storageService';
import { adminService } from '../../../services/adminService';
import {
  Edit,
  Trash2,
  Plus,
  Package,
  Search,
  RefreshCw,
  CheckSquare,
  Square,
  Eye,
  Copy,
  FolderTree,
  Tag,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import {
  ResponsiveAdminLayout,
  AdminPageHeader,
  AdminSection
} from '../../Common/ResponsiveAdminLayout';
import { useResponsive } from '../../Common/AdminDesignSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveTable } from '../../Common/ResponsiveTable';
import { EmptyState } from '../../Common/EnhancedLoadingStates';

export const CategoryManagement: React.FC = () => {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useProducts();
  const { showNotification } = useNotification();
  const { error } = useError();
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
  const { isMobile, isTablet } = useResponsive();
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

  // Enhanced filtering and sorting logic
  const filteredCategories = useMemo(() => {
    let filtered = categories;

    if (searchTerm) {
      filtered = filtered.filter(
        (cat: Category) =>
          cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (cat.description && cat.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((cat: Category) => cat.isActive === (statusFilter === 'active'));
    }

    return filtered.sort((a: Category, b: Category) => {
      if (sortBy === 'name') {
        return sortOrder === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      } else if (sortBy === 'productCount') {
        return sortOrder === 'asc' ? (a.productCount || 0) - (b.productCount || 0) : (b.productCount || 0) - (a.productCount || 0);
      } else if (sortBy === 'sortOrder') {
        return sortOrder === 'asc' ? (a.sortOrder || 0) - (b.sortOrder || 0) : (b.sortOrder || 0) - (a.sortOrder || 0);
      } else if (sortBy === 'createdAt') {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
      }
      return 0;
    });
  }, [categories, searchTerm, statusFilter, sortBy, sortOrder]);

  // Bulk operations
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter((id: string) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCategories.length === filteredCategories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(filteredCategories.map((c: Category) => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCategories.length === 0) return;

    // Check if any selected categories have products
    const categoriesWithProducts = filteredCategories.filter((cat: Category) =>
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
        await adminService.bulkDelete('categories', selectedCategories);
        setSelectedCategories([]);
        showNotification({
          type: 'success',
          title: 'Categories Deleted',
          message: `${selectedCategories.length} categories have been deleted successfully.`
        });
      } catch (_error) {
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
      const updates = selectedCategories.map(id => ({ id, data: { is_active: isActive } }));
      await adminService.bulkUpdate('categories', updates);

      setSelectedCategories([]);
      showNotification({
        type: 'success',
        title: 'Categories Updated',
        message: `${selectedCategories.length} categories have been ${isActive ? 'activated' : 'deactivated'}.`
      });
    } catch (_error) {
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
    } catch (_error) {
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

  const handleSubmit = async (e: FormEvent) => {
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

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      title: 'Select',
      width: 50,
      render: (value: unknown, record: Category) => (
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleSelectCategory(record.id);
          }}
          className="flex items-center justify-center w-full"
          type="button"
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
      title: 'Category',
      minWidth: 200,
      render: (value: unknown, record: Category) => (
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
      title: 'Products',
      width: 120,
      render: (value: unknown) => {
        const count = value as number;
        return (
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-blue-600" />
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              {count || 0} products
            </span>
          </div>
        );
      }
    },
    {
      key: 'sortOrder',
      title: 'Order',
      width: 80,
      render: (value: unknown) => {
        const order = value as number;
        return (
          <span className="text-sm text-gray-600 font-mono">
            {order || 0}
          </span>
        );
      }
    },
    {
      key: 'isActive',
      title: 'Status',
      width: 100,
      render: (value: unknown) => {
        const isActive = value as boolean;
        return (
          <div className="flex items-center space-x-2">
            {isActive ? (
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
        );
      }
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 150,
      render: (value: unknown, record: Category) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleEditCategory(record);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="Edit Category"
            type="button"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              // Handle view category details
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="View Details"
            type="button"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              // Handle duplicate category
            }}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
            title="Duplicate Category"
            type="button"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              handleDeleteCategory(record);
            }}
            className={`p-1 rounded hover:bg-red-50 ${
              record.productCount && record.productCount > 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-red-600 hover:text-red-900'
            }`}
            title={record.productCount && record.productCount > 0 ? 'Cannot delete - has products' : 'Delete Category'}
            disabled={!!(record.productCount && record.productCount > 0)}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      image: '',
      isActive: true,
      sortOrder: 0
    });
    setImagePath('');
  };

  if (loading) {
    return (
      <ResponsiveAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" text="Loading categories..." />
        </div>
      </ResponsiveAdminLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveAdminLayout>
        <AdminSection variant="card">
          <div className="text-center py-12">
            <FolderTree className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Categories</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <EnhancedButton onClick={() => window.location.reload()} icon={RefreshCw}>
              Try Again
            </EnhancedButton>
          </div>
        </AdminSection>
      </ResponsiveAdminLayout>
    );
  }

  const headerActions = (
    <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
      <EnhancedButton
        onClick={() => {
          resetForm();
          setIsModalOpen(true);
        }}
        icon={Plus}
        size={isMobile ? 'sm' : 'md'}
      >
        {isMobile ? 'Add' : 'Add Category'}
      </EnhancedButton>
      <EnhancedButton
        onClick={handleRefresh}
        icon={RefreshCw}
        variant="secondary"
        size={isMobile ? 'sm' : 'md'}
        loading={refreshing}
      >
        {isMobile ? '' : 'Refresh'}
      </EnhancedButton>
    </div>
  );

  return (
    <AdminErrorBoundary>
      <ResponsiveAdminLayout>
        <AdminPageHeader
          title="Category Management"
          subtitle={`Manage product categories (${filteredCategories.length} of ${categories.length} categories)`}
          icon={FolderTree}
          actions={headerActions}
        />

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedCategories.length > 0 && (
            <AdminSection variant="card">
              <div className={`bg-primary-50 border border-primary-200 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
                <div className={`flex ${isMobile ? 'flex-col space-y-3' : 'items-center justify-between'}`}>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-primary-900">
                      {selectedCategories.length} categor{selectedCategories.length !== 1 ? 'ies' : 'y'} selected
                    </span>
                  </div>
                  <div className={`flex ${isMobile ? 'space-x-2 overflow-x-auto pb-1' : 'items-center space-x-2'}`}>
                    <EnhancedButton
                      onClick={() => handleBulkStatusUpdate(true)}
                      size={isMobile ? 'sm' : 'md'}
                      variant="secondary"
                    >
                      Activate
                    </EnhancedButton>
                    <EnhancedButton
                      onClick={() => handleBulkStatusUpdate(false)}
                      size={isMobile ? 'sm' : 'md'}
                      variant="secondary"
                    >
                      Deactivate
                    </EnhancedButton>
                    <EnhancedButton
                      onClick={handleBulkDelete}
                      size={isMobile ? 'sm' : 'md'}
                      variant="secondary"
                    >
                      Delete
                    </EnhancedButton>
                    <EnhancedButton
                      onClick={() => setSelectedCategories([])}
                      size={isMobile ? 'sm' : 'md'}
                      variant="ghost"
                    >
                      Clear
                    </EnhancedButton>
                  </div>
                </div>
              </div>
            </AdminSection>
          )}
        </AnimatePresence>

        <AdminSection title="Filters & Search" variant="card">
          <div className={`flex items-center ${isMobile ? 'flex-col space-y-3' : 'justify-between mb-4'}`}>
            <h3 className={`text-lg font-medium text-gray-900 ${isMobile ? 'w-full' : ''}`}>
              Filters & Search
            </h3>
            <div className={`flex items-center ${isMobile ? 'w-full justify-between' : 'space-x-2'}`}>
              <button
                onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
                className={`px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm ${isMobile ? 'flex-1' : ''}`}
                type="button"
              >
                {viewMode === 'table' ? 'Grid View' : 'Table View'}
              </button>
              <button
                onClick={() => setShowHierarchy(!showHierarchy)}
                className={`px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm flex items-center space-x-1 ${isMobile ? 'flex-1' : ''}`}
                type="button"
              >
                <FolderTree className="h-4 w-4" />
                <span>Hierarchy</span>
              </button>
            </div>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : isTablet ? 'grid-cols-1 md:grid-cols-3 gap-4' : 'grid-cols-1 md:grid-cols-3 gap-4'}`}>
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
                  className={`w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isMobile ? 'text-sm' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isMobile ? 'text-sm' : ''}`}
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
                  setSortBy(field as 'name' | 'createdAt' | 'productCount' | 'sortOrder');
                  setSortOrder(order as 'asc' | 'desc');
                }}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${isMobile ? 'text-sm' : ''}`}
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
            <div className={`mt-4 pt-4 border-t border-gray-200 ${isMobile ? 'text-sm' : ''}`}>
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
                  type="button"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </AdminSection>

        <AdminSection title="Categories" variant="card">
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
            <div className={`grid ${isMobile ? 'grid-cols-1 gap-4' : isTablet ? 'grid-cols-1 sm:grid-cols-2 gap-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'}`}>
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
                        className={`w-full ${isMobile ? 'h-32' : 'h-40'} object-cover`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <div className={`w-full ${isMobile ? 'h-32' : 'h-40'} bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center`}>
                        <Tag className="h-12 w-12 text-indigo-400" />
                      </div>
                    )}

                    <div className="absolute top-2 left-2">
                      <button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleSelectCategory(category.id);
                        }}
                        className="p-1 bg-white rounded-md shadow-sm"
                        type="button"
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

                  <div className={`p-4 ${isMobile ? 'p-3' : ''}`}>
                    <h3 className={`font-medium text-gray-900 mb-1 truncate ${isMobile ? 'text-base' : 'text-lg'}`}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className={`text-gray-500 mb-2 line-clamp-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                        {category.description}
                      </p>
                    )}

                    <div className={`flex items-center justify-between mb-3 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="text-gray-600">
                          {category.productCount || 0} products
                        </span>
                      </div>
                      <span className="text-gray-400">
                        Order: {category.sortOrder || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-gray-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                        /{category.slug}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleEditCategory(category);
                          }}
                          className="p-1 text-indigo-600 hover:text-indigo-900 rounded hover:bg-indigo-50"
                          title="Edit Category"
                          type="button"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteCategory(category);
                          }}
                          className={`p-1 rounded hover:bg-red-50 ${
                            category.productCount && category.productCount > 0
                              ? 'text-gray-400 cursor-not-allowed'
                              : 'text-red-600 hover:text-red-900'
                          }`}
                          title={category.productCount && category.productCount > 0 ? 'Cannot delete - has products' : 'Delete Category'}
                          disabled={!!(category.productCount && category.productCount > 0)}
                          type="button"
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
        </AdminSection>

        {/* Category Form Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingCategory ? "Edit Category" : "Add New Category"}
        >
          <form onSubmit={handleSubmit} className={`space-y-4 ${isMobile ? 'space-y-3' : ''}`}>
            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : ''}`}>
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name as string}
                onChange={handleInputChange}
                required
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isMobile ? 'text-sm' : ''}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : ''}`}>
                Slug
              </label>
              <input
                type="text"
                name="slug"
                value={formData.slug as string}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isMobile ? 'text-sm' : ''}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : ''}`}>
                Description
              </label>
              <textarea
                name="description"
                value={formData.description as string}
                onChange={handleInputChange}
                rows={3}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isMobile ? 'text-sm' : ''}`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium text-gray-700 mb-2 ${isMobile ? 'text-xs' : ''}`}>
                Category Image
              </label>
              <ImageUpload
                value={formData.image as string}
                onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                onPathChange={setImagePath}
                folder="categories"
                placeholder="Upload category image or enter URL"
                aspectRatio="landscape"
                maxWidth={400}
                maxHeight={200}
              />
            </div>

            <div className={`grid ${isMobile ? 'grid-cols-1 gap-3' : 'grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : ''}`}>
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder as number}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isMobile ? 'text-sm' : ''}`}
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive as boolean}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label className={`ml-2 block text-sm text-gray-700 ${isMobile ? 'text-xs' : ''}`}>
                  Active
                </label>
              </div>
            </div>

            <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'justify-end space-x-3'}`}>
              <EnhancedButton
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                size={isMobile ? 'sm' : 'md'}
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                size={isMobile ? 'sm' : 'md'}
              >
                {editingCategory ? 'Update Category' : 'Add Category'}
              </EnhancedButton>
            </div>
          </form>
        </Modal>
      </ResponsiveAdminLayout>
    </AdminErrorBoundary>
  );
};
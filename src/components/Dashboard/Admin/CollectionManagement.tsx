import React, { useState, useMemo, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useCollections } from '../../../contexts/CollectionContext';
import { Collection } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { Modal } from '../../Common/Modal';
import { ImageUpload } from '../../Common/ImageUpload';
import { StorageService } from '../../../services/storageService';
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Copy,
  RefreshCw,
  Calendar,
  Tag,
  Crown,
  Zap,
  Award,
  Sparkles,
  Gift,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';



interface CollectionManagementProps {
  className?: string;
}

export const CollectionManagement: React.FC<CollectionManagementProps> = ({ className = '' }) => {
  const {
    collections,
    loading: contextLoading,
    addCollection,
    updateCollection,
    deleteCollection,
    refreshCollections
  } = useCollections();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showNotification } = useNotification();

  // Form state
  const [formData, setFormData] = useState<Omit<Collection, 'id' | 'productCount' | 'createdAt' | 'updatedAt'>>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    image: '',
    bannerImage: '',
    type: 'modern',
    status: 'active',
    price: 0,
    originalPrice: 0,
    discount: 0,
    productIds: [],
    featured: false,
    isExclusive: false,
    sortOrder: 0,
    tags: []
  });
  const [imagePath, setImagePath] = useState<string>('');
  const [bannerImagePath, setBannerImagePath] = useState<string>('');

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

  // Generate slug from name
  useEffect(() => {
    if (formData.name && !editingCollection) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.name, editingCollection]);

  // Calculate discount percentage
  useEffect(() => {
    if (formData.price && formData.originalPrice && formData.originalPrice > formData.price) {
      const discount = Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100);
      setFormData(prev => ({ ...prev, discount }));
    } else {
      setFormData(prev => ({ ...prev, discount: 0 }));
    }
  }, [formData.price, formData.originalPrice]);

  // Filtered and sorted collections
  const filteredCollections = useMemo(() => {
    let filtered = collections.filter(collection => {
      const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
      const matchesType = typeFilter === 'all' || collection.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort collections
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'productCount':
          aValue = a.productCount;
          bValue = b.productCount;
          break;
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'sortOrder':
          aValue = a.sortOrder || 0;
          bValue = b.sortOrder || 0;
          break;
        case 'createdAt':
          aValue = a.createdAt?.getTime() || 0;
          bValue = b.createdAt?.getTime() || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [collections, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const handleAddCollection = () => {
    setEditingCollection(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      image: '',
      bannerImage: '',
      type: 'modern',
      status: 'active',
      price: 0,
      originalPrice: 0,
      discount: 0,
      productIds: [],
      featured: false,
      isExclusive: false,
      sortOrder: 0,
      tags: []
    });
    setImagePath('');
    setBannerImagePath('');
    setIsModalOpen(true);
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug || '',
      description: collection.description || '',
      shortDescription: collection.shortDescription || '',
      image: collection.image,
      bannerImage: collection.bannerImage || '',
      type: collection.type,
      status: collection.status,
      price: collection.price || 0,
      originalPrice: collection.originalPrice || 0,
      discount: collection.discount || 0,
      productIds: collection.productIds,
      featured: collection.featured,
      isExclusive: collection.isExclusive,
      launchDate: collection.launchDate,
      endDate: collection.endDate,
      sortOrder: collection.sortOrder || 0,
      tags: collection.tags
    });
    setImagePath(''); // Reset image path for editing
    setBannerImagePath(''); // Reset banner image path for editing
    setIsModalOpen(true);
  };

  const handleDeleteCollection = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteCollection(id);
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Collection name is required.'
      });
      return;
    }

    try {
      setLoading(true);

      if (editingCollection) {
        // Update existing collection
        await updateCollection(editingCollection.id, formData);
      } else {
        // Add new collection
        await addCollection(formData);
      }

      setIsModalOpen(false);
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    setFormData(prev => ({ ...prev, tags }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCollections();
    } catch (error) {
      // Error handling is done in the context
    } finally {
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // TODO: Implement actual export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Collections data has been exported successfully.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export data. Please try again.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeIcon = (type: Collection['type']) => {
    switch (type) {
      case 'heritage': return Crown;
      case 'seasonal': return Calendar;
      case 'limited': return Zap;
      case 'exclusive': return Award;
      case 'signature': return Star;
      case 'modern': return Sparkles;
      default: return Gift;
    }
  };

  const getStatusColor = (status: Collection['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'coming_soon': return 'bg-blue-100 text-blue-800';
      case 'sold_out': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (contextLoading && collections.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Collection Management</h2>
          <p className="text-gray-600">Manage special collections ({filteredCollections.length} of {collections.length} collections)</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
          
          <button
            onClick={handleAddCollection}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Collection</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="coming_soon">Coming Soon</option>
              <option value="sold_out">Sold Out</option>
            </select>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Types</option>
              <option value="heritage">Heritage</option>
              <option value="seasonal">Seasonal</option>
              <option value="limited">Limited</option>
              <option value="exclusive">Exclusive</option>
              <option value="signature">Signature</option>
              <option value="modern">Modern</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="status">Status</option>
              <option value="productCount">Product Count</option>
              <option value="price">Price</option>
              <option value="sortOrder">Sort Order</option>
              <option value="createdAt">Created Date</option>
            </select>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Collection
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCollections.map((collection) => {
                const TypeIcon = getTypeIcon(collection.type);
                
                return (
                  <tr key={collection.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <img
                            src={collection.image}
                            alt={collection.name}
                            className="h-12 w-12 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-collection.jpg';
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {collection.name}
                            </p>
                            {collection.featured && (
                              <Star className="h-4 w-4 text-yellow-500" />
                            )}
                            {collection.isExclusive && (
                              <Crown className="h-4 w-4 text-purple-500" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            /{collection.slug}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {collection.shortDescription}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <TypeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 capitalize">
                            {collection.type}
                          </span>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(collection.status)}`}>
                          {collection.status.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1">
                        <Tag className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {collection.productCount} products
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {collection.price ? (
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              ${collection.price}
                            </span>
                            {collection.originalPrice && collection.originalPrice > collection.price && (
                              <span className="text-xs text-gray-500 line-through">
                                ${collection.originalPrice}
                              </span>
                            )}
                          </div>
                          {collection.discount && collection.discount > 0 && (
                            <span className="text-xs text-green-600 font-medium">
                              -{collection.discount}% off
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">
                        {collection.sortOrder || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditCollection(collection)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Edit Collection"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: Implement view details */}}
                          className="p-1 text-gray-400 hover:text-blue-600"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {/* TODO: Implement duplicate */}}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Duplicate Collection"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete Collection"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {filteredCollections.length === 0 && (
          <div className="text-center py-12">
            <Gift className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No collections found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first collection.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && (
              <div className="mt-6">
                <button
                  onClick={handleAddCollection}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Collection
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Collection Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCollection ? 'Edit Collection' : 'Add New Collection'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter collection name"
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
                  placeholder="collection-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description for cards"
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
                  placeholder="Detailed collection description"
                />
              </div>
            </div>

            {/* Collection Details */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="modern">Modern</option>
                    <option value="heritage">Heritage</option>
                    <option value="seasonal">Seasonal</option>
                    <option value="limited">Limited</option>
                    <option value="exclusive">Exclusive</option>
                    <option value="signature">Signature</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="sold_out">Sold Out</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Original Price ($)
                  </label>
                  <input
                    type="number"
                    name="originalPrice"
                    value={formData.originalPrice}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  name="sortOrder"
                  value={formData.sortOrder}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={handleTagsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="luxury, premium, exclusive"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured Collection</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isExclusive"
                    checked={formData.isExclusive}
                    onChange={handleInputChange}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Exclusive Collection</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Image
              </label>
              <ImageUpload
                value={formData.image}
                onChange={(url) => setFormData(prev => ({ ...prev, image: url }))}
                onPathChange={setImagePath}
                folder="collections"
                placeholder="Upload collection image or enter URL"
                aspectRatio="square"
                maxWidth={300}
                maxHeight={300}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Image (Optional)
              </label>
              <ImageUpload
                value={formData.bannerImage || ''}
                onChange={(url) => setFormData(prev => ({ ...prev, bannerImage: url }))}
                onPathChange={setBannerImagePath}
                folder="collections/banners"
                placeholder="Upload banner image or enter URL"
                aspectRatio="landscape"
                maxWidth={600}
                maxHeight={300}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Launch Date (Optional)
              </label>
              <input
                type="date"
                name="launchDate"
                value={formData.launchDate ? formData.launchDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  launchDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date (Optional)
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate ? formData.endDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  endDate: e.target.value ? new Date(e.target.value) : undefined 
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {loading && <LoadingSpinner size="sm" />}
              <span>{editingCollection ? 'Update Collection' : 'Add Collection'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

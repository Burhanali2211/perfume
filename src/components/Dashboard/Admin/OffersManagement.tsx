import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { OfferFormModal } from './OfferFormModal';
import { supabase } from '../../../lib/supabase';
import { adminService, adminOperations } from '../../../services/adminService';
import { offerService } from '../../../services/backendService';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  Tag,
  Percent,
  Gift,
  Truck,
  Star,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  X,
  Check
} from 'lucide-react';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { Modal } from '../../Common/Modal';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
// Removed ResponsiveAdminLayout imports
import { EnhancedAdminTable, TableColumn, TableAction } from '../../Common/EnhancedAdminTable';
import { useResponsive } from '../../Common/AdminDesignSystem';

interface Offer {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  offer_type: 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'free_shipping' | 'bundle';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  image_url?: string;
  banner_image_url?: string;
  terms_and_conditions?: string;
  is_active: boolean;
  is_featured: boolean;
  usage_limit?: number;
  usage_count: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until?: string;
  applicable_to: 'all_products' | 'specific_products' | 'specific_categories' | 'specific_collections';
  sort_order: number;
  created_at: string;
}

interface OffersManagementProps {
  className?: string;
}

export const OffersManagement: React.FC<OffersManagementProps> = ({ className = '' }) => {
  const { showNotification } = useNotification();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    short_description: '',
    offer_type: 'percentage' as const,
    discount_value: 0,
    minimum_order_amount: 0,
    maximum_discount_amount: 0,
    image_url: '',
    banner_image_url: '',
    terms_and_conditions: '',
    is_active: true,
    is_featured: false,
    usage_limit: 0,
    user_usage_limit: 1,
    valid_from: '',
    valid_until: '',
    applicable_to: 'all_products' as const,
    sort_order: 0
  });

  const [error, setError] = useState<string | null>(null);
  const { isMobile, isTablet } = useResponsive();

  // Fetch offers from database
  const fetchOffers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      
      setOffers(data || []);
    } catch (error) {
      console.error('Error fetching offers:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch offers'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  // Filter offers based on search and filters
  const filteredOffers = offers.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         offer.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || offer.offer_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && offer.is_active) ||
                         (filterStatus === 'inactive' && !offer.is_active) ||
                         (filterStatus === 'featured' && offer.is_featured);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Reset form
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      short_description: '',
      offer_type: 'percentage',
      discount_value: 0,
      minimum_order_amount: 0,
      maximum_discount_amount: 0,
      image_url: '',
      banner_image_url: '',
      terms_and_conditions: '',
      is_active: true,
      is_featured: false,
      usage_limit: 0,
      user_usage_limit: 1,
      valid_from: '',
      valid_until: '',
      applicable_to: 'all_products',
      sort_order: 0
    });
    setEditingOffer(null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showNotification({
        type: 'error',
        title: 'Validation Error',
        message: 'Offer title is required'
      });
      return;
    }

    try {
      setLoading(true);
      
      const offerData = {
        ...formData,
        sort_order: formData.sort_order || offers.length + 1,
        usage_limit: formData.usage_limit || null,
        maximum_discount_amount: formData.maximum_discount_amount || null,
        valid_until: formData.valid_until || null
      };

      if (editingOffer) {
        const { error } = await supabase
          .from('offers')
          .update(offerData)
          .eq('id', editingOffer.id);

        if (error) throw error;

        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Offer updated successfully'
        });
      } else {
        const { error } = await supabase
          .from('offers')
          .insert(offerData);

        if (error) throw error;

        showNotification({
          type: 'success',
          title: 'Success',
          message: 'Offer created successfully'
        });
      }

      setIsModalOpen(false);
      resetForm();
      fetchOffers();
    } catch (error) {
      console.error('Error saving offer:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save offer'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit
  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      short_description: offer.short_description || '',
      offer_type: offer.offer_type,
      discount_value: offer.discount_value,
      minimum_order_amount: offer.minimum_order_amount,
      maximum_discount_amount: offer.maximum_discount_amount || 0,
      image_url: offer.image_url || '',
      banner_image_url: offer.banner_image_url || '',
      terms_and_conditions: offer.terms_and_conditions || '',
      is_active: offer.is_active,
      is_featured: offer.is_featured,
      usage_limit: offer.usage_limit || 0,
      user_usage_limit: offer.user_usage_limit,
      valid_from: offer.valid_from.split('T')[0] + 'T' + offer.valid_from.split('T')[1].slice(0, 5),
      valid_until: offer.valid_until ? offer.valid_until.split('T')[0] + 'T' + offer.valid_until.split('T')[1].slice(0, 5) : '',
      applicable_to: offer.applicable_to,
      sort_order: offer.sort_order
    });
    setIsModalOpen(true);
  };

  // Handle delete
  const handleDelete = async (offerId: string) => {
    if (!confirm('Are you sure you want to delete this offer?')) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('offers')
        .delete()
        .eq('id', offerId);

      if (error) throw error;

      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Offer deleted successfully'
      });

      fetchOffers();
    } catch (error) {
      console.error('Error deleting offer:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete offer'
      });
    } finally {
      setLoading(false);
    }
  };

  // Toggle offer status
  const toggleOfferStatus = async (offerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('offers')
        .update({ is_active: !currentStatus })
        .eq('id', offerId);

      if (error) throw error;

      fetchOffers();
    } catch (error) {
      console.error('Error toggling offer status:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update offer status'
      });
    }
  };

  const getOfferTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage': return <Percent className="h-4 w-4" />;
      case 'fixed_amount': return <Tag className="h-4 w-4" />;
      case 'buy_one_get_one': return <Gift className="h-4 w-4" />;
      case 'free_shipping': return <Truck className="h-4 w-4" />;
      case 'bundle': return <Star className="h-4 w-4" />;
      default: return <Tag className="h-4 w-4" />;
    }
  };

  const getOfferTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage': return 'Percentage';
      case 'fixed_amount': return 'Fixed Amount';
      case 'buy_one_get_one': return 'BOGO';
      case 'free_shipping': return 'Free Shipping';
      case 'bundle': return 'Bundle';
      default: return type;
    }
  };

  const formatDiscountValue = (type: string, value: number) => {
    switch (type) {
      case 'percentage': return `${value}%`;
      case 'fixed_amount': return `₹${value}`;
      case 'free_shipping': return 'Free';
      default: return value.toString();
    }
  };

  if (loading && offers.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" text="Loading offers..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Offers</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <EnhancedButton onClick={fetchOffers} icon={RefreshCw}>
              Try Again
            </EnhancedButton>
          </div>
        </div>
      </div>
    );
  }

  const headerActions = (
    <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
      <EnhancedButton
        onClick={() => {
          setEditingOffer(null);
          setIsModalOpen(true);
        }}
        icon={Plus}
        size={isMobile ? 'sm' : 'md'}
      >
        {isMobile ? 'Add' : 'Add Offer'}
      </EnhancedButton>
      <EnhancedButton
        onClick={fetchOffers}
        icon={RefreshCw}
        variant="outline"
        size={isMobile ? 'sm' : 'md'}
      >
        {isMobile ? '' : 'Refresh'}
      </EnhancedButton>
    </div>
  );

  return (
    <AdminErrorBoundary>
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="h-8 w-8 text-indigo-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Offers Management</h1>
                <p className="text-gray-600">Create and manage promotional offers</p>
              </div>
            </div>
            {headerActions}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="h-5 w-5 text-indigo-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          </div>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'} gap-4`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search offers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed_amount">Fixed Amount</option>
              <option value="buy_one_get_one">BOGO</option>
              <option value="free_shipping">Free Shipping</option>
              <option value="bundle">Bundle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="featured">Featured</option>
            </select>
          </div>
          </div>
        </div>

        {/* Offers List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Offers</h2>
        {filteredOffers.length === 0 ? (
          <div className="text-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Offers Found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your filters to see more offers.'
                : 'Start by creating your first promotional offer.'
              }
            </p>
            {!searchTerm && filterType === 'all' && filterStatus === 'all' && (
              <button
                onClick={() => {
                  resetForm();
                  setIsModalOpen(true);
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create First Offer
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOffers.map((offer) => (
              <div key={offer.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {offer.image_url && (
                      <img
                        src={offer.image_url}
                        alt={offer.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-medium text-gray-900">{offer.title}</h3>
                        {offer.is_featured && (
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          offer.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {offer.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {offer.short_description && (
                        <p className="text-sm text-gray-600 mb-2">{offer.short_description}</p>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          {getOfferTypeIcon(offer.offer_type)}
                          <span>{getOfferTypeLabel(offer.offer_type)}</span>
                        </div>
                        <span>•</span>
                        <span>Discount: {formatDiscountValue(offer.offer_type, offer.discount_value)}</span>
                        {offer.minimum_order_amount > 0 && (
                          <>
                            <span>•</span>
                            <span>Min: ₹{offer.minimum_order_amount}</span>
                          </>
                        )}
                        {offer.usage_limit && (
                          <>
                            <span>•</span>
                            <span>Used: {offer.usage_count}/{offer.usage_limit}</span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span>Valid from: {new Date(offer.valid_from).toLocaleDateString()}</span>
                        {offer.valid_until && (
                          <span>Until: {new Date(offer.valid_until).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleOfferStatus(offer.id, offer.is_active)}
                      className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                        offer.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {offer.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(offer)}
                      className="text-indigo-600 hover:text-indigo-800 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(offer.id)}
                      className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>

        {/* Create/Edit Offer Modal */}
        <OfferFormModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            resetForm();
          }}
          onSubmit={handleSubmit}
          formData={formData}
          setFormData={setFormData}
          editingOffer={editingOffer}
          loading={loading}
        />
      </div>
    </AdminErrorBoundary>
  );
};

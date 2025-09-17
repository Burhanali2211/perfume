import React, { useState, useEffect } from 'react';
import { useNotification } from '../../../contexts/NotificationContext';
import { useProducts } from '../../../contexts/ProductContext';
import { Product } from '../../../types';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { Modal } from '../../Common/Modal';
import { supabase } from '../../../lib/supabase';
import { adminService, adminOperations } from '../../../services/adminService';
import { newArrivalService } from '../../../services/backendService';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Calendar,
  Star,
  Package,
  Clock,
  TrendingUp,
  X,
  Check
} from 'lucide-react';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import {
  ResponsiveAdminLayout,
  AdminPageHeader,
  AdminSection,
  AdminGrid,
  MobileOptimizedCard
} from '../../Common/ResponsiveAdminLayout';
import { useResponsive } from '../../Common/AdminDesignSystem';

interface NewArrival {
  id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_price: number;
  product_original_price?: number;
  product_images: string[];
  product_rating: number;
  featured_until?: string;
  sort_order: number;
  created_at: string;
}

interface NewArrivalsManagementProps {
  className?: string;
}

export const NewArrivalsManagement: React.FC<NewArrivalsManagementProps> = ({ className = '' }) => {
  const { products, loading: productsLoading } = useProducts();
  const { showNotification } = useNotification();
  const [newArrivals, setNewArrivals] = useState<NewArrival[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [featuredUntil, setFeaturedUntil] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { isMobile, isTablet } = useResponsive();

  // Fetch new arrivals from database
  const fetchNewArrivals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_active_new_arrivals', { limit_count: 50 });
      
      if (error) throw error;
      
      setNewArrivals(data || []);
    } catch (error) {
      console.error('Error fetching new arrivals:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch new arrivals'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewArrivals();
  }, []);

  // Filter products that are not already in new arrivals
  const availableProducts = products.filter(product => 
    !newArrivals.some(arrival => arrival.product_id === product.id) &&
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add products to new arrivals
  const handleAddToNewArrivals = async () => {
    if (selectedProducts.length === 0) {
      showNotification({
        type: 'warning',
        title: 'No Selection',
        message: 'Please select at least one product to add'
      });
      return;
    }

    try {
      setLoading(true);
      
      const newArrivalsData = selectedProducts.map((productId, index) => ({
        product_id: productId,
        featured_until: featuredUntil || null,
        sort_order: newArrivals.length + index + 1,
        is_active: true
      }));

      const { error } = await supabase
        .from('new_arrivals')
        .insert(newArrivalsData);

      if (error) throw error;

      showNotification({
        type: 'success',
        title: 'Success',
        message: `Added ${selectedProducts.length} product(s) to new arrivals`
      });

      setSelectedProducts([]);
      setFeaturedUntil('');
      setIsModalOpen(false);
      fetchNewArrivals();
    } catch (error) {
      console.error('Error adding to new arrivals:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to add products to new arrivals'
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove product from new arrivals
  const handleRemoveFromNewArrivals = async (arrivalId: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('new_arrivals')
        .delete()
        .eq('id', arrivalId);

      if (error) throw error;

      showNotification({
        type: 'success',
        title: 'Success',
        message: 'Product removed from new arrivals'
      });

      fetchNewArrivals();
    } catch (error) {
      console.error('Error removing from new arrivals:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to remove product from new arrivals'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update sort order
  const handleUpdateSortOrder = async (arrivalId: string, newSortOrder: number) => {
    try {
      const { error } = await supabase
        .from('new_arrivals')
        .update({ sort_order: newSortOrder })
        .eq('id', arrivalId);

      if (error) throw error;

      fetchNewArrivals();
    } catch (error) {
      console.error('Error updating sort order:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to update sort order'
      });
    }
  };

  const handleProductSelection = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  if (productsLoading || loading) {
    return (
      <ResponsiveAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" text="Loading new arrivals..." />
        </div>
      </ResponsiveAdminLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveAdminLayout>
        <AdminSection variant="card">
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading New Arrivals</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <EnhancedButton onClick={fetchNewArrivals} icon={RefreshCw}>
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
        onClick={() => setIsModalOpen(true)}
        icon={Plus}
        size={isMobile ? 'sm' : 'md'}
      >
        {isMobile ? 'Add' : 'Add New Arrival'}
      </EnhancedButton>
      <EnhancedButton
        onClick={fetchNewArrivals}
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
      <ResponsiveAdminLayout>
        <AdminPageHeader
          title="New Arrivals Management"
          subtitle="Manage products featured as new arrivals"
          icon={TrendingUp}
          actions={headerActions}
        />

        <AdminSection title="New Arrivals" variant="card">
        {newArrivals.length === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No New Arrivals</h3>
            <p className="text-gray-600 mb-4">Start by adding some products to the new arrivals section.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Add First Product
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {newArrivals.map((arrival) => (
              <div key={arrival.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={arrival.product_images[0] || '/placeholder-image.jpg'}
                      alt={arrival.product_name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h3 className="font-medium text-gray-900">{arrival.product_name}</h3>
                      <p className="text-sm text-gray-600">₹{arrival.product_price.toLocaleString('en-IN')}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{arrival.product_rating}</span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-600">Sort: {arrival.sort_order}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={arrival.sort_order}
                      onChange={(e) => handleUpdateSortOrder(arrival.id, parseInt(e.target.value))}
                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      min="1"
                    />
                    <button
                      onClick={() => handleRemoveFromNewArrivals(arrival.id)}
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
        </AdminSection>

        {/* Add Products Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Add Products to New Arrivals"
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Until (Optional)
              </label>
              <input
                type="datetime-local"
                value={featuredUntil}
                onChange={(e) => setFeaturedUntil(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
            </div>

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
                  placeholder="Search products..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
              {availableProducts.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No available products found
                </div>
              ) : (
                <div className="space-y-2 p-2">
                  {availableProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedProducts.includes(product.id)
                          ? 'bg-primary-50 border border-primary-200'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleProductSelection(product.id)}
                    >
                      <div className="flex-shrink-0">
                        {selectedProducts.includes(product.id) ? (
                          <Check className="h-5 w-5 text-primary-600" />
                        ) : (
                          <div className="h-5 w-5 border border-gray-300 rounded" />
                        )}
                      </div>
                      <img
                        src={product.images[0] || '/placeholder-image.jpg'}
                        alt={product.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <EnhancedButton
                onClick={() => setIsModalOpen(false)}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={handleAddToNewArrivals}
                disabled={selectedProducts.length === 0}
                loading={loading}
              >
                Add {selectedProducts.length} Product{selectedProducts.length !== 1 ? 's' : ''}
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      </ResponsiveAdminLayout>
    </AdminErrorBoundary>
  );
};

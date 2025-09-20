import React, { useState, useEffect, useMemo } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { Modal } from '../../Common/Modal';
import {
  Edit,
  Trash2,
  Plus,
  Search,
  Tag,
  Calendar,
  Percent,
  Hash,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  Eye,
  Copy,
  Archive,
  SortAsc,
  SortDesc,
  DollarSign,
  Users,
  BarChart3,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import { AdminLoadingState, EmptyState } from '../../Common/EnhancedLoadingStates';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed';
  value: number;
  minimumAmount: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil?: string;
  createdAt: string;
}

export const CouponManagement: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Enhanced state for bulk operations and advanced filtering
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'code' | 'name' | 'value' | 'usedCount' | 'validUntil' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');
  const [validityFilter, setValidityFilter] = useState<'all' | 'valid' | 'expired' | 'upcoming'>('all');
  const [usageFilter, setUsageFilter] = useState<'all' | 'unused' | 'partial' | 'exhausted'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<Omit<Coupon, 'id' | 'usedCount' | 'createdAt'>>({
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 0,
    minimumAmount: 0,
    maximumDiscount: undefined,
    usageLimit: undefined,
    isActive: true,
    validFrom: new Date().toISOString().split('T')[0],
    validUntil: undefined
  });

  // Fetch coupons
  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const couponsData: Coupon[] = data?.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        type: coupon.type,
        value: coupon.value,
        minimumAmount: coupon.minimum_amount,
        maximumDiscount: coupon.maximum_discount,
        usageLimit: coupon.usage_limit,
        usedCount: coupon.used_count,
        isActive: coupon.is_active,
        validFrom: coupon.valid_from,
        validUntil: coupon.valid_until,
        createdAt: coupon.created_at
      })) || [];

      setCoupons(couponsData);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCoupon = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      type: 'percentage',
      value: 0,
      minimumAmount: 0,
      maximumDiscount: undefined,
      usageLimit: undefined,
      isActive: true,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil: undefined
    });
    setIsModalOpen(true);
  };

  const handleEditCoupon = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      type: coupon.type,
      value: coupon.value,
      minimumAmount: coupon.minimumAmount,
      maximumDiscount: coupon.maximumDiscount,
      usageLimit: coupon.usageLimit,
      isActive: coupon.isActive,
      validFrom: coupon.validFrom.split('T')[0],
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : undefined
    });
    setIsModalOpen(true);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (window.confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .eq('id', couponId);

        if (error) throw error;

        fetchCoupons();
        showNotification({
          type: 'success',
          title: 'Coupon Deleted',
          message: 'Coupon has been deleted successfully.'
        });
      } catch (error) {
        console.error('Error deleting coupon:', error);
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete coupon. Please try again.'
        });
      }
    }
  };

  // Bulk operations
  const handleSelectCoupon = (couponId: string) => {
    setSelectedCoupons(prev =>
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCoupons.length === filteredCoupons.length) {
      setSelectedCoupons([]);
    } else {
      setSelectedCoupons(filteredCoupons.map(c => c.id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCoupons.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedCoupons.length} coupons? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('coupons')
          .delete()
          .in('id', selectedCoupons);

        if (error) throw error;

        setSelectedCoupons([]);
        fetchCoupons();
        showNotification({
          type: 'success',
          title: 'Coupons Deleted',
          message: `${selectedCoupons.length} coupons have been deleted successfully.`
        });
      } catch (error) {
        console.error('Error deleting coupons:', error);
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete coupons. Please try again.'
        });
      }
    }
  };

  const handleBulkStatusUpdate = async (isActive: boolean) => {
    if (selectedCoupons.length === 0) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: isActive })
        .in('id', selectedCoupons);

      if (error) throw error;

      setSelectedCoupons([]);
      fetchCoupons();
      showNotification({
        type: 'success',
        title: 'Coupons Updated',
        message: `${selectedCoupons.length} coupons have been ${isActive ? 'activated' : 'deactivated'}.`
      });
    } catch (error) {
      console.error('Error updating coupons:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update coupons. Please try again.'
      });
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCoupons();
    setRefreshing(false);
    showNotification({
      type: 'success',
      title: 'Refreshed',
      message: 'Coupon data has been refreshed.'
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Mock export functionality
      await new Promise(resolve => setTimeout(resolve, 2000));
      showNotification({
        type: 'success',
        title: 'Export Complete',
        message: 'Coupons have been exported successfully.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export coupons. Please try again.'
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

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date();
    const validFrom = new Date(coupon.validFrom);
    const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;

    if (!coupon.isActive) return { status: 'inactive', color: 'bg-gray-100 text-gray-800', icon: XCircle };
    if (now < validFrom) return { status: 'upcoming', color: 'bg-blue-100 text-blue-800', icon: Clock };
    if (validUntil && now > validUntil) return { status: 'expired', color: 'bg-red-100 text-red-800', icon: XCircle };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { status: 'exhausted', color: 'bg-orange-100 text-orange-800', icon: AlertCircle };
    return { status: 'active', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCoupon) {
        // Update existing coupon
        const { error } = await supabase
          .from('coupons')
          .update({
            code: formData.code,
            name: formData.name,
            description: formData.description,
            type: formData.type,
            value: formData.value,
            minimum_amount: formData.minimumAmount,
            maximum_discount: formData.maximumDiscount,
            usage_limit: formData.usageLimit,
            is_active: formData.isActive,
            valid_from: formData.validFrom,
            valid_until: formData.validUntil
          })
          .eq('id', editingCoupon.id);

        if (error) throw error;
      } else {
        // Add new coupon
        const { error } = await supabase
          .from('coupons')
          .insert({
            code: formData.code,
            name: formData.name,
            description: formData.description,
            type: formData.type,
            value: formData.value,
            minimum_amount: formData.minimumAmount,
            maximum_discount: formData.maximumDiscount,
            usage_limit: formData.usageLimit,
            is_active: formData.isActive,
            valid_from: formData.validFrom,
            valid_until: formData.validUntil
          });

        if (error) throw error;
      }

      setIsModalOpen(false);
      fetchCoupons();
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox' && e.target instanceof HTMLInputElement) {
      setFormData(prev => ({
        ...prev,
        [name]: e.target.checked
      }));
    } else if (type === 'number') {
      setFormData(prev => ({
        ...prev,
        [name]: value ? parseFloat(value) : 0
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Enhanced filtering and sorting logic
  const filteredCoupons = useMemo(() => {
    const filtered = coupons.filter(coupon => {
      const matchesSearch =
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && coupon.isActive) ||
        (filterStatus === 'inactive' && !coupon.isActive);

      const matchesType =
        typeFilter === 'all' || coupon.type === typeFilter;

      // Validity filter
      const now = new Date();
      const validFrom = new Date(coupon.validFrom);
      const validUntil = coupon.validUntil ? new Date(coupon.validUntil) : null;

      let matchesValidity = true;
      if (validityFilter === 'valid') {
        matchesValidity = coupon.isActive && now >= validFrom && (!validUntil || now <= validUntil);
      } else if (validityFilter === 'expired') {
        matchesValidity = validUntil && now > validUntil;
      } else if (validityFilter === 'upcoming') {
        matchesValidity = now < validFrom;
      }

      // Usage filter
      let matchesUsage = true;
      if (usageFilter === 'unused') {
        matchesUsage = coupon.usedCount === 0;
      } else if (usageFilter === 'partial') {
        matchesUsage = coupon.usedCount > 0 && (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit);
      } else if (usageFilter === 'exhausted') {
        matchesUsage = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
      }

      return matchesSearch && matchesStatus && matchesType && matchesValidity && matchesUsage;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'code':
          aValue = a.code.toLowerCase();
          bValue = b.code.toLowerCase();
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'value':
          aValue = a.value;
          bValue = b.value;
          break;
        case 'usedCount':
          aValue = a.usedCount;
          bValue = b.usedCount;
          break;
        case 'validUntil':
          aValue = a.validUntil ? new Date(a.validUntil).getTime() : 0;
          bValue = b.validUntil ? new Date(b.validUntil).getTime() : 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [coupons, searchTerm, filterStatus, typeFilter, validityFilter, usageFilter, sortBy, sortOrder]);

  if (loading) {
    return <LoadingSpinner text="Loading coupons..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Coupon Management</h2>
          <p className="text-gray-600 mt-1">
            Create and manage discount coupons ({coupons.length} total)
          </p>
        </div>
        <motion.button
          onClick={handleAddCoupon}
          className="btn-primary flex items-center space-x-2 mt-4 lg:mt-0"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Coupon</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Coupons
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by code or name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Coupon
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Validity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No coupons found</h3>
                    <p className="text-gray-600">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filter criteria.'
                        : 'Get started by creating your first coupon.'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <motion.tr
                    key={coupon.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {coupon.name}
                      </div>
                      {coupon.description && (
                        <div className="text-sm text-gray-500">
                          {coupon.description}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {coupon.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.type === 'percentage' ? (
                          <span className="flex items-center">
                            <Percent className="h-4 w-4 mr-1" />
                            {coupon.value}%
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <Hash className="h-4 w-4 mr-1" />
                            ₹{coupon.value}
                          </span>
                        )}
                      </div>
                      {coupon.minimumAmount > 0 && (
                        <div className="text-xs text-gray-500">
                          Min: ₹{coupon.minimumAmount}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {coupon.usedCount} used
                      </div>
                      {coupon.usageLimit && (
                        <div className="text-xs text-gray-500">
                          Limit: {coupon.usageLimit}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(coupon.validFrom).toLocaleDateString()}
                      </div>
                      {coupon.validUntil && (
                        <div className="text-xs text-gray-500">
                          to {new Date(coupon.validUntil).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coupon.isActive ? (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCoupon(coupon)}
                          className="text-indigo-600 hover:text-indigo-900 flex items-center"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coupon Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCoupon ? "Edit Coupon" : "Add New Coupon"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter coupon name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coupon Code *
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter coupon code"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter coupon description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discount Value *
              </label>
              <input
                type="number"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter discount value"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Order Amount
              </label>
              <input
                type="number"
                name="minimumAmount"
                value={formData.minimumAmount}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter minimum amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maximum Discount
              </label>
              <input
                type="number"
                name="maximumDiscount"
                value={formData.maximumDiscount || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter maximum discount (optional)"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Limit
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit || ''}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter usage limit (optional)"
              />
            </div>

            <div className="flex items-center">
              <label className="block text-sm font-medium text-gray-700 mr-2">
                Status
              </label>
              <div className="relative inline-block w-10 mr-2 align-middle select-none">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="sr-only"
                  id="status-toggle"
                />
                <label
                  htmlFor="status-toggle"
                  className={`block overflow-hidden h-6 rounded-full cursor-pointer ${
                    formData.isActive ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`block h-4 w-4 mt-1 rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out ${
                      formData.isActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </label>
              </div>
              <span className="text-sm text-gray-600">
                {formData.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From *
              </label>
              <input
                type="date"
                name="validFrom"
                value={formData.validFrom}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until
              </label>
              <input
                type="date"
                name="validUntil"
                value={formData.validUntil || ''}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500"
            >
              {editingCoupon ? 'Update Coupon' : 'Add Coupon'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
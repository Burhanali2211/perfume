import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Download,
  RefreshCw,
  CheckSquare,
  Square,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Truck,
  MoreVertical,
  FileText,
  Mail,
  Phone,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { ResponsiveTable } from '../../Common/ResponsiveTable';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import { AdminLoadingState, EmptyState } from '../../Common/EnhancedLoadingStates';
import { useNotification } from '../../../contexts/NotificationContext';
import { Modal } from '../../Common/Modal';
import { motion, AnimatePresence } from 'framer-motion';

interface Order {
  id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  created_at: string;
  user_id: string;
  profiles: {
    email: string;
    name: string;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    price: number;
    products: {
      name: string;
      image: string;
    };
  }>;
}

export const OrderManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Enhanced state for bulk operations and advanced filtering
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'created_at' | 'total' | 'status'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [amountRange, setAmountRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 10000
  });
  const [customerFilter, setCustomerFilter] = useState('');
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { showNotification } = useNotification();

  useEffect(() => {
    fetchOrders();
  }, []);

  // Enhanced filtering and sorting logic
  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      const matchesSearch =
        order.profiles.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

      const matchesCustomer = !customerFilter ||
        order.profiles.name.toLowerCase().includes(customerFilter.toLowerCase()) ||
        order.profiles.email.toLowerCase().includes(customerFilter.toLowerCase());

      const matchesAmount = order.total >= amountRange.min && order.total <= amountRange.max;

      let matchesDate = true;
      if (dateRange.start && dateRange.end) {
        const orderDate = new Date(order.created_at);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        matchesDate = orderDate >= startDate && orderDate <= endDate;
      }

      return matchesSearch && matchesStatus && matchesCustomer && matchesAmount && matchesDate;
    });

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, customerFilter, amountRange, dateRange, sortBy, sortOrder]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          user_id,
          profiles!inner(email, name),
          order_items(
            id,
            quantity,
            price,
            products(name, image)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map the data to match our Order interface
      const mappedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        user_id: order.user_id,
        profiles: {
          email: order.profiles?.email || '',
          name: order.profiles?.name || ''
        },
        order_items: (order.order_items || []).map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price,
          products: {
            name: item.products?.name || '',
            image: item.products?.image || ''
          }
        }))
      }));
      
      setOrders(mappedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      showNotification({
        type: 'success',
        title: 'Order Updated',
        message: `Order status updated to ${newStatus} successfully!`
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update order status. Please try again.'
      });
    }
  };

  // Bulk operations
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(o => o.id));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.length === 0) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .in('id', selectedOrders);

      if (error) throw error;

      setOrders(orders.map(order =>
        selectedOrders.includes(order.id)
          ? { ...order, status: newStatus as any }
          : order
      ));

      setSelectedOrders([]);
      showNotification({
        type: 'success',
        title: 'Orders Updated',
        message: `${selectedOrders.length} orders updated to ${newStatus} successfully!`
      });
    } catch (error) {
      console.error('Error updating orders:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update orders. Please try again.'
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedOrders.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedOrders.length} orders? This action cannot be undone.`)) {
      try {
        const { error } = await supabase
          .from('orders')
          .delete()
          .in('id', selectedOrders);

        if (error) throw error;

        setOrders(orders.filter(order => !selectedOrders.includes(order.id)));
        setSelectedOrders([]);

        showNotification({
          type: 'success',
          title: 'Orders Deleted',
          message: `${selectedOrders.length} orders deleted successfully!`
        });
      } catch (error) {
        console.error('Error deleting orders:', error);
        showNotification({
          type: 'error',
          title: 'Delete Failed',
          message: 'Failed to delete orders. Please try again.'
        });
      }
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
    showNotification({
      type: 'success',
      title: 'Refreshed',
      message: 'Order data has been refreshed.'
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
        message: 'Orders have been exported successfully.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export orders. Please try again.'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
      case 'shipped':
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          {selectedOrders.length === filteredOrders.length && filteredOrders.length > 0 ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      ),
      width: 50,
      render: (value: any, record: Order) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectOrder(record.id);
          }}
          className="flex items-center justify-center w-full"
        >
          {selectedOrders.includes(record.id) ? (
            <CheckSquare className="h-4 w-4 text-indigo-600" />
          ) : (
            <Square className="h-4 w-4 text-gray-400" />
          )}
        </button>
      )
    },
    {
      key: 'id',
      title: (
        <button
          onClick={() => toggleSort('created_at')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Order ID</span>
          {sortBy === 'created_at' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 120,
      render: (value: string) => <span className="font-medium">#{value.slice(0, 8)}</span>
    },
    {
      key: 'customer',
      title: 'Customer',
      minWidth: 200,
      render: (value: any, record: Order) => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{record.profiles.name}</div>
            <div className="text-gray-500 text-sm">{record.profiles.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'total',
      title: (
        <button
          onClick={() => toggleSort('total')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Total</span>
          {sortBy === 'total' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 120,
      render: (value: number) => (
        <div className="flex items-center space-x-1">
          <DollarSign className="h-4 w-4 text-green-600" />
          <span className="font-semibold text-gray-900">{formatCurrency(value)}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: (
        <button
          onClick={() => toggleSort('status')}
          className="flex items-center space-x-1 hover:text-indigo-600"
        >
          <span>Status</span>
          {sortBy === 'status' && (
            sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
          )}
        </button>
      ),
      width: 140,
      render: (value: string) => (
        <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {getStatusIcon(value)}
          <span className="capitalize">{value}</span>
        </span>
      )
    },
    {
      key: 'created_at',
      title: 'Date',
      width: 150,
      render: (value: string) => (
        <div className="flex items-center space-x-1">
          <Calendar className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 150,
      render: (value: any, record: Order) => (
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(record);
              setIsOrderDetailOpen(true);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(record);
              setIsEditOrderOpen(true);
            }}
            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
            title="Edit Order"
          >
            <Edit className="h-4 w-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Handle print/invoice
            }}
            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
            title="Print Invoice"
          >
            <FileText className="h-4 w-4" />
          </button>

          {record.status === 'pending' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(record.id, 'confirmed');
              }}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
              title="Confirm Order"
            >
              Confirm
            </button>
          )}

          {record.status === 'confirmed' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                updateOrderStatus(record.id, 'shipped');
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
              title="Mark as Shipped"
            >
              Ship
            </button>
          )}
        </div>
      )
    }
  ];

  if (loading) {
    return <AdminLoadingState type="orders" message="Loading order data..." />;
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            <p className="text-gray-600 mt-1">
              Manage all customer orders ({filteredOrders.length} of {orders.length} orders)
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
          </div>
        </div>

        {/* Bulk Actions Bar */}
        <AnimatePresence>
          {selectedOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-indigo-900">
                    {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleBulkStatusUpdate('confirmed')}
                    className="px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('shipped')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                  >
                    Ship
                  </button>
                  <button
                    onClick={() => handleBulkStatusUpdate('cancelled')}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1 bg-red-100 text-red-800 rounded-md hover:bg-red-200 text-sm"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelectedOrders([])}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by order ID, customer..."
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
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Range
              </label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  value={amountRange.min}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                  placeholder="Min"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="number"
                  value={amountRange.max}
                  onChange={(e) => setAmountRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                  placeholder="Max"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(searchTerm || statusFilter !== 'all' || dateRange.start || dateRange.end || amountRange.min > 0 || amountRange.max < 10000) && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Showing {filteredOrders.length} of {orders.length} orders
                </span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setDateRange({ start: '', end: '' });
                    setAmountRange({ min: 0, max: 10000 });
                    setCustomerFilter('');
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<Package className="h-24 w-24" />}
            title="No orders found"
            description="No orders match your current filters. Try adjusting your search criteria."
          />
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <ResponsiveTable
              columns={tableColumns}
              data={filteredOrders}
              loading={loading}
              emptyMessage="No orders found"
              onRowClick={(record) => {
                setSelectedOrder(record);
                setIsOrderDetailOpen(true);
              }}
            />
          </div>
        )}

        {/* Order Details Modal */}
        <Modal
          isOpen={isOrderDetailOpen}
          onClose={() => {
            setIsOrderDetailOpen(false);
            setSelectedOrder(null);
          }}
          title={selectedOrder ? `Order #${selectedOrder.id.slice(0, 8)}` : 'Order Details'}
          size="xl"
        >
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <User className="h-5 w-5 mr-2 text-indigo-600" />
                    Customer Information
                  </h4>
                  <div className="mt-3 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedOrder.profiles.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{selectedOrder.profiles.email}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Package className="h-5 w-5 mr-2 text-indigo-600" />
                    Order Information
                  </h4>
                  <div className="mt-3 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium">{formatDate(selectedOrder.created_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="capitalize">{selectedOrder.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-medium text-lg">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.products.image || '/placeholder-image.jpg'}
                        alt={item.products.name}
                        className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="ml-4 flex-1">
                        <h5 className="font-medium text-gray-900">{item.products.name}</h5>
                        <p className="text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{formatCurrency(item.price * item.quantity)}</p>
                        <p className="text-gray-600 text-sm">{formatCurrency(item.price)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit Order Modal */}
        <Modal
          isOpen={isEditOrderOpen}
          onClose={() => {
            setIsEditOrderOpen(false);
            setSelectedOrder(null);
          }}
          title={selectedOrder ? `Edit Order #${selectedOrder.id.slice(0, 8)}` : 'Edit Order'}
          size="lg"
        >
          {selectedOrder && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setIsEditOrderOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setIsEditOrderOpen(false)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminErrorBoundary>
  );
};
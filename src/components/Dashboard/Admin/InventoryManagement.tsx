import React, { useState, useEffect } from 'react';
import { useProducts } from '../../../contexts/ProductContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { Modal } from '../../Common/Modal';
import { Edit, Plus, Search, Package, AlertTriangle, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { ResponsiveTable } from '../../Common/ResponsiveTable';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  minStockLevel: number;
  reservedStock: number;
  availableStock: number;
  lastUpdated: string;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
}

interface InventoryTransaction {
  id: string;
  productId: string;
  transactionType: 'in' | 'out';
  quantity: number;
  reason: string;
  referenceType: string;
  referenceId: string;
  createdBy: string;
  createdAt: string;
}

export const InventoryManagement: React.FC = () => {
  const { products, loading } = useProducts();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');

  // Fetch inventory data
  useEffect(() => {
    fetchInventoryData();
    fetchInventoryTransactions();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoadingInventory(true);
      
      // Get inventory items with product details
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          products(name, sku, min_stock_level)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const items: InventoryItem[] = data?.map(item => ({
        id: item.id,
        productId: item.product_id,
        productName: item.products?.name || 'Unknown Product',
        sku: item.products?.sku || 'N/A',
        currentStock: item.current_stock,
        minStockLevel: item.products?.min_stock_level || 5,
        reservedStock: item.reserved_stock || 0,
        availableStock: item.current_stock - (item.reserved_stock || 0),
        lastUpdated: item.updated_at,
        status: item.current_stock === 0 
          ? 'out-of-stock' 
          : item.current_stock <= (item.products?.min_stock_level || 5) 
            ? 'low-stock' 
            : 'in-stock'
      })) || [];

      setInventoryItems(items);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoadingInventory(false);
    }
  };

  const fetchInventoryTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          products(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const transactions: InventoryTransaction[] = data?.map(transaction => ({
        id: transaction.id,
        productId: transaction.product_id,
        transactionType: transaction.transaction_type,
        quantity: transaction.quantity,
        reason: transaction.reason,
        referenceType: transaction.reference_type,
        referenceId: transaction.reference_id,
        createdBy: transaction.created_by,
        createdAt: transaction.created_at
      })) || [];

      setTransactions(transactions);
    } catch (error) {
      console.error('Error fetching inventory transactions:', error);
    }
  };

  const handleAdjustStock = (item: InventoryItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSubmitAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      // In a real implementation, you would call a Supabase function or make an API call
      // to adjust the inventory. For now, we'll just close the modal.
      setIsModalOpen(false);
      fetchInventoryData();
      fetchInventoryTransactions();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-stock': return 'bg-green-100 text-green-800';
      case 'low-stock': return 'bg-yellow-100 text-yellow-800';
      case 'out-of-stock': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredItems = inventoryItems.filter(item => {
    const matchesSearch = item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Prepare columns for inventory table
  const inventoryTableColumns = [
    {
      key: 'productName',
      title: 'Product',
      minWidth: 150,
      render: (value: string) => <div className="text-sm font-medium text-gray-900">{value}</div>
    },
    {
      key: 'sku',
      title: 'SKU',
      width: 120,
      render: (value: string) => <div className="text-sm text-gray-500">{value}</div>
    },
    {
      key: 'currentStock',
      title: 'Current Stock',
      width: 120,
      render: (value: number, record: InventoryItem) => (
        <div>
          <div className="text-sm text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">
            Min: {record.minStockLevel}
          </div>
        </div>
      )
    },
    {
      key: 'availableStock',
      title: 'Available',
      width: 100,
      render: (value: number) => <div className="text-sm text-gray-500">{value}</div>
    },
    {
      key: 'status',
      title: 'Status',
      width: 120,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
          {value.replace('-', ' ')}
        </span>
      )
    },
    {
      key: 'lastUpdated',
      title: 'Last Updated',
      width: 120,
      render: (value: string) => <div className="text-sm text-gray-500">{new Date(value).toLocaleDateString()}</div>
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (value: any, record: InventoryItem) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleAdjustStock(record);
          }}
          className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm"
        >
          <Edit className="h-4 w-4 mr-1" />
          Adjust
        </button>
      )
    }
  ];

  // Prepare columns for transactions table
  const transactionTableColumns = [
    {
      key: 'createdAt',
      title: 'Date',
      width: 120,
      render: (value: string) => <div className="text-sm text-gray-900">{new Date(value).toLocaleDateString()}</div>
    },
    {
      key: 'productName',
      title: 'Product',
      minWidth: 150,
      render: (value: string) => <div className="text-sm font-medium text-gray-900">{value}</div>
    },
    {
      key: 'transactionType',
      title: 'Type',
      width: 80,
      render: (value: string) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value === 'in' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value === 'in' ? 'In' : 'Out'}
        </span>
      )
    },
    {
      key: 'quantity',
      title: 'Quantity',
      width: 80,
      render: (value: number) => <div className="text-sm text-gray-900">{value}</div>
    },
    {
      key: 'reason',
      title: 'Reason',
      minWidth: 150,
      render: (value: string) => <div className="text-sm text-gray-500">{value}</div>
    }
  ];

  if (loading || loadingInventory) {
    return <LoadingSpinner text="Loading inventory data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
          <p className="text-gray-600 mt-1">
            Manage product inventory and track stock levels
          </p>
        </div>
        <motion.button
          className="btn-primary flex items-center space-x-2 mt-4 lg:mt-0"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="h-4 w-4" />
          <span>Add Inventory Item</span>
        </motion.button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-semibold text-gray-900">{inventoryItems.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'in-stock').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'low-stock').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">
                {inventoryItems.filter(item => item.status === 'out-of-stock').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                placeholder="Search by product name or SKU..."
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
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <ResponsiveTable
        columns={inventoryTableColumns}
        data={filteredItems}
        loading={loadingInventory}
        emptyMessage={searchTerm || filterStatus !== 'all' 
          ? 'Try adjusting your search or filter criteria.'
          : 'Get started by adding inventory items.'}
      />

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Inventory Transactions</h3>
        <ResponsiveTable
          columns={transactionTableColumns}
          data={transactions.slice(0, 10)}
          loading={loadingInventory}
          emptyMessage="No recent transactions"
        />
      </div>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Adjust Stock Level"
      >
        {editingItem && (
          <form onSubmit={handleSubmitAdjustment} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <div className="text-sm font-medium text-gray-900">
                {editingItem.productName}
              </div>
              <div className="text-sm text-gray-500">
                SKU: {editingItem.sku}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Stock
                </label>
                <div className="text-sm font-medium text-gray-900">
                  {editingItem.currentStock}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Stock
                </label>
                <div className="text-sm font-medium text-gray-900">
                  {editingItem.availableStock}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adjustment Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="add">Add Stock</option>
                <option value="remove">Remove Stock</option>
                <option value="set">Set Stock Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter reason for adjustment"
              />
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
                Adjust Stock
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
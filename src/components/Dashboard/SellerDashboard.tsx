import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Upload,
  FileText,
  TrendingUp,
  Star,
  Tag,
  Megaphone,
  CreditCard,
  MessageSquare,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  DollarSign,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import { Product } from '../../types';
import { Modal } from '../Common/Modal';
import { EnhancedProductForm } from '../Product/EnhancedProductForm';

// Seller Overview Component
const SellerOverview: React.FC = () => {
  const { user } = useAuth();
  const { products } = useProducts();
  
  const sellerProducts = products.filter(p => p.sellerId === user?.id);

  const stats = [
    { title: 'Total Sales', value: '$23,450', change: '+15.2%', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Products Listed', value: sellerProducts.length.toString(), change: `+${sellerProducts.length}`, icon: Package, color: 'bg-blue-500' },
    { title: 'Orders', value: '145', change: '+8.1%', icon: ShoppingCart, color: 'bg-purple-500' },
    { title: 'Growth', value: '12.5%', change: '+2.1%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">New order received for "Premium Attar"</span>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-700">Product "Royal Oudh" inventory updated</span>
            <span className="text-sm text-gray-500">5 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Seller Analytics Component
const SellerAnalytics: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Sales Analytics</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="p-4 border border-gray-200 rounded-lg">
        <BarChart3 className="h-8 w-8 text-blue-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Sales Trends</h3>
        <p className="text-sm text-gray-600">View detailed sales performance over time</p>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <TrendingUp className="h-8 w-8 text-green-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Revenue Growth</h3>
        <p className="text-sm text-gray-600">Track monthly revenue growth metrics</p>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <Package className="h-8 w-8 text-purple-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Top Products</h3>
        <p className="text-sm text-gray-600">Identify best-performing products</p>
      </div>
    </div>
  </div>
);

// Products Management with enhanced features
const SellerProductsManagement: React.FC = () => {
  const { user } = useAuth();
  const { products, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const sellerProducts = products.filter(p => p.sellerId === user?.id);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Products Management</h2>
        <button
          onClick={handleAddProduct}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellerProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded object-cover" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEditProduct(product)} className="text-indigo-600 hover:text-indigo-900 p-1">
                        <Edit className="h-4 w-4"/>
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="h-4 w-4"/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="xl"
      >
        <EnhancedProductForm
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

// Additional seller components
const SellerOrders: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Management</h2>
    <p className="text-gray-600">Manage your orders, process shipments, and track delivery status.</p>
  </div>
);

const SellerPromotions: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Promotions & Marketing</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 border border-gray-200 rounded-lg">
        <Tag className="h-8 w-8 text-orange-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Discount Campaigns</h3>
        <p className="text-sm text-gray-600">Create and manage product discounts</p>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <Megaphone className="h-8 w-8 text-red-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Featured Products</h3>
        <p className="text-sm text-gray-600">Promote your best products</p>
      </div>
    </div>
  </div>
);

const SellerReviews: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
    <p className="text-gray-600">Monitor and respond to customer feedback and reviews.</p>
  </div>
);

const SellerSettings: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Seller Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 border border-gray-200 rounded-lg">
        <Settings className="h-8 w-8 text-gray-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Store Settings</h3>
        <p className="text-sm text-gray-600">Manage your store profile and preferences</p>
      </div>
      <div className="p-4 border border-gray-200 rounded-lg">
        <CreditCard className="h-8 w-8 text-green-500 mb-2" />
        <h3 className="font-semibold text-gray-900">Payment Settings</h3>
        <p className="text-sm text-gray-600">Configure payment methods and payouts</p>
      </div>
    </div>
  </div>
);

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'overview', label: 'Overview', icon: <Home className="h-5 w-5" /> },
  { id: 'products', label: 'Products', icon: <Package className="h-5 w-5" /> },
  { id: 'orders', label: 'Orders', icon: <ShoppingCart className="h-5 w-5" />, badge: '3' },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'promotions', label: 'Promotions', icon: <Tag className="h-5 w-5" /> },
  { id: 'reviews', label: 'Reviews', icon: <Star className="h-5 w-5" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="h-5 w-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> }
];

export const SellerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <SellerOverview />;
      case 'products':
        return <SellerProductsManagement />;
      case 'orders':
        return <SellerOrders />;
      case 'analytics':
        return <SellerAnalytics />;
      case 'promotions':
        return <SellerPromotions />;
      case 'reviews':
        return <SellerReviews />;
      case 'reports':
        return <SellerAnalytics />;
      case 'settings':
        return <SellerSettings />;
      default:
        return <SellerOverview />;
    }
  };

  const sidebarVariants = {
    expanded: { width: '256px' },
    collapsed: { width: '64px' }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <motion.div
        variants={sidebarVariants}
        animate={sidebarCollapsed ? 'collapsed' : 'expanded'}
        transition={{ duration: 0.3 }}
        className="bg-white border-r border-gray-200 shadow-sm relative"
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-indigo-600" />
              <span className="font-semibold text-gray-900">Seller Center</span>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="p-2 space-y-1 overflow-y-auto max-h-[calc(100vh-80px)]">
          {sidebarItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeTab === item.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="truncate font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!sidebarCollapsed && item.badge && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {item.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-6"
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export const SellerDashboardBasic: React.FC = () => {
  const { user } = useAuth();
  const { products, deleteProduct } = useProducts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Filter products by the logged-in user's ID
  const sellerProducts = products.filter(p => p.sellerId === user?.id);

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  
  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(productId);
    }
  };

  const stats = [
    { title: 'Total Sales', value: '$23,450', change: '+15.2%', icon: DollarSign, color: 'bg-green-500' },
    { title: 'Products Listed', value: sellerProducts.length.toString(), change: `+${sellerProducts.length}`, icon: Package, color: 'bg-blue-500' },
    { title: 'Orders', value: '145', change: '+8.1%', icon: ShoppingCart, color: 'bg-purple-500' },
    { title: 'Growth', value: '12.5%', change: '+2.1%', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your products and track your sales performance.</p>
        </div>
        <div className="flex items-center space-x-4 mt-4 lg:mt-0">
          <motion.button
            onClick={handleAddProduct}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-1">{stat.change} from last month</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">My Products</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sellerProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img src={product.images[0]} alt={product.name} className="h-10 w-10 rounded object-cover" />
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.stock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${ product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800' }`}>
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleEditProduct(product)} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit className="h-4 w-4"/></button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 className="h-4 w-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="xl"
      >
        <EnhancedProductForm
          product={editingProduct}
          onClose={() => setIsModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

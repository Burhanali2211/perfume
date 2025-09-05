import React, { useState, useEffect } from 'react';
import { Package, Heart, CreditCard, MapPin, User, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWishlist } from '../../contexts/WishlistContext';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { getOrders } from '../../lib/supabase';
import { Order } from '../../types';
import { ResponsiveTable } from '../../components/Common/ResponsiveTable';

export const CustomerDashboard: React.FC = () => {
  const { items: wishlistItems } = useWishlist();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (user) {
        try {
          const userOrders = await getOrders(user.id);
          setOrders(userOrders);
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      }
      setLoading(false);
    };

    fetchUserOrders();
  }, [user]);

  const pendingOrders = orders.filter(order =>
    ['pending', 'confirmed', 'processing', 'shipped'].includes(order.status)
  ).length;

  const stats = [
    {
      title: 'Orders',
      value: orders.length.toString(),
      description: `${pendingOrders} pending delivery`,
      icon: Package,
      color: 'bg-blue-500',
      href: '/orders',
    },
    {
      title: 'Wishlist',
      value: wishlistItems.length.toString(),
      description: 'Items saved for later',
      icon: Heart,
      color: 'bg-red-500',
      href: '/wishlist',
    },
    {
      title: 'Cart',
      value: itemCount.toString(),
      description: 'Items ready to purchase',
      icon: CreditCard,
      color: 'bg-green-500',
      href: '#',
    },
  ];

  // Get recent orders (last 3)
  const recentOrders = orders.slice(0, 3).map(order => {
    const firstItem = order.items[0];
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      product: firstItem?.product?.name || 'Unknown Product',
      image: firstItem?.product?.images?.[0] || '/src/assets/images/products/sample-product-2.jpg',
      amount: `$${order.total.toFixed(2)}`,
      status: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      date: new Date(order.createdAt).toLocaleDateString(),
      itemCount: order.items.length
    };
  });

  // Fallback mock data if no real orders
  const mockRecentOrders = [
    {
      id: '1',
      orderNumber: 'ORD-DEMO-001',
      product: 'Wireless Bluetooth Headphones',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
      amount: '$129.99',
      status: 'Delivered',
      date: '2025-01-10',
      itemCount: 1
    },
    {
      id: '2',
      orderNumber: 'ORD-DEMO-002',
      product: 'Smart Fitness Watch',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
      amount: '$299.99',
      status: 'Shipped',
      date: '2025-01-12',
      itemCount: 1
    },
    {
      id: '3',
      orderNumber: 'ORD-DEMO-003',
      product: 'Premium Coffee Beans',
      image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=100&h=100&fit=crop',
      amount: '$24.99',
      status: 'Processing',
      date: '2025-01-14',
      itemCount: 2
    },
  ];

  const displayOrders = recentOrders.length > 0 ? recentOrders : mockRecentOrders;

  // Prepare columns for recent orders table
  const orderColumns = [
    {
      key: 'product',
      title: 'Product',
      minWidth: 200,
      render: (value: string, record: any) => (
        <div className="flex items-center space-x-3">
          <img
            src={record.image}
            alt={record.product}
            className="h-10 w-10 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-gray-900">{record.product}</p>
            <p className="text-sm text-gray-600">
              {record.orderNumber} • {record.date}
              {record.itemCount > 1 && ` • ${record.itemCount} items`}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'Amount',
      width: 100,
      render: (value: string) => <p className="font-semibold text-gray-900">{value}</p>
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (value: string) => (
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
          value === 'Delivered' ? 'bg-green-100 text-green-700' :
          value === 'Shipped' ? 'bg-blue-100 text-blue-700' :
          value === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {value}
        </span>
      )
    }
  ];

  const quickActions = [
    { icon: User, title: 'Edit Profile', description: 'Update your personal information' },
    { icon: MapPin, title: 'Manage Addresses', description: 'Add or edit shipping addresses' },
    { icon: Bell, title: 'Notifications', description: 'Manage your notification preferences' },
    { icon: CreditCard, title: 'Payment Methods', description: 'Add or remove payment cards' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your account.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
              <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                View all orders
              </button>
            </div>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg animate-pulse">
                    <div className="h-12 w-12 bg-gray-300 rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-300 rounded w-16 mb-2"></div>
                      <div className="h-6 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <ResponsiveTable
                    columns={orderColumns}
                    data={displayOrders}
                    loading={false}
                    emptyMessage="No orders yet"
                  />
                </div>
                <div className="md:hidden space-y-4">
                  {displayOrders.map((order) => (
                    <div key={order.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <img
                        src={order.image}
                        alt={order.product}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{order.product}</p>
                        <p className="text-sm text-gray-600">
                          {order.orderNumber} • {order.date}
                          {order.itemCount > 1 && ` • ${order.itemCount} items`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{order.amount}</p>
                        <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                          order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {displayOrders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No orders yet</p>
                      <p className="text-sm">Start shopping to see your orders here!</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {quickActions.map((action) => (
                <motion.button
                  key={action.title}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <action.icon className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{action.title}</p>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold mb-2">Recommended for You</h3>
            <p className="text-indigo-100">Discover products based on your preferences and purchase history.</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-indigo-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors self-start md:self-auto"
          >
            Shop Now
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
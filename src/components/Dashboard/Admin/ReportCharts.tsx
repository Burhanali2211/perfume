import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { DollarSign, Users, Package, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { getDashboardAnalytics } from '../../../lib/supabase';
import { DashboardAnalytics, Order } from '../../../types';

// Mock data for charts
const salesData = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4500 },
  { name: 'May', sales: 6000 },
  { name: 'Jun', sales: 5500 },
];

const userData = [
  { name: 'Jan', users: 200 },
  { name: 'Feb', users: 250 },
  { name: 'Mar', users: 300 },
  { name: 'Apr', users: 320 },
  { name: 'May', users: 350 },
  { name: 'Jun', users: 400 },
];

interface ReportChartsProps {
    analytics?: DashboardAnalytics;
}

export const ReportCharts: React.FC<ReportChartsProps> = ({ analytics: propAnalytics }) => {
    const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(propAnalytics || null);
    const [loading, setLoading] = useState(!propAnalytics);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (propAnalytics) {
            setAnalytics(propAnalytics);
            setLoading(false);
            return;
        }

        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const data = await getDashboardAnalytics();
                setAnalytics(data);
                setError(null);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError(err instanceof Error ? err.message : 'Failed to load analytics');
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, [propAnalytics]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    };

    const stats = analytics ? [
        {
            title: 'Total Revenue',
            value: formatCurrency(analytics.total_revenue || 0),
            change: '+12.5%',
            icon: DollarSign,
            color: 'bg-green-500'
        },
        {
            title: 'Total Users',
            value: (analytics.total_users || 0).toLocaleString(),
            change: '+8.1%',
            icon: Users,
            color: 'bg-blue-500'
        },
        {
            title: 'Total Products',
            value: (analytics.total_products || 0).toLocaleString(),
            change: '+5.2%',
            icon: Package,
            color: 'bg-purple-500'
        },
        {
            title: 'Total Orders',
            value: (analytics.total_orders || 0).toLocaleString(),
            change: '+15.3%',
            icon: TrendingUp,
            color: 'bg-orange-500'
        },
    ] : [
        { title: 'Total Revenue', value: '₹0', change: '+0%', icon: DollarSign, color: 'bg-green-500' },
        { title: 'Total Users', value: '0', change: '+0%', icon: Users, color: 'bg-blue-500' },
        { title: 'Total Products', value: '0', change: '+0%', icon: Package, color: 'bg-purple-500' },
        { title: 'Total Orders', value: '0', change: '+0%', icon: TrendingUp, color: 'bg-orange-500' },
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                                </div>
                                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                    <div>
                        <h3 className="text-red-800 font-medium">Error Loading Analytics</h3>
                        <p className="text-red-600 text-sm mt-1">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

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

      {/* Alerts Section */}
      {analytics && (analytics.pending_orders > 0 || analytics.low_stock_products > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics.pending_orders > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="text-yellow-800 font-medium">Pending Orders</h3>
                  <p className="text-yellow-600 text-sm mt-1">
                    {analytics.pending_orders} orders are waiting for processing
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {analytics.low_stock_products > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-red-800 font-medium">Low Stock Alert</h3>
                  <p className="text-red-600 text-sm mt-1">
                    {analytics.low_stock_products} products are running low on stock
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Recent Orders */}
      {analytics?.recent_orders && analytics.recent_orders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.recent_orders.map((order: Order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.order_number || order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.customer_name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sales" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Users</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#4f46e5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Star
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../Common/LoadingSpinner';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalOrders: number;
    totalProducts: number;
    totalRevenue: number;
    userGrowth: number;
    orderGrowth: number;
    revenueGrowth: number;
  };
  recentActivity: {
    newUsers: number;
    newOrders: number;
    newProducts: number;
    newReviews: number;
  };
  orderStats: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  userActivity: Array<{
    date: string;
    logins: number;
    registrations: number;
  }>;
  salesTrends: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

export const AdvancedAnalytics: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const fetchAnalyticsData = async () => {
    try {
      setError(null);
      setLoading(true);

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch overview data
      const [usersResult, ordersResult, productsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total_amount, created_at').gte('created_at', startDate.toISOString()),
        supabase.from('products').select('*', { count: 'exact', head: true })
      ]);

      const totalUsers = usersResult.count || 0;
      const totalProducts = productsResult.count || 0;
      const orders = ordersResult.data || [];
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

      // Fetch recent activity (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [newUsersResult, newOrdersResult, newProductsResult, newReviewsResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString()),
        supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString()),
        supabase.from('products').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString()),
        supabase.from('reviews').select('*', { count: 'exact', head: true }).gte('created_at', yesterday.toISOString())
      ]);

      // Fetch order status distribution
      const orderStatusResult = await supabase
        .from('orders')
        .select('status')
        .gte('created_at', startDate.toISOString());

      const orderStats = {
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0
      };

      orderStatusResult.data?.forEach(order => {
        if (order.status in orderStats) {
          orderStats[order.status as keyof typeof orderStats]++;
        }
      });

      // Fetch top products
      const topProductsResult = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          unit_price,
          products(name)
        `)
        .gte('created_at', startDate.toISOString());

      const productSales: Record<string, { name: string; sales: number; revenue: number }> = {};
      
      topProductsResult.data?.forEach(item => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Unknown Product';
        const quantity = item.quantity;
        const revenue = item.quantity * parseFloat(item.unit_price);

        if (!productSales[productId]) {
          productSales[productId] = { name: productName, sales: 0, revenue: 0 };
        }
        
        productSales[productId].sales += quantity;
        productSales[productId].revenue += revenue;
      });

      const topProducts = Object.entries(productSales)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Generate sample trends data (in a real app, you'd calculate this from actual data)
      const salesTrends = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          sales: Math.floor(Math.random() * 10000) + 5000,
          orders: Math.floor(Math.random() * 50) + 20
        };
      });

      const userActivity = Array.from({ length: 30 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (29 - i));
        return {
          date: date.toISOString().split('T')[0],
          logins: Math.floor(Math.random() * 200) + 50,
          registrations: Math.floor(Math.random() * 20) + 5
        };
      });

      setData({
        overview: {
          totalUsers,
          totalOrders,
          totalProducts,
          totalRevenue,
          userGrowth: 12.5, // Mock data
          orderGrowth: 8.3,
          revenueGrowth: 15.7
        },
        recentActivity: {
          newUsers: newUsersResult.count || 0,
          newOrders: newOrdersResult.count || 0,
          newProducts: newProductsResult.count || 0,
          newReviews: newReviewsResult.count || 0
        },
        orderStats,
        topProducts,
        userActivity,
        salesTrends
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, fetchAnalyticsData]);

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading analytics..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-primary" />
            Advanced Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive business insights and performance metrics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalUsers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{data.overview.userGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalOrders.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{data.overview.orderGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{data.overview.totalProducts.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <CheckCircle className="h-4 w-4 text-blue-500 mr-1" />
            <span className="text-sm text-blue-600 font-medium">Active</span>
            <span className="text-sm text-gray-500 ml-2">in catalog</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${data.overview.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-sm text-green-600 font-medium">+{data.overview.revenueGrowth}%</span>
            <span className="text-sm text-gray-500 ml-2">vs last period</span>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-primary" />
          Recent Activity (Last 24 Hours)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-900">{data.recentActivity.newUsers}</p>
            <p className="text-sm text-blue-600">New Users</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <ShoppingCart className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-green-900">{data.recentActivity.newOrders}</p>
            <p className="text-sm text-green-600">New Orders</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-900">{data.recentActivity.newProducts}</p>
            <p className="text-sm text-purple-600">New Products</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-yellow-900">{data.recentActivity.newReviews}</p>
            <p className="text-sm text-yellow-600">New Reviews</p>
          </div>
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <PieChart className="h-5 w-5 mr-2 text-primary" />
            Order Status Distribution
          </h2>
          <div className="space-y-3">
            {Object.entries(data.orderStats).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${
                    status === 'pending' ? 'bg-yellow-500' :
                    status === 'processing' ? 'bg-blue-500' :
                    status === 'shipped' ? 'bg-purple-500' :
                    status === 'delivered' ? 'bg-green-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{status}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Top Products
          </h2>
          <div className="space-y-3">
            {data.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-primary text-white text-xs rounded-full flex items-center justify-center mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} units sold</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-green-600">${product.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

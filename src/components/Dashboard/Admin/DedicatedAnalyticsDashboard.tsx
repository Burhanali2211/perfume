import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { ErrorFallback } from '../../Common/ErrorFallback';

interface AnalyticsData {
  totalRevenue: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersGrowth: number;
  totalCustomers: number;
  customersGrowth: number;
  totalProducts: number;
  productsGrowth: number;
  averageOrderValue: number;
  conversionRate: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: Array<{
    id: string;
    total: number;
    status: string;
    created_at: string;
    customer_name: string;
  }>;
  salesByMonth: Array<{
    month: string;
    sales: number;
    orders: number;
  }>;
}

export const DedicatedAnalyticsDashboard: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Validate Supabase client configuration
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // Check if environment variables are available
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration is missing. Please check environment variables.');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (dateRange) {
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

      // Fetch analytics data with proper error handling
      const [ordersResponse, productsResponse, usersResponse] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total, status, created_at, profiles(id, email, full_name)')
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString()),
        supabase.from('products').select('id, name, price'),
        supabase.from('profiles').select('id, created_at')
      ]);

      // Enhanced error handling with specific error messages
      if (ordersResponse.error) {
        console.error('Orders fetch error:', ordersResponse.error);
        throw new Error(`Failed to fetch orders: ${ordersResponse.error.message}`);
      }
      if (productsResponse.error) {
        console.error('Products fetch error:', productsResponse.error);
        throw new Error(`Failed to fetch products: ${productsResponse.error.message}`);
      }
      if (usersResponse.error) {
        console.error('Users fetch error:', usersResponse.error);
        throw new Error(`Failed to fetch users: ${usersResponse.error.message}`);
      }

      const orders = ordersResponse.data || [];
      const products = productsResponse.data || [];
      const users = usersResponse.data || [];

      // Log successful data fetch for debugging
      console.log('Analytics data fetched successfully:', {
        ordersCount: orders.length,
        productsCount: products.length,
        usersCount: users.length
      });

      // Calculate metrics
      const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0);
      const totalOrders = orders.length;
      const totalCustomers = users.length;
      const totalProducts = products.length;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Mock growth data (in real app, compare with previous period)
      const revenueGrowth = Math.random() * 20 - 10; // -10% to +10%
      const ordersGrowth = Math.random() * 15 - 5; // -5% to +10%
      const customersGrowth = Math.random() * 25; // 0% to +25%
      const productsGrowth = Math.random() * 10; // 0% to +10%

      // Recent orders
      const recentOrders = orders
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(order => ({
          id: order.id,
          total: order.total,
          status: order.status,
          created_at: order.created_at,
          customer_name: order.profiles?.full_name || order.profiles?.email || 'Unknown'
        }));

      // Mock top products (in real app, join with order_items)
      const topProducts = products.slice(0, 5).map(product => ({
        id: product.id,
        name: product.name,
        sales: Math.floor(Math.random() * 100) + 10,
        revenue: Math.floor(Math.random() * 5000) + 500
      }));

      // Mock sales by month
      const salesByMonth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          sales: Math.floor(Math.random() * 10000) + 5000,
          orders: Math.floor(Math.random() * 100) + 50
        };
      }).reverse();

      setAnalyticsData({
        totalRevenue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        totalCustomers,
        customersGrowth,
        totalProducts,
        productsGrowth,
        averageOrderValue,
        conversionRate: Math.random() * 5 + 2, // 2-7%
        topProducts,
        recentOrders,
        salesByMonth
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);

      // Enhanced error handling with specific error types
      let errorMessage = 'Failed to fetch analytics data';

      if (err instanceof Error) {
        if (err.message.includes('apikey') || err.message.includes('API key')) {
          errorMessage = 'Authentication error: Please check your Supabase configuration and ensure the API key is properly set.';
        } else if (err.message.includes('network') || err.message.includes('fetch')) {
          errorMessage = 'Network error: Please check your internet connection and try again.';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);

      // Fallback to mock data if database is unavailable
      if (err instanceof Error && (err.message.includes('apikey') || err.message.includes('network'))) {
        console.warn('Falling back to mock analytics data due to database error');
        setAnalyticsData({
          totalRevenue: 125000,
          revenueGrowth: 12.5,
          totalOrders: 450,
          ordersGrowth: 8.2,
          totalCustomers: 1250,
          customersGrowth: 15.3,
          totalProducts: 89,
          productsGrowth: 5.1,
          averageOrderValue: 277.78,
          conversionRate: 3.2,
          topProducts: [],
          recentOrders: [],
          salesByMonth: []
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading analytics data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorFallback
          error={error}
          onRetry={fetchAnalyticsData}
          type="analytics"
          size="large"
        />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your business performance and insights</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(analyticsData.totalRevenue)}</p>
              <div className="flex items-center mt-2">
                {analyticsData.revenueGrowth >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(analyticsData.revenueGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalOrders.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                {analyticsData.ordersGrowth >= 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(analyticsData.ordersGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalCustomers.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  {formatPercentage(analyticsData.customersGrowth)}
                </span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(analyticsData.averageOrderValue)}</p>
              <div className="flex items-center mt-2">
                <ArrowUp className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium text-green-600">+5.2%</span>
                <span className="text-sm text-gray-500 ml-1">vs last period</span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <Eye className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analyticsData.recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(order.total)}</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    order.status === 'completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Package className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analyticsData.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
                <p className="font-semibold text-gray-900">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Data</h3>
            <p className="text-gray-600">Download your analytics data for further analysis</p>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Activity
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedButton } from '../../Common/EnhancedButton';

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
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export const EnhancedAnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      // Fetch revenue data
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total, created_at')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'completed');

      // Fetch orders data
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, total, status, created_at, profiles(name)')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Fetch customers data
      const { data: customersData } = await supabase
        .from('profiles')
        .select('id, created_at')
        .gte('created_at', startDate.toISOString());

      // Fetch products data
      const { data: productsData } = await supabase
        .from('products')
        .select('id, created_at');

      // Calculate metrics
      const totalRevenue = revenueData?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = ordersData?.length || 0;
      const totalCustomers = customersData?.length || 0;
      const totalProducts = productsData?.length || 0;

      // Calculate growth rates (mock data for now)
      const revenueGrowth = Math.random() * 20 - 10; // -10% to +10%
      const ordersGrowth = Math.random() * 15 - 7.5;
      const customersGrowth = Math.random() * 25 - 12.5;
      const productsGrowth = Math.random() * 10 - 5;

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const conversionRate = Math.random() * 5 + 2; // 2-7%

      // Process top products (mock data)
      const topProducts = [
        { id: '1', name: 'Premium Headphones', sales: 45, revenue: 2250 },
        { id: '2', name: 'Wireless Mouse', sales: 38, revenue: 1140 },
        { id: '3', name: 'Gaming Keyboard', sales: 32, revenue: 1920 },
        { id: '4', name: 'USB-C Cable', sales: 28, revenue: 420 },
        { id: '5', name: 'Phone Case', sales: 25, revenue: 625 }
      ];

      // Process recent orders
      const recentOrders = ordersData?.map(order => ({
        id: order.id,
        total: order.total,
        status: order.status,
        created_at: order.created_at,
        customer_name: order.profiles?.name || 'Unknown'
      })) || [];

      // Generate sales by month data
      const salesByMonth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          month: date.toLocaleDateString('en-US', { month: 'short' }),
          revenue: Math.random() * 10000 + 5000,
          orders: Math.floor(Math.random() * 100 + 50)
        };
      }).reverse();

      // Generate orders by status data
      const ordersByStatus = [
        { status: 'pending', count: Math.floor(Math.random() * 20 + 10) },
        { status: 'confirmed', count: Math.floor(Math.random() * 30 + 15) },
        { status: 'shipped', count: Math.floor(Math.random() * 25 + 12) },
        { status: 'delivered', count: Math.floor(Math.random() * 40 + 20) },
        { status: 'cancelled', count: Math.floor(Math.random() * 10 + 2) }
      ];

      setAnalytics({
        totalRevenue,
        revenueGrowth,
        totalOrders,
        ordersGrowth,
        totalCustomers,
        customersGrowth,
        totalProducts,
        productsGrowth,
        averageOrderValue,
        conversionRate,
        topProducts,
        recentOrders,
        salesByMonth,
        ordersByStatus
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading analytics..." />
      </div>
    );
  }

  if (!analytics) {
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
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <BarChart3 className="h-8 w-8 mr-3 text-indigo-600" />
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Track your store's performance and growth</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
          
          <EnhancedButton
            onClick={handleRefresh}
            loading={refreshing}
            icon={<RefreshCw className="h-4 w-4" />}
            variant="outline"
          >
            Refresh
          </EnhancedButton>
          
          <EnhancedButton
            icon={<Download className="h-4 w-4" />}
            variant="outline"
          >
            Export
          </EnhancedButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.totalRevenue)}</p>
              <div className={`flex items-center mt-2 ${getGrowthColor(analytics.revenueGrowth)}`}>
                {getGrowthIcon(analytics.revenueGrowth)}
                <span className="ml-1 text-sm font-medium">
                  {analytics.revenueGrowth > 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}%
                </span>
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
              <p className="text-3xl font-bold text-gray-900">{analytics.totalOrders.toLocaleString()}</p>
              <div className={`flex items-center mt-2 ${getGrowthColor(analytics.ordersGrowth)}`}>
                {getGrowthIcon(analytics.ordersGrowth)}
                <span className="ml-1 text-sm font-medium">
                  {analytics.ordersGrowth > 0 ? '+' : ''}{analytics.ordersGrowth.toFixed(1)}%
                </span>
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
              <p className="text-3xl font-bold text-gray-900">{analytics.totalCustomers.toLocaleString()}</p>
              <div className={`flex items-center mt-2 ${getGrowthColor(analytics.customersGrowth)}`}>
                {getGrowthIcon(analytics.customersGrowth)}
                <span className="ml-1 text-sm font-medium">
                  {analytics.customersGrowth > 0 ? '+' : ''}{analytics.customersGrowth.toFixed(1)}%
                </span>
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
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics.averageOrderValue)}</p>
              <div className="flex items-center mt-2 text-gray-600">
                <Activity className="h-4 w-4" />
                <span className="ml-1 text-sm font-medium">
                  {analytics.conversionRate.toFixed(1)}% conversion
                </span>
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-500 w-6">#{index + 1}</span>
                  <span className="text-sm font-medium text-gray-900 ml-2">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(product.revenue)}</p>
                  <p className="text-xs text-gray-500">{product.sales} sales</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {analytics.recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</p>
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
      </div>
    </div>
  );
};

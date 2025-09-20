import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import {
  TrendingUp, TrendingDown, Users, Package, DollarSign, ShoppingCart,
  AlertTriangle, Clock, Filter
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';

// Define types for our data
interface SalesTrendData {
  month: string;
  sales: number;
  orders: number;
  customers: number;
}

interface CategoryData {
  name: string;
  value: number;
  sales: number;
}

interface CustomerGrowthData {
  month: string;
  new: number;
  returning: number;
  total: number;
}

interface AnalyticsData {
  total_revenue: number;
  total_orders: number;
  total_users: number;
  total_products: number;
  pending_orders: number;
  low_stock_products: number;
  sales_trend: SalesTrendData[];
  category_performance: CategoryData[];
  customer_growth: CustomerGrowthData[];
}

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

export const EnhancedAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isVisibleRef = useRef(true);
  const lastFetchTimeRef = useRef<number>(0);

  // Track component visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      // Skip fetching if component is not visible
      if (!isVisibleRef.current) {
        return;
      }

      // Prevent too frequent fetches (at most once every 5 seconds)
      const now = Date.now();
      if (now - lastFetchTimeRef.current < 5000) {
        return;
      }
      
      lastFetchTimeRef.current = now;

      setLoading(true);
      setError(null);

      try {
        // Fetch analytics data from Supabase
        const { data, error } = await supabase.rpc('get_dashboard_analytics');
        
        if (error) {
          throw new Error(error.message);
        }
        
        setAnalytics(data);
      } catch (err: any) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    const handleDataModeChange = () => {
      // Clear any existing timeout to prevent multiple rapid refreshes
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Only refresh if component is visible
      if (isVisibleRef.current) {
        // Debounce the refresh to prevent excessive calls (increased to 2 seconds)
        refreshTimeoutRef.current = setTimeout(() => {
          fetchAnalytics();
        }, 2000);
      }
    };

    const handleRefreshData = () => {
      // Clear any existing timeout to prevent multiple rapid refreshes
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      
      // Only refresh if component is visible
      if (isVisibleRef.current) {
        // Debounce the refresh to prevent excessive calls (increased to 2 seconds)
        refreshTimeoutRef.current = setTimeout(() => {
          fetchAnalytics();
        }, 2000);
      }
    };

    // Initial fetch
    fetchAnalytics();

    // Set up periodic refresh (every 5 minutes instead of more frequent)
    refreshIntervalRef.current = setInterval(() => {
      // Only refresh if component is visible
      if (isVisibleRef.current) {
        fetchAnalytics();
      }
    }, 300000); // 5 minutes

    // Listen for data mode changes
    window.addEventListener('dataModeChanged', handleDataModeChange);
    window.addEventListener('refreshAllData', handleRefreshData);

    return () => {
      window.removeEventListener('dataModeChanged', handleDataModeChange);
      window.removeEventListener('refreshAllData', handleRefreshData);
      
      // Clear timeout and interval on unmount
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getChangeColor = (value: number) => {
    return value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const getChangeIcon = (value: number) => {
    return value > 0 ? TrendingUp : value < 0 ? TrendingDown : TrendingUp;
  };

  const stats = analytics ? [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.total_revenue || 0),
      change: 12.5,
      icon: DollarSign,
      color: 'bg-green-500',
      description: 'vs last month'
    },
    {
      title: 'Total Orders',
      value: (analytics.total_orders || 0).toLocaleString(),
      change: 8.2,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      description: 'vs last month'
    },
    {
      title: 'Active Users',
      value: (analytics.total_users || 0).toLocaleString(),
      change: 15.3,
      icon: Users,
      color: 'bg-purple-500',
      description: 'vs last month'
    },
    {
      title: 'Products',
      value: (analytics.total_products || 0).toLocaleString(),
      change: 5.7,
      icon: Package,
      color: 'bg-orange-500',
      description: 'vs last month'
    },
    {
      title: 'Conversion Rate',
      value: '3.2%',
      change: 0.8,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      description: 'vs last month'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(156.50),
      change: -2.1,
      icon: DollarSign,
      color: 'bg-pink-500',
      description: 'vs last month'
    },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
          <h3 className="text-red-800 font-medium">Error Loading Data</h3>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Time Range Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Analytics</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your e-commerce performance
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 lg:mt-0">
          <Filter className="h-4 w-4 text-gray-500" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const ChangeIcon = getChangeIcon(stat.change);
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <ChangeIcon className={`h-4 w-4 ${getChangeColor(stat.change)}`} />
                    <span className={`text-sm font-medium ml-1 ${getChangeColor(stat.change)}`}>
                      {formatPercentage(stat.change)}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">{stat.description}</span>
                  </div>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Alerts Section */}
      {analytics && (analytics.pending_orders > 0 || analytics.low_stock_products > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {analytics.pending_orders > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <Clock className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="text-yellow-800 font-medium">Pending Orders</h3>
                  <p className="text-yellow-600 text-sm mt-1">
                    {analytics.pending_orders} orders need immediate attention
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {analytics.low_stock_products > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-50 border border-red-200 rounded-lg p-6"
            >
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-red-800 font-medium">Low Stock Alert</h3>
                  <p className="text-red-600 text-sm mt-1">
                    {analytics.low_stock_products} products running low on inventory
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics?.sales_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                name === 'sales' ? formatCurrency(value as number) : value,
                name === 'sales' ? 'Sales' : name === 'orders' ? 'Orders' : 'Customers'
              ]} />
              <Legend />
              <Area type="monotone" dataKey="sales" stackId="1" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Performance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics?.category_performance || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics?.category_performance?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Customer Growth */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics?.customer_growth || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="new" stackId="a" fill="#10b981" name="New Customers" />
              <Bar dataKey="returning" stackId="a" fill="#06b6d4" name="Returning Customers" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Order Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics?.sales_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="orders" stroke="#4f46e5" strokeWidth={3} />
              <Line type="monotone" dataKey="customers" stroke="#06b6d4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};
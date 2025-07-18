import React, { useState, useEffect } from 'react';
import {
  Database,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  MapPin,
  Star,
  Tag,
  Truck,
  Settings,
  Activity,
  BarChart3,
  TrendingUp,
  Eye,
  Download,
  Filter,
  Search,
  RefreshCw,
  GitBranch
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { ErrorFallback } from '../../Common/ErrorFallback';
import { UniversalTableManager } from './UniversalTableManager';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { DatabaseSchemaViewer } from './DatabaseSchemaViewer';

interface TableInfo {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  description: string;
  count: number;
  color: string;
}

interface DatabaseStats {
  totalTables: number;
  totalRecords: number;
  lastUpdated: Date;
  tables: TableInfo[];
}

export const ComprehensiveAdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [currentView, setCurrentView] = useState<'overview' | 'table' | 'analytics' | 'schema'>('overview');

  const tableConfigs: Record<string, Omit<TableInfo, 'count'>> = {
    profiles: {
      name: 'profiles',
      displayName: 'User Profiles',
      icon: <Users className="h-6 w-6" />,
      description: 'User accounts and profile information',
      color: 'bg-blue-500'
    },
    products: {
      name: 'products',
      displayName: 'Products',
      icon: <Package className="h-6 w-6" />,
      description: 'Product catalog and inventory',
      color: 'bg-green-500'
    },
    categories: {
      name: 'categories',
      displayName: 'Categories',
      icon: <Tag className="h-6 w-6" />,
      description: 'Product categories and organization',
      color: 'bg-purple-500'
    },
    orders: {
      name: 'orders',
      displayName: 'Orders',
      icon: <ShoppingCart className="h-6 w-6" />,
      description: 'Customer orders and transactions',
      color: 'bg-orange-500'
    },
    order_items: {
      name: 'order_items',
      displayName: 'Order Items',
      icon: <Package className="h-5 w-5" />,
      description: 'Individual items within orders',
      color: 'bg-orange-400'
    },
    cart_items: {
      name: 'cart_items',
      displayName: 'Shopping Carts',
      icon: <ShoppingCart className="h-5 w-5" />,
      description: 'Active shopping cart items',
      color: 'bg-yellow-500'
    },
    wishlist_items: {
      name: 'wishlist_items',
      displayName: 'Wishlists',
      icon: <Star className="h-6 w-6" />,
      description: 'Customer wishlist items',
      color: 'bg-pink-500'
    },
    reviews: {
      name: 'reviews',
      displayName: 'Reviews',
      icon: <Star className="h-5 w-5" />,
      description: 'Product reviews and ratings',
      color: 'bg-yellow-600'
    },
    addresses: {
      name: 'addresses',
      displayName: 'Addresses',
      icon: <MapPin className="h-6 w-6" />,
      description: 'Customer shipping and billing addresses',
      color: 'bg-red-500'
    },
    payment_methods: {
      name: 'payment_methods',
      displayName: 'Payment Methods',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Customer payment information',
      color: 'bg-indigo-500'
    },
    coupons: {
      name: 'coupons',
      displayName: 'Coupons',
      icon: <Tag className="h-5 w-5" />,
      description: 'Discount coupons and promotions',
      color: 'bg-emerald-500'
    },
    product_variants: {
      name: 'product_variants',
      displayName: 'Product Variants',
      icon: <Package className="h-5 w-5" />,
      description: 'Product variations and options',
      color: 'bg-teal-500'
    },
    order_tracking: {
      name: 'order_tracking',
      displayName: 'Order Tracking',
      icon: <Truck className="h-6 w-6" />,
      description: 'Order shipment tracking information',
      color: 'bg-cyan-500'
    },
    user_preferences: {
      name: 'user_preferences',
      displayName: 'User Preferences',
      icon: <Settings className="h-6 w-6" />,
      description: 'User notification and display preferences',
      color: 'bg-gray-500'
    },
    user_security_settings: {
      name: 'user_security_settings',
      displayName: 'Security Settings',
      icon: <Settings className="h-5 w-5" />,
      description: 'User security and authentication settings',
      color: 'bg-red-600'
    },
    user_sessions: {
      name: 'user_sessions',
      displayName: 'User Sessions',
      icon: <Activity className="h-6 w-6" />,
      description: 'Active and historical user sessions',
      color: 'bg-blue-600'
    },
    login_activity: {
      name: 'login_activity',
      displayName: 'Login Activity',
      icon: <Activity className="h-5 w-5" />,
      description: 'User login attempts and security logs',
      color: 'bg-slate-600'
    }
  };

  const fetchDatabaseStats = async () => {
    try {
      setError(null);
      const tableNames = Object.keys(tableConfigs);
      const tableCounts: TableInfo[] = [];
      let totalRecords = 0;

      // Fetch count for each table
      for (const tableName of tableNames) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (error) {
            console.warn(`Error fetching count for ${tableName}:`, error);
            continue;
          }

          const tableCount = count || 0;
          totalRecords += tableCount;

          tableCounts.push({
            ...tableConfigs[tableName],
            count: tableCount
          });
        } catch (err) {
          console.warn(`Failed to fetch count for ${tableName}:`, err);
        }
      }

      setStats({
        totalTables: tableCounts.length,
        totalRecords,
        lastUpdated: new Date(),
        tables: tableCounts.sort((a, b) => b.count - a.count)
      });
    } catch (err) {
      console.error('Error fetching database stats:', err);
      setError('Failed to load database statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDatabaseStats();
  }, [fetchDatabaseStats]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDatabaseStats();
  };

  const filteredTables = stats?.tables.filter(table =>
    table.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handle different views
  if (currentView === 'table' && selectedTable) {
    const tableConfig = tableConfigs[selectedTable];
    return (
      <UniversalTableManager
        tableName={selectedTable}
        displayName={tableConfig?.displayName || selectedTable}
        onBack={() => {
          setCurrentView('overview');
          setSelectedTable(null);
        }}
      />
    );
  }

  if (currentView === 'analytics') {
    return <AdvancedAnalytics />;
  }

  if (currentView === 'schema') {
    return <DatabaseSchemaViewer />;
  }

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading database statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorFallback
          error={error}
          onRetry={fetchDatabaseStats}
          type="database"
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Database className="h-8 w-8 mr-3 text-primary" />
            Database Administration
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive view of all database tables and records
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setCurrentView('analytics')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setCurrentView('schema')}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Schema
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tables</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTables}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRecords.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Updated</p>
                <p className="text-sm font-bold text-gray-900">
                  {stats.lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTables.map((table) => (
          <div
            key={table.name}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedTable(table.name);
              setCurrentView('table');
            }}
          >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 ${table.color} rounded-lg text-white`}>
                    {table.icon}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{table.count.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">records</p>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{table.displayName}</h3>
                <p className="text-sm text-gray-600 mb-4">{table.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {table.name}
                  </span>
                  <button className="flex items-center text-primary hover:text-primary-dark text-sm font-medium">
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {filteredTables.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
          <p className="text-gray-600">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
};

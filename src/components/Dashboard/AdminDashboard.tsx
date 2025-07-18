import React, { useState, useEffect } from 'react';
import {
  Users,
  Package,
  DollarSign,
  TrendingUp,
  Download,
  BarChart2,
  Menu,
  X,
  Bell,
  Search,
  Database
} from 'lucide-react';
import { getDashboardAnalytics } from '../../lib/supabase';
import { DashboardAnalytics } from '../../types';
import { UserManagement } from './Admin/UserManagement';
import { ReportCharts } from './Admin/ReportCharts';
import { ProductManagement } from './Admin/ProductManagement';
import { BulkProductImport } from './Admin/BulkProductImport';
import { EnhancedAnalytics } from './Admin/EnhancedAnalytics';
import { InventoryManagement } from './Admin/InventoryManagement';
import { ComprehensiveAdminDashboard } from './Admin/ComprehensiveAdminDashboard';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getDashboardAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);
  
  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart2, description: 'Dashboard overview and key metrics' },
    { id: 'database', name: 'Database', icon: Database, description: 'Comprehensive database management' },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp, description: 'Detailed analytics and insights' },
    { id: 'users', name: 'Users', icon: Users, description: 'Manage user accounts and roles' },
    { id: 'products', name: 'Products', icon: Package, description: 'Manage product catalog' },
    { id: 'inventory', name: 'Inventory', icon: Package, description: 'Monitor stock levels and inventory' },
    { id: 'import', name: 'Import', icon: Download, description: 'Bulk product import tools' },
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'database':
        return <ComprehensiveAdminDashboard />;
      case 'analytics':
        return <EnhancedAnalytics />;
      case 'users':
        return <UserManagement />;
      case 'products':
        return <ProductManagement />;
      case 'inventory':
        return <InventoryManagement />;
      case 'import':
        return <BulkProductImport />;
      case 'overview':
      default:
        return (
          <div className="p-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                ))}
              </div>
            ) : analytics ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Users</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.totalUsers.toLocaleString()}</p>
                        <p className="text-sm text-green-600">+12% from last month</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Products</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.totalProducts.toLocaleString()}</p>
                        <p className="text-sm text-blue-600">{analytics.lowStockProducts} low stock</p>
                      </div>
                      <Package className="h-8 w-8 text-green-600" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Orders</p>
                        <p className="text-3xl font-bold text-gray-900">{analytics.totalOrders.toLocaleString()}</p>
                        <p className="text-sm text-yellow-600">{analytics.pendingOrders} pending</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">${analytics.totalRevenue.toLocaleString()}</p>
                        <p className="text-sm text-green-600">+8% from last month</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Charts and Recent Activity */}
                <ReportCharts analytics={analytics} />
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">Failed to load analytics data</p>
              </div>
            )}
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
              >
                {sidebarCollapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Comprehensive e-commerce management platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search Bar */}
              <div className="hidden md:flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm text-gray-700 placeholder-gray-500"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </button>

              {/* Export Button */}
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Enhanced Sidebar */}
        <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-sm border-r border-gray-200 transition-all duration-300 hidden lg:block`}>
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500'}`} />
                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="font-medium">{tab.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                  </div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <div className="bg-white border-b border-gray-200 px-4 py-2">
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

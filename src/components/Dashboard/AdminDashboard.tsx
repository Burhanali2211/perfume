import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  UserCog,
  Menu,
  X,
  ChevronRight,
  ChevronLeft,
  Tag,
  TrendingUp,
  FileText,
  Shield,
  Bell,
  Gift
} from 'lucide-react';
import { ComprehensiveAdminDashboard } from './Admin/ComprehensiveAdminDashboard';
import { UserManagement } from './Admin/UserManagement';
import { EnhancedUserManagement } from './Admin/EnhancedUserManagement';
import { ProductManagement } from './Admin/ProductManagement';
import { OrderManager } from './Admin/OrderManager';
import { CategoryManagement } from './Admin/CategoryManagement';
import { CouponManagement } from './Admin/CouponManagement';
import { SettingsManagement } from './Admin/SettingsManagement';
import { EnhancedAnalyticsDashboard } from './Admin/EnhancedAnalyticsDashboard';
import { DedicatedAnalyticsDashboard } from './Admin/DedicatedAnalyticsDashboard';
import { MarketingManagement } from './Admin/MarketingManagement';
import { SystemHealthMonitoring } from './Admin/SystemHealthMonitoring';
import { AuditLogs } from './Admin/AuditLogs';
import { AdvancedReports } from './Admin/AdvancedReports';
import { AdminErrorBoundary } from '../Common/AdminErrorBoundary';
import { AdminLoadingState } from '../Common/EnhancedLoadingStates';

interface NavItem {
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(false); // Always expanded on mobile when open
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navigation: NavItem[] = [
    {
      name: 'Dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />,
      component: <ComprehensiveAdminDashboard />
    },
    {
      name: 'Users',
      icon: <Users className="h-5 w-5" />,
      component: <EnhancedUserManagement />
    },
    {
      name: 'Products',
      icon: <Package className="h-5 w-5" />,
      component: <ProductManagement />
    },
    {
      name: 'Orders',
      icon: <ShoppingCart className="h-5 w-5" />,
      component: <OrderManager />
    },
    {
      name: 'Categories',
      icon: <Tag className="h-5 w-5" />,
      component: <CategoryManagement />
    },
    {
      name: 'Collections',
      icon: <Gift className="h-5 w-5" />,
      component: <CollectionManagement />
    },
    {
      name: 'Coupons',
      icon: <Tag className="h-5 w-5" />,
      component: <CouponManagement />
    },
    {
      name: 'Marketing',
      icon: <TrendingUp className="h-5 w-5" />,
      component: <MarketingManagement />
    },
    {
      name: 'Analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      component: <DedicatedAnalyticsDashboard />
    },
    {
      name: 'Reports',
      icon: <FileText className="h-5 w-5" />,
      component: <AdvancedReports />
    },
    {
      name: 'System Health',
      icon: <Shield className="h-5 w-5" />,
      component: <SystemHealthMonitoring />
    },
    {
      name: 'Audit Logs',
      icon: <Bell className="h-5 w-5" />,
      component: <AuditLogs />
    },
    {
      name: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      component: <SettingsManagement />
    }
  ];

  const handleNavigation = async (tabName: string) => {
    setIsLoading(true);
    setActiveTab(tabName.toLowerCase());
    if (isMobile) {
      setSidebarOpen(false); // Close mobile sidebar after navigation
    }

    // Simulate loading time for better UX
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        isMobile
          ? sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          : sidebarCollapsed ? 'w-16' : 'w-64'
      } ${
        isMobile ? 'fixed inset-y-0 left-0 z-50 w-64' : 'relative'
      } bg-white transform transition-all duration-300 ease-in-out shadow-lg border-r border-gray-200`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between flex-shrink-0 px-4 py-4 border-b border-gray-200">
            {(!sidebarCollapsed || isMobile) && (
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Shield className="h-6 w-6 text-indigo-600" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              </div>
            )}

            {/* Toggle button for desktop, close button for mobile */}
            <button
              className={`p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                sidebarCollapsed && !isMobile ? 'mx-auto' : ''
              }`}
              onClick={isMobile ? closeSidebar : toggleSidebar}
              aria-label={isMobile ? 'Close sidebar' : 'Toggle sidebar'}
            >
              {isMobile ? (
                <X className="h-5 w-5" />
              ) : sidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = activeTab === item.name.toLowerCase();
                return (
                  <button
                    key={item.name}
                    onClick={() => handleNavigation(item.name)}
                    className={`${
                      isActive
                        ? 'bg-indigo-100 text-indigo-700 border-r-4 border-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-r-4 border-transparent'
                    } group flex items-center w-full text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-l-lg ${
                      sidebarCollapsed && !isMobile ? 'px-3 py-3 justify-center' : 'px-4 py-3'
                    }`}
                    title={sidebarCollapsed && !isMobile ? item.name : undefined}
                    aria-label={item.name}
                  >
                    <div className={`${
                      isActive ? 'text-indigo-700' : 'text-gray-400 group-hover:text-gray-600'
                    } transition-colors duration-200 flex-shrink-0`}>
                      {item.icon}
                    </div>

                    {(!sidebarCollapsed || isMobile) && (
                      <>
                        <span className="ml-3 font-medium truncate">{item.name}</span>
                        {isActive && (
                          <ChevronRight className="ml-auto h-4 w-4 text-indigo-700 flex-shrink-0" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            {(!sidebarCollapsed || isMobile) && (
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center space-x-3 text-sm text-gray-500">
                  <Bell className="h-4 w-4" />
                  <span>Admin Dashboard v2.0</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile header */}
        {isMobile && (
          <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 truncate">
                {navigation.find(item => item.name.toLowerCase() === activeTab)?.name || 'Admin Dashboard'}
              </h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {navigation.find(item => item.name.toLowerCase() === activeTab)?.name || 'Admin Dashboard'}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Manage your e-commerce platform
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <AdminErrorBoundary>
                {isLoading ? (
                  <AdminLoadingState
                    type={activeTab as any}
                    message={`Loading ${navigation.find(item => item.name.toLowerCase() === activeTab)?.name || 'content'}...`}
                  />
                ) : (
                  navigation.find(item => item.name.toLowerCase() === activeTab)?.component
                )}
              </AdminErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

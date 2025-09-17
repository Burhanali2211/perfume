import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Bell,
  Download,
  Eye,
  Zap,
  Globe,
  Shield,
  Users,
  Package,
  ShoppingCart
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import {
  ResponsiveAdminLayout,
  AdminPageHeader,
  AdminSection,
  AdminGrid,
  MobileOptimizedCard
} from '../../Common/ResponsiveAdminLayout';
import { useResponsive } from '../../Common/AdminDesignSystem';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    temperature: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  network: {
    latency: number;
    bandwidth: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number;
    status: 'healthy' | 'warning' | 'critical';
  };
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  lastCheck: string;
  responseTime: number;
  errorRate: number;
}

interface HealthAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  service: string;
}

export const SystemHealthMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const { isMobile, isTablet } = useResponsive();

  const fetchSystemMetrics = useCallback(async () => {
    try {
      // Mock data - replace with actual system monitoring API
      const mockMetrics: SystemMetrics = {
        cpu: {
          usage: Math.random() * 100,
          cores: 8,
          temperature: 45 + Math.random() * 20,
          status: Math.random() > 0.8 ? 'warning' : 'healthy'
        },
        memory: {
          used: 6.4,
          total: 16,
          percentage: 40 + Math.random() * 30,
          status: Math.random() > 0.9 ? 'warning' : 'healthy'
        },
        disk: {
          used: 120,
          total: 500,
          percentage: 24 + Math.random() * 20,
          status: 'healthy'
        },
        network: {
          latency: 10 + Math.random() * 50,
          bandwidth: 100 + Math.random() * 400,
          status: Math.random() > 0.95 ? 'warning' : 'healthy'
        },
        database: {
          connections: 15 + Math.floor(Math.random() * 35),
          maxConnections: 100,
          queryTime: 50 + Math.random() * 200,
          status: Math.random() > 0.85 ? 'warning' : 'healthy'
        }
      };
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    }
  }, []);

  const fetchServiceStatus = useCallback(async () => {
    try {
      // Mock data - replace with actual service monitoring
      const mockServices: ServiceStatus[] = [
        {
          id: '1',
          name: 'Web Server',
          status: Math.random() > 0.95 ? 'degraded' : 'online',
          uptime: 99.9,
          lastCheck: new Date().toISOString(),
          responseTime: 120 + Math.random() * 80,
          errorRate: Math.random() * 2
        },
        {
          id: '2',
          name: 'Database',
          status: Math.random() > 0.98 ? 'degraded' : 'online',
          uptime: 99.8,
          lastCheck: new Date().toISOString(),
          responseTime: 50 + Math.random() * 100,
          errorRate: Math.random() * 1
        },
        {
          id: '3',
          name: 'API Gateway',
          status: 'online',
          uptime: 99.95,
          lastCheck: new Date().toISOString(),
          responseTime: 80 + Math.random() * 60,
          errorRate: Math.random() * 0.5
        },
        {
          id: '4',
          name: 'File Storage',
          status: 'online',
          uptime: 99.7,
          lastCheck: new Date().toISOString(),
          responseTime: 200 + Math.random() * 100,
          errorRate: Math.random() * 1.5
        }
      ];
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching service status:', error);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      // Mock alerts - replace with actual alert system
      const mockAlerts: HealthAlert[] = [
        {
          id: '1',
          type: 'warning',
          title: 'High CPU Usage',
          message: 'CPU usage has exceeded 80% for the last 5 minutes',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          resolved: false,
          service: 'Web Server'
        },
        {
          id: '2',
          type: 'info',
          title: 'Database Backup Completed',
          message: 'Scheduled database backup completed successfully',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          resolved: true,
          service: 'Database'
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchSystemMetrics(),
        fetchServiceStatus(),
        fetchAlerts()
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refresh system health data';
      setError(errorMessage);
      showNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: errorMessage
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchSystemMetrics, fetchServiceStatus, fetchAlerts, showNotification]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await refreshData();
      setLoading(false);
    };
    loadData();
  }, [refreshData]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(refreshData, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
      case 'offline':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'online':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
      case 'degraded':
        return <AlertTriangle className="h-5 w-5" />;
      case 'critical':
      case 'offline':
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  if (loading) {
    return (
      <ResponsiveAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" text="Loading system health data..." />
        </div>
      </ResponsiveAdminLayout>
    );
  }

  if (error) {
    return (
      <ResponsiveAdminLayout>
        <AdminSection variant="card">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading System Health</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <EnhancedButton onClick={refreshData} loading={refreshing} icon={RefreshCw}>
              Try Again
            </EnhancedButton>
          </div>
        </AdminSection>
      </ResponsiveAdminLayout>
    );
  }

  const headerActions = (
    <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
      {!isMobile && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Auto-refresh:</label>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              autoRefresh ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            aria-label={`Auto-refresh ${autoRefresh ? 'enabled' : 'disabled'}`}
          >
            <span
              className={`${
                autoRefresh ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>
      )}

      <select
        value={refreshInterval}
        onChange={(e) => setRefreshInterval(Number(e.target.value))}
        className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
        aria-label="Refresh interval"
      >
        <option value={10}>10s</option>
        <option value={30}>30s</option>
        <option value={60}>1m</option>
        <option value={300}>5m</option>
      </select>

      <EnhancedButton
        onClick={refreshData}
        loading={refreshing}
        icon={RefreshCw}
        variant="outline"
        size="sm"
      >
        {isMobile ? '' : 'Refresh'}
      </EnhancedButton>
    </div>
  );

  return (
    <AdminErrorBoundary>
      <ResponsiveAdminLayout>
        <AdminPageHeader
          title="System Health Monitoring"
          subtitle="Real-time monitoring of system performance and health metrics"
          icon={Activity}
          actions={headerActions}
        />

        {lastUpdate && (
          <div className="text-sm text-gray-500 mb-6">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        {/* System Metrics Cards */}
        <AdminSection title="System Metrics" variant="default">
          <AdminGrid variant="metrics">
            {/* CPU Metrics */}
            <MobileOptimizedCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Cpu className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">CPU</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.cpu.usage.toFixed(1)}%</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metrics?.cpu.status || 'healthy')}`}>
                  {getStatusIcon(metrics?.cpu.status || 'healthy')}
                  <span className="ml-1 capitalize">{metrics?.cpu.status}</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Cores:</span>
                  <span className="text-gray-900">{metrics?.cpu.cores}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Temp:</span>
                  <span className="text-gray-900">{metrics?.cpu.temperature.toFixed(1)}°C</span>
                </div>
              </div>
            </MobileOptimizedCard>

            {/* Memory Metrics */}
            <MobileOptimizedCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <MemoryStick className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Memory</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.memory.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metrics?.memory.status || 'healthy')}`}>
                  {getStatusIcon(metrics?.memory.status || 'healthy')}
                  <span className="ml-1 capitalize">{metrics?.memory.status}</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Used:</span>
                  <span className="text-gray-900">{metrics?.memory.used}GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="text-gray-900">{metrics?.memory.total}GB</span>
                </div>
              </div>
            </MobileOptimizedCard>

            {/* Disk Metrics */}
            <MobileOptimizedCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <HardDrive className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Disk</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.disk.percentage.toFixed(1)}%</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metrics?.disk.status || 'healthy')}`}>
                  {getStatusIcon(metrics?.disk.status || 'healthy')}
                  <span className="ml-1 capitalize">{metrics?.disk.status}</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Used:</span>
                  <span className="text-gray-900">{metrics?.disk.used}GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total:</span>
                  <span className="text-gray-900">{metrics?.disk.total}GB</span>
                </div>
              </div>
            </MobileOptimizedCard>

            {/* Network Metrics */}
            <MobileOptimizedCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Wifi className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Network</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.network.latency.toFixed(0)}ms</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metrics?.network.status || 'healthy')}`}>
                  {getStatusIcon(metrics?.network.status || 'healthy')}
                  <span className="ml-1 capitalize">{metrics?.network.status}</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bandwidth:</span>
                  <span className="text-gray-900">{metrics?.network.bandwidth.toFixed(0)}Mbps</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Latency:</span>
                  <span className="text-gray-900">{metrics?.network.latency.toFixed(0)}ms</span>
                </div>
              </div>
            </MobileOptimizedCard>

            {/* Database Metrics */}
            <MobileOptimizedCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Database className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Database</p>
                    <p className="text-2xl font-bold text-gray-900">{metrics?.database.connections}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(metrics?.database.status || 'healthy')}`}>
                  {getStatusIcon(metrics?.database.status || 'healthy')}
                  <span className="ml-1 capitalize">{metrics?.database.status}</span>
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Connections:</span>
                  <span className="text-gray-900">{metrics?.database.connections}/{metrics?.database.maxConnections}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Query Time:</span>
                  <span className="text-gray-900">{metrics?.database.queryTime.toFixed(0)}ms</span>
                </div>
              </div>
            </MobileOptimizedCard>
          </AdminGrid>
        </AdminSection>

        {/* Service Status */}
        <AdminSection title="Service Status" variant="card">
          <AdminGrid variant="dashboard">
            {services.map((service) => (
              <MobileOptimizedCard key={service.id} padding="sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900">{service.name}</h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                    {getStatusIcon(service.status)}
                    <span className="ml-1 capitalize">{service.status}</span>
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Uptime:</span>
                    <span className="text-gray-900">{service.uptime}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Response:</span>
                    <span className="text-gray-900">{service.responseTime.toFixed(0)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Error Rate:</span>
                    <span className="text-gray-900">{service.errorRate.toFixed(2)}%</span>
                  </div>
                </div>
              </MobileOptimizedCard>
            ))}
          </AdminGrid>
        </AdminSection>

        {/* Recent Alerts */}
        <AdminSection
          title="Recent Alerts"
          variant="card"
          actions={
            <EnhancedButton
              onClick={() => {}}
              icon={Bell}
              variant="outline"
              size="sm"
            >
              {isMobile ? '' : 'View All'}
            </EnhancedButton>
          }
        >
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent alerts</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className={`border-l-4 p-4 rounded-r-lg ${
                  alert.type === 'error' ? 'border-red-400 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                  'border-blue-400 bg-blue-50'
                }`}>
                  <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'items-start justify-between'}`}>
                    <div className="flex-1">
                      <div className={`flex ${isMobile ? 'flex-col space-y-1' : 'items-center'}`}>
                        <h3 className="text-sm font-medium text-gray-900">{alert.title}</h3>
                        <span className={`text-xs text-gray-500 ${isMobile ? '' : 'ml-2'}`}>({alert.service})</span>
                        {alert.resolved && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${isMobile ? 'self-start' : 'ml-2'}`}>
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className={`flex items-center space-x-2 ${isMobile ? 'self-end' : ''}`}>
                      <button
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md transition-colors"
                        aria-label="View alert details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!alert.resolved && (
                        <button
                          className="text-green-600 hover:text-green-800 p-1 rounded-md transition-colors"
                          aria-label="Mark as resolved"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </AdminSection>
      </ResponsiveAdminLayout>
    </AdminErrorBoundary>
  );
};

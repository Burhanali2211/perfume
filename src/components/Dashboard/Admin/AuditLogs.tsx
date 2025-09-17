import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Activity,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw
} from 'lucide-react';
// import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { Modal } from '../../Common/Modal';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';
import {
  ResponsiveAdminLayout,
  AdminPageHeader,
  AdminSection
  // MobileOptimizedCard // Unused
} from '../../Common/ResponsiveAdminLayout';
import { EnhancedAdminTable, TableColumn, TableAction } from '../../Common/EnhancedAdminTable';
import { useResponsive } from '../../Common/AdminDesignSystem';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure' | 'warning';
  category: 'auth' | 'user' | 'product' | 'order' | 'system' | 'security';
  metadata: Record<string, unknown>;
}

interface AuditFilters {
  dateFrom: string;
  dateTo: string;
  userId: string;
  category: string;
  status: string;
  action: string;
  searchTerm: string;
}

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(50);
  const [error, setError] = useState<string | null>(null);
  const { showNotification } = useNotification();
  const { isMobile } = useResponsive();

  const [filters, setFilters] = useState<AuditFilters>({
    dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    userId: '',
    category: '',
    status: '',
    action: '',
    searchTerm: ''
  });

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'auth', label: 'Authentication' },
    { value: 'user', label: 'User Management' },
    { value: 'product', label: 'Product Management' },
    { value: 'order', label: 'Order Management' },
    { value: 'system', label: 'System Changes' },
    { value: 'security', label: 'Security Events' }
  ];

  const statuses = [
    { value: '', label: 'All Statuses' },
    { value: 'success', label: 'Success' },
    { value: 'failure', label: 'Failure' },
    { value: 'warning', label: 'Warning' }
  ];

  useEffect(() => {
    fetchAuditLogs();
  }, [filters, currentPage]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data - replace with actual Supabase query
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: new Date().toISOString(),
          userId: 'user-123',
          userName: 'John Admin',
          userEmail: 'john@example.com',
          action: 'LOGIN',
          resource: 'auth',
          resourceId: 'session-456',
          details: 'User logged in successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          category: 'auth',
          metadata: { sessionId: 'session-456', loginMethod: 'email' }
        },
        {
          id: '2',
          timestamp: new Date(Date.now() - 300000).toISOString(),
          userId: 'user-124',
          userName: 'Jane Manager',
          userEmail: 'jane@example.com',
          action: 'UPDATE_PRODUCT',
          resource: 'products',
          resourceId: 'prod-789',
          details: 'Updated product price from $99.99 to $89.99',
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          status: 'success',
          category: 'product',
          metadata: { productId: 'prod-789', oldPrice: 99.99, newPrice: 89.99 }
        },
        {
          id: '3',
          timestamp: new Date(Date.now() - 600000).toISOString(),
          userId: 'user-125',
          userName: 'Bob User',
          userEmail: 'bob@example.com',
          action: 'FAILED_LOGIN',
          resource: 'auth',
          resourceId: 'attempt-321',
          details: 'Failed login attempt - invalid password',
          ipAddress: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          status: 'failure',
          category: 'security',
          metadata: { reason: 'invalid_password', attempts: 3 }
        },
        {
          id: '4',
          timestamp: new Date(Date.now() - 900000).toISOString(),
          userId: 'user-123',
          userName: 'John Admin',
          userEmail: 'john@example.com',
          action: 'DELETE_USER',
          resource: 'users',
          resourceId: 'user-999',
          details: 'Deleted user account for inactive user',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          status: 'success',
          category: 'user',
          metadata: { deletedUserId: 'user-999', reason: 'inactive_account' }
        },
        {
          id: '5',
          timestamp: new Date(Date.now() - 1200000).toISOString(),
          userId: 'system',
          userName: 'System',
          userEmail: 'system@example.com',
          action: 'BACKUP_COMPLETED',
          resource: 'database',
          resourceId: 'backup-001',
          details: 'Automated database backup completed successfully',
          ipAddress: '127.0.0.1',
          userAgent: 'System/1.0',
          status: 'success',
          category: 'system',
          metadata: { backupSize: '2.5GB', duration: '45min' }
        }
      ];

      setLogs(mockLogs);
      setTotalPages(Math.ceil(mockLogs.length / pageSize));
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load audit logs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const exportLogs = () => {
    const csvData = logs.map(log => ({
      Timestamp: new Date(log.timestamp).toLocaleString(),
      User: log.userName,
      Email: log.userEmail,
      Action: log.action,
      Resource: log.resource,
      Status: log.status,
      Category: log.category,
      Details: log.details,
      'IP Address': log.ipAddress
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    showNotification({
      type: 'success',
      title: 'Export Complete',
      message: 'Audit logs exported successfully'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failure':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'auth':
        return <Shield className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'system':
        return <Settings className="h-4 w-4" />;
      case 'security':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  // const toggleRowExpansion = (logId: string) => {
  //   const newExpanded = new Set(expandedRows);
  //   if (newExpanded.has(logId)) {
  //     newExpanded.delete(logId);
  //   } else {
  //     newExpanded.add(logId);
  //   }
  //   setExpandedRows(newExpanded);
  // };

  const viewLogDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  // Table configuration
  const columns: TableColumn<AuditLog>[] = [
    {
      key: 'timestamp',
      label: 'Timestamp',
      sortable: true,
      responsive: 'all',
      render: (value) => new Date(value).toLocaleString(),
      className: 'text-gray-900 font-medium'
    },
    {
      key: 'userName',
      label: 'User',
      sortable: true,
      responsive: 'md',
      className: 'text-gray-900'
    },
    {
      key: 'action',
      label: 'Action',
      sortable: true,
      responsive: 'all',
      className: 'text-gray-900 font-medium'
    },
    {
      key: 'resource',
      label: 'Resource',
      sortable: true,
      responsive: 'lg',
      className: 'text-gray-600'
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      responsive: 'all',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'success' ? 'bg-green-100 text-green-800' :
          value === 'failure' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value === 'success' ? <CheckCircle className="h-3 w-3 mr-1" /> :
           value === 'failure' ? <XCircle className="h-3 w-3 mr-1" /> :
           <AlertTriangle className="h-3 w-3 mr-1" />}
          {value}
        </span>
      )
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      responsive: 'lg',
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800 capitalize">
          {value}
        </span>
      )
    },
    {
      key: 'ipAddress',
      label: 'IP Address',
      sortable: false,
      responsive: 'xl',
      className: 'text-gray-600 font-mono text-xs'
    }
  ];

  const actions: TableAction<AuditLog>[] = [
    {
      label: 'View Details',
      icon: Eye,
      onClick: viewLogDetails,
      variant: 'secondary'
    }
  ];

  const mobileCardRender = (log: AuditLog, _index: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-900">{log.action}</span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            log.status === 'success' ? 'bg-green-100 text-green-800' :
            log.status === 'failure' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {log.status}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(log.timestamp).toLocaleDateString()}
        </span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">User:</span>
          <span className="text-gray-900">{log.userName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Resource:</span>
          <span className="text-gray-900">{log.resource}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Category:</span>
          <span className="text-gray-900 capitalize">{log.category}</span>
        </div>
      </div>

      {log.details && (
        <p className="text-sm text-gray-600 truncate">{log.details}</p>
      )}
    </div>
  );

  if (loading) {
    return (
      <ResponsiveAdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <LoadingSpinner size="large" text="Loading audit logs..." />
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Audit Logs</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <EnhancedButton onClick={fetchAuditLogs} loading={loading} icon={RefreshCw}>
              Try Again
            </EnhancedButton>
          </div>
        </AdminSection>
      </ResponsiveAdminLayout>
    );
  }

  const headerActions = (
    <div className={`flex items-center ${isMobile ? 'flex-col space-y-2' : 'space-x-2'}`}>
      <EnhancedButton
        onClick={exportLogs}
        icon={Download}
        variant="outline"
        size="sm"
      >
        {isMobile ? '' : 'Export CSV'}
      </EnhancedButton>
      <EnhancedButton
        onClick={fetchAuditLogs}
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
          title="Audit Logs"
          subtitle="Track and monitor all system activities and user actions"
          icon={FileText}
          actions={headerActions}
        />

        {/* Filters */}
        <AdminSection title="Filters" variant="card" icon={Filter}>
          <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-4 xl:grid-cols-6'} gap-4`}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
              >
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>

            <div className={isMobile ? 'col-span-1' : 'md:col-span-2'}>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search logs..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>
            </div>
          </div>
        </AdminSection>

        {/* Logs Table */}
        <AdminSection title="Audit Logs" variant="default">
          <EnhancedAdminTable
            data={logs}
            columns={columns}
            actions={actions}
            loading={loading}
            searchable={false} // We have custom filters
            sortable={true}
            pagination={{
              currentPage,
              totalPages,
              pageSize,
              onPageChange: setCurrentPage
            }}
            onRowClick={viewLogDetails}
            emptyMessage="No audit logs found"
            mobileCardRender={mobileCardRender}
          />
        </AdminSection>


        {/* Log Detail Modal */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Audit Log Details"
          size="large"
        >
          {selectedLog && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                  <p className="mt-1 text-sm text-gray-900">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1 flex items-center">
                    {getStatusIcon(selectedLog.status)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">{selectedLog.status}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userEmail})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <div className="mt-1 flex items-center">
                    {getCategoryIcon(selectedLog.category)}
                    <span className="ml-2 text-sm text-gray-900 capitalize">{selectedLog.category}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Action</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.action}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resource</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.resource} (ID: {selectedLog.resourceId})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">IP Address</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLog.ipAddress}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Details</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLog.details}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">User Agent</label>
                <p className="mt-1 text-sm text-gray-900 break-all">{selectedLog.userAgent}</p>
              </div>

              {Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Metadata</label>
                  <pre className="mt-1 text-sm text-gray-900 bg-gray-100 p-3 rounded-md overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex justify-end">
                <EnhancedButton
                  onClick={() => setIsDetailModalOpen(false)}
                  variant="outline"
                >
                  Close
                </EnhancedButton>
              </div>
            </div>
          )}
        </Modal>
      </ResponsiveAdminLayout>
    </AdminErrorBoundary>
  );
};

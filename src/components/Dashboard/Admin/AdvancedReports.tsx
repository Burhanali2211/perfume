import React, { useState, useEffect } from 'react';
import {
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Filter,
  Settings,
  Plus,
  Play,
  Pause,
  Clock,
  Mail,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  Copy,
  RefreshCw,
  Save,
  Search
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { Modal } from '../../Common/Modal';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';

interface Report {
  id: string;
  name: string;
  description: string;
  type: 'sales' | 'users' | 'products' | 'orders' | 'inventory' | 'custom';
  format: 'pdf' | 'csv' | 'excel' | 'json';
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'inactive' | 'running' | 'completed' | 'failed';
  lastRun: string;
  nextRun: string;
  createdBy: string;
  createdAt: string;
  parameters: Record<string, any>;
  recipients: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  fields: string[];
  filters: string[];
  groupBy: string[];
  sortBy: string[];
}

interface ExportJob {
  id: string;
  reportId: string;
  reportName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: string;
  endTime?: string;
  fileUrl?: string;
  fileSize?: number;
  error?: string;
}

export const AdvancedReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'templates' | 'exports' | 'builder'>('reports');
  const [isCreateReportModalOpen, setIsCreateReportModalOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const { showNotification } = useNotification();

  const tabs = [
    { id: 'reports', name: 'Reports', icon: FileText },
    { id: 'templates', name: 'Templates', icon: Settings },
    { id: 'exports', name: 'Export Jobs', icon: Download },
    { id: 'builder', name: 'Report Builder', icon: Plus }
  ];

  const reportTypes = [
    { value: '', label: 'All Types' },
    { value: 'sales', label: 'Sales Reports' },
    { value: 'users', label: 'User Reports' },
    { value: 'products', label: 'Product Reports' },
    { value: 'orders', label: 'Order Reports' },
    { value: 'inventory', label: 'Inventory Reports' },
    { value: 'custom', label: 'Custom Reports' }
  ];

  const reportStatuses = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'running', label: 'Running' },
    { value: 'completed', label: 'Completed' },
    { value: 'failed', label: 'Failed' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReports(),
        fetchTemplates(),
        fetchExportJobs()
      ]);
    } catch (error) {
      console.error('Error fetching reports data:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load reports data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    // Mock data - replace with actual Supabase query
    const mockReports: Report[] = [
      {
        id: '1',
        name: 'Monthly Sales Report',
        description: 'Comprehensive monthly sales analysis with trends and comparisons',
        type: 'sales',
        format: 'pdf',
        schedule: 'monthly',
        status: 'active',
        lastRun: '2024-06-01T09:00:00Z',
        nextRun: '2024-07-01T09:00:00Z',
        createdBy: 'John Admin',
        createdAt: '2024-01-15T10:00:00Z',
        parameters: { dateRange: '30days', includeComparisons: true },
        recipients: ['admin@example.com', 'sales@example.com']
      },
      {
        id: '2',
        name: 'User Activity Report',
        description: 'Weekly user engagement and activity metrics',
        type: 'users',
        format: 'csv',
        schedule: 'weekly',
        status: 'active',
        lastRun: '2024-06-15T08:00:00Z',
        nextRun: '2024-06-22T08:00:00Z',
        createdBy: 'Jane Manager',
        createdAt: '2024-02-01T14:00:00Z',
        parameters: { includeInactive: false, groupBy: 'week' },
        recipients: ['hr@example.com']
      },
      {
        id: '3',
        name: 'Inventory Status Report',
        description: 'Daily inventory levels and low stock alerts',
        type: 'inventory',
        format: 'excel',
        schedule: 'daily',
        status: 'running',
        lastRun: '2024-06-16T06:00:00Z',
        nextRun: '2024-06-17T06:00:00Z',
        createdBy: 'Bob Warehouse',
        createdAt: '2024-03-10T11:00:00Z',
        parameters: { lowStockThreshold: 10, includeOutOfStock: true },
        recipients: ['warehouse@example.com', 'purchasing@example.com']
      }
    ];
    setReports(mockReports);
  };

  const fetchTemplates = async () => {
    // Mock data - replace with actual Supabase query
    const mockTemplates: ReportTemplate[] = [
      {
        id: '1',
        name: 'Sales Performance Template',
        description: 'Standard template for sales performance analysis',
        type: 'sales',
        fields: ['date', 'revenue', 'orders', 'customers', 'avg_order_value'],
        filters: ['date_range', 'product_category', 'customer_segment'],
        groupBy: ['date', 'category', 'region'],
        sortBy: ['date_desc', 'revenue_desc']
      },
      {
        id: '2',
        name: 'User Engagement Template',
        description: 'Template for analyzing user engagement metrics',
        type: 'users',
        fields: ['user_id', 'login_count', 'session_duration', 'page_views', 'last_activity'],
        filters: ['date_range', 'user_type', 'activity_level'],
        groupBy: ['date', 'user_type', 'region'],
        sortBy: ['activity_desc', 'date_desc']
      }
    ];
    setTemplates(mockTemplates);
  };

  const fetchExportJobs = async () => {
    // Mock data - replace with actual Supabase query
    const mockJobs: ExportJob[] = [
      {
        id: '1',
        reportId: '1',
        reportName: 'Monthly Sales Report',
        status: 'completed',
        progress: 100,
        startTime: '2024-06-16T09:00:00Z',
        endTime: '2024-06-16T09:05:00Z',
        fileUrl: '/downloads/monthly-sales-2024-06.pdf',
        fileSize: 2048576
      },
      {
        id: '2',
        reportId: '3',
        reportName: 'Inventory Status Report',
        status: 'processing',
        progress: 65,
        startTime: '2024-06-16T10:00:00Z'
      },
      {
        id: '3',
        reportId: '2',
        reportName: 'User Activity Report',
        status: 'failed',
        progress: 0,
        startTime: '2024-06-16T08:00:00Z',
        endTime: '2024-06-16T08:02:00Z',
        error: 'Database connection timeout'
      }
    ];
    setExportJobs(mockJobs);
  };

  const runReport = async (reportId: string) => {
    try {
      // Mock implementation - replace with actual report generation
      const report = reports.find(r => r.id === reportId);
      if (!report) return;

      // Update report status to running
      setReports(prev => prev.map(r => 
        r.id === reportId ? { ...r, status: 'running' as const } : r
      ));

      // Create export job
      const newJob: ExportJob = {
        id: Date.now().toString(),
        reportId,
        reportName: report.name,
        status: 'processing',
        progress: 0,
        startTime: new Date().toISOString()
      };
      setExportJobs(prev => [newJob, ...prev]);

      showNotification({
        type: 'success',
        title: 'Report Started',
        message: `${report.name} is now being generated`
      });

      // Simulate progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Update job as completed
          setExportJobs(prev => prev.map(job => 
            job.id === newJob.id ? {
              ...job,
              status: 'completed' as const,
              progress: 100,
              endTime: new Date().toISOString(),
              fileUrl: `/downloads/${report.name.toLowerCase().replace(/\s+/g, '-')}.${report.format}`,
              fileSize: Math.floor(Math.random() * 5000000) + 1000000
            } : job
          ));

          // Update report status
          setReports(prev => prev.map(r => 
            r.id === reportId ? { 
              ...r, 
              status: 'completed' as const,
              lastRun: new Date().toISOString()
            } : r
          ));

          showNotification({
            type: 'success',
            title: 'Report Completed',
            message: `${report.name} has been generated successfully`
          });
        } else {
          setExportJobs(prev => prev.map(job => 
            job.id === newJob.id ? { ...job, progress } : job
          ));
        }
      }, 1000);

    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Report Failed',
        message: 'Failed to generate report'
      });
    }
  };

  const downloadReport = (job: ExportJob) => {
    if (job.fileUrl) {
      // Mock download - replace with actual file download
      showNotification({
        type: 'success',
        title: 'Download Started',
        message: `Downloading ${job.reportName}`
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'running':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading reports..." />
      </div>
    );
  }

  return (
    <AdminErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-indigo-600" />
              Advanced Reports & Export
            </h1>
            <p className="text-gray-600 mt-1">
              Create, schedule, and manage comprehensive business reports
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <EnhancedButton
              onClick={() => setIsCreateReportModalOpen(true)}
              icon={Plus}
            >
              Create Report
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setIsCreateTemplateModalOpen(true)}
              icon={Settings}
              variant="outline"
            >
              Create Template
            </EnhancedButton>
            <EnhancedButton
              onClick={fetchData}
              icon={RefreshCw}
              variant="outline"
            >
              Refresh
            </EnhancedButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {reportTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {reportStatuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Reports Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">{report.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{report.description}</p>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className="text-gray-900 capitalize">{report.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Format:</span>
                        <span className="text-gray-900 uppercase">{report.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Schedule:</span>
                        <span className="text-gray-900 capitalize">{report.schedule}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Run:</span>
                        <span className="text-gray-900">{new Date(report.lastRun).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <button
                        onClick={() => runReport(report.id)}
                        className="text-indigo-600 hover:text-indigo-900"
                        disabled={report.status === 'running'}
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'exports' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Start Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {exportJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{job.reportName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-900">{job.progress}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(job.startTime).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {job.fileSize ? formatFileSize(job.fileSize) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {job.status === 'completed' && job.fileUrl && (
                            <button
                              onClick={() => downloadReport(job)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          )}
                          {job.status === 'failed' && (
                            <span className="text-red-600 text-xs">{job.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{template.description}</p>

                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Type: </span>
                        <span className="text-gray-900 capitalize">{template.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Fields: </span>
                        <span className="text-gray-900">{template.fields.length} fields</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Filters: </span>
                        <span className="text-gray-900">{template.filters.length} filters</span>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-indigo-600 hover:text-indigo-900">
                        <Copy className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'builder' && (
            <div className="space-y-6">
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Builder</h3>
                <p className="text-gray-600 mb-6">
                  Create custom reports with our drag-and-drop report builder
                </p>
                <EnhancedButton
                  onClick={() => {
                    showNotification({
                      type: 'info',
                      title: 'Coming Soon',
                      message: 'Advanced report builder will be available in the next update'
                    });
                  }}
                  icon={Plus}
                >
                  Launch Report Builder
                </EnhancedButton>
              </div>
            </div>
          )}
        </div>

        {/* Create Report Modal */}
        <Modal
          isOpen={isCreateReportModalOpen}
          onClose={() => setIsCreateReportModalOpen(false)}
          title="Create New Report"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter report name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter report description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Report Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="sales">Sales Report</option>
                  <option value="users">User Report</option>
                  <option value="products">Product Report</option>
                  <option value="orders">Order Report</option>
                  <option value="inventory">Inventory Report</option>
                  <option value="custom">Custom Report</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                  <option value="excel">Excel</option>
                  <option value="json">JSON</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="manual">Manual</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <EnhancedButton
                onClick={() => setIsCreateReportModalOpen(false)}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  setIsCreateReportModalOpen(false);
                  showNotification({
                    type: 'success',
                    title: 'Report Created',
                    message: 'New report has been created successfully'
                  });
                }}
                icon={Save}
              >
                Create Report
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      </div>
    </AdminErrorBoundary>
  );
};

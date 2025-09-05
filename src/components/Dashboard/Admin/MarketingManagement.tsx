import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Calendar,
  Target,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  Play,
  Pause,
  Copy,
  Settings,
  DollarSign,
  Percent,
  Gift,
  Tag,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { Modal } from '../../Common/Modal';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'social' | 'banner' | 'popup';
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled';
  startDate: string;
  endDate: string;
  targetAudience: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  createdAt: string;
  updatedAt: string;
}

interface Promotion {
  id: string;
  name: string;
  type: 'flash_sale' | 'bundle' | 'bogo' | 'discount' | 'free_shipping';
  status: 'active' | 'inactive' | 'scheduled' | 'expired';
  discountType: 'percentage' | 'fixed' | 'free_shipping';
  discountValue: number;
  minimumAmount: number;
  maxUses: number;
  currentUses: number;
  startDate: string;
  endDate: string;
  products: string[];
  categories: string[];
  createdAt: string;
}

interface MarketingMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  totalBudget: number;
  totalSpent: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  totalRevenue: number;
  averageCTR: number;
  averageConversionRate: number;
  roi: number;
}

export const MarketingManagement: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [metrics, setMetrics] = useState<MarketingMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'promotions' | 'analytics'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false);
  const [isCreatePromotionModalOpen, setIsCreatePromotionModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const { showNotification } = useNotification();

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'campaigns', name: 'Campaigns', icon: <Megaphone className="h-5 w-5" /> },
    { id: 'promotions', name: 'Promotions', icon: <Gift className="h-5 w-5" /> },
    { id: 'analytics', name: 'Analytics', icon: <TrendingUp className="h-5 w-5" /> }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCampaigns(),
        fetchPromotions(),
        fetchMetrics()
      ]);
    } catch (error) {
      console.error('Error fetching marketing data:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load marketing data'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaigns = async () => {
    // Mock data for now - replace with actual Supabase query
    const mockCampaigns: Campaign[] = [
      {
        id: '1',
        name: 'Summer Sale Email Campaign',
        type: 'email',
        status: 'active',
        startDate: '2024-06-01',
        endDate: '2024-06-30',
        targetAudience: 'All Customers',
        budget: 5000,
        spent: 3200,
        impressions: 45000,
        clicks: 2250,
        conversions: 180,
        revenue: 18000,
        createdAt: '2024-05-15T10:00:00Z',
        updatedAt: '2024-06-15T14:30:00Z'
      },
      {
        id: '2',
        name: 'New Product Launch',
        type: 'social',
        status: 'scheduled',
        startDate: '2024-07-01',
        endDate: '2024-07-15',
        targetAudience: 'Premium Customers',
        budget: 8000,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        createdAt: '2024-06-01T09:00:00Z',
        updatedAt: '2024-06-01T09:00:00Z'
      }
    ];
    setCampaigns(mockCampaigns);
  };

  const fetchPromotions = async () => {
    // Mock data for now - replace with actual Supabase query
    const mockPromotions: Promotion[] = [
      {
        id: '1',
        name: 'Flash Sale - 50% Off Electronics',
        type: 'flash_sale',
        status: 'active',
        discountType: 'percentage',
        discountValue: 50,
        minimumAmount: 100,
        maxUses: 1000,
        currentUses: 234,
        startDate: '2024-06-15T00:00:00Z',
        endDate: '2024-06-17T23:59:59Z',
        products: ['electronics'],
        categories: ['smartphones', 'laptops'],
        createdAt: '2024-06-14T10:00:00Z'
      },
      {
        id: '2',
        name: 'Buy One Get One Free - Clothing',
        type: 'bogo',
        status: 'scheduled',
        discountType: 'percentage',
        discountValue: 50,
        minimumAmount: 0,
        maxUses: 500,
        currentUses: 0,
        startDate: '2024-07-01T00:00:00Z',
        endDate: '2024-07-31T23:59:59Z',
        products: [],
        categories: ['clothing'],
        createdAt: '2024-06-20T15:00:00Z'
      }
    ];
    setPromotions(mockPromotions);
  };

  const fetchMetrics = async () => {
    // Mock metrics - replace with actual calculations
    const mockMetrics: MarketingMetrics = {
      totalCampaigns: 12,
      activeCampaigns: 3,
      totalBudget: 50000,
      totalSpent: 32000,
      totalImpressions: 450000,
      totalClicks: 22500,
      totalConversions: 1800,
      totalRevenue: 180000,
      averageCTR: 5.0,
      averageConversionRate: 8.0,
      roi: 462.5
    };
    setMetrics(mockMetrics);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Megaphone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalCampaigns || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${metrics?.totalRevenue?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.averageConversionRate || 0}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">ROI</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.roi || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <EnhancedButton
            onClick={() => setIsCreateCampaignModalOpen(true)}
            icon={Plus}
            className="w-full"
          >
            Create Campaign
          </EnhancedButton>
          <EnhancedButton
            onClick={() => setIsCreatePromotionModalOpen(true)}
            icon={Gift}
            variant="outline"
            className="w-full"
          >
            Create Promotion
          </EnhancedButton>
          <EnhancedButton
            onClick={() => setActiveTab('analytics')}
            icon={<BarChart3 className="h-4 w-4" />}
            variant="outline"
            className="w-full"
          >
            View Analytics
          </EnhancedButton>
          <EnhancedButton
            onClick={fetchData}
            icon={RefreshCw}
            variant="outline"
            className="w-full"
          >
            Refresh Data
          </EnhancedButton>
        </div>
      </div>
    </div>
  );

  const renderCampaignsTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">All Types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="social">Social</option>
          <option value="banner">Banner</option>
          <option value="popup">Popup</option>
        </select>
      </div>

      {/* Campaigns Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Campaign
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-500">{campaign.targetAudience}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {campaign.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                    campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>CTR: {((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%</div>
                  <div>Conv: {((campaign.conversions / campaign.clicks) * 100).toFixed(2)}%</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>${campaign.spent.toLocaleString()} / ${campaign.budget.toLocaleString()}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(campaign.spent / campaign.budget) * 100}%` }}
                    ></div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-indigo-600 hover:text-indigo-900">
                      {campaign.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                    <button className="text-red-600 hover:text-red-900">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPromotionsTab = () => (
    <div className="space-y-6">
      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{promotion.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                promotion.status === 'active' ? 'bg-green-100 text-green-800' :
                promotion.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                promotion.status === 'expired' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {promotion.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Type:</span>
                <span className="text-sm font-medium text-gray-900">{promotion.type}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Discount:</span>
                <span className="text-sm font-medium text-gray-900">
                  {promotion.discountType === 'percentage' ? `${promotion.discountValue}%` :
                   promotion.discountType === 'fixed' ? `$${promotion.discountValue}` :
                   'Free Shipping'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Usage:</span>
                <span className="text-sm font-medium text-gray-900">
                  {promotion.currentUses} / {promotion.maxUses}
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${(promotion.currentUses / promotion.maxUses) * 100}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Start: {new Date(promotion.startDate).toLocaleDateString()}</span>
                <span>End: {new Date(promotion.endDate).toLocaleDateString()}</span>
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
  );

  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Performance</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Performance chart will be implemented here</p>
          </div>
        </div>

        {/* ROI Chart Placeholder */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ROI Analysis</h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">ROI chart will be implemented here</p>
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-indigo-600">{metrics?.totalImpressions?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Impressions</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{metrics?.totalClicks?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Clicks</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{metrics?.totalConversions?.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Total Conversions</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading marketing data..." />
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
              <Megaphone className="h-8 w-8 mr-3 text-indigo-600" />
              Marketing & Promotions
            </h1>
            <p className="text-gray-600 mt-1">Manage campaigns, promotions, and marketing analytics</p>
          </div>
          
          <div className="flex items-center gap-2">
            <EnhancedButton
              onClick={() => setIsCreateCampaignModalOpen(true)}
              icon={Plus}
            >
              Create Campaign
            </EnhancedButton>
            <EnhancedButton
              onClick={() => setIsCreatePromotionModalOpen(true)}
              icon={Gift}
              variant="secondary"
            >
              Create Promotion
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
                {tab.icon}
                <span className="ml-2">{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'campaigns' && renderCampaignsTab()}
          {activeTab === 'promotions' && renderPromotionsTab()}
          {activeTab === 'analytics' && renderAnalyticsTab()}
        </div>

        {/* Create Campaign Modal */}
        <Modal
          isOpen={isCreateCampaignModalOpen}
          onClose={() => setIsCreateCampaignModalOpen(false)}
          title="Create New Campaign"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter campaign name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="email">Email Campaign</option>
                <option value="sms">SMS Campaign</option>
                <option value="social">Social Media</option>
                <option value="banner">Banner Ads</option>
                <option value="popup">Popup Campaign</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget ($)
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <EnhancedButton
                onClick={() => setIsCreateCampaignModalOpen(false)}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  setIsCreateCampaignModalOpen(false);
                  showNotification({
                    type: 'success',
                    title: 'Campaign Created',
                    message: 'New campaign has been created successfully'
                  });
                }}
                icon={Plus}
              >
                Create Campaign
              </EnhancedButton>
            </div>
          </div>
        </Modal>

        {/* Create Promotion Modal */}
        <Modal
          isOpen={isCreatePromotionModalOpen}
          onClose={() => setIsCreatePromotionModalOpen(false)}
          title="Create New Promotion"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter promotion name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Promotion Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                <option value="flash_sale">Flash Sale</option>
                <option value="bundle">Bundle Deal</option>
                <option value="bogo">Buy One Get One</option>
                <option value="discount">Discount</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Value
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <EnhancedButton
                onClick={() => setIsCreatePromotionModalOpen(false)}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={() => {
                  setIsCreatePromotionModalOpen(false);
                  showNotification({
                    type: 'success',
                    title: 'Promotion Created',
                    message: 'New promotion has been created successfully'
                  });
                }}
                icon={Gift}
              >
                Create Promotion
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      </div>
    </AdminErrorBoundary>
  );
};

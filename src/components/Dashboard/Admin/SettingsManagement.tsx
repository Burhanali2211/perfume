import React, { useState, useEffect } from 'react';
import {
  Settings,
  Globe,
  Mail,
  Shield,
  CreditCard,
  Truck,
  Bell,
  Database,
  Key,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  Download,
  Upload,
  RotateCcw,
  Copy,
  FileText,
  Lock,
  Unlock,
  Server,
  Activity
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useNotification } from '../../../contexts/NotificationContext';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { EnhancedButton } from '../../Common/EnhancedButton';
import { Modal } from '../../Common/Modal';
import { AdminErrorBoundary } from '../../Common/AdminErrorBoundary';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  contactEmail: string;
  supportEmail: string;
  currency: string;
  taxRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  allowGuestCheckout: boolean;
  requireEmailVerification: boolean;
  enableReviews: boolean;
  enableWishlist: boolean;
  enableCoupons: boolean;
  maintenanceMode: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure: boolean;
}

export const SettingsManagement: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: '',
    siteDescription: '',
    siteUrl: '',
    contactEmail: '',
    supportEmail: '',
    currency: 'USD',
    taxRate: 0,
    shippingFee: 0,
    freeShippingThreshold: 0,
    allowGuestCheckout: true,
    requireEmailVerification: false,
    enableReviews: true,
    enableWishlist: true,
    enableCoupons: true,
    maintenanceMode: false,
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    smtpSecure: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { showNotification } = useNotification();

  const tabs = [
    { id: 'general', name: 'General', icon: Globe },
    { id: 'ecommerce', name: 'E-commerce', icon: CreditCard },
    { id: 'features', name: 'Features', icon: Settings },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert(settings, { onConflict: 'id' });

      if (error) throw error;

      showNotification({
        type: 'success',
        title: 'Settings Saved',
        message: 'System settings have been updated successfully'
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
    setHasUnsavedChanges(true);
  };

  // Enhanced functionality
  const handleExportSettings = () => {
    const dataToExport = {
      ...settings,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      const csvData = Object.entries(dataToExport)
        .map(([key, value]) => `${key},${value}`)
        .join('\n');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    setIsExportModalOpen(false);
    showNotification({
      type: 'success',
      title: 'Settings Exported',
      message: `Settings exported successfully as ${exportFormat.toUpperCase()}`
    });
  };

  const handleImportSettings = async () => {
    if (!importFile) return;

    try {
      const text = await importFile.text();
      let importedData;

      if (importFile.type === 'application/json') {
        importedData = JSON.parse(text);
      } else {
        // Handle CSV import
        const lines = text.split('\n');
        importedData = {};
        lines.forEach(line => {
          const [key, value] = line.split(',');
          if (key && value) {
            importedData[key] = value;
          }
        });
      }

      // Validate and merge settings
      const validatedSettings = { ...settings };
      Object.keys(settings).forEach(key => {
        if (importedData[key] !== undefined) {
          validatedSettings[key as keyof SystemSettings] = importedData[key];
        }
      });

      setSettings(validatedSettings);
      setHasUnsavedChanges(true);
      setIsImportModalOpen(false);
      setImportFile(null);

      showNotification({
        type: 'success',
        title: 'Settings Imported',
        message: 'Settings imported successfully. Please review and save changes.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Import Failed',
        message: 'Failed to import settings. Please check the file format.'
      });
    }
  };

  const handleResetSettings = async () => {
    try {
      const defaultSettings: SystemSettings = {
        siteName: '',
        siteDescription: '',
        siteUrl: '',
        contactEmail: '',
        supportEmail: '',
        currency: 'USD',
        taxRate: 0,
        shippingFee: 0,
        freeShippingThreshold: 0,
        allowGuestCheckout: true,
        requireEmailVerification: false,
        enableReviews: true,
        enableWishlist: true,
        enableCoupons: true,
        maintenanceMode: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUsername: '',
        smtpPassword: '',
        smtpSecure: true
      };

      setSettings(defaultSettings);
      setHasUnsavedChanges(true);
      setIsResetModalOpen(false);

      showNotification({
        type: 'success',
        title: 'Settings Reset',
        message: 'Settings have been reset to defaults. Please save to apply changes.'
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Reset Failed',
        message: 'Failed to reset settings.'
      });
    }
  };

  const renderGeneralTab = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Site Name
        </label>
        <input
          type="text"
          value={settings.siteName}
          onChange={(e) => handleInputChange('siteName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Your Store Name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Site Description
        </label>
        <textarea
          value={settings.siteDescription}
          onChange={(e) => handleInputChange('siteDescription', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Brief description of your store"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Site URL
        </label>
        <input
          type="url"
          value={settings.siteUrl}
          onChange={(e) => handleInputChange('siteUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="https://yourstore.com"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={settings.contactEmail}
            onChange={(e) => handleInputChange('contactEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="contact@yourstore.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Email
          </label>
          <input
            type="email"
            value={settings.supportEmail}
            onChange={(e) => handleInputChange('supportEmail', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="support@yourstore.com"
          />
        </div>
      </div>
    </div>
  );

  const renderEcommerceTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Currency
          </label>
          <select
            value={settings.currency}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="USD">USD - US Dollar</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - British Pound</option>
            <option value="CAD">CAD - Canadian Dollar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={settings.taxRate}
            onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Shipping Fee
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.shippingFee}
            onChange={(e) => handleInputChange('shippingFee', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Free Shipping Threshold
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={settings.freeShippingThreshold}
            onChange={(e) => handleInputChange('freeShippingThreshold', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>
    </div>
  );

  const renderFeaturesTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Store Features</h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Allow Guest Checkout</label>
              <p className="text-sm text-gray-500">Allow customers to checkout without creating an account</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('allowGuestCheckout', !settings.allowGuestCheckout)}
              className={`${
                settings.allowGuestCheckout ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.allowGuestCheckout ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
              <p className="text-sm text-gray-500">Require users to verify their email address</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('requireEmailVerification', !settings.requireEmailVerification)}
              className={`${
                settings.requireEmailVerification ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.requireEmailVerification ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Reviews</label>
              <p className="text-sm text-gray-500">Allow customers to leave product reviews</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('enableReviews', !settings.enableReviews)}
              className={`${
                settings.enableReviews ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.enableReviews ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Additional Features</h3>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Wishlist</label>
              <p className="text-sm text-gray-500">Allow customers to save products to wishlist</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('enableWishlist', !settings.enableWishlist)}
              className={`${
                settings.enableWishlist ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.enableWishlist ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Enable Coupons</label>
              <p className="text-sm text-gray-500">Allow discount coupons and promotional codes</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('enableCoupons', !settings.enableCoupons)}
              className={`${
                settings.enableCoupons ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.enableCoupons ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
              <p className="text-sm text-gray-500">Put the store in maintenance mode</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
              className={`${
                settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmailTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">SMTP Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={settings.smtpHost}
              onChange={(e) => handleInputChange('smtpHost', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="smtp.gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={settings.smtpPort}
              onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 587)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="587"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={settings.smtpUsername}
              onChange={(e) => handleInputChange('smtpUsername', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="your-email@gmail.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={settings.smtpPassword}
                onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Your SMTP password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Use Secure Connection (TLS/SSL)</label>
              <p className="text-sm text-gray-500">Enable secure email transmission</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('smtpSecure', !settings.smtpSecure)}
              className={`${
                settings.smtpSecure ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.smtpSecure ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Security Notice</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>These settings affect the security of your entire application. Please review carefully before making changes.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Require Email Verification</label>
              <p className="text-sm text-gray-500">Force users to verify their email before accessing the store</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('requireEmailVerification', !settings.requireEmailVerification)}
              className={`${
                settings.requireEmailVerification ? 'bg-indigo-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.requireEmailVerification ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Maintenance Mode</label>
              <p className="text-sm text-gray-500">Temporarily disable public access to the store</p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('maintenanceMode', !settings.maintenanceMode)}
              className={`${
                settings.maintenanceMode ? 'bg-red-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
            >
              <span
                className={`${
                  settings.maintenanceMode ? 'translate-x-5' : 'translate-x-0'
                } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Security Recommendations</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Enable email verification for new user accounts</li>
            <li>• Use strong SMTP passwords and enable secure connections</li>
            <li>• Regularly review and update security settings</li>
            <li>• Monitor system logs for suspicious activity</li>
          </ul>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text="Loading settings..." />
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
              <Settings className="h-8 w-8 mr-3 text-indigo-600" />
              System Settings
            </h1>
            <p className="text-gray-600 mt-1">Configure your store settings and preferences</p>
            {hasUnsavedChanges && (
              <div className="flex items-center mt-2 text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span className="text-sm">You have unsaved changes</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <EnhancedButton
              onClick={() => setIsExportModalOpen(true)}
              icon={Download}
              variant="outline"
              size="sm"
            >
              Export
            </EnhancedButton>

            <EnhancedButton
              onClick={() => setIsImportModalOpen(true)}
              icon={Upload}
              variant="outline"
              size="sm"
            >
              Import
            </EnhancedButton>

            <EnhancedButton
              onClick={() => setIsResetModalOpen(true)}
              icon={RotateCcw}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              Reset
            </EnhancedButton>

            <EnhancedButton
              onClick={handleSave}
              loading={saving}
              icon={Save}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save Changes
            </EnhancedButton>
          </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'ecommerce' && renderEcommerceTab()}
          {activeTab === 'features' && renderFeaturesTab()}
          {activeTab === 'email' && renderEmailTab()}
          {activeTab === 'security' && renderSecurityTab()}
        </div>

        {/* Export Modal */}
        <Modal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          title="Export Settings"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <EnhancedButton
                onClick={() => setIsExportModalOpen(false)}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={handleExportSettings}
                icon={Download}
              >
                Export
              </EnhancedButton>
            </div>
          </div>
        </Modal>

        {/* Import Modal */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Import Settings"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File
              </label>
              <input
                type="file"
                accept=".json,.csv"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Supported formats: JSON, CSV
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <EnhancedButton
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportFile(null);
                }}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={handleImportSettings}
                disabled={!importFile}
                icon={Upload}
              >
                Import
              </EnhancedButton>
            </div>
          </div>
        </Modal>

        {/* Reset Modal */}
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="Reset Settings"
        >
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Are you sure you want to reset all settings?
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  This action will restore all settings to their default values. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <EnhancedButton
                onClick={() => setIsResetModalOpen(false)}
                variant="outline"
              >
                Cancel
              </EnhancedButton>
              <EnhancedButton
                onClick={handleResetSettings}
                icon={RotateCcw}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Reset All Settings
              </EnhancedButton>
            </div>
          </div>
        </Modal>
      </div>
    </AdminErrorBoundary>
  );
};

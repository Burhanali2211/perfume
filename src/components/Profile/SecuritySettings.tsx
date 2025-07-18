import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Smartphone, Mail, AlertTriangle,
  CheckCircle, Clock, MapPin, Monitor, Trash2, Key,
  Fingerprint, Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface SecurityDevice {
  id: string;
  name: string;
  type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  location: string;
  lastActive: Date;
  isCurrent: boolean;
  trusted: boolean;
}

interface LoginActivity {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  timestamp: Date;
  success: boolean;
  suspicious: boolean;
}

interface TwoFactorMethod {
  id: string;
  type: 'sms' | 'email' | 'authenticator' | 'backup';
  name: string;
  enabled: boolean;
  verified: boolean;
  lastUsed?: Date;
}

export const SecuritySettings: React.FC = () => {
  const { user, updatePassword } = useAuth();
  const { showNotification } = useNotification();

  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);


  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    emailNotifications: true,
    smsNotifications: false,
    suspiciousActivityAlerts: true,
    sessionTimeout: 30, // minutes
    requirePasswordForSensitiveActions: true
  });

  // Mock data - in real app, fetch from API
  const [devices] = useState<SecurityDevice[]>([
    {
      id: '1',
      name: 'Chrome on Windows',
      type: 'desktop',
      browser: 'Chrome 120.0',
      location: 'New York, NY',
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isCurrent: true,
      trusted: true
    },
    {
      id: '2',
      name: 'Safari on iPhone',
      type: 'mobile',
      browser: 'Safari 17.0',
      location: 'New York, NY',
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      isCurrent: false,
      trusted: true
    },
    {
      id: '3',
      name: 'Firefox on Mac',
      type: 'desktop',
      browser: 'Firefox 121.0',
      location: 'San Francisco, CA',
      lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      isCurrent: false,
      trusted: false
    }
  ]);

  const [loginHistory] = useState<LoginActivity[]>([
    {
      id: '1',
      device: 'Chrome on Windows',
      location: 'New York, NY',
      ipAddress: '192.168.1.100',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      success: true,
      suspicious: false
    },
    {
      id: '2',
      device: 'Safari on iPhone',
      location: 'New York, NY',
      ipAddress: '192.168.1.101',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      success: true,
      suspicious: false
    },
    {
      id: '3',
      device: 'Unknown Device',
      location: 'Los Angeles, CA',
      ipAddress: '203.0.113.1',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      success: false,
      suspicious: true
    }
  ]);

  const [twoFactorMethods, setTwoFactorMethods] = useState<TwoFactorMethod[]>([
    {
      id: 'sms',
      type: 'sms',
      name: 'SMS to +1 (555) ***-1234',
      enabled: false,
      verified: false
    },
    {
      id: 'email',
      type: 'email',
      name: 'Email to user@example.com',
      enabled: true,
      verified: true,
      lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 'authenticator',
      type: 'authenticator',
      name: 'Authenticator App',
      enabled: false,
      verified: false
    },
    {
      id: 'backup',
      type: 'backup',
      name: 'Backup Codes',
      enabled: false,
      verified: false
    }
  ]);

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showNotification('Password must be at least 8 characters long', 'error');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(passwordData.newPassword);
      showNotification('Password updated successfully!', 'success');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorToggle = (methodId: string) => {
    setTwoFactorMethods(prev =>
      prev.map(method =>
        method.id === methodId
          ? { ...method, enabled: !method.enabled }
          : method
      )
    );

    if (methodId === 'authenticator' && !twoFactorMethods.find(m => m.id === methodId)?.enabled) {
      setSelectedTwoFactorMethod(methodId);
      setShowTwoFactorSetup(true);
    }
  };

  const handleDeviceRevoke = () => {
    showNotification('Device access revoked successfully', 'success');
    // In real app, make API call to revoke device
  };

  const handleDownloadBackupCodes = () => {
    const codes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );

    const content = `Backup Codes for ${user?.email}\n\nGenerated: ${new Date().toLocaleString()}\n\n${codes.join('\n')}\n\nKeep these codes safe and secure. Each code can only be used once.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('Backup codes downloaded successfully', 'success');
  };

  const getDeviceIcon = (type: SecurityDevice['type']) => {
    switch (type) {
      case 'mobile':
        return Smartphone;
      case 'tablet':
        return Smartphone;
      default:
        return Monitor;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} days ago`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks} weeks ago`;
  };

  return (
    <div className="space-y-8">
      {/* Security Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Security Overview</h2>
            <p className="text-gray-600 mt-1">Manage your account security and privacy settings</p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-green-600">Account Secure</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Email Verified</h3>
            <p className="text-sm text-gray-600">Your email is verified and secure</p>
          </div>

          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">2FA Recommended</h3>
            <p className="text-sm text-gray-600">Enable two-factor authentication</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <Lock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900">Strong Password</h3>
            <p className="text-sm text-gray-600">Your password meets security requirements</p>
          </div>
        </div>
      </div>

      {/* Password Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Password</h3>
            <p className="text-sm text-gray-600">Manage your account password</p>
          </div>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Key className="h-4 w-4" />
            <span>Change Password</span>
          </button>
        </div>

        {showPasswordForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Confirm new password"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handlePasswordChange}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => setShowPasswordForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Two-Factor Authentication</h3>
            <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${securitySettings.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
              {securitySettings.twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
            <button
              onClick={() => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                securitySettings.twoFactorEnabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  securitySettings.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {twoFactorMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {method.type === 'sms' && <Smartphone className="h-5 w-5 text-gray-600" />}
                  {method.type === 'email' && <Mail className="h-5 w-5 text-gray-600" />}
                  {method.type === 'authenticator' && <Fingerprint className="h-5 w-5 text-gray-600" />}
                  {method.type === 'backup' && <Key className="h-5 w-5 text-gray-600" />}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{method.name}</h4>
                  <p className="text-sm text-gray-600">
                    {method.verified ? (
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        Verified
                        {method.lastUsed && ` • Last used ${formatTimeAgo(method.lastUsed)}`}
                      </span>
                    ) : (
                      'Not verified'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {method.type === 'backup' && method.enabled && (
                  <button
                    onClick={handleDownloadBackupCodes}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download backup codes"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                )}

                <button
                  onClick={() => handleTwoFactorToggle(method.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    method.enabled ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      method.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Active Sessions</h3>
            <p className="text-sm text-gray-600">Manage devices that have access to your account</p>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Sign out all devices
          </button>
        </div>

        <div className="space-y-4">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.type);
            return (
              <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    device.isCurrent ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <DeviceIcon className={`h-5 w-5 ${
                      device.isCurrent ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">{device.name}</h4>
                      {device.isCurrent && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Current
                        </span>
                      )}
                      {device.trusted && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          Trusted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {device.location}
                      </span>
                      <span className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatTimeAgo(device.lastActive)}
                      </span>
                    </div>
                  </div>
                </div>

                {!device.isCurrent && (
                  <button
                    onClick={() => handleDeviceRevoke(device.id)}
                    className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    title="Revoke access"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Login History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Login History</h3>
            <p className="text-sm text-gray-600">Recent login attempts and activity</p>
          </div>
          <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            View all activity
          </button>
        </div>

        <div className="space-y-3">
          {loginHistory.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.success
                    ? activity.suspicious
                      ? 'bg-yellow-100'
                      : 'bg-green-100'
                    : 'bg-red-100'
                }`}>
                  {activity.success ? (
                    activity.suspicious ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{activity.device}</h4>
                    {activity.suspicious && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Suspicious
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {activity.location}
                    </span>
                    <span>IP: {activity.ipAddress}</span>
                    <span>{activity.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-sm font-medium ${
                  activity.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {activity.success ? 'Success' : 'Failed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Security Preferences */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Security Preferences</h3>
          <p className="text-sm text-gray-600">Configure your security and notification settings</p>
        </div>

        <div className="space-y-6">
          {/* Notification Settings */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Notifications</h4>
            <div className="space-y-4">
              {[
                { key: 'loginAlerts', label: 'Login Alerts', description: 'Get notified of new device logins' },
                { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive security alerts via email' },
                { key: 'smsNotifications', label: 'SMS Notifications', description: 'Receive security alerts via SMS' },
                { key: 'suspiciousActivityAlerts', label: 'Suspicious Activity Alerts', description: 'Get notified of unusual account activity' }
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900">{setting.label}</h5>
                    <p className="text-sm text-gray-600">{setting.description}</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings(prev => ({
                      ...prev,
                      [setting.key]: !prev[setting.key as keyof typeof securitySettings]
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      securitySettings[setting.key as keyof typeof securitySettings] ? 'bg-indigo-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        securitySettings[setting.key as keyof typeof securitySettings] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Session Settings */}
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Session Settings</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Timeout (minutes)
                </label>
                <select
                  value={securitySettings.sessionTimeout}
                  onChange={(e) => setSecuritySettings(prev => ({
                    ...prev,
                    sessionTimeout: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                  <option value={480}>8 hours</option>
                  <option value={0}>Never</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-sm font-medium text-gray-900">Require Password for Sensitive Actions</h5>
                  <p className="text-sm text-gray-600">Require password confirmation for sensitive operations</p>
                </div>
                <button
                  onClick={() => setSecuritySettings(prev => ({
                    ...prev,
                    requirePasswordForSensitiveActions: !prev.requirePasswordForSensitiveActions
                  }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    securitySettings.requirePasswordForSensitiveActions ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      securitySettings.requirePasswordForSensitiveActions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export & Account Deletion */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900">Data & Account Management</h3>
          <p className="text-sm text-gray-600">Export your data or delete your account</p>
        </div>

        <div className="space-y-4">
          <button className="flex items-center justify-between w-full p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5 text-gray-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Export Account Data</p>
                <p className="text-sm text-gray-600">Download a copy of all your account data</p>
              </div>
            </div>
            <span className="text-indigo-600 font-medium">Export</span>
          </button>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Delete Account</p>
                  <p className="text-sm text-red-700">Permanently delete your account and all data</p>
                </div>
              </div>
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
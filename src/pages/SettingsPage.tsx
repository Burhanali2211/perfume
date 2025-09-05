import React, { useState } from 'react';
import { User, MapPin, Bell, Shield, CreditCard, Settings as SettingsIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProfileSettings } from '../components/Settings/ProfileSettings';
import { AddressManagement } from '../components/Address/AddressManagement';
import { NotificationSettings } from '../components/Settings/NotificationSettings';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { PaymentSettings } from '../components/Settings/PaymentSettings';
import { AdminSettings } from '../components/Settings/AdminSettings';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User, description: 'Personal information and preferences' },
    { id: 'addresses', name: 'Addresses', icon: MapPin, description: 'Shipping and billing addresses' },
    { id: 'notifications', name: 'Notifications', icon: Bell, description: 'Email and push notification settings' },
    { id: 'security', name: 'Security', icon: Shield, description: 'Password and security settings' },
    { id: 'payment', name: 'Payment', icon: CreditCard, description: 'Payment methods and billing' },
    ...(user?.role === 'admin' ? [{ id: 'admin', name: 'Admin', icon: SettingsIcon, description: 'System administration settings' }] : [])
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      case 'addresses':
        return <AddressManagement />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'payment':
        return <PaymentSettings />;
      case 'admin':
        return user?.role === 'admin' ? <AdminSettings /> : <ProfileSettings />;
      default:
        return <ProfileSettings />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <motion.button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className={`h-5 w-5 ${
                        activeTab === tab.id ? 'text-indigo-600' : 'text-gray-400'
                      }`} />
                      <div>
                        <div className="font-medium">{tab.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{tab.description}</div>
                      </div>
                    </motion.button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px]">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderContent()}
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

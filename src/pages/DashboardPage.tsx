import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AdminDashboard } from '../components/Dashboard/AdminDashboard';
import { SellerDashboard } from '../components/Dashboard/SellerDashboard';
import { CustomerDashboard } from '../components/Dashboard/CustomerDashboard';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';

export const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Show access denied if no user is authenticated (temporarily bypassed for testing)
  const isDevelopment = import.meta.env.VITE_APP_ENV === 'development';
  const allowTestAccess = isDevelopment && import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';

  if (!user && !allowTestAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please sign in to access your dashboard.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    // In test mode, default to admin dashboard
    const userRole = user?.role || (allowTestAccess ? 'admin' : 'customer');

    switch (userRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'seller':
        return <SellerDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      default:
        // Fallback for any unrecognized role
        console.warn(`Unrecognized user role: ${userRole}. Defaulting to customer dashboard.`);
        return <CustomerDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderDashboard()}
    </div>
  );
};

export default DashboardPage;

import React from 'react';
import HealthCheckEndpoint from '../components/Common/HealthCheckEndpoint';

const HealthPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Health Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring of application performance and status</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <HealthCheckEndpoint />
        </div>
        
        <div className="mt-10 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Monitoring Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Error Tracking</h3>
              <p className="text-gray-600 text-sm">
                Errors are tracked using Sentry for detailed stack traces and LogRocket for session replay.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Performance Monitoring</h3>
              <p className="text-gray-600 text-sm">
                Core Web Vitals and custom performance metrics are collected and analyzed.
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Alerting</h3>
              <p className="text-gray-600 text-sm">
                Critical issues trigger alerts through configured notification channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthPage;
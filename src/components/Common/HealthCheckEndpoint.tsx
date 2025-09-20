import React, { useEffect, useState } from 'react';
import { useMonitoring } from '../../contexts/MonitoringContext';

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: 'healthy' | 'unhealthy' | 'degraded';
    auth: 'healthy' | 'unhealthy' | 'degraded';
    api: 'healthy' | 'unhealthy' | 'degraded';
    cache: 'healthy' | 'unhealthy' | 'degraded';
  };
  metrics?: {
    uptime: number;
    responseTime: number;
    memoryUsage: number;
    cpuUsage?: number;
  };
}

const HealthCheckEndpoint: React.FC = () => {
  const { healthStatus } = useMonitoring();
  const [healthData, setHealthData] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        setLoading(true);
        
        // In a real implementation, this would call an actual health endpoint
        // For now, we'll simulate based on the monitoring context
        const mockHealthData: HealthStatus = {
          status: healthStatus?.status === 'healthy' ? 'healthy' : 'unhealthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'healthy',
            auth: 'healthy',
            api: 'healthy',
            cache: 'healthy'
          },
          metrics: {
            uptime: Math.floor(Math.random() * 1000000),
            responseTime: Math.floor(Math.random() * 200),
            memoryUsage: Math.floor(Math.random() * 100)
          }
        };
        
        setHealthData(mockHealthData);
      } catch (error) {
        console.error('Failed to fetch health data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealthData();
    
    // Poll for health data every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, [healthStatus]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!healthData) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        <p>Unable to fetch health data</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">System Health Status</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
          healthData.status === 'healthy' 
            ? 'bg-green-100 text-green-800' 
            : healthData.status === 'degraded' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-red-100 text-red-800'
        }`}>
          {healthData.status.toUpperCase()}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Service Status</h3>
          <div className="space-y-3">
            {Object.entries(healthData.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between">
                <span className="text-gray-600 capitalize">{service}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  status === 'healthy' 
                    ? 'bg-green-100 text-green-800' 
                    : status === 'degraded' 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-red-100 text-red-800'
                }`}>
                  {status}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {healthData.metrics && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">System Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Uptime</span>
                <span className="font-mono">{Math.floor(healthData.metrics.uptime / 3600)}h {Math.floor((healthData.metrics.uptime % 3600) / 60)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Response Time</span>
                <span className="font-mono">{healthData.metrics.responseTime}ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Memory Usage</span>
                <span className="font-mono">{healthData.metrics.memoryUsage}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-500">
        Last updated: {new Date(healthData.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

export default HealthCheckEndpoint;
import React, { createContext, useContext, useEffect, useState } from 'react';
import { initMonitoring, MonitoringConfig, reportError, identifyUser, trackEvent, healthCheck } from '../utils/monitoring';

interface MonitoringContextType {
  isInitialized: boolean;
  config: MonitoringConfig | null;
  error: Error | null;
  initialize: (config: MonitoringConfig) => void;
  reportError: (error: Error, context?: Record<string, unknown>) => void;
  identifyUser: (userId: string, userInfo: Record<string, unknown>) => void;
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
  healthStatus: { status: 'healthy' | 'unhealthy'; details?: any } | null;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export const MonitoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [config, setConfig] = useState<MonitoringConfig | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [healthStatus, setHealthStatus] = useState<{ status: 'healthy' | 'unhealthy'; details?: any } | null>(null);

  const initialize = (monitoringConfig: MonitoringConfig) => {
    try {
      initMonitoring(monitoringConfig);
      setConfig(monitoringConfig);
      setIsInitialized(true);
      setError(null);
    } catch (err) {
      console.error('Failed to initialize monitoring:', err);
      setError(err as Error);
      setIsInitialized(false);
    }
  };

  const checkHealth = async () => {
    try {
      const status = await healthCheck();
      setHealthStatus(status);
    } catch (err) {
      setHealthStatus({ status: 'unhealthy', details: { error: (err as Error).message } });
    }
  };

  // Periodically check health status
  useEffect(() => {
    if (isInitialized) {
      checkHealth();
      const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isInitialized]);

  const value = {
    isInitialized,
    config,
    error,
    initialize,
    reportError,
    identifyUser,
    trackEvent,
    healthStatus
  };

  return (
    <MonitoringContext.Provider value={value}>
      {children}
    </MonitoringContext.Provider>
  );
};

export const useMonitoring = () => {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
};

export default MonitoringContext;
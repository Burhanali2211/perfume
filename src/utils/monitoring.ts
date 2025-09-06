import * as Sentry from '@sentry/react';
import * as LogRocket from 'logrocket';
import { browserTracingIntegration } from '@sentry/browser';

// Types for our monitoring configuration
export interface MonitoringConfig {
  sentry?: {
    dsn: string;
    environment: string;
    release: string;
    tracesSampleRate: number;
  };
  logRocket?: {
    appId: string;
  };
  openTelemetry?: {
    endpoint: string;
    serviceName: string;
  };
}

// Initialize Sentry for error tracking and performance monitoring
export const initSentry = (config: MonitoringConfig['sentry']) => {
  if (!config?.dsn) {
    console.warn('Sentry DSN not provided. Sentry will not be initialized.');
    return;
  }

  Sentry.init({
    dsn: config.dsn,
    environment: config.environment,
    release: config.release,
    integrations: [
      browserTracingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: config.tracesSampleRate, // Capture 100% of transactions in development, less in production
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });

  console.log('🚀 Sentry initialized for error tracking and performance monitoring');
};

// Initialize LogRocket for session replay
export const initLogRocket = (config: MonitoringConfig['logRocket']) => {
  if (!config?.appId) {
    console.warn('LogRocket App ID not provided. LogRocket will not be initialized.');
    return;
  }

  LogRocket.init(config.appId);
  console.log('🚀 LogRocket initialized for session replay and user behavior tracking');
};

// Enhanced error reporting with context
export const reportError = (error: Error, context?: Record<string, unknown>) => {
  // Log to console first
  console.error('Application Error:', error, context);

  // Send to Sentry if initialized
  if (Sentry.getClient()) {
    Sentry.captureException(error, {
      contexts: {
        app: context
      }
    });
  }

  // Send to LogRocket if initialized
  if ((window as any).LogRocket) {
    LogRocket.log('Application Error', {
      message: error.message,
      stack: error.stack,
      ...context
    });
  }
};

// Track user sessions with LogRocket
export const identifyUser = (userId: string, userInfo: Record<string, string | number | boolean>) => {
  if ((window as any).LogRocket) {
    LogRocket.identify(userId, userInfo);
  }
  
  if (Sentry.getClient()) {
    Sentry.setUser({ id: userId, ...userInfo });
  }
};

// Track custom events
export const trackEvent = (eventName: string, properties?: Record<string, string | number | boolean | string[] | number[] | boolean[] | null>) => {
  // Track with Sentry
  if (Sentry.getClient()) {
    Sentry.addBreadcrumb({
      category: 'user-action',
      message: eventName,
      data: properties,
      level: 'info'
    });
  }

  // Track with LogRocket
  if ((window as any).LogRocket) {
    LogRocket.track(eventName, properties);
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Event tracked: ${eventName}`, properties);
  }
};

// Performance monitoring utilities
export const startTransaction = (name: string, op: string) => {
  if (Sentry.getClient()) {
    return Sentry.startSpan({ name, op }, (span) => span);
  }
  return null;
};

export const finishTransaction = (transaction: any) => {
  // In Sentry v10, spans are automatically finished when the function completes
  // This function is kept for backward compatibility
};

// Web Vitals monitoring
export const reportWebVitals = (metric: any) => {
  // In Sentry v10, web vitals are automatically captured
  // This function is kept for backward compatibility
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Web Vital: ${metric.name}`, metric);
  }
};

// Health check endpoint
export const healthCheck = async (): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> => {
  try {
    // Check if monitoring services are initialized
    const sentryHealthy = !!Sentry.getClient();
    const logRocketHealthy = !!(window as any).LogRocket;
    
    // In a real implementation, you might check network connectivity,
    // API endpoints, or other critical services
    
    return {
      status: sentryHealthy && logRocketHealthy ? 'healthy' : 'unhealthy',
      details: {
        sentry: sentryHealthy,
        logRocket: logRocketHealthy
      }
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      status: 'unhealthy',
      details: {
        error: (error as Error).message
      }
    };
  }
};

// Initialize all monitoring services
export const initMonitoring = (config: MonitoringConfig) => {
  console.log('🔧 Initializing monitoring services...');
  
  try {
    // Initialize Sentry
    if (config.sentry) {
      initSentry(config.sentry);
    }
    
    // Initialize LogRocket
    if (config.logRocket) {
      initLogRocket(config.logRocket);
    }
    
    // Set up global error handlers
    window.addEventListener('error', (event) => {
      reportError(event.error, {
        type: 'unhandled-error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      reportError(event.reason, {
        type: 'unhandled-promise-rejection'
      });
    });
    
    console.log('✅ Monitoring services initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize monitoring services:', error);
  }
};

export default {
  initMonitoring,
  reportError,
  identifyUser,
  trackEvent,
  startTransaction,
  finishTransaction,
  reportWebVitals,
  healthCheck
};
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

// Enhanced error reporting with context and XrayWrapper protection
export const reportError = (error: Error, context?: Record<string, unknown>) => {
  try {
    // Log to console first with safe error handling
    console.error('Application Error:', error, context);
  } catch (consoleError) {
    // Fallback if console is wrapped
    if (typeof window !== 'undefined' && (window as any).wrappedJSObject?.console) {
      try {
        (window as any).wrappedJSObject.console.error('Application Error:', error, context);
      } catch (wrappedConsoleError) {
        // Silent fallback
      }
    }
  }

  // Send to Sentry if initialized with safe error handling
  try {
    if (Sentry.getClient()) {
      // Safely clone context to avoid XrayWrapper issues
      const safeContext = context ? JSON.parse(JSON.stringify(context)) : {};
      
      Sentry.captureException(error, {
        contexts: {
          app: safeContext
        }
      });
    }
  } catch (sentryError) {
    console.warn('XrayWrapper: Sentry error reporting failed:', sentryError);
  }

  // Send to LogRocket if initialized with safe error handling
  try {
    if ((window as any).LogRocket) {
      // Safely clone context to avoid XrayWrapper issues
      const safeData = {
        message: String(error.message || 'Unknown error'),
        stack: String(error.stack || 'No stack trace'),
        ...(context ? JSON.parse(JSON.stringify(context)) : {})
      };
      
      LogRocket.log('Application Error', safeData);
    }
  } catch (logRocketError) {
    console.warn('XrayWrapper: LogRocket error reporting failed:', logRocketError);
  }
};

// Track user sessions with LogRocket and XrayWrapper protection
export const identifyUser = (userId: string, userInfo: Record<string, string | number | boolean>) => {
  try {
    if ((window as any).LogRocket) {
      // Safely clone user info to avoid XrayWrapper issues
      const safeUserInfo = JSON.parse(JSON.stringify(userInfo));
      LogRocket.identify(String(userId), safeUserInfo);
    }
  } catch (logRocketError) {
    console.warn('XrayWrapper: LogRocket identify failed:', logRocketError);
  }
  
  try {
    if (Sentry.getClient()) {
      // Safely clone user info for Sentry
      const safeUserInfo = JSON.parse(JSON.stringify(userInfo));
      Sentry.setUser({ id: String(userId), ...safeUserInfo });
    }
  } catch (sentryError) {
    console.warn('XrayWrapper: Sentry setUser failed:', sentryError);
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
    
    // Set up global error handlers with XrayWrapper protection
    window.addEventListener('error', (event) => {
      // Check for XrayWrapper specific errors and handle them specially
      if (event.error?.message?.includes('XrayWrapper') || 
          event.error?.message?.includes('cross-origin object')) {
        console.warn('XrayWrapper error detected and handled:', event.error);
        // Don't report XrayWrapper errors to external services
        return;
      }
      
      try {
        reportError(event.error, {
          type: 'unhandled-error',
          filename: String(event.filename || 'unknown'),
          lineno: Number(event.lineno || 0),
          colno: Number(event.colno || 0)
        });
      } catch (handlerError) {
        console.warn('Error handler failed:', handlerError);
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      // Check for XrayWrapper specific promise rejections
      if (event.reason?.message?.includes('XrayWrapper') || 
          event.reason?.message?.includes('cross-origin object')) {
        console.warn('XrayWrapper promise rejection detected and handled:', event.reason);
        event.preventDefault();
        return;
      }
      
      try {
        reportError(event.reason, {
          type: 'unhandled-promise-rejection'
        });
      } catch (handlerError) {
        console.warn('Promise rejection handler failed:', handlerError);
      }
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
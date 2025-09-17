import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, X } from 'lucide-react';
import { networkErrorHandler } from '../../utils/networkErrorHandler';

interface ErrorInfo {
  componentStack: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Filter out common browser extension and cross-origin errors
    const ignoredErrors = [
      'XrayWrapper',
      'cross-origin',
      'webkit-text-size-adjust',
      'content-script',
      '__cf_bm',
      'Invalid URI',
      'Load of media resource',
      'ERR_BLOCKED_BY_CLIENT',
      'Failed to fetch',
      'google-analytics',
      'googleapis.com',
      'contentScript.bundle.js',
      'i18next',
      'preloaded using link preload'
    ];

    const shouldIgnore = ignoredErrors.some(ignored =>
      error.message?.includes(ignored) || error.stack?.includes(ignored)
    );

    if (!shouldIgnore) {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError && !shouldIgnore) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you might want to log this to an error reporting service
    if (!shouldIgnore && import.meta.env.PROD) {
      // logErrorToService(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Something went wrong
              </h1>
              
              <p className="text-gray-600 mb-6">
                We're sorry, but something unexpected happened. Please try again or return to the home page.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm font-medium text-red-800 mb-2">Error Details:</p>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32">
                    {this.state.error.toString()}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                <a
                  href="/"
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium flex items-center justify-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </a>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Development-only error display component for network issues
export const DevErrorDisplay: React.FC = () => {
  if (!import.meta.env.DEV) return null;

  const [isVisible, setIsVisible] = React.useState(true);
  const [errorLog, setErrorLog] = React.useState(networkErrorHandler.getErrorLog());

  React.useEffect(() => {
    const interval = setInterval(() => {
      const newErrorLog = networkErrorHandler.getErrorLog();
      if (newErrorLog.length !== errorLog.length) {
        setErrorLog(newErrorLog);
        setIsVisible(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [errorLog.length]);

  if (!isVisible || errorLog.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 shadow-lg z-50">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-yellow-800">
          Network Issues ({errorLog.length})
        </h4>
        <button
          onClick={() => {
            networkErrorHandler.clearErrorLog();
            setErrorLog([]);
            setIsVisible(false);
          }}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="text-xs text-yellow-700 max-h-32 overflow-y-auto">
        {errorLog.slice(-3).map((error, index) => (
          <div key={index} className="mb-1 font-mono">
            <span className="text-yellow-600">{error.timestamp.toLocaleTimeString()}</span>: {error.error}
          </div>
        ))}
        {errorLog.length > 3 && (
          <div className="text-yellow-600 text-center mt-1">
            ... and {errorLog.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

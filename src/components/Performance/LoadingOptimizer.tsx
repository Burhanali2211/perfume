import React, { useState, useEffect, ReactNode } from 'react';
import { LoadingSpinner } from '../Common/LoadingSpinner';

interface LoadingOptimizerProps {
  children: ReactNode;
  isLoading: boolean;
  error?: string | null;
  fallback?: ReactNode;
  timeout?: number;
  retryAction?: () => void;
}

/**
 * LoadingOptimizer - Optimizes loading states and prevents infinite loading
 */
export const LoadingOptimizer: React.FC<LoadingOptimizerProps> = ({
  children,
  isLoading,
  error,
  fallback,
  timeout = 15000, // 15 second timeout
  retryAction
}) => {
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      setShowRetry(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        setHasTimedOut(true);
        setShowRetry(true);
        console.warn('Loading timeout reached - this may indicate a performance issue');
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  // Show error state
  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center bg-background-primary">
        <div className="text-center p-6">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.694-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Something went wrong</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          {retryAction && (
            <button
              onClick={retryAction}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  // Show timeout state
  if (hasTimedOut && isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center bg-background-primary">
        <div className="text-center p-6">
          <div className="text-yellow-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">Taking longer than expected</h3>
          <p className="text-text-secondary mb-4">The page is still loading. This might be due to a slow connection.</p>
          <div className="flex gap-3 justify-center">
            {retryAction && (
              <button
                onClick={retryAction}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Retry
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="min-h-[200px] flex items-center justify-center bg-background-primary">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Show content
  return <>{children}</>;
};

/**
 * Hook for managing loading states with timeout
 */
export const useLoadingTimeout = (timeout = 30000) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setHasTimedOut(false);
      return;
    }

    const timer = setTimeout(() => {
      if (isLoading) {
        setHasTimedOut(true);
        console.warn('Loading operation timed out');
      }
    }, timeout);

    return () => clearTimeout(timer);
  }, [isLoading, timeout]);

  const startLoading = () => {
    setIsLoading(true);
    setHasTimedOut(false);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setHasTimedOut(false);
  };

  return {
    isLoading,
    hasTimedOut,
    startLoading,
    stopLoading
  };
};

/**
 * Higher-order component for adding loading optimization
 */
export const withLoadingOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  loadingProps?: Partial<LoadingOptimizerProps>
) => {
  return React.forwardRef<any, P & { isLoading?: boolean; error?: string }>((props, ref) => {
    const { isLoading = false, error, ...componentProps } = props;

    return (
      <LoadingOptimizer
        isLoading={isLoading}
        error={error}
        {...loadingProps}
      >
        <Component {...(componentProps as P)} ref={ref} />
      </LoadingOptimizer>
    );
  });
};

export default LoadingOptimizer;

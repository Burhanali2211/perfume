import React from 'react';
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

interface PremiumToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export const PremiumToast: React.FC<PremiumToastProps> = ({
  type,
  title,
  message,
  isVisible,
  onClose,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-white border-green-200 shadow-green-100/50';
      case 'error':
        return 'bg-white border-red-200 shadow-red-100/50';
      case 'warning':
        return 'bg-white border-yellow-200 shadow-yellow-100/50';
      case 'info':
        return 'bg-white border-blue-200 shadow-blue-100/50';
    }
  };

  return (
    <>
      {isVisible && (
        <div
          className={`
            fixed top-4 right-4 z-50 max-w-sm w-full
            ${getStyles()}
            border rounded-xl shadow-lg backdrop-blur-sm
            transform transition-all duration-300
          `}
        >
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-neutral-900 mb-1">
                  {title}
                </h4>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {message}
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
              >
                <X className="h-4 w-4 text-neutral-400 hover:text-neutral-600" />
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          {duration > 0 && (
            <div className="h-1 bg-neutral-200 rounded-b-xl overflow-hidden">
              <div
                className={`h-full transition-all ease-linear ${
                  type === 'success' ? 'bg-green-500' :
                  type === 'error' ? 'bg-red-500' :
                  type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}
                style={{
                  width: '0%',
                  transitionDuration: `${duration}ms`
                }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
};

// Toast Container Component
interface PremiumToastContainerProps {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>;
  onRemoveToast: (id: string) => void;
}

export const PremiumToastContainer: React.FC<PremiumToastContainerProps> = ({
  toasts,
  onRemoveToast
}) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto"
        >
          <PremiumToast
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            isVisible={true}
            onClose={() => onRemoveToast(toast.id)}
            duration={toast.duration}
          />
        </div>
      ))}
    </div>
  );
};



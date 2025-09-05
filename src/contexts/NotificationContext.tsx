import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle, ShoppingBag } from 'lucide-react';
import { AppError, handleSupabaseError, logError } from '../utils/errorHandling';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  duration?: number;
  timestamp: number;
  isVisible?: boolean;
  isDismissing?: boolean;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  showError: (error: Error | AppError, context?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const showNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const timestamp = Date.now();
    const id = `${timestamp}-${Math.random().toString(36).substring(2, 9)}`;
    const duration = notification.duration || 5000;
    
    // Check for duplicates within the last 2 seconds
    const isDuplicate = notifications.some(n => 
      n.type === notification.type && 
      n.message === notification.message && 
      n.title === notification.title &&
      timestamp - n.timestamp < 2000
    );
    
    if (isDuplicate) {
      return; // Prevent duplicate notifications
    }
    
    const newNotification: Notification = { 
      ...notification, 
      id, 
      timestamp, 
      duration,
      isVisible: false,
      isDismissing: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    
    // Show notification with animation
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, isVisible: true } : n)
      );
    }, 10);
    
    // Auto-dismiss notification
    if (duration > 0) {
      const timer = setTimeout(() => {
        dismissNotification(id);
      }, duration);
      
      notificationTimers.current.set(id, timer);
    }
  };

  const dismissNotification = (id: string) => {
    // Clear any existing timer
    const timer = notificationTimers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      notificationTimers.current.delete(id);
    }
    
    // Start dismiss animation
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isDismissing: true } : n)
    );
    
    // Remove after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 300);
  };
  
  const removeNotification = (id: string) => {
    dismissNotification(id);
  };
  
  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      notificationTimers.current.forEach(timer => clearTimeout(timer));
      notificationTimers.current.clear();
    };
  }, []);

  const showError = (error: Error | AppError, context?: string) => {
    const appError = 'type' in error ? error : handleSupabaseError(error);
    logError(appError, context);

    showNotification({
      type: 'error',
      title: 'Oops! Something went wrong',
      message: appError.userMessage,
      duration: 7000
    });
  };

  const showSuccess = (message: string, title: string = 'Success!') => {
    showNotification({
      type: 'success',
      title,
      message,
      duration: 4000
    });
  };

  const showInfo = (message: string, title: string = 'Info') => {
    showNotification({
      type: 'info',
      title,
      message,
      duration: 5000
    });
  };

  const showWarning = (message: string, title: string = 'Heads up!') => {
    showNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    });
  };

  // Modern e-commerce toast notification component
  const ToastNotification: React.FC<{ notification: Notification }> = ({ notification }) => {
    const [progress, setProgress] = useState(100);
    const progressRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
      if (notification.duration && notification.duration > 0 && notification.isVisible && !notification.isDismissing) {
        const startTime = Date.now();
        const duration = notification.duration;
        const updateProgress = () => {
          const elapsed = Date.now() - startTime;
          const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
          setProgress(remaining);
          
          if (remaining > 0) {
            progressRef.current = setTimeout(updateProgress, 50);
          }
        };
        updateProgress();
      }
      
      return () => {
        if (progressRef.current) {
          clearTimeout(progressRef.current);
        }
      };
    }, [notification.duration, notification.isVisible, notification.isDismissing]);
    
    const getStyles = () => {
      switch (notification.type) {
        case 'success':
          return {
            container: 'bg-white border-l-4 border-emerald-500 shadow-lg shadow-emerald-500/20',
            icon: <CheckCircle className="h-5 w-5 text-emerald-600" />,
            iconBg: 'bg-emerald-50',
            progress: 'bg-emerald-500'
          };
        case 'error':
          return {
            container: 'bg-white border-l-4 border-red-500 shadow-lg shadow-red-500/20',
            icon: <AlertCircle className="h-5 w-5 text-red-600" />,
            iconBg: 'bg-red-50',
            progress: 'bg-red-500'
          };
        case 'warning':
          return {
            container: 'bg-white border-l-4 border-amber-500 shadow-lg shadow-amber-500/20',
            icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
            iconBg: 'bg-amber-50',
            progress: 'bg-amber-500'
          };
        case 'info':
        default:
          return {
            container: 'bg-white border-l-4 border-blue-500 shadow-lg shadow-blue-500/20',
            icon: <Info className="h-5 w-5 text-blue-600" />,
            iconBg: 'bg-blue-50',
            progress: 'bg-blue-500'
          };
      }
    };
    
    const styles = getStyles();
    
    return (
      <div
        className={`
          ${styles.container}
          rounded-lg overflow-hidden backdrop-blur-sm max-w-sm w-full
          transform transition-all duration-300 ease-out
          ${notification.isVisible && !notification.isDismissing 
            ? 'translate-x-0 opacity-100 scale-100' 
            : 'translate-x-full opacity-0 scale-95'
          }
          ${notification.isDismissing ? 'translate-x-full opacity-0 scale-95' : ''}
        `}
      >
        <div className="p-4">
          <div className="flex items-start">
            <div className={`flex-shrink-0 ${styles.iconBg} rounded-full p-2 mr-3`}>
              {styles.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {notification.title}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className="flex-shrink-0 ml-3 p-1 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
            >
              <X className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Progress bar */}
        {notification.duration && notification.duration > 0 && (
          <div className="h-1 bg-gray-200">
            <div
              className={`h-full ${styles.progress} transition-all duration-75 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  // Scroll-aware positioning for notifications
  useEffect(() => {
    let ticking = false;
    
    const updateNotificationPosition = () => {
      const container = document.querySelector('.notification-container');
      if (container) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        // Keep notifications visible in viewport but not too close to edges
        const topPosition = Math.max(20, scrollTop + 20);
        (container as HTMLElement).style.top = `${topPosition}px`;
      }
    };

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateNotificationPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showError,
      showSuccess,
      showInfo,
      showWarning
    }}>
      {children}
      
      {/* Modern toast container with viewport-aware positioning */}
      <div 
        className="fixed top-4 right-4 z-[9999] pointer-events-none notification-container"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          maxHeight: 'calc(100vh - 2rem)',
          overflow: 'hidden'
        }}
      >
        <div className="flex flex-col-reverse gap-3 max-w-sm w-full">
          {notifications.map((notification) => (
            <div key={notification.id} className="pointer-events-auto">
              <ToastNotification notification={notification} />
            </div>
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};
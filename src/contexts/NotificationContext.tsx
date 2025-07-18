import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';
import { AppError, handleSupabaseError, logError } from '../utils/errorHandling';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

interface NotificationContextType {
  showNotification: (notification: Omit<Notification, 'id'>) => void;
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

  const showNotification = (notification: Omit<Notification, 'id'>) => {
    // FIX: Using Date.now() alone is not safe for keys. Appending a random number ensures uniqueness.
    const id = `${Date.now()}-${Math.random()}`;
    const newNotification = { ...notification, id };
    setNotifications(prev => [newNotification, ...prev]);

    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showError = (error: Error | AppError, context?: string) => {
    const appError = 'type' in error ? error : handleSupabaseError(error);
    logError(appError, context);

    showNotification({
      type: 'error',
      title: 'Error',
      message: appError.userMessage
    });
  };

  const showSuccess = (message: string, title: string = 'Success') => {
    showNotification({
      type: 'success',
      title,
      message
    });
  };

  const showInfo = (message: string, title: string = 'Information') => {
    showNotification({
      type: 'info',
      title,
      message
    });
  };

  const showWarning = (message: string, title: string = 'Warning') => {
    showNotification({
      type: 'warning',
      title,
      message
    });
  };

  const icons = {
    success: <CheckCircle className="h-6 w-6 text-white" />,
    error: <AlertCircle className="h-6 w-6 text-white" />,
    info: <Info className="h-6 w-6 text-white" />,
    warning: <AlertTriangle className="h-6 w-6 text-white" />,
  };

  const bgColors = {
    success: 'bg-gradient-to-r from-trust-green to-green-600',
    error: 'bg-gradient-to-r from-conversion-urgency to-red-700',
    info: 'bg-gradient-to-r from-trust-blue to-blue-600',
    warning: 'bg-gradient-to-r from-conversion-warning to-orange-600',
  };

  const borderColors = {
    success: 'border-trust-green/30',
    error: 'border-conversion-urgency/30',
    info: 'border-trust-blue/30',
    warning: 'border-conversion-warning/30',
  };

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showError,
      showSuccess,
      showInfo,
      showWarning
    }}>
      {children}
      <div className="fixed top-6 right-6 z-[100] w-full max-w-sm">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="mb-4 transform transition-all duration-300 ease-out"
          >
              <div
                className={`w-full ${bgColors[notification.type]} text-white rounded-luxury-lg shadow-luxury-xl border-2 ${borderColors[notification.type]} pointer-events-auto overflow-hidden backdrop-blur-sm`}
              >
                <div className="p-5">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 p-1 bg-white/20 rounded-luxury">
                      {icons[notification.type]}
                    </div>
                    <div className="ml-4 w-0 flex-1">
                      <p className="text-base font-bold text-white tracking-wide">
                        {notification.title}
                      </p>
                      <p className="mt-2 text-sm text-white/90 leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                      <button
                        className="rounded-luxury p-1.5 text-white/70 hover:text-white hover:bg-white/20 transition-all duration-300 hover:scale-110"
                        onClick={() => removeNotification(notification.id)}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Luxury progress bar */}
                <div className="h-1 bg-white/30 rounded-b-luxury-lg">
                  <div className="h-full bg-white/50 rounded-b-luxury-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </NotificationContext.Provider>
  );
};

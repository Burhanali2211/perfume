import React from 'react';
import { PremiumToastContainer } from '../components/Common/PremiumToast';

// Hook for using premium toasts
export const usePremiumToast = () => {
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
  }>>([]);

  const addToast = React.useCallback((
    type: 'success' | 'error' | 'warning' | 'info',
    title: string,
    message: string,
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = React.useCallback((message: string, title = 'Success') => {
    addToast('success', title, message);
  }, [addToast]);

  const showError = React.useCallback((message: string, title = 'Error') => {
    addToast('error', title, message);
  }, [addToast]);

  const showWarning = React.useCallback((message: string, title = 'Warning') => {
    addToast('warning', title, message);
  }, [addToast]);

  const showInfo = React.useCallback((message: string, title = 'Info') => {
    addToast('info', title, message);
  }, [addToast]);

  return {
    toasts,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    ToastContainer: () => (
      <PremiumToastContainer toasts={toasts} onRemoveToast={removeToast} />
    )
  };
};

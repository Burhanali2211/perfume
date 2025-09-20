import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Product, CompareContextType } from '../types';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

interface CompareProviderProps {
  children: ReactNode;
}

export const CompareProvider: React.FC<CompareProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<Product[]>(() => {
    const savedCompare = localStorage.getItem('compare');
    return savedCompare ? JSON.parse(savedCompare) : [];
  });
  const { showNotification } = useNotification();
  const [lastAddedItem, setLastAddedItem] = useState<Product | null>(null);

  useEffect(() => {
    localStorage.setItem('compare', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (lastAddedItem) {
      showNotification({
        type: 'info',
        title: 'Added to Compare',
        message: `${lastAddedItem.name} has been added to your compare list.`
      });
      setLastAddedItem(null);
    }
  }, [lastAddedItem, showNotification]);

  const addItem = useCallback((product: Product) => {
    if (!user) {
      showNotification({ 
        type: 'info', 
        title: 'Authentication Required', 
        message: 'Please log in or create an account to compare products.' 
      });
      return;
    }
    
    setItems(prevItems => {
      if (prevItems.find(item => item.id === product.id)) {
        return prevItems;
      }
      if (prevItems.length >= 4) {
        showNotification({
          type: 'error',
          title: 'Compare List Full',
          message: 'You can only compare up to 4 products at a time.'
        });
        return prevItems;
      }
      setLastAddedItem(product);
      return [...prevItems, product];
    });
  }, [showNotification, user]);

  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  }, []);

  const isInCompare = useCallback((productId: string) => {
    return items.some(item => item.id === productId);
  }, [items]);

  const clearCompare = useCallback(() => {
    setItems([]);
  }, []);

  const value: CompareContextType = {
    items,
    addItem,
    removeItem,
    isInCompare,
    clearCompare,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};
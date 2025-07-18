import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Product, CompareContextType } from '../types';
import { useNotification } from './NotificationContext';

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
  const [items, setItems] = useState<Product[]>(() => {
    const savedCompare = localStorage.getItem('compare');
    return savedCompare ? JSON.parse(savedCompare) : [];
  });
  const { showNotification } = useNotification();

  useEffect(() => {
    localStorage.setItem('compare', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
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
      showNotification({
        type: 'info',
        title: 'Added to Compare',
        message: `${product.name} has been added to your compare list.`
      });
      return [...prevItems, product];
    });
  };

  const removeItem = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.id !== productId));
  };

  const isInCompare = (productId: string) => {
    return items.some(item => item.id === productId);
  };

  const clearCompare = () => {
    setItems([]);
  };

  const value: CompareContextType = {
    items,
    addItem,
    removeItem,
    isInCompare,
    clearCompare,
  };

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
};

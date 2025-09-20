import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Product, WishlistItem, WishlistContextType } from '../types';
import {
  getWishlistItems,
  addToWishlist as addToWishlistDB,
  removeFromWishlist as removeFromWishlistDB
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider');
  return context;
};

export const WishlistProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const wishlistItems = await getWishlistItems();
      setItems(wishlistItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch wishlist items. Please try again later.'
      });
    }
    setLoading(false);
  }, [user, showNotification]);



  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addItem = async (product: Product) => {
    if (!user) {
      showNotification({ 
        type: 'info', 
        title: 'Authentication Required', 
        message: 'Please log in or create an account to add items to your wishlist.' 
      });
      return;
    }

    if (isInWishlist(product.id)) {
      await removeItem(product.id);
      showNotification({ type: 'info', title: 'Removed from Wishlist', message: `${product.name} removed from your wishlist.` });
    } else {
      try {
        const success = await addToWishlistDB(product.id);
        if (success) {
          await fetchWishlist();
          showNotification({ type: 'success', title: 'Added to Wishlist', message: `${product.name} added to your wishlist.` });
        } else {
          showNotification({ type: 'error', title: 'Error', message: 'Could not add item to wishlist.' });
        }
      } catch (error) {
        console.error('Error adding to wishlist:', error);
        showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to wishlist. Please try again later.' });
      }
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) return;

    try {
      const success = await removeFromWishlistDB(productId);
      if (success) {
        await fetchWishlist();
      } else {
        showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item from wishlist.' });
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item from wishlist. Please try again later.' });
    }
  };

  const isInWishlist = (productId: string) => items.some(item => item.product.id === productId);

  const clearWishlist = async () => {
    if (!user) return;

    try {
      // Clear all items one by one using the removeFromWishlist function
      const promises = items.map(item => removeFromWishlistDB(item.product.id));
      await Promise.all(promises);
      setItems([]);
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear wishlist. Please try again later.' });
    }
  };

  const value: WishlistContextType = {
    items,
    addItem,
    removeItem,
    isInWishlist,
    clearWishlist,
    loading
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
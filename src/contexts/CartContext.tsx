import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { CartItem, Product, CartContextType } from '../types';
import {
  getCartItems,
  addToCart as addToCartDB,
  updateCartItemQuantity,
  removeFromCart as removeFromCartDB,
  clearCart as clearCartDB
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestCart, setGuestCart] = useState<CartItem[]>([]);

  // Guest cart management functions
  const loadGuestCart = useCallback(() => {
    try {
      const savedCart = localStorage.getItem('guestCart');
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setGuestCart(parsedCart);
        return parsedCart;
      }
    } catch (error) {
      console.error('Error loading guest cart:', error);
    }
    return [];
  }, []);

  const saveGuestCart = useCallback((cartItems: CartItem[]) => {
    try {
      localStorage.setItem('guestCart', JSON.stringify(cartItems));
      setGuestCart(cartItems);
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  }, []);

  const mergeGuestCartWithUserCart = useCallback(async () => {
    if (user && guestCart.length > 0) {
      try {
        // Add guest cart items to user's database cart
        for (const item of guestCart) {
          await addToCartDB(item.product.id, item.variantId, item.quantity);
        }
        // Clear guest cart after merging
        localStorage.removeItem('guestCart');
        setGuestCart([]);
        return true; // Indicate successful merge
      } catch (error) {
        console.error('Error merging guest cart:', error);
        return false;
      }
    }
    return false;
  }, [user, guestCart]);

  const fetchCart = useCallback(async () => {
    setLoading(true);

    try {
      if (user) {
        // Fetch authenticated user's cart from database
        const cartItems = await getCartItems();
        setItems(cartItems);
      } else {
        // Load guest cart from localStorage
        const guestCartItems = loadGuestCart();
        setItems(guestCartItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to fetch cart items. Please try again later.'
      });
    }
    setLoading(false);
  }, [user, showNotification, loadGuestCart]);



  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Load guest cart on component mount
  useEffect(() => {
    if (!user) {
      loadGuestCart();
    }
  }, [user, loadGuestCart]);

  // Merge guest cart when user logs in
  useEffect(() => {
    if (user && guestCart.length > 0) {
      mergeGuestCartWithUserCart().then((merged) => {
        if (merged) {
          fetchCart(); // Refresh cart after successful merge
        }
      });
    }
  }, [user, guestCart.length, mergeGuestCartWithUserCart, fetchCart]);

  const addItem = async (product: Product, quantity: number = 1) => {
    try {
      if (user) {
        // Add to authenticated user's database cart
        const success = await addToCartDB(product.id, undefined, quantity);
        if (success) {
          await fetchCart();
          showNotification({ type: 'success', title: 'Added to Cart', message: `${product.name} has been added.` });
        } else {
          showNotification({ type: 'error', title: 'Error', message: 'Could not add item to cart.' });
        }
      } else {
        // Add to guest cart in localStorage
        const currentGuestCart = loadGuestCart();
        const existingItemIndex = currentGuestCart.findIndex(item => item.product.id === product.id);

        let updatedCart: CartItem[];
        if (existingItemIndex >= 0) {
          // Update existing item quantity
          updatedCart = [...currentGuestCart];
          updatedCart[existingItemIndex].quantity += quantity;
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `guest-${Date.now()}-${product.id}`,
            product,
            productId: product.id,
            quantity,
            variantId: undefined,
            createdAt: new Date()
          };
          updatedCart = [...currentGuestCart, newItem];
        }

        saveGuestCart(updatedCart);
        setItems(updatedCart);
        showNotification({ type: 'success', title: 'Added to Cart', message: `${product.name} has been added.` });
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to add item to cart. Please try again later.' });
    }
  };

  const removeItem = async (productId: string) => {
    try {
      if (user) {
        // Remove from authenticated user's database cart
        const success = await removeFromCartDB(productId);
        if (success) {
          await fetchCart();
        } else {
          showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item from cart.' });
        }
      } else {
        // Remove from guest cart
        const currentGuestCart = loadGuestCart();
        const updatedCart = currentGuestCart.filter(item => item.product.id !== productId);
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to remove item from cart. Please try again later.' });
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeItem(productId);
      return;
    }

    try {
      if (user) {
        // Update authenticated user's database cart
        const success = await updateCartItemQuantity(productId, quantity);
        if (success) {
          await fetchCart();
        } else {
          showNotification({ type: 'error', title: 'Error', message: 'Failed to update item quantity.' });
        }
      } else {
        // Update guest cart
        const currentGuestCart = loadGuestCart();
        const updatedCart = currentGuestCart.map(item =>
          item.product.id === productId ? { ...item, quantity } : item
        );
        saveGuestCart(updatedCart);
        setItems(updatedCart);
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to update item quantity. Please try again later.' });
    }
  };

  const clearCart = async () => {
    try {
      if (user) {
        // Clear authenticated user's database cart
        const success = await clearCartDB();
        if (success) {
          setItems([]);
        } else {
          showNotification({ type: 'error', title: 'Error', message: 'Failed to clear cart.' });
        }
      } else {
        // Clear guest cart
        localStorage.removeItem('guestCart');
        setGuestCart([]);
        setItems([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      showNotification({ type: 'error', title: 'Error', message: 'Failed to clear cart. Please try again later.' });
    }
  };

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value: CartContextType = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
    loading
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Order, CartItem, Address, OrderContextType } from '../types';
import {
  createOrder as createOrderDB,
  getOrders,
  getOrderById as getOrderByIdDB,
  updateOrderStatus as updateOrderStatusDB
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};

export const OrderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUserOrders = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    setLoading(true);

    try {
      const ordersData = await getOrders(user.id);
      setOrders(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
      showNotification({
        type: 'error',
        title: 'Error',
        message: 'Failed to load orders. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  }, [user, showNotification]);



  // Initial fetch
  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  const createOrder = async (
    items: CartItem[],
    shippingAddress: Address,
    billingAddress?: Address,
    paymentMethod: string = 'cash_on_delivery'
  ): Promise<string | null> => {
    if (!user) {
      showNotification({
        type: 'error',
        title: 'Authentication Required',
        message: 'Please log in to place an order'
      });
      return null;
    }

    setLoading(true);

    try {
      const orderId = await createOrderDB({
        items,
        shippingAddress,
        billingAddress,
        paymentMethod
      });

      if (orderId) {
        showNotification({
          type: 'success',
          title: 'Order Placed',
          message: 'Your order has been placed successfully!'
        });
        await fetchUserOrders(); // Refresh orders
        return orderId;
      } else {
        showNotification({
          type: 'error',
          title: 'Order Failed',
          message: 'Failed to create order. Please try again.'
        });
        return null;
      }
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification({
        type: 'error',
        title: 'Order Failed',
        message: 'An unexpected error occurred. Please try again.'
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
      const success = await updateOrderStatusDB(orderId, status);
      if (success) {
        await fetchUserOrders(); // Refresh orders
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Order status updated to ${status}`
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update order status'
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update order status. Please try again later.'
      });
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      const order = await getOrderByIdDB(orderId);
      return order;
    } catch (error) {
      console.error('Error fetching order:', error);
      // Check local orders as fallback
      const localOrder = orders.find(order => order.id === orderId);
      if (localOrder) return localOrder;

      return null;
    }
  };

  const getUserOrders = async (userId?: string): Promise<Order[]> => {
    const targetUserId = userId || user?.id;
    if (!targetUserId) return [];

    try {
      const ordersData = await getOrders(targetUserId);
      return ordersData;
    } catch (error) {
      console.error('Error fetching user orders:', error);
      return [];
    }
  };

  const value: OrderContextType = {
    orders,
    loading,
    createOrder,
    updateOrderStatus,
    getOrderById,
    getUserOrders
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

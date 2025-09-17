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
      // If direct login is enabled, use mock data instead of trying to connect to database
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Using mock orders');
        // Mock orders data
        const mockOrders: Order[] = [
          {
            id: '1',
            orderNumber: 'ORD-001',
            userId: user.id,
            items: [],
            total: 299.99,
            subtotal: 279.99,
            taxAmount: 20.00,
            shippingAmount: 0,
            discountAmount: 0,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: 'cash_on_delivery',
            shippingAddress: {
              fullName: 'John Doe',
              streetAddress: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'USA'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        setOrders(mockOrders);
        setLoading(false);
        return;
      }

      const ordersData = await getOrders(user.id);
      // @ts-ignore - There's a type mismatch between database fields and interface fields
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
    paymentMethod: string,
    total: number
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
      // If direct login is enabled, simulate order creation
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Simulating order creation');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showNotification({
          type: 'success',
          title: 'Order Placed',
          message: 'Your order has been placed successfully!'
        });
        await fetchUserOrders(); // Refresh orders
        return 'mock-order-id';
      }

      // Transform cart items to order items
      const orderItems: Record<string, unknown>[] = items.map(item => ({
        product_id: item.productId,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }));

      // @ts-ignore - There's a type mismatch between database fields and interface fields
      const orderId = await createOrderDB({
        user_id: user.id,
        shipping_address: shippingAddress,
        paymentMethod: paymentMethod,
        total: total,
        subtotal: total, // Simplified for mock
        taxAmount: 0,
        shippingAmount: 0,
        discountAmount: 0,
        status: 'pending',
        paymentStatus: 'pending'
      }, orderItems);

      if (orderId) {
        showNotification({
          type: 'success',
          title: 'Order Placed',
          message: 'Your order has been placed successfully!'
        });
        await fetchUserOrders(); // Refresh orders
        return orderId.id;
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

  const updateOrderStatus = async (orderId: string, status: string): Promise<boolean> => {
    try {
      // If direct login is enabled, simulate order status update
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Simulating order status update');
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchUserOrders(); // Refresh orders
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Order status updated to ${status}`
        });
        return true;
      }

      // @ts-ignore - Type mismatch
      const success = await updateOrderStatusDB(orderId, status);
      if (success) {
        await fetchUserOrders(); // Refresh orders
        showNotification({
          type: 'success',
          title: 'Status Updated',
          message: `Order status updated to ${status}`
        });
        return true;
      } else {
        showNotification({
          type: 'error',
          title: 'Update Failed',
          message: 'Failed to update order status'
        });
        return false;
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showNotification({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update order status. Please try again later.'
      });
      return false;
    }
  };

  const getOrderById = async (orderId: string): Promise<Order | null> => {
    try {
      // If direct login is enabled, return mock order
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Returning mock order');
        const mockOrder: Order = {
          id: orderId,
          orderNumber: 'ORD-001',
          userId: user?.id || 'mock-user-id',
          items: [],
          total: 299.99,
          subtotal: 279.99,
          taxAmount: 20.00,
          shippingAmount: 0,
          discountAmount: 0,
          status: 'delivered',
          paymentStatus: 'paid',
          paymentMethod: 'cash_on_delivery',
          shippingAddress: {
            fullName: 'John Doe',
            streetAddress: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'USA'
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return mockOrder;
      }

      // @ts-ignore - Type mismatch
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
      // If direct login is enabled, return mock orders
      const directLoginEnabled = import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true';
      if (directLoginEnabled) {
        console.log('🔧 Direct login mode: Returning mock user orders');
        const mockOrders: Order[] = [
          {
            id: '1',
            orderNumber: 'ORD-001',
            userId: targetUserId,
            items: [],
            total: 299.99,
            subtotal: 279.99,
            taxAmount: 20.00,
            shippingAmount: 0,
            discountAmount: 0,
            status: 'delivered',
            paymentStatus: 'paid',
            paymentMethod: 'cash_on_delivery',
            shippingAddress: {
              fullName: 'John Doe',
              streetAddress: '123 Main St',
              city: 'New York',
              state: 'NY',
              postalCode: '10001',
              country: 'USA'
            },
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        return mockOrders;
      }

      // @ts-ignore - Type mismatch
      const ordersData = await getOrders(targetUserId);
      // @ts-ignore - Type mismatch
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
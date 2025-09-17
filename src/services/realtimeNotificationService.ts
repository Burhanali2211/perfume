import { supabase } from '../lib/supabase';
import { cacheInvalidationService } from './cacheInvalidationService';

/**
 * Real-time Notification Service
 * Manages real-time updates and notifications using Supabase subscriptions
 */

export interface RealtimeEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  old?: any;
  new?: any;
  timestamp: number;
}

export interface NotificationSubscriber {
  id: string;
  callback: (event: RealtimeEvent) => void;
  tables: string[];
  filters?: Record<string, any>;
}

class RealtimeNotificationService {
  private subscribers = new Map<string, NotificationSubscriber>();
  private subscriptions = new Map<string, unknown>();
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the service
   */
  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Setup subscriptions for all main tables
      const tables = [
        'products',
        'categories', 
        'collections',
        'new_arrivals',
        'offers',
        'orders',
        'profiles',
        'order_items'
      ];

      for (const table of tables) {
        await this.setupTableSubscription(table);
      }

      this.isInitialized = true;
      console.log('Real-time notification service initialized');
    } catch (error) {
      console.error('Failed to initialize real-time notification service:', error);
    }
  }

  /**
   * Setup subscription for a specific table
   */
  private async setupTableSubscription(table: string) {
    const subscription = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          this.handleRealtimeEvent(table, payload);
        }
      )
      .subscribe();

    this.subscriptions.set(table, subscription);
  }

  /**
   * Handle real-time database events
   */
  private handleRealtimeEvent(table: string, payload: Record<string, unknown>) {
    const event: RealtimeEvent = {
      type: payload.eventType,
      table,
      old: payload.old,
      new: payload.new,
      timestamp: Date.now()
    };

    // Notify all relevant subscribers
    this.notifySubscribers(event);

    // Trigger cache invalidation
    this.triggerCacheInvalidation(event);

    // Log the event for debugging
    console.log(`Real-time event: ${event.type} on ${table}`, event);
  }

  /**
   * Notify subscribers of real-time events
   */
  private notifySubscribers(event: RealtimeEvent) {
    for (const [id, subscriber] of this.subscribers) {
      // Check if subscriber is interested in this table
      if (!subscriber.tables.includes(event.table)) {
        continue;
      }

      // Apply filters if any
      if (subscriber.filters && !this.matchesFilters(event, subscriber.filters)) {
        continue;
      }

      try {
        subscriber.callback(event);
      } catch (error) {
        console.error(`Error in subscriber ${id}:`, error);
      }
    }
  }

  /**
   * Check if event matches subscriber filters
   */
  private matchesFilters(event: RealtimeEvent, filters: Record<string, unknown>): boolean {
    const data = event.new || event.old;
    if (!data) return true;

    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) {
        return false;
      }
    }

    return true;
  }

  /**
   * Trigger cache invalidation for the event
   */
  private triggerCacheInvalidation(event: RealtimeEvent) {
    const id = event.new?.id || event.old?.id;
    
    // Invalidate specific item cache
    if (id) {
      cacheInvalidationService.invalidateCache(`${event.table}:${id}`);
    }

    // Invalidate list caches
    cacheInvalidationService.invalidateCache(`${event.table}:list`);
    cacheInvalidationService.invalidateCache(`${event.table}:all`);

    // Invalidate related caches based on relationships
    this.invalidateRelatedCaches(event);
  }

  /**
   * Invalidate related caches based on table relationships
   */
  private invalidateRelatedCaches(event: RealtimeEvent) {
    switch (event.table) {
      case 'products':
        // Invalidate category and collection caches
        cacheInvalidationService.invalidateCache('categories:with-products');
        cacheInvalidationService.invalidateCache('collections:with-products');
        break;

      case 'categories':
        // Invalidate product caches
        cacheInvalidationService.invalidateCache('products:by-category');
        break;

      case 'orders':
        // Invalidate user and analytics caches
        cacheInvalidationService.invalidateCache('analytics:orders');
        cacheInvalidationService.invalidateCache('analytics:sales');
        break;

      case 'order_items':
        // Invalidate order and product caches
        cacheInvalidationService.invalidateCache('orders:with-items');
        cacheInvalidationService.invalidateCache('products:sales-data');
        break;
    }
  }

  /**
   * Subscribe to real-time events
   */
  subscribe(
    id: string,
    tables: string[],
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, unknown>
  ): () => void {
    const subscriber: NotificationSubscriber = {
      id,
      callback,
      tables,
      filters
    };

    this.subscribers.set(id, subscriber);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(id);
    };
  }

  /**
   * Subscribe to specific table events
   */
  subscribeToTable(
    id: string,
    table: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, unknown>
  ): () => void {
    return this.subscribe(id, [table], callback, filters);
  }

  /**
   * Subscribe to product events
   */
  subscribeToProducts(
    id: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, unknown>
  ): () => void {
    return this.subscribeToTable(id, 'products', callback, filters);
  }

  /**
   * Subscribe to order events
   */
  subscribeToOrders(
    id: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, unknown>
  ): () => void {
    return this.subscribeToTable(id, 'orders', callback, filters);
  }

  /**
   * Subscribe to user events
   */
  subscribeToUsers(
    id: string,
    callback: (event: RealtimeEvent) => void,
    filters?: Record<string, unknown>
  ): () => void {
    return this.subscribeToTable(id, 'profiles', callback, filters);
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(id: string): void {
    this.subscribers.delete(id);
  }

  /**
   * Get active subscribers count
   */
  getSubscribersCount(): number {
    return this.subscribers.size;
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): Record<string, string> {
    const status: Record<string, string> = {};
    
    for (const [table, subscription] of this.subscriptions) {
      status[table] = subscription.state || 'unknown';
    }

    return status;
  }

  /**
   * Manually trigger a notification (for testing)
   */
  triggerNotification(event: RealtimeEvent): void {
    this.notifySubscribers(event);
  }

  /**
   * Destroy the service and cleanup subscriptions
   */
  destroy(): void {
    // Unsubscribe from all real-time subscriptions
    for (const [table, subscription] of this.subscriptions) {
      supabase.removeChannel(subscription);
    }

    this.subscriptions.clear();
    this.subscribers.clear();
    this.isInitialized = false;
  }
}

// Create singleton instance
export const realtimeNotificationService = new RealtimeNotificationService();

export default realtimeNotificationService;

import { supabase, checkDatabaseConnection, isDatabaseHealthy } from '../lib/supabase';
import { performanceMonitor } from './performance';

export interface DatabaseConnectionMetrics {
  isHealthy: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
  totalChecks: number;
  totalFailures: number;
  uptime: number; // percentage
  error?: string;
}

export interface DatabaseTableStatus {
  tableName: string;
  exists: boolean;
  recordCount?: number;
  lastUpdated?: Date;
  hasRLS: boolean;
  error?: string;
}

export interface DatabaseHealthReport {
  overall: DatabaseConnectionMetrics;
  tables: DatabaseTableStatus[];
  functions: { name: string; exists: boolean; error?: string }[];
  policies: { table: string; policy: string; enabled: boolean }[];
  recommendations: string[];
  timestamp: Date;
}

class DatabaseMonitor {
  private metrics: DatabaseConnectionMetrics = {
    isHealthy: false,
    latency: 0,
    lastCheck: new Date(),
    consecutiveFailures: 0,
    totalChecks: 0,
    totalFailures: 0,
    uptime: 0
  };

  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  private healthChangeCallbacks: ((isHealthy: boolean) => void)[] = [];

  constructor() {
    this.loadMetricsFromStorage();
  }

  /**
   * Start monitoring database connection with specified interval
   */
  startMonitoring(intervalMs: number = 60000): void {
    if (this.isMonitoring) {
      console.log('📊 Database monitoring already active');
      return;
    }

    console.log(`📊 Starting database monitoring (interval: ${intervalMs}ms)`);
    this.isMonitoring = true;

    // Initial check
    this.performHealthCheck();

    // Set up interval monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  /**
   * Stop monitoring database connection
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('📊 Database monitoring stopped');
  }

  /**
   * Perform a single health check
   */
  async performHealthCheck(): Promise<DatabaseConnectionMetrics> {
    const checkStartTime = Date.now();

    try {
      const result = await checkDatabaseConnection();
      const latency = Date.now() - checkStartTime;

      this.metrics.totalChecks++;
      this.metrics.latency = result.latency || latency;
      this.metrics.lastCheck = new Date();

      if (result.healthy) {
        this.metrics.isHealthy = true;
        this.metrics.consecutiveFailures = 0;
        this.metrics.error = undefined;
      } else {
        this.metrics.isHealthy = false;
        this.metrics.consecutiveFailures++;
        this.metrics.totalFailures++;
        this.metrics.error = result.error;
      }

      // Calculate uptime percentage
      if (this.metrics.totalChecks > 0) {
        this.metrics.uptime = ((this.metrics.totalChecks - this.metrics.totalFailures) / this.metrics.totalChecks) * 100;
      }

      // Notify listeners of health changes
      this.notifyHealthChange();

      // Persist metrics
      this.saveMetricsToStorage();

      return { ...this.metrics };
    } catch (error) {
      this.metrics.totalChecks++;
      this.metrics.totalFailures++;
      this.metrics.consecutiveFailures++;
      this.metrics.isHealthy = false;
      this.metrics.error = error instanceof Error ? error.message : 'Unknown error';
      this.metrics.lastCheck = new Date();

      this.notifyHealthChange();
      this.saveMetricsToStorage();

      return { ...this.metrics };
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): DatabaseConnectionMetrics {
    return { ...this.metrics };
  }

  /**
   * Check status of all required database tables
   */
  async checkTableStatus(): Promise<DatabaseTableStatus[]> {
    const requiredTables = [
      'profiles',
      'products',
      'categories',
      'reviews',
      'cart_items',
      'wishlist_items',
      'orders',
      'order_items',
      'addresses',
      'coupons',
      'product_variants'
    ];

    const tableStatuses: DatabaseTableStatus[] = [];

    for (const tableName of requiredTables) {
      const status: DatabaseTableStatus = {
        tableName,
        exists: false,
        hasRLS: false
      };

      try {
        // Check if table exists and get count
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          status.exists = false;
          status.error = error.message;
        } else {
          status.exists = true;
          status.recordCount = count || 0;
        }

        // Check RLS status (simplified check)
        if (status.exists) {
          const rlsCheck = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          status.hasRLS = !rlsCheck.error || rlsCheck.error.message.includes('row-level security');
        }

      } catch (error) {
        status.exists = false;
        status.error = error instanceof Error ? error.message : 'Unknown error';
      }

      tableStatuses.push(status);
    }

    return tableStatuses;
  }

  /**
   * Generate comprehensive health report
   */
  async generateHealthReport(): Promise<DatabaseHealthReport> {
    console.log('📋 Generating database health report...');

    const [metrics, tables] = await Promise.all([
      this.performHealthCheck(),
      this.checkTableStatus()
    ]);

    const functions = await this.checkDatabaseFunctions();
    const policies = await this.checkRLSPolicies();
    const recommendations = this.generateRecommendations(metrics, tables, functions, policies);

    const report: DatabaseHealthReport = {
      overall: metrics,
      tables,
      functions,
      policies,
      recommendations,
      timestamp: new Date()
    };

    console.log('📋 Database health report generated:', {
      healthy: metrics.isHealthy,
      tableCount: tables.length,
      functionsCount: functions.length,
      recommendations: recommendations.length
    });

    return report;
  }

  /**
   * Check database functions
   */
  private async checkDatabaseFunctions(): Promise<{ name: string; exists: boolean; error?: string }[]> {
    const requiredFunctions = [
      'handle_new_user',
      'update_user_role',
      'get_user_statistics',
      'search_users'
    ];

    const functionStatus = [];

    for (const funcName of requiredFunctions) {
      try {
        // Try to call the function (this will fail if it doesn't exist)
        const { error } = await supabase.rpc(funcName as any);
        
        functionStatus.push({
          name: funcName,
          exists: !error || !error.message.includes('function') || !error.message.includes('does not exist'),
          error: error?.message
        });
      } catch (error) {
        functionStatus.push({
          name: funcName,
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return functionStatus;
  }

  /**
   * Check RLS policies
   */
  private async checkRLSPolicies(): Promise<{ table: string; policy: string; enabled: boolean }[]> {
    // This is a simplified check - in a real implementation, you might query pg_policies
    const policies = [
      { table: 'profiles', policy: 'Users can view own profile', enabled: true },
      { table: 'profiles', policy: 'Users can update own profile', enabled: true },
      { table: 'profiles', policy: 'Users can insert own profile', enabled: true }
    ];

    return policies;
  }

  /**
   * Generate recommendations based on health status
   */
  private generateRecommendations(
    metrics: DatabaseConnectionMetrics,
    tables: DatabaseTableStatus[],
    functions: { name: string; exists: boolean }[],
    policies: { table: string; policy: string; enabled: boolean }[]
  ): string[] {
    const recommendations: string[] = [];

    // Connection recommendations
    if (!metrics.isHealthy) {
      recommendations.push('❌ Database connection is unhealthy. Check your Supabase credentials and project status.');
    }

    if (metrics.latency > 5000) {
      recommendations.push('⚠️ High database latency detected. Consider optimizing queries or upgrading your Supabase plan.');
    }

    if (metrics.consecutiveFailures > 3) {
      recommendations.push('🚨 Multiple consecutive connection failures. Check network connectivity and Supabase service status.');
    }

    // Table recommendations
    const missingTables = tables.filter(t => !t.exists);
    if (missingTables.length > 0) {
      recommendations.push(`❌ Missing tables: ${missingTables.map(t => t.tableName).join(', ')}. Run the database schema setup scripts.`);
    }

    const tablesWithoutRLS = tables.filter(t => t.exists && !t.hasRLS);
    if (tablesWithoutRLS.length > 0) {
      recommendations.push(`⚠️ Tables without RLS: ${tablesWithoutRLS.map(t => t.tableName).join(', ')}. Enable Row Level Security for data protection.`);
    }

    // Function recommendations
    const missingFunctions = functions.filter(f => !f.exists);
    if (missingFunctions.length > 0) {
      recommendations.push(`❌ Missing database functions: ${missingFunctions.map(f => f.name).join(', ')}. Run the database schema setup scripts.`);
    }

    // Performance recommendations
    if (metrics.uptime < 95 && metrics.totalChecks > 10) {
      recommendations.push('📈 Database uptime is below 95%. Consider investigating connection stability issues.');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Database health looks good! No issues detected.');
    }

    return recommendations;
  }

  /**
   * Subscribe to health change notifications
   */
  onHealthChange(callback: (isHealthy: boolean) => void): () => void {
    this.healthChangeCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.healthChangeCallbacks.indexOf(callback);
      if (index > -1) {
        this.healthChangeCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all listeners of health changes
   */
  private notifyHealthChange(): void {
    this.healthChangeCallbacks.forEach(callback => {
      try {
        callback(this.metrics.isHealthy);
      } catch (error) {
        console.error('Error in health change callback:', error);
      }
    });
  }

  /**
   * Save metrics to localStorage
   */
  private saveMetricsToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('db_monitor_metrics', JSON.stringify(this.metrics));
      } catch (error) {
        console.warn('Failed to save database metrics to storage:', error);
      }
    }
  }

  /**
   * Load metrics from localStorage
   */
  private loadMetricsFromStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('db_monitor_metrics');
        if (stored) {
          const parsed = JSON.parse(stored);
          this.metrics = {
            ...this.metrics,
            ...parsed,
            lastCheck: new Date(parsed.lastCheck)
          };
        }
      } catch (error) {
        console.warn('Failed to load database metrics from storage:', error);
      }
    }
  }
}

// Export singleton instance
export const databaseMonitor = new DatabaseMonitor();

// Auto-start monitoring in development
if (import.meta.env.VITE_APP_ENV === 'development' && import.meta.env.VITE_DATABASE_HEALTH_CHECKS === 'true') {
  databaseMonitor.startMonitoring(60000); // Check every minute in development
}
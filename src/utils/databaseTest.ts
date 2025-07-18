import { supabase, withTimeout } from '../lib/supabase';
import { performanceMonitor } from './performance';

export interface DatabaseTestResult {
  test: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

export class DatabaseTester {
  private results: DatabaseTestResult[] = [];

  async runAllTests(): Promise<DatabaseTestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting database connectivity tests...');
    
    // Test 1: Basic connection
    await this.testBasicConnection();
    
    // Test 2: Products minimal query
    await this.testProductsMinimal();
    
    // Test 3: Products basic query
    await this.testProductsBasic();
    
    // Test 4: Categories query
    await this.testCategories();
    
    // Test 5: Authentication query
    await this.testAuthentication();
    
    // Test 6: Complex join query
    await this.testComplexQuery();
    
    console.log('🧪 Database tests completed:', this.results);
    return this.results;
  }

  private async testBasicConnection(): Promise<void> {
    const testName = 'Basic Connection';
    performanceMonitor.startMeasure(testName);
    
    try {
      const { data, error } = await withTimeout(
        supabase.from('profiles').select('count').limit(1),
        2000,
        'Basic connection timeout'
      );
      
      const duration = performanceMonitor.endMeasure(testName, !error);
      
      this.results.push({
        test: testName,
        success: !error,
        duration,
        error: error?.message,
        details: data
      });
    } catch (error) {
      const duration = performanceMonitor.endMeasure(testName, false);
      this.results.push({
        test: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testProductsMinimal(): Promise<void> {
    const testName = 'Products Minimal Query';
    performanceMonitor.startMeasure(testName);
    
    try {
      const query = supabase
        .from('products')
        .select('id, name, slug, price, original_price, images, stock, is_featured, category_id')
        .eq('is_active', true)
        .limit(10)
        .order('created_at', { ascending: false });
      
      const { data, error } = await withTimeout(query, 3000, 'Products minimal timeout');
      
      const duration = performanceMonitor.endMeasure(testName, !error);
      
      this.results.push({
        test: testName,
        success: !error,
        duration,
        error: error?.message,
        details: { count: data?.length || 0 }
      });
    } catch (error) {
      const duration = performanceMonitor.endMeasure(testName, false);
      this.results.push({
        test: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testProductsBasic(): Promise<void> {
    const testName = 'Products Basic Query';
    performanceMonitor.startMeasure(testName);
    
    try {
      const query = supabase
        .from('products')
        .select(`
          id, name, slug, price, original_price, images, stock, is_featured, 
          category_id, seller_id, created_at,
          categories!inner(id, name, slug)
        `)
        .eq('is_active', true)
        .limit(10)
        .order('created_at', { ascending: false });
      
      const { data, error } = await withTimeout(query, 4000, 'Products basic timeout');
      
      const duration = performanceMonitor.endMeasure(testName, !error);
      
      this.results.push({
        test: testName,
        success: !error,
        duration,
        error: error?.message,
        details: { count: data?.length || 0 }
      });
    } catch (error) {
      const duration = performanceMonitor.endMeasure(testName, false);
      this.results.push({
        test: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testCategories(): Promise<void> {
    const testName = 'Categories Query';
    performanceMonitor.startMeasure(testName);
    
    try {
      const query = supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      const { data, error } = await withTimeout(query, 5000, 'Categories timeout');
      
      const duration = performanceMonitor.endMeasure(testName, !error);
      
      this.results.push({
        test: testName,
        success: !error,
        duration,
        error: error?.message,
        details: { count: data?.length || 0 }
      });
    } catch (error) {
      const duration = performanceMonitor.endMeasure(testName, false);
      this.results.push({
        test: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testAuthentication(): Promise<void> {
    const testName = 'Authentication Query';
    performanceMonitor.startMeasure(testName);
    
    try {
      const { data: { user }, error } = await withTimeout(
        supabase.auth.getUser(),
        3000,
        'Auth query timeout'
      );
      
      const duration = performanceMonitor.endMeasure(testName, !error);
      
      this.results.push({
        test: testName,
        success: !error,
        duration,
        error: error?.message,
        details: { hasUser: !!user }
      });
    } catch (error) {
      const duration = performanceMonitor.endMeasure(testName, false);
      this.results.push({
        test: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async testComplexQuery(): Promise<void> {
    const testName = 'Complex Join Query';
    performanceMonitor.startMeasure(testName);
    
    try {
      const query = supabase
        .from('products')
        .select(`
          *,
          categories(name, slug),
          profiles(full_name),
          reviews(rating, comment)
        `)
        .eq('is_active', true)
        .limit(5);
      
      const { data, error } = await withTimeout(query, 8000, 'Complex query timeout');
      
      const duration = performanceMonitor.endMeasure(testName, !error);
      
      this.results.push({
        test: testName,
        success: !error,
        duration,
        error: error?.message,
        details: { count: data?.length || 0 }
      });
    } catch (error) {
      const duration = performanceMonitor.endMeasure(testName, false);
      this.results.push({
        test: testName,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  getResults(): DatabaseTestResult[] {
    return this.results;
  }

  getSummary() {
    const total = this.results.length;
    const successful = this.results.filter(r => r.success).length;
    const failed = total - successful;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;
    
    return {
      total,
      successful,
      failed,
      successRate: (successful / total) * 100,
      averageDuration: avgDuration,
      slowestTest: this.results.reduce((slowest, current) => 
        current.duration > slowest.duration ? current : slowest
      ),
      fastestTest: this.results.reduce((fastest, current) => 
        current.duration < fastest.duration ? current : fastest
      )
    };
  }
}

export const databaseTester = new DatabaseTester();

/**
 * Performance testing utilities for validating improvements
 */

import { performanceMonitor } from './performance';
import { productCache, categoryCache } from './cache';
import { backgroundRefreshManager } from './backgroundRefresh';
import { dataPreloader } from './preloader';

interface PerformanceTestResult {
  testName: string;
  duration: number;
  success: boolean;
  details?: Record<string, unknown>;
  timestamp: number;
}

class PerformanceTestSuite {
  private results: PerformanceTestResult[] = [];

  /**
   * Test scroll-to-top functionality
   */
  async testScrollToTop(): Promise<PerformanceTestResult> {
    const testName = 'Scroll to Top';
    const startTime = performance.now();
    
    try {
      // Simulate scroll down
      window.scrollTo(0, 1000);
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const scrollBefore = window.scrollY;
      
      // Trigger scroll to top
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const scrollAfter = window.scrollY;
      const duration = performance.now() - startTime;
      
      const success = scrollAfter === 0;
      
      const result: PerformanceTestResult = {
        testName,
        duration,
        success,
        details: { scrollBefore, scrollAfter },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: PerformanceTestResult = {
        testName,
        duration,
        success: false,
        details: { error: error.message },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test cache performance
   */
  async testCachePerformance(): Promise<PerformanceTestResult> {
    const testName = 'Cache Performance';
    const startTime = performance.now();
    
    try {
      // Test cache set/get operations
      const testData = { id: 'test', name: 'Test Product' };
      const cacheKey = 'test-product';
      
      // Set data
      productCache.set(cacheKey, testData);
      
      // Get data multiple times to test performance
      const iterations = 1000;
      let retrievedData;
      
      for (let i = 0; i < iterations; i++) {
        retrievedData = productCache.get(cacheKey);
      }
      
      const duration = performance.now() - startTime;
      const success = retrievedData && retrievedData.id === 'test';
      
      // Clean up
      productCache.delete(cacheKey);
      
      const result: PerformanceTestResult = {
        testName,
        duration,
        success,
        details: { 
          iterations, 
          avgTimePerOperation: duration / iterations,
          cacheStats: productCache.getStats()
        },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: PerformanceTestResult = {
        testName,
        duration,
        success: false,
        details: { error: error.message },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test preloader functionality
   */
  async testPreloader(): Promise<PerformanceTestResult> {
    const testName = 'Preloader Performance';
    const startTime = performance.now();
    
    try {
      // Get initial stats
      const initialStats = dataPreloader.getStats();
      
      // Trigger preload
      await dataPreloader.preloadEssentials();
      
      // Wait a bit for preload to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const finalStats = dataPreloader.getStats();
      const duration = performance.now() - startTime;
      
      const success = finalStats.preloadedItems > initialStats.preloadedItems;
      
      const result: PerformanceTestResult = {
        testName,
        duration,
        success,
        details: { 
          initialStats, 
          finalStats,
          itemsPreloaded: finalStats.preloadedItems - initialStats.preloadedItems
        },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: PerformanceTestResult = {
        testName,
        duration,
        success: false,
        details: { error: error.message },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test background refresh
   */
  async testBackgroundRefresh(): Promise<PerformanceTestResult> {
    const testName = 'Background Refresh';
    const startTime = performance.now();
    
    try {
      // Get initial status
      const initialStatus = backgroundRefreshManager.getStatus();
      
      // Force a refresh
      await backgroundRefreshManager.forceRefresh('products');
      
      const finalStatus = backgroundRefreshManager.getStatus();
      const duration = performance.now() - startTime;
      
      const success = duration < 10000; // Should complete within 10 seconds
      
      const result: PerformanceTestResult = {
        testName,
        duration,
        success,
        details: { 
          initialStatus, 
          finalStatus,
          refreshCompleted: true
        },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      const result: PerformanceTestResult = {
        testName,
        duration,
        success: false,
        details: { error: error.message },
        timestamp: Date.now()
      };
      
      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all performance tests
   */
  async runAllTests(): Promise<PerformanceTestResult[]> {
    console.log('🧪 Starting performance test suite...');
    
    const tests = [
      () => this.testScrollToTop(),
      () => this.testCachePerformance(),
      () => this.testPreloader(),
      () => this.testBackgroundRefresh()
    ];

    const results: PerformanceTestResult[] = [];

    for (const test of tests) {
      try {
        const result = await test();
        results.push(result);
        console.log(`${result.success ? '✅' : '❌'} ${result.testName}: ${result.duration.toFixed(2)}ms`);
      } catch (error) {
        console.error(`❌ Test failed:`, error);
      }
    }

    this.generateReport(results);
    return results;
  }

  /**
   * Generate performance report
   */
  private generateReport(results: PerformanceTestResult[]) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / totalTests;

    console.log('\n📊 Performance Test Report');
    console.log('========================');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Average Duration: ${avgDuration.toFixed(2)}ms`);
    
    // Cache statistics
    console.log('\n💾 Cache Statistics');
    console.log('==================');
    console.log('Product Cache:', productCache.getStats());
    console.log('Category Cache:', categoryCache.getStats());
    
    // Performance monitor statistics
    console.log('\n⚡ Performance Monitor');
    console.log('====================');
    console.log(performanceMonitor.getStats());
    
    // Background refresh status
    console.log('\n🔄 Background Refresh Status');
    console.log('===========================');
    console.log(backgroundRefreshManager.getStatus());
  }

  /**
   * Get test results
   */
  getResults(): PerformanceTestResult[] {
    return this.results;
  }

  /**
   * Clear test results
   */
  clearResults(): void {
    this.results = [];
  }
}

// Create singleton instance
export const performanceTestSuite = new PerformanceTestSuite();

// Expose to window for manual testing
if (typeof window !== 'undefined') {
  (window as Record<string, unknown>).performanceTest = performanceTestSuite;
  console.log('🧪 Performance test suite available at window.performanceTest');
}

export default performanceTestSuite;

import { performanceMonitor } from './performance';

interface WebVitalsMetric {
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB';
  value: number;
  delta: number;
  id: string;
  timestamp: number;
}

interface PerformanceEntry {
  name: string;
  duration: number;
  startTime: number;
  entryType: string;
}

interface NetworkInfo {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

class EnhancedPerformanceMonitor {
  private static instance: EnhancedPerformanceMonitor;
  private webVitalsMetrics: WebVitalsMetric[] = [];
  private resourceTimings: PerformanceEntry[] = [];
  private networkInfo: NetworkInfo = {};
  private memoryUsage: number[] = [];
  private isMonitoring = false;

  static getInstance(): EnhancedPerformanceMonitor {
    if (!EnhancedPerformanceMonitor.instance) {
      EnhancedPerformanceMonitor.instance = new EnhancedPerformanceMonitor();
    }
    return EnhancedPerformanceMonitor.instance;
  }

  private constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    if (typeof window === 'undefined') return;

    this.isMonitoring = true;
    this.setupWebVitals();
    this.setupResourceTimingObserver();
    this.setupNetworkMonitoring();
    this.setupMemoryMonitoring();
    this.setupNavigationTiming();
  }

  private setupWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observePerformanceEntry('largest-contentful-paint', (entries) => {
      const entry = entries[entries.length - 1];
      this.recordWebVital('LCP', entry.startTime, entry.startTime);
    });

    // First Input Delay (FID)
    this.observePerformanceEntry('first-input', (entries) => {
      const entry = entries[0];
      this.recordWebVital('FID', entry.processingStart - entry.startTime, entry.processingStart - entry.startTime);
    });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    this.observePerformanceEntry('layout-shift', (entries) => {
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordWebVital('CLS', clsValue, clsValue);
    });

    // First Contentful Paint (FCP)
    this.observePerformanceEntry('paint', (entries) => {
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.recordWebVital('FCP', fcpEntry.startTime, fcpEntry.startTime);
      }
    });

    // Time to First Byte (TTFB)
    if (performance.timing) {
      const ttfb = performance.timing.responseStart - performance.timing.requestStart;
      this.recordWebVital('TTFB', ttfb, ttfb);
    }
  }

  private observePerformanceEntry(type: string, callback: (entries: PerformanceEntry[]) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Failed to observe ${type}:`, error);
    }
  }

  private recordWebVital(name: WebVitalsMetric['name'], value: number, delta: number): void {
    const metric: WebVitalsMetric = {
      name,
      value,
      delta,
      id: `${name}-${Date.now()}`,
      timestamp: Date.now()
    };
    
    this.webVitalsMetrics.push(metric);
    
    // Log critical metrics
    if (name === 'LCP' && value > 2500) {
      console.warn(`⚠️ Poor LCP: ${value.toFixed(2)}ms (should be < 2500ms)`);
    }
    if (name === 'FID' && value > 100) {
      console.warn(`⚠️ Poor FID: ${value.toFixed(2)}ms (should be < 100ms)`);
    }
    if (name === 'CLS' && value > 0.1) {
      console.warn(`⚠️ Poor CLS: ${value.toFixed(3)} (should be < 0.1)`);
    }
  }

  private setupResourceTimingObserver(): void {
    if (!window.PerformanceObserver) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.resourceTimings.push({
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            entryType: entry.entryType
          });

          // Warn about slow resources
          if (entry.duration > 1000) {
            console.warn(`🐌 Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Failed to setup resource timing observer:', error);
    }
  }

  private setupNetworkMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.networkInfo = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };

      // Monitor network changes
      connection.addEventListener('change', () => {
        this.networkInfo = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
        
        console.log('📡 Network changed:', this.networkInfo);
      });
    }
  }

  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      const recordMemory = () => {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
        this.memoryUsage.push(memoryUsage);

        // Keep only last 100 measurements
        if (this.memoryUsage.length > 100) {
          this.memoryUsage.shift();
        }

        // Warn about high memory usage
        if (memoryUsage > 100) {
          console.warn(`🧠 High memory usage: ${memoryUsage.toFixed(2)}MB`);
        }
      };

      // Record memory usage every 30 seconds
      setInterval(recordMemory, 30000);
      recordMemory(); // Initial measurement
    }
  }

  private setupNavigationTiming(): void {
    if (performance.timing) {
      const timing = performance.timing;
      const navigationStart = timing.navigationStart;

      const metrics = {
        dns: timing.domainLookupEnd - timing.domainLookupStart,
        tcp: timing.connectEnd - timing.connectStart,
        ssl: timing.secureConnectionStart > 0 ? timing.connectEnd - timing.secureConnectionStart : 0,
        ttfb: timing.responseStart - timing.requestStart,
        download: timing.responseEnd - timing.responseStart,
        domReady: timing.domContentLoadedEventEnd - navigationStart,
        loadComplete: timing.loadEventEnd - navigationStart
      };

      console.log('🕐 Navigation Timing:', metrics);
    }
  }

  public getWebVitalsReport(): {
    current: WebVitalsMetric[];
    summary: Record<string, { avg: number; latest: number; threshold: string; status: 'good' | 'needs-improvement' | 'poor' }>;
  } {
    const summary: Record<string, any> = {};
    
    ['LCP', 'FID', 'FCP', 'CLS', 'TTFB'].forEach(metricName => {
      const metrics = this.webVitalsMetrics.filter(m => m.name === metricName);
      if (metrics.length > 0) {
        const values = metrics.map(m => m.value);
        const latest = values[values.length - 1];
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        let threshold = '';
        let status: 'good' | 'needs-improvement' | 'poor' = 'good';
        
        switch (metricName) {
          case 'LCP':
            threshold = '< 2500ms';
            status = latest > 4000 ? 'poor' : latest > 2500 ? 'needs-improvement' : 'good';
            break;
          case 'FID':
            threshold = '< 100ms';
            status = latest > 300 ? 'poor' : latest > 100 ? 'needs-improvement' : 'good';
            break;
          case 'CLS':
            threshold = '< 0.1';
            status = latest > 0.25 ? 'poor' : latest > 0.1 ? 'needs-improvement' : 'good';
            break;
          case 'FCP':
            threshold = '< 1800ms';
            status = latest > 3000 ? 'poor' : latest > 1800 ? 'needs-improvement' : 'good';
            break;
          case 'TTFB':
            threshold = '< 800ms';
            status = latest > 1800 ? 'poor' : latest > 800 ? 'needs-improvement' : 'good';
            break;
        }
        
        summary[metricName] = { avg, latest, threshold, status };
      }
    });
    
    return {
      current: this.webVitalsMetrics,
      summary
    };
  }

  public getResourceTimingReport(): {
    slowest: PerformanceEntry[];
    byType: Record<string, { count: number; avgDuration: number; totalSize?: number }>;
    recommendations: string[];
  } {
    const slowest = [...this.resourceTimings]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    const byType: Record<string, any> = {};
    this.resourceTimings.forEach(entry => {
      const type = this.getResourceType(entry.name);
      if (!byType[type]) {
        byType[type] = { count: 0, totalDuration: 0 };
      }
      byType[type].count++;
      byType[type].totalDuration += entry.duration;
    });

    Object.keys(byType).forEach(type => {
      byType[type].avgDuration = byType[type].totalDuration / byType[type].count;
      delete byType[type].totalDuration;
    });

    const recommendations = this.generateRecommendations();

    return { slowest, byType, recommendations };
  }

  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'JavaScript';
    if (url.includes('.css')) return 'CSS';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i)) return 'Image';
    if (url.includes('font')) return 'Font';
    if (url.includes('api/') || url.includes('/api/')) return 'API';
    return 'Other';
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const report = this.getWebVitalsReport();
    
    if (report.summary.LCP?.status !== 'good') {
      recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and server response times');
    }
    
    if (report.summary.CLS?.status !== 'good') {
      recommendations.push('Reduce Cumulative Layout Shift by setting dimensions for images and ads');
    }
    
    if (report.summary.FID?.status !== 'good') {
      recommendations.push('Improve First Input Delay by reducing JavaScript execution time');
    }

    const slowResources = this.resourceTimings.filter(r => r.duration > 1000);
    if (slowResources.length > 0) {
      recommendations.push(`Optimize ${slowResources.length} slow-loading resources`);
    }

    if (this.memoryUsage.length > 0) {
      const avgMemory = this.memoryUsage.reduce((sum, val) => sum + val, 0) / this.memoryUsage.length;
      if (avgMemory > 80) {
        recommendations.push('Consider optimizing memory usage to reduce JavaScript heap size');
      }
    }

    // Add specific recommendations for this e-commerce site
    recommendations.push('Remove heavy animations that impact performance');
    recommendations.push('Optimize image loading with lazy loading');
    recommendations.push('Reduce bundle size by code splitting');
    recommendations.push('Implement proper caching strategies');

    return recommendations;
  }

  public getNetworkInfo(): NetworkInfo {
    return { ...this.networkInfo };
  }

  public getMemoryReport(): {
    current: number;
    average: number;
    peak: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  } {
    if (this.memoryUsage.length === 0) {
      return { current: 0, average: 0, peak: 0, trend: 'stable' };
    }

    const current = this.memoryUsage[this.memoryUsage.length - 1];
    const average = this.memoryUsage.reduce((sum, val) => sum + val, 0) / this.memoryUsage.length;
    const peak = Math.max(...this.memoryUsage);
    
    let trend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    if (this.memoryUsage.length >= 5) {
      const recent = this.memoryUsage.slice(-5);
      const oldAvg = recent.slice(0, 2).reduce((sum, val) => sum + val, 0) / 2;
      const newAvg = recent.slice(-2).reduce((sum, val) => sum + val, 0) / 2;
      
      if (newAvg > oldAvg * 1.1) trend = 'increasing';
      else if (newAvg < oldAvg * 0.9) trend = 'decreasing';
    }

    return { current, average, peak, trend };
  }

  public generatePerformanceReport(): {
    webVitals: ReturnType<EnhancedPerformanceMonitor['getWebVitalsReport']>;
    resources: ReturnType<EnhancedPerformanceMonitor['getResourceTimingReport']>;
    network: NetworkInfo;
    memory: ReturnType<EnhancedPerformanceMonitor['getMemoryReport']>;
    score: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  } {
    const webVitals = this.getWebVitalsReport();
    const resources = this.getResourceTimingReport();
    const network = this.getNetworkInfo();
    const memory = this.getMemoryReport();

    // Calculate overall performance score
    let score = 100;
    
    Object.values(webVitals.summary).forEach(metric => {
      if (metric.status === 'poor') score -= 20;
      else if (metric.status === 'needs-improvement') score -= 10;
    });

    if (resources.slowest.length > 5) score -= 10;
    if (memory.trend === 'increasing') score -= 5;

    score = Math.max(0, score);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';
    else grade = 'F';

    return {
      webVitals,
      resources,
      network,
      memory,
      score,
      grade
    };
  }
}

export const enhancedPerformanceMonitor = EnhancedPerformanceMonitor.getInstance();

// Export for use in React components
export const usePerformanceMonitor = () => {
  return {
    getReport: () => enhancedPerformanceMonitor.generatePerformanceReport(),
    getWebVitals: () => enhancedPerformanceMonitor.getWebVitalsReport(),
    getMemoryReport: () => enhancedPerformanceMonitor.getMemoryReport(),
    getNetworkInfo: () => enhancedPerformanceMonitor.getNetworkInfo()
  };
};
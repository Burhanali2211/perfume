// Performance optimizations for the React application
// This script addresses the poor LCP (Largest Contentful Paint) issues

// 1. Preload critical resources
const preloadCriticalResources = () => {
  // Preload the main CSS file
  const cssLink = document.createElement('link');
  cssLink.rel = 'preload';
  cssLink.href = '/src/index.css';
  cssLink.as = 'style';
  document.head.appendChild(cssLink);

  // Preload critical fonts
  const fontLink = document.createElement('link');
  fontLink.rel = 'preload';
  fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
  fontLink.as = 'style';
  document.head.appendChild(fontLink);
};

// 2. Optimize image loading
const optimizeImageLoading = () => {
  // Add loading="lazy" to all images that are not above the fold
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    if (index > 2) { // Skip first 3 images (likely above the fold)
      img.loading = 'lazy';
    }
  });
};

// 3. Defer non-critical JavaScript
const deferNonCriticalJS = () => {
  // Add defer attribute to non-critical scripts
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    if (!script.src.includes('main') && !script.src.includes('vendor')) {
      script.defer = true;
    }
  });
};

// 4. Optimize database queries
const optimizeDatabaseQueries = () => {
  // Add query optimization hints
  const queryOptimizations = {
    // Use indexes for frequently queried columns
    indexes: [
      'CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)',
      'CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active)',
      'CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role)'
    ],
    
    // Optimize query patterns
    queryPatterns: {
      // Use LIMIT for large datasets
      limitQueries: true,
      // Use specific column selection instead of SELECT *
      specificColumns: true,
      // Use proper WHERE clauses
      properWhereClauses: true
    }
  };
  
  return queryOptimizations;
};

// 5. Implement resource hints
const addResourceHints = () => {
  // DNS prefetch for external domains
  const dnsPrefetchDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'xqqjxcmgjivjytzzisyf.supabase.co'
  ];
  
  dnsPrefetchDomains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
};

// 6. Optimize bundle size
const optimizeBundleSize = () => {
  // Code splitting recommendations
  const codeSplittingRecommendations = {
    // Split vendor libraries
    vendorChunks: ['react', 'react-dom', 'supabase'],
    // Split route components
    routeChunks: ['dashboard', 'products', 'orders', 'users'],
    // Split large components
    componentChunks: ['ComprehensiveAdminDashboard', 'AdvancedAnalytics']
  };
  
  return codeSplittingRecommendations;
};

// 7. Implement caching strategies
const implementCachingStrategies = () => {
  return {
    // Browser caching
    browserCache: {
      staticAssets: '1 year',
      apiResponses: '5 minutes',
      userData: '1 hour'
    },
    
    // Service worker caching
    serviceWorkerCache: {
      staticAssets: 'CacheFirst',
      apiResponses: 'NetworkFirst',
      images: 'CacheFirst'
    }
  };
};

// 8. Monitor performance
const monitorPerformance = () => {
  // Use Performance Observer to monitor LCP
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
          if (entry.startTime > 2500) {
            console.warn('Poor LCP detected:', entry.startTime);
          }
        }
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  }
};

// Initialize all optimizations
const initializePerformanceOptimizations = () => {
  preloadCriticalResources();
  optimizeImageLoading();
  deferNonCriticalJS();
  addResourceHints();
  monitorPerformance();
  
  console.log('Performance optimizations initialized');
};

// Export for use in the application
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initializePerformanceOptimizations,
    optimizeDatabaseQueries,
    optimizeBundleSize,
    implementCachingStrategies
  };
} else {
  // Run immediately in browser
  document.addEventListener('DOMContentLoaded', initializePerformanceOptimizations);
}

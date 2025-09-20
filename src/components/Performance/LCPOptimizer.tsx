import React, { useEffect, useRef } from 'react';

interface LCPOptimizerProps {
  children: React.ReactNode;
  priority?: 'high' | 'medium' | 'low';
  preloadImages?: string[];
  criticalCSS?: string;
}

/**
 * LCP Optimizer Component
 * Helps improve Largest Contentful Paint (LCP) performance
 */
export const LCPOptimizer: React.FC<LCPOptimizerProps> = ({
  children,
  priority = 'medium',
  preloadImages = [],
  criticalCSS
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Preload critical images
    preloadImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = priority;
      document.head.appendChild(link);
    });

    // Inject critical CSS if provided
    if (criticalCSS) {
      const style = document.createElement('style');
      style.textContent = criticalCSS;
      style.setAttribute('data-critical', 'true');
      document.head.appendChild(style);
    }

    // Set up intersection observer for lazy loading optimization
    if ('IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Mark as visible for potential optimizations
              entry.target.setAttribute('data-visible', 'true');
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: 0.1
        }
      );

      if (containerRef.current) {
        observerRef.current.observe(containerRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [preloadImages, criticalCSS, priority]);

  return (
    <div 
      ref={containerRef}
      className="lcp-optimized"
      style={{
        // Optimize for LCP
        contentVisibility: 'auto',
        containIntrinsicSize: '1px 1000px'
      }}
    >
      {children}
    </div>
  );
};

/**
 * Image component optimized for LCP
 */
interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  onLoad,
  onError
}) => {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority && src) {
      // Preload high-priority images
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    }
  }, [src, priority]);

  return (
    <img
      ref={imgRef}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={onLoad}
      onError={onError}
      style={{
        // Prevent layout shift
        ...(width && height && {
          aspectRatio: `${width} / ${height}`
        })
      }}
    />
  );
};

/**
 * Critical resource preloader
 */
export const ResourcePreloader: React.FC<{
  resources: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
}> = ({ resources }) => {
  useEffect(() => {
    resources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource.href;
      link.as = resource.as;
      
      if (resource.type) {
        link.type = resource.type;
      }
      
      if (resource.crossOrigin) {
        link.crossOrigin = resource.crossOrigin;
      }
      
      document.head.appendChild(link);
    });
  }, [resources]);

  return null;
};

/**
 * Performance hints component
 */
export const PerformanceHints: React.FC = () => {
  useEffect(() => {
    // Add DNS prefetch for external domains
    const domains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];

    domains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Add preconnect for critical third-party origins
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ];

    preconnectDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = domain;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }, []);

  return null;
};

/**
 * LCP measurement and reporting
 */
export const LCPMonitor: React.FC = () => {
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        if (lastEntry) {
          const lcpTime = lastEntry.startTime;
          
          // Log LCP time
          console.log(`🎯 LCP: ${lcpTime.toFixed(2)}ms`);
          
          // Report to analytics if needed
          if (lcpTime > 2500) {
            console.warn(`⚠️ Poor LCP: ${lcpTime.toFixed(2)}ms (should be < 2500ms)`);
          } else if (lcpTime > 4000) {
            console.error(`❌ Very poor LCP: ${lcpTime.toFixed(2)}ms (should be < 2500ms)`);
          } else {
            console.log(`✅ Good LCP: ${lcpTime.toFixed(2)}ms`);
          }
        }
      });

      try {
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (error) {
        console.warn('LCP monitoring not supported:', error);
      }

      return () => observer.disconnect();
    }
  }, []);

  return null;
};

/**
 * Combined performance optimization wrapper
 */
export const PerformanceOptimizer: React.FC<{
  children: React.ReactNode;
  enableLCPMonitoring?: boolean;
  preloadResources?: Array<{
    href: string;
    as: 'script' | 'style' | 'image' | 'font';
    type?: string;
    crossOrigin?: 'anonymous' | 'use-credentials';
  }>;
  criticalImages?: string[];
}> = ({
  children,
  enableLCPMonitoring = true,
  preloadResources = [],
  criticalImages = []
}) => {
  return (
    <>
      <PerformanceHints />
      {enableLCPMonitoring && <LCPMonitor />}
      {preloadResources.length > 0 && <ResourcePreloader resources={preloadResources} />}
      <LCPOptimizer preloadImages={criticalImages}>
        {children}
      </LCPOptimizer>
    </>
  );
};

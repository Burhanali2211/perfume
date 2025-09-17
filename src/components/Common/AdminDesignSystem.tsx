import React from 'react';
import { LucideIcon } from 'lucide-react';

// Design System Constants
export const DESIGN_TOKENS = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      900: '#1e3a8a'
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d'
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309'
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c'
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827'
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem'
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75'
    }
  }
};

// Responsive Grid Classes
export const RESPONSIVE_GRID_CLASSES = {
  container: 'w-full mx-auto px-4 sm:px-6 lg:px-8',
  heading: 'text-2xl font-bold leading-tight text-gray-900 sm:text-3xl',
  subheading: 'text-lg font-medium leading-6 text-gray-900',
  dashboardCards: 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  metricsGrid: 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4',
  tableGrid: 'grid grid-cols-1 gap-6',
  formGrid: 'grid grid-cols-1 gap-6',
  settingsGrid: 'grid grid-cols-1 gap-6',
  
  // Enhanced responsive classes for better mobile experience
  mobileOptimized: 'w-full max-w-full overflow-x-hidden',
  tabletOptimized: 'w-full max-w-full',
  desktopOptimized: 'max-w-7xl mx-auto',
  
  // Breakpoint-specific classes
  xs: 'max-w-xs mx-auto',
  sm: 'max-w-sm mx-auto',
  md: 'max-w-md mx-auto',
  lg: 'max-w-lg mx-auto',
  xl: 'max-w-xl mx-auto',
  '2xl': 'max-w-2xl mx-auto',
  '3xl': 'max-w-3xl mx-auto',
  '4xl': 'max-w-4xl mx-auto',
  '5xl': 'max-w-5xl mx-auto',
  '6xl': 'max-w-6xl mx-auto',
  '7xl': 'max-w-7xl mx-auto'
};

// Standardized Component Interfaces
export interface AdminCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: 'sm' | 'md' | 'lg';
}

export interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

export interface AdminTableProps {
  columns: Array<{
    key: string;
    label: string;
    sortable?: boolean;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }>;
  data: Array<Record<string, any>>;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  selection?: {
    selectedItems: string[];
    onSelectionChange: (items: string[]) => void;
  };
  actions?: Array<{
    label: string;
    icon?: LucideIcon;
    onClick: (item: any) => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  className?: string;
}

export interface AdminMetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  icon?: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  loading?: boolean;
  className?: string;
}

export interface AdminFilterBarProps {
  filters: Array<{
    key: string;
    label: string;
    type: 'text' | 'select' | 'date' | 'daterange';
    options?: Array<{ value: string; label: string }>;
    value: any;
    onChange: (value: any) => void;
  }>;
  searchPlaceholder?: string;
  onReset?: () => void;
  className?: string;
}

// Standardized Admin Card Component
export const AdminCard: React.FC<AdminCardProps> = ({
  children,
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
  padding = 'md',
  shadow = 'sm'
}) => {
  const paddingClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const shadowClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${shadowClasses[shadow]} ${paddingClasses[padding]} ${className}`}>
      {(title || subtitle || Icon || actions) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            {Icon && (
              <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                <Icon className="h-6 w-6 text-indigo-600" />
              </div>
            )}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

// Standardized Admin Header Component
export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumbs,
  className = ''
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {breadcrumbs && (
        <nav className="flex" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="text-gray-400 mx-2">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-sm text-gray-500 hover:text-gray-700">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-sm text-gray-900 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center">
          {Icon && <Icon className="h-8 w-8 mr-3 text-indigo-600" />}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
    </div>
  );
};

// Standardized Admin Metric Card Component
export const AdminMetricCard: React.FC<AdminMetricCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = 'blue',
  loading = false,
  className = ''
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600',
    gray: 'bg-gray-100 text-gray-600'
  };

  const changeColorClasses = {
    increase: 'text-green-600',
    decrease: 'text-red-600',
    neutral: 'text-gray-600'
  };

  if (loading) {
    return (
      <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center">
            <div className="p-2 bg-gray-200 rounded-lg">
              <div className="h-6 w-6 bg-gray-300 rounded"></div>
            </div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-8 bg-gray-300 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="flex items-center">
        {Icon && (
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className={Icon ? 'ml-4' : ''}>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline">
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {change && (
              <div className={`ml-2 flex items-center text-sm ${changeColorClasses[change.type]}`}>
                <span>{change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}{Math.abs(change.value)}%</span>
                {change.period && <span className="text-gray-500 ml-1">vs {change.period}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Performance Optimization Utilities
export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return React.useCallback(callback, deps);
};

// Accessibility Utilities
export const ARIA_LABELS = {
  loading: 'Loading content',
  error: 'Error occurred',
  success: 'Operation successful',
  warning: 'Warning message',
  search: 'Search',
  filter: 'Filter options',
  sort: 'Sort options',
  pagination: 'Pagination navigation',
  actions: 'Available actions',
  menu: 'Navigation menu',
  close: 'Close',
  expand: 'Expand',
  collapse: 'Collapse'
};

export const getAriaLabel = (key: keyof typeof ARIA_LABELS): string => {
  return ARIA_LABELS[key];
};

// Responsive Design Utilities
export const BREAKPOINTS = {
  xs: 0,      // 0px and up
  sm: 640,    // 640px and up
  md: 768,    // 768px and up
  lg: 1024,   // 1024px and up
  xl: 1280,   // 1280px and up
  '2xl': 1536 // 1536px and up
};

export const useResponsive = () => {
  const [screenSize, setScreenSize] = React.useState<'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'>('lg');

  React.useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 640) setScreenSize('xs');
      else if (width < 768) setScreenSize('sm');
      else if (width < 1024) setScreenSize('md');
      else if (width < 1280) setScreenSize('lg');
      else if (width < 1536) setScreenSize('xl');
      else setScreenSize('2xl');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Helper functions for checking screen sizes
  const isMobile = screenSize === 'xs' || screenSize === 'sm';
  const isTablet = screenSize === 'md' || screenSize === 'lg';
  const isDesktop = screenSize === 'xl' || screenSize === '2xl';

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: screenSize === 'xs' || screenSize === 'sm' || screenSize === 'md',
    isLargeScreen: screenSize === 'lg' || screenSize === 'xl' || screenSize === '2xl'
  };
};

// Animation Utilities
export const ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideIn: 'animate-slide-in',
  scaleIn: 'animate-scale-in',
  pulse: 'animate-pulse',
  spin: 'animate-spin',
  bounce: 'animate-bounce'
};

export const getAnimationClass = (animation: keyof typeof ANIMATIONS): string => {
  return ANIMATIONS[animation];
};

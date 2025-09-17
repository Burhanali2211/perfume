import React from 'react';
import { useResponsive, RESPONSIVE_GRID_CLASSES } from './AdminDesignSystem';

interface ResponsiveAdminLayoutProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'dashboard' | 'table' | 'form' | 'settings';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  spacing?: 'tight' | 'normal' | 'relaxed';
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  className?: string;
}

interface AdminSectionProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'card' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

interface AdminGridProps {
  children: React.ReactNode;
  variant?: 'dashboard' | 'metrics' | 'table' | 'form' | 'settings';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Main responsive layout wrapper
export const ResponsiveAdminLayout: React.FC<ResponsiveAdminLayoutProps> = ({
  children,
  className = '',
  variant = 'dashboard',
  padding = 'md',
  spacing = 'normal'
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5',
    md: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-8',
    lg: isMobile ? 'p-5' : isTablet ? 'p-8' : 'p-10'
  };

  const spacingClasses = {
    tight: isMobile ? 'space-y-3' : isTablet ? 'space-y-4' : 'space-y-5',
    normal: isMobile ? 'space-y-4' : isTablet ? 'space-y-6' : 'space-y-8',
    relaxed: isMobile ? 'space-y-5' : isTablet ? 'space-y-8' : 'space-y-10'
  };

  const variantClasses = {
    dashboard: 'min-h-screen bg-gray-50',
    table: 'min-h-screen bg-white',
    form: 'min-h-screen bg-gray-50',
    settings: 'min-h-screen bg-gray-50'
  };

  return (
    <div className={`${variantClasses[variant]} ${paddingClasses[padding]} ${className}`}>
      <div className={`${isMobile ? RESPONSIVE_GRID_CLASSES.mobileOptimized : isTablet ? RESPONSIVE_GRID_CLASSES.tabletOptimized : RESPONSIVE_GRID_CLASSES.desktopOptimized} ${spacingClasses[spacing]}`}>
        {children}
      </div>
    </div>
  );
};

// Page header component with responsive design
export const AdminPageHeader: React.FC<AdminPageHeaderProps> = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  breadcrumbs,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className={`${className}`}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="mb-4" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && <span className="mx-2">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-gray-700 transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-gray-900 font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header content */}
      <div className={`flex ${isMobile ? 'flex-col space-y-4' : 'flex-row items-center justify-between'}`}>
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className="p-2 bg-primary-100 rounded-lg">
              <Icon className="h-6 w-6 text-primary-600" />
            </div>
          )}
          <div>
            <h1 className={`${RESPONSIVE_GRID_CLASSES.heading} text-gray-900`}>
              {title}
            </h1>
            {subtitle && (
              <p className={`text-gray-600 mt-1 ${isMobile ? 'text-sm' : 'text-sm sm:text-base'}`}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className={`flex items-center ${isMobile ? 'justify-start' : 'justify-end'} space-x-2`}>
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

// Section component with responsive design
export const AdminSection: React.FC<AdminSectionProps> = ({
  children,
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
  variant = 'default',
  padding = 'md'
}) => {
  const { isMobile, isTablet } = useResponsive();

  const paddingClasses = {
    none: '',
    sm: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5',
    md: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-7',
    lg: isMobile ? 'p-5' : isTablet ? 'p-7' : 'p-8'
  };

  const variantClasses = {
    default: '',
    card: 'bg-white rounded-lg shadow-sm border border-gray-200',
    bordered: 'border border-gray-200 rounded-lg'
  };

  return (
    <section className={`${variantClasses[variant]} ${variant !== 'default' ? paddingClasses[padding] : ''} ${className}`}>
      {(title || subtitle || Icon || actions) && (
        <div className={`${variant === 'default' ? 'mb-6' : 'mb-4'} flex ${isMobile ? 'flex-col space-y-3' : 'flex-row items-center justify-between'}`}>
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 bg-gray-100 rounded-lg">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
            )}
            <div>
              {title && (
                <h2 className={`${RESPONSIVE_GRID_CLASSES.subheading} text-gray-900`}>
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-gray-600 mt-1 text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className={`flex items-center ${isMobile ? 'justify-start' : 'justify-end'} space-x-2`}>
              {actions}
            </div>
          )}
        </div>
      )}

      {children}
    </section>
  );
};

// Grid component with responsive variants
export const AdminGrid: React.FC<AdminGridProps> = ({
  children,
  variant = 'dashboard',
  gap = 'md',
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  const gapClasses = {
    sm: isMobile ? 'gap-2' : isTablet ? 'gap-3' : 'gap-4',
    md: isMobile ? 'gap-3' : isTablet ? 'gap-4' : 'gap-6',
    lg: isMobile ? 'gap-4' : isTablet ? 'gap-6' : 'gap-8'
  };

  const gridClasses = {
    dashboard: RESPONSIVE_GRID_CLASSES.dashboardCards,
    metrics: RESPONSIVE_GRID_CLASSES.metricsGrid,
    table: RESPONSIVE_GRID_CLASSES.tableGrid,
    form: RESPONSIVE_GRID_CLASSES.formGrid,
    settings: RESPONSIVE_GRID_CLASSES.settingsGrid
  };

  return (
    <div className={`${gridClasses[variant]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  );
};

// Responsive table wrapper
export const ResponsiveTableWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  const { isMobile, isTablet } = useResponsive();

  return (
    <div className={`${className}`}>
      <div className={`${isMobile ? 'overflow-x-auto' : ''} -mx-4 sm:mx-0`}>
        <div className={`${isMobile ? 'min-w-full inline-block align-middle' : ''}`}>
          <div className={`${isMobile ? 'shadow ring-1 ring-black ring-opacity-5 md:rounded-lg' : 'shadow-sm ring-1 ring-gray-300 md:rounded-lg'} overflow-hidden`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Mobile-optimized card component
export const MobileOptimizedCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}> = ({
  children,
  className = '',
  padding = 'md'
}) => {
  const { isMobile, isTablet } = useResponsive();

  const paddingClasses = {
    sm: isMobile ? 'p-3' : isTablet ? 'p-4' : 'p-5',
    md: isMobile ? 'p-4' : isTablet ? 'p-6' : 'p-7',
    lg: isMobile ? 'p-5' : isTablet ? 'p-7' : 'p-8'
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
};
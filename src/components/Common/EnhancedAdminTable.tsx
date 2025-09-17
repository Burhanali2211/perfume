import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search, MoreHorizontal } from 'lucide-react';
import { useResponsive } from './AdminDesignSystem';
import { ResponsiveTableWrapper, MobileOptimizedCard } from './ResponsiveAdminLayout';

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  minWidth?: string;
  responsive?: 'all' | 'sm' | 'md' | 'lg' | 'xl';
  render?: (value: unknown, row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface TableAction<T = Record<string, unknown>> {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: (row: T, index: number) => void;
  variant?: 'primary' | 'secondary' | 'danger';
  show?: (row: T) => boolean;
}

interface EnhancedAdminTableProps<T = Record<string, unknown>> {
  data: T[];
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  loading?: boolean;
  searchable?: boolean;
  sortable?: boolean;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  emptyMessage?: string;
  mobileCardRender?: (row: T, index: number) => React.ReactNode;
}

export function EnhancedAdminTable<T = Record<string, unknown>>({
  data,
  columns,
  actions = [],
  loading = false,
  searchable = true,
  sortable = true,
  pagination,
  onRowClick,
  className = '',
  emptyMessage = 'No data available',
  mobileCardRender
}: EnhancedAdminTableProps<T>) {
  const { isMobile, isTablet } = useResponsive();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  // Filter columns based on responsive breakpoints
  const visibleColumns = useMemo(() => {
    if (isMobile) {
      return columns.filter(col => col.responsive === 'all' || !col.responsive);
    }
    if (isTablet) {
      return columns.filter(col => ['all', 'sm', 'md'].includes(col.responsive || 'all'));
    }
    return columns;
  }, [columns, isMobile, isTablet]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = data;

    // Search functionality
    if (searchTerm && searchable) {
      const searchableColumns = columns.filter(col => col.searchable !== false);
      filtered = data.filter(row =>
        searchableColumns.some(col => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Sort functionality
    if (sortConfig && sortable) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, searchable, sortable, columns]);

  const handleSort = (key: string) => {
    if (!sortable) return;

    setSortConfig(current => {
      if (current?.key === key) {
        return current.direction === 'asc' 
          ? { key, direction: 'desc' }
          : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-gray-600" />
      : <ChevronDown className="h-4 w-4 text-gray-600" />;
  };

  const renderActions = (row: T, index: number) => {
    const visibleActions = actions.filter(action => !action.show || action.show(row));
    
    if (visibleActions.length === 0) return null;

    if (isMobile && visibleActions.length > 2) {
      return (
        <div className="relative">
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {/* Dropdown menu would go here */}
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-1">
        {visibleActions.slice(0, isMobile ? 2 : 3).map((action, actionIndex) => {
          const Icon = action.icon;
          const variantClasses = {
            primary: 'text-primary-600 hover:text-primary-800',
            secondary: 'text-gray-600 hover:text-gray-800',
            danger: 'text-red-600 hover:text-red-800'
          };

          return (
            <button
              key={actionIndex}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick(row, index);
              }}
              className={`p-1.5 rounded-md transition-colors ${variantClasses[action.variant || 'secondary']}`}
              title={action.label}
            >
              {Icon ? <Icon className="h-4 w-4" /> : action.label}
            </button>
          );
        })}
      </div>
    );
  };

  // Mobile card view
  if (isMobile && mobileCardRender) {
    return (
      <div className={`space-y-4 ${className}`}>
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <MobileOptimizedCard key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </MobileOptimizedCard>
            ))}
          </div>
        ) : processedData.length === 0 ? (
          <MobileOptimizedCard>
            <p className="text-center text-gray-500 py-8">{emptyMessage}</p>
          </MobileOptimizedCard>
        ) : (
          processedData.map((row, index) => (
            <MobileOptimizedCard
              key={index}
              className={onRowClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
              onClick={() => onRowClick?.(row, index)}
            >
              {mobileCardRender(row, index)}
              {actions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  {renderActions(row, index)}
                </div>
              )}
            </MobileOptimizedCard>
          ))
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={`space-y-4 ${className}`}>
      {searchable && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      )}

      <ResponsiveTableWrapper>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {visibleColumns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.sortable !== false && sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                  } ${column.headerClassName || ''}`}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth
                  }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable !== false && sortable && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {visibleColumns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="h-4 bg-gray-200 rounded w-16 ml-auto"></div>
                    </td>
                  )}
                </tr>
              ))
            ) : processedData.length === 0 ? (
              <tr>
                <td
                  colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              processedData.map((row, index) => (
                <tr
                  key={row.id || `row-${index}`}
                  className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row, index)}
                >
                  {visibleColumns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                    >
                      {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {renderActions(row, index)}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ResponsiveTableWrapper>

      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing page {pagination.currentPage} of {pagination.totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  ArrowUpDown
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { ErrorFallback } from '../../Common/ErrorFallback';
import { exportTableData, bulkDeleteRecords } from '../../../utils/dataExport';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  displayName: string;
}

interface TableRow {
  [key: string]: unknown;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

interface TableManagerProps {
  tableName: string;
  displayName: string;
  onBack: () => void;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
}

export const UniversalTableManager: React.FC<TableManagerProps> = ({
  tableName,
  displayName,
  onBack
}) => {
  const [data, setData] = useState<TableRow[]>([]);
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    recordsPerPage: 20
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // Fetch table schema
  const fetchTableSchema = useCallback(async () => {
    try {
      const { data: schemaData, error } = await supabase.rpc('get_table_schema', {
        table_name: tableName
      });

      if (error) {
        // Fallback: try to get schema from information_schema
        const { data: fallbackData } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public');

        if (fallbackData) {
          const mappedColumns = fallbackData.map((col: ColumnInfo) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            displayName: formatColumnName(col.column_name)
          }));
          setColumns(mappedColumns);
        }
      } else {
        setColumns(schemaData || []);
      }
    } catch (err) {
      console.error('Error fetching table schema:', err);
      // Use basic columns as fallback
      setColumns([
        { name: 'id', type: 'uuid', nullable: false, displayName: 'ID' },
        { name: 'created_at', type: 'timestamp', nullable: true, displayName: 'Created At' }
      ]);
    }
  }, [tableName]);

  // Fetch table data
  const fetchTableData = useCallback(async () => {
    try {
      setError(null);
      
      // Get total count
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Calculate pagination
      const totalRecords = count || 0;
      const totalPages = Math.ceil(totalRecords / pagination.recordsPerPage);
      const offset = (pagination.currentPage - 1) * pagination.recordsPerPage;

      // Fetch data with pagination and sorting
      let query = supabase
        .from(tableName)
        .select('*')
        .range(offset, offset + pagination.recordsPerPage - 1);

      // Apply sorting
      if (sortColumn) {
        query = query.order(sortColumn, { ascending: sortDirection === 'asc' });
      }

      // Apply search if term exists
      if (searchTerm) {
        // Try to search in common text fields
        const textColumns = columns.filter(col => 
          col.type.includes('text') || col.type.includes('varchar')
        );
        
        if (textColumns.length > 0) {
          const searchConditions = textColumns
            .map(col => `${col.name}.ilike.%${searchTerm}%`)
            .join(',');
          query = query.or(searchConditions);
        }
      }

      const { data: tableData, error: dataError } = await query;

      if (dataError) throw dataError;

      setData(tableData || []);
      setPagination(prev => ({
        ...prev,
        totalRecords,
        totalPages
      }));
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError(`Failed to load ${displayName} data`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tableName, columns, pagination.currentPage, pagination.recordsPerPage, sortColumn, sortDirection, searchTerm, displayName]);

  useEffect(() => {
    fetchTableSchema();
  }, [fetchTableSchema]);

  useEffect(() => {
    if (columns.length > 0) {
      fetchTableData();
    }
  }, [columns, fetchTableData]);

  const formatColumnName = (columnName: string): string => {
    return columnName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCellValue = (value: unknown, column: TableColumn): string => {
    if (value === null || value === undefined) return '-';
    
    if (column.type.includes('timestamp') || column.type.includes('date')) {
      return new Date(value).toLocaleString();
    }
    
    if (column.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? `[${value.length} items]` : '[]';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50) + '...';
    }
    
    return String(value);
  };

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTableData();
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const toggleRowSelection = (id: string) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRows(newSelection);
  };

  const selectAllRows = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.map(row => row.id)));
    }
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const result = await exportTableData(tableName, { format, includeHeaders: true });
      if (result.success) {
        // Export was successful, file should be downloaded
        console.log(`Exported ${result.processed} records`);
      } else {
        console.error('Export failed:', result.errors);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;

    if (confirm(`Are you sure you want to delete ${selectedRows.size} selected records? This action cannot be undone.`)) {
      try {
        const result = await bulkDeleteRecords(tableName, Array.from(selectedRows));
        if (result.success) {
          setSelectedRows(new Set());
          await fetchTableData();
          console.log(`Deleted ${result.processed} records`);
        } else {
          console.error('Bulk delete failed:', result.errors);
        }
      } catch (error) {
        console.error('Bulk delete error:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <LoadingSpinner size="large" text={`Loading ${displayName}...`} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <ErrorFallback
          error={error}
          onRetry={fetchTableData}
          type="database"
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
            <p className="text-gray-600">
              {pagination.totalRecords.toLocaleString()} records in {tableName}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="relative group">
            <button className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('csv')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-t-lg"
              >
                Export CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded-b-lg"
              >
                Export JSON
              </button>
            </div>
          </div>
          <button className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
            <Plus className="h-4 w-4 mr-2" />
            Add New
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${displayName.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
        
        {selectedRows.size > 0 && (
          <div className="mt-4 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3">
            <span className="text-sm text-blue-700">
              {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-2">
              <button className="text-sm text-blue-600 hover:text-blue-800">
                Bulk Edit
              </button>
              <button
                onClick={handleBulkDelete}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Delete Selected
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === data.length && data.length > 0}
                    onChange={selectAllRows}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </th>
                {columns.slice(0, 8).map((column) => (
                  <th
                    key={column.name}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort(column.name)}
                  >
                    <div className="flex items-center">
                      {column.displayName}
                      <ArrowUpDown className="h-3 w-3 ml-1 text-gray-400" />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="hover:bg-gray-50"
                >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id)}
                        onChange={() => toggleRowSelection(row.id)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                    </td>
                    {columns.slice(0, 8).map((column) => (
                      <td key={column.name} className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs truncate">
                          {formatCellValue(row[column.name], column)}
                        </div>
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-green-600">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.recordsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.recordsPerPage, pagination.totalRecords)} of{' '}
            {pagination.totalRecords} results
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-3 py-1 text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

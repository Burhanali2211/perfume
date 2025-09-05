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
  ArrowUpDown,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { LoadingSpinner } from '../../Common/LoadingSpinner';
import { ErrorFallback } from '../../Common/ErrorFallback';
import { exportTableData, bulkDeleteRecords } from '../../../utils/dataExport';
import { ResponsiveTable } from '../../Common/ResponsiveTable';

interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  displayName: string;
}

interface TableRow {
  id?: string;
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
    recordsPerPage: 10
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TableRow | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Fetch table schema
  const fetchTableSchema = useCallback(async () => {
    try {
      // First try the RPC function
      const { data: schemaData, error: rpcError } = await supabase.rpc('get_table_schema', {
        table_name: tableName
      });

      if (!rpcError && schemaData && schemaData.length > 0) {
        setColumns(schemaData);
        return;
      }

      // If RPC fails, try direct query to information_schema
      console.warn('RPC get_table_schema failed, trying fallback method:', rpcError?.message);

      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable')
          .eq('table_name', tableName)
          .eq('table_schema', 'public');

        if (!fallbackError && fallbackData && fallbackData.length > 0) {
          const mappedColumns = fallbackData.map((col: ColumnInfo) => ({
            name: col.column_name,
            type: col.data_type,
            nullable: col.is_nullable === 'YES',
            displayName: formatColumnName(col.column_name)
          }));
          setColumns(mappedColumns);
          return;
        }
      } catch (fallbackErr) {
        console.warn('Fallback schema query failed:', fallbackErr);
      }

      // If both methods fail, try to infer schema from actual data
      console.warn('Schema queries failed, inferring from data...');
      const { data: sampleData, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (!dataError && sampleData && sampleData.length > 0) {
        const sampleRecord = sampleData[0];
        const inferredColumns = Object.keys(sampleRecord).map(key => ({
          name: key,
          type: inferDataType(sampleRecord[key]),
          nullable: sampleRecord[key] === null,
          displayName: formatColumnName(key)
        }));
        setColumns(inferredColumns);
        return;
      }

      // Final fallback: use basic columns
      console.warn('All schema detection methods failed, using basic columns');
      setColumns([
        { name: 'id', type: 'uuid', nullable: false, displayName: 'ID' },
        { name: 'created_at', type: 'timestamp', nullable: true, displayName: 'Created At' },
        { name: 'updated_at', type: 'timestamp', nullable: true, displayName: 'Updated At' }
      ]);
    } catch (err) {
      console.error('Error fetching table schema:', err);
      // Use basic columns as final fallback
      setColumns([
        { name: 'id', type: 'uuid', nullable: false, displayName: 'ID' },
        { name: 'created_at', type: 'timestamp', nullable: true, displayName: 'Created At' },
        { name: 'updated_at', type: 'timestamp', nullable: true, displayName: 'Updated At' }
      ]);
    }
  }, [tableName]);

  // Helper function to infer data type from value
  const inferDataType = (value: unknown): string => {
    if (value === null || value === undefined) return 'text';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'numeric';
    if (typeof value === 'string') {
      // Check if it looks like a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        return 'uuid';
      }
      // Check if it looks like a timestamp
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'timestamp';
      }
      // Check if it looks like a date
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'date';
      }
      return 'text';
    }
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'json';
    return 'text';
  };

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
      // Check if value is a valid date string or number
      if (typeof value === 'string' || typeof value === 'number') {
        return new Date(value).toLocaleString();
      }
      return '-';
    }
    
    if (column.type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    if (Array.isArray(value)) {
      return value.length > 0 ? `[${value.length} items]` : '[]';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value).substring(0, 50) + (JSON.stringify(value).length > 50 ? '...' : '');
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination(prev => ({
        ...prev,
        currentPage: newPage
      }));
    }
  };

  const handleSelectAll = () => {
    if (selectedRows.size === data.length && data.length > 0) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(data.filter(row => row.id).map(row => String(row.id))));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTableData();
  };

  const handleBulkDelete = async () => {
    if (selectedRows.size === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} records? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const ids = Array.from(selectedRows);
      await bulkDeleteRecords(tableName, ids);
      setSelectedRows(new Set());
      fetchTableData();
    } catch (err) {
      console.error('Error deleting records:', err);
      setError('Failed to delete records');
    }
  };

  const handleExport = async () => {
    try {
      await exportTableData(tableName, displayName);
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data');
    }
  };

  const handleEditRecord = (record: TableRow) => {
    setEditingRecord(record);
    setEditFormData({ ...record });
    setShowEditModal(true);
  };

  const handleSaveRecord = async () => {
    if (!editingRecord) return;

    setSaving(true);
    setError(null);

    try {
      // Prepare the data for saving
      const saveData = { ...editFormData };

      // Remove empty strings and convert them to null for optional fields
      Object.keys(saveData).forEach(key => {
        if (saveData[key] === '') {
          const column = columns.find(col => col.name === key);
          if (column?.nullable) {
            saveData[key] = null;
          }
        }
      });

      // Add timestamps
      if (editingRecord.id === 'new') {
        saveData.created_at = new Date().toISOString();
      }
      saveData.updated_at = new Date().toISOString();

      let result;

      if (editingRecord.id === 'new') {
        // Creating new record
        console.log(`Creating new record in ${tableName}:`, saveData);

        const { data, error } = await supabase
          .from(tableName)
          .insert(saveData)
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw new Error(`Failed to create record: ${error.message}`);
        }

        console.log('Record created successfully:', data);
      } else {
        // Updating existing record
        console.log(`Updating record ${editingRecord.id} in ${tableName}:`, saveData);

        const { data, error } = await supabase
          .from(tableName)
          .update(saveData)
          .eq('id', editingRecord.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw new Error(`Failed to update record: ${error.message}`);
        }

        console.log('Record updated successfully:', data);
      }

      // Refresh the data
      await fetchTableData();
      setShowEditModal(false);
      setEditingRecord(null);
      setEditFormData({});

      // Show success message
      console.log(`✅ ${editingRecord.id === 'new' ? 'Created' : 'Updated'} record successfully`);
    } catch (err) {
      console.error('Error saving record:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save record';
      setError(errorMessage);

      // Don't close the modal on error so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
      return;
    }

    setError(null);

    try {
      console.log(`Deleting record ${recordId} from ${tableName}`);

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete record: ${error.message}`);
      }

      console.log('✅ Record deleted successfully');

      // Refresh the data
      await fetchTableData();
    } catch (err) {
      console.error('Error deleting record:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete record';
      setError(errorMessage);
    }
  };

  const handleFormFieldChange = (fieldName: string, value: unknown) => {
    setEditFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Prepare columns for ResponsiveTable
  const tableColumns = [
    {
      key: 'id',
      title: 'ID',
      width: 100,
      render: (value: string) => <span className="font-mono text-sm">{value?.slice(0, 8) || '-'}</span>
    },
    {
      key: 'data',
      title: 'Data',
      minWidth: 200,
      render: (value: any, record: TableRow) => (
        <div className="max-w-xs truncate">
          {JSON.stringify(record, null, 2).slice(0, 100)}...
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      width: 150,
      render: (value: string) => (
        <span className="text-sm text-gray-500">
          {value ? new Date(value).toLocaleDateString() : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (value: any, record: TableRow) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEditRecord(record);
            }}
            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
            title="Edit Record"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (record.id) {
                handleDeleteRecord(String(record.id));
              }
            }}
            className="text-red-600 hover:text-red-900 p-1 rounded"
            title="Delete Record"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )
    }
  ];

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="flex items-center text-indigo-600 hover:text-indigo-800 mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </button>
            <h2 className="text-2xl font-bold text-gray-900">{displayName} Management</h2>
          </div>
        </div>
        <ErrorFallback
          error={error}
          onRetry={() => {
            setError(null);
            fetchTableData();
          }}
          type="database"
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <button
            onClick={onBack}
            className="flex items-center text-indigo-600 hover:text-indigo-800 mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{displayName} Management</h2>
          <p className="text-gray-600 mt-1">
            Manage {displayName.toLowerCase()} data ({pagination.totalRecords} total records)
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setEditingRecord({ id: 'new' } as TableRow);
              setEditFormData({});
              setShowEditModal(true);
            }}
            className="flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add New
          </button>

          <button
            onClick={handleExport}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </button>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder={`Search ${displayName}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-full"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
              <option>All Columns</option>
              {columns.map(col => (
                <option key={col.name} value={col.name}>{col.displayName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-indigo-800">
              {selectedRows.size} {selectedRows.size === 1 ? 'record' : 'records'} selected
            </p>
            <div className="flex space-x-2">
              <button
                onClick={handleBulkDelete}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <ResponsiveTable
              columns={tableColumns}
              data={data}
              loading={loading}
              emptyMessage={`No ${displayName.toLowerCase()} found`}
            />
            
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing page {pagination.currentPage} of {pagination.totalPages}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingRecord && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRecord.id === 'new' ? `Add New ${displayName} Record` : `Edit ${displayName} Record`}
              </h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Error display in modal */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-1 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {columns
                  .filter(col => col.name !== 'id' && col.name !== 'created_at' && col.name !== 'updated_at')
                  .map((column) => (
                    <div key={column.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {column.displayName}
                      </label>
                      {column.type === 'boolean' ? (
                        <select
                          value={editFormData[column.name] ? 'true' : 'false'}
                          onChange={(e) => handleFormFieldChange(column.name, e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      ) : column.type.includes('text') || column.type.includes('varchar') ? (
                        <textarea
                          value={String(editFormData[column.name] || '')}
                          onChange={(e) => handleFormFieldChange(column.name, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          rows={3}
                        />
                      ) : column.type.includes('json') || column.type.includes('array') ? (
                        <textarea
                          value={JSON.stringify(editFormData[column.name] || '', null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              handleFormFieldChange(column.name, parsed);
                            } catch {
                              // Keep the raw value for now
                              handleFormFieldChange(column.name, e.target.value);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                          rows={4}
                          placeholder="Enter valid JSON"
                        />
                      ) : (
                        <input
                          type={column.type.includes('int') || column.type.includes('numeric') ? 'number' : 'text'}
                          value={String(editFormData[column.name] || '')}
                          onChange={(e) => {
                            const value = column.type.includes('int') || column.type.includes('numeric')
                              ? parseFloat(e.target.value) || 0
                              : e.target.value;
                            handleFormFieldChange(column.name, value);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRecord}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 flex items-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
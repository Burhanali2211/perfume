import { supabase } from '../lib/supabase';

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  includeHeaders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, unknown>;
}

export interface BulkOperationResult {
  success: boolean;
  processed: number;
  errors: string[];
  data?: Record<string, unknown>[];
}

// Export data from any table
export const exportTableData = async (
  tableName: string,
  options: ExportOptions = { format: 'csv', includeHeaders: true }
): Promise<BulkOperationResult> => {
  try {
    let query = supabase.from(tableName).select('*');

    // Apply date range filter if specified
    if (options.dateRange) {
      query = query
        .gte('created_at', options.dateRange.start.toISOString())
        .lte('created_at', options.dateRange.end.toISOString());
    }

    // Apply additional filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          query = query.eq(key, value);
        }
      });
    }

    const { data, error } = await query;

    if (error) {
      return {
        success: false,
        processed: 0,
        errors: [error.message]
      };
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        processed: 0,
        errors: [],
        data: []
      };
    }

    // Format data based on export format
    let exportData: string | Record<string, unknown>[];
    
    switch (options.format) {
      case 'csv':
        exportData = convertToCSV(data, options.includeHeaders);
        break;
      case 'json':
        exportData = JSON.stringify(data, null, 2);
        break;
      case 'xlsx':
        // For XLSX, we'll return the data and let the frontend handle the conversion
        exportData = data;
        break;
      default:
        exportData = convertToCSV(data, options.includeHeaders);
    }

    // Trigger download
    downloadData(exportData, `${tableName}_export.${options.format}`, options.format);

    return {
      success: true,
      processed: data.length,
      errors: [],
      data: data
    };
  } catch (error) {
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

// Convert data to CSV format
const convertToCSV = (data: Record<string, unknown>[], includeHeaders: boolean = true): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  if (includeHeaders) {
    csvRows.push(headers.join(','));
  }

  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      
      // Handle null/undefined values
      if (value === null || value === undefined) return '';
      
      // Handle arrays and objects
      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      
      // Handle strings with commas or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      
      return value.toString();
    });
    
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

// Download data as file
const downloadData = (data: string | Record<string, unknown>[], filename: string, format: string) => {
  let blob: Blob;

  switch (format) {
    case 'csv':
      blob = new Blob([data as string], { type: 'text/csv;charset=utf-8;' });
      break;
    case 'json':
      blob = new Blob([data as string], { type: 'application/json;charset=utf-8;' });
      break;
    default:
      blob = new Blob([data as string], { type: 'text/plain;charset=utf-8;' });
  }

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Bulk delete records
export const bulkDeleteRecords = async (
  tableName: string,
  recordIds: string[]
): Promise<BulkOperationResult> => {
  try {
    const { error } = await supabase
      .from(tableName)
      .delete()
      .in('id', recordIds);

    if (error) {
      return {
        success: false,
        processed: 0,
        errors: [error.message]
      };
    }

    return {
      success: true,
      processed: recordIds.length,
      errors: []
    };
  } catch (error) {
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

// Bulk update records
export const bulkUpdateRecords = async (
  tableName: string,
  updates: Array<{ id: string; data: Record<string, unknown> }>
): Promise<BulkOperationResult> => {
  try {
    const results = await Promise.allSettled(
      updates.map(update =>
        supabase
          .from(tableName)
          .update(update.data)
          .eq('id', update.id)
      )
    );

    const errors: string[] = [];
    let processed = 0;

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (!result.value.error) {
          processed++;
        } else {
          errors.push(`Record ${updates[index].id}: ${result.value.error.message}`);
        }
      } else {
        errors.push(`Record ${updates[index].id}: ${result.reason}`);
      }
    });

    return {
      success: errors.length === 0,
      processed,
      errors
    };
  } catch (error) {
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

// Import data from CSV
export const importFromCSV = async (
  tableName: string,
  csvData: string,
  hasHeaders: boolean = true
): Promise<BulkOperationResult> => {
  try {
    const lines = csvData.trim().split('\n');
    if (lines.length === 0) {
      return {
        success: false,
        processed: 0,
        errors: ['No data found in CSV']
      };
    }

    let headers: string[];
    let dataLines: string[];

    if (hasHeaders) {
      headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      dataLines = lines.slice(1);
    } else {
      // If no headers, we need to get them from the table schema
      const { data: schemaData } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', tableName)
        .eq('table_schema', 'public');
      
      headers = schemaData?.map(col => col.column_name) || [];
      dataLines = lines;
    }

    const records = dataLines.map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const record: Record<string, unknown> = {};
      
      headers.forEach((header, index) => {
        if (values[index] !== undefined && values[index] !== '') {
          record[header] = values[index];
        }
      });
      
      return record;
    });

    // Insert records in batches
    const batchSize = 100;
    const errors: string[] = [];
    let processed = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(tableName)
        .insert(batch);

      if (error) {
        errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        processed += batch.length;
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };
  } catch (error) {
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred']
    };
  }
};

// Get table statistics
export const getTableStatistics = async (tableName: string) => {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    // Get recent activity (last 24 hours)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { count: recentCount } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .gte('created_at', yesterday.toISOString());

    return {
      totalRecords: count || 0,
      recentRecords: recentCount || 0,
      lastUpdated: new Date()
    };
  } catch (error) {
    console.error(`Error getting statistics for ${tableName}:`, error);
    return {
      totalRecords: 0,
      recentRecords: 0,
      lastUpdated: new Date()
    };
  }
};

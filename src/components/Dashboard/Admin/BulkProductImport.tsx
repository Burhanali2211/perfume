import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  Download,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Plus
} from 'lucide-react';
import { useNotification } from '../../../contexts/NotificationContext';
import { supabase } from '../../../lib/supabase';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ProductImportData {
  name: string;
  description: string;
  short_description: string;
  price: number;
  original_price?: number;
  category: string;
  stock: number;
  sku: string;
  weight?: number;
  tags?: string;
  is_featured?: boolean;
  images?: string;
}

export const BulkProductImport: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [previewData, setPreviewData] = useState<ProductImportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showNotification } = useNotification();

  const downloadTemplate = () => {
    const sampleCSV = `"Name","Short Description","Description","Price","Original Price","Category","Stock","SKU","Weight (kg)","Tags","Featured","Image URLs"
"Royal Oudh Supreme","Premium Cambodian oudh aged for 3 years with rose damascus","Aged Cambodian oudh with premium fragrance",12500.00,15000.00,"Oudh Attars",15,"OUDH001",0.012,"oudh,premium,aged,cambodian",true,"/images/products/royal-oud1.jpg,/images/products/royal-oud2.jpg"
"Bulgarian Rose Attar","Steam-distilled Bulgarian rose petals with romantic fragrance","Pure Bulgarian rose attar",5800.00,7200.00,"Floral Attars",25,"ROSE001",0.010,"rose,floral,bulgarian,romantic",false,"/images/products/rose1.jpg"
"White Musk Arabia","Pure white musk with soft, clean, and powdery notes","Premium white musk attar",3200.00,4000.00,"Musk Attars",30,"MUSK001",0.012,"musk,white,clean,soft",false,"/images/products/musk1.jpg"`;
    
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Template downloaded successfully!', 'success');
  };

  const parseCSV = (csvText: string): ProductImportData[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
    const products: ProductImportData[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim());
      if (values.length !== headers.length) continue;

      const product: Record<string, string | number | boolean> = {};
      headers.forEach((header, index) => {
        const value = values[index];
        switch (header) {
          case 'price':
          case 'original_price':
          case 'weight':
            product[header] = value ? parseFloat(value) : undefined;
            break;
          case 'stock':
            product[header] = value ? parseInt(value) : 0;
            break;
          case 'is_featured':
            product[header] = value.toLowerCase() === 'true';
            break;
          case 'tags':
            product[header] = value;
            break;
          case 'images':
            product[header] = value;
            break;
          default:
            product[header] = value;
        }
      });
      products.push(product);
    }

    return products;
  };

  const validateProduct = (product: ProductImportData): string[] => {
    const errors: string[] = [];
    
    if (!product.name) errors.push('Name is required');
    if (!product.description) errors.push('Description is required');
    if (!product.price || product.price <= 0) errors.push('Valid price is required');
    if (!product.category) errors.push('Category is required');
    if (!product.sku) errors.push('SKU is required');
    if (product.stock < 0) errors.push('Stock cannot be negative');
    
    return errors;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      showNotification('Please upload a CSV file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const products = parseCSV(csvText);
      
      if (products.length === 0) {
        showNotification('No valid products found in CSV', 'error');
        return;
      }

      setPreviewData(products);
      setShowPreview(true);
    };
    
    reader.readAsText(file);
  };

  const processImport = async () => {
    setIsUploading(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      // First, get all categories to map category names to IDs
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name');

      const categoryMap = new Map(
        categories?.map(cat => [cat.name.toLowerCase(), cat.id]) || []
      );

      for (const product of previewData) {
        try {
          const errors = validateProduct(product);
          if (errors.length > 0) {
            result.failed++;
            result.errors.push(`${product.name}: ${errors.join(', ')}`);
            continue;
          }

          // Find category ID
          const categoryId = categoryMap.get(product.category.toLowerCase());
          if (!categoryId) {
            result.failed++;
            result.errors.push(`${product.name}: Category "${product.category}" not found`);
            continue;
          }

          // Prepare product data
          const productData = {
            name: product.name,
            slug: product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            description: product.description,
            short_description: product.short_description,
            price: product.price,
            original_price: product.original_price || product.price,
            category_id: categoryId,
            seller_id: (await supabase.auth.getUser()).data.user?.id,
            images: product.images ? product.images.split(',').map(img => img.trim()) : [],
            stock: product.stock,
            sku: product.sku,
            weight: product.weight,
            tags: product.tags ? product.tags.split(',').map(tag => tag.trim()) : [],
            is_featured: product.is_featured || false,
            is_active: true
          };

          const { error } = await supabase
            .from('products')
            .insert(productData);

          if (error) {
            result.failed++;
            result.errors.push(`${product.name}: ${error.message}`);
          } else {
            result.success++;
          }
        } catch (error: unknown) {
          result.failed++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(`${product.name}: ${errorMessage}`);
        }
      }

      setImportResult(result);
      setShowPreview(false);
      
      if (result.success > 0) {
        showNotification(`Successfully imported ${result.success} products!`, 'success');
      }
      
      if (result.failed > 0) {
        showNotification(`${result.failed} products failed to import`, 'error');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      showNotification(`Import failed: ${errorMessage}`, 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Product Import</h3>
        
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Import Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Download the CSV template to see the required format</li>
            <li>• Fill in your product data following the template structure</li>
            <li>• Upload your CSV file and preview the data before importing</li>
            <li>• Categories must exist in the system before importing products</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <motion.button
            onClick={downloadTemplate}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Download Template</span>
          </motion.button>

          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Upload CSV File</span>
            </label>
          </div>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Preview Import Data</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Found {previewData.length} products. Review and confirm to import.
                </p>
              </div>
              
              <div className="p-6 overflow-auto max-h-96">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(0, 10).map((product, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">${product.price}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.category}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.stock}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{product.sku}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && (
                    <p className="text-sm text-gray-500 mt-2">
                      ... and {previewData.length - 10} more products
                    </p>
                  )}
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <motion.button
                  onClick={processImport}
                  disabled={isUploading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Import Products</span>
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Import Results</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm">
                    <strong>{importResult.success}</strong> products imported successfully
                  </span>
                </div>
                
                {importResult.failed > 0 && (
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-sm">
                      <strong>{importResult.failed}</strong> products failed to import
                    </span>
                  </div>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div>
                  <h5 className="font-medium text-red-900 mb-2">Errors:</h5>
                  <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <p key={index} className="text-sm text-red-800">{error}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

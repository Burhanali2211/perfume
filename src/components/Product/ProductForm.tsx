import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { motion } from 'framer-motion';

interface ProductFormProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onClose }) => {
  const { addProduct, updateProduct, categories } = useProducts();
  const { user } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    price: 0,
    originalPrice: 0,
    category: categories.length > 0 ? categories[0].name : '',
    categoryId: categories.length > 0 ? categories[0].id : '',
    stock: 0,
    minStockLevel: 5,
    sku: '',
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    images: ['https://images.unsplash.com/photo-1588964895597-cf29151f7199?w=400&h=400&fit=crop'],
    tags: [] as string[],
    specifications: {
      'Volume': '',
      'Concentration': '',
      'Longevity': '',
      'Sillage': '',
      'Origin': ''
    },
    featured: false,
    isActive: true,
    metaTitle: '',
    metaDescription: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        slug: product.slug || '',
        description: product.description,
        shortDescription: product.shortDescription || '',
        price: product.price,
        originalPrice: product.originalPrice || 0,
        category: product.category,
        categoryId: product.categoryId || '',
        stock: product.stock,
        minStockLevel: product.minStockLevel || 5,
        sku: product.sku || '',
        weight: product.weight || 0,
        dimensions: product.dimensions || { length: 0, width: 0, height: 0 },
        images: product.images,
        tags: product.tags,
        specifications: product.specifications || {
          'Volume': '',
          'Concentration': '',
          'Longevity': '',
          'Sillage': '',
          'Origin': ''
        },
        featured: product.featured || false,
        isActive: product.isActive !== false,
        metaTitle: product.metaTitle || '',
        metaDescription: product.metaDescription || ''
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'category') {
      const selectedCategory = categories.find(c => c.name === value);
      setFormData(prev => ({ 
        ...prev, 
        category: value,
        categoryId: selectedCategory?.id || ''
      }));
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleSpecificationChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
  };

  const handleDimensionChange = (dimension: 'length' | 'width' | 'height', value: number) => {
    setFormData(prev => ({
      ...prev,
      dimensions: {
        ...prev.dimensions,
        [dimension]: value
      }
    }));
  };
  
  const handleTagChange = (tag: string) => {
    setFormData(prev => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validation
    if (!formData.name.trim()) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Product name is required.' });
      return;
    }
    if (!formData.description.trim()) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Product description is required.' });
      return;
    }
    if (!formData.shortDescription.trim()) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Short description is required.' });
      return;
    }
    if (!formData.sku.trim()) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'SKU is required.' });
      return;
    }
    if (formData.price <= 0) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Price must be greater than 0.' });
      return;
    }
    if (formData.stock < 0) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Stock quantity cannot be negative.' });
      return;
    }
    if (formData.weight <= 0) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Weight must be greater than 0.' });
      return;
    }

    const productData = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      price: Number(formData.price),
      originalPrice: Number(formData.originalPrice) || undefined,
      stock: Number(formData.stock),
      minStockLevel: Number(formData.minStockLevel),
      weight: Number(formData.weight),
      dimensions: {
        length: Number(formData.dimensions.length),
        width: Number(formData.dimensions.width),
        height: Number(formData.dimensions.height)
      },
      sellerId: user.id,
      sellerName: user.name || user.email || 'Unknown Seller',
      rating: 0,
      reviewCount: 0,
      reviews: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (product) {
      updateProduct({ ...product, ...productData });
      showNotification({ type: 'success', title: 'Product Updated', message: `${product.name} has been updated.` });
    } else {
      addProduct(productData);
      showNotification({ type: 'success', title: 'Product Added', message: `${formData.name} has been added.` });
    }
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">SKU *</label>
            <input type="text" name="sku" value={formData.sku} onChange={handleChange} className="w-full input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} className="w-full input-field" required>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg) *</label>
            <input type="number" name="weight" value={formData.weight} onChange={handleChange} className="w-full input-field" required step="0.001" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Short Description *</label>
          <input type="text" name="shortDescription" value={formData.shortDescription} onChange={handleChange} className="w-full input-field" required />
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Full Description *</label>
          <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full input-field" required />
        </div>
      </div>

      {/* Pricing & Stock */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Pricing & Inventory</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price *</label>
            <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full input-field" required step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
            <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} className="w-full input-field" step="0.01" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity *</label>
            <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Stock Level</label>
            <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleChange} className="w-full input-field" />
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Dimensions (cm)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
            <input 
              type="number" 
              value={formData.dimensions.length} 
              onChange={(e) => handleDimensionChange('length', Number(e.target.value))} 
              className="w-full input-field" 
              step="0.1" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Width</label>
            <input 
              type="number" 
              value={formData.dimensions.width} 
              onChange={(e) => handleDimensionChange('width', Number(e.target.value))} 
              className="w-full input-field" 
              step="0.1" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Height</label>
            <input 
              type="number" 
              value={formData.dimensions.height} 
              onChange={(e) => handleDimensionChange('height', Number(e.target.value))} 
              className="w-full input-field" 
              step="0.1" 
            />
          </div>
        </div>
      </div>

      {/* Specifications */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Product Specifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(formData.specifications).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{key}</label>
              <input 
                type="text" 
                value={value} 
                onChange={(e) => handleSpecificationChange(key, e.target.value)} 
                className="w-full input-field" 
                placeholder={`Enter ${key.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Tags & Settings */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Tags & Settings</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
          <div className="flex flex-wrap gap-2">
            {['trending', 'bestseller', 'new', 'sale', 'premium', 'limited'].map(tag => (
              <button 
                key={tag} 
                type="button" 
                onClick={() => handleTagChange(tag)} 
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  formData.tags.includes(tag) 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex items-center">
            <input 
              type="checkbox" 
              name="featured" 
              checked={formData.featured} 
              onChange={handleChange} 
              className="mr-2" 
            />
            <label className="text-sm font-medium text-gray-700">Featured Product</label>
          </div>
          <div className="flex items-center">
            <input 
              type="checkbox" 
              name="isActive" 
              checked={formData.isActive} 
              onChange={handleChange} 
              className="mr-2" 
            />
            <label className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">SEO Information</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Title</label>
            <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className="w-full input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Meta Description</label>
            <textarea name="metaDescription" value={formData.metaDescription} onChange={handleChange} rows={2} className="w-full input-field" />
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <motion.button 
          type="button" 
          onClick={onClose} 
          className="btn-secondary" 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          Cancel
        </motion.button>
        <motion.button 
          type="submit" 
          className="btn-primary" 
          whileHover={{ scale: 1.02 }} 
          whileTap={{ scale: 0.98 }}
        >
          {product ? 'Save Changes' : 'Add Product'}
        </motion.button>
      </div>
    </form>
  );
};

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
    description: '',
    price: 0,
    category: categories.length > 0 ? categories[0].name : '',
    stock: 0,
    images: ['https://images.unsplash.com/photo-1588964895597-cf29151f7199?w=400&h=400&fit=crop'],
    tags: [] as string[],
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        stock: product.stock,
        images: product.images,
        tags: product.tags,
      });
    }
  }, [product]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (formData.price <= 0) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Price must be greater than 0.' });
      return;
    }
    if (formData.stock < 0) {
      showNotification({ type: 'error', title: 'Validation Error', message: 'Stock quantity cannot be negative.' });
      return;
    }

    const productData = {
      ...formData,
      price: Number(formData.price),
      stock: Number(formData.stock),
      sellerId: user.id,
      sellerName: user.name,
      featured: false, // Default value
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full input-field" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select name="category" value={formData.category} onChange={handleChange} className="w-full input-field" required>
            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full input-field" required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
          <input type="number" name="price" value={formData.price} onChange={handleChange} className="w-full input-field" required step="0.01" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantity</label>
          <input type="number" name="stock" value={formData.stock} onChange={handleChange} className="w-full input-field" required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
        <div className="flex flex-wrap gap-2">
            {['trending', 'bestseller', 'new', 'sale'].map(tag => (
                <button key={tag} type="button" onClick={() => handleTagChange(tag)} className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${formData.tags.includes(tag) ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
                    {tag}
                </button>
            ))}
        </div>
      </div>
      <div className="flex justify-end space-x-4">
        <motion.button type="button" onClick={onClose} className="btn-secondary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          Cancel
        </motion.button>
        <motion.button type="submit" className="btn-primary" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          {product ? 'Save Changes' : 'Add Product'}
        </motion.button>
      </div>
    </form>
  );
};

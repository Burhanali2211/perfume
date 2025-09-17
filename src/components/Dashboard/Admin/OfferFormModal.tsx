import React from 'react';
import { Modal } from '../../Common/Modal';

interface OfferFormData {
  title: string;
  description: string;
  short_description: string;
  offer_type: 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'free_shipping' | 'bundle';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount: number;
  image_url: string;
  banner_image_url: string;
  terms_and_conditions: string;
  is_active: boolean;
  is_featured: boolean;
  usage_limit: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until: string;
  applicable_to: 'all_products' | 'specific_products' | 'specific_categories' | 'specific_collections';
  sort_order: number;
}

interface Offer {
  id: string;
  title: string;
  description?: string;
  short_description?: string;
  offer_type: 'percentage' | 'fixed_amount' | 'buy_one_get_one' | 'free_shipping' | 'bundle';
  discount_value: number;
  minimum_order_amount: number;
  maximum_discount_amount?: number;
  image_url?: string;
  banner_image_url?: string;
  terms_and_conditions?: string;
  is_active: boolean;
  is_featured: boolean;
  usage_limit?: number;
  usage_count: number;
  user_usage_limit: number;
  valid_from: string;
  valid_until?: string;
  applicable_to: 'all_products' | 'specific_products' | 'specific_categories' | 'specific_collections';
  sort_order: number;
  created_at: string;
}

interface OfferFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: OfferFormData;
  setFormData: React.Dispatch<React.SetStateAction<OfferFormData>>;
  editingOffer: Offer | null;
  loading: boolean;
}

export const OfferFormModal: React.FC<OfferFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingOffer,
  loading
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingOffer ? 'Edit Offer' : 'Create New Offer'}
      size="xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Offer Type *
            </label>
            <select
              value={formData.offer_type}
              onChange={(e) => setFormData({ ...formData, offer_type: e.target.value as 'percentage' | 'fixed' | 'bogo' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="percentage">Percentage Discount</option>
              <option value="fixed_amount">Fixed Amount Discount</option>
              <option value="buy_one_get_one">Buy One Get One</option>
              <option value="free_shipping">Free Shipping</option>
              <option value="bundle">Bundle Offer</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description
          </label>
          <input
            type="text"
            value={formData.short_description}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Brief description for display"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Detailed description of the offer"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Discount Value *
            </label>
            <input
              type="number"
              value={formData.discount_value}
              onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              step="0.01"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.offer_type === 'percentage' ? 'Percentage (0-100)' : 'Amount in ₹'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Order Amount
            </label>
            <input
              type="number"
              value={formData.minimum_order_amount}
              onChange={(e) => setFormData({ ...formData, minimum_order_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              step="0.01"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Discount Amount
            </label>
            <input
              type="number"
              value={formData.maximum_discount_amount}
              onChange={(e) => setFormData({ ...formData, maximum_discount_amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid From *
            </label>
            <input
              type="datetime-local"
              value={formData.valid_from}
              onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valid Until
            </label>
            <input
              type="datetime-local"
              value={formData.valid_until}
              onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usage Limit
            </label>
            <input
              type="number"
              value={formData.usage_limit}
              onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
            />
            <p className="text-xs text-gray-500 mt-1">0 = unlimited</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User Usage Limit
            </label>
            <input
              type="number"
              value={formData.user_usage_limit}
              onChange={(e) => setFormData({ ...formData, user_usage_limit: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="1"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort Order
            </label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Applicable To
          </label>
          <select
            value={formData.applicable_to}
            onChange={(e) => setFormData({ ...formData, applicable_to: e.target.value as 'all' | 'category' | 'product' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all_products">All Products</option>
            <option value="specific_products">Specific Products</option>
            <option value="specific_categories">Specific Categories</option>
            <option value="specific_collections">Specific Collections</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Banner Image URL
            </label>
            <input
              type="url"
              value={formData.banner_image_url}
              onChange={(e) => setFormData({ ...formData, banner_image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/banner.jpg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Terms and Conditions
          </label>
          <textarea
            value={formData.terms_and_conditions}
            onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Terms and conditions for this offer"
          />
        </div>

        <div className="flex items-center space-x-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-2 text-sm text-gray-700">Featured</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : editingOffer ? 'Update Offer' : 'Create Offer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

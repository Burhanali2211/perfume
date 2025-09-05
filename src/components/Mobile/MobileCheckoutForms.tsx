import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Calendar, 
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { MobileFormInput, MobileSecurityIndicator } from './MobileCheckout';

interface MobileShippingFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string>;
}

export const MobileShippingForm: React.FC<MobileShippingFormProps> = ({
  formData,
  onChange,
  errors = {}
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Shipping Information</h2>
        <MobileSecurityIndicator />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <MobileFormInput
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            placeholder="John"
            required
            error={errors.firstName}
            icon={User}
          />
          <MobileFormInput
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            placeholder="Doe"
            required
            error={errors.lastName}
          />
        </div>

        <MobileFormInput
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          placeholder="john@example.com"
          required
          error={errors.email}
          icon={Mail}
        />

        <MobileFormInput
          label="Phone Number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={onChange}
          placeholder="+1 (555) 123-4567"
          required
          error={errors.phone}
          icon={Phone}
        />

        <MobileFormInput
          label="Street Address"
          name="address"
          value={formData.address}
          onChange={onChange}
          placeholder="123 Main Street"
          required
          error={errors.address}
          icon={MapPin}
        />

        <div className="grid grid-cols-2 gap-3">
          <MobileFormInput
            label="City"
            name="city"
            value={formData.city}
            onChange={onChange}
            placeholder="New York"
            required
            error={errors.city}
          />
          <MobileFormInput
            label="State"
            name="state"
            value={formData.state}
            onChange={onChange}
            placeholder="NY"
            required
            error={errors.state}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <MobileFormInput
            label="ZIP Code"
            name="zipCode"
            value={formData.zipCode}
            onChange={onChange}
            placeholder="10001"
            required
            error={errors.zipCode}
          />
          <div className="space-y-2">
            <label htmlFor="mobile-country-select" className="block text-sm font-medium text-neutral-900">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              id="mobile-country-select"
              name="country"
              value={formData.country}
              onChange={onChange}
              className="w-full px-4 py-4 text-base border border-neutral-300 rounded-xl focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500 transition-colors duration-200 touch-manipulation"
              required
            >
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save Information Toggle */}
      <div className="bg-neutral-50 rounded-xl p-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="saveInfo"
            checked={formData.saveInfo}
            onChange={onChange}
            className="w-5 h-5 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
          />
          <span className="text-sm text-neutral-700">
            Save this information for faster checkout next time
          </span>
        </label>
      </div>
    </div>
  );
};

interface MobilePaymentFormProps {
  formData: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  errors?: Record<string, string>;
  selectedPaymentMethod: string;
}

export const MobilePaymentForm: React.FC<MobilePaymentFormProps> = ({
  formData,
  onChange,
  errors = {},
  selectedPaymentMethod
}) => {
  const [showCVV, setShowCVV] = useState(false);

  if (selectedPaymentMethod !== 'card') {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-neutral-600" />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            {selectedPaymentMethod === 'apple-pay' ? 'Apple Pay' : 'Google Pay'} Selected
          </h3>
          <p className="text-neutral-600">
            You'll be redirected to complete your payment securely
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Payment Information</h2>
        <MobileSecurityIndicator />
      </div>

      <div className="space-y-4">
        <MobileFormInput
          label="Card Number"
          type="text"
          name="cardNumber"
          value={formData.cardNumber}
          onChange={onChange}
          placeholder="1234 5678 9012 3456"
          required
          error={errors.cardNumber}
          icon={CreditCard}
        />

        <div className="grid grid-cols-2 gap-3">
          <MobileFormInput
            label="Expiry Date"
            type="text"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={onChange}
            placeholder="MM/YY"
            required
            error={errors.expiryDate}
            icon={Calendar}
          />
          
          <div className="space-y-2">
            <label htmlFor="mobile-cvv-input" className="block text-sm font-medium text-neutral-900">
              CVV <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-neutral-400" />
              </div>
              <input
                id="mobile-cvv-input"
                type={showCVV ? 'text' : 'password'}
                name="cvv"
                value={formData.cvv}
                onChange={onChange}
                placeholder="123"
                required
                className={`
                  w-full px-4 py-4 pl-10 pr-12 text-base border border-neutral-300 rounded-xl
                  focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
                  transition-colors duration-200 touch-manipulation
                  ${errors.cvv ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
                `}
              />
              <button
                type="button"
                onClick={() => setShowCVV(!showCVV)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label={showCVV ? "Hide CVV" : "Show CVV"}
              >
                {showCVV ? (
                  <EyeOff className="h-5 w-5 text-neutral-500" />
                ) : (
                  <Eye className="h-5 w-5 text-neutral-500" />
                )}
              </button>
            </div>
            {errors.cvv && (
              <p className="text-sm text-red-600" role="alert">{errors.cvv}</p>
            )}
          </div>
        </div>

        <MobileFormInput
          label="Name on Card"
          name="cardName"
          value={formData.cardName}
          onChange={onChange}
          placeholder="John Doe"
          required
          error={errors.cardName}
          icon={User}
        />
      </div>

      {/* Billing Address Toggle */}
      <div className="bg-neutral-50 rounded-xl p-4">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            name="sameAsBilling"
            checked={formData.sameAsBilling}
            onChange={onChange}
            className="w-5 h-5 text-neutral-900 border-neutral-300 rounded focus:ring-neutral-500"
          />
          <span className="text-sm text-neutral-700">
            Billing address is the same as shipping address
          </span>
        </label>
      </div>
    </div>
  );
};

interface MobileOrderSummaryProps {
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export const MobileOrderSummary: React.FC<MobileOrderSummaryProps> = ({
  items,
  subtotal,
  shipping,
  tax,
  total
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        {/* Summary Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div>
            <h3 className="font-semibold text-neutral-900">Order Summary</h3>
            <p className="text-sm text-neutral-600">{items.length} items</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-neutral-900">${total.toFixed(2)}</div>
            <div className="text-sm text-neutral-600">
              {isExpanded ? 'Hide details' : 'Show details'}
            </div>
          </div>
        </button>

        {/* Expanded Details */}
        <motion.div
          initial={false}
          animate={{ height: isExpanded ? 'auto' : 0 }}
          className="overflow-hidden"
        >
          <div className="border-t border-neutral-200 p-4 space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3">
                  <img
                    src={item.images[0]}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-neutral-900 text-sm">{item.name}</h4>
                    <p className="text-xs text-neutral-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-sm font-medium text-neutral-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-neutral-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Subtotal</span>
                <span className="text-neutral-900">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Shipping</span>
                <span className="text-neutral-900">
                  {shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-600">Tax</span>
                <span className="text-neutral-900">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-base border-t border-neutral-200 pt-2">
                <span className="text-neutral-900">Total</span>
                <span className="text-neutral-900">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

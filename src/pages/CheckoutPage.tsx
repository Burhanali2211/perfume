import React, { useState } from 'react';
import { CreditCard, MapPin, Package, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { useOrders } from '../contexts/OrderContext';
import { createGuestOrder } from '../lib/supabase';
import { motion } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import { Link } from 'react-router-dom';
import {
  SecurityGuarantee,
  PaymentBadges,
  CheckoutTrustSignals,
  TrustBadges
} from '../components/Trust';
import {
  MobileCheckoutLayout,
  MobilePaymentSelector,
  MobileStepNavigation
} from '../components/Mobile/MobileCheckout';
import {
  MobileShippingForm,
  MobilePaymentForm,
  MobileOrderSummary
} from '../components/Mobile/MobileCheckoutForms';
import { useMobileDetection } from '../hooks/useMobileGestures';

export const CheckoutPage: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrders();
  const { showNotification } = useNotification();
  const { isMobile } = useMobileDetection();
  const [step, setStep] = useState(1);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');

  const [formData, setFormData] = useState({
    // Shipping Info
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Payment Info
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    
    // Options
    saveInfo: false,
    sameAsBilling: true,
  });

  const shipping = 15.99;
  const tax = total * 0.08;
  const finalTotal = total + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.address || !formData.city || !formData.state) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please fill in all required shipping information.'
        });
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showNotification({
          type: 'error',
          title: 'Invalid Email',
          message: 'Please enter a valid email address.'
        });
        return false;
      }
    }
    
    if (currentStep === 2) {
      if (!formData.cardNumber || !formData.expiryDate || !formData.cvv || !formData.cardName) {
        showNotification({
          type: 'error',
          title: 'Validation Error',
          message: 'Please fill in all required payment information.'
        });
        return false;
      }
      if (formData.cardNumber.replace(/\s/g, '').length < 16) {
        showNotification({
          type: 'error',
          title: 'Invalid Card Number',
          message: 'Please enter a valid card number.'
        });
        return false;
      }
      if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        showNotification({
          type: 'error',
          title: 'Invalid Expiry Date',
          message: 'Please enter expiry date in MM/YY format.'
        });
        return false;
      }
      if (formData.cvv.length < 3) {
        showNotification({
          type: 'error',
          title: 'Invalid CVV',
          message: 'Please enter a valid CVV.'
        });
        return false;
      }
    }
    
    return true;
  };

  const handleStepChange = (nextStep: number) => {
    if (validateStep(step)) {
      setStep(nextStep);
    }
  };

  const handlePlaceOrder = async () => {
    if (validateStep(step)) {
      const shippingAddress = {
        fullName: `${formData.firstName} ${formData.lastName}`,
        streetAddress: formData.address,
        city: formData.city,
        state: formData.state,
        postalCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone,
        // Legacy fields for backward compatibility
        street: formData.address,
        zipCode: formData.zipCode
      };

      let newOrderId: string | null = null;

      if (user) {
        // Authenticated user order
        newOrderId = await createOrder(
          items,
          shippingAddress,
          'Credit Card', // Payment method
          finalTotal
        );
      } else {
        // Guest user order
        newOrderId = await createGuestOrder({
          items,
          shippingAddress,
          paymentMethod: 'Credit Card',
          guestEmail: formData.email,
          guestName: `${formData.firstName} ${formData.lastName}`
        });
      }

      if (newOrderId) {
        setOrderId(newOrderId);
        setOrderComplete(true);
        clearCart();

        showNotification({
          type: 'success',
          title: 'Order Placed Successfully!',
          message: user
            ? 'Your order has been placed and you can track it in your account.'
            : 'Your order has been placed. You will receive updates via email.'
        });
      } else {
        showNotification({
          type: 'error',
          title: 'Order Failed',
          message: 'There was an error placing your order. Please try again.'
        });
      }
    }
  };

  // Guest checkout is now supported - no authentication required

  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Cart is Empty</h2>
          <p className="text-gray-600">Add some items to your cart before checking out.</p>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl p-10 text-center border border-neutral-200"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4 font-luxury">Order Confirmed!</h1>
          <p className="text-neutral-600 mb-8 leading-relaxed">
            Thank you for your purchase. Your order <span className="font-mono font-medium">#{orderId?.slice(0, 8)}</span> has been placed successfully and you'll receive a confirmation email shortly.
          </p>

          {/* Trust indicators */}
          <div className="bg-neutral-50 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-600 mb-1">✓</div>
                <div className="text-xs text-neutral-600">Secure Payment</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 mb-1">📦</div>
                <div className="text-xs text-neutral-600">Fast Shipping</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600 mb-1">🔄</div>
                <div className="text-xs text-neutral-600">Easy Returns</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {user ? (
              <>
                <Link to="/orders">
                  <button className="w-full btn-primary btn-lg">
                    Track Your Order
                  </button>
                </Link>
                <Link to="/products">
                  <button className="w-full btn-secondary btn-lg">
                    Continue Shopping
                  </button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-500 mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  A confirmation email has been sent to <span className="font-medium">{formData.email}</span> with your order details.
                </p>
                <Link to="/products">
                  <button className="w-full btn-primary btn-lg">
                    Continue Shopping
                  </button>
                </Link>
                <Link to="/auth/login">
                  <button className="w-full btn-secondary btn-lg">
                    Create an Account
                  </button>
                </Link>
              </>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // Mobile checkout flow
  if (isMobile) {
    const getStepTitle = () => {
      switch (step) {
        case 1: return 'Shipping Information';
        case 2: return 'Payment Method';
        case 3: return 'Review Order';
        default: return 'Checkout';
      }
    };

    const canProceed = () => {
      switch (step) {
        case 1:
          return formData.firstName && formData.lastName && formData.email &&
                 formData.phone && formData.address && formData.city &&
                 formData.state && formData.zipCode;
        case 2:
          if (selectedPaymentMethod === 'card') {
            return formData.cardNumber && formData.expiryDate &&
                   formData.cvv && formData.cardName;
          }
          return true;
        case 3:
          return true;
        default:
          return false;
      }
    };

    const handleMobileStepChange = (nextStep: number) => {
      if (validateStep(step)) {
        setStep(nextStep);
      }
    };

    const renderMobileStep = () => {
      switch (step) {
        case 1:
          return (
            <MobileShippingForm
              formData={formData}
              onChange={handleInputChange}
            />
          );
        case 2:
          return (
            <div className="space-y-6">
              <MobilePaymentSelector
                selectedMethod={selectedPaymentMethod}
                onMethodChange={setSelectedPaymentMethod}
              />
              <MobilePaymentForm
                formData={formData}
                onChange={handleInputChange}
                selectedPaymentMethod={selectedPaymentMethod}
              />
            </div>
          );
        case 3:
          return (
            <MobileOrderSummary
              items={items}
              subtotal={subtotal}
              shipping={shippingCost}
              tax={tax}
              total={finalTotal}
            />
          );
        default:
          return null;
      }
    };

    return (
      <>
        <MobileCheckoutLayout
          currentStep={step}
          totalSteps={3}
          onStepChange={handleMobileStepChange}
          onBack={() => step > 1 ? setStep(step - 1) : window.history.back()}
          stepTitle={getStepTitle()}
          canProceed={canProceed()}
        >
          {renderMobileStep()}
        </MobileCheckoutLayout>

        <MobileStepNavigation
          currentStep={step}
          totalSteps={3}
          onBack={step > 1 ? () => setStep(step - 1) : undefined}
          onNext={step < 3 ? () => handleMobileStepChange(step + 1) : handlePlaceOrder}
          canProceed={canProceed()}
          isLoading={false}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-4">
            <Link to="/products" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
              <div className="flex items-center space-x-4 mt-2">
                <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}>
                    1
                  </div>
                  <span className="text-sm font-medium">Shipping</span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}>
                    2
                  </div>
                  <span className="text-sm font-medium">Payment</span>
                </div>
                <div className="w-8 h-px bg-gray-300"></div>
                <div className={`flex items-center space-x-2 ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    step >= 3 ? 'bg-indigo-600 text-white' : 'bg-gray-200'
                  }`}>
                    3
                  </div>
                  <span className="text-sm font-medium">Review</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Shipping Information
                </h2>

                {!user && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Package className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-900">
                          Guest Checkout
                        </h3>
                        <p className="text-sm text-blue-700">
                          You're checking out as a guest. You'll receive order updates via email.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                  <motion.button
                    onClick={() => handleStepChange(2)}
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Continue to Payment
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </h2>

                {/* Payment Trust Badges */}
                <div className="mb-6">
                  <PaymentBadges className="mb-4" />
                  <TrustBadges variant="compact" showLabels={false} className="justify-center" />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="1234 5678 9012 3456"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="123"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Name on Card</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="mt-8 flex justify-between">
                  <motion.button
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={() => handleStepChange(3)}
                    className="btn-primary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Review Order
                  </motion.button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Review Your Order
                </h2>

                <div className="space-y-4 mb-8">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Security Guarantee */}
                <SecurityGuarantee className="mb-6" />

                <div className="flex justify-between">
                  <motion.button
                    onClick={() => setStep(2)}
                    className="btn-secondary"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Back
                  </motion.button>
                  <motion.button
                    onClick={handlePlaceOrder}
                    className="btn-primary !bg-green-600 !hover:bg-green-700 !focus:ring-green-600/20"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Place Order
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-28">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-semibold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-indigo-600">${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Checkout Trust Signals */}
              <CheckoutTrustSignals />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  CreditCard, 
  MapPin, 
  Package, 
  CheckCircle,
  Lock,
  Smartphone,
  Apple
} from 'lucide-react';
import { MobileTouchButton } from './MobileTouchButton';
import { useMobileDetection } from '../../hooks/useMobileGestures';

interface MobileCheckoutProps {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  onBack: () => void;
  children: React.ReactNode;
  stepTitle: string;
  canProceed: boolean;
  isLoading?: boolean;
}

export const MobileCheckoutLayout: React.FC<MobileCheckoutProps> = ({
  currentStep,
  totalSteps,
  onStepChange,
  onBack,
  children,
  stepTitle,
  canProceed,
  isLoading = false
}) => {
  const { isMobile } = useMobileDetection();

  if (!isMobile) {
    return <>{children}</>;
  }

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="px-3 sm:px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 transition-colors active:bg-neutral-200 touch-manipulation"
            >
              <ArrowLeft className="h-5 w-5 text-neutral-600" />
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-neutral-900">{stepTitle}</h1>
            <div className="text-xs sm:text-sm text-neutral-500">
              {currentStep}/{totalSteps}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-neutral-200 rounded-full h-1.5 sm:h-2">
            <motion.div
              className="bg-neutral-900 h-1.5 sm:h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Mobile-optimized form input component
interface MobileFormInputProps {
  label: string;
  type?: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export const MobileFormInput: React.FC<MobileFormInputProps> = ({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  icon: Icon
}) => {
  // Generate a unique ID for the input if name is provided
  const inputId = name ? `mobile-input-${name}` : undefined;

  return (
    <div className="space-y-2">
      <label 
        htmlFor={inputId}
        className="block text-sm font-medium text-neutral-900"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-neutral-400" />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`
            w-full px-4 py-4 text-base border border-neutral-300 rounded-xl
            focus:ring-2 focus:ring-neutral-500 focus:border-neutral-500
            transition-colors duration-200
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}
            touch-manipulation
          `}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}
    </div>
  );
};

// Mobile payment method selector
interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  available: boolean;
}

interface MobilePaymentSelectorProps {
  selectedMethod: string;
  onMethodChange: (methodId: string) => void;
}

export const MobilePaymentSelector: React.FC<MobilePaymentSelectorProps> = ({
  selectedMethod,
  onMethodChange
}) => {
  const paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, Amex',
      available: true
    },
    {
      id: 'apple-pay',
      name: 'Apple Pay',
      icon: Apple,
      description: 'Touch ID or Face ID',
      available: true
    },
    {
      id: 'google-pay',
      name: 'Google Pay',
      icon: Smartphone,
      description: 'Quick and secure',
      available: true
    }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-neutral-900">Payment Method</h3>
      <div className="space-y-3">
        {paymentMethods.map((method) => (
          <motion.button
            key={method.id}
            onClick={() => onMethodChange(method.id)}
            disabled={!method.available}
            className={`
              w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-200
              ${selectedMethod === method.id
                ? 'border-neutral-900 bg-neutral-50'
                : 'border-neutral-200 bg-white hover:border-neutral-300'
              }
              ${!method.available ? 'opacity-50 cursor-not-allowed' : ''}
              touch-manipulation
            `}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className={`
                p-2 rounded-lg
                ${selectedMethod === method.id ? 'bg-neutral-900 text-white' : 'bg-neutral-100 text-neutral-600'}
              `}>
                <method.icon className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-neutral-900 text-sm sm:text-base">{method.name}</div>
                <div className="text-xs sm:text-sm text-neutral-500">{method.description}</div>
              </div>
              {selectedMethod === method.id && (
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-neutral-900" />
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

// Mobile checkout step navigation
interface MobileStepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  canProceed: boolean;
  isLoading?: boolean;
}

export const MobileStepNavigation: React.FC<MobileStepNavigationProps> = ({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  nextLabel = 'Continue',
  canProceed,
  isLoading = false
}) => {
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-3 sm:p-4 safe-area-bottom">
      <div className="flex space-x-2 sm:space-x-3">
        {currentStep > 1 && onBack && (
          <MobileTouchButton
            onClick={onBack}
            variant="secondary"
            size="comfortable"
            className="flex-1"
          >
            Back
          </MobileTouchButton>
        )}
        
        {onNext && (
          <MobileTouchButton
            onClick={onNext}
            disabled={!canProceed || isLoading}
            loading={isLoading}
            variant="primary"
            size="comfortable"
            className="flex-1"
            icon={isLastStep ? CheckCircle : ArrowRight}
          >
            {isLastStep ? 'Place Order' : nextLabel}
          </MobileTouchButton>
        )}
      </div>
    </div>
  );
};

// Security indicator for mobile
export const MobileSecurityIndicator: React.FC = () => {
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Lock className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="font-medium text-green-900">Secure Checkout</div>
          <div className="text-sm text-green-700">Your information is protected with 256-bit SSL encryption</div>
        </div>
      </div>
    </div>
  );
};

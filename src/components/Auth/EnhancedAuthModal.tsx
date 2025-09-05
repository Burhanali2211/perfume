import React, { useState, useEffect } from 'react';
import {
  X, Eye, EyeOff, Mail, Lock, User, Phone, Calendar,
  ArrowLeft, CheckCircle, AlertCircle, Loader2,
  Shield, Fingerprint, Award, Sparkles, Crown
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

interface EnhancedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'forgot';
}

type AuthMode = 'login' | 'signup' | 'forgot' | 'verify' | 'reset';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const EnhancedAuthModal: React.FC<EnhancedAuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, signUp } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    agreeToTerms: false,
    subscribeNewsletter: true
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setStep(1);
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        agreeToTerms: false,
        subscribeNewsletter: true
      });
      setErrors({});
      // Prevent background scrolling when modal opens
      document.body.style.overflow = 'hidden';
    } else {
      // Restore background scrolling when modal closes
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      // Cleanup: Restore background scrolling when component unmounts
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialMode]);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter');
    if (!/\d/.test(password)) errors.push('One number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('One special character');

    return { isValid: errors.length === 0, errors };
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (mode === 'signup') {
      // Only apply strict validation for signup, not login
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors.join(', ');
      }
    }
    // For login, just check if password exists (no complexity requirements)

    // Signup specific validations
    if (mode === 'signup') {
      // Step 1 validations (email and password already checked above)
      if (step === 1) {
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
      }

      // Step 2 validations
      if (step === 2) {
        if (!formData.fullName.trim()) {
          newErrors.fullName = 'Full name is required';
        }

        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = 'You must agree to the terms and conditions';
        }

        if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
          newErrors.phone = 'Please enter a valid phone number';
        }

        if (!formData.address.trim()) {
          newErrors.address = 'Address is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Clear error when user starts typing
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        showNotification({
          type: 'success',
          title: 'Welcome back!',
          message: 'Successfully logged in.'
        });
        onClose();
      } else if (mode === 'signup') {
        if (step === 1) {
          setStep(2);
        } else {
          await signUp(formData.email, formData.password, {
            fullName: formData.fullName,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            address: formData.address,
            subscribeNewsletter: formData.subscribeNewsletter
          });
          setMode('verify');
          showNotification({
            type: 'success',
            title: 'Account created!',
            message: 'Please check your email to verify your account.'
          });
        }
      } else if (mode === 'forgot') {
        // Handle forgot password
        showNotification({
          type: 'success',
          title: 'Password reset link sent!',
          message: 'Check your email for instructions.'
        });
        setMode('login');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      showNotification({
        type: 'error',
        title: 'Authentication Error',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    const validation = validatePassword(password);
    const strength = Math.max(0, 5 - validation.errors.length);

    if (strength === 0) return { strength: 0, label: 'Very Weak', color: 'bg-red-500' };
    if (strength <= 2) return { strength: strength * 20, label: 'Weak', color: 'bg-orange-500' };
    if (strength <= 3) return { strength: strength * 20, label: 'Fair', color: 'bg-yellow-500' };
    if (strength <= 4) return { strength: strength * 20, label: 'Good', color: 'bg-blue-500' };
    return { strength: 100, label: 'Strong', color: 'bg-green-500' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-neutral-200 relative flex flex-col">
          {/* Branding Header */}
          <div className="relative bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {mode !== 'login' && mode !== 'verify' && (
              <button
                onClick={() => {
                  if (mode === 'signup' && step === 2) {
                    setStep(1);
                  } else {
                    setMode('login');
                  }
                }}
                className="absolute top-4 left-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
                aria-label="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="text-center mt-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                {mode === 'verify' ? (
                  <CheckCircle className="h-8 w-8" />
                ) : mode === 'forgot' || mode === 'reset' ? (
                  <Shield className="h-8 w-8" />
                ) : (
                  <User className="h-8 w-8" />
                )}
              </div>
              <h2 className="text-2xl font-bold">
                {mode === 'login' && 'Welcome to S.Essences'}
                {mode === 'signup' && (step === 1 ? 'Create Account' : 'Complete Profile')}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'verify' && 'Check Your Email'}
                {mode === 'reset' && 'New Password'}
              </h2>
              <p className="text-indigo-100 mt-2">
                {mode === 'login' && 'Sign in to discover premium attars'}
                {mode === 'signup' && (step === 1 ? 'Join our community of fragrance lovers' : 'Tell us about yourself')}
                {mode === 'forgot' && 'Enter your email to reset your password'}
                {mode === 'verify' && 'We sent a verification link to your email'}
                {mode === 'reset' && 'Enter your new password'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-grow">
            {mode === 'verify' ? (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Mail className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verification Email Sent</h3>
                  <p className="text-gray-600 mt-2">
                    We've sent a verification link to <strong>{formData.email}</strong>
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Didn't receive the email? Check your spam folder or{' '}
                    <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                      resend verification email
                    </button>
                  </p>
                </div>
                <button
                  onClick={() => setMode('login')}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Branding Section */}
                {(mode === 'login' || (mode === 'signup' && step === 1)) && (
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full px-4 py-2 mb-4">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-semibold text-purple-800">Premium Attar Collection</span>
                      <Crown className="h-5 w-5 text-amber-500" />
                    </div>
                    <p className="text-sm text-gray-600">
                      Experience the finest natural perfumes from around the world
                    </p>
                  </div>
                )}

                {/* Email Field */}
                {(mode === 'login' || mode === 'forgot' || (mode === 'signup' && step === 1)) && (
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-3">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-text-tertiary" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`input-field-luxury pl-10 ${
                          errors.email ? 'border-state-error focus:border-state-error focus:ring-state-error/20' : ''
                        }`}
                        placeholder="Enter your email"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-2 text-sm text-state-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                )}

                {/* Password Field */}
                {(mode === 'login' || mode === 'reset' || (mode === 'signup' && step === 1)) && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className={`form-input pl-10 pr-12 ${
                          errors.password ? 'form-input-error' : ''
                        }`}
                        placeholder="Enter your password"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-2 text-sm text-state-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                    
                    {/* Password Strength Indicator for Signup */}
                    {mode === 'signup' && step === 1 && formData.password && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>Password Strength</span>
                          <span className="font-medium">{getPasswordStrength(formData.password).label}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getPasswordStrength(formData.password).color} transition-all duration-300`}
                            style={{ width: `${getPasswordStrength(formData.password).strength}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Use 8+ characters with a mix of letters, numbers & symbols
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm Password Field (Signup Step 1) */}
                {mode === 'signup' && step === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`form-input pl-10 pr-12 ${
                          errors.confirmPassword ? 'form-input-error' : ''
                        }`}
                        placeholder="Confirm your password"
                        disabled={loading}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-state-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Full Name Field (Signup Step 2) */}
                {mode === 'signup' && step === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`form-input pl-10 ${
                          errors.fullName ? 'form-input-error' : ''
                        }`}
                        placeholder="Enter your full name"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-2 text-sm text-state-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                )}

                {/* Phone Field (Signup Step 2) */}
                {mode === 'signup' && step === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`form-input pl-10 ${
                          errors.phone ? 'form-input-error' : ''
                        }`}
                        placeholder="Enter your phone number"
                        disabled={loading}
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-2 text-sm text-state-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Date of Birth Field (Signup Step 2) */}
                {mode === 'signup' && step === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Date of Birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="form-input pl-10"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Address Field (Signup Step 2) - Updated Field */}
                {mode === 'signup' && step === 2 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-3">
                      Address
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-3 h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                      </svg>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="form-input pl-10"
                        placeholder="Enter your full address"
                        disabled={loading}
                        rows={3}
                        required
                      />
                    </div>
                    {errors.address && (
                      <p className="mt-2 text-sm text-state-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.address}
                      </p>
                    )}
                  </div>
                )}

                {/* Remember Me (Login) */}
                {mode === 'login' && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                        Remember me
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Newsletter Subscription (Signup Step 2) */}
                {mode === 'signup' && step === 2 && (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="subscribe-newsletter"
                        name="subscribe-newsletter"
                        type="checkbox"
                        checked={formData.subscribeNewsletter}
                        onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="subscribe-newsletter" className="font-medium text-gray-700">
                        Subscribe to our newsletter
                      </label>
                      <p className="text-gray-500">Get updates on new arrivals and special offers</p>
                    </div>
                  </div>
                )}

                {/* Terms Agreement (Signup Step 2) */}
                {mode === 'signup' && step === 2 && (
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="terms-agreement"
                        name="terms-agreement"
                        type="checkbox"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className={`h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded ${
                          errors.agreeToTerms ? 'border-state-error' : ''
                        }`}
                        disabled={loading}
                        required
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="terms-agreement" className="font-medium text-gray-700">
                        I agree to the <a href="#" className="text-indigo-600 hover:text-indigo-500">Terms and Conditions</a>
                      </label>
                      {errors.agreeToTerms && (
                        <p className="mt-1 text-sm text-state-error flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.agreeToTerms}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : mode === 'login' ? (
                      'Sign In'
                    ) : mode === 'signup' && step === 1 ? (
                      'Continue'
                    ) : mode === 'signup' && step === 2 ? (
                      'Create Account'
                    ) : mode === 'forgot' ? (
                      'Send Reset Link'
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>

                {/* Mode Toggle */}
                <div className="text-center text-sm text-gray-600">
                  {mode === 'login' ? (
                    <p>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('signup')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        disabled={loading}
                      >
                        Sign up
                      </button>
                    </p>
                  ) : mode === 'signup' ? (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        disabled={loading}
                      >
                        Sign in
                      </button>
                    </p>
                  ) : mode === 'forgot' ? (
                    <p>
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => setMode('login')}
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        disabled={loading}
                      >
                        Sign in
                      </button>
                    </p>
                  ) : null}
                </div>

                {/* Trust Indicators */}
                {(mode === 'login' || (mode === 'signup' && step === 1)) && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-1 text-green-500" />
                        <span>Secure</span>
                      </div>
                      <div className="flex items-center">
                        <Fingerprint className="h-4 w-4 mr-1 text-blue-500" />
                        <span>Private</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1 text-purple-500" />
                        <span>Trusted</span>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            )}
          </div>
      </div>
    </div>
  );
};
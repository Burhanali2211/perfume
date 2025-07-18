import React, { useState, useEffect } from 'react';
import {
  X, Eye, EyeOff, Mail, Lock, User, Phone, Calendar,
  ArrowLeft, CheckCircle, AlertCircle, Loader2,
  Chrome, Facebook, Apple, Shield, Star
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

  const { signIn, signUp } = useAuth();
  const { showNotification } = useNotification();

  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    phone: '',
    dateOfBirth: '',
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
        agreeToTerms: false,
        subscribeNewsletter: true
      });
      setErrors({});
    }
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
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(formData.email, formData.password);
        showNotification('Welcome back! Successfully logged in.', 'success');
        onClose();
      } else if (mode === 'signup') {
        if (step === 1) {
          setStep(2);
        } else {
          await signUp(formData.email, formData.password, {
            fullName: formData.fullName,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            subscribeNewsletter: formData.subscribeNewsletter
          });
          setMode('verify');
          showNotification('Account created! Please check your email to verify your account.', 'success');
        }
      } else if (mode === 'forgot') {
        // Handle forgot password
        showNotification('Password reset link sent to your email!', 'success');
        setMode('login');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred. Please try again.';
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google' | 'facebook' | 'apple') => {
    setLoading(true);
    try {
      // Implement social auth here
      showNotification(`${provider} authentication coming soon!`, 'info');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Social authentication failed';
      showNotification(errorMessage, 'error');
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
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden border border-neutral-200">
          {/* Header */}
          <div className="relative bg-neutral-900 text-white p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors duration-200"
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
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div className="text-center">
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
                {mode === 'login' && 'Welcome Back'}
                {mode === 'signup' && (step === 1 ? 'Create Account' : 'Complete Profile')}
                {mode === 'forgot' && 'Reset Password'}
                {mode === 'verify' && 'Check Your Email'}
                {mode === 'reset' && 'New Password'}
              </h2>
              <p className="text-indigo-100 mt-2">
                {mode === 'login' && 'Sign in to your account to continue'}
                {mode === 'signup' && (step === 1 ? 'Join thousands of happy customers' : 'Tell us a bit about yourself')}
                {mode === 'forgot' && 'Enter your email to reset your password'}
                {mode === 'verify' && 'We sent a verification link to your email'}
                {mode === 'reset' && 'Enter your new password'}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
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
                {/* Social Login Buttons */}
                {(mode === 'login' || (mode === 'signup' && step === 1)) && (
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => handleSocialAuth('google')}
                      disabled={loading}
                      className="w-full flex items-center justify-center space-x-3 border-2 border-neutral-200 rounded-lg py-3.5 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 disabled:opacity-50 font-medium"
                    >
                      <Chrome className="h-5 w-5 text-red-500" />
                      <span className="text-neutral-700">Continue with Google</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleSocialAuth('facebook')}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 border-2 border-neutral-200 rounded-lg py-3.5 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 disabled:opacity-50 font-medium"
                      >
                        <Facebook className="h-5 w-5 text-blue-600" />
                        <span className="text-neutral-700">Facebook</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSocialAuth('apple')}
                        disabled={loading}
                        className="flex items-center justify-center space-x-2 border-2 border-neutral-200 rounded-lg py-3.5 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 disabled:opacity-50 font-medium"
                      >
                        <Apple className="h-5 w-5 text-neutral-800" />
                        <span className="text-neutral-700">Apple</span>
                      </button>
                    </div>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-neutral-200" />
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-white text-neutral-500 font-medium">or continue with email</span>
                      </div>
                    </div>
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
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors duration-200"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="form-error flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.password}
                      </p>
                    )}

                    {/* Password Strength Indicator */}
                    {mode === 'signup' && formData.password && (
                      <div className="mt-2">
                        {(() => {
                          const strength = getPasswordStrength(formData.password);
                          return (
                            <div>
                              <div className="flex justify-between text-xs text-gray-600 mb-1">
                                <span>Password Strength</span>
                                <span className={strength.strength >= 80 ? 'text-green-600' : strength.strength >= 60 ? 'text-blue-600' : 'text-orange-600'}>
                                  {strength.label}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${strength.color}`}
                                  style={{ width: `${strength.strength}%` }}
                                />
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}

                {/* Confirm Password Field */}
                {mode === 'signup' && step === 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                )}

                {/* Step 2 Fields for Signup */}
                {mode === 'signup' && step === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.fullName}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            errors.fullName ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter your full name"
                          disabled={loading}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                            errors.phone ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="+1 (555) 123-4567"
                          disabled={loading}
                        />
                      </div>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth (Optional)
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Terms and Newsletter for Signup */}
                {mode === 'signup' && (
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={(e) => handleInputChange('agreeToTerms', e.target.checked)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="agreeToTerms" className="ml-2 text-sm text-gray-600">
                        I agree to the{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                          Privacy Policy
                        </a>
                      </label>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {errors.agreeToTerms}
                      </p>
                    )}

                    <div className="flex items-start">
                      <input
                        type="checkbox"
                        id="subscribeNewsletter"
                        checked={formData.subscribeNewsletter}
                        onChange={(e) => handleInputChange('subscribeNewsletter', e.target.checked)}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        disabled={loading}
                      />
                      <label htmlFor="subscribeNewsletter" className="ml-2 text-sm text-gray-600">
                        Subscribe to our newsletter for exclusive offers and updates
                      </label>
                    </div>
                  </div>
                )}

                {/* Forgot Password Link */}
                {mode === 'login' && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setMode('forgot')}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Forgot your password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' && 'Sign In'}
                      {mode === 'signup' && (step === 1 ? 'Continue' : 'Create Account')}
                      {mode === 'forgot' && 'Send Reset Link'}
                      {mode === 'reset' && 'Update Password'}
                    </>
                  )}
                </button>

                {/* Mode Switch */}
                {(mode === 'login' || (mode === 'signup' && step === 1)) && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                      <button
                        type="button"
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        {mode === 'login' ? 'Sign up' : 'Sign in'}
                      </button>
                    </p>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Trust Indicators */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Shield className="h-4 w-4" />
                  <span>Secure & Encrypted</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>Trusted by 10k+ users</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};
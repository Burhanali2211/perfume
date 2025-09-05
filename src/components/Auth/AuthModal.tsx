import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer' as 'admin' | 'seller' | 'customer',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Reset form state when switching between login and signup
  const switchMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setIsLoading(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'customer',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Enhanced validation
    const newErrors: Record<string, string> = {};

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (!isLogin && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!isLogin && !formData.name?.trim()) {
      newErrors.name = 'Full name is required for registration.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const errorMessage = await login(formData.email, formData.password);
        if (errorMessage) {
          let detailedError = errorMessage;
          if (errorMessage.includes('Invalid login credentials')) {
            detailedError = 'Invalid credentials. Please check your email and password.';
          } else if (errorMessage.includes('Email not confirmed')) {
            detailedError = 'Please confirm your email address before signing in.';
          } else if (errorMessage.includes('Too many requests')) {
            detailedError = 'Too many login attempts. Please wait a moment and try again.';
          } else if (errorMessage.includes('Account is temporarily locked')) {
            detailedError = 'Account is temporarily locked due to too many failed attempts. Please try again later.';
          }
          setErrors({ general: detailedError });
        } else {
          // Successfully logged in
          onClose();
          // Reset form state
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'customer',
          });
        }
      } else {
        const success = await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: formData.role
        });
        
        if (success) {
          // Successfully registered
          onClose();
          // Reset form state
          setFormData({
            name: '',
            email: '',
            password: '',
            role: 'customer',
          });
        } else {
          setErrors({ general: 'Registration failed. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Auth error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setErrors({ general: `${errorMessage}. Please try again.` });
    } finally {
      setIsLoading(false);
    }
  };

  const demoCredentials = [
    { email: 'admin@sufiessences.com', role: 'Admin', password: 'demo123' },
    { email: 'seller@sufiessences.com', role: 'Seller', password: 'demo123' },
    { email: 'customer@sufiessences.com', role: 'Customer', password: 'demo123' },
  ];

  const fillDemoCredentials = (email: string) => {
    setFormData({ ...formData, email, password: 'demo123' });
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={onClose}
            />

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>

              <div className="p-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {isLogin ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-gray-600 mt-2">
                    {isLogin ? 'Sign in to your account' : 'Sign up to get started'}
                  </p>
                </div>

                {/* Demo Credentials */}
                {isLogin && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-2">Demo Accounts:</h3>
                    <div className="space-y-1">
                      {demoCredentials.map((cred) => (
                        <button
                          key={cred.email}
                          onClick={() => fillDemoCredentials(cred.email)}
                          className="block w-full text-left text-sm text-blue-600 hover:text-blue-800"
                          aria-label={`Fill demo credentials for ${cred.role}`}
                        >
                          {cred.role}: {cred.email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div>
                      <label htmlFor="auth-fullname" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                          id="auth-fullname"
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className={`w-full pl-10 pr-4 py-3 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                          placeholder="Enter your full name"
                          required={!isLogin}
                        />
                      </div>
                      {errors.name && <p className="text-red-600 text-sm mt-1" role="alert">{errors.name}</p>}
                    </div>
                  )}

                  <div>
                    <label htmlFor="auth-email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="auth-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={`w-full pl-10 pr-4 py-3 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    {errors.email && <p className="text-red-600 text-sm mt-1" role="alert">{errors.email}</p>}
                  </div>

                  <div>
                    <label htmlFor="auth-password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full pl-10 pr-12 py-3 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500`}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-red-600 text-sm mt-1" role="alert">{errors.password}</p>}
                  </div>

                  {!isLogin && (
                    <div>
                      <label htmlFor="auth-role" className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <select
                        id="auth-role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'seller' | 'customer' })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="customer">Customer</option>
                        <option value="seller">Seller</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  )}

                  {errors.general && (
                    <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg" role="alert">
                      {errors.general}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full btn-primary"
                  >
                    {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={switchMode}
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    {isLogin ? 'Don\'t have an account? Sign up' : 'Already have an account? Sign in'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

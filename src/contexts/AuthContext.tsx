import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, getProfileForUser, createUserProfile, updateUserProfile } from '../lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useError } from './ErrorContext';

import { MobileAuthView } from '../components/Auth/MobileAuthView';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [isMobileAuthOpen, setIsMobileAuthOpen] = useState(false);
  const [mobileAuthMode, setMobileAuthMode] = useState<'login' | 'signup' | 'profile'>('login');
  const { setError } = useError();
  


  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Standard Supabase authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await handleUserSession(session.user);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError('Authentication initialization failed');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);



  // Handle auth state changes
  useEffect(() => {
    const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
      setLoading(true);

      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        setUser(null);
        // Clear any stored user data
        localStorage.removeItem('user_preferences');
        localStorage.removeItem('cart_items');
      }

      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => subscription?.unsubscribe();
  }, []);

  const handleUserSession = async (authUser: any) => {
    try {
      const profileData = await getProfileForUser(authUser.id);
      
      if (profileData) {
        const fullUser: User = {
          ...profileData,
          email: authUser.email!,
        };
        setUser(fullUser);
        setError(null);
      } else {
        // Create profile if it doesn't exist
        const newProfile = await createUserProfile({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata?.full_name || '',
          role: authUser.user_metadata?.role || 'customer',
          avatar: authUser.user_metadata?.avatar_url || '',
          phone: authUser.user_metadata?.phone || '',
          dateOfBirth: authUser.user_metadata?.date_of_birth || '',
        });
        
        if (newProfile) {
          setUser(newProfile);
        } else {
          setUser(null);
          setError('Failed to create user profile');
        }
      }
    } catch (err) {
      console.error('Session handling error:', err);
      // Fallback for direct login mode when RLS policies aren't set up
      if (import.meta.env.VITE_DIRECT_LOGIN_ENABLED === 'true') {
        console.log('Direct login mode: Creating temporary user profile');
        const directLoginRole = import.meta.env.VITE_DIRECT_LOGIN_DEFAULT_ROLE || 'admin';
        const tempUser: User = {
          id: authUser.id || 'direct-login-user',
          email: authUser.email || 'admin@sufiessences.com',
          name: 'Direct Login User',
          role: directLoginRole as 'admin' | 'seller' | 'customer',
          isActive: true,
          emailVerified: true,
          createdAt: new Date(),
        };
        setUser(tempUser);
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : 'Authentication error');
      setUser(null);
    }
  };



  // Standard Authentication Methods
  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // Handle specific error cases
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid credentials. Please check your email and password.');
      } else if (error.message.includes('Email not confirmed')) {
        throw new Error('Please confirm your email address before signing in.');
      } else if (error.message.includes('Too many requests')) {
        throw new Error('Too many login attempts. Please wait a moment and try again.');
      } else if (error.message.includes('Account is temporarily locked')) {
        throw new Error('Account is temporarily locked due to too many failed attempts. Please try again later.');
      } else {
        throw new Error(error.message);
      }
    }
  };

  const signUp = async (
    email: string,
    password: string,
    additionalData?: Record<string, unknown>
  ): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: additionalData?.fullName || '',
          phone: additionalData?.phone || '',
          date_of_birth: additionalData?.dateOfBirth || '',
          address: additionalData?.address || '',
          subscribe_newsletter: additionalData?.subscribeNewsletter || false,
          role: 'customer' // Default role for new users
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    
    // Clear user data
    setUser(null);
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('cart_items');
  };

  const logout = async () => {
    await signOut();
  };

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      await signIn(email, password);
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Login failed';
    }
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    try {
      await signUp(
        userData.email!,
        userData.password!,
        {
          fullName: userData.name,
          phone: userData.phone,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address || ''
        }
      );
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  // Mobile Authentication Methods
  const openMobileAuth = (mode: 'login' | 'signup' | 'profile' = 'login') => {
    setMobileAuthMode(mode);
    setIsMobileAuthOpen(true);
  };

  const closeMobileAuth = () => {
    setIsMobileAuthOpen(false);
  };

  const value: AuthContextType = {
    user,
    loading,
    loginAttempts,
    isLocked,
    signIn,
    signUp,
    logout,
    signOut,
    login,
    register,
    resetPassword: async () => {},
    updatePassword: async () => {},
    resendVerification: async () => {},
    updateProfile: async () => {},

    openMobileAuth,
    closeMobileAuth,
    isMobileAuthOpen,
    mobileAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Mobile Auth View */}
      <MobileAuthView 
        isOpen={isMobileAuthOpen}
        onClose={closeMobileAuth}
        initialMode={mobileAuthMode}
      />
    </AuthContext.Provider>
  );
};
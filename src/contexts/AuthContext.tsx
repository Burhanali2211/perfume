import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType } from '../types';
import { supabase, getProfileForUser } from '../lib/supabase';
import { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useError } from './ErrorContext';

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
  const { setError } = useError();

  useEffect(() => {
    const handleAuthStateChange = async (event: AuthChangeEvent, session: Session | null) => {
      setLoading(true);
      if (session?.user) {
        try {
          const profileData = await getProfileForUser(session.user.id);
          if (profileData) {
            const fullUser: User = {
              ...profileData,
              email: session.user.email!,
            };
            setUser(fullUser);
            setError(null); // Clear any previous errors on success
          } else {
            setUser(null);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Authentication error'); // Set global error state
          setUser(null); // Prevent app from continuing in a broken state
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      subscription?.unsubscribe();
    };
  }, [setError]);


  const login = async (email: string, password: string): Promise<string | null> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('Login error:', error.message);
      return error.message;
    }
    return null;
  };

  const register = async (userData: Partial<User>): Promise<boolean> => {
    if (!userData.email || !userData.password) {
        console.error("Email and password are required for registration.");
        return false;
    }
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.name,
          avatar_url: userData.avatar,
          role: userData.role || 'customer'
        }
      }
    });

    if (error) {
        console.error('Registration error:', error.message);
        return false;
    }
    
    // The onAuthStateChange listener will handle setting the user state
    return !!data.user;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error('Logout error:', error.message);
    }
    setUser(null);
  };

  // Enhanced authentication methods
  const signIn = async (email: string, password: string): Promise<void> => {
    console.log('🔐 Attempting signIn with:', { email, passwordLength: password.length });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    console.log('🔐 SignIn response:', { data: data?.user?.email, error: error?.message });
    if (error) {
      console.error('🔐 SignIn error details:', error);
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, additionalData?: Record<string, unknown>): Promise<void> => {
    console.log('📝 Attempting signUp with:', { email, passwordLength: password.length, additionalData });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: additionalData?.fullName || '',
          phone: additionalData?.phone || '',
          date_of_birth: additionalData?.dateOfBirth || '',
          subscribe_newsletter: additionalData?.subscribeNewsletter || false,
          role: 'customer'
        }
      }
    });
    console.log('📝 SignUp response:', { data: data?.user?.email, error: error?.message });

    if (error) {
      console.error('📝 SignUp error details:', error);
      throw new Error(error.message);
    }
  };

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message);
    }
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const resendVerification = async (): Promise<void> => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user?.email || ''
    });

    if (error) {
      throw new Error(error.message);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    if (!user) throw new Error('No user logged in');

    console.log('🔄 AuthContext updateProfile called with:', data);

    // Update auth user metadata
    const authUpdate: Record<string, string> = {};
    if (data.name) authUpdate.full_name = data.name;
    if (data.avatar) authUpdate.avatar_url = data.avatar;
    if (data.phone) authUpdate.phone = data.phone;

    if (Object.keys(authUpdate).length > 0) {
      const { error: authError } = await supabase.auth.updateUser({
        data: authUpdate
      });

      if (authError) {
        console.error('❌ Auth update error:', authError);
        throw new Error(authError.message);
      }
      console.log('✅ Auth metadata updated successfully');
    }

    // Update profile table
    const profileUpdate: Record<string, string> = {};
    if (data.name) profileUpdate.full_name = data.name;
    if (data.avatar) profileUpdate.avatar_url = data.avatar;
    if (data.phone) profileUpdate.phone = data.phone;
    if (data.dateOfBirth) profileUpdate.date_of_birth = data.dateOfBirth;

    if (Object.keys(profileUpdate).length > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user.id);

      if (profileError) {
        console.error('❌ Profile update error:', profileError);
        throw new Error(profileError.message);
      }
      console.log('✅ Profile table updated successfully');
    }

    // Refresh user data from database to ensure consistency
    try {
      const refreshedProfile = await getProfileForUser(user.id);
      if (refreshedProfile) {
        const fullUser: User = {
          ...refreshedProfile,
          email: user.email, // Keep the email from the current session
        };
        setUser(fullUser);
        console.log('✅ User state refreshed from database:', fullUser);
      }
    } catch (error) {
      console.error('❌ Error refreshing user profile:', error);
      // Fallback to local update if refresh fails
      setUser(prev => prev ? { ...prev, ...data } : null);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    register,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    resendVerification,
    updateProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

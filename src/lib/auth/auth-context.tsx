/**
 * Auth Context for Supabase Authentication
 *
 * Manages user authentication state and provides
 * hooks for sign in, sign up, and sign out.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useUserStore } from '@/lib/state/user-store';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

// ==================== TYPES ====================

interface AuthState {
  user: SupabaseUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

// ==================== CONTEXT ====================

const AuthContext = createContext<AuthContextType | null>(null);

// ==================== PROVIDER ====================

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Get user store actions
  const setSupabaseUserId = useUserStore((s) => s.setSupabaseUserId);
  const syncWithSupabase = useUserStore((s) => s.syncWithSupabase);

  // Initialize auth state
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setState((prev) => ({ ...prev, isLoading: false }));
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
      
      // Sync user data if authenticated
      if (session?.user) {
        setSupabaseUserId(session.user.id);
        syncWithSupabase(session.user.id);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
        isAuthenticated: !!session?.user,
      });
      
      // Sync user data on auth change
      if (session?.user) {
        setSupabaseUserId(session.user.id);
        syncWithSupabase(session.user.id);
      } else {
        setSupabaseUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSupabaseUserId, syncWithSupabase]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured()) return;

    await supabase.auth.signOut();
  }, []);

  // Reset password
  const resetPassword = useCallback(async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error ? new Error(error.message) : null };
  }, []);

  // Update password
  const updatePassword = useCallback(async (newPassword: string) => {
    if (!isSupabaseConfigured()) {
      return { error: new Error('Supabase not configured') };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error: error ? new Error(error.message) : null };
  }, []);

  const value: AuthContextType = {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==================== HOOKS ====================

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthUser() {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useAuthLoading() {
  const { isLoading } = useAuth();
  return isLoading;
}

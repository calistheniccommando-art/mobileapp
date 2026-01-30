/**
 * Supabase Auth Service
 *
 * Handles all authentication operations:
 * - Email/password signup & login
 * - Password reset
 * - Session management
 * - Profile sync with database
 */

import { supabase, isSupabaseConfigured } from './client';
import { userService, onboardingService } from './database';
import type { User as SupabaseUser, Session, AuthError } from '@supabase/supabase-js';
import type { User, UserInsert } from './types';

// ==================== TYPES ====================

export interface AuthResult {
  user: SupabaseUser | null;
  session: Session | null;
  error: AuthError | Error | null;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// ==================== AUTH SERVICE ====================

export const authService = {
  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        error: new Error('Supabase is not configured. Please add your credentials to .env'),
      };
    }

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
          },
        },
      });

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      // If signup successful and we have a user, create database profile
      if (authData.user) {
        try {
          await userService.create({
            id: authData.user.id,
            email: data.email,
            first_name: data.firstName || null,
            last_name: data.lastName || null,
          });
        } catch (dbError) {
          // Log but don't fail - profile can be created later
          console.warn('Failed to create user profile:', dbError);
        }
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<AuthResult> {
    if (!isSupabaseConfigured()) {
      return {
        user: null,
        session: null,
        error: new Error('Supabase is not configured. Please add your credentials to .env'),
      };
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        return { user: null, session: null, error: authError };
      }

      return {
        user: authData.user,
        session: authData.session,
        error: null,
      };
    } catch (error) {
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Send password reset email
   */
  async resetPassword(email: string): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase is not configured. Please add your credentials to .env'),
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window?.location?.origin || 'https://yourapp.com'}/reset-password`,
      });
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Update password (for logged-in users or after reset)
   */
  async updatePassword(newPassword: string): Promise<{ error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return {
        error: new Error('Supabase is not configured. Please add your credentials to .env'),
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      return { error };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Get current session
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return { session: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.getSession();
      return { session: data.session, error };
    } catch (error) {
      return {
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Get current user
   */
  async getUser(): Promise<{ user: SupabaseUser | null; error: AuthError | Error | null }> {
    if (!isSupabaseConfigured()) {
      return { user: null, error: null };
    }

    try {
      const { data, error } = await supabase.auth.getUser();
      return { user: data.user, error };
    } catch (error) {
      return {
        user: null,
        error: error instanceof Error ? error : new Error('Unknown error occurred'),
      };
    }
  },

  /**
   * Get user's database profile
   */
  async getUserProfile(userId: string): Promise<User | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    return userService.getById(userId);
  },

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    if (!isSupabaseConfigured()) {
      return false;
    }

    const onboarding = await onboardingService.getByUserId(userId);
    return onboarding?.completed ?? false;
  },

  /**
   * Listen for auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!isSupabaseConfigured()) {
      return { data: { subscription: { unsubscribe: () => {} } } };
    }

    return supabase.auth.onAuthStateChange(callback);
  },
};

export default authService;

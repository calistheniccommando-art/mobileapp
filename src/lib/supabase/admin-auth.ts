/**
 * ADMIN AUTHENTICATION SERVICE
 * Handles admin-specific authentication and role management
 */

import { supabase } from './client';
import type { User, Session } from '@supabase/supabase-js';

// Admin role hierarchy (higher index = more permissions)
export const ADMIN_ROLES = ['viewer', 'editor', 'admin', 'super_admin'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// Role permissions matrix
export const ROLE_PERMISSIONS = {
  viewer: {
    canView: true,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    canManageUsers: false,
    canManageAdmins: false,
    canViewAuditLog: true,
  },
  editor: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canManageUsers: false,
    canManageAdmins: false,
    canViewAuditLog: true,
  },
  admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageAdmins: false,
    canViewAuditLog: true,
  },
  super_admin: {
    canView: true,
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canManageUsers: true,
    canManageAdmins: true,
    canViewAuditLog: true,
  },
} as const;

export type RolePermissions = typeof ROLE_PERMISSIONS[AdminRole];

export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface AdminAuthResult {
  user: AdminUser | null;
  session: Session | null;
  error: Error | null;
}

/**
 * Get admin role from user metadata
 */
export function getAdminRole(user: User | null): AdminRole | null {
  if (!user) return null;
  
  const role = user.user_metadata?.role as string | undefined;
  
  // Check if role is a valid admin role
  if (role && ADMIN_ROLES.includes(role as AdminRole)) {
    return role as AdminRole;
  }
  
  return null;
}

/**
 * Check if user is an admin (any admin role)
 */
export function isAdmin(user: User | null): boolean {
  return getAdminRole(user) !== null;
}

/**
 * Check if user has at least the specified role level
 */
export function hasRoleLevel(user: User | null, requiredRole: AdminRole): boolean {
  const userRole = getAdminRole(user);
  if (!userRole) return false;
  
  const userRoleIndex = ADMIN_ROLES.indexOf(userRole);
  const requiredRoleIndex = ADMIN_ROLES.indexOf(requiredRole);
  
  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Get permissions for a user's role
 */
export function getPermissions(user: User | null): RolePermissions | null {
  const role = getAdminRole(user);
  if (!role) return null;
  
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | null, permission: keyof RolePermissions): boolean {
  const permissions = getPermissions(user);
  if (!permissions) return false;
  
  return permissions[permission];
}

/**
 * Admin sign in with email and password
 * Validates that the user has an admin role
 */
export async function adminSignIn(
  email: string,
  password: string
): Promise<AdminAuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, session: null, error };
    }

    if (!data.user) {
      return { 
        user: null, 
        session: null, 
        error: new Error('No user returned from sign in') 
      };
    }

    // Check if user has admin role
    const role = getAdminRole(data.user);
    if (!role) {
      // Sign out non-admin user
      await supabase.auth.signOut();
      return {
        user: null,
        session: null,
        error: new Error('Access denied. You do not have admin privileges.'),
      };
    }

    const adminUser: AdminUser = {
      id: data.user.id,
      email: data.user.email || email,
      role,
      firstName: data.user.user_metadata?.first_name,
      lastName: data.user.user_metadata?.last_name,
      avatarUrl: data.user.user_metadata?.avatar_url,
      createdAt: data.user.created_at,
    };

    return { user: adminUser, session: data.session, error: null };
  } catch (error) {
    return { 
      user: null, 
      session: null, 
      error: error instanceof Error ? error : new Error('Unknown error during admin sign in') 
    };
  }
}

/**
 * Admin sign out
 */
export async function adminSignOut(): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    return { 
      error: error instanceof Error ? error : new Error('Unknown error during sign out') 
    };
  }
}

/**
 * Get current admin user
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    const role = getAdminRole(user);
    if (!role) return null;
    
    return {
      id: user.id,
      email: user.email || '',
      role,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      avatarUrl: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
    };
  } catch {
    return null;
  }
}

/**
 * Get current admin session
 */
export async function getAdminSession(): Promise<Session | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;
    
    // Verify user has admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !isAdmin(user)) return null;
    
    return session;
  } catch {
    return null;
  }
}

/**
 * Update admin user's role (super_admin only)
 */
export async function updateAdminRole(
  targetUserId: string,
  newRole: AdminRole
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // This requires the service role key and should be done via an edge function
    // For now, we'll update the user metadata through the admin API
    const { error } = await supabase.auth.admin.updateUserById(targetUserId, {
      user_metadata: { role: newRole },
    });

    if (error) {
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error('Failed to update admin role'),
    };
  }
}

/**
 * Get all admin users (requires admin role)
 */
export async function getAllAdmins(): Promise<{ admins: AdminUser[]; error: Error | null }> {
  try {
    // This would typically be done via a server function or edge function
    // that uses the service role key to list users
    // For now, we'll return an empty array as this requires backend setup
    
    // TODO: Implement via Supabase Edge Function
    return { admins: [], error: null };
  } catch (error) {
    return {
      admins: [],
      error: error instanceof Error ? error : new Error('Failed to fetch admin users'),
    };
  }
}

/**
 * Listen to admin auth state changes
 */
export function onAdminAuthStateChange(
  callback: (admin: AdminUser | null) => void
) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
      callback(null);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      callback(null);
      return;
    }

    const role = getAdminRole(user);
    if (!role) {
      callback(null);
      return;
    }

    callback({
      id: user.id,
      email: user.email || '',
      role,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      avatarUrl: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
    });
  });
}

// Admin auth service object for convenient imports
export const adminAuthService = {
  signIn: adminSignIn,
  signOut: adminSignOut,
  getCurrentAdmin,
  getAdminSession,
  updateAdminRole,
  getAllAdmins,
  onAdminAuthStateChange,
  getAdminRole,
  isAdmin,
  hasRoleLevel,
  getPermissions,
  hasPermission,
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
};

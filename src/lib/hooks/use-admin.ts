/**
 * ADMIN HOOKS
 * React hooks for admin authentication and permissions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase/client';
import {
  adminAuthService,
  type AdminUser,
  type AdminRole,
  type RolePermissions,
  ADMIN_ROLES,
  ROLE_PERMISSIONS,
} from '@/lib/supabase/admin-auth';

/**
 * Hook to manage admin authentication state
 */
export function useAdmin() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Check current admin on mount
  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      try {
        const currentAdmin = await adminAuthService.getCurrentAdmin();
        if (isMounted) {
          setAdmin(currentAdmin);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to check admin status'));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkAdmin();

    // Subscribe to auth changes
    const { data: { subscription } } = adminAuthService.onAdminAuthStateChange((adminUser) => {
      if (isMounted) {
        setAdmin(adminUser);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    const result = await adminAuthService.signIn(email, password);

    if (result.error) {
      setError(result.error);
      setAdmin(null);
    } else {
      setAdmin(result.user);
    }

    setIsLoading(false);
    return result;
  }, []);

  // Sign out function
  const signOut = useCallback(async () => {
    setIsLoading(true);
    const result = await adminAuthService.signOut();
    
    if (!result.error) {
      setAdmin(null);
    } else {
      setError(result.error);
    }
    
    setIsLoading(false);
    return result;
  }, []);

  // Refresh admin data
  const refresh = useCallback(async () => {
    const currentAdmin = await adminAuthService.getCurrentAdmin();
    setAdmin(currentAdmin);
    return currentAdmin;
  }, []);

  return {
    admin,
    isLoading,
    isAuthenticated: admin !== null,
    error,
    signIn,
    signOut,
    refresh,
  };
}

/**
 * Hook to check admin permissions
 */
export function useAdminPermissions() {
  const { admin, isLoading } = useAdmin();

  const permissions = useMemo<RolePermissions | null>(() => {
    if (!admin) return null;
    return ROLE_PERMISSIONS[admin.role];
  }, [admin]);

  const role = admin?.role ?? null;

  // Check if user has at least the specified role level
  const hasRoleLevel = useCallback((requiredRole: AdminRole): boolean => {
    if (!role) return false;
    
    const userRoleIndex = ADMIN_ROLES.indexOf(role);
    const requiredRoleIndex = ADMIN_ROLES.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [role]);

  // Check specific permission
  const hasPermission = useCallback((permission: keyof RolePermissions): boolean => {
    if (!permissions) return false;
    return permissions[permission];
  }, [permissions]);

  // Convenience permission checks
  const canView = permissions?.canView ?? false;
  const canCreate = permissions?.canCreate ?? false;
  const canEdit = permissions?.canEdit ?? false;
  const canDelete = permissions?.canDelete ?? false;
  const canManageUsers = permissions?.canManageUsers ?? false;
  const canManageAdmins = permissions?.canManageAdmins ?? false;
  const canViewAuditLog = permissions?.canViewAuditLog ?? false;

  return {
    role,
    permissions,
    isLoading,
    hasRoleLevel,
    hasPermission,
    canView,
    canCreate,
    canEdit,
    canDelete,
    canManageUsers,
    canManageAdmins,
    canViewAuditLog,
    isSuperAdmin: role === 'super_admin',
    isAdmin: role === 'admin' || role === 'super_admin',
    isEditor: hasRoleLevel('editor'),
    isViewer: hasRoleLevel('viewer'),
  };
}

/**
 * Hook to require admin authentication
 * Returns true when admin is authenticated, false when loading, throws if not authenticated after loading
 */
export function useRequireAdmin(requiredRole?: AdminRole) {
  const { admin, isLoading, isAuthenticated } = useAdmin();

  const isAuthorized = useMemo(() => {
    if (!isAuthenticated || !admin) return false;
    
    if (!requiredRole) return true;
    
    const userRoleIndex = ADMIN_ROLES.indexOf(admin.role);
    const requiredRoleIndex = ADMIN_ROLES.indexOf(requiredRole);
    
    return userRoleIndex >= requiredRoleIndex;
  }, [isAuthenticated, admin, requiredRole]);

  return {
    isLoading,
    isAuthenticated,
    isAuthorized,
    admin,
    shouldRedirect: !isLoading && (!isAuthenticated || !isAuthorized),
  };
}

/**
 * Hook to check if current admin can perform action on another admin
 */
export function useCanManageAdmin(targetRole?: AdminRole) {
  const { admin, isLoading } = useAdmin();

  const canManage = useMemo(() => {
    if (!admin || !targetRole) return false;
    
    // Only super_admin can manage other admins
    if (admin.role !== 'super_admin') return false;
    
    // Cannot demote yourself (would need separate handling)
    return true;
  }, [admin, targetRole]);

  return { canManage, isLoading };
}

/**
 * Hook to get admin loading state only
 */
export function useAdminLoading() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdmin = async () => {
      await adminAuthService.getCurrentAdmin();
      if (isMounted) {
        setIsLoading(false);
      }
    };

    checkAdmin();

    return () => {
      isMounted = false;
    };
  }, []);

  return isLoading;
}

/**
 * Role display names
 */
export const ROLE_DISPLAY_NAMES: Record<AdminRole, string> = {
  viewer: 'Viewer',
  editor: 'Editor',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

/**
 * Role colors for UI
 */
export const ROLE_COLORS: Record<AdminRole, { bg: string; text: string }> = {
  viewer: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  editor: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  admin: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  super_admin: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
};

export { ADMIN_ROLES, ROLE_PERMISSIONS };
export type { AdminUser, AdminRole, RolePermissions };

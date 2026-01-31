/**
 * Supabase Module Index
 *
 * Central export point for all Supabase-related functionality.
 */

// Client
export { supabase, isSupabaseConfigured } from './client';
export type { SupabaseClient } from './client';

// Auth service
export { authService } from './auth';
export type { AuthResult, SignUpData, SignInData } from './auth';

// Admin Auth service
export { adminAuthService, ADMIN_ROLES, ROLE_PERMISSIONS } from './admin-auth';
export type { AdminUser, AdminRole, AdminAuthResult, RolePermissions } from './admin-auth';

// Database service
export { db, DatabaseError } from './database';
export {
  userService,
  onboardingService,
  planService,
  exerciseService,
  workoutTemplateService,
  mealService,
  dailyProgressService,
  subscriptionService,
  auditLogService,
} from './database';

// Types
export * from './types';

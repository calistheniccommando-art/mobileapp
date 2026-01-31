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
  exerciseService as dbExerciseService,
  workoutTemplateService,
  mealService,
  dailyProgressService,
  subscriptionService,
  auditLogService,
} from './database';

// Exercise CRUD service (admin)
export { exerciseService } from './exercises';
export {
  MUSCLE_GROUP_LABELS,
  EXERCISE_TYPE_LABELS,
  DIFFICULTY_LABELS,
  MUSCLE_GROUP_COLORS,
} from './exercises';
export type {
  Exercise,
  ExerciseInsert,
  ExerciseUpdate,
  ExerciseFilters,
  ExerciseListOptions,
  ExerciseListResult,
} from './exercises';

// Workout CRUD service (admin)
export { workoutService } from './workouts';
export type {
  WorkoutTemplate,
  WorkoutTemplateInsert,
  WorkoutTemplateUpdate,
  WorkoutTemplateWithExercises,
  WorkoutFilters,
  WorkoutListOptions,
  WorkoutListResult,
} from './workouts';

// Types
export * from './types';

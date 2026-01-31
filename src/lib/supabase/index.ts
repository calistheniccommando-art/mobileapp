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

// Meal CRUD service (admin)
export { mealService as mealCrudService } from './meals';
export {
  MEAL_TYPE_LABELS,
  CALORIE_CATEGORY_LABELS,
  MEAL_REGION_LABELS,
  DIETARY_TAG_LABELS,
  GOAL_LABELS,
  MEAL_TYPE_COLORS,
  CALORIE_CATEGORY_COLORS,
} from './meals';
export type {
  Meal,
  MealInsert,
  MealUpdate,
  MealType,
  CalorieCategory,
  MealRegion,
  DietaryTag,
  MealFilters,
  MealListOptions,
  MealListResult,
} from './meals';

// Fasting CRUD service (admin)
export { fastingService } from './fasting';
export {
  FASTING_PROTOCOL_LABELS,
  FASTING_PROTOCOL_DESCRIPTIONS,
  FASTING_DIFFICULTY_LABELS,
  FASTING_PROTOCOL_COLORS,
  FASTING_DIFFICULTY_COLORS,
  DEFAULT_FASTING_PLANS,
} from './fasting';
export type {
  FastingPlan,
  FastingPlanInsert,
  FastingPlanUpdate,
  FastingProtocol,
  FastingDifficulty,
  FastingFilters,
  FastingListOptions,
  FastingListResult,
} from './fasting';

// Types
export * from './types';

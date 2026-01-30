/**
 * API TYPES
 *
 * Typed interfaces for all API endpoints.
 * These types define the contract between frontend, backend, and admin.
 */

import type {
  UserProfile,
  WorkoutPlan,
  Exercise,
  Meal,
  MealPlan,
  FastingPlan,
  FastingWindow,
  DailyPlan,
  DifficultyLevel,
  MealIntensity,
  WorkType,
  AuthProvider,
} from '@/types/fitness';

// ==================== COMMON API TYPES ====================

/** Standard API response wrapper */
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
  meta?: APIMeta;
}

/** API error structure */
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}

/** API metadata for pagination and caching */
export interface APIMeta {
  timestamp: string;
  requestId: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
  };
  cache?: {
    hit: boolean;
    ttl: number;
    etag: string;
  };
}

/** Common query parameters */
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

// ==================== AUTH API ====================

export interface AuthLoginRequest {
  email: string;
  password?: string;
  provider: AuthProvider;
  providerId?: string;
  idToken?: string; // For social auth
}

export interface AuthLoginResponse {
  user: {
    id: string;
    email: string;
    emailVerified: boolean;
  };
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  isNewUser: boolean;
}

export interface AuthRefreshRequest {
  refreshToken: string;
}

export interface AuthRefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// ==================== USER API ====================

export interface CreateUserProfileRequest {
  email: string;
  firstName: string;
  lastName: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  dateOfBirth?: string;
  weight: number;
  height?: number;
  workType: WorkType;
  fitnessGoal?: 'lose_weight' | 'maintain' | 'build_muscle' | 'improve_health';
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  weight?: number;
  height?: number;
  workType?: WorkType;
  fitnessGoal?: string;
  // Manual overrides
  fastingPlanOverride?: FastingPlan;
  workoutDifficultyOverride?: DifficultyLevel;
  mealIntensityOverride?: MealIntensity;
}

export interface UserProfileResponse {
  profile: UserProfile;
  personalization: {
    fastingPlan: FastingPlan;
    workoutDifficulty: DifficultyLevel;
    mealIntensity: MealIntensity;
    isOverridden: boolean;
  };
  stats: {
    workoutsCompleted: number;
    mealsLogged: number;
    fastingStreak: number;
    memberSince: string;
  };
}

// ==================== DAILY PLAN API ====================

export interface GetDailyPlanRequest {
  date: string; // ISO date string
  includeWorkout?: boolean;
  includeMeals?: boolean;
  includeFasting?: boolean;
}

export interface DailyPlanResponse {
  plan: DailyPlan;
  workout: EnrichedWorkoutResponse | null;
  mealPlan: EnrichedMealPlanResponse | null;
  fasting: FastingStatusResponse;
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
  pdfAvailable: boolean;
}

export interface EnrichedWorkoutResponse {
  workout: WorkoutPlan;
  exercises: (Exercise & {
    hasVideo: boolean;
    videoUrl?: string;
    thumbnailUrl?: string;
    isCompleted: boolean;
  })[];
  estimatedDuration: number;
  estimatedCalories: number;
  completionPercent: number;
}

export interface EnrichedMealPlanResponse {
  mealPlan: MealPlan;
  scheduledMeals: {
    meal: Meal;
    scheduledTime: string;
    isWithinWindow: boolean;
    isCompleted: boolean;
  }[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface FastingStatusResponse {
  plan: FastingPlan;
  window: FastingWindow;
  currentPhase: 'eating' | 'fasting';
  phaseStartTime: string;
  phaseEndTime: string;
  percentComplete: number;
  timeRemaining: {
    hours: number;
    minutes: number;
  };
  nextMealTime: string | null;
}

export interface GetWeeklyPlanRequest {
  startDate: string;
}

export interface WeeklyPlanResponse {
  startDate: string;
  endDate: string;
  days: DailyPlanResponse[];
  summary: {
    totalWorkouts: number;
    restDays: number;
    avgCalories: number;
    totalProtein: number;
  };
}

// ==================== CONTENT API ====================

export interface GetWorkoutsRequest extends PaginationParams {
  difficulty?: DifficultyLevel;
  muscleGroups?: string[];
  dayOfWeek?: number;
}

export interface GetMealsRequest extends PaginationParams {
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  intensity?: MealIntensity;
  dietaryTags?: string[];
}

export interface GetExerciseRequest {
  exerciseId: string;
  includeVideo?: boolean;
}

export interface GetMealRequest {
  mealId: string;
  includePrepVideo?: boolean;
}

// ==================== PROGRESS API ====================

export interface LogWorkoutProgressRequest {
  dailyPlanId: string;
  exercisesCompleted: string[];
  duration: number;
  notes?: string;
}

export interface LogMealProgressRequest {
  dailyPlanId: string;
  mealId: string;
  completed: boolean;
  notes?: string;
}

export interface LogFastingProgressRequest {
  date: string;
  actualFastingStart?: string;
  actualFastingEnd?: string;
  completed: boolean;
  notes?: string;
}

export interface ProgressSummaryResponse {
  period: 'day' | 'week' | 'month';
  workouts: {
    completed: number;
    total: number;
    streak: number;
  };
  meals: {
    logged: number;
    total: number;
    avgCalories: number;
  };
  fasting: {
    compliant: number;
    total: number;
    avgFastingHours: number;
  };
}

// ==================== PDF API ====================

export interface GeneratePDFRequest {
  type: 'daily' | 'weekly';
  date: string;
  templateId?: string;
  options: {
    includeWorkout: boolean;
    includeMeals: boolean;
    includeFasting: boolean;
    includeNutrition: boolean;
  };
}

export interface GeneratePDFResponse {
  pdfUrl: string;
  expiresAt: string;
  fileSize: number;
}

// ==================== ADMIN API ====================

export interface AdminContentListRequest extends PaginationParams {
  status?: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';
  contentType?: 'workout' | 'exercise' | 'meal' | 'video' | 'fasting_plan';
  createdBy?: string;
}

export interface AdminApproveContentRequest {
  contentId: string;
  contentType: string;
  approved: boolean;
  notes?: string;
}

export interface AdminOverrideUserPlanRequest {
  userId: string;
  date: string;
  overrideType: 'workout' | 'meal' | 'fasting';
  newValue: string;
  reason: string;
}

export interface AdminAuditLogRequest extends PaginationParams, DateRangeParams {
  action?: string;
  category?: string;
  performedBy?: string;
}

// ==================== WEBHOOK EVENTS ====================

export type WebhookEventType =
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'content.created'
  | 'content.approved'
  | 'content.rejected'
  | 'plan.generated'
  | 'plan.override_applied'
  | 'pdf.generated';

export interface WebhookEvent<T = unknown> {
  id: string;
  type: WebhookEventType;
  timestamp: string;
  data: T;
  metadata: {
    source: 'mobile' | 'admin' | 'system';
    version: string;
  };
}

// ==================== ERROR CODES ====================

export const API_ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_001',
  AUTH_TOKEN_EXPIRED: 'AUTH_002',
  AUTH_TOKEN_INVALID: 'AUTH_003',
  AUTH_ACCOUNT_DISABLED: 'AUTH_004',

  // User errors
  USER_NOT_FOUND: 'USER_001',
  USER_PROFILE_INCOMPLETE: 'USER_002',
  USER_VALIDATION_FAILED: 'USER_003',

  // Content errors
  CONTENT_NOT_FOUND: 'CONTENT_001',
  CONTENT_NOT_APPROVED: 'CONTENT_002',
  CONTENT_VALIDATION_FAILED: 'CONTENT_003',

  // Plan errors
  PLAN_NOT_FOUND: 'PLAN_001',
  PLAN_GENERATION_FAILED: 'PLAN_002',
  PLAN_ALREADY_EXISTS: 'PLAN_003',

  // PDF errors
  PDF_GENERATION_FAILED: 'PDF_001',
  PDF_TEMPLATE_NOT_FOUND: 'PDF_002',

  // System errors
  SYSTEM_INTERNAL_ERROR: 'SYS_001',
  SYSTEM_SERVICE_UNAVAILABLE: 'SYS_002',
  SYSTEM_RATE_LIMITED: 'SYS_003',
} as const;

export type APIErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

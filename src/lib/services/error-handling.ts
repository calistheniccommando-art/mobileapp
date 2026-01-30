/**
 * ERROR HANDLING & FALLBACK SYSTEM
 *
 * Centralized error handling, fallback data, and resilience patterns.
 * Ensures the app remains functional even when backend is unavailable.
 */

import type {
  DailyPlan,
  WorkoutPlan,
  MealPlan,
  FastingWindow,
  FastingPlan,
  DifficultyLevel,
  MealIntensity,
} from '@/types/fitness';
import { getFastingWindow, getMealPlanForIntensity, getWorkoutForDayWithDifficulty } from '@/data/mock-data';

// ==================== ERROR TYPES ====================

export type ErrorSeverity = 'critical' | 'warning' | 'info';
export type ErrorCategory = 'network' | 'auth' | 'validation' | 'content' | 'system';

export interface AppError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: string;
  recoverable: boolean;
  fallbackApplied?: boolean;
  originalError?: unknown;
  context?: Record<string, unknown>;
}

// ==================== ERROR CODES ====================

export const ERROR_CODES = {
  // Network errors
  NETWORK_OFFLINE: 'NET_001',
  NETWORK_TIMEOUT: 'NET_002',
  NETWORK_SERVER_ERROR: 'NET_003',

  // Auth errors
  AUTH_SESSION_EXPIRED: 'AUTH_001',
  AUTH_INVALID_TOKEN: 'AUTH_002',
  AUTH_ACCOUNT_LOCKED: 'AUTH_003',

  // Content errors
  CONTENT_NOT_FOUND: 'CNT_001',
  CONTENT_MISSING_WORKOUT: 'CNT_002',
  CONTENT_MISSING_MEAL: 'CNT_003',
  CONTENT_MISSING_FASTING: 'CNT_004',
  CONTENT_VIDEO_UNAVAILABLE: 'CNT_005',

  // Validation errors
  VALIDATION_PROFILE_INCOMPLETE: 'VAL_001',
  VALIDATION_INVALID_DATE: 'VAL_002',
  VALIDATION_INVALID_PARAMS: 'VAL_003',

  // System errors
  SYSTEM_UNKNOWN: 'SYS_001',
  SYSTEM_STORAGE_FULL: 'SYS_002',
  SYSTEM_PERMISSION_DENIED: 'SYS_003',
} as const;

// ==================== ERROR FACTORY ====================

let errorCounter = 0;

export function createAppError(
  code: string,
  message: string,
  options: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    recoverable?: boolean;
    fallbackApplied?: boolean;
    originalError?: unknown;
    context?: Record<string, unknown>;
  } = {}
): AppError {
  return {
    id: `err_${Date.now()}_${++errorCounter}`,
    code,
    message,
    severity: options.severity ?? 'warning',
    category: options.category ?? 'system',
    timestamp: new Date().toISOString(),
    recoverable: options.recoverable ?? true,
    fallbackApplied: options.fallbackApplied,
    originalError: options.originalError,
    context: options.context,
  };
}

// ==================== ERROR HANDLERS ====================

export function handleNetworkError(error: unknown): AppError {
  const errorMessage = error instanceof Error ? error.message : 'Network error occurred';

  if (errorMessage.includes('timeout')) {
    return createAppError(ERROR_CODES.NETWORK_TIMEOUT, 'Request timed out. Please try again.', {
      severity: 'warning',
      category: 'network',
      recoverable: true,
      originalError: error,
    });
  }

  if (errorMessage.includes('offline') || errorMessage.includes('network')) {
    return createAppError(
      ERROR_CODES.NETWORK_OFFLINE,
      "You're offline. Using cached data where available.",
      {
        severity: 'info',
        category: 'network',
        recoverable: true,
        fallbackApplied: true,
        originalError: error,
      }
    );
  }

  return createAppError(ERROR_CODES.NETWORK_SERVER_ERROR, 'Server error. Please try again later.', {
    severity: 'warning',
    category: 'network',
    recoverable: true,
    originalError: error,
  });
}

export function handleContentError(
  contentType: 'workout' | 'meal' | 'fasting' | 'video',
  error?: unknown
): AppError {
  const codeMap = {
    workout: ERROR_CODES.CONTENT_MISSING_WORKOUT,
    meal: ERROR_CODES.CONTENT_MISSING_MEAL,
    fasting: ERROR_CODES.CONTENT_MISSING_FASTING,
    video: ERROR_CODES.CONTENT_VIDEO_UNAVAILABLE,
  };

  const messageMap = {
    workout: 'Workout not available. Showing alternative.',
    meal: 'Meal plan not available. Showing alternative.',
    fasting: 'Fasting plan not available. Using default.',
    video: 'Video not available. Please check your connection.',
  };

  return createAppError(codeMap[contentType], messageMap[contentType], {
    severity: contentType === 'video' ? 'info' : 'warning',
    category: 'content',
    recoverable: true,
    fallbackApplied: contentType !== 'video',
    originalError: error,
    context: { contentType },
  });
}

// ==================== FALLBACK DATA GENERATORS ====================

/**
 * Generate fallback daily plan when backend is unavailable
 */
export function generateFallbackDailyPlan(
  date: Date,
  options: {
    fastingPlan?: FastingPlan;
    workoutDifficulty?: DifficultyLevel;
    mealIntensity?: MealIntensity;
  } = {}
): { plan: DailyPlan; errors: AppError[] } {
  const errors: AppError[] = [];
  const dayOfWeek = date.getDay();
  const isRestDay = dayOfWeek === 0;
  const dateString = date.toISOString().split('T')[0];

  // Default values
  const fastingPlan = options.fastingPlan ?? '16:8';
  const workoutDifficulty = options.workoutDifficulty ?? 'beginner';
  const mealIntensity = options.mealIntensity ?? 'standard';

  // Get fasting window
  let fasting: FastingWindow | null = null;
  try {
    fasting = getFastingWindow(fastingPlan);
  } catch {
    errors.push(handleContentError('fasting'));
    fasting = getFastingWindow('16:8'); // Default fallback
  }

  // Get workout
  let workout: WorkoutPlan | null = null;
  if (!isRestDay) {
    try {
      workout = getWorkoutForDayWithDifficulty(dayOfWeek, workoutDifficulty);
      if (!workout) {
        errors.push(handleContentError('workout'));
      }
    } catch {
      errors.push(handleContentError('workout'));
    }
  }

  // Get meal plan
  let meals: MealPlan | null = null;
  try {
    meals = getMealPlanForIntensity(dayOfWeek, mealIntensity);
    if (!meals) {
      errors.push(handleContentError('meal'));
    }
  } catch {
    errors.push(handleContentError('meal'));
  }

  const plan: DailyPlan = {
    id: `fallback-${dateString}`,
    date: dateString,
    workout,
    meals,
    fasting,
    isRestDay,
  };

  return { plan, errors };
}

/**
 * Get fallback workout when specific workout is unavailable
 */
export function getFallbackWorkout(
  dayOfWeek: number,
  difficulty: DifficultyLevel
): WorkoutPlan | null {
  // Try to get workout for day
  let workout = getWorkoutForDayWithDifficulty(dayOfWeek, difficulty);

  // If no workout for day, try lower difficulty
  if (!workout) {
    const fallbackDifficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    const currentIndex = fallbackDifficulties.indexOf(difficulty);

    for (let i = currentIndex - 1; i >= 0; i--) {
      workout = getWorkoutForDayWithDifficulty(dayOfWeek, fallbackDifficulties[i]);
      if (workout) break;
    }
  }

  // If still no workout, try any day
  if (!workout) {
    for (let day = 1; day <= 6; day++) {
      workout = getWorkoutForDayWithDifficulty(day, difficulty);
      if (workout) break;
    }
  }

  return workout;
}

/**
 * Get fallback meal plan when specific plan is unavailable
 */
export function getFallbackMealPlan(dayOfWeek: number, intensity: MealIntensity): MealPlan | null {
  // Try to get meal plan for day
  let mealPlan = getMealPlanForIntensity(dayOfWeek, intensity);

  // If no meal plan for day, try different intensity
  if (!mealPlan) {
    const fallbackIntensities: MealIntensity[] = ['standard', 'light', 'high_energy'];

    for (const fallbackIntensity of fallbackIntensities) {
      if (fallbackIntensity !== intensity) {
        mealPlan = getMealPlanForIntensity(dayOfWeek, fallbackIntensity);
        if (mealPlan) break;
      }
    }
  }

  // If still no meal plan, try any day
  if (!mealPlan) {
    for (let day = 0; day <= 6; day++) {
      mealPlan = getMealPlanForIntensity(day, intensity);
      if (mealPlan) break;
    }
  }

  return mealPlan;
}

/**
 * Get fallback fasting plan
 */
export function getFallbackFastingPlan(): FastingWindow {
  return getFastingWindow('16:8');
}

// ==================== PLACEHOLDER GENERATORS ====================

/**
 * Generate placeholder content when real data is loading
 */
export function generatePlaceholderWorkout(): Partial<WorkoutPlan> {
  return {
    id: 'placeholder',
    name: 'Loading workout...',
    description: 'Please wait while we fetch your workout plan.',
    exercises: [],
    totalDuration: 0,
    difficulty: 'beginner',
    muscleGroups: [],
    estimatedCalories: 0,
  };
}

export function generatePlaceholderMealPlan(): Partial<MealPlan> {
  return {
    id: 'placeholder',
    dayOfWeek: 0,
    meals: [],
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    },
  };
}

// ==================== ERROR RECOVERY UTILITIES ====================

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: unknown) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, onRetry } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      onRetry?.(attempt + 1, error);

      if (attempt < maxRetries - 1) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Execute with fallback value on error
 */
export async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

/**
 * Execute with timeout
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// ==================== ERROR LOGGING ====================

export type ErrorLogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ErrorLogEntry {
  level: ErrorLogLevel;
  error: AppError;
  additionalInfo?: Record<string, unknown>;
}

const errorLog: ErrorLogEntry[] = [];
const MAX_ERROR_LOG_SIZE = 100;

/**
 * Log an error for debugging and analytics
 */
export function logError(
  error: AppError,
  level: ErrorLogLevel = 'error',
  additionalInfo?: Record<string, unknown>
) {
  const entry: ErrorLogEntry = { level, error, additionalInfo };

  // Add to local log
  errorLog.push(entry);
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }

  // Console output (in development)
  if (__DEV__) {
    const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    logFn(`[${level.toUpperCase()}] ${error.code}: ${error.message}`, {
      ...error,
      ...additionalInfo,
    });
  }

  // Future: Send to analytics/crash reporting service
}

/**
 * Get recent errors for debugging
 */
export function getRecentErrors(count = 10): ErrorLogEntry[] {
  return errorLog.slice(-count);
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  errorLog.length = 0;
}

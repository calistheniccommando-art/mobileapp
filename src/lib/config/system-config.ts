/**
 * SYSTEM CONFIGURATION
 *
 * Centralized configuration for the entire application.
 * Designed for future-proofing and easy customization.
 */

import type { DifficultyLevel, MealIntensity, FastingPlan, WorkType } from '@/types/fitness';

// ==================== FEATURE FLAGS ====================

/**
 * Feature flags for gradual rollout and A/B testing
 */
export interface FeatureFlags {
  // Core features
  enableOfflineMode: boolean;
  enablePDFExport: boolean;
  enableVideoStreaming: boolean;
  enableProgressTracking: boolean;

  // Future features (AI integration ready)
  enableAISuggestions: boolean;
  enableAIWorkoutGeneration: boolean;
  enableAIMealSuggestions: boolean;
  enableVoiceCoaching: boolean;

  // Personalization
  enableAdvancedPersonalization: boolean;
  enableDietaryPreferences: boolean;
  enableGoalTracking: boolean;
  enableSeasonalPlans: boolean;

  // Social
  enableSocialSharing: boolean;
  enableChallenges: boolean;
  enableLeaderboards: boolean;

  // Premium
  enablePremiumFeatures: boolean;
  enableAdFreeExperience: boolean;

  // Analytics
  enableAnalytics: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  // Core features - all enabled
  enableOfflineMode: true,
  enablePDFExport: true,
  enableVideoStreaming: true,
  enableProgressTracking: true,

  // Future features - disabled by default
  enableAISuggestions: false,
  enableAIWorkoutGeneration: false,
  enableAIMealSuggestions: false,
  enableVoiceCoaching: false,

  // Personalization - partially enabled
  enableAdvancedPersonalization: false,
  enableDietaryPreferences: false,
  enableGoalTracking: false,
  enableSeasonalPlans: false,

  // Social - disabled by default
  enableSocialSharing: false,
  enableChallenges: false,
  enableLeaderboards: false,

  // Premium - disabled by default
  enablePremiumFeatures: false,
  enableAdFreeExperience: true,

  // Analytics - enabled
  enableAnalytics: true,
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
};

// ==================== APP CONFIGURATION ====================

/**
 * Application-wide configuration
 */
export interface AppConfig {
  // App info
  appName: string;
  appVersion: string;
  buildNumber: string;
  environment: 'development' | 'staging' | 'production';

  // API configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    cacheEnabled: boolean;
    cacheDuration: number;
  };

  // Content configuration
  content: {
    maxVideoQuality: '720p' | '1080p' | '4k';
    enableVideoPreload: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    enableImageCaching: boolean;
  };

  // Personalization defaults
  personalization: {
    defaultFastingPlan: FastingPlan;
    defaultWorkoutDifficulty: DifficultyLevel;
    defaultMealIntensity: MealIntensity;
    enableAutoPersonalization: boolean;
  };

  // Fasting configuration
  fasting: {
    availablePlans: FastingPlan[];
    minFastingHours: number;
    maxFastingHours: number;
    reminderIntervals: number[]; // minutes before window start/end
  };

  // Workout configuration
  workout: {
    availableDifficulties: DifficultyLevel[];
    restDays: number[]; // 0 = Sunday
    maxExercisesPerWorkout: number;
    defaultRestTime: number; // seconds
  };

  // Meal configuration
  meals: {
    availableIntensities: MealIntensity[];
    mealsPerDay: number;
    snacksEnabled: boolean;
    calorieTargets: Record<MealIntensity, { min: number; max: number }>;
  };

  // PDF configuration
  pdf: {
    defaultTemplate: string;
    enableBranding: boolean;
    maxPagesPerPDF: number;
    supportedExportTypes: ('daily' | 'weekly')[];
  };

  // Feature flags
  features: FeatureFlags;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'FitLife',
  appVersion: '1.0.0',
  buildNumber: '1',
  environment: __DEV__ ? 'development' : 'production',

  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.fitlife.app',
    timeout: 30000,
    retryAttempts: 3,
    cacheEnabled: true,
    cacheDuration: 5 * 60 * 1000, // 5 minutes
  },

  content: {
    maxVideoQuality: '1080p',
    enableVideoPreload: true,
    imageQuality: 'high',
    enableImageCaching: true,
  },

  personalization: {
    defaultFastingPlan: '16:8',
    defaultWorkoutDifficulty: 'beginner',
    defaultMealIntensity: 'standard',
    enableAutoPersonalization: true,
  },

  fasting: {
    availablePlans: ['12:12', '14:10', '16:8', '18:6'],
    minFastingHours: 12,
    maxFastingHours: 18,
    reminderIntervals: [30, 15, 5], // minutes
  },

  workout: {
    availableDifficulties: ['beginner', 'intermediate', 'advanced'],
    restDays: [0], // Sunday
    maxExercisesPerWorkout: 10,
    defaultRestTime: 60,
  },

  meals: {
    availableIntensities: ['light', 'standard', 'high_energy'],
    mealsPerDay: 3,
    snacksEnabled: true,
    calorieTargets: {
      light: { min: 1400, max: 1700 },
      standard: { min: 1700, max: 2000 },
      high_energy: { min: 2000, max: 2500 },
    },
  },

  pdf: {
    defaultTemplate: 'standard',
    enableBranding: true,
    maxPagesPerPDF: 20,
    supportedExportTypes: ['daily', 'weekly'],
  },

  features: DEFAULT_FEATURE_FLAGS,
};

// ==================== PERSONALIZATION RULES ====================

/**
 * Personalization rule for automatic assignment
 */
export interface PersonalizationRule {
  id: string;
  name: string;
  description: string;
  priority: number;
  conditions: PersonalizationCondition[];
  assignments: PersonalizationAssignment;
  enabled: boolean;
}

export interface PersonalizationCondition {
  field: 'workType' | 'weight' | 'age' | 'fitnessGoal' | 'gender';
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'in' | 'between';
  value: unknown;
}

export interface PersonalizationAssignment {
  fastingPlan?: FastingPlan;
  workoutDifficulty?: DifficultyLevel;
  mealIntensity?: MealIntensity;
}

/**
 * Default personalization rules based on Prompt 3 specifications
 */
export const DEFAULT_PERSONALIZATION_RULES: PersonalizationRule[] = [
  // Active users - always 12:12
  {
    id: 'rule-active',
    name: 'Active Lifestyle',
    description: 'Active users get 12:12 fasting, advanced workouts, high energy meals',
    priority: 1,
    conditions: [{ field: 'workType', operator: 'equals', value: 'active' }],
    assignments: {
      fastingPlan: '12:12',
      workoutDifficulty: 'advanced',
      mealIntensity: 'high_energy',
    },
    enabled: true,
  },

  // Moderate + higher weight
  {
    id: 'rule-moderate-higher',
    name: 'Moderate Activity - Higher Weight',
    description: 'Moderate activity with higher weight gets 14:10 fasting',
    priority: 2,
    conditions: [
      { field: 'workType', operator: 'equals', value: 'moderate' },
      { field: 'weight', operator: 'greaterThan', value: 85 },
    ],
    assignments: {
      fastingPlan: '14:10',
      workoutDifficulty: 'intermediate',
      mealIntensity: 'standard',
    },
    enabled: true,
  },

  // Moderate + lower weight
  {
    id: 'rule-moderate-lower',
    name: 'Moderate Activity - Lower Weight',
    description: 'Moderate activity with lower weight gets 16:8 fasting',
    priority: 3,
    conditions: [
      { field: 'workType', operator: 'equals', value: 'moderate' },
      { field: 'weight', operator: 'lessThan', value: 85 },
    ],
    assignments: {
      fastingPlan: '16:8',
      workoutDifficulty: 'intermediate',
      mealIntensity: 'standard',
    },
    enabled: true,
  },

  // Sedentary + higher weight
  {
    id: 'rule-sedentary-higher',
    name: 'Sedentary - Higher Weight',
    description: 'Sedentary with higher weight gets 14:10 fasting',
    priority: 4,
    conditions: [
      { field: 'workType', operator: 'equals', value: 'sedentary' },
      { field: 'weight', operator: 'greaterThan', value: 80 },
    ],
    assignments: {
      fastingPlan: '14:10',
      workoutDifficulty: 'beginner',
      mealIntensity: 'light',
    },
    enabled: true,
  },

  // Sedentary + lower weight
  {
    id: 'rule-sedentary-lower',
    name: 'Sedentary - Lower Weight',
    description: 'Sedentary with lower weight gets 16:8 fasting',
    priority: 5,
    conditions: [
      { field: 'workType', operator: 'equals', value: 'sedentary' },
      { field: 'weight', operator: 'lessThan', value: 80 },
    ],
    assignments: {
      fastingPlan: '16:8',
      workoutDifficulty: 'beginner',
      mealIntensity: 'light',
    },
    enabled: true,
  },
];

// ==================== AI INTEGRATION PLACEHOLDERS ====================

/**
 * AI provider configuration (for future integration)
 */
export interface AIProviderConfig {
  provider: 'openai' | 'anthropic' | 'custom';
  apiKey?: string;
  model?: string;
  enabled: boolean;
  features: {
    workoutSuggestions: boolean;
    mealSuggestions: boolean;
    coachingMessages: boolean;
    progressAnalysis: boolean;
  };
}

export const DEFAULT_AI_CONFIG: AIProviderConfig = {
  provider: 'openai',
  enabled: false,
  features: {
    workoutSuggestions: false,
    mealSuggestions: false,
    coachingMessages: false,
    progressAnalysis: false,
  },
};

/**
 * AI suggestion interface (for future integration)
 */
export interface AISuggestion {
  id: string;
  type: 'workout' | 'meal' | 'fasting' | 'general';
  title: string;
  description: string;
  confidence: number;
  reasoning?: string;
  data?: unknown;
  createdAt: string;
}

// ==================== ANALYTICS CONFIGURATION ====================

/**
 * Analytics event types
 */
export type AnalyticsEventType =
  | 'screen_view'
  | 'button_click'
  | 'workout_started'
  | 'workout_completed'
  | 'meal_logged'
  | 'fasting_started'
  | 'fasting_completed'
  | 'pdf_generated'
  | 'error_occurred'
  | 'onboarding_step'
  | 'onboarding_completed'
  | 'profile_updated'
  | 'feature_used';

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  properties?: Record<string, unknown>;
  timestamp?: string;
}

export interface AnalyticsConfig {
  enabled: boolean;
  providers: {
    mixpanel?: { token: string };
    amplitude?: { apiKey: string };
    firebase?: { enabled: boolean };
  };
  trackScreenViews: boolean;
  trackUserProperties: boolean;
  trackErrors: boolean;
}

export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  providers: {},
  trackScreenViews: true,
  trackUserProperties: true,
  trackErrors: true,
};

// ==================== CONFIGURATION MANAGER ====================

let currentConfig: AppConfig = { ...DEFAULT_APP_CONFIG };

/**
 * Get current app configuration
 */
export function getAppConfig(): AppConfig {
  return currentConfig;
}

/**
 * Update app configuration
 */
export function updateAppConfig(updates: Partial<AppConfig>): void {
  currentConfig = {
    ...currentConfig,
    ...updates,
    features: {
      ...currentConfig.features,
      ...(updates.features ?? {}),
    },
    api: {
      ...currentConfig.api,
      ...(updates.api ?? {}),
    },
    content: {
      ...currentConfig.content,
      ...(updates.content ?? {}),
    },
    personalization: {
      ...currentConfig.personalization,
      ...(updates.personalization ?? {}),
    },
  };
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return currentConfig.features[feature];
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  currentConfig = { ...DEFAULT_APP_CONFIG };
}

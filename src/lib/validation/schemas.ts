/**
 * ZOD VALIDATION SCHEMAS
 *
 * Runtime validation for all database entities.
 * Use these schemas for:
 * - API request/response validation
 * - Form validation
 * - Data integrity checks
 */

import { z } from 'zod';

// ==================== BASE SCHEMAS ====================

/** ISO 8601 date string */
export const isoDateString = z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

/** Time string in HH:mm format */
export const timeString = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)');

/** UUID or similar unique ID */
export const uniqueId = z.string().min(1).max(128);

/** Timestamps schema */
export const timestamps = z.object({
  createdAt: isoDateString,
  updatedAt: isoDateString,
});

// ==================== ENUM SCHEMAS ====================

export const contentStatus = z.enum(['draft', 'pending_review', 'approved', 'rejected', 'archived']);
export const difficultyLevel = z.enum(['beginner', 'intermediate', 'advanced']);
export const workType = z.enum(['sedentary', 'moderate', 'active']);
export const fastingPattern = z.enum(['12:12', '14:10', '16:8', '18:6']);
export const mealType = z.enum(['breakfast', 'lunch', 'dinner', 'snack']);
export const mealCategory = z.enum(['light', 'standard', 'high_energy']);
export const gender = z.enum(['male', 'female', 'other', 'prefer_not_to_say']);
export const authProvider = z.enum(['email', 'google', 'apple']);
export const fitnessGoal = z.enum(['lose_weight', 'maintain', 'build_muscle', 'improve_health']);
export const exerciseType = z.enum(['strength', 'cardio', 'flexibility', 'hiit', 'rest']);
export const muscleGroup = z.enum([
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'legs',
  'core',
  'glutes',
  'full_body',
  'cardio',
]);

// ==================== USER SCHEMAS ====================

export const userPreferencesSchema = z.object({
  notifications: z.object({
    fastingReminders: z.boolean(),
    workoutReminders: z.boolean(),
    mealReminders: z.boolean(),
    preferredReminderTime: timeString.optional(),
  }).optional(),
  display: z.object({
    useDarkMode: z.boolean(),
    useMetricUnits: z.boolean(),
    language: z.string().min(2).max(5),
  }).optional(),
  dietary: z.object({
    restrictions: z.array(z.string()),
    allergies: z.array(z.string()),
    dislikedIngredients: z.array(z.string()),
  }).optional(),
  custom: z.record(z.string(), z.unknown()).optional(),
});

export const userProfileSchema = z.object({
  userId: uniqueId,
  email: z.string().email(),
  passwordHash: z.string().optional(),
  authProvider: authProvider,
  authProviderId: z.string().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  gender: gender.optional(),
  dateOfBirth: isoDateString.optional(),
  weightKg: z.number().min(20).max(500),
  heightCm: z.number().min(50).max(300).optional(),
  workType: workType,
  assignedFastingPlanId: uniqueId,
  workoutDifficulty: difficultyLevel,
  mealCategory: mealCategory,
  fitnessGoal: fitnessGoal.optional(),
  termsAcceptedAt: isoDateString,
  privacyAcceptedAt: isoDateString,
  onboardingCompleted: z.boolean(),
  onboardingStep: z.number().int().min(0).max(10),
  preferences: userPreferencesSchema,
  isActive: z.boolean(),
  lastLoginAt: isoDateString.optional(),
}).merge(timestamps);

// ==================== EXERCISE SCHEMAS ====================

export const exerciseSchema = z.object({
  exerciseId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(200), // Short instruction
  detailedInstructions: z.array(z.string()),
  type: exerciseType,
  muscleGroups: z.array(muscleGroup).min(1),
  difficulty: difficultyLevel,
  defaultSets: z.number().int().min(1).max(20).optional(),
  defaultReps: z.union([z.number().int().min(1), z.string()]).optional(),
  defaultDurationSeconds: z.number().int().min(1).max(3600).optional(),
  defaultRestSeconds: z.number().int().min(0).max(600),
  estimatedCaloriesPerSet: z.number().min(0).optional(),
  thumbnailUrl: z.string().url().optional(),
  videoId: uniqueId.optional(),
  status: contentStatus,
  createdBy: uniqueId.optional(),
  approvedBy: uniqueId.optional(),
  approvedAt: isoDateString.optional(),
}).merge(timestamps);

// ==================== WORKOUT SCHEMAS ====================

export const workoutPlanExerciseSchema = z.object({
  exerciseId: uniqueId,
  orderIndex: z.number().int().min(0),
  sets: z.number().int().min(1).max(20).optional(),
  reps: z.union([z.number().int().min(1), z.string()]).optional(),
  durationSeconds: z.number().int().min(1).max(3600).optional(),
  restSeconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
});

export const workoutPlanSchema = z.object({
  planId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  dayNumber: z.number().int().min(1).max(7),
  weekNumber: z.number().int().min(1).optional(),
  difficulty: difficultyLevel,
  targetMuscleGroups: z.array(muscleGroup),
  exercises: z.array(workoutPlanExerciseSchema).min(1),
  totalDurationMinutes: z.number().int().min(1).max(180),
  estimatedCalories: z.number().int().min(0),
  thumbnailUrl: z.string().url().optional(),
  notes: z.string().max(1000).optional(),
  status: contentStatus,
  createdBy: uniqueId.optional(),
  approvedBy: uniqueId.optional(),
  approvedAt: isoDateString.optional(),
}).merge(timestamps);

// ==================== MEAL SCHEMAS ====================

export const mealIngredientSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.string().min(1).max(50),
  calories: z.number().min(0).optional(),
  optional: z.boolean().optional(),
  substitutes: z.array(z.string()).optional(),
});

export const nutritionInfoSchema = z.object({
  calories: z.number().int().min(0),
  proteinGrams: z.number().min(0),
  carbsGrams: z.number().min(0),
  fatGrams: z.number().min(0),
  fiberGrams: z.number().min(0).optional(),
  sugarGrams: z.number().min(0).optional(),
  sodiumMg: z.number().min(0).optional(),
});

export const mealSchema = z.object({
  mealId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(300),
  mealType: mealType,
  category: mealCategory,
  ingredients: z.array(mealIngredientSchema).min(1),
  prepInstructions: z.array(z.string()),
  prepTimeMinutes: z.number().int().min(0).max(180).optional(),
  cookTimeMinutes: z.number().int().min(0).max(480).optional(),
  servings: z.number().int().min(1).max(20),
  nutrition: nutritionInfoSchema,
  dietaryTags: z.array(z.string()),
  imageUrl: z.string().url().optional(),
  videoId: uniqueId.optional(),
  status: contentStatus,
  createdBy: uniqueId.optional(),
  approvedBy: uniqueId.optional(),
  approvedAt: isoDateString.optional(),
}).merge(timestamps);

export const mealPlanMealSchema = z.object({
  mealId: uniqueId,
  mealType: mealType,
  orderIndex: z.number().int().min(0),
});

export const mealPlanSchema = z.object({
  mealPlanId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  dayNumber: z.number().int().min(1).max(7),
  category: mealCategory,
  meals: z.array(mealPlanMealSchema).min(1),
  totalNutrition: nutritionInfoSchema,
  status: contentStatus,
  createdBy: uniqueId.optional(),
  approvedBy: uniqueId.optional(),
  approvedAt: isoDateString.optional(),
}).merge(timestamps);

// ==================== FASTING SCHEMAS ====================

export const fastingPlanSchema = z.object({
  fastingPlanId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  pattern: fastingPattern,
  fastingHours: z.number().int().min(10).max(24),
  eatingHours: z.number().int().min(4).max(14),
  eatingWindowStartTime: timeString,
  eatingWindowEndTime: timeString,
  defaultMealCount: z.number().int().min(1).max(6),
  assignedWorkTypes: z.array(workType),
  weightThreshold: z.object({
    operator: z.enum(['gte', 'lt']),
    valueKg: z.number().min(0),
  }).optional(),
  notes: z.string().max(1000).optional(),
  status: contentStatus,
  createdBy: uniqueId.optional(),
}).merge(timestamps);

// ==================== DAILY PLAN SCHEMAS ====================

export const dailyPlanSchema = z.object({
  dailyPlanId: uniqueId,
  userId: uniqueId,
  date: isoDateString,
  dayNumber: z.number().int().min(1),
  weekNumber: z.number().int().min(1).optional(),
  workoutPlanId: uniqueId.nullable(),
  mealPlanId: uniqueId,
  fastingPlanId: uniqueId,
  isRestDay: z.boolean(),
  isCompleted: z.boolean(),
  pdfGeneratedUrl: z.string().url().optional(),
  pdfGeneratedAt: isoDateString.optional(),
  userNotes: z.string().max(1000).optional(),
}).merge(timestamps);

// ==================== PROGRESS SCHEMAS ====================

export const exerciseProgressSchema = z.object({
  exerciseId: uniqueId,
  completed: z.boolean(),
  actualSets: z.number().int().min(0).optional(),
  actualReps: z.array(z.number().int().min(0)).optional(),
  actualWeight: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const workoutProgressSchema = z.object({
  progressId: uniqueId,
  userId: uniqueId,
  dailyPlanId: uniqueId,
  workoutPlanId: uniqueId,
  date: isoDateString,
  completed: z.boolean(),
  exercisesCompleted: z.array(exerciseProgressSchema),
  actualDurationMinutes: z.number().int().min(0).optional(),
  actualCaloriesBurned: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
}).merge(timestamps);

export const fastingProgressSchema = z.object({
  progressId: uniqueId,
  userId: uniqueId,
  dailyPlanId: uniqueId,
  fastingPlanId: uniqueId,
  date: isoDateString,
  scheduledFastingStart: timeString,
  scheduledFastingEnd: timeString,
  scheduledEatingStart: timeString,
  scheduledEatingEnd: timeString,
  actualFastingStart: timeString.optional(),
  actualFastingEnd: timeString.optional(),
  completed: z.boolean(),
  fastingDurationHours: z.number().min(0).optional(),
  notes: z.string().max(1000).optional(),
}).merge(timestamps);

// ==================== ADMIN SCHEMAS ====================

export const videoSchema = z.object({
  videoId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(['exercise_demo', 'meal_prep', 'tutorial', 'other']),
  linkedExerciseId: uniqueId.optional(),
  linkedMealId: uniqueId.optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().int().min(1).optional(),
  status: contentStatus,
  uploadedBy: uniqueId,
  approvedBy: uniqueId.optional(),
  approvedAt: isoDateString.optional(),
}).merge(timestamps);

export const pdfTemplateLayoutSchema = z.object({
  pageSize: z.enum(['letter', 'a4']),
  orientation: z.enum(['portrait', 'landscape']),
  margins: z.object({
    top: z.number().min(0),
    right: z.number().min(0),
    bottom: z.number().min(0),
    left: z.number().min(0),
  }),
  theme: z.enum(['light', 'dark']),
  primaryColor: z.string(),
  secondaryColor: z.string(),
  sections: z.object({
    header: z.boolean(),
    workout: z.boolean(),
    meals: z.boolean(),
    fasting: z.boolean(),
    nutrition: z.boolean(),
    notes: z.boolean(),
  }),
  customStyles: z.record(z.string(), z.unknown()).optional(),
});

export const pdfTemplateSchema = z.object({
  templateId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  type: z.enum(['daily', 'weekly', 'custom']),
  layout: pdfTemplateLayoutSchema,
  isDefault: z.boolean(),
  status: contentStatus,
  createdBy: uniqueId.optional(),
}).merge(timestamps);

export const adminUserSchema = z.object({
  adminId: uniqueId,
  email: z.string().email(),
  passwordHash: z.string(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: z.enum(['super_admin', 'admin', 'editor', 'viewer']),
  isActive: z.boolean(),
  lastLoginAt: isoDateString.optional(),
}).merge(timestamps);

export const contentAuditLogSchema = z.object({
  logId: uniqueId,
  adminId: uniqueId,
  entityType: z.enum(['exercise', 'workout_plan', 'meal', 'meal_plan', 'fasting_plan', 'video']),
  entityId: uniqueId,
  action: z.enum(['create', 'update', 'delete', 'approve', 'reject']),
  previousData: z.record(z.string(), z.unknown()).optional(),
  newData: z.record(z.string(), z.unknown()).optional(),
  changesSummary: z.string(),
}).merge(timestamps);

// ==================== PERSONALIZATION SCHEMAS ====================

export const personalizationConditionSchema = z.object({
  field: z.enum(['workType', 'weightKg', 'heightCm', 'age', 'gender', 'fitnessGoal']),
  operator: z.enum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'nin']),
  value: z.union([z.string(), z.number(), z.array(z.string()), z.array(z.number())]),
});

export const personalizationRuleSchema = z.object({
  ruleId: uniqueId,
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  priority: z.number().int().min(0),
  conditions: z.array(personalizationConditionSchema).min(1),
  assignFastingPlanId: uniqueId.optional(),
  assignWorkoutDifficulty: difficultyLevel.optional(),
  assignMealCategory: mealCategory.optional(),
  isActive: z.boolean(),
}).merge(timestamps);

// ==================== FORM VALIDATION SCHEMAS ====================
// Partial schemas for form validation (create/update operations)

export const createUserSchema = userProfileSchema.omit({
  userId: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const updateUserSchema = userProfileSchema.partial().omit({
  userId: true,
  createdAt: true,
  email: true, // Can't change email
});

export const onboardingDataSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  authProvider: authProvider.optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  gender: gender.optional(),
  dateOfBirth: isoDateString.optional(),
  weightKg: z.number().min(20).max(500).optional(),
  heightCm: z.number().min(50).max(300).optional(),
  workType: workType.optional(),
  fitnessGoal: fitnessGoal.optional(),
  termsAccepted: z.boolean().optional(),
  privacyAccepted: z.boolean().optional(),
});

// ==================== TYPE EXPORTS ====================
// Infer types from schemas for type-safe usage

export type UserProfileInput = z.infer<typeof createUserSchema>;
export type UserProfileUpdate = z.infer<typeof updateUserSchema>;
export type OnboardingDataInput = z.infer<typeof onboardingDataSchema>;
export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type WorkoutPlanInput = z.infer<typeof workoutPlanSchema>;
export type MealInput = z.infer<typeof mealSchema>;
export type MealPlanInput = z.infer<typeof mealPlanSchema>;
export type FastingPlanInput = z.infer<typeof fastingPlanSchema>;
export type DailyPlanInput = z.infer<typeof dailyPlanSchema>;
export type WorkoutProgressInput = z.infer<typeof workoutProgressSchema>;
export type FastingProgressInput = z.infer<typeof fastingProgressSchema>;

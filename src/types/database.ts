/**
 * DATABASE SCHEMA DEFINITIONS
 *
 * This file defines all database entities, their attributes, and relationships
 * for the fitness, nutrition, and intermittent fasting app.
 *
 * Architecture: Document-based (Firebase/Supabase compatible)
 * All IDs are unique UUIDs for consistency across mobile and admin
 */

// ==================== BASE TYPES ====================

/** Timestamp fields included in all entities */
export interface Timestamps {
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}

/** Content approval status for admin-managed content */
export type ContentStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'archived';

/** Difficulty levels for workouts */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/** Work/activity types for personalization */
export type WorkType = 'sedentary' | 'moderate' | 'active';

/** Fasting plan patterns */
export type FastingPattern = '12:12' | '14:10' | '16:8' | '18:6';

/** Meal types */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/** Meal intensity categories */
export type MealCategory = 'light' | 'standard' | 'high_energy';

/** Gender options */
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/** Authentication providers */
export type AuthProvider = 'email' | 'google' | 'apple';

/** Fitness goals */
export type FitnessGoal = 'lose_weight' | 'maintain' | 'build_muscle' | 'improve_health';

/** Exercise types */
export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'hiit' | 'rest';

/** Muscle groups */
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'legs'
  | 'core'
  | 'glutes'
  | 'full_body'
  | 'cardio';

// ==================== USER ENTITIES ====================

/**
 * USER PROFILE
 * Core user entity storing personal info and personalization settings
 *
 * Relationships:
 * - Has many DailyPlans
 * - Has one assigned FastingPlan
 * - Has many WorkoutProgress records
 * - Has many FastingProgress records
 */
export interface DBUserProfile extends Timestamps {
  // Primary key
  userId: string;

  // Authentication
  email: string;
  passwordHash?: string; // Only for email auth
  authProvider: AuthProvider;
  authProviderId?: string; // External provider ID

  // Personal info
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: string; // ISO date

  // Physical attributes
  weightKg: number;
  heightCm?: number;

  // Activity & Lifestyle
  workType: WorkType;

  // Personalization (rule-assigned)
  assignedFastingPlanId: string; // FK to FastingPlan
  workoutDifficulty: DifficultyLevel;
  mealCategory: MealCategory;
  fitnessGoal?: FitnessGoal;

  // Legal
  termsAcceptedAt: string;
  privacyAcceptedAt: string;

  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;

  // Preferences (JSON placeholder for future personalization)
  preferences: UserPreferences;

  // Status
  isActive: boolean;
  lastLoginAt?: string;
}

/** Extensible user preferences for future features */
export interface UserPreferences {
  // Notification settings
  notifications?: {
    fastingReminders: boolean;
    workoutReminders: boolean;
    mealReminders: boolean;
    preferredReminderTime?: string; // HH:mm format
  };

  // Display settings
  display?: {
    useDarkMode: boolean;
    useMetricUnits: boolean;
    language: string;
  };

  // Dietary preferences (future)
  dietary?: {
    restrictions: string[]; // e.g., ['vegetarian', 'gluten_free']
    allergies: string[];
    dislikedIngredients: string[];
  };

  // Custom settings placeholder
  custom?: Record<string, unknown>;
}

// ==================== EXERCISE ENTITIES ====================

/**
 * EXERCISE
 * Individual exercise definition with instructions and media
 *
 * Relationships:
 * - Belongs to many WorkoutPlans (via WorkoutPlanExercise)
 * - Has one optional Video
 */
export interface DBExercise extends Timestamps {
  // Primary key
  exerciseId: string;

  // Basic info
  name: string;
  description: string; // Short instruction (<15 words recommended)
  detailedInstructions: string[]; // Step-by-step instructions

  // Exercise parameters
  type: ExerciseType;
  muscleGroups: MuscleGroup[];
  difficulty: DifficultyLevel;

  // Default parameters (can be overridden in WorkoutPlanExercise)
  defaultSets?: number;
  defaultReps?: number | string; // Can be "10-12" or "to failure"
  defaultDurationSeconds?: number; // For timed exercises
  defaultRestSeconds: number;

  // Estimated values
  estimatedCaloriesPerSet?: number;

  // Media
  thumbnailUrl?: string;
  videoId?: string; // FK to Video

  // Admin
  status: ContentStatus;
  createdBy?: string; // Admin user ID
  approvedBy?: string;
  approvedAt?: string;
}

// ==================== WORKOUT ENTITIES ====================

/**
 * WORKOUT PLAN
 * A complete workout session for a specific day
 *
 * Relationships:
 * - Has many Exercises (via WorkoutPlanExercise)
 * - Belongs to many DailyPlans
 */
export interface DBWorkoutPlan extends Timestamps {
  // Primary key
  planId: string;

  // Basic info
  name: string;
  description: string;

  // Scheduling
  dayNumber: number; // 1-7 (Monday-Sunday) or day in program
  weekNumber?: number; // For multi-week programs

  // Difficulty & targeting
  difficulty: DifficultyLevel;
  targetMuscleGroups: MuscleGroup[];

  // Exercise references (ordered)
  exercises: WorkoutPlanExercise[];

  // Computed/cached values
  totalDurationMinutes: number;
  estimatedCalories: number;

  // Media
  thumbnailUrl?: string;

  // Notes
  notes?: string; // Optional instructions

  // Admin
  status: ContentStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * WORKOUT PLAN EXERCISE
 * Junction entity linking exercises to workout plans with specific parameters
 */
export interface WorkoutPlanExercise {
  exerciseId: string; // FK to Exercise
  orderIndex: number; // Position in workout

  // Override defaults if needed
  sets?: number;
  reps?: number | string;
  durationSeconds?: number;
  restSeconds?: number;

  // Notes specific to this workout
  notes?: string;
}

// ==================== MEAL ENTITIES ====================

/**
 * MEAL
 * Individual meal definition with nutrition and preparation info
 *
 * Relationships:
 * - Belongs to many MealPlans (via MealPlanMeal)
 * - Has one optional Video
 */
export interface DBMeal extends Timestamps {
  // Primary key
  mealId: string;

  // Basic info
  name: string;
  description: string;

  // Classification
  mealType: MealType;
  category: MealCategory;

  // Ingredients
  ingredients: MealIngredient[];

  // Preparation
  prepInstructions: string[];
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  servings: number;

  // Nutrition
  nutrition: NutritionInfo;

  // Dietary tags
  dietaryTags: string[]; // e.g., ['vegetarian', 'high_protein', 'keto']

  // Media
  imageUrl?: string;
  videoId?: string; // FK to Video (optional prep demo)

  // Admin
  status: ContentStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

/** Ingredient with amount and optional nutrition */
export interface MealIngredient {
  name: string;
  amount: string; // "2 cups", "100g", etc.
  calories?: number;
  optional?: boolean;
  substitutes?: string[]; // Alternative ingredients
}

/** Nutrition information */
export interface NutritionInfo {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams?: number;
  sugarGrams?: number;
  sodiumMg?: number;
}

/**
 * MEAL PLAN
 * A day's worth of meals
 *
 * Relationships:
 * - Has many Meals (via MealPlanMeal)
 * - Belongs to many DailyPlans
 */
export interface DBMealPlan extends Timestamps {
  // Primary key
  mealPlanId: string;

  // Basic info
  name: string;
  description?: string;

  // Scheduling
  dayNumber: number; // 1-7 or day in program

  // Category (determines calorie targets)
  category: MealCategory;

  // Meal references
  meals: MealPlanMeal[];

  // Computed/cached nutrition totals
  totalNutrition: NutritionInfo;

  // Admin
  status: ContentStatus;
  createdBy?: string;
  approvedBy?: string;
  approvedAt?: string;
}

/** Junction entity linking meals to meal plans */
export interface MealPlanMeal {
  mealId: string; // FK to Meal
  mealType: MealType; // breakfast, lunch, dinner, snack
  orderIndex: number; // Position in day
}

// ==================== FASTING ENTITIES ====================

/**
 * FASTING PLAN
 * Defines fasting windows and patterns
 *
 * Relationships:
 * - Assigned to many Users
 * - Linked to many DailyPlans
 */
export interface DBFastingPlan extends Timestamps {
  // Primary key
  fastingPlanId: string;

  // Basic info
  name: string;
  description: string;

  // Pattern
  pattern: FastingPattern;
  fastingHours: number;
  eatingHours: number;

  // Default eating window
  eatingWindowStartTime: string; // HH:mm format (e.g., "12:00")
  eatingWindowEndTime: string; // HH:mm format (e.g., "20:00")

  // Recommended meal structure
  defaultMealCount: number; // e.g., 2-3 meals in window

  // Personalization rules
  assignedWorkTypes: WorkType[]; // Which work types this plan fits
  weightThreshold?: {
    operator: 'gte' | 'lt'; // greater than or equal, less than
    valueKg: number;
  };

  // Guidance
  notes?: string; // Tips for users

  // Admin
  status: ContentStatus;
  createdBy?: string;
}

// ==================== DAILY PLAN ENTITIES ====================

/**
 * DAILY PLAN
 * Combines workout, meals, and fasting for a specific day
 * Generated per-user based on their personalization settings
 *
 * Relationships:
 * - Belongs to one User
 * - Has one WorkoutPlan (optional, rest days have none)
 * - Has one MealPlan
 * - Has one FastingPlan
 */
export interface DBDailyPlan extends Timestamps {
  // Primary key
  dailyPlanId: string;

  // User reference
  userId: string; // FK to User

  // Date
  date: string; // ISO date (YYYY-MM-DD)
  dayNumber: number; // Day in program (1-based)
  weekNumber?: number; // Week in program

  // Plan references
  workoutPlanId: string | null; // FK to WorkoutPlan (null for rest days)
  mealPlanId: string; // FK to MealPlan
  fastingPlanId: string; // FK to FastingPlan

  // Status
  isRestDay: boolean;
  isCompleted: boolean;

  // PDF export
  pdfGeneratedUrl?: string; // URL after PDF is created
  pdfGeneratedAt?: string;

  // Notes
  userNotes?: string;
}

// ==================== PROGRESS TRACKING ====================

/**
 * WORKOUT PROGRESS
 * Tracks user's workout completion and performance
 */
export interface DBWorkoutProgress extends Timestamps {
  // Primary key
  progressId: string;

  // References
  userId: string; // FK to User
  dailyPlanId: string; // FK to DailyPlan
  workoutPlanId: string; // FK to WorkoutPlan

  // Date
  date: string; // ISO date

  // Progress
  completed: boolean;
  exercisesCompleted: ExerciseProgress[];

  // Actual values
  actualDurationMinutes?: number;
  actualCaloriesBurned?: number;

  // Notes
  notes?: string;
  rating?: number; // 1-5 difficulty rating
}

/** Individual exercise progress within a workout */
export interface ExerciseProgress {
  exerciseId: string;
  completed: boolean;
  actualSets?: number;
  actualReps?: number[];
  actualWeight?: number; // For weighted exercises
  notes?: string;
}

/**
 * FASTING PROGRESS
 * Tracks user's fasting compliance
 */
export interface DBFastingProgress extends Timestamps {
  // Primary key
  progressId: string;

  // References
  userId: string; // FK to User
  dailyPlanId: string; // FK to DailyPlan
  fastingPlanId: string; // FK to FastingPlan

  // Date
  date: string; // ISO date

  // Scheduled times
  scheduledFastingStart: string; // HH:mm
  scheduledFastingEnd: string;
  scheduledEatingStart: string;
  scheduledEatingEnd: string;

  // Actual times
  actualFastingStart?: string;
  actualFastingEnd?: string;

  // Status
  completed: boolean;
  fastingDurationHours?: number;

  // Notes
  notes?: string;
}

// ==================== ADMIN & CONTENT MANAGEMENT ====================

/**
 * VIDEO
 * Admin-uploaded video content (exercise demos, meal prep, etc.)
 */
export interface DBVideo extends Timestamps {
  // Primary key
  videoId: string;

  // Basic info
  name: string;
  description?: string;

  // Type
  type: 'exercise_demo' | 'meal_prep' | 'tutorial' | 'other';

  // Linked content
  linkedExerciseId?: string; // FK to Exercise
  linkedMealId?: string; // FK to Meal

  // Media
  videoUrl: string;
  thumbnailUrl?: string;
  durationSeconds?: number;

  // Admin
  status: ContentStatus;
  uploadedBy: string; // Admin user ID
  approvedBy?: string;
  approvedAt?: string;
}

/**
 * PDF TEMPLATE
 * Template definitions for generating PDFs
 */
export interface DBPdfTemplate extends Timestamps {
  // Primary key
  templateId: string;

  // Basic info
  name: string;
  description: string;

  // Type
  type: 'daily' | 'weekly' | 'custom';

  // Layout definition (JSON structure)
  layout: PdfTemplateLayout;

  // Status
  isDefault: boolean;
  status: ContentStatus;
  createdBy?: string;
}

/** PDF template layout structure */
export interface PdfTemplateLayout {
  // Page settings
  pageSize: 'letter' | 'a4';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };

  // Theme
  theme: 'light' | 'dark';
  primaryColor: string;
  secondaryColor: string;

  // Sections to include
  sections: {
    header: boolean;
    workout: boolean;
    meals: boolean;
    fasting: boolean;
    nutrition: boolean;
    notes: boolean;
  };

  // Custom styles (optional)
  customStyles?: Record<string, unknown>;
}

/**
 * ADMIN USER
 * Admin/staff accounts for content management
 */
export interface DBAdminUser extends Timestamps {
  // Primary key
  adminId: string;

  // Auth
  email: string;
  passwordHash: string;

  // Info
  firstName: string;
  lastName: string;

  // Role
  role: 'super_admin' | 'admin' | 'editor' | 'viewer';

  // Status
  isActive: boolean;
  lastLoginAt?: string;
}

/**
 * CONTENT AUDIT LOG
 * Tracks all content changes for admin review
 */
export interface DBContentAuditLog extends Timestamps {
  // Primary key
  logId: string;

  // Who
  adminId: string; // FK to AdminUser

  // What
  entityType: 'exercise' | 'workout_plan' | 'meal' | 'meal_plan' | 'fasting_plan' | 'video';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject';

  // Changes
  previousData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  changesSummary: string;
}

// ==================== PERSONALIZATION RULES ====================

/**
 * PERSONALIZATION RULE
 * Defines rules for auto-assigning plans based on user attributes
 */
export interface DBPersonalizationRule extends Timestamps {
  // Primary key
  ruleId: string;

  // Basic info
  name: string;
  description: string;

  // Priority (lower = higher priority)
  priority: number;

  // Conditions (all must match)
  conditions: PersonalizationCondition[];

  // Assignments
  assignFastingPlanId?: string;
  assignWorkoutDifficulty?: DifficultyLevel;
  assignMealCategory?: MealCategory;

  // Status
  isActive: boolean;
}

/** Condition for personalization rule matching */
export interface PersonalizationCondition {
  field: 'workType' | 'weightKg' | 'heightCm' | 'age' | 'gender' | 'fitnessGoal';
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin';
  value: string | number | string[] | number[];
}

// ==================== SCHEMA RELATIONSHIP DIAGRAM ====================
/**
 * ENTITY RELATIONSHIPS:
 *
 * User (1) ──────────────────── (N) DailyPlan
 *   │                                  │
 *   │                                  ├── (1) WorkoutPlan ── (N) Exercise
 *   │                                  │
 *   │                                  ├── (1) MealPlan ───── (N) Meal
 *   │                                  │
 *   └── assigned ── (1) FastingPlan ──┘
 *
 * User (1) ──── (N) WorkoutProgress
 * User (1) ──── (N) FastingProgress
 *
 * Exercise (0..1) ──── (1) Video
 * Meal (0..1) ──────── (1) Video
 *
 * AdminUser (1) ──── (N) ContentAuditLog
 *
 * PersonalizationRule ──── determines ──── User assignments
 */

// ==================== INDEX RECOMMENDATIONS ====================
/**
 * RECOMMENDED INDEXES (for database implementation):
 *
 * Users:
 *   - userId (primary)
 *   - email (unique)
 *   - workType + weightKg (for personalization queries)
 *
 * DailyPlans:
 *   - dailyPlanId (primary)
 *   - userId + date (unique, common query)
 *   - date (for bulk operations)
 *
 * WorkoutPlans:
 *   - planId (primary)
 *   - difficulty (filtering)
 *   - dayNumber + difficulty (common query)
 *
 * Meals:
 *   - mealId (primary)
 *   - mealType + category (filtering)
 *   - dietaryTags (array index for filtering)
 *
 * Exercises:
 *   - exerciseId (primary)
 *   - difficulty (filtering)
 *   - muscleGroups (array index)
 *
 * Progress tables:
 *   - progressId (primary)
 *   - userId + date (common query)
 */

// ==================== OFFLINE CACHING STRATEGY ====================
/**
 * OFFLINE CACHING (for mobile app):
 *
 * Cache Permanently (until invalidated):
 *   - Exercises (content rarely changes)
 *   - WorkoutPlans (content rarely changes)
 *   - Meals (content rarely changes)
 *   - MealPlans (content rarely changes)
 *   - FastingPlans (content rarely changes)
 *
 * Cache with TTL (refresh periodically):
 *   - User's DailyPlans for current week (refresh daily)
 *   - PersonalizationRules (refresh weekly)
 *
 * Always Fetch:
 *   - Progress data (needs to be synced)
 *   - User profile updates
 *
 * Sync Strategy:
 *   - Write-through for progress updates
 *   - Queue offline writes, sync when online
 *   - Conflict resolution: server wins for content, merge for progress
 */

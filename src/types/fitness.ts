// Core fitness app type definitions
// Designed for scalability and future feature expansion

// ==================== AUTHENTICATION ====================
export type AuthProvider = 'email' | 'google' | 'apple';

export interface AuthCredentials {
  email: string;
  password?: string;
  provider: AuthProvider;
  providerId?: string; // for social auth
}

export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  provider: AuthProvider;
  createdAt: string;
}

// ==================== USER PROFILE ====================
export type WorkType = 'sedentary' | 'moderate' | 'active';
export type FastingPlan = '12:12' | '14:10' | '16:8' | '18:6';
export type FitnessGoal = 'lose_weight' | 'maintain' | 'build_muscle' | 'improve_health';
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type MealIntensity = 'light' | 'standard' | 'high_energy';
export type WeightCategory = 'lower' | 'higher'; // relative to activity level

export interface UserProfile {
  id: string;

  // Basic info (from auth/registration)
  email: string;
  firstName: string;
  lastName: string;
  gender?: Gender;
  dateOfBirth?: string; // ISO date string

  // Physical attributes
  weight: number; // in kg
  height?: number; // in cm, optional

  // Activity & Lifestyle
  workType: WorkType;

  // Personalization (rule-assigned)
  fastingPlan: FastingPlan;
  workoutDifficulty: DifficultyLevel;
  mealIntensity: MealIntensity;

  // Goals (optional, for future expansion)
  fitnessGoal?: FitnessGoal;

  // Legal & Status
  termsAcceptedAt: string;
  privacyAcceptedAt: string;
  onboardingCompleted: boolean;
  onboardingStep: number; // track progress

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// Onboarding steps enum for progress tracking
export type OnboardingStep =
  | 'welcome'
  | 'auth'
  | 'profile'
  | 'physical'
  | 'activity'
  | 'fasting_preview'
  | 'review'
  | 'complete';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  'welcome',
  'auth',
  'profile',
  'physical',
  'activity',
  'fasting_preview',
  'review',
  'complete'
];

// Partial profile for onboarding flow
export interface OnboardingData {
  // Auth step
  email?: string;
  password?: string;
  authProvider?: AuthProvider;

  // Profile step
  firstName?: string;
  lastName?: string;
  gender?: Gender;
  dateOfBirth?: string;

  // Physical step
  weight?: number;
  height?: number;

  // Activity step
  workType?: WorkType;
  fitnessGoal?: FitnessGoal;

  // Terms
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}

// ==================== PERSONALIZATION RULES ====================
export interface PersonalizationRules {
  fastingPlan: FastingPlan;
  workoutDifficulty: DifficultyLevel;
  mealIntensity: MealIntensity;
}

// Weight thresholds for categorization (in kg)
export const WEIGHT_THRESHOLDS: Record<WorkType, number> = {
  sedentary: 80,
  moderate: 85,
  active: 90,
};

// Rule mapping for fasting plans
export const FASTING_PLAN_RULES: Record<WorkType, Record<WeightCategory, FastingPlan>> = {
  sedentary: { higher: '14:10', lower: '16:8' },
  moderate: { higher: '14:10', lower: '16:8' },
  active: { higher: '12:12', lower: '12:12' },
};

// Rule mapping for workout difficulty
export const WORKOUT_DIFFICULTY_RULES: Record<WorkType, DifficultyLevel> = {
  sedentary: 'beginner',
  moderate: 'intermediate',
  active: 'advanced',
};

// Rule mapping for meal intensity
export const MEAL_INTENSITY_RULES: Record<WorkType, MealIntensity> = {
  sedentary: 'light',
  moderate: 'standard',
  active: 'high_energy',
};

// ==================== WORKOUTS ====================
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

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'hiit';

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
  muscleGroups: MuscleGroup[];
  type: ExerciseType;
  difficulty: DifficultyLevel;
  // Exercise parameters
  sets?: number;
  reps?: number | string; // can be "12-15" or "to failure"
  duration?: number; // in seconds
  restTime?: number; // in seconds between sets
  calories?: number; // estimated calories burned
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  exercises: Exercise[];
  totalDuration: number; // in minutes
  difficulty: DifficultyLevel;
  muscleGroups: MuscleGroup[];
  estimatedCalories: number;
  thumbnailUrl?: string;
}

export interface WorkoutProgress {
  id: string;
  workoutId: string;
  date: string;
  completed: boolean;
  exercisesCompleted: string[]; // exercise IDs
  duration: number; // actual duration in minutes
  notes?: string;
}

// ==================== MEALS & NUTRITION ====================
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'keto'
  | 'paleo'
  | 'high_protein'
  | 'low_carb';

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  fiber?: number; // grams
  sugar?: number; // grams
  sodium?: number; // mg
}

export interface Ingredient {
  name: string;
  amount: string; // "2 cups", "100g", etc.
  calories?: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  type: MealType;
  imageUrl?: string;
  videoUrl?: string; // Prep video URL
  thumbnailUrl?: string; // Video thumbnail
  ingredients: Ingredient[];
  instructions?: string[];
  prepTime?: number; // minutes
  cookTime?: number; // minutes
  servings?: number;
  nutrition: NutritionInfo;
  dietaryTags: DietaryTag[];
}

export interface MealPlan {
  id: string;
  dayOfWeek: number; // 0-6
  meals: Meal[];
  totalNutrition: NutritionInfo;
}

// ==================== INTERMITTENT FASTING ====================
export interface FastingWindow {
  plan: FastingPlan;
  fastingHours: number;
  eatingHours: number;
  // Calculated based on user preference
  eatingStartTime: string; // "12:00"
  eatingEndTime: string; // "20:00"
  fastingStartTime: string; // "20:00"
  fastingEndTime: string; // "12:00"
}

export interface FastingSchedule {
  id: string;
  userId: string;
  plan: FastingPlan;
  window: FastingWindow;
  // Personalization based on work type
  recommendedEatingStart: string;
  customEatingStart?: string;
}

export interface FastingProgress {
  id: string;
  date: string;
  scheduledPlan: FastingPlan;
  actualFastingStart?: string;
  actualFastingEnd?: string;
  completed: boolean;
  fastingDuration?: number; // actual hours fasted
  notes?: string;
}

// ==================== DAILY PLAN ====================
export interface DailyPlan {
  id: string;
  date: string;
  workout: WorkoutPlan | null;
  meals: MealPlan | null;
  fasting: FastingWindow | null;
  isRestDay: boolean;
}

// ==================== PDF EXPORT ====================
export interface PDFExportOptions {
  type: 'daily' | 'weekly';
  date: string;
  includeWorkout: boolean;
  includeMeals: boolean;
  includeFasting: boolean;
  includeNutrition: boolean;
}

// ==================== ADMIN TYPES (for future expansion) ====================
export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

export interface ContentStatus {
  status: 'draft' | 'review' | 'published';
  lastModified: string;
  modifiedBy: string;
}

// ==================== API RESPONSE TYPES ====================
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== NAVIGATION PARAMS ====================
export type RootStackParamList = {
  '(tabs)': undefined;
  'onboarding': undefined;
  'exercise/[id]': { id: string };
  'meal/[id]': { id: string };
  'workout/[id]': { id: string };
  'pdf-preview': PDFExportOptions;
};

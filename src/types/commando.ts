/**
 * CALISTHENIC COMMANDO TYPE DEFINITIONS
 *
 * Extended types for the comprehensive onboarding and personalization system.
 * Supports gender-specific flows, assessments, and instant plan generation.
 */

import type { DifficultyLevel, MealIntensity, FastingPlan } from './fitness';

// ==================== GENDER & ONBOARDING ====================

export type UserGender = 'male' | 'female';

export type AgeCategory = '18-29' | '30-39' | '40-49' | '50+';

export type PrimaryGoal =
  | 'build_muscle'
  | 'lose_weight'
  | 'gain_muscle_lose_weight'
  | 'get_fit_toned';

export type BodyType = 'slim' | 'average' | 'big' | 'heavy';

export type ProblemArea =
  | 'weak_chest'
  | 'slim_arms'
  | 'beer_belly'
  | 'slim_legs'
  | 'flabby_arms'
  | 'belly_fat'
  | 'hip_fat'
  | 'thigh_fat';

export type DesiredBody = 'fit' | 'strong' | 'athletic' | 'toned' | 'lean' | 'curvy_fit';

export type ExperienceLevel = 'never' | 'beginner' | 'some' | 'regular' | 'advanced';

export type LastPeakShape = 'less_than_1yr' | '1_to_3yrs' | 'more_than_3yrs' | 'never';

export type MetabolicType = 'fast' | 'normal' | 'slow';

export type Obstacle =
  | 'lack_time'
  | 'lack_motivation'
  | 'lack_knowledge'
  | 'injuries'
  | 'poor_diet'
  | 'stress'
  | 'sleep_issues'
  | 'busy_schedule';

export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';

export type EnergyLevel = 'low' | 'moderate' | 'high' | 'variable';

export type SleepQuality = 'poor' | 'fair' | 'good' | 'excellent';

export type MotivationType = 'self_driven' | 'needs_push' | 'accountability' | 'rewards';

export type WorkoutTime = 'morning' | 'afternoon' | 'evening' | 'flexible';

export type TrainingFrequency = '2-3' | '4-5' | '6-7';

export type WorkoutDuration = '15-20' | '20-30' | '30-45' | '45-60';

// ==================== ASSESSMENT RESULTS ====================

export interface FitnessAssessment {
  pushUps: number;
  pullUps: number;
  strengthScore: number; // 0-100
  staminaScore: number; // 0-100
  overallLevel: 'beginner' | 'intermediate' | 'advanced';
}

// ==================== COMPREHENSIVE ONBOARDING DATA ====================

export interface CommandoOnboardingData {
  // Step 1: Gender selection
  gender?: UserGender;

  // Step 2: Age
  ageCategory?: AgeCategory;

  // Step 3: Primary goal
  primaryGoal?: PrimaryGoal;

  // Step 4: Body type
  bodyType?: BodyType;

  // Step 5: Problem areas (can select multiple)
  problemAreas?: ProblemArea[];

  // Step 6: Desired body
  desiredBody?: DesiredBody;

  // Step 7: Experience level
  experienceLevel?: ExperienceLevel;

  // Step 8: Program philosophy (info screen)
  philosophyAcknowledged?: boolean;

  // Step 9: Fitness history
  lastPeakShape?: LastPeakShape;

  // Step 10: Metabolic type
  metabolicType?: MetabolicType;

  // Step 11: Obstacles
  obstacles?: Obstacle[];

  // Step 12-13: Fitness assessment
  pushUpCount?: number;
  pullUpCount?: number;

  // Step 14: Fitness level summary (calculated)
  fitnessAssessment?: FitnessAssessment;

  // Step 15: Philosophy comparison (info)
  comparisonAcknowledged?: boolean;

  // Step 16: Training frequency
  trainingFrequency?: TrainingFrequency;

  // Step 17: Workout duration
  workoutDuration?: WorkoutDuration;

  // Step 18: Preferred workout time
  workoutTime?: WorkoutTime;

  // Step 19: Hormonal info (info screen)
  hormonalInfoAcknowledged?: boolean;

  // Step 20-21: Height & Weight / BMI
  heightCm?: number;
  weightKg?: number;
  weightUnit?: 'kg' | 'lbs' | 'stones'; // Track user's preferred weight unit
  weightConfirmed?: boolean; // Flag to track if user has confirmed their weight
  bmi?: number;

  // Step 22: Current & target weight
  currentWeight?: number;
  targetWeight?: number;

  // Step 23: Success story (motivational)
  successStoryViewed?: boolean;

  // Step 24: Water intake
  dailyWaterIntake?: number; // liters

  // Step 25: Activity level
  activityLevel?: ActivityLevel;

  // Step 26: Energy levels
  energyLevel?: EnergyLevel;

  // Step 27: Sleep habits
  sleepQuality?: SleepQuality;
  averageSleepHours?: number;

  // Step 28: Motivation type
  motivationType?: MotivationType;

  // Step 29: Health insights (calculated)
  healthInsightsViewed?: boolean;

  // Step 30: Potential assessment
  perceivedPotential?: 'low' | 'medium' | 'high' | 'very_high';

  // Step 31: Personalization survey
  workoutConfidence?: 'not_sure' | 'somewhat' | 'confident' | 'very_confident';

  // Step 32: Name
  firstName?: string;
  lastName?: string;

  // Step 33: Date of birth
  dateOfBirth?: string;

  // Step 34: Fitness age (calculated)
  fitnessAge?: number;

  // Step 35: Email
  email?: string;

  // Step 36: Marketing preferences
  marketingOptIn?: boolean;

  // Step 37: Results prediction
  predictionViewed?: boolean;

  // Processing complete
  processingComplete?: boolean;

  // Motivational quote viewed
  quoteViewed?: boolean;

  // Fasting preferences (from new vision)
  mealsPerDay?: 1 | 2; // Never 3
  fastingPlanSelected?: FastingPlan;

  // Terms & Privacy
  termsAccepted?: boolean;
  privacyAccepted?: boolean;
}

// ==================== ONBOARDING STEP DEFINITIONS ====================

export type CommandoOnboardingStep =
  | 'gender'
  | 'age'
  | 'primary_goal'
  | 'body_type'
  | 'problem_areas'
  | 'desired_body'
  | 'experience'
  | 'philosophy'
  | 'fitness_history'
  | 'metabolism'
  | 'obstacles'
  | 'pushup_assessment'
  | 'pullup_assessment'
  | 'fitness_summary'
  | 'philosophy_comparison'
  | 'training_frequency'
  | 'workout_duration'
  | 'workout_time'
  | 'hormonal_info'
  | 'height_weight'
  | 'target_weight'
  | 'success_story'
  | 'water_intake'
  | 'activity_level'
  | 'energy_level'
  | 'sleep_habits'
  | 'motivation'
  | 'health_insights'
  | 'potential'
  | 'personalization'
  | 'name'
  | 'date_of_birth'
  | 'fitness_age'
  | 'email'
  | 'marketing'
  | 'results_prediction'
  | 'processing'
  | 'quote';

export const COMMANDO_ONBOARDING_STEPS: CommandoOnboardingStep[] = [
  'gender',
  'age',
  'primary_goal',
  'body_type',
  'problem_areas',
  'desired_body',
  'experience',
  'philosophy',
  'fitness_history',
  'metabolism',
  'obstacles',
  'pushup_assessment',
  'pullup_assessment',
  'fitness_summary',
  'philosophy_comparison',
  'training_frequency',
  'workout_duration',
  'workout_time',
  'hormonal_info',
  'height_weight',
  'target_weight',
  'success_story',
  'water_intake',
  'activity_level',
  'energy_level',
  'sleep_habits',
  'motivation',
  'health_insights',
  'potential',
  'personalization',
  'name',
  'date_of_birth',
  'fitness_age',
  'email',
  'marketing',
  'results_prediction',
  'processing',
  'quote',
];

// ==================== GENDER-SPECIFIC CONTENT ====================

export interface GenderContent {
  male: {
    headlines: Record<CommandoOnboardingStep, string>;
    descriptions: Record<CommandoOnboardingStep, string>;
    motivationalQuotes: string[];
    successStoryImage: string;
    tone: 'challenge' | 'motivation';
  };
  female: {
    headlines: Record<CommandoOnboardingStep, string>;
    descriptions: Record<CommandoOnboardingStep, string>;
    motivationalQuotes: string[];
    successStoryImage: string;
    tone: 'encouragement' | 'empowerment';
  };
}

// ==================== PERSONALIZED PLAN ====================

export interface PersonalizedPlan {
  id: string;
  userId: string;
  createdAt: string;

  // User profile summary
  profile: {
    gender: UserGender;
    ageCategory: AgeCategory;
    heightCm: number;
    weightKg: number;
    targetWeight: number;
    bmi: number;
    fitnessLevel: DifficultyLevel;
    fitnessAge: number;
  };

  // Goals
  goals: {
    primary: PrimaryGoal;
    desiredBody: DesiredBody;
    obstacles: Obstacle[];
  };

  // Training configuration
  training: {
    frequency: TrainingFrequency;
    duration: WorkoutDuration;
    preferredTime: WorkoutTime;
    difficulty: DifficultyLevel;
  };

  // Nutrition configuration
  nutrition: {
    mealsPerDay: 1 | 2;
    mealIntensity: MealIntensity;
    fastingPlan: FastingPlan;
    dailyCalorieTarget: number;
    proteinTarget: number;
    waterTarget: number;
  };

  // Predictions
  predictions: {
    estimatedWeeksToGoal: number;
    weeklyWeightChange: number;
    monthlyProgressPercent: number;
  };

  // Coaching (for 12-month plan users)
  coaching?: {
    enabled: boolean;
    coachId?: string;
    nextSessionDate?: string;
  };
}

// ==================== DAY PLAN WITH PROGRESSION ====================

export interface DayPlan {
  dayNumber: number; // 1, 2, 3, etc.
  date: string;

  // Exercises with sequential order
  exercises: DayExercise[];

  // Meals with timing
  meals: DayMeal[];

  // Fasting schedule
  fasting: {
    plan: FastingPlan;
    fastingStart: string;
    fastingEnd: string;
    eatingWindowStart: string;
    eatingWindowEnd: string;
    currentStatus: 'fasting' | 'eating';
    timeRemaining: number; // minutes
  };

  // Progress
  progress: {
    exercisesCompleted: number;
    exercisesTotal: number;
    mealsCompleted: number;
    mealsTotal: number;
    fastingCompliance: boolean;
  };

  isRestDay: boolean;
  isComplete: boolean;
}

export interface DayExercise {
  id: string;
  order: number;
  name: string;
  description: string;
  muscleGroups: string[];

  // Parameters
  sets: number;
  reps: number | string;
  duration?: number; // seconds for timed exercises
  restTime: number; // seconds

  // Media
  videoUrl?: string;
  thumbnailUrl?: string;

  // State
  isStarted: boolean;
  isCompleted: boolean;
  canStart: boolean; // false if previous exercise not complete

  // For timed exercises
  timerConfig?: {
    type: 'countdown' | 'stopwatch';
    totalSeconds: number;
    hasAudio: boolean;
  };
}

export interface DayMeal {
  id: string;
  order: number;
  type: 'meal_1' | 'meal_2';
  name: string;
  description: string;

  // Timing
  scheduledTime: string;
  isWithinWindow: boolean;
  countdownMinutes?: number; // minutes until meal time

  // Nutrition
  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  // Portions
  portions: {
    ingredient: string;
    amount: string;
    calories: number;
  }[];

  // State
  isCompleted: boolean;

  // Media
  imageUrl?: string;
  instructions?: string[];
}

// ==================== PLAN GENERATION INPUT ====================

export interface PlanGenerationInput {
  onboardingData: CommandoOnboardingData;
  startDate: string;
  planDuration: 7 | 30 | 90 | 365; // days
  includeCoaching: boolean;
}

// ==================== PROGRESSION SYSTEM ====================

export interface ProgressionConfig {
  // Week 1: Foundation
  week1: {
    intensity: 'low';
    exercisesPerDay: number;
    restDays: number[];
  };

  // Week 2-4: Building
  weeks2to4: {
    intensity: 'moderate';
    exercisesPerDay: number;
    restDays: number[];
    progressionRate: number; // % increase per week
  };

  // Week 5+: Advancement
  week5plus: {
    intensity: 'high';
    exercisesPerDay: number;
    restDays: number[];
    progressionRate: number;
  };
}

// ==================== DATABASE PERSISTENCE ====================

export interface UserOnboardingRecord {
  id: string;
  createdAt: string;
  updatedAt: string;

  // All onboarding answers
  onboardingData: CommandoOnboardingData;

  // Generated plan
  personalizedPlan: PersonalizedPlan;

  // Current progress
  currentDay: number;
  totalDays: number;

  // Historical progress
  completedDays: string[]; // ISO date strings

  // Modifications
  planModifications: {
    date: string;
    type: 'workout' | 'meal' | 'fasting';
    reason: string;
  }[];
}

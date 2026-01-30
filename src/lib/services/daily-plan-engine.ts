/**
 * DAILY PLAN ENGINE
 *
 * Core service for generating personalized daily plans combining:
 * - Workout plans filtered by user difficulty
 * - Meal plans adjusted by intensity and fasting windows
 * - Intermittent fasting schedules
 *
 * Architecture:
 * - Rule-based plan generation (no device AI)
 * - Modular design for future AI integration
 * - Separation of computation from display
 * - PDF-ready data formatting
 *
 * Future-proof for:
 * - AI-generated plan suggestions
 * - Personalized goals
 * - Advanced analytics
 * - Admin overrides
 */

import type {
  UserProfile,
  DailyPlan,
  WorkoutPlan,
  MealPlan,
  Meal,
  Exercise,
  FastingWindow,
  FastingPlan,
  DifficultyLevel,
  MealIntensity,
  MealType,
  NutritionInfo,
} from '@/types/fitness';
import {
  getWorkoutForDayWithDifficulty,
  getMealPlanForIntensity,
  getFastingWindow,
  exercises,
  meals,
} from '@/data/mock-data';
import { MealService, FastingService } from './meal-service';

// ==================== TYPES ====================

/** Validation result for plan components */
export interface PlanValidation {
  isValid: boolean;
  errors: PlanError[];
  warnings: PlanWarning[];
}

/** Error in plan generation */
export interface PlanError {
  code: string;
  message: string;
  component: 'workout' | 'meal' | 'fasting' | 'general';
  severity: 'critical' | 'recoverable';
  fallbackApplied?: boolean;
}

/** Warning in plan generation */
export interface PlanWarning {
  code: string;
  message: string;
  component: 'workout' | 'meal' | 'fasting' | 'general';
}

/** Extended meal with schedule info */
export interface ScheduledMeal extends Meal {
  scheduledTime: string;
  isWithinWindow: boolean;
  orderInDay: number;
}

/** Extended workout with exercise details */
export interface EnrichedWorkout extends WorkoutPlan {
  exerciseDetails: EnrichedExercise[];
  completionEstimate: {
    totalMinutes: number;
    totalCalories: number;
    restMinutes: number;
  };
}

/** Extended exercise with full metadata */
export interface EnrichedExercise extends Exercise {
  orderInWorkout: number;
  estimatedMinutes: number;
  hasVideo: boolean;
}

/** Fasting status for the day */
export interface DailyFastingStatus {
  window: FastingWindow;
  currentPhase: 'eating' | 'fasting';
  phaseStartTime: string;
  phaseEndTime: string;
  minutesRemaining: number;
  percentComplete: number;
  nextMealTime: string | null;
}

/** Complete enriched daily plan */
export interface EnrichedDailyPlan {
  // Core identifiers
  id: string;
  userId: string;
  date: string;
  dayOfWeek: number;
  dayNumber: number; // Day in program (1-7)

  // Plan components
  workout: EnrichedWorkout | null;
  meals: {
    plan: MealPlan;
    scheduled: ScheduledMeal[];
    totalNutrition: NutritionInfo;
  };
  fasting: DailyFastingStatus;

  // Metadata
  isRestDay: boolean;
  validation: PlanValidation;
  generatedAt: string;

  // PDF export data
  pdfData: PDFExportData;

  // Future placeholders
  userNotes?: string;
  adminOverrides?: AdminOverride[];
  aiSuggestions?: AISuggestion[];
}

/** Data formatted for PDF generation */
export interface PDFExportData {
  title: string;
  subtitle: string;
  date: string;
  sections: {
    fasting: {
      plan: string;
      window: string;
      hours: { fasting: number; eating: number };
    };
    workout: {
      name: string;
      description: string;
      duration: number;
      calories: number;
      exercises: {
        name: string;
        sets?: number;
        reps?: string | number;
        duration?: number;
        rest?: number;
      }[];
    } | null;
    meals: {
      items: {
        type: MealType;
        name: string;
        scheduledTime: string;
        isWithinWindow: boolean;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        prepTime?: number;
        cookTime?: number;
      }[];
      totalNutrition: NutritionInfo;
    };
  };
  footer: {
    generatedAt: string;
    appName: string;
  };
}

/** Admin override for a plan component */
export interface AdminOverride {
  id: string;
  component: 'workout' | 'meal' | 'fasting';
  reason: string;
  overriddenBy: string;
  overriddenAt: string;
  originalValue: unknown;
  newValue: unknown;
}

/** AI suggestion placeholder for future */
export interface AISuggestion {
  id: string;
  type: 'workout_swap' | 'meal_alternative' | 'fasting_adjustment';
  reason: string;
  confidence: number;
  suggestion: unknown;
}

/** Input for plan generation */
export interface PlanGenerationInput {
  userId: string;
  date: Date;
  profile: {
    weight: number;
    workType: string;
    fastingPlan: FastingPlan;
    workoutDifficulty: DifficultyLevel;
    mealIntensity: MealIntensity;
  };
  options?: {
    skipWorkout?: boolean;
    skipMeals?: boolean;
    forceRestDay?: boolean;
    adminOverrides?: AdminOverride[];
  };
}

// ==================== CONSTANTS ====================

const DEFAULT_FASTING_PLAN: FastingPlan = '16:8';
const APP_NAME = 'FitLife';

const ERROR_CODES = {
  MISSING_WORKOUT: 'E001',
  MISSING_MEAL: 'E002',
  MISSING_FASTING: 'E003',
  INVALID_PROFILE: 'E004',
  EXERCISE_NO_VIDEO: 'W001',
  MEAL_NO_VIDEO: 'W002',
  MEAL_OUTSIDE_WINDOW: 'W003',
} as const;

// ==================== VALIDATION ====================

export const PlanValidation = {
  /**
   * Validate user profile for plan generation
   */
  validateProfile(profile: PlanGenerationInput['profile']): PlanValidation {
    const errors: PlanError[] = [];
    const warnings: PlanWarning[] = [];

    if (!profile.weight || profile.weight <= 0) {
      errors.push({
        code: ERROR_CODES.INVALID_PROFILE,
        message: 'Invalid weight in profile',
        component: 'general',
        severity: 'critical',
      });
    }

    if (!profile.fastingPlan) {
      warnings.push({
        code: ERROR_CODES.MISSING_FASTING,
        message: 'No fasting plan specified, using default 16:8',
        component: 'fasting',
      });
    }

    return {
      isValid: errors.filter((e) => e.severity === 'critical').length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate workout plan
   */
  validateWorkout(workout: WorkoutPlan | null, isRestDay: boolean): PlanValidation {
    const errors: PlanError[] = [];
    const warnings: PlanWarning[] = [];

    if (!isRestDay && !workout) {
      errors.push({
        code: ERROR_CODES.MISSING_WORKOUT,
        message: 'No workout found for this day',
        component: 'workout',
        severity: 'recoverable',
        fallbackApplied: true,
      });
    }

    if (workout) {
      // Check for exercises without videos
      const exercisesWithoutVideo = workout.exercises.filter((e) => !e.videoUrl);
      if (exercisesWithoutVideo.length > 0) {
        warnings.push({
          code: ERROR_CODES.EXERCISE_NO_VIDEO,
          message: `${exercisesWithoutVideo.length} exercise(s) missing video`,
          component: 'workout',
        });
      }
    }

    return { isValid: true, errors, warnings };
  },

  /**
   * Validate meal plan
   */
  validateMealPlan(
    mealPlan: MealPlan | null,
    fastingWindow: FastingWindow
  ): PlanValidation {
    const errors: PlanError[] = [];
    const warnings: PlanWarning[] = [];

    if (!mealPlan) {
      errors.push({
        code: ERROR_CODES.MISSING_MEAL,
        message: 'No meal plan found for this day',
        component: 'meal',
        severity: 'recoverable',
        fallbackApplied: true,
      });
    }

    if (mealPlan) {
      // Check for meals outside eating window
      mealPlan.meals.forEach((meal) => {
        const scheduledTime = MealService.getScheduledMealTime(meal.type, fastingWindow.plan);
        if (!MealService.isWithinEatingWindow(scheduledTime, fastingWindow)) {
          warnings.push({
            code: ERROR_CODES.MEAL_OUTSIDE_WINDOW,
            message: `${meal.name} (${meal.type}) scheduled outside eating window`,
            component: 'meal',
          });
        }
      });
    }

    return { isValid: true, errors, warnings };
  },
};

// ==================== PLAN ENRICHMENT ====================

export const PlanEnrichment = {
  /**
   * Enrich workout with detailed exercise info
   */
  enrichWorkout(workout: WorkoutPlan): EnrichedWorkout {
    let totalMinutes = 0;
    let restMinutes = 0;

    const exerciseDetails: EnrichedExercise[] = workout.exercises.map((exercise, index) => {
      // Calculate exercise duration
      let exerciseMinutes = 0;
      if (exercise.duration) {
        exerciseMinutes = (exercise.duration * (exercise.sets ?? 1)) / 60;
      } else if (exercise.sets && exercise.reps) {
        // Estimate 3 seconds per rep
        const reps = typeof exercise.reps === 'number' ? exercise.reps : 12;
        exerciseMinutes = (exercise.sets * reps * 3) / 60;
      }

      const restTime = (exercise.restTime ?? 60) * ((exercise.sets ?? 1) - 1) / 60;
      totalMinutes += exerciseMinutes + restTime;
      restMinutes += restTime;

      return {
        ...exercise,
        orderInWorkout: index + 1,
        estimatedMinutes: Math.round(exerciseMinutes + restTime),
        hasVideo: !!exercise.videoUrl,
      };
    });

    return {
      ...workout,
      exerciseDetails,
      completionEstimate: {
        totalMinutes: Math.round(totalMinutes),
        totalCalories: workout.estimatedCalories,
        restMinutes: Math.round(restMinutes),
      },
    };
  },

  /**
   * Create scheduled meals with timing info
   */
  createScheduledMeals(
    mealPlan: MealPlan,
    fastingPlan: FastingPlan,
    fastingWindow: FastingWindow
  ): ScheduledMeal[] {
    return mealPlan.meals
      .map((meal, index) => {
        const scheduledTime = MealService.getScheduledMealTime(meal.type, fastingPlan);
        const isWithinWindow = MealService.isWithinEatingWindow(scheduledTime, fastingWindow);

        return {
          ...meal,
          scheduledTime,
          isWithinWindow,
          orderInDay: index,
        };
      })
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime))
      .map((meal, index) => ({ ...meal, orderInDay: index + 1 }));
  },

  /**
   * Get current fasting status
   */
  getFastingStatus(fastingWindow: FastingWindow): DailyFastingStatus {
    const status = FastingService.getCurrentFastingStatus(fastingWindow);

    // Find next meal time
    let nextMealTime: string | null = null;
    if (status.currentPhase === 'eating') {
      // During eating window, suggest meal times
      const now = new Date();
      const currentHour = now.getHours();
      const mealHours = [
        parseInt(fastingWindow.eatingStartTime.split(':')[0]),
        Math.floor(
          (parseInt(fastingWindow.eatingStartTime.split(':')[0]) +
            parseInt(fastingWindow.eatingEndTime.split(':')[0])) /
            2
        ),
        parseInt(fastingWindow.eatingEndTime.split(':')[0]) - 2,
      ];

      const nextMealHour = mealHours.find((h) => h > currentHour);
      if (nextMealHour) {
        nextMealTime = `${nextMealHour.toString().padStart(2, '0')}:00`;
      }
    }

    // Calculate minutes remaining from timeRemaining object
    const minutesRemaining = status.timeRemaining.hours * 60 + status.timeRemaining.minutes;

    return {
      window: fastingWindow,
      currentPhase: status.currentPhase,
      phaseStartTime:
        status.currentPhase === 'eating'
          ? fastingWindow.eatingStartTime
          : fastingWindow.fastingStartTime,
      phaseEndTime:
        status.currentPhase === 'eating'
          ? fastingWindow.eatingEndTime
          : fastingWindow.fastingEndTime,
      minutesRemaining,
      percentComplete: status.percentComplete,
      nextMealTime,
    };
  },
};

// ==================== PDF DATA FORMATTER ====================

export const PDFFormatter = {
  /**
   * Format daily plan for PDF export
   */
  formatForPDF(plan: EnrichedDailyPlan): PDFExportData {
    const dateObj = new Date(plan.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      title: `${APP_NAME} Daily Plan`,
      subtitle: plan.isRestDay ? 'Rest Day' : `Day ${plan.dayNumber}`,
      date: formattedDate,
      sections: {
        fasting: {
          plan: plan.fasting.window.plan,
          window: `${plan.fasting.window.eatingStartTime} - ${plan.fasting.window.eatingEndTime}`,
          hours: {
            fasting: plan.fasting.window.fastingHours,
            eating: plan.fasting.window.eatingHours,
          },
        },
        workout: plan.workout
          ? {
              name: plan.workout.name,
              description: plan.workout.description,
              duration: plan.workout.completionEstimate.totalMinutes,
              calories: plan.workout.completionEstimate.totalCalories,
              exercises: plan.workout.exerciseDetails.map((e) => ({
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                duration: e.duration,
                rest: e.restTime,
              })),
            }
          : null,
        meals: {
          items: plan.meals.scheduled.map((m) => ({
            type: m.type,
            name: m.name,
            scheduledTime: m.scheduledTime,
            isWithinWindow: m.isWithinWindow,
            calories: m.nutrition.calories,
            protein: m.nutrition.protein,
            carbs: m.nutrition.carbs,
            fat: m.nutrition.fat,
            prepTime: m.prepTime,
            cookTime: m.cookTime,
          })),
          totalNutrition: plan.meals.totalNutrition,
        },
      },
      footer: {
        generatedAt: new Date().toISOString(),
        appName: APP_NAME,
      },
    };
  },
};

// ==================== DAILY PLAN ENGINE ====================

export const DailyPlanEngine = {
  /**
   * Generate a complete enriched daily plan
   */
  generate(input: PlanGenerationInput): EnrichedDailyPlan {
    const { userId, date, profile, options } = input;
    const dayOfWeek = date.getDay();
    const dayNumber = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 (Mon-Sun)

    // Validate profile
    const profileValidation = PlanValidation.validateProfile(profile);
    const allErrors: PlanError[] = [...profileValidation.errors];
    const allWarnings: PlanWarning[] = [...profileValidation.warnings];

    // Determine fasting plan (with fallback)
    const fastingPlan = profile.fastingPlan ?? DEFAULT_FASTING_PLAN;
    const fastingWindow = getFastingWindow(fastingPlan);

    // Determine if rest day
    const isRestDay = options?.forceRestDay ?? dayOfWeek === 0;

    // Generate workout plan
    let workout: EnrichedWorkout | null = null;
    if (!isRestDay && !options?.skipWorkout) {
      const rawWorkout = getWorkoutForDayWithDifficulty(dayOfWeek, profile.workoutDifficulty);
      const workoutValidation = PlanValidation.validateWorkout(rawWorkout, isRestDay);
      allErrors.push(...workoutValidation.errors);
      allWarnings.push(...workoutValidation.warnings);

      if (rawWorkout) {
        workout = PlanEnrichment.enrichWorkout(rawWorkout);
      }
    }

    // Generate meal plan
    let mealPlan: MealPlan | null = null;
    let scheduledMeals: ScheduledMeal[] = [];
    if (!options?.skipMeals) {
      mealPlan = getMealPlanForIntensity(dayOfWeek, profile.mealIntensity);
      const mealValidation = PlanValidation.validateMealPlan(mealPlan, fastingWindow);
      allErrors.push(...mealValidation.errors);
      allWarnings.push(...mealValidation.warnings);

      if (mealPlan) {
        scheduledMeals = PlanEnrichment.createScheduledMeals(
          mealPlan,
          fastingPlan,
          fastingWindow
        );
      }
    }

    // Get fasting status
    const fastingStatus = PlanEnrichment.getFastingStatus(fastingWindow);

    // Create the enriched plan
    const enrichedPlan: EnrichedDailyPlan = {
      id: `plan-${userId}-${date.toISOString().split('T')[0]}`,
      userId,
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      dayNumber,
      workout,
      meals: {
        plan: mealPlan ?? {
          id: 'fallback',
          dayOfWeek,
          meals: [],
          totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        },
        scheduled: scheduledMeals,
        totalNutrition: mealPlan?.totalNutrition ?? {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        },
      },
      fasting: fastingStatus,
      isRestDay,
      validation: {
        isValid: allErrors.filter((e) => e.severity === 'critical').length === 0,
        errors: allErrors,
        warnings: allWarnings,
      },
      generatedAt: new Date().toISOString(),
      pdfData: {} as PDFExportData, // Will be populated below
      adminOverrides: options?.adminOverrides,
    };

    // Generate PDF data
    enrichedPlan.pdfData = PDFFormatter.formatForPDF(enrichedPlan);

    return enrichedPlan;
  },

  /**
   * Generate plans for a week
   */
  generateWeek(
    userId: string,
    startDate: Date,
    profile: PlanGenerationInput['profile']
  ): EnrichedDailyPlan[] {
    const plans: EnrichedDailyPlan[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 7; i++) {
      plans.push(
        this.generate({
          userId,
          date: new Date(currentDate),
          profile,
        })
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return plans;
  },

  /**
   * Apply admin override to a plan
   */
  applyOverride(
    plan: EnrichedDailyPlan,
    override: AdminOverride
  ): EnrichedDailyPlan {
    const updatedPlan = { ...plan };
    updatedPlan.adminOverrides = [...(plan.adminOverrides ?? []), override];

    // Apply the override based on component
    switch (override.component) {
      case 'workout':
        // Future: Apply workout override
        console.log('[DailyPlanEngine] Workout override applied');
        break;
      case 'meal':
        // Future: Apply meal override
        console.log('[DailyPlanEngine] Meal override applied');
        break;
      case 'fasting':
        // Future: Apply fasting override
        console.log('[DailyPlanEngine] Fasting override applied');
        break;
    }

    return updatedPlan;
  },

  /**
   * Check if plan needs regeneration
   */
  needsRegeneration(plan: EnrichedDailyPlan, profile: PlanGenerationInput['profile']): boolean {
    // Check if profile changes affect the plan
    // Future: More sophisticated change detection
    return false;
  },

  /**
   * Get plan summary for display
   */
  getSummary(plan: EnrichedDailyPlan): {
    date: string;
    isRestDay: boolean;
    workoutName: string | null;
    workoutDuration: number | null;
    mealCount: number;
    totalCalories: number;
    fastingPlan: string;
    hasErrors: boolean;
    hasWarnings: boolean;
  } {
    return {
      date: plan.date,
      isRestDay: plan.isRestDay,
      workoutName: plan.workout?.name ?? null,
      workoutDuration: plan.workout?.completionEstimate.totalMinutes ?? null,
      mealCount: plan.meals.scheduled.length,
      totalCalories: plan.meals.totalNutrition.calories,
      fastingPlan: plan.fasting.window.plan,
      hasErrors: plan.validation.errors.length > 0,
      hasWarnings: plan.validation.warnings.length > 0,
    };
  },
};

// ==================== ADMIN OVERRIDE SERVICE ====================

export const AdminOverrideService = {
  /**
   * Create a workout override
   */
  createWorkoutOverride(
    originalWorkout: WorkoutPlan | null,
    newWorkoutId: string,
    reason: string,
    adminId: string
  ): AdminOverride {
    return {
      id: `override-${Date.now()}`,
      component: 'workout',
      reason,
      overriddenBy: adminId,
      overriddenAt: new Date().toISOString(),
      originalValue: originalWorkout?.id ?? null,
      newValue: newWorkoutId,
    };
  },

  /**
   * Create a meal override
   */
  createMealOverride(
    mealType: MealType,
    originalMealId: string,
    newMealId: string,
    reason: string,
    adminId: string
  ): AdminOverride {
    return {
      id: `override-${Date.now()}`,
      component: 'meal',
      reason,
      overriddenBy: adminId,
      overriddenAt: new Date().toISOString(),
      originalValue: { mealType, mealId: originalMealId },
      newValue: { mealType, mealId: newMealId },
    };
  },

  /**
   * Create a fasting override
   */
  createFastingOverride(
    originalPlan: FastingPlan,
    newPlan: FastingPlan,
    reason: string,
    adminId: string
  ): AdminOverride {
    return {
      id: `override-${Date.now()}`,
      component: 'fasting',
      reason,
      overriddenBy: adminId,
      overriddenAt: new Date().toISOString(),
      originalValue: originalPlan,
      newValue: newPlan,
    };
  },

  /**
   * Validate an override
   */
  validateOverride(override: AdminOverride): boolean {
    return !!(
      override.id &&
      override.component &&
      override.reason &&
      override.overriddenBy &&
      override.overriddenAt
    );
  },
};

export default DailyPlanEngine;

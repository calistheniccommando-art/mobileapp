/**
 * DAILY PLAN HOOKS
 *
 * React hooks for integrating the Daily Plan Engine with mobile UI.
 * Provides easy-to-use hooks for accessing and managing daily plans.
 */

import { useMemo, useCallback, useState, useEffect } from 'react';
import { useUserStore, useProfile, useFastingPlan } from '@/lib/state/user-store';
import { useAppStore, useDailyPlan as useDailyPlanStore } from '@/lib/state/app-store';
import {
  DailyPlanEngine,
  PlanEnrichment,
  PDFFormatter,
  type EnrichedDailyPlan,
  type ScheduledMeal,
  type EnrichedWorkout,
  type DailyFastingStatus,
  type PlanGenerationInput,
  type PDFExportData,
} from '@/lib/services/daily-plan-engine';
import { getFastingWindow } from '@/data/mock-data';
import type { FastingPlan, DifficultyLevel, MealIntensity } from '@/types/fitness';

// ==================== TYPES ====================

export interface UseDailyPlanResult {
  plan: EnrichedDailyPlan | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
  summary: ReturnType<typeof DailyPlanEngine.getSummary> | null;
}

export interface UseFastingStatusResult {
  status: DailyFastingStatus | null;
  isEating: boolean;
  isFasting: boolean;
  minutesRemaining: number;
  percentComplete: number;
  nextMealTime: string | null;
  window: {
    start: string;
    end: string;
    plan: FastingPlan;
  } | null;
}

export interface UseScheduledMealsResult {
  meals: ScheduledMeal[];
  mealsInWindow: number;
  mealsOutsideWindow: number;
  nextMeal: ScheduledMeal | null;
  totalCalories: number;
  totalProtein: number;
}

export interface UseWorkoutResult {
  workout: EnrichedWorkout | null;
  isRestDay: boolean;
  totalExercises: number;
  completedExercises: number;
  totalDuration: number;
  totalCalories: number;
}

export interface UsePDFExportResult {
  pdfData: PDFExportData | null;
  isReady: boolean;
  generate: () => PDFExportData | null;
}

// ==================== HOOKS ====================

/**
 * Main hook for accessing the enriched daily plan
 */
export function useEnrichedDailyPlan(date?: Date): UseDailyPlanResult {
  const profile = useProfile();
  const storeSelectedDate = useAppStore((s) => s.selectedDate);
  const selectedDate = date ?? storeSelectedDate;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const plan = useMemo(() => {
    if (!profile?.onboardingCompleted) {
      return null;
    }

    try {
      const input: PlanGenerationInput = {
        userId: profile.id,
        date: selectedDate,
        profile: {
          weight: profile.weight,
          workType: profile.workType,
          fastingPlan: profile.fastingPlan,
          workoutDifficulty: profile.workoutDifficulty,
          mealIntensity: profile.mealIntensity,
        },
      };

      return DailyPlanEngine.generate(input);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to generate plan'));
      return null;
    }
  }, [profile, selectedDate]);

  const summary = useMemo(() => {
    if (!plan) return null;
    return DailyPlanEngine.getSummary(plan);
  }, [plan]);

  const refresh = useCallback(() => {
    setIsLoading(true);
    // Force re-render by updating state
    setTimeout(() => setIsLoading(false), 0);
  }, []);

  return {
    plan,
    isLoading,
    error,
    refresh,
    summary,
  };
}

/**
 * Hook for current fasting status with real-time updates
 */
export function useFastingStatus(): UseFastingStatusResult {
  const fastingPlan = useFastingPlan();
  const [tick, setTick] = useState(0);

  // Update every minute for real-time status
  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const status = useMemo(() => {
    if (!fastingPlan) return null;
    const window = getFastingWindow(fastingPlan);
    return PlanEnrichment.getFastingStatus(window);
  }, [fastingPlan, tick]);

  return {
    status,
    isEating: status?.currentPhase === 'eating',
    isFasting: status?.currentPhase === 'fasting',
    minutesRemaining: status?.minutesRemaining ?? 0,
    percentComplete: status?.percentComplete ?? 0,
    nextMealTime: status?.nextMealTime ?? null,
    window: status
      ? {
          start: status.window.eatingStartTime,
          end: status.window.eatingEndTime,
          plan: status.window.plan,
        }
      : null,
  };
}

/**
 * Hook for scheduled meals with timing info
 */
export function useScheduledMeals(date?: Date): UseScheduledMealsResult {
  const { plan } = useEnrichedDailyPlan(date);

  const result = useMemo(() => {
    if (!plan) {
      return {
        meals: [],
        mealsInWindow: 0,
        mealsOutsideWindow: 0,
        nextMeal: null,
        totalCalories: 0,
        totalProtein: 0,
      };
    }

    const meals = plan.meals.scheduled;
    const mealsInWindow = meals.filter((m) => m.isWithinWindow).length;
    const mealsOutsideWindow = meals.length - mealsInWindow;

    // Find next meal based on current time
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const nextMeal = meals.find((m) => m.scheduledTime > currentTime) ?? null;

    return {
      meals,
      mealsInWindow,
      mealsOutsideWindow,
      nextMeal,
      totalCalories: plan.meals.totalNutrition.calories,
      totalProtein: plan.meals.totalNutrition.protein,
    };
  }, [plan]);

  return result;
}

/**
 * Hook for today's workout
 */
export function useWorkout(date?: Date): UseWorkoutResult {
  const { plan } = useEnrichedDailyPlan(date);
  const completedExercises = useAppStore((s) => s.completedExerciseIds);

  const result = useMemo(() => {
    if (!plan) {
      return {
        workout: null,
        isRestDay: false,
        totalExercises: 0,
        completedExercises: 0,
        totalDuration: 0,
        totalCalories: 0,
      };
    }

    const workout = plan.workout;
    const totalExercises = workout?.exerciseDetails.length ?? 0;
    const completedCount = workout?.exerciseDetails.filter((e) =>
      completedExercises.includes(e.id)
    ).length ?? 0;

    return {
      workout,
      isRestDay: plan.isRestDay,
      totalExercises,
      completedExercises: completedCount,
      totalDuration: workout?.completionEstimate.totalMinutes ?? 0,
      totalCalories: workout?.completionEstimate.totalCalories ?? 0,
    };
  }, [plan, completedExercises]);

  return result;
}

/**
 * Hook for PDF export data
 */
export function usePDFExport(date?: Date): UsePDFExportResult {
  const { plan } = useEnrichedDailyPlan(date);

  const pdfData = useMemo(() => {
    if (!plan) return null;
    return plan.pdfData;
  }, [plan]);

  const generate = useCallback(() => {
    if (!plan) return null;
    return PDFFormatter.formatForPDF(plan);
  }, [plan]);

  return {
    pdfData,
    isReady: !!plan,
    generate,
  };
}

/**
 * Hook for week view with all plans
 */
export function useWeekPlan(startDate?: Date): {
  plans: EnrichedDailyPlan[];
  isLoading: boolean;
  totalWorkouts: number;
  totalMeals: number;
  restDays: number;
} {
  const profile = useProfile();
  const start = startDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Start from Monday
    return d;
  })();

  const plans = useMemo(() => {
    if (!profile?.onboardingCompleted) {
      return [];
    }

    return DailyPlanEngine.generateWeek(profile.id, start, {
      weight: profile.weight,
      workType: profile.workType,
      fastingPlan: profile.fastingPlan,
      workoutDifficulty: profile.workoutDifficulty,
      mealIntensity: profile.mealIntensity,
    });
  }, [profile, start]);

  return {
    plans,
    isLoading: false,
    totalWorkouts: plans.filter((p) => !p.isRestDay && p.workout).length,
    totalMeals: plans.reduce((sum, p) => sum + p.meals.scheduled.length, 0),
    restDays: plans.filter((p) => p.isRestDay).length,
  };
}

/**
 * Hook for plan validation status
 */
export function usePlanValidation(date?: Date): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hasErrors: boolean;
  hasWarnings: boolean;
} {
  const { plan } = useEnrichedDailyPlan(date);

  return useMemo(() => {
    if (!plan) {
      return {
        isValid: false,
        errors: ['No plan generated'],
        warnings: [],
        hasErrors: true,
        hasWarnings: false,
      };
    }

    return {
      isValid: plan.validation.isValid,
      errors: plan.validation.errors.map((e) => e.message),
      warnings: plan.validation.warnings.map((w) => w.message),
      hasErrors: plan.validation.errors.length > 0,
      hasWarnings: plan.validation.warnings.length > 0,
    };
  }, [plan]);
}

/**
 * Hook for quick stats display
 */
export function useDailyStats(date?: Date): {
  calories: number;
  protein: number;
  workoutDuration: number;
  fastingProgress: number;
  exercisesCompleted: number;
  exercisesTotal: number;
  mealsScheduled: number;
} {
  const { plan } = useEnrichedDailyPlan(date);
  const { percentComplete } = useFastingStatus();
  const completedExercises = useAppStore((s) => s.completedExerciseIds);

  return useMemo(() => {
    if (!plan) {
      return {
        calories: 0,
        protein: 0,
        workoutDuration: 0,
        fastingProgress: 0,
        exercisesCompleted: 0,
        exercisesTotal: 0,
        mealsScheduled: 0,
      };
    }

    const exercisesTotal = plan.workout?.exerciseDetails.length ?? 0;
    const exercisesCompletedCount = plan.workout?.exerciseDetails.filter((e) =>
      completedExercises.includes(e.id)
    ).length ?? 0;

    return {
      calories: plan.meals.totalNutrition.calories,
      protein: plan.meals.totalNutrition.protein,
      workoutDuration: plan.workout?.completionEstimate.totalMinutes ?? 0,
      fastingProgress: percentComplete,
      exercisesCompleted: exercisesCompletedCount,
      exercisesTotal,
      mealsScheduled: plan.meals.scheduled.length,
    };
  }, [plan, percentComplete, completedExercises]);
}

export default {
  useEnrichedDailyPlan,
  useFastingStatus,
  useScheduledMeals,
  useWorkout,
  usePDFExport,
  useWeekPlan,
  usePlanValidation,
  useDailyStats,
};

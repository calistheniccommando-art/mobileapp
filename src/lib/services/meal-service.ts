/**
 * MEAL SERVICE
 *
 * Handles all meal-related business logic:
 * - Fetching meals by category and type
 * - Fasting window alignment
 * - Meal scheduling based on user profile
 * - Nutrition calculations
 */

import type {
  Meal,
  MealPlan,
  MealType,
  FastingPlan,
  FastingWindow,
  DifficultyLevel,
  NutritionInfo,
  DietaryTag,
} from '@/types/fitness';
import type { MealCategory } from '@/types/database';
import {
  meals,
  mealPlans,
  getFastingWindow,
  getMealPlanForIntensity,
} from '@/data/mock-data';

// ==================== TYPES ====================

export interface MealWithTiming extends Meal {
  scheduledTime?: string; // HH:mm format
  isWithinEatingWindow: boolean;
  orderInDay: number;
}

export interface DailyMealSchedule {
  date: string;
  fastingWindow: FastingWindow;
  meals: MealWithTiming[];
  totalNutrition: NutritionInfo;
  mealsInWindow: number;
  nextMealTime?: string;
}

export interface MealFilterOptions {
  mealType?: MealType;
  category?: MealCategory;
  dietaryTags?: string[];
  maxCalories?: number;
  minProtein?: number;
}

// ==================== CONSTANTS ====================

// Default meal times based on fasting window
const DEFAULT_MEAL_TIMES: Record<FastingPlan, Record<MealType, string>> = {
  '12:12': {
    breakfast: '08:00',
    lunch: '12:00',
    dinner: '18:00',
    snack: '15:00',
  },
  '14:10': {
    breakfast: '10:00',
    lunch: '13:00',
    dinner: '18:00',
    snack: '15:30',
  },
  '16:8': {
    breakfast: '12:00', // First meal at noon
    lunch: '15:00',
    dinner: '19:00',
    snack: '17:00',
  },
  '18:6': {
    breakfast: '14:00', // First meal at 2pm
    lunch: '16:00',
    dinner: '19:30',
    snack: '17:30',
  },
};

// Meal order for display
const MEAL_ORDER: Record<MealType, number> = {
  breakfast: 0,
  snack: 1, // Morning snack
  lunch: 2,
  dinner: 3,
};

// Category calorie ranges
const CATEGORY_CALORIE_RANGES: Record<MealCategory, { min: number; max: number }> = {
  light: { min: 300, max: 500 },
  standard: { min: 400, max: 700 },
  high_energy: { min: 500, max: 900 },
};

// ==================== MEAL SERVICE ====================

export const MealService = {
  /**
   * Get all meals with optional filtering
   */
  getMeals(filters?: MealFilterOptions): Meal[] {
    let result = [...meals];

    if (filters?.mealType) {
      result = result.filter((m) => m.type === filters.mealType);
    }

    if (filters?.dietaryTags?.length) {
      result = result.filter((m) =>
        filters.dietaryTags!.some((tag) => m.dietaryTags.includes(tag as DietaryTag))
      );
    }

    if (filters?.maxCalories) {
      result = result.filter((m) => m.nutrition.calories <= filters.maxCalories!);
    }

    if (filters?.minProtein) {
      result = result.filter((m) => m.nutrition.protein >= filters.minProtein!);
    }

    return result;
  },

  /**
   * Get meal by ID
   */
  getMealById(mealId: string): Meal | null {
    return meals.find((m) => m.id === mealId) ?? null;
  },

  /**
   * Get meals by type
   */
  getMealsByType(mealType: MealType): Meal[] {
    return meals.filter((m) => m.type === mealType);
  },

  /**
   * Get meal plan for a day with personalization
   */
  getMealPlanForDay(
    dayOfWeek: number,
    mealCategory: MealCategory
  ): MealPlan | null {
    return getMealPlanForIntensity(dayOfWeek, mealCategory);
  },

  /**
   * Calculate if a time is within the eating window
   */
  isWithinEatingWindow(
    time: string,
    fastingWindow: FastingWindow
  ): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    const timeMinutes = hours * 60 + minutes;

    const [startHours, startMinutes] = fastingWindow.eatingStartTime.split(':').map(Number);
    const startTimeMinutes = startHours * 60 + startMinutes;

    const [endHours, endMinutes] = fastingWindow.eatingEndTime.split(':').map(Number);
    const endTimeMinutes = endHours * 60 + endMinutes;

    return timeMinutes >= startTimeMinutes && timeMinutes < endTimeMinutes;
  },

  /**
   * Get scheduled meal time based on fasting plan
   */
  getScheduledMealTime(
    mealType: MealType,
    fastingPlan: FastingPlan
  ): string {
    return DEFAULT_MEAL_TIMES[fastingPlan][mealType];
  },

  /**
   * Create a daily meal schedule aligned with fasting window
   */
  createDailyMealSchedule(
    mealPlan: MealPlan,
    fastingPlan: FastingPlan,
    date: string
  ): DailyMealSchedule {
    const fastingWindow = getFastingWindow(fastingPlan);

    const mealsWithTiming: MealWithTiming[] = mealPlan.meals.map((meal, index) => {
      const scheduledTime = this.getScheduledMealTime(meal.type, fastingPlan);
      const isWithinWindow = this.isWithinEatingWindow(scheduledTime, fastingWindow);

      return {
        ...meal,
        scheduledTime,
        isWithinEatingWindow: isWithinWindow,
        orderInDay: MEAL_ORDER[meal.type],
      };
    });

    // Sort meals by scheduled time
    mealsWithTiming.sort((a, b) => {
      if (!a.scheduledTime || !b.scheduledTime) return 0;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });

    // Count meals within eating window
    const mealsInWindow = mealsWithTiming.filter((m) => m.isWithinEatingWindow).length;

    // Calculate next meal time
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const nextMeal = mealsWithTiming.find(
      (m) => m.scheduledTime && m.scheduledTime > currentTime && m.isWithinEatingWindow
    );

    return {
      date,
      fastingWindow,
      meals: mealsWithTiming,
      totalNutrition: mealPlan.totalNutrition,
      mealsInWindow,
      nextMealTime: nextMeal?.scheduledTime,
    };
  },

  /**
   * Get recommended meals based on user profile
   */
  getRecommendedMeals(
    mealType: MealType,
    category: MealCategory,
    count: number = 3
  ): Meal[] {
    const allMeals = this.getMealsByType(mealType);
    const calorieRange = CATEGORY_CALORIE_RANGES[category];

    // Filter by calorie range for the category
    const filtered = allMeals.filter(
      (m) =>
        m.nutrition.calories >= calorieRange.min &&
        m.nutrition.calories <= calorieRange.max
    );

    // Return requested count, or all if not enough
    return filtered.slice(0, count);
  },

  /**
   * Calculate nutrition summary for multiple meals
   */
  calculateTotalNutrition(mealsToSum: Meal[]): NutritionInfo {
    return mealsToSum.reduce(
      (acc, meal) => ({
        calories: acc.calories + meal.nutrition.calories,
        protein: acc.protein + meal.nutrition.protein,
        carbs: acc.carbs + meal.nutrition.carbs,
        fat: acc.fat + meal.nutrition.fat,
        fiber: (acc.fiber ?? 0) + (meal.nutrition.fiber ?? 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
    );
  },

  /**
   * Check if nutrition meets daily targets
   */
  checkNutritionTargets(
    nutrition: NutritionInfo,
    category: MealCategory
  ): {
    meetsCalories: boolean;
    meetsProtein: boolean;
    withinFatLimit: boolean;
  } {
    const targets: Record<MealCategory, { calories: number; protein: number; maxFat: number }> = {
      light: { calories: 1500, protein: 60, maxFat: 50 },
      standard: { calories: 2000, protein: 80, maxFat: 70 },
      high_energy: { calories: 2500, protein: 100, maxFat: 90 },
    };

    const target = targets[category];

    return {
      meetsCalories: nutrition.calories >= target.calories * 0.9,
      meetsProtein: nutrition.protein >= target.protein,
      withinFatLimit: nutrition.fat <= target.maxFat,
    };
  },
};

// ==================== FASTING SERVICE ====================

export const FastingService = {
  /**
   * Get fasting window details
   */
  getFastingWindow(plan: FastingPlan): FastingWindow {
    return getFastingWindow(plan);
  },

  /**
   * Calculate current fasting status
   */
  getCurrentFastingStatus(fastingWindow: FastingWindow): {
    isFasting: boolean;
    isEating: boolean;
    currentPhase: 'fasting' | 'eating';
    timeRemaining: { hours: number; minutes: number };
    percentComplete: number;
    nextPhaseTime: string;
  } {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeMinutes = currentHour * 60 + currentMinute;

    const [eatingStartHour, eatingStartMin] = fastingWindow.eatingStartTime.split(':').map(Number);
    const [eatingEndHour, eatingEndMin] = fastingWindow.eatingEndTime.split(':').map(Number);
    const eatingStartMinutes = eatingStartHour * 60 + eatingStartMin;
    const eatingEndMinutes = eatingEndHour * 60 + eatingEndMin;

    const isEating = currentTimeMinutes >= eatingStartMinutes && currentTimeMinutes < eatingEndMinutes;
    const isFasting = !isEating;

    let timeRemainingMinutes: number;
    let percentComplete: number;
    let nextPhaseTime: string;

    if (isEating) {
      // Calculate time until eating window ends
      timeRemainingMinutes = eatingEndMinutes - currentTimeMinutes;
      percentComplete = ((currentTimeMinutes - eatingStartMinutes) / (eatingEndMinutes - eatingStartMinutes)) * 100;
      nextPhaseTime = fastingWindow.eatingEndTime;
    } else {
      // Calculate time until eating window starts
      if (currentTimeMinutes < eatingStartMinutes) {
        timeRemainingMinutes = eatingStartMinutes - currentTimeMinutes;
      } else {
        // After eating window, calculate until next day's eating window
        timeRemainingMinutes = (24 * 60 - currentTimeMinutes) + eatingStartMinutes;
      }

      // Calculate fasting progress
      const fastingDurationMinutes = fastingWindow.fastingHours * 60;
      const fastingElapsed = currentTimeMinutes >= eatingEndMinutes
        ? currentTimeMinutes - eatingEndMinutes
        : (24 * 60 - eatingEndMinutes) + currentTimeMinutes;
      percentComplete = Math.min((fastingElapsed / fastingDurationMinutes) * 100, 100);
      nextPhaseTime = fastingWindow.eatingStartTime;
    }

    return {
      isFasting,
      isEating,
      currentPhase: isEating ? 'eating' : 'fasting',
      timeRemaining: {
        hours: Math.floor(timeRemainingMinutes / 60),
        minutes: timeRemainingMinutes % 60,
      },
      percentComplete: Math.round(percentComplete),
      nextPhaseTime,
    };
  },

  /**
   * Get recommended meal count for fasting plan
   */
  getRecommendedMealCount(fastingPlan: FastingPlan): number {
    const mealCounts: Record<FastingPlan, number> = {
      '12:12': 4, // 3 meals + 1 snack
      '14:10': 3, // 3 meals
      '16:8': 3, // 2-3 meals
      '18:6': 2, // 2 meals
    };
    return mealCounts[fastingPlan];
  },

  /**
   * Get eating window times formatted for display
   */
  getFormattedEatingWindow(fastingWindow: FastingWindow): string {
    return `${fastingWindow.eatingStartTime} - ${fastingWindow.eatingEndTime}`;
  },

  /**
   * Calculate if a meal fits within the eating window
   */
  canScheduleMealAt(
    time: string,
    fastingWindow: FastingWindow,
    mealDurationMinutes: number = 30
  ): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    const mealEndMinutes = hours * 60 + minutes + mealDurationMinutes;

    const [endHours, endMinutes] = fastingWindow.eatingEndTime.split(':').map(Number);
    const windowEndMinutes = endHours * 60 + endMinutes;

    return mealEndMinutes <= windowEndMinutes;
  },

  /**
   * Get all available fasting plans
   */
  getAvailableFastingPlans(): { plan: FastingPlan; label: string; description: string }[] {
    return [
      { plan: '12:12', label: '12:12', description: '12 hours fasting, 12 hours eating' },
      { plan: '14:10', label: '14:10', description: '14 hours fasting, 10 hours eating' },
      { plan: '16:8', label: '16:8', description: '16 hours fasting, 8 hours eating' },
      { plan: '18:6', label: '18:6', description: '18 hours fasting, 6 hours eating' },
    ];
  },
};

// ==================== MEAL PROGRESS SERVICE ====================

export const MealProgressService = {
  /**
   * Track meal completion (prepared for future implementation)
   */
  markMealComplete(
    userId: string,
    mealId: string,
    date: string
  ): void {
    console.log(`[MealProgressService] Marking meal ${mealId} as complete for user ${userId} on ${date}`);
  },

  /**
   * Get completed meals for a day
   */
  getCompletedMeals(userId: string, date: string): string[] {
    // Mock implementation - would read from database
    return [];
  },

  /**
   * Calculate daily meal completion progress
   */
  getDailyProgress(
    completedMealIds: string[],
    totalMeals: number
  ): number {
    if (totalMeals === 0) return 0;
    return Math.round((completedMealIds.length / totalMeals) * 100);
  },
};

export default {
  meals: MealService,
  fasting: FastingService,
  progress: MealProgressService,
};

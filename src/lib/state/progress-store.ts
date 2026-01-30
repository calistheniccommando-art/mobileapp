/**
 * PROGRESS TRACKING STORE
 *
 * Comprehensive state management for tracking user progress including:
 * - Daily exercise completion (sequential, cannot skip)
 * - Meal tracking with timestamps
 * - Fasting compliance
 * - Daily/weekly/monthly statistics
 * - Milestones and achievements
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Exercise, Meal, FastingPlan } from '@/types/fitness';

// ==================== TYPES ====================

export interface ExerciseProgress {
  exerciseId: string;
  exerciseName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  setsCompleted?: number;
  repsCompleted?: number;
}

export interface MealProgress {
  mealId: string;
  mealName: string;
  mealType: string;
  status: 'pending' | 'options_available' | 'selected' | 'eaten' | 'skipped';
  scheduledTime: string;
  eatenAt?: string;
  selectedAt?: string;
  availableOptions?: string[]; // IDs of 3 meal options
}

export interface FastingProgress {
  plan: FastingPlan;
  date: string;
  fastingStarted: boolean;
  fastingCompleted: boolean;
  eatingWindowUsed: boolean;
  compliancePercent: number;
}

export interface DailyProgress {
  date: string;
  dayNumber: number;
  exercises: ExerciseProgress[];
  meals: MealProgress[];
  fasting: FastingProgress | null;
  totalExercises: number;
  completedExercises: number;
  totalMeals: number;
  completedMeals: number;
  currentExerciseIndex: number;
  workoutStartedAt?: string;
  workoutCompletedAt?: string;
  isWorkoutComplete: boolean;
  dailyCompletionPercent: number;
}

export interface WeeklyStats {
  weekNumber: number;
  startDate: string;
  endDate: string;
  totalWorkoutDays: number;
  completedWorkoutDays: number;
  totalExercises: number;
  completedExercises: number;
  totalMeals: number;
  completedMeals: number;
  fastingCompliancePercent: number;
  overallCompletionPercent: number;
}

export interface MonthlyStats {
  month: number;
  year: number;
  totalWorkoutDays: number;
  completedWorkoutDays: number;
  totalExercises: number;
  completedExercises: number;
  streakDays: number;
  longestStreak: number;
  overallCompletionPercent: number;
}

export interface Milestone {
  id: string;
  type: 'day_complete' | 'week_complete' | 'streak' | 'first_workout' | 'exercise_count' | 'meal_streak';
  title: string;
  description: string;
  achievedAt: string;
  dayNumber?: number;
  value?: number;
}

export interface ProgressState {
  // Current day tracking
  currentDayNumber: number;
  currentDate: string;
  todayProgress: DailyProgress | null;

  // Historical data
  dailyHistory: Record<string, DailyProgress>;
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];

  // Milestones & achievements
  milestones: Milestone[];
  pendingMilestone: Milestone | null;

  // Active exercise session
  activeExerciseId: string | null;
  exerciseTimerStarted: number | null;
  restTimerEndTime: number | null;

  // Actions - Day Management
  initializeDay: (dayNumber: number, exercises: Exercise[], meals: Meal[], fastingPlan: FastingPlan | null) => void;
  getDayProgress: (date: string) => DailyProgress | null;

  // Actions - Exercise Tracking
  startExercise: (exerciseId: string) => void;
  completeExercise: (exerciseId: string, setsCompleted?: number, repsCompleted?: number) => void;
  getCurrentExercise: () => ExerciseProgress | null;
  getNextExercise: () => ExerciseProgress | null;
  canStartExercise: (exerciseId: string) => boolean;
  startRestTimer: (durationSeconds: number) => void;
  clearRestTimer: () => void;

  // Actions - Meal Tracking
  showMealOptions: (mealId: string, optionIds: string[]) => void;
  selectMeal: (mealId: string, selectedMealId: string) => void;
  markMealEaten: (mealId: string) => void;
  getNextMeal: () => MealProgress | null;
  getMealOptions: (mealId: string) => string[] | null;

  // Actions - Fasting Tracking
  updateFastingCompliance: (compliancePercent: number) => void;

  // Actions - Statistics
  calculateWeeklyStats: () => WeeklyStats;
  calculateMonthlyStats: () => MonthlyStats;
  getDailyCompletionPercent: () => number;

  // Actions - Milestones
  checkAndAwardMilestones: () => void;
  dismissMilestone: () => void;

  // Reset
  resetProgress: () => void;
}

// ==================== HELPERS ====================

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - startOfYear.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

function createEmptyDailyProgress(
  date: string,
  dayNumber: number,
  exercises: Exercise[],
  meals: Meal[],
  fastingPlan: FastingPlan | null
): DailyProgress {
  return {
    date,
    dayNumber,
    exercises: exercises.map((ex) => ({
      exerciseId: ex.id,
      exerciseName: ex.name,
      status: 'pending',
    })),
    meals: meals.map((meal) => ({
      mealId: meal.id,
      mealName: meal.name,
      mealType: meal.type,
      status: 'pending',
      scheduledTime: '', // Will be set by meal plan
    })),
    fasting: fastingPlan
      ? {
          plan: fastingPlan,
          date,
          fastingStarted: false,
          fastingCompleted: false,
          eatingWindowUsed: false,
          compliancePercent: 0,
        }
      : null,
    totalExercises: exercises.length,
    completedExercises: 0,
    totalMeals: meals.length,
    completedMeals: 0,
    currentExerciseIndex: 0,
    isWorkoutComplete: false,
    dailyCompletionPercent: 0,
  };
}

// ==================== MILESTONE DEFINITIONS ====================

const MILESTONE_DEFINITIONS = {
  first_workout: {
    check: (state: ProgressState) => state.todayProgress?.completedExercises === 1 && Object.keys(state.dailyHistory).length === 0,
    title: 'First Blood!',
    description: 'You completed your first exercise. The journey has begun!',
  },
  day_3_complete: {
    check: (state: ProgressState) => state.currentDayNumber >= 3 && Object.values(state.dailyHistory).filter((d) => d.isWorkoutComplete).length >= 3,
    title: '3 Days Strong!',
    description: "You've completed 3 full days. You're building momentum!",
  },
  day_7_complete: {
    check: (state: ProgressState) => state.currentDayNumber >= 7 && Object.values(state.dailyHistory).filter((d) => d.isWorkoutComplete).length >= 7,
    title: 'Week Warrior!',
    description: "A full week completed! You're unstoppable!",
  },
  day_14_complete: {
    check: (state: ProgressState) => state.currentDayNumber >= 14 && Object.values(state.dailyHistory).filter((d) => d.isWorkoutComplete).length >= 14,
    title: 'Two Week Champion!',
    description: "14 days of dedication. Habits are forming!",
  },
  day_30_complete: {
    check: (state: ProgressState) => state.currentDayNumber >= 30 && Object.values(state.dailyHistory).filter((d) => d.isWorkoutComplete).length >= 30,
    title: 'Monthly Master!',
    description: "30 days complete! You've built a true habit!",
  },
  exercise_50: {
    check: (state: ProgressState) => {
      const total = Object.values(state.dailyHistory).reduce((acc, d) => acc + d.completedExercises, 0);
      return total >= 50;
    },
    title: '50 Exercises!',
    description: "You've crushed 50 exercises. Keep going!",
  },
  exercise_100: {
    check: (state: ProgressState) => {
      const total = Object.values(state.dailyHistory).reduce((acc, d) => acc + d.completedExercises, 0);
      return total >= 100;
    },
    title: 'Century Club!',
    description: "100 exercises completed. You're a machine!",
  },
};

// ==================== STORE ====================

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      currentDayNumber: 1,
      currentDate: getDateString(),
      todayProgress: null,
      dailyHistory: {},
      weeklyStats: [],
      monthlyStats: [],
      milestones: [],
      pendingMilestone: null,
      activeExerciseId: null,
      exerciseTimerStarted: null,
      restTimerEndTime: null,

      initializeDay: (dayNumber, exercises, meals, fastingPlan) => {
        const today = getDateString();
        const existingProgress = get().dailyHistory[today];

        if (existingProgress) {
          // Day already initialized, just update current
          set({
            currentDayNumber: dayNumber,
            currentDate: today,
            todayProgress: existingProgress,
          });
          return;
        }

        const newProgress = createEmptyDailyProgress(today, dayNumber, exercises, meals, fastingPlan);

        set({
          currentDayNumber: dayNumber,
          currentDate: today,
          todayProgress: newProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [today]: newProgress,
          },
        });
      },

      getDayProgress: (date) => {
        return get().dailyHistory[date] ?? null;
      },

      startExercise: (exerciseId) => {
        const { todayProgress, canStartExercise } = get();
        if (!todayProgress || !canStartExercise(exerciseId)) return;

        const updatedExercises = todayProgress.exercises.map((ex) =>
          ex.exerciseId === exerciseId
            ? { ...ex, status: 'in_progress' as const, startedAt: new Date().toISOString() }
            : ex
        );

        const updatedProgress: DailyProgress = {
          ...todayProgress,
          exercises: updatedExercises,
          workoutStartedAt: todayProgress.workoutStartedAt ?? new Date().toISOString(),
        };

        set({
          todayProgress: updatedProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [todayProgress.date]: updatedProgress,
          },
          activeExerciseId: exerciseId,
          exerciseTimerStarted: Date.now(),
        });
      },

      completeExercise: (exerciseId, setsCompleted, repsCompleted) => {
        const { todayProgress } = get();
        if (!todayProgress) return;

        const exerciseIndex = todayProgress.exercises.findIndex((ex) => ex.exerciseId === exerciseId);
        if (exerciseIndex === -1) return;

        const now = new Date().toISOString();
        const exercise = todayProgress.exercises[exerciseIndex];
        const durationSeconds = exercise.startedAt
          ? Math.floor((Date.now() - new Date(exercise.startedAt).getTime()) / 1000)
          : 0;

        const updatedExercises = todayProgress.exercises.map((ex, idx) =>
          idx === exerciseIndex
            ? {
                ...ex,
                status: 'completed' as const,
                completedAt: now,
                durationSeconds,
                setsCompleted,
                repsCompleted,
              }
            : ex
        );

        const completedCount = updatedExercises.filter((ex) => ex.status === 'completed').length;
        const isWorkoutComplete = completedCount === todayProgress.totalExercises;
        const nextIndex = exerciseIndex + 1;

        // Calculate daily completion
        const exercisePercent = todayProgress.totalExercises > 0
          ? (completedCount / todayProgress.totalExercises) * 100
          : 0;
        const mealPercent = todayProgress.totalMeals > 0
          ? (todayProgress.completedMeals / todayProgress.totalMeals) * 100
          : 0;
        const dailyCompletionPercent = Math.round((exercisePercent * 0.6 + mealPercent * 0.4));

        const updatedProgress: DailyProgress = {
          ...todayProgress,
          exercises: updatedExercises,
          completedExercises: completedCount,
          currentExerciseIndex: nextIndex,
          isWorkoutComplete,
          workoutCompletedAt: isWorkoutComplete ? now : undefined,
          dailyCompletionPercent,
        };

        set({
          todayProgress: updatedProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [todayProgress.date]: updatedProgress,
          },
          activeExerciseId: null,
          exerciseTimerStarted: null,
        });

        // Check for milestones
        setTimeout(() => get().checkAndAwardMilestones(), 100);
      },

      getCurrentExercise: () => {
        const { todayProgress } = get();
        if (!todayProgress) return null;

        return todayProgress.exercises.find((ex) => ex.status === 'in_progress') ?? null;
      },

      getNextExercise: () => {
        const { todayProgress } = get();
        if (!todayProgress) return null;

        const currentIdx = todayProgress.currentExerciseIndex;
        if (currentIdx >= todayProgress.exercises.length) return null;

        return todayProgress.exercises[currentIdx];
      },

      canStartExercise: (exerciseId) => {
        const { todayProgress, activeExerciseId } = get();
        if (!todayProgress || activeExerciseId) return false;

        const exerciseIndex = todayProgress.exercises.findIndex((ex) => ex.exerciseId === exerciseId);
        if (exerciseIndex === -1) return false;

        // Can only start the current exercise (sequential enforcement)
        return exerciseIndex === todayProgress.currentExerciseIndex;
      },

      startRestTimer: (durationSeconds) => {
        set({
          restTimerEndTime: Date.now() + durationSeconds * 1000,
        });
      },

      clearRestTimer: () => {
        set({ restTimerEndTime: null });
      },

      markMealEaten: (mealId) => {
        const { todayProgress } = get();
        if (!todayProgress) return;

        const updatedMeals = todayProgress.meals.map((meal) =>
          meal.mealId === mealId
            ? { ...meal, status: 'eaten' as const, eatenAt: new Date().toISOString() }
            : meal
        );

        const completedCount = updatedMeals.filter((m) => m.status === 'eaten').length;

        // Recalculate daily completion
        const exercisePercent = todayProgress.totalExercises > 0
          ? (todayProgress.completedExercises / todayProgress.totalExercises) * 100
          : 0;
        const mealPercent = todayProgress.totalMeals > 0
          ? (completedCount / todayProgress.totalMeals) * 100
          : 0;
        const dailyCompletionPercent = Math.round((exercisePercent * 0.6 + mealPercent * 0.4));

        const updatedProgress: DailyProgress = {
          ...todayProgress,
          meals: updatedMeals,
          completedMeals: completedCount,
          dailyCompletionPercent,
        };

        set({
          todayProgress: updatedProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [todayProgress.date]: updatedProgress,
          },
        });
      },

      getNextMeal: () => {
        const { todayProgress } = get();
        if (!todayProgress) return null;

        return todayProgress.meals.find((m) => m.status === 'pending' || m.status === 'options_available' || m.status === 'selected') ?? null;
      },

      showMealOptions: (mealId, optionIds) => {
        const { todayProgress } = get();
        if (!todayProgress) return;

        const updatedMeals = todayProgress.meals.map((meal) =>
          meal.mealId === mealId
            ? { ...meal, status: 'options_available' as const, availableOptions: optionIds }
            : meal
        );

        const updatedProgress: DailyProgress = {
          ...todayProgress,
          meals: updatedMeals,
        };

        set({
          todayProgress: updatedProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [todayProgress.date]: updatedProgress,
          },
        });
      },

      selectMeal: (mealId, selectedMealId) => {
        const { todayProgress } = get();
        if (!todayProgress) return;

        const updatedMeals = todayProgress.meals.map((meal) =>
          meal.mealId === mealId
            ? {
                ...meal,
                mealId: selectedMealId, // Replace with selected meal
                status: 'selected' as const,
                selectedAt: new Date().toISOString(),
                availableOptions: undefined, // Clear options
              }
            : meal
        );

        const updatedProgress: DailyProgress = {
          ...todayProgress,
          meals: updatedMeals,
        };

        set({
          todayProgress: updatedProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [todayProgress.date]: updatedProgress,
          },
        });
      },

      getMealOptions: (mealId) => {
        const { todayProgress } = get();
        if (!todayProgress) return null;

        const meal = todayProgress.meals.find((m) => m.mealId === mealId);
        return meal?.availableOptions ?? null;
      },

      updateFastingCompliance: (compliancePercent) => {
        const { todayProgress } = get();
        if (!todayProgress?.fasting) return;

        const updatedProgress: DailyProgress = {
          ...todayProgress,
          fasting: {
            ...todayProgress.fasting,
            compliancePercent,
          },
        };

        set({
          todayProgress: updatedProgress,
          dailyHistory: {
            ...get().dailyHistory,
            [todayProgress.date]: updatedProgress,
          },
        });
      },

      calculateWeeklyStats: () => {
        const { dailyHistory, todayProgress } = get();
        const now = new Date();
        const weekNumber = getWeekNumber(now);

        // Get start of week (Monday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay() + 1);

        const weekDays: DailyProgress[] = [];
        for (let i = 0; i < 7; i++) {
          const day = new Date(startOfWeek);
          day.setDate(startOfWeek.getDate() + i);
          const dateStr = getDateString(day);
          const progress = dailyHistory[dateStr] ?? todayProgress;
          if (progress && progress.date === dateStr) {
            weekDays.push(progress);
          }
        }

        const totalExercises = weekDays.reduce((acc, d) => acc + d.totalExercises, 0);
        const completedExercises = weekDays.reduce((acc, d) => acc + d.completedExercises, 0);
        const totalMeals = weekDays.reduce((acc, d) => acc + d.totalMeals, 0);
        const completedMeals = weekDays.reduce((acc, d) => acc + d.completedMeals, 0);
        const completedWorkoutDays = weekDays.filter((d) => d.isWorkoutComplete).length;
        const fastingDays = weekDays.filter((d) => d.fasting);
        const fastingCompliance = fastingDays.length > 0
          ? Math.round(fastingDays.reduce((acc, d) => acc + (d.fasting?.compliancePercent ?? 0), 0) / fastingDays.length)
          : 0;

        return {
          weekNumber,
          startDate: getDateString(startOfWeek),
          endDate: getDateString(new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000)),
          totalWorkoutDays: weekDays.length,
          completedWorkoutDays,
          totalExercises,
          completedExercises,
          totalMeals,
          completedMeals,
          fastingCompliancePercent: fastingCompliance,
          overallCompletionPercent: weekDays.length > 0
            ? Math.round(weekDays.reduce((acc, d) => acc + d.dailyCompletionPercent, 0) / weekDays.length)
            : 0,
        };
      },

      calculateMonthlyStats: () => {
        const { dailyHistory, todayProgress } = get();
        const now = new Date();
        const month = now.getMonth();
        const year = now.getFullYear();

        const monthDays = Object.values(dailyHistory).filter((d) => {
          const date = new Date(d.date);
          return date.getMonth() === month && date.getFullYear() === year;
        });

        if (todayProgress && !monthDays.find((d) => d.date === todayProgress.date)) {
          monthDays.push(todayProgress);
        }

        // Calculate streak
        let streakDays = 0;
        let longestStreak = 0;
        let currentStreak = 0;

        const sortedDays = [...monthDays].sort((a, b) => a.date.localeCompare(b.date));
        for (const day of sortedDays) {
          if (day.isWorkoutComplete) {
            currentStreak++;
            longestStreak = Math.max(longestStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        }
        streakDays = currentStreak;

        return {
          month,
          year,
          totalWorkoutDays: monthDays.length,
          completedWorkoutDays: monthDays.filter((d) => d.isWorkoutComplete).length,
          totalExercises: monthDays.reduce((acc, d) => acc + d.totalExercises, 0),
          completedExercises: monthDays.reduce((acc, d) => acc + d.completedExercises, 0),
          streakDays,
          longestStreak,
          overallCompletionPercent: monthDays.length > 0
            ? Math.round(monthDays.reduce((acc, d) => acc + d.dailyCompletionPercent, 0) / monthDays.length)
            : 0,
        };
      },

      getDailyCompletionPercent: () => {
        return get().todayProgress?.dailyCompletionPercent ?? 0;
      },

      checkAndAwardMilestones: () => {
        const state = get();
        const achievedMilestoneIds = state.milestones.map((m) => m.id);

        for (const [id, def] of Object.entries(MILESTONE_DEFINITIONS)) {
          if (!achievedMilestoneIds.includes(id) && def.check(state)) {
            const milestone: Milestone = {
              id,
              type: id.includes('exercise') ? 'exercise_count' : id.includes('week') ? 'week_complete' : 'day_complete',
              title: def.title,
              description: def.description,
              achievedAt: new Date().toISOString(),
              dayNumber: state.currentDayNumber,
            };

            set({
              milestones: [...state.milestones, milestone],
              pendingMilestone: milestone,
            });
            break; // Only one milestone at a time
          }
        }
      },

      dismissMilestone: () => {
        set({ pendingMilestone: null });
      },

      resetProgress: () => {
        set({
          currentDayNumber: 1,
          currentDate: getDateString(),
          todayProgress: null,
          dailyHistory: {},
          weeklyStats: [],
          monthlyStats: [],
          milestones: [],
          pendingMilestone: null,
          activeExerciseId: null,
          exerciseTimerStarted: null,
          restTimerEndTime: null,
        });
      },
    }),
    {
      name: 'progress-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentDayNumber: state.currentDayNumber,
        dailyHistory: state.dailyHistory,
        milestones: state.milestones,
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useTodayProgress = () => useProgressStore((s) => s.todayProgress);
export const useCurrentDayNumber = () => useProgressStore((s) => s.currentDayNumber);
export const useDailyCompletionPercent = () => useProgressStore((s) => s.getDailyCompletionPercent());
export const useActiveExerciseId = () => useProgressStore((s) => s.activeExerciseId);
export const useRestTimerEndTime = () => useProgressStore((s) => s.restTimerEndTime);
export const usePendingMilestone = () => useProgressStore((s) => s.pendingMilestone);
export const useMilestones = () => useProgressStore((s) => s.milestones);

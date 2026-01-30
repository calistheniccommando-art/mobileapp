import { create } from 'zustand';
import {
  getDailyPlan,
  getWorkoutById,
  getMealById,
  getPersonalizedDailyPlan,
} from '@/data/mock-data';
import { useUserStore } from './user-store';
import type { DailyPlan, WorkoutPlan, Meal, DifficultyLevel, MealIntensity, FastingPlan } from '@/types/fitness';

interface AppState {
  // Current date/day management
  selectedDate: Date;
  currentDailyPlan: DailyPlan | null;

  // Actions
  setSelectedDate: (date: Date) => void;
  refreshDailyPlan: () => void;
  refreshPersonalizedDailyPlan: (
    difficulty: DifficultyLevel,
    mealIntensity: MealIntensity,
    fastingPlan: FastingPlan
  ) => void;

  // Workout tracking for current session
  activeWorkoutId: string | null;
  completedExerciseIds: string[];
  setActiveWorkout: (id: string | null) => void;
  toggleExerciseComplete: (exerciseId: string) => void;
  resetWorkoutSession: () => void;

  // Helper getters
  getWorkout: (id: string) => WorkoutPlan | undefined;
  getMeal: (id: string) => Meal | undefined;
}

export const useAppStore = create<AppState>()((set, get) => ({
  selectedDate: new Date(),
  currentDailyPlan: getDailyPlan(new Date()),
  activeWorkoutId: null,
  completedExerciseIds: [],

  setSelectedDate: (date) => {
    // Get user profile for personalization
    const profile = useUserStore.getState().profile;
    if (profile?.onboardingCompleted) {
      set({
        selectedDate: date,
        currentDailyPlan: getPersonalizedDailyPlan(
          date,
          profile.workoutDifficulty,
          profile.mealIntensity,
          profile.fastingPlan
        ),
      });
    } else {
      set({
        selectedDate: date,
        currentDailyPlan: getDailyPlan(date),
      });
    }
  },

  refreshDailyPlan: () => {
    const date = get().selectedDate;
    // Get user profile for personalization
    const profile = useUserStore.getState().profile;
    if (profile?.onboardingCompleted) {
      set({
        currentDailyPlan: getPersonalizedDailyPlan(
          date,
          profile.workoutDifficulty,
          profile.mealIntensity,
          profile.fastingPlan
        ),
      });
    } else {
      set({
        currentDailyPlan: getDailyPlan(date),
      });
    }
  },

  refreshPersonalizedDailyPlan: (difficulty, mealIntensity, fastingPlan) => {
    const date = get().selectedDate;
    set({
      currentDailyPlan: getPersonalizedDailyPlan(date, difficulty, mealIntensity, fastingPlan),
    });
  },

  setActiveWorkout: (id) => {
    set({ activeWorkoutId: id });
  },

  toggleExerciseComplete: (exerciseId) => {
    set((state) => {
      const isCompleted = state.completedExerciseIds.includes(exerciseId);
      return {
        completedExerciseIds: isCompleted
          ? state.completedExerciseIds.filter((id) => id !== exerciseId)
          : [...state.completedExerciseIds, exerciseId],
      };
    });
  },

  resetWorkoutSession: () => {
    set({
      activeWorkoutId: null,
      completedExerciseIds: [],
    });
  },

  getWorkout: (id) => getWorkoutById(id),
  getMeal: (id) => getMealById(id),
}));

// Selectors
export const useSelectedDate = () => useAppStore((s) => s.selectedDate);
export const useDailyPlan = () => useAppStore((s) => s.currentDailyPlan);
export const useActiveWorkout = () => useAppStore((s) => s.activeWorkoutId);
export const useCompletedExercises = () => useAppStore((s) => s.completedExerciseIds);

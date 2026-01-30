/**
 * MEAL SELECTION STORE
 *
 * Manages user's meal selections and eaten status
 * Shared across Home and Meals tabs
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface MealSelection {
  date: string; // YYYY-MM-DD format
  lightMealId: string | null; // Selected meal ID for light meal
  mainMealId: string | null; // Selected meal ID for main meal
  lightMealEaten: boolean;
  mainMealEaten: boolean;
}

interface MealSelectionState {
  selections: Record<string, MealSelection>; // Keyed by date

  // Actions
  selectLightMeal: (date: string, mealId: string) => void;
  selectMainMeal: (date: string, mealId: string) => void;
  markLightMealEaten: (date: string) => void;
  markMainMealEaten: (date: string) => void;
  unmarkLightMealEaten: (date: string) => void;
  unmarkMainMealEaten: (date: string) => void;
  getTodaySelection: () => MealSelection | null;
  getSelectionForDate: (date: string) => MealSelection | null;
  resetAllSelections: () => void;
}

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useMealSelectionStore = create<MealSelectionState>()(
  persist(
    (set, get) => ({
      selections: {},

      selectLightMeal: (date, mealId) => {
        set((state) => ({
          selections: {
            ...state.selections,
            [date]: {
              ...(state.selections[date] || {
                date,
                lightMealId: null,
                mainMealId: null,
                lightMealEaten: false,
                mainMealEaten: false,
              }),
              lightMealId: mealId,
            },
          },
        }));
      },

      selectMainMeal: (date, mealId) => {
        set((state) => ({
          selections: {
            ...state.selections,
            [date]: {
              ...(state.selections[date] || {
                date,
                lightMealId: null,
                mainMealId: null,
                lightMealEaten: false,
                mainMealEaten: false,
              }),
              mainMealId: mealId,
            },
          },
        }));
      },

      markLightMealEaten: (date) => {
        set((state) => ({
          selections: {
            ...state.selections,
            [date]: {
              ...(state.selections[date] || {
                date,
                lightMealId: null,
                mainMealId: null,
                lightMealEaten: false,
                mainMealEaten: false,
              }),
              lightMealEaten: true,
            },
          },
        }));
      },

      markMainMealEaten: (date) => {
        set((state) => ({
          selections: {
            ...state.selections,
            [date]: {
              ...(state.selections[date] || {
                date,
                lightMealId: null,
                mainMealId: null,
                lightMealEaten: false,
                mainMealEaten: false,
              }),
              mainMealEaten: true,
            },
          },
        }));
      },

      unmarkLightMealEaten: (date) => {
        set((state) => ({
          selections: {
            ...state.selections,
            [date]: {
              ...(state.selections[date] || {
                date,
                lightMealId: null,
                mainMealId: null,
                lightMealEaten: false,
                mainMealEaten: false,
              }),
              lightMealEaten: false,
            },
          },
        }));
      },

      unmarkMainMealEaten: (date) => {
        set((state) => ({
          selections: {
            ...state.selections,
            [date]: {
              ...(state.selections[date] || {
                date,
                lightMealId: null,
                mainMealId: null,
                lightMealEaten: false,
                mainMealEaten: false,
              }),
              mainMealEaten: false,
            },
          },
        }));
      },

      getTodaySelection: () => {
        const today = getTodayDate();
        return get().selections[today] || null;
      },

      getSelectionForDate: (date) => {
        return get().selections[date] || null;
      },

      resetAllSelections: () => {
        set({ selections: {} });
      },
    }),
    {
      name: 'meal-selection-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors - use primitives for proper reactivity
const getTodayDateKey = () => new Date().toISOString().split('T')[0];

export const useTodayLightMealId = () =>
  useMealSelectionStore((s) => s.selections[getTodayDateKey()]?.lightMealId ?? null);
export const useTodayMainMealId = () =>
  useMealSelectionStore((s) => s.selections[getTodayDateKey()]?.mainMealId ?? null);
export const useTodayLightMealEaten = () =>
  useMealSelectionStore((s) => s.selections[getTodayDateKey()]?.lightMealEaten ?? false);
export const useTodayMainMealEaten = () =>
  useMealSelectionStore((s) => s.selections[getTodayDateKey()]?.mainMealEaten ?? false);

export const useSelectLightMeal = () => useMealSelectionStore((s) => s.selectLightMeal);
export const useSelectMainMeal = () => useMealSelectionStore((s) => s.selectMainMeal);
export const useMarkLightMealEaten = () =>
  useMealSelectionStore((s) => s.markLightMealEaten);
export const useMarkMainMealEaten = () =>
  useMealSelectionStore((s) => s.markMainMealEaten);
export const useUnmarkLightMealEaten = () =>
  useMealSelectionStore((s) => s.unmarkLightMealEaten);
export const useUnmarkMainMealEaten = () =>
  useMealSelectionStore((s) => s.unmarkMainMealEaten);

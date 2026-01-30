/**
 * FASTING STATE STORE
 *
 * Comprehensive fasting state management with:
 * - Multiple fasting types (12:12, 14:10, 16:8, 18:6, 20:4, 24:0)
 * - Daily fasting cycle tracking with timestamps
 * - Persistent countdown timers that survive app reload
 * - Automatic daily reset logic
 * - Edge case handling (timezone changes, missed windows, etc.)
 * - Admin-ready extensible structure
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FastingPlan } from '@/types/fitness';

// ==================== TYPES ====================

export interface FastingType {
  plan: FastingPlan | '20:4' | '24:0';
  fastingHours: number;
  eatingHours: number;
  label: string;
  description: string;
}

export interface FastingWindow {
  fastingStartTime: string; // HH:mm format
  fastingEndTime: string;
  eatingStartTime: string;
  eatingEndTime: string;
}

export interface FastingCycle {
  date: string; // YYYY-MM-DD
  cycleStartedAt: string; // ISO timestamp
  fastingStartedAt?: string;
  fastingEndedAt?: string;
  eatingWindowStartedAt?: string;
  eatingWindowEndedAt?: string;
  completed: boolean;
  broken: boolean; // User broke fast early
  missedWindow: boolean; // User missed eating window entirely
}

export interface FastingStatus {
  currentPhase: 'fasting' | 'eating';
  isFasting: boolean;
  isEating: boolean;
  percentComplete: number;
  timeRemaining: {
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  };
  nextPhaseTime: string; // HH:mm
  nextPhaseDate: string; // YYYY-MM-DD (for overnight transitions)
}

export interface FastingState {
  // Current fasting configuration
  selectedPlan: FastingType['plan'];
  customWindow: FastingWindow | null; // For admin overrides

  // Current cycle tracking
  currentCycle: FastingCycle | null;
  cycleHistory: Record<string, FastingCycle>; // date -> cycle

  // Real-time status (computed, not persisted)
  lastStatusUpdate: string; // ISO timestamp

  // Daily reset tracking
  lastResetDate: string; // YYYY-MM-DD

  // Actions - Configuration
  setFastingPlan: (plan: FastingType['plan']) => void;
  setCustomWindow: (window: FastingWindow) => void;

  // Actions - Cycle Management
  initializeTodayCycle: () => void;
  startFasting: () => void;
  startEating: () => void;
  breakFast: () => void;
  completeCycle: () => void;

  // Actions - Status Queries
  getCurrentStatus: () => FastingStatus;
  getFastingWindow: () => FastingWindow;
  canChangePlan: () => boolean;

  // Actions - History
  getCycleForDate: (date: string) => FastingCycle | null;
  getWeeklyCompliance: () => number;
  getCurrentStreak: () => number;

  // Actions - Admin & Edge Cases
  forceResetCycle: () => void;
  handleMissedWindow: () => void;

  // Actions - Cleanup
  resetAllData: () => void;
}

// ==================== CONSTANTS ====================

export const FASTING_TYPES: Record<FastingType['plan'], FastingType> = {
  '12:12': {
    plan: '12:12',
    fastingHours: 12,
    eatingHours: 12,
    label: '12:12 Balanced',
    description: 'Fast for 12 hours, eat within 12 hours. Great for beginners.',
  },
  '14:10': {
    plan: '14:10',
    fastingHours: 14,
    eatingHours: 10,
    label: '14:10 Moderate',
    description: 'Fast for 14 hours with a 10-hour eating window.',
  },
  '16:8': {
    plan: '16:8',
    fastingHours: 16,
    eatingHours: 8,
    label: '16:8 Standard',
    description: 'The most popular protocol. Fast 16 hours, eat within 8.',
  },
  '18:6': {
    plan: '18:6',
    fastingHours: 18,
    eatingHours: 6,
    label: '18:6 Aggressive',
    description: 'Fast for 18 hours with a 6-hour eating window.',
  },
  '20:4': {
    plan: '20:4',
    fastingHours: 20,
    eatingHours: 4,
    label: '20:4 Warrior',
    description: 'Fast for 20 hours with a 4-hour eating window. Very challenging.',
  },
  '24:0': {
    plan: '24:0',
    fastingHours: 24,
    eatingHours: 0,
    label: '24:0 OMAD+',
    description: 'Complete 24-hour fast. Only for advanced users.',
  },
};

// Default eating window start time
const DEFAULT_EATING_START = '12:00'; // Noon

// ==================== HELPERS ====================

function getDateString(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  const { hours, minutes } = parseTime(timeStr);
  const totalMinutes = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMinutes = totalMinutes % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

function calculateFastingWindow(
  plan: FastingType['plan'],
  eatingStartTime: string = DEFAULT_EATING_START
): FastingWindow {
  const fastingType = FASTING_TYPES[plan];
  const eatingWindowMinutes = fastingType.eatingHours * 60;

  const eatingEndTime = addMinutesToTime(eatingStartTime, eatingWindowMinutes);
  const fastingStartTime = eatingEndTime;
  const fastingEndTime = eatingStartTime;

  return {
    fastingStartTime,
    fastingEndTime,
    eatingStartTime,
    eatingEndTime,
  };
}

function calculateCurrentStatus(window: FastingWindow): FastingStatus {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const currentSeconds = now.getSeconds();

  const eatStart = parseTime(window.eatingStartTime);
  const eatEnd = parseTime(window.eatingEndTime);
  const eatStartMinutes = eatStart.hours * 60 + eatStart.minutes;
  const eatEndMinutes = eatEnd.hours * 60 + eatEnd.minutes;

  let isInEatingWindow: boolean;
  let targetMinutes: number;
  let totalPhaseMinutes: number;
  let elapsedMinutes: number;
  let nextPhaseTime: string;
  let nextPhaseDate: string = getDateString(now);

  // Handle overnight eating windows
  if (eatEndMinutes < eatStartMinutes) {
    // Eating window crosses midnight
    isInEatingWindow = currentMinutes >= eatStartMinutes || currentMinutes < eatEndMinutes;
  } else {
    isInEatingWindow = currentMinutes >= eatStartMinutes && currentMinutes < eatEndMinutes;
  }

  if (isInEatingWindow) {
    // Currently in eating window
    if (currentMinutes >= eatStartMinutes) {
      targetMinutes = eatEndMinutes - currentMinutes;
      if (targetMinutes < 0) targetMinutes += 24 * 60; // Next day
      elapsedMinutes = currentMinutes - eatStartMinutes;
    } else {
      // After midnight, still in eating window
      targetMinutes = eatEndMinutes - currentMinutes;
      elapsedMinutes = 24 * 60 - eatStartMinutes + currentMinutes;
    }
    totalPhaseMinutes = eatEndMinutes >= eatStartMinutes
      ? eatEndMinutes - eatStartMinutes
      : 24 * 60 - eatStartMinutes + eatEndMinutes;
    nextPhaseTime = window.fastingStartTime;
    if (currentMinutes < eatEndMinutes && eatEndMinutes < eatStartMinutes) {
      nextPhaseDate = getDateString(now);
    } else if (currentMinutes >= eatStartMinutes && eatEndMinutes < eatStartMinutes) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextPhaseDate = getDateString(tomorrow);
    }
  } else {
    // Currently fasting
    if (currentMinutes < eatStartMinutes) {
      targetMinutes = eatStartMinutes - currentMinutes;
      elapsedMinutes = 24 * 60 - eatEndMinutes + currentMinutes;
      if (eatEndMinutes > eatStartMinutes) {
        elapsedMinutes = currentMinutes - eatEndMinutes + (eatEndMinutes < 0 ? 24 * 60 : 0);
        if (elapsedMinutes < 0) elapsedMinutes += 24 * 60;
      }
    } else {
      targetMinutes = 24 * 60 - currentMinutes + eatStartMinutes;
      elapsedMinutes = currentMinutes - eatEndMinutes;
      if (elapsedMinutes < 0) elapsedMinutes += 24 * 60;
    }
    totalPhaseMinutes = eatStartMinutes >= eatEndMinutes
      ? eatStartMinutes - eatEndMinutes
      : 24 * 60 - eatEndMinutes + eatStartMinutes;
    nextPhaseTime = window.eatingStartTime;
    if (currentMinutes >= eatEndMinutes && eatStartMinutes > eatEndMinutes) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextPhaseDate = getDateString(tomorrow);
    }
  }

  const targetTotalSeconds = targetMinutes * 60 - currentSeconds;
  const hours = Math.floor(targetTotalSeconds / 3600);
  const minutes = Math.floor((targetTotalSeconds % 3600) / 60);
  const seconds = targetTotalSeconds % 60;

  const percentComplete = Math.min(1, Math.max(0, elapsedMinutes / totalPhaseMinutes));

  return {
    currentPhase: isInEatingWindow ? 'eating' : 'fasting',
    isFasting: !isInEatingWindow,
    isEating: isInEatingWindow,
    percentComplete: Math.round(percentComplete * 100) / 100,
    timeRemaining: {
      hours: Math.max(0, hours),
      minutes: Math.max(0, minutes),
      seconds: Math.max(0, seconds),
      totalSeconds: Math.max(0, targetTotalSeconds),
    },
    nextPhaseTime,
    nextPhaseDate,
  };
}

function shouldResetDaily(lastResetDate: string): boolean {
  const today = getDateString();
  return today !== lastResetDate;
}

// ==================== STORE ====================

const initialState = {
  selectedPlan: '16:8' as FastingType['plan'],
  customWindow: null,
  currentCycle: null,
  cycleHistory: {},
  lastStatusUpdate: new Date().toISOString(),
  lastResetDate: getDateString(),
};

export const useFastingStore = create<FastingState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setFastingPlan: (plan) => {
        if (!get().canChangePlan()) {
          console.warn('[FastingStore] Cannot change plan mid-cycle');
          return;
        }
        set({ selectedPlan: plan, customWindow: null });
        get().initializeTodayCycle();
      },

      setCustomWindow: (window) => {
        if (!get().canChangePlan()) {
          console.warn('[FastingStore] Cannot change window mid-cycle');
          return;
        }
        set({ customWindow: window });
      },

      initializeTodayCycle: () => {
        const today = getDateString();
        const { currentCycle, cycleHistory, lastResetDate } = get();

        // Check if we need daily reset
        if (shouldResetDaily(lastResetDate)) {
          console.log('[FastingStore] Daily reset triggered');

          // Mark previous cycle as missed if incomplete
          if (currentCycle && !currentCycle.completed) {
            set({
              cycleHistory: {
                ...cycleHistory,
                [currentCycle.date]: {
                  ...currentCycle,
                  missedWindow: true,
                  completed: false,
                },
              },
            });
          }

          // Create new cycle
          const newCycle: FastingCycle = {
            date: today,
            cycleStartedAt: new Date().toISOString(),
            completed: false,
            broken: false,
            missedWindow: false,
          };

          set({
            currentCycle: newCycle,
            lastResetDate: today,
          });
        } else if (!currentCycle) {
          // Initialize today's cycle if it doesn't exist
          const newCycle: FastingCycle = {
            date: today,
            cycleStartedAt: new Date().toISOString(),
            completed: false,
            broken: false,
            missedWindow: false,
          };
          set({ currentCycle: newCycle });
        }
      },

      startFasting: () => {
        const { currentCycle } = get();
        if (!currentCycle) return;

        set({
          currentCycle: {
            ...currentCycle,
            fastingStartedAt: new Date().toISOString(),
          },
        });
      },

      startEating: () => {
        const { currentCycle } = get();
        if (!currentCycle) return;

        set({
          currentCycle: {
            ...currentCycle,
            eatingWindowStartedAt: new Date().toISOString(),
            fastingEndedAt: new Date().toISOString(),
          },
        });
      },

      breakFast: () => {
        const { currentCycle, cycleHistory } = get();
        if (!currentCycle) return;

        const updatedCycle = {
          ...currentCycle,
          broken: true,
          completed: false,
          fastingEndedAt: new Date().toISOString(),
        };

        set({
          currentCycle: updatedCycle,
          cycleHistory: {
            ...cycleHistory,
            [currentCycle.date]: updatedCycle,
          },
        });
      },

      completeCycle: () => {
        const { currentCycle, cycleHistory } = get();
        if (!currentCycle) return;

        const updatedCycle = {
          ...currentCycle,
          completed: true,
          eatingWindowEndedAt: new Date().toISOString(),
        };

        set({
          currentCycle: updatedCycle,
          cycleHistory: {
            ...cycleHistory,
            [currentCycle.date]: updatedCycle,
          },
        });
      },

      getCurrentStatus: () => {
        const window = get().getFastingWindow();
        const status = calculateCurrentStatus(window);
        set({ lastStatusUpdate: new Date().toISOString() });
        return status;
      },

      getFastingWindow: () => {
        const { selectedPlan, customWindow } = get();
        if (customWindow) return customWindow;
        return calculateFastingWindow(selectedPlan);
      },

      canChangePlan: () => {
        const { currentCycle } = get();
        if (!currentCycle) return true;
        if (currentCycle.completed) return true;
        if (currentCycle.broken) return true;

        // Cannot change if currently in active fasting/eating cycle
        if (currentCycle.fastingStartedAt && !currentCycle.completed) {
          return false;
        }

        return true;
      },

      getCycleForDate: (date) => {
        return get().cycleHistory[date] ?? null;
      },

      getWeeklyCompliance: () => {
        const { cycleHistory } = get();
        const today = new Date();
        let completedCount = 0;
        let totalDays = 0;

        for (let i = 0; i < 7; i++) {
          const day = new Date(today);
          day.setDate(today.getDate() - i);
          const dateStr = getDateString(day);
          const cycle = cycleHistory[dateStr];

          if (cycle) {
            totalDays++;
            if (cycle.completed && !cycle.broken) {
              completedCount++;
            }
          }
        }

        return totalDays > 0 ? Math.round((completedCount / totalDays) * 100) : 0;
      },

      getCurrentStreak: () => {
        const { cycleHistory } = get();
        const today = new Date();
        let streak = 0;

        for (let i = 0; i < 365; i++) {
          const day = new Date(today);
          day.setDate(today.getDate() - i);
          const dateStr = getDateString(day);
          const cycle = cycleHistory[dateStr];

          if (!cycle) break;
          if (cycle.completed && !cycle.broken) {
            streak++;
          } else {
            break;
          }
        }

        return streak;
      },

      forceResetCycle: () => {
        const today = getDateString();
        const newCycle: FastingCycle = {
          date: today,
          cycleStartedAt: new Date().toISOString(),
          completed: false,
          broken: false,
          missedWindow: false,
        };

        set({
          currentCycle: newCycle,
          lastResetDate: today,
        });
      },

      handleMissedWindow: () => {
        const { currentCycle, cycleHistory } = get();
        if (!currentCycle) return;

        const updatedCycle = {
          ...currentCycle,
          missedWindow: true,
          completed: false,
        };

        set({
          currentCycle: updatedCycle,
          cycleHistory: {
            ...cycleHistory,
            [currentCycle.date]: updatedCycle,
          },
        });

        // Auto-initialize tomorrow's cycle
        get().initializeTodayCycle();
      },

      resetAllData: () => {
        set({
          ...initialState,
          selectedPlan: get().selectedPlan, // Keep selected plan
        });
      },
    }),
    {
      name: 'fasting-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedPlan: state.selectedPlan,
        customWindow: state.customWindow,
        currentCycle: state.currentCycle,
        cycleHistory: state.cycleHistory,
        lastResetDate: state.lastResetDate,
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useSelectedFastingPlan = () => useFastingStore((s) => s.selectedPlan);
export const useCurrentFastingCycle = () => useFastingStore((s) => s.currentCycle);
export const useFastingWindow = () => useFastingStore((s) => s.getFastingWindow());
export const useCanChangeFastingPlan = () => useFastingStore((s) => s.canChangePlan());
export const useFastingStreak = () => useFastingStore((s) => s.getCurrentStreak());
export const useFastingCompliance = () => useFastingStore((s) => s.getWeeklyCompliance());

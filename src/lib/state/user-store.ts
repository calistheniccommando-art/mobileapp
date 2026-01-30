import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  UserProfile,
  WorkType,
  FastingPlan,
  FitnessGoal,
  WorkoutProgress,
  FastingProgress,
  OnboardingData,
  DifficultyLevel,
  MealIntensity,
  Gender,
  AuthProvider,
} from '@/types/fitness';
import {
  FASTING_PLAN_RULES,
  WORKOUT_DIFFICULTY_RULES,
  MEAL_INTENSITY_RULES,
  WEIGHT_THRESHOLDS,
} from '@/types/fitness';
import { getFastingWindow } from '@/data/mock-data';
import { userService, onboardingService, isSupabaseConfigured } from '@/lib/supabase';

// ==================== PERSONALIZATION HELPERS ====================

/**
 * Calculate personalization rules based on user data
 * This is the core rule-based assignment system
 */
export function calculatePersonalization(
  weight: number,
  workType: WorkType
): {
  fastingPlan: FastingPlan;
  workoutDifficulty: DifficultyLevel;
  mealIntensity: MealIntensity;
} {
  // Determine weight category relative to work type
  const threshold = WEIGHT_THRESHOLDS[workType];
  const weightCategory = weight >= threshold ? 'higher' : 'lower';

  // Apply rules
  const fastingPlan = FASTING_PLAN_RULES[workType][weightCategory];
  const workoutDifficulty = WORKOUT_DIFFICULTY_RULES[workType];
  const mealIntensity = MEAL_INTENSITY_RULES[workType];

  return { fastingPlan, workoutDifficulty, mealIntensity };
}

// ==================== STORE TYPES ====================

interface OnboardingState {
  currentStep: number;
  data: OnboardingData;
}

interface UserState {
  // Auth
  supabaseUserId: string | null;

  // Profile
  profile: UserProfile | null;

  // Onboarding state
  onboarding: OnboardingState;

  // Progress tracking
  workoutProgress: WorkoutProgress[];
  fastingProgress: FastingProgress[];

  // Sync state
  isSyncing: boolean;
  lastSyncedAt: string | null;

  // Auth actions
  setSupabaseUserId: (userId: string | null) => void;
  syncWithSupabase: (userId: string) => Promise<void>;

  // Onboarding actions
  setOnboardingStep: (step: number) => void;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboarding: () => void;

  // Profile actions
  setProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (data: OnboardingData) => void;
  updateWeight: (weight: number) => void;
  updateFastingPlan: (plan: FastingPlan) => void;

  // Progress actions
  addWorkoutProgress: (progress: Omit<WorkoutProgress, 'id'>) => void;
  addFastingProgress: (progress: Omit<FastingProgress, 'id'>) => void;

  // Computed
  getPersonalization: () => ReturnType<typeof calculatePersonalization> | null;
  getCurrentFastingWindow: () => ReturnType<typeof getFastingWindow> | null;

  // Reset
  resetProfile: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const initialOnboardingState: OnboardingState = {
  currentStep: 0,
  data: {},
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      supabaseUserId: null,
      profile: null,
      onboarding: initialOnboardingState,
      workoutProgress: [],
      fastingProgress: [],
      isSyncing: false,
      lastSyncedAt: null,

      // Auth actions
      setSupabaseUserId: (userId) => {
        set({ supabaseUserId: userId });
      },

      syncWithSupabase: async (userId) => {
        if (!isSupabaseConfigured()) return;
        
        set({ isSyncing: true });
        try {
          // Fetch user profile from Supabase
          const dbUser = await userService.getById(userId);
          if (dbUser) {
            const currentProfile = get().profile;
            // Merge Supabase data with local profile
            if (currentProfile) {
              set({
                profile: {
                  ...currentProfile,
                  id: dbUser.id,
                  email: dbUser.email,
                  firstName: dbUser.first_name || currentProfile.firstName,
                  lastName: dbUser.last_name || currentProfile.lastName,
                },
                supabaseUserId: userId,
                lastSyncedAt: new Date().toISOString(),
              });
            }
          }

          // Check onboarding status
          const onboardingData = await onboardingService.getByUserId(userId);
          if (onboardingData?.completed) {
            // User has completed onboarding in Supabase
            set((state) => ({
              profile: state.profile ? {
                ...state.profile,
                onboardingCompleted: true,
              } : null,
            }));
          }
        } catch (error) {
          console.error('Failed to sync with Supabase:', error);
        } finally {
          set({ isSyncing: false });
        }
      },

      // Onboarding actions
      setOnboardingStep: (step) => {
        set((state) => ({
          onboarding: { ...state.onboarding, currentStep: step },
        }));
      },

      updateOnboardingData: (data) => {
        set((state) => ({
          onboarding: {
            ...state.onboarding,
            data: { ...state.onboarding.data, ...data },
          },
        }));
      },

      resetOnboarding: () => {
        set({ onboarding: initialOnboardingState });
      },

      // Profile actions
      setProfile: (profileData) => {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              ...profileData,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      completeOnboarding: (data) => {
        const now = new Date().toISOString();

        // Validate required fields
        if (!data.email || !data.firstName || !data.lastName || !data.weight || !data.workType) {
          console.error('Missing required onboarding data');
          return;
        }

        // Calculate personalization based on rules
        const personalization = calculatePersonalization(data.weight, data.workType);

        set({
          profile: {
            id: generateId(),
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            weight: data.weight,
            height: data.height,
            workType: data.workType,
            fastingPlan: personalization.fastingPlan,
            workoutDifficulty: personalization.workoutDifficulty,
            mealIntensity: personalization.mealIntensity,
            fitnessGoal: data.fitnessGoal,
            termsAcceptedAt: now,
            privacyAcceptedAt: now,
            onboardingCompleted: true,
            onboardingStep: 7, // Complete
            createdAt: now,
            updatedAt: now,
          },
          onboarding: initialOnboardingState,
        });
      },

      updateWeight: (weight) => {
        const profile = get().profile;
        if (profile) {
          // Recalculate personalization when weight changes
          const personalization = calculatePersonalization(weight, profile.workType);
          set({
            profile: {
              ...profile,
              weight,
              fastingPlan: personalization.fastingPlan,
              workoutDifficulty: personalization.workoutDifficulty,
              mealIntensity: personalization.mealIntensity,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      updateFastingPlan: (plan) => {
        const profile = get().profile;
        if (profile) {
          set({
            profile: {
              ...profile,
              fastingPlan: plan,
              updatedAt: new Date().toISOString(),
            },
          });
        }
      },

      addWorkoutProgress: (progress) => {
        set((state) => ({
          workoutProgress: [...state.workoutProgress, { ...progress, id: generateId() }],
        }));
      },

      addFastingProgress: (progress) => {
        set((state) => ({
          fastingProgress: [...state.fastingProgress, { ...progress, id: generateId() }],
        }));
      },

      getPersonalization: () => {
        const profile = get().profile;
        if (!profile) return null;
        return calculatePersonalization(profile.weight, profile.workType);
      },

      getCurrentFastingWindow: () => {
        const profile = get().profile;
        if (!profile) return null;
        return getFastingWindow(profile.fastingPlan);
      },

      resetProfile: () => {
        set({
          supabaseUserId: null,
          profile: null,
          onboarding: initialOnboardingState,
          workoutProgress: [],
          fastingProgress: [],
          isSyncing: false,
          lastSyncedAt: null,
        });
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ==================== SELECTORS ====================
// Use these for optimized re-renders (only subscribe to what you need)

export const useProfile = () => useUserStore((s) => s.profile);
export const useSupabaseUserId = () => useUserStore((s) => s.supabaseUserId);
export const useIsSyncing = () => useUserStore((s) => s.isSyncing);
export const useOnboardingCompleted = () => useUserStore((s) => s.profile?.onboardingCompleted ?? false);
export const useFastingPlan = () => useUserStore((s) => s.profile?.fastingPlan ?? null);
export const useWorkType = () => useUserStore((s) => s.profile?.workType ?? null);
export const useWeight = () => useUserStore((s) => s.profile?.weight ?? null);
export const useWorkoutDifficulty = () => useUserStore((s) => s.profile?.workoutDifficulty ?? null);
export const useMealIntensity = () => useUserStore((s) => s.profile?.mealIntensity ?? null);
export const useOnboardingStep = () => useUserStore((s) => s.onboarding.currentStep);
export const useOnboardingData = () => useUserStore((s) => s.onboarding.data);

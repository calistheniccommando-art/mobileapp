/**
 * INTEGRATION HOOKS
 *
 * React Query hooks for data fetching and state management.
 * These hooks connect the mobile app to the backend API with caching and offline support.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type {
  DailyPlanResponse,
  WeeklyPlanResponse,
  UserProfileResponse,
  GeneratePDFResponse,
  ProgressSummaryResponse,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  LogWorkoutProgressRequest,
  LogMealProgressRequest,
  LogFastingProgressRequest,
  GeneratePDFRequest,
} from '@/lib/api/types';

// ==================== QUERY KEYS ====================

export const QUERY_KEYS = {
  // User
  userProfile: ['user', 'profile'] as const,

  // Plans
  dailyPlan: (date: string) => ['plans', 'daily', date] as const,
  weeklyPlan: (startDate: string) => ['plans', 'weekly', startDate] as const,

  // Content
  workout: (id: string) => ['content', 'workout', id] as const,
  exercise: (id: string) => ['content', 'exercise', id] as const,
  meal: (id: string) => ['content', 'meal', id] as const,
  fastingPlans: ['content', 'fasting-plans'] as const,

  // Progress
  progressSummary: (period: 'day' | 'week' | 'month') => ['progress', 'summary', period] as const,
} as const;

// ==================== USER HOOKS ====================

/**
 * Hook to fetch current user profile with personalization settings
 */
export function useUserProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.userProfile,
    queryFn: async () => {
      const response = await apiClient.getProfile();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch profile');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Hook to create user profile (used during onboarding)
 */
export function useCreateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateUserProfileRequest) => {
      const response = await apiClient.createProfile(request);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to create profile');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.userProfile, data);
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: UpdateUserProfileRequest) => {
      const response = await apiClient.updateProfile(request);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to update profile');
      }
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.userProfile, data);
      // Invalidate plans since personalization may have changed
      queryClient.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}

// ==================== DAILY PLAN HOOKS ====================

/**
 * Hook to fetch daily plan for a specific date
 */
export function useDailyPlanAPI(date: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.dailyPlan(date),
    queryFn: async () => {
      const response = await apiClient.getDailyPlan({
        date,
        includeWorkout: true,
        includeMeals: true,
        includeFasting: true,
      });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch daily plan');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch weekly plan
 */
export function useWeeklyPlanAPI(startDate: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.weeklyPlan(startDate),
    queryFn: async () => {
      const response = await apiClient.getWeeklyPlan({ startDate });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch weekly plan');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    enabled: options?.enabled ?? true,
  });
}

// ==================== PROGRESS HOOKS ====================

/**
 * Hook to log workout progress
 */
export function useLogWorkoutProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: LogWorkoutProgressRequest) => {
      const response = await apiClient.logWorkoutProgress(request);
      if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to log workout progress');
      }
    },
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['plans', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

/**
 * Hook to log meal progress
 */
export function useLogMealProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: LogMealProgressRequest) => {
      const response = await apiClient.logMealProgress(request);
      if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to log meal progress');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

/**
 * Hook to log fasting progress
 */
export function useLogFastingProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: LogFastingProgressRequest) => {
      const response = await apiClient.logFastingProgress(request);
      if (!response.success) {
        throw new Error(response.error?.message ?? 'Failed to log fasting progress');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans', 'daily'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });
}

/**
 * Hook to fetch progress summary
 */
export function useProgressSummary(period: 'day' | 'week' | 'month') {
  return useQuery({
    queryKey: QUERY_KEYS.progressSummary(period),
    queryFn: async () => {
      const response = await apiClient.getProgressSummary(period);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch progress summary');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ==================== PDF HOOKS ====================

/**
 * Hook to generate PDF
 */
export function useGeneratePDF() {
  return useMutation({
    mutationFn: async (request: GeneratePDFRequest) => {
      const response = await apiClient.generatePDF(request);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to generate PDF');
      }
      return response.data;
    },
  });
}

// ==================== CONTENT HOOKS ====================

/**
 * Hook to fetch workout by ID
 */
export function useWorkout(workoutId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.workout(workoutId),
    queryFn: async () => {
      const response = await apiClient.getWorkout(workoutId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch workout');
      }
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (content rarely changes)
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch exercise by ID
 */
export function useExercise(exerciseId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.exercise(exerciseId),
    queryFn: async () => {
      const response = await apiClient.getExercise(exerciseId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch exercise');
      }
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch meal by ID
 */
export function useMeal(mealId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: QUERY_KEYS.meal(mealId),
    queryFn: async () => {
      const response = await apiClient.getMeal(mealId);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch meal');
      }
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    enabled: options?.enabled ?? true,
  });
}

/**
 * Hook to fetch all fasting plans
 */
export function useFastingPlans() {
  return useQuery({
    queryKey: QUERY_KEYS.fastingPlans,
    queryFn: async () => {
      const response = await apiClient.getFastingPlans();
      if (!response.success || !response.data) {
        throw new Error(response.error?.message ?? 'Failed to fetch fasting plans');
      }
      return response.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

// ==================== PREFETCH UTILITIES ====================

/**
 * Prefetch daily plan for a specific date
 */
export async function prefetchDailyPlan(queryClient: ReturnType<typeof useQueryClient>, date: string) {
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.dailyPlan(date),
    queryFn: async () => {
      const response = await apiClient.getDailyPlan({
        date,
        includeWorkout: true,
        includeMeals: true,
        includeFasting: true,
      });
      if (!response.success || !response.data) {
        throw new Error('Failed to prefetch daily plan');
      }
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Prefetch content for offline access
 */
export async function prefetchContentForOffline(
  queryClient: ReturnType<typeof useQueryClient>,
  workoutIds: string[],
  mealIds: string[]
) {
  const workoutPromises = workoutIds.map((id) =>
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.workout(id),
      queryFn: async () => {
        const response = await apiClient.getWorkout(id);
        return response.data;
      },
      staleTime: 24 * 60 * 60 * 1000,
    })
  );

  const mealPromises = mealIds.map((id) =>
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.meal(id),
      queryFn: async () => {
        const response = await apiClient.getMeal(id);
        return response.data;
      },
      staleTime: 24 * 60 * 60 * 1000,
    })
  );

  await Promise.all([...workoutPromises, ...mealPromises]);
}

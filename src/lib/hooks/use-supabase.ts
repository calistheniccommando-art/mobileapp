/**
 * React Query Hooks for Supabase
 *
 * Integrates Supabase database with React Query for
 * server state management with caching and sync.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userService,
  onboardingService,
  planService,
  exerciseService,
  workoutTemplateService,
  mealService,
  dailyProgressService,
  subscriptionService,
  isSupabaseConfigured,
} from '@/lib/supabase';
import type {
  User,
  UserInsert,
  UserUpdate,
  UserOnboarding,
  UserOnboardingInsert,
  UserOnboardingUpdate,
  UserPlan,
  UserPlanInsert,
  Exercise,
  Meal,
  WorkoutTemplate,
  UserDailyProgress,
  UserDailyProgressInsert,
  Subscription,
  FitnessLevel,
  MealType,
} from '@/lib/supabase';

// ==================== QUERY KEYS ====================

export const queryKeys = {
  // User
  user: (id: string) => ['user', id] as const,
  userByEmail: (email: string) => ['user', 'email', email] as const,

  // Onboarding
  onboarding: (userId: string) => ['onboarding', userId] as const,

  // Plans
  plan: (userId: string) => ['plan', userId] as const,
  activePlan: (userId: string) => ['plan', userId, 'active'] as const,

  // Exercises
  exercises: () => ['exercises'] as const,
  exercisesByLevel: (level: FitnessLevel) => ['exercises', 'level', level] as const,
  exercisesByMuscle: (group: string) => ['exercises', 'muscle', group] as const,
  exercise: (id: string) => ['exercise', id] as const,

  // Workouts
  workoutTemplates: () => ['workoutTemplates'] as const,
  workoutTemplatesByLevel: (level: FitnessLevel) => ['workoutTemplates', 'level', level] as const,
  workoutTemplate: (id: string) => ['workoutTemplate', id] as const,

  // Meals
  meals: () => ['meals'] as const,
  mealsByType: (type: MealType) => ['meals', 'type', type] as const,
  meal: (id: string) => ['meal', id] as const,

  // Daily Progress
  dailyProgress: (userId: string, date: string) => ['dailyProgress', userId, date] as const,
  dailyProgressRange: (userId: string, startDate: string, endDate: string) =>
    ['dailyProgress', userId, startDate, endDate] as const,

  // Subscription
  subscription: (userId: string) => ['subscription', userId] as const,
};

// ==================== USER HOOKS ====================

export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.user(id),
    queryFn: () => userService.getById(id),
    enabled: !!id && isSupabaseConfigured(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserByEmail(email: string) {
  return useQuery({
    queryKey: queryKeys.userByEmail(email),
    queryFn: () => userService.getByEmail(email),
    enabled: !!email && isSupabaseConfigured(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (user: UserInsert) => userService.create(user),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user(data.id), data);
      if (data.email) {
        queryClient.setQueryData(queryKeys.userByEmail(data.email), data);
      }
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UserUpdate }) =>
      userService.update(id, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.user(data.id), data);
      if (data.email) {
        queryClient.setQueryData(queryKeys.userByEmail(data.email), data);
      }
    },
  });
}

// ==================== ONBOARDING HOOKS ====================

export function useOnboarding(userId: string) {
  return useQuery({
    queryKey: queryKeys.onboarding(userId),
    queryFn: () => onboardingService.getByUserId(userId),
    enabled: !!userId && isSupabaseConfigured(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useCreateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (onboarding: UserOnboardingInsert) =>
      onboardingService.create(onboarding),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.onboarding(data.user_id), data);
    },
  });
}

export function useUpdateOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, updates }: { userId: string; updates: UserOnboardingUpdate }) =>
      onboardingService.update(userId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.onboarding(data.user_id), data);
    },
  });
}

// ==================== PLAN HOOKS ====================

export function useActivePlan(userId: string) {
  return useQuery({
    queryKey: queryKeys.activePlan(userId),
    queryFn: () => planService.getActiveByUserId(userId),
    enabled: !!userId && isSupabaseConfigured(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: UserPlanInsert) => planService.create(plan),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.plan(data.user_id), data);
      if (data.is_active) {
        queryClient.setQueryData(queryKeys.activePlan(data.user_id), data);
      }
    },
  });
}

// ==================== EXERCISE HOOKS ====================

export function useExercises() {
  return useQuery({
    queryKey: queryKeys.exercises(),
    queryFn: () => exerciseService.getAll(),
    enabled: isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000, // 30 minutes - exercises don't change often
  });
}

export function useExercisesByLevel(level: FitnessLevel) {
  return useQuery({
    queryKey: queryKeys.exercisesByLevel(level),
    queryFn: () => exerciseService.getByDifficulty(level),
    enabled: !!level && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useExercisesByMuscleGroup(muscleGroup: string) {
  return useQuery({
    queryKey: queryKeys.exercisesByMuscle(muscleGroup),
    queryFn: () => exerciseService.getByMuscleGroup(muscleGroup),
    enabled: !!muscleGroup && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useExercise(id: string) {
  return useQuery({
    queryKey: queryKeys.exercise(id),
    queryFn: () => exerciseService.getById(id),
    enabled: !!id && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

// ==================== WORKOUT TEMPLATE HOOKS ====================

export function useWorkoutTemplates() {
  return useQuery({
    queryKey: queryKeys.workoutTemplates(),
    queryFn: () => workoutTemplateService.getAll(),
    enabled: isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useWorkoutTemplatesByLevel(level: FitnessLevel) {
  return useQuery({
    queryKey: queryKeys.workoutTemplatesByLevel(level),
    queryFn: () => workoutTemplateService.getByDifficulty(level),
    enabled: !!level && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useWorkoutTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.workoutTemplate(id),
    queryFn: () => workoutTemplateService.getById(id),
    enabled: !!id && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

// ==================== MEAL HOOKS ====================

export function useMeals() {
  return useQuery({
    queryKey: queryKeys.meals(),
    queryFn: () => mealService.getAll(),
    enabled: isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useMealsByType(type: MealType) {
  return useQuery({
    queryKey: queryKeys.mealsByType(type),
    queryFn: () => mealService.getByType(type),
    enabled: !!type && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useMeal(id: string) {
  return useQuery({
    queryKey: queryKeys.meal(id),
    queryFn: () => mealService.getById(id),
    enabled: !!id && isSupabaseConfigured(),
    staleTime: 30 * 60 * 1000,
  });
}

// ==================== DAILY PROGRESS HOOKS ====================

export function useDailyProgressForDate(userId: string, date: string) {
  return useQuery({
    queryKey: queryKeys.dailyProgress(userId, date),
    queryFn: () => dailyProgressService.getByDate(userId, date),
    enabled: !!userId && !!date && isSupabaseConfigured(),
    staleTime: 1 * 60 * 1000, // 1 minute - progress changes frequently
  });
}

export function useDailyProgressRange(userId: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.dailyProgressRange(userId, startDate, endDate),
    queryFn: () => dailyProgressService.getRange(userId, startDate, endDate),
    enabled: !!userId && !!startDate && !!endDate && isSupabaseConfigured(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrUpdateDailyProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (progress: UserDailyProgressInsert) =>
      dailyProgressService.createOrUpdate(progress),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.dailyProgress(data.user_id, data.date),
        data
      );
    },
  });
}

export function useMarkWorkoutComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      date,
      workoutTemplateId,
      exercisesCompleted,
      durationMinutes,
    }: {
      userId: string;
      date: string;
      workoutTemplateId: string;
      exercisesCompleted: string[];
      durationMinutes: number;
    }) =>
      dailyProgressService.markWorkoutComplete(
        userId,
        date,
        workoutTemplateId,
        exercisesCompleted,
        durationMinutes
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.dailyProgress(data.user_id, data.date),
        data
      );
    },
  });
}

export function useMarkMealComplete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      date,
      mealId,
    }: {
      userId: string;
      date: string;
      mealId: string;
    }) => dailyProgressService.markMealComplete(userId, date, mealId),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.dailyProgress(data.user_id, data.date),
        data
      );
    },
  });
}

export function useUpdateFasting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      date,
      fastingStart,
      fastingEnd,
      completed,
    }: {
      userId: string;
      date: string;
      fastingStart: string | null;
      fastingEnd: string | null;
      completed: boolean;
    }) =>
      dailyProgressService.updateFasting(
        userId,
        date,
        fastingStart,
        fastingEnd,
        completed
      ),
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.dailyProgress(data.user_id, data.date),
        data
      );
    },
  });
}

// ==================== SUBSCRIPTION HOOKS ====================

export function useSubscription(userId: string) {
  return useQuery({
    queryKey: queryKeys.subscription(userId),
    queryFn: () => subscriptionService.getActiveByUserId(userId),
    enabled: !!userId && isSupabaseConfigured(),
    staleTime: 10 * 60 * 1000,
  });
}

// ==================== SYNC UTILITIES ====================

/**
 * Hook to sync local state with Supabase on app load
 */
export function useSyncOnLoad(userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!userId || !isSupabaseConfigured()) return null;

      // Prefetch essential data in parallel
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.user(userId),
          queryFn: () => userService.getById(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.onboarding(userId),
          queryFn: () => onboardingService.getByUserId(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.activePlan(userId),
          queryFn: () => planService.getActiveByUserId(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.subscription(userId),
          queryFn: () => subscriptionService.getActiveByUserId(userId),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.exercises(),
          queryFn: () => exerciseService.getAll(),
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.meals(),
          queryFn: () => mealService.getAll(),
        }),
      ]);

      return true;
    },
  });
}

/**
 * Hook to check if Supabase is ready
 */
export function useSupabaseStatus() {
  return {
    isConfigured: isSupabaseConfigured(),
  };
}

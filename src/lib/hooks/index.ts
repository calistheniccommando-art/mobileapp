/**
 * Hooks Module Index
 *
 * Central export point for all custom hooks.
 */

// API hooks
export * from './use-api';

// Daily plan hooks - using actual exports from use-daily-plan
export {
  useEnrichedDailyPlan,
  useFastingStatus,
  useScheduledMeals,
  useWorkout,
  usePDFExport,
  useWeekPlan,
  usePlanValidation,
  useDailyStats,
} from './use-daily-plan';

// Fasting countdown hook
export { useFastingCountdown } from './use-fasting-countdown';

// Supabase hooks - using actual exports from use-supabase
export {
  queryKeys,
  useUser,
  useUserByEmail,
  useCreateUser,
  useUpdateUser,
  useOnboarding,
  useCreateOnboarding,
  useUpdateOnboarding,
  useActivePlan,
  useCreatePlan,
  useExercises,
  useExercisesByLevel,
  useExercisesByMuscleGroup,
  useExercise,
  useWorkoutTemplates,
  useWorkoutTemplatesByLevel,
  useWorkoutTemplate,
  useMeals,
  useMealsByType,
  useMeal,
  useDailyProgressForDate,
  useDailyProgressRange,
  useCreateOrUpdateDailyProgress,
  useMarkWorkoutComplete,
  useMarkMealComplete,
  useUpdateFasting,
  useSubscription,
  useSyncOnLoad,
  useSupabaseStatus,
} from './use-supabase';

// Admin hooks
export * from './use-admin';
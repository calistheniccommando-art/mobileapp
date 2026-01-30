/**
 * WORKOUT SERVICE
 *
 * Handles all workout-related business logic:
 * - Fetching workout plans by difficulty and day
 * - Exercise data with video URLs
 * - Progress tracking (prepared for future)
 * - Video caching status
 */

import type {
  DifficultyLevel,
  Exercise,
  WorkoutPlan,
  WorkoutProgress,
} from '@/types/fitness';
import { exercises, workoutPlans, getWorkoutForDayWithDifficulty } from '@/data/mock-data';

// ==================== TYPES ====================

export interface WorkoutWithExercises extends WorkoutPlan {
  exerciseDetails: ExerciseWithStatus[];
}

export interface ExerciseWithStatus extends Exercise {
  orderIndex: number;
  isCompleted: boolean;
  videoStatus: 'loading' | 'ready' | 'error' | 'offline';
}

export interface WorkoutSession {
  workoutId: string;
  startedAt: string;
  completedExercises: string[];
  currentExerciseIndex: number;
  isPaused: boolean;
  totalDuration: number; // seconds elapsed
}

export interface VideoMetadata {
  exerciseId: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  isCached: boolean;
  lastAccessed?: string;
}

// ==================== WORKOUT SERVICE ====================

export const WorkoutService = {
  /**
   * Get all workouts for a specific difficulty level
   */
  getWorkoutsByDifficulty(difficulty: DifficultyLevel): WorkoutPlan[] {
    // Filter workouts that match the difficulty or are easier
    const difficultyOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    const userDifficultyIndex = difficultyOrder.indexOf(difficulty);

    return workoutPlans.filter((wp) => {
      const workoutDifficultyIndex = difficultyOrder.indexOf(wp.difficulty);
      return workoutDifficultyIndex <= userDifficultyIndex;
    });
  },

  /**
   * Get workout for a specific day and difficulty
   */
  getWorkoutForDay(
    dayOfWeek: number,
    difficulty: DifficultyLevel
  ): WorkoutPlan | null {
    return getWorkoutForDayWithDifficulty(dayOfWeek, difficulty);
  },

  /**
   * Get workout by ID with full exercise details
   */
  getWorkoutWithExercises(
    workoutId: string,
    completedExerciseIds: string[] = []
  ): WorkoutWithExercises | null {
    const workout = workoutPlans.find((wp) => wp.id === workoutId);
    if (!workout) return null;

    const exerciseDetails: ExerciseWithStatus[] = workout.exercises.map(
      (exercise, index) => ({
        ...exercise,
        orderIndex: index,
        isCompleted: completedExerciseIds.includes(exercise.id),
        videoStatus: exercise.videoUrl ? 'ready' : 'error',
      })
    );

    return {
      ...workout,
      exerciseDetails,
    };
  },

  /**
   * Get exercise by ID
   */
  getExerciseById(exerciseId: string): Exercise | null {
    return exercises.find((e) => e.id === exerciseId) ?? null;
  },

  /**
   * Get all exercises for a muscle group
   */
  getExercisesByMuscleGroup(muscleGroup: string): Exercise[] {
    return exercises.filter((e) => e.muscleGroups.includes(muscleGroup as Exercise['muscleGroups'][number]));
  },

  /**
   * Get all exercises by difficulty
   */
  getExercisesByDifficulty(difficulty: DifficultyLevel): Exercise[] {
    return exercises.filter((e) => e.difficulty === difficulty);
  },

  /**
   * Calculate total workout stats
   */
  calculateWorkoutStats(workout: WorkoutPlan): {
    totalSets: number;
    totalExercises: number;
    estimatedDuration: number;
    estimatedCalories: number;
  } {
    let totalSets = 0;
    let estimatedDuration = 0;

    workout.exercises.forEach((exercise) => {
      const sets = exercise.sets ?? 3;
      totalSets += sets;

      // Calculate duration: (sets * (duration or ~30s per set)) + (rest * (sets - 1))
      const exerciseDuration = exercise.duration ?? 30;
      const restTime = exercise.restTime ?? 60;
      estimatedDuration += sets * exerciseDuration + (sets - 1) * restTime;
    });

    return {
      totalSets,
      totalExercises: workout.exercises.length,
      estimatedDuration: Math.ceil(estimatedDuration / 60), // Convert to minutes
      estimatedCalories: workout.estimatedCalories,
    };
  },

  /**
   * Group exercises by section (warm-up, main, cool-down)
   * Based on exercise type and position
   */
  groupExercisesBySection(
    exercises: Exercise[]
  ): { warmUp: Exercise[]; main: Exercise[]; coolDown: Exercise[] } {
    const warmUp: Exercise[] = [];
    const main: Exercise[] = [];
    const coolDown: Exercise[] = [];

    exercises.forEach((exercise, index) => {
      // First exercise or cardio at start = warm-up
      if (index === 0 || (index === 1 && exercise.type === 'cardio')) {
        warmUp.push(exercise);
      }
      // Last exercise or flexibility = cool-down
      else if (
        index === exercises.length - 1 ||
        exercise.type === 'flexibility'
      ) {
        coolDown.push(exercise);
      }
      // Everything else = main workout
      else {
        main.push(exercise);
      }
    });

    // If all exercises ended up in one section, redistribute
    if (main.length === 0 && warmUp.length > 2) {
      const temp = [...warmUp];
      warmUp.length = 0;
      warmUp.push(temp[0]);
      main.push(...temp.slice(1, -1));
      if (temp.length > 1) {
        coolDown.push(temp[temp.length - 1]);
      }
    }

    return { warmUp, main, coolDown };
  },
};

// ==================== VIDEO SERVICE ====================

export const VideoService = {
  /**
   * Check if video is available (mock implementation)
   * In production, this would check actual video availability
   */
  async checkVideoAvailability(videoUrl: string): Promise<boolean> {
    if (!videoUrl) return false;
    // Mock: assume all videos with URLs are available
    return true;
  },

  /**
   * Get video metadata
   */
  getVideoMetadata(exerciseId: string): VideoMetadata | null {
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise?.videoUrl) return null;

    return {
      exerciseId,
      videoUrl: exercise.videoUrl,
      thumbnailUrl: exercise.thumbnailUrl,
      duration: undefined, // Would be fetched from video metadata
      isCached: false, // Would check actual cache status
      lastAccessed: undefined,
    };
  },

  /**
   * Get fallback content when video fails
   */
  getVideoFallback(exercise: Exercise): {
    message: string;
    instructions: string[];
    thumbnailUrl?: string;
  } {
    return {
      message: 'Video unavailable. Follow these instructions:',
      instructions: exercise.instructions,
      thumbnailUrl: exercise.thumbnailUrl,
    };
  },

  /**
   * Mark video as cached (mock implementation)
   * In production, this would interface with actual cache
   */
  async markAsCached(exerciseId: string): Promise<void> {
    // Mock implementation
    console.log(`Video cached for exercise: ${exerciseId}`);
  },

  /**
   * Check cache status for multiple videos
   */
  async getCacheStatus(
    exerciseIds: string[]
  ): Promise<Record<string, boolean>> {
    // Mock implementation - return all as not cached
    const status: Record<string, boolean> = {};
    exerciseIds.forEach((id) => {
      status[id] = false;
    });
    return status;
  },
};

// ==================== PROGRESS SERVICE (Prepared for future) ====================

export const WorkoutProgressService = {
  /**
   * Start a workout session
   */
  startSession(workoutId: string): WorkoutSession {
    return {
      workoutId,
      startedAt: new Date().toISOString(),
      completedExercises: [],
      currentExerciseIndex: 0,
      isPaused: false,
      totalDuration: 0,
    };
  },

  /**
   * Mark exercise as completed in session
   */
  completeExercise(
    session: WorkoutSession,
    exerciseId: string
  ): WorkoutSession {
    if (session.completedExercises.includes(exerciseId)) {
      return session;
    }

    return {
      ...session,
      completedExercises: [...session.completedExercises, exerciseId],
      currentExerciseIndex: session.currentExerciseIndex + 1,
    };
  },

  /**
   * Calculate session progress
   */
  getProgress(session: WorkoutSession, totalExercises: number): number {
    if (totalExercises === 0) return 0;
    return Math.round(
      (session.completedExercises.length / totalExercises) * 100
    );
  },

  /**
   * Save workout progress (mock - future database integration)
   */
  async saveProgress(
    userId: string,
    session: WorkoutSession
  ): Promise<WorkoutProgress | null> {
    // Mock implementation - would save to database
    console.log(`Saving workout progress for user: ${userId}`);
    return null;
  },
};

export default WorkoutService;

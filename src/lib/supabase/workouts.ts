/**
 * Workout Templates CRUD Service
 * 
 * Full CRUD operations for workout templates
 * Used by admin panel for content management
 */

import { supabase } from './client';
import { exerciseService, type Exercise } from './exercises';
import type { MuscleGroup, FitnessLevel } from './types';

// ==================== TYPES ====================
// Note: Explicit interfaces used because workout_templates not in generated Database types yet

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  exercise_order: string[];
  target_muscle_groups: MuscleGroup[];
  difficulty: FitnessLevel;
  estimated_duration_minutes: number;
  estimated_calories: number | null;
  thumbnail_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateInsert {
  id?: string;
  name: string;
  description?: string | null;
  exercise_order?: string[];
  target_muscle_groups?: MuscleGroup[];
  difficulty?: FitnessLevel;
  estimated_duration_minutes?: number;
  estimated_calories?: number | null;
  thumbnail_url?: string | null;
  is_active?: boolean;
}

export interface WorkoutTemplateUpdate {
  name?: string;
  description?: string | null;
  exercise_order?: string[];
  target_muscle_groups?: MuscleGroup[];
  difficulty?: FitnessLevel;
  estimated_duration_minutes?: number;
  estimated_calories?: number | null;
  thumbnail_url?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

// Extended type with loaded exercises
export interface WorkoutTemplateWithExercises extends WorkoutTemplate {
  exercises: Exercise[];
}

export interface WorkoutFilters {
  difficulty?: FitnessLevel;
  muscleGroups?: MuscleGroup[];
  isActive?: boolean;
  search?: string;
  minDuration?: number;
  maxDuration?: number;
}

export interface WorkoutListOptions {
  filters?: WorkoutFilters;
  page?: number;
  pageSize?: number;
  orderBy?: keyof WorkoutTemplate;
  orderDirection?: 'asc' | 'desc';
  includeExercises?: boolean;
}

export interface WorkoutListResult {
  workouts: WorkoutTemplate[] | WorkoutTemplateWithExercises[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Exercise configuration for workout
export interface WorkoutExerciseConfig {
  exerciseId: string;
  sets?: number;
  reps?: string;
  durationSeconds?: number;
  restSeconds?: number;
  notes?: string;
}

// ==================== WORKOUT SERVICE ====================

export const workoutService = {
  /**
   * List workouts with filtering, pagination, and sorting
   */
  async list(options: WorkoutListOptions = {}): Promise<WorkoutListResult> {
    const {
      filters = {},
      page = 1,
      pageSize = 20,
      orderBy = 'name',
      orderDirection = 'asc',
      includeExercises = false,
    } = options;

    let query = supabase
      .from('workout_templates')
      .select('*', { count: 'exact' }) as any;

    // Apply filters
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.muscleGroups && filters.muscleGroups.length > 0) {
      query = query.overlaps('target_muscle_groups', filters.muscleGroups);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.minDuration !== undefined) {
      query = query.gte('estimated_duration_minutes', filters.minDuration);
    }
    if (filters.maxDuration !== undefined) {
      query = query.lte('estimated_duration_minutes', filters.maxDuration);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list workouts: ${error.message}`);
    }

    let workouts = (data || []) as WorkoutTemplate[];

    // Optionally load exercises for each workout
    if (includeExercises && workouts.length > 0) {
      const workoutsWithExercises = await Promise.all(
        workouts.map(async (workout) => {
          const exercises = await this.getWorkoutExercises(workout.exercise_order);
          return { ...workout, exercises };
        })
      );
      return {
        workouts: workoutsWithExercises,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    }

    return {
      workouts,
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Get a single workout by ID
   */
  async getById(id: string, includeExercises = false): Promise<WorkoutTemplate | WorkoutTemplateWithExercises | null> {
    const { data, error } = await (supabase
      .from('workout_templates')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get workout: ${error.message}`);
    }

    const workout = data as WorkoutTemplate;

    if (includeExercises) {
      const exercises = await this.getWorkoutExercises(workout.exercise_order);
      return { ...workout, exercises };
    }

    return workout;
  },

  /**
   * Get exercises for a workout in order
   */
  async getWorkoutExercises(exerciseIds: string[]): Promise<Exercise[]> {
    if (!exerciseIds || exerciseIds.length === 0) {
      return [];
    }

    const { data, error } = await (supabase
      .from('exercises')
      .select('*')
      .in('id', exerciseIds) as any);

    if (error) {
      throw new Error(`Failed to get workout exercises: ${error.message}`);
    }

    // Sort by the order in exerciseIds
    const exerciseMap = new Map((data || []).map((e: Exercise) => [e.id, e]));
    return exerciseIds
      .map(id => exerciseMap.get(id))
      .filter((e): e is Exercise => e !== undefined);
  },

  /**
   * Create a new workout
   */
  async create(workout: WorkoutTemplateInsert): Promise<WorkoutTemplate> {
    const { data, error } = await (supabase
      .from('workout_templates')
      .insert(workout as any)
      .select()
      .single() as any);

    if (error) {
      throw new Error(`Failed to create workout: ${error.message}`);
    }

    return data as WorkoutTemplate;
  },

  /**
   * Update an existing workout
   */
  async update(id: string, updates: WorkoutTemplateUpdate): Promise<WorkoutTemplate> {
    const { data, error } = await (supabase
      .from('workout_templates') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update workout: ${error.message}`);
    }

    return data as WorkoutTemplate;
  },

  /**
   * Delete a workout (soft delete by setting is_active = false)
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('workout_templates') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete workout: ${error.message}`);
    }
  },

  /**
   * Permanently delete a workout
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('workout_templates')
      .delete()
      .eq('id', id) as any);

    if (error) {
      throw new Error(`Failed to permanently delete workout: ${error.message}`);
    }
  },

  /**
   * Restore a soft-deleted workout
   */
  async restore(id: string): Promise<WorkoutTemplate> {
    const { data, error } = await (supabase
      .from('workout_templates') as any)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to restore workout: ${error.message}`);
    }

    return data as WorkoutTemplate;
  },

  /**
   * Add exercise to workout
   */
  async addExercise(workoutId: string, exerciseId: string, position?: number): Promise<WorkoutTemplate> {
    const workout = await this.getById(workoutId);
    if (!workout) {
      throw new Error('Workout not found');
    }

    const exerciseOrder = [...workout.exercise_order];
    
    if (position !== undefined && position >= 0 && position <= exerciseOrder.length) {
      exerciseOrder.splice(position, 0, exerciseId);
    } else {
      exerciseOrder.push(exerciseId);
    }

    return this.update(workoutId, { exercise_order: exerciseOrder });
  },

  /**
   * Remove exercise from workout
   */
  async removeExercise(workoutId: string, exerciseId: string): Promise<WorkoutTemplate> {
    const workout = await this.getById(workoutId);
    if (!workout) {
      throw new Error('Workout not found');
    }

    const exerciseOrder = workout.exercise_order.filter(id => id !== exerciseId);
    return this.update(workoutId, { exercise_order: exerciseOrder });
  },

  /**
   * Reorder exercises in workout
   */
  async reorderExercises(workoutId: string, newOrder: string[]): Promise<WorkoutTemplate> {
    return this.update(workoutId, { exercise_order: newOrder });
  },

  /**
   * Calculate workout stats based on exercises
   */
  async calculateStats(exerciseIds: string[]): Promise<{
    estimatedDuration: number;
    estimatedCalories: number;
    muscleGroups: MuscleGroup[];
  }> {
    if (exerciseIds.length === 0) {
      return { estimatedDuration: 0, estimatedCalories: 0, muscleGroups: [] };
    }

    const exercises = await this.getWorkoutExercises(exerciseIds);
    
    let totalDuration = 0;
    let totalCalories = 0;
    const muscleGroupSet = new Set<MuscleGroup>();

    for (const exercise of exercises) {
      // Estimate duration per exercise (sets * (time per set + rest))
      const setsTime = exercise.default_sets * 45; // ~45 seconds per set average
      const restTime = (exercise.default_sets - 1) * exercise.default_rest_seconds;
      totalDuration += setsTime + restTime;

      // Sum calories
      if (exercise.calories_per_set) {
        totalCalories += exercise.calories_per_set * exercise.default_sets;
      }

      // Collect muscle groups
      exercise.muscle_groups.forEach(mg => muscleGroupSet.add(mg));
    }

    return {
      estimatedDuration: Math.round(totalDuration / 60), // Convert to minutes
      estimatedCalories: totalCalories,
      muscleGroups: Array.from(muscleGroupSet),
    };
  },

  /**
   * Get workout stats for admin dashboard
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: Record<FitnessLevel, number>;
    averageDuration: number;
    averageExerciseCount: number;
  }> {
    const { data, error } = await (supabase
      .from('workout_templates')
      .select('id, is_active, difficulty, estimated_duration_minutes, exercise_order') as any);

    if (error) {
      throw new Error(`Failed to get workout stats: ${error.message}`);
    }

    const workouts = (data || []) as Array<{
      id: string;
      is_active: boolean;
      difficulty: FitnessLevel;
      estimated_duration_minutes: number;
      exercise_order: string[];
    }>;
    const total = workouts.length;
    const active = workouts.filter(w => w.is_active).length;
    const inactive = total - active;

    const byDifficulty = workouts.reduce((acc, w) => {
      acc[w.difficulty] = (acc[w.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<FitnessLevel, number>);

    const totalDuration = workouts.reduce((sum, w) => sum + w.estimated_duration_minutes, 0);
    const totalExercises = workouts.reduce((sum, w) => sum + w.exercise_order.length, 0);

    return {
      total,
      active,
      inactive,
      byDifficulty,
      averageDuration: total > 0 ? Math.round(totalDuration / total) : 0,
      averageExerciseCount: total > 0 ? Math.round(totalExercises / total) : 0,
    };
  },

  /**
   * Duplicate a workout
   */
  async duplicate(id: string): Promise<WorkoutTemplate> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Workout not found');
    }

    const { id: _, created_at, updated_at, ...rest } = original;
    const duplicate: WorkoutTemplateInsert = {
      ...rest,
      name: `${original.name} (Copy)`,
    };

    return this.create(duplicate);
  },

  /**
   * Get workouts by difficulty
   */
  async getByDifficulty(difficulty: FitnessLevel): Promise<WorkoutTemplate[]> {
    const { data, error } = await (supabase
      .from('workout_templates')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get workouts by difficulty: ${error.message}`);
    }

    return (data || []) as WorkoutTemplate[];
  },

  /**
   * Get workouts by muscle group
   */
  async getByMuscleGroup(muscleGroup: MuscleGroup): Promise<WorkoutTemplate[]> {
    const { data, error } = await (supabase
      .from('workout_templates')
      .select('*')
      .contains('target_muscle_groups', [muscleGroup])
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get workouts by muscle group: ${error.message}`);
    }

    return (data || []) as WorkoutTemplate[];
  },
};

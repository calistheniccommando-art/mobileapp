/**
 * Exercise CRUD Service
 * 
 * Full CRUD operations for exercises library
 * Used by admin panel for content management
 */

import { supabase } from './client';
import type { MuscleGroup, ExerciseType, FitnessLevel } from './types';

// ==================== TYPES ====================

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  youtube_video_id: string | null;
  thumbnail_url: string | null;
  muscle_groups: MuscleGroup[];
  exercise_type: ExerciseType;
  difficulty: FitnessLevel;
  default_sets: number;
  default_reps: string;
  default_duration_seconds: number | null;
  default_rest_seconds: number;
  calories_per_set: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExerciseInsert {
  id?: string;
  name: string;
  description: string;
  instructions?: string[];
  youtube_video_id?: string | null;
  thumbnail_url?: string | null;
  muscle_groups?: MuscleGroup[];
  exercise_type?: ExerciseType;
  difficulty?: FitnessLevel;
  default_sets?: number;
  default_reps?: string;
  default_duration_seconds?: number | null;
  default_rest_seconds?: number;
  calories_per_set?: number | null;
  is_active?: boolean;
}

export interface ExerciseUpdate {
  name?: string;
  description?: string;
  instructions?: string[];
  youtube_video_id?: string | null;
  thumbnail_url?: string | null;
  muscle_groups?: MuscleGroup[];
  exercise_type?: ExerciseType;
  difficulty?: FitnessLevel;
  default_sets?: number;
  default_reps?: string;
  default_duration_seconds?: number | null;
  default_rest_seconds?: number;
  calories_per_set?: number | null;
  is_active?: boolean;
}

export interface ExerciseFilters {
  difficulty?: FitnessLevel;
  exerciseType?: ExerciseType;
  muscleGroups?: MuscleGroup[];
  isActive?: boolean;
  search?: string;
}

export interface ExerciseListOptions {
  filters?: ExerciseFilters;
  page?: number;
  pageSize?: number;
  orderBy?: keyof Exercise;
  orderDirection?: 'asc' | 'desc';
}

export interface ExerciseListResult {
  exercises: Exercise[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== EXERCISE SERVICE ====================

export const exerciseService = {
  /**
   * List exercises with filtering, pagination, and sorting
   */
  async list(options: ExerciseListOptions = {}): Promise<ExerciseListResult> {
    const {
      filters = {},
      page = 1,
      pageSize = 20,
      orderBy = 'name',
      orderDirection = 'asc',
    } = options;

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' }) as any;

    // Apply filters
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.exerciseType) {
      query = query.eq('exercise_type', filters.exerciseType);
    }
    if (filters.muscleGroups && filters.muscleGroups.length > 0) {
      query = query.overlaps('muscle_groups', filters.muscleGroups);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list exercises: ${error.message}`);
    }

    return {
      exercises: (data || []) as Exercise[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Get a single exercise by ID
   */
  async getById(id: string): Promise<Exercise | null> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single() as any;

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get exercise: ${error.message}`);
    }

    return data as Exercise;
  },

  /**
   * Create a new exercise
   */
  async create(exercise: ExerciseInsert): Promise<Exercise> {
    const { data, error } = await (supabase
      .from('exercises')
      .insert(exercise as any)
      .select()
      .single() as any);

    if (error) {
      throw new Error(`Failed to create exercise: ${error.message}`);
    }

    return data as Exercise;
  },

  /**
   * Update an existing exercise
   */
  async update(id: string, updates: ExerciseUpdate): Promise<Exercise> {
    const { data, error } = await (supabase
      .from('exercises') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update exercise: ${error.message}`);
    }

    return data as Exercise;
  },

  /**
   * Delete an exercise (soft delete by setting is_active = false)
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('exercises') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete exercise: ${error.message}`);
    }
  },

  /**
   * Permanently delete an exercise
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('exercises')
      .delete()
      .eq('id', id) as any);

    if (error) {
      throw new Error(`Failed to permanently delete exercise: ${error.message}`);
    }
  },

  /**
   * Restore a soft-deleted exercise
   */
  async restore(id: string): Promise<Exercise> {
    const { data, error } = await (supabase
      .from('exercises') as any)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to restore exercise: ${error.message}`);
    }

    return data as Exercise;
  },

  /**
   * Bulk update exercises
   */
  async bulkUpdate(ids: string[], updates: ExerciseUpdate): Promise<Exercise[]> {
    const { data, error } = await (supabase
      .from('exercises') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) {
      throw new Error(`Failed to bulk update exercises: ${error.message}`);
    }

    return (data || []) as Exercise[];
  },

  /**
   * Bulk soft delete exercises
   */
  async bulkSoftDelete(ids: string[]): Promise<void> {
    const { error } = await (supabase
      .from('exercises') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to bulk delete exercises: ${error.message}`);
    }
  },

  /**
   * Get exercises by muscle group
   */
  async getByMuscleGroup(muscleGroup: MuscleGroup): Promise<Exercise[]> {
    const { data, error } = await (supabase
      .from('exercises')
      .select('*')
      .contains('muscle_groups', [muscleGroup])
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get exercises by muscle group: ${error.message}`);
    }

    return (data || []) as Exercise[];
  },

  /**
   * Get exercises by difficulty level
   */
  async getByDifficulty(difficulty: FitnessLevel): Promise<Exercise[]> {
    const { data, error } = await (supabase
      .from('exercises')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get exercises by difficulty: ${error.message}`);
    }

    return (data || []) as Exercise[];
  },

  /**
   * Get exercise stats for admin dashboard
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: Record<FitnessLevel, number>;
    byType: Record<ExerciseType, number>;
  }> {
    const { data, error } = await (supabase
      .from('exercises')
      .select('id, is_active, difficulty, exercise_type') as any);

    if (error) {
      throw new Error(`Failed to get exercise stats: ${error.message}`);
    }

    const exercises = (data || []) as Array<{ id: string; is_active: boolean; difficulty: FitnessLevel; exercise_type: ExerciseType }>;
    const total = exercises.length;
    const active = exercises.filter(e => e.is_active).length;
    const inactive = total - active;

    const byDifficulty = exercises.reduce((acc, e) => {
      acc[e.difficulty] = (acc[e.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<FitnessLevel, number>);

    const byType = exercises.reduce((acc, e) => {
      acc[e.exercise_type] = (acc[e.exercise_type] || 0) + 1;
      return acc;
    }, {} as Record<ExerciseType, number>);

    return { total, active, inactive, byDifficulty, byType };
  },

  /**
   * Duplicate an exercise
   */
  async duplicate(id: string): Promise<Exercise> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Exercise not found');
    }

    const { id: _, created_at, updated_at, ...rest } = original;
    const duplicate: ExerciseInsert = {
      ...rest,
      name: `${original.name} (Copy)`,
    };

    return this.create(duplicate);
  },
};

// ==================== HELPER FUNCTIONS ====================

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Legs',
  core: 'Core',
  glutes: 'Glutes',
  full_body: 'Full Body',
  cardio: 'Cardio',
};

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  strength: 'Strength',
  cardio: 'Cardio',
  flexibility: 'Flexibility',
  hiit: 'HIIT',
};

export const DIFFICULTY_LABELS: Record<FitnessLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const MUSCLE_GROUP_COLORS: Record<MuscleGroup, { bg: string; text: string }> = {
  chest: { bg: 'bg-red-500/20', text: 'text-red-400' },
  back: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  shoulders: { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  biceps: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  triceps: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
  legs: { bg: 'bg-green-500/20', text: 'text-green-400' },
  core: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' },
  glutes: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  full_body: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  cardio: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
};

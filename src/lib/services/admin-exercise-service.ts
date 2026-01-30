/**
 * ADMIN EXERCISE MANAGEMENT SERVICE
 *
 * Provides CRUD operations for exercise library management:
 * - Add new exercises
 * - Edit existing exercises
 * - Remove/deactivate exercises
 * - Bulk operations
 * - Exercise validation
 * - AI prompt management for video/image generation
 *
 * IMPORTANT: AI prompts are for admin use only.
 * Users should NEVER see AI prompts - they only see finished media assets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DifficultyLevel, MuscleGroup, ExerciseType } from '@/types/fitness';
import {
  FULL_EXERCISE_DATABASE,
  BEGINNER_EXERCISES,
  INTERMEDIATE_EXERCISES,
  ADVANCED_EXERCISES,
  type ExerciseDefinition,
} from '@/lib/data/exercise-library';

// ==================== STORAGE KEYS ====================

const STORAGE_KEYS = {
  CUSTOM_EXERCISES: 'admin_custom_exercises',
  DEACTIVATED_EXERCISES: 'admin_deactivated_exercises',
  EXERCISE_OVERRIDES: 'admin_exercise_overrides',
};

// ==================== TYPES ====================

export interface ExerciseCreateInput {
  name: string;
  shortDescription: string;
  detailedInstructions: string[];
  difficulty: DifficultyLevel;
  muscleGroups: MuscleGroup[];
  type: ExerciseType;
  baseSets: number;
  baseReps: number | string;
  baseDuration?: number;
  baseRestTime: number;
  progressionRate?: number;
  difficultyScore?: number;
  videoPrompt?: string;
  imagePrompt?: string;
  caloriesPerMinute?: number;
  equipmentNeeded?: string[];
  contraindications?: string[];
  alternatives?: string[];
}

export interface ExerciseUpdateInput extends Partial<ExerciseCreateInput> {
  id: string;
}

export interface ExerciseValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AdminExerciseStats {
  total: number;
  active: number;
  inactive: number;
  byDifficulty: Record<DifficultyLevel, number>;
  byType: Record<ExerciseType, number>;
  byMuscleGroup: Record<MuscleGroup, number>;
  customCount: number;
}

// ==================== VALIDATION ====================

const VALID_MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'core', 'glutes', 'full_body', 'cardio',
];

const VALID_EXERCISE_TYPES: ExerciseType[] = [
  'strength', 'cardio', 'flexibility', 'hiit',
];

const VALID_DIFFICULTIES: DifficultyLevel[] = [
  'beginner', 'intermediate', 'advanced',
];

// ==================== ADMIN SERVICE ====================

export class AdminExerciseService {
  private static customExercises: ExerciseDefinition[] = [];
  private static deactivatedIds: Set<string> = new Set();
  private static exerciseOverrides: Map<string, Partial<ExerciseDefinition>> = new Map();
  private static initialized = false;

  /**
   * Initialize the admin service (load from storage)
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load custom exercises
      const customData = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_EXERCISES);
      if (customData) {
        this.customExercises = JSON.parse(customData);
      }

      // Load deactivated IDs
      const deactivatedData = await AsyncStorage.getItem(STORAGE_KEYS.DEACTIVATED_EXERCISES);
      if (deactivatedData) {
        this.deactivatedIds = new Set(JSON.parse(deactivatedData));
      }

      // Load overrides
      const overridesData = await AsyncStorage.getItem(STORAGE_KEYS.EXERCISE_OVERRIDES);
      if (overridesData) {
        const parsed = JSON.parse(overridesData);
        this.exerciseOverrides = new Map(Object.entries(parsed));
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AdminExerciseService:', error);
    }
  }

  /**
   * Save current state to storage
   */
  private static async saveState(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.CUSTOM_EXERCISES,
        JSON.stringify(this.customExercises)
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.DEACTIVATED_EXERCISES,
        JSON.stringify([...this.deactivatedIds])
      );
      await AsyncStorage.setItem(
        STORAGE_KEYS.EXERCISE_OVERRIDES,
        JSON.stringify(Object.fromEntries(this.exerciseOverrides))
      );
    } catch (error) {
      console.error('Failed to save AdminExerciseService state:', error);
    }
  }

  /**
   * Validate exercise input
   */
  static validateExercise(input: ExerciseCreateInput): ExerciseValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!input.name?.trim()) {
      errors.push('Exercise name is required');
    } else if (input.name.length > 50) {
      errors.push('Exercise name must be 50 characters or less');
    }

    if (!input.shortDescription?.trim()) {
      errors.push('Short description is required');
    } else if (input.shortDescription.split(' ').length > 15) {
      warnings.push('Short description should be under 15 words');
    }

    if (!input.detailedInstructions?.length) {
      errors.push('At least one instruction is required');
    } else if (input.detailedInstructions.length < 3) {
      warnings.push('Consider adding more detailed instructions');
    }

    // Validate enums
    if (!VALID_DIFFICULTIES.includes(input.difficulty)) {
      errors.push(`Invalid difficulty: ${input.difficulty}`);
    }

    if (!input.muscleGroups?.length) {
      errors.push('At least one muscle group is required');
    } else {
      for (const muscle of input.muscleGroups) {
        if (!VALID_MUSCLE_GROUPS.includes(muscle)) {
          errors.push(`Invalid muscle group: ${muscle}`);
        }
      }
    }

    if (!VALID_EXERCISE_TYPES.includes(input.type)) {
      errors.push(`Invalid exercise type: ${input.type}`);
    }

    // Validate numbers
    if (input.baseSets < 1 || input.baseSets > 10) {
      errors.push('Base sets must be between 1 and 10');
    }

    if (typeof input.baseReps === 'number') {
      if (input.baseReps < 1 || input.baseReps > 100) {
        errors.push('Base reps must be between 1 and 100');
      }
    }

    if (input.baseRestTime < 5 || input.baseRestTime > 300) {
      errors.push('Rest time must be between 5 and 300 seconds');
    }

    if (input.baseDuration !== undefined) {
      if (input.baseDuration < 5 || input.baseDuration > 600) {
        errors.push('Duration must be between 5 and 600 seconds');
      }
    }

    // Warnings for optional fields
    if (!input.videoPrompt) {
      warnings.push('Consider adding a video prompt for AI generation');
    }

    if (!input.imagePrompt) {
      warnings.push('Consider adding an image prompt for AI generation');
    }

    if (!input.contraindications?.length) {
      warnings.push('Consider adding contraindications for safety');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Create a new exercise
   */
  static async createExercise(input: ExerciseCreateInput): Promise<ExerciseDefinition | null> {
    await this.initialize();

    const validation = this.validateExercise(input);
    if (!validation.valid) {
      console.error('Exercise validation failed:', validation.errors);
      return null;
    }

    // Generate unique ID
    const id = `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const newExercise: ExerciseDefinition = {
      id,
      name: input.name,
      shortDescription: input.shortDescription,
      detailedInstructions: input.detailedInstructions,
      difficulty: input.difficulty,
      muscleGroups: input.muscleGroups,
      type: input.type,
      baseSets: input.baseSets,
      baseReps: input.baseReps,
      baseDuration: input.baseDuration,
      baseRestTime: input.baseRestTime,
      progressionRate: input.progressionRate ?? 1.0,
      difficultyScore: input.difficultyScore ?? this.calculateDifficultyScore(input),
      videoPrompt: input.videoPrompt ?? this.generateDefaultVideoPrompt(input),
      imagePrompt: input.imagePrompt ?? this.generateDefaultImagePrompt(input),
      caloriesPerMinute: input.caloriesPerMinute ?? 5,
      equipmentNeeded: input.equipmentNeeded ?? [],
      contraindications: input.contraindications ?? [],
      alternatives: input.alternatives ?? [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.customExercises.push(newExercise);
    await this.saveState();

    return newExercise;
  }

  /**
   * Update an existing exercise
   */
  static async updateExercise(input: ExerciseUpdateInput): Promise<boolean> {
    await this.initialize();

    const { id, ...updates } = input;

    // Check if it's a custom exercise
    const customIndex = this.customExercises.findIndex((ex) => ex.id === id);
    if (customIndex !== -1) {
      // Update custom exercise directly
      this.customExercises[customIndex] = {
        ...this.customExercises[customIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Store override for built-in exercise
      const existingOverride = this.exerciseOverrides.get(id) ?? {};
      this.exerciseOverrides.set(id, { ...existingOverride, ...updates });
    }

    await this.saveState();
    return true;
  }

  /**
   * Deactivate an exercise (soft delete)
   */
  static async deactivateExercise(id: string): Promise<boolean> {
    await this.initialize();

    this.deactivatedIds.add(id);
    await this.saveState();

    return true;
  }

  /**
   * Reactivate a deactivated exercise
   */
  static async reactivateExercise(id: string): Promise<boolean> {
    await this.initialize();

    this.deactivatedIds.delete(id);
    await this.saveState();

    return true;
  }

  /**
   * Permanently delete a custom exercise
   */
  static async deleteExercise(id: string): Promise<boolean> {
    await this.initialize();

    // Can only delete custom exercises
    if (!id.startsWith('custom_')) {
      console.error('Cannot delete built-in exercises');
      return false;
    }

    const index = this.customExercises.findIndex((ex) => ex.id === id);
    if (index !== -1) {
      this.customExercises.splice(index, 1);
      this.deactivatedIds.delete(id);
      await this.saveState();
      return true;
    }

    return false;
  }

  /**
   * Get all exercises (including custom, with overrides applied)
   */
  static async getAllExercises(): Promise<ExerciseDefinition[]> {
    await this.initialize();

    const allExercises: ExerciseDefinition[] = [];

    // Add built-in exercises with overrides
    for (const ex of FULL_EXERCISE_DATABASE) {
      if (this.deactivatedIds.has(ex.id)) {
        continue; // Skip deactivated
      }

      const override = this.exerciseOverrides.get(ex.id);
      if (override) {
        allExercises.push({ ...ex, ...override });
      } else {
        allExercises.push(ex);
      }
    }

    // Add custom exercises
    for (const ex of this.customExercises) {
      if (!this.deactivatedIds.has(ex.id)) {
        allExercises.push(ex);
      }
    }

    return allExercises;
  }

  /**
   * Get active exercises only
   */
  static async getActiveExercises(): Promise<ExerciseDefinition[]> {
    const all = await this.getAllExercises();
    return all.filter((ex) => ex.isActive);
  }

  /**
   * Get exercise stats
   */
  static async getStats(): Promise<AdminExerciseStats> {
    await this.initialize();

    const all = await this.getAllExercises();
    const active = all.filter((ex) => ex.isActive && !this.deactivatedIds.has(ex.id));

    const byDifficulty: Record<DifficultyLevel, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    const byType: Record<ExerciseType, number> = {
      strength: 0,
      cardio: 0,
      flexibility: 0,
      hiit: 0,
    };

    const byMuscleGroup: Record<MuscleGroup, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      legs: 0,
      core: 0,
      glutes: 0,
      full_body: 0,
      cardio: 0,
    };

    for (const ex of active) {
      byDifficulty[ex.difficulty]++;
      byType[ex.type]++;
      for (const muscle of ex.muscleGroups) {
        byMuscleGroup[muscle]++;
      }
    }

    return {
      total: all.length,
      active: active.length,
      inactive: all.length - active.length,
      byDifficulty,
      byType,
      byMuscleGroup,
      customCount: this.customExercises.length,
    };
  }

  /**
   * Bulk activate/deactivate exercises
   */
  static async bulkSetActive(ids: string[], active: boolean): Promise<number> {
    await this.initialize();

    let count = 0;
    for (const id of ids) {
      if (active) {
        this.deactivatedIds.delete(id);
      } else {
        this.deactivatedIds.add(id);
      }
      count++;
    }

    await this.saveState();
    return count;
  }

  /**
   * Export exercises as JSON
   */
  static async exportExercises(): Promise<string> {
    const all = await this.getAllExercises();
    return JSON.stringify(all, null, 2);
  }

  /**
   * Import exercises from JSON
   */
  static async importExercises(jsonData: string): Promise<number> {
    await this.initialize();

    try {
      const exercises: ExerciseDefinition[] = JSON.parse(jsonData);
      let imported = 0;

      for (const ex of exercises) {
        // Validate each exercise
        const validation = this.validateExercise(ex);
        if (validation.valid) {
          // Generate new ID for imported exercises
          const newEx = {
            ...ex,
            id: `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          this.customExercises.push(newEx);
          imported++;
        }
      }

      await this.saveState();
      return imported;
    } catch (error) {
      console.error('Failed to import exercises:', error);
      return 0;
    }
  }

  // ==================== HELPER METHODS ====================

  private static calculateDifficultyScore(input: ExerciseCreateInput): number {
    let score = 1;

    // Base score from difficulty
    if (input.difficulty === 'intermediate') score = 5;
    else if (input.difficulty === 'advanced') score = 8;

    // Adjust based on type
    if (input.type === 'hiit') score += 1;
    if (input.type === 'strength') score += 0.5;

    // Adjust based on sets/reps
    if (input.baseSets >= 4) score += 1;
    if (typeof input.baseReps === 'number' && input.baseReps >= 15) score += 1;

    return Math.min(10, Math.max(1, Math.round(score)));
  }

  private static generateDefaultVideoPrompt(input: ExerciseCreateInput): string {
    return `Professional fitness trainer demonstrating ${input.name} exercise with proper form, showing ${input.muscleGroups.join(' and ')} engagement, multiple camera angles, well-lit gym environment`;
  }

  private static generateDefaultImagePrompt(input: ExerciseCreateInput): string {
    return `Athletic person performing ${input.name}, showing proper body position for ${input.muscleGroups.join(' and ')} workout, professional fitness photography`;
  }

  // ==================== AI PROMPT MANAGEMENT (ADMIN ONLY) ====================

  /**
   * Get AI prompts for a specific exercise
   * ADMIN ONLY - Users should never see these prompts
   */
  static async getExerciseAIPrompts(exerciseId: string): Promise<{
    videoPrompt: string;
    imagePrompt: string;
    exerciseName: string;
  } | null> {
    await this.initialize();

    // Check custom exercises first
    const customExercise = this.customExercises.find((ex) => ex.id === exerciseId);
    if (customExercise) {
      return {
        videoPrompt: customExercise.videoPrompt,
        imagePrompt: customExercise.imagePrompt,
        exerciseName: customExercise.name,
      };
    }

    // Check built-in exercises
    const builtInExercise = FULL_EXERCISE_DATABASE.find((ex) => ex.id === exerciseId);
    if (builtInExercise) {
      // Apply any overrides
      const override = this.exerciseOverrides.get(exerciseId);
      return {
        videoPrompt: override?.videoPrompt ?? builtInExercise.videoPrompt,
        imagePrompt: override?.imagePrompt ?? builtInExercise.imagePrompt,
        exerciseName: override?.name ?? builtInExercise.name,
      };
    }

    return null;
  }

  /**
   * Get all AI prompts for admin media generation
   * ADMIN ONLY - Users should never see these prompts
   */
  static async getAllAIPrompts(): Promise<Array<{
    id: string;
    name: string;
    difficulty: DifficultyLevel;
    videoPrompt: string;
    imagePrompt: string;
    hasVideo: boolean;
    hasImage: boolean;
  }>> {
    const allExercises = await this.getAllExercises();

    return allExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      difficulty: ex.difficulty,
      videoPrompt: ex.videoPrompt,
      imagePrompt: ex.imagePrompt,
      hasVideo: false, // Would be populated from media storage
      hasImage: false, // Would be populated from media storage
    }));
  }

  /**
   * Update AI prompts for an exercise
   * ADMIN ONLY
   */
  static async updateAIPrompts(
    exerciseId: string,
    prompts: { videoPrompt?: string; imagePrompt?: string }
  ): Promise<boolean> {
    await this.initialize();

    // Check if custom exercise
    const customIndex = this.customExercises.findIndex((ex) => ex.id === exerciseId);
    if (customIndex !== -1) {
      if (prompts.videoPrompt) {
        this.customExercises[customIndex].videoPrompt = prompts.videoPrompt;
      }
      if (prompts.imagePrompt) {
        this.customExercises[customIndex].imagePrompt = prompts.imagePrompt;
      }
      this.customExercises[customIndex].updatedAt = new Date().toISOString();
    } else {
      // Store override for built-in exercise
      const existing = this.exerciseOverrides.get(exerciseId) ?? {};
      this.exerciseOverrides.set(exerciseId, {
        ...existing,
        ...(prompts.videoPrompt && { videoPrompt: prompts.videoPrompt }),
        ...(prompts.imagePrompt && { imagePrompt: prompts.imagePrompt }),
      });
    }

    await this.saveState();
    return true;
  }

  /**
   * Get exercises grouped by difficulty for admin dashboard
   * ADMIN ONLY
   */
  static async getExercisesByDifficultyForAdmin(): Promise<{
    beginner: Array<{ id: string; name: string; videoPrompt: string; imagePrompt: string }>;
    intermediate: Array<{ id: string; name: string; videoPrompt: string; imagePrompt: string }>;
    advanced: Array<{ id: string; name: string; videoPrompt: string; imagePrompt: string }>;
  }> {
    const all = await this.getAllExercises();

    const mapExercise = (ex: ExerciseDefinition) => ({
      id: ex.id,
      name: ex.name,
      videoPrompt: ex.videoPrompt,
      imagePrompt: ex.imagePrompt,
    });

    return {
      beginner: all.filter((ex) => ex.difficulty === 'beginner').map(mapExercise),
      intermediate: all.filter((ex) => ex.difficulty === 'intermediate').map(mapExercise),
      advanced: all.filter((ex) => ex.difficulty === 'advanced').map(mapExercise),
    };
  }

  /**
   * Copy AI prompt to clipboard (for admin to paste into AI generator)
   * Returns the prompt text for the admin to use
   * ADMIN ONLY
   */
  static async getPromptForCopy(
    exerciseId: string,
    type: 'video' | 'image'
  ): Promise<string | null> {
    const prompts = await this.getExerciseAIPrompts(exerciseId);
    if (!prompts) return null;

    return type === 'video' ? prompts.videoPrompt : prompts.imagePrompt;
  }

  /**
   * Generate enhanced video prompt with specific requirements
   * ADMIN ONLY
   */
  static generateEnhancedVideoPrompt(
    exercise: ExerciseDefinition,
    options?: {
      duration?: string;
      cameraAngles?: string[];
      instructor?: string;
      setting?: string;
    }
  ): string {
    const angles = options?.cameraAngles?.join(', ') ?? 'front and side angles';
    const setting = options?.setting ?? 'professional gym studio';
    const instructor = options?.instructor ?? 'professional fitness instructor';
    const duration = options?.duration ?? '15-30 seconds';

    return `${instructor} demonstrating ${exercise.name} exercise for ${exercise.difficulty} fitness level. ` +
      `Focus on ${exercise.muscleGroups.join(', ')} muscle engagement. ` +
      `Show proper form with ${angles}, in a ${setting}. ` +
      `Exercise type: ${exercise.type}. Duration: ${duration}. ` +
      `Include: setup position, movement execution, and common form corrections.`;
  }

  /**
   * Generate enhanced image prompt with specific requirements
   * ADMIN ONLY
   */
  static generateEnhancedImagePrompt(
    exercise: ExerciseDefinition,
    options?: {
      position?: 'start' | 'mid' | 'end';
      lighting?: string;
      background?: string;
    }
  ): string {
    const position = options?.position ?? 'mid';
    const lighting = options?.lighting ?? 'professional studio lighting';
    const background = options?.background ?? 'clean gym background';

    const positionDesc = {
      start: 'starting position',
      mid: 'mid-movement showing peak contraction',
      end: 'end position showing full range of motion',
    };

    return `Athletic person performing ${exercise.name} in ${positionDesc[position]}. ` +
      `Demonstrating proper form for ${exercise.muscleGroups.join(' and ')} workout. ` +
      `${exercise.difficulty} level exercise. ${lighting}, ${background}. ` +
      `High-quality fitness photography showing muscle engagement and body alignment.`;
  }
}

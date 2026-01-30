/**
 * ADMIN CONTENT SERVICE
 *
 * Provides admin hooks for managing exercises, meals, and fasting plans.
 * All generated content defaults to AI-generated values but admin can override.
 *
 * Key Features:
 * - CRUD operations for exercises, meals, fasting plans
 * - Video/image URL management
 * - Content override system
 * - Audit logging for changes
 */

import type {
  Exercise,
  Meal,
  FastingPlan,
  FastingWindow,
  DifficultyLevel,
  MealIntensity,
  MuscleGroup,
} from '@/types/fitness';
import {
  EXERCISE_DATABASE,
  NIGERIAN_MEAL_DATABASE,
} from './personalized-plan-engine';

// ==================== TYPES ====================

export interface AdminOverride {
  id: string;
  entityType: 'exercise' | 'meal' | 'fasting';
  entityId: string;
  field: string;
  originalValue: unknown;
  newValue: unknown;
  overriddenBy: string;
  overriddenAt: string;
  reason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'override';
  entityType: 'exercise' | 'meal' | 'fasting';
  entityId: string;
  adminId: string;
  changes: Record<string, { from: unknown; to: unknown }>;
  reason?: string;
}

export interface ContentStats {
  totalExercises: number;
  exercisesByDifficulty: Record<DifficultyLevel, number>;
  totalMeals: number;
  mealsByType: Record<string, number>;
  totalFastingPlans: number;
  contentWithVideos: number;
  contentWithImages: number;
}

// ==================== IN-MEMORY STORAGE ====================

// In production, these would be database tables
let exerciseOverrides: Map<string, Partial<Exercise>> = new Map();
let mealOverrides: Map<string, Partial<Meal>> = new Map();
let customExercises: Exercise[] = [];
let customMeals: Meal[] = [];
let auditLog: AuditLogEntry[] = [];

// ==================== EXERCISE ADMIN SERVICE ====================

export class ExerciseAdminService {
  /**
   * Get all exercises (including custom and overridden)
   */
  static getAllExercises(): Exercise[] {
    // Merge database with custom exercises
    const allExercises = [...EXERCISE_DATABASE, ...customExercises];

    // Apply overrides
    return allExercises.map((exercise) => {
      const override = exerciseOverrides.get(exercise.id);
      if (override) {
        return { ...exercise, ...override };
      }
      return exercise;
    });
  }

  /**
   * Get exercise by ID
   */
  static getExerciseById(id: string): Exercise | null {
    const exercise =
      EXERCISE_DATABASE.find((e) => e.id === id) ||
      customExercises.find((e) => e.id === id);

    if (!exercise) return null;

    const override = exerciseOverrides.get(id);
    return override ? { ...exercise, ...override } : exercise;
  }

  /**
   * Get exercises by difficulty
   */
  static getExercisesByDifficulty(difficulty: DifficultyLevel): Exercise[] {
    return this.getAllExercises().filter((e) => e.difficulty === difficulty);
  }

  /**
   * Get exercises by muscle group
   */
  static getExercisesByMuscleGroup(muscleGroup: MuscleGroup): Exercise[] {
    return this.getAllExercises().filter((e) =>
      e.muscleGroups.includes(muscleGroup)
    );
  }

  /**
   * Create a new exercise
   */
  static createExercise(exercise: Omit<Exercise, 'id'>, adminId: string): Exercise {
    const newExercise: Exercise = {
      ...exercise,
      id: `custom-ex-${Date.now()}`,
    };

    customExercises.push(newExercise);

    // Log the creation
    this.logAction('create', 'exercise', newExercise.id, adminId, {
      name: { from: null, to: newExercise.name },
    });

    return newExercise;
  }

  /**
   * Update an exercise (creates override)
   */
  static updateExercise(
    id: string,
    updates: Partial<Exercise>,
    adminId: string,
    reason?: string
  ): Exercise | null {
    const original = this.getExerciseById(id);
    if (!original) return null;

    // Store override
    const existingOverride = exerciseOverrides.get(id) ?? {};
    exerciseOverrides.set(id, { ...existingOverride, ...updates });

    // Log the changes
    const changes: Record<string, { from: unknown; to: unknown }> = {};
    Object.keys(updates).forEach((key) => {
      changes[key] = {
        from: original[key as keyof Exercise],
        to: updates[key as keyof Exercise],
      };
    });

    this.logAction('update', 'exercise', id, adminId, changes, reason);

    return this.getExerciseById(id);
  }

  /**
   * Update exercise video URL
   */
  static updateExerciseVideo(
    id: string,
    videoUrl: string,
    adminId: string
  ): Exercise | null {
    return this.updateExercise(id, { videoUrl }, adminId, 'Video URL update');
  }

  /**
   * Update exercise thumbnail
   */
  static updateExerciseThumbnail(
    id: string,
    thumbnailUrl: string,
    adminId: string
  ): Exercise | null {
    return this.updateExercise(id, { thumbnailUrl }, adminId, 'Thumbnail update');
  }

  /**
   * Update exercise sets/reps/duration
   */
  static updateExerciseProgression(
    id: string,
    progression: { sets?: number; reps?: number | string; duration?: number },
    adminId: string
  ): Exercise | null {
    return this.updateExercise(id, progression, adminId, 'Progression update');
  }

  /**
   * Delete a custom exercise (cannot delete database exercises)
   */
  static deleteExercise(id: string, adminId: string): boolean {
    const index = customExercises.findIndex((e) => e.id === id);
    if (index === -1) return false;

    const deleted = customExercises.splice(index, 1)[0];
    exerciseOverrides.delete(id);

    this.logAction('delete', 'exercise', id, adminId, {
      name: { from: deleted.name, to: null },
    });

    return true;
  }

  /**
   * Reset an exercise to default (remove overrides)
   */
  static resetExercise(id: string, adminId: string): Exercise | null {
    const hadOverride = exerciseOverrides.has(id);
    exerciseOverrides.delete(id);

    if (hadOverride) {
      this.logAction('update', 'exercise', id, adminId, {
        _reset: { from: 'overridden', to: 'default' },
      });
    }

    return this.getExerciseById(id);
  }

  private static logAction(
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    adminId: string,
    changes: Record<string, { from: unknown; to: unknown }>,
    reason?: string
  ): void {
    auditLog.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      adminId,
      changes,
      reason,
    });
  }
}

// ==================== MEAL ADMIN SERVICE ====================

export class MealAdminService {
  /**
   * Get all meals (including custom and overridden)
   */
  static getAllMeals(): Meal[] {
    const allMeals = [...NIGERIAN_MEAL_DATABASE, ...customMeals];

    return allMeals.map((meal) => {
      const override = mealOverrides.get(meal.id);
      if (override) {
        return { ...meal, ...override };
      }
      return meal;
    });
  }

  /**
   * Get meal by ID
   */
  static getMealById(id: string): Meal | null {
    const meal =
      NIGERIAN_MEAL_DATABASE.find((m) => m.id === id) ||
      customMeals.find((m) => m.id === id);

    if (!meal) return null;

    const override = mealOverrides.get(id);
    return override ? { ...meal, ...override } : meal;
  }

  /**
   * Get meals by type
   */
  static getMealsByType(type: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Meal[] {
    return this.getAllMeals().filter((m) => m.type === type);
  }

  /**
   * Get meals by calorie range
   */
  static getMealsByCalorieRange(minCal: number, maxCal: number): Meal[] {
    return this.getAllMeals().filter(
      (m) => m.nutrition.calories >= minCal && m.nutrition.calories <= maxCal
    );
  }

  /**
   * Create a new meal
   */
  static createMeal(meal: Omit<Meal, 'id'>, adminId: string): Meal {
    const newMeal: Meal = {
      ...meal,
      id: `custom-meal-${Date.now()}`,
    };

    customMeals.push(newMeal);

    this.logAction('create', 'meal', newMeal.id, adminId, {
      name: { from: null, to: newMeal.name },
    });

    return newMeal;
  }

  /**
   * Update a meal (creates override)
   */
  static updateMeal(
    id: string,
    updates: Partial<Meal>,
    adminId: string,
    reason?: string
  ): Meal | null {
    const original = this.getMealById(id);
    if (!original) return null;

    const existingOverride = mealOverrides.get(id) ?? {};
    mealOverrides.set(id, { ...existingOverride, ...updates });

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    Object.keys(updates).forEach((key) => {
      changes[key] = {
        from: original[key as keyof Meal],
        to: updates[key as keyof Meal],
      };
    });

    this.logAction('update', 'meal', id, adminId, changes, reason);

    return this.getMealById(id);
  }

  /**
   * Update meal image URL
   */
  static updateMealImage(id: string, imageUrl: string, adminId: string): Meal | null {
    return this.updateMeal(id, { imageUrl }, adminId, 'Image URL update');
  }

  /**
   * Update meal nutrition info
   */
  static updateMealNutrition(
    id: string,
    nutrition: Partial<Meal['nutrition']>,
    adminId: string
  ): Meal | null {
    const original = this.getMealById(id);
    if (!original) return null;

    return this.updateMeal(
      id,
      { nutrition: { ...original.nutrition, ...nutrition } },
      adminId,
      'Nutrition update'
    );
  }

  /**
   * Update meal ingredients
   */
  static updateMealIngredients(
    id: string,
    ingredients: Meal['ingredients'],
    adminId: string
  ): Meal | null {
    return this.updateMeal(id, { ingredients }, adminId, 'Ingredients update');
  }

  /**
   * Delete a custom meal
   */
  static deleteMeal(id: string, adminId: string): boolean {
    const index = customMeals.findIndex((m) => m.id === id);
    if (index === -1) return false;

    const deleted = customMeals.splice(index, 1)[0];
    mealOverrides.delete(id);

    this.logAction('delete', 'meal', id, adminId, {
      name: { from: deleted.name, to: null },
    });

    return true;
  }

  /**
   * Reset a meal to default
   */
  static resetMeal(id: string, adminId: string): Meal | null {
    const hadOverride = mealOverrides.has(id);
    mealOverrides.delete(id);

    if (hadOverride) {
      this.logAction('update', 'meal', id, adminId, {
        _reset: { from: 'overridden', to: 'default' },
      });
    }

    return this.getMealById(id);
  }

  private static logAction(
    action: AuditLogEntry['action'],
    entityType: AuditLogEntry['entityType'],
    entityId: string,
    adminId: string,
    changes: Record<string, { from: unknown; to: unknown }>,
    reason?: string
  ): void {
    auditLog.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      entityType,
      entityId,
      adminId,
      changes,
      reason,
    });
  }
}

// ==================== FASTING ADMIN SERVICE ====================

// Custom fasting plans storage
let customFastingPlans: Map<FastingPlan, FastingWindow> = new Map();

export class FastingAdminService {
  /**
   * Get all fasting plan options
   */
  static getAllFastingPlans(): FastingWindow[] {
    const defaultPlans: FastingWindow[] = [
      {
        plan: '12:12',
        eatingStartTime: '08:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '08:00',
        eatingHours: 12,
        fastingHours: 12,
      },
      {
        plan: '14:10',
        eatingStartTime: '10:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '10:00',
        eatingHours: 10,
        fastingHours: 14,
      },
      {
        plan: '16:8',
        eatingStartTime: '12:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '12:00',
        eatingHours: 8,
        fastingHours: 16,
      },
      {
        plan: '18:6',
        eatingStartTime: '14:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '14:00',
        eatingHours: 6,
        fastingHours: 18,
      },
    ];

    // Apply any custom overrides
    return defaultPlans.map((plan) => {
      const customPlan = customFastingPlans.get(plan.plan);
      return customPlan ?? plan;
    });
  }

  /**
   * Get fasting plan by type
   */
  static getFastingPlan(plan: FastingPlan): FastingWindow | null {
    const customPlan = customFastingPlans.get(plan);
    if (customPlan) return customPlan;

    return this.getAllFastingPlans().find((p) => p.plan === plan) ?? null;
  }

  /**
   * Update fasting plan timing
   */
  static updateFastingPlanTiming(
    plan: FastingPlan,
    eatingStartTime: string,
    adminId: string
  ): FastingWindow | null {
    const existing = this.getFastingPlan(plan);
    if (!existing) return null;

    const [startH, startM] = eatingStartTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = (startMinutes + existing.eatingHours * 60) % (24 * 60);

    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;
    const eatingEndTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    const updatedPlan: FastingWindow = {
      ...existing,
      eatingStartTime,
      eatingEndTime,
      fastingStartTime: eatingEndTime,
      fastingEndTime: eatingStartTime,
    };

    customFastingPlans.set(plan, updatedPlan);

    auditLog.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'update',
      entityType: 'fasting',
      entityId: plan,
      adminId,
      changes: {
        eatingStartTime: { from: existing.eatingStartTime, to: eatingStartTime },
        eatingEndTime: { from: existing.eatingEndTime, to: eatingEndTime },
      },
    });

    return updatedPlan;
  }

  /**
   * Reset fasting plan to default
   */
  static resetFastingPlan(plan: FastingPlan, adminId: string): FastingWindow | null {
    const hadCustom = customFastingPlans.has(plan);
    customFastingPlans.delete(plan);

    if (hadCustom) {
      auditLog.push({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        action: 'update',
        entityType: 'fasting',
        entityId: plan,
        adminId,
        changes: {
          _reset: { from: 'custom', to: 'default' },
        },
      });
    }

    return this.getFastingPlan(plan);
  }
}

// ==================== AUDIT SERVICE ====================

export class AuditService {
  /**
   * Get all audit log entries
   */
  static getAuditLog(): AuditLogEntry[] {
    return [...auditLog].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Get audit log by entity type
   */
  static getAuditLogByType(entityType: AuditLogEntry['entityType']): AuditLogEntry[] {
    return this.getAuditLog().filter((entry) => entry.entityType === entityType);
  }

  /**
   * Get audit log by entity ID
   */
  static getAuditLogByEntity(entityId: string): AuditLogEntry[] {
    return this.getAuditLog().filter((entry) => entry.entityId === entityId);
  }

  /**
   * Get audit log by admin
   */
  static getAuditLogByAdmin(adminId: string): AuditLogEntry[] {
    return this.getAuditLog().filter((entry) => entry.adminId === adminId);
  }

  /**
   * Get audit log within date range
   */
  static getAuditLogByDateRange(startDate: Date, endDate: Date): AuditLogEntry[] {
    return this.getAuditLog().filter((entry) => {
      const entryDate = new Date(entry.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Clear audit log (admin only)
   */
  static clearAuditLog(adminId: string): void {
    const count = auditLog.length;
    auditLog = [];

    auditLog.push({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'delete',
      entityType: 'exercise', // Use exercise as placeholder
      entityId: 'audit-log',
      adminId,
      changes: {
        _clear: { from: count, to: 0 },
      },
      reason: 'Audit log cleared',
    });
  }
}

// ==================== CONTENT STATS SERVICE ====================

export class ContentStatsService {
  /**
   * Get overall content statistics
   */
  static getStats(): ContentStats {
    const exercises = ExerciseAdminService.getAllExercises();
    const meals = MealAdminService.getAllMeals();

    const exercisesByDifficulty: Record<DifficultyLevel, number> = {
      beginner: exercises.filter((e) => e.difficulty === 'beginner').length,
      intermediate: exercises.filter((e) => e.difficulty === 'intermediate').length,
      advanced: exercises.filter((e) => e.difficulty === 'advanced').length,
    };

    const mealsByType: Record<string, number> = {};
    meals.forEach((meal) => {
      mealsByType[meal.type] = (mealsByType[meal.type] ?? 0) + 1;
    });

    const contentWithVideos =
      exercises.filter((e) => e.videoUrl && e.videoUrl.length > 0).length +
      meals.filter((m) => m.videoUrl && m.videoUrl.length > 0).length;

    const contentWithImages =
      exercises.filter((e) => e.thumbnailUrl && e.thumbnailUrl.length > 0).length +
      meals.filter((m) => m.imageUrl && m.imageUrl.length > 0).length;

    return {
      totalExercises: exercises.length,
      exercisesByDifficulty,
      totalMeals: meals.length,
      mealsByType,
      totalFastingPlans: 4,
      contentWithVideos,
      contentWithImages,
    };
  }

  /**
   * Get exercises without videos
   */
  static getExercisesWithoutVideos(): Exercise[] {
    return ExerciseAdminService.getAllExercises().filter(
      (e) => !e.videoUrl || e.videoUrl.length === 0
    );
  }

  /**
   * Get meals without images
   */
  static getMealsWithoutImages(): Meal[] {
    return MealAdminService.getAllMeals().filter(
      (m) => !m.imageUrl || m.imageUrl.length === 0
    );
  }
}

export default {
  ExerciseAdminService,
  MealAdminService,
  FastingAdminService,
  AuditService,
  ContentStatsService,
};

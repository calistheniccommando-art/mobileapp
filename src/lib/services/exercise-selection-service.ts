/**
 * EXERCISE SELECTION SERVICE
 *
 * Dynamically selects exercises based on:
 * - User's BMI and weight
 * - Primary goal (weight loss, muscle gain, toning)
 * - Experience level and fitness assessment
 * - Day number in program (progression)
 * - Target muscle groups for the day
 */

import type { CommandoOnboardingData } from '@/types/commando';
import type { DifficultyLevel, MuscleGroup } from '@/types/fitness';
import {
  FULL_EXERCISE_DATABASE,
  getExercisesByDifficulty,
  getExercisesByMuscleGroup,
  type ExerciseDefinition,
} from '@/lib/data/exercise-library';
import { ProgressionEngine, type ProgressionFactors } from '@/lib/services/progression-engine';

// ==================== TYPES ====================

export interface ExerciseSelectionParams {
  userData: CommandoOnboardingData;
  dayNumber: number;
  targetMuscleGroups?: MuscleGroup[];
  exerciseCount?: number;
  includeWarmup?: boolean;
  includeCooldown?: boolean;
}

export interface SelectedExercise extends ExerciseDefinition {
  adjustedSets: number;
  adjustedReps: number | string;
  adjustedDuration?: number;
  adjustedRestTime: number;
  orderIndex: number;
}

export interface DailyWorkout {
  dayNumber: number;
  focusArea: string;
  difficulty: DifficultyLevel;
  warmupExercises: SelectedExercise[];
  mainExercises: SelectedExercise[];
  cooldownExercises: SelectedExercise[];
  totalDuration: number; // minutes
  totalCalories: number;
  progressionMessage: string;
}

// ==================== WORKOUT TEMPLATES ====================

const DAILY_FOCUS_ROTATION: { muscles: MuscleGroup[]; name: string }[] = [
  { muscles: ['chest', 'shoulders', 'triceps'], name: 'Push (Chest, Shoulders, Triceps)' },
  { muscles: ['back', 'biceps'], name: 'Pull (Back, Biceps)' },
  { muscles: ['legs', 'glutes'], name: 'Legs & Glutes' },
  { muscles: ['core'], name: 'Core & Stability' },
  { muscles: ['chest', 'shoulders', 'triceps'], name: 'Push (Chest, Shoulders, Triceps)' },
  { muscles: ['back', 'biceps'], name: 'Pull (Back, Biceps)' },
  { muscles: ['full_body', 'cardio'], name: 'Active Recovery & Cardio' },
];

// ==================== EXERCISE SELECTION SERVICE ====================

export class ExerciseSelectionService {
  /**
   * Generate a complete daily workout based on user profile and day number
   */
  static generateDailyWorkout(params: ExerciseSelectionParams): DailyWorkout {
    const {
      userData,
      dayNumber,
      targetMuscleGroups,
      exerciseCount = 6,
      includeWarmup = true,
      includeCooldown = true,
    } = params;

    // Get day's focus area
    const dayIndex = (dayNumber - 1) % 7;
    const dayFocus = DAILY_FOCUS_ROTATION[dayIndex];
    const muscles = targetMuscleGroups ?? dayFocus.muscles;

    // Determine user's difficulty level
    const userDifficulty = this.getUserDifficulty(userData);

    // Calculate progression factors
    const progressionFactors = this.calculateProgressionFactors(userData, dayNumber);

    // Get progression adjustments
    const adjustments = ProgressionEngine.calculateAdjustments(userData, progressionFactors);

    // Select exercises
    const mainExercises = this.selectMainExercises(
      muscles,
      userDifficulty,
      exerciseCount,
      adjustments
    );

    const warmupExercises = includeWarmup
      ? this.selectWarmupExercises(muscles, adjustments)
      : [];

    const cooldownExercises = includeCooldown
      ? this.selectCooldownExercises(adjustments)
      : [];

    // Calculate totals
    const allExercises = [...warmupExercises, ...mainExercises, ...cooldownExercises];
    const totalDuration = this.calculateTotalDuration(allExercises);
    const totalCalories = this.calculateTotalCalories(allExercises, totalDuration);

    return {
      dayNumber,
      focusArea: dayFocus.name,
      difficulty: userDifficulty,
      warmupExercises,
      mainExercises,
      cooldownExercises,
      totalDuration,
      totalCalories,
      progressionMessage: adjustments.progressionMessage,
    };
  }

  /**
   * Determine user's difficulty level based on their profile
   */
  static getUserDifficulty(userData: CommandoOnboardingData): DifficultyLevel {
    // Use fitness assessment if available
    if (userData.fitnessAssessment?.overallLevel) {
      return userData.fitnessAssessment.overallLevel;
    }

    // Calculate BMI
    const bmi = userData.weightKg && userData.heightCm
      ? userData.weightKg / Math.pow(userData.heightCm / 100, 2)
      : 25;

    // Determine based on experience and BMI
    const activityLevel = userData.activityLevel ?? 'sedentary';

    if (activityLevel === 'sedentary' || bmi >= 30) {
      return 'beginner';
    } else if (activityLevel === 'very_active' && bmi < 25) {
      return 'advanced';
    } else {
      return 'intermediate';
    }
  }

  /**
   * Calculate progression factors for the user
   */
  private static calculateProgressionFactors(
    userData: CommandoOnboardingData,
    dayNumber: number
  ): ProgressionFactors {
    // In a real app, these would come from progress store
    // For now, we estimate based on day number
    const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;
    const estimatedCompletionRate = Math.min(85, 60 + dayNumber * 0.5);
    const estimatedStreak = Math.min(dayNumber, 14);

    return {
      dayNumber,
      weekNumber,
      completionRate: estimatedCompletionRate,
      streakDays: estimatedStreak,
      averageCompletionPercent: estimatedCompletionRate,
      fastingCompliance: 75,
      totalExercisesCompleted: dayNumber * 6,
    };
  }

  /**
   * Select main exercises for the workout
   */
  private static selectMainExercises(
    targetMuscles: MuscleGroup[],
    difficulty: DifficultyLevel,
    count: number,
    adjustments: ReturnType<typeof ProgressionEngine.calculateAdjustments>
  ): SelectedExercise[] {
    // Get exercises matching difficulty
    let availableExercises = getExercisesByDifficulty(difficulty);

    // Also include adjacent difficulty levels for variety
    if (difficulty === 'intermediate') {
      availableExercises = [
        ...availableExercises,
        ...getExercisesByDifficulty('beginner').slice(0, 5),
      ];
    } else if (difficulty === 'advanced') {
      availableExercises = [
        ...availableExercises,
        ...getExercisesByDifficulty('intermediate').slice(0, 5),
      ];
    }

    // Filter by target muscle groups
    const targetExercises = availableExercises.filter((ex) =>
      ex.muscleGroups.some((muscle) => targetMuscles.includes(muscle))
    );

    // Sort by difficulty score and select top exercises
    const sortedExercises = targetExercises.sort((a, b) => a.difficultyScore - b.difficultyScore);

    // Select diverse exercises (avoid duplicates of same type)
    const selected: ExerciseDefinition[] = [];
    const usedTypes = new Set<string>();

    for (const ex of sortedExercises) {
      if (selected.length >= count) break;

      // Ensure variety
      const typeKey = `${ex.type}-${ex.muscleGroups[0]}`;
      if (!usedTypes.has(typeKey) || selected.length < count / 2) {
        selected.push(ex);
        usedTypes.add(typeKey);
      }
    }

    // If we don't have enough, add more from any matching muscle group
    if (selected.length < count) {
      for (const muscle of targetMuscles) {
        const muscleExercises = getExercisesByMuscleGroup(muscle);
        for (const ex of muscleExercises) {
          if (selected.length >= count) break;
          if (!selected.includes(ex)) {
            selected.push(ex);
          }
        }
      }
    }

    // Apply adjustments and create selected exercises
    return selected.map((ex, index) => this.applyAdjustments(ex, adjustments, index));
  }

  /**
   * Select warmup exercises
   */
  private static selectWarmupExercises(
    targetMuscles: MuscleGroup[],
    adjustments: ReturnType<typeof ProgressionEngine.calculateAdjustments>
  ): SelectedExercise[] {
    // Find beginner-level dynamic exercises for warmup
    const warmupCandidates = FULL_EXERCISE_DATABASE.filter(
      (ex) =>
        ex.difficulty === 'beginner' &&
        (ex.type === 'cardio' || ex.type === 'flexibility') &&
        ex.difficultyScore <= 2
    );

    // Select 2-3 warmup exercises
    const selected = warmupCandidates.slice(0, 3);

    return selected.map((ex, index) =>
      this.applyAdjustments(ex, adjustments, index, { isWarmup: true })
    );
  }

  /**
   * Select cooldown exercises
   */
  private static selectCooldownExercises(
    adjustments: ReturnType<typeof ProgressionEngine.calculateAdjustments>
  ): SelectedExercise[] {
    // Find flexibility and low-intensity exercises
    const cooldownCandidates = FULL_EXERCISE_DATABASE.filter(
      (ex) =>
        ex.difficulty === 'beginner' &&
        ex.type === 'flexibility' &&
        ex.difficultyScore <= 2
    );

    // If not enough flexibility exercises, use low-intensity ones
    const selected = cooldownCandidates.length >= 2
      ? cooldownCandidates.slice(0, 2)
      : FULL_EXERCISE_DATABASE.filter((ex) => ex.difficultyScore <= 1).slice(0, 2);

    return selected.map((ex, index) =>
      this.applyAdjustments(ex, adjustments, index, { isCooldown: true })
    );
  }

  /**
   * Apply progression adjustments to an exercise
   */
  private static applyAdjustments(
    exercise: ExerciseDefinition,
    adjustments: ReturnType<typeof ProgressionEngine.calculateAdjustments>,
    orderIndex: number,
    options: { isWarmup?: boolean; isCooldown?: boolean } = {}
  ): SelectedExercise {
    let { sets, reps, duration, restTime } = ProgressionEngine.applyExerciseAdjustments(
      exercise.baseSets,
      exercise.baseReps,
      exercise.baseDuration,
      exercise.baseRestTime,
      adjustments
    );

    // Warmup exercises are lighter
    if (options.isWarmup) {
      sets = Math.max(1, Math.floor(sets * 0.5));
      if (typeof reps === 'number') {
        reps = Math.max(5, Math.floor(reps * 0.6));
      }
      if (duration) {
        duration = Math.floor(duration * 0.5);
      }
    }

    // Cooldown exercises are gentler
    if (options.isCooldown) {
      sets = 1;
      if (duration) {
        duration = Math.max(20, duration);
      }
      restTime = Math.max(15, Math.floor((restTime ?? 30) * 0.5));
    }

    return {
      ...exercise,
      adjustedSets: sets,
      adjustedReps: reps,
      adjustedDuration: duration,
      adjustedRestTime: restTime ?? exercise.baseRestTime,
      orderIndex,
    };
  }

  /**
   * Calculate total workout duration
   */
  private static calculateTotalDuration(exercises: SelectedExercise[]): number {
    let totalSeconds = 0;

    for (const ex of exercises) {
      const setsCount = ex.adjustedSets;
      const repTime = ex.adjustedDuration ?? 30; // Default 30 seconds per set
      const restTime = ex.adjustedRestTime;

      // Time per exercise = (sets * rep time) + (sets - 1) * rest time
      totalSeconds += setsCount * repTime + (setsCount - 1) * restTime;
    }

    return Math.ceil(totalSeconds / 60); // Convert to minutes
  }

  /**
   * Calculate total calories burned
   */
  private static calculateTotalCalories(exercises: SelectedExercise[], durationMinutes: number): number {
    // Average calories per minute weighted by exercise type
    const avgCaloriesPerMinute = exercises.reduce(
      (sum, ex) => sum + ex.caloriesPerMinute,
      0
    ) / Math.max(1, exercises.length);

    return Math.round(avgCaloriesPerMinute * durationMinutes);
  }

  /**
   * Get exercise sequence for a specific day (no skipping allowed)
   */
  static getExerciseSequence(workout: DailyWorkout): SelectedExercise[] {
    return [
      ...workout.warmupExercises,
      ...workout.mainExercises,
      ...workout.cooldownExercises,
    ].map((ex, index) => ({ ...ex, orderIndex: index }));
  }

  /**
   * Check if user can proceed to next exercise
   * Returns false if current exercise is not marked complete
   */
  static canProceedToNext(
    currentIndex: number,
    completedIndices: number[]
  ): boolean {
    // User must complete exercises in order
    for (let i = 0; i < currentIndex; i++) {
      if (!completedIndices.includes(i)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Get recommended exercises for a specific goal
   */
  static getRecommendedExercises(
    goal: 'lose_weight' | 'build_muscle' | 'improve_strength' | 'increase_flexibility',
    difficulty: DifficultyLevel,
    count: number = 10
  ): ExerciseDefinition[] {
    let filtered: ExerciseDefinition[];

    switch (goal) {
      case 'lose_weight':
        // Prioritize cardio and HIIT
        filtered = FULL_EXERCISE_DATABASE.filter(
          (ex) => ex.type === 'cardio' || ex.type === 'hiit'
        );
        break;
      case 'build_muscle':
        // Prioritize strength exercises
        filtered = FULL_EXERCISE_DATABASE.filter(
          (ex) => ex.type === 'strength' && ex.caloriesPerMinute >= 6
        );
        break;
      case 'improve_strength':
        // Prioritize high-difficulty strength exercises
        filtered = FULL_EXERCISE_DATABASE.filter(
          (ex) => ex.type === 'strength' && ex.difficultyScore >= 6
        );
        break;
      case 'increase_flexibility':
        filtered = FULL_EXERCISE_DATABASE.filter((ex) => ex.type === 'flexibility');
        break;
      default:
        filtered = getExercisesByDifficulty(difficulty);
    }

    // Also filter by difficulty
    const appropriateLevel = filtered.filter((ex) => ex.difficulty === difficulty);

    // Sort by relevance (difficulty score and calories)
    return appropriateLevel
      .sort((a, b) => b.caloriesPerMinute - a.caloriesPerMinute)
      .slice(0, count);
  }
}

/**
 * PROGRESSION ENGINE
 *
 * Adapts workout difficulty, meal portions, and fasting hours based on:
 * - User's current BMI and weight
 * - Goal (weight loss, muscle gain, toning)
 * - Experience level and fitness assessment
 * - Progress history and completion rates
 */

import type { CommandoOnboardingData } from '@/types/commando';
import type { DifficultyLevel, FastingPlan } from '@/types/fitness';
import type { DailyProgress, WeeklyStats } from '@/lib/state/progress-store';

// ==================== TYPES ====================

export interface ProgressionAdjustments {
  // Exercise adjustments
  setsMultiplier: number;
  repsMultiplier: number;
  durationMultiplier: number;
  restTimeMultiplier: number;

  // Meal adjustments
  calorieAdjustment: number; // +/- calories
  portionMultiplier: number;
  proteinMultiplier: number;

  // Fasting adjustments
  recommendedFastingPlan: FastingPlan;
  fastingHoursAdjustment: number;

  // Difficulty progression
  shouldIncreaseDifficulty: boolean;
  suggestedDifficulty: DifficultyLevel;

  // Feedback
  progressionMessage: string;
  encouragement: string;
}

export interface ProgressionFactors {
  dayNumber: number;
  weekNumber: number;
  completionRate: number; // 0-100
  streakDays: number;
  averageCompletionPercent: number;
  fastingCompliance: number;
  totalExercisesCompleted: number;
}

// ==================== PROGRESSION RULES ====================

const PROGRESSION_THRESHOLDS = {
  // Increase difficulty after these milestones
  setsIncrease: {
    everyWeeks: 2, // Increase sets every 2 weeks
    maxMultiplier: 1.5,
  },
  repsIncrease: {
    everyDays: 7, // Increase reps weekly
    maxMultiplier: 1.3,
  },
  difficultyUpgrade: {
    requiredCompletionRate: 80, // Must complete 80% to upgrade
    requiredStreak: 7, // 7 day streak
    requiredWeeks: 4, // After 4 weeks
  },
};

// ==================== PROGRESSION ENGINE ====================

export class ProgressionEngine {
  /**
   * Calculate progression adjustments based on user data and progress
   */
  static calculateAdjustments(
    userData: CommandoOnboardingData,
    progressFactors: ProgressionFactors,
    weeklyStats?: WeeklyStats
  ): ProgressionAdjustments {
    const { dayNumber, weekNumber, completionRate, streakDays, averageCompletionPercent } = progressFactors;

    // Base adjustments
    let setsMultiplier = 1.0;
    let repsMultiplier = 1.0;
    let durationMultiplier = 1.0;
    let restTimeMultiplier = 1.0;
    let calorieAdjustment = 0;
    let portionMultiplier = 1.0;
    let proteinMultiplier = 1.0;

    // Week-based sets progression (every 2 weeks)
    if (weekNumber > 0 && completionRate >= 70) {
      const weeksProgressed = Math.floor(weekNumber / PROGRESSION_THRESHOLDS.setsIncrease.everyWeeks);
      setsMultiplier = Math.min(
        1 + weeksProgressed * 0.1,
        PROGRESSION_THRESHOLDS.setsIncrease.maxMultiplier
      );
    }

    // Day-based reps progression (weekly)
    if (dayNumber > 0 && completionRate >= 70) {
      const weeksProgressed = Math.floor(dayNumber / PROGRESSION_THRESHOLDS.repsIncrease.everyDays);
      repsMultiplier = Math.min(
        1 + weeksProgressed * 0.05,
        PROGRESSION_THRESHOLDS.repsIncrease.maxMultiplier
      );
    }

    // Timed exercise duration progression
    if (dayNumber > 14 && completionRate >= 80) {
      durationMultiplier = 1.1; // 10% longer timed exercises after 2 weeks
    }
    if (dayNumber > 28 && completionRate >= 85) {
      durationMultiplier = 1.2; // 20% longer after 4 weeks
    }

    // Rest time reduction for advanced users
    if (completionRate >= 90 && streakDays >= 7) {
      restTimeMultiplier = 0.9; // 10% shorter rest
    }

    // Calorie adjustments based on goal and progress
    const goal = userData.primaryGoal;
    if (goal === 'lose_weight') {
      // Progressive calorie reduction for weight loss
      if (weekNumber >= 2 && completionRate >= 75) {
        calorieAdjustment = -100; // Reduce by 100 after 2 weeks
      }
      if (weekNumber >= 4 && completionRate >= 80) {
        calorieAdjustment = -200; // Reduce by 200 after 4 weeks
      }
    } else if (goal === 'build_muscle') {
      // Progressive calorie increase for muscle gain
      if (weekNumber >= 2 && completionRate >= 80) {
        calorieAdjustment = 150;
        proteinMultiplier = 1.1;
      }
      if (weekNumber >= 4 && completionRate >= 85) {
        calorieAdjustment = 250;
        proteinMultiplier = 1.15;
      }
    }

    // Portion adjustment for consistency
    if (averageCompletionPercent >= 85) {
      portionMultiplier = goal === 'build_muscle' ? 1.1 : 0.95;
    }

    // Fasting adjustments
    const { recommendedFastingPlan, fastingHoursAdjustment } = this.calculateFastingProgression(
      userData,
      progressFactors
    );

    // Difficulty upgrade check
    const { shouldIncreaseDifficulty, suggestedDifficulty } = this.checkDifficultyUpgrade(
      userData,
      progressFactors
    );

    // Generate messages
    const { progressionMessage, encouragement } = this.generateProgressionMessages(
      userData,
      progressFactors,
      shouldIncreaseDifficulty
    );

    return {
      setsMultiplier,
      repsMultiplier,
      durationMultiplier,
      restTimeMultiplier,
      calorieAdjustment,
      portionMultiplier,
      proteinMultiplier,
      recommendedFastingPlan,
      fastingHoursAdjustment,
      shouldIncreaseDifficulty,
      suggestedDifficulty,
      progressionMessage,
      encouragement,
    };
  }

  /**
   * Calculate fasting progression
   */
  private static calculateFastingProgression(
    userData: CommandoOnboardingData,
    factors: ProgressionFactors
  ): { recommendedFastingPlan: FastingPlan; fastingHoursAdjustment: number } {
    const currentBMI = userData.weightKg && userData.heightCm
      ? userData.weightKg / Math.pow(userData.heightCm / 100, 2)
      : 25;

    let recommendedFastingPlan: FastingPlan = '16:8';
    let fastingHoursAdjustment = 0;

    // Progress to more aggressive fasting for weight loss
    if (userData.primaryGoal === 'lose_weight') {
      if (factors.fastingCompliance >= 80 && factors.weekNumber >= 2) {
        if (currentBMI >= 25) {
          recommendedFastingPlan = '18:6';
          fastingHoursAdjustment = 2;
        }
      }
    }

    // Ease fasting for muscle building
    if (userData.primaryGoal === 'build_muscle') {
      if (factors.weekNumber >= 2) {
        recommendedFastingPlan = '14:10';
        fastingHoursAdjustment = -2;
      }
    }

    return { recommendedFastingPlan, fastingHoursAdjustment };
  }

  /**
   * Check if user should upgrade difficulty
   */
  private static checkDifficultyUpgrade(
    userData: CommandoOnboardingData,
    factors: ProgressionFactors
  ): { shouldIncreaseDifficulty: boolean; suggestedDifficulty: DifficultyLevel } {
    const currentLevel = userData.fitnessAssessment?.overallLevel ?? 'beginner';
    const thresholds = PROGRESSION_THRESHOLDS.difficultyUpgrade;

    const meetsRequirements =
      factors.completionRate >= thresholds.requiredCompletionRate &&
      factors.streakDays >= thresholds.requiredStreak &&
      factors.weekNumber >= thresholds.requiredWeeks;

    let suggestedDifficulty: DifficultyLevel = currentLevel;
    let shouldIncreaseDifficulty = false;

    if (meetsRequirements) {
      if (currentLevel === 'beginner') {
        suggestedDifficulty = 'intermediate';
        shouldIncreaseDifficulty = true;
      } else if (currentLevel === 'intermediate') {
        suggestedDifficulty = 'advanced';
        shouldIncreaseDifficulty = true;
      }
    }

    return { shouldIncreaseDifficulty, suggestedDifficulty };
  }

  /**
   * Generate progression messages
   */
  private static generateProgressionMessages(
    userData: CommandoOnboardingData,
    factors: ProgressionFactors,
    shouldUpgrade: boolean
  ): { progressionMessage: string; encouragement: string } {
    const isMale = userData.gender === 'male';
    let progressionMessage = '';
    let encouragement = '';

    // Week-based messages
    if (factors.weekNumber === 1) {
      progressionMessage = isMale
        ? 'Week 1: Foundation building. Master the basics, soldier.'
        : 'Week 1: Building your foundation. You\'re doing amazing!';
    } else if (factors.weekNumber === 2) {
      progressionMessage = isMale
        ? 'Week 2: Intensity increasing. Sets and reps progressing.'
        : 'Week 2: Growing stronger! We\'re adding a little more challenge.';
    } else if (factors.weekNumber === 4) {
      progressionMessage = isMale
        ? 'Week 4: Tactical upgrade. You\'re becoming a machine.'
        : 'Week 4: Look how far you\'ve come! Time to level up.';
    }

    // Streak-based encouragement
    if (factors.streakDays >= 7) {
      encouragement = isMale
        ? `${factors.streakDays}-day streak! Unstoppable discipline.`
        : `${factors.streakDays} days in a row! You're incredible!`;
    } else if (factors.streakDays >= 3) {
      encouragement = isMale
        ? 'Momentum building. Keep pushing.'
        : 'You\'re on a roll! Keep it up!';
    }

    // Upgrade suggestion
    if (shouldUpgrade) {
      progressionMessage = isMale
        ? 'PROMOTION READY: You\'ve earned the right to advance.'
        : 'You\'re ready for the next level! Congratulations!';
    }

    return { progressionMessage, encouragement };
  }

  /**
   * Apply adjustments to exercise parameters
   */
  static applyExerciseAdjustments(
    baseSets: number,
    baseReps: number | string,
    baseDuration: number | undefined,
    baseRestTime: number | undefined,
    adjustments: ProgressionAdjustments
  ): { sets: number; reps: number | string; duration?: number; restTime?: number } {
    const adjustedSets = Math.round(baseSets * adjustments.setsMultiplier);

    let adjustedReps: number | string = baseReps;
    if (typeof baseReps === 'number') {
      adjustedReps = Math.round(baseReps * adjustments.repsMultiplier);
    }

    const adjustedDuration = baseDuration
      ? Math.round(baseDuration * adjustments.durationMultiplier)
      : undefined;

    const adjustedRestTime = baseRestTime
      ? Math.round(baseRestTime * adjustments.restTimeMultiplier)
      : undefined;

    return {
      sets: adjustedSets,
      reps: adjustedReps,
      duration: adjustedDuration,
      restTime: adjustedRestTime,
    };
  }

  /**
   * Apply adjustments to meal calories
   */
  static applyMealAdjustments(
    baseCalories: number,
    baseProtein: number,
    adjustments: ProgressionAdjustments
  ): { calories: number; protein: number } {
    return {
      calories: Math.round((baseCalories + adjustments.calorieAdjustment) * adjustments.portionMultiplier),
      protein: Math.round(baseProtein * adjustments.proteinMultiplier),
    };
  }

  /**
   * Get day-specific workout focus area
   */
  static getDayFocus(dayNumber: number): string {
    const focusAreas = [
      'Push (Chest, Shoulders, Triceps)',
      'Pull (Back, Biceps)',
      'Legs (Quads, Hamstrings, Calves)',
      'Core & Stability',
      'Push (Chest, Shoulders, Triceps)',
      'Pull (Back, Biceps)',
      'Active Recovery',
    ];

    return focusAreas[(dayNumber - 1) % 7];
  }
}

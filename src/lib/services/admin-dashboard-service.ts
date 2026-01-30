/**
 * ADMIN DASHBOARD HOOKS
 *
 * Service for admin dashboard to:
 * - Review daily plan assignments for each user
 * - Override AI recommendations for exercises, meals, or fasting
 * - Push motivational messages or tips per user
 * - Add/edit exercises, meals, fasting schedules
 */

import type { CommandoOnboardingData } from '@/types/commando';
import type { Exercise, Meal, FastingPlan, DifficultyLevel } from '@/types/fitness';
import type { DailyProgress, WeeklyStats, MonthlyStats } from '@/lib/state/progress-store';
import type { UserSubscription } from '@/types/subscription';
import { AdminOnboardingService } from './admin-onboarding-service';
import { ProgressionEngine, type ProgressionAdjustments } from './progression-engine';

// ==================== TYPES ====================

export interface AdminUserDashboard {
  // User identity
  userId: string;
  userName: string;
  email: string;
  gender: 'male' | 'female';

  // Subscription info
  subscriptionPlan: string;
  subscriptionStatus: string;
  daysActive: number;

  // Current day info
  currentDayNumber: number;
  todayPlanStatus: 'not_started' | 'in_progress' | 'completed';
  todayCompletionPercent: number;

  // Progress summary
  totalWorkoutsCompleted: number;
  totalExercisesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  overallCompletionRate: number;

  // AI assignments
  assignedDifficulty: DifficultyLevel;
  assignedFastingPlan: FastingPlan;
  assignedMealsPerDay: number;
  dailyCalorieTarget: number;

  // Progression status
  progressionAdjustments: ProgressionAdjustments | null;
  readyForUpgrade: boolean;
}

export interface AdminOverride {
  id: string;
  userId: string;
  type: 'exercise' | 'meal' | 'fasting' | 'difficulty' | 'message';
  originalValue: string;
  overrideValue: string;
  reason: string;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
  isActive: boolean;
}

export interface AdminMessage {
  id: string;
  userId: string;
  type: 'motivational' | 'tip' | 'reminder' | 'warning';
  title: string;
  message: string;
  gender: 'male' | 'female';
  scheduledFor?: string;
  sentAt?: string;
  dismissed: boolean;
}

export interface DailyPlanReview {
  date: string;
  dayNumber: number;
  userId: string;

  // Exercises
  assignedExercises: { id: string; name: string; sets: number; reps: string | number; difficulty: DifficultyLevel }[];
  completedExercises: string[];
  skippedExercises: string[];

  // Meals
  assignedMeals: { id: string; name: string; calories: number; type: string }[];
  completedMeals: string[];

  // Fasting
  fastingPlan: FastingPlan;
  fastingCompliance: number;

  // Overrides applied
  activeOverrides: AdminOverride[];
}

// ==================== ADMIN DASHBOARD SERVICE ====================

export class AdminDashboardService {
  private static overrides: AdminOverride[] = [];
  private static messages: AdminMessage[] = [];

  /**
   * Get dashboard summary for a user
   */
  static getUserDashboard(
    userId: string,
    userData: CommandoOnboardingData,
    subscription: UserSubscription | null,
    dailyHistory: Record<string, DailyProgress>,
    currentDay: number
  ): AdminUserDashboard {
    // Calculate stats from history
    const progressDays = Object.values(dailyHistory);
    const completedDays = progressDays.filter((d) => d.isWorkoutComplete);
    const totalExercises = progressDays.reduce((acc, d) => acc + d.completedExercises, 0);

    // Calculate streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedDays = [...progressDays].sort((a, b) => a.date.localeCompare(b.date));
    for (const day of sortedDays) {
      if (day.isWorkoutComplete) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    currentStreak = tempStreak;

    // Get today's progress
    const today = new Date().toISOString().split('T')[0];
    const todayProgress = dailyHistory[today];

    // Calculate completion rate
    const overallCompletionRate = progressDays.length > 0
      ? Math.round(progressDays.reduce((acc, d) => acc + d.dailyCompletionPercent, 0) / progressDays.length)
      : 0;

    // Get AI assignments
    const planAssignment = AdminOnboardingService.getPlanAssignmentSummary(userData);

    // Get progression adjustments
    const progressionFactors = {
      dayNumber: currentDay,
      weekNumber: Math.ceil(currentDay / 7),
      completionRate: overallCompletionRate,
      streakDays: currentStreak,
      averageCompletionPercent: overallCompletionRate,
      fastingCompliance: progressDays.filter((d) => d.fasting).length > 0
        ? Math.round(progressDays.reduce((acc, d) => acc + (d.fasting?.compliancePercent ?? 0), 0) / progressDays.filter((d) => d.fasting).length)
        : 0,
      totalExercisesCompleted: totalExercises,
    };

    const progressionAdjustments = ProgressionEngine.calculateAdjustments(userData, progressionFactors);

    return {
      userId,
      userName: `${userData.firstName ?? 'Unknown'} ${userData.lastName ?? ''}`.trim(),
      email: userData.email ?? '',
      gender: userData.gender ?? 'male',

      subscriptionPlan: subscription?.planId ?? 'none',
      subscriptionStatus: subscription?.status ?? 'inactive',
      daysActive: subscription ? Math.floor((Date.now() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,

      currentDayNumber: currentDay,
      todayPlanStatus: !todayProgress ? 'not_started' : todayProgress.isWorkoutComplete ? 'completed' : 'in_progress',
      todayCompletionPercent: todayProgress?.dailyCompletionPercent ?? 0,

      totalWorkoutsCompleted: completedDays.length,
      totalExercisesCompleted: totalExercises,
      currentStreak,
      longestStreak,
      overallCompletionRate,

      assignedDifficulty: userData.fitnessAssessment?.overallLevel ?? 'beginner',
      assignedFastingPlan: planAssignment.fastingPlan as FastingPlan,
      assignedMealsPerDay: planAssignment.mealsPerDay,
      dailyCalorieTarget: planAssignment.estimatedDailyCalories,

      progressionAdjustments,
      readyForUpgrade: progressionAdjustments.shouldIncreaseDifficulty,
    };
  }

  /**
   * Create an override for a user's plan
   */
  static createOverride(
    userId: string,
    type: AdminOverride['type'],
    originalValue: string,
    overrideValue: string,
    reason: string,
    adminId: string,
    expiresAt?: string
  ): AdminOverride {
    const override: AdminOverride = {
      id: `override_${Date.now()}`,
      userId,
      type,
      originalValue,
      overrideValue,
      reason,
      createdAt: new Date().toISOString(),
      createdBy: adminId,
      expiresAt,
      isActive: true,
    };

    this.overrides.push(override);
    return override;
  }

  /**
   * Get active overrides for a user
   */
  static getActiveOverrides(userId: string): AdminOverride[] {
    const now = new Date();
    return this.overrides.filter(
      (o) =>
        o.userId === userId &&
        o.isActive &&
        (!o.expiresAt || new Date(o.expiresAt) > now)
    );
  }

  /**
   * Deactivate an override
   */
  static deactivateOverride(overrideId: string): boolean {
    const override = this.overrides.find((o) => o.id === overrideId);
    if (override) {
      override.isActive = false;
      return true;
    }
    return false;
  }

  /**
   * Schedule a motivational message for a user
   */
  static scheduleMessage(
    userId: string,
    type: AdminMessage['type'],
    title: string,
    message: string,
    gender: 'male' | 'female',
    scheduledFor?: string
  ): AdminMessage {
    const adminMessage: AdminMessage = {
      id: `msg_${Date.now()}`,
      userId,
      type,
      title,
      message,
      gender,
      scheduledFor,
      dismissed: false,
    };

    this.messages.push(adminMessage);
    return adminMessage;
  }

  /**
   * Get pending messages for a user
   */
  static getPendingMessages(userId: string): AdminMessage[] {
    const now = new Date();
    return this.messages.filter(
      (m) =>
        m.userId === userId &&
        !m.dismissed &&
        !m.sentAt &&
        (!m.scheduledFor || new Date(m.scheduledFor) <= now)
    );
  }

  /**
   * Mark a message as sent
   */
  static markMessageSent(messageId: string): void {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) {
      message.sentAt = new Date().toISOString();
    }
  }

  /**
   * Mark a message as dismissed
   */
  static dismissMessage(messageId: string): void {
    const message = this.messages.find((m) => m.id === messageId);
    if (message) {
      message.dismissed = true;
    }
  }

  /**
   * Get daily plan review for a user
   */
  static getDailyPlanReview(
    userId: string,
    date: string,
    dailyProgress: DailyProgress | null,
    exercises: Exercise[],
    meals: Meal[],
    fastingPlan: FastingPlan
  ): DailyPlanReview {
    const activeOverrides = this.getActiveOverrides(userId);

    return {
      date,
      dayNumber: dailyProgress?.dayNumber ?? 1,
      userId,

      assignedExercises: exercises.map((ex) => ({
        id: ex.id,
        name: ex.name,
        sets: ex.sets ?? 3,
        reps: ex.reps ?? 10,
        difficulty: ex.difficulty,
      })),
      completedExercises: dailyProgress?.exercises.filter((e) => e.status === 'completed').map((e) => e.exerciseId) ?? [],
      skippedExercises: dailyProgress?.exercises.filter((e) => e.status === 'skipped').map((e) => e.exerciseId) ?? [],

      assignedMeals: meals.map((meal) => ({
        id: meal.id,
        name: meal.name,
        calories: meal.nutrition.calories,
        type: meal.type,
      })),
      completedMeals: dailyProgress?.meals.filter((m) => m.status === 'eaten').map((m) => m.mealId) ?? [],

      fastingPlan,
      fastingCompliance: dailyProgress?.fasting?.compliancePercent ?? 0,

      activeOverrides,
    };
  }

  /**
   * Generate gender-specific motivational messages
   */
  static generateMotivationalMessage(gender: 'male' | 'female', context: 'streak' | 'comeback' | 'milestone' | 'random'): { title: string; message: string } {
    const messages = {
      male: {
        streak: {
          title: 'Momentum Building!',
          message: "You're on fire, soldier. Keep that discipline sharp.",
        },
        comeback: {
          title: 'Welcome Back, Warrior',
          message: "Missed a day? No excuses. Get back in the fight.",
        },
        milestone: {
          title: 'Mission Accomplished',
          message: "You've proven your commitment. Next objective incoming.",
        },
        random: {
          title: 'Daily Intel',
          message: 'Pain is weakness leaving the body. Push through.',
        },
      },
      female: {
        streak: {
          title: 'Amazing Progress!',
          message: "You're glowing with dedication. Keep shining!",
        },
        comeback: {
          title: 'Welcome Back, Beautiful',
          message: "Every day is a fresh start. You've got this!",
        },
        milestone: {
          title: 'Celebrate Yourself!',
          message: "Look how far you've come. You're incredible!",
        },
        random: {
          title: 'Daily Inspiration',
          message: 'You are stronger than you think. Believe in yourself.',
        },
      },
    };

    return messages[gender][context];
  }

  /**
   * Get all overrides (for admin list view)
   */
  static getAllOverrides(): AdminOverride[] {
    return [...this.overrides];
  }

  /**
   * Get all messages (for admin list view)
   */
  static getAllMessages(): AdminMessage[] {
    return [...this.messages];
  }

  /**
   * Clear all data (for testing)
   */
  static clearAll(): void {
    this.overrides = [];
    this.messages = [];
  }
}

// ==================== HOOKS FOR COMPONENTS ====================

/**
 * Hook to check for admin overrides
 */
export function useAdminOverrides(userId: string): AdminOverride[] {
  return AdminDashboardService.getActiveOverrides(userId);
}

/**
 * Hook to check for pending admin messages
 */
export function useAdminMessages(userId: string): AdminMessage[] {
  return AdminDashboardService.getPendingMessages(userId);
}

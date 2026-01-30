/**
 * ADMIN ONBOARDING SERVICE
 *
 * Service for admin dashboard to view and manage user onboarding data.
 * Provides hooks for viewing user profiles, onboarding progress, and personalization details.
 */

import type { CommandoOnboardingData, FitnessAssessment } from '@/types/commando';
import type { SubscriptionPlanId, UserSubscription } from '@/types/subscription';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

// ==================== ADMIN USER PROFILE ====================

export interface AdminUserProfile {
  // Identity
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female';

  // Physical Stats
  heightCm?: number;
  weightKg?: number;
  targetWeightKg?: number;
  bmi?: number;
  bmiCategory?: string;

  // Fitness Assessment
  fitnessAssessment?: FitnessAssessment;
  fitnessAge?: number;
  actualAge?: number;

  // Goals & Preferences
  primaryGoal?: string;
  bodyType?: string;
  desiredBody?: string;
  problemAreas?: string[];
  experienceLevel?: string;

  // Lifestyle
  activityLevel?: string;
  energyLevel?: string;
  sleepQuality?: string;
  metabolicType?: string;
  waterIntake?: string;
  obstacles?: string[];

  // Training Preferences
  trainingFrequency?: string;
  workoutDuration?: string;
  preferredWorkoutTime?: string;
  motivationType?: string;

  // Subscription
  subscription?: UserSubscription;
  subscriptionPlanName?: string;
  subscriptionStatus?: string;
  daysSinceSubscription?: number;

  // Onboarding Progress
  onboardingCompleted: boolean;
  onboardingCompletedAt?: string;
  currentOnboardingStep?: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

// ==================== ADMIN ONBOARDING ANALYTICS ====================

export interface OnboardingAnalytics {
  totalUsers: number;
  completedOnboarding: number;
  dropoffRate: number;
  averageCompletionTime: number; // minutes

  // Gender Distribution
  maleUsers: number;
  femaleUsers: number;

  // Goal Distribution
  goalDistribution: Record<string, number>;

  // Subscription Distribution
  subscriptionDistribution: Record<SubscriptionPlanId, number>;
  trialUsers: number;
  activeSubscribers: number;

  // Step Dropoff Analysis
  stepDropoff: { step: number; dropoffCount: number }[];
}

// ==================== ADMIN SERVICE ====================

export class AdminOnboardingService {
  /**
   * Transform raw onboarding data into admin profile format
   */
  static transformToAdminProfile(
    userId: string,
    data: CommandoOnboardingData,
    subscription?: UserSubscription
  ): AdminUserProfile {
    const now = new Date();

    // Calculate BMI
    const bmi =
      data.heightCm && data.weightKg
        ? Math.round((data.weightKg / Math.pow(data.heightCm / 100, 2)) * 10) / 10
        : undefined;

    // Determine BMI category
    let bmiCategory: string | undefined;
    if (bmi) {
      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    // Calculate actual age from date of birth
    let actualAge: number | undefined;
    if (data.dateOfBirth) {
      const birthDate = new Date(data.dateOfBirth);
      actualAge = Math.floor(
        (now.getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      );
    }

    // Days since subscription
    let daysSinceSubscription: number | undefined;
    if (subscription?.startDate) {
      const startDate = new Date(subscription.startDate);
      daysSinceSubscription = Math.floor(
        (now.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
      );
    }

    return {
      id: userId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,

      heightCm: data.heightCm,
      weightKg: data.weightKg,
      targetWeightKg: data.targetWeight,
      bmi,
      bmiCategory,

      fitnessAssessment: data.fitnessAssessment,
      fitnessAge: data.fitnessAge,
      actualAge,

      primaryGoal: data.primaryGoal,
      bodyType: data.bodyType,
      desiredBody: data.desiredBody,
      problemAreas: data.problemAreas,
      experienceLevel: data.experienceLevel,

      activityLevel: data.activityLevel,
      energyLevel: data.energyLevel,
      sleepQuality: data.sleepQuality,
      metabolicType: data.metabolicType,
      waterIntake: undefined, // Not in current onboarding data
      obstacles: data.obstacles,

      trainingFrequency: data.trainingFrequency,
      workoutDuration: data.workoutDuration,
      preferredWorkoutTime: data.workoutTime,
      motivationType: data.motivationType,

      subscription,
      subscriptionPlanName: subscription?.planId
        ? SUBSCRIPTION_PLANS[subscription.planId]?.name
        : undefined,
      subscriptionStatus: subscription?.status,
      daysSinceSubscription,

      onboardingCompleted: !!data.quoteViewed,
      onboardingCompletedAt: data.quoteViewed ? now.toISOString() : undefined,

      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  /**
   * Get formatted onboarding summary for admin view
   */
  static getOnboardingSummary(data: CommandoOnboardingData): string[] {
    const summary: string[] = [];

    if (data.gender) {
      summary.push(`Gender: ${data.gender === 'male' ? 'Male' : 'Female'}`);
    }

    if (data.ageCategory) {
      summary.push(`Age Category: ${data.ageCategory}`);
    }

    if (data.primaryGoal) {
      const goalLabels: Record<string, string> = {
        build_muscle: 'Build Muscle',
        lose_weight: 'Lose Weight',
        gain_muscle_lose_weight: 'Gain Muscle & Lose Weight',
        get_fit_toned: 'Get Fit & Toned',
      };
      summary.push(`Goal: ${goalLabels[data.primaryGoal] ?? data.primaryGoal}`);
    }

    if (data.bodyType) {
      summary.push(`Body Type: ${data.bodyType}`);
    }

    if (data.fitnessAssessment) {
      summary.push(`Fitness Level: ${data.fitnessAssessment.overallLevel}`);
      summary.push(`Push-ups: ${data.fitnessAssessment.pushUps}`);
      summary.push(`Pull-ups: ${data.fitnessAssessment.pullUps}`);
    }

    if (data.heightCm && data.weightKg) {
      const bmi = Math.round((data.weightKg / Math.pow(data.heightCm / 100, 2)) * 10) / 10;
      summary.push(`BMI: ${bmi}`);
    }

    if (data.trainingFrequency) {
      summary.push(`Training Frequency: ${data.trainingFrequency} days/week`);
    }

    if (data.workoutDuration) {
      summary.push(`Workout Duration: ${data.workoutDuration} minutes`);
    }

    return summary;
  }

  /**
   * Validate onboarding data completeness
   */
  static validateOnboardingData(data: CommandoOnboardingData): {
    isComplete: boolean;
    missingFields: string[];
    completionPercentage: number;
  } {
    const requiredFields = [
      'gender',
      'ageCategory',
      'primaryGoal',
      'bodyType',
      'desiredBody',
      'experienceLevel',
      'activityLevel',
      'heightCm',
      'weightKg',
      'fitnessAssessment',
      'firstName',
      'email',
    ];

    const missingFields: string[] = [];

    for (const field of requiredFields) {
      if (!(data as Record<string, unknown>)[field]) {
        missingFields.push(field);
      }
    }

    const completionPercentage = Math.round(
      ((requiredFields.length - missingFields.length) / requiredFields.length) * 100
    );

    return {
      isComplete: missingFields.length === 0,
      missingFields,
      completionPercentage,
    };
  }

  /**
   * Get AI plan assignment summary
   */
  static getPlanAssignmentSummary(data: CommandoOnboardingData): {
    workoutDifficulty: string;
    fastingPlan: string;
    mealsPerDay: number;
    estimatedDailyCalories: number;
  } {
    // Determine workout difficulty
    let workoutDifficulty = 'Beginner';
    if (data.fitnessAssessment) {
      workoutDifficulty =
        data.fitnessAssessment.overallLevel.charAt(0).toUpperCase() +
        data.fitnessAssessment.overallLevel.slice(1);
    }

    // Determine fasting plan based on BMI and goal
    let fastingPlan = '16:8';
    let mealsPerDay = 2;

    if (data.weightKg && data.heightCm) {
      const bmi = data.weightKg / Math.pow(data.heightCm / 100, 2);

      if (bmi >= 30) {
        fastingPlan = '18:6';
        mealsPerDay = 1;
      } else if (bmi >= 25) {
        fastingPlan = data.primaryGoal === 'lose_weight' ? '18:6' : '16:8';
        mealsPerDay = data.primaryGoal === 'lose_weight' ? 1 : 2;
      } else if (bmi < 18.5) {
        fastingPlan = '12:12';
        mealsPerDay = 2;
      }
    }

    // Estimate daily calories
    let estimatedDailyCalories = 2000;
    if (data.weightKg && data.heightCm && data.ageCategory && data.gender) {
      // Using Mifflin-St Jeor equation approximation
      const ageMap: Record<string, number> = {
        '18-29': 25,
        '30-39': 35,
        '40-49': 45,
        '50+': 55,
      };
      const age = ageMap[data.ageCategory] ?? 30;

      if (data.gender === 'male') {
        estimatedDailyCalories = Math.round(
          10 * data.weightKg + 6.25 * data.heightCm - 5 * age + 5
        );
      } else {
        estimatedDailyCalories = Math.round(
          10 * data.weightKg + 6.25 * data.heightCm - 5 * age - 161
        );
      }

      // Adjust for activity level
      const activityMultipliers: Record<string, number> = {
        sedentary: 1.2,
        lightly_active: 1.375,
        moderately_active: 1.55,
        very_active: 1.725,
      };
      const multiplier = activityMultipliers[data.activityLevel ?? 'moderately_active'] ?? 1.55;
      estimatedDailyCalories = Math.round(estimatedDailyCalories * multiplier);

      // Adjust for goal
      if (data.primaryGoal === 'lose_weight') {
        estimatedDailyCalories -= 500;
      } else if (data.primaryGoal === 'build_muscle') {
        estimatedDailyCalories += 300;
      }
    }

    return {
      workoutDifficulty,
      fastingPlan,
      mealsPerDay,
      estimatedDailyCalories,
    };
  }

  /**
   * Generate admin report for a user
   */
  static generateAdminReport(
    data: CommandoOnboardingData,
    subscription?: UserSubscription
  ): string {
    const validation = this.validateOnboardingData(data);
    const planAssignment = this.getPlanAssignmentSummary(data);
    const summary = this.getOnboardingSummary(data);

    let report = '=== USER ONBOARDING REPORT ===\n\n';

    report += '--- PROFILE ---\n';
    report += `Name: ${data.firstName ?? 'N/A'} ${data.lastName ?? ''}\n`;
    report += `Email: ${data.email ?? 'N/A'}\n`;
    report += `Gender: ${data.gender ?? 'N/A'}\n\n`;

    report += '--- ONBOARDING STATUS ---\n';
    report += `Complete: ${validation.isComplete ? 'Yes' : 'No'}\n`;
    report += `Completion: ${validation.completionPercentage}%\n`;
    if (validation.missingFields.length > 0) {
      report += `Missing: ${validation.missingFields.join(', ')}\n`;
    }
    report += '\n';

    report += '--- PERSONALIZATION ---\n';
    summary.forEach((item) => {
      report += `${item}\n`;
    });
    report += '\n';

    report += '--- AI PLAN ASSIGNMENT ---\n';
    report += `Workout Difficulty: ${planAssignment.workoutDifficulty}\n`;
    report += `Fasting Plan: ${planAssignment.fastingPlan}\n`;
    report += `Meals Per Day: ${planAssignment.mealsPerDay}\n`;
    report += `Est. Daily Calories: ${planAssignment.estimatedDailyCalories}\n\n`;

    if (subscription) {
      report += '--- SUBSCRIPTION ---\n';
      report += `Plan: ${SUBSCRIPTION_PLANS[subscription.planId]?.name ?? subscription.planId}\n`;
      report += `Status: ${subscription.status}\n`;
      report += `Start Date: ${subscription.startDate}\n`;
      report += `End Date: ${subscription.endDate}\n`;
    }

    return report;
  }
}

// ==================== ADMIN HOOKS ====================

/**
 * Hook to get user profile for admin dashboard
 * In a real app, this would fetch from a backend
 */
export function useAdminUserProfile(
  data: CommandoOnboardingData,
  subscription?: UserSubscription
): AdminUserProfile {
  return AdminOnboardingService.transformToAdminProfile('local_user', data, subscription);
}

/**
 * Hook to get onboarding validation status
 */
export function useOnboardingValidation(data: CommandoOnboardingData) {
  return AdminOnboardingService.validateOnboardingData(data);
}

/**
 * Hook to get plan assignment summary
 */
export function usePlanAssignment(data: CommandoOnboardingData) {
  return AdminOnboardingService.getPlanAssignmentSummary(data);
}

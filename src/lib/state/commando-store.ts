/**
 * COMMANDO ONBOARDING STORE
 *
 * State management for the comprehensive 37-step onboarding flow.
 * Handles gender-specific flows, assessments, and plan generation.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  CommandoOnboardingData,
  CommandoOnboardingStep,
  FitnessAssessment,
  PersonalizedPlan,
  UserGender,
} from '@/types/commando';
import type { DifficultyLevel, MealIntensity, FastingPlan } from '@/types/fitness';
import { COMMANDO_ONBOARDING_STEPS } from '@/types/commando';

// ==================== TYPES ====================

interface CommandoOnboardingState {
  // Current step
  currentStepIndex: number;
  currentStep: CommandoOnboardingStep;

  // Onboarding data
  data: CommandoOnboardingData;

  // Generated plan
  personalizedPlan: PersonalizedPlan | null;

  // UI state
  isLoading: boolean;
  isComplete: boolean;

  // Registration date (when user completed onboarding)
  startDate: string | null;

  // Actions
  setStep: (index: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateData: (updates: Partial<CommandoOnboardingData>) => void;
  setFitnessAssessment: (assessment: FitnessAssessment) => void;
  generatePlan: () => Promise<PersonalizedPlan>;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

// ==================== HELPER FUNCTIONS ====================

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function calculateFitnessAge(
  actualAge: number,
  fitnessAssessment: FitnessAssessment,
  activityLevel: string,
  sleepQuality: string
): number {
  let ageOffset = 0;

  // Fitness level adjustment
  if (fitnessAssessment.overallLevel === 'advanced') ageOffset -= 5;
  else if (fitnessAssessment.overallLevel === 'intermediate') ageOffset -= 2;
  else if (fitnessAssessment.overallLevel === 'beginner') ageOffset += 2;

  // Activity level adjustment
  if (activityLevel === 'very_active') ageOffset -= 3;
  else if (activityLevel === 'moderately_active') ageOffset -= 1;
  else if (activityLevel === 'sedentary') ageOffset += 3;

  // Sleep quality adjustment
  if (sleepQuality === 'excellent') ageOffset -= 2;
  else if (sleepQuality === 'poor') ageOffset += 2;

  return Math.max(18, Math.min(70, actualAge + ageOffset));
}

function calculateFitnessLevel(pushUps: number, pullUps: number): FitnessAssessment {
  // Strength score based on push-ups
  let strengthScore = 0;
  if (pushUps >= 50) strengthScore = 100;
  else if (pushUps >= 40) strengthScore = 90;
  else if (pushUps >= 30) strengthScore = 75;
  else if (pushUps >= 20) strengthScore = 60;
  else if (pushUps >= 10) strengthScore = 45;
  else if (pushUps >= 5) strengthScore = 30;
  else strengthScore = 15;

  // Stamina score based on pull-ups
  let staminaScore = 0;
  if (pullUps >= 20) staminaScore = 100;
  else if (pullUps >= 15) staminaScore = 90;
  else if (pullUps >= 10) staminaScore = 75;
  else if (pullUps >= 5) staminaScore = 60;
  else if (pullUps >= 2) staminaScore = 40;
  else if (pullUps >= 1) staminaScore = 25;
  else staminaScore = 10;

  // Overall level
  const avgScore = (strengthScore + staminaScore) / 2;
  let overallLevel: DifficultyLevel = 'beginner';
  if (avgScore >= 70) overallLevel = 'advanced';
  else if (avgScore >= 45) overallLevel = 'intermediate';

  return {
    pushUps,
    pullUps,
    strengthScore,
    staminaScore,
    overallLevel,
  };
}

function determineFastingPlan(
  mealsPerDay: 1 | 2,
  activityLevel: string,
  metabolicType: string
): FastingPlan {
  // 1 meal = more aggressive fasting
  if (mealsPerDay === 1) {
    return '18:6';
  }

  // 2 meals - varies based on activity and metabolism
  if (activityLevel === 'very_active' || activityLevel === 'moderately_active') {
    return metabolicType === 'fast' ? '14:10' : '16:8';
  }

  return metabolicType === 'slow' ? '18:6' : '16:8';
}

function determineMealIntensity(
  primaryGoal: string,
  activityLevel: string,
  metabolicType: string
): MealIntensity {
  if (primaryGoal === 'build_muscle' || primaryGoal === 'gain_muscle_lose_weight') {
    return activityLevel === 'very_active' ? 'high_energy' : 'standard';
  }

  if (primaryGoal === 'lose_weight') {
    return 'light';
  }

  return 'standard';
}

function calculateDailyCalories(
  weightKg: number,
  heightCm: number,
  age: number,
  gender: UserGender,
  activityLevel: string,
  primaryGoal: string
): number {
  // Basal Metabolic Rate (Mifflin-St Jeor)
  let bmr: number;
  if (gender === 'male') {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  } else {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  }

  // Activity multiplier
  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
  };
  const multiplier = activityMultipliers[activityLevel] ?? 1.375;

  let tdee = bmr * multiplier;

  // Goal adjustment
  if (primaryGoal === 'lose_weight') {
    tdee *= 0.8; // 20% deficit
  } else if (primaryGoal === 'build_muscle') {
    tdee *= 1.1; // 10% surplus
  }

  return Math.round(tdee);
}

function calculateWeeksToGoal(currentWeight: number, targetWeight: number): number {
  const weightDiff = Math.abs(currentWeight - targetWeight);
  // Assume 0.5-1kg per week for sustainable change
  const weeksLow = weightDiff / 1;
  const weeksHigh = weightDiff / 0.5;
  return Math.round((weeksLow + weeksHigh) / 2);
}

// ==================== STORE ====================

export const useCommandoStore = create<CommandoOnboardingState>()(
  persist(
    (set, get) => ({
      currentStepIndex: 0,
      currentStep: COMMANDO_ONBOARDING_STEPS[0],
      data: {},
      personalizedPlan: null,
      isLoading: false,
      isComplete: false,
      startDate: null,

      setStep: (index: number) => {
        const validIndex = Math.max(0, Math.min(index, COMMANDO_ONBOARDING_STEPS.length - 1));
        set({
          currentStepIndex: validIndex,
          currentStep: COMMANDO_ONBOARDING_STEPS[validIndex],
        });
      },

      nextStep: () => {
        const { currentStepIndex } = get();
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < COMMANDO_ONBOARDING_STEPS.length) {
          set({
            currentStepIndex: nextIndex,
            currentStep: COMMANDO_ONBOARDING_STEPS[nextIndex],
          });
        }
      },

      prevStep: () => {
        const { currentStepIndex } = get();
        if (currentStepIndex > 0) {
          set({
            currentStepIndex: currentStepIndex - 1,
            currentStep: COMMANDO_ONBOARDING_STEPS[currentStepIndex - 1],
          });
        }
      },

      updateData: (updates: Partial<CommandoOnboardingData>) => {
        set((state) => ({
          data: { ...state.data, ...updates },
        }));
      },

      setFitnessAssessment: (assessment: FitnessAssessment) => {
        set((state) => ({
          data: { ...state.data, fitnessAssessment: assessment },
        }));
      },

      generatePlan: async () => {
        const { data } = get();
        set({ isLoading: true });

        // Simulate AI processing time
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Calculate values
        const bmi = data.heightCm && data.weightKg ? calculateBMI(data.weightKg, data.heightCm) : 0;

        const age = data.dateOfBirth
          ? Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
          : 30;

        const fitnessAssessment = data.fitnessAssessment ?? calculateFitnessLevel(
          data.pushUpCount ?? 0,
          data.pullUpCount ?? 0
        );

        const fitnessAge = calculateFitnessAge(
          age,
          fitnessAssessment,
          data.activityLevel ?? 'lightly_active',
          data.sleepQuality ?? 'fair'
        );

        const fastingPlan = determineFastingPlan(
          data.mealsPerDay ?? 2,
          data.activityLevel ?? 'lightly_active',
          data.metabolicType ?? 'normal'
        );

        const mealIntensity = determineMealIntensity(
          data.primaryGoal ?? 'get_fit_toned',
          data.activityLevel ?? 'lightly_active',
          data.metabolicType ?? 'normal'
        );

        const dailyCalories = calculateDailyCalories(
          data.weightKg ?? 70,
          data.heightCm ?? 170,
          age,
          data.gender ?? 'male',
          data.activityLevel ?? 'lightly_active',
          data.primaryGoal ?? 'get_fit_toned'
        );

        const weeksToGoal = calculateWeeksToGoal(
          data.currentWeight ?? data.weightKg ?? 70,
          data.targetWeight ?? data.weightKg ?? 70
        );

        const plan: PersonalizedPlan = {
          id: `plan_${Date.now()}`,
          userId: `user_${Date.now()}`,
          createdAt: new Date().toISOString(),

          profile: {
            gender: data.gender ?? 'male',
            ageCategory: data.ageCategory ?? '30-39',
            heightCm: data.heightCm ?? 170,
            weightKg: data.weightKg ?? 70,
            targetWeight: data.targetWeight ?? data.weightKg ?? 70,
            bmi,
            fitnessLevel: fitnessAssessment.overallLevel,
            fitnessAge,
          },

          goals: {
            primary: data.primaryGoal ?? 'get_fit_toned',
            desiredBody: data.desiredBody ?? 'fit',
            obstacles: data.obstacles ?? [],
          },

          training: {
            frequency: data.trainingFrequency ?? '4-5',
            duration: data.workoutDuration ?? '30-45',
            preferredTime: data.workoutTime ?? 'morning',
            difficulty: fitnessAssessment.overallLevel,
          },

          nutrition: {
            mealsPerDay: data.mealsPerDay ?? 2,
            mealIntensity,
            fastingPlan,
            dailyCalorieTarget: dailyCalories,
            proteinTarget: Math.round(data.weightKg ? data.weightKg * 1.6 : 112),
            waterTarget: data.dailyWaterIntake ?? 2.5,
          },

          predictions: {
            estimatedWeeksToGoal: weeksToGoal,
            weeklyWeightChange: data.primaryGoal === 'lose_weight' ? -0.5 : 0.2,
            monthlyProgressPercent: 15,
          },
        };

        set({
          personalizedPlan: plan,
          isLoading: false,
          data: { ...data, bmi, fitnessAge },
        });

        return plan;
      },

      completeOnboarding: () => {
        set({ isComplete: true, startDate: new Date().toISOString().split('T')[0] });
      },

      resetOnboarding: () => {
        set({
          currentStepIndex: 0,
          currentStep: COMMANDO_ONBOARDING_STEPS[0],
          data: {},
          personalizedPlan: null,
          isLoading: false,
          isComplete: false,
          startDate: null,
        });
      },
    }),
    {
      name: 'commando-onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentStepIndex: state.currentStepIndex,
        currentStep: state.currentStep,
        data: state.data,
        personalizedPlan: state.personalizedPlan,
        isComplete: state.isComplete,
        startDate: state.startDate,
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useCurrentStep = () => useCommandoStore((s) => s.currentStep);
export const useStepIndex = () => useCommandoStore((s) => s.currentStepIndex);
export const useOnboardingData = () => useCommandoStore((s) => s.data);
export const usePersonalizedPlan = () => useCommandoStore((s) => s.personalizedPlan);
export const useIsLoading = () => useCommandoStore((s) => s.isLoading);
export const useIsComplete = () => useCommandoStore((s) => s.isComplete);
export const useStartDate = () => useCommandoStore((s) => s.startDate);
export const useGender = () => useCommandoStore((s) => s.data.gender);

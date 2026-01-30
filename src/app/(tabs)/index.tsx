import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import {
  Dumbbell,
  Utensils,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  FileDown,
  Calendar,
  Moon,
  Sun,
  Check,
  Timer,
  Play,
  Target,
  Zap,
  Award,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useDailyPlan, useAppStore } from '@/lib/state/app-store';
import { useProfile } from '@/lib/state/user-store';
import {
  useCommandoStore,
  useOnboardingData as useCommandoData,
  useIsComplete as useCommandoComplete,
  useStartDate,
} from '@/lib/state/commando-store';
import {
  useMealSelectionStore,
  useTodayLightMealId,
  useTodayMainMealId,
  useTodayLightMealEaten,
  useTodayMainMealEaten,
} from '@/lib/state/meal-selection-store';
import {
  useEnrichedDailyPlan,
  useFastingStatus,
  useDailyStats,
  usePlanValidation,
} from '@/lib/hooks/use-daily-plan';
import {
  PersonalizedPlanEngine,
  ExerciseGenerationEngine,
  FastingPlanEngine,
  MealPlanEngine,
} from '@/lib/services/personalized-plan-engine';
import { workoutPlans } from '@/data/mock-data';
import type { Exercise, WorkoutPlan, MealPlan, Meal } from '@/types/fitness';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== TIMER HOOK ====================

function useCountdownTimer(targetTime: string | null) {
  const [timeRemaining, setTimeRemaining] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  useEffect(() => {
    if (!targetTime) return;

    const calculateRemaining = () => {
      const now = new Date();
      const [hours, minutes] = targetTime.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // If target is in the past, add a day
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      const diff = Math.max(0, target.getTime() - now.getTime());
      const totalSeconds = Math.floor(diff / 1000);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      setTimeRemaining({ hours: h, minutes: m, seconds: s, totalSeconds });
    };

    calculateRemaining();
    const interval = setInterval(calculateRemaining, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return timeRemaining;
}

// ==================== ANIMATED CARD ====================

function AnimatedCard({
  children,
  delay = 0,
  onPress,
}: {
  children: React.ReactNode;
  delay?: number;
  onPress?: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, { damping: 15 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

// ==================== FASTING CARD WITH COUNTDOWN ====================

function FastingCardWithTimer() {
  const commandoData = useCommandoData();
  const commandoComplete = useCommandoComplete();

  // Get personalized fasting plan
  const fastingPlan = useMemo(() => {
    if (!commandoComplete) return null;
    return FastingPlanEngine.determineFastingPlan(commandoData);
  }, [commandoData, commandoComplete]);

  // Calculate current fasting status
  const [status, setStatus] = useState<{
    isFasting: boolean;
    isEating: boolean;
    percentComplete: number;
  }>({ isFasting: false, isEating: true, percentComplete: 0 });

  useEffect(() => {
    if (!fastingPlan) return;

    const calculateStatus = () => {
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [eatStartH, eatStartM] = fastingPlan.window.eatingStartTime.split(':').map(Number);
      const [eatEndH, eatEndM] = fastingPlan.window.eatingEndTime.split(':').map(Number);
      const eatingStart = eatStartH * 60 + eatStartM;
      const eatingEnd = eatEndH * 60 + eatEndM;

      const isInEatingWindow = currentTime >= eatingStart && currentTime < eatingEnd;

      let percentComplete = 0;
      if (isInEatingWindow) {
        const elapsed = currentTime - eatingStart;
        const total = eatingEnd - eatingStart;
        percentComplete = Math.round((elapsed / total) * 100);
      } else {
        // During fasting
        const fastingDuration = 24 * 60 - (eatingEnd - eatingStart);
        let elapsed: number;
        if (currentTime >= eatingEnd) {
          elapsed = currentTime - eatingEnd;
        } else {
          elapsed = 24 * 60 - eatingEnd + currentTime;
        }
        percentComplete = Math.round((elapsed / fastingDuration) * 100);
      }

      setStatus({
        isFasting: !isInEatingWindow,
        isEating: isInEatingWindow,
        percentComplete: Math.min(100, percentComplete),
      });
    };

    calculateStatus();
    const interval = setInterval(calculateStatus, 60000);
    return () => clearInterval(interval);
  }, [fastingPlan]);

  // Countdown to next phase
  const nextPhaseTime = useMemo(() => {
    if (!fastingPlan) return null;
    return status.isEating ? fastingPlan.window.eatingEndTime : fastingPlan.window.eatingStartTime;
  }, [fastingPlan, status.isEating]);

  const countdown = useCountdownTimer(nextPhaseTime);

  if (!fastingPlan) {
    return (
      <AnimatedCard delay={100}>
        <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.05)']}
            style={{ padding: 20, borderRadius: 24 }}
          >
            <Text className="text-center text-white/60">
              Complete onboarding to see your fasting plan
            </Text>
          </LinearGradient>
        </BlurView>
      </AnimatedCard>
    );
  }

  const timeString = `${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;

  return (
    <AnimatedCard delay={100}>
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
        <LinearGradient
          colors={
            status.isFasting
              ? ['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.1)']
              : ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.1)']
          }
          style={{ padding: 20, borderRadius: 24 }}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={cn(
                  'mr-4 h-14 w-14 items-center justify-center rounded-2xl',
                  status.isFasting ? 'bg-violet-500/30' : 'bg-emerald-500/30'
                )}
              >
                {status.isFasting ? <Moon size={28} color="#a78bfa" /> : <Sun size={28} color="#10b981" />}
              </View>
              <View>
                <Text className="text-lg font-semibold text-white">
                  {status.isFasting ? 'Fasting' : 'Eating Window'}
                </Text>
                <Text className="text-sm text-white/60">
                  {status.isEating ? 'Ends in' : 'Starts in'} {timeString}
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-white">{fastingPlan.plan}</Text>
              <Text className="text-xs text-white/40">
                {fastingPlan.window.eatingStartTime} - {fastingPlan.window.eatingEndTime}
              </Text>
            </View>
          </View>

          {/* Progress bar */}
          <View className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <LinearGradient
              colors={status.isFasting ? ['#8b5cf6', '#a78bfa'] : ['#10b981', '#34d399']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                height: '100%',
                width: `${status.percentComplete}%`,
                borderRadius: 4,
              }}
            />
          </View>

          {/* Meals info */}
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-xs text-white/40">
              {fastingPlan.mealsPerDay} meal{fastingPlan.mealsPerDay > 1 ? 's' : ''} per day
            </Text>
            <Text className="text-xs text-white/40">
              {fastingPlan.window.fastingHours}h fasting / {fastingPlan.window.eatingHours}h eating
            </Text>
          </View>
        </LinearGradient>
      </BlurView>
    </AnimatedCard>
  );
}

// ==================== COLLAPSIBLE EXERCISE ITEM ====================

function ExerciseItem({
  exercise,
  index,
  isCompleted,
  isActive,
  onStart,
  onComplete,
}: {
  exercise: Exercise;
  index: number;
  isCompleted: boolean;
  isActive: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  const targetSeconds = exercise.duration ?? 0;

  // Timer logic for timed exercises
  useEffect(() => {
    if (!timerRunning) return;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev >= targetSeconds) {
          setTimerRunning(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          return prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerRunning, targetSeconds]);

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpanded(!expanded);
  };

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onStart();
    if (exercise.duration) {
      setTimerRunning(true);
      setTimerSeconds(0);
    }
  };

  const handleComplete = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimerRunning(false);
    onComplete();
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View entering={FadeIn.delay(index * 50)}>
      <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 8 }}>
        <Pressable onPress={handleToggle}>
          <View
            className={cn(
              'border p-4',
              isCompleted ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5',
              isActive && !isCompleted && 'border-amber-500/30 bg-amber-500/10'
            )}
          >
            {/* Header - Always visible */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center">
                <View
                  className={cn(
                    'mr-3 h-10 w-10 items-center justify-center rounded-xl',
                    isCompleted ? 'bg-emerald-500/30' : 'bg-white/10'
                  )}
                >
                  {isCompleted ? (
                    <Check size={20} color="#10b981" />
                  ) : (
                    <Text className="text-sm font-bold text-white/60">{index + 1}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className={cn(
                      'font-semibold',
                      isCompleted ? 'text-emerald-400' : 'text-white'
                    )}
                  >
                    {exercise.name}
                  </Text>
                  <Text className="text-xs text-white/40">
                    {exercise.sets} sets × {exercise.reps ?? `${exercise.duration}s`}
                    {exercise.restTime && ` • ${exercise.restTime}s rest`}
                  </Text>
                </View>
              </View>
              {expanded ? (
                <ChevronUp size={20} color="rgba(255,255,255,0.4)" />
              ) : (
                <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
              )}
            </View>

            {/* Expanded content */}
            {expanded && (
              <Animated.View entering={FadeIn} className="mt-4">
                {/* Description */}
                <Text className="mb-3 text-sm text-white/60">{exercise.description}</Text>

                {/* Timer for timed exercises */}
                {exercise.duration && isActive && !isCompleted && (
                  <View className="mb-4 items-center rounded-xl bg-white/5 p-4">
                    <Text className="mb-2 text-4xl font-bold text-white">
                      {formatTime(timerRunning ? timerSeconds : exercise.duration)}
                    </Text>
                    {timerRunning && (
                      <View className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <View
                          className="h-full bg-amber-500"
                          style={{ width: `${(timerSeconds / targetSeconds) * 100}%` }}
                        />
                      </View>
                    )}
                  </View>
                )}

                {/* Action buttons */}
                {!isCompleted && (
                  <View className="flex-row gap-3">
                    {!isActive ? (
                      <Pressable
                        onPress={handleStart}
                        className="flex-1 flex-row items-center justify-center rounded-xl bg-amber-500 py-3"
                      >
                        <Play size={18} color="white" />
                        <Text className="ml-2 font-semibold text-white">Start</Text>
                      </Pressable>
                    ) : (
                      <Pressable
                        onPress={handleComplete}
                        className="flex-1 flex-row items-center justify-center rounded-xl bg-emerald-500 py-3"
                      >
                        <Check size={18} color="white" />
                        <Text className="ml-2 font-semibold text-white">Complete</Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </Pressable>
      </BlurView>
    </Animated.View>
  );
}

// ==================== WORKOUT CARD WITH EXERCISES ====================

function WorkoutCardWithExercises() {
  const commandoData = useCommandoData();
  const commandoComplete = useCommandoComplete();
  const startDate = useStartDate();
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [showAllExercises, setShowAllExercises] = useState(false);

  // Calculate day number since registration (Day 1, Day 2, etc.)
  const dayNumber = useMemo(() => {
    if (!startDate) return 1;
    const start = new Date(startDate);
    const today = new Date();
    // Reset time to midnight for accurate day calculation
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Day 1 on first day
  }, [startDate]);

  // Get today's day of week to match workout tab (0-6, Sunday=0)
  const todayDayOfWeek = new Date().getDay();

  // Get today's workout from workoutPlans (same as workout tab)
  const todayWorkoutPlan = useMemo(() => {
    return workoutPlans.find((w) => w.dayOfWeek === todayDayOfWeek) ?? null;
  }, [todayDayOfWeek]);

  // Check if rest day based on whether there's a workout for today
  const isRestDay = !todayWorkoutPlan;

  const handleStartExercise = useCallback((exerciseId: string) => {
    setActiveExerciseId(exerciseId);
  }, []);

  const handleCompleteExercise = useCallback((exerciseId: string) => {
    setCompletedExercises((prev) => new Set([...prev, exerciseId]));
    setActiveExerciseId(null);
  }, []);

  const completionPercent = todayWorkoutPlan
    ? Math.round((completedExercises.size / todayWorkoutPlan.exercises.length) * 100)
    : 0;

  if (!commandoComplete) {
    return (
      <AnimatedCard delay={200}>
        <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.05)']}
            style={{ padding: 24, alignItems: 'center' }}
          >
            <Dumbbell size={40} color="#818cf8" />
            <Text className="mt-4 text-center text-white/60">
              Complete onboarding to see your personalized workout
            </Text>
          </LinearGradient>
        </BlurView>
      </AnimatedCard>
    );
  }

  if (isRestDay) {
    return (
      <AnimatedCard delay={200}>
        <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(99,102,241,0.2)', 'rgba(99,102,241,0.05)']}
            style={{ padding: 24, alignItems: 'center' }}
          >
            <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20">
              <Calendar size={40} color="#818cf8" />
            </View>
            <Text className="mb-2 text-2xl font-bold text-white">Recovery Day</Text>
            <Text className="text-center text-base text-white/60">
              Relax soldier. Today is a recovery day. Let the muscles heal and come back stronger.
            </Text>
          </LinearGradient>
        </BlurView>
      </AnimatedCard>
    );
  }

  if (!todayWorkoutPlan || todayWorkoutPlan.exercises.length === 0) {
    return null;
  }

  const displayedExercises = showAllExercises ? todayWorkoutPlan.exercises : todayWorkoutPlan.exercises.slice(0, 3);

  return (
    <AnimatedCard delay={200}>
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
        <View className="border border-white/5">
          {/* Header */}
          <LinearGradient
            colors={['rgba(245,158,11,0.2)', 'rgba(245,158,11,0.05)']}
            style={{ padding: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-amber-500/30">
                  <Dumbbell size={24} color="#f59e0b" />
                </View>
                <View>
                  <Text className="text-lg font-bold text-white">Day {dayNumber} Workout</Text>
                  <Text className="text-sm text-white/60">
                    {todayWorkoutPlan.exercises.length} exercises • {todayWorkoutPlan.totalDuration} min
                  </Text>
                </View>
              </View>
              <View className="items-end">
                <Text className="text-2xl font-bold text-amber-400">{completionPercent}%</Text>
                <Text className="text-xs text-white/40">Complete</Text>
              </View>
            </View>

            {/* Progress bar */}
            <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <View
                className="h-full rounded-full bg-amber-500"
                style={{ width: `${completionPercent}%` }}
              />
            </View>

            {/* Stats row */}
            <View className="mt-3 flex-row justify-between">
              <View className="flex-row items-center">
                <Flame size={14} color="#f97316" />
                <Text className="ml-1 text-sm text-orange-400">{todayWorkoutPlan.estimatedCalories} cal</Text>
              </View>
              <View className="flex-row items-center">
                <Target size={14} color="rgba(255,255,255,0.4)" />
                <Text className="ml-1 text-sm capitalize text-white/60">{todayWorkoutPlan.difficulty}</Text>
              </View>
              <View className="flex-row items-center">
                <Zap size={14} color="rgba(255,255,255,0.4)" />
                <Text className="ml-1 text-sm text-white/60">{todayWorkoutPlan.exercises.reduce((sum, e) => sum + (e.sets ?? 0), 0)} sets</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Exercise list */}
          <View className="p-4">
            {displayedExercises.map((exercise: Exercise, index: number) => (
              <ExerciseItem
                key={exercise.id}
                exercise={exercise}
                index={index}
                isCompleted={completedExercises.has(exercise.id)}
                isActive={activeExerciseId === exercise.id}
                onStart={() => handleStartExercise(exercise.id)}
                onComplete={() => handleCompleteExercise(exercise.id)}
              />
            ))}

            {/* Show more/less button */}
            {todayWorkoutPlan.exercises.length > 3 && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowAllExercises(!showAllExercises);
                }}
                className="mt-2 flex-row items-center justify-center py-2"
              >
                <Text className="mr-1 text-sm text-amber-400">
                  {showAllExercises
                    ? 'Show less'
                    : `Show ${todayWorkoutPlan.exercises.length - 3} more exercises`}
                </Text>
                {showAllExercises ? (
                  <ChevronUp size={16} color="#f59e0b" />
                ) : (
                  <ChevronDown size={16} color="#f59e0b" />
                )}
              </Pressable>
            )}
          </View>
        </View>
      </BlurView>
    </AnimatedCard>
  );
}

// ==================== MEALS CARD WITH NEXT MEAL ====================

function MealsCardWithTimer() {
  const commandoData = useCommandoData();
  const commandoComplete = useCommandoComplete();

  // Get meal selections from store
  const selectedLightMealId = useTodayLightMealId();
  const selectedMainMealId = useTodayMainMealId();
  const lightMealEaten = useTodayLightMealEaten();
  const mainMealEaten = useTodayMainMealEaten();
  const markLightMealEaten = useMealSelectionStore((s) => s.markLightMealEaten);
  const markMainMealEaten = useMealSelectionStore((s) => s.markMainMealEaten);

  const todayDate = new Date().toISOString().split('T')[0];
  const hasMealsSelected = selectedLightMealId || selectedMainMealId;

  // Get day number
  const dayNumber = new Date().getDate() % 7 || 7;

  // Generate personalized fasting and meals
  const fastingPlan = useMemo(() => {
    if (!commandoComplete) return null;
    return FastingPlanEngine.determineFastingPlan(commandoData);
  }, [commandoData, commandoComplete]);

  // Generate meal options to find selected meals
  const { lightMealOptions, mainMealOptions } = useMemo(() => {
    if (!commandoComplete) return { lightMealOptions: [], mainMealOptions: [] };

    const dailyCalories = MealPlanEngine.calculateCalorieTarget(commandoData);
    const dailyProtein = MealPlanEngine.calculateProteinTarget(commandoData);

    return {
      lightMealOptions: MealPlanEngine.generateMealOptions(
        'lunch',
        dailyCalories * 0.35,
        dailyProtein * 0.35,
        dayNumber
      ),
      mainMealOptions: MealPlanEngine.generateMealOptions(
        'dinner',
        dailyCalories * 0.65,
        dailyProtein * 0.65,
        dayNumber
      ),
    };
  }, [commandoData, commandoComplete, dayNumber]);

  // Find selected meals from options
  const selectedLightMeal = useMemo(() => {
    if (!selectedLightMealId) return null;
    return lightMealOptions.find((m) => m.id === selectedLightMealId) ?? null;
  }, [selectedLightMealId, lightMealOptions]);

  const selectedMainMeal = useMemo(() => {
    if (!selectedMainMealId) return null;
    return mainMealOptions.find((m) => m.id === selectedMainMealId) ?? null;
  }, [selectedMainMealId, mainMealOptions]);

  // Determine next meal time
  const nextMealTime = useMemo(() => {
    if (!fastingPlan) return null;
    const [startH, startM] = fastingPlan.window.eatingStartTime.split(':').map(Number);
    const eatingStart = startH * 60 + startM;

    if (!lightMealEaten) {
      // First meal at eating window start
      return fastingPlan.window.eatingStartTime;
    }

    // Second meal - 4-5 hours after first
    const secondMealTime = eatingStart + 240; // 4 hours later
    const h = Math.floor(secondMealTime / 60);
    const m = secondMealTime % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, [fastingPlan, lightMealEaten]);

  const countdown = useCountdownTimer(nextMealTime);

  // Calculate total nutrition from selected meals - must be before early returns
  const totalNutrition = useMemo(() => {
    const calories = (selectedLightMeal?.nutrition.calories ?? 0) + (selectedMainMeal?.nutrition.calories ?? 0);
    const protein = (selectedLightMeal?.nutrition.protein ?? 0) + (selectedMainMeal?.nutrition.protein ?? 0);
    const carbs = (selectedLightMeal?.nutrition.carbs ?? 0) + (selectedMainMeal?.nutrition.carbs ?? 0);
    const fat = (selectedLightMeal?.nutrition.fat ?? 0) + (selectedMainMeal?.nutrition.fat ?? 0);
    return { calories, protein, carbs, fat };
  }, [selectedLightMeal, selectedMainMeal]);

  const handleMealComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!lightMealEaten && selectedLightMealId) {
      markLightMealEaten(todayDate);
    } else if (!mainMealEaten && selectedMainMealId) {
      markMainMealEaten(todayDate);
    }
  }, [lightMealEaten, mainMealEaten, selectedLightMealId, selectedMainMealId, markLightMealEaten, markMainMealEaten, todayDate]);

  if (!commandoComplete || !fastingPlan) {
    return (
      <AnimatedCard delay={300}>
        <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <View className="p-6">
            <Text className="text-center text-white/60">
              Complete onboarding to see your meal plan
            </Text>
          </View>
        </BlurView>
      </AnimatedCard>
    );
  }

  // Show "CHOOSE YOUR MEAL(S)" if no meals selected
  if (!hasMealsSelected) {
    return (
      <AnimatedCard delay={300} onPress={() => router.push('/(tabs)/meals')}>
        <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(6,182,212,0.2)', 'rgba(6,182,212,0.05)']}
            style={{ padding: 24, alignItems: 'center' }}
          >
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-cyan-500/20">
              <Utensils size={32} color="#06b6d4" />
            </View>
            <Text className="mb-2 text-xl font-bold text-white">CHOOSE YOUR MEAL(S)</Text>
            <Text className="mb-4 text-center text-sm text-white/60">
              Select your meals for today from 3 options per meal slot
            </Text>
            <View className="flex-row items-center rounded-xl bg-cyan-500/20 px-4 py-2">
              <Text className="mr-2 font-medium text-cyan-400">Go to Meals</Text>
              <ChevronRight size={18} color="#06b6d4" />
            </View>
          </LinearGradient>
        </BlurView>
      </AnimatedCard>
    );
  }

  // Determine which meal is next
  const nextMeal = !lightMealEaten && selectedLightMeal ? selectedLightMeal : selectedMainMeal;
  const isNextMealLight = !lightMealEaten && selectedLightMeal;
  const bothMealsEaten = lightMealEaten && mainMealEaten;

  return (
    <AnimatedCard delay={300}>
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
        <View className="border border-white/5">
          {/* Header */}
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Utensils size={24} color="#06b6d4" />
              </View>
              <View>
                <Text className="text-lg font-semibold text-white">Today's Meals</Text>
                <Text className="text-sm text-white/60">
                  {bothMealsEaten ? 'All meals completed!' : `2 meals • ${totalNutrition.calories} cal`}
                </Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/(tabs)/meals')}>
              <ChevronRight size={20} color="rgba(255,255,255,0.4)" />
            </Pressable>
          </View>

          {/* Next meal countdown - only if not all meals eaten */}
          {!bothMealsEaten && nextMeal && (
            <View className="mx-4 mb-4 rounded-xl bg-cyan-500/10 p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-cyan-400">
                    {isNextMealLight ? 'FIRST MEAL (LIGHT)' : 'MAIN MEAL'}
                  </Text>
                  <Text className="text-lg font-semibold text-white">{nextMeal.name}</Text>
                  <Text className="text-sm text-white/60">
                    at {nextMealTime} • {nextMeal.nutrition.calories} cal
                  </Text>
                </View>
                <View className="items-center">
                  <Timer size={20} color="#06b6d4" />
                  <Text className="mt-1 text-lg font-bold text-cyan-400">
                    {countdown.hours}:{countdown.minutes.toString().padStart(2, '0')}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={handleMealComplete}
                className="mt-3 flex-row items-center justify-center rounded-xl bg-cyan-500 py-2"
              >
                <Check size={18} color="white" />
                <Text className="ml-2 font-semibold text-white">Mark as Eaten</Text>
              </Pressable>
            </View>
          )}

          {/* All meals eaten message */}
          {bothMealsEaten && (
            <View className="mx-4 mb-4 items-center rounded-xl bg-emerald-500/10 p-4">
              <Check size={32} color="#10b981" />
              <Text className="mt-2 text-lg font-semibold text-emerald-400">All meals completed!</Text>
              <Text className="text-sm text-white/60">Great job following your meal plan</Text>
            </View>
          )}

          {/* Selected meal thumbnails */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 12 }}
            style={{ flexGrow: 0 }}
          >
            {selectedLightMeal && (
              <Pressable
                onPress={() => router.push(`/meal/${selectedLightMeal.id}`)}
                className="items-center"
              >
                <View
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-xl border-2',
                    lightMealEaten ? 'border-emerald-500' : 'border-cyan-500'
                  )}
                >
                  <Image
                    source={{ uri: selectedLightMeal.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  {lightMealEaten && (
                    <View className="absolute inset-0 items-center justify-center bg-emerald-500/50">
                      <Check size={24} color="white" />
                    </View>
                  )}
                </View>
                <Text className="mt-1 text-xs text-white/60">Light</Text>
              </Pressable>
            )}
            {selectedMainMeal && (
              <Pressable
                onPress={() => router.push(`/meal/${selectedMainMeal.id}`)}
                className="items-center"
              >
                <View
                  className={cn(
                    'h-16 w-16 overflow-hidden rounded-xl border-2',
                    mainMealEaten ? 'border-emerald-500' : 'border-violet-500'
                  )}
                >
                  <Image
                    source={{ uri: selectedMainMeal.imageUrl }}
                    style={{ width: '100%', height: '100%' }}
                    contentFit="cover"
                  />
                  {mainMealEaten && (
                    <View className="absolute inset-0 items-center justify-center bg-emerald-500/50">
                      <Check size={24} color="white" />
                    </View>
                  )}
                </View>
                <Text className="mt-1 text-xs text-white/60">Main</Text>
              </Pressable>
            )}
          </ScrollView>

          {/* Nutrition summary */}
          <View className="mx-4 mb-4 flex-row justify-between rounded-xl bg-white/5 p-3">
            <View className="items-center">
              <Text className="text-lg font-bold text-white">{totalNutrition.calories}</Text>
              <Text className="text-xs text-white/40">Calories</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-cyan-400">{totalNutrition.protein}g</Text>
              <Text className="text-xs text-white/40">Protein</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-amber-400">{totalNutrition.carbs}g</Text>
              <Text className="text-xs text-white/40">Carbs</Text>
            </View>
            <View className="items-center">
              <Text className="text-lg font-bold text-rose-400">{totalNutrition.fat}g</Text>
              <Text className="text-xs text-white/40">Fat</Text>
            </View>
          </View>
        </View>
      </BlurView>
    </AnimatedCard>
  );
}

// ==================== QUICK ACTION BUTTON ====================

function QuickAction({
  icon: Icon,
  label,
  onPress,
  color,
  delay,
}: {
  icon: typeof FileDown;
  label: string;
  onPress: () => void;
  color: string;
  delay: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          scale.value = withSpring(0.95, { damping: 15 });
          setTimeout(() => {
            scale.value = withSpring(1, { damping: 15 });
          }, 100);
          onPress();
        }}
        className="items-center"
      >
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View
            className="items-center border border-white/10 p-4"
            style={{ width: (SCREEN_WIDTH - 64) / 2 }}
          >
            <View
              className="mb-2 h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${color}20` }}
            >
              <Icon size={24} color={color} />
            </View>
            <Text className="text-sm text-white/80">{label}</Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

// ==================== MAIN SCREEN ====================

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const commandoData = useCommandoData();
  const commandoComplete = useCommandoComplete();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Personalized greeting with user's name
  const personalizedGreeting = useMemo(() => {
    if (commandoData.firstName) {
      return `${greeting}, ${commandoData.firstName}`;
    }
    return greeting;
  }, [greeting, commandoData.firstName]);

  const formattedDate = format(new Date(), 'EEEE, MMMM d');

  const handleExportPDF = () => {
    router.push('/pdf-preview');
  };

  // Gender-specific theme
  const theme = useMemo(() => {
    const isMale = commandoData.gender === 'male';
    return {
      gradient: isMale
        ? ['#0f172a', '#1e293b', '#0f172a']
        : ['#1a0a1e', '#2d1a35', '#1a0a1e'],
      accent: isMale ? '#10b981' : '#ec4899',
    };
  }, [commandoData.gender]);

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={theme.gradient as [string, string, string]}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(0).springify()} className="mb-6">
          <Text className="text-base text-white/60">{formattedDate}</Text>
          <Text className="text-3xl font-bold text-white">{personalizedGreeting}</Text>
          {commandoComplete && commandoData.primaryGoal && (
            <View className="mt-2 flex-row items-center">
              <Award size={16} color={theme.accent} />
              <Text className="ml-2 text-sm capitalize" style={{ color: theme.accent }}>
                {commandoData.primaryGoal.replace(/_/g, ' ')}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Fasting Status with Timer */}
        <View className="mb-4">
          <FastingCardWithTimer />
        </View>

        {/* Workout with Exercises */}
        <View className="mb-4">
          <WorkoutCardWithExercises />
        </View>

        {/* Meals with Timer */}
        <View className="mb-6">
          <MealsCardWithTimer />
        </View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(400).springify()} className="mb-2">
          <Text className="mb-3 text-lg font-semibold text-white">Quick Actions</Text>
        </Animated.View>
        <View className="flex-row gap-4">
          <QuickAction
            icon={FileDown}
            label="Export Daily PDF"
            onPress={handleExportPDF}
            color="#10b981"
            delay={450}
          />
          <QuickAction
            icon={Calendar}
            label="Weekly Plan"
            onPress={() => router.push('/weekly-plan')}
            color="#8b5cf6"
            delay={500}
          />
        </View>
      </ScrollView>
    </View>
  );
}

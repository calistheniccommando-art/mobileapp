/**
 * POST-PAYMENT WELCOME SCREEN
 *
 * Gender-aware welcome screen shown immediately after payment completion.
 * Displays Day 1 personalized plan with exercises, fasting, and meals.
 * Transitions to main dashboard after user acknowledges.
 */

import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Dumbbell,
  Utensils,
  Moon,
  Sun,
  ChevronRight,
  Trophy,
  Target,
  Zap,
  Flame,
  Clock,
  Calendar,
  Sparkles,
  Heart,
  Shield,
  Award,
  Play,
  CheckCircle2,
} from 'lucide-react-native';
import { useOnboardingData as useCommandoData } from '@/lib/state/commando-store';
import {
  useSubscriptionStore,
  useHasSeenWelcome,
  useSubscriptionDay,
  useSubscriptionStatus,
} from '@/lib/state/subscription-store';
import {
  PersonalizedPlanEngine,
  ExerciseGenerationEngine,
  FastingPlanEngine,
  MealPlanEngine,
  type DailySchedule,
} from '@/lib/services/personalized-plan-engine';
import type { Exercise, FastingWindow, Meal } from '@/types/fitness';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ==================== GENDER-SPECIFIC CONTENT ====================

const WELCOME_CONTENT = {
  male: {
    headline: 'MISSION ACTIVATED',
    subheadline: 'Your transformation begins NOW, soldier.',
    encouragement:
      'Get ready to transform into a stronger, leaner version of yourself. No excuses. No backing down. Every rep counts.',
    dayLabel: 'DAY',
    workoutTitle: "TODAY'S BATTLE PLAN",
    fastingTitle: 'TACTICAL FASTING',
    mealsTitle: 'FUEL PROTOCOL',
    ctaText: 'BEGIN MISSION',
    motivationalQuote:
      '"The only bad workout is the one that didn\'t happen. Let\'s make today count."',
  },
  female: {
    headline: 'Your Journey Begins',
    subheadline: 'Welcome to your transformation, beautiful.',
    encouragement:
      "Your transformation journey starts today – we'll guide you every step of the way. You're stronger than you know.",
    dayLabel: 'Day',
    workoutTitle: "Today's Workout",
    fastingTitle: 'Wellness Fasting',
    mealsTitle: 'Nourishing Meals',
    ctaText: 'Start My Journey',
    motivationalQuote:
      '"Every step forward is a step toward achieving something bigger and better than your current situation."',
  },
};

// ==================== ANIMATED COMPONENTS ====================

function PulsingIcon({
  icon: Icon,
  color,
  size = 24,
}: {
  icon: typeof Dumbbell;
  color: string;
  size?: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={size} color={color} />
    </Animated.View>
  );
}

function ProgressRing({
  progress,
  color,
  size = 80,
}: {
  progress: number;
  color: string;
  size?: number;
}) {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(500, withTiming(progress, { duration: 1500 }));
  }, [progress]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 4,
        borderColor: `${color}30`,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: size - 8,
          height: size - 8,
          borderRadius: (size - 8) / 2,
          backgroundColor: `${color}20`,
        }}
      />
      <Text style={{ color, fontSize: 24, fontWeight: 'bold' }}>1</Text>
    </View>
  );
}

// ==================== PREVIEW CARDS ====================

function ExercisePreviewCard({
  exercises,
  gender,
  accentColor,
}: {
  exercises: Exercise[];
  gender: 'male' | 'female';
  accentColor: string;
}) {
  const content = WELCOME_CONTENT[gender];
  const displayExercises = exercises.slice(0, 3);

  return (
    <Animated.View entering={SlideInRight.delay(300).springify()} className="mb-4">
      <View
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        <View className="flex-row items-center justify-between p-4 pb-2">
          <View className="flex-row items-center">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Dumbbell size={20} color={accentColor} />
            </View>
            <Text className="text-lg font-bold text-white">{content.workoutTitle}</Text>
          </View>
          <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1">
            <Clock size={14} color="#94a3b8" />
            <Text className="ml-1 text-sm text-slate-400">
              {exercises.length} exercises
            </Text>
          </View>
        </View>

        <View className="px-4 pb-4">
          {displayExercises.map((exercise, index) => (
            <View
              key={exercise.id}
              className="mb-2 flex-row items-center rounded-xl bg-white/5 p-3"
            >
              <View
                className="mr-3 h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Text style={{ color: accentColor, fontWeight: 'bold' }}>{index + 1}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium text-white">{exercise.name}</Text>
                <Text className="text-xs text-slate-400">
                  {exercise.sets} sets × {exercise.reps ?? exercise.duration}
                </Text>
              </View>
              <Play size={16} color={accentColor} />
            </View>
          ))}

          {exercises.length > 3 && (
            <View className="mt-1 flex-row items-center justify-center">
              <Text className="text-sm" style={{ color: accentColor }}>
                +{exercises.length - 3} more exercises
              </Text>
              <ChevronRight size={16} color={accentColor} />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

function FastingPreviewCard({
  fastingWindow,
  gender,
  accentColor,
}: {
  fastingWindow: FastingWindow | null;
  gender: 'male' | 'female';
  accentColor: string;
}) {
  const content = WELCOME_CONTENT[gender];

  if (!fastingWindow) return null;

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <Animated.View entering={SlideInRight.delay(400).springify()} className="mb-4">
      <View
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        <View className="flex-row items-center justify-between p-4 pb-2">
          <View className="flex-row items-center">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: '#8b5cf620' }}
            >
              <Moon size={20} color="#8b5cf6" />
            </View>
            <Text className="text-lg font-bold text-white">{content.fastingTitle}</Text>
          </View>
          <View className="rounded-full bg-purple-500/20 px-3 py-1">
            <Text className="text-sm font-medium text-purple-400">
              {fastingWindow.fastingHours}:{fastingWindow.eatingHours}
            </Text>
          </View>
        </View>

        <View className="flex-row px-4 pb-4">
          <View className="mr-2 flex-1 rounded-xl bg-white/5 p-3">
            <View className="mb-1 flex-row items-center">
              <Moon size={14} color="#8b5cf6" />
              <Text className="ml-1 text-xs text-slate-400">Fasting</Text>
            </View>
            <Text className="text-lg font-bold text-white">
              {formatTime(fastingWindow.fastingStartTime)}
            </Text>
            <Text className="text-xs text-slate-500">
              to {formatTime(fastingWindow.eatingStartTime)}
            </Text>
          </View>
          <View className="ml-2 flex-1 rounded-xl bg-white/5 p-3">
            <View className="mb-1 flex-row items-center">
              <Sun size={14} color="#f59e0b" />
              <Text className="ml-1 text-xs text-slate-400">Eating</Text>
            </View>
            <Text className="text-lg font-bold text-white">
              {formatTime(fastingWindow.eatingStartTime)}
            </Text>
            <Text className="text-xs text-slate-500">
              to {formatTime(fastingWindow.eatingEndTime)}
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function MealsPreviewCard({
  meals,
  gender,
  accentColor,
}: {
  meals: Meal[];
  gender: 'male' | 'female';
  accentColor: string;
}) {
  const content = WELCOME_CONTENT[gender];

  return (
    <Animated.View entering={SlideInRight.delay(500).springify()} className="mb-4">
      <View
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
      >
        <View className="flex-row items-center justify-between p-4 pb-2">
          <View className="flex-row items-center">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: '#f9731620' }}
            >
              <Utensils size={20} color="#f97316" />
            </View>
            <Text className="text-lg font-bold text-white">{content.mealsTitle}</Text>
          </View>
          <View className="rounded-full bg-orange-500/20 px-3 py-1">
            <Text className="text-sm font-medium text-orange-400">
              {meals.length} {meals.length === 1 ? 'meal' : 'meals'}
            </Text>
          </View>
        </View>

        <View className="px-4 pb-4">
          {meals.map((meal, index) => (
            <View
              key={meal.id}
              className="mb-2 flex-row items-center rounded-xl bg-white/5 p-3"
            >
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: '#f9731615' }}
              >
                <Utensils size={18} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-white">{meal.name}</Text>
                <Text className="text-xs text-slate-400">{meal.nutrition.calories} kcal</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs capitalize text-slate-500">{meal.type}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

// ==================== MAIN WELCOME SCREEN ====================

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const commandoData = useCommandoData();
  const subscriptionDay = useSubscriptionDay();
  const subscriptionStatus = useSubscriptionStatus();
  const { markWelcomeSeen } = useSubscriptionStore();

  const gender = commandoData.gender ?? 'male';
  const content = WELCOME_CONTENT[gender];

  // Generate personalized Day 1 plan
  const personalizedPlan = useMemo(() => {
    return PersonalizedPlanEngine.generateDailySchedule(commandoData, 1);
  }, [commandoData]);

  // Theme based on gender
  const theme = useMemo(
    () => ({
      gradient:
        gender === 'male'
          ? (['#0f172a', '#064e3b', '#0f172a'] as const)
          : (['#1a0a1e', '#4a1942', '#1a0a1e'] as const),
      accent: gender === 'male' ? '#10b981' : '#ec4899',
      secondary: gender === 'male' ? '#059669' : '#db2777',
    }),
    [gender]
  );

  const handleContinue = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markWelcomeSeen();
    router.replace('/(tabs)');
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={theme.gradient}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Decorative elements */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: `${theme.accent}10`,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -50,
          left: -50,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: `${theme.secondary}10`,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Day Badge */}
        <Animated.View
          entering={FadeInDown.delay(100).springify()}
          className="mb-4 items-center"
        >
          <View
            className="flex-row items-center rounded-full px-4 py-2"
            style={{ backgroundColor: `${theme.accent}20` }}
          >
            <Calendar size={18} color={theme.accent} />
            <Text className="ml-2 text-lg font-bold" style={{ color: theme.accent }}>
              {content.dayLabel} {subscriptionDay}
            </Text>
            {subscriptionStatus === 'trial' && (
              <View className="ml-2 rounded-full bg-amber-500/20 px-2 py-0.5">
                <Text className="text-xs font-medium text-amber-400">Trial</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Welcome Header */}
        <Animated.View
          entering={FadeInDown.delay(200).springify()}
          className="mb-6 items-center"
        >
          <View className="mb-4">
            <PulsingIcon icon={Trophy} color={theme.accent} size={48} />
          </View>
          <Text
            className="mb-2 text-center text-3xl font-bold text-white"
            style={{ letterSpacing: gender === 'male' ? 2 : 0 }}
          >
            {content.headline}
          </Text>
          {commandoData.firstName && (
            <Text className="mb-2 text-center text-xl text-white/80">
              {commandoData.firstName}
            </Text>
          )}
          <Text className="text-center text-base text-white/60">{content.subheadline}</Text>
        </Animated.View>

        {/* Encouragement Message */}
        <Animated.View
          entering={FadeInDown.delay(300).springify()}
          className="mb-6 rounded-2xl p-4"
          style={{ backgroundColor: `${theme.accent}15` }}
        >
          <View className="mb-2 flex-row items-center">
            {gender === 'male' ? (
              <Shield size={20} color={theme.accent} />
            ) : (
              <Heart size={20} color={theme.accent} />
            )}
            <Text className="ml-2 font-semibold" style={{ color: theme.accent }}>
              {gender === 'male' ? 'Mission Brief' : 'Your Journey'}
            </Text>
          </View>
          <Text className="text-base leading-6 text-white/80">{content.encouragement}</Text>
        </Animated.View>

        {/* Day 1 Plan Preview */}
        <Animated.View entering={FadeIn.delay(400)} className="mb-4">
          <Text className="mb-3 text-lg font-semibold text-white">
            {gender === 'male' ? "Today's Operations" : "Today's Plan"}
          </Text>
        </Animated.View>

        {/* Exercise Preview */}
        <ExercisePreviewCard
          exercises={personalizedPlan.exercises.exercises}
          gender={gender}
          accentColor={theme.accent}
        />

        {/* Fasting Preview */}
        <FastingPreviewCard
          fastingWindow={personalizedPlan.fasting.window}
          gender={gender}
          accentColor={theme.accent}
        />

        {/* Meals Preview */}
        <MealsPreviewCard
          meals={personalizedPlan.meals.meals}
          gender={gender}
          accentColor={theme.accent}
        />

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInUp.delay(600).springify()}
          className="mb-6 flex-row"
        >
          <View className="mr-2 flex-1 items-center rounded-2xl bg-white/5 p-4">
            <Flame size={24} color="#ef4444" />
            <Text className="mt-2 text-xl font-bold text-white">
              {personalizedPlan.exercises.estimatedCalories}
            </Text>
            <Text className="text-xs text-slate-400">Est. Calories</Text>
          </View>
          <View className="mx-2 flex-1 items-center rounded-2xl bg-white/5 p-4">
            <Clock size={24} color="#3b82f6" />
            <Text className="mt-2 text-xl font-bold text-white">
              {personalizedPlan.exercises.estimatedDuration}
            </Text>
            <Text className="text-xs text-slate-400">Minutes</Text>
          </View>
          <View className="ml-2 flex-1 items-center rounded-2xl bg-white/5 p-4">
            <Target size={24} color={theme.accent} />
            <Text className="mt-2 text-xl font-bold text-white">
              {personalizedPlan.exercises.exercises.length}
            </Text>
            <Text className="text-xs text-slate-400">Exercises</Text>
          </View>
        </Animated.View>

        {/* Motivational Quote */}
        <Animated.View
          entering={FadeInUp.delay(700).springify()}
          className="mb-4 rounded-2xl bg-white/5 p-4"
        >
          <View className="mb-2 flex-row items-center">
            <Sparkles size={16} color={theme.accent} />
            <Text className="ml-2 text-xs uppercase tracking-wider text-slate-400">
              Daily Motivation
            </Text>
          </View>
          <Text className="text-base italic leading-6 text-white/70">
            {content.motivationalQuote}
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Bottom CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
          paddingTop: 20,
        }}
      >
        <LinearGradient
          colors={['transparent', theme.gradient[0]]}
          style={{
            position: 'absolute',
            top: -40,
            left: 0,
            right: 0,
            height: 40,
          }}
        />
        <Animated.View entering={FadeInUp.delay(800).springify()}>
          <Pressable
            onPress={handleContinue}
            className="flex-row items-center justify-center rounded-2xl py-4"
            style={{ backgroundColor: theme.accent }}
          >
            <Text className="mr-2 text-lg font-bold text-white">{content.ctaText}</Text>
            <ChevronRight size={24} color="#ffffff" />
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

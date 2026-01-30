/**
 * CALISTHENIC COMMANDO ONBOARDING
 *
 * 37-step onboarding flow with gender branching
 * Male: High-energy, military-style, challenge-oriented
 * Female: Encouraging, nurturing, confidence-focused
 *
 * This file implements all 37 steps (Prompts 1A + 1B + 1C)
 * Steps 1-14: Gender, goals, body assessment, fitness tests
 * Steps 15-27: Training preferences, health data, lifestyle
 * Steps 28-37+: Identity, prediction, processing, transition
 */

import React, { useCallback, useMemo, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
  FadeInUp,
  SlideInRight,
  SlideOutLeft,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Target,
  Shield,
  Zap,
  TrendingUp,
  Flame,
  Heart,
  Brain,
  Clock,
  AlertCircle,
  Dumbbell,
  Sparkles,
  Trophy,
  Star,
  Calendar,
  Ruler,
  Scale,
  Droplets,
  Activity,
  Battery,
  Moon,
  Sun,
  Users,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  useCommandoStore,
  useCurrentStep,
  useStepIndex,
  useOnboardingData as useCommandoOnboardingData,
  useGender,
} from '@/lib/state/commando-store';
import {
  getHeadline,
  getDescription,
  getButtonText,
  getColorTheme,
  getRandomQuote,
} from '@/lib/content/gender-content';
import type {
  UserGender,
  AgeCategory,
  PrimaryGoal,
  BodyType,
  ProblemArea,
  DesiredBody,
  ExperienceLevel,
  LastPeakShape,
  MetabolicType,
  Obstacle,
  TrainingFrequency,
  WorkoutDuration,
  WorkoutTime,
  ActivityLevel,
  EnergyLevel,
  SleepQuality,
} from '@/types/commando';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Steps 1-13 for Prompt 1A
const STEPS_1A = [
  'gender',
  'age',
  'primary_goal',
  'body_type',
  'problem_areas',
  'desired_body',
  'experience',
  'philosophy',
  'fitness_history',
  'metabolism',
  'obstacles',
  'pushup_assessment',
  'pullup_assessment',
  'fitness_summary',
] as const;

// ==================== REUSABLE COMPONENTS ====================

function StepIndicator({ current, total }: { current: number; total: number }) {
  const progress = Math.min(current / total, 1);

  // For more than 15 steps, show a progress bar instead of dots
  if (total > 15) {
    return (
      <View className="flex-1 mx-4">
        <View className="h-1.5 rounded-full bg-white/20 overflow-hidden">
          <Animated.View
            className="h-full rounded-full bg-white"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
        <Text className="text-center text-xs text-white/40 mt-1">
          {current + 1} of {total}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center justify-center gap-1.5">
      {Array.from({ length: Math.min(total, 13) }).map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeIn.delay(i * 30)}
          className={cn(
            'h-1.5 rounded-full',
            i === current ? 'w-6 bg-white' : i < current ? 'w-2 bg-white/50' : 'w-2 bg-white/20'
          )}
        />
      ))}
    </View>
  );
}

function GlassButton({
  onPress,
  children,
  disabled,
  gender,
  variant = 'primary',
}: {
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  gender?: UserGender;
  variant?: 'primary' | 'secondary';
}) {
  const scale = useSharedValue(1);
  const theme = gender ? getColorTheme(gender) : getColorTheme('male');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle} className="w-full">
      <Pressable
        onPress={() => {
          if (!disabled) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onPress();
          }
        }}
        onPressIn={() => {
          scale.value = withSpring(0.96, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
        disabled={disabled}
        className={cn('overflow-hidden rounded-2xl', disabled && 'opacity-40')}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={theme.gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center', borderRadius: 16 }}
          >
            {children}
          </LinearGradient>
        ) : (
          <BlurView intensity={40} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <View className="items-center border border-white/10 px-8 py-4">{children}</View>
          </BlurView>
        )}
      </Pressable>
    </Animated.View>
  );
}

function SelectionCard<T extends string>({
  value,
  label,
  description,
  selected,
  onSelect,
  icon,
  delay = 0,
  gender,
}: {
  value: T;
  label: string;
  description?: string;
  selected: boolean;
  onSelect: (value: T) => void;
  icon?: React.ReactNode;
  delay?: number;
  gender?: UserGender;
}) {
  const scale = useSharedValue(1);
  const theme = gender ? getColorTheme(gender) : getColorTheme('male');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          scale.value = withSequence(
            withTiming(0.95, { duration: 100 }),
            withSpring(1, { damping: 15 })
          );
          onSelect(value);
        }}
        className={cn(
          'overflow-hidden rounded-2xl border-2',
          selected ? 'border-white' : 'border-white/10'
        )}
      >
        <BlurView intensity={30} tint="dark" style={{ overflow: 'hidden' }}>
          <View className={cn('flex-row items-center p-4', selected && 'bg-white/10')}>
            {icon && (
              <View
                className={cn(
                  'mr-4 h-12 w-12 items-center justify-center rounded-xl',
                  selected ? 'bg-white/20' : 'bg-white/5'
                )}
              >
                {icon}
              </View>
            )}
            <View className="flex-1">
              <Text className={cn('text-lg font-semibold', selected ? 'text-white' : 'text-white/90')}>
                {label}
              </Text>
              {description && (
                <Text className={cn('text-sm', selected ? 'text-white/70' : 'text-white/50')}>
                  {description}
                </Text>
              )}
            </View>
            {selected && (
              <View
                className="h-6 w-6 items-center justify-center rounded-full"
                style={{ backgroundColor: theme.primary }}
              >
                <Check size={14} color="white" strokeWidth={3} />
              </View>
            )}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

function MultiSelectCard<T extends string>({
  value,
  label,
  selected,
  onToggle,
  icon,
  delay = 0,
  gender,
}: {
  value: T;
  label: string;
  selected: boolean;
  onToggle: (value: T) => void;
  icon?: React.ReactNode;
  delay?: number;
  gender?: UserGender;
}) {
  const theme = gender ? getColorTheme(gender) : getColorTheme('male');

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onToggle(value);
        }}
        className={cn(
          'flex-row items-center rounded-xl border-2 px-4 py-3',
          selected ? 'border-white bg-white/10' : 'border-white/10 bg-white/5'
        )}
      >
        {icon && <View className="mr-3">{icon}</View>}
        <Text className={cn('flex-1 font-medium', selected ? 'text-white' : 'text-white/70')}>
          {label}
        </Text>
        <View
          className={cn(
            'h-5 w-5 items-center justify-center rounded-md border-2',
            selected ? 'border-white bg-white' : 'border-white/30'
          )}
        >
          {selected && <Check size={12} color={theme.primary} strokeWidth={3} />}
        </View>
      </Pressable>
    </Animated.View>
  );
}

function AssessmentButton({
  value,
  label,
  selected,
  onSelect,
  delay = 0,
  gender,
}: {
  value: number;
  label: string;
  selected: boolean;
  onSelect: (value: number) => void;
  delay?: number;
  gender?: UserGender;
}) {
  const theme = gender ? getColorTheme(gender) : getColorTheme('male');

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} className="flex-1">
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect(value);
        }}
        className={cn(
          'items-center rounded-xl border-2 py-4',
          selected ? 'border-white bg-white/15' : 'border-white/10 bg-white/5'
        )}
      >
        <Text
          className={cn('text-xl font-bold', selected ? 'text-white' : 'text-white/60')}
          style={selected ? { color: theme.primary } : undefined}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ==================== STEP COMPONENTS ====================

// Step 0: Gender Selection (Entry Point)
function GenderStep({ onSelect }: { onSelect: (gender: UserGender) => void }) {
  const scale = useSharedValue(1);
  const maleScale = useSharedValue(1);
  const femaleScale = useSharedValue(1);

  const maleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: maleScale.value }],
  }));

  const femaleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: femaleScale.value }],
  }));

  return (
    <View className="flex-1 items-center justify-center px-6">
      <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-8 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-white/10">
          <Shield size={40} color="#10b981" />
        </View>
        <Text className="mb-2 text-center text-3xl font-bold text-white">Calisthenic Commando</Text>
        <Text className="text-center text-base text-white/60">Your transformation begins now</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400).springify()} className="w-full gap-4">
        {/* Male Card */}
        <Animated.View style={maleAnimatedStyle}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onSelect('male');
            }}
            onPressIn={() => {
              maleScale.value = withSpring(0.96, { damping: 15 });
            }}
            onPressOut={() => {
              maleScale.value = withSpring(1, { damping: 15 });
            }}
            className="h-56 overflow-hidden rounded-3xl"
          >
            {/* Background Image */}
            <View className="absolute inset-0">
              <View className="h-full w-full bg-slate-900">
                {/* Placeholder for masculine, military-style image */}
                <LinearGradient
                  colors={['#0f172a', '#064e3b', '#065f46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: '100%', height: '100%' }}
                />
                {/* Dark overlay for text readability */}
                <View className="absolute inset-0 bg-black/40" />
              </View>
            </View>

            {/* Content */}
            <View className="h-full justify-end p-6">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/30 backdrop-blur-sm">
                <Dumbbell size={28} color="#10b981" strokeWidth={2.5} />
              </View>
              <Text className="mb-1 text-3xl font-bold text-white" style={{ letterSpacing: 1 }}>
                I AM A MAN
              </Text>
              <Text className="text-base font-medium text-emerald-400">
                Military-style training program
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Female Card */}
        <Animated.View style={femaleAnimatedStyle}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              onSelect('female');
            }}
            onPressIn={() => {
              femaleScale.value = withSpring(0.96, { damping: 15 });
            }}
            onPressOut={() => {
              femaleScale.value = withSpring(1, { damping: 15 });
            }}
            className="h-56 overflow-hidden rounded-3xl"
          >
            {/* Background Image */}
            <View className="absolute inset-0">
              <View className="h-full w-full bg-slate-900">
                {/* Placeholder for feminine, wellness-style image */}
                <LinearGradient
                  colors={['#1a0a1e', '#4a1942', '#831843']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ width: '100%', height: '100%' }}
                />
                {/* Dark overlay for text readability */}
                <View className="absolute inset-0 bg-black/40" />
              </View>
            </View>

            {/* Content */}
            <View className="h-full justify-end p-6">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-2xl bg-pink-500/30 backdrop-blur-sm">
                <Heart size={28} color="#ec4899" strokeWidth={2.5} />
              </View>
              <Text className="mb-1 text-3xl font-bold text-white">I Am a Woman</Text>
              <Text className="text-base font-medium text-pink-400">
                Empowering wellness journey
              </Text>
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// Step 1: Age Category
function AgeStep({
  gender,
  selectedAge,
  onSelect,
}: {
  gender: UserGender;
  selectedAge?: AgeCategory;
  onSelect: (age: AgeCategory) => void;
}) {
  const theme = getColorTheme(gender);

  const ageOptions: { value: AgeCategory; label: string; description: string }[] = [
    { value: '18-29', label: '18-29', description: 'Peak energy & recovery' },
    { value: '30-39', label: '30-39', description: 'Prime performance years' },
    { value: '40-49', label: '40-49', description: 'Wisdom meets strength' },
    { value: '50+', label: '50+', description: 'Experience is power' },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'age')}</Text>
        <Text className="mb-8 text-base text-white/60">{getDescription(gender, 'age')}</Text>
      </Animated.View>

      <View className="gap-3">
        {ageOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedAge === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={
              <Text className="text-2xl font-bold" style={{ color: theme.primary }}>
                {option.value.split('-')[0]}
              </Text>
            }
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 2: Primary Goal
function PrimaryGoalStep({
  gender,
  selectedGoal,
  onSelect,
}: {
  gender: UserGender;
  selectedGoal?: PrimaryGoal;
  onSelect: (goal: PrimaryGoal) => void;
}) {
  const theme = getColorTheme(gender);

  const goalOptions: {
    value: PrimaryGoal;
    label: string;
    description: string;
    icon: React.ReactNode;
    gradient: readonly [string, string, string];
  }[] = [
    {
      value: 'build_muscle',
      label: gender === 'male' ? 'Build Muscle and Strength' : 'Build Strength and Tone',
      description: gender === 'male' ? 'Pack on serious mass' : 'Get stronger & toned',
      icon: <Dumbbell size={28} color="white" strokeWidth={2.5} />,
      gradient:
        gender === 'male'
          ? (['#1e3a8a', '#1e40af', '#3b82f6'] as const)
          : (['#7e22ce', '#9333ea', '#a855f7'] as const),
    },
    {
      value: 'lose_weight',
      label: gender === 'male' ? 'Burn Fat and Reclaim Power' : 'Slim Down and Feel Lighter',
      description: gender === 'male' ? 'Shed fat, reveal muscle' : 'Feel confident & lighter',
      icon: <Flame size={28} color="white" strokeWidth={2.5} />,
      gradient:
        gender === 'male'
          ? (['#dc2626', '#ef4444', '#f87171'] as const)
          : (['#ec4899', '#f472b6', '#fbcfe8'] as const),
    },
    {
      value: 'gain_muscle_lose_weight',
      label: gender === 'male' ? 'Total Body Transformation' : 'Tone Up and Slim Down',
      description: gender === 'male' ? 'Build muscle while cutting fat' : 'Tone up & slim down',
      icon: <TrendingUp size={28} color="white" strokeWidth={2.5} />,
      gradient:
        gender === 'male'
          ? (['#047857', '#059669', '#10b981'] as const)
          : (['#db2777', '#ec4899', '#f472b6'] as const),
    },
    {
      value: 'get_fit_toned',
      label: gender === 'male' ? 'Discipline and Total Fitness' : 'Feel Strong and Confident',
      description: gender === 'male' ? 'Overall combat readiness' : 'Overall wellness & fitness',
      icon: <Target size={28} color="white" strokeWidth={2.5} />,
      gradient:
        gender === 'male'
          ? (['#ca8a04', '#eab308', '#facc15'] as const)
          : (['#0891b2', '#06b6d4', '#22d3ee'] as const),
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'primary_goal')}</Text>
        <Text className="mb-6 text-base text-white/60">{getDescription(gender, 'primary_goal')}</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-4 pb-6">
          {goalOptions.map((option, index) => {
            const isSelected = selectedGoal === option.value;
            return (
              <Animated.View
                key={option.value}
                entering={FadeInDown.delay(150 + index * 50).springify()}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onSelect(option.value);
                  }}
                  className={cn(
                    'h-36 overflow-hidden rounded-2xl',
                    isSelected ? 'border-4 border-white' : 'border-2 border-white/20'
                  )}
                >
                  {/* Background Gradient */}
                  <View className="absolute inset-0">
                    <LinearGradient
                      colors={option.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: '100%', height: '100%' }}
                    />
                    {/* Overlay for depth */}
                    <View className="absolute inset-0 bg-black/20" />
                  </View>

                  {/* Content */}
                  <View className="h-full flex-row items-center p-5">
                    <View className="mr-4 h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      {option.icon}
                    </View>
                    <View className="flex-1">
                      <Text className="mb-1 text-xl font-bold text-white">{option.label}</Text>
                      <Text className="text-sm text-white/80">{option.description}</Text>
                    </View>
                    {isSelected && (
                      <View className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-white">
                        <Check size={18} color={theme.primary} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// Step 3: Body Type
function BodyTypeStep({
  gender,
  selectedType,
  onSelect,
}: {
  gender: UserGender;
  selectedType?: BodyType;
  onSelect: (type: BodyType) => void;
}) {
  const theme = getColorTheme(gender);

  const bodyTypes: {
    value: BodyType;
    label: string;
    description: string;
    silhouette: string;
  }[] = [
    {
      value: 'slim',
      label: 'Slim',
      description: gender === 'male' ? 'Need to bulk up' : 'Looking to tone',
      silhouette: '▱', // Represents slim body shape
    },
    {
      value: 'average',
      label: 'Average',
      description: gender === 'male' ? 'Ready for transformation' : 'Good starting point',
      silhouette: '▮', // Represents average body shape
    },
    {
      value: 'big',
      label: gender === 'male' ? 'Big' : 'Curvy',
      description: gender === 'male' ? 'Strong foundation' : 'Ready to sculpt',
      silhouette: '▬', // Represents bigger body shape
    },
    {
      value: 'heavy',
      label: 'Heavy',
      description: gender === 'male' ? 'Major transformation ahead' : 'Ready for change',
      silhouette: '█', // Represents heavy body shape
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'body_type')}</Text>
        <Text className="mb-6 text-base text-white/60">{getDescription(gender, 'body_type')}</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-4 pb-6">
          {bodyTypes.map((option, index) => {
            const isSelected = selectedType === option.value;
            return (
              <Animated.View
                key={option.value}
                entering={FadeInDown.delay(150 + index * 50).springify()}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(option.value);
                  }}
                  className={cn(
                    'overflow-hidden rounded-2xl border-2',
                    isSelected ? 'border-white' : 'border-white/20'
                  )}
                >
                  <BlurView intensity={30} tint="dark" style={{ overflow: 'hidden' }}>
                    <View
                      className={cn(
                        'flex-row items-center p-5',
                        isSelected && 'bg-white/10'
                      )}
                    >
                      {/* Visual Silhouette */}
                      <View
                        className={cn(
                          'mr-5 h-24 w-20 items-center justify-center rounded-xl',
                          isSelected ? 'bg-white/20' : 'bg-white/5'
                        )}
                      >
                        <View className="items-center">
                          {/* Body illustration using Unicode characters */}
                          <Text className="text-5xl" style={{ color: theme.primary }}>
                            {option.silhouette}
                          </Text>
                          <View
                            className="mt-1 h-10 rounded-full"
                            style={{
                              width:
                                option.value === 'slim'
                                  ? 8
                                  : option.value === 'average'
                                  ? 12
                                  : option.value === 'big'
                                  ? 16
                                  : 20,
                              backgroundColor: isSelected ? theme.primary : theme.primary + '60',
                            }}
                          />
                        </View>
                      </View>

                      {/* Text Content */}
                      <View className="flex-1">
                        <Text
                          className={cn(
                            'mb-1 text-xl font-bold',
                            isSelected ? 'text-white' : 'text-white/90'
                          )}
                        >
                          {option.label}
                        </Text>
                        <Text
                          className={cn(
                            'text-sm',
                            isSelected ? 'text-white/70' : 'text-white/50'
                          )}
                        >
                          {option.description}
                        </Text>
                      </View>

                      {/* Selection Indicator */}
                      {isSelected && (
                        <View
                          className="ml-3 h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: theme.primary }}
                        >
                          <Check size={16} color="white" strokeWidth={3} />
                        </View>
                      )}
                    </View>
                  </BlurView>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// Step 4: Problem Areas (Multi-select)
function ProblemAreasStep({
  gender,
  selectedAreas,
  onToggle,
}: {
  gender: UserGender;
  selectedAreas: ProblemArea[];
  onToggle: (area: ProblemArea) => void;
}) {
  const theme = getColorTheme(gender);

  const maleAreas: { value: ProblemArea; label: string; description: string }[] = [
    { value: 'weak_chest', label: 'Weak Chest', description: 'Build a stronger, more defined chest' },
    { value: 'slim_arms', label: 'Slim Arms', description: 'Develop bigger, more muscular arms' },
    { value: 'beer_belly', label: 'Beer Belly', description: 'Flatten and tone your midsection' },
    { value: 'slim_legs', label: 'Slim Legs', description: 'Build stronger, more defined legs' },
  ];

  const femaleAreas: { value: ProblemArea; label: string; description: string }[] = [
    { value: 'flabby_arms', label: 'Flabby Arms', description: 'Tone and firm up your arms' },
    { value: 'belly_fat', label: 'Belly Fat', description: 'Flatten and tone your midsection' },
    { value: 'hip_fat', label: 'Hip Fat', description: 'Slim and shape your hips' },
    { value: 'thigh_fat', label: 'Thigh Fat', description: 'Tone and slim your thighs' },
  ];

  const areas = gender === 'male' ? maleAreas : femaleAreas;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'problem_areas')}
        </Text>
        <Text className="mb-2 text-base text-white/60">
          {getDescription(gender, 'problem_areas')}
        </Text>
        <Text className="mb-6 text-sm text-white/40">Select all that apply</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Selection List */}
        <View className="gap-3 pb-6">
          {areas.map((area, index) => {
            const isSelected = selectedAreas.includes(area.value);
            return (
              <Animated.View key={area.value} entering={FadeInDown.delay(200 + index * 50)}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onToggle(area.value);
                  }}
                  className={cn(
                    'flex-row items-center rounded-2xl border-2 p-4',
                    isSelected ? 'border-white bg-white/10' : 'border-white/20 bg-white/5'
                  )}
                >
                  <View
                    className={cn(
                      'mr-4 h-10 w-10 items-center justify-center rounded-full',
                      isSelected ? 'bg-white' : 'bg-white/10'
                    )}
                  >
                    <AlertCircle
                      size={20}
                      color={isSelected ? theme.primary : 'white'}
                      strokeWidth={2.5}
                    />
                  </View>
                  <View className="flex-1">
                    <Text
                      className={cn(
                        'text-lg font-semibold',
                        isSelected ? 'text-white' : 'text-white/70'
                      )}
                    >
                      {area.label}
                    </Text>
                    <Text className="text-sm text-white/50">{area.description}</Text>
                  </View>
                  {isSelected && (
                    <View
                      className="h-6 w-6 items-center justify-center rounded-full"
                      style={{ backgroundColor: theme.primary }}
                    >
                      <Check size={14} color="white" strokeWidth={3} />
                    </View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

// Step 5: Desired Body
function DesiredBodyStep({
  gender,
  selectedBody,
  onSelect,
}: {
  gender: UserGender;
  selectedBody?: DesiredBody;
  onSelect: (body: DesiredBody) => void;
}) {
  const theme = getColorTheme(gender);

  const maleOptions: {
    value: DesiredBody;
    label: string;
    description: string;
    motivation: string;
    gradient: readonly [string, string, string];
  }[] = [
    {
      value: 'fit',
      label: 'Combat Ready',
      description: 'Lean and functional',
      motivation: 'Built for endurance and agility',
      gradient: ['#0f172a', '#1e3a8a', '#3b82f6'] as const,
    },
    {
      value: 'strong',
      label: 'Maximum Strength',
      description: 'Power and mass',
      motivation: 'Dominate with raw power',
      gradient: ['#7f1d1d', '#991b1b', '#dc2626'] as const,
    },
    {
      value: 'athletic',
      label: 'Peak Athlete',
      description: 'Speed and agility',
      motivation: 'The ultimate warrior physique',
      gradient: ['#064e3b', '#047857', '#10b981'] as const,
    },
  ];

  const femaleOptions: {
    value: DesiredBody;
    label: string;
    description: string;
    motivation: string;
    gradient: readonly [string, string, string];
  }[] = [
    {
      value: 'toned',
      label: 'Toned & Defined',
      description: 'Defined muscles, lean look',
      motivation: 'Feel strong and confident in your skin',
      gradient: ['#7e22ce', '#9333ea', '#a855f7'] as const,
    },
    {
      value: 'lean',
      label: 'Lean & Athletic',
      description: 'Slim and athletic',
      motivation: 'Light, energetic, and graceful',
      gradient: ['#0e7490', '#0891b2', '#06b6d4'] as const,
    },
    {
      value: 'curvy_fit',
      label: 'Curvy & Strong',
      description: 'Strong curves, defined shape',
      motivation: 'Embrace your curves with strength',
      gradient: ['#be185d', '#db2777', '#ec4899'] as const,
    },
  ];

  const options = gender === 'male' ? maleOptions : femaleOptions;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      {/* Header with emotional copy */}
      <Animated.View entering={FadeInDown.delay(100)} className="mb-4">
        <Text className="mb-2 text-3xl font-bold text-white">
          {gender === 'male' ? 'Visualize Your Victory' : 'Your Dream Body'}
        </Text>
        <Text className="mb-2 text-base text-white/60">
          {gender === 'male'
            ? "This is where you're going, soldier."
            : "This is the version of you we're building."}
        </Text>
        <View className="mt-3 flex-row items-center rounded-full bg-white/10 px-4 py-2">
          <Sparkles size={16} color={theme.primary} />
          <Text className="ml-2 text-sm font-medium text-white/80">
            {gender === 'male'
              ? 'Choose your battle-ready physique'
              : 'Choose the body that makes you feel amazing'}
          </Text>
        </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="gap-5 pb-6">
          {options.map((option, index) => {
            const isSelected = selectedBody === option.value;
            return (
              <Animated.View
                key={option.value}
                entering={FadeInDown.delay(200 + index * 100).springify()}
              >
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    onSelect(option.value);
                  }}
                  className={cn(
                    'h-48 overflow-hidden rounded-3xl',
                    isSelected ? 'border-4 border-white' : 'border-2 border-white/20'
                  )}
                >
                  {/* Background Gradient (Placeholder for inspiring physique images) */}
                  <View className="absolute inset-0">
                    <LinearGradient
                      colors={option.gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ width: '100%', height: '100%' }}
                    />
                    {/* Overlay for text readability */}
                    <View className="absolute inset-0 bg-black/30" />

                    {/* Inspirational Icon */}
                    <View className="absolute right-6 top-6 opacity-20">
                      <Trophy size={80} color="white" />
                    </View>
                  </View>

                  {/* Content */}
                  <View className="h-full justify-end p-6">
                    {/* Badge */}
                    <View className="mb-3 self-start rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                      <Text className="text-xs font-bold uppercase tracking-wider text-white">
                        {gender === 'male' ? 'Your Mission' : 'Your Goal'}
                      </Text>
                    </View>

                    {/* Title */}
                    <Text className="mb-2 text-3xl font-bold text-white" style={{ letterSpacing: gender === 'male' ? 1 : 0 }}>
                      {option.label}
                    </Text>

                    {/* Description */}
                    <Text className="mb-1 text-base font-medium text-white/90">
                      {option.description}
                    </Text>

                    {/* Motivation */}
                    <Text className="text-sm italic text-white/70">
                      {option.motivation}
                    </Text>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <View className="absolute right-6 top-6">
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg">
                          <Check size={24} color={theme.primary} strokeWidth={3} />
                        </View>
                      </View>
                    )}
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Emotional Encouragement */}
        <Animated.View
          entering={FadeInUp.delay(600)}
          className="mb-6 rounded-2xl bg-white/5 p-5"
        >
          <View className="mb-3 flex-row items-center">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: theme.primary + '20' }}
            >
              <Heart size={20} color={theme.primary} />
            </View>
            <Text className="flex-1 text-base font-semibold text-white">
              {gender === 'male' ? 'Remember, Soldier:' : 'Remember:'}
            </Text>
          </View>
          <Text className="leading-6 text-white/70">
            {gender === 'male'
              ? 'This transformation is within your reach. Every warrior starts somewhere. Your mission begins today.'
              : 'This transformation is within your reach. Every journey starts with a single step. Your beautiful transformation begins today.'}
          </Text>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

// Step 6: Experience Level
function ExperienceStep({
  gender,
  selectedLevel,
  onSelect,
}: {
  gender: UserGender;
  selectedLevel?: ExperienceLevel;
  onSelect: (level: ExperienceLevel) => void;
}) {
  const theme = getColorTheme(gender);

  const experienceOptions: { value: ExperienceLevel; label: string; description: string }[] = [
    {
      value: 'never',
      label: gender === 'male' ? 'New Recruit' : 'Complete Beginner',
      description: gender === 'male' ? 'Never trained like this before' : 'Just starting my journey',
    },
    {
      value: 'beginner',
      label: 'Beginner',
      description: gender === 'male' ? 'Some basic training' : 'Some fitness experience',
    },
    {
      value: 'some',
      label: gender === 'male' ? 'Some Experience' : 'Intermediate',
      description: gender === 'male' ? 'Know the basics' : 'Comfortable with workouts',
    },
    {
      value: 'regular',
      label: gender === 'male' ? 'Trained Soldier' : 'Experienced',
      description: gender === 'male' ? 'Regular training background' : 'Regular fitness routine',
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: gender === 'male' ? 'Elite level training' : 'High level fitness',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'experience')}</Text>
        <Text className="mb-8 text-base text-white/60">{getDescription(gender, 'experience')}</Text>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
        {experienceOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedLevel === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
}

// Step 7: Philosophy Intro Screen
function PhilosophyStep({
  gender,
  onContinue,
}: {
  gender: UserGender;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const maleContent = {
    title: 'The Commando Way',
    points: [
      { icon: Shield, text: 'Functional strength through bodyweight' },
      { icon: Zap, text: 'Endurance that never quits' },
      { icon: Brain, text: 'Mental resilience & discipline' },
      { icon: Target, text: 'No equipment. No excuses.' },
    ],
  };

  const femaleContent = {
    title: 'Our Wellness Philosophy',
    points: [
      { icon: Heart, text: 'Effective, equipment-free workouts' },
      { icon: Sparkles, text: 'Build confidence & strength' },
      { icon: Brain, text: 'Mind-body connection' },
      { icon: Target, text: 'Sustainable, lasting results' },
    ],
  };

  const content = gender === 'male' ? maleContent : femaleContent;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{content.title}</Text>
        <Text className="mb-8 text-base text-white/60">{getDescription(gender, 'philosophy')}</Text>
      </Animated.View>

      <View className="mb-8 gap-4">
        {content.points.map((point, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(200 + index * 100)}
            className="flex-row items-center rounded-xl bg-white/5 p-4"
          >
            <View
              className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <point.icon size={24} color={theme.primary} />
            </View>
            <Text className="flex-1 text-base font-medium text-white">{point.text}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(600)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 8: Fitness History
function FitnessHistoryStep({
  gender,
  selectedHistory,
  onSelect,
}: {
  gender: UserGender;
  selectedHistory?: LastPeakShape;
  onSelect: (history: LastPeakShape) => void;
}) {
  const theme = getColorTheme(gender);

  const historyOptions: { value: LastPeakShape; label: string; description: string }[] = [
    {
      value: 'less_than_1yr',
      label: 'Less than 1 year ago',
      description: gender === 'male' ? 'Still got it' : 'Recent fitness',
    },
    {
      value: '1_to_3yrs',
      label: '1-3 years ago',
      description: gender === 'male' ? 'Time to reclaim' : 'Ready to return',
    },
    {
      value: 'more_than_3yrs',
      label: 'Over 3 years ago',
      description: gender === 'male' ? 'Major comeback incoming' : 'Fresh start',
    },
    {
      value: 'never',
      label: 'Never been in peak shape',
      description: gender === 'male' ? 'First time is always special' : 'Your time is now',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'fitness_history')}</Text>
        <Text className="mb-8 text-base text-white/60">{getDescription(gender, 'fitness_history')}</Text>
      </Animated.View>

      <View className="gap-3">
        {historyOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedHistory === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Clock size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 9: Metabolism
function MetabolismStep({
  gender,
  selectedType,
  onSelect,
}: {
  gender: UserGender;
  selectedType?: MetabolicType;
  onSelect: (type: MetabolicType) => void;
}) {
  const theme = getColorTheme(gender);

  const metabolismOptions: { value: MetabolicType; label: string; description: string }[] = [
    {
      value: 'fast',
      label: gender === 'male' ? 'Fast Burner' : 'Lose Weight Easily',
      description: 'Hard to gain weight',
    },
    {
      value: 'normal',
      label: 'Balanced',
      description: 'Weight stays relatively stable',
    },
    {
      value: 'slow',
      label: gender === 'male' ? 'Slow Burner' : 'Gain Weight Easily',
      description: 'Tend to gain weight easily',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'metabolism')}</Text>
        <Text className="mb-8 text-base text-white/60">{getDescription(gender, 'metabolism')}</Text>
      </Animated.View>

      <View className="gap-3">
        {metabolismOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedType === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Flame size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 10: Obstacles (Multi-select)
function ObstaclesStep({
  gender,
  selectedObstacles,
  onToggle,
}: {
  gender: UserGender;
  selectedObstacles: Obstacle[];
  onToggle: (obstacle: Obstacle) => void;
}) {
  const theme = getColorTheme(gender);

  const obstacleOptions: { value: Obstacle; label: string }[] = [
    { value: 'lack_time', label: gender === 'male' ? 'Lack of Time' : 'Busy Schedule' },
    { value: 'lack_motivation', label: 'Lack of Motivation' },
    { value: 'lack_knowledge', label: gender === 'male' ? 'Lack of Knowledge' : 'Not Sure Where to Start' },
    { value: 'busy_schedule', label: gender === 'male' ? 'Consistency Issues' : 'Hard to Stay Consistent' },
    { value: 'injuries', label: 'Past or Current Injuries' },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">{getHeadline(gender, 'obstacles')}</Text>
        <Text className="mb-2 text-base text-white/60">{getDescription(gender, 'obstacles')}</Text>
        <Text className="mb-6 text-sm text-white/40">Select all that apply</Text>
      </Animated.View>

      <View className="gap-3">
        {obstacleOptions.map((obstacle, index) => (
          <MultiSelectCard
            key={obstacle.value}
            value={obstacle.value}
            label={obstacle.label}
            selected={selectedObstacles.includes(obstacle.value)}
            onToggle={onToggle}
            gender={gender}
            delay={150 + index * 50}
            icon={
              <AlertCircle size={20} color={selectedObstacles.includes(obstacle.value) ? 'white' : theme.primary} />
            }
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 11: Push-up Assessment
function PushupAssessmentStep({
  gender,
  selectedCount,
  onSelect,
}: {
  gender: UserGender;
  selectedCount?: number;
  onSelect: (count: number) => void;
}) {
  const theme = getColorTheme(gender);

  const pushupOptions = [
    { value: 0, label: 'None' },
    { value: 5, label: '1-10' },
    { value: 18, label: '11-25' },
    { value: 30, label: '25+' },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-6 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Dumbbell size={40} color={theme.primary} />
        </View>
        <Text className="mb-2 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'pushup_assessment')}
        </Text>
        <Text className="mb-8 text-center text-base text-white/60">
          {getDescription(gender, 'pushup_assessment')}
        </Text>
      </Animated.View>

      <View className="mb-6 gap-3">
        {pushupOptions.map((option, index) => (
          <Animated.View key={option.value} entering={FadeInDown.delay(200 + index * 50)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(option.value);
              }}
              className={cn(
                'items-center rounded-2xl border-2 py-5',
                selectedCount === option.value ? 'border-white bg-white/15' : 'border-white/10 bg-white/5'
              )}
            >
              <Text
                className={cn('text-2xl font-bold', selectedCount === option.value ? 'text-white' : 'text-white/60')}
              >
                {option.label}
              </Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// Step 12: Wall Sit Assessment (No Equipment Required)
function WallSitAssessmentStep({
  gender,
  selectedDuration,
  onSelect,
}: {
  gender: UserGender;
  selectedDuration?: number;
  onSelect: (duration: number) => void;
}) {
  const theme = getColorTheme(gender);

  const wallSitOptions = [
    { value: 0, label: 'Never tried', description: 'New to wall sits' },
    { value: 15, label: 'Under 30 seconds', description: 'Just getting started' },
    { value: 45, label: '30-60 seconds', description: 'Building endurance' },
    { value: 90, label: '1+ minute', description: 'Strong legs!' },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-6 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <TrendingUp size={40} color={theme.primary} />
        </View>
        <Text className="mb-2 text-center text-3xl font-bold text-white">
          {gender === 'male' ? 'Wall Sit Hold' : 'Wall Sit Test'}
        </Text>
        <Text className="mb-2 text-center text-base text-white/60">
          {gender === 'male'
            ? 'No equipment needed. How long can you hold a wall sit?'
            : 'This requires no equipment. How long can you hold?'}
        </Text>
        <Text className="mb-6 text-center text-sm text-white/40">
          Back flat against wall, thighs parallel to floor
        </Text>
      </Animated.View>

      <View className="mb-6 gap-3">
        {wallSitOptions.map((option, index) => (
          <Animated.View key={option.value} entering={FadeInDown.delay(200 + index * 50)}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect(option.value);
              }}
              className={cn(
                'rounded-2xl border-2 px-4 py-4',
                selectedDuration === option.value ? 'border-white bg-white/15' : 'border-white/10 bg-white/5'
              )}
            >
              <Text
                className={cn('text-xl font-bold', selectedDuration === option.value ? 'text-white' : 'text-white/60')}
              >
                {option.label}
              </Text>
              <Text className="text-sm text-white/40">{option.description}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// Step 13: Fitness Summary
function FitnessSummaryStep({
  gender,
  pushUpCount,
  wallSitDuration,
  onContinue,
}: {
  gender: UserGender;
  pushUpCount: number;
  wallSitDuration: number;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  // Calculate scores (same logic as commando-store)
  let strengthScore = 0;
  if (pushUpCount >= 30) strengthScore = 90;
  else if (pushUpCount >= 18) strengthScore = 70;
  else if (pushUpCount >= 5) strengthScore = 45;
  else strengthScore = 20;

  // Wall sit endurance score (based on duration in seconds)
  let enduranceScore = 0;
  if (wallSitDuration >= 90) enduranceScore = 90;
  else if (wallSitDuration >= 45) enduranceScore = 70;
  else if (wallSitDuration >= 15) enduranceScore = 50;
  else enduranceScore = 25;

  const avgScore = (strengthScore + enduranceScore) / 2;
  let level = 'Beginner';
  let levelDescription = '';
  if (avgScore >= 75) {
    level = gender === 'male' ? 'Combat Ready' : 'Advanced';
    levelDescription = gender === 'male' ? 'You\'re already a warrior. Let\'s make you elite.' : 'You\'re already strong. Let\'s elevate you further.';
  } else if (avgScore >= 50) {
    level = gender === 'male' ? 'Solid Foundation' : 'Intermediate';
    levelDescription = gender === 'male' ? 'Good base. Time to level up.' : 'Great foundation. Let\'s build on it.';
  } else {
    level = gender === 'male' ? 'New Recruit' : 'Beginner';
    levelDescription = gender === 'male' ? 'Everyone starts somewhere. Your transformation begins now.' : 'Perfect starting point. We\'ll guide you every step.';
  }

  const strengthProgress = useSharedValue(0);
  const enduranceProgress = useSharedValue(0);

  useEffect(() => {
    strengthProgress.value = withDelay(500, withTiming(strengthScore / 100, { duration: 1000, easing: Easing.out(Easing.cubic) }));
    enduranceProgress.value = withDelay(700, withTiming(enduranceScore / 100, { duration: 1000, easing: Easing.out(Easing.cubic) }));
  }, []);

  const strengthBarStyle = useAnimatedStyle(() => ({
    width: `${strengthProgress.value * 100}%`,
  }));

  const enduranceBarStyle = useAnimatedStyle(() => ({
    width: `${enduranceProgress.value * 100}%`,
  }));

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Trophy size={40} color={theme.primary} />
        </View>
        <Text className="mb-1 text-3xl font-bold text-white">{getHeadline(gender, 'fitness_summary')}</Text>
        <Text className="mb-6 text-center text-base text-white/60">{getDescription(gender, 'fitness_summary')}</Text>
      </Animated.View>

      {/* Level Badge */}
      <Animated.View entering={FadeInDown.delay(300)} className="mb-6 items-center">
        <View className="rounded-full px-6 py-2" style={{ backgroundColor: `${theme.primary}30` }}>
          <Text className="text-lg font-bold" style={{ color: theme.primary }}>
            {level}
          </Text>
        </View>
        <Text className="mt-2 text-center text-sm text-white/60">{levelDescription}</Text>
      </Animated.View>

      {/* Score Bars */}
      <Animated.View entering={FadeInDown.delay(400)} className="mb-4 rounded-2xl bg-white/5 p-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-white/70">Strength Score</Text>
          <Text className="text-sm font-bold text-white">{strengthScore}%</Text>
        </View>
        <View className="h-3 overflow-hidden rounded-full bg-white/10">
          <Animated.View className="h-full rounded-full" style={[{ backgroundColor: theme.primary }, strengthBarStyle]} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500)} className="mb-8 rounded-2xl bg-white/5 p-4">
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-sm font-medium text-white/70">Endurance Score</Text>
          <Text className="text-sm font-bold text-white">{enduranceScore}%</Text>
        </View>
        <View className="h-3 overflow-hidden rounded-full bg-white/10">
          <Animated.View
            className="h-full rounded-full"
            style={[{ backgroundColor: theme.secondary }, enduranceBarStyle]}
          />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(700)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// ==================== STEPS 14-26 (PROMPT 1B) ====================

// Step 14: Philosophy Comparison
function PhilosophyComparisonStep({
  gender,
  onContinue,
}: {
  gender: UserGender;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const gymDrawbacks = gender === 'male'
    ? [
        'Expensive memberships drain your wallet',
        'Crowded equipment wastes your time',
        'Machine-dependent = weakness',
        'No functional real-world strength',
      ]
    : [
        'Expensive monthly costs',
        'Intimidating environment',
        'Equipment-dependent results',
        'Limited functional fitness',
      ];

  const calisthenicsAdvantages = gender === 'male'
    ? [
        'Train anywhere, anytime - no excuses',
        'Build real combat-ready strength',
        'Master your own body weight',
        'Develop discipline & mental fortitude',
      ]
    : [
        'Workout anywhere, anytime',
        'Build real functional strength',
        'Learn to master your body',
        'Develop confidence & resilience',
      ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'philosophy_comparison')}
        </Text>
        <Text className="mb-6 text-base text-white/60">
          {getDescription(gender, 'philosophy_comparison')}
        </Text>
      </Animated.View>

      {/* Gym vs Calisthenics comparison */}
      <Animated.View entering={FadeInDown.delay(200)} className="mb-4">
        <View className="mb-2 flex-row items-center">
          <View className="mr-2 h-3 w-3 rounded-full bg-red-500/50" />
          <Text className="text-sm font-medium text-red-400">
            {gender === 'male' ? 'Traditional Gym' : 'Gym Workouts'}
          </Text>
        </View>
        <View className="gap-2 rounded-xl bg-red-500/10 p-3">
          {gymDrawbacks.map((item, index) => (
            <View key={index} className="flex-row items-start">
              <Text className="mr-2 text-red-400">✗</Text>
              <Text className="flex-1 text-sm text-white/70">{item}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350)} className="mb-6">
        <View className="mb-2 flex-row items-center">
          <View className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: theme.primary }} />
          <Text className="text-sm font-medium" style={{ color: theme.primary }}>
            {gender === 'male' ? 'Military Calisthenics' : 'Bodyweight Training'}
          </Text>
        </View>
        <View className="gap-2 rounded-xl p-3" style={{ backgroundColor: `${theme.primary}15` }}>
          {calisthenicsAdvantages.map((item, index) => (
            <View key={index} className="flex-row items-start">
              <Text className="mr-2" style={{ color: theme.primary }}>✓</Text>
              <Text className="flex-1 text-sm text-white/90">{item}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {gender === 'male' ? 'I\'m Ready to Train' : 'Let\'s Do This'}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 15: Training Frequency
function TrainingFrequencyStep({
  gender,
  selectedFrequency,
  onSelect,
}: {
  gender: UserGender;
  selectedFrequency?: TrainingFrequency;
  onSelect: (frequency: TrainingFrequency) => void;
}) {
  const theme = getColorTheme(gender);

  const frequencyOptions: { value: TrainingFrequency; label: string; description: string }[] = [
    {
      value: '2-3',
      label: '3 days/week',
      description: gender === 'male' ? 'Strategic recovery' : 'Balanced schedule',
    },
    {
      value: '4-5',
      label: '4-5 days/week',
      description: gender === 'male' ? 'Optimal for gains' : 'Recommended for results',
    },
    {
      value: '6-7',
      label: '6 days/week',
      description: gender === 'male' ? 'Maximum intensity' : 'Advanced commitment',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'training_frequency')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {getDescription(gender, 'training_frequency')}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {frequencyOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedFrequency === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Calendar size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 16: Workout Duration
function WorkoutDurationStep({
  gender,
  selectedDuration,
  onSelect,
}: {
  gender: UserGender;
  selectedDuration?: WorkoutDuration;
  onSelect: (duration: WorkoutDuration) => void;
}) {
  const theme = getColorTheme(gender);

  const durationOptions: { value: WorkoutDuration; label: string; description: string }[] = [
    {
      value: '15-20',
      label: '20-30 minutes',
      description: gender === 'male' ? 'Quick & intense' : 'Quick sessions',
    },
    {
      value: '30-45',
      label: '30-45 minutes',
      description: gender === 'male' ? 'Optimal training window' : 'Ideal balance',
    },
    {
      value: '45-60',
      label: '45-60 minutes',
      description: gender === 'male' ? 'Full combat training' : 'Comprehensive workout',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'workout_duration')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {getDescription(gender, 'workout_duration')}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {durationOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedDuration === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Clock size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 17: Workout Time Preference
function WorkoutTimeStep({
  gender,
  selectedTime,
  onSelect,
}: {
  gender: UserGender;
  selectedTime?: WorkoutTime;
  onSelect: (time: WorkoutTime) => void;
}) {
  const theme = getColorTheme(gender);

  const timeOptions: { value: WorkoutTime; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'morning',
      label: 'Morning',
      description: gender === 'male' ? 'Start the day strong' : 'Energize your day',
      icon: <Sun size={24} color={theme.primary} />,
    },
    {
      value: 'afternoon',
      label: 'Afternoon',
      description: gender === 'male' ? 'Peak performance hours' : 'Midday boost',
      icon: <Activity size={24} color={theme.primary} />,
    },
    {
      value: 'evening',
      label: 'Evening',
      description: gender === 'male' ? 'End day with victory' : 'Unwind & strengthen',
      icon: <Moon size={24} color={theme.primary} />,
    },
    {
      value: 'flexible',
      label: 'Flexible',
      description: gender === 'male' ? 'Adapt & overcome' : 'Whenever works best',
      icon: <Clock size={24} color={theme.primary} />,
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'workout_time')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {getDescription(gender, 'workout_time')}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {timeOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedTime === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={option.icon}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 18: Hormonal Optimization Education
function HormonalInfoStep({
  gender,
  onContinue,
}: {
  gender: UserGender;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const maleContent = {
    title: 'Optimize Your Performance',
    subtitle: 'Understanding hormones for maximum gains',
    points: [
      {
        icon: TrendingUp,
        title: 'Boost Testosterone',
        description: 'Compound movements & fasting increase natural testosterone production',
      },
      {
        icon: Flame,
        title: 'Control Cortisol',
        description: 'Proper training timing prevents stress hormone spikes',
      },
      {
        icon: Zap,
        title: 'Growth Hormone',
        description: 'Fasted training amplifies HGH for muscle growth & fat loss',
      },
      {
        icon: Clock,
        title: 'Timing Matters',
        description: 'Train during peak testosterone hours for optimal results',
      },
    ],
  };

  const femaleContent = {
    title: 'Balancing Your Body',
    subtitle: 'Work with your hormones, not against them',
    points: [
      {
        icon: Heart,
        title: 'Estrogen Balance',
        description: 'Exercise helps maintain healthy estrogen levels naturally',
      },
      {
        icon: Flame,
        title: 'Stress Management',
        description: 'Moderate exercise reduces cortisol and anxiety',
      },
      {
        icon: Sparkles,
        title: 'Natural Energy',
        description: 'Consistent training improves energy and mood stability',
      },
      {
        icon: Moon,
        title: 'Cycle-Aware Training',
        description: 'We\'ll adapt intensity to support your natural rhythms',
      },
    ],
  };

  const content = gender === 'male' ? maleContent : femaleContent;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Brain size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">{content.title}</Text>
        <Text className="mb-6 text-center text-base text-white/60">{content.subtitle}</Text>
      </Animated.View>

      <View className="mb-6 gap-3">
        {content.points.map((point, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(200 + index * 80)}
            className="flex-row items-start rounded-xl bg-white/5 p-4"
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <point.icon size={20} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="mb-0.5 text-base font-semibold text-white">{point.title}</Text>
              <Text className="text-sm text-white/60">{point.description}</Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(600)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 19: Height Input
function HeightInputStep({
  gender,
  height,
  onChangeHeight,
  onContinue,
}: {
  gender: UserGender;
  height?: number;
  onChangeHeight: (height: number) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const [heightStr, setHeightStr] = useState(height?.toString() ?? '');

  const isValid = heightStr && parseInt(heightStr) >= 100 && parseInt(heightStr) <= 250;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Ruler size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {gender === 'male' ? 'How Tall Are You?' : 'Your Height'}
        </Text>
        <Text className="mb-8 text-center text-base text-white/60">
          {gender === 'male' ? 'Every warrior needs accurate stats' : 'This helps us personalize your plan'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <View className="flex-row items-center border border-white/10 px-6 py-5">
            <TextInput
              value={heightStr}
              onChangeText={(text) => {
                setHeightStr(text);
                if (text && parseInt(text) > 0) {
                  onChangeHeight(parseInt(text));
                }
              }}
              keyboardType="numeric"
              placeholder="175"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 text-center text-5xl font-bold text-white"
              maxLength={3}
            />
            <Text className="ml-2 text-2xl text-white/40">cm</Text>
          </View>
        </BlurView>
        {heightStr && !isValid && (
          <Text className="mt-2 text-center text-sm text-red-400">
            Please enter a valid height (100-250 cm)
          </Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <GlassButton onPress={onContinue} gender={gender} disabled={!isValid}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 20: Weight Input
type WeightUnit = 'kg' | 'lbs' | 'stones';

function WeightInputStep({
  gender,
  weight,
  savedUnit,
  onChangeWeight,
  onChangeUnit,
  onContinue,
}: {
  gender: UserGender;
  weight?: number;
  savedUnit?: WeightUnit;
  onChangeWeight: (weight: number) => void;
  onChangeUnit: (unit: WeightUnit) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const [weightStr, setWeightStr] = useState('');
  const [unit, setUnit] = useState<WeightUnit>(savedUnit ?? 'kg');

  // Convert kg back to display unit when component mounts with existing weight
  useEffect(() => {
    if (weight && !weightStr) {
      const displayValue = convertFromKg(weight, unit);
      setWeightStr(displayValue.toString());
    }
  }, []);

  // Convert kg to display unit
  const convertFromKg = (kg: number, toUnit: WeightUnit): number => {
    switch (toUnit) {
      case 'lbs':
        return Math.round(kg / 0.453592 * 10) / 10;
      case 'stones':
        return Math.round(kg / 6.35029 * 10) / 10;
      default:
        return kg;
    }
  };

  // Convert display value to kg for storage
  const convertToKg = (value: number, fromUnit: WeightUnit): number => {
    switch (fromUnit) {
      case 'lbs':
        return Math.round(value * 0.453592 * 10) / 10;
      case 'stones':
        return Math.round(value * 6.35029 * 10) / 10;
      default:
        return value;
    }
  };

  // Get valid range for current unit
  const getValidRange = (u: WeightUnit): { min: number; max: number; placeholder: string } => {
    switch (u) {
      case 'lbs':
        return { min: 66, max: 551, placeholder: '154' };
      case 'stones':
        return { min: 4.7, max: 39.4, placeholder: '11' };
      default:
        return { min: 30, max: 250, placeholder: '70' };
    }
  };

  const range = getValidRange(unit);
  const numericValue = weightStr ? parseFloat(weightStr) : 0;
  const isValid = weightStr && numericValue >= range.min && numericValue <= range.max;

  const handleUnitChange = (newUnit: WeightUnit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUnit(newUnit);
    setWeightStr(''); // Clear input when unit changes
  };

  const handleContinue = () => {
    if (isValid) {
      const weightInKg = convertToKg(numericValue, unit);
      onChangeWeight(weightInKg);
      onChangeUnit(unit); // Save the unit preference
      onContinue();
    }
  };

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Scale size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {gender === 'male' ? 'Current Weight' : 'Your Current Weight'}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">
          {gender === 'male' ? 'This is your starting point, soldier' : 'Just the starting point of your journey'}
        </Text>
      </Animated.View>

      {/* Unit Selector */}
      <Animated.View entering={FadeInDown.delay(150)} className="mb-6">
        <View className="flex-row justify-center gap-3">
          {(['kg', 'lbs', 'stones'] as WeightUnit[]).map((u) => (
            <Pressable
              key={u}
              onPress={() => handleUnitChange(u)}
              className={cn(
                'rounded-xl px-6 py-3',
                unit === u ? 'bg-white' : 'bg-white/10'
              )}
            >
              <Text
                className={cn(
                  'text-base font-semibold',
                  unit === u ? 'text-slate-900' : 'text-white/60'
                )}
              >
                {u === 'stones' ? 'Stones' : u.toUpperCase()}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <View className="flex-row items-center border border-white/10 px-6 py-5">
            <TextInput
              value={weightStr}
              onChangeText={setWeightStr}
              keyboardType="decimal-pad"
              placeholder={range.placeholder}
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 text-center text-5xl font-bold text-white"
              maxLength={6}
            />
            <Text className="ml-2 text-2xl text-white/40">
              {unit === 'stones' ? 'st' : unit}
            </Text>
          </View>
        </BlurView>
        {weightStr && !isValid && (
          <Text className="mt-2 text-center text-sm text-red-400">
            Please enter a valid weight ({range.min}-{range.max} {unit})
          </Text>
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <GlassButton onPress={handleContinue} gender={gender} disabled={!isValid}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 21: Target Weight
function TargetWeightStep({
  gender,
  currentWeight,
  targetWeight,
  savedUnit,
  onChangeTarget,
  onContinue,
}: {
  gender: UserGender;
  currentWeight: number;
  targetWeight?: number;
  savedUnit?: WeightUnit;
  onChangeTarget: (weight: number) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const unit = savedUnit ?? 'kg';

  // Convert kg to display unit
  const convertFromKg = (kg: number, toUnit: WeightUnit): number => {
    switch (toUnit) {
      case 'lbs':
        return Math.round(kg / 0.453592 * 10) / 10;
      case 'stones':
        return Math.round(kg / 6.35029 * 10) / 10;
      default:
        return kg;
    }
  };

  // Convert display unit to kg
  const convertToKg = (value: number, fromUnit: WeightUnit): number => {
    switch (fromUnit) {
      case 'lbs':
        return Math.round(value * 0.453592 * 10) / 10;
      case 'stones':
        return Math.round(value * 6.35029 * 10) / 10;
      default:
        return value;
    }
  };

  // Get valid range for current unit
  const getValidRange = (u: WeightUnit): { min: number; max: number } => {
    switch (u) {
      case 'lbs':
        return { min: 66, max: 441 };
      case 'stones':
        return { min: 4.7, max: 31.5 };
      default:
        return { min: 30, max: 200 };
    }
  };

  const range = getValidRange(unit);
  const currentWeightDisplay = convertFromKg(currentWeight, unit);
  const targetWeightDisplay = targetWeight ? convertFromKg(targetWeight, unit) : undefined;

  const [targetStr, setTargetStr] = useState(targetWeightDisplay?.toString() ?? '');

  const numericValue = targetStr ? parseFloat(targetStr) : 0;
  const isValid = targetStr && numericValue >= range.min && numericValue <= range.max;
  const diff = targetStr ? numericValue - currentWeightDisplay : 0;
  const direction = diff > 0 ? 'gain' : diff < 0 ? 'lose' : 'maintain';

  const handleContinue = () => {
    if (isValid) {
      const targetInKg = convertToKg(numericValue, unit);
      onChangeTarget(targetInKg);
      onContinue();
    }
  };

  const unitLabel = unit === 'stones' ? 'st' : unit;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Target size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'target_weight')}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">
          {getDescription(gender, 'target_weight')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150)} className="mb-4 items-center">
        <Text className="text-sm text-white/50">Current: {currentWeightDisplay} {unitLabel}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-4">
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <View className="flex-row items-center border border-white/10 px-6 py-5">
            <TextInput
              value={targetStr}
              onChangeText={setTargetStr}
              keyboardType="decimal-pad"
              placeholder={currentWeightDisplay.toString()}
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="flex-1 text-center text-5xl font-bold text-white"
              maxLength={6}
            />
            <Text className="ml-2 text-2xl text-white/40">{unitLabel}</Text>
          </View>
        </BlurView>
        {targetStr && !isValid && (
          <Text className="mt-2 text-center text-sm text-red-400">
            Please enter a valid weight ({range.min}-{range.max} {unitLabel})
          </Text>
        )}
      </Animated.View>

      {isValid && Math.abs(diff) > 0 && (
        <Animated.View entering={FadeInDown.delay(250)} className="mb-6 items-center">
          <View
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: direction === 'lose' ? '#ef444420' : direction === 'gain' ? '#22c55e20' : `${theme.primary}20`,
            }}
          >
            <Text
              className="text-sm font-medium"
              style={{
                color: direction === 'lose' ? '#ef4444' : direction === 'gain' ? '#22c55e' : theme.primary,
              }}
            >
              {direction === 'lose'
                ? `${Math.abs(diff).toFixed(1)} ${unitLabel} to lose`
                : direction === 'gain'
                ? `${diff.toFixed(1)} ${unitLabel} to gain`
                : 'Maintain current weight'}
            </Text>
          </View>
        </Animated.View>
      )}

      <Animated.View entering={FadeInUp.delay(300)}>
        <GlassButton onPress={handleContinue} gender={gender} disabled={!isValid}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 22: BMI Calculation Screen
function BMIResultStep({
  gender,
  height,
  weight,
  onContinue,
}: {
  gender: UserGender;
  height: number;
  weight: number;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const bmi = weight / ((height / 100) ** 2);
  const bmiRounded = Math.round(bmi * 10) / 10;

  let category = '';
  let categoryColor = theme.primary;
  let message = '';

  if (bmi < 18.5) {
    category = 'Underweight';
    categoryColor = '#3b82f6';
    message = gender === 'male'
      ? 'Time to build mass, soldier. We\'ll get you fueled up.'
      : 'We\'ll help you build healthy strength and weight.';
  } else if (bmi < 25) {
    category = 'Normal';
    categoryColor = '#22c55e';
    message = gender === 'male'
      ? 'Solid foundation. Ready for transformation.'
      : 'Great starting point! Let\'s build on this.';
  } else if (bmi < 30) {
    category = 'Overweight';
    categoryColor = '#f59e0b';
    message = gender === 'male'
      ? 'Nothing we can\'t fix. Prepare for fat destruction.'
      : 'We\'ll work together to reach your goals.';
  } else {
    category = 'Obese';
    categoryColor = '#ef4444';
    message = gender === 'male'
      ? 'Major transformation incoming. No retreat, no surrender.'
      : 'Your transformation journey starts now. You\'ve got this.';
  }

  const bmiProgress = useSharedValue(0);
  const normalizedBmi = Math.min(Math.max((bmi - 15) / 25, 0), 1);

  useEffect(() => {
    bmiProgress.value = withDelay(300, withTiming(normalizedBmi, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, []);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: `${bmiProgress.value * 100}%`,
  }));

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {gender === 'male' ? 'Your Battle Stats' : 'Your Body Metrics'}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">
          {gender === 'male' ? 'Know your numbers. Own your transformation.' : 'Understanding where you\'re starting from'}
        </Text>
      </Animated.View>

      {/* BMI Display */}
      <Animated.View entering={FadeInDown.delay(200)} className="mb-6 items-center">
        <View className="mb-2 h-32 w-32 items-center justify-center rounded-full bg-white/5">
          <Text className="text-5xl font-bold text-white">{bmiRounded}</Text>
          <Text className="text-sm text-white/50">BMI</Text>
        </View>
        <View className="rounded-full px-4 py-1" style={{ backgroundColor: `${categoryColor}30` }}>
          <Text className="font-semibold" style={{ color: categoryColor }}>{category}</Text>
        </View>
      </Animated.View>

      {/* BMI Scale */}
      <Animated.View entering={FadeInDown.delay(350)} className="mb-4">
        <View className="mb-2 h-3 flex-row overflow-hidden rounded-full">
          <View className="flex-1 bg-blue-500" />
          <View className="flex-1 bg-green-500" />
          <View className="flex-1 bg-amber-500" />
          <View className="flex-1 bg-red-500" />
        </View>
        <Animated.View
          className="absolute -top-1 h-5 w-1 rounded-full bg-white"
          style={indicatorStyle}
        />
        <View className="flex-row justify-between">
          <Text className="text-xs text-white/40">15</Text>
          <Text className="text-xs text-white/40">18.5</Text>
          <Text className="text-xs text-white/40">25</Text>
          <Text className="text-xs text-white/40">30</Text>
          <Text className="text-xs text-white/40">40</Text>
        </View>
      </Animated.View>

      {/* Motivational message */}
      <Animated.View entering={FadeInDown.delay(450)} className="mb-8 rounded-xl bg-white/5 p-4">
        <Text className="text-center text-base text-white/80">{message}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(550)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 23: Success Story
function SuccessStoryStep({
  gender,
  onContinue,
}: {
  gender: UserGender;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const maleStory = {
    name: 'Marcus, 34',
    quote: 'I went from 95kg of excuses to 78kg of pure discipline. This program changed everything.',
    stats: [
      { label: 'Lost', value: '17 kg' },
      { label: 'Duration', value: '12 weeks' },
      { label: 'Push-ups', value: '0 → 50' },
    ],
    message: 'Marcus started as a desk worker who couldn\'t do a single push-up. Now he trains like a commando.',
  };

  const femaleStory = {
    name: 'Sarah, 29',
    quote: 'I found my strength and confidence. I never thought I could feel this good in my own body.',
    stats: [
      { label: 'Lost', value: '12 kg' },
      { label: 'Duration', value: '10 weeks' },
      { label: 'Energy', value: '+200%' },
    ],
    message: 'Sarah was a busy mom who felt exhausted every day. Now she wakes up excited to move her body.',
  };

  const story = gender === 'male' ? maleStory : femaleStory;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'success_story')}
        </Text>
        <Text className="mb-6 text-base text-white/60">
          {getDescription(gender, 'success_story')}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-4 rounded-2xl bg-white/5 p-5">
        <View className="mb-4 flex-row items-center">
          <View
            className="mr-3 h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${theme.primary}30` }}
          >
            <Users size={28} color={theme.primary} />
          </View>
          <View>
            <Text className="text-lg font-bold text-white">{story.name}</Text>
            <Text className="text-sm text-white/50">Transformation Success</Text>
          </View>
        </View>

        <Text className="mb-4 text-base italic text-white/80">"{story.quote}"</Text>

        <View className="mb-4 flex-row justify-around">
          {story.stats.map((stat, index) => (
            <View key={index} className="items-center">
              <Text className="text-xl font-bold" style={{ color: theme.primary }}>{stat.value}</Text>
              <Text className="text-xs text-white/50">{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-sm text-white/60">{story.message}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(350)} className="mb-6 rounded-xl p-4" style={{ backgroundColor: `${theme.primary}15` }}>
        <Text className="text-center text-sm font-medium" style={{ color: theme.primary }}>
          {gender === 'male'
            ? 'Your transformation could be next. Are you ready?'
            : 'Your success story is waiting to be written.'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(450)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {gender === 'male' ? 'I\'m Ready' : 'Let\'s Start My Story'}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 24: Water Intake
function WaterIntakeStep({
  gender,
  selectedIntake,
  onSelect,
}: {
  gender: UserGender;
  selectedIntake?: number;
  onSelect: (liters: number) => void;
}) {
  const theme = getColorTheme(gender);

  const intakeOptions = [
    { value: 1, label: '< 1 liter', description: gender === 'male' ? 'Dehydrated territory' : 'Room for improvement' },
    { value: 1.5, label: '1-2 liters', description: gender === 'male' ? 'Barely surviving' : 'Getting started' },
    { value: 2.5, label: '2-3 liters', description: gender === 'male' ? 'Combat ready' : 'Good hydration' },
    { value: 3.5, label: '3+ liters', description: gender === 'male' ? 'Elite level' : 'Excellent!' },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Droplets size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'water_intake')}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">
          {getDescription(gender, 'water_intake')}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {intakeOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value.toString()}
            label={option.label}
            description={option.description}
            selected={selectedIntake === option.value}
            onSelect={() => onSelect(option.value)}
            gender={gender}
            delay={150 + index * 50}
            icon={<Droplets size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 25: Activity Level
function ActivityLevelStep({
  gender,
  selectedLevel,
  onSelect,
}: {
  gender: UserGender;
  selectedLevel?: ActivityLevel;
  onSelect: (level: ActivityLevel) => void;
}) {
  const theme = getColorTheme(gender);

  const activityOptions: { value: ActivityLevel; label: string; description: string }[] = [
    {
      value: 'sedentary',
      label: 'Sedentary',
      description: gender === 'male' ? 'Desk job, minimal movement' : 'Mostly sitting during the day',
    },
    {
      value: 'lightly_active',
      label: gender === 'male' ? 'Lightly Active' : 'Light Activity',
      description: gender === 'male' ? 'Some walking, occasional movement' : 'Walking, light chores',
    },
    {
      value: 'moderately_active',
      label: gender === 'male' ? 'Moderately Active' : 'Active',
      description: gender === 'male' ? 'Regular movement throughout day' : 'On your feet often',
    },
    {
      value: 'very_active',
      label: gender === 'male' ? 'Highly Active' : 'Very Active',
      description: gender === 'male' ? 'Physical job or constant movement' : 'Physical work or lots of walking',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'activity_level')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {getDescription(gender, 'activity_level')}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {activityOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedLevel === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Activity size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 26: Energy Level
function EnergyLevelStep({
  gender,
  selectedLevel,
  onSelect,
}: {
  gender: UserGender;
  selectedLevel?: EnergyLevel;
  onSelect: (level: EnergyLevel) => void;
}) {
  const theme = getColorTheme(gender);

  const energyOptions: { value: EnergyLevel; label: string; description: string }[] = [
    {
      value: 'low',
      label: 'Low Energy',
      description: gender === 'male' ? 'Running on empty most days' : 'Often feeling tired',
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: gender === 'male' ? 'Gets the job done' : 'Okay most of the time',
    },
    {
      value: 'high',
      label: 'High Energy',
      description: gender === 'male' ? 'Powered up and ready' : 'Usually feeling great',
    },
    {
      value: 'variable',
      label: 'Variable',
      description: gender === 'male' ? 'Unpredictable peaks and crashes' : 'It changes day to day',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'energy_level')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {getDescription(gender, 'energy_level')}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {energyOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedLevel === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Battery size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 27: Sleep Habits (Included for continuity to Prompt 1C)
function SleepHabitsStep({
  gender,
  sleepHours,
  sleepQuality,
  onChangeSleepHours: onChangeHours,
  onChangeSleepQuality: onChangeQuality,
  onContinue,
}: {
  gender: UserGender;
  sleepHours?: number;
  sleepQuality?: SleepQuality;
  onChangeSleepHours: (hours: number) => void;
  onChangeSleepQuality: (quality: SleepQuality) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const hoursOptions = [5, 6, 7, 8, 9];
  const qualityOptions: { value: SleepQuality; label: string }[] = [
    { value: 'poor', label: 'Poor' },
    { value: 'fair', label: 'Fair' },
    { value: 'good', label: 'Good' },
    { value: 'excellent', label: 'Excellent' },
  ];

  const canContinue = sleepHours !== undefined && sleepQuality !== undefined;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Moon size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'sleep_habits')}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">
          {gender === 'male' ? 'Recovery is when warriors are built' : 'Rest is essential for results'}
        </Text>
      </Animated.View>

      {/* Sleep Hours */}
      <Animated.View entering={FadeInDown.delay(200)} className="mb-6">
        <Text className="mb-3 text-sm font-medium text-white/60">Average hours per night</Text>
        <View className="flex-row gap-2">
          {hoursOptions.map((hours) => (
            <Pressable
              key={hours}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChangeHours(hours);
              }}
              className={cn(
                'flex-1 items-center rounded-xl border-2 py-3',
                sleepHours === hours ? 'border-white bg-white/15' : 'border-white/10 bg-white/5'
              )}
            >
              <Text className={cn('text-lg font-bold', sleepHours === hours ? 'text-white' : 'text-white/50')}>
                {hours}h
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {/* Sleep Quality */}
      <Animated.View entering={FadeInDown.delay(300)} className="mb-8">
        <Text className="mb-3 text-sm font-medium text-white/60">Sleep quality</Text>
        <View className="flex-row gap-2">
          {qualityOptions.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onChangeQuality(option.value);
              }}
              className={cn(
                'flex-1 items-center rounded-xl border-2 py-3',
                sleepQuality === option.value ? 'border-white bg-white/15' : 'border-white/10 bg-white/5'
              )}
            >
              <Text className={cn('text-sm font-medium', sleepQuality === option.value ? 'text-white' : 'text-white/50')}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)}>
        <GlassButton onPress={onContinue} gender={gender} disabled={!canContinue}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// ==================== STEPS 27-37 (PROMPT 1C) ====================

// Step 28: Motivation Assessment
function MotivationStep({
  gender,
  selectedType,
  onSelect,
}: {
  gender: UserGender;
  selectedType?: 'self_driven' | 'needs_push' | 'accountability' | 'rewards';
  onSelect: (type: 'self_driven' | 'needs_push' | 'accountability' | 'rewards') => void;
}) {
  const theme = getColorTheme(gender);

  const motivationOptions = [
    {
      value: 'self_driven' as const,
      label: gender === 'male' ? 'Self-Driven' : 'Self-Motivated',
      description: gender === 'male' ? 'I push myself, no external motivation needed' : 'I can motivate myself',
    },
    {
      value: 'needs_push' as const,
      label: gender === 'male' ? 'Need a Push' : 'Need Encouragement',
      description: gender === 'male' ? 'I need guidance and reminders' : 'I work better with support',
    },
    {
      value: 'accountability' as const,
      label: 'Accountability',
      description: gender === 'male' ? 'I need someone watching over me' : 'I need someone to keep me on track',
    },
    {
      value: 'rewards' as const,
      label: gender === 'male' ? 'Goal-Oriented' : 'Reward-Driven',
      description: gender === 'male' ? 'I\'m motivated by hitting milestones' : 'I love celebrating progress',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'motivation')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {gender === 'male' ? 'How much structure do you need to succeed?' : 'What level of guidance works best for you?'}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {motivationOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedType === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
            icon={<Target size={24} color={theme.primary} />}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 29: Health Insights Summary
function HealthInsightsStep({
  gender,
  data,
  onContinue,
}: {
  gender: UserGender;
  data: {
    sleepHours?: number;
    sleepQuality?: string;
    energyLevel?: string;
    metabolicType?: string;
    activityLevel?: string;
    waterIntake?: number;
  };
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const getInsightScore = () => {
    let score = 0;
    if (data.sleepHours && data.sleepHours >= 7) score += 25;
    else if (data.sleepHours && data.sleepHours >= 6) score += 15;
    if (data.sleepQuality === 'good' || data.sleepQuality === 'excellent') score += 25;
    else if (data.sleepQuality === 'fair') score += 10;
    if (data.energyLevel === 'high') score += 25;
    else if (data.energyLevel === 'moderate') score += 15;
    if (data.waterIntake && data.waterIntake >= 2.5) score += 25;
    else if (data.waterIntake && data.waterIntake >= 1.5) score += 15;
    return score;
  };

  const score = getInsightScore();
  const scoreProgress = useSharedValue(0);

  useEffect(() => {
    scoreProgress.value = withDelay(300, withTiming(score / 100, { duration: 1200, easing: Easing.out(Easing.cubic) }));
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${scoreProgress.value * 100}%`,
  }));

  const insights = [
    {
      icon: Moon,
      label: 'Sleep',
      value: data.sleepHours ? `${data.sleepHours}h / ${data.sleepQuality || 'N/A'}` : 'Not set',
      status: (data.sleepHours ?? 0) >= 7 ? 'good' : (data.sleepHours ?? 0) >= 6 ? 'fair' : 'needs_work',
    },
    {
      icon: Battery,
      label: 'Energy',
      value: data.energyLevel ? data.energyLevel.charAt(0).toUpperCase() + data.energyLevel.slice(1) : 'Not set',
      status: data.energyLevel === 'high' ? 'good' : data.energyLevel === 'moderate' ? 'fair' : 'needs_work',
    },
    {
      icon: Flame,
      label: 'Metabolism',
      value: data.metabolicType ? data.metabolicType.charAt(0).toUpperCase() + data.metabolicType.slice(1) : 'Not set',
      status: 'neutral',
    },
    {
      icon: Droplets,
      label: 'Hydration',
      value: data.waterIntake ? `${data.waterIntake}L/day` : 'Not set',
      status: (data.waterIntake ?? 0) >= 2.5 ? 'good' : (data.waterIntake ?? 0) >= 1.5 ? 'fair' : 'needs_work',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'health_insights')}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">
          {gender === 'male' ? 'Your current performance baseline' : 'Understanding your wellness profile'}
        </Text>
      </Animated.View>

      {/* Overall Score */}
      <Animated.View entering={FadeInDown.delay(200)} className="mb-6 items-center">
        <View className="mb-2 h-24 w-24 items-center justify-center rounded-full bg-white/5">
          <Text className="text-4xl font-bold text-white">{score}</Text>
          <Text className="text-xs text-white/50">Health Score</Text>
        </View>
        <View className="w-full">
          <View className="h-2 overflow-hidden rounded-full bg-white/10">
            <Animated.View className="h-full rounded-full" style={[{ backgroundColor: theme.primary }, progressStyle]} />
          </View>
        </View>
      </Animated.View>

      {/* Insights List */}
      <View className="mb-6 gap-3">
        {insights.map((insight, index) => (
          <Animated.View
            key={insight.label}
            entering={FadeInDown.delay(300 + index * 50)}
            className="flex-row items-center rounded-xl bg-white/5 p-3"
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <insight.icon size={20} color={theme.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm text-white/50">{insight.label}</Text>
              <Text className="font-medium text-white">{insight.value}</Text>
            </View>
            <View
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor:
                  insight.status === 'good' ? '#22c55e' : insight.status === 'fair' ? '#f59e0b' : insight.status === 'needs_work' ? '#ef4444' : '#6b7280',
              }}
            />
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(550)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 30: Potential Assessment (Self-belief)
function PotentialStep({
  gender,
  onContinue,
}: {
  gender: UserGender;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const maleMessage = {
    title: 'You Are Capable of More',
    subtitle: 'Than You\'ve Ever Imagined',
    points: [
      'Your body was built to adapt and overcome',
      'Every great warrior started as a beginner',
      'Discipline is a skill that can be trained',
      'Your transformation is already beginning',
    ],
    cta: 'I\'m Ready to Prove It',
  };

  const femaleMessage = {
    title: 'You Are Stronger',
    subtitle: 'Than You Know',
    points: [
      'Your body is capable of amazing things',
      'Every journey begins with a single step',
      'Consistency beats perfection every time',
      'You deserve to feel confident and strong',
    ],
    cta: 'I Believe in Myself',
  };

  const message = gender === 'male' ? maleMessage : femaleMessage;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 items-center justify-center px-8">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-6 h-24 w-24 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Sparkles size={48} color={theme.primary} />
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-8 items-center">
        <Text className="mb-1 text-center text-4xl font-bold text-white">{message.title}</Text>
        <Text className="text-center text-2xl font-light text-white/60">{message.subtitle}</Text>
      </Animated.View>

      <View className="mb-8 gap-4">
        {message.points.map((point, index) => (
          <Animated.View
            key={index}
            entering={FadeInDown.delay(350 + index * 80)}
            className="flex-row items-center"
          >
            <View className="mr-3 h-2 w-2 rounded-full" style={{ backgroundColor: theme.primary }} />
            <Text className="flex-1 text-base text-white/80">{point}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInUp.delay(700)} className="w-full">
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">{message.cta}</Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 31: Personalization Confidence
function ConfidenceStep({
  gender,
  selectedConfidence,
  onSelect,
}: {
  gender: UserGender;
  selectedConfidence?: 'not_sure' | 'somewhat' | 'confident' | 'very_confident';
  onSelect: (confidence: 'not_sure' | 'somewhat' | 'confident' | 'very_confident') => void;
}) {
  const theme = getColorTheme(gender);

  const confidenceOptions = [
    {
      value: 'not_sure' as const,
      label: gender === 'male' ? 'Not Sure Yet' : 'Still Uncertain',
      description: gender === 'male' ? 'I need a lot of support' : 'I have doubts but I\'m trying',
    },
    {
      value: 'somewhat' as const,
      label: 'Somewhat Confident',
      description: gender === 'male' ? 'I can commit with the right plan' : 'I think I can do this',
    },
    {
      value: 'confident' as const,
      label: 'Confident',
      description: gender === 'male' ? 'I\'m ready to commit' : 'I believe I can succeed',
    },
    {
      value: 'very_confident' as const,
      label: gender === 'male' ? 'Fully Committed' : 'Very Confident',
      description: gender === 'male' ? 'Nothing will stop me' : 'I know I can do this',
    },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'personalization')}
        </Text>
        <Text className="mb-8 text-base text-white/60">
          {gender === 'male' ? 'How confident are you in sticking to this program?' : 'How do you feel about your commitment?'}
        </Text>
      </Animated.View>

      <View className="gap-3">
        {confidenceOptions.map((option, index) => (
          <SelectionCard
            key={option.value}
            value={option.value}
            label={option.label}
            description={option.description}
            selected={selectedConfidence === option.value}
            onSelect={onSelect}
            gender={gender}
            delay={150 + index * 50}
          />
        ))}
      </View>
    </Animated.View>
  );
}

// Step 32: Name Entry
function NameEntryStep({
  gender,
  firstName,
  lastName,
  onChangeFirstName,
  onChangeLastName,
  onContinue,
}: {
  gender: UserGender;
  firstName?: string;
  lastName?: string;
  onChangeFirstName: (name: string) => void;
  onChangeLastName: (name: string) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const isValid = firstName && firstName.trim().length >= 2;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Users size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'name')}
        </Text>
        <Text className="mb-8 text-center text-base text-white/60">
          {gender === 'male' ? 'We\'ll use this to personalize your training' : 'So we can personalize your experience'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-4">
        <Text className="mb-2 text-sm font-medium text-white/60">First Name *</Text>
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <TextInput
            value={firstName ?? ''}
            onChangeText={onChangeFirstName}
            placeholder={gender === 'male' ? 'John' : 'Jane'}
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="border border-white/10 px-5 py-4 text-lg text-white"
            autoCapitalize="words"
            autoCorrect={false}
          />
        </BlurView>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(250)} className="mb-8">
        <Text className="mb-2 text-sm font-medium text-white/60">Last Name (Optional)</Text>
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <TextInput
            value={lastName ?? ''}
            onChangeText={onChangeLastName}
            placeholder="Doe"
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="border border-white/10 px-5 py-4 text-lg text-white"
            autoCapitalize="words"
            autoCorrect={false}
          />
        </BlurView>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350)}>
        <GlassButton onPress={onContinue} gender={gender} disabled={!isValid}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 33: Date of Birth
function DateOfBirthStep({
  gender,
  dateOfBirth,
  onChangeDOB,
  onContinue,
}: {
  gender: UserGender;
  dateOfBirth?: string;
  onChangeDOB: (dob: string) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    if (dateOfBirth) {
      const [y, m, d] = dateOfBirth.split('-');
      setYear(y || '');
      setMonth(m || '');
      setDay(d || '');
    }
  }, [dateOfBirth]);

  const updateDOB = (d: string, m: string, y: string) => {
    if (d && m && y && y.length === 4) {
      onChangeDOB(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
    }
  };

  const isValid = day && month && year && year.length === 4 && parseInt(year) >= 1930 && parseInt(year) <= 2010;

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Calendar size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'date_of_birth')}
        </Text>
        <Text className="mb-8 text-center text-base text-white/60">
          {gender === 'male' ? 'We\'ll calculate your fitness age' : 'To personalize your plan to your life stage'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-8 flex-row gap-3">
        <View className="flex-1">
          <Text className="mb-2 text-center text-sm font-medium text-white/60">Day</Text>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <TextInput
              value={day}
              onChangeText={(text) => {
                setDay(text);
                updateDOB(text, month, year);
              }}
              placeholder="DD"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="border border-white/10 px-4 py-4 text-center text-xl font-bold text-white"
              keyboardType="numeric"
              maxLength={2}
            />
          </BlurView>
        </View>
        <View className="flex-1">
          <Text className="mb-2 text-center text-sm font-medium text-white/60">Month</Text>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <TextInput
              value={month}
              onChangeText={(text) => {
                setMonth(text);
                updateDOB(day, text, year);
              }}
              placeholder="MM"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="border border-white/10 px-4 py-4 text-center text-xl font-bold text-white"
              keyboardType="numeric"
              maxLength={2}
            />
          </BlurView>
        </View>
        <View className="flex-[1.5]">
          <Text className="mb-2 text-center text-sm font-medium text-white/60">Year</Text>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <TextInput
              value={year}
              onChangeText={(text) => {
                setYear(text);
                updateDOB(day, month, text);
              }}
              placeholder="YYYY"
              placeholderTextColor="rgba(255,255,255,0.3)"
              className="border border-white/10 px-4 py-4 text-center text-xl font-bold text-white"
              keyboardType="numeric"
              maxLength={4}
            />
          </BlurView>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(350)}>
        <GlassButton onPress={onContinue} gender={gender} disabled={!isValid}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 34: Fitness Age Result
function FitnessAgeStep({
  gender,
  dateOfBirth,
  fitnessAssessment,
  activityLevel,
  sleepQuality,
  onContinue,
}: {
  gender: UserGender;
  dateOfBirth: string;
  fitnessAssessment?: { overallLevel: string };
  activityLevel?: string;
  sleepQuality?: string;
  onContinue: (fitnessAge: number) => void;
}) {
  const theme = getColorTheme(gender);

  // Calculate actual age
  const birthDate = new Date(dateOfBirth);
  const today = new Date();
  const actualAge = today.getFullYear() - birthDate.getFullYear();

  // Calculate fitness age adjustments
  let adjustment = 0;
  if (fitnessAssessment?.overallLevel === 'advanced') adjustment -= 5;
  else if (fitnessAssessment?.overallLevel === 'intermediate') adjustment -= 2;
  else adjustment += 3;

  if (activityLevel === 'very_active') adjustment -= 3;
  else if (activityLevel === 'moderately_active') adjustment -= 1;
  else if (activityLevel === 'sedentary') adjustment += 3;

  if (sleepQuality === 'excellent') adjustment -= 2;
  else if (sleepQuality === 'poor') adjustment += 2;

  const fitnessAge = Math.max(18, Math.min(70, actualAge + adjustment));
  const difference = actualAge - fitnessAge;

  const ageProgress = useSharedValue(0);
  useEffect(() => {
    ageProgress.value = withDelay(500, withTiming(1, { duration: 1500, easing: Easing.out(Easing.cubic) }));
  }, []);

  const ageStyle = useAnimatedStyle(() => ({
    opacity: ageProgress.value,
    transform: [{ scale: 0.5 + ageProgress.value * 0.5 }],
  }));

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 items-center justify-center px-8">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'fitness_age')}
        </Text>
        <Text className="mb-8 text-center text-base text-white/60">
          {gender === 'male' ? 'Your body\'s true combat readiness' : 'Your body\'s true vitality'}
        </Text>
      </Animated.View>

      <Animated.View style={ageStyle} className="mb-6 items-center">
        <View
          className="mb-4 h-40 w-40 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20`, borderWidth: 4, borderColor: theme.primary }}
        >
          <Text className="text-6xl font-bold text-white">{fitnessAge}</Text>
          <Text className="text-sm text-white/50">Fitness Age</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(400)} className="mb-4 flex-row items-center justify-center gap-8">
        <View className="items-center">
          <Text className="text-3xl font-bold text-white/50">{actualAge}</Text>
          <Text className="text-xs text-white/30">Actual Age</Text>
        </View>
        <View className="items-center">
          <Text
            className="text-3xl font-bold"
            style={{ color: difference >= 0 ? '#22c55e' : '#ef4444' }}
          >
            {difference >= 0 ? `+${difference}` : difference}
          </Text>
          <Text className="text-xs text-white/30">Difference</Text>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500)} className="mb-8 rounded-xl p-4" style={{ backgroundColor: `${theme.primary}15` }}>
        <Text className="text-center text-sm" style={{ color: theme.primary }}>
          {difference >= 3
            ? gender === 'male'
              ? 'Excellent! Your fitness level makes you younger than your years.'
              : 'Amazing! Your wellness habits are paying off.'
            : difference >= 0
            ? gender === 'male'
              ? 'Good foundation. Let\'s improve this.'
              : 'Good start. We\'ll help you feel even younger.'
            : gender === 'male'
            ? 'Time to get serious. We\'ll change this.'
            : 'Don\'t worry. Your transformation starts now.'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(600)} className="w-full">
        <GlassButton onPress={() => onContinue(fitnessAge)} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 35: Email Registration
function EmailStep({
  gender,
  email,
  onChangeEmail,
  onContinue,
}: {
  gender: UserGender;
  email?: string;
  onChangeEmail: (email: string) => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);
  const isValid = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)} className="items-center">
        <View
          className="mb-4 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Shield size={32} color={theme.primary} />
        </View>
        <Text className="mb-1 text-center text-3xl font-bold text-white">
          {getHeadline(gender, 'email')}
        </Text>
        <Text className="mb-8 text-center text-base text-white/60">
          {gender === 'male' ? 'Secure your progress and get mission updates' : 'Stay connected and save your progress'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(200)} className="mb-8">
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <TextInput
            value={email ?? ''}
            onChangeText={onChangeEmail}
            placeholder="your@email.com"
            placeholderTextColor="rgba(255,255,255,0.3)"
            className="border border-white/10 px-5 py-4 text-lg text-white"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </BlurView>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(300)}>
        <GlassButton onPress={onContinue} gender={gender} disabled={!isValid}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 36: Marketing Preferences
function MarketingStep({
  gender,
  optedIn,
  onToggle,
  onContinue,
}: {
  gender: UserGender;
  optedIn: boolean;
  onToggle: () => void;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const options = [
    { label: gender === 'male' ? 'Training tips & strategies' : 'Wellness tips & motivation', icon: Zap },
    { label: 'Weekly progress reminders', icon: TrendingUp },
    { label: gender === 'male' ? 'New workout challenges' : 'New workouts & recipes', icon: Dumbbell },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'marketing')}
        </Text>
        <Text className="mb-6 text-base text-white/60">
          {gender === 'male' ? 'Get mission-critical updates' : 'Join our supportive community'}
        </Text>
      </Animated.View>

      <View className="mb-6 gap-3">
        {options.map((option, index) => (
          <Animated.View
            key={option.label}
            entering={FadeInDown.delay(200 + index * 50)}
            className="flex-row items-center rounded-xl bg-white/5 p-3"
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <option.icon size={20} color={theme.primary} />
            </View>
            <Text className="flex-1 text-white">{option.label}</Text>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(400)}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onToggle();
          }}
          className={cn(
            'mb-8 flex-row items-center rounded-xl border-2 p-4',
            optedIn ? 'border-white bg-white/10' : 'border-white/20 bg-white/5'
          )}
        >
          <View
            className={cn(
              'mr-3 h-6 w-6 items-center justify-center rounded-md border-2',
              optedIn ? 'border-white bg-white' : 'border-white/30'
            )}
          >
            {optedIn && <Check size={14} color={theme.primary} strokeWidth={3} />}
          </View>
          <Text className="flex-1 text-white">
            {gender === 'male' ? 'Yes, keep me updated' : 'Yes, I\'d like to receive updates'}
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(500)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {getButtonText(gender, 'continue')}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 37: Results Prediction
function ResultsPredictionStep({
  gender,
  currentWeight,
  targetWeight,
  primaryGoal,
  onContinue,
}: {
  gender: UserGender;
  currentWeight: number;
  targetWeight: number;
  primaryGoal?: string;
  onContinue: () => void;
}) {
  const theme = getColorTheme(gender);

  const weightDiff = Math.abs(targetWeight - currentWeight);
  const isLosing = targetWeight < currentWeight;
  const weeksToGoal = Math.ceil(weightDiff / 0.5); // 0.5kg per week

  const milestones = [
    { week: 2, change: isLosing ? -1 : 1, label: 'First results visible' },
    { week: 4, change: isLosing ? -2 : 2, label: 'Clothes fit differently' },
    { week: 8, change: isLosing ? -4 : 4, label: 'Noticeable transformation' },
    { week: 12, change: isLosing ? -6 : 6, label: 'Major milestone' },
  ];

  return (
    <Animated.View entering={SlideInRight} exiting={SlideOutLeft} className="flex-1 px-8 pt-4">
      <Animated.View entering={FadeInDown.delay(100)}>
        <Text className="mb-2 text-3xl font-bold text-white">
          {getHeadline(gender, 'results_prediction')}
        </Text>
        <Text className="mb-6 text-base text-white/60">
          {gender === 'male' ? 'Your projected transformation timeline' : 'What you can expect on this journey'}
        </Text>
      </Animated.View>

      {/* Weight projection */}
      <Animated.View entering={FadeInDown.delay(200)} className="mb-6 items-center">
        <View className="flex-row items-center gap-4">
          <View className="items-center">
            <Text className="text-3xl font-bold text-white">{currentWeight}</Text>
            <Text className="text-xs text-white/50">Current (kg)</Text>
          </View>
          <View className="h-0.5 w-16 bg-white/20">
            <View className="h-full w-1/2" style={{ backgroundColor: theme.primary }} />
          </View>
          <View className="items-center">
            <Text className="text-3xl font-bold" style={{ color: theme.primary }}>{targetWeight}</Text>
            <Text className="text-xs text-white/50">Target (kg)</Text>
          </View>
        </View>
        <Text className="mt-2 text-sm text-white/40">
          Estimated: {weeksToGoal} weeks to reach your goal
        </Text>
      </Animated.View>

      {/* Milestones */}
      <View className="mb-6 gap-3">
        {milestones.map((milestone, index) => (
          <Animated.View
            key={milestone.week}
            entering={FadeInDown.delay(300 + index * 80)}
            className="flex-row items-center rounded-xl bg-white/5 p-3"
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${theme.primary}20` }}
            >
              <Text className="text-sm font-bold" style={{ color: theme.primary }}>W{milestone.week}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-sm text-white">{milestone.label}</Text>
              <Text className="text-xs text-white/50">
                ~{currentWeight + milestone.change} kg
              </Text>
            </View>
            <View className={cn('rounded-full px-2 py-1', isLosing ? 'bg-green-500/20' : 'bg-blue-500/20')}>
              <Text className={cn('text-xs font-medium', isLosing ? 'text-green-400' : 'text-blue-400')}>
                {`${milestone.change > 0 ? '+' : ''}${milestone.change}kg`}
              </Text>
            </View>
          </Animated.View>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(650)} className="mb-6 rounded-xl p-4" style={{ backgroundColor: `${theme.primary}15` }}>
        <Text className="text-center text-sm" style={{ color: theme.primary }}>
          {gender === 'male'
            ? 'These projections are based on consistent training and nutrition. Results vary by individual commitment.'
            : 'Results are based on following the plan consistently. Every body is different, and that\'s beautiful.'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(750)}>
        <GlassButton onPress={onContinue} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {gender === 'male' ? 'Generate My Plan' : 'Create My Plan'}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// Step 38: Processing Screen
function ProcessingStep({
  gender,
  onComplete,
}: {
  gender: UserGender;
  onComplete: () => void;
}) {
  const theme = getColorTheme(gender);
  const rotation = useSharedValue(0);
  const progress = useSharedValue(0);
  const [statusText, setStatusText] = useState(
    gender === 'male' ? 'Analyzing combat readiness...' : 'Analyzing your profile...'
  );

  useEffect(() => {
    // Rotation animation
    rotation.value = withTiming(360, { duration: 2000, easing: Easing.linear });

    // Progress simulation
    const statuses = gender === 'male'
      ? [
          'Analyzing combat readiness...',
          'Building workout protocol...',
          'Configuring meal strategy...',
          'Setting fasting schedule...',
          'Finalizing battle plan...',
        ]
      : [
          'Analyzing your profile...',
          'Creating your workouts...',
          'Planning your meals...',
          'Setting your fasting windows...',
          'Personalizing your plan...',
        ];

    let currentStatus = 0;
    const statusInterval = setInterval(() => {
      currentStatus++;
      if (currentStatus < statuses.length) {
        setStatusText(statuses[currentStatus]);
        progress.value = withTiming((currentStatus + 1) / statuses.length, { duration: 500 });
      }
    }, 800);

    // Complete after ~4 seconds
    const completeTimer = setTimeout(() => {
      clearInterval(statusInterval);
      onComplete();
    }, 4000);

    return () => {
      clearInterval(statusInterval);
      clearTimeout(completeTimer);
    };
  }, []);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View entering={FadeIn.delay(100)} className="mb-8 items-center">
        <Animated.View style={spinStyle} className="mb-6">
          <View
            className="h-24 w-24 items-center justify-center rounded-full border-4"
            style={{ borderColor: theme.primary, borderTopColor: 'transparent' }}
          >
            <Shield size={40} color={theme.primary} />
          </View>
        </Animated.View>

        <Text className="mb-2 text-center text-2xl font-bold text-white">
          {gender === 'male' ? 'Building Your Battle Plan' : 'Creating Your Personal Plan'}
        </Text>
        <Text className="mb-6 text-center text-base text-white/60">{statusText}</Text>

        <View className="h-2 w-64 overflow-hidden rounded-full bg-white/10">
          <Animated.View className="h-full rounded-full" style={[{ backgroundColor: theme.primary }, progressStyle]} />
        </View>
      </Animated.View>
    </View>
  );
}

// Step 39: Motivational Quote (Final)
function QuoteStep({
  gender,
  firstName,
  onComplete,
}: {
  gender: UserGender;
  firstName?: string;
  onComplete: () => void;
}) {
  const theme = getColorTheme(gender);

  const quotes = gender === 'male'
    ? [
        { text: 'The pain you feel today will be the strength you feel tomorrow.', author: 'Arnold Schwarzenegger' },
        { text: 'No man has the right to be an amateur in the matter of physical training.', author: 'Socrates' },
        { text: 'The body achieves what the mind believes.', author: 'Napoleon Hill' },
      ]
    : [
        { text: 'She believed she could, so she did.', author: 'R.S. Grey' },
        { text: 'You are stronger than you think you are.', author: 'Superman' },
        { text: 'The only bad workout is the one that didn\'t happen.', author: 'Unknown' },
      ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <Animated.View entering={FadeIn} className="flex-1 items-center justify-center px-8">
      <Animated.View entering={FadeInDown.delay(300)} className="mb-8 items-center">
        <View
          className="mb-6 h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: `${theme.primary}20` }}
        >
          <Sparkles size={40} color={theme.primary} />
        </View>

        <Text className="mb-6 text-center text-2xl font-bold text-white">
          {firstName ? `${firstName}, ` : ''}{gender === 'male' ? 'Your Mission Begins' : 'Your Journey Begins'}
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(500)} className="mb-8">
        <Text className="mb-3 text-center text-xl italic text-white/90">"{randomQuote.text}"</Text>
        <Text className="text-center text-sm text-white/50">— {randomQuote.author}</Text>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(800)} className="w-full">
        <GlassButton onPress={onComplete} gender={gender}>
          <View className="flex-row items-center">
            <Text className="mr-2 text-lg font-semibold text-white">
              {gender === 'male' ? 'Begin Training' : 'Start My Journey'}
            </Text>
            <ChevronRight size={20} color="white" />
          </View>
        </GlassButton>
      </Animated.View>
    </Animated.View>
  );
}

// ==================== MAIN ONBOARDING SCREEN ====================

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();

  // Commando store
  const currentStepIndex = useStepIndex();
  const currentStep = useCurrentStep();
  const data = useCommandoOnboardingData();
  const gender = useGender();
  const updateData = useCommandoStore((s) => s.updateData);
  const setStep = useCommandoStore((s) => s.setStep);
  const nextStep = useCommandoStore((s) => s.nextStep);
  const prevStep = useCommandoStore((s) => s.prevStep);

  const theme = gender ? getColorTheme(gender) : getColorTheme('male');

  // Handle gender selection
  const handleGenderSelect = useCallback(
    (selectedGender: UserGender) => {
      updateData({ gender: selectedGender });
      nextStep();
    },
    [updateData, nextStep]
  );

  // Handle navigation
  const handleNext = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    nextStep();
  }, [nextStep]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // If on target_weight and weight is confirmed, reset to allow editing current weight
    if (currentStep === 'target_weight' && data.weightConfirmed) {
      updateData({ weightConfirmed: false });
      return;
    }

    prevStep();
  }, [prevStep, currentStep, data.weightConfirmed, updateData]);

  // Check if can proceed
  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 'gender':
        return !!data.gender;
      case 'age':
        return !!data.ageCategory;
      case 'primary_goal':
        return !!data.primaryGoal;
      case 'body_type':
        return !!data.bodyType;
      case 'problem_areas':
        return (data.problemAreas?.length ?? 0) > 0;
      case 'desired_body':
        return !!data.desiredBody;
      case 'experience':
        return !!data.experienceLevel;
      case 'philosophy':
        return true; // Info screen
      case 'fitness_history':
        return !!data.lastPeakShape;
      case 'metabolism':
        return !!data.metabolicType;
      case 'obstacles':
        return true; // Optional
      case 'pushup_assessment':
        return data.pushUpCount !== undefined;
      case 'pullup_assessment':
        return data.pullUpCount !== undefined;
      case 'fitness_summary':
        return true; // Info screen
      // Steps 14-26 (Prompt 1B)
      case 'philosophy_comparison':
        return true; // Info screen
      case 'training_frequency':
        return !!data.trainingFrequency;
      case 'workout_duration':
        return !!data.workoutDuration;
      case 'workout_time':
        return !!data.workoutTime;
      case 'hormonal_info':
        return true; // Info screen
      case 'height_weight':
        return !!data.heightCm && data.heightCm >= 100 && data.heightCm <= 250;
      case 'target_weight':
        return !!data.weightKg && data.weightKg >= 30 && data.weightKg <= 250;
      case 'success_story':
        return true; // Info screen
      case 'water_intake':
        return data.dailyWaterIntake !== undefined;
      case 'activity_level':
        return !!data.activityLevel;
      case 'energy_level':
        return !!data.energyLevel;
      case 'sleep_habits':
        return data.averageSleepHours !== undefined && !!data.sleepQuality;
      // Steps 27-37 (Prompt 1C)
      case 'motivation':
        return !!data.motivationType;
      case 'health_insights':
        return true; // Info screen
      case 'potential':
        return true; // Info screen
      case 'personalization':
        return !!data.workoutConfidence;
      case 'name':
        return !!data.firstName && data.firstName.trim().length >= 2;
      case 'date_of_birth':
        return !!data.dateOfBirth;
      case 'fitness_age':
        return true; // Info screen
      case 'email':
        return !!data.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email);
      case 'marketing':
        return true; // Optional
      case 'results_prediction':
        return true; // Info screen
      case 'processing':
        return true; // Auto-advance
      case 'quote':
        return true; // Final screen
      default:
        return false;
    }
  }, [currentStep, data]);

  // Render current step
  const renderStep = () => {
    if (currentStep === 'gender' || !gender) {
      return <GenderStep onSelect={handleGenderSelect} />;
    }

    switch (currentStep) {
      case 'age':
        return (
          <AgeStep
            gender={gender}
            selectedAge={data.ageCategory}
            onSelect={(age) => {
              updateData({ ageCategory: age });
              handleNext();
            }}
          />
        );
      case 'primary_goal':
        return (
          <PrimaryGoalStep
            gender={gender}
            selectedGoal={data.primaryGoal}
            onSelect={(goal) => {
              updateData({ primaryGoal: goal });
              handleNext();
            }}
          />
        );
      case 'body_type':
        return (
          <BodyTypeStep
            gender={gender}
            selectedType={data.bodyType}
            onSelect={(type) => {
              updateData({ bodyType: type });
              handleNext();
            }}
          />
        );
      case 'problem_areas':
        return (
          <ProblemAreasStep
            gender={gender}
            selectedAreas={data.problemAreas ?? []}
            onToggle={(area) => {
              const current = data.problemAreas ?? [];
              const updated = current.includes(area)
                ? current.filter((a) => a !== area)
                : [...current, area];
              updateData({ problemAreas: updated });
            }}
          />
        );
      case 'desired_body':
        return (
          <DesiredBodyStep
            gender={gender}
            selectedBody={data.desiredBody}
            onSelect={(body) => {
              updateData({ desiredBody: body });
              handleNext();
            }}
          />
        );
      case 'experience':
        return (
          <ExperienceStep
            gender={gender}
            selectedLevel={data.experienceLevel}
            onSelect={(level) => {
              updateData({ experienceLevel: level });
              handleNext();
            }}
          />
        );
      case 'philosophy':
        return (
          <PhilosophyStep
            gender={gender}
            onContinue={() => {
              updateData({ philosophyAcknowledged: true });
              handleNext();
            }}
          />
        );
      case 'fitness_history':
        return (
          <FitnessHistoryStep
            gender={gender}
            selectedHistory={data.lastPeakShape}
            onSelect={(history) => {
              updateData({ lastPeakShape: history });
              handleNext();
            }}
          />
        );
      case 'metabolism':
        return (
          <MetabolismStep
            gender={gender}
            selectedType={data.metabolicType}
            onSelect={(type) => {
              updateData({ metabolicType: type });
              handleNext();
            }}
          />
        );
      case 'obstacles':
        return (
          <ObstaclesStep
            gender={gender}
            selectedObstacles={data.obstacles ?? []}
            onToggle={(obstacle) => {
              const current = data.obstacles ?? [];
              const updated = current.includes(obstacle)
                ? current.filter((o) => o !== obstacle)
                : [...current, obstacle];
              updateData({ obstacles: updated });
            }}
          />
        );
      case 'pushup_assessment':
        return (
          <PushupAssessmentStep
            gender={gender}
            selectedCount={data.pushUpCount}
            onSelect={(count) => {
              updateData({ pushUpCount: count });
              handleNext();
            }}
          />
        );
      case 'pullup_assessment':
        return (
          <WallSitAssessmentStep
            gender={gender}
            selectedDuration={data.pullUpCount}
            onSelect={(duration: number) => {
              // Store wall sit duration in pullUpCount field for backward compatibility
              updateData({ pullUpCount: duration });
              handleNext();
            }}
          />
        );
      case 'fitness_summary':
        return (
          <FitnessSummaryStep
            gender={gender}
            pushUpCount={data.pushUpCount ?? 0}
            wallSitDuration={data.pullUpCount ?? 0}
            onContinue={() => {
              // Calculate and store fitness assessment
              let strengthScore = 0;
              const pushUps = data.pushUpCount ?? 0;
              if (pushUps >= 30) strengthScore = 90;
              else if (pushUps >= 18) strengthScore = 70;
              else if (pushUps >= 5) strengthScore = 45;
              else strengthScore = 20;

              // Wall sit endurance score (duration stored in pullUpCount field)
              let enduranceScore = 0;
              const wallSitDuration = data.pullUpCount ?? 0;
              if (wallSitDuration >= 90) enduranceScore = 90;
              else if (wallSitDuration >= 45) enduranceScore = 70;
              else if (wallSitDuration >= 15) enduranceScore = 50;
              else enduranceScore = 25;

              const avgScore = (strengthScore + enduranceScore) / 2;
              let overallLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
              if (avgScore >= 75) overallLevel = 'advanced';
              else if (avgScore >= 50) overallLevel = 'intermediate';

              updateData({
                fitnessAssessment: {
                  pushUps,
                  pullUps: wallSitDuration, // Using wall sit duration instead of pull-ups
                  strengthScore,
                  staminaScore: enduranceScore,
                  overallLevel,
                },
              });
              handleNext();
            }}
          />
        );

      // ==================== STEPS 14-26 (PROMPT 1B) ====================

      case 'philosophy_comparison':
        return (
          <PhilosophyComparisonStep
            gender={gender}
            onContinue={() => {
              updateData({ comparisonAcknowledged: true });
              handleNext();
            }}
          />
        );

      case 'training_frequency':
        return (
          <TrainingFrequencyStep
            gender={gender}
            selectedFrequency={data.trainingFrequency}
            onSelect={(frequency) => {
              updateData({ trainingFrequency: frequency });
              handleNext();
            }}
          />
        );

      case 'workout_duration':
        return (
          <WorkoutDurationStep
            gender={gender}
            selectedDuration={data.workoutDuration}
            onSelect={(duration) => {
              updateData({ workoutDuration: duration });
              handleNext();
            }}
          />
        );

      case 'workout_time':
        return (
          <WorkoutTimeStep
            gender={gender}
            selectedTime={data.workoutTime}
            onSelect={(time) => {
              updateData({ workoutTime: time });
              handleNext();
            }}
          />
        );

      case 'hormonal_info':
        return (
          <HormonalInfoStep
            gender={gender}
            onContinue={() => {
              updateData({ hormonalInfoAcknowledged: true });
              handleNext();
            }}
          />
        );

      case 'height_weight':
        return (
          <HeightInputStep
            gender={gender}
            height={data.heightCm}
            onChangeHeight={(height) => updateData({ heightCm: height })}
            onContinue={handleNext}
          />
        );

      case 'target_weight':
        // First show weight input if not confirmed, then target weight
        if (!data.weightConfirmed) {
          return (
            <WeightInputStep
              gender={gender}
              weight={data.weightKg}
              savedUnit={data.weightUnit}
              onChangeWeight={(weight) => updateData({ weightKg: weight, currentWeight: weight })}
              onChangeUnit={(unit) => updateData({ weightUnit: unit })}
              onContinue={() => {
                updateData({ weightConfirmed: true });
              }}
            />
          );
        }
        return (
          <TargetWeightStep
            gender={gender}
            currentWeight={data.weightKg ?? 70}
            targetWeight={data.targetWeight}
            savedUnit={data.weightUnit}
            onChangeTarget={(target) => {
              updateData({ targetWeight: target });
              // Calculate BMI
              if (data.heightCm) {
                const bmi = data.weightKg! / ((data.heightCm / 100) ** 2);
                updateData({ bmi: Math.round(bmi * 10) / 10 });
              }
            }}
            onContinue={handleNext}
          />
        );

      case 'success_story':
        // Show BMI result first if we have height and weight
        if (data.heightCm && data.weightKg && !data.successStoryViewed) {
          return (
            <BMIResultStep
              gender={gender}
              height={data.heightCm}
              weight={data.weightKg}
              onContinue={() => {
                updateData({ successStoryViewed: true });
                // Don't advance, show success story next
              }}
            />
          );
        }
        return (
          <SuccessStoryStep
            gender={gender}
            onContinue={() => {
              updateData({ successStoryViewed: true });
              handleNext();
            }}
          />
        );

      case 'water_intake':
        return (
          <WaterIntakeStep
            gender={gender}
            selectedIntake={data.dailyWaterIntake}
            onSelect={(intake) => {
              updateData({ dailyWaterIntake: intake });
              handleNext();
            }}
          />
        );

      case 'activity_level':
        return (
          <ActivityLevelStep
            gender={gender}
            selectedLevel={data.activityLevel}
            onSelect={(level) => {
              updateData({ activityLevel: level });
              handleNext();
            }}
          />
        );

      case 'energy_level':
        return (
          <EnergyLevelStep
            gender={gender}
            selectedLevel={data.energyLevel}
            onSelect={(level) => {
              updateData({ energyLevel: level });
              handleNext();
            }}
          />
        );

      case 'sleep_habits':
        return (
          <SleepHabitsStep
            gender={gender}
            sleepHours={data.averageSleepHours}
            sleepQuality={data.sleepQuality}
            onChangeSleepHours={(hours) => updateData({ averageSleepHours: hours })}
            onChangeSleepQuality={(quality) => updateData({ sleepQuality: quality })}
            onContinue={handleNext}
          />
        );

      // ==================== STEPS 27-37 (PROMPT 1C) ====================

      case 'motivation':
        return (
          <MotivationStep
            gender={gender}
            selectedType={data.motivationType}
            onSelect={(type) => {
              updateData({ motivationType: type });
              handleNext();
            }}
          />
        );

      case 'health_insights':
        return (
          <HealthInsightsStep
            gender={gender}
            data={{
              sleepHours: data.averageSleepHours,
              sleepQuality: data.sleepQuality,
              energyLevel: data.energyLevel,
              metabolicType: data.metabolicType,
              activityLevel: data.activityLevel,
              waterIntake: data.dailyWaterIntake,
            }}
            onContinue={() => {
              updateData({ healthInsightsViewed: true });
              handleNext();
            }}
          />
        );

      case 'potential':
        return (
          <PotentialStep
            gender={gender}
            onContinue={() => {
              updateData({ perceivedPotential: 'high' });
              handleNext();
            }}
          />
        );

      case 'personalization':
        return (
          <ConfidenceStep
            gender={gender}
            selectedConfidence={data.workoutConfidence}
            onSelect={(confidence) => {
              updateData({ workoutConfidence: confidence });
              handleNext();
            }}
          />
        );

      case 'name':
        return (
          <NameEntryStep
            gender={gender}
            firstName={data.firstName}
            lastName={data.lastName}
            onChangeFirstName={(name) => updateData({ firstName: name })}
            onChangeLastName={(name) => updateData({ lastName: name })}
            onContinue={handleNext}
          />
        );

      case 'date_of_birth':
        return (
          <DateOfBirthStep
            gender={gender}
            dateOfBirth={data.dateOfBirth}
            onChangeDOB={(dob) => updateData({ dateOfBirth: dob })}
            onContinue={handleNext}
          />
        );

      case 'fitness_age':
        return (
          <FitnessAgeStep
            gender={gender}
            dateOfBirth={data.dateOfBirth ?? '1990-01-01'}
            fitnessAssessment={data.fitnessAssessment}
            activityLevel={data.activityLevel}
            sleepQuality={data.sleepQuality}
            onContinue={(fitnessAge) => {
              updateData({ fitnessAge });
              handleNext();
            }}
          />
        );

      case 'email':
        return (
          <EmailStep
            gender={gender}
            email={data.email}
            onChangeEmail={(email) => updateData({ email })}
            onContinue={handleNext}
          />
        );

      case 'marketing':
        return (
          <MarketingStep
            gender={gender}
            optedIn={data.marketingOptIn ?? false}
            onToggle={() => updateData({ marketingOptIn: !data.marketingOptIn })}
            onContinue={handleNext}
          />
        );

      case 'results_prediction':
        return (
          <ResultsPredictionStep
            gender={gender}
            currentWeight={data.weightKg ?? 70}
            targetWeight={data.targetWeight ?? 70}
            primaryGoal={data.primaryGoal}
            onContinue={() => {
              updateData({ predictionViewed: true });
              handleNext();
            }}
          />
        );

      case 'processing':
        return (
          <ProcessingStep
            gender={gender}
            onComplete={() => {
              updateData({ processingComplete: true });
              handleNext();
            }}
          />
        );

      case 'quote':
        return (
          <QuoteStep
            gender={gender}
            firstName={data.firstName}
            onComplete={() => {
              // Mark onboarding as complete
              updateData({ quoteViewed: true });
              useCommandoStore.getState().completeOnboarding();
              // Navigate to paywall for subscription
              router.replace('/paywall');
            }}
          />
        );

      default:
        // All steps implemented
        return (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-4 text-center text-2xl font-bold text-white">
              Onboarding Complete!
            </Text>
            <Text className="text-center text-white/60">
              Current step: {currentStep} (Index: {currentStepIndex})
            </Text>
          </View>
        );
    }
  };

  // Determine background based on gender
  const backgroundColors = gender ? theme.background : ['#0f172a', '#1e293b', '#0f172a'];

  return (
    <View className="flex-1">
      <LinearGradient
        colors={backgroundColors as [string, string, string]}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Decorative gradient orbs */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: theme.primary,
          opacity: 0.1,
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
          backgroundColor: theme.secondary,
          opacity: 0.1,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with back button and progress */}
          {currentStepIndex > 0 && gender && (
            <View className="mb-4 flex-row items-center justify-between px-6">
              <Pressable
                onPress={handleBack}
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
              >
                <ChevronLeft size={24} color="white" />
              </Pressable>
              <StepIndicator current={currentStepIndex - 1} total={36} />
              <View className="w-10" />
            </View>
          )}

          {/* Step Content */}
          {renderStep()}

          {/* Continue Button for multi-select steps */}
          {(currentStep === 'problem_areas' || currentStep === 'obstacles') && gender && (
            <View className="px-8 pt-4">
              <GlassButton onPress={handleNext} gender={gender} disabled={!canProceed}>
                <View className="flex-row items-center">
                  <Text className="mr-2 text-lg font-semibold text-white">
                    {getButtonText(gender, 'continue')}
                  </Text>
                  <ChevronRight size={20} color="white" />
                </View>
              </GlassButton>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

/**
 * FASTING DETAIL SCREEN
 *
 * Shows detailed fasting information including:
 * - Current fasting status with live countdown
 * - Start/end times for eating window
 * - Health benefits explanation
 * - Personalized tips based on goal and metabolic type
 * - Uses persistent fasting store for accurate tracking
 */

import React, { useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Moon,
  Sun,
  Clock,
  Flame,
  Heart,
  Brain,
  Zap,
  Shield,
  Droplets,
  TrendingDown,
  Sparkles,
  Target,
  Info,
  AlertCircle,
} from 'lucide-react-native';
import { useOnboardingData as useCommandoData } from '@/lib/state/commando-store';
import {
  useSelectedFastingPlan,
  useFastingWindow,
  useCanChangeFastingPlan,
  FASTING_TYPES,
  type FastingType,
} from '@/lib/state/fasting-store';
import { useFastingCountdown } from '@/lib/hooks/use-fasting-countdown';

// ==================== FASTING BENEFITS DATA ====================

const FASTING_BENEFITS = {
  weight_loss: [
    { icon: Flame, title: 'Fat Burning', description: 'Your body switches to burning stored fat for energy during fasting periods.' },
    { icon: TrendingDown, title: 'Reduced Insulin', description: 'Lower insulin levels make stored body fat more accessible for energy.' },
    { icon: Zap, title: 'Metabolic Boost', description: 'Short-term fasting can increase metabolic rate by 3.6-14%.' },
  ],
  build_muscle: [
    { icon: Zap, title: 'Growth Hormone', description: 'Fasting can increase HGH levels by up to 5x, aiding muscle growth.' },
    { icon: Shield, title: 'Protein Efficiency', description: 'Your body becomes more efficient at using protein for muscle repair.' },
    { icon: Target, title: 'Nutrient Timing', description: 'Eating in a window helps optimize nutrient absorption post-workout.' },
  ],
  general: [
    { icon: Brain, title: 'Mental Clarity', description: 'Many report improved focus and concentration during fasting.' },
    { icon: Heart, title: 'Heart Health', description: 'May improve blood pressure, cholesterol, and inflammatory markers.' },
    { icon: Droplets, title: 'Cellular Repair', description: 'Triggers autophagy - your cells clean out damaged components.' },
  ],
};

const FASTING_PLAN_INFO: Record<FastingType['plan'], { name: string; description: string; difficulty: string }> = {
  '12:12': {
    name: '12:12 Balanced',
    description: 'Fast for 12 hours, eat within a 12-hour window. Great for beginners or those looking to maintain.',
    difficulty: 'Easy',
  },
  '14:10': {
    name: '14:10 Moderate',
    description: 'Fast for 14 hours with a 10-hour eating window. A gentle step up that most people adapt to quickly.',
    difficulty: 'Moderate',
  },
  '16:8': {
    name: '16:8 Standard',
    description: 'The most popular protocol. Fast for 16 hours, eat within 8 hours. Excellent for weight management.',
    difficulty: 'Moderate',
  },
  '18:6': {
    name: '18:6 Aggressive',
    description: 'Fast for 18 hours with a 6-hour eating window. More intensive, great for accelerated fat loss.',
    difficulty: 'Challenging',
  },
  '20:4': {
    name: '20:4 Warrior',
    description: 'Fast for 20 hours with a 4-hour eating window. Very challenging, for advanced users.',
    difficulty: 'Very Challenging',
  },
  '24:0': {
    name: '24:0 Extended',
    description: 'Complete 24-hour fast. Only for very advanced users with medical guidance.',
    difficulty: 'Extreme',
  },
};

// ==================== GENDER-SPECIFIC CONTENT ====================

const FASTING_CONTENT = {
  male: {
    title: 'Tactical Fasting Protocol',
    subtitle: 'Strategic nutrition timing for maximum results',
    statusFasting: 'FASTING ACTIVE',
    statusEating: 'EATING WINDOW OPEN',
    encouragement: 'Stay disciplined, soldier. Your body is optimizing.',
    tips: [
      'Drink black coffee or tea to suppress appetite during fasting',
      'Train in fasted state for enhanced fat burning',
      'Break your fast with protein to maximize muscle synthesis',
      'Stay hydrated - aim for 3+ liters during fasting hours',
    ],
  },
  female: {
    title: 'Wellness Fasting',
    subtitle: 'Gentle nutrition timing for your health journey',
    statusFasting: 'Fasting Period',
    statusEating: 'Eating Window',
    encouragement: "You're doing great! Listen to your body.",
    tips: [
      'Herbal tea can help manage hunger during fasting',
      'Light movement during fasting is perfectly fine',
      'Break your fast with a balanced, nourishing meal',
      'Stay well-hydrated throughout the day',
    ],
  },
};

// ==================== CIRCULAR PROGRESS ====================

function FastingProgress({
  progress,
  isFasting,
  accentColor,
}: {
  progress: number;
  isFasting: boolean;
  accentColor: string;
}) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const size = 200;
  const strokeWidth = 12;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Background ring */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      />
      {/* Animated glow */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size + 20,
            height: size + 20,
            borderRadius: (size + 20) / 2,
            borderWidth: 2,
            borderColor: `${accentColor}30`,
          },
          animatedStyle,
        ]}
      />
      {/* Progress fill - simplified */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: accentColor,
          borderTopColor: progress > 0.25 ? accentColor : 'transparent',
          borderRightColor: progress > 0.5 ? accentColor : 'transparent',
          borderBottomColor: progress > 0.75 ? accentColor : 'transparent',
          borderLeftColor: progress > 0 ? accentColor : 'transparent',
          transform: [{ rotate: '-90deg' }],
        }}
      />
      {/* Center content */}
      <View className="items-center">
        {isFasting ? (
          <Moon size={32} color={accentColor} />
        ) : (
          <Sun size={32} color={accentColor} />
        )}
        <Text className="mt-2 text-4xl font-bold text-white">
          {Math.round(progress * 100)}%
        </Text>
        <Text className="text-sm text-white/60">complete</Text>
      </View>
    </View>
  );
}

// ==================== MAIN SCREEN ====================

export default function FastingDetailScreen() {
  const insets = useSafeAreaInsets();
  const commandoData = useCommandoData();
  const gender = commandoData.gender ?? 'male';
  const content = FASTING_CONTENT[gender];
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  // Get fasting state from store
  const selectedPlan = useSelectedFastingPlan();
  const fastingWindow = useFastingWindow();
  const canChangePlan = useCanChangeFastingPlan();

  // Get live countdown status
  const countdown = useFastingCountdown();

  const planInfo = FASTING_PLAN_INFO[selectedPlan];
  const fastingType = FASTING_TYPES[selectedPlan];

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Get relevant benefits based on goal
  const benefits = useMemo(() => {
    const goal = commandoData.primaryGoal;
    if (goal === 'lose_weight') return FASTING_BENEFITS.weight_loss;
    if (goal === 'build_muscle') return FASTING_BENEFITS.build_muscle;
    return FASTING_BENEFITS.general;
  }, [commandoData.primaryGoal]);

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const theme = {
    gradient: gender === 'male'
      ? (['#0f172a', '#1e293b', '#0f172a'] as const)
      : (['#1a0a1e', '#2d1a35', '#1a0a1e'] as const),
  };

  return (
    <View className="flex-1">
      <LinearGradient
        colors={theme.gradient}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Header */}
      <View
        className="flex-row items-center px-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Pressable
          onPress={handleBack}
          className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <ArrowLeft size={20} color="#ffffff" />
        </Pressable>
        <View>
          <Text className="text-xl font-bold text-white">{content.title}</Text>
          <Text className="text-sm text-white/60">{content.subtitle}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
          <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
            <LinearGradient
              colors={
                countdown.isFasting
                  ? ['rgba(139,92,246,0.3)', 'rgba(139,92,246,0.1)']
                  : [`${accentColor}30`, `${accentColor}10`]
              }
              style={{ padding: 24, borderRadius: 24, alignItems: 'center' }}
            >
              <Text className="mb-2 text-sm uppercase tracking-wider text-white/60">
                Current Status
              </Text>
              <Text className="mb-6 text-xl font-bold text-white">
                {countdown.isFasting ? content.statusFasting : content.statusEating}
              </Text>

              <FastingProgress
                progress={countdown.percentComplete}
                isFasting={countdown.isFasting}
                accentColor={countdown.isFasting ? '#8b5cf6' : accentColor}
              />

              <View className="mt-6 flex-row items-center rounded-full bg-white/10 px-4 py-2">
                <Clock size={16} color="#ffffff" />
                <Text className="ml-2 text-lg font-semibold text-white">
                  {countdown.timeRemaining.hours}h {countdown.timeRemaining.minutes}m{' '}
                  {countdown.timeRemaining.seconds}s remaining
                </Text>
              </View>

              <Text className="mt-4 text-center text-sm text-white/60">
                {content.encouragement}
              </Text>

              {countdown.error && (
                <View className="mt-3 flex-row items-center rounded-lg bg-red-500/20 px-3 py-2">
                  <AlertCircle size={14} color="#ef4444" />
                  <Text className="ml-2 text-xs text-red-400">{countdown.error}</Text>
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Schedule Card */}
        <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-white">Your Schedule</Text>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <View className="flex-row border border-white/5">
              <View className="flex-1 items-center border-r border-white/5 p-4">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                  <Moon size={24} color="#8b5cf6" />
                </View>
                <Text className="text-xs text-white/60">Fasting Starts</Text>
                <Text className="text-lg font-bold text-white">
                  {formatTime(fastingWindow.fastingStartTime)}
                </Text>
              </View>
              <View className="flex-1 items-center p-4">
                <View className="mb-2 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: `${accentColor}20` }}>
                  <Sun size={24} color={accentColor} />
                </View>
                <Text className="text-xs text-white/60">Eating Window</Text>
                <Text className="text-lg font-bold text-white">
                  {formatTime(fastingWindow.eatingStartTime)} - {formatTime(fastingWindow.eatingEndTime)}
                </Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Plan Info */}
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-white">Your Plan: {planInfo.name}</Text>
            {!canChangePlan && (
              <View className="rounded-full bg-white/10 px-2 py-1">
                <Text className="text-xs text-white/60">Active</Text>
              </View>
            )}
          </View>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <View className="border border-white/5 p-4">
              <View className="mb-3 flex-row items-center">
                <Info size={18} color={accentColor} />
                <Text className="ml-2 text-sm text-white/60">
                  Difficulty: {planInfo.difficulty} • {fastingType.fastingHours}h fast / {fastingType.eatingHours}h eat
                </Text>
              </View>
              <Text className="text-base leading-6 text-white/80">{planInfo.description}</Text>
            </View>
          </BlurView>
        </Animated.View>

        {/* Benefits */}
        <Animated.View entering={FadeInUp.delay(400).springify()} className="mb-6">
          <Text className="mb-3 text-lg font-semibold text-white">Why This Works For You</Text>
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <BlurView
                key={index}
                intensity={30}
                tint="dark"
                style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}
              >
                <View className="flex-row items-start border border-white/5 p-4">
                  <View
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${accentColor}20` }}
                  >
                    <Icon size={20} color={accentColor} />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 font-semibold text-white">{benefit.title}</Text>
                    <Text className="text-sm leading-5 text-white/60">{benefit.description}</Text>
                  </View>
                </View>
              </BlurView>
            );
          })}
        </Animated.View>

        {/* Tips */}
        <Animated.View entering={FadeInUp.delay(500).springify()}>
          <Text className="mb-3 text-lg font-semibold text-white">
            {gender === 'male' ? 'Tactical Tips' : 'Helpful Tips'}
          </Text>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <View className="border border-white/5 p-4">
              {content.tips.map((tip, index) => (
                <View
                  key={index}
                  className={`flex-row items-start ${index > 0 ? 'mt-3 border-t border-white/5 pt-3' : ''}`}
                >
                  <Sparkles size={16} color={accentColor} style={{ marginTop: 2 }} />
                  <Text className="ml-3 flex-1 text-sm leading-5 text-white/80">{tip}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

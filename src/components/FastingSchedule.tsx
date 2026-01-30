/**
 * FASTING SCHEDULE COMPONENT
 *
 * Displays the user's current fasting status with:
 * - Circular progress indicator
 * - Time remaining
 * - Eating window times
 * - Next phase indicator
 */

import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Moon, Sun, Clock, Utensils, Timer } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { FastingService } from '@/lib/services/meal-service';
import type { FastingPlan, FastingWindow } from '@/types/fitness';

interface FastingScheduleProps {
  fastingPlan: FastingPlan;
  onPlanPress?: () => void;
  compact?: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function FastingSchedule({
  fastingPlan,
  onPlanPress,
  compact = false,
}: FastingScheduleProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const progressAnimation = useSharedValue(0);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const fastingWindow = useMemo(
    () => FastingService.getFastingWindow(fastingPlan),
    [fastingPlan]
  );

  const status = useMemo(
    () => FastingService.getCurrentFastingStatus(fastingWindow),
    [fastingWindow, currentTime]
  );

  // Animate progress
  useEffect(() => {
    progressAnimation.value = withTiming(status.percentComplete / 100, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [status.percentComplete]);

  const isFasting = status.currentPhase === 'fasting';

  if (compact) {
    return (
      <CompactFastingStatus
        status={status}
        fastingWindow={fastingWindow}
        fastingPlan={fastingPlan}
        onPress={onPlanPress}
      />
    );
  }

  return (
    <Pressable onPress={onPlanPress}>
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
        <LinearGradient
          colors={
            isFasting
              ? ['rgba(139,92,246,0.25)', 'rgba(139,92,246,0.08)']
              : ['rgba(16,185,129,0.25)', 'rgba(16,185,129,0.08)']
          }
          style={{ padding: 20, borderRadius: 24 }}
        >
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className={`mr-3 h-12 w-12 items-center justify-center rounded-xl ${
                  isFasting ? 'bg-violet-500/30' : 'bg-emerald-500/30'
                }`}
              >
                {isFasting ? (
                  <Moon size={24} color="#a78bfa" />
                ) : (
                  <Sun size={24} color="#10b981" />
                )}
              </View>
              <View>
                <Text className="text-lg font-semibold text-white">
                  {isFasting ? 'Fasting Period' : 'Eating Window'}
                </Text>
                <Text className="text-sm text-white/60">
                  {fastingPlan} Protocol
                </Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-white">
                {status.percentComplete}%
              </Text>
              <Text className="text-xs text-white/50">Complete</Text>
            </View>
          </View>

          {/* Progress Ring */}
          <View className="mb-4 items-center">
            <View className="relative h-32 w-32 items-center justify-center">
              <Svg width={128} height={128} style={{ position: 'absolute' }}>
                {/* Background circle */}
                <Circle
                  cx={64}
                  cy={64}
                  r={56}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth={8}
                  fill="none"
                />
                {/* Progress circle */}
                <Circle
                  cx={64}
                  cy={64}
                  r={56}
                  stroke={isFasting ? '#a78bfa' : '#10b981'}
                  strokeWidth={8}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - status.percentComplete / 100)}`}
                  transform="rotate(-90 64 64)"
                />
              </Svg>
              <View className="items-center">
                <Text className="text-3xl font-bold text-white">
                  {status.timeRemaining.hours}:{status.timeRemaining.minutes.toString().padStart(2, '0')}
                </Text>
                <Text className="text-xs text-white/50">remaining</Text>
              </View>
            </View>
          </View>

          {/* Time Info */}
          <View className="flex-row justify-between rounded-xl bg-white/5 p-3">
            <View className="flex-1 items-center border-r border-white/10">
              <View className="mb-1 flex-row items-center">
                <Sun size={14} color="#10b981" />
                <Text className="ml-1 text-xs text-white/50">Eating</Text>
              </View>
              <Text className="text-sm font-medium text-white">
                {fastingWindow.eatingStartTime} - {fastingWindow.eatingEndTime}
              </Text>
            </View>
            <View className="flex-1 items-center">
              <View className="mb-1 flex-row items-center">
                <Moon size={14} color="#a78bfa" />
                <Text className="ml-1 text-xs text-white/50">Fasting</Text>
              </View>
              <Text className="text-sm font-medium text-white">
                {fastingWindow.fastingHours}h duration
              </Text>
            </View>
          </View>

          {/* Next phase indicator */}
          <View className="mt-3 flex-row items-center justify-center">
            <Timer size={14} color="rgba(255,255,255,0.4)" />
            <Text className="ml-1 text-sm text-white/40">
              {isFasting ? 'Eating starts' : 'Fasting starts'} at {status.nextPhaseTime}
            </Text>
          </View>
        </LinearGradient>
      </BlurView>
    </Pressable>
  );
}

/**
 * Compact version for dashboard/header display
 */
function CompactFastingStatus({
  status,
  fastingWindow,
  fastingPlan,
  onPress,
}: {
  status: ReturnType<typeof FastingService.getCurrentFastingStatus>;
  fastingWindow: FastingWindow;
  fastingPlan: FastingPlan;
  onPress?: () => void;
}) {
  const isFasting = status.currentPhase === 'fasting';

  return (
    <Pressable onPress={onPress}>
      <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <LinearGradient
          colors={
            isFasting
              ? ['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.05)']
              : ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']
          }
          style={{ padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center' }}
        >
          <View
            className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
              isFasting ? 'bg-violet-500/30' : 'bg-emerald-500/30'
            }`}
          >
            {isFasting ? (
              <Moon size={20} color="#a78bfa" />
            ) : (
              <Utensils size={20} color="#10b981" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-sm font-medium text-white">
              {isFasting ? 'Fasting' : 'Eating'} • {fastingPlan}
            </Text>
            <Text className="text-xs text-white/50">
              {status.timeRemaining.hours}h {status.timeRemaining.minutes}m left
            </Text>
          </View>

          {/* Mini progress bar */}
          <View className="h-8 w-8 items-center justify-center">
            <Text className="text-xs font-bold text-white">{status.percentComplete}%</Text>
          </View>
        </LinearGradient>
      </BlurView>
    </Pressable>
  );
}

/**
 * Meal timing indicator for meal cards
 */
export function MealTimingBadge({
  scheduledTime,
  isWithinWindow,
}: {
  scheduledTime?: string;
  isWithinWindow: boolean;
}) {
  if (!scheduledTime) return null;

  return (
    <View
      className={`flex-row items-center rounded-full px-2 py-1 ${
        isWithinWindow ? 'bg-emerald-500/20' : 'bg-rose-500/20'
      }`}
    >
      <Clock size={12} color={isWithinWindow ? '#10b981' : '#f43f5e'} />
      <Text
        className={`ml-1 text-xs font-medium ${
          isWithinWindow ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        {scheduledTime}
      </Text>
    </View>
  );
}

export default FastingSchedule;

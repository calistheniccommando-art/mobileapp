/**
 * MILESTONE CELEBRATION MODAL
 *
 * Gender-aware celebration modal that appears when users achieve milestones.
 * Includes animations, confetti effect, and motivational messaging.
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, Dimensions, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Star,
  Flame,
  Target,
  Crown,
  Medal,
  Sparkles,
  Zap,
  Heart,
} from 'lucide-react-native';
import type { Milestone } from '@/lib/state/progress-store';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== CONFETTI PARTICLE ====================

function ConfettiParticle({
  delay,
  color,
  startX,
}: {
  delay: number;
  color: string;
  startX: number;
}) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 100, { duration: 3000, easing: Easing.out(Easing.quad) })
    );
    translateX.value = withDelay(
      delay,
      withSequence(
        withTiming(startX + (Math.random() - 0.5) * 100, { duration: 1500 }),
        withTiming(startX + (Math.random() - 0.5) * 150, { duration: 1500 })
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 1000 }), -1, false)
    );
    opacity.value = withDelay(2500 + delay, withTiming(0, { duration: 500 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 10,
          height: 10,
          borderRadius: 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// ==================== CONFETTI EFFECT ====================

function ConfettiEffect({ colors }: { colors: string[] }) {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    delay: Math.random() * 500,
    color: colors[i % colors.length],
    startX: Math.random() * SCREEN_WIDTH,
  }));

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
      {particles.map((particle) => (
        <ConfettiParticle
          key={particle.id}
          delay={particle.delay}
          color={particle.color}
          startX={particle.startX}
        />
      ))}
    </View>
  );
}

// ==================== PULSING ICON ====================

function PulsingIcon({
  icon: Icon,
  color,
  size = 48,
}: {
  icon: typeof Trophy;
  color: string;
  size?: number;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
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

// ==================== MILESTONE ICON MAPPING ====================

const MILESTONE_ICONS: Record<string, typeof Trophy> = {
  day_complete: Trophy,
  week_complete: Crown,
  streak: Flame,
  first_workout: Star,
  exercise_count: Medal,
  meal_streak: Heart,
};

// ==================== MAIN COMPONENT ====================

interface MilestoneCelebrationProps {
  milestone: Milestone;
  gender: 'male' | 'female';
  onDismiss: () => void;
  visible: boolean;
}

export function MilestoneCelebration({
  milestone,
  gender,
  onDismiss,
  visible,
}: MilestoneCelebrationProps) {
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';
  const confettiColors = gender === 'male'
    ? ['#10b981', '#059669', '#fbbf24', '#f59e0b', '#3b82f6']
    : ['#ec4899', '#db2777', '#8b5cf6', '#a855f7', '#f472b6'];

  const Icon = MILESTONE_ICONS[milestone.type] ?? Trophy;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [visible]);

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  const theme = {
    gradient: gender === 'male'
      ? (['#0f172a', '#064e3b', '#0f172a'] as const)
      : (['#1a0a1e', '#4a1942', '#1a0a1e'] as const),
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 items-center justify-center bg-black/80">
        <LinearGradient
          colors={theme.gradient}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.9,
          }}
        />

        <ConfettiEffect colors={confettiColors} />

        <Animated.View
          entering={ZoomIn.springify()}
          className="mx-8 items-center rounded-3xl bg-white/5 p-8"
          style={{ borderWidth: 1, borderColor: `${accentColor}40` }}
        >
          {/* Glowing icon container */}
          <Animated.View
            entering={SlideInUp.delay(200).springify()}
            className="mb-6 h-24 w-24 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}30` }}
          >
            <View
              className="h-20 w-20 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accentColor}50` }}
            >
              <PulsingIcon icon={Icon} color={accentColor} size={40} />
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.Text
            entering={FadeIn.delay(300)}
            className="mb-2 text-center text-3xl font-bold text-white"
          >
            {milestone.title}
          </Animated.Text>

          {/* Description */}
          <Animated.Text
            entering={FadeIn.delay(400)}
            className="mb-6 text-center text-base leading-6 text-white/70"
          >
            {milestone.description}
          </Animated.Text>

          {/* Day badge if applicable */}
          {milestone.dayNumber && (
            <Animated.View
              entering={FadeIn.delay(500)}
              className="mb-6 flex-row items-center rounded-full px-4 py-2"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Sparkles size={16} color={accentColor} />
              <Text className="ml-2 font-semibold" style={{ color: accentColor }}>
                Day {milestone.dayNumber}
              </Text>
            </Animated.View>
          )}

          {/* Continue button */}
          <Animated.View entering={SlideInUp.delay(600).springify()}>
            <Pressable
              onPress={handleDismiss}
              className="flex-row items-center rounded-2xl px-8 py-4"
              style={{ backgroundColor: accentColor }}
            >
              <Zap size={20} color="#ffffff" />
              <Text className="ml-2 text-lg font-bold text-white">
                {gender === 'male' ? 'Continue Mission' : 'Keep Going!'}
              </Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ==================== MOTIVATIONAL POPUP ====================

interface MotivationalPopupProps {
  message: string;
  gender: 'male' | 'female';
  onDismiss: () => void;
  visible: boolean;
}

export function MotivationalPopup({
  message,
  gender,
  onDismiss,
  visible,
}: MotivationalPopupProps) {
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const timer = setTimeout(onDismiss, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      entering={SlideInUp.springify()}
      exiting={FadeOut}
      className="absolute bottom-32 left-4 right-4"
    >
      <Pressable onPress={onDismiss}>
        <View
          className="flex-row items-center rounded-2xl p-4"
          style={{ backgroundColor: `${accentColor}20`, borderWidth: 1, borderColor: `${accentColor}40` }}
        >
          <View
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: `${accentColor}30` }}
          >
            <Sparkles size={20} color={accentColor} />
          </View>
          <Text className="flex-1 text-base text-white">{message}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

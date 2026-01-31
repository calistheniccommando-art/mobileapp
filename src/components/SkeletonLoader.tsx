/**
 * SKELETON LOADER COMPONENT
 * 
 * Displays placeholder content while data is loading.
 * Uses animated shimmer effect for better UX.
 */

import React, { useEffect } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// ==================== TYPES ====================

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  spacing?: number;
  lastLineWidth?: string;
  style?: ViewStyle;
}

interface SkeletonCardProps {
  style?: ViewStyle;
}

// ==================== BASE SKELETON ====================

/**
 * Base skeleton component with shimmer animation
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const shimmerPosition = useSharedValue(-1);

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, {
        duration: 1500,
        easing: Easing.ease,
      }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerPosition.value,
          [-1, 1],
          [-200, 200]
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: '150%',
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[
            'rgba(255, 255, 255, 0)',
            'rgba(255, 255, 255, 0.1)',
            'rgba(255, 255, 255, 0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ==================== SKELETON TEXT ====================

/**
 * Skeleton for text content with multiple lines
 */
export function SkeletonText({
  lines = 3,
  lineHeight = 16,
  spacing = 8,
  lastLineWidth = '60%',
  style,
}: SkeletonTextProps) {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={lineHeight}
          style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
        />
      ))}
    </View>
  );
}

// ==================== SKELETON AVATAR ====================

/**
 * Skeleton for circular avatar
 */
export function SkeletonAvatar({
  size = 48,
  style,
}: {
  size?: number;
  style?: ViewStyle;
}) {
  return <Skeleton width={size} height={size} borderRadius={size / 2} style={style} />;
}

// ==================== SKELETON CARD ====================

/**
 * Skeleton for a card component
 */
export function SkeletonCard({ style }: SkeletonCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)',
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <SkeletonAvatar size={40} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
      <SkeletonText lines={2} />
    </View>
  );
}

// ==================== WORKOUT SKELETON ====================

/**
 * Skeleton for workout list item
 */
export function SkeletonWorkoutItem({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)',
          flexDirection: 'row',
        },
        style,
      ]}
    >
      {/* Thumbnail */}
      <Skeleton width={80} height={80} borderRadius={12} />
      
      {/* Content */}
      <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
        <Skeleton width="70%" height={18} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Skeleton width={60} height={24} borderRadius={12} />
          <Skeleton width={60} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
}

// ==================== MEAL SKELETON ====================

/**
 * Skeleton for meal card
 */
export function SkeletonMealCard({ style }: { style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.05)',
        },
        style,
      ]}
    >
      {/* Image placeholder */}
      <Skeleton width="100%" height={150} borderRadius={0} />
      
      {/* Content */}
      <View style={{ padding: 16 }}>
        <Skeleton width="80%" height={20} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={14} style={{ marginBottom: 16 }} />
        
        {/* Nutrition info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width={60} height={32} borderRadius={8} />
          <Skeleton width={60} height={32} borderRadius={8} />
          <Skeleton width={60} height={32} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

// ==================== STATS SKELETON ====================

/**
 * Skeleton for stats grid
 */
export function SkeletonStats({ columns = 2, rows = 2 }: { columns?: number; rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            gap: 12,
            marginBottom: rowIndex < rows - 1 ? 12 : 0,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <View
              key={colIndex}
              style={{
                flex: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
              }}
            >
              <Skeleton width={48} height={48} borderRadius={24} style={{ marginBottom: 8 }} />
              <Skeleton width="60%" height={24} style={{ marginBottom: 4 }} />
              <Skeleton width="40%" height={12} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

// ==================== PROFILE SKELETON ====================

/**
 * Skeleton for profile header
 */
export function SkeletonProfileHeader({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: 'center', padding: 24 }, style]}>
      {/* Avatar */}
      <SkeletonAvatar size={100} style={{ marginBottom: 16 }} />
      
      {/* Name */}
      <Skeleton width={160} height={24} style={{ marginBottom: 8 }} />
      
      {/* Subtitle */}
      <Skeleton width={120} height={16} style={{ marginBottom: 24 }} />
      
      {/* Stats row */}
      <View style={{ flexDirection: 'row', gap: 24 }}>
        <View style={{ alignItems: 'center' }}>
          <Skeleton width={48} height={24} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Skeleton width={48} height={24} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={14} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <Skeleton width={48} height={24} style={{ marginBottom: 4 }} />
          <Skeleton width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

// ==================== LIST SKELETON ====================

/**
 * Skeleton for a list of items
 */
export function SkeletonList({
  count = 3,
  itemHeight = 80,
  gap = 12,
  style,
}: {
  count?: number;
  itemHeight?: number;
  gap?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={style}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton
          key={index}
          width="100%"
          height={itemHeight}
          borderRadius={12}
          style={{ marginBottom: index < count - 1 ? gap : 0 }}
        />
      ))}
    </View>
  );
}

// ==================== FASTING SKELETON ====================

/**
 * Skeleton for fasting timer
 */
export function SkeletonFastingTimer({ style }: { style?: ViewStyle }) {
  return (
    <View style={[{ alignItems: 'center', padding: 24 }, style]}>
      {/* Circle timer */}
      <Skeleton width={200} height={200} borderRadius={100} style={{ marginBottom: 24 }} />
      
      {/* Time remaining */}
      <Skeleton width={120} height={32} style={{ marginBottom: 8 }} />
      
      {/* Status text */}
      <Skeleton width={160} height={16} style={{ marginBottom: 24 }} />
      
      {/* Action button */}
      <Skeleton width="80%" height={56} borderRadius={28} />
    </View>
  );
}

// ==================== EXPORTS ====================

export const SkeletonLoader = {
  Base: Skeleton,
  Text: SkeletonText,
  Avatar: SkeletonAvatar,
  Card: SkeletonCard,
  WorkoutItem: SkeletonWorkoutItem,
  MealCard: SkeletonMealCard,
  Stats: SkeletonStats,
  ProfileHeader: SkeletonProfileHeader,
  List: SkeletonList,
  FastingTimer: SkeletonFastingTimer,
};

export default SkeletonLoader;

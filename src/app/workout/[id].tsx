import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Play,
  Check,
  ChevronRight,
  Timer,
  RotateCcw,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { getWorkoutById } from '@/data/mock-data';
import { useAppStore } from '@/lib/state/app-store';
import type { Exercise } from '@/types/fitness';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ExerciseCard({
  exercise,
  index,
  isCompleted,
  onToggle,
  onPress,
}: {
  exercise: Exercise;
  index: number;
  isCompleted: boolean;
  onToggle: () => void;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const checkScale = useSharedValue(isCompleted ? 1 : 0);

  React.useEffect(() => {
    checkScale.value = withSpring(isCompleted ? 1 : 0, { damping: 15 });
  }, [isCompleted]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(200 + index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
      >
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <View
            className={cn(
              'flex-row border',
              isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'
            )}
          >
            {/* Thumbnail */}
            <View className="relative h-24 w-24">
              <Image
                source={{ uri: exercise.thumbnailUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <View className="absolute inset-0 items-center justify-center bg-black/30">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <Play size={18} color="white" fill="white" />
                </View>
              </View>
              {isCompleted && (
                <View className="absolute inset-0 items-center justify-center bg-emerald-500/40">
                  <Animated.View
                    style={checkStyle}
                    className="h-10 w-10 items-center justify-center rounded-full bg-emerald-500"
                  >
                    <Check size={20} color="white" strokeWidth={3} />
                  </Animated.View>
                </View>
              )}
            </View>

            {/* Content */}
            <View className="flex-1 justify-between p-3">
              <View>
                <Text
                  className={cn(
                    'text-base font-semibold',
                    isCompleted ? 'text-emerald-300' : 'text-white'
                  )}
                >
                  {exercise.name}
                </Text>
                <Text className="text-sm text-white/50" numberOfLines={1}>
                  {exercise.muscleGroups.join(', ')}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-3">
                  {exercise.sets && (
                    <View className="flex-row items-center">
                      <Dumbbell size={12} color="rgba(255,255,255,0.4)" />
                      <Text className="ml-1 text-xs text-white/40">
                        {exercise.sets} x {exercise.reps ?? `${exercise.duration}s`}
                      </Text>
                    </View>
                  )}
                  {exercise.restTime && (
                    <View className="flex-row items-center">
                      <Timer size={12} color="rgba(255,255,255,0.4)" />
                      <Text className="ml-1 text-xs text-white/40">{exercise.restTime}s rest</Text>
                    </View>
                  )}
                </View>

                {/* Complete toggle */}
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onToggle();
                  }}
                  className={cn(
                    'h-8 w-8 items-center justify-center rounded-full',
                    isCompleted ? 'bg-emerald-500' : 'border border-white/20'
                  )}
                >
                  {isCompleted ? (
                    <Check size={16} color="white" strokeWidth={3} />
                  ) : (
                    <View className="h-4 w-4 rounded-full border border-white/30" />
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const workout = getWorkoutById(id);

  const completedExercises = useAppStore((s) => s.completedExerciseIds);
  const toggleExercise = useAppStore((s) => s.toggleExerciseComplete);
  const resetSession = useAppStore((s) => s.resetWorkoutSession);

  const completedCount = workout?.exercises.filter((e) => completedExercises.includes(e.id)).length ?? 0;
  const totalExercises = workout?.exercises.length ?? 0;
  const progress = totalExercises > 0 ? completedCount / totalExercises : 0;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleReset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    resetSession();
  };

  const handleExercisePress = (exercise: Exercise) => {
    router.push(`/exercise/${exercise.id}`);
  };

  if (!workout) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-white">Workout not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Hero Image */}
      <View className="absolute left-0 right-0 top-0 h-72">
        <Image
          source={{ uri: workout.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <LinearGradient
          colors={['transparent', '#0f172a']}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 150,
          }}
        />
      </View>

      {/* Back Button */}
      <Animated.View
        entering={FadeInDown.delay(0)}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          left: 20,
          zIndex: 10,
        }}
      >
        <Pressable onPress={handleBack}>
          <BlurView intensity={50} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
            <View className="h-10 w-10 items-center justify-center border border-white/10">
              <ArrowLeft size={20} color="white" />
            </View>
          </BlurView>
        </Pressable>
      </Animated.View>

      {/* Reset Button */}
      {completedCount > 0 && (
        <Animated.View
          entering={FadeInDown.delay(0)}
          style={{
            position: 'absolute',
            top: insets.top + 10,
            right: 20,
            zIndex: 10,
          }}
        >
          <Pressable onPress={handleReset}>
            <BlurView intensity={50} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <View className="flex-row items-center border border-white/10 px-3 py-2">
                <RotateCcw size={16} color="white" />
                <Text className="ml-1 text-sm text-white">Reset</Text>
              </View>
            </BlurView>
          </Pressable>
        </Animated.View>
      )}

      <ScrollView
        contentContainerStyle={{
          paddingTop: 200,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info */}
        <Animated.View entering={FadeInUp.delay(100).springify()} className="mb-6">
          <Text className="mb-1 text-3xl font-bold text-white">{workout.name}</Text>
          <Text className="mb-4 text-base text-white/60">{workout.description}</Text>

          <View className="mb-4 flex-row gap-4">
            <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
              <Clock size={16} color="rgba(255,255,255,0.6)" />
              <Text className="ml-1.5 text-sm text-white/80">{workout.totalDuration} min</Text>
            </View>
            <View className="flex-row items-center rounded-full bg-orange-500/20 px-3 py-1.5">
              <Flame size={16} color="#f97316" />
              <Text className="ml-1.5 text-sm text-orange-400">{workout.estimatedCalories} cal</Text>
            </View>
            <View className="flex-row items-center rounded-full bg-emerald-500/20 px-3 py-1.5">
              <Dumbbell size={16} color="#10b981" />
              <Text className="ml-1.5 text-sm capitalize text-emerald-400">{workout.difficulty}</Text>
            </View>
          </View>
        </Animated.View>

        {/* Progress Card */}
        <Animated.View entering={FadeInUp.delay(150).springify()} className="mb-6">
          <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={
                progress === 1
                  ? ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.1)']
                  : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.02)']
              }
              style={{ padding: 16, borderRadius: 20 }}
            >
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-base font-medium text-white">Progress</Text>
                <Text className="text-lg font-bold text-white">
                  {completedCount}/{totalExercises}
                </Text>
              </View>
              <View className="h-3 overflow-hidden rounded-full bg-white/10">
                <LinearGradient
                  colors={progress === 1 ? ['#10b981', '#34d399'] : ['#f97316', '#fb923c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    height: '100%',
                    width: `${progress * 100}%`,
                    borderRadius: 6,
                  }}
                />
              </View>
              {progress === 1 && (
                <View className="mt-3 flex-row items-center justify-center">
                  <Check size={18} color="#10b981" />
                  <Text className="ml-2 text-base font-semibold text-emerald-400">
                    Workout Complete!
                  </Text>
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Exercises */}
        <Text className="mb-3 text-lg font-semibold text-white">Exercises</Text>
        <View className="gap-3">
          {workout.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              index={index}
              isCompleted={completedExercises.includes(exercise.id)}
              onToggle={() => toggleExercise(exercise.id)}
              onPress={() => handleExercisePress(exercise)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

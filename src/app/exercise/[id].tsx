import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Clock,
  Flame,
  Dumbbell,
  Play,
  Pause,
  RotateCcw,
  Timer,
  Check,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { getExerciseById } from '@/data/mock-data';
import { useAppStore } from '@/lib/state/app-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Demo video URL (placeholder - in production, would come from admin uploaded videos)
const DEMO_VIDEO_URL = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const exercise = getExerciseById(id);

  const completedExercises = useAppStore((s) => s.completedExerciseIds);
  const toggleExercise = useAppStore((s) => s.toggleExerciseComplete);

  const isCompleted = exercise ? completedExercises.includes(exercise.id) : false;

  // Video player setup
  const player = useVideoPlayer(DEMO_VIDEO_URL, (p) => {
    p.loop = true;
    p.muted = false;
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      player.pause();
    } else {
      player.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, player]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    player.pause();
    router.back();
  };

  const handleComplete = () => {
    if (exercise) {
      Haptics.notificationAsync(
        isCompleted
          ? Haptics.NotificationFeedbackType.Warning
          : Haptics.NotificationFeedbackType.Success
      );
      toggleExercise(exercise.id);
    }
  };

  if (!exercise) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-white">Exercise not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Back Button */}
      <Animated.View
        entering={FadeInDown.delay(0)}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          left: 20,
          zIndex: 20,
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

      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Player */}
        <Animated.View entering={FadeInDown.delay(50)} className="relative">
          <View className="aspect-video bg-black">
            <VideoView
              player={player}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              allowsFullscreen
              allowsPictureInPicture
            />

            {/* Play/Pause Overlay */}
            <Pressable
              onPress={togglePlayback}
              className="absolute inset-0 items-center justify-center"
            >
              {!isPlaying && (
                <View className="h-20 w-20 items-center justify-center rounded-full bg-white/20">
                  <Play size={36} color="white" fill="white" />
                </View>
              )}
            </Pressable>
          </View>

          {/* Video Controls */}
          <View className="absolute bottom-4 left-4 right-4 flex-row items-center justify-between">
            <Pressable
              onPress={togglePlayback}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
            >
              {isPlaying ? (
                <Pause size={20} color="white" fill="white" />
              ) : (
                <Play size={20} color="white" fill="white" />
              )}
            </Pressable>

            <View className="flex-row items-center rounded-full bg-black/50 px-3 py-1.5">
              <Text className="text-sm text-white">Demo Video</Text>
            </View>
          </View>
        </Animated.View>

        {/* Content */}
        <View className="px-5 pt-6">
          {/* Header */}
          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <Text className="mb-2 text-3xl font-bold text-white">{exercise.name}</Text>
            <Text className="mb-4 text-base text-white/60">{exercise.description}</Text>

            {/* Tags */}
            <View className="mb-6 flex-row flex-wrap gap-2">
              {exercise.muscleGroups.map((muscle) => (
                <View key={muscle} className="rounded-full bg-emerald-500/20 px-3 py-1">
                  <Text className="text-sm capitalize text-emerald-400">{muscle}</Text>
                </View>
              ))}
              <View className="rounded-full bg-violet-500/20 px-3 py-1">
                <Text className="text-sm capitalize text-violet-400">{exercise.type}</Text>
              </View>
              <View className="rounded-full bg-amber-500/20 px-3 py-1">
                <Text className="text-sm capitalize text-amber-400">{exercise.difficulty}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Stats Card */}
          <Animated.View entering={FadeInUp.delay(150).springify()} className="mb-6">
            <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <View className="flex-row justify-around border border-white/5 py-5">
                {exercise.sets && (
                  <View className="items-center">
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                      <Dumbbell size={24} color="#06b6d4" />
                    </View>
                    <Text className="text-xl font-bold text-white">{exercise.sets}</Text>
                    <Text className="text-sm text-white/50">Sets</Text>
                  </View>
                )}
                {exercise.reps && (
                  <View className="items-center">
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                      <RotateCcw size={24} color="#f97316" />
                    </View>
                    <Text className="text-xl font-bold text-white">{exercise.reps}</Text>
                    <Text className="text-sm text-white/50">Reps</Text>
                  </View>
                )}
                {exercise.duration && (
                  <View className="items-center">
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
                      <Clock size={24} color="#a78bfa" />
                    </View>
                    <Text className="text-xl font-bold text-white">{exercise.duration}s</Text>
                    <Text className="text-sm text-white/50">Duration</Text>
                  </View>
                )}
                {exercise.restTime && (
                  <View className="items-center">
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                      <Timer size={24} color="#10b981" />
                    </View>
                    <Text className="text-xl font-bold text-white">{exercise.restTime}s</Text>
                    <Text className="text-sm text-white/50">Rest</Text>
                  </View>
                )}
                {exercise.calories && (
                  <View className="items-center">
                    <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20">
                      <Flame size={24} color="#f43f5e" />
                    </View>
                    <Text className="text-xl font-bold text-white">{exercise.calories}</Text>
                    <Text className="text-sm text-white/50">Cal</Text>
                  </View>
                )}
              </View>
            </BlurView>
          </Animated.View>

          {/* Instructions */}
          <Animated.View entering={FadeInUp.delay(200).springify()}>
            <Text className="mb-4 text-xl font-semibold text-white">Instructions</Text>
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <View className="border border-white/5 p-4">
                {exercise.instructions.map((instruction, index) => (
                  <View key={index} className={cn('flex-row', index > 0 && 'mt-4')}>
                    <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20">
                      <Text className="text-sm font-bold text-emerald-400">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-base leading-6 text-white/80">{instruction}</Text>
                  </View>
                ))}
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <Animated.View
        entering={FadeInUp.delay(300)}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 20,
          left: 20,
          right: 20,
        }}
      >
        <Pressable onPress={handleComplete}>
          <BlurView intensity={60} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={
                isCompleted
                  ? ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.2)']
                  : ['#10b981', '#059669']
              }
              style={{ padding: 18, borderRadius: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}
            >
              {isCompleted ? (
                <>
                  <Check size={22} color="white" strokeWidth={3} />
                  <Text className="ml-2 text-lg font-semibold text-white">Completed</Text>
                </>
              ) : (
                <>
                  <Check size={22} color="white" />
                  <Text className="ml-2 text-lg font-semibold text-white">Mark as Complete</Text>
                </>
              )}
            </LinearGradient>
          </BlurView>
        </Pressable>
      </Animated.View>
    </View>
  );
}

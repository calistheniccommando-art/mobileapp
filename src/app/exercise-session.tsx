/**
 * EXERCISE SESSION SCREEN
 *
 * Full-screen exercise session with:
 * - Countdown timers for timed exercises (voice + visual)
 * - Rep/set tracking for regular exercises
 * - 60-second rest timer between exercises (clock sound)
 * - Sequential exercise flow (cannot skip)
 * - Completion confirmation
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Vibration,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Timer,
  Dumbbell,
  Flame,
  Clock,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { useOnboardingData as useCommandoData } from '@/lib/state/commando-store';
import {
  useProgressStore,
  useTodayProgress,
  useActiveExerciseId,
  useRestTimerEndTime,
} from '@/lib/state/progress-store';
import type { Exercise } from '@/types/fitness';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== CIRCULAR PROGRESS ====================

function CircularProgress({
  progress,
  size = 200,
  strokeWidth = 12,
  color = '#10b981',
  bgColor = 'rgba(255,255,255,0.1)',
  children,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute' }}>
        {/* Background circle */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: bgColor,
          }}
        />
      </View>
      <View style={{ position: 'absolute' }}>
        {/* Progress circle - simplified for RN */}
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            borderTopColor: 'transparent',
            borderRightColor: progress > 0.25 ? color : 'transparent',
            borderBottomColor: progress > 0.5 ? color : 'transparent',
            borderLeftColor: progress > 0.75 ? color : 'transparent',
            transform: [{ rotate: '-90deg' }],
          }}
        />
      </View>
      {children}
    </View>
  );
}

// ==================== COUNTDOWN TIMER DISPLAY ====================

function CountdownDisplay({
  seconds,
  color,
  size = 'large',
}: {
  seconds: number;
  color: string;
  size?: 'large' | 'medium' | 'small';
}) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  const fontSize = size === 'large' ? 64 : size === 'medium' ? 48 : 32;

  return (
    <View className="items-center">
      <Text
        style={{
          fontSize,
          fontWeight: 'bold',
          color,
          fontVariant: ['tabular-nums'],
        }}
      >
        {mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : secs}
      </Text>
      {size === 'large' && (
        <Text className="mt-1 text-sm text-white/60">
          {mins > 0 ? 'minutes remaining' : 'seconds remaining'}
        </Text>
      )}
    </View>
  );
}

// ==================== REST TIMER SCREEN ====================

function RestTimerScreen({
  onComplete,
  onSkip,
  gender,
}: {
  onComplete: () => void;
  onSkip: () => void;
  gender: 'male' | 'female';
}) {
  const [secondsLeft, setSecondsLeft] = useState(60);
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  useEffect(() => {
    if (secondsLeft <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        // Tick sound effect simulation via haptics
        if (prev <= 10) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onComplete]);

  const progress = (60 - secondsLeft) / 60;

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      className="flex-1 items-center justify-center px-8"
    >
      <Text className="mb-2 text-lg uppercase tracking-wider text-white/60">
        Rest Period
      </Text>
      <Text className="mb-8 text-2xl font-bold text-white">
        {gender === 'male' ? 'Recover & Prepare' : 'Take a Breath'}
      </Text>

      <CircularProgress progress={progress} size={220} color={accentColor}>
        <CountdownDisplay seconds={secondsLeft} color="#ffffff" />
      </CircularProgress>

      <Text className="mt-8 text-center text-base text-white/60">
        {gender === 'male'
          ? 'Next exercise loading. Stay focused, soldier.'
          : 'Next exercise coming up. You\'re doing great!'}
      </Text>

      <Pressable
        onPress={onSkip}
        className="mt-8 rounded-full bg-white/10 px-6 py-3"
      >
        <Text style={{ color: accentColor }} className="font-semibold">
          Skip Rest
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// ==================== TIMED EXERCISE SCREEN ====================

function TimedExerciseScreen({
  exercise,
  onComplete,
  onCancel,
  gender,
}: {
  exercise: Exercise;
  onComplete: () => void;
  onCancel: () => void;
  gender: 'male' | 'female';
}) {
  const duration = exercise.duration ?? 30;
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  useEffect(() => {
    if (!isStarted || isPaused) return;

    if (secondsLeft <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Vibration.vibrate([0, 500, 200, 500]);
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) return 0;
        // Countdown beeps in last 5 seconds
        if (prev <= 5) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, isPaused, isStarted, onComplete]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsStarted(true);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPaused(!isPaused);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSecondsLeft(duration);
    setIsPaused(false);
    setIsStarted(false);
  };

  const progress = isStarted ? (duration - secondsLeft) / duration : 0;

  return (
    <Animated.View
      entering={FadeIn}
      className="flex-1 items-center justify-center px-8"
    >
      <Text className="mb-2 text-lg uppercase tracking-wider text-white/60">
        Timed Exercise
      </Text>
      <Text className="mb-2 text-center text-2xl font-bold text-white">
        {exercise.name}
      </Text>
      <Text className="mb-8 text-center text-base text-white/60">
        {exercise.description?.slice(0, 50)}...
      </Text>

      <CircularProgress
        progress={progress}
        size={240}
        strokeWidth={16}
        color={accentColor}
      >
        <CountdownDisplay
          seconds={secondsLeft}
          color={isPaused ? '#fbbf24' : '#ffffff'}
        />
      </CircularProgress>

      <View className="mt-8 flex-row items-center gap-4">
        {!isStarted ? (
          <Pressable
            onPress={handleStart}
            className="h-16 w-16 items-center justify-center rounded-full"
            style={{ backgroundColor: accentColor }}
          >
            <Play size={32} color="#ffffff" fill="#ffffff" />
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={handleReset}
              className="h-14 w-14 items-center justify-center rounded-full bg-white/10"
            >
              <RotateCcw size={24} color="#ffffff" />
            </Pressable>
            <Pressable
              onPress={handlePause}
              className="h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: isPaused ? '#fbbf24' : accentColor }}
            >
              {isPaused ? (
                <Play size={32} color="#ffffff" fill="#ffffff" />
              ) : (
                <Pause size={32} color="#ffffff" fill="#ffffff" />
              )}
            </Pressable>
            <Pressable
              onPress={onComplete}
              className="h-14 w-14 items-center justify-center rounded-full bg-white/10"
            >
              <Check size={24} color="#ffffff" />
            </Pressable>
          </>
        )}
      </View>

      <Pressable onPress={onCancel} className="mt-8">
        <Text className="text-base text-white/40">Cancel Exercise</Text>
      </Pressable>
    </Animated.View>
  );
}

// ==================== REP-BASED EXERCISE SCREEN ====================

function RepBasedExerciseScreen({
  exercise,
  onComplete,
  onCancel,
  gender,
}: {
  exercise: Exercise;
  onComplete: (sets: number, reps: number) => void;
  onCancel: () => void;
  gender: 'male' | 'female';
}) {
  const [currentSet, setCurrentSet] = useState(1);
  const [completedSets, setCompletedSets] = useState(0);
  const totalSets = exercise.sets ?? 3;
  // Handle reps that can be number or string (e.g., "12-15" or "to failure")
  const repsPerSet = typeof exercise.reps === 'number' ? exercise.reps : 10;
  const repsDisplay = exercise.reps ?? 10;
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  const handleCompleteSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newCompleted = completedSets + 1;
    setCompletedSets(newCompleted);

    if (newCompleted >= totalSets) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete(totalSets, repsPerSet * totalSets);
    } else {
      setCurrentSet((prev) => prev + 1);
    }
  };

  const progress = completedSets / totalSets;

  return (
    <Animated.View
      entering={FadeIn}
      className="flex-1 items-center justify-center px-8"
    >
      <Text className="mb-2 text-lg uppercase tracking-wider text-white/60">
        Rep-Based Exercise
      </Text>
      <Text className="mb-2 text-center text-2xl font-bold text-white">
        {exercise.name}
      </Text>
      <Text className="mb-8 text-center text-base text-white/60">
        {exercise.description?.slice(0, 50)}...
      </Text>

      <CircularProgress progress={progress} size={200} color={accentColor}>
        <View className="items-center">
          <Text className="text-5xl font-bold text-white">
            {currentSet}/{totalSets}
          </Text>
          <Text className="mt-1 text-sm text-white/60">sets</Text>
        </View>
      </CircularProgress>

      <View className="mt-8 items-center rounded-2xl bg-white/5 px-8 py-4">
        <Text className="text-lg text-white/60">This Set</Text>
        <Text className="text-4xl font-bold text-white">{repsDisplay} reps</Text>
      </View>

      <View className="mt-8 flex-row items-center gap-4">
        <Pressable
          onPress={handleCompleteSet}
          className="flex-row items-center rounded-2xl px-8 py-4"
          style={{ backgroundColor: accentColor }}
        >
          <Check size={24} color="#ffffff" />
          <Text className="ml-2 text-lg font-bold text-white">
            {completedSets + 1 >= totalSets ? 'Complete Exercise' : 'Complete Set'}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={onCancel} className="mt-8">
        <Text className="text-base text-white/40">Cancel Exercise</Text>
      </Pressable>
    </Animated.View>
  );
}

// ==================== MAIN SESSION SCREEN ====================

export default function ExerciseSessionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ exerciseId: string; exerciseData: string }>();
  const commandoData = useCommandoData();
  const todayProgress = useTodayProgress();
  const activeExerciseId = useActiveExerciseId();
  const restTimerEndTime = useRestTimerEndTime();

  const {
    startExercise,
    completeExercise,
    startRestTimer,
    clearRestTimer,
    getNextExercise,
  } = useProgressStore();

  const gender = commandoData.gender ?? 'male';
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  // Parse exercise from params
  const exercise = useMemo<Exercise | null>(() => {
    if (params.exerciseData) {
      try {
        return JSON.parse(params.exerciseData);
      } catch {
        return null;
      }
    }
    return null;
  }, [params.exerciseData]);

  const [showRest, setShowRest] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);

  // Start the exercise when mounted
  useEffect(() => {
    if (exercise && params.exerciseId) {
      startExercise(params.exerciseId);
    }
  }, [exercise, params.exerciseId]);

  const handleExerciseComplete = useCallback(
    (sets?: number, reps?: number) => {
      if (!params.exerciseId) return;

      completeExercise(params.exerciseId, sets, reps);

      // Check if there's a next exercise
      const next = getNextExercise();
      if (next) {
        setShowRest(true);
        startRestTimer(60);
      } else {
        setSessionComplete(true);
      }
    },
    [params.exerciseId, completeExercise, getNextExercise, startRestTimer]
  );

  const handleRestComplete = useCallback(() => {
    clearRestTimer();
    setShowRest(false);
    router.back();
  }, [clearRestTimer]);

  const handleSkipRest = useCallback(() => {
    clearRestTimer();
    setShowRest(false);
    router.back();
  }, [clearRestTimer]);

  const handleCancel = useCallback(() => {
    router.back();
  }, []);

  const handleSessionComplete = useCallback(() => {
    router.back();
  }, []);

  if (!exercise) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-white">Exercise not found</Text>
      </View>
    );
  }

  const theme = {
    gradient:
      gender === 'male'
        ? (['#0f172a', '#064e3b', '#0f172a'] as const)
        : (['#1a0a1e', '#4a1942', '#1a0a1e'] as const),
  };

  // Session complete screen
  if (sessionComplete) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={theme.gradient}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <Animated.View entering={FadeInDown.springify()} className="items-center">
            <View
              className="mb-6 h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: `${accentColor}30` }}
            >
              <Check size={48} color={accentColor} />
            </View>
            <Text className="mb-2 text-3xl font-bold text-white">
              {gender === 'male' ? 'Mission Complete!' : 'Amazing Work!'}
            </Text>
            <Text className="mb-8 text-center text-lg text-white/60">
              {gender === 'male'
                ? "You've crushed today's workout. Rest up, soldier."
                : "You did it! Be proud of yourself today."}
            </Text>
            <Pressable
              onPress={handleSessionComplete}
              className="rounded-2xl px-8 py-4"
              style={{ backgroundColor: accentColor }}
            >
              <Text className="text-lg font-bold text-white">Return to Dashboard</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Rest timer screen
  if (showRest) {
    return (
      <View className="flex-1">
        <LinearGradient
          colors={theme.gradient}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <RestTimerScreen
            onComplete={handleRestComplete}
            onSkip={handleSkipRest}
            gender={gender}
          />
        </View>
      </View>
    );
  }

  // Exercise screen (timed or rep-based)
  const isTimed = exercise.duration !== undefined && exercise.reps === undefined;

  return (
    <View className="flex-1">
      <LinearGradient
        colors={theme.gradient}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <Pressable
          onPress={handleCancel}
          className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <X size={20} color="#ffffff" />
        </Pressable>
        <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1">
          <Dumbbell size={16} color={accentColor} />
          <Text className="ml-2 text-sm text-white">
            Exercise {(todayProgress?.currentExerciseIndex ?? 0) + 1} of{' '}
            {todayProgress?.totalExercises ?? 0}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Exercise content */}
      <View style={{ flex: 1, paddingBottom: insets.bottom }}>
        {isTimed ? (
          <TimedExerciseScreen
            exercise={exercise}
            onComplete={() => handleExerciseComplete()}
            onCancel={handleCancel}
            gender={gender}
          />
        ) : (
          <RepBasedExerciseScreen
            exercise={exercise}
            onComplete={handleExerciseComplete}
            onCancel={handleCancel}
            gender={gender}
          />
        )}
      </View>
    </View>
  );
}

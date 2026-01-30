import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Clock, Flame, Dumbbell, ChevronRight, Filter, Play, AlertCircle } from 'lucide-react-native';
import { workoutPlans, getWorkoutsForDifficulty } from '@/data/mock-data';
import { useProfile } from '@/lib/state/user-store';
import { cn } from '@/lib/cn';
import type { WorkoutPlan, DifficultyLevel } from '@/types/fitness';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DIFFICULTY_OPTIONS: { value: DifficultyLevel | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All', color: '#64748b' },
  { value: 'beginner', label: 'Beginner', color: '#10b981' },
  { value: 'intermediate', label: 'Intermediate', color: '#f59e0b' },
  { value: 'advanced', label: 'Advanced', color: '#ef4444' },
];

function DifficultyFilter({
  selected,
  onSelect,
}: {
  selected: DifficultyLevel | 'all';
  onSelect: (value: DifficultyLevel | 'all') => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(25).springify()} className="mb-4">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {DIFFICULTY_OPTIONS.map((option) => {
          const isSelected = selected === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelect(option.value);
              }}
            >
              <View
                className={cn(
                  'flex-row items-center rounded-full px-4 py-2',
                  isSelected ? 'bg-white/20' : 'bg-white/5'
                )}
                style={{
                  borderWidth: 1,
                  borderColor: isSelected ? option.color : 'rgba(255,255,255,0.1)',
                }}
              >
                <View
                  className="mr-2 h-2 w-2 rounded-full"
                  style={{ backgroundColor: option.color }}
                />
                <Text
                  className={cn(
                    'text-sm font-medium',
                    isSelected ? 'text-white' : 'text-white/60'
                  )}
                >
                  {option.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Animated.View>
  );
}

function WorkoutListItem({
  workout,
  index,
  isToday,
}: {
  workout: WorkoutPlan;
  index: number;
  isToday: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/workout/${workout.id}`);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 50).springify()}
      style={animatedStyle}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={() => {
          scale.value = withSpring(0.98, { damping: 15 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 15 });
        }}
      >
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <View className="flex-row border border-white/5">
            {/* Thumbnail */}
            <View className="relative h-28 w-28">
              <Image
                source={{ uri: workout.thumbnailUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
              <LinearGradient
                colors={['transparent', 'rgba(15,23,42,0.8)']}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                }}
              />
              <View
                className="absolute bottom-2 left-2 rounded-full px-2 py-0.5"
                style={{ backgroundColor: isToday ? '#10b98120' : '#8b5cf620' }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: isToday ? '#10b981' : '#a78bfa' }}
                >
                  {isToday ? 'Today' : 'Tomorrow'}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View className="flex-1 justify-between p-3">
              <View>
                <Text className="text-lg font-semibold text-white">{workout.name}</Text>
                <Text className="text-sm text-white/50" numberOfLines={1}>
                  {workout.description}
                </Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View className="flex-row gap-3">
                  <View className="flex-row items-center">
                    <Clock size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="ml-1 text-xs text-white/40">{workout.totalDuration}m</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Flame size={14} color="#f97316" />
                    <Text className="ml-1 text-xs text-orange-400">{workout.estimatedCalories}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Dumbbell size={14} color="rgba(255,255,255,0.4)" />
                    <Text className="ml-1 text-xs capitalize text-white/40">{workout.difficulty}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function WorkoutsScreen() {
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');

  // Get user's workout difficulty for personalized default
  const userDifficulty = profile?.workoutDifficulty;

  // Get today's and tomorrow's day of week
  const todayDayOfWeek = new Date().getDay(); // 0-6 (Sunday-Saturday)
  const tomorrowDayOfWeek = (todayDayOfWeek + 1) % 7;

  // Filter workouts to show ONLY today and tomorrow
  const filteredWorkouts = useMemo(() => {
    let filtered = workoutPlans.filter((w) =>
      w.dayOfWeek === todayDayOfWeek || w.dayOfWeek === tomorrowDayOfWeek
    );

    if (selectedDifficulty !== 'all') {
      // Show workouts at or below the selected difficulty
      const difficultyOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
      const selectedIndex = difficultyOrder.indexOf(selectedDifficulty);
      filtered = filtered.filter((w) => {
        const workoutIndex = difficultyOrder.indexOf(w.difficulty);
        return workoutIndex <= selectedIndex;
      });
    }

    // Sort: today first, then tomorrow
    return filtered.sort((a, b) => {
      if (a.dayOfWeek === todayDayOfWeek) return -1;
      if (b.dayOfWeek === todayDayOfWeek) return 1;
      return 0;
    });
  }, [selectedDifficulty, todayDayOfWeek, tomorrowDayOfWeek]);

  // Calculate stats for filtered workouts
  const stats = useMemo(() => ({
    count: filteredWorkouts.length,
    totalMins: filteredWorkouts.reduce((sum, w) => sum + w.totalDuration, 0),
    totalCalories: filteredWorkouts.reduce((sum, w) => sum + w.estimatedCalories, 0),
  }), [filteredWorkouts]);

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
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
        <Animated.View entering={FadeInDown.delay(0).springify()} className="mb-4">
          <Text className="text-3xl font-bold text-white">Workouts</Text>
          <Text className="text-base text-white/60">
            {userDifficulty
              ? `Your workouts for today and tomorrow`
              : 'Focus on what you need to do now'}
          </Text>
        </Animated.View>

        {/* Difficulty Filter */}
        <DifficultyFilter
          selected={selectedDifficulty}
          onSelect={setSelectedDifficulty}
        />

        {/* Stats Card */}
        <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-6">
          <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(249,115,22,0.2)', 'rgba(249,115,22,0.05)']}
              style={{ padding: 20, borderRadius: 20 }}
            >
              <View className="flex-row justify-between">
                <View className="items-center">
                  <Text className="text-3xl font-bold text-white">{stats.count}</Text>
                  <Text className="text-sm text-white/50">Workouts</Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-orange-400">
                    {stats.totalMins}
                  </Text>
                  <Text className="text-sm text-white/50">Total Mins</Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-emerald-400">
                    {stats.totalCalories}
                  </Text>
                  <Text className="text-sm text-white/50">Calories</Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Empty State */}
        {filteredWorkouts.length === 0 && (
          <Animated.View entering={FadeInDown.delay(100).springify()} className="items-center py-12">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-white/10">
              <AlertCircle size={32} color="rgba(255,255,255,0.4)" />
            </View>
            <Text className="mb-2 text-lg font-semibold text-white">No workouts found</Text>
            <Text className="text-center text-white/60">
              Try selecting a different difficulty level
            </Text>
          </Animated.View>
        )}

        {/* Workout List */}
        <View className="gap-3">
          {filteredWorkouts.map((workout, index) => (
            <WorkoutListItem
              key={workout.id}
              workout={workout}
              index={index}
              isToday={workout.dayOfWeek === todayDayOfWeek}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

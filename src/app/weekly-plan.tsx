import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import {
  ArrowLeft,
  Calendar,
  Dumbbell,
  Utensils,
  Flame,
  Clock,
  ChevronRight,
  FileDown,
  Timer,
  Moon,
  Sun,
  Check,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useProfile, useFastingPlan } from '@/lib/state/user-store';
import { DailyPlanEngine } from '@/lib/services/daily-plan-engine';
import type { EnrichedDailyPlan } from '@/lib/services/daily-plan-engine';
import type { FastingPlan, DifficultyLevel, MealIntensity } from '@/types/fitness';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Day card component
function DayCard({
  plan,
  isSelected,
  onSelect,
  delay,
}: {
  plan: EnrichedDailyPlan;
  isSelected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);
  const date = new Date(plan.date);
  const dayName = format(date, 'EEE');
  const dayNumber = format(date, 'd');
  const isCurrentDay = isToday(date);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={animatedStyle}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          scale.value = withSpring(0.95, { damping: 15 });
          setTimeout(() => {
            scale.value = withSpring(1, { damping: 15 });
          }, 100);
          onSelect();
        }}
      >
        <View
          className={cn(
            'items-center rounded-2xl px-4 py-3',
            isSelected
              ? 'bg-emerald-500'
              : isCurrentDay
                ? 'border-2 border-emerald-500/50 bg-emerald-500/10'
                : 'bg-white/5'
          )}
        >
          <Text
            className={cn(
              'text-xs font-medium',
              isSelected ? 'text-white' : isCurrentDay ? 'text-emerald-400' : 'text-white/50'
            )}
          >
            {dayName}
          </Text>
          <Text
            className={cn(
              'text-lg font-bold',
              isSelected ? 'text-white' : isCurrentDay ? 'text-emerald-400' : 'text-white'
            )}
          >
            {dayNumber}
          </Text>
          {plan.isRestDay ? (
            <View className="mt-1 h-1.5 w-1.5 rounded-full bg-violet-400" />
          ) : (
            <View className="mt-1 h-1.5 w-1.5 rounded-full bg-orange-400" />
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Day detail card
function DayDetailCard({ plan }: { plan: EnrichedDailyPlan }) {
  const date = new Date(plan.date);
  const dayName = format(date, 'EEEE');
  const fullDate = format(date, 'MMMM d');

  const handleWorkoutPress = () => {
    if (plan.workout) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/workout/${plan.workout.id}`);
    }
  };

  const handleMealsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/meals');
  };

  return (
    <Animated.View entering={FadeInUp.delay(100).springify()}>
      {/* Day Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">{dayName}</Text>
          <Text className="text-base text-white/50">{fullDate}</Text>
        </View>
        {isToday(date) && (
          <View className="rounded-full bg-emerald-500/20 px-3 py-1">
            <Text className="text-sm font-medium text-emerald-400">Today</Text>
          </View>
        )}
      </View>

      {/* Fasting Window */}
      <View className="mb-4">
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <LinearGradient
            colors={['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.05)']}
            style={{ padding: 16, borderRadius: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-violet-500/30">
                  <Timer size={20} color="#a78bfa" />
                </View>
                <View>
                  <Text className="text-sm text-white/60">Fasting Plan</Text>
                  <Text className="text-lg font-bold text-white">{plan.fasting.window.plan}</Text>
                </View>
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <Sun size={12} color="#10b981" />
                  <Text className="ml-1 text-sm text-emerald-300">
                    {plan.fasting.window.eatingStartTime} - {plan.fasting.window.eatingEndTime}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </View>

      {/* Workout Section */}
      <Pressable onPress={handleWorkoutPress} disabled={plan.isRestDay}>
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View className="border border-white/5 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                  <Dumbbell size={24} color="#f97316" />
                </View>
                <View>
                  {plan.isRestDay ? (
                    <>
                      <Text className="text-lg font-semibold text-violet-300">Rest Day</Text>
                      <Text className="text-sm text-white/50">Recovery & stretching</Text>
                    </>
                  ) : plan.workout ? (
                    <>
                      <Text className="text-lg font-semibold text-white">{plan.workout.name}</Text>
                      <Text className="text-sm text-white/50">
                        {plan.workout.exerciseDetails.length} exercises
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-lg font-semibold text-white/50">No workout</Text>
                      <Text className="text-sm text-white/30">Not scheduled</Text>
                    </>
                  )}
                </View>
              </View>
              {!plan.isRestDay && plan.workout && (
                <View className="flex-row items-center">
                  <View className="mr-3 items-end">
                    <View className="flex-row items-center">
                      <Clock size={12} color="rgba(255,255,255,0.4)" />
                      <Text className="ml-1 text-sm text-white/60">
                        {plan.workout.completionEstimate.totalMinutes} min
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Flame size={12} color="#f97316" />
                      <Text className="ml-1 text-sm text-orange-400">
                        {plan.workout.completionEstimate.totalCalories} cal
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </Pressable>

      {/* Meals Section */}
      <Pressable onPress={handleMealsPress} className="mt-3">
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View className="border border-white/5 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                  <Utensils size={24} color="#06b6d4" />
                </View>
                <View>
                  <Text className="text-lg font-semibold text-white">
                    {plan.meals.scheduled.length} Meals
                  </Text>
                  <Text className="text-sm text-white/50">
                    {plan.meals.scheduled.map((m) => m.type).join(', ')}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <View className="mr-3 items-end">
                  <Text className="text-base font-semibold text-white">
                    {plan.meals.totalNutrition.calories} cal
                  </Text>
                  <Text className="text-sm text-cyan-400">
                    {plan.meals.totalNutrition.protein}g protein
                  </Text>
                </View>
                <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
              </View>
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

// Weekly summary stats
function WeeklySummary({ plans }: { plans: EnrichedDailyPlan[] }) {
  const stats = useMemo(() => {
    const totalWorkouts = plans.filter((p) => !p.isRestDay && p.workout).length;
    const restDays = plans.filter((p) => p.isRestDay).length;
    const totalCalories = plans.reduce((sum, p) => sum + p.meals.totalNutrition.calories, 0);
    const totalProtein = plans.reduce((sum, p) => sum + p.meals.totalNutrition.protein, 0);
    const workoutCalories = plans.reduce(
      (sum, p) => sum + (p.workout?.completionEstimate.totalCalories ?? 0),
      0
    );

    return {
      totalWorkouts,
      restDays,
      totalCalories,
      avgCalories: Math.round(totalCalories / 7),
      totalProtein,
      workoutCalories,
    };
  }, [plans]);

  return (
    <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-6">
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.02)']}
          style={{ padding: 20, borderRadius: 20 }}
        >
          <Text className="mb-4 text-lg font-semibold text-white">Weekly Overview</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20">
                <Dumbbell size={24} color="#f97316" />
              </View>
              <Text className="text-xl font-bold text-white">{stats.totalWorkouts}</Text>
              <Text className="text-xs text-white/50">Workouts</Text>
            </View>
            <View className="items-center">
              <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
                <Moon size={24} color="#a78bfa" />
              </View>
              <Text className="text-xl font-bold text-white">{stats.restDays}</Text>
              <Text className="text-xs text-white/50">Rest Days</Text>
            </View>
            <View className="items-center">
              <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                <Flame size={24} color="#10b981" />
              </View>
              <Text className="text-xl font-bold text-white">{stats.avgCalories}</Text>
              <Text className="text-xs text-white/50">Avg Cal/Day</Text>
            </View>
            <View className="items-center">
              <View className="mb-2 h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                <Text className="text-sm font-bold text-cyan-400">P</Text>
              </View>
              <Text className="text-xl font-bold text-white">{stats.totalProtein}g</Text>
              <Text className="text-xs text-white/50">Tot. Protein</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

export default function WeeklyPlanScreen() {
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const fastingPlan = useFastingPlan();

  // Generate week starting from Monday of current week
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Find today's index in the week
  const today = new Date();
  const todayIndex = useMemo(() => {
    for (let i = 0; i < 7; i++) {
      if (isSameDay(addDays(weekStart, i), today)) {
        return i;
      }
    }
    return 0;
  }, [weekStart, today]);

  const [selectedDayIndex, setSelectedDayIndex] = useState(todayIndex);

  // Generate week plans
  const weekPlans = useMemo(() => {
    if (!profile) return [];

    return DailyPlanEngine.generateWeek('user-1', weekStart, {
      weight: profile.weight,
      workType: profile.workType,
      fastingPlan: (fastingPlan ?? '16:8') as FastingPlan,
      workoutDifficulty: (profile.workoutDifficulty ?? 'beginner') as DifficultyLevel,
      mealIntensity: (profile.mealIntensity ?? 'standard') as MealIntensity,
    });
  }, [profile, fastingPlan, weekStart]);

  const selectedPlan = weekPlans[selectedDayIndex];
  const weekDateRange = `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d')}`;

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleExportPDF = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/pdf-preview',
      params: { type: 'weekly' },
    });
  };

  if (!profile || weekPlans.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-white">Loading...</Text>
      </View>
    );
  }

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
        <View className="mb-6 flex-row items-center justify-between">
          <Pressable onPress={handleBack}>
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <View className="h-10 w-10 items-center justify-center border border-white/10">
                <ArrowLeft size={20} color="white" />
              </View>
            </BlurView>
          </Pressable>

          <View className="items-center">
            <Text className="text-xl font-bold text-white">Weekly Plan</Text>
            <Text className="text-sm text-white/50">{weekDateRange}</Text>
          </View>

          <Pressable onPress={handleExportPDF}>
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <View className="h-10 w-10 items-center justify-center border border-white/10">
                <FileDown size={20} color="#10b981" />
              </View>
            </BlurView>
          </Pressable>
        </View>

        {/* Week Day Selector */}
        <Animated.View entering={FadeInDown.delay(0).springify()} className="mb-6">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
            style={{ flexGrow: 0 }}
          >
            {weekPlans.map((plan, index) => (
              <DayCard
                key={plan.id}
                plan={plan}
                isSelected={selectedDayIndex === index}
                onSelect={() => setSelectedDayIndex(index)}
                delay={index * 30}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Weekly Summary */}
        <WeeklySummary plans={weekPlans} />

        {/* Selected Day Details */}
        {selectedPlan && <DayDetailCard plan={selectedPlan} />}
      </ScrollView>

      {/* Bottom Export Button */}
      <Animated.View
        entering={FadeInUp.delay(200)}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 20,
          left: 20,
          right: 20,
        }}
      >
        <Pressable onPress={handleExportPDF}>
          <BlurView intensity={60} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={{
                padding: 18,
                borderRadius: 20,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <FileDown size={22} color="white" />
              <Text className="ml-2 text-lg font-semibold text-white">Export Weekly PDF</Text>
            </LinearGradient>
          </BlurView>
        </Pressable>
      </Animated.View>
    </View>
  );
}

import React, { useMemo, useState } from 'react';
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
import {
  Clock,
  Flame,
  ChevronRight,
  Sun,
  Moon,
  Check,
  AlertCircle,
  UtensilsCrossed,
  Salad,
} from 'lucide-react-native';
import { useOnboardingData as useCommandoData, useIsComplete as useCommandoComplete } from '@/lib/state/commando-store';
import {
  useMealSelectionStore,
  useTodayLightMealId,
  useTodayMainMealId,
  useTodayLightMealEaten,
  useTodayMainMealEaten,
} from '@/lib/state/meal-selection-store';
import { getFastingWindow } from '@/data/mock-data';
import { FastingSchedule } from '@/components/FastingSchedule';
import { MealPlanEngine, FastingPlanEngine } from '@/lib/services/personalized-plan-engine';
import { cn } from '@/lib/cn';
import type { Meal } from '@/types/fitness';

interface MealSlot {
  type: 'light' | 'main';
  label: string;
  description: string;
  icon: typeof Salad;
  color: string;
  scheduledTime?: string;
  options: Meal[];
  selectedMealId: string | null;
}

function MealOptionCard({
  meal,
  index,
  isSelected,
  onSelect,
}: {
  meal: Meal;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(100 + index * 30).springify()}
      style={animatedStyle}
      className="flex-1"
    >
      <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <View
          className={cn(
            'border',
            isSelected ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-white/5'
          )}
        >
          {/* Image */}
          <View className="relative h-28">
            <Image
              source={{ uri: meal.imageUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(15,23,42,0.9)']}
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 60,
              }}
            />

            {/* Selected checkmark */}
            {isSelected && (
              <View className="absolute right-2 top-2">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                  <Check size={14} color="white" strokeWidth={3} />
                </View>
              </View>
            )}
          </View>

          {/* Content */}
          <View className="p-3">
            <Text className="text-sm font-semibold text-white" numberOfLines={1}>
              {meal.name}
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <View className="flex-row items-center">
                <Flame size={12} color="#f97316" />
                <Text className="ml-0.5 text-xs text-orange-400">
                  {meal.nutrition.calories}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs text-cyan-400">{meal.nutrition.protein}g</Text>
                <Text className="ml-0.5 text-xs text-white/40">protein</Text>
              </View>
            </View>

            {/* Choose Button */}
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onSelect();
              }}
              className="mt-2"
            >
              <View
                className={cn(
                  'items-center rounded-lg py-2',
                  isSelected ? 'bg-emerald-500' : 'bg-white/10'
                )}
              >
                <Text
                  className={cn(
                    'text-xs font-semibold',
                    isSelected ? 'text-white' : 'text-white/60'
                  )}
                >
                  {isSelected ? 'Selected ✓' : 'Choose This'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </BlurView>
    </Animated.View>
  );
}

function MealSlotSection({
  slot,
  delay,
  isEaten,
  onSelectMeal,
  onToggleEaten,
}: {
  slot: MealSlot;
  delay: number;
  isEaten: boolean;
  onSelectMeal: (mealId: string) => void;
  onToggleEaten: () => void;
}) {
  const Icon = slot.icon;

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
        <LinearGradient
          colors={[`${slot.color}20`, `${slot.color}05`]}
          style={{ padding: 16, borderRadius: 20 }}
        >
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${slot.color}30` }}
              >
                <Icon size={20} color={slot.color} />
              </View>
              <View>
                <Text className="text-lg font-bold text-white">{slot.label}</Text>
                <Text className="text-sm text-white/50">Choose 1 option</Text>
              </View>
            </View>
            {slot.scheduledTime && (
              <View className="rounded-lg bg-white/10 px-2 py-1">
                <Text className="text-xs font-medium text-white/60">{slot.scheduledTime}</Text>
              </View>
            )}
          </View>

          {/* 3 Meal Options */}
          <View className="gap-2">
            {slot.options.map((meal, index) => (
              <MealOptionCard
                key={`${slot.type}-${meal.id}-${index}`}
                meal={meal}
                index={index}
                isSelected={slot.selectedMealId === meal.id}
                onSelect={() => onSelectMeal(meal.id)}
              />
            ))}
          </View>

          {/* View Instructions & Eaten Button */}
          {slot.selectedMealId && (
            <View className="mt-3 gap-2">
              <Pressable
                onPress={() => {
                  const selectedMeal = slot.options.find((m) => m.id === slot.selectedMealId);
                  if (selectedMeal) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/meal/${selectedMeal.id}`);
                  }
                }}
              >
                <BlurView intensity={20} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
                  <View className="flex-row items-center justify-between border border-white/10 bg-white/5 p-3">
                    <Text className="text-sm font-medium text-white/80">View cooking instructions</Text>
                    <ChevronRight size={16} color="rgba(255,255,255,0.6)" />
                  </View>
                </BlurView>
              </Pressable>

              {/* Eaten Button */}
              <Pressable onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onToggleEaten();
              }}>
                <BlurView intensity={20} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
                  <View
                    className={cn(
                      'flex-row items-center justify-center border p-3',
                      isEaten
                        ? 'border-emerald-500/50 bg-emerald-500/20'
                        : 'border-white/10 bg-purple-500/10'
                    )}
                  >
                    {isEaten && <Check size={16} color="#10b981" strokeWidth={3} style={{ marginRight: 6 }} />}
                    <Text
                      className={cn(
                        'text-sm font-semibold',
                        isEaten ? 'text-emerald-400' : 'text-purple-400'
                      )}
                    >
                      {isEaten ? 'Eaten ✓' : 'Mark as Eaten'}
                    </Text>
                  </View>
                </BlurView>
              </Pressable>
            </View>
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

export default function MealsScreen() {
  const insets = useSafeAreaInsets();
  const commandoData = useCommandoData();
  const commandoComplete = useCommandoComplete();

  // Get meal selection store - use proper selectors for reactivity
  const selectLightMeal = useMealSelectionStore((s) => s.selectLightMeal);
  const selectMainMeal = useMealSelectionStore((s) => s.selectMainMeal);
  const markLightMealEaten = useMealSelectionStore((s) => s.markLightMealEaten);
  const markMainMealEaten = useMealSelectionStore((s) => s.markMainMealEaten);
  const unmarkLightMealEaten = useMealSelectionStore((s) => s.unmarkLightMealEaten);
  const unmarkMainMealEaten = useMealSelectionStore((s) => s.unmarkMainMealEaten);

  const todayDate = new Date().toISOString().split('T')[0];

  // Use proper selectors for meal selection state
  const selectedLightMeal = useTodayLightMealId();
  const selectedMainMeal = useTodayMainMealId();
  const lightMealEaten = useTodayLightMealEaten();
  const mainMealEaten = useTodayMainMealEaten();

  // Get today's day number
  const todayDayNumber = new Date().getDate() % 7 || 7;

  // Generate fasting plan
  const fastingPlan = useMemo(() => {
    if (!commandoComplete) return null;
    return FastingPlanEngine.determineFastingPlan(commandoData);
  }, [commandoData, commandoComplete]);

  const fastingWindow = useMemo(() => {
    if (!fastingPlan) return null;
    return getFastingWindow(fastingPlan.plan);
  }, [fastingPlan]);

  // Generate meal options
  const mealSlots = useMemo((): MealSlot[] => {
    if (!commandoComplete || !fastingPlan) return [];

    const dailyCalories = MealPlanEngine.calculateCalorieTarget(commandoData);
    const dailyProtein = MealPlanEngine.calculateProteinTarget(commandoData);

    // First meal (lighter) - 35% of daily calories
    const lightMealOptions = MealPlanEngine.generateMealOptions(
      'lunch',
      dailyCalories * 0.35,
      dailyProtein * 0.35,
      todayDayNumber
    );

    // Second meal (main) - 65% of daily calories
    const mainMealOptions = MealPlanEngine.generateMealOptions(
      'dinner',
      dailyCalories * 0.65,
      dailyProtein * 0.65,
      todayDayNumber
    );

    return [
      {
        type: 'light',
        label: 'First Meal (Light)',
        description: '35% of daily calories',
        icon: Salad,
        color: '#06b6d4',
        scheduledTime: fastingWindow?.eatingStartTime,
        options: lightMealOptions,
        selectedMealId: selectedLightMeal,
      },
      {
        type: 'main',
        label: 'Main Meal',
        description: '65% of daily calories',
        icon: UtensilsCrossed,
        color: '#8b5cf6',
        scheduledTime: fastingWindow?.eatingEndTime
          ? `Before ${fastingWindow.eatingEndTime}`
          : undefined,
        options: mainMealOptions,
        selectedMealId: selectedMainMeal,
      },
    ];
  }, [commandoData, commandoComplete, fastingPlan, fastingWindow, todayDayNumber, selectedLightMeal, selectedMainMeal]);

  const totalNutrition = useMemo(() => {
    const lightMeal = mealSlots[0]?.options.find((m) => m.id === selectedLightMeal);
    const mainMeal = mealSlots[1]?.options.find((m) => m.id === selectedMainMeal);

    if (!lightMeal && !mainMeal) return null;

    return {
      calories: (lightMeal?.nutrition.calories ?? 0) + (mainMeal?.nutrition.calories ?? 0),
      protein: (lightMeal?.nutrition.protein ?? 0) + (mainMeal?.nutrition.protein ?? 0),
      carbs: (lightMeal?.nutrition.carbs ?? 0) + (mainMeal?.nutrition.carbs ?? 0),
      fat: (lightMeal?.nutrition.fat ?? 0) + (mainMeal?.nutrition.fat ?? 0),
    };
  }, [mealSlots, selectedLightMeal, selectedMainMeal]);

  if (!commandoComplete) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-white">Complete onboarding to see your meals</Text>
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
        <Animated.View entering={FadeInDown.delay(0).springify()} className="mb-4">
          <Text className="text-3xl font-bold text-white">Meals</Text>
          <Text className="text-base text-white/60">2 meals per day • Choose 1 option per meal</Text>
        </Animated.View>

        {/* Fasting Schedule */}
        {fastingPlan && (
          <Animated.View entering={FadeInDown.delay(25).springify()} className="mb-4">
            <FastingSchedule fastingPlan={fastingPlan.plan} compact />
          </Animated.View>
        )}

        {/* Nutrition Summary (if meals selected) */}
        {totalNutrition && (
          <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-4">
            <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient
                colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
                style={{ padding: 20, borderRadius: 20 }}
              >
                <Text className="mb-4 text-sm font-medium text-white/60">Selected Meals Nutrition</Text>
                <View className="flex-row justify-between">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-white">{totalNutrition.calories}</Text>
                    <Text className="text-sm text-white/50">Calories</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-cyan-400">{totalNutrition.protein}g</Text>
                    <Text className="text-sm text-white/50">Protein</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-amber-400">{totalNutrition.carbs}g</Text>
                    <Text className="text-sm text-white/50">Carbs</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-rose-400">{totalNutrition.fat}g</Text>
                    <Text className="text-sm text-white/50">Fat</Text>
                  </View>
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}

        {/* Info Card */}
        <Animated.View entering={FadeInDown.delay(75).springify()} className="mb-6">
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <View className="border border-white/5 p-4">
              <View className="flex-row items-start">
                <View className="mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded-full bg-purple-500/20">
                  <AlertCircle size={14} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="mb-1 text-sm font-medium text-white">High Protein, Low Carb</Text>
                  <Text className="text-xs leading-relaxed text-white/50">
                    All meals are optimized with high protein, vegetables, fiber, and good fats. Low in carbs to support your fitness goals.
                  </Text>
                </View>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        {/* Today's Meals */}
        <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-4">
          <Text className="text-xl font-semibold text-white">Today's Schedule</Text>
          {fastingWindow && (
            <Text className="text-sm text-white/50">
              Eating window: {fastingWindow.eatingStartTime} - {fastingWindow.eatingEndTime}
            </Text>
          )}
        </Animated.View>

        {/* Meal Slots */}
        <View className="gap-6">
          {mealSlots.map((slot, index) => {
            const isLightMeal = slot.type === 'light';
            return (
              <MealSlotSection
                key={slot.type}
                slot={slot}
                delay={150 + index * 100}
                isEaten={isLightMeal ? lightMealEaten : mainMealEaten}
                onSelectMeal={(mealId) => {
                  if (isLightMeal) {
                    selectLightMeal(todayDate, mealId);
                  } else {
                    selectMainMeal(todayDate, mealId);
                  }
                }}
                onToggleEaten={() => {
                  if (isLightMeal) {
                    if (lightMealEaten) {
                      unmarkLightMealEaten(todayDate);
                    } else {
                      markLightMealEaten(todayDate);
                    }
                  } else {
                    if (mainMealEaten) {
                      unmarkMainMealEaten(todayDate);
                    } else {
                      markMainMealEaten(todayDate);
                    }
                  }
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

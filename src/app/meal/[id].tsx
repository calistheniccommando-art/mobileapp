import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Clock,
  Flame,
  Users,
  ChefHat,
  Check,
  Play,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Timer,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { getMealById, getFastingWindow } from '@/data/mock-data';
import { useFastingPlan } from '@/lib/state/user-store';
import { MealService } from '@/lib/services/meal-service';
import { ExerciseVideoPlayer } from '@/components/ExerciseVideoPlayer';
import type { MealType } from '@/types/fitness';

const MEAL_TYPE_CONFIG: Record<MealType, { icon: typeof Coffee; color: string; label: string }> = {
  breakfast: { icon: Coffee, color: '#f59e0b', label: 'Breakfast' },
  lunch: { icon: Sun, color: '#06b6d4', label: 'Lunch' },
  dinner: { icon: Moon, color: '#8b5cf6', label: 'Dinner' },
  snack: { icon: Cookie, color: '#ec4899', label: 'Snack' },
};

export default function MealDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const meal = getMealById(id);
  const fastingPlan = useFastingPlan();

  // Get fasting window and scheduled time for this meal
  const mealScheduleInfo = useMemo(() => {
    if (!meal || !fastingPlan) return null;
    const fastingWindow = getFastingWindow(fastingPlan);
    const scheduledTime = MealService.getScheduledMealTime(meal.type, fastingPlan);
    const isWithinWindow = MealService.isWithinEatingWindow(scheduledTime, fastingWindow);
    return { fastingWindow, scheduledTime, isWithinWindow };
  }, [meal, fastingPlan]);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!meal) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <Text className="text-white">Meal not found</Text>
      </View>
    );
  }

  const config = MEAL_TYPE_CONFIG[meal.type];
  const MealIcon = config.icon;
  const totalTime = (meal.prepTime ?? 0) + (meal.cookTime ?? 0);

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Hero Image */}
      <View className="absolute left-0 right-0 top-0 h-80">
        <Image
          source={{ uri: meal.imageUrl }}
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
            height: 180,
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

      <ScrollView
        contentContainerStyle={{
          paddingTop: 240,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          {/* Meal type and timing badges */}
          <View className="mb-3 flex-row flex-wrap gap-2">
            <View
              className="flex-row items-center self-start rounded-full px-3 py-1"
              style={{ backgroundColor: `${config.color}30` }}
            >
              <MealIcon size={14} color={config.color} />
              <Text className="ml-1 text-sm font-medium" style={{ color: config.color }}>
                {config.label}
              </Text>
            </View>

            {mealScheduleInfo && (
              <View
                className={cn(
                  'flex-row items-center rounded-full px-3 py-1',
                  mealScheduleInfo.isWithinWindow ? 'bg-emerald-500/20' : 'bg-rose-500/20'
                )}
              >
                <Timer size={14} color={mealScheduleInfo.isWithinWindow ? '#10b981' : '#f43f5e'} />
                <Text
                  className={cn(
                    'ml-1 text-sm font-medium',
                    mealScheduleInfo.isWithinWindow ? 'text-emerald-400' : 'text-rose-400'
                  )}
                >
                  {mealScheduleInfo.scheduledTime}
                </Text>
              </View>
            )}
          </View>

          <Text className="mb-2 text-3xl font-bold text-white">{meal.name}</Text>
          <Text className="mb-4 text-base text-white/60">{meal.description}</Text>

          {/* Quick stats */}
          <View className="mb-6 flex-row flex-wrap gap-3">
            {totalTime > 0 && (
              <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                <Clock size={16} color="rgba(255,255,255,0.6)" />
                <Text className="ml-1.5 text-sm text-white/80">{totalTime}m total</Text>
              </View>
            )}
            {meal.prepTime && (
              <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                <ChefHat size={16} color="rgba(255,255,255,0.6)" />
                <Text className="ml-1.5 text-sm text-white/80">{meal.prepTime}m prep</Text>
              </View>
            )}
            {meal.servings && (
              <View className="flex-row items-center rounded-full bg-white/10 px-3 py-1.5">
                <Users size={16} color="rgba(255,255,255,0.6)" />
                <Text className="ml-1.5 text-sm text-white/80">{meal.servings} serving</Text>
              </View>
            )}
          </View>

          {/* Fasting Window Info */}
          {mealScheduleInfo && (
            <Animated.View entering={FadeInUp.delay(120).springify()} className="mb-6">
              <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <LinearGradient
                  colors={
                    mealScheduleInfo.isWithinWindow
                      ? ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']
                      : ['rgba(244,63,94,0.2)', 'rgba(244,63,94,0.05)']
                  }
                  style={{ padding: 16, borderRadius: 16 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <View
                        className={cn(
                          'mr-3 h-10 w-10 items-center justify-center rounded-xl',
                          mealScheduleInfo.isWithinWindow ? 'bg-emerald-500/30' : 'bg-rose-500/30'
                        )}
                      >
                        {mealScheduleInfo.isWithinWindow ? (
                          <Check size={20} color="#10b981" />
                        ) : (
                          <Clock size={20} color="#f43f5e" />
                        )}
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-white">
                          {mealScheduleInfo.isWithinWindow
                            ? 'Within Eating Window'
                            : 'Outside Eating Window'}
                        </Text>
                        <Text className="text-xs text-white/50">
                          {fastingPlan} fasting • {mealScheduleInfo.fastingWindow.eatingStartTime} -{' '}
                          {mealScheduleInfo.fastingWindow.eatingEndTime}
                        </Text>
                      </View>
                    </View>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

          {/* Dietary tags */}
          {meal.dietaryTags.length > 0 && (
            <View className="mb-6 flex-row flex-wrap gap-2">
              {meal.dietaryTags.map((tag) => (
                <View key={tag} className="rounded-full bg-emerald-500/20 px-3 py-1">
                  <Text className="text-sm capitalize text-emerald-400">{tag.replace('_', ' ')}</Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Prep Video */}
        {meal.videoUrl && (
          <Animated.View entering={FadeInUp.delay(130).springify()} className="mb-6">
            <Text className="mb-3 text-xl font-semibold text-white">Prep Video</Text>
            <ExerciseVideoPlayer
              videoUrl={meal.videoUrl}
              thumbnailUrl={meal.thumbnailUrl ?? meal.imageUrl}
              title={`How to make ${meal.name}`}
              loop={false}
              autoPlay={false}
            />
          </Animated.View>
        )}

        {/* Nutrition Card */}
        <Animated.View entering={FadeInUp.delay(150).springify()} className="mb-6">
          <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(6,182,212,0.2)', 'rgba(6,182,212,0.05)']}
              style={{ padding: 20, borderRadius: 20 }}
            >
              <Text className="mb-4 text-lg font-semibold text-white">Nutrition Facts</Text>
              <View className="flex-row justify-between">
                <View className="items-center">
                  <View className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/20">
                    <Flame size={28} color="#f97316" />
                  </View>
                  <Text className="text-2xl font-bold text-white">{meal.nutrition.calories}</Text>
                  <Text className="text-sm text-white/50">Calories</Text>
                </View>
                <View className="items-center">
                  <View className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/20">
                    <Text className="text-lg font-bold text-cyan-400">P</Text>
                  </View>
                  <Text className="text-2xl font-bold text-cyan-400">{meal.nutrition.protein}g</Text>
                  <Text className="text-sm text-white/50">Protein</Text>
                </View>
                <View className="items-center">
                  <View className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/20">
                    <Text className="text-lg font-bold text-amber-400">C</Text>
                  </View>
                  <Text className="text-2xl font-bold text-amber-400">{meal.nutrition.carbs}g</Text>
                  <Text className="text-sm text-white/50">Carbs</Text>
                </View>
                <View className="items-center">
                  <View className="mb-2 h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20">
                    <Text className="text-lg font-bold text-rose-400">F</Text>
                  </View>
                  <Text className="text-2xl font-bold text-rose-400">{meal.nutrition.fat}g</Text>
                  <Text className="text-sm text-white/50">Fat</Text>
                </View>
              </View>

              {/* Additional nutrition */}
              {(meal.nutrition.fiber || meal.nutrition.sugar) && (
                <View className="mt-4 flex-row justify-around border-t border-white/10 pt-4">
                  {meal.nutrition.fiber && (
                    <View className="items-center">
                      <Text className="text-lg font-semibold text-white">{meal.nutrition.fiber}g</Text>
                      <Text className="text-sm text-white/50">Fiber</Text>
                    </View>
                  )}
                  {meal.nutrition.sugar && (
                    <View className="items-center">
                      <Text className="text-lg font-semibold text-white">{meal.nutrition.sugar}g</Text>
                      <Text className="text-sm text-white/50">Sugar</Text>
                    </View>
                  )}
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Ingredients */}
        <Animated.View entering={FadeInUp.delay(200).springify()} className="mb-6">
          <Text className="mb-4 text-xl font-semibold text-white">Ingredients</Text>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <View className="border border-white/5 p-4">
              {meal.ingredients.map((ingredient, index) => (
                <View
                  key={index}
                  className={cn(
                    'flex-row items-center justify-between py-3',
                    index > 0 && 'border-t border-white/5'
                  )}
                >
                  <View className="flex-row items-center flex-1">
                    <View className="mr-3 h-2 w-2 rounded-full bg-emerald-500" />
                    <Text className="text-base text-white flex-1">{ingredient.name}</Text>
                  </View>
                  <Text className="text-base text-white/50">{ingredient.amount}</Text>
                </View>
              ))}
            </View>
          </BlurView>
        </Animated.View>

        {/* Instructions */}
        {meal.instructions && meal.instructions.length > 0 && (
          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <Text className="mb-4 text-xl font-semibold text-white">Instructions</Text>
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <View className="border border-white/5 p-4">
                {meal.instructions.map((instruction, index) => (
                  <View key={index} className={cn('flex-row', index > 0 && 'mt-4')}>
                    <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-cyan-500/20">
                      <Text className="text-sm font-bold text-cyan-400">{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-base leading-6 text-white/80">{instruction}</Text>
                  </View>
                ))}
              </View>
            </BlurView>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, startOfWeek, addDays } from 'date-fns';
import {
  X,
  FileDown,
  Share2,
  Calendar,
  Dumbbell,
  Utensils,
  Timer,
  Check,
  CalendarDays,
  Sun,
  Moon,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useProfile, useFastingPlan } from '@/lib/state/user-store';
import { DailyPlanEngine } from '@/lib/services/daily-plan-engine';
import { PDFService } from '@/lib/services/pdf-service';
import type { FastingPlan, DifficultyLevel, MealIntensity } from '@/types/fitness';

type ExportType = 'daily' | 'weekly';
type ExportOption = 'workout' | 'meals' | 'fasting';

function TypeToggle({
  type,
  selected,
  onSelect,
  delay,
}: {
  type: ExportType;
  selected: boolean;
  onSelect: () => void;
  delay: number;
}) {
  const isDaily = type === 'daily';
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} className="flex-1">
      <Pressable onPress={onSelect}>
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View
            className={cn(
              'items-center border p-4',
              selected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5'
            )}
          >
            <View
              className={cn(
                'mb-2 h-12 w-12 items-center justify-center rounded-xl',
                selected ? 'bg-emerald-500/30' : 'bg-white/5'
              )}
            >
              {isDaily ? (
                <Calendar size={24} color={selected ? '#10b981' : 'rgba(255,255,255,0.4)'} />
              ) : (
                <CalendarDays size={24} color={selected ? '#10b981' : 'rgba(255,255,255,0.4)'} />
              )}
            </View>
            <Text className={cn('text-base font-medium', selected ? 'text-emerald-400' : 'text-white/60')}>
              {isDaily ? 'Daily Plan' : 'Weekly Plan'}
            </Text>
            <Text className={cn('text-xs', selected ? 'text-emerald-400/60' : 'text-white/30')}>
              {isDaily ? "Today's plan" : '7-day overview'}
            </Text>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

function OptionToggle({
  icon: Icon,
  label,
  selected,
  onToggle,
  color,
  delay,
}: {
  icon: typeof Dumbbell;
  label: string;
  selected: boolean;
  onToggle: () => void;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable onPress={onToggle}>
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View
            className={cn(
              'flex-row items-center justify-between border p-4',
              selected ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-white/5'
            )}
          >
            <View className="flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${color}20` }}
              >
                <Icon size={20} color={color} />
              </View>
              <Text className="text-base font-medium text-white">{label}</Text>
            </View>
            <View
              className={cn(
                'h-6 w-6 items-center justify-center rounded-full',
                selected ? 'bg-emerald-500' : 'border border-white/20'
              )}
            >
              {selected && <Check size={14} color="white" strokeWidth={3} />}
            </View>
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function PDFPreviewScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ type?: string }>();
  const profile = useProfile();
  const fastingPlan = useFastingPlan();

  // Initialize export type from params (for weekly link from weekly-plan screen)
  const initialType: ExportType = params.type === 'weekly' ? 'weekly' : 'daily';
  const [exportType, setExportType] = useState<ExportType>(initialType);

  const [selectedOptions, setSelectedOptions] = useState<ExportOption[]>([
    'workout',
    'meals',
    'fasting',
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

  const toggleOption = (option: ExportOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedOptions((prev) =>
      prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
    );
  };

  const handleSelectType = (type: ExportType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExportType(type);
  };

  // Generate daily plan
  const dailyPlan = useMemo(() => {
    if (!profile) return null;
    return DailyPlanEngine.generate({
      userId: 'user-1',
      date: new Date(),
      profile: {
        weight: profile.weight,
        workType: profile.workType,
        fastingPlan: (fastingPlan ?? '16:8') as FastingPlan,
        workoutDifficulty: (profile.workoutDifficulty ?? 'beginner') as DifficultyLevel,
        mealIntensity: (profile.mealIntensity ?? 'standard') as MealIntensity,
      },
    });
  }, [profile, fastingPlan]);

  // Generate week plans
  const weekPlans = useMemo(() => {
    if (!profile) return [];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return DailyPlanEngine.generateWeek('user-1', weekStart, {
      weight: profile.weight,
      workType: profile.workType,
      fastingPlan: (fastingPlan ?? '16:8') as FastingPlan,
      workoutDifficulty: (profile.workoutDifficulty ?? 'beginner') as DifficultyLevel,
      mealIntensity: (profile.mealIntensity ?? 'standard') as MealIntensity,
    });
  }, [profile, fastingPlan]);

  // Date display
  const dateDisplay = useMemo(() => {
    if (exportType === 'daily') {
      return format(new Date(), 'EEEE, MMMM d');
    }
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return `${format(weekStart, 'MMM d')} - ${format(addDays(weekStart, 6), 'MMM d, yyyy')}`;
  }, [exportType]);

  const handleGeneratePDF = useCallback(async () => {
    if (selectedOptions.length === 0) {
      Alert.alert('Select Options', 'Please select at least one section to include in the PDF.');
      return;
    }

    if (exportType === 'daily' && !dailyPlan) {
      Alert.alert('Error', 'Could not generate daily plan.');
      return;
    }

    if (exportType === 'weekly' && weekPlans.length === 0) {
      Alert.alert('Error', 'Could not generate weekly plans.');
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      let html: string;

      if (exportType === 'daily' && dailyPlan) {
        // Generate daily PDF using PDFService
        html = PDFService.generateDailyHTML(dailyPlan, {
          includeWorkout: selectedOptions.includes('workout'),
          includeMeals: selectedOptions.includes('meals'),
          includeFasting: selectedOptions.includes('fasting'),
        });
      } else {
        // Generate weekly PDF using PDFService
        const weekData = PDFService.generateWeeklyData(weekPlans);
        html = PDFService.generateWeeklyHTML(weekData, {
          includeWorkout: selectedOptions.includes('workout'),
          includeMeals: selectedOptions.includes('meals'),
          includeFasting: selectedOptions.includes('fasting'),
        });
      }

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      setIsGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Share Your ${exportType === 'daily' ? 'Daily' : 'Weekly'} Plan`,
        });
      } else {
        Alert.alert('Success', 'PDF generated successfully!');
      }
    } catch (error) {
      setIsGenerating(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
      console.error('[PDFPreview] Error generating PDF:', error);
    }
  }, [selectedOptions, exportType, dailyPlan, weekPlans]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  // Stats for preview
  const previewStats = useMemo(() => {
    if (exportType === 'daily' && dailyPlan) {
      return {
        workouts: dailyPlan.isRestDay ? 0 : 1,
        meals: dailyPlan.meals.scheduled.length,
        calories: dailyPlan.meals.totalNutrition.calories,
        fastingPlan: dailyPlan.fasting.window.plan,
      };
    }
    if (exportType === 'weekly' && weekPlans.length > 0) {
      const totalWorkouts = weekPlans.filter((p) => !p.isRestDay && p.workout).length;
      const totalMeals = weekPlans.reduce((sum, p) => sum + p.meals.scheduled.length, 0);
      const avgCalories = Math.round(
        weekPlans.reduce((sum, p) => sum + p.meals.totalNutrition.calories, 0) / 7
      );
      return {
        workouts: totalWorkouts,
        meals: totalMeals,
        calories: avgCalories,
        fastingPlan: weekPlans[0]?.fasting.window.plan ?? '16:8',
      };
    }
    return null;
  }, [exportType, dailyPlan, weekPlans]);

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
          <Animated.View entering={FadeInDown.delay(0).springify()}>
            <Text className="text-3xl font-bold text-white">Export PDF</Text>
            <Text className="text-base text-white/60">Choose what to include</Text>
          </Animated.View>
          <Pressable onPress={handleClose}>
            <BlurView intensity={30} tint="dark" style={{ borderRadius: 12, overflow: 'hidden' }}>
              <View className="h-10 w-10 items-center justify-center border border-white/10">
                <X size={20} color="white" />
              </View>
            </BlurView>
          </Pressable>
        </View>

        {/* Export Type Selection */}
        <Text className="mb-3 text-lg font-semibold text-white">Export Type</Text>
        <View className="mb-6 flex-row gap-3">
          <TypeToggle
            type="daily"
            selected={exportType === 'daily'}
            onSelect={() => handleSelectType('daily')}
            delay={50}
          />
          <TypeToggle
            type="weekly"
            selected={exportType === 'weekly'}
            onSelect={() => handleSelectType('weekly')}
            delay={100}
          />
        </View>

        {/* Date Card */}
        <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-6">
          <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']}
              style={{ padding: 20, borderRadius: 20 }}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-4 h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/30">
                    {exportType === 'daily' ? (
                      <Calendar size={24} color="#10b981" />
                    ) : (
                      <CalendarDays size={24} color="#10b981" />
                    )}
                  </View>
                  <View>
                    <Text className="text-lg font-semibold text-white">{dateDisplay}</Text>
                    <Text className="text-sm text-white/60">
                      {exportType === 'daily' ? 'Daily Plan Export' : 'Weekly Plan Export'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Stats */}
              {previewStats && (
                <View className="mt-4 flex-row justify-between rounded-xl bg-white/5 p-3">
                  <View className="items-center">
                    <Text className="text-lg font-bold text-white">{previewStats.workouts}</Text>
                    <Text className="text-xs text-white/40">
                      {exportType === 'daily' ? 'Workout' : 'Workouts'}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-cyan-400">{previewStats.meals}</Text>
                    <Text className="text-xs text-white/40">Meals</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-orange-400">{previewStats.calories}</Text>
                    <Text className="text-xs text-white/40">
                      {exportType === 'daily' ? 'Calories' : 'Avg Cal'}
                    </Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-lg font-bold text-violet-400">{previewStats.fastingPlan}</Text>
                    <Text className="text-xs text-white/40">Fasting</Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Options */}
        <Text className="mb-3 text-lg font-semibold text-white">Include in PDF</Text>
        <View className="mb-8 gap-3">
          <OptionToggle
            icon={Timer}
            label="Fasting Schedule"
            selected={selectedOptions.includes('fasting')}
            onToggle={() => toggleOption('fasting')}
            color="#a78bfa"
            delay={200}
          />
          <OptionToggle
            icon={Dumbbell}
            label="Workout Plan"
            selected={selectedOptions.includes('workout')}
            onToggle={() => toggleOption('workout')}
            color="#f97316"
            delay={250}
          />
          <OptionToggle
            icon={Utensils}
            label="Meal Plan"
            selected={selectedOptions.includes('meals')}
            onToggle={() => toggleOption('meals')}
            color="#06b6d4"
            delay={300}
          />
        </View>

        {/* Preview info */}
        <Animated.View entering={FadeInUp.delay(350).springify()}>
          <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
            <View className="border border-white/5 p-4">
              <Text className="mb-2 text-sm font-medium text-white/60">PDF will include:</Text>
              <View className="gap-1">
                {selectedOptions.includes('fasting') && (
                  <Text className="text-sm text-white">• Intermittent fasting schedule and window</Text>
                )}
                {selectedOptions.includes('workout') && (
                  <Text className="text-sm text-white">
                    • {exportType === 'daily' ? 'Complete workout with exercises' : 'Weekly workout overview'}
                  </Text>
                )}
                {selectedOptions.includes('meals') && (
                  <Text className="text-sm text-white">
                    • {exportType === 'daily' ? 'Full meal plan with nutrition' : 'Weekly meal summary'}
                  </Text>
                )}
                {selectedOptions.length === 0 && (
                  <Text className="text-sm text-white/50">Select options above to include in your PDF</Text>
                )}
              </View>
            </View>
          </BlurView>
        </Animated.View>
      </ScrollView>

      {/* Bottom Action */}
      <Animated.View
        entering={FadeInUp.delay(400)}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 20,
          left: 20,
          right: 20,
        }}
      >
        <Pressable onPress={handleGeneratePDF} disabled={isGenerating || selectedOptions.length === 0}>
          <BlurView intensity={60} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
            <LinearGradient
              colors={
                selectedOptions.length === 0
                  ? ['rgba(100,116,139,0.3)', 'rgba(100,116,139,0.2)']
                  : ['#10b981', '#059669']
              }
              style={{
                padding: 18,
                borderRadius: 20,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                opacity: selectedOptions.length === 0 ? 0.5 : 1,
              }}
            >
              {isGenerating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Share2 size={22} color="white" />
                  <Text className="ml-2 text-lg font-semibold text-white">
                    Generate & Share {exportType === 'daily' ? 'Daily' : 'Weekly'} PDF
                  </Text>
                </>
              )}
            </LinearGradient>
          </BlurView>
        </Pressable>
      </Animated.View>
    </View>
  );
}

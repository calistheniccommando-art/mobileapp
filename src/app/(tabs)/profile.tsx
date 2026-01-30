import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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
  User,
  Scale,
  Activity,
  Timer,
  ChevronRight,
  LogOut,
  Moon,
  Sun,
  Settings,
  Target,
  Dumbbell,
  Utensils,
  Mail,
  Calendar,
  Trash2,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useUserStore, useProfile, useFastingPlan } from '@/lib/state/user-store';
import { usePersonalizedPlan, useIsComplete, useOnboardingData as useCommandoData, useCommandoStore } from '@/lib/state/commando-store';
import { useMealSelectionStore } from '@/lib/state/meal-selection-store';
import { useSubscriptionStore } from '@/lib/state/subscription-store';
import { getFastingWindow } from '@/data/mock-data';
import type { FastingPlan, WorkType, DifficultyLevel, MealIntensity } from '@/types/fitness';

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  sedentary: 'Sedentary',
  moderate: 'Moderately Active',
  active: 'Physically Active',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

const MEAL_INTENSITY_LABELS: Record<MealIntensity, string> = {
  light: 'Light',
  standard: 'Standard',
  high_energy: 'High Energy',
};

const FASTING_PLANS: { plan: FastingPlan; label: string; description: string }[] = [
  { plan: '12:12', label: '12:12', description: '12 hours fasting, 12 hours eating' },
  { plan: '14:10', label: '14:10', description: '14 hours fasting, 10 hours eating' },
  { plan: '16:8', label: '16:8', description: '16 hours fasting, 8 hours eating' },
  { plan: '18:6', label: '18:6', description: '18 hours fasting, 6 hours eating' },
];

function ProfileCard({
  icon: Icon,
  iconColor,
  label,
  value,
  onPress,
  delay,
}: {
  icon: typeof User;
  iconColor: string;
  label: string;
  value: string;
  onPress?: () => void;
  delay: number;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()} style={animatedStyle}>
      <Pressable
        onPress={() => {
          if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            scale.value = withSpring(0.98, { damping: 15 });
            setTimeout(() => {
              scale.value = withSpring(1, { damping: 15 });
            }, 100);
            onPress();
          }
        }}
        disabled={!onPress}
      >
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View className="flex-row items-center justify-between border border-white/5 p-4">
            <View className="flex-row items-center">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${iconColor}20` }}
              >
                <Icon size={20} color={iconColor} />
              </View>
              <View>
                <Text className="text-sm text-white/50">{label}</Text>
                <Text className="text-base font-semibold text-white">{value}</Text>
              </View>
            </View>
            {onPress && <ChevronRight size={20} color="rgba(255,255,255,0.3)" />}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

function FastingPlanSelector({ currentFastingPlan }: { currentFastingPlan: FastingPlan }) {
  const profile = useProfile();
  const updateFastingPlan = useUserStore((s) => s.updateFastingPlan);
  const [isExpanded, setIsExpanded] = useState(false);

  const currentPlan = currentFastingPlan;
  const window = getFastingWindow(currentPlan);

  const handleSelectPlan = (plan: FastingPlan) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (profile) {
      updateFastingPlan(plan);
    }
    setIsExpanded(false);
  };

  return (
    <Animated.View entering={FadeInDown.delay(200).springify()}>
      <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsExpanded(!isExpanded);
          }}
        >
          <LinearGradient
            colors={['rgba(139,92,246,0.2)', 'rgba(139,92,246,0.05)']}
            style={{ padding: 16, borderRadius: 16 }}
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl bg-violet-500/30">
                  <Timer size={24} color="#a78bfa" />
                </View>
                <View>
                  <Text className="text-sm text-white/50">Fasting Plan</Text>
                  <Text className="text-xl font-bold text-white">{currentPlan}</Text>
                </View>
              </View>
              <View className="items-end">
                <View className="flex-row items-center">
                  <Moon size={14} color="#a78bfa" />
                  <Text className="ml-1 text-sm text-violet-300">
                    {window.fastingHours}h fast
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Sun size={14} color="#10b981" />
                  <Text className="ml-1 text-sm text-emerald-300">
                    {window.eatingHours}h eat
                  </Text>
                </View>
              </View>
            </View>

            <View className="mt-3 flex-row items-center justify-between rounded-lg bg-white/5 p-3">
              <Text className="text-sm text-white/60">
                Eating window: {window.eatingStartTime} - {window.eatingEndTime}
              </Text>
              <ChevronRight
                size={18}
                color="rgba(255,255,255,0.4)"
                style={{
                  transform: [{ rotate: isExpanded ? '90deg' : '0deg' }],
                }}
              />
            </View>
          </LinearGradient>
        </Pressable>

        {/* Expanded plan options */}
        {isExpanded && (
          <View className="border-t border-white/10 p-4">
            <Text className="mb-3 text-sm font-medium text-white/60">Choose your fasting plan</Text>
            <View className="gap-2">
              {FASTING_PLANS.map((item) => (
                <Pressable
                  key={item.plan}
                  onPress={() => handleSelectPlan(item.plan)}
                  className={cn(
                    'flex-row items-center justify-between rounded-xl p-3',
                    currentPlan === item.plan ? 'bg-violet-500/20' : 'bg-white/5'
                  )}
                >
                  <View>
                    <Text className="text-base font-semibold text-white">{item.label}</Text>
                    <Text className="text-sm text-white/50">{item.description}</Text>
                  </View>
                  {currentPlan === item.plan && (
                    <View className="h-5 w-5 items-center justify-center rounded-full bg-violet-500">
                      <View className="h-2 w-2 rounded-full bg-white" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </BlurView>
    </Animated.View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const profile = useProfile();
  const personalizedPlan = usePersonalizedPlan();
  const commandoData = useCommandoData();
  const isCommandoComplete = useIsComplete();
  const resetProfile = useUserStore((s) => s.resetProfile);
  const resetOnboarding = useCommandoStore((s) => s.resetOnboarding);
  const resetMealSelections = useMealSelectionStore((s) => s.resetAllSelections);
  const resetSubscription = useSubscriptionStore((s) => s.resetSubscription);

  const handleLogout = useCallback(() => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out? You will need to complete the onboarding again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'default',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            // Reset all stores
            resetProfile();
            resetOnboarding();
            resetMealSelections();
            resetSubscription();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }, [resetProfile, resetOnboarding, resetMealSelections, resetSubscription]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete all your data. This action cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            // Reset all stores
            resetProfile();
            resetOnboarding();
            resetMealSelections();
            resetSubscription();
            router.replace('/onboarding');
          },
        },
      ]
    );
  }, [resetProfile, resetOnboarding, resetMealSelections, resetSubscription]);

  // Use commando plan data if profile doesn't exist but commando onboarding is complete
  const displayData = profile
    ? {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        weight: profile.weight,
        height: profile.height,
        workType: profile.workType,
        fastingPlan: profile.fastingPlan,
        workoutDifficulty: profile.workoutDifficulty,
        mealIntensity: profile.mealIntensity,
        fitnessGoal: profile.fitnessGoal,
      }
    : personalizedPlan
    ? {
        firstName: 'User',
        lastName: '',
        email: '',
        weight: personalizedPlan.profile.weightKg,
        height: personalizedPlan.profile.heightCm,
        workType: 'moderate' as WorkType,
        fastingPlan: personalizedPlan.nutrition.fastingPlan,
        workoutDifficulty: personalizedPlan.training.difficulty,
        mealIntensity: personalizedPlan.nutrition.mealIntensity,
        fitnessGoal: personalizedPlan.goals.primary,
      }
    : commandoData && Object.keys(commandoData).length > 0
    ? {
        firstName: commandoData.firstName ?? 'User',
        lastName: commandoData.lastName ?? '',
        email: commandoData.email ?? '',
        weight: commandoData.weightKg ?? commandoData.currentWeight ?? 70,
        height: commandoData.heightCm ?? 170,
        workType: 'moderate' as WorkType,
        fastingPlan: '16:8' as FastingPlan,
        workoutDifficulty: commandoData.fitnessAssessment?.overallLevel ?? 'intermediate' as DifficultyLevel,
        mealIntensity: 'standard' as MealIntensity,
        fitnessGoal: commandoData.primaryGoal ?? 'get_fit_toned',
      }
    : null;

  if (!displayData) {
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
        <Animated.View entering={FadeInDown.delay(0).springify()} className="mb-8 items-center">
          <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20">
            <Text className="text-3xl font-bold text-emerald-400">
              {`${displayData.firstName?.[0]?.toUpperCase() ?? ''}${displayData.lastName?.[0]?.toUpperCase() ?? ''}`}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-white">
            {`${displayData.firstName ?? ''} ${displayData.lastName ?? ''}`.trim() || 'User'}
          </Text>
          {displayData.email && <Text className="text-base text-white/60">{displayData.email}</Text>}
        </Animated.View>

        {/* Personalization Section */}
        <Text className="mb-3 text-lg font-semibold text-white">Your Plan</Text>
        <View className="mb-6 gap-3">
          <ProfileCard
            icon={Dumbbell}
            iconColor="#8b5cf6"
            label="Workout Difficulty"
            value={displayData.workoutDifficulty ? DIFFICULTY_LABELS[displayData.workoutDifficulty] : 'Not set'}
            delay={50}
          />
          <ProfileCard
            icon={Utensils}
            iconColor="#f472b6"
            label="Meal Intensity"
            value={displayData.mealIntensity ? MEAL_INTENSITY_LABELS[displayData.mealIntensity] : 'Not set'}
            delay={75}
          />
        </View>

        {/* Stats Cards */}
        <Text className="mb-3 text-lg font-semibold text-white">Your Stats</Text>
        <View className="mb-6 gap-3">
          <ProfileCard
            icon={Scale}
            iconColor="#f59e0b"
            label="Current Weight"
            value={`${displayData.weight} kg`}
            delay={100}
          />
          {displayData.height && (
            <ProfileCard
              icon={Activity}
              iconColor="#06b6d4"
              label="Height"
              value={`${displayData.height} cm`}
              delay={125}
            />
          )}
          <ProfileCard
            icon={Activity}
            iconColor="#10b981"
            label="Activity Level"
            value={WORK_TYPE_LABELS[displayData.workType]}
            delay={150}
          />
          {displayData.fitnessGoal && (
            <ProfileCard
              icon={Target}
              iconColor="#ec4899"
              label="Fitness Goal"
              value={displayData.fitnessGoal.replace('_', ' ')}
              delay={175}
            />
          )}
        </View>

        {/* Fasting Plan Selector */}
        <Text className="mb-3 text-lg font-semibold text-white">Intermittent Fasting</Text>
        <View className="mb-6">
          <FastingPlanSelector currentFastingPlan={displayData.fastingPlan} />
        </View>

        {/* Actions */}
        <Text className="mb-3 text-lg font-semibold text-white">Actions</Text>
        <View className="gap-3">
          <ProfileCard
            icon={Settings}
            iconColor="#64748b"
            label="Settings"
            value="App preferences"
            onPress={() => router.push('/settings')}
            delay={250}
          />

          {/* Logout Button */}
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <Pressable onPress={handleLogout}>
              <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <View className="flex-row items-center justify-between border border-white/5 p-4">
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
                      <LogOut size={20} color="#f59e0b" />
                    </View>
                    <View>
                      <Text className="text-base font-semibold text-white">Log Out</Text>
                      <Text className="text-sm text-white/50">Sign out of your account</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="rgba(255,255,255,0.3)" />
                </View>
              </BlurView>
            </Pressable>
          </Animated.View>

          {/* Delete Account Button */}
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <Pressable onPress={handleDeleteAccount}>
              <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
                <View className="flex-row items-center justify-between border border-rose-500/20 bg-rose-500/10 p-4">
                  <View className="flex-row items-center">
                    <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
                      <Trash2 size={20} color="#f43f5e" />
                    </View>
                    <View>
                      <Text className="text-base font-semibold text-rose-400">Delete Account</Text>
                      <Text className="text-sm text-white/50">Permanently delete all data</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#f43f5e" />
                </View>
              </BlurView>
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

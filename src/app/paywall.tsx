/**
 * PAYWALL SCREEN
 *
 * Gender-aware subscription paywall that displays after onboarding.
 * Shows pricing plans, trial options, and handles payment flow.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Crown,
  Dumbbell,
  Utensils,
  Moon,
  Trophy,
  Shield,
  Sparkles,
  Heart,
  ChevronRight,
  BookOpen,
  Users,
  Star,
  Zap,
  Gift,
  X,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useOnboardingData as useCommandoData } from '@/lib/state/commando-store';
import {
  useSubscriptionStore,
  useSelectedPlan,
  useIsTrialSelected,
  useIsProcessingPayment,
  usePaymentError,
  formatPrice,
  formatDailyCost,
  getAllPlans,
} from '@/lib/state/subscription-store';
import type { SubscriptionPlanId, SubscriptionPlan, ShippingAddress } from '@/types/subscription';
import {
  SUBSCRIPTION_PLANS,
  TRIAL_OFFER,
  PAYWALL_CONTENT_MALE,
  PAYWALL_CONTENT_FEMALE,
} from '@/types/subscription';
import { emailService, buildConfirmationEmailData } from '@/lib/services/email-service';

// ==================== PLAN CARD COMPONENT ====================

function PlanCard({
  plan,
  isSelected,
  onSelect,
  gender,
}: {
  plan: SubscriptionPlan;
  isSelected: boolean;
  onSelect: () => void;
  gender: 'male' | 'female';
}) {
  const scale = useSharedValue(1);
  const isRecommended = plan.recommended;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 15 })
    );
    onSelect();
  };

  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';
  const recommendedColor = '#f59e0b';
  const gradientColors = isRecommended
    ? ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.1)']
    : isSelected
    ? gender === 'male'
      ? ['rgba(16,185,129,0.3)', 'rgba(16,185,129,0.1)']
      : ['rgba(236,72,153,0.3)', 'rgba(236,72,153,0.1)']
    : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)'];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable onPress={handlePress}>
        <BlurView intensity={isRecommended ? 50 : 40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
          <LinearGradient colors={gradientColors as [string, string]} style={{ borderRadius: 20 }}>
            <View
              className={cn(
                'border-2 p-4',
                isRecommended
                  ? 'border-amber-500'
                  : isSelected
                  ? gender === 'male'
                    ? 'border-emerald-500'
                    : 'border-pink-500'
                  : 'border-white/10'
              )}
              style={{ borderRadius: 20 }}
            >
              {/* Badge */}
              {plan.badge && (
                <View
                  className="absolute -top-3 right-4 rounded-full px-3 py-1.5"
                  style={{ backgroundColor: isRecommended ? recommendedColor : accentColor }}
                >
                  <Text className="text-xs font-bold text-white">{plan.badge}</Text>
                </View>
              )}

              {/* Header */}
              <View className="mb-3 flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className={cn('text-xl font-bold', isRecommended ? 'text-amber-400' : 'text-white')}>
                    {plan.name}
                  </Text>
                  <Text className="text-sm text-white/60">{plan.tagline}</Text>
                </View>
                <View
                  className={cn(
                    'h-6 w-6 items-center justify-center rounded-full',
                    isSelected ? 'bg-white' : 'border-2 border-white/30'
                  )}
                >
                  {isSelected && <Check size={14} color={isRecommended ? recommendedColor : accentColor} strokeWidth={3} />}
                </View>
              </View>

              {/* Price */}
              <View className="mb-3">
                <View className="flex-row items-baseline">
                  <Text className={cn('text-4xl font-bold', isRecommended ? 'text-amber-400' : 'text-white')}>
                    {formatPrice(plan.priceNaira)}
                  </Text>
                  <Text className="ml-2 text-sm text-white/60">
                    / {plan.durationMonths} month{plan.durationMonths > 1 ? 's' : ''}
                  </Text>
                </View>
                <View className="mt-1 flex-row items-center gap-3">
                  <Text className="text-sm font-medium" style={{ color: isRecommended ? recommendedColor : accentColor }}>
                    Only {formatDailyCost(plan.dailyCostNaira)}
                  </Text>
                  {plan.savingsPercent > 0 && (
                    <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
                      <Text className="text-xs font-bold text-emerald-400">
                        Save {plan.savingsPercent}%
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Key Features */}
              <View className="space-y-2">
                {plan.includesPhysicalBook && (
                  <View className="flex-row items-center rounded-lg bg-amber-500/10 p-2">
                    <BookOpen size={16} color={recommendedColor} />
                    <Text className="ml-2 text-sm font-medium text-amber-400">
                      Physical guidebook included + shipped!
                    </Text>
                  </View>
                )}
                {plan.includesTrainerCheckin && (
                  <View className="flex-row items-center">
                    <Users size={16} color={accentColor} />
                    <Text className="ml-2 text-sm text-white">
                      {plan.trainerCheckinFrequency} trainer check-ins
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </LinearGradient>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

// ==================== TRIAL CARD COMPONENT ====================

function TrialCard({
  isSelected,
  onSelect,
  gender,
}: {
  isSelected: boolean;
  onSelect: () => void;
  gender: 'male' | 'female';
}) {
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  return (
    <Pressable onPress={onSelect}>
      <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
        <View
          className={cn(
            'flex-row items-center justify-between border-2 p-4',
            isSelected
              ? gender === 'male'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-pink-500 bg-pink-500/10'
              : 'border-white/10'
          )}
          style={{ borderRadius: 16 }}
        >
          <View className="flex-row items-center">
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${accentColor}30` }}
            >
              <Gift size={20} color={accentColor} />
            </View>
            <View>
              <Text className="font-semibold text-white">
                {TRIAL_OFFER.durationDays}-Day Trial
              </Text>
              <Text className="text-sm text-white/60">
                Only {formatPrice(TRIAL_OFFER.priceNaira)} to start
              </Text>
            </View>
          </View>
          <View
            className={cn(
              'h-6 w-6 items-center justify-center rounded-full',
              isSelected ? 'bg-white' : 'border-2 border-white/30'
            )}
          >
            {isSelected && <Check size={14} color={accentColor} strokeWidth={3} />}
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}

// ==================== FEATURE ITEM ====================

function FeatureItem({
  icon: Icon,
  title,
  description,
  color,
  delay,
}: {
  icon: typeof Dumbbell;
  title: string;
  description: string;
  color: string;
  delay: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="mb-3 flex-row items-center"
    >
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={20} color={color} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-white">{title}</Text>
        <Text className="text-sm text-white/60">{description}</Text>
      </View>
    </Animated.View>
  );
}

// ==================== SHIPPING ADDRESS MODAL ====================

function ShippingAddressForm({
  onSubmit,
  onCancel,
  gender,
}: {
  onSubmit: (address: ShippingAddress) => void;
  onCancel: () => void;
  gender: 'male' | 'female';
}) {
  const [fullName, setFullName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');

  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  const handleSubmit = () => {
    if (!fullName || !street || !city || !state || !phone) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    onSubmit({
      fullName,
      street,
      city,
      state,
      phone,
    });
  };

  return (
    <View className="flex-1 justify-center bg-black/80 p-6">
      <BlurView intensity={60} tint="dark" style={{ borderRadius: 24, overflow: 'hidden' }}>
        <View className="p-6">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-white">Shipping Address</Text>
            <Pressable onPress={onCancel}>
              <X size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </View>

          <Text className="mb-4 text-sm text-white/60">
            Your physical guidebook will be shipped to this address.
          </Text>

          <View className="space-y-3">
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full Name"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-white"
            />
            <TextInput
              value={street}
              onChangeText={setStreet}
              placeholder="Street Address"
              placeholderTextColor="rgba(255,255,255,0.4)"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-white"
            />
            <View className="flex-row gap-3">
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="City"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 text-white"
              />
              <TextInput
                value={state}
                onChangeText={setState}
                placeholder="State"
                placeholderTextColor="rgba(255,255,255,0.4)"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4 text-white"
              />
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone Number"
              placeholderTextColor="rgba(255,255,255,0.4)"
              keyboardType="phone-pad"
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-white"
            />
          </View>

          <Pressable
            onPress={handleSubmit}
            className="mt-6 items-center rounded-xl py-4"
            style={{ backgroundColor: accentColor }}
          >
            <Text className="font-semibold text-white">Confirm Address</Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

// ==================== MAIN PAYWALL SCREEN ====================

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const commandoData = useCommandoData();
  const gender = commandoData.gender ?? 'male';

  const selectedPlanId = useSelectedPlan();
  const isTrialSelected = useIsTrialSelected();
  const isProcessingPayment = useIsProcessingPayment();
  const paymentError = usePaymentError();

  const {
    selectPlan,
    selectTrial,
    setShippingAddress,
    startPayment,
    completePayment,
    failPayment,
  } = useSubscriptionStore();

  const [showShippingForm, setShowShippingForm] = useState(false);
  const [expandedPlanId, setExpandedPlanId] = useState<SubscriptionPlanId | null>(null);

  // Auto-select the 6-month plan on mount if no plan is selected
  useEffect(() => {
    if (!selectedPlanId && !isTrialSelected) {
      selectPlan('6_month');
    }
  }, []);

  const content = gender === 'male' ? PAYWALL_CONTENT_MALE : PAYWALL_CONTENT_FEMALE;
  const accentColor = gender === 'male' ? '#10b981' : '#ec4899';

  const theme = useMemo(
    () => ({
      gradient: gender === 'male'
        ? ['#0f172a', '#1e293b', '#0f172a']
        : ['#1a0a1e', '#2d1a35', '#1a0a1e'],
      accent: accentColor,
    }),
    [gender, accentColor]
  );

  const plans = getAllPlans();

  const selectedPlan = selectedPlanId ? SUBSCRIPTION_PLANS[selectedPlanId] : null;

  const totalAmount = useMemo(() => {
    if (isTrialSelected) {
      return TRIAL_OFFER.priceNaira;
    }
    return selectedPlan?.priceNaira ?? 0;
  }, [selectedPlan, isTrialSelected]);

  const handlePlanSelect = useCallback(
    (planId: SubscriptionPlanId) => {
      selectPlan(planId);
      if (planId !== 'monthly') {
        selectTrial(false);
      }
    },
    [selectPlan, selectTrial]
  );

  const handleTrialSelect = useCallback(() => {
    selectPlan('monthly');
    selectTrial(true);
  }, [selectPlan, selectTrial]);

  const handleContinue = useCallback(() => {
    if (!selectedPlanId) {
      Alert.alert('Select a Plan', 'Please select a subscription plan to continue.');
      return;
    }

    const plan = SUBSCRIPTION_PLANS[selectedPlanId];

    // If plan includes physical book, show shipping form
    if (plan.includesPhysicalBook) {
      setShowShippingForm(true);
      return;
    }

    // Proceed to payment
    processPayment();
  }, [selectedPlanId]);

  const handleShippingSubmit = useCallback(
    (address: ShippingAddress) => {
      setShippingAddress(address);
      setShowShippingForm(false);
      processPayment();
    },
    [setShippingAddress]
  );

  const processPayment = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startPayment();

    // Simulate payment processing
    // In production, this would integrate with a payment provider
    setTimeout(async () => {
      const paymentRecord = {
        id: `pay_${Date.now()}`,
        userId: 'user_1',
        subscriptionId: '',
        amount: totalAmount,
        currency: 'NGN' as const,
        status: 'completed' as const,
        paymentMethod: 'card',
        reference: `ref_${Date.now()}`,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      completePayment(paymentRecord);

      // Send confirmation email
      if (selectedPlanId && commandoData.email) {
        const emailData = buildConfirmationEmailData(
          commandoData.firstName ?? 'Warrior',
          commandoData.email,
          gender,
          selectedPlanId,
          new Date()
        );
        await emailService.sendConfirmationEmail(emailData);
      }

      // Navigate to main app
      router.replace('/(tabs)');
    }, 2000);
  }, [totalAmount, startPayment, completePayment, selectedPlanId, commandoData, gender]);

  const iconMap: Record<string, typeof Dumbbell> = {
    dumbbell: Dumbbell,
    utensils: Utensils,
    shield: Shield,
    chart: Trophy,
    sparkles: Sparkles,
    heart: Heart,
    moon: Moon,
    trophy: Trophy,
  };

  if (showShippingForm) {
    return (
      <ShippingAddressForm
        onSubmit={handleShippingSubmit}
        onCancel={() => setShowShippingForm(false)}
        gender={gender}
      />
    );
  }

  return (
    <View className="flex-1">
      <LinearGradient
        colors={theme.gradient as [string, string, string]}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Decorative gradient orbs */}
      <View
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: 150,
          backgroundColor: accentColor,
          opacity: 0.1,
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 120,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(0).springify()} className="mb-6">
            <View className="mb-2 flex-row items-center">
              <Crown size={24} color={accentColor} />
              <Text className="ml-2 text-sm font-medium" style={{ color: accentColor }}>
                YOUR PLAN IS READY
              </Text>
            </View>
            <Text className="text-2xl font-bold text-white">{content.headline}</Text>
            <Text className="mt-2 text-base text-white/60">{content.subheadline}</Text>
          </Animated.View>

          {/* Features */}
          <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-6">
            {content.features.map((feature, index) => {
              const IconComponent = iconMap[feature.icon] ?? Star;
              return (
                <FeatureItem
                  key={feature.title}
                  icon={IconComponent}
                  title={feature.title}
                  description={feature.description}
                  color={accentColor}
                  delay={150 + index * 50}
                />
              );
            })}
          </Animated.View>

          {/* Trial Option */}
          <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-4">
            <TrialCard
              isSelected={isTrialSelected}
              onSelect={handleTrialSelect}
              gender={gender}
            />
          </Animated.View>

          {/* Divider */}
          <Animated.View
            entering={FadeIn.delay(350)}
            className="mb-4 flex-row items-center gap-4"
          >
            <View className="h-px flex-1 bg-white/10" />
            <Text className="text-sm text-white/40">or choose a plan</Text>
            <View className="h-px flex-1 bg-white/10" />
          </Animated.View>

          {/* Plans */}
          <View className="mb-6 space-y-3">
            {plans.map((plan, index) => (
              <Animated.View
                key={plan.id}
                entering={FadeInDown.delay(400 + index * 100).springify()}
              >
                <PlanCard
                  plan={plan}
                  isSelected={selectedPlanId === plan.id && !isTrialSelected}
                  onSelect={() => handlePlanSelect(plan.id)}
                  gender={gender}
                />
              </Animated.View>
            ))}
          </View>

          {/* Motivational Message */}
          <Animated.View entering={FadeInUp.delay(800).springify()} className="mb-4">
            <BlurView intensity={20} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <View className="border border-white/5 p-4">
                <Text className="text-center text-sm italic text-white/70">
                  "{content.motivationalMessage}"
                </Text>
              </View>
            </BlurView>
          </Animated.View>

          {/* Error Message */}
          {paymentError && (
            <Animated.View entering={FadeIn} className="mb-4">
              <View className="rounded-xl bg-red-500/20 p-3">
                <Text className="text-center text-sm text-red-400">{paymentError}</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View
          className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-slate-900/95 px-6 pb-2"
          style={{ paddingBottom: insets.bottom + 8, paddingTop: 16 }}
        >
          {/* Price Summary */}
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-white/60">
              {isTrialSelected
                ? `${TRIAL_OFFER.durationDays}-Day Trial`
                : selectedPlan?.name ?? 'Select a plan'}
            </Text>
            <Text className="text-xl font-bold text-white">
              {totalAmount > 0 ? formatPrice(totalAmount) : '—'}
            </Text>
          </View>

          {/* CTA Button */}
          <Pressable
            onPress={handleContinue}
            disabled={!selectedPlanId || isProcessingPayment}
            className={cn(
              'flex-row items-center justify-center rounded-2xl py-4',
              !selectedPlanId && 'opacity-50'
            )}
            style={{ backgroundColor: accentColor }}
          >
            {isProcessingPayment ? (
              <Text className="font-semibold text-white">Processing...</Text>
            ) : (
              <>
                <Text className="font-semibold text-white">
                  {isTrialSelected ? content.trialCtaText : content.ctaText}
                </Text>
                <ChevronRight size={20} color="white" />
              </>
            )}
          </Pressable>

          {/* Trial note */}
          {isTrialSelected && (
            <Text className="mt-2 text-center text-xs text-white/40">
              After trial, pay {formatPrice(TRIAL_OFFER.remainingAfterTrial)} to continue the month
            </Text>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

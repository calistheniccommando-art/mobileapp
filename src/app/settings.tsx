/**
 * SETTINGS SCREEN
 *
 * App preferences, subscription management, and account settings
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, Switch } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Bell,
  Moon,
  Volume2,
  Lock,
  Crown,
  ChevronRight,
  CreditCard,
  Calendar,
  Check,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  useSubscriptionStore,
  useSubscription,
  useSubscriptionStatus,
  useDaysRemaining,
  formatPrice,
} from '@/lib/state/subscription-store';
import { SUBSCRIPTION_PLANS } from '@/types/subscription';

function SettingItem({
  icon: Icon,
  title,
  description,
  onPress,
  showArrow = true,
  rightElement,
  delay,
}: {
  icon: typeof Bell;
  title: string;
  description?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <Pressable
        onPress={() => {
          if (onPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }
        }}
        disabled={!onPress}
      >
        <BlurView intensity={30} tint="dark" style={{ borderRadius: 16, overflow: 'hidden' }}>
          <View className="flex-row items-center justify-between border border-white/5 p-4">
            <View className="flex-row items-center flex-1">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Icon size={20} color="rgba(255,255,255,0.8)" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-white">{title}</Text>
                {description && <Text className="text-sm text-white/50">{description}</Text>}
              </View>
            </View>
            {rightElement || (showArrow && <ChevronRight size={20} color="rgba(255,255,255,0.3)" />)}
          </View>
        </BlurView>
      </Pressable>
    </Animated.View>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const subscription = useSubscription();
  const subscriptionStatus = useSubscriptionStatus();
  const daysRemaining = useDaysRemaining();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const isActive = subscriptionStatus === 'active' || subscriptionStatus === 'trial';
  const currentPlan = subscription ? SUBSCRIPTION_PLANS[subscription.planId] : null;

  const handleUpgrade = () => {
    router.push('/paywall');
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Manage Subscription',
      'View your subscription details and billing information.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View Details',
          onPress: () => {
            // Show subscription details
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-slate-900">
      <LinearGradient
        colors={['#0f172a', '#1e293b', '#0f172a']}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />

      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-white/10 px-6 pb-4"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="flex-row items-center"
        >
          <ArrowLeft size={24} color="white" />
          <Text className="ml-2 text-xl font-bold text-white">Settings</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Status */}
        {subscription && (
          <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-6">
            <BlurView intensity={40} tint="dark" style={{ borderRadius: 20, overflow: 'hidden' }}>
              <LinearGradient
                colors={
                  isActive
                    ? ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)']
                    : ['rgba(239,68,68,0.2)', 'rgba(239,68,68,0.05)']
                }
                style={{ padding: 20, borderRadius: 20 }}
              >
                <View className="flex-row items-center mb-3">
                  <Crown size={24} color={isActive ? '#10b981' : '#ef4444'} />
                  <Text className="ml-2 text-lg font-bold text-white">
                    {currentPlan?.name}
                  </Text>
                </View>

                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm text-white/60">Status</Text>
                  <View
                    className={cn(
                      'rounded-full px-3 py-1',
                      isActive ? 'bg-emerald-500/20' : 'bg-red-500/20'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-xs font-semibold',
                        isActive ? 'text-emerald-400' : 'text-red-400'
                      )}
                    >
                      {subscriptionStatus === 'trial' ? 'Trial' : subscriptionStatus === 'active' ? 'Active' : 'Expired'}
                    </Text>
                  </View>
                </View>

                {isActive && (
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-white/60">Days Remaining</Text>
                    <Text className="text-base font-semibold text-white">{`${daysRemaining} days`}</Text>
                  </View>
                )}

                <Pressable
                  onPress={handleUpgrade}
                  className="mt-4 flex-row items-center justify-center rounded-xl bg-amber-500 py-3"
                >
                  <Crown size={18} color="white" />
                  <Text className="ml-2 font-semibold text-white">Upgrade Plan</Text>
                </Pressable>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}

        {/* App Preferences */}
        <Text className="mb-3 text-lg font-semibold text-white">App Preferences</Text>
        <View className="mb-6 gap-3">
          <SettingItem
            icon={Bell}
            title="Notifications"
            description="Push notifications for workouts and meals"
            showArrow={false}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={notificationsEnabled ? '#ffffff' : '#64748b'}
              />
            }
            delay={100}
          />
          <SettingItem
            icon={Moon}
            title="Dark Mode"
            description="Always enabled for better viewing"
            showArrow={false}
            rightElement={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={darkModeEnabled ? '#ffffff' : '#64748b'}
              />
            }
            delay={150}
          />
          <SettingItem
            icon={Volume2}
            title="Sound Effects"
            description="Audio feedback for exercises"
            showArrow={false}
            rightElement={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={soundEnabled ? '#ffffff' : '#64748b'}
              />
            }
            delay={200}
          />
        </View>

        {/* Subscription Management */}
        <Text className="mb-3 text-lg font-semibold text-white">Subscription</Text>
        <View className="mb-6 gap-3">
          <SettingItem
            icon={CreditCard}
            title="Billing & Payment"
            description="Manage payment methods"
            onPress={handleManageSubscription}
            delay={250}
          />
          <SettingItem
            icon={Calendar}
            title="Subscription History"
            description="View past payments"
            onPress={() => {
              Alert.alert('Subscription History', 'View your payment history here.');
            }}
            delay={300}
          />
        </View>

        {/* Account */}
        <Text className="mb-3 text-lg font-semibold text-white">Account</Text>
        <View className="mb-6 gap-3">
          <SettingItem
            icon={Lock}
            title="Privacy & Security"
            description="Manage your data"
            onPress={() => {
              Alert.alert('Privacy & Security', 'Privacy settings coming soon.');
            }}
            delay={350}
          />
        </View>
      </ScrollView>
    </View>
  );
}

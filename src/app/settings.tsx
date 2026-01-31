/**
 * SETTINGS SCREEN
 *
 * App preferences, subscription management, and account settings
 */

import React, { useState, useEffect } from 'react';
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
  BellOff,
  Moon,
  Volume2,
  Lock,
  Crown,
  ChevronRight,
  CreditCard,
  Calendar,
  Dumbbell,
  Timer,
  Utensils,
  Trophy,
  Clock,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  useSubscriptionStore,
  useSubscription,
  useSubscriptionStatus,
  useDaysRemaining,
  formatPrice,
} from '@/lib/state/subscription-store';
import {
  pushNotifications,
  NotificationPreferences,
} from '@/lib/notifications/push';
import { notificationScheduler } from '@/lib/notifications/scheduler';
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

  // Notification preferences state
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    enabled: true,
    fastingReminders: true,
    workoutReminders: true,
    mealReminders: true,
    milestoneAlerts: true,
    adminAnnouncements: true,
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
  });
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showNotificationDetails, setShowNotificationDetails] = useState(false);

  // Load notification preferences on mount
  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    const prefs = await pushNotifications.getNotificationPreferences();
    setNotificationPrefs(prefs);
  };

  const updateNotificationPref = async (key: keyof NotificationPreferences, value: boolean) => {
    const newPrefs = { ...notificationPrefs, [key]: value };
    setNotificationPrefs(newPrefs);
    await pushNotifications.saveNotificationPreferences({ [key]: value });

    // If enabling main notifications, request permissions
    if (key === 'enabled' && value) {
      const hasPermission = await pushNotifications.requestPushPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Notifications Disabled',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
        setNotificationPrefs({ ...notificationPrefs, enabled: false });
        return;
      }
      // Reschedule all notifications
      await notificationScheduler.rescheduleAllNotifications();
    }

    // If disabling, cancel all scheduled notifications
    if (key === 'enabled' && !value) {
      await notificationScheduler.cancelAllScheduledNotifications();
    }
  };

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
          {/* Main Notification Toggle */}
          <SettingItem
            icon={notificationPrefs.enabled ? Bell : BellOff}
            title="Notifications"
            description={notificationPrefs.enabled ? 'Tap to configure' : 'All notifications disabled'}
            onPress={() => setShowNotificationDetails(!showNotificationDetails)}
            showArrow={false}
            rightElement={
              <Switch
                value={notificationPrefs.enabled}
                onValueChange={(value) => updateNotificationPref('enabled', value)}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={notificationPrefs.enabled ? '#ffffff' : '#64748b'}
              />
            }
            delay={100}
          />

          {/* Notification Details */}
          {showNotificationDetails && notificationPrefs.enabled && (
            <Animated.View entering={FadeInDown.springify()} className="ml-4 gap-3">
              <SettingItem
                icon={Timer}
                title="Fasting Reminders"
                description="Start and end of fasting windows"
                showArrow={false}
                rightElement={
                  <Switch
                    value={notificationPrefs.fastingReminders}
                    onValueChange={(value) => updateNotificationPref('fastingReminders', value)}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor={notificationPrefs.fastingReminders ? '#ffffff' : '#64748b'}
                  />
                }
                delay={110}
              />
              <SettingItem
                icon={Dumbbell}
                title="Workout Reminders"
                description="Daily workout notifications"
                showArrow={false}
                rightElement={
                  <Switch
                    value={notificationPrefs.workoutReminders}
                    onValueChange={(value) => updateNotificationPref('workoutReminders', value)}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor={notificationPrefs.workoutReminders ? '#ffffff' : '#64748b'}
                  />
                }
                delay={120}
              />
              <SettingItem
                icon={Utensils}
                title="Meal Reminders"
                description="Meal time notifications"
                showArrow={false}
                rightElement={
                  <Switch
                    value={notificationPrefs.mealReminders}
                    onValueChange={(value) => updateNotificationPref('mealReminders', value)}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor={notificationPrefs.mealReminders ? '#ffffff' : '#64748b'}
                  />
                }
                delay={130}
              />
              <SettingItem
                icon={Trophy}
                title="Milestone Alerts"
                description="Achievements and streak updates"
                showArrow={false}
                rightElement={
                  <Switch
                    value={notificationPrefs.milestoneAlerts}
                    onValueChange={(value) => updateNotificationPref('milestoneAlerts', value)}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor={notificationPrefs.milestoneAlerts ? '#ffffff' : '#64748b'}
                  />
                }
                delay={140}
              />
              <SettingItem
                icon={Clock}
                title="Quiet Hours"
                description={notificationPrefs.quietHoursEnabled ? `${notificationPrefs.quietHoursStart} - ${notificationPrefs.quietHoursEnd}` : 'Disabled'}
                showArrow={false}
                rightElement={
                  <Switch
                    value={notificationPrefs.quietHoursEnabled}
                    onValueChange={(value) => updateNotificationPref('quietHoursEnabled', value)}
                    trackColor={{ false: '#334155', true: '#10b981' }}
                    thumbColor={notificationPrefs.quietHoursEnabled ? '#ffffff' : '#64748b'}
                  />
                }
                delay={150}
              />
            </Animated.View>
          )}
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

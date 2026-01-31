/**
 * PUSH NOTIFICATION SERVICE
 * 
 * Handles push notifications using Expo Notifications.
 * Supports local and remote notifications with permission handling.
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ==================== TYPES ====================

export type NotificationType =
  | 'fasting_start'
  | 'fasting_end'
  | 'workout_reminder'
  | 'meal_reminder'
  | 'streak_milestone'
  | 'milestone_achievement'
  | 'subscription_expiring'
  | 'admin_announcement';

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  categoryId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  fastingReminders: boolean;
  workoutReminders: boolean;
  mealReminders: boolean;
  milestoneAlerts: boolean;
  adminAnnouncements: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:mm
  quietHoursEnd: string; // HH:mm
}

export interface ScheduledNotification {
  id: string;
  type: NotificationType;
  scheduledFor: Date;
}

// ==================== CONSTANTS ====================

const PREFERENCES_KEY = 'notification_preferences';
const PUSH_TOKEN_KEY = 'push_token';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  fastingReminders: true,
  workoutReminders: true,
  mealReminders: true,
  milestoneAlerts: true,
  adminAnnouncements: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ==================== PERMISSION HANDLING ====================

/**
 * Check if device can receive push notifications
 */
export async function canReceivePushNotifications(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Push] Not a physical device');
    return false;
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/**
 * Request push notification permissions
 */
export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('[Push] Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  if (existingStatus === 'granted') {
    return true;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/**
 * Get the Expo push token for this device
 */
export async function getPushToken(): Promise<string | null> {
  try {
    // Check for cached token
    const cached = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (cached) return cached;

    // Check permissions
    const hasPermission = await requestPushPermissions();
    if (!hasPermission) {
      console.log('[Push] Permission not granted');
      return null;
    }

    // Get project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('[Push] No project ID found in app config');
    }

    // Get token
    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // Cache token
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);

    // Set up Android channel
    if (Platform.OS === 'android') {
      await setupAndroidChannel();
    }

    return token.data;
  } catch (error) {
    console.error('[Push] Error getting push token:', error);
    return null;
  }
}

/**
 * Set up Android notification channel
 */
async function setupAndroidChannel(): Promise<void> {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#10b981',
  });

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    description: 'Fasting and workout reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#10b981',
  });

  await Notifications.setNotificationChannelAsync('achievements', {
    name: 'Achievements',
    description: 'Milestone and streak notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#eab308',
  });
}

// ==================== PREFERENCES ====================

/**
 * Get notification preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
    }
    return DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

/**
 * Save notification preferences
 */
export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<void> {
  const current = await getNotificationPreferences();
  const updated = { ...current, ...prefs };
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
}

/**
 * Check if notifications are allowed based on preferences and quiet hours
 */
export async function shouldSendNotification(type: NotificationType): Promise<boolean> {
  const prefs = await getNotificationPreferences();

  if (!prefs.enabled) return false;

  // Check quiet hours
  if (prefs.quietHoursEnabled) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = prefs.quietHoursStart.split(':').map(Number);
    const [endH, endM] = prefs.quietHoursEnd.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight quiet hours
    if (startMinutes > endMinutes) {
      if (currentMinutes >= startMinutes || currentMinutes < endMinutes) {
        return false;
      }
    } else {
      if (currentMinutes >= startMinutes && currentMinutes < endMinutes) {
        return false;
      }
    }
  }

  // Check type-specific preferences
  switch (type) {
    case 'fasting_start':
    case 'fasting_end':
      return prefs.fastingReminders;
    case 'workout_reminder':
      return prefs.workoutReminders;
    case 'meal_reminder':
      return prefs.mealReminders;
    case 'streak_milestone':
    case 'milestone_achievement':
      return prefs.milestoneAlerts;
    case 'admin_announcement':
      return prefs.adminAnnouncements;
    default:
      return true;
  }
}

// ==================== SEND NOTIFICATIONS ====================

/**
 * Send a local notification immediately
 */
export async function sendLocalNotification(
  payload: NotificationPayload
): Promise<string | null> {
  const canSend = await shouldSendNotification(payload.type);
  if (!canSend) {
    console.log('[Push] Notification blocked by preferences:', payload.type);
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: { type: payload.type, ...payload.data },
        categoryIdentifier: payload.categoryId,
        sound: true,
      },
      trigger: null, // Immediate
    });

    return id;
  } catch (error) {
    console.error('[Push] Error sending notification:', error);
    return null;
  }
}

/**
 * Schedule a notification for later
 */
export async function scheduleNotification(
  payload: NotificationPayload,
  trigger: Notifications.NotificationTriggerInput
): Promise<string | null> {
  const canSend = await shouldSendNotification(payload.type);
  if (!canSend) {
    console.log('[Push] Notification blocked by preferences:', payload.type);
    return null;
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: payload.title,
        body: payload.body,
        data: { type: payload.type, ...payload.data },
        categoryIdentifier: payload.categoryId,
        sound: true,
      },
      trigger,
    });

    return id;
  } catch (error) {
    console.error('[Push] Error scheduling notification:', error);
    return null;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get all scheduled notifications
 */
export async function getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}

// ==================== NOTIFICATION TEMPLATES ====================

export const NotificationTemplates = {
  fastingStart: (eatingWindowEnd: string): NotificationPayload => ({
    type: 'fasting_start',
    title: '🚫 Fasting Started',
    body: `Your eating window has ended. Stay strong! Next meal at ${eatingWindowEnd}.`,
  }),

  fastingEnd: (): NotificationPayload => ({
    type: 'fasting_end',
    title: '🍽️ Time to Eat!',
    body: 'Your fasting window is complete. Enjoy your meal!',
  }),

  workoutReminder: (workoutName?: string): NotificationPayload => ({
    type: 'workout_reminder',
    title: '💪 Workout Time!',
    body: workoutName
      ? `Ready for ${workoutName}? Let's crush it!`
      : "Don't forget your workout today. Let's go!",
  }),

  mealReminder: (mealType: string): NotificationPayload => ({
    type: 'meal_reminder',
    title: '🥗 Meal Reminder',
    body: `Time for ${mealType}! Check your meal plan.`,
  }),

  streakMilestone: (days: number): NotificationPayload => ({
    type: 'streak_milestone',
    title: '🔥 Streak Milestone!',
    body: `Amazing! You've maintained a ${days}-day streak. Keep it up!`,
  }),

  milestoneAchievement: (title: string, description: string): NotificationPayload => ({
    type: 'milestone_achievement',
    title: `🏆 ${title}`,
    body: description,
  }),

  subscriptionExpiring: (daysLeft: number): NotificationPayload => ({
    type: 'subscription_expiring',
    title: '⚠️ Subscription Expiring',
    body: `Your subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew to keep your progress!`,
  }),

  adminAnnouncement: (title: string, message: string): NotificationPayload => ({
    type: 'admin_announcement',
    title,
    body: message,
  }),
};

// ==================== LISTENERS ====================

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// ==================== BADGE ====================

/**
 * Set app badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear app badge
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// ==================== EXPORTS ====================

export const pushNotifications = {
  // Permissions
  canReceivePushNotifications,
  requestPushPermissions,
  getPushToken,

  // Preferences
  getNotificationPreferences,
  saveNotificationPreferences,
  shouldSendNotification,

  // Send
  sendLocalNotification,
  scheduleNotification,
  cancelNotification,
  cancelAllNotifications,
  getScheduledNotifications,

  // Templates
  templates: NotificationTemplates,

  // Listeners
  addNotificationReceivedListener,
  addNotificationResponseListener,

  // Badge
  setBadgeCount,
  clearBadge,
};

export default pushNotifications;

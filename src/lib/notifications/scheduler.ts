/**
 * NOTIFICATION SCHEDULER SERVICE
 * 
 * Manages scheduled notifications for fasting windows,
 * workouts, meals, and streak milestones.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  pushNotifications, 
  NotificationTemplates,
  NotificationType 
} from './push';

// ==================== TYPES ====================

export interface FastingSchedule {
  eatingWindowStart: string; // HH:mm
  eatingWindowEnd: string; // HH:mm
  fastingDays: number[]; // 0-6, Sunday = 0
}

export interface WorkoutSchedule {
  preferredTime: string; // HH:mm
  workoutDays: number[]; // 0-6, Sunday = 0
}

export interface MealSchedule {
  breakfast?: string; // HH:mm
  lunch?: string;
  dinner?: string;
  snack?: string;
}

export interface ScheduledNotificationRecord {
  id: string;
  type: NotificationType;
  scheduledAt: number; // timestamp
  metadata?: Record<string, any>;
}

// ==================== CONSTANTS ====================

const SCHEDULED_IDS_KEY = 'scheduled_notification_ids';
const FASTING_SCHEDULE_KEY = 'fasting_schedule';
const WORKOUT_SCHEDULE_KEY = 'workout_schedule';
const MEAL_SCHEDULE_KEY = 'meal_schedule';

const DEFAULT_FASTING_SCHEDULE: FastingSchedule = {
  eatingWindowStart: '12:00',
  eatingWindowEnd: '20:00',
  fastingDays: [0, 1, 2, 3, 4, 5, 6], // Every day
};

const DEFAULT_WORKOUT_SCHEDULE: WorkoutSchedule = {
  preferredTime: '07:00',
  workoutDays: [1, 2, 3, 4, 5], // Mon-Fri
};

// ==================== SCHEDULE PERSISTENCE ====================

async function getScheduledIds(): Promise<ScheduledNotificationRecord[]> {
  try {
    const stored = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

async function saveScheduledIds(records: ScheduledNotificationRecord[]): Promise<void> {
  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(records));
}

async function addScheduledId(record: ScheduledNotificationRecord): Promise<void> {
  const records = await getScheduledIds();
  records.push(record);
  await saveScheduledIds(records);
}

async function removeScheduledId(id: string): Promise<void> {
  const records = await getScheduledIds();
  const filtered = records.filter(r => r.id !== id);
  await saveScheduledIds(filtered);
}

// ==================== FASTING NOTIFICATIONS ====================

/**
 * Get fasting schedule
 */
export async function getFastingSchedule(): Promise<FastingSchedule> {
  try {
    const stored = await AsyncStorage.getItem(FASTING_SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_FASTING_SCHEDULE;
  } catch {
    return DEFAULT_FASTING_SCHEDULE;
  }
}

/**
 * Save fasting schedule
 */
export async function saveFastingSchedule(schedule: FastingSchedule): Promise<void> {
  await AsyncStorage.setItem(FASTING_SCHEDULE_KEY, JSON.stringify(schedule));
  // Reschedule notifications with new times
  await scheduleFastingNotifications(schedule);
}

/**
 * Schedule fasting window notifications for the next 7 days
 */
export async function scheduleFastingNotifications(
  schedule?: FastingSchedule
): Promise<void> {
  const fastingSchedule = schedule || await getFastingSchedule();
  
  // Cancel existing fasting notifications
  await cancelNotificationsByType('fasting_start');
  await cancelNotificationsByType('fasting_end');

  const now = new Date();
  const [startH, startM] = fastingSchedule.eatingWindowStart.split(':').map(Number);
  const [endH, endM] = fastingSchedule.eatingWindowEnd.split(':').map(Number);

  // Schedule for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();

    // Check if this day is in the fasting schedule
    if (!fastingSchedule.fastingDays.includes(dayOfWeek)) continue;

    // Schedule eating window start (end of fasting)
    const startTime = new Date(date);
    startTime.setHours(startH, startM, 0, 0);

    if (startTime > now) {
      const startId = await pushNotifications.scheduleNotification(
        NotificationTemplates.fastingEnd(),
        { date: startTime }
      );

      if (startId) {
        await addScheduledId({
          id: startId,
          type: 'fasting_end',
          scheduledAt: startTime.getTime(),
        });
      }
    }

    // Schedule eating window end (start of fasting)
    const endTime = new Date(date);
    endTime.setHours(endH, endM, 0, 0);

    if (endTime > now) {
      // Format next eating time
      const nextEatTime = new Date(endTime);
      
      // Calculate hours until next eating window
      let hoursUntil: number;
      if (startH > endH) {
        // Eating window starts later same day
        hoursUntil = startH - endH;
      } else {
        // Eating window starts next day
        hoursUntil = 24 - endH + startH;
      }
      nextEatTime.setHours(nextEatTime.getHours() + hoursUntil);

      const nextEatFormatted = `${startH.toString().padStart(2, '0')}:${startM.toString().padStart(2, '0')}`;

      const endId = await pushNotifications.scheduleNotification(
        NotificationTemplates.fastingStart(nextEatFormatted),
        { date: endTime }
      );

      if (endId) {
        await addScheduledId({
          id: endId,
          type: 'fasting_start',
          scheduledAt: endTime.getTime(),
        });
      }
    }
  }

  console.log('[Scheduler] Fasting notifications scheduled');
}

// ==================== WORKOUT NOTIFICATIONS ====================

/**
 * Get workout schedule
 */
export async function getWorkoutSchedule(): Promise<WorkoutSchedule> {
  try {
    const stored = await AsyncStorage.getItem(WORKOUT_SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_WORKOUT_SCHEDULE;
  } catch {
    return DEFAULT_WORKOUT_SCHEDULE;
  }
}

/**
 * Save workout schedule
 */
export async function saveWorkoutSchedule(schedule: WorkoutSchedule): Promise<void> {
  await AsyncStorage.setItem(WORKOUT_SCHEDULE_KEY, JSON.stringify(schedule));
  await scheduleWorkoutNotifications(schedule);
}

/**
 * Schedule workout reminder notifications
 */
export async function scheduleWorkoutNotifications(
  schedule?: WorkoutSchedule
): Promise<void> {
  const workoutSchedule = schedule || await getWorkoutSchedule();
  
  // Cancel existing workout notifications
  await cancelNotificationsByType('workout_reminder');

  const now = new Date();
  const [prefH, prefM] = workoutSchedule.preferredTime.split(':').map(Number);

  // Schedule for next 7 days
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const dayOfWeek = date.getDay();

    // Check if this day is a workout day
    if (!workoutSchedule.workoutDays.includes(dayOfWeek)) continue;

    const reminderTime = new Date(date);
    reminderTime.setHours(prefH, prefM, 0, 0);

    if (reminderTime > now) {
      const id = await pushNotifications.scheduleNotification(
        NotificationTemplates.workoutReminder(),
        { date: reminderTime }
      );

      if (id) {
        await addScheduledId({
          id,
          type: 'workout_reminder',
          scheduledAt: reminderTime.getTime(),
        });
      }
    }
  }

  console.log('[Scheduler] Workout notifications scheduled');
}

/**
 * Schedule a specific workout notification
 */
export async function scheduleWorkoutReminder(
  workoutName: string,
  time: Date
): Promise<string | null> {
  if (time <= new Date()) return null;

  const id = await pushNotifications.scheduleNotification(
    NotificationTemplates.workoutReminder(workoutName),
    { date: time }
  );

  if (id) {
    await addScheduledId({
      id,
      type: 'workout_reminder',
      scheduledAt: time.getTime(),
      metadata: { workoutName },
    });
  }

  return id;
}

// ==================== MEAL NOTIFICATIONS ====================

/**
 * Get meal schedule
 */
export async function getMealSchedule(): Promise<MealSchedule> {
  try {
    const stored = await AsyncStorage.getItem(MEAL_SCHEDULE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * Save meal schedule
 */
export async function saveMealSchedule(schedule: MealSchedule): Promise<void> {
  await AsyncStorage.setItem(MEAL_SCHEDULE_KEY, JSON.stringify(schedule));
  await scheduleMealNotifications(schedule);
}

/**
 * Schedule meal reminder notifications
 */
export async function scheduleMealNotifications(
  schedule?: MealSchedule
): Promise<void> {
  const mealSchedule = schedule || await getMealSchedule();
  
  // Cancel existing meal notifications
  await cancelNotificationsByType('meal_reminder');

  const now = new Date();
  const meals: { type: string; time: string | undefined }[] = [
    { type: 'Breakfast', time: mealSchedule.breakfast },
    { type: 'Lunch', time: mealSchedule.lunch },
    { type: 'Dinner', time: mealSchedule.dinner },
    { type: 'Snack', time: mealSchedule.snack },
  ];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    for (const meal of meals) {
      if (!meal.time) continue;

      const [h, m] = meal.time.split(':').map(Number);
      const mealTime = new Date(now);
      mealTime.setDate(mealTime.getDate() + dayOffset);
      mealTime.setHours(h, m, 0, 0);

      if (mealTime > now) {
        const id = await pushNotifications.scheduleNotification(
          NotificationTemplates.mealReminder(meal.type),
          { date: mealTime }
        );

        if (id) {
          await addScheduledId({
            id,
            type: 'meal_reminder',
            scheduledAt: mealTime.getTime(),
            metadata: { mealType: meal.type },
          });
        }
      }
    }
  }

  console.log('[Scheduler] Meal notifications scheduled');
}

// ==================== STREAK NOTIFICATIONS ====================

/**
 * Schedule streak milestone notification
 */
export async function scheduleStreakMilestone(
  currentStreak: number,
  nextMilestone: number
): Promise<string | null> {
  // Calculate days until milestone
  const daysUntil = nextMilestone - currentStreak;
  if (daysUntil <= 0) return null;

  // Schedule for the milestone day at noon
  const milestoneDate = new Date();
  milestoneDate.setDate(milestoneDate.getDate() + daysUntil);
  milestoneDate.setHours(12, 0, 0, 0);

  const id = await pushNotifications.scheduleNotification(
    NotificationTemplates.streakMilestone(nextMilestone),
    { date: milestoneDate }
  );

  if (id) {
    await addScheduledId({
      id,
      type: 'streak_milestone',
      scheduledAt: milestoneDate.getTime(),
      metadata: { streakDays: nextMilestone },
    });
  }

  return id;
}

/**
 * Notify about streak milestone immediately (when reached)
 */
export async function notifyStreakMilestoneReached(days: number): Promise<void> {
  await pushNotifications.sendLocalNotification(
    NotificationTemplates.streakMilestone(days)
  );
}

// ==================== MILESTONE NOTIFICATIONS ====================

/**
 * Notify about achievement milestone
 */
export async function notifyMilestoneAchievement(
  title: string,
  description: string
): Promise<void> {
  await pushNotifications.sendLocalNotification(
    NotificationTemplates.milestoneAchievement(title, description)
  );
}

// ==================== SUBSCRIPTION NOTIFICATIONS ====================

/**
 * Schedule subscription expiration warning
 */
export async function scheduleSubscriptionExpirationWarning(
  expirationDate: Date
): Promise<void> {
  // Cancel existing subscription notifications
  await cancelNotificationsByType('subscription_expiring');

  const now = new Date();
  
  // Schedule warnings at 7 days, 3 days, and 1 day before expiration
  const warningDays = [7, 3, 1];

  for (const daysBeforeExpiration of warningDays) {
    const warningDate = new Date(expirationDate);
    warningDate.setDate(warningDate.getDate() - daysBeforeExpiration);
    warningDate.setHours(10, 0, 0, 0); // 10 AM

    if (warningDate > now) {
      const id = await pushNotifications.scheduleNotification(
        NotificationTemplates.subscriptionExpiring(daysBeforeExpiration),
        { date: warningDate }
      );

      if (id) {
        await addScheduledId({
          id,
          type: 'subscription_expiring',
          scheduledAt: warningDate.getTime(),
          metadata: { daysLeft: daysBeforeExpiration },
        });
      }
    }
  }
}

// ==================== ADMIN NOTIFICATIONS ====================

/**
 * Send admin announcement to all users (via remote push)
 * Note: This should typically be triggered from backend
 */
export async function notifyAdminAnnouncement(
  title: string,
  message: string
): Promise<void> {
  await pushNotifications.sendLocalNotification(
    NotificationTemplates.adminAnnouncement(title, message)
  );
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Cancel all notifications of a specific type
 */
export async function cancelNotificationsByType(
  type: NotificationType
): Promise<void> {
  const records = await getScheduledIds();
  const toCancel = records.filter(r => r.type === type);

  for (const record of toCancel) {
    await pushNotifications.cancelNotification(record.id);
    await removeScheduledId(record.id);
  }
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await pushNotifications.cancelAllNotifications();
  await saveScheduledIds([]);
}

/**
 * Reschedule all notifications (e.g., after app update or time change)
 */
export async function rescheduleAllNotifications(): Promise<void> {
  // Clear existing
  await cancelAllScheduledNotifications();

  // Reschedule all types
  await scheduleFastingNotifications();
  await scheduleWorkoutNotifications();
  await scheduleMealNotifications();

  console.log('[Scheduler] All notifications rescheduled');
}

/**
 * Get all currently scheduled notifications
 */
export async function getAllScheduledNotifications(): Promise<ScheduledNotificationRecord[]> {
  const records = await getScheduledIds();
  const now = Date.now();

  // Filter out past notifications
  const active = records.filter(r => r.scheduledAt > now);

  // Update storage if some were filtered
  if (active.length !== records.length) {
    await saveScheduledIds(active);
  }

  return active;
}

/**
 * Clean up expired notifications from storage
 */
export async function cleanupExpiredNotifications(): Promise<void> {
  await getAllScheduledNotifications(); // This filters out expired ones
}

// ==================== INITIALIZATION ====================

/**
 * Initialize notification scheduler
 * Call this on app startup
 */
export async function initializeScheduler(): Promise<void> {
  // Clean up expired notifications
  await cleanupExpiredNotifications();

  // Reschedule if we have fewer than expected notifications
  const scheduled = await getAllScheduledNotifications();
  if (scheduled.length < 7) {
    await rescheduleAllNotifications();
  }

  console.log('[Scheduler] Initialized with', scheduled.length, 'scheduled notifications');
}

// ==================== EXPORTS ====================

export const notificationScheduler = {
  // Fasting
  getFastingSchedule,
  saveFastingSchedule,
  scheduleFastingNotifications,

  // Workout
  getWorkoutSchedule,
  saveWorkoutSchedule,
  scheduleWorkoutNotifications,
  scheduleWorkoutReminder,

  // Meals
  getMealSchedule,
  saveMealSchedule,
  scheduleMealNotifications,

  // Streaks
  scheduleStreakMilestone,
  notifyStreakMilestoneReached,

  // Milestones
  notifyMilestoneAchievement,

  // Subscription
  scheduleSubscriptionExpirationWarning,

  // Admin
  notifyAdminAnnouncement,

  // Utility
  cancelNotificationsByType,
  cancelAllScheduledNotifications,
  rescheduleAllNotifications,
  getAllScheduledNotifications,
  cleanupExpiredNotifications,

  // Init
  initialize: initializeScheduler,
};

export default notificationScheduler;

/**
 * AMPLITUDE ANALYTICS SERVICE
 * 
 * Tracks user behavior, screen views, and key events.
 * Provides insights for improving the app experience.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';

// ==================== TYPES ====================

export type EventCategory =
  | 'navigation'
  | 'onboarding'
  | 'workout'
  | 'meal'
  | 'fasting'
  | 'subscription'
  | 'engagement'
  | 'error';

export interface AnalyticsEvent {
  name: string;
  category: EventCategory;
  properties?: Record<string, any>;
  timestamp: number;
}

export interface UserProperties {
  userId?: string;
  email?: string;
  subscriptionPlan?: string;
  subscriptionStatus?: string;
  fitnessLevel?: string;
  goal?: string;
  gender?: string;
  platform: string;
  appVersion: string;
  deviceModel?: string;
}

interface AmplitudeConfig {
  apiKey: string;
  serverUrl: string;
  flushIntervalMs: number;
  maxBatchSize: number;
}

// ==================== CONFIGURATION ====================

const AMPLITUDE_API_KEY = process.env.EXPO_PUBLIC_AMPLITUDE_API_KEY || '';
const EVENT_QUEUE_KEY = 'amplitude_event_queue';
const USER_PROPS_KEY = 'amplitude_user_props';
const DEVICE_ID_KEY = 'amplitude_device_id';

const config: AmplitudeConfig = {
  apiKey: AMPLITUDE_API_KEY,
  serverUrl: 'https://api2.amplitude.com/2/httpapi',
  flushIntervalMs: 30000, // 30 seconds
  maxBatchSize: 10,
};

// State
let eventQueue: AnalyticsEvent[] = [];
let userProperties: UserProperties = {
  platform: Platform.OS,
  appVersion: Constants.expoConfig?.version || '1.0.0',
  deviceModel: Device.modelName || undefined,
};
let deviceId: string | null = null;
let flushInterval: ReturnType<typeof setInterval> | null = null;
let isInitialized = false;

// ==================== INITIALIZATION ====================

/**
 * Initialize analytics service
 */
export async function initializeAnalytics(): Promise<void> {
  if (isInitialized) return;

  try {
    // Load or generate device ID
    deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      deviceId = generateDeviceId();
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }

    // Load cached user properties
    const cachedProps = await AsyncStorage.getItem(USER_PROPS_KEY);
    if (cachedProps) {
      userProperties = { ...userProperties, ...JSON.parse(cachedProps) };
    }

    // Load cached events
    const cachedEvents = await AsyncStorage.getItem(EVENT_QUEUE_KEY);
    if (cachedEvents) {
      eventQueue = JSON.parse(cachedEvents);
    }

    // Start flush interval
    startFlushInterval();

    isInitialized = true;
    console.log('[Analytics] Initialized');

    // Flush any cached events
    if (eventQueue.length > 0) {
      await flushEvents();
    }
  } catch (error) {
    console.error('[Analytics] Init error:', error);
  }
}

/**
 * Generate a unique device ID
 */
function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Start automatic event flushing
 */
function startFlushInterval(): void {
  if (flushInterval) return;
  flushInterval = setInterval(flushEvents, config.flushIntervalMs);
}

/**
 * Stop automatic event flushing
 */
function stopFlushInterval(): void {
  if (flushInterval) {
    clearInterval(flushInterval);
    flushInterval = null;
  }
}

// ==================== USER IDENTIFICATION ====================

/**
 * Set user ID after login/signup
 */
export async function setUserId(userId: string): Promise<void> {
  userProperties.userId = userId;
  await saveUserProperties();
  console.log('[Analytics] User ID set:', userId);
}

/**
 * Set user properties for segmentation
 */
export async function setUserProperties(props: Partial<UserProperties>): Promise<void> {
  userProperties = { ...userProperties, ...props };
  await saveUserProperties();
  console.log('[Analytics] User properties updated');
}

/**
 * Clear user data on logout
 */
export async function clearUserData(): Promise<void> {
  userProperties = {
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version || '1.0.0',
    deviceModel: Device.modelName || undefined,
  };
  await saveUserProperties();
  console.log('[Analytics] User data cleared');
}

/**
 * Save user properties to storage
 */
async function saveUserProperties(): Promise<void> {
  await AsyncStorage.setItem(USER_PROPS_KEY, JSON.stringify(userProperties));
}

// ==================== EVENT TRACKING ====================

/**
 * Track a custom event
 */
export async function trackEvent(
  name: string,
  category: EventCategory,
  properties?: Record<string, any>
): Promise<void> {
  if (!AMPLITUDE_API_KEY) {
    console.log('[Analytics] No API key - skipping event:', name);
    return;
  }

  const event: AnalyticsEvent = {
    name,
    category,
    properties,
    timestamp: Date.now(),
  };

  eventQueue.push(event);
  await saveEventQueue();

  console.log('[Analytics] Event tracked:', name, properties);

  // Auto-flush if queue is full
  if (eventQueue.length >= config.maxBatchSize) {
    await flushEvents();
  }
}

/**
 * Track screen view
 */
export async function trackScreenView(screenName: string, properties?: Record<string, any>): Promise<void> {
  await trackEvent('Screen Viewed', 'navigation', {
    screen_name: screenName,
    ...properties,
  });
}

/**
 * Save event queue to storage
 */
async function saveEventQueue(): Promise<void> {
  await AsyncStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(eventQueue));
}

// ==================== EVENT FLUSHING ====================

/**
 * Flush events to Amplitude
 */
export async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0 || !AMPLITUDE_API_KEY) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];
  await saveEventQueue();

  try {
    const amplitudeEvents = eventsToSend.map((event) => ({
      event_type: event.name,
      device_id: deviceId,
      user_id: userProperties.userId,
      time: event.timestamp,
      event_properties: {
        ...event.properties,
        category: event.category,
      },
      user_properties: userProperties,
      platform: Platform.OS,
      os_name: Platform.OS,
      os_version: Platform.Version?.toString(),
      device_model: Device.modelName,
      app_version: Constants.expoConfig?.version,
    }));

    const response = await fetch(config.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': '*/*',
      },
      body: JSON.stringify({
        api_key: config.apiKey,
        events: amplitudeEvents,
      }),
    });

    if (!response.ok) {
      // Re-queue failed events
      eventQueue = [...eventsToSend, ...eventQueue];
      await saveEventQueue();
      console.error('[Analytics] Flush failed:', response.status);
    } else {
      console.log('[Analytics] Flushed', eventsToSend.length, 'events');
    }
  } catch (error) {
    // Re-queue failed events
    eventQueue = [...eventsToSend, ...eventQueue];
    await saveEventQueue();
    console.error('[Analytics] Flush error:', error);
  }
}

// ==================== PREDEFINED EVENTS ====================

/**
 * Track app open
 */
export async function trackAppOpen(): Promise<void> {
  await trackEvent('App Opened', 'engagement', {
    first_session: !userProperties.userId,
  });
}

/**
 * Track user signup
 */
export async function trackSignup(method: 'email' | 'google' | 'apple'): Promise<void> {
  await trackEvent('User Signed Up', 'onboarding', { method });
}

/**
 * Track user login
 */
export async function trackLogin(method: 'email' | 'google' | 'apple'): Promise<void> {
  await trackEvent('User Logged In', 'onboarding', { method });
}

/**
 * Track onboarding completion
 */
export async function trackOnboardingComplete(data: {
  fitnessLevel: string;
  goal: string;
  gender: string;
}): Promise<void> {
  await trackEvent('Onboarding Completed', 'onboarding', data);
  await setUserProperties(data);
}

/**
 * Track workout started
 */
export async function trackWorkoutStarted(data: {
  workoutId: string;
  workoutName: string;
  difficulty: string;
  estimatedDuration: number;
}): Promise<void> {
  await trackEvent('Workout Started', 'workout', data);
}

/**
 * Track workout completed
 */
export async function trackWorkoutCompleted(data: {
  workoutId: string;
  workoutName: string;
  duration: number;
  exercisesCompleted: number;
  totalExercises: number;
}): Promise<void> {
  await trackEvent('Workout Completed', 'workout', {
    ...data,
    completion_rate: Math.round((data.exercisesCompleted / data.totalExercises) * 100),
  });
}

/**
 * Track meal logged
 */
export async function trackMealLogged(data: {
  mealType: string;
  calories: number;
  protein: number;
}): Promise<void> {
  await trackEvent('Meal Logged', 'meal', data);
}

/**
 * Track fasting started
 */
export async function trackFastingStarted(schedule: string): Promise<void> {
  await trackEvent('Fasting Started', 'fasting', { schedule });
}

/**
 * Track fasting completed
 */
export async function trackFastingCompleted(data: {
  schedule: string;
  duration: number;
  wasSuccessful: boolean;
}): Promise<void> {
  await trackEvent('Fasting Completed', 'fasting', data);
}

/**
 * Track subscription viewed
 */
export async function trackPaywallViewed(source?: string): Promise<void> {
  await trackEvent('Paywall Viewed', 'subscription', { source });
}

/**
 * Track subscription started
 */
export async function trackSubscriptionStarted(data: {
  planId: string;
  planName: string;
  price: number;
  currency: string;
}): Promise<void> {
  await trackEvent('Subscription Started', 'subscription', data);
  await setUserProperties({
    subscriptionPlan: data.planId,
    subscriptionStatus: 'active',
  });
}

/**
 * Track subscription cancelled
 */
export async function trackSubscriptionCancelled(planId: string): Promise<void> {
  await trackEvent('Subscription Cancelled', 'subscription', { planId });
  await setUserProperties({
    subscriptionStatus: 'cancelled',
  });
}

/**
 * Track milestone achieved
 */
export async function trackMilestoneAchieved(data: {
  milestoneId: string;
  milestoneName: string;
  category: string;
}): Promise<void> {
  await trackEvent('Milestone Achieved', 'engagement', data);
}

/**
 * Track streak milestone
 */
export async function trackStreakMilestone(days: number): Promise<void> {
  await trackEvent('Streak Milestone', 'engagement', { streak_days: days });
}

/**
 * Track error
 */
export async function trackError(data: {
  errorMessage: string;
  errorCode?: string;
  context?: string;
}): Promise<void> {
  await trackEvent('Error Occurred', 'error', data);
}

// ==================== CLEANUP ====================

/**
 * Shutdown analytics (call on app close)
 */
export async function shutdownAnalytics(): Promise<void> {
  stopFlushInterval();
  await flushEvents();
  isInitialized = false;
  console.log('[Analytics] Shutdown complete');
}

// ==================== EXPORTS ====================

export const analytics = {
  // Init
  initialize: initializeAnalytics,
  shutdown: shutdownAnalytics,

  // User
  setUserId,
  setUserProperties,
  clearUserData,

  // Tracking
  trackEvent,
  trackScreenView,
  flushEvents,

  // Predefined events
  trackAppOpen,
  trackSignup,
  trackLogin,
  trackOnboardingComplete,
  trackWorkoutStarted,
  trackWorkoutCompleted,
  trackMealLogged,
  trackFastingStarted,
  trackFastingCompleted,
  trackPaywallViewed,
  trackSubscriptionStarted,
  trackSubscriptionCancelled,
  trackMilestoneAchieved,
  trackStreakMilestone,
  trackError,
};

export default analytics;

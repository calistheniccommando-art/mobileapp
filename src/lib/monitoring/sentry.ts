/**
 * SENTRY ERROR MONITORING SERVICE
 * 
 * Provides crash reporting and error tracking.
 * Captures exceptions, breadcrumbs, and user context.
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ==================== TYPES ====================

export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

export interface Breadcrumb {
  type: 'navigation' | 'http' | 'user' | 'system' | 'error';
  category: string;
  message: string;
  level?: SeverityLevel;
  data?: Record<string, any>;
  timestamp: number;
}

export interface ErrorContext {
  userId?: string;
  email?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

export interface SentryEvent {
  event_id: string;
  timestamp: number;
  level: SeverityLevel;
  platform: string;
  exception?: {
    values: Array<{
      type: string;
      value: string;
      stacktrace?: {
        frames: Array<{
          filename: string;
          function: string;
          lineno?: number;
          colno?: number;
        }>;
      };
    }>;
  };
  message?: string;
  breadcrumbs?: Breadcrumb[];
  contexts?: Record<string, any>;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
  user?: {
    id?: string;
    email?: string;
  };
}

// ==================== CONFIGURATION ====================

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || '';
const MAX_BREADCRUMBS = 50;
const ERROR_QUEUE_KEY = 'sentry_error_queue';

// Parse DSN
function parseDSN(dsn: string): { projectId: string; publicKey: string; host: string } | null {
  try {
    const match = dsn.match(/https?:\/\/([^@]+)@([^/]+)\/(.+)/);
    if (!match) return null;
    return {
      publicKey: match[1],
      host: match[2],
      projectId: match[3],
    };
  } catch {
    return null;
  }
}

const dsnConfig = SENTRY_DSN ? parseDSN(SENTRY_DSN) : null;

// State
let breadcrumbs: Breadcrumb[] = [];
let errorContext: ErrorContext = {};
let isInitialized = false;
let errorQueue: SentryEvent[] = [];

// ==================== INITIALIZATION ====================

/**
 * Initialize Sentry
 */
export async function initializeSentry(): Promise<void> {
  if (isInitialized) return;

  if (!dsnConfig) {
    console.log('[Sentry] No DSN configured - error reporting disabled');
    return;
  }

  // Load cached errors
  try {
    const cached = await AsyncStorage.getItem(ERROR_QUEUE_KEY);
    if (cached) {
      errorQueue = JSON.parse(cached);
      // Try to flush cached errors
      await flushErrors();
    }
  } catch {
    // Ignore cache errors
  }

  isInitialized = true;
  console.log('[Sentry] Initialized');

  // Add init breadcrumb
  addBreadcrumb({
    type: 'system',
    category: 'app',
    message: 'App initialized',
    level: 'info',
  });
}

// ==================== USER CONTEXT ====================

/**
 * Set user context for error reports
 */
export function setUser(userId?: string, email?: string): void {
  errorContext.userId = userId;
  errorContext.email = email;
  console.log('[Sentry] User set:', userId);
}

/**
 * Clear user context
 */
export function clearUser(): void {
  errorContext.userId = undefined;
  errorContext.email = undefined;
  console.log('[Sentry] User cleared');
}

/**
 * Set tags for error reports
 */
export function setTags(tags: Record<string, string>): void {
  errorContext.tags = { ...errorContext.tags, ...tags };
}

/**
 * Set extra context data
 */
export function setExtra(key: string, value: any): void {
  if (!errorContext.extra) errorContext.extra = {};
  errorContext.extra[key] = value;
}

// ==================== BREADCRUMBS ====================

/**
 * Add a breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: Omit<Breadcrumb, 'timestamp'>): void {
  const crumb: Breadcrumb = {
    ...breadcrumb,
    timestamp: Date.now(),
  };

  breadcrumbs.push(crumb);

  // Keep only the last MAX_BREADCRUMBS
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs = breadcrumbs.slice(-MAX_BREADCRUMBS);
  }
}

/**
 * Add navigation breadcrumb
 */
export function addNavigationBreadcrumb(from: string, to: string): void {
  addBreadcrumb({
    type: 'navigation',
    category: 'navigation',
    message: `${from} → ${to}`,
    data: { from, to },
  });
}

/**
 * Add HTTP breadcrumb
 */
export function addHttpBreadcrumb(method: string, url: string, status: number): void {
  addBreadcrumb({
    type: 'http',
    category: 'http',
    message: `${method} ${url}`,
    level: status >= 400 ? 'error' : 'info',
    data: { method, url, status_code: status },
  });
}

/**
 * Add user action breadcrumb
 */
export function addUserBreadcrumb(action: string, data?: Record<string, any>): void {
  addBreadcrumb({
    type: 'user',
    category: 'user',
    message: action,
    data,
  });
}

// ==================== ERROR CAPTURE ====================

/**
 * Generate unique event ID
 */
function generateEventId(): string {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Parse error stack trace
 */
function parseStackTrace(error: Error): Array<{ filename: string; function: string; lineno?: number; colno?: number }> {
  if (!error.stack) return [];

  const frames: Array<{ filename: string; function: string; lineno?: number; colno?: number }> = [];
  const lines = error.stack.split('\n');

  for (const line of lines) {
    // Match various stack trace formats
    const match = line.match(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/) ||
                  line.match(/at\s+(.+):(\d+):(\d+)/) ||
                  line.match(/(.+)@(.+):(\d+):(\d+)/);

    if (match) {
      frames.push({
        function: match[1] || '<anonymous>',
        filename: match[2] || '<unknown>',
        lineno: parseInt(match[3], 10) || undefined,
        colno: parseInt(match[4], 10) || undefined,
      });
    }
  }

  return frames.reverse(); // Sentry expects bottom-up
}

/**
 * Capture an exception
 */
export async function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
    level?: SeverityLevel;
  }
): Promise<string | null> {
  if (!dsnConfig) {
    console.error('[Sentry] Error captured (not sent - no DSN):', error.message);
    return null;
  }

  const eventId = generateEventId();

  const event: SentryEvent = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    level: context?.level || 'error',
    platform: 'javascript',
    exception: {
      values: [
        {
          type: error.name || 'Error',
          value: error.message,
          stacktrace: {
            frames: parseStackTrace(error),
          },
        },
      ],
    },
    breadcrumbs: [...breadcrumbs],
    contexts: {
      device: {
        name: Device.deviceName,
        model: Device.modelName,
        os_name: Platform.OS,
        os_version: Platform.Version?.toString(),
      },
      app: {
        app_version: Constants.expoConfig?.version,
        app_name: Constants.expoConfig?.name,
      },
    },
    tags: {
      ...errorContext.tags,
      ...context?.tags,
      environment: __DEV__ ? 'development' : 'production',
    },
    extra: {
      ...errorContext.extra,
      ...context?.extra,
    },
    user: errorContext.userId
      ? {
          id: errorContext.userId,
          email: errorContext.email,
        }
      : undefined,
  };

  // Queue event
  errorQueue.push(event);
  await saveErrorQueue();

  // Try to send immediately
  await flushErrors();

  console.error('[Sentry] Exception captured:', error.message, 'ID:', eventId);
  return eventId;
}

/**
 * Capture a message
 */
export async function captureMessage(
  message: string,
  level: SeverityLevel = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, any>;
  }
): Promise<string | null> {
  if (!dsnConfig) {
    console.log('[Sentry] Message captured (not sent - no DSN):', message);
    return null;
  }

  const eventId = generateEventId();

  const event: SentryEvent = {
    event_id: eventId,
    timestamp: Date.now() / 1000,
    level,
    platform: 'javascript',
    message,
    breadcrumbs: [...breadcrumbs],
    contexts: {
      device: {
        name: Device.deviceName,
        model: Device.modelName,
        os_name: Platform.OS,
        os_version: Platform.Version?.toString(),
      },
      app: {
        app_version: Constants.expoConfig?.version,
        app_name: Constants.expoConfig?.name,
      },
    },
    tags: {
      ...errorContext.tags,
      ...context?.tags,
      environment: __DEV__ ? 'development' : 'production',
    },
    extra: {
      ...errorContext.extra,
      ...context?.extra,
    },
    user: errorContext.userId
      ? {
          id: errorContext.userId,
          email: errorContext.email,
        }
      : undefined,
  };

  // Queue event
  errorQueue.push(event);
  await saveErrorQueue();

  // Try to send immediately
  await flushErrors();

  console.log('[Sentry] Message captured:', message, 'ID:', eventId);
  return eventId;
}

// ==================== ERROR QUEUE ====================

async function saveErrorQueue(): Promise<void> {
  try {
    await AsyncStorage.setItem(ERROR_QUEUE_KEY, JSON.stringify(errorQueue));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Flush errors to Sentry
 */
export async function flushErrors(): Promise<void> {
  if (!dsnConfig || errorQueue.length === 0) return;

  const eventsToSend = [...errorQueue];
  errorQueue = [];
  await saveErrorQueue();

  const storeUrl = `https://${dsnConfig.host}/api/${dsnConfig.projectId}/store/`;

  for (const event of eventsToSend) {
    try {
      const response = await fetch(storeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=commando-app/1.0, sentry_key=${dsnConfig.publicKey}`,
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        // Re-queue failed event
        errorQueue.push(event);
        console.error('[Sentry] Failed to send event:', response.status);
      }
    } catch (error) {
      // Re-queue failed event
      errorQueue.push(event);
      console.error('[Sentry] Network error:', error);
    }
  }

  if (errorQueue.length > 0) {
    await saveErrorQueue();
  }
}

// ==================== GLOBAL ERROR HANDLER ====================

/**
 * Set up global error handler
 */
export function setupGlobalErrorHandler(): void {
  const originalHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler(async (error: Error, isFatal?: boolean) => {
    // Capture to Sentry
    await captureException(error, {
      level: isFatal ? 'fatal' : 'error',
      tags: { fatal: String(isFatal) },
    });

    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });

  console.log('[Sentry] Global error handler set up');
}

// ==================== PERFORMANCE ====================

/**
 * Start a performance transaction (simplified version)
 */
export function startTransaction(name: string, op: string): { finish: () => void } {
  const startTime = Date.now();

  addBreadcrumb({
    type: 'system',
    category: 'transaction',
    message: `Started: ${name}`,
    data: { op },
  });

  return {
    finish: () => {
      const duration = Date.now() - startTime;
      addBreadcrumb({
        type: 'system',
        category: 'transaction',
        message: `Finished: ${name}`,
        data: { op, duration_ms: duration },
      });
      console.log(`[Sentry] Transaction "${name}" took ${duration}ms`);
    },
  };
}

// ==================== EXPORTS ====================

export const sentry = {
  // Init
  initialize: initializeSentry,
  setupGlobalErrorHandler,

  // User
  setUser,
  clearUser,
  setTags,
  setExtra,

  // Breadcrumbs
  addBreadcrumb,
  addNavigationBreadcrumb,
  addHttpBreadcrumb,
  addUserBreadcrumb,

  // Capture
  captureException,
  captureMessage,
  flushErrors,

  // Performance
  startTransaction,
};

export default sentry;

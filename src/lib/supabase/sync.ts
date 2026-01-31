/**
 * SYNC SERVICE
 * 
 * Handles cloud synchronization for all user data.
 * Supports offline queue, conflict resolution, and real-time sync.
 */

import { supabase } from '@/lib/api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

// ==================== TYPES ====================

export type SyncEntityType = 
  | 'workout_progress'
  | 'meal_completion'
  | 'fasting_session'
  | 'daily_progress'
  | 'user_preferences';

export type SyncOperation = 'create' | 'update' | 'delete';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  operation: SyncOperation;
  data: Record<string, any>;
  timestamp: number;
  retryCount: number;
  lastError?: string;
}

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: string | null;
  pendingCount: number;
  hasError: boolean;
  errorMessage?: string;
  isOnline: boolean;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

export interface ProgressData {
  id?: string;
  user_id: string;
  date: string;
  workout_id?: string;
  exercise_id?: string;
  sets_completed?: number;
  reps_completed?: string;
  duration_seconds?: number;
  calories_burned?: number;
  notes?: string;
  completed_at?: string;
}

export interface MealCompletionData {
  id?: string;
  user_id: string;
  meal_id: string;
  date: string;
  meal_type: string;
  completed_at?: string;
  skipped?: boolean;
  notes?: string;
}

export interface FastingSessionData {
  id?: string;
  user_id: string;
  start_time: string;
  end_time?: string;
  target_hours: number;
  actual_hours?: number;
  completed: boolean;
  broken_early?: boolean;
  notes?: string;
}

// ==================== CONSTANTS ====================

const SYNC_QUEUE_KEY = 'commando_sync_queue';
const LAST_SYNC_KEY = 'commando_last_sync';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000;

// ==================== OFFLINE QUEUE ====================

/**
 * Get all pending sync items from queue
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading sync queue:', error);
    return [];
  }
}

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(
  entityType: SyncEntityType,
  operation: SyncOperation,
  data: Record<string, any>
): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const item: SyncQueueItem = {
      id: `${entityType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entityType,
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };
    
    // Dedupe: Remove existing item with same entity and data ID if updating
    const filteredQueue = queue.filter(
      (q) => !(q.entityType === entityType && q.data.id === data.id && q.operation === operation)
    );
    
    filteredQueue.push(item);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filteredQueue));
  } catch (error) {
    console.error('Error adding to sync queue:', error);
  }
}

/**
 * Remove item from sync queue
 */
export async function removeFromSyncQueue(itemId: string): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const filtered = queue.filter((item) => item.id !== itemId);
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing from sync queue:', error);
  }
}

/**
 * Update retry count for failed item
 */
export async function updateRetryCount(
  itemId: string,
  error: string
): Promise<void> {
  try {
    const queue = await getSyncQueue();
    const updated = queue.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          retryCount: item.retryCount + 1,
          lastError: error,
        };
      }
      return item;
    });
    await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error updating retry count:', error);
  }
}

/**
 * Clear entire sync queue
 */
export async function clearSyncQueue(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
}

// ==================== NETWORK STATUS ====================

/**
 * Check if device is online
 */
export async function isOnline(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === true;
  } catch {
    return true; // Assume online if can't check
  }
}

/**
 * Subscribe to network status changes
 */
export function subscribeToNetworkStatus(
  callback: (isOnline: boolean) => void
): () => void {
  return NetInfo.addEventListener((state) => {
    callback(state.isConnected === true);
  });
}

// ==================== SYNC OPERATIONS ====================

/**
 * Sync workout progress to cloud
 */
export async function syncWorkoutProgress(data: ProgressData): Promise<{ success: boolean; error?: string }> {
  try {
    const online = await isOnline();
    
    if (!online) {
      await addToSyncQueue('workout_progress', data.id ? 'update' : 'create', data);
      return { success: true }; // Queued for later
    }

    if (data.id) {
      // Update existing
      const { error } = await (supabase.from('workout_progress') as any)
        .update(data)
        .eq('id', data.id);
      
      if (error) throw error;
    } else {
      // Create new
      const { error } = await (supabase.from('workout_progress') as any)
        .insert(data);
      
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await addToSyncQueue('workout_progress', data.id ? 'update' : 'create', data);
    return { success: false, error: message };
  }
}

/**
 * Sync meal completion to cloud
 */
export async function syncMealCompletion(data: MealCompletionData): Promise<{ success: boolean; error?: string }> {
  try {
    const online = await isOnline();
    
    if (!online) {
      await addToSyncQueue('meal_completion', data.id ? 'update' : 'create', data);
      return { success: true };
    }

    if (data.id) {
      const { error } = await (supabase.from('meal_completions') as any)
        .update(data)
        .eq('id', data.id);
      
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('meal_completions') as any)
        .insert(data);
      
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await addToSyncQueue('meal_completion', data.id ? 'update' : 'create', data);
    return { success: false, error: message };
  }
}

/**
 * Sync fasting session to cloud
 */
export async function syncFastingSession(data: FastingSessionData): Promise<{ success: boolean; error?: string }> {
  try {
    const online = await isOnline();
    
    if (!online) {
      await addToSyncQueue('fasting_session', data.id ? 'update' : 'create', data);
      return { success: true };
    }

    if (data.id) {
      const { error } = await (supabase.from('fasting_sessions') as any)
        .update(data)
        .eq('id', data.id);
      
      if (error) throw error;
    } else {
      const { error } = await (supabase.from('fasting_sessions') as any)
        .insert(data);
      
      if (error) throw error;
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await addToSyncQueue('fasting_session', data.id ? 'update' : 'create', data);
    return { success: false, error: message };
  }
}

/**
 * Sync daily progress summary
 */
export async function syncDailyProgress(data: {
  user_id: string;
  date: string;
  workouts_completed: number;
  meals_completed: number;
  fasting_completed: boolean;
  total_calories_burned: number;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const online = await isOnline();
    
    if (!online) {
      await addToSyncQueue('daily_progress', 'update', data);
      return { success: true };
    }

    // Upsert daily progress
    const { error } = await (supabase.from('daily_progress') as any)
      .upsert(data, { onConflict: 'user_id,date' });
    
    if (error) throw error;

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed';
    await addToSyncQueue('daily_progress', 'update', data);
    return { success: false, error: message };
  }
}

// ==================== PROCESS QUEUE ====================

/**
 * Process a single sync queue item
 */
async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
  try {
    let result: { success: boolean; error?: string };

    switch (item.entityType) {
      case 'workout_progress':
        result = await syncWorkoutProgress(item.data as ProgressData);
        break;
      case 'meal_completion':
        result = await syncMealCompletion(item.data as MealCompletionData);
        break;
      case 'fasting_session':
        result = await syncFastingSession(item.data as FastingSessionData);
        break;
      case 'daily_progress':
        result = await syncDailyProgress(item.data as any);
        break;
      default:
        console.warn('Unknown sync entity type:', item.entityType);
        return false;
    }

    if (result.success) {
      await removeFromSyncQueue(item.id);
      return true;
    } else {
      await updateRetryCount(item.id, result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await updateRetryCount(item.id, message);
    return false;
  }
}

/**
 * Process all items in sync queue
 */
export async function processAllSyncQueue(): Promise<SyncResult> {
  const online = await isOnline();
  
  if (!online) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: ['No network connection'],
    };
  }

  const queue = await getSyncQueue();
  const result: SyncResult = {
    success: true,
    synced: 0,
    failed: 0,
    errors: [],
  };

  // Filter out items that have exceeded max retries
  const validItems = queue.filter((item) => item.retryCount < MAX_RETRY_COUNT);
  const expiredItems = queue.filter((item) => item.retryCount >= MAX_RETRY_COUNT);

  // Remove expired items
  for (const item of expiredItems) {
    await removeFromSyncQueue(item.id);
    result.errors.push(`Max retries exceeded for ${item.entityType}`);
    result.failed++;
  }

  // Process valid items
  for (const item of validItems) {
    const success = await processSyncItem(item);
    if (success) {
      result.synced++;
    } else {
      result.failed++;
      result.success = false;
    }

    // Small delay between items
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Update last sync time
  if (result.synced > 0) {
    await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  }

  return result;
}

// ==================== FETCH FROM CLOUD ====================

/**
 * Fetch user's workout progress from cloud
 */
export async function fetchWorkoutProgress(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<ProgressData[]> {
  try {
    let query = (supabase.from('workout_progress') as any)
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching workout progress:', error);
    return [];
  }
}

/**
 * Fetch user's meal completions from cloud
 */
export async function fetchMealCompletions(
  userId: string,
  startDate?: string,
  endDate?: string
): Promise<MealCompletionData[]> {
  try {
    let query = (supabase.from('meal_completions') as any)
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching meal completions:', error);
    return [];
  }
}

/**
 * Fetch user's fasting sessions from cloud
 */
export async function fetchFastingSessions(
  userId: string,
  limit?: number
): Promise<FastingSessionData[]> {
  try {
    let query = (supabase.from('fasting_sessions') as any)
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching fasting sessions:', error);
    return [];
  }
}

// ==================== REAL-TIME SUBSCRIPTIONS ====================

/**
 * Subscribe to real-time updates for user progress
 */
export function subscribeToProgressUpdates(
  userId: string,
  onUpdate: (payload: any) => void
): () => void {
  const subscription = supabase
    .channel(`progress_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workout_progress',
        filter: `user_id=eq.${userId}`,
      },
      onUpdate
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'meal_completions',
        filter: `user_id=eq.${userId}`,
      },
      onUpdate
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'fasting_sessions',
        filter: `user_id=eq.${userId}`,
      },
      onUpdate
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

// ==================== SYNC STATUS ====================

/**
 * Get current sync status
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const [queue, lastSync, online] = await Promise.all([
    getSyncQueue(),
    AsyncStorage.getItem(LAST_SYNC_KEY),
    isOnline(),
  ]);

  const failedItems = queue.filter((item) => item.retryCount > 0);

  return {
    isSyncing: false,
    lastSyncAt: lastSync,
    pendingCount: queue.length,
    hasError: failedItems.length > 0,
    errorMessage: failedItems.length > 0 
      ? `${failedItems.length} item(s) failed to sync` 
      : undefined,
    isOnline: online,
  };
}

// ==================== FULL SYNC ====================

/**
 * Perform full sync - push local changes and fetch latest from cloud
 */
export async function performFullSync(userId: string): Promise<SyncResult> {
  const online = await isOnline();
  
  if (!online) {
    return {
      success: false,
      synced: 0,
      failed: 0,
      errors: ['No network connection'],
    };
  }

  // Process offline queue first
  const queueResult = await processAllSyncQueue();

  // Update last sync time
  await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

  return queueResult;
}

// ==================== EXPORTS ====================

export const syncService = {
  // Queue management
  getSyncQueue,
  addToSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,
  processAllSyncQueue,
  
  // Network
  isOnline,
  subscribeToNetworkStatus,
  
  // Sync operations
  syncWorkoutProgress,
  syncMealCompletion,
  syncFastingSession,
  syncDailyProgress,
  
  // Fetch from cloud
  fetchWorkoutProgress,
  fetchMealCompletions,
  fetchFastingSessions,
  
  // Real-time
  subscribeToProgressUpdates,
  
  // Status
  getSyncStatus,
  performFullSync,
};

export default syncService;

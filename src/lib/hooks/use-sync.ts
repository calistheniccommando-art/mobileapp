/**
 * USE SYNC HOOK
 * 
 * React hook for sync status, manual sync trigger, and network awareness.
 * Provides UI feedback for sync operations.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useProgressStore } from '@/lib/state/progress-store';
import { useFastingStore } from '@/lib/state/fasting-store';
import { useUserStore } from '@/lib/state/user-store';
import {
  syncService,
  getSyncStatus,
  subscribeToNetworkStatus,
  processAllSyncQueue,
  type SyncStatus,
  type SyncResult,
} from '@/lib/supabase/sync';

// ==================== TYPES ====================

export interface UseSyncResult {
  // Status
  status: SyncStatus;
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  hasError: boolean;
  errorMessage?: string;

  // Actions
  syncNow: () => Promise<SyncResult>;
  retryFailed: () => Promise<SyncResult>;
  clearErrors: () => void;

  // Real-time
  isRealTimeEnabled: boolean;
  enableRealTime: () => void;
  disableRealTime: () => void;
}

export interface SyncOptions {
  autoSyncOnOnline?: boolean;
  autoSyncOnForeground?: boolean;
  syncInterval?: number; // milliseconds, 0 = disabled
  enableRealTime?: boolean;
}

const DEFAULT_OPTIONS: SyncOptions = {
  autoSyncOnOnline: true,
  autoSyncOnForeground: true,
  syncInterval: 0, // Disabled by default
  enableRealTime: false,
};

// ==================== HOOK ====================

export function useSync(options: SyncOptions = {}): UseSyncResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // State
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    pendingCount: 0,
    hasError: false,
    isOnline: true,
  });
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(opts.enableRealTime || false);

  // Refs for cleanup
  const networkUnsubscribe = useRef<(() => void) | null>(null);
  const realtimeUnsubscribe = useRef<(() => void) | null>(null);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Get user ID from stores
  const userId = useUserStore((s) => s.userId);
  const progressSetUserId = useProgressStore((s) => s.setUserId);
  const fastingSetUserId = useFastingStore((s) => s.setUserId);
  const progressSyncToCloud = useProgressStore((s) => s.syncToCloud);

  // Update user ID in stores when it changes
  useEffect(() => {
    progressSetUserId(userId);
    fastingSetUserId(userId);
  }, [userId, progressSetUserId, fastingSetUserId]);

  // Refresh sync status
  const refreshStatus = useCallback(async () => {
    const newStatus = await getSyncStatus();
    setStatus(newStatus);
  }, []);

  // Sync now
  const syncNow = useCallback(async (): Promise<SyncResult> => {
    if (!userId) {
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: ['User not logged in'],
      };
    }

    setStatus((prev) => ({ ...prev, isSyncing: true }));

    try {
      // Process offline queue
      const result = await processAllSyncQueue();

      // Also trigger store syncs
      await progressSyncToCloud();

      await refreshStatus();

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      setStatus((prev) => ({
        ...prev,
        isSyncing: false,
        hasError: true,
        errorMessage,
      }));

      return {
        success: false,
        synced: 0,
        failed: 1,
        errors: [errorMessage],
      };
    }
  }, [userId, progressSyncToCloud, refreshStatus]);

  // Retry failed items
  const retryFailed = useCallback(async (): Promise<SyncResult> => {
    return syncNow();
  }, [syncNow]);

  // Clear errors
  const clearErrors = useCallback(() => {
    setStatus((prev) => ({
      ...prev,
      hasError: false,
      errorMessage: undefined,
    }));
  }, []);

  // Enable real-time sync
  const enableRealTime = useCallback(() => {
    if (!userId || isRealTimeEnabled) return;

    realtimeUnsubscribe.current = syncService.subscribeToProgressUpdates(
      userId,
      (payload) => {
        console.log('[useSync] Real-time update received:', payload);
        refreshStatus();
      }
    );

    setIsRealTimeEnabled(true);
  }, [userId, isRealTimeEnabled, refreshStatus]);

  // Disable real-time sync
  const disableRealTime = useCallback(() => {
    if (realtimeUnsubscribe.current) {
      realtimeUnsubscribe.current();
      realtimeUnsubscribe.current = null;
    }
    setIsRealTimeEnabled(false);
  }, []);

  // Network status monitoring
  useEffect(() => {
    networkUnsubscribe.current = subscribeToNetworkStatus(async (isOnline) => {
      setStatus((prev) => ({ ...prev, isOnline }));

      // Auto-sync when coming online
      if (isOnline && opts.autoSyncOnOnline && userId) {
        console.log('[useSync] Network restored, syncing...');
        await syncNow();
      }
    });

    return () => {
      if (networkUnsubscribe.current) {
        networkUnsubscribe.current();
      }
    };
  }, [opts.autoSyncOnOnline, userId, syncNow]);

  // App state monitoring (foreground/background)
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active' &&
        opts.autoSyncOnForeground &&
        userId
      ) {
        console.log('[useSync] App foregrounded, syncing...');
        await syncNow();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [opts.autoSyncOnForeground, userId, syncNow]);

  // Periodic sync interval
  useEffect(() => {
    if (opts.syncInterval && opts.syncInterval > 0 && userId) {
      syncIntervalRef.current = setInterval(() => {
        console.log('[useSync] Interval sync triggered');
        syncNow();
      }, opts.syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [opts.syncInterval, userId, syncNow]);

  // Initial status fetch
  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disableRealTime();
      if (networkUnsubscribe.current) {
        networkUnsubscribe.current();
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [disableRealTime]);

  return {
    status,
    isOnline: status.isOnline,
    isSyncing: status.isSyncing,
    pendingCount: status.pendingCount,
    lastSyncAt: status.lastSyncAt,
    hasError: status.hasError,
    errorMessage: status.errorMessage,
    syncNow,
    retryFailed,
    clearErrors,
    isRealTimeEnabled,
    enableRealTime,
    disableRealTime,
  };
}

// ==================== SIMPLE STATUS HOOK ====================

/**
 * Simple hook for just checking sync status
 */
export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    pendingCount: 0,
    hasError: false,
    isOnline: true,
  });

  useEffect(() => {
    const refresh = async () => {
      const newStatus = await getSyncStatus();
      setStatus(newStatus);
    };

    refresh();

    // Refresh every 30 seconds
    const interval = setInterval(refresh, 30000);

    return () => clearInterval(interval);
  }, []);

  return status;
}

// ==================== EXPORTS ====================

export default useSync;

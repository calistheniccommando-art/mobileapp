/**
 * USE FASTING COUNTDOWN HOOK
 *
 * Provides a persistent countdown timer for fasting that:
 * - Updates every second
 * - Survives app reload, backgrounding, and device restart
 * - Recalculates correctly using stored timestamps
 * - Handles edge cases (timezone changes, manual time changes)
 * - Automatically triggers daily reset when needed
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useFastingStore, type FastingStatus } from '@/lib/state/fasting-store';

export interface FastingCountdown extends FastingStatus {
  isLoading: boolean;
  error: string | null;
}

export function useFastingCountdown(): FastingCountdown {
  const getCurrentStatus = useFastingStore((s) => s.getCurrentStatus);
  const initializeTodayCycle = useFastingStore((s) => s.initializeTodayCycle);

  const [status, setStatus] = useState<FastingStatus>(() => getCurrentStatus());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // Calculate and update status
  const updateStatus = useCallback(() => {
    try {
      // Check for daily reset
      initializeTodayCycle();

      // Get current status
      const newStatus = getCurrentStatus();
      setStatus(newStatus);
      setError(null);
      lastUpdateRef.current = Date.now();
    } catch (err) {
      console.error('[useFastingCountdown] Error updating status:', err);
      setError('Failed to update fasting status');
    }
  }, [getCurrentStatus, initializeTodayCycle]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - immediately update status
        console.log('[useFastingCountdown] App became active, updating status');
        updateStatus();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [updateStatus]);

  // Main countdown interval
  useEffect(() => {
    // Initial update
    updateStatus();

    // Set up interval to update every second
    intervalRef.current = setInterval(() => {
      // Detect large time jumps (device time change, timezone change)
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;

      if (timeSinceLastUpdate > 5000) {
        // More than 5 seconds since last update - something unusual happened
        console.warn('[useFastingCountdown] Large time jump detected, recalculating');
      }

      updateStatus();
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...status,
    isLoading,
    error,
  };
}

/**
 * Hook for simple fasting status without countdown
 * (use when you don't need second-by-second updates)
 */
export function useFastingStatus(): Omit<FastingCountdown, 'timeRemaining'> {
  const getCurrentStatus = useFastingStore((s) => s.getCurrentStatus);
  const initializeTodayCycle = useFastingStore((s) => s.initializeTodayCycle);

  const [status, setStatus] = useState(() => {
    initializeTodayCycle();
    return getCurrentStatus();
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Update on mount and every minute
    const updateStatus = () => {
      try {
        initializeTodayCycle();
        const newStatus = getCurrentStatus();
        setStatus(newStatus);
        setError(null);
      } catch (err) {
        console.error('[useFastingStatus] Error:', err);
        setError('Failed to get fasting status');
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 60000); // Every minute

    return () => clearInterval(interval);
  }, [getCurrentStatus, initializeTodayCycle]);

  return {
    currentPhase: status.currentPhase,
    isFasting: status.isFasting,
    isEating: status.isEating,
    percentComplete: status.percentComplete,
    nextPhaseTime: status.nextPhaseTime,
    nextPhaseDate: status.nextPhaseDate,
    isLoading,
    error,
  };
}

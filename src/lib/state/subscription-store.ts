/**
 * SUBSCRIPTION STORE
 *
 * State management for subscription, trial, and payment flow.
 * Handles plan selection, trial periods, and subscription status.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  SubscriptionPlanId,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
  PaymentRecord,
  ShippingAddress,
} from '@/types/subscription';
import {
  SUBSCRIPTION_PLANS,
  TRIAL_OFFER,
} from '@/types/subscription';

// ==================== TYPES ====================

interface SubscriptionState {
  // Current subscription
  subscription: UserSubscription | null;

  // Payment history
  payments: PaymentRecord[];

  // Selected plan (during checkout)
  selectedPlanId: SubscriptionPlanId | null;
  isTrialSelected: boolean;

  // Track if trial has been used (one-time only)
  hasUsedTrial: boolean;

  // Shipping address (for plans with physical book)
  shippingAddress: ShippingAddress | null;

  // UI state
  isProcessingPayment: boolean;
  paymentError: string | null;

  // Welcome flow state
  hasSeenWelcome: boolean;
  hasSeenLanding: boolean; // Web-only landing page
  subscriptionDay: number; // Day number since subscription started (Day 1, Day 2, etc.)

  // Login state (for App Review)
  hasCompletedLogin: boolean;

  // Actions
  selectPlan: (planId: SubscriptionPlanId) => void;
  selectTrial: (selected: boolean) => void;
  setShippingAddress: (address: ShippingAddress) => void;

  // Payment actions
  startPayment: () => void;
  completePayment: (paymentRecord: PaymentRecord) => void;
  failPayment: (error: string) => void;

  // Trial actions
  startTrial: () => void;
  convertTrialToFull: () => void;
  canUseTrial: () => boolean;

  // Subscription management
  cancelSubscription: () => void;
  renewSubscription: () => void;

  // Welcome flow
  markWelcomeSeen: () => void;
  markLandingSeen: () => void;
  getSubscriptionDay: () => number;

  // Login
  markLoginComplete: () => void;

  // Queries
  getSubscriptionStatus: () => SubscriptionStatus;
  isSubscriptionActive: () => boolean;
  canAccessApp: () => boolean;
  getDaysRemaining: () => number;
  getTrialDaysRemaining: () => number;

  // Reset
  resetSubscription: () => void;
}

// ==================== HELPERS ====================

function generateId(): string {
  return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

function daysBetween(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ==================== STORE ====================

export const useSubscriptionStore = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      subscription: null,
      payments: [],
      selectedPlanId: null,
      isTrialSelected: false,
      hasUsedTrial: false,
      shippingAddress: null,
      isProcessingPayment: false,
      paymentError: null,
      hasSeenWelcome: false,
      hasSeenLanding: false,
      subscriptionDay: 1,
      hasCompletedLogin: false,

      selectPlan: (planId) => {
        set({ selectedPlanId: planId, isTrialSelected: false, paymentError: null });
      },

      selectTrial: (selected) => {
        // Only allow selecting trial if not already used
        const { hasUsedTrial } = get();
        if (!hasUsedTrial) {
          set({ isTrialSelected: selected });
        }
      },

      canUseTrial: () => {
        return !get().hasUsedTrial;
      },

      setShippingAddress: (address) => {
        set({ shippingAddress: address });
      },

      startPayment: () => {
        set({ isProcessingPayment: true, paymentError: null });
      },

      completePayment: (paymentRecord) => {
        const { selectedPlanId, isTrialSelected, shippingAddress } = get();

        if (!selectedPlanId) {
          set({ isProcessingPayment: false, paymentError: 'No plan selected' });
          return;
        }

        const plan = SUBSCRIPTION_PLANS[selectedPlanId];
        const now = new Date();

        let subscription: UserSubscription;
        let markTrialUsed = false;

        if (isTrialSelected && selectedPlanId === 'monthly') {
          // Start trial - mark as used
          markTrialUsed = true;
          subscription = {
            id: generateId(),
            planId: selectedPlanId,
            status: 'trial',
            startDate: now.toISOString(),
            endDate: addMonths(now, 1).toISOString(),
            trialStartDate: now.toISOString(),
            trialEndDate: addDays(now, TRIAL_OFFER.durationDays).toISOString(),
            amountPaid: TRIAL_OFFER.priceNaira,
            paymentMethod: paymentRecord.paymentMethod,
            autoRenew: false,
            physicalBookShipped: false,
            shippingAddress: plan.includesPhysicalBook ? shippingAddress ?? undefined : undefined,
          };
        } else {
          // Full subscription
          subscription = {
            id: generateId(),
            planId: selectedPlanId,
            status: 'active',
            startDate: now.toISOString(),
            endDate: addMonths(now, plan.durationMonths).toISOString(),
            amountPaid: plan.priceNaira,
            paymentMethod: paymentRecord.paymentMethod,
            autoRenew: false,
            physicalBookShipped: false,
            shippingAddress: plan.includesPhysicalBook ? shippingAddress ?? undefined : undefined,
          };
        }

        set({
          subscription,
          payments: [...get().payments, paymentRecord],
          isProcessingPayment: false,
          paymentError: null,
          selectedPlanId: null,
          isTrialSelected: false,
          ...(markTrialUsed && { hasUsedTrial: true }),
        });
      },

      failPayment: (error) => {
        set({ isProcessingPayment: false, paymentError: error });
      },

      startTrial: () => {
        const { hasUsedTrial } = get();
        if (hasUsedTrial) return; // Prevent starting trial if already used

        const now = new Date();

        const subscription: UserSubscription = {
          id: generateId(),
          planId: 'monthly',
          status: 'trial',
          startDate: now.toISOString(),
          endDate: addMonths(now, 1).toISOString(),
          trialStartDate: now.toISOString(),
          trialEndDate: addDays(now, TRIAL_OFFER.durationDays).toISOString(),
          amountPaid: TRIAL_OFFER.priceNaira,
          autoRenew: false,
          physicalBookShipped: false,
        };

        set({ subscription, hasUsedTrial: true });
      },

      convertTrialToFull: () => {
        const { subscription } = get();

        if (!subscription || subscription.status !== 'trial') {
          return;
        }

        set({
          subscription: {
            ...subscription,
            status: 'active',
            amountPaid: subscription.amountPaid + TRIAL_OFFER.remainingAfterTrial,
          },
        });
      },

      cancelSubscription: () => {
        const { subscription } = get();

        if (!subscription) return;

        set({
          subscription: {
            ...subscription,
            status: 'cancelled',
            autoRenew: false,
          },
        });
      },

      renewSubscription: () => {
        const { subscription } = get();

        if (!subscription) return;

        const plan = SUBSCRIPTION_PLANS[subscription.planId];
        const now = new Date();

        set({
          subscription: {
            ...subscription,
            status: 'active',
            startDate: now.toISOString(),
            endDate: addMonths(now, plan.durationMonths).toISOString(),
            amountPaid: subscription.amountPaid + plan.priceNaira,
          },
        });
      },

      getSubscriptionStatus: () => {
        const { subscription } = get();

        if (!subscription) return 'none';

        const now = new Date();

        // Check trial status
        if (subscription.status === 'trial' && subscription.trialEndDate) {
          const trialEnd = new Date(subscription.trialEndDate);
          if (now > trialEnd) {
            return 'trial_expired';
          }
          return 'trial';
        }

        // Check subscription expiry
        const endDate = new Date(subscription.endDate);
        if (now > endDate) {
          return 'expired';
        }

        return subscription.status;
      },

      isSubscriptionActive: () => {
        const status = get().getSubscriptionStatus();
        return status === 'active' || status === 'trial';
      },

      canAccessApp: () => {
        const status = get().getSubscriptionStatus();
        return status === 'active' || status === 'trial';
      },

      getDaysRemaining: () => {
        const { subscription } = get();

        if (!subscription) return 0;

        const now = new Date();
        const endDate = new Date(subscription.endDate);

        return Math.max(0, daysBetween(now, endDate));
      },

      getTrialDaysRemaining: () => {
        const { subscription } = get();

        if (!subscription || !subscription.trialEndDate) return 0;

        const now = new Date();
        const trialEnd = new Date(subscription.trialEndDate);

        return Math.max(0, daysBetween(now, trialEnd));
      },

      markWelcomeSeen: () => {
        set({ hasSeenWelcome: true });
      },

      markLandingSeen: () => {
        set({ hasSeenLanding: true });
      },

      getSubscriptionDay: () => {
        const { subscription } = get();
        if (!subscription) return 1;

        const startDate = new Date(subscription.startDate);
        const now = new Date();
        const dayNumber = daysBetween(startDate, now) + 1;

        return Math.max(1, dayNumber);
      },

      markLoginComplete: () => {
        set({ hasCompletedLogin: true });
      },

      resetSubscription: () => {
        set({
          subscription: null,
          payments: [],
          selectedPlanId: null,
          isTrialSelected: false,
          hasUsedTrial: false,
          shippingAddress: null,
          isProcessingPayment: false,
          paymentError: null,
          hasSeenWelcome: false,
          subscriptionDay: 1,
          hasCompletedLogin: false,
        });
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        subscription: state.subscription,
        payments: state.payments,
        shippingAddress: state.shippingAddress,
        hasSeenWelcome: state.hasSeenWelcome,
        hasUsedTrial: state.hasUsedTrial, // Persist trial usage flag
        hasCompletedLogin: state.hasCompletedLogin, // Persist login state
      }),
    }
  )
);

// ==================== SELECTORS ====================

export const useSubscription = () => useSubscriptionStore((s) => s.subscription);
export const useSelectedPlan = () => useSubscriptionStore((s) => s.selectedPlanId);
export const useIsTrialSelected = () => useSubscriptionStore((s) => s.isTrialSelected);
export const useIsProcessingPayment = () => useSubscriptionStore((s) => s.isProcessingPayment);
export const usePaymentError = () => useSubscriptionStore((s) => s.paymentError);
export const useCanAccessApp = () => useSubscriptionStore((s) => s.canAccessApp());
export const useSubscriptionStatus = () => useSubscriptionStore((s) => s.getSubscriptionStatus());
export const useDaysRemaining = () => useSubscriptionStore((s) => s.getDaysRemaining());
export const useHasSeenWelcome = () => useSubscriptionStore((s) => s.hasSeenWelcome);
export const useSubscriptionDay = () => useSubscriptionStore((s) => s.getSubscriptionDay());
export const useCanUseTrial = () => useSubscriptionStore((s) => s.canUseTrial());

// ==================== HELPER FUNCTIONS ====================

export function getPlanById(planId: SubscriptionPlanId): SubscriptionPlan {
  return SUBSCRIPTION_PLANS[planId];
}

export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

export function getRecommendedPlan(): SubscriptionPlan {
  return Object.values(SUBSCRIPTION_PLANS).find((p) => p.recommended) ?? SUBSCRIPTION_PLANS['6_month'];
}

export function formatPrice(priceNaira: number): string {
  return `₦${priceNaira.toLocaleString()}`;
}

export function formatDailyCost(dailyCost: number): string {
  return `₦${dailyCost}/day`;
}

export function calculateSavings(planId: SubscriptionPlanId): number {
  const plan = SUBSCRIPTION_PLANS[planId];
  const monthlyEquivalent = SUBSCRIPTION_PLANS.monthly.priceNaira * plan.durationMonths;
  return monthlyEquivalent - plan.priceNaira;
}

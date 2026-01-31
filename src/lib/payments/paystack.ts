/**
 * PAYSTACK PAYMENT SERVICE
 * 
 * Handles all Paystack payment operations:
 * - Initialize transactions
 * - Verify payments
 * - Handle webhooks
 * - Manage subscription payments
 */

import { supabase } from '@/lib/supabase/client';
import type { SubscriptionPlanId, PaymentRecord } from '@/types/subscription';
import { SUBSCRIPTION_PLANS, TRIAL_OFFER } from '@/types/subscription';

// ==================== TYPES ====================

export interface PaystackConfig {
  publicKey: string;
  secretKey?: string; // Only used server-side
}

export interface PaystackInitializeParams {
  email: string;
  amount: number; // In kobo (smallest currency unit)
  reference: string;
  currency?: string;
  callback_url?: string;
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  metadata?: {
    user_id: string;
    plan_id: SubscriptionPlanId;
    is_trial: boolean;
    custom_fields?: Array<{
      display_name: string;
      variable_name: string;
      value: string | number;
    }>;
  };
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned' | 'pending';
    reference: string;
    amount: number;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: {
      user_id: string;
      plan_id: SubscriptionPlanId;
      is_trial: boolean;
    };
    customer: {
      id: number;
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
    };
  };
}

export interface PaystackWebhookEvent {
  event: 'charge.success' | 'charge.failed' | 'subscription.create' | 'subscription.disable';
  data: {
    id: number;
    reference: string;
    amount: number;
    status: string;
    customer: {
      email: string;
    };
    metadata?: {
      user_id: string;
      plan_id: SubscriptionPlanId;
      is_trial: boolean;
    };
  };
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  reference: string;
  amount: number;
  currency: string;
  status: 'pending' | 'success' | 'failed' | 'abandoned';
  plan_id: SubscriptionPlanId;
  is_trial: boolean;
  paystack_id?: number;
  gateway_response?: string;
  channel?: string;
  card_last4?: string;
  card_brand?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

// ==================== CONSTANTS ====================

const PAYSTACK_API_URL = 'https://api.paystack.co';

// Paystack public key from environment
const PAYSTACK_PUBLIC_KEY = process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '';

// Plan amounts in kobo (Naira * 100)
export const PLAN_AMOUNTS_KOBO: Record<SubscriptionPlanId, number> = {
  monthly: SUBSCRIPTION_PLANS.monthly.priceNaira * 100,
  quarterly: SUBSCRIPTION_PLANS.quarterly.priceNaira * 100,
  hero: SUBSCRIPTION_PLANS.hero.priceNaira * 100,
  ultimate: SUBSCRIPTION_PLANS.ultimate.priceNaira * 100,
};

export const TRIAL_AMOUNT_KOBO = TRIAL_OFFER.priceNaira * 100;

// ==================== HELPERS ====================

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(userId: string, planId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CC-${planId.toUpperCase()}-${timestamp}-${random}`;
}

/**
 * Convert kobo to naira for display
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Convert naira to kobo for Paystack
 */
export function nairaToKobo(naira: number): number {
  return naira * 100;
}

/**
 * Format amount for display
 */
export function formatAmount(kobo: number): string {
  const naira = koboToNaira(kobo);
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(naira);
}

// ==================== SERVICE ====================

export const paystackService = {
  /**
   * Get Paystack public key
   */
  getPublicKey(): string {
    return PAYSTACK_PUBLIC_KEY;
  },

  /**
   * Check if Paystack is configured
   */
  isConfigured(): boolean {
    return Boolean(PAYSTACK_PUBLIC_KEY);
  },

  /**
   * Initialize a payment transaction
   * Returns authorization URL to redirect user to
   */
  async initializeTransaction(params: PaystackInitializeParams): Promise<PaystackInitializeResponse> {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        currency: params.currency || 'NGN',
        callback_url: params.callback_url,
        channels: params.channels || ['card', 'bank', 'ussd', 'bank_transfer'],
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to initialize payment');
    }

    return response.json();
  },

  /**
   * Verify a payment transaction
   * Call this after user returns from payment
   */
  async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
    const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_PUBLIC_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to verify payment');
    }

    return response.json();
  },

  /**
   * Create payment transaction record in database
   */
  async createTransaction(
    userId: string,
    planId: SubscriptionPlanId,
    isTrial: boolean,
    email: string
  ): Promise<PaymentTransaction> {
    const reference = generatePaymentReference(userId, planId);
    const amount = isTrial ? TRIAL_AMOUNT_KOBO : PLAN_AMOUNTS_KOBO[planId];

    const transaction: Partial<PaymentTransaction> = {
      user_id: userId,
      reference,
      amount,
      currency: 'NGN',
      status: 'pending',
      plan_id: planId,
      is_trial: isTrial,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await (supabase
      .from('payment_transactions') as any)
      .insert(transaction)
      .select()
      .single();

    if (error) {
      console.error('Failed to create transaction:', error);
      throw new Error('Failed to create payment record');
    }

    return data;
  },

  /**
   * Update transaction after verification
   */
  async updateTransactionStatus(
    reference: string,
    status: 'success' | 'failed' | 'abandoned',
    verifyData?: PaystackVerifyResponse['data']
  ): Promise<void> {
    const updates: Partial<PaymentTransaction> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (verifyData) {
      updates.paystack_id = verifyData.id;
      updates.gateway_response = verifyData.gateway_response;
      updates.channel = verifyData.channel;
      updates.paid_at = verifyData.paid_at;
      
      if (verifyData.authorization) {
        updates.card_last4 = verifyData.authorization.last4;
        updates.card_brand = verifyData.authorization.brand;
      }
    }

    const { error } = await (supabase
      .from('payment_transactions') as any)
      .update(updates)
      .eq('reference', reference);

    if (error) {
      console.error('Failed to update transaction:', error);
      throw new Error('Failed to update payment record');
    }
  },

  /**
   * Get transaction by reference
   */
  async getTransaction(reference: string): Promise<PaymentTransaction | null> {
    const { data, error } = await (supabase
      .from('payment_transactions') as any)
      .select('*')
      .eq('reference', reference)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Failed to get transaction:', error);
      throw new Error('Failed to fetch payment record');
    }

    return data;
  },

  /**
   * Get user's payment history
   */
  async getPaymentHistory(userId: string): Promise<PaymentTransaction[]> {
    const { data, error } = await (supabase
      .from('payment_transactions') as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get payment history:', error);
      throw new Error('Failed to fetch payment history');
    }

    return data || [];
  },

  /**
   * Process successful payment
   * Updates user subscription status
   */
  async processSuccessfulPayment(
    userId: string,
    planId: SubscriptionPlanId,
    isTrial: boolean,
    transactionReference: string
  ): Promise<void> {
    const plan = SUBSCRIPTION_PLANS[planId];
    const now = new Date();
    
    // Calculate end date
    let endDate: Date;
    if (isTrial) {
      endDate = new Date(now);
      endDate.setDate(endDate.getDate() + TRIAL_OFFER.durationDays);
    } else {
      endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);
    }

    // Update user subscription in database
    const { error } = await (supabase
      .from('user_subscriptions') as any)
      .upsert({
        user_id: userId,
        plan_id: planId,
        status: isTrial ? 'trial' : 'active',
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        trial_start_date: isTrial ? now.toISOString() : null,
        trial_end_date: isTrial ? endDate.toISOString() : null,
        amount_paid: isTrial ? TRIAL_OFFER.priceNaira : plan.priceNaira,
        payment_reference: transactionReference,
        auto_renew: false,
        updated_at: now.toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error) {
      console.error('Failed to update subscription:', error);
      throw new Error('Failed to activate subscription');
    }

    // Mark trial as used if applicable
    if (isTrial) {
      await (supabase
        .from('users') as any)
        .update({ has_used_trial: true })
        .eq('id', userId);
    }
  },

  /**
   * Start payment flow
   * Creates transaction and returns Paystack params
   */
  async startPayment(
    userId: string,
    email: string,
    planId: SubscriptionPlanId,
    isTrial: boolean,
    callbackUrl?: string
  ): Promise<{
    reference: string;
    amount: number;
    authorizationUrl?: string;
  }> {
    // Create transaction record
    const transaction = await this.createTransaction(userId, planId, isTrial, email);

    // Initialize with Paystack
    const initResponse = await this.initializeTransaction({
      email,
      amount: transaction.amount,
      reference: transaction.reference,
      callback_url: callbackUrl,
      metadata: {
        user_id: userId,
        plan_id: planId,
        is_trial: isTrial,
        custom_fields: [
          {
            display_name: 'Plan',
            variable_name: 'plan_name',
            value: SUBSCRIPTION_PLANS[planId].name,
          },
          {
            display_name: 'Type',
            variable_name: 'payment_type',
            value: isTrial ? 'Trial' : 'Subscription',
          },
        ],
      },
    });

    return {
      reference: transaction.reference,
      amount: transaction.amount,
      authorizationUrl: initResponse.data.authorization_url,
    };
  },

  /**
   * Complete payment flow
   * Verifies payment and activates subscription
   */
  async completePayment(reference: string): Promise<{
    success: boolean;
    message: string;
    planId?: SubscriptionPlanId;
    isTrial?: boolean;
  }> {
    try {
      // Verify with Paystack
      const verifyResponse = await this.verifyTransaction(reference);

      if (verifyResponse.data.status !== 'success') {
        await this.updateTransactionStatus(reference, verifyResponse.data.status as any);
        return {
          success: false,
          message: verifyResponse.data.gateway_response || 'Payment was not successful',
        };
      }

      // Update transaction record
      await this.updateTransactionStatus(reference, 'success', verifyResponse.data);

      // Get metadata
      const { user_id, plan_id, is_trial } = verifyResponse.data.metadata || {};

      if (!user_id || !plan_id) {
        throw new Error('Missing payment metadata');
      }

      // Process successful payment
      await this.processSuccessfulPayment(user_id, plan_id, is_trial, reference);

      return {
        success: true,
        message: 'Payment successful! Your subscription is now active.',
        planId: plan_id,
        isTrial: is_trial,
      };
    } catch (error) {
      console.error('Payment completion error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Payment verification failed',
      };
    }
  },

  /**
   * Convert PaymentTransaction to PaymentRecord (for store)
   */
  toPaymentRecord(transaction: PaymentTransaction): PaymentRecord {
    return {
      id: transaction.id,
      planId: transaction.plan_id,
      amount: koboToNaira(transaction.amount),
      currency: 'NGN',
      status: transaction.status === 'success' ? 'completed' : transaction.status === 'pending' ? 'pending' : 'failed',
      paymentMethod: transaction.channel === 'card' ? 'card' : 'bank_transfer',
      transactionReference: transaction.reference,
      paidAt: transaction.paid_at || transaction.created_at,
    };
  },
};

// ==================== REACT NATIVE PAYSTACK POPUP ====================

/**
 * Paystack popup configuration for react-native-paystack-webview
 */
export interface PaystackPopupConfig {
  paystackKey: string;
  billingEmail: string;
  amount: number; // In Naira (not kobo)
  reference: string;
  currency?: string;
  channels?: ('card' | 'bank' | 'ussd' | 'bank_transfer')[];
  metadata?: {
    user_id: string;
    plan_id: SubscriptionPlanId;
    is_trial: boolean;
  };
  onSuccess: (response: { reference: string }) => void;
  onCancel: () => void;
}

/**
 * Get Paystack popup config for a plan
 */
export function getPaystackPopupConfig(
  email: string,
  userId: string,
  planId: SubscriptionPlanId,
  isTrial: boolean,
  onSuccess: (response: { reference: string }) => void,
  onCancel: () => void
): PaystackPopupConfig {
  const amount = isTrial
    ? TRIAL_OFFER.priceNaira
    : SUBSCRIPTION_PLANS[planId].priceNaira;

  const reference = generatePaymentReference(userId, planId);

  return {
    paystackKey: PAYSTACK_PUBLIC_KEY,
    billingEmail: email,
    amount,
    reference,
    currency: 'NGN',
    channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    metadata: {
      user_id: userId,
      plan_id: planId,
      is_trial: isTrial,
    },
    onSuccess,
    onCancel,
  };
}

// ==================== EXPORTS ====================

export default paystackService;

/**
 * PAYMENTS MODULE INDEX
 * 
 * Central export for all payment-related functionality
 */

export {
  paystackService,
  generatePaymentReference,
  koboToNaira,
  nairaToKobo,
  formatAmount,
  getPaystackPopupConfig,
  PLAN_AMOUNTS_KOBO,
  TRIAL_AMOUNT_KOBO,
} from './paystack';

export type {
  PaystackConfig,
  PaystackInitializeParams,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaystackWebhookEvent,
  PaymentTransaction,
  PaystackPopupConfig,
} from './paystack';

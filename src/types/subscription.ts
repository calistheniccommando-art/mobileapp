/**
 * SUBSCRIPTION & PAYMENT TYPES
 *
 * Defines the pricing structure, subscription plans, trial options,
 * and payment flow types for Calisthenic Commando.
 */

// ==================== PRICING PLANS ====================

export type SubscriptionPlanId = 'monthly' | '3_month' | '6_month' | '12_month';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  durationMonths: number;
  priceNaira: number;
  dailyCostNaira: number;
  savingsPercent: number;
  features: string[];
  includesPhysicalBook: boolean;
  includesTrainerCheckin: boolean;
  trainerCheckinFrequency?: string;
  recommended?: boolean;
  badge?: string;
}

export interface TrialOffer {
  available: boolean;
  priceNaira: number;
  durationDays: number;
  remainingAfterTrial: number;
  fullMonthlyPrice: number;
}

// ==================== PRICING CONSTANTS ====================

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  monthly: {
    id: 'monthly',
    name: 'Monthly Plan',
    tagline: 'Start your transformation',
    durationMonths: 1,
    priceNaira: 10000,
    dailyCostNaira: Math.round(10000 / 30),
    savingsPercent: 0,
    features: [
      'Full app access',
      'Daily personalized workouts',
      'Custom meal plans',
      'Intermittent fasting guide',
      'Progress tracking',
      'In-app daily guide',
    ],
    includesPhysicalBook: false,
    includesTrainerCheckin: false,
  },
  '3_month': {
    id: '3_month',
    name: '3-Month Plan',
    tagline: 'Commit to change',
    durationMonths: 3,
    priceNaira: 28000,
    dailyCostNaira: Math.round(28000 / 90),
    savingsPercent: Math.round((1 - 28000 / (10000 * 3)) * 100),
    features: [
      'Everything in Monthly',
      'Lower daily cost',
      'Extended progress tracking',
      'Workout progression system',
      '90-day transformation program',
    ],
    includesPhysicalBook: false,
    includesTrainerCheckin: false,
  },
  '6_month': {
    id: '6_month',
    name: '6-Month Hero Plan',
    tagline: '⚡ Most Popular Choice',
    durationMonths: 6,
    priceNaira: 50000,
    dailyCostNaira: Math.round(50000 / 180),
    savingsPercent: Math.round((1 - 50000 / (10000 * 6)) * 100),
    features: [
      'Everything in 3-Month',
      'Physical guidebook shipped to you',
      'Daily progress tick-off in book',
      'Tangible evidence of growth',
      '180-day complete program',
      'Priority support',
    ],
    includesPhysicalBook: true,
    includesTrainerCheckin: false,
    recommended: true,
    badge: 'MOST POPULAR',
  },
  '12_month': {
    id: '12_month',
    name: 'Ultimate Plan',
    tagline: 'Transform your life',
    durationMonths: 12,
    priceNaira: 96000,
    dailyCostNaira: Math.round(96000 / 365),
    savingsPercent: Math.round((1 - 96000 / (10000 * 12)) * 100),
    features: [
      'Everything in Hero Plan',
      'Monthly 30-min check-in with pro trainer',
      'Full year physical guidebook (2 volumes)',
      'Personalized coaching adjustments',
      'VIP support channel',
      'Exclusive community access',
    ],
    includesPhysicalBook: true,
    includesTrainerCheckin: true,
    trainerCheckinFrequency: 'monthly',
    badge: 'PREMIUM',
  },
};

export const TRIAL_OFFER: TrialOffer = {
  available: true,
  priceNaira: 3000,
  durationDays: 30, // Full 30-day trial as per requirements
  remainingAfterTrial: 7000,
  fullMonthlyPrice: 10000,
};

// ==================== SUBSCRIPTION STATUS ====================

export type SubscriptionStatus =
  | 'none'
  | 'trial'
  | 'trial_expired'
  | 'active'
  | 'expired'
  | 'cancelled';

export interface UserSubscription {
  id: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startDate: string;
  endDate: string;
  trialStartDate?: string;
  trialEndDate?: string;
  amountPaid: number;
  paymentMethod?: string;
  autoRenew: boolean;
  physicalBookShipped?: boolean;
  physicalBookTrackingNumber?: string;
  shippingAddress?: ShippingAddress;
}

export interface ShippingAddress {
  fullName: string;
  street: string;
  city: string;
  state: string;
  postalCode?: string;
  phone: string;
}

// ==================== PAYMENT ====================

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentRecord {
  id: string;
  userId: string;
  subscriptionId: string;
  planId?: SubscriptionPlanId;  // Optional for backwards compatibility
  amount: number;
  currency: 'NGN';
  status: PaymentStatus;
  paymentMethod: string;
  reference: string;
  transactionReference?: string; // Alias for reference
  createdAt: string;
  paidAt?: string;  // Alias for completedAt
  completedAt?: string;
  failureReason?: string;
}

// ==================== GENDER-SPECIFIC CONTENT ====================

export interface PaywallContent {
  headline: string;
  subheadline: string;
  ctaText: string;
  trialCtaText: string;
  motivationalMessage: string;
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
}

export const PAYWALL_CONTENT_MALE: PaywallContent = {
  headline: 'Your Battle Plan is Ready, Soldier!',
  subheadline: 'Choose your commitment level and begin your transformation mission',
  ctaText: 'Deploy My Plan',
  trialCtaText: 'Start 3-Day Recon Mission',
  motivationalMessage:
    'Warriors don\'t wait for the perfect moment. They create it. Your personalized combat training is waiting.',
  features: [
    {
      title: 'Military-Grade Workouts',
      description: 'Bodyweight exercises designed to build real strength',
      icon: 'dumbbell',
    },
    {
      title: 'Tactical Nutrition',
      description: 'Strategic meal timing for maximum performance',
      icon: 'utensils',
    },
    {
      title: 'Discipline System',
      description: 'Fasting protocols that forge mental toughness',
      icon: 'shield',
    },
    {
      title: 'Progress Tracking',
      description: 'Monitor your transformation like a true commander',
      icon: 'chart',
    },
  ],
};

export const PAYWALL_CONTENT_FEMALE: PaywallContent = {
  headline: 'Your Transformation Journey Awaits!',
  subheadline: 'Choose the plan that fits your lifestyle and start becoming your best self',
  ctaText: 'Start My Journey',
  trialCtaText: 'Try 3 Days Free',
  motivationalMessage:
    'You deserve to feel strong, confident, and beautiful. Your personalized wellness plan is designed just for you.',
  features: [
    {
      title: 'Sculpting Workouts',
      description: 'Tone and strengthen your body with targeted exercises',
      icon: 'sparkles',
    },
    {
      title: 'Nourishing Meals',
      description: 'Delicious meals that fuel your transformation',
      icon: 'heart',
    },
    {
      title: 'Wellness Fasting',
      description: 'Gentle fasting for energy and clarity',
      icon: 'moon',
    },
    {
      title: 'Progress Celebration',
      description: 'Track and celebrate every milestone',
      icon: 'trophy',
    },
  ],
};

// ==================== EMAIL TEMPLATES ====================

export interface ConfirmationEmailData {
  userName: string;
  userEmail: string;
  gender: 'male' | 'female';
  planName: string;
  planPrice: number;
  planDuration: string;
  startDate: string;
  endDate: string;
  includesBook: boolean;
  includesTrainer: boolean;
  dailyWorkoutPreview: string;
  appLink: string;
}

export const EMAIL_TEMPLATE_MALE = {
  subject: '🦁 Your Transformation Begins NOW, Soldier!',
  preheader: 'Your personalized battle plan is ready. Time to dominate.',
  greeting: (name: string) => `Commander ${name},`,
  intro:
    'Your commitment has been received. The battlefield awaits, and your personalized combat training program is now ACTIVE.',
  motivationalQuote:
    '"The warrior who trains with purpose becomes unstoppable. Your transformation mission has begun."',
  ctaText: 'ENTER THE ARENA',
  closingMessage:
    'Remember: Pain is temporary, but the strength you build lasts forever. See you on the battlefield, soldier.',
  signature: 'The Calisthenic Commando Team',
  imagePrompt:
    'A powerful, muscular anthropomorphic lion-man hybrid warrior in military tactical gear, standing confidently with arms crossed, emanating strength and determination. Digital art style, dramatic lighting, motivational and inspiring atmosphere.',
};

export const EMAIL_TEMPLATE_FEMALE = {
  subject: '✨ Your Wellness Journey Starts Today!',
  preheader: 'Your personalized transformation plan is ready. Let\'s begin!',
  greeting: (name: string) => `Beautiful ${name},`,
  intro:
    'We\'re so excited you\'ve taken this step toward becoming your strongest, most confident self. Your personalized wellness program is now ready!',
  motivationalQuote:
    '"Every day is a new opportunity to become the woman you\'ve always wanted to be. You\'ve got this!"',
  ctaText: 'START MY JOURNEY',
  closingMessage:
    'Remember: This journey is about progress, not perfection. We believe in you, and we\'re here to support you every step of the way.',
  signature: 'With love, The Calisthenic Commando Team',
  imagePrompt:
    'An elegant, strong woman in comfortable workout attire, radiating confidence and grace, surrounded by soft glowing light. Wellness and transformation theme, warm and inviting atmosphere, inspirational and empowering.',
};

// ==================== ADMIN TYPES ====================

export interface PricingConfig {
  plans: Record<SubscriptionPlanId, SubscriptionPlan>;
  trialOffer: TrialOffer;
  currency: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface SubscriptionStats {
  totalSubscribers: number;
  activeSubscriptions: Record<SubscriptionPlanId, number>;
  trialsActive: number;
  trialsConverted: number;
  revenue: {
    thisMonth: number;
    lastMonth: number;
    total: number;
  };
  churnRate: number;
}

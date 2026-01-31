/**
 * Type declarations for react-native-paystack-webview
 * 
 * This module provides Paystack payment integration for React Native apps.
 * Install: npm install react-native-paystack-webview
 */

declare module 'react-native-paystack-webview' {
  import React from 'react';

  export namespace paystackProps {
    interface PayStackRef {
      startTransaction: () => void;
      endTransaction: () => void;
    }
  }

  interface PaystackProps {
    paystackKey: string;
    billingEmail: string;
    amount: number;
    currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD';
    channels?: Array<'card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer'>;
    refNumber?: string;
    billingName?: string;
    billingMobile?: string;
    activityIndicatorColor?: string;
    onCancel: (e?: any) => void;
    onSuccess: (response: {
      transactionRef?: string;
      reference?: string;
      status: string;
      message: string;
    }) => void;
    autoStart?: boolean;
  }

  export const Paystack: React.ForwardRefExoticComponent<
    PaystackProps & React.RefAttributes<paystackProps.PayStackRef>
  >;
}

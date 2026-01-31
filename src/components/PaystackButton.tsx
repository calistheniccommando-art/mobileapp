/**
 * PAYSTACK BUTTON
 * 
 * Cross-platform Paystack payment component.
 * - Native: Uses react-native-paystack-webview
 * - Web: Uses Paystack Inline JS SDK
 */

import React from 'react';
import { Platform, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface PaystackButtonProps {
  paystackKey: string;
  email: string;
  amount: number; // in kobo for native, naira for calculations
  currency?: string;
  reference?: string;
  onSuccess: (response: { reference: string; transactionRef?: string; status: string }) => void;
  onCancel: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// Web implementation using Paystack Popup
const PaystackButtonWeb: React.FC<PaystackButtonProps> = ({
  paystackKey,
  email,
  amount,
  currency = 'NGN',
  reference,
  onSuccess,
  onCancel,
  disabled,
  children,
  className,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handlePayment = () => {
    if (disabled || isLoading) return;

    // Check if Paystack is loaded
    const PaystackPop = (window as any).PaystackPop;
    
    if (!PaystackPop) {
      // Load Paystack script dynamically
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => initiatePayment();
      document.body.appendChild(script);
    } else {
      initiatePayment();
    }
  };

  const initiatePayment = () => {
    setIsLoading(true);
    const PaystackPop = (window as any).PaystackPop;
    
    const handler = PaystackPop.setup({
      key: paystackKey,
      email,
      amount: amount * 100, // Convert to kobo
      currency,
      ref: reference || `CMD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      callback: (response: any) => {
        setIsLoading(false);
        onSuccess({
          reference: response.reference,
          transactionRef: response.reference,
          status: 'success',
        });
      },
      onClose: () => {
        setIsLoading(false);
        onCancel();
      },
    });
    
    handler.openIframe();
  };

  return (
    <TouchableOpacity
      onPress={handlePayment}
      disabled={disabled || isLoading}
      className={className}
    >
      {isLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Native implementation placeholder
// Will use react-native-paystack-webview when installed
const PaystackButtonNative: React.FC<PaystackButtonProps> = ({
  paystackKey,
  email,
  amount,
  currency = 'NGN',
  reference,
  onSuccess,
  onCancel,
  disabled,
  children,
  className,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const paystackRef = React.useRef<any>(null);

  // Dynamic import for native only
  const [PaystackComponent, setPaystackComponent] = React.useState<any>(null);

  React.useEffect(() => {
    // Try to load the native Paystack component
    try {
      const paystack = require('react-native-paystack-webview');
      setPaystackComponent(() => paystack.Paystack);
    } catch (e) {
      console.warn('react-native-paystack-webview not installed. Please run: npm install react-native-paystack-webview');
    }
  }, []);

  const handlePress = () => {
    if (paystackRef.current) {
      paystackRef.current.startTransaction();
    }
  };

  return (
    <>
      {PaystackComponent && (
        <PaystackComponent
          paystackKey={paystackKey}
          billingEmail={email}
          amount={amount}
          currency={currency}
          refNumber={reference}
          onCancel={onCancel}
          onSuccess={onSuccess}
          ref={paystackRef}
        />
      )}
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || isLoading || !PaystackComponent}
        className={className}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          children
        )}
      </TouchableOpacity>
    </>
  );
};

// Export platform-specific component
export const PaystackButton = Platform.select({
  web: PaystackButtonWeb,
  default: PaystackButtonNative,
}) as React.FC<PaystackButtonProps>;

export default PaystackButton;

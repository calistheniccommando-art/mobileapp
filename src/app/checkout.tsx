/**
 * CHECKOUT PAGE
 * 
 * Payment processing with Paystack integration.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react-native';

import { PaystackButton } from '@/components/PaystackButton';
import { useCartStore } from '@/lib/state/cart-store';
import { orderService } from '@/lib/supabase/orders';
import { useUserStore } from '@/lib/state/user-store';
import type { PaymentMethod } from '@/types/store';

export default function CheckoutScreen() {
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('paystack');

  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const shipping = useCartStore((state) => state.shipping);
  const total = useCartStore((state) => state.total);
  const shippingAddress = useCartStore((state) => state.shippingAddress);
  const clearCart = useCartStore((state) => state.clearCart);

  const profile = useUserStore((state) => state.profile);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const handlePaymentSuccess = async (response: any) => {
    setIsProcessing(true);

    try {
      // Create order
      const order = await orderService.create({
        userId: profile?.id || 'guest',
        userEmail: shippingAddress?.email || profile?.email || '',
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        shipping,
        total,
        paymentMethod,
        shippingAddress: shippingAddress!,
      });

      // Mark as paid
      await orderService.markAsPaid(order.id, response.transactionRef || response.reference);

      // Clear cart
      clearCart();

      // Navigate to success
      router.replace({
        pathname: '/order-success',
        params: { orderNumber: order.orderNumber },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to process your order. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentCancel = () => {
    Alert.alert('Payment Cancelled', 'Your payment was cancelled.');
  };

  const handleBankTransfer = () => {
    if (!shippingAddress) {
      Alert.alert('Error', 'Please add a shipping address');
      router.back();
      return;
    }

    // Show bank transfer details
    Alert.alert(
      'Bank Transfer',
      'Account Details:\n\nBank: GTBank\nAccount Number: 0123456789\nAccount Name: Commando Fitness\n\nPlease use your email as payment reference.\n\nYour order will be processed once payment is confirmed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I have transferred',
          onPress: () => handleManualPayment(),
        },
      ]
    );
  };

  const handleManualPayment = async () => {
    setIsProcessing(true);

    try {
      // Create order as pending
      const order = await orderService.create({
        userId: profile?.id || 'guest',
        userEmail: shippingAddress?.email || profile?.email || '',
        items: items.map((item) => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        shipping,
        total,
        paymentMethod: 'transfer',
        shippingAddress: shippingAddress!,
      });

      // Clear cart
      clearCart();

      // Navigate to success (pending confirmation)
      router.replace({
        pathname: '/order-success',
        params: { orderNumber: order.orderNumber, pending: 'true' },
      });
    } catch (error) {
      console.error('Error creating order:', error);
      Alert.alert('Error', 'Failed to create your order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!shippingAddress) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Text className="text-white">No shipping address</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-emerald-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">Checkout</Text>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Delivery Address */}
          <View className="bg-slate-800 rounded-xl p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-white font-bold text-lg">Delivery Address</Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text className="text-emerald-400">Edit</Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-2">
              <View className="flex-row items-center">
                <MapPin size={16} color="#64748b" />
                <Text className="text-white ml-2">{shippingAddress.fullName}</Text>
              </View>
              <View className="flex-row items-center">
                <Phone size={16} color="#64748b" />
                <Text className="text-slate-400 ml-2">{shippingAddress.phone}</Text>
              </View>
              <View className="flex-row items-center">
                <Mail size={16} color="#64748b" />
                <Text className="text-slate-400 ml-2">{shippingAddress.email}</Text>
              </View>
              <Text className="text-slate-400 ml-6">
                {shippingAddress.address}, {shippingAddress.city}, {shippingAddress.state}
              </Text>
              {shippingAddress.landmark && (
                <Text className="text-slate-500 ml-6 text-sm">
                  Near: {shippingAddress.landmark}
                </Text>
              )}
            </View>
          </View>

          {/* Order Items */}
          <View className="bg-slate-800 rounded-xl p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-3">
              Order Items ({items.length})
            </Text>

            {items.map((item) => (
              <View
                key={item.productId}
                className="flex-row justify-between py-2 border-b border-slate-700 last:border-b-0"
              >
                <View className="flex-1">
                  <Text className="text-white" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text className="text-slate-400 text-sm">Qty: {item.quantity}</Text>
                </View>
                <Text className="text-white font-medium">
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Payment Method */}
          <View className="bg-slate-800 rounded-xl p-4 mb-4">
            <Text className="text-white font-bold text-lg mb-3">Payment Method</Text>

            <TouchableOpacity
              onPress={() => setPaymentMethod('paystack')}
              className={`flex-row items-center p-4 rounded-xl mb-3 ${
                paymentMethod === 'paystack'
                  ? 'bg-emerald-500/20 border border-emerald-500'
                  : 'bg-slate-700'
              }`}
            >
              <View
                className={`p-2 rounded-full ${
                  paymentMethod === 'paystack' ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <CreditCard size={20} color="#fff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium">Card Payment</Text>
                <Text className="text-slate-400 text-sm">
                  Pay with debit/credit card via Paystack
                </Text>
              </View>
              {paymentMethod === 'paystack' && (
                <CheckCircle2 size={20} color="#10b981" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setPaymentMethod('transfer')}
              className={`flex-row items-center p-4 rounded-xl ${
                paymentMethod === 'transfer'
                  ? 'bg-emerald-500/20 border border-emerald-500'
                  : 'bg-slate-700'
              }`}
            >
              <View
                className={`p-2 rounded-full ${
                  paymentMethod === 'transfer' ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <Wallet size={20} color="#fff" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-white font-medium">Bank Transfer</Text>
                <Text className="text-slate-400 text-sm">
                  Transfer to our bank account
                </Text>
              </View>
              {paymentMethod === 'transfer' && (
                <CheckCircle2 size={20} color="#10b981" />
              )}
            </TouchableOpacity>
          </View>

          {/* Order Summary */}
          <View className="bg-slate-800 rounded-xl p-4 mb-32">
            <Text className="text-white font-bold text-lg mb-4">Order Summary</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400">Subtotal</Text>
              <Text className="text-white">{formatPrice(subtotal)}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400">Shipping</Text>
              <Text className="text-white">{formatPrice(shipping)}</Text>
            </View>

            <View className="border-t border-slate-700 pt-3 mt-3">
              <View className="flex-row justify-between">
                <Text className="text-white font-bold text-lg">Total</Text>
                <Text className="text-emerald-400 font-bold text-xl">
                  {formatPrice(total)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <View className="absolute bottom-0 left-0 right-0 bg-slate-900 px-4 pb-8 pt-4 border-t border-slate-800">
          {paymentMethod === 'paystack' ? (
            <PaystackButton
              paystackKey="pk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" // Replace with your key
              email={shippingAddress.email}
              amount={total}
              currency="NGN"
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              disabled={isProcessing}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                isProcessing ? 'bg-slate-600' : 'bg-emerald-500'
              }`}
            >
              <CreditCard size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">
                Pay {formatPrice(total)}
              </Text>
            </PaystackButton>
          ) : (
            <TouchableOpacity
              onPress={handleBankTransfer}
              disabled={isProcessing}
              className={`py-4 rounded-xl flex-row items-center justify-center ${
                isProcessing ? 'bg-slate-600' : 'bg-emerald-500'
              }`}
            >
              {isProcessing ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text className="text-white font-bold ml-2">Processing...</Text>
                </>
              ) : (
                <>
                  <Wallet size={20} color="#fff" />
                  <Text className="text-white font-bold ml-2">
                    Pay via Bank Transfer
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

/**
 * ORDER SUCCESS PAGE
 * 
 * Confirmation page after successful order placement.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CheckCircle2, Package, Clock, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';

export default function OrderSuccessScreen() {
  const { orderNumber, pending } = useLocalSearchParams<{
    orderNumber: string;
    pending?: string;
  }>();
  const router = useRouter();

  const isPending = pending === 'true';

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1 items-center justify-center px-8">
        {/* Success Icon */}
        <Animated.View entering={FadeIn.delay(200)} className="mb-8">
          <LinearGradient
            colors={isPending ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
            className="w-32 h-32 rounded-full items-center justify-center"
          >
            {isPending ? (
              <Clock size={60} color="#fff" />
            ) : (
              <CheckCircle2 size={60} color="#fff" />
            )}
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.Text
          entering={SlideInUp.delay(300)}
          className="text-white text-3xl font-bold text-center mb-2"
        >
          {isPending ? 'Order Received!' : 'Order Confirmed!'}
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          entering={SlideInUp.delay(400)}
          className="text-slate-400 text-center text-lg mb-8"
        >
          {isPending
            ? 'We\'ll process your order once payment is confirmed'
            : 'Thank you for your purchase'}
        </Animated.Text>

        {/* Order Number */}
        <Animated.View
          entering={SlideInUp.delay(500)}
          className="bg-slate-800 rounded-xl p-6 w-full mb-8"
        >
          <Text className="text-slate-400 text-center mb-2">Order Number</Text>
          <Text className="text-emerald-400 text-2xl font-bold text-center">
            {orderNumber}
          </Text>

          {isPending && (
            <View className="mt-4 bg-yellow-500/20 rounded-lg p-3">
              <Text className="text-yellow-400 text-center text-sm">
                ⏳ Awaiting payment confirmation
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Info Cards */}
        <Animated.View entering={SlideInUp.delay(600)} className="w-full space-y-3">
          <View className="bg-slate-800/50 rounded-xl p-4 flex-row items-center">
            <View className="bg-emerald-500/20 p-2 rounded-full">
              <Package size={20} color="#10b981" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white font-medium">Order Processing</Text>
              <Text className="text-slate-400 text-sm">
                We'll notify you when your order ships
              </Text>
            </View>
          </View>

          <View className="bg-slate-800/50 rounded-xl p-4 flex-row items-center">
            <View className="bg-blue-500/20 p-2 rounded-full">
              <Text className="text-xl">📧</Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-white font-medium">Confirmation Email</Text>
              <Text className="text-slate-400 text-sm">
                Check your inbox for order details
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Actions */}
        <Animated.View entering={SlideInUp.delay(700)} className="w-full mt-8 space-y-3">
          <TouchableOpacity
            onPress={() => router.push('/orders')}
            className="bg-slate-800 py-4 rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-white font-bold">View My Orders</Text>
            <ArrowRight size={18} color="#fff" className="ml-2" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/store')}
            className="bg-emerald-500 py-4 rounded-xl items-center justify-center"
          >
            <Text className="text-white font-bold">Continue Shopping</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

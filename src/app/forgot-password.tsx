/**
 * Forgot Password Screen
 *
 * Allows users to request a password reset email.
 */

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Mail, ChevronLeft, Send, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Basic email validation
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleResetPassword = async () => {
    if (!isEmailValid) return;

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await resetPassword(email.trim());

      if (result.error) {
        setError(result.error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900">
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeInUp.springify()} className="items-center">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle color="#10b981" size={48} />
            </View>
            <Text className="mb-2 text-2xl font-bold text-white">Check Your Email</Text>
            <Text className="mb-8 text-center text-slate-400">
              We've sent a password reset link to{'\n'}
              <Text className="font-medium text-white">{email}</Text>
            </Text>
            <Text className="mb-8 text-center text-sm text-slate-500">
              Didn't receive the email? Check your spam folder{'\n'}or try again with a different
              email.
            </Text>

            <Pressable
              onPress={() => router.replace('/login')}
              className="flex-row items-center rounded-xl bg-slate-800 px-6 py-3"
            >
              <ArrowLeft size={18} color="#10b981" />
              <Text className="ml-2 font-semibold text-emerald-400">Back to Sign In</Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(50).springify()} className="px-6 pt-4">
            <Pressable
              onPress={() => router.back()}
              className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-slate-800"
            >
              <ChevronLeft color="#fff" size={24} />
            </Pressable>
          </Animated.View>

          <View className="flex-1 justify-center px-6 pb-8">
            {/* Icon */}
            <Animated.View
              entering={FadeInDown.delay(100).springify()}
              className="mb-6 items-center"
            >
              <View className="h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                <Mail color="#10b981" size={40} />
              </View>
            </Animated.View>

            {/* Title */}
            <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-8">
              <Text className="text-center text-3xl font-bold text-white">Forgot Password?</Text>
              <Text className="mt-2 text-center text-slate-400">
                No worries! Enter your email and we'll send you{'\n'}instructions to reset your
                password.
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeInDown.springify()}
                className="mb-4 rounded-lg bg-red-500/20 px-4 py-3"
              >
                <Text className="text-center text-sm text-red-400">{error}</Text>
              </Animated.View>
            )}

            {/* Email Input */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-6">
              <Text className="mb-2 text-sm font-medium text-slate-300">Email Address</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-4">
                <Mail size={20} color="#64748b" />
                <TextInput
                  className="ml-3 flex-1 text-base text-white"
                  placeholder="Enter your email"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  autoFocus
                />
              </View>
            </Animated.View>

            {/* Reset Button */}
            <Animated.View entering={FadeInDown.delay(250).springify()}>
              <Pressable
                onPress={handleResetPassword}
                disabled={!isEmailValid || isLoading}
                className="overflow-hidden rounded-xl"
              >
                <LinearGradient
                  colors={
                    isEmailValid && !isLoading ? ['#10b981', '#059669'] : ['#334155', '#1e293b']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Send size={20} color="#fff" />
                      <Text className="ml-2 text-lg font-semibold text-white">
                        Send Reset Link
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Back to Sign In */}
            <Animated.View entering={FadeInDown.delay(300).springify()} className="mt-6">
              <View className="flex-row items-center justify-center">
                <Text className="text-slate-400">Remember your password? </Text>
                <Link href="/login" asChild>
                  <Pressable>
                    <Text className="font-semibold text-emerald-400">Sign In</Text>
                  </Pressable>
                </Link>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/**
 * Login Screen
 *
 * User authentication with email and password.
 * Integrates with Supabase Auth.
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
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { useSubscriptionStore } from '@/lib/state/subscription-store';
import { isSupabaseConfigured } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const markLoginComplete = useSubscriptionStore((s) => s.markLoginComplete);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demo credentials for testing when Supabase is not configured
  const DEMO_EMAIL = 'demo@calistheniccommando.co.uk';
  const DEMO_PASSWORD = 'Demo@12345';

  const isFormValid = email.trim() && password.trim();

  const handleLogin = async () => {
    if (!isFormValid) return;

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // If Supabase is not configured, use demo login
    if (!isSupabaseConfigured()) {
      setTimeout(() => {
        if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
          markLoginComplete();
          router.replace('/onboarding');
        } else {
          setError('Invalid email or password. Use demo credentials.');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setIsLoading(false);
      }, 500);
      return;
    }

    // Real Supabase authentication
    try {
      const result = await signIn(email.trim(), password);

      if (result.error) {
        setError(result.error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        markLoginComplete();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // The auth state change will trigger navigation in _layout.tsx
        router.replace('/onboarding');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/signup');
  };

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
          <View className="flex-1 justify-center px-6 py-8">
            {/* Header */}
            <Animated.View entering={FadeInDown.delay(50).springify()} className="mb-10 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
                <Shield color="#10b981" size={40} />
              </View>
              <Text className="text-3xl font-bold text-white">Welcome Back</Text>
              <Text className="mt-2 text-center text-slate-400">
                Sign in to continue your fitness journey
              </Text>
            </Animated.View>

            {/* Demo Mode Notice */}
            {!isSupabaseConfigured() && (
              <Animated.View
                entering={FadeInDown.delay(75).springify()}
                className="mb-4 rounded-lg bg-amber-500/20 px-4 py-3"
              >
                <Text className="text-center text-xs text-amber-400">
                  Demo Mode: Use {DEMO_EMAIL} / {DEMO_PASSWORD}
                </Text>
              </Animated.View>
            )}

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
            <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Email</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
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
                />
              </View>
            </Animated.View>

            {/* Password Input */}
            <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-2">
              <Text className="mb-2 text-sm font-medium text-slate-300">Password</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                <Lock size={20} color="#64748b" />
                <TextInput
                  className="ml-3 flex-1 text-base text-white"
                  placeholder="Enter your password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Forgot Password Link */}
            <Animated.View entering={FadeInDown.delay(175).springify()} className="mb-6">
              <Link href="/forgot-password" asChild>
                <Pressable className="self-end">
                  <Text className="text-sm text-emerald-400">Forgot Password?</Text>
                </Pressable>
              </Link>
            </Animated.View>

            {/* Login Button */}
            <Animated.View entering={FadeInDown.delay(200).springify()}>
              <Pressable
                onPress={handleLogin}
                disabled={!isFormValid || isLoading}
                className="overflow-hidden rounded-xl"
              >
                <LinearGradient
                  colors={
                    isFormValid && !isLoading ? ['#10b981', '#059669'] : ['#334155', '#1e293b']
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
                      <Text className="mr-2 text-lg font-semibold text-white">Sign In</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Divider */}
            <Animated.View
              entering={FadeInDown.delay(250).springify()}
              className="my-6 flex-row items-center"
            >
              <View className="flex-1 border-b border-slate-700" />
              <Text className="mx-4 text-xs text-slate-500">OR</Text>
              <View className="flex-1 border-b border-slate-700" />
            </Animated.View>

            {/* Sign Up Button */}
            <Animated.View entering={FadeInDown.delay(300).springify()}>
              <Pressable
                onPress={handleGetStarted}
                disabled={isLoading}
                className="flex-row items-center justify-center rounded-xl border border-emerald-500/50 bg-emerald-500/10 px-6 py-4"
              >
                <Text className="mr-2 text-lg font-semibold text-emerald-400">
                  Create New Account
                </Text>
                <ArrowRight size={20} color="#10b981" />
              </Pressable>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(350).springify()}>
              <Text className="mt-4 text-center text-xs text-slate-500">
                New to Calisthenic Commando? Create an account to get started.
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

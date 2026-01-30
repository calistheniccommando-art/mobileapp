/**
 * Sign Up Screen
 *
 * New user registration with email and password.
 * Creates Supabase auth account and database profile.
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
import {
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ChevronLeft,
  Shield,
  CheckCircle,
} from 'lucide-react-native';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/cn';

// Password requirements
const PASSWORD_REQUIREMENTS = [
  { id: 'length', label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { id: 'uppercase', label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'lowercase', label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'number', label: 'One number', test: (p: string) => /[0-9]/.test(p) },
];

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Validate password
  const passwordValid = PASSWORD_REQUIREMENTS.every((req) => req.test(password));
  const passwordsMatch = password === confirmPassword && password.length > 0;

  // Form validation
  const isFormValid =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    passwordValid &&
    passwordsMatch;

  const handleSignUp = async () => {
    if (!isFormValid) return;

    setError(null);
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const result = await signUp(email.trim(), password);

      if (result.error) {
        setError(result.error.message);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        setSuccess(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Wait a moment then redirect
        setTimeout(() => {
          router.replace('/onboarding');
        }, 2000);
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
            <Text className="mb-2 text-2xl font-bold text-white">Account Created!</Text>
            <Text className="text-center text-slate-400">
              Welcome to Calisthenic Commando.{'\n'}Redirecting to your personalized setup...
            </Text>
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

          <View className="flex-1 px-6 pb-8">
            {/* Title */}
            <Animated.View entering={FadeInDown.delay(100).springify()} className="mb-8">
              <Text className="text-3xl font-bold text-white">Create Account</Text>
              <Text className="mt-2 text-slate-400">
                Join the commando squad and transform your body
              </Text>
            </Animated.View>

            {/* Error Message */}
            {error && (
              <Animated.View
                entering={FadeInDown.springify()}
                className="mb-4 rounded-lg bg-red-500/20 px-4 py-3"
              >
                <Text className="text-sm text-red-400">{error}</Text>
              </Animated.View>
            )}

            {/* Name Row */}
            <Animated.View entering={FadeInDown.delay(150).springify()} className="mb-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-2 text-sm font-medium text-slate-300">First Name</Text>
                <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                  <User size={18} color="#64748b" />
                  <TextInput
                    className="ml-3 flex-1 text-base text-white"
                    placeholder="John"
                    placeholderTextColor="#475569"
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              <View className="flex-1">
                <Text className="mb-2 text-sm font-medium text-slate-300">Last Name</Text>
                <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                  <TextInput
                    className="flex-1 text-base text-white"
                    placeholder="Doe"
                    placeholderTextColor="#475569"
                    value={lastName}
                    onChangeText={setLastName}
                    editable={!isLoading}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            </Animated.View>

            {/* Email */}
            <Animated.View entering={FadeInDown.delay(200).springify()} className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Email</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                <Mail size={18} color="#64748b" />
                <TextInput
                  className="ml-3 flex-1 text-base text-white"
                  placeholder="john@example.com"
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

            {/* Password */}
            <Animated.View entering={FadeInDown.delay(250).springify()} className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Password</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3">
                <Lock size={18} color="#64748b" />
                <TextInput
                  className="ml-3 flex-1 text-base text-white"
                  placeholder="Create a strong password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={18} color="#64748b" />
                  ) : (
                    <Eye size={18} color="#64748b" />
                  )}
                </Pressable>
              </View>

              {/* Password Requirements */}
              {password.length > 0 && (
                <View className="mt-3 rounded-lg bg-slate-800/50 p-3">
                  {PASSWORD_REQUIREMENTS.map((req) => (
                    <View key={req.id} className="mb-1 flex-row items-center">
                      <View
                        className={cn(
                          'mr-2 h-4 w-4 items-center justify-center rounded-full',
                          req.test(password) ? 'bg-emerald-500' : 'bg-slate-600'
                        )}
                      >
                        {req.test(password) && <CheckCircle size={10} color="#fff" />}
                      </View>
                      <Text
                        className={cn(
                          'text-xs',
                          req.test(password) ? 'text-emerald-400' : 'text-slate-500'
                        )}
                      >
                        {req.label}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>

            {/* Confirm Password */}
            <Animated.View entering={FadeInDown.delay(300).springify()} className="mb-6">
              <Text className="mb-2 text-sm font-medium text-slate-300">Confirm Password</Text>
              <View
                className={cn(
                  'flex-row items-center rounded-xl border bg-slate-800/50 px-4 py-3',
                  confirmPassword.length > 0 && !passwordsMatch
                    ? 'border-red-500'
                    : confirmPassword.length > 0 && passwordsMatch
                      ? 'border-emerald-500'
                      : 'border-slate-700'
                )}
              >
                <Lock size={18} color="#64748b" />
                <TextInput
                  className="ml-3 flex-1 text-base text-white"
                  placeholder="Confirm your password"
                  placeholderTextColor="#475569"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? (
                    <EyeOff size={18} color="#64748b" />
                  ) : (
                    <Eye size={18} color="#64748b" />
                  )}
                </Pressable>
              </View>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <Text className="mt-1 text-xs text-red-400">Passwords do not match</Text>
              )}
            </Animated.View>

            {/* Sign Up Button */}
            <Animated.View entering={FadeInDown.delay(350).springify()}>
              <Pressable
                onPress={handleSignUp}
                disabled={!isFormValid || isLoading}
                className="overflow-hidden rounded-xl"
              >
                <LinearGradient
                  colors={
                    isFormValid && !isLoading
                      ? ['#10b981', '#059669']
                      : ['#334155', '#1e293b']
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
                      <Text className="mr-2 text-lg font-semibold text-white">Create Account</Text>
                      <ArrowRight size={20} color="#fff" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </Animated.View>

            {/* Terms */}
            <Animated.View entering={FadeInDown.delay(400).springify()} className="mt-4">
              <Text className="text-center text-xs text-slate-500">
                By creating an account, you agree to our{' '}
                <Text className="text-emerald-400">Terms of Service</Text> and{' '}
                <Text className="text-emerald-400">Privacy Policy</Text>
              </Text>
            </Animated.View>

            {/* Sign In Link */}
            <Animated.View entering={FadeInDown.delay(450).springify()} className="mt-6">
              <View className="flex-row items-center justify-center">
                <Text className="text-slate-400">Already have an account? </Text>
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

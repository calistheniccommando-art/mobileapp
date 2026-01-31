/**
 * ADMIN LOGIN SCREEN
 * Secure login for admin dashboard access
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Shield, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { adminAuthService } from '@/lib/supabase/admin-auth';

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await adminAuthService.signIn(email.trim().toLowerCase(), password);

      if (result.error) {
        // Handle specific error messages
        if (result.error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (result.error.message.includes('Access denied')) {
          setError('Access denied. You do not have admin privileges.');
        } else {
          setError(result.error.message);
        }
        return;
      }

      if (result.user) {
        // Successfully logged in as admin - navigate to dashboard
        router.replace('/admin');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToApp = () => {
    router.replace('/login');
  };

  return (
    <View className="flex-1 bg-slate-950">
      <LinearGradient
        colors={['#0f172a', '#020617', '#0f172a']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="absolute inset-0"
      />

      {/* Background decorations */}
      <View className="absolute inset-0 overflow-hidden">
        <View className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <View className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="flex-1 items-center justify-center px-6">
          {/* Back button */}
          <Animated.View 
            entering={FadeIn.delay(100)}
            className="absolute left-6 top-12"
          >
            <Pressable
              onPress={handleBackToApp}
              className="flex-row items-center rounded-xl bg-slate-800/50 px-4 py-2"
            >
              <ArrowLeft size={18} color="#94a3b8" />
              <Text className="ml-2 text-sm text-slate-400">Back to App</Text>
            </Pressable>
          </Animated.View>

          {/* Login card */}
          <Animated.View 
            entering={FadeInDown.duration(600)}
            className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/90 p-8"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 20 },
              shadowOpacity: 0.25,
              shadowRadius: 50,
            }}
          >
            {/* Logo and title */}
            <View className="mb-8 items-center">
              <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-violet-500/20">
                <Shield size={40} color="#8b5cf6" />
              </View>
              <Text className="text-2xl font-bold text-white">Admin Portal</Text>
              <Text className="mt-2 text-center text-slate-400">
                Sign in to access the admin dashboard
              </Text>
            </View>

            {/* Error message */}
            {error && (
              <Animated.View 
                entering={FadeIn}
                className="mb-4 flex-row items-center rounded-xl bg-rose-500/10 p-4"
              >
                <AlertCircle size={20} color="#f43f5e" />
                <Text className="ml-3 flex-1 text-sm text-rose-400">{error}</Text>
              </Animated.View>
            )}

            {/* Email input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm font-medium text-slate-300">Email</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4">
                <Mail size={20} color="#64748b" />
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setError(null);
                  }}
                  placeholder="admin@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="flex-1 py-4 pl-3 text-white"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password input */}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-slate-300">Password</Text>
              <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4">
                <Lock size={20} color="#64748b" />
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  className="flex-1 py-4 pl-3 text-white"
                  editable={!isLoading}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )}
                </Pressable>
              </View>
            </View>

            {/* Login button */}
            <Pressable
              onPress={handleLogin}
              disabled={isLoading}
              className="overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={isLoading ? ['#4b5563', '#374151'] : ['#8b5cf6', '#6d28d9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="flex-row items-center justify-center py-4"
              >
                {isLoading ? (
                  <>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text className="ml-2 text-base font-semibold text-white">
                      Signing in...
                    </Text>
                  </>
                ) : (
                  <>
                    <Shield size={20} color="#fff" />
                    <Text className="ml-2 text-base font-semibold text-white">
                      Sign In to Admin
                    </Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>

            {/* Security notice */}
            <View className="mt-6 items-center">
              <View className="flex-row items-center">
                <View className="h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="ml-2 text-xs text-slate-500">
                  Secure admin access • All actions are logged
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View 
            entering={FadeIn.delay(300)}
            className="mt-8 items-center"
          >
            <Text className="text-xs text-slate-600">
              Calisthenic Commando Admin v1.0
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

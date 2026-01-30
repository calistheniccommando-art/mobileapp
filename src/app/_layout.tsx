import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import {
  useFonts,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
} from '@expo-google-fonts/outfit';
import { useOnboardingCompleted } from '@/lib/state/user-store';
import { useIsComplete as useCommandoComplete } from '@/lib/state/commando-store';
import { useSubscriptionStore } from '@/lib/state/subscription-store';
import { AuthProvider, useAuth, useAuthLoading } from '@/lib/auth/auth-context';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Custom dark theme for fitness app
const FitnessTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#10b981',
    background: '#0f172a',
    card: '#1e293b',
    text: '#ffffff',
    border: '#334155',
    notification: '#10b981',
  },
};

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated } = useAuth();
  const authLoading = useAuthLoading();
  const legacyOnboardingCompleted = useOnboardingCompleted();
  const commandoOnboardingComplete = useCommandoComplete();
  const canAccessApp = useSubscriptionStore((s) => s.canAccessApp());
  const hasSeenWelcome = useSubscriptionStore((s) => s.hasSeenWelcome);
  const hasSeenLanding = useSubscriptionStore((s) => s.hasSeenLanding);
  const hasCompletedLogin = useSubscriptionStore((s) => s.hasCompletedLogin);
  const [isReady, setIsReady] = useState(false);

  // Use either legacy or commando onboarding completion status
  const onboardingCompleted = legacyOnboardingCompleted || commandoOnboardingComplete;
  
  // Consider user logged in if either Supabase auth or legacy login is complete
  const isLoggedIn = isAuthenticated || hasCompletedLogin;

  useEffect(() => {
    // Small delay to ensure store is hydrated and auth is loaded
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Wait for both store hydration and auth loading
    if (!isReady || authLoading) return;

    const currentRoute = segments[0];
    const inLogin = currentRoute === 'login';
    const inSignup = currentRoute === 'signup';
    const inForgotPassword = currentRoute === 'forgot-password';
    const inOnboarding = currentRoute === 'onboarding';
    const inPaywall = currentRoute === 'paywall';
    const inWelcome = currentRoute === 'welcome';
    const inLanding = currentRoute === 'landing';
    const inAdmin = currentRoute === 'admin';
    const inTabs = currentRoute === '(tabs)';
    const inAuthFlow = inLogin || inSignup || inForgotPassword;

    // Admin routes bypass all auth checks
    if (inAdmin) {
      return;
    }

    // Determine the correct destination based on state
    let destination: string | null = null;

    // Web-only: Show landing page first
    if (Platform.OS === 'web' && !hasSeenLanding) {
      if (!inLanding) destination = '/landing';
    } else if (!isLoggedIn) {
      // User needs to login or signup
      if (!inAuthFlow && !inLanding) destination = '/login';
    } else if (!onboardingCompleted) {
      // User hasn't completed onboarding, send to onboarding
      if (!inOnboarding) destination = '/onboarding';
    } else if (!canAccessApp) {
      // User completed onboarding but hasn't paid, send to paywall
      if (!inPaywall) destination = '/paywall';
    } else if (!hasSeenWelcome) {
      // User just paid, show welcome screen
      if (!inWelcome) destination = '/welcome';
    } else if (inPaywall || inOnboarding || inWelcome || inAuthFlow || inLanding) {
      // User has completed everything, send to main app
      destination = '/(tabs)';
    }

    // Only navigate if we have a destination and it's different from current
    if (destination) {
      router.replace(destination as any);
    }
  }, [onboardingCompleted, canAccessApp, hasSeenWelcome, hasSeenLanding, isLoggedIn, segments, isReady, authLoading]);

  return (
    <ThemeProvider value={FitnessTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="landing" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
        <Stack.Screen name="paywall" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen
          name="exercise/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="meal/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="workout/[id]"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="pdf-preview"
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="weekly-plan"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="exercise-session"
          options={{
            presentation: 'fullScreenModal',
            headerShown: false,
            animation: 'slide_from_bottom',
          }}
        />
        <Stack.Screen
          name="fasting-detail"
          options={{
            presentation: 'card',
            headerShown: false,
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <KeyboardProvider>
            <StatusBar style="light" />
            <RootLayoutNav />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </AuthProvider>
    </QueryClientProvider>
  );
}
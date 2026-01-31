/**
 * ERROR BOUNDARY COMPONENT
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs them to Sentry, and displays a fallback UI.
 */

import React, { Component, ReactNode } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { sentry } from '@/lib/monitoring/sentry';

// ==================== TYPES ====================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showDetails?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  eventId: string | null;
}

// ==================== COMPONENT ====================

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  async componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to Sentry
    const eventId = await sentry.captureException(error, {
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });

    this.setState({
      errorInfo,
      eventId,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleGoHome = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
    router.replace('/(tabs)');
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className="flex-1 bg-slate-900">
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#0f172a']}
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}
          >
            {/* Error Icon */}
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle size={48} color="#ef4444" />
            </View>

            {/* Title */}
            <Text className="mb-2 text-center text-2xl font-bold text-white">
              Oops! Something went wrong
            </Text>

            {/* Description */}
            <Text className="mb-8 text-center text-base text-white/60">
              We've been notified and are working on a fix. Try again or go back home.
            </Text>

            {/* Error ID */}
            {this.state.eventId && (
              <View className="mb-6 rounded-lg bg-white/5 px-4 py-2">
                <Text className="text-xs text-white/40">
                  Error ID: {this.state.eventId.slice(0, 8)}
                </Text>
              </View>
            )}

            {/* Buttons */}
            <View className="w-full gap-3">
              <Pressable
                onPress={this.handleRetry}
                className="flex-row items-center justify-center rounded-xl bg-emerald-600 py-4"
              >
                <RefreshCw size={20} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">Try Again</Text>
              </Pressable>

              <Pressable
                onPress={this.handleGoHome}
                className="flex-row items-center justify-center rounded-xl border border-white/20 bg-white/5 py-4"
              >
                <Home size={20} color="white" />
                <Text className="ml-2 text-base font-semibold text-white">Go Home</Text>
              </Pressable>
            </View>

            {/* Error Details (Development Only) */}
            {(this.props.showDetails || __DEV__) && this.state.error && (
              <ScrollView
                className="mt-8 max-h-48 w-full rounded-lg bg-red-950/50 p-4"
                showsVerticalScrollIndicator={false}
              >
                <View className="mb-2 flex-row items-center">
                  <Bug size={14} color="#fca5a5" />
                  <Text className="ml-2 text-sm font-semibold text-red-300">
                    {this.state.error.name}
                  </Text>
                </View>
                <Text className="mb-2 text-sm text-red-200">
                  {this.state.error.message}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text className="text-xs text-red-300/60">
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                    {this.state.errorInfo.componentStack.length > 500 && '...'}
                  </Text>
                )}
              </ScrollView>
            )}
          </LinearGradient>
        </View>
      );
    }

    return this.props.children;
  }
}

// ==================== FUNCTIONAL WRAPPER ====================

/**
 * HOC to wrap a component with ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const ComponentWithErrorBoundary: React.FC<P> = (props) => {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return ComponentWithErrorBoundary;
}

// ==================== SCREEN ERROR BOUNDARY ====================

/**
 * Error boundary specifically for screens with navigation
 */
export function ScreenErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error) => {
        // Add breadcrumb for screen error
        sentry.addBreadcrumb({
          type: 'error',
          category: 'screen',
          message: `Screen error: ${error.message}`,
          level: 'error',
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ==================== EXPORTS ====================

export default ErrorBoundary;

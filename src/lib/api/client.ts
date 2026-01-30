/**
 * API CLIENT
 *
 * Central API client for all backend communication.
 * Handles authentication, request/response transformation, error handling, and caching.
 */

import type {
  APIResponse,
  AuthLoginRequest,
  AuthLoginResponse,
  AuthRefreshRequest,
  AuthRefreshResponse,
  CreateUserProfileRequest,
  UpdateUserProfileRequest,
  UserProfileResponse,
  GetDailyPlanRequest,
  DailyPlanResponse,
  GetWeeklyPlanRequest,
  WeeklyPlanResponse,
  GeneratePDFRequest,
  GeneratePDFResponse,
  LogWorkoutProgressRequest,
  LogMealProgressRequest,
  LogFastingProgressRequest,
  ProgressSummaryResponse,
  APIErrorCode,
} from './types';
import { API_ERROR_CODES } from './types';

// ==================== CONFIGURATION ====================

export interface APIClientConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  onAuthError?: () => void;
  onNetworkError?: () => void;
}

const DEFAULT_CONFIG: APIClientConfig = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.fitlife.app',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ==================== TOKEN MANAGEMENT ====================

interface TokenStore {
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: string | null;
}

let tokenStore: TokenStore = {
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
};

export function setTokens(tokens: Partial<TokenStore>) {
  tokenStore = { ...tokenStore, ...tokens };
}

export function clearTokens() {
  tokenStore = { accessToken: null, refreshToken: null, expiresAt: null };
}

export function getAccessToken(): string | null {
  return tokenStore.accessToken;
}

function isTokenExpired(): boolean {
  if (!tokenStore.expiresAt) return true;
  return new Date(tokenStore.expiresAt) <= new Date();
}

// ==================== API CLIENT CLASS ====================

class APIClient {
  private config: APIClientConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // -------------------- Core Request Methods --------------------

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    endpoint: string,
    options: {
      body?: unknown;
      params?: Record<string, string | number | boolean | undefined>;
      requireAuth?: boolean;
      skipRetry?: boolean;
    } = {}
  ): Promise<APIResponse<T>> {
    const { body, params, requireAuth = true, skipRetry = false } = options;

    // Handle token refresh if needed
    if (requireAuth && isTokenExpired() && tokenStore.refreshToken) {
      const refreshed = await this.handleTokenRefresh();
      if (!refreshed) {
        return this.createErrorResponse(API_ERROR_CODES.AUTH_TOKEN_EXPIRED, 'Session expired');
      }
    }

    // Build URL with query params
    let url = `${this.config.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Platform': 'mobile',
    };

    if (requireAuth && tokenStore.accessToken) {
      headers['Authorization'] = `Bearer ${tokenStore.accessToken}`;
    }

    // Make request with retry logic
    let lastError: Error | null = null;
    const attempts = skipRetry ? 1 : this.config.retryAttempts;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Parse response
        const data = await response.json();

        // Handle HTTP errors
        if (!response.ok) {
          // Handle auth errors
          if (response.status === 401) {
            this.config.onAuthError?.();
            return this.createErrorResponse(
              API_ERROR_CODES.AUTH_TOKEN_INVALID,
              data.message ?? 'Authentication failed'
            );
          }

          return {
            success: false,
            error: {
              code: data.code ?? 'UNKNOWN_ERROR',
              message: data.message ?? 'An error occurred',
              details: data.details,
              retryable: response.status >= 500,
            },
          };
        }

        return {
          success: true,
          data: data.data ?? data,
          meta: data.meta,
        };
      } catch (error) {
        lastError = error as Error;

        // Don't retry on abort or non-retryable errors
        if ((error as Error).name === 'AbortError') {
          return this.createErrorResponse(
            API_ERROR_CODES.SYSTEM_SERVICE_UNAVAILABLE,
            'Request timed out'
          );
        }

        // Wait before retry
        if (attempt < attempts - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }

    // All retries failed
    this.config.onNetworkError?.();
    return this.createErrorResponse(
      API_ERROR_CODES.SYSTEM_SERVICE_UNAVAILABLE,
      lastError?.message ?? 'Network error'
    );
  }

  private async handleTokenRefresh(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing) {
      return this.refreshPromise ?? Promise.resolve(false);
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    const result = await this.refreshPromise;
    this.isRefreshing = false;
    this.refreshPromise = null;

    return result;
  }

  private async performTokenRefresh(): Promise<boolean> {
    if (!tokenStore.refreshToken) return false;

    try {
      const response = await this.request<AuthRefreshResponse>(
        'POST',
        '/auth/refresh',
        {
          body: { refreshToken: tokenStore.refreshToken },
          requireAuth: false,
          skipRetry: true,
        }
      );

      if (response.success && response.data) {
        setTokens({
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          expiresAt: response.data.expiresAt,
        });
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  private createErrorResponse<T>(code: APIErrorCode, message: string): APIResponse<T> {
    return {
      success: false,
      error: {
        code,
        message,
        retryable: false,
      },
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // -------------------- Auth Endpoints --------------------

  async login(request: AuthLoginRequest): Promise<APIResponse<AuthLoginResponse>> {
    const response = await this.request<AuthLoginResponse>('POST', '/auth/login', {
      body: request,
      requireAuth: false,
    });

    if (response.success && response.data) {
      setTokens({
        accessToken: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        expiresAt: response.data.expiresAt,
      });
    }

    return response;
  }

  async logout(): Promise<APIResponse<void>> {
    const response = await this.request<void>('POST', '/auth/logout');
    clearTokens();
    return response;
  }

  async refreshToken(request: AuthRefreshRequest): Promise<APIResponse<AuthRefreshResponse>> {
    return this.request<AuthRefreshResponse>('POST', '/auth/refresh', {
      body: request,
      requireAuth: false,
    });
  }

  // -------------------- User Endpoints --------------------

  async createProfile(
    request: CreateUserProfileRequest
  ): Promise<APIResponse<UserProfileResponse>> {
    return this.request<UserProfileResponse>('POST', '/user/profile', { body: request });
  }

  async getProfile(): Promise<APIResponse<UserProfileResponse>> {
    return this.request<UserProfileResponse>('GET', '/user/profile');
  }

  async updateProfile(
    request: UpdateUserProfileRequest
  ): Promise<APIResponse<UserProfileResponse>> {
    return this.request<UserProfileResponse>('PATCH', '/user/profile', { body: request });
  }

  async deleteProfile(): Promise<APIResponse<void>> {
    return this.request<void>('DELETE', '/user/profile');
  }

  // -------------------- Daily Plan Endpoints --------------------

  async getDailyPlan(request: GetDailyPlanRequest): Promise<APIResponse<DailyPlanResponse>> {
    return this.request<DailyPlanResponse>('GET', '/plans/daily', {
      params: {
        date: request.date,
        includeWorkout: request.includeWorkout,
        includeMeals: request.includeMeals,
        includeFasting: request.includeFasting,
      },
    });
  }

  async getWeeklyPlan(request: GetWeeklyPlanRequest): Promise<APIResponse<WeeklyPlanResponse>> {
    return this.request<WeeklyPlanResponse>('GET', '/plans/weekly', {
      params: { startDate: request.startDate },
    });
  }

  // -------------------- Progress Endpoints --------------------

  async logWorkoutProgress(
    request: LogWorkoutProgressRequest
  ): Promise<APIResponse<void>> {
    return this.request<void>('POST', '/progress/workout', { body: request });
  }

  async logMealProgress(request: LogMealProgressRequest): Promise<APIResponse<void>> {
    return this.request<void>('POST', '/progress/meal', { body: request });
  }

  async logFastingProgress(
    request: LogFastingProgressRequest
  ): Promise<APIResponse<void>> {
    return this.request<void>('POST', '/progress/fasting', { body: request });
  }

  async getProgressSummary(
    period: 'day' | 'week' | 'month'
  ): Promise<APIResponse<ProgressSummaryResponse>> {
    return this.request<ProgressSummaryResponse>('GET', '/progress/summary', {
      params: { period },
    });
  }

  // -------------------- PDF Endpoints --------------------

  async generatePDF(request: GeneratePDFRequest): Promise<APIResponse<GeneratePDFResponse>> {
    return this.request<GeneratePDFResponse>('POST', '/pdf/generate', { body: request });
  }

  // -------------------- Content Endpoints --------------------

  async getWorkout(workoutId: string): Promise<APIResponse<unknown>> {
    return this.request('GET', `/content/workouts/${workoutId}`);
  }

  async getExercise(exerciseId: string): Promise<APIResponse<unknown>> {
    return this.request('GET', `/content/exercises/${exerciseId}`);
  }

  async getMeal(mealId: string): Promise<APIResponse<unknown>> {
    return this.request('GET', `/content/meals/${mealId}`);
  }

  async getFastingPlans(): Promise<APIResponse<unknown>> {
    return this.request('GET', '/content/fasting-plans');
  }
}

// ==================== SINGLETON EXPORT ====================

export const apiClient = new APIClient();

// ==================== HELPER HOOKS TYPES ====================

export type { APIClient };

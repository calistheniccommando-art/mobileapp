/**
 * ADMIN USER PROGRESS SCREEN
 * 
 * View individual user progress including:
 * - Workout completion history
 * - Meal tracking compliance
 * - Fasting sessions
 * - Overall statistics
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import {
  Users,
  Search,
  ChevronRight,
  Dumbbell,
  UtensilsCrossed,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  Activity,
  Flame,
  Target,
} from 'lucide-react-native';
import { supabase } from '@/lib/api/client';
import {
  fetchWorkoutProgress,
  fetchMealCompletions,
  fetchFastingSessions,
  type ProgressData,
  type MealCompletionData,
  type FastingSessionData,
} from '@/lib/supabase/sync';

// ==================== TYPES ====================

interface UserSummary {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  fitness_level: string | null;
  primary_goal: string | null;
  last_active_at?: string;
  workout_count?: number;
  streak?: number;
}

interface UserDetail extends UserSummary {
  workouts: ProgressData[];
  meals: MealCompletionData[];
  fasting: FastingSessionData[];
  stats: {
    totalWorkouts: number;
    totalExercises: number;
    totalMeals: number;
    fastingCompliance: number;
    currentStreak: number;
    longestStreak: number;
  };
}

// ==================== MAIN SCREEN ====================

export default function UserProgressScreen() {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    try {
      setError(null);
      
      const { data, error: fetchError } = await (supabase.from('users') as any)
        .select('id, email, full_name, created_at, fitness_level, primary_goal')
        .order('created_at', { ascending: false })
        .limit(100);

      if (fetchError) throw fetchError;

      // Enrich with activity data
      const enrichedUsers: UserSummary[] = await Promise.all(
        (data || []).map(async (user: any) => {
          const { count } = await (supabase.from('workout_progress') as any)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            ...user,
            workout_count: count || 0,
          };
        })
      );

      setUsers(enrichedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch user detail
  const fetchUserDetail = useCallback(async (userId: string) => {
    setIsLoadingUser(true);
    setError(null);

    try {
      const user = users.find((u) => u.id === userId);
      if (!user) throw new Error('User not found');

      // Fetch all user data in parallel
      const [workouts, meals, fasting] = await Promise.all([
        fetchWorkoutProgress(userId),
        fetchMealCompletions(userId),
        fetchFastingSessions(userId, 30),
      ]);

      // Calculate stats
      const totalWorkouts = new Set(workouts.map((w) => w.date)).size;
      const totalExercises = workouts.length;
      const totalMeals = meals.filter((m) => !m.skipped).length;
      const fastingCompliance = fasting.length > 0
        ? Math.round((fasting.filter((f) => f.completed).length / fasting.length) * 100)
        : 0;

      // Calculate streaks
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDates = [...new Set(workouts.map((w) => w.date))].sort().reverse();

      for (let i = 0; i < sortedDates.length; i++) {
        const date = new Date(sortedDates[i]);
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - i);

        if (date.toISOString().split('T')[0] === expectedDate.toISOString().split('T')[0]) {
          tempStreak++;
          currentStreak = tempStreak;
        } else {
          break;
        }
      }

      // Calculate longest streak
      tempStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const curr = new Date(sortedDates[i]);
        const prev = new Date(sortedDates[i - 1]);
        const diffDays = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);

        if (diffDays === 1) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);

      setSelectedUser({
        ...user,
        workouts,
        meals,
        fasting,
        stats: {
          totalWorkouts,
          totalExercises,
          totalMeals,
          fastingCompliance,
          currentStreak,
          longestStreak,
        },
      });
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setIsLoadingUser(false);
    }
  }, [users]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    if (selectedUser) {
      fetchUserDetail(selectedUser.id);
      setRefreshing(false);
    } else {
      fetchUsers();
    }
  };

  // Filter users by search
  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render user detail view
  if (selectedUser) {
    return (
      <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
        <Stack.Screen
          options={{
            title: 'User Progress',
            headerShown: false,
          }}
        />

        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-slate-800 px-4 py-4">
          <Pressable
            onPress={() => setSelectedUser(null)}
            className="flex-row items-center gap-2"
          >
            <ChevronLeft size={20} color="#94a3b8" />
            <Text className="text-slate-400">Back to Users</Text>
          </Pressable>
          <Pressable
            onPress={() => fetchUserDetail(selectedUser.id)}
            className="p-2"
          >
            <RefreshCw size={20} color="#94a3b8" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {isLoadingUser ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="large" color="#10b981" />
            </View>
          ) : (
            <UserDetailView user={selectedUser} />
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Render users list
  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={['top']}>
      <Stack.Screen
        options={{
          title: 'User Progress',
          headerShown: false,
        }}
      />

      {/* Header */}
      <View className="border-b border-slate-800 px-4 py-4">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Users size={20} color="#8b5cf6" />
          </View>
          <View>
            <Text className="text-lg font-bold text-white">User Progress</Text>
            <Text className="text-sm text-slate-400">{users.length} users</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-slate-800 rounded-xl px-4 py-2">
          <Search size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            placeholderTextColor="#64748b"
            className="flex-1 ml-3 text-white"
          />
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-4">
          <AlertCircle size={48} color="#ef4444" />
          <Text className="text-white font-medium mt-4">{error}</Text>
          <Pressable
            onPress={fetchUsers}
            className="mt-4 bg-slate-800 px-4 py-2 rounded-lg"
          >
            <Text className="text-white">Retry</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {filteredUsers.map((user) => (
            <UserListItem
              key={user.id}
              user={user}
              onPress={() => fetchUserDetail(user.id)}
            />
          ))}

          {filteredUsers.length === 0 && (
            <View className="items-center justify-center py-20">
              <Users size={48} color="#475569" />
              <Text className="text-slate-500 mt-4">No users found</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ==================== USER LIST ITEM ====================

function UserListItem({
  user,
  onPress,
}: {
  user: UserSummary;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800 active:bg-slate-800"
    >
      <View className="flex-row items-center gap-3 flex-1">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-slate-800">
          <Text className="text-lg font-bold text-white">
            {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-white font-medium" numberOfLines={1}>
            {user.full_name || 'No name'}
          </Text>
          <Text className="text-slate-500 text-sm" numberOfLines={1}>
            {user.email}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            {user.fitness_level && (
              <View className="bg-emerald-500/20 px-2 py-0.5 rounded">
                <Text className="text-emerald-400 text-xs">{user.fitness_level}</Text>
              </View>
            )}
            {user.workout_count !== undefined && user.workout_count > 0 && (
              <View className="bg-violet-500/20 px-2 py-0.5 rounded flex-row items-center gap-1">
                <Dumbbell size={10} color="#8b5cf6" />
                <Text className="text-violet-400 text-xs">{user.workout_count}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
      <ChevronRight size={20} color="#475569" />
    </Pressable>
  );
}

// ==================== USER DETAIL VIEW ====================

function UserDetailView({ user }: { user: UserDetail }) {
  return (
    <View className="p-4">
      {/* User Info */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-slate-700">
            <Text className="text-2xl font-bold text-white">
              {user.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">
              {user.full_name || 'No name'}
            </Text>
            <Text className="text-slate-400">{user.email}</Text>
            <View className="flex-row items-center gap-2 mt-2">
              {user.fitness_level && (
                <View className="bg-emerald-500/20 px-2 py-1 rounded">
                  <Text className="text-emerald-400 text-xs">{user.fitness_level}</Text>
                </View>
              )}
              {user.primary_goal && (
                <View className="bg-amber-500/20 px-2 py-1 rounded">
                  <Text className="text-amber-400 text-xs">{user.primary_goal.replace('_', ' ')}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap gap-3 mb-4">
        <StatCard
          icon={<Dumbbell size={20} color="#10b981" />}
          label="Workouts"
          value={user.stats.totalWorkouts.toString()}
          color="emerald"
        />
        <StatCard
          icon={<Activity size={20} color="#8b5cf6" />}
          label="Exercises"
          value={user.stats.totalExercises.toString()}
          color="violet"
        />
        <StatCard
          icon={<UtensilsCrossed size={20} color="#f59e0b" />}
          label="Meals"
          value={user.stats.totalMeals.toString()}
          color="amber"
        />
        <StatCard
          icon={<Clock size={20} color="#06b6d4" />}
          label="Fasting"
          value={`${user.stats.fastingCompliance}%`}
          color="cyan"
        />
        <StatCard
          icon={<Flame size={20} color="#ef4444" />}
          label="Current Streak"
          value={`${user.stats.currentStreak} days`}
          color="red"
        />
        <StatCard
          icon={<Award size={20} color="#eab308" />}
          label="Best Streak"
          value={`${user.stats.longestStreak} days`}
          color="yellow"
        />
      </View>

      {/* Recent Workouts */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Dumbbell size={18} color="#10b981" />
          <Text className="text-white font-semibold">Recent Workouts</Text>
        </View>
        
        {user.workouts.length === 0 ? (
          <Text className="text-slate-500 text-center py-4">No workouts yet</Text>
        ) : (
          user.workouts.slice(0, 10).map((workout, idx) => (
            <View
              key={`${workout.date}-${idx}`}
              className="flex-row items-center justify-between py-2 border-b border-slate-700 last:border-0"
            >
              <View>
                <Text className="text-white">
                  {workout.exercise_id?.substring(0, 8) || 'Exercise'}
                </Text>
                <Text className="text-slate-500 text-xs">{workout.date}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                {workout.sets_completed && (
                  <Text className="text-emerald-400 text-sm">
                    {workout.sets_completed} sets
                  </Text>
                )}
                {workout.duration_seconds && (
                  <Text className="text-slate-400 text-sm">
                    {Math.floor(workout.duration_seconds / 60)}m
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent Fasting */}
      <View className="bg-slate-800 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <Clock size={18} color="#06b6d4" />
          <Text className="text-white font-semibold">Fasting Sessions</Text>
        </View>
        
        {user.fasting.length === 0 ? (
          <Text className="text-slate-500 text-center py-4">No fasting sessions</Text>
        ) : (
          user.fasting.slice(0, 5).map((session, idx) => (
            <View
              key={`${session.start_time}-${idx}`}
              className="flex-row items-center justify-between py-2 border-b border-slate-700 last:border-0"
            >
              <View>
                <Text className="text-white">{session.target_hours}h fast</Text>
                <Text className="text-slate-500 text-xs">
                  {new Date(session.start_time).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row items-center gap-2">
                {session.completed ? (
                  <View className="bg-emerald-500/20 px-2 py-1 rounded">
                    <Text className="text-emerald-400 text-xs">Completed</Text>
                  </View>
                ) : session.broken_early ? (
                  <View className="bg-red-500/20 px-2 py-1 rounded">
                    <Text className="text-red-400 text-xs">Broken</Text>
                  </View>
                ) : (
                  <View className="bg-slate-700 px-2 py-1 rounded">
                    <Text className="text-slate-400 text-xs">In Progress</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Member Since */}
      <View className="items-center py-4">
        <Text className="text-slate-500 text-sm">
          Member since {new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );
}

// ==================== STAT CARD ====================

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const bgColor = {
    emerald: 'bg-emerald-500/10',
    violet: 'bg-violet-500/10',
    amber: 'bg-amber-500/10',
    cyan: 'bg-cyan-500/10',
    red: 'bg-red-500/10',
    yellow: 'bg-yellow-500/10',
  }[color] || 'bg-slate-800';

  return (
    <View className={`${bgColor} rounded-xl p-3 flex-1`} style={{ minWidth: '45%' }}>
      <View className="flex-row items-center gap-2 mb-1">
        {icon}
        <Text className="text-slate-400 text-xs">{label}</Text>
      </View>
      <Text className="text-white text-lg font-bold">{value}</Text>
    </View>
  );
}

/**
 * ADMIN DASHBOARD - MAIN PAGE
 * Overview of all content management with quick stats and recent activity
 */

import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Users,
  Dumbbell,
  Utensils,
  Timer,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Play,
  Eye,
  Video,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { workoutPlans, meals, fastingWindows } from '@/data/mock-data';

// Stat card component
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  onPress,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: typeof Users;
  color: string;
  trend?: { value: number; isPositive: boolean };
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <View className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
        <View className="mb-4 flex-row items-center justify-between">
          <View
            className="h-12 w-12 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={24} color={color} />
          </View>
          {trend && (
            <View
              className={cn(
                'flex-row items-center rounded-full px-2 py-1',
                trend.isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              )}
            >
              <TrendingUp
                size={12}
                color={trend.isPositive ? '#10b981' : '#f43f5e'}
                style={{ transform: [{ rotate: trend.isPositive ? '0deg' : '180deg' }] }}
              />
              <Text
                className={cn(
                  'ml-1 text-xs font-medium',
                  trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
                )}
              >
                {trend.value}%
              </Text>
            </View>
          )}
        </View>
        <Text className="text-3xl font-bold text-white">{value}</Text>
        <Text className="text-sm text-slate-400">{title}</Text>
        {subtitle && <Text className="mt-1 text-xs text-slate-500">{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

// Status badge component
function StatusBadge({ status }: { status: 'pending' | 'approved' | 'live' | 'rejected' }) {
  const config = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Approved' },
    live: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', label: 'Live' },
    rejected: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Rejected' },
  };
  const { bg, text, label } = config[status];

  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>{label}</Text>
    </View>
  );
}

// Recent activity item
function ActivityItem({
  icon: Icon,
  iconColor,
  title,
  description,
  time,
  status,
}: {
  icon: typeof Play;
  iconColor: string;
  title: string;
  description: string;
  time: string;
  status?: 'pending' | 'approved' | 'live' | 'rejected';
}) {
  return (
    <View className="flex-row items-center border-b border-slate-800 py-4">
      <View
        className="mr-4 h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${iconColor}20` }}
      >
        <Icon size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-medium text-white">{title}</Text>
        <Text className="text-xs text-slate-400">{description}</Text>
      </View>
      <View className="items-end">
        {status && <StatusBadge status={status} />}
        <Text className="mt-1 text-xs text-slate-500">{time}</Text>
      </View>
    </View>
  );
}

// Quick action card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  color,
  onPress,
}: {
  title: string;
  description: string;
  icon: typeof Play;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <View className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <View
            className="h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon size={20} color={color} />
          </View>
          <ChevronRight size={16} color="#64748b" />
        </View>
        <Text className="text-sm font-semibold text-white">{title}</Text>
        <Text className="text-xs text-slate-400">{description}</Text>
      </View>
    </Pressable>
  );
}

// Content overview table row
function ContentRow({
  type,
  total,
  pending,
  approved,
  live,
  onPress,
}: {
  type: string;
  total: number;
  pending: number;
  approved: number;
  live: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View className="flex-row items-center border-b border-slate-800 py-4">
        <Text className="flex-1 text-sm font-medium text-white">{type}</Text>
        <Text className="w-20 text-center text-sm text-slate-400">{total}</Text>
        <View className="w-20 items-center">
          <View className="rounded-full bg-amber-500/20 px-2 py-0.5">
            <Text className="text-xs text-amber-400">{pending}</Text>
          </View>
        </View>
        <View className="w-20 items-center">
          <View className="rounded-full bg-emerald-500/20 px-2 py-0.5">
            <Text className="text-xs text-emerald-400">{approved}</Text>
          </View>
        </View>
        <View className="w-20 items-center">
          <View className="rounded-full bg-cyan-500/20 px-2 py-0.5">
            <Text className="text-xs text-cyan-400">{live}</Text>
          </View>
        </View>
        <ChevronRight size={16} color="#64748b" />
      </View>
    </Pressable>
  );
}

export default function AdminDashboard() {
  // Calculate stats from mock data
  const stats = useMemo(() => ({
    totalUsers: 24, // Mock user count
    totalWorkouts: workoutPlans.length,
    totalMeals: meals.length,
    totalFastingPlans: Object.keys(fastingWindows).length,
    pendingApprovals: 3, // Mock
    contentLive: workoutPlans.length + meals.length,
  }), []);

  return (
    <View className="flex-1 p-6">
      {/* Page header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white">Dashboard Overview</Text>
        <Text className="text-sm text-slate-400">
          Manage your app content and monitor system health
        </Text>
      </View>

      {/* Stats row */}
      <View className="mb-6 flex-row gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Active accounts"
          icon={Users}
          color="#8b5cf6"
          trend={{ value: 12, isPositive: true }}
          onPress={() => router.push('/admin/users')}
        />
        <StatCard
          title="Workouts"
          value={stats.totalWorkouts}
          subtitle="Exercise plans"
          icon={Dumbbell}
          color="#f97316"
          onPress={() => router.push('/admin/workouts')}
        />
        <StatCard
          title="Meals"
          value={stats.totalMeals}
          subtitle="Meal options"
          icon={Utensils}
          color="#06b6d4"
          onPress={() => router.push('/admin/meals')}
        />
        <StatCard
          title="Pending"
          value={stats.pendingApprovals}
          subtitle="Awaiting approval"
          icon={Clock}
          color="#f59e0b"
        />
      </View>

      {/* Main content grid */}
      <View className="flex-row gap-6">
        {/* Left column - Content overview */}
        <View className="flex-1">
          {/* Content status table */}
          <View className="mb-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-white">Content Overview</Text>
              <Pressable className="rounded-lg bg-slate-800 px-3 py-1.5">
                <Text className="text-xs text-slate-400">View All</Text>
              </Pressable>
            </View>

            {/* Table header */}
            <View className="mb-2 flex-row border-b border-slate-800 pb-2">
              <Text className="flex-1 text-xs font-medium uppercase text-slate-500">Type</Text>
              <Text className="w-20 text-center text-xs font-medium uppercase text-slate-500">Total</Text>
              <Text className="w-20 text-center text-xs font-medium uppercase text-slate-500">Pending</Text>
              <Text className="w-20 text-center text-xs font-medium uppercase text-slate-500">Approved</Text>
              <Text className="w-20 text-center text-xs font-medium uppercase text-slate-500">Live</Text>
              <View className="w-4" />
            </View>

            <ContentRow
              type="Workout Plans"
              total={stats.totalWorkouts}
              pending={1}
              approved={2}
              live={stats.totalWorkouts - 3}
              onPress={() => router.push('/admin/workouts')}
            />
            <ContentRow
              type="Exercises"
              total={24}
              pending={2}
              approved={4}
              live={18}
              onPress={() => router.push('/admin/workouts')}
            />
            <ContentRow
              type="Meals"
              total={stats.totalMeals}
              pending={0}
              approved={1}
              live={stats.totalMeals - 1}
              onPress={() => router.push('/admin/meals')}
            />
            <ContentRow
              type="Videos"
              total={12}
              pending={3}
              approved={2}
              live={7}
              onPress={() => router.push('/admin/workouts')}
            />
            <ContentRow
              type="Fasting Plans"
              total={stats.totalFastingPlans}
              pending={0}
              approved={0}
              live={stats.totalFastingPlans}
              onPress={() => router.push('/admin/fasting')}
            />
          </View>

          {/* Quick actions */}
          <View className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <Text className="mb-4 text-lg font-semibold text-white">Quick Actions</Text>
            <View className="flex-row gap-3">
              <QuickActionCard
                title="Upload Video"
                description="Add exercise demo"
                icon={Video}
                color="#f97316"
                onPress={() => router.push('/admin/workouts')}
              />
              <QuickActionCard
                title="Add Meal"
                description="Create new meal"
                icon={Utensils}
                color="#06b6d4"
                onPress={() => router.push('/admin/meals')}
              />
              <QuickActionCard
                title="Review Plans"
                description="Approve content"
                icon={Eye}
                color="#10b981"
                onPress={() => router.push('/admin/daily-plans')}
              />
            </View>
          </View>
        </View>

        {/* Right column - Recent activity */}
        <View style={{ width: 400 }}>
          <View className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-white">Recent Activity</Text>
              <Pressable>
                <Text className="text-xs text-emerald-400">View All</Text>
              </Pressable>
            </View>

            <ActivityItem
              icon={Video}
              iconColor="#f97316"
              title="New video uploaded"
              description="Push-up exercise demo by Admin"
              time="2 min ago"
              status="pending"
            />
            <ActivityItem
              icon={Utensils}
              iconColor="#06b6d4"
              title="Meal plan updated"
              description="Lunch options for Light category"
              time="15 min ago"
              status="approved"
            />
            <ActivityItem
              icon={Users}
              iconColor="#8b5cf6"
              title="New user registered"
              description="john.doe@example.com"
              time="1 hour ago"
            />
            <ActivityItem
              icon={CheckCircle}
              iconColor="#10b981"
              title="Content approved"
              description="5 exercises marked as live"
              time="2 hours ago"
              status="live"
            />
            <ActivityItem
              icon={Timer}
              iconColor="#a78bfa"
              title="Fasting plan assigned"
              description="16:8 plan to 12 users"
              time="3 hours ago"
            />
          </View>

          {/* System health */}
          <View className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
            <Text className="mb-4 text-lg font-semibold text-white">System Health</Text>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-slate-400">API Status</Text>
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="text-sm text-emerald-400">Operational</Text>
              </View>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-sm text-slate-400">Database</Text>
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-emerald-500" />
                <Text className="text-sm text-emerald-400">Connected</Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-slate-400">Storage</Text>
              <View className="flex-row items-center">
                <View className="mr-2 h-2 w-2 rounded-full bg-amber-500" />
                <Text className="text-sm text-amber-400">78% used</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

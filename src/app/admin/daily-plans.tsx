/**
 * ADMIN - DAILY PLAN OVERSIGHT
 * Review and manage generated daily plans for users
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import {
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Dumbbell,
  Utensils,
  Timer,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Edit,
  RefreshCw,
  Download,
  Filter,
  Moon,
  Sun,
  Flame,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { workoutPlans, mealPlans, fastingWindows } from '@/data/mock-data';
import type { WorkoutPlan, MealPlan, FastingPlan, DifficultyLevel, MealIntensity, WorkType } from '@/types/fitness';

// ==================== TYPES ====================

interface MockUser {
  id: string;
  name: string;
  email: string;
  workType: WorkType;
  fastingPlan: FastingPlan;
  workoutDifficulty: DifficultyLevel;
  mealIntensity: MealIntensity;
  weight: number;
}

interface DailyPlanOverview {
  id: string;
  userId: string;
  userName: string;
  date: string;
  dayOfWeek: number;
  workout: {
    name: string;
    duration: number;
    calories: number;
    difficulty: DifficultyLevel;
  } | null;
  mealPlan: {
    meals: number;
    totalCalories: number;
    protein: number;
  };
  fasting: {
    plan: FastingPlan;
    eatingWindow: string;
  };
  status: 'generated' | 'modified' | 'override' | 'error';
  isRestDay: boolean;
  hasWarnings: boolean;
  generatedAt: string;
}

interface PlanAssignmentHistory {
  id: string;
  userId: string;
  userName: string;
  date: string;
  action: 'generated' | 'modified' | 'override_applied' | 'regenerated';
  component: 'workout' | 'meal' | 'fasting' | 'all';
  details: string;
  performedBy: string;
  timestamp: string;
}

// ==================== MOCK DATA ====================

const MOCK_USERS: MockUser[] = [
  { id: 'u1', name: 'John Smith', email: 'john@example.com', workType: 'sedentary', fastingPlan: '16:8', workoutDifficulty: 'beginner', mealIntensity: 'light', weight: 75 },
  { id: 'u2', name: 'Sarah Johnson', email: 'sarah@example.com', workType: 'moderate', fastingPlan: '14:10', workoutDifficulty: 'intermediate', mealIntensity: 'standard', weight: 65 },
  { id: 'u3', name: 'Mike Davis', email: 'mike@example.com', workType: 'active', fastingPlan: '12:12', workoutDifficulty: 'advanced', mealIntensity: 'high_energy', weight: 90 },
  { id: 'u4', name: 'Emily Brown', email: 'emily@example.com', workType: 'moderate', fastingPlan: '16:8', workoutDifficulty: 'intermediate', mealIntensity: 'standard', weight: 58 },
  { id: 'u5', name: 'Chris Wilson', email: 'chris@example.com', workType: 'sedentary', fastingPlan: '14:10', workoutDifficulty: 'beginner', mealIntensity: 'light', weight: 95 },
];

// Generate mock daily plans for the week
function generateMockDailyPlans(date: Date): DailyPlanOverview[] {
  const plans: DailyPlanOverview[] = [];

  MOCK_USERS.forEach((user) => {
    const dayOfWeek = date.getDay();
    const isRestDay = dayOfWeek === 0;
    const workout = isRestDay ? null : workoutPlans.find(w => w.dayOfWeek === dayOfWeek);
    const mealPlan = mealPlans.find(m => m.dayOfWeek === dayOfWeek);
    const fastingWindow = fastingWindows[user.fastingPlan];

    const statuses: DailyPlanOverview['status'][] = ['generated', 'generated', 'modified', 'override', 'generated'];
    const status = statuses[MOCK_USERS.indexOf(user)];

    plans.push({
      id: `plan-${user.id}-${date.toISOString().split('T')[0]}`,
      userId: user.id,
      userName: user.name,
      date: date.toISOString().split('T')[0],
      dayOfWeek,
      workout: workout ? {
        name: workout.name,
        duration: workout.totalDuration,
        calories: workout.estimatedCalories,
        difficulty: workout.difficulty,
      } : null,
      mealPlan: mealPlan ? {
        meals: mealPlan.meals.length,
        totalCalories: mealPlan.totalNutrition.calories,
        protein: mealPlan.totalNutrition.protein,
      } : { meals: 0, totalCalories: 0, protein: 0 },
      fasting: {
        plan: user.fastingPlan,
        eatingWindow: `${fastingWindow.eatingStartTime} - ${fastingWindow.eatingEndTime}`,
      },
      status,
      isRestDay,
      hasWarnings: status === 'error' || Math.random() > 0.8,
      generatedAt: new Date(date.getTime() - Math.random() * 86400000).toISOString(),
    });
  });

  return plans;
}

const MOCK_ASSIGNMENT_HISTORY: PlanAssignmentHistory[] = [
  {
    id: 'h1',
    userId: 'u1',
    userName: 'John Smith',
    date: '2024-01-28',
    action: 'generated',
    component: 'all',
    details: 'Daily plan auto-generated based on user profile',
    performedBy: 'System',
    timestamp: '2024-01-28T06:00:00Z',
  },
  {
    id: 'h2',
    userId: 'u3',
    userName: 'Mike Davis',
    date: '2024-01-28',
    action: 'override_applied',
    component: 'workout',
    details: 'Changed workout from "HIIT Blast" to "Morning Energizer"',
    performedBy: 'admin@fitlife.com',
    timestamp: '2024-01-28T10:30:00Z',
  },
  {
    id: 'h3',
    userId: 'u2',
    userName: 'Sarah Johnson',
    date: '2024-01-27',
    action: 'modified',
    component: 'fasting',
    details: 'Fasting plan changed from 16:8 to 14:10 per user request',
    performedBy: 'admin@fitlife.com',
    timestamp: '2024-01-27T14:15:00Z',
  },
  {
    id: 'h4',
    userId: 'u4',
    userName: 'Emily Brown',
    date: '2024-01-27',
    action: 'regenerated',
    component: 'meal',
    details: 'Meal plan regenerated due to dietary restriction update',
    performedBy: 'System',
    timestamp: '2024-01-27T08:00:00Z',
  },
];

// ==================== COMPONENTS ====================

// Date navigation header
function DateNavigation({
  selectedDate,
  onDateChange,
}: {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}) {
  const formattedDate = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View className="flex-row items-center justify-between rounded-xl bg-slate-800 p-4">
      <View className="flex-row items-center gap-2">
        <Pressable
          onPress={goToPreviousDay}
          className="h-10 w-10 items-center justify-center rounded-lg bg-slate-700"
        >
          <ChevronLeft size={20} color="#94a3b8" />
        </Pressable>

        <View className="flex-row items-center gap-3 px-4">
          <Calendar size={20} color="#a78bfa" />
          <Text className="text-lg font-semibold text-white">{formattedDate}</Text>
        </View>

        <Pressable
          onPress={goToNextDay}
          className="h-10 w-10 items-center justify-center rounded-lg bg-slate-700"
        >
          <ChevronRight size={20} color="#94a3b8" />
        </Pressable>
      </View>

      <View className="flex-row items-center gap-2">
        {!isToday && (
          <Pressable
            onPress={goToToday}
            className="rounded-lg bg-violet-500/20 px-3 py-2"
          >
            <Text className="text-sm font-medium text-violet-400">Go to Today</Text>
          </Pressable>
        )}
        <Pressable className="flex-row items-center gap-2 rounded-lg bg-slate-700 px-3 py-2">
          <RefreshCw size={16} color="#94a3b8" />
          <Text className="text-sm text-slate-400">Regenerate All</Text>
        </Pressable>
      </View>
    </View>
  );
}

// Status badge for plan status
function PlanStatusBadge({ status }: { status: DailyPlanOverview['status'] }) {
  const config = {
    generated: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Auto-generated' },
    modified: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Modified' },
    override: { bg: 'bg-violet-500/20', text: 'text-violet-400', label: 'Override' },
    error: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Error' },
  };

  const { bg, text, label } = config[status];

  return (
    <View className={cn('rounded-full px-2.5 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>{label}</Text>
    </View>
  );
}

// Difficulty badge
function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const config = {
    beginner: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    intermediate: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    advanced: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  };

  const { bg, text } = config[difficulty];

  return (
    <View className={cn('rounded px-1.5 py-0.5', bg)}>
      <Text className={cn('text-xs capitalize', text)}>{difficulty}</Text>
    </View>
  );
}

// Daily plan row in the table
function DailyPlanRow({
  plan,
  onView,
  onEdit,
}: {
  plan: DailyPlanOverview;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <View className="flex-row items-center border-b border-slate-700/50 px-4 py-3">
      {/* User */}
      <View className="w-48 flex-row items-center">
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-slate-700">
          <User size={16} color="#94a3b8" />
        </View>
        <View>
          <Text className="text-sm font-medium text-white">{plan.userName}</Text>
          <Text className="text-xs text-slate-500">{plan.userId}</Text>
        </View>
      </View>

      {/* Workout */}
      <View className="w-56">
        {plan.isRestDay ? (
          <View className="flex-row items-center">
            <Moon size={14} color="#64748b" />
            <Text className="ml-2 text-sm text-slate-500">Rest Day</Text>
          </View>
        ) : plan.workout ? (
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-sm text-white">{plan.workout.name}</Text>
              <DifficultyBadge difficulty={plan.workout.difficulty} />
            </View>
            <View className="mt-1 flex-row items-center gap-3">
              <View className="flex-row items-center">
                <Clock size={10} color="#64748b" />
                <Text className="ml-1 text-xs text-slate-500">{plan.workout.duration}min</Text>
              </View>
              <View className="flex-row items-center">
                <Flame size={10} color="#64748b" />
                <Text className="ml-1 text-xs text-slate-500">{plan.workout.calories}cal</Text>
              </View>
            </View>
          </View>
        ) : (
          <Text className="text-sm text-slate-500">No workout</Text>
        )}
      </View>

      {/* Meal Plan */}
      <View className="w-40">
        <Text className="text-sm text-white">{plan.mealPlan.meals} meals</Text>
        <View className="mt-1 flex-row items-center gap-2">
          <Text className="text-xs text-slate-500">{plan.mealPlan.totalCalories} cal</Text>
          <Text className="text-xs text-emerald-400">{plan.mealPlan.protein}g protein</Text>
        </View>
      </View>

      {/* Fasting */}
      <View className="w-36">
        <View className="flex-row items-center">
          <Timer size={12} color="#a78bfa" />
          <Text className="ml-1.5 text-sm font-medium text-violet-400">{plan.fasting.plan}</Text>
        </View>
        <Text className="mt-0.5 text-xs text-slate-500">{plan.fasting.eatingWindow}</Text>
      </View>

      {/* Status */}
      <View className="w-32 flex-row items-center gap-2">
        <PlanStatusBadge status={plan.status} />
        {plan.hasWarnings && (
          <AlertCircle size={14} color="#f59e0b" />
        )}
      </View>

      {/* Actions */}
      <View className="flex-1 flex-row items-center justify-end gap-2">
        <Pressable
          onPress={onView}
          className="h-8 w-8 items-center justify-center rounded-lg bg-slate-700"
        >
          <Eye size={14} color="#94a3b8" />
        </Pressable>
        <Pressable
          onPress={onEdit}
          className="h-8 w-8 items-center justify-center rounded-lg bg-slate-700"
        >
          <Edit size={14} color="#94a3b8" />
        </Pressable>
        <Pressable className="h-8 w-8 items-center justify-center rounded-lg bg-slate-700">
          <Download size={14} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  );
}

// Assignment history row
function HistoryRow({ entry }: { entry: PlanAssignmentHistory }) {
  const actionConfig = {
    generated: { icon: CheckCircle, color: '#10b981', label: 'Generated' },
    modified: { icon: Edit, color: '#f59e0b', label: 'Modified' },
    override_applied: { icon: AlertCircle, color: '#a78bfa', label: 'Override' },
    regenerated: { icon: RefreshCw, color: '#06b6d4', label: 'Regenerated' },
  };

  const { icon: Icon, color, label } = actionConfig[entry.action];
  const timestamp = new Date(entry.timestamp).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View className="flex-row items-center border-b border-slate-700/50 px-4 py-3">
      <View className="mr-4 h-8 w-8 items-center justify-center rounded-full bg-slate-800">
        <Icon size={14} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-medium text-white">{entry.userName}</Text>
          <View className="rounded bg-slate-700 px-1.5 py-0.5">
            <Text className="text-xs capitalize text-slate-400">{entry.component}</Text>
          </View>
        </View>
        <Text className="mt-0.5 text-xs text-slate-400">{entry.details}</Text>
      </View>
      <View className="items-end">
        <Text className="text-xs text-slate-500">{timestamp}</Text>
        <Text className="text-xs text-slate-600">{entry.performedBy}</Text>
      </View>
    </View>
  );
}

// Summary stats card
function SummaryCard({
  icon: Icon,
  iconColor,
  label,
  value,
  subtext,
}: {
  icon: typeof Calendar;
  iconColor: string;
  label: string;
  value: string | number;
  subtext?: string;
}) {
  return (
    <View className="flex-1 rounded-xl bg-slate-800 p-4">
      <View className="mb-2 flex-row items-center">
        <Icon size={16} color={iconColor} />
        <Text className="ml-2 text-sm text-slate-400">{label}</Text>
      </View>
      <Text className="text-2xl font-bold text-white">{value}</Text>
      {subtext && <Text className="mt-0.5 text-xs text-slate-500">{subtext}</Text>}
    </View>
  );
}

// Tab button
function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={cn(
        'rounded-lg px-4 py-2',
        isActive ? 'bg-violet-500' : 'bg-slate-800'
      )}
    >
      <Text className={cn('text-sm font-medium', isActive ? 'text-white' : 'text-slate-400')}>
        {label}
      </Text>
    </Pressable>
  );
}

// ==================== MAIN COMPONENT ====================

export default function AdminDailyPlansPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<'plans' | 'history'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DailyPlanOverview['status'] | 'all'>('all');

  // Generate plans for selected date
  const dailyPlans = useMemo(() => generateMockDailyPlans(selectedDate), [selectedDate]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    return dailyPlans.filter((plan) => {
      const matchesSearch =
        plan.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plan.userId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [dailyPlans, searchQuery, statusFilter]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = dailyPlans.length;
    const generated = dailyPlans.filter((p) => p.status === 'generated').length;
    const modified = dailyPlans.filter((p) => p.status === 'modified' || p.status === 'override').length;
    const withWarnings = dailyPlans.filter((p) => p.hasWarnings).length;
    const restDay = dailyPlans.filter((p) => p.isRestDay).length;

    return { total, generated, modified, withWarnings, restDay };
  }, [dailyPlans]);

  const handleViewPlan = (plan: DailyPlanOverview) => {
    console.log('[Admin] Viewing plan:', plan.id);
  };

  const handleEditPlan = (plan: DailyPlanOverview) => {
    console.log('[Admin] Editing plan:', plan.id);
  };

  return (
    <View className="flex-1 p-6">
      {/* Page header */}
      <View className="mb-6">
        <Text className="text-2xl font-bold text-white">Daily Plan Oversight</Text>
        <Text className="text-sm text-slate-400">
          Review and manage generated daily plans for all users
        </Text>
      </View>

      {/* Date navigation */}
      <View className="mb-6">
        <DateNavigation selectedDate={selectedDate} onDateChange={setSelectedDate} />
      </View>

      {/* Summary stats */}
      <View className="mb-6 flex-row gap-4">
        <SummaryCard
          icon={User}
          iconColor="#a78bfa"
          label="Total Plans"
          value={stats.total}
          subtext="For selected date"
        />
        <SummaryCard
          icon={CheckCircle}
          iconColor="#10b981"
          label="Auto-Generated"
          value={stats.generated}
          subtext={`${Math.round((stats.generated / stats.total) * 100)}% of total`}
        />
        <SummaryCard
          icon={Edit}
          iconColor="#f59e0b"
          label="Modified"
          value={stats.modified}
          subtext="Manual adjustments"
        />
        <SummaryCard
          icon={AlertCircle}
          iconColor="#ef4444"
          label="With Warnings"
          value={stats.withWarnings}
          subtext="Need attention"
        />
        <SummaryCard
          icon={Moon}
          iconColor="#64748b"
          label="Rest Days"
          value={stats.restDay}
          subtext="No workout scheduled"
        />
      </View>

      {/* Tabs */}
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row gap-2">
          <TabButton
            label="Daily Plans"
            isActive={activeTab === 'plans'}
            onPress={() => setActiveTab('plans')}
          />
          <TabButton
            label="Assignment History"
            isActive={activeTab === 'history'}
            onPress={() => setActiveTab('history')}
          />
        </View>

        {activeTab === 'plans' && (
          <View className="flex-row items-center gap-3">
            {/* Search */}
            <View className="flex-row items-center rounded-lg bg-slate-800 px-3 py-2">
              <Search size={16} color="#64748b" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search users..."
                placeholderTextColor="#64748b"
                className="ml-2 w-48 text-sm text-white"
              />
            </View>

            {/* Status filter */}
            <View className="flex-row items-center gap-2">
              <Filter size={14} color="#64748b" />
              {(['all', 'generated', 'modified', 'override'] as const).map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setStatusFilter(status)}
                  className={cn(
                    'rounded-lg px-3 py-1.5',
                    statusFilter === status ? 'bg-violet-500' : 'bg-slate-800'
                  )}
                >
                  <Text
                    className={cn(
                      'text-xs capitalize',
                      statusFilter === status ? 'text-white' : 'text-slate-400'
                    )}
                  >
                    {status === 'all' ? 'All' : status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="flex-1 rounded-xl border border-slate-700 bg-slate-900">
        {activeTab === 'plans' ? (
          <>
            {/* Table header */}
            <View className="flex-row items-center border-b border-slate-700 bg-slate-800/50 px-4 py-3">
              <Text className="w-48 text-xs font-medium uppercase text-slate-500">User</Text>
              <Text className="w-56 text-xs font-medium uppercase text-slate-500">Workout</Text>
              <Text className="w-40 text-xs font-medium uppercase text-slate-500">Meals</Text>
              <Text className="w-36 text-xs font-medium uppercase text-slate-500">Fasting</Text>
              <Text className="w-32 text-xs font-medium uppercase text-slate-500">Status</Text>
              <Text className="flex-1 text-right text-xs font-medium uppercase text-slate-500">Actions</Text>
            </View>

            {/* Table rows */}
            <ScrollView className="flex-1">
              {filteredPlans.length > 0 ? (
                filteredPlans.map((plan) => (
                  <DailyPlanRow
                    key={plan.id}
                    plan={plan}
                    onView={() => handleViewPlan(plan)}
                    onEdit={() => handleEditPlan(plan)}
                  />
                ))
              ) : (
                <View className="items-center justify-center py-12">
                  <Text className="text-slate-500">No plans match your filters</Text>
                </View>
              )}
            </ScrollView>
          </>
        ) : (
          <>
            {/* History header */}
            <View className="border-b border-slate-700 bg-slate-800/50 px-4 py-3">
              <Text className="text-sm font-medium text-white">Recent Plan Assignments</Text>
              <Text className="text-xs text-slate-500">Track all changes to user daily plans</Text>
            </View>

            {/* History rows */}
            <ScrollView className="flex-1">
              {MOCK_ASSIGNMENT_HISTORY.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} />
              ))}
            </ScrollView>
          </>
        )}
      </View>
    </View>
  );
}

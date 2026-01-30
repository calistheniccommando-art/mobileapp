/**
 * ADMIN - FASTING PLAN MANAGEMENT
 * Manage fasting schedules and user assignments
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import {
  Plus,
  Timer,
  Moon,
  Sun,
  Clock,
  Users,
  Edit,
  Trash2,
  Check,
  AlertCircle,
  Settings,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { fastingWindows } from '@/data/mock-data';
import type { FastingPlan, WorkType } from '@/types/fitness';

// Extended fasting plan data for admin
interface AdminFastingPlan {
  id: string;
  plan: FastingPlan;
  fastingHours: number;
  eatingHours: number;
  eatingStartTime: string;
  eatingEndTime: string;
  assignedWorkTypes: WorkType[];
  weightThresholds: {
    min?: number;
    max?: number;
  };
  userCount: number;
  isDefault: boolean;
}

// Generate admin fasting plans from mock data
const ADMIN_FASTING_PLANS: AdminFastingPlan[] = [
  {
    id: 'fp-1',
    plan: '12:12',
    fastingHours: 12,
    eatingHours: 12,
    eatingStartTime: '08:00',
    eatingEndTime: '20:00',
    assignedWorkTypes: ['active'],
    weightThresholds: {},
    userCount: 8,
    isDefault: false,
  },
  {
    id: 'fp-2',
    plan: '14:10',
    fastingHours: 14,
    eatingHours: 10,
    eatingStartTime: '10:00',
    eatingEndTime: '20:00',
    assignedWorkTypes: ['sedentary', 'moderate'],
    weightThresholds: { min: 80 },
    userCount: 12,
    isDefault: false,
  },
  {
    id: 'fp-3',
    plan: '16:8',
    fastingHours: 16,
    eatingHours: 8,
    eatingStartTime: '12:00',
    eatingEndTime: '20:00',
    assignedWorkTypes: ['sedentary', 'moderate'],
    weightThresholds: { max: 80 },
    userCount: 15,
    isDefault: true,
  },
  {
    id: 'fp-4',
    plan: '18:6',
    fastingHours: 18,
    eatingHours: 6,
    eatingStartTime: '14:00',
    eatingEndTime: '20:00',
    assignedWorkTypes: [],
    weightThresholds: {},
    userCount: 3,
    isDefault: false,
  },
];

// Work type labels
const WORK_TYPE_LABELS: Record<WorkType, string> = {
  sedentary: 'Sedentary',
  moderate: 'Moderate',
  active: 'Active',
};

// Fasting plan card
function FastingPlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: AdminFastingPlan;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const progressPercent = (plan.eatingHours / 24) * 100;

  return (
    <View className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      {/* Header */}
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-row items-center">
          <View className="mr-4 h-14 w-14 items-center justify-center rounded-xl bg-violet-500/20">
            <Timer size={28} color="#a78bfa" />
          </View>
          <View>
            <View className="flex-row items-center">
              <Text className="text-2xl font-bold text-white">{plan.plan}</Text>
              {plan.isDefault && (
                <View className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5">
                  <Text className="text-xs text-emerald-400">Default</Text>
                </View>
              )}
            </View>
            <Text className="text-sm text-slate-400">
              {plan.fastingHours}h fasting · {plan.eatingHours}h eating
            </Text>
          </View>
        </View>

        <View className="flex-row gap-1">
          <Pressable onPress={onEdit} className="rounded-lg bg-slate-800 p-2">
            <Edit size={16} color="#94a3b8" />
          </Pressable>
          <Pressable onPress={onDelete} className="rounded-lg bg-slate-800 p-2">
            <Trash2 size={16} color="#64748b" />
          </Pressable>
        </View>
      </View>

      {/* Visual timeline */}
      <View className="mb-4">
        <View className="h-8 flex-row overflow-hidden rounded-lg">
          {/* Fasting period (morning) */}
          <View
            className="items-center justify-center bg-violet-500/30"
            style={{ width: `${((parseInt(plan.eatingStartTime) / 24) * 100)}%` }}
          >
            <Moon size={14} color="#a78bfa" />
          </View>
          {/* Eating period */}
          <View
            className="items-center justify-center bg-emerald-500/30"
            style={{ width: `${progressPercent}%` }}
          >
            <Sun size={14} color="#10b981" />
          </View>
          {/* Fasting period (evening) */}
          <View className="flex-1 items-center justify-center bg-violet-500/30">
            <Moon size={14} color="#a78bfa" />
          </View>
        </View>
        <View className="mt-2 flex-row justify-between">
          <Text className="text-xs text-slate-500">00:00</Text>
          <Text className="text-xs text-emerald-400">
            {plan.eatingStartTime} - {plan.eatingEndTime}
          </Text>
          <Text className="text-xs text-slate-500">24:00</Text>
        </View>
      </View>

      {/* Assignment rules */}
      <View className="mb-4 rounded-xl bg-slate-800/50 p-3">
        <Text className="mb-2 text-xs font-medium uppercase text-slate-500">Assignment Rules</Text>

        {/* Work types */}
        {plan.assignedWorkTypes.length > 0 ? (
          <View className="mb-2 flex-row items-center">
            <Text className="mr-2 text-xs text-slate-400">Work types:</Text>
            <View className="flex-row gap-1">
              {plan.assignedWorkTypes.map((type) => (
                <View key={type} className="rounded bg-slate-700 px-2 py-0.5">
                  <Text className="text-xs text-white">{WORK_TYPE_LABELS[type]}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View className="mb-2 flex-row items-center">
            <AlertCircle size={12} color="#f59e0b" />
            <Text className="ml-1 text-xs text-amber-400">No work type restrictions</Text>
          </View>
        )}

        {/* Weight thresholds */}
        {(plan.weightThresholds.min || plan.weightThresholds.max) ? (
          <View className="flex-row items-center">
            <Text className="mr-2 text-xs text-slate-400">Weight:</Text>
            <Text className="text-xs text-white">
              {plan.weightThresholds.min && `≥${plan.weightThresholds.min}kg`}
              {plan.weightThresholds.min && plan.weightThresholds.max && ' and '}
              {plan.weightThresholds.max && `<${plan.weightThresholds.max}kg`}
            </Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <Text className="text-xs text-slate-400">Weight: Any</Text>
          </View>
        )}
      </View>

      {/* User count */}
      <View className="flex-row items-center justify-between rounded-xl bg-slate-800 p-3">
        <View className="flex-row items-center">
          <Users size={16} color="#64748b" />
          <Text className="ml-2 text-sm text-slate-400">Users assigned</Text>
        </View>
        <Text className="text-lg font-bold text-white">{plan.userCount}</Text>
      </View>
    </View>
  );
}

// Personalization rules summary
function PersonalizationRulesSummary() {
  return (
    <View className="rounded-2xl border border-slate-700 bg-slate-900 p-5">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Settings size={20} color="#64748b" />
          <Text className="ml-2 text-lg font-semibold text-white">Personalization Rules</Text>
        </View>
        <Pressable className="rounded-lg bg-slate-800 px-3 py-1.5">
          <Text className="text-xs text-slate-400">Edit Rules</Text>
        </Pressable>
      </View>

      <View className="rounded-xl bg-slate-800/50">
        {/* Rule 1 */}
        <View className="flex-row items-center border-b border-slate-700 p-3">
          <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
            <Text className="text-xs font-bold text-emerald-400">1</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-white">Active work type → 12:12 plan</Text>
            <Text className="text-xs text-slate-400">Any weight</Text>
          </View>
          <Check size={16} color="#10b981" />
        </View>

        {/* Rule 2 */}
        <View className="flex-row items-center border-b border-slate-700 p-3">
          <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
            <Text className="text-xs font-bold text-emerald-400">2</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-white">Sedentary/Moderate + ≥80kg → 14:10 plan</Text>
            <Text className="text-xs text-slate-400">Higher weight users</Text>
          </View>
          <Check size={16} color="#10b981" />
        </View>

        {/* Rule 3 */}
        <View className="flex-row items-center p-3">
          <View className="mr-3 h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
            <Text className="text-xs font-bold text-emerald-400">3</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm text-white">Sedentary/Moderate + &lt;80kg → 16:8 plan</Text>
            <Text className="text-xs text-slate-400">Default for most users</Text>
          </View>
          <Check size={16} color="#10b981" />
        </View>
      </View>

      <View className="mt-4 flex-row items-center rounded-lg bg-amber-500/10 p-3">
        <AlertCircle size={16} color="#f59e0b" />
        <Text className="ml-2 flex-1 text-xs text-amber-400">
          Users can manually override their fasting plan in the app settings
        </Text>
      </View>
    </View>
  );
}

// Time picker input
function TimeInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View className="flex-1">
      <Text className="mb-1 text-xs text-slate-400">{label}</Text>
      <View className="flex-row items-center rounded-lg bg-slate-800 px-3 py-2">
        <Clock size={14} color="#64748b" />
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="00:00"
          placeholderTextColor="#64748b"
          className="ml-2 flex-1 text-sm text-white"
        />
      </View>
    </View>
  );
}

export default function AdminFastingPage() {
  const [selectedPlan, setSelectedPlan] = useState<AdminFastingPlan | null>(null);

  const handleEditPlan = (plan: AdminFastingPlan) => {
    setSelectedPlan(plan);
    // TODO: Open edit modal
  };

  const handleDeletePlan = (plan: AdminFastingPlan) => {
    // TODO: Confirm and delete
    console.log('[Admin] Deleting fasting plan:', plan.id);
  };

  return (
    <View className="flex-1 p-6">
      {/* Page header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Fasting Plan Management</Text>
          <Text className="text-sm text-slate-400">
            Configure fasting schedules and assignment rules
          </Text>
        </View>

        <Pressable className="flex-row items-center rounded-lg bg-emerald-500 px-4 py-2">
          <Plus size={16} color="white" />
          <Text className="ml-2 text-sm font-medium text-white">Add Plan</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        <View className="flex-row gap-6">
          {/* Left column - Fasting plans */}
          <View className="flex-1">
            <Text className="mb-4 text-lg font-semibold text-white">Fasting Plans</Text>
            <View className="gap-4">
              {ADMIN_FASTING_PLANS.map((plan) => (
                <FastingPlanCard
                  key={plan.id}
                  plan={plan}
                  onEdit={() => handleEditPlan(plan)}
                  onDelete={() => handleDeletePlan(plan)}
                />
              ))}
            </View>
          </View>

          {/* Right column - Rules & stats */}
          <View style={{ width: 400 }}>
            {/* Personalization rules */}
            <PersonalizationRulesSummary />

            {/* Stats */}
            <View className="mt-6 rounded-2xl border border-slate-700 bg-slate-900 p-5">
              <Text className="mb-4 text-lg font-semibold text-white">Usage Statistics</Text>

              <View className="gap-3">
                <View className="flex-row items-center justify-between rounded-xl bg-slate-800 p-3">
                  <Text className="text-sm text-slate-400">Total users with plans</Text>
                  <Text className="text-lg font-bold text-white">38</Text>
                </View>

                <View className="flex-row items-center justify-between rounded-xl bg-slate-800 p-3">
                  <Text className="text-sm text-slate-400">Auto-assigned</Text>
                  <Text className="text-lg font-bold text-emerald-400">32</Text>
                </View>

                <View className="flex-row items-center justify-between rounded-xl bg-slate-800 p-3">
                  <Text className="text-sm text-slate-400">Manual overrides</Text>
                  <Text className="text-lg font-bold text-amber-400">6</Text>
                </View>
              </View>
            </View>

            {/* Most popular plan */}
            <View className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
              <View className="flex-row items-center">
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Timer size={20} color="#10b981" />
                </View>
                <View>
                  <Text className="text-sm text-emerald-400">Most Popular Plan</Text>
                  <Text className="text-xl font-bold text-white">16:8</Text>
                </View>
              </View>
              <Text className="mt-2 text-sm text-slate-400">
                Used by 39% of all users (15 total)
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

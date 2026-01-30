/**
 * ADMIN - USER MANAGEMENT
 * View and manage all app users with filtering and search
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Scale,
  Activity,
  Timer,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Download,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import type { FastingPlan, WorkType, DifficultyLevel, MealIntensity } from '@/types/fitness';

// Mock user data for admin
interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  weight: number;
  height?: number;
  workType: WorkType;
  fastingPlan: FastingPlan;
  workoutDifficulty: DifficultyLevel;
  mealIntensity: MealIntensity;
  createdAt: Date;
  lastActive: Date;
  status: 'active' | 'inactive' | 'suspended';
}

// Generate mock users
const MOCK_USERS: AdminUser[] = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    firstName: 'John',
    lastName: 'Doe',
    weight: 82,
    height: 178,
    workType: 'sedentary',
    fastingPlan: '16:8',
    workoutDifficulty: 'beginner',
    mealIntensity: 'light',
    createdAt: new Date('2024-01-15'),
    lastActive: new Date(),
    status: 'active',
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    weight: 65,
    height: 165,
    workType: 'moderate',
    fastingPlan: '14:10',
    workoutDifficulty: 'intermediate',
    mealIntensity: 'standard',
    createdAt: new Date('2024-02-20'),
    lastActive: new Date(Date.now() - 86400000),
    status: 'active',
  },
  {
    id: 'user-3',
    email: 'mike.johnson@example.com',
    firstName: 'Mike',
    lastName: 'Johnson',
    weight: 95,
    height: 185,
    workType: 'active',
    fastingPlan: '12:12',
    workoutDifficulty: 'advanced',
    mealIntensity: 'high_energy',
    createdAt: new Date('2024-03-10'),
    lastActive: new Date(Date.now() - 172800000),
    status: 'active',
  },
  {
    id: 'user-4',
    email: 'sarah.wilson@example.com',
    firstName: 'Sarah',
    lastName: 'Wilson',
    weight: 58,
    height: 160,
    workType: 'sedentary',
    fastingPlan: '18:6',
    workoutDifficulty: 'beginner',
    mealIntensity: 'light',
    createdAt: new Date('2024-01-05'),
    lastActive: new Date(Date.now() - 604800000),
    status: 'inactive',
  },
  {
    id: 'user-5',
    email: 'alex.brown@example.com',
    firstName: 'Alex',
    lastName: 'Brown',
    weight: 78,
    height: 175,
    workType: 'moderate',
    fastingPlan: '16:8',
    workoutDifficulty: 'intermediate',
    mealIntensity: 'standard',
    createdAt: new Date('2024-04-01'),
    lastActive: new Date(),
    status: 'active',
  },
];

// Status badge
function StatusBadge({ status }: { status: AdminUser['status'] }) {
  const config = {
    active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    inactive: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    suspended: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  };
  const { bg, text } = config[status];

  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium capitalize', text)}>{status}</Text>
    </View>
  );
}

// Filter dropdown
function FilterDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="relative">
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2"
      >
        <Text className="mr-2 text-xs text-slate-400">{label}:</Text>
        <Text className="text-sm text-white">{options.find((o) => o.value === value)?.label ?? 'All'}</Text>
        <ChevronDown size={14} color="#64748b" style={{ marginLeft: 4 }} />
      </Pressable>

      {isOpen && (
        <View className="absolute left-0 top-full z-10 mt-1 min-w-full rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-lg">
          {options.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={cn(
                'px-3 py-2',
                value === option.value && 'bg-emerald-500/10'
              )}
            >
              <Text
                className={cn(
                  'text-sm',
                  value === option.value ? 'text-emerald-400' : 'text-white'
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

// User row component
function UserRow({
  user,
  isSelected,
  onSelect,
  onView,
}: {
  user: AdminUser;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / 86400000);

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Pressable onPress={onView}>
      <View
        className={cn(
          'flex-row items-center border-b border-slate-800 py-4',
          isSelected && 'bg-emerald-500/5'
        )}
      >
        {/* Checkbox */}
        <Pressable onPress={onSelect} className="mr-4">
          <View
            className={cn(
              'h-5 w-5 items-center justify-center rounded border',
              isSelected
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-slate-600'
            )}
          >
            {isSelected && <Text className="text-xs text-white">✓</Text>}
          </View>
        </Pressable>

        {/* User info */}
        <View className="flex-1 flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
            <Text className="text-sm font-bold text-violet-400">
              {`${user.firstName[0]}${user.lastName[0]}`}
            </Text>
          </View>
          <View>
            <Text className="text-sm font-medium text-white">
              {`${user.firstName} ${user.lastName}`}
            </Text>
            <Text className="text-xs text-slate-400">{user.email}</Text>
          </View>
        </View>

        {/* Weight */}
        <View className="w-20">
          <Text className="text-sm text-white">{user.weight} kg</Text>
        </View>

        {/* Work Type */}
        <View className="w-28">
          <Text className="text-sm capitalize text-slate-400">{user.workType}</Text>
        </View>

        {/* Fasting Plan */}
        <View className="w-20">
          <View className="self-start rounded-full bg-violet-500/20 px-2 py-0.5">
            <Text className="text-xs text-violet-400">{user.fastingPlan}</Text>
          </View>
        </View>

        {/* Difficulty */}
        <View className="w-28">
          <Text className="text-sm capitalize text-slate-400">{user.workoutDifficulty}</Text>
        </View>

        {/* Last Active */}
        <View className="w-24">
          <Text className="text-sm text-slate-400">{formatDate(user.lastActive)}</Text>
        </View>

        {/* Status */}
        <View className="w-24">
          <StatusBadge status={user.status} />
        </View>

        {/* Actions */}
        <View className="w-16 flex-row justify-end gap-2">
          <Pressable onPress={onView} className="p-1">
            <Eye size={16} color="#64748b" />
          </Pressable>
          <Pressable className="p-1">
            <MoreHorizontal size={16} color="#64748b" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// User detail modal
function UserDetailPanel({
  user,
  onClose,
}: {
  user: AdminUser | null;
  onClose: () => void;
}) {
  if (!user) return null;

  return (
    <View className="h-full w-96 border-l border-slate-700 bg-slate-900">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-700 p-4">
        <Text className="text-lg font-semibold text-white">User Details</Text>
        <Pressable onPress={onClose} className="p-1">
          <Text className="text-slate-400">✕</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Profile header */}
        <View className="mb-6 items-center">
          <View className="mb-3 h-20 w-20 items-center justify-center rounded-full bg-violet-500/20">
            <Text className="text-2xl font-bold text-violet-400">
              {`${user.firstName[0]}${user.lastName[0]}`}
            </Text>
          </View>
          <Text className="text-xl font-semibold text-white">
            {`${user.firstName} ${user.lastName}`}
          </Text>
          <Text className="text-sm text-slate-400">{user.email}</Text>
          <View className="mt-2">
            <StatusBadge status={user.status} />
          </View>
        </View>

        {/* Stats grid */}
        <View className="mb-6 flex-row flex-wrap gap-3">
          <View className="rounded-xl bg-slate-800 p-3" style={{ width: '47%' }}>
            <Scale size={18} color="#f59e0b" />
            <Text className="mt-2 text-lg font-bold text-white">{user.weight} kg</Text>
            <Text className="text-xs text-slate-400">Weight</Text>
          </View>
          <View className="rounded-xl bg-slate-800 p-3" style={{ width: '47%' }}>
            <Activity size={18} color="#10b981" />
            <Text className="mt-2 text-lg font-bold capitalize text-white">{user.workType}</Text>
            <Text className="text-xs text-slate-400">Activity</Text>
          </View>
          <View className="rounded-xl bg-slate-800 p-3" style={{ width: '47%' }}>
            <Timer size={18} color="#a78bfa" />
            <Text className="mt-2 text-lg font-bold text-white">{user.fastingPlan}</Text>
            <Text className="text-xs text-slate-400">Fasting Plan</Text>
          </View>
          <View className="rounded-xl bg-slate-800 p-3" style={{ width: '47%' }}>
            <Calendar size={18} color="#06b6d4" />
            <Text className="mt-2 text-lg font-bold capitalize text-white">{user.workoutDifficulty}</Text>
            <Text className="text-xs text-slate-400">Difficulty</Text>
          </View>
        </View>

        {/* Account info */}
        <View className="mb-6">
          <Text className="mb-3 text-sm font-semibold text-white">Account Information</Text>
          <View className="rounded-xl bg-slate-800 p-4">
            <View className="mb-3 flex-row justify-between">
              <Text className="text-sm text-slate-400">Member since</Text>
              <Text className="text-sm text-white">{user.createdAt.toLocaleDateString()}</Text>
            </View>
            <View className="mb-3 flex-row justify-between">
              <Text className="text-sm text-slate-400">Last active</Text>
              <Text className="text-sm text-white">{user.lastActive.toLocaleDateString()}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-sm text-slate-400">Meal intensity</Text>
              <Text className="text-sm capitalize text-white">{user.mealIntensity.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>

        {/* Future: Progress tracking placeholder */}
        <View className="rounded-xl border border-dashed border-slate-700 p-4">
          <Text className="text-center text-sm text-slate-500">
            Progress tracking coming soon
          </Text>
        </View>
      </ScrollView>

      {/* Actions */}
      <View className="flex-row gap-2 border-t border-slate-700 p-4">
        <Pressable className="flex-1 items-center rounded-lg bg-slate-800 py-3">
          <Text className="text-sm font-medium text-white">Edit User</Text>
        </Pressable>
        <Pressable className="items-center rounded-lg bg-rose-500/20 px-4 py-3">
          <Trash2 size={18} color="#f43f5e" />
        </Pressable>
      </View>
    </View>
  );
}

export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [filters, setFilters] = useState({
    status: 'all',
    workType: 'all',
    fastingPlan: 'all',
  });

  // Filter users
  const filteredUsers = useMemo(() => {
    return MOCK_USERS.filter((user) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && user.status !== filters.status) return false;

      // Work type filter
      if (filters.workType !== 'all' && user.workType !== filters.workType) return false;

      // Fasting plan filter
      if (filters.fastingPlan !== 'all' && user.fastingPlan !== filters.fastingPlan) return false;

      return true;
    });
  }, [searchQuery, filters]);

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  return (
    <View className="flex-1 flex-row">
      <View className="flex-1 p-6">
        {/* Page header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-bold text-white">User Management</Text>
            <Text className="text-sm text-slate-400">
              {filteredUsers.length} users found
            </Text>
          </View>

          <View className="flex-row gap-2">
            <Pressable className="flex-row items-center rounded-lg bg-slate-800 px-4 py-2">
              <Download size={16} color="#94a3b8" />
              <Text className="ml-2 text-sm text-slate-400">Export</Text>
            </Pressable>
          </View>
        </View>

        {/* Search and filters */}
        <View className="mb-4 flex-row items-center gap-4">
          {/* Search */}
          <View className="flex-1 flex-row items-center rounded-lg bg-slate-800 px-4 py-2">
            <Search size={18} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search users by name or email..."
              placeholderTextColor="#64748b"
              className="ml-3 flex-1 text-sm text-white"
            />
          </View>

          {/* Filters */}
          <FilterDropdown
            label="Status"
            value={filters.status}
            options={[
              { value: 'all', label: 'All' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'suspended', label: 'Suspended' },
            ]}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
          />

          <FilterDropdown
            label="Work Type"
            value={filters.workType}
            options={[
              { value: 'all', label: 'All' },
              { value: 'sedentary', label: 'Sedentary' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'active', label: 'Active' },
            ]}
            onChange={(value) => setFilters((prev) => ({ ...prev, workType: value }))}
          />

          <FilterDropdown
            label="Fasting"
            value={filters.fastingPlan}
            options={[
              { value: 'all', label: 'All' },
              { value: '12:12', label: '12:12' },
              { value: '14:10', label: '14:10' },
              { value: '16:8', label: '16:8' },
              { value: '18:6', label: '18:6' },
            ]}
            onChange={(value) => setFilters((prev) => ({ ...prev, fastingPlan: value }))}
          />
        </View>

        {/* Bulk actions */}
        {selectedUsers.length > 0 && (
          <View className="mb-4 flex-row items-center gap-4 rounded-lg bg-emerald-500/10 px-4 py-3">
            <Text className="text-sm text-emerald-400">
              {selectedUsers.length} user(s) selected
            </Text>
            <Pressable className="rounded-lg bg-slate-800 px-3 py-1.5">
              <Text className="text-xs text-white">Change Fasting Plan</Text>
            </Pressable>
            <Pressable className="rounded-lg bg-slate-800 px-3 py-1.5">
              <Text className="text-xs text-white">Export Selected</Text>
            </Pressable>
            <Pressable
              onPress={() => setSelectedUsers([])}
              className="ml-auto"
            >
              <Text className="text-xs text-slate-400">Clear selection</Text>
            </Pressable>
          </View>
        )}

        {/* Users table */}
        <View className="rounded-2xl border border-slate-700 bg-slate-900">
          {/* Table header */}
          <View className="flex-row items-center border-b border-slate-700 px-4 py-3">
            <Pressable onPress={toggleSelectAll} className="mr-4">
              <View
                className={cn(
                  'h-5 w-5 items-center justify-center rounded border',
                  selectedUsers.length === filteredUsers.length && filteredUsers.length > 0
                    ? 'border-emerald-500 bg-emerald-500'
                    : 'border-slate-600'
                )}
              >
                {selectedUsers.length === filteredUsers.length && filteredUsers.length > 0 && (
                  <Text className="text-xs text-white">✓</Text>
                )}
              </View>
            </Pressable>
            <Text className="flex-1 text-xs font-medium uppercase text-slate-500">User</Text>
            <Text className="w-20 text-xs font-medium uppercase text-slate-500">Weight</Text>
            <Text className="w-28 text-xs font-medium uppercase text-slate-500">Work Type</Text>
            <Text className="w-20 text-xs font-medium uppercase text-slate-500">Fasting</Text>
            <Text className="w-28 text-xs font-medium uppercase text-slate-500">Difficulty</Text>
            <Text className="w-24 text-xs font-medium uppercase text-slate-500">Last Active</Text>
            <Text className="w-24 text-xs font-medium uppercase text-slate-500">Status</Text>
            <View className="w-16" />
          </View>

          {/* Table body */}
          <ScrollView style={{ maxHeight: 600 }}>
            {filteredUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.id)}
                onSelect={() => toggleUserSelection(user.id)}
                onView={() => setSelectedUser(user)}
              />
            ))}

            {filteredUsers.length === 0 && (
              <View className="items-center py-12">
                <User size={48} color="#334155" />
                <Text className="mt-4 text-slate-500">No users found</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* User detail panel */}
      {selectedUser && (
        <UserDetailPanel
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </View>
  );
}

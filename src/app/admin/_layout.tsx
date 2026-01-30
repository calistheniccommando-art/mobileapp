/**
 * ADMIN DASHBOARD LAYOUT
 * Desktop web-only interface for content management
 */

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Slot, usePathname } from 'expo-router';
import {
  Users,
  Dumbbell,
  Utensils,
  Timer,
  Calendar,
  FileText,
  LayoutDashboard,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Settings,
  Shield,
  History,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';

// Navigation items for admin sidebar
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/admin/workouts' },
  { id: 'meals', label: 'Meals', icon: Utensils, path: '/admin/meals' },
  { id: 'fasting', label: 'Fasting Plans', icon: Timer, path: '/admin/fasting' },
  { id: 'daily-plans', label: 'Daily Plans', icon: Calendar, path: '/admin/daily-plans' },
  { id: 'pdf-templates', label: 'PDF Templates', icon: FileText, path: '/admin/pdf-templates' },
  { id: 'audit-log', label: 'Audit Log', icon: History, path: '/admin/audit-log' },
];

// Sidebar navigation component
function Sidebar({ currentPath }: { currentPath: string }) {
  const handleNavigation = (path: string) => {
    router.push(path as any);
  };

  return (
    <View className="h-full w-64 border-r border-slate-700 bg-slate-900">
      {/* Logo */}
      <View className="border-b border-slate-700 p-6">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Shield size={24} color="#10b981" />
          </View>
          <View>
            <Text className="text-lg font-bold text-white">FitLife</Text>
            <Text className="text-xs text-slate-400">Admin Dashboard</Text>
          </View>
        </View>
      </View>

      {/* Navigation */}
      <ScrollView className="flex-1 p-4">
        <Text className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Content Management
        </Text>
        {NAV_ITEMS.map((item) => {
          const isActive = currentPath === item.path ||
            (item.path !== '/admin' && currentPath.startsWith(item.path));
          const Icon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={() => handleNavigation(item.path)}
              className={cn(
                'mb-1 flex-row items-center rounded-xl px-3 py-3',
                isActive ? 'bg-emerald-500/10' : 'hover:bg-slate-800'
              )}
            >
              <Icon
                size={20}
                color={isActive ? '#10b981' : '#94a3b8'}
              />
              <Text
                className={cn(
                  'ml-3 text-sm font-medium',
                  isActive ? 'text-emerald-400' : 'text-slate-400'
                )}
              >
                {item.label}
              </Text>
              {isActive && (
                <View className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
              )}
            </Pressable>
          );
        })}

        {/* Settings section */}
        <Text className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          System
        </Text>
        <Pressable
          className="mb-1 flex-row items-center rounded-xl px-3 py-3 hover:bg-slate-800"
        >
          <Settings size={20} color="#94a3b8" />
          <Text className="ml-3 text-sm font-medium text-slate-400">Settings</Text>
        </Pressable>
      </ScrollView>

      {/* Admin profile */}
      <View className="border-t border-slate-700 p-4">
        <View className="flex-row items-center">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
            <Text className="text-sm font-bold text-violet-400">AD</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-medium text-white">Admin User</Text>
            <Text className="text-xs text-slate-400">Super Admin</Text>
          </View>
          <Pressable className="p-2">
            <LogOut size={18} color="#94a3b8" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Top header component
function Header() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View className="flex-row items-center justify-between border-b border-slate-700 bg-slate-900 px-6 py-4">
      {/* Search */}
      <View className="flex-row items-center rounded-xl bg-slate-800 px-4 py-2" style={{ width: 400 }}>
        <Search size={18} color="#64748b" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search content, users, or settings..."
          placeholderTextColor="#64748b"
          className="ml-3 flex-1 text-sm text-white"
        />
      </View>

      {/* Right actions */}
      <View className="flex-row items-center gap-4">
        {/* Notifications */}
        <Pressable className="relative p-2">
          <Bell size={20} color="#94a3b8" />
          <View className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" />
        </Pressable>

        {/* Quick stats */}
        <View className="flex-row items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
          <View className="h-2 w-2 rounded-full bg-emerald-500" />
          <Text className="text-xs text-slate-400">3 pending approvals</Text>
        </View>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const pathname = usePathname();

  return (
    <View className="h-screen w-screen flex-row bg-slate-950">
      {/* Sidebar */}
      <Sidebar currentPath={pathname} />

      {/* Main content area */}
      <View className="flex-1">
        {/* Header */}
        <Header />

        {/* Page content */}
        <ScrollView className="flex-1 bg-slate-950">
          <Slot />
        </ScrollView>
      </View>
    </View>
  );
}

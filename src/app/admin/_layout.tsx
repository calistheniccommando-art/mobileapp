/**
 * ADMIN DASHBOARD LAYOUT
 * Desktop web-only interface for content management
 * Protected routes requiring admin authentication
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Slot, usePathname, useSegments } from 'expo-router';
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
  Settings,
  Shield,
  History,
  UsersRound,
  ListChecks,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useAdmin, useAdminPermissions, ROLE_DISPLAY_NAMES, ROLE_COLORS } from '@/lib/hooks/use-admin';

// Navigation items for admin sidebar
const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin', permission: 'canView' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users', permission: 'canManageUsers' },
  { id: 'exercises', label: 'Exercises', icon: ListChecks, path: '/admin/exercises', permission: 'canView' },
  { id: 'workouts', label: 'Workouts', icon: Dumbbell, path: '/admin/workouts', permission: 'canView' },
  { id: 'meals', label: 'Meals', icon: Utensils, path: '/admin/meals', permission: 'canView' },
  { id: 'fasting', label: 'Fasting Plans', icon: Timer, path: '/admin/fasting', permission: 'canView' },
  { id: 'daily-plans', label: 'Daily Plans', icon: Calendar, path: '/admin/daily-plans', permission: 'canView' },
  { id: 'pdf-templates', label: 'PDF Templates', icon: FileText, path: '/admin/pdf-templates', permission: 'canView' },
  { id: 'audit-log', label: 'Audit Log', icon: History, path: '/admin/audit-log', permission: 'canViewAuditLog' },
] as const;

// System navigation items
const SYSTEM_NAV_ITEMS = [
  { id: 'team', label: 'Team', icon: UsersRound, path: '/admin/team', permission: 'canManageAdmins' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings', permission: 'canView' },
] as const;

// Sidebar navigation component
function Sidebar({ 
  currentPath, 
  admin, 
  permissions,
  onSignOut 
}: { 
  currentPath: string;
  admin: { email: string; role: string; firstName?: string; lastName?: string } | null;
  permissions: ReturnType<typeof useAdminPermissions>;
  onSignOut: () => void;
}) {
  const handleNavigation = (path: string) => {
    router.push(path as any);
  };

  // Get admin initials
  const getInitials = () => {
    if (admin?.firstName && admin?.lastName) {
      return `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();
    }
    if (admin?.email) {
      return admin.email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  // Get role color
  const roleColor = admin?.role ? ROLE_COLORS[admin.role as keyof typeof ROLE_COLORS] : ROLE_COLORS.viewer;

  return (
    <View className="h-full w-64 border-r border-slate-700 bg-slate-900">
      {/* Logo */}
      <View className="border-b border-slate-700 p-6">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Shield size={24} color="#10b981" />
          </View>
          <View>
            <Text className="text-lg font-bold text-white">Commando</Text>
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
          // Check permission for this nav item
          const hasPermission = permissions[item.permission as keyof typeof permissions];
          if (!hasPermission) return null;

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

        {/* System section */}
        <Text className="mb-3 mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          System
        </Text>
        {SYSTEM_NAV_ITEMS.map((item) => {
          // Check permission for this nav item
          const hasPermission = permissions[item.permission as keyof typeof permissions];
          if (!hasPermission && item.permission === 'canManageAdmins') return null;

          const isActive = currentPath === item.path;
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
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Admin profile */}
      <View className="border-t border-slate-700 p-4">
        <View className="flex-row items-center">
          <View className={cn('h-10 w-10 items-center justify-center rounded-full', roleColor.bg)}>
            <Text className={cn('text-sm font-bold', roleColor.text)}>{getInitials()}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-sm font-medium text-white" numberOfLines={1}>
              {admin?.firstName && admin?.lastName 
                ? `${admin.firstName} ${admin.lastName}`
                : admin?.email || 'Admin User'}
            </Text>
            <Text className={cn('text-xs', roleColor.text)}>
              {admin?.role ? ROLE_DISPLAY_NAMES[admin.role as keyof typeof ROLE_DISPLAY_NAMES] : 'Admin'}
            </Text>
          </View>
          <Pressable onPress={onSignOut} className="p-2 rounded-lg hover:bg-slate-800">
            <LogOut size={18} color="#94a3b8" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// Top header component
function Header({ admin }: { admin: { role: string } | null }) {
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

        {/* Role badge */}
        {admin?.role && (
          <View className={cn(
            'flex-row items-center gap-2 rounded-lg px-3 py-2',
            ROLE_COLORS[admin.role as keyof typeof ROLE_COLORS]?.bg || 'bg-slate-800'
          )}>
            <Shield size={14} color={admin.role === 'super_admin' ? '#8b5cf6' : '#10b981'} />
            <Text className={cn(
              'text-xs font-medium',
              ROLE_COLORS[admin.role as keyof typeof ROLE_COLORS]?.text || 'text-slate-400'
            )}>
              {ROLE_DISPLAY_NAMES[admin.role as keyof typeof ROLE_DISPLAY_NAMES] || admin.role}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Loading screen
function LoadingScreen() {
  return (
    <View className="h-screen w-screen items-center justify-center bg-slate-950">
      <View className="items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">
          <Shield size={32} color="#8b5cf6" />
        </View>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text className="mt-4 text-slate-400">Loading admin dashboard...</Text>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const pathname = usePathname();
  const segments = useSegments();
  const { admin, isLoading, isAuthenticated, signOut } = useAdmin();
  const permissions = useAdminPermissions();

  // Check if we're on the login page
  const isLoginPage = pathname === '/admin/login';

  // Handle sign out
  const handleSignOut = async () => {
    await signOut();
    router.replace('/admin/login');
  };

  // If not authenticated and not on login page, redirect to login
  // This useEffect MUST be before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage]);

  // Show loading while checking auth
  if (isLoading && !isLoginPage) {
    return <LoadingScreen />;
  }

  // If on login page, just show the login screen (no sidebar)
  if (isLoginPage) {
    return <Slot />;
  }

  // If not authenticated, show loading (will redirect)
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  return (
    <View className="h-screen w-screen flex-row bg-slate-950">
      {/* Sidebar */}
      <Sidebar 
        currentPath={pathname} 
        admin={admin}
        permissions={permissions}
        onSignOut={handleSignOut}
      />

      {/* Main content area */}
      <View className="flex-1">
        {/* Header */}
        <Header admin={admin} />

        {/* Page content */}
        <ScrollView className="flex-1 bg-slate-950">
          <Slot />
        </ScrollView>
      </View>
    </View>
  );
}

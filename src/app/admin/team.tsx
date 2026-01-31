/**
 * ADMIN TEAM MANAGEMENT
 * Manage admin users, roles, and permissions
 * Only accessible by super_admin
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Search,
  Filter,
  X,
  Check,
  AlertCircle,
  Crown,
  Eye,
  Pencil,
} from 'lucide-react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { cn } from '@/lib/cn';
import { 
  useAdmin, 
  useAdminPermissions, 
  ADMIN_ROLES, 
  ROLE_DISPLAY_NAMES, 
  ROLE_COLORS,
  type AdminRole,
  type AdminUser 
} from '@/lib/hooks/use-admin';

// Mock admin users for demonstration (will be replaced with real data from Supabase)
const MOCK_ADMINS: AdminUser[] = [
  {
    id: '1',
    email: 'superadmin@commando.fit',
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'admin@commando.fit',
    role: 'admin',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '3',
    email: 'editor@commando.fit',
    role: 'editor',
    firstName: 'Jane',
    lastName: 'Smith',
    createdAt: '2024-02-01T00:00:00Z',
  },
  {
    id: '4',
    email: 'viewer@commando.fit',
    role: 'viewer',
    firstName: 'Bob',
    lastName: 'Wilson',
    createdAt: '2024-02-15T00:00:00Z',
  },
];

// Role icon component
function RoleIcon({ role, size = 16 }: { role: AdminRole; size?: number }) {
  switch (role) {
    case 'super_admin':
      return <Crown size={size} color="#8b5cf6" />;
    case 'admin':
      return <Shield size={size} color="#10b981" />;
    case 'editor':
      return <Pencil size={size} color="#3b82f6" />;
    case 'viewer':
      return <Eye size={size} color="#64748b" />;
    default:
      return <Users size={size} color="#64748b" />;
  }
}

// Admin card component
function AdminCard({ 
  admin, 
  currentUserId,
  onEdit, 
  onDelete 
}: { 
  admin: AdminUser; 
  currentUserId: string;
  onEdit: (admin: AdminUser) => void;
  onDelete: (admin: AdminUser) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isCurrentUser = admin.id === currentUserId;
  const roleColor = ROLE_COLORS[admin.role];

  const getInitials = () => {
    if (admin.firstName && admin.lastName) {
      return `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();
    }
    return admin.email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Animated.View 
      entering={FadeInDown.duration(300)}
      className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          {/* Avatar */}
          <View className={cn('h-12 w-12 items-center justify-center rounded-full', roleColor.bg)}>
            <Text className={cn('text-base font-bold', roleColor.text)}>{getInitials()}</Text>
          </View>

          {/* Info */}
          <View className="ml-4 flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-semibold text-white">
                {admin.firstName && admin.lastName 
                  ? `${admin.firstName} ${admin.lastName}`
                  : admin.email}
              </Text>
              {isCurrentUser && (
                <View className="ml-2 rounded-full bg-emerald-500/20 px-2 py-0.5">
                  <Text className="text-xs text-emerald-400">You</Text>
                </View>
              )}
            </View>
            <View className="mt-1 flex-row items-center">
              <Mail size={12} color="#64748b" />
              <Text className="ml-1 text-sm text-slate-400">{admin.email}</Text>
            </View>
          </View>

          {/* Role badge */}
          <View className={cn('flex-row items-center rounded-lg px-3 py-1.5', roleColor.bg)}>
            <RoleIcon role={admin.role} size={14} />
            <Text className={cn('ml-1.5 text-sm font-medium', roleColor.text)}>
              {ROLE_DISPLAY_NAMES[admin.role]}
            </Text>
          </View>
        </View>

        {/* Actions */}
        {!isCurrentUser && (
          <View className="relative ml-4">
            <Pressable
              onPress={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 hover:bg-slate-700"
            >
              <MoreVertical size={18} color="#94a3b8" />
            </Pressable>

            {showMenu && (
              <View className="absolute right-0 top-10 z-10 w-40 rounded-xl border border-slate-700 bg-slate-800 py-2 shadow-xl">
                <Pressable
                  onPress={() => {
                    onEdit(admin);
                    setShowMenu(false);
                  }}
                  className="flex-row items-center px-4 py-2 hover:bg-slate-700"
                >
                  <Edit size={16} color="#94a3b8" />
                  <Text className="ml-2 text-sm text-slate-300">Edit Role</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    onDelete(admin);
                    setShowMenu(false);
                  }}
                  className="flex-row items-center px-4 py-2 hover:bg-slate-700"
                >
                  <Trash2 size={16} color="#f43f5e" />
                  <Text className="ml-2 text-sm text-rose-400">Remove Admin</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="mt-4 flex-row items-center border-t border-slate-700 pt-3">
        <Calendar size={12} color="#64748b" />
        <Text className="ml-1 text-xs text-slate-500">
          Added {formatDate(admin.createdAt)}
        </Text>
      </View>
    </Animated.View>
  );
}

// Edit role modal
function EditRoleModal({
  visible,
  admin,
  onClose,
  onSave,
}: {
  visible: boolean;
  admin: AdminUser | null;
  onClose: () => void;
  onSave: (adminId: string, newRole: AdminRole) => void;
}) {
  const [selectedRole, setSelectedRole] = useState<AdminRole>(admin?.role || 'viewer');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (admin) {
      setSelectedRole(admin.role);
    }
  }, [admin]);

  const handleSave = async () => {
    if (!admin) return;
    setIsSaving(true);
    await onSave(admin.id, selectedRole);
    setIsSaving(false);
    onClose();
  };

  if (!admin) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60">
        <Animated.View 
          entering={FadeIn}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-white">Edit Admin Role</Text>
            <Pressable onPress={onClose} className="p-2 rounded-lg hover:bg-slate-800">
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Admin info */}
          <View className="mb-6 rounded-xl bg-slate-800/50 p-4">
            <Text className="text-sm text-slate-400">Editing role for:</Text>
            <Text className="mt-1 text-base font-medium text-white">
              {admin.firstName && admin.lastName 
                ? `${admin.firstName} ${admin.lastName}`
                : admin.email}
            </Text>
          </View>

          {/* Role selection */}
          <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-slate-300">Select Role</Text>
            {ADMIN_ROLES.map((role) => {
              const isSelected = selectedRole === role;
              const roleColor = ROLE_COLORS[role];

              return (
                <Pressable
                  key={role}
                  onPress={() => setSelectedRole(role)}
                  className={cn(
                    'mb-2 flex-row items-center rounded-xl border p-4',
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-500/10' 
                      : 'border-slate-700 bg-slate-800/50'
                  )}
                >
                  <View className={cn('h-10 w-10 items-center justify-center rounded-lg', roleColor.bg)}>
                    <RoleIcon role={role} size={20} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className={cn('text-sm font-medium', isSelected ? 'text-white' : 'text-slate-300')}>
                      {ROLE_DISPLAY_NAMES[role]}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {role === 'super_admin' && 'Full access + manage admins'}
                      {role === 'admin' && 'Full CRUD access'}
                      {role === 'editor' && 'Create & edit, no delete'}
                      {role === 'viewer' && 'Read-only access'}
                    </Text>
                  </View>
                  {isSelected && (
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-500">
                      <Check size={14} color="#fff" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-xl border border-slate-700 py-3"
            >
              <Text className="font-medium text-slate-400">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              disabled={isSaving || selectedRole === admin.role}
              className="flex-1 overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={isSaving || selectedRole === admin.role 
                  ? ['#374151', '#374151'] 
                  : ['#10b981', '#059669']}
                className="items-center py-3"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="font-medium text-white">Save Changes</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Invite admin modal
function InviteAdminModal({
  visible,
  onClose,
  onInvite,
}: {
  visible: boolean;
  onClose: () => void;
  onInvite: (email: string, role: AdminRole) => void;
}) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminRole>('editor');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvite = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsInviting(true);
    setError(null);
    await onInvite(email.trim().toLowerCase(), selectedRole);
    setIsInviting(false);
    setEmail('');
    setSelectedRole('editor');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View className="flex-1 items-center justify-center bg-black/60">
        <Animated.View 
          entering={FadeIn}
          className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View className="flex-row items-center">
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <UserPlus size={20} color="#10b981" />
              </View>
              <Text className="text-xl font-bold text-white">Invite Admin</Text>
            </View>
            <Pressable onPress={onClose} className="p-2 rounded-lg hover:bg-slate-800">
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          {/* Error message */}
          {error && (
            <View className="mb-4 flex-row items-center rounded-xl bg-rose-500/10 p-3">
              <AlertCircle size={18} color="#f43f5e" />
              <Text className="ml-2 text-sm text-rose-400">{error}</Text>
            </View>
          )}

          {/* Email input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-300">Email Address</Text>
            <View className="flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4">
              <Mail size={18} color="#64748b" />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(null);
                }}
                placeholder="admin@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 py-3 pl-3 text-white"
              />
            </View>
          </View>

          {/* Role selection */}
          <View className="mb-6">
            <Text className="mb-3 text-sm font-medium text-slate-300">Assign Role</Text>
            <View className="flex-row flex-wrap gap-2">
              {ADMIN_ROLES.filter(r => r !== 'super_admin').map((role) => {
                const isSelected = selectedRole === role;
                const roleColor = ROLE_COLORS[role];

                return (
                  <Pressable
                    key={role}
                    onPress={() => setSelectedRole(role)}
                    className={cn(
                      'flex-row items-center rounded-lg border px-3 py-2',
                      isSelected 
                        ? 'border-emerald-500 bg-emerald-500/10' 
                        : 'border-slate-700 bg-slate-800/50'
                    )}
                  >
                    <RoleIcon role={role} size={14} />
                    <Text className={cn('ml-1.5 text-sm', isSelected ? 'text-white' : 'text-slate-400')}>
                      {ROLE_DISPLAY_NAMES[role]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Note */}
          <View className="mb-6 rounded-xl bg-amber-500/10 p-3">
            <Text className="text-xs text-amber-400">
              An invitation email will be sent. The user must create an account or use their existing 
              account to access the admin dashboard.
            </Text>
          </View>

          {/* Actions */}
          <View className="flex-row gap-3">
            <Pressable
              onPress={onClose}
              className="flex-1 items-center rounded-xl border border-slate-700 py-3"
            >
              <Text className="font-medium text-slate-400">Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleInvite}
              disabled={isInviting}
              className="flex-1 overflow-hidden rounded-xl"
            >
              <LinearGradient
                colors={isInviting ? ['#374151', '#374151'] : ['#10b981', '#059669']}
                className="items-center py-3"
              >
                {isInviting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="font-medium text-white">Send Invite</Text>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

export default function TeamScreen() {
  const { admin: currentAdmin } = useAdmin();
  const { canManageAdmins, isSuperAdmin } = useAdminPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [admins, setAdmins] = useState<AdminUser[]>(MOCK_ADMINS);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [filterRole, setFilterRole] = useState<AdminRole | 'all'>('all');

  // Filter admins based on search and role
  const filteredAdmins = admins.filter((admin) => {
    const matchesSearch = 
      admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admin.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === 'all' || admin.role === filterRole;
    
    return matchesSearch && matchesRole;
  });

  // Handle edit role
  const handleEditRole = (admin: AdminUser) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
  };

  // Handle save role
  const handleSaveRole = async (adminId: string, newRole: AdminRole) => {
    // TODO: Implement actual role update via Supabase
    setAdmins((prev) =>
      prev.map((a) => (a.id === adminId ? { ...a, role: newRole } : a))
    );
  };

  // Handle delete admin
  const handleDeleteAdmin = async (admin: AdminUser) => {
    // TODO: Implement actual delete via Supabase
    if (confirm(`Remove ${admin.email} from the admin team?`)) {
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
    }
  };

  // Handle invite admin
  const handleInviteAdmin = async (email: string, role: AdminRole) => {
    // TODO: Implement actual invite via Supabase
    const newAdmin: AdminUser = {
      id: Date.now().toString(),
      email,
      role,
      createdAt: new Date().toISOString(),
    };
    setAdmins((prev) => [...prev, newAdmin]);
  };

  // Access denied if not super_admin
  if (!canManageAdmins) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <View className="items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-2xl bg-rose-500/20">
            <Shield size={40} color="#f43f5e" />
          </View>
          <Text className="text-xl font-bold text-white">Access Denied</Text>
          <Text className="mt-2 text-center text-slate-400">
            Only Super Admins can manage the admin team.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 p-6">
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Admin Team</Text>
          <Text className="mt-1 text-slate-400">
            Manage admin users and their permissions
          </Text>
        </View>

        <Pressable
          onPress={() => setShowInviteModal(true)}
          className="overflow-hidden rounded-xl"
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center px-4 py-3"
          >
            <UserPlus size={18} color="#fff" />
            <Text className="ml-2 font-semibold text-white">Invite Admin</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Search and filters */}
      <View className="mb-6 flex-row items-center gap-4">
        <View className="flex-1 flex-row items-center rounded-xl border border-slate-700 bg-slate-800/50 px-4">
          <Search size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or email..."
            placeholderTextColor="#64748b"
            className="flex-1 py-3 pl-3 text-white"
          />
        </View>

        {/* Role filter */}
        <View className="flex-row items-center gap-2">
          <Filter size={16} color="#64748b" />
          <Pressable
            onPress={() => setFilterRole('all')}
            className={cn(
              'rounded-lg px-3 py-2',
              filterRole === 'all' ? 'bg-emerald-500/20' : 'bg-slate-800'
            )}
          >
            <Text className={cn('text-sm', filterRole === 'all' ? 'text-emerald-400' : 'text-slate-400')}>
              All
            </Text>
          </Pressable>
          {ADMIN_ROLES.map((role) => (
            <Pressable
              key={role}
              onPress={() => setFilterRole(role)}
              className={cn(
                'rounded-lg px-3 py-2',
                filterRole === role ? 'bg-emerald-500/20' : 'bg-slate-800'
              )}
            >
              <Text className={cn('text-sm', filterRole === role ? 'text-emerald-400' : 'text-slate-400')}>
                {ROLE_DISPLAY_NAMES[role]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Stats */}
      <View className="mb-6 flex-row gap-4">
        {ADMIN_ROLES.map((role) => {
          const count = admins.filter((a) => a.role === role).length;
          const roleColor = ROLE_COLORS[role];

          return (
            <View
              key={role}
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            >
              <View className="flex-row items-center justify-between">
                <View className={cn('h-10 w-10 items-center justify-center rounded-lg', roleColor.bg)}>
                  <RoleIcon role={role} size={20} />
                </View>
                <Text className="text-2xl font-bold text-white">{count}</Text>
              </View>
              <Text className="mt-2 text-sm text-slate-400">{ROLE_DISPLAY_NAMES[role]}s</Text>
            </View>
          );
        })}
      </View>

      {/* Admin list */}
      <ScrollView className="flex-1">
        <View className="gap-3">
          {filteredAdmins.length === 0 ? (
            <View className="items-center py-12">
              <Users size={48} color="#374151" />
              <Text className="mt-4 text-slate-400">No admins found</Text>
            </View>
          ) : (
            filteredAdmins.map((admin) => (
              <AdminCard
                key={admin.id}
                admin={admin}
                currentUserId={currentAdmin?.id || ''}
                onEdit={handleEditRole}
                onDelete={handleDeleteAdmin}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Edit role modal */}
      <EditRoleModal
        visible={showEditModal}
        admin={selectedAdmin}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAdmin(null);
        }}
        onSave={handleSaveRole}
      />

      {/* Invite admin modal */}
      <InviteAdminModal
        visible={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInvite={handleInviteAdmin}
      />
    </View>
  );
}

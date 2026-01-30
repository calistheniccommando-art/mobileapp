/**
 * ADMIN - AUDIT LOG
 * Track all admin actions and system events
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import {
  History,
  Search,
  Filter,
  User,
  Dumbbell,
  Utensils,
  Timer,
  FileText,
  Settings,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  ChevronDown,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';

// ==================== TYPES ====================

type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'view'
  | 'export'
  | 'login'
  | 'logout'
  | 'override';

type AuditCategory =
  | 'user'
  | 'workout'
  | 'meal'
  | 'fasting'
  | 'daily_plan'
  | 'pdf_template'
  | 'system'
  | 'auth';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  category: AuditCategory;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: 'super_admin' | 'admin' | 'editor' | 'viewer';
  };
  target: {
    id: string;
    type: string;
    name: string;
  } | null;
  details: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
}

// ==================== MOCK DATA ====================

const MOCK_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2024-01-30T14:32:00Z',
    action: 'approve',
    category: 'workout',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: { id: 'video-123', type: 'exercise_video', name: 'Push-Ups Tutorial' },
    details: 'Approved exercise video for publication',
    metadata: { previousStatus: 'pending_review', newStatus: 'approved' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-2',
    timestamp: '2024-01-30T14:15:00Z',
    action: 'update',
    category: 'meal',
    performedBy: { id: 'editor-1', name: 'Sarah Editor', email: 'sarah@fitlife.com', role: 'editor' },
    target: { id: 'meal-5', type: 'meal', name: 'Salmon with Asparagus' },
    details: 'Updated meal nutrition information',
    metadata: { changedFields: ['calories', 'protein'] },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
  {
    id: 'log-3',
    timestamp: '2024-01-30T13:45:00Z',
    action: 'override',
    category: 'daily_plan',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: { id: 'user-123', type: 'user', name: 'John Smith' },
    details: 'Applied workout override to daily plan',
    metadata: { originalWorkout: 'HIIT Blast', newWorkout: 'Morning Energizer', reason: 'User injury' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-4',
    timestamp: '2024-01-30T12:30:00Z',
    action: 'create',
    category: 'pdf_template',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: { id: 'template-new', type: 'pdf_template', name: 'Weekly Summary - Compact' },
    details: 'Created new PDF template',
    metadata: { templateType: 'weekly' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-5',
    timestamp: '2024-01-30T11:00:00Z',
    action: 'reject',
    category: 'workout',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: { id: 'video-456', type: 'exercise_video', name: 'Burpees Demo' },
    details: 'Rejected exercise video - poor quality',
    metadata: { reason: 'Video quality below standards', previousStatus: 'pending_review' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-6',
    timestamp: '2024-01-30T10:15:00Z',
    action: 'login',
    category: 'auth',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: null,
    details: 'Admin login successful',
    metadata: { loginMethod: 'email' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-7',
    timestamp: '2024-01-30T09:30:00Z',
    action: 'update',
    category: 'fasting',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: { id: 'fp-3', type: 'fasting_plan', name: '16:8 Plan' },
    details: 'Modified default fasting plan assignment rules',
    metadata: { changedFields: ['assignedWorkTypes', 'weightThresholds'] },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-8',
    timestamp: '2024-01-29T16:45:00Z',
    action: 'delete',
    category: 'user',
    performedBy: { id: 'super-admin', name: 'Super Admin', email: 'super@fitlife.com', role: 'super_admin' },
    target: { id: 'user-old', type: 'user', name: 'Inactive User' },
    details: 'Deleted inactive user account',
    metadata: { reason: 'User requested account deletion' },
    ipAddress: '192.168.1.50',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-9',
    timestamp: '2024-01-29T15:00:00Z',
    action: 'export',
    category: 'system',
    performedBy: { id: 'admin-1', name: 'Admin User', email: 'admin@fitlife.com', role: 'admin' },
    target: null,
    details: 'Exported user data report',
    metadata: { exportType: 'csv', recordCount: 150 },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  },
  {
    id: 'log-10',
    timestamp: '2024-01-29T14:00:00Z',
    action: 'view',
    category: 'user',
    performedBy: { id: 'viewer-1', name: 'Support Staff', email: 'support@fitlife.com', role: 'viewer' },
    target: { id: 'user-123', type: 'user', name: 'John Smith' },
    details: 'Viewed user profile for support ticket',
    metadata: { ticketId: 'SUPPORT-456' },
    ipAddress: '192.168.1.200',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  },
];

// ==================== COMPONENTS ====================

// Action icon mapping
function ActionIcon({ action }: { action: AuditAction }) {
  const iconMap: Record<AuditAction, { icon: typeof Edit; color: string }> = {
    create: { icon: Plus, color: '#10b981' },
    update: { icon: Edit, color: '#f59e0b' },
    delete: { icon: Trash2, color: '#ef4444' },
    approve: { icon: CheckCircle, color: '#10b981' },
    reject: { icon: XCircle, color: '#ef4444' },
    view: { icon: Eye, color: '#64748b' },
    export: { icon: Download, color: '#06b6d4' },
    login: { icon: Shield, color: '#a78bfa' },
    logout: { icon: Shield, color: '#64748b' },
    override: { icon: AlertCircle, color: '#f59e0b' },
  };

  const { icon: Icon, color } = iconMap[action];

  return (
    <View className="h-8 w-8 items-center justify-center rounded-full bg-slate-800">
      <Icon size={14} color={color} />
    </View>
  );
}

// Category icon mapping
function CategoryIcon({ category }: { category: AuditCategory }) {
  const iconMap: Record<AuditCategory, { icon: typeof User; color: string }> = {
    user: { icon: User, color: '#a78bfa' },
    workout: { icon: Dumbbell, color: '#06b6d4' },
    meal: { icon: Utensils, color: '#10b981' },
    fasting: { icon: Timer, color: '#f59e0b' },
    daily_plan: { icon: Calendar, color: '#ec4899' },
    pdf_template: { icon: FileText, color: '#8b5cf6' },
    system: { icon: Settings, color: '#64748b' },
    auth: { icon: Shield, color: '#3b82f6' },
  };

  const { icon: Icon, color } = iconMap[category];

  return <Icon size={12} color={color} />;
}

// Action badge
function ActionBadge({ action }: { action: AuditAction }) {
  const config: Record<AuditAction, { bg: string; text: string }> = {
    create: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    update: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    delete: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
    approve: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    reject: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
    view: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    export: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
    login: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
    logout: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
    override: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  };

  const { bg, text } = config[action];

  return (
    <View className={cn('rounded px-2 py-0.5', bg)}>
      <Text className={cn('text-xs capitalize', text)}>{action}</Text>
    </View>
  );
}

// Role badge
function RoleBadge({ role }: { role: AuditLogEntry['performedBy']['role'] }) {
  const config: Record<typeof role, { bg: string; text: string }> = {
    super_admin: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
    admin: { bg: 'bg-violet-500/20', text: 'text-violet-400' },
    editor: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    viewer: { bg: 'bg-slate-500/20', text: 'text-slate-400' },
  };

  const { bg, text } = config[role];
  const label = role.replace('_', ' ');

  return (
    <View className={cn('rounded px-1.5 py-0.5', bg)}>
      <Text className={cn('text-xs capitalize', text)}>{label}</Text>
    </View>
  );
}

// Audit log entry row
function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  const timestamp = new Date(entry.timestamp);
  const formattedDate = timestamp.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
  const formattedTime = timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable className="flex-row items-center border-b border-slate-700/50 px-4 py-3 active:bg-slate-800/50">
      {/* Action icon */}
      <View className="mr-4">
        <ActionIcon action={entry.action} />
      </View>

      {/* Main content */}
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <ActionBadge action={entry.action} />
          <View className="flex-row items-center">
            <CategoryIcon category={entry.category} />
            <Text className="ml-1 text-xs capitalize text-slate-500">{entry.category.replace('_', ' ')}</Text>
          </View>
        </View>

        <Text className="mt-1 text-sm text-white">{entry.details}</Text>

        {entry.target && (
          <Text className="mt-0.5 text-xs text-slate-500">
            Target: {entry.target.name} ({entry.target.type.replace('_', ' ')})
          </Text>
        )}
      </View>

      {/* Performed by */}
      <View className="mx-4 w-40">
        <View className="flex-row items-center gap-2">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-700">
            <User size={12} color="#94a3b8" />
          </View>
          <View>
            <Text className="text-sm text-white">{entry.performedBy.name}</Text>
            <RoleBadge role={entry.performedBy.role} />
          </View>
        </View>
      </View>

      {/* Timestamp */}
      <View className="w-24 items-end">
        <Text className="text-sm text-slate-400">{formattedTime}</Text>
        <Text className="text-xs text-slate-600">{formattedDate}</Text>
      </View>
    </Pressable>
  );
}

// Filter dropdown button
function FilterButton({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center rounded-lg bg-slate-800 px-3 py-2"
    >
      <Text className="text-xs text-slate-500">{label}:</Text>
      <Text className="ml-1.5 text-sm text-white">{value}</Text>
      <ChevronDown size={14} color="#64748b" style={{ marginLeft: 4 }} />
    </Pressable>
  );
}

// Stats card
function StatsCard({
  icon: Icon,
  iconColor,
  label,
  value,
  change,
}: {
  icon: typeof History;
  iconColor: string;
  label: string;
  value: number;
  change?: { value: number; isPositive: boolean };
}) {
  return (
    <View className="flex-1 rounded-xl bg-slate-800 p-4">
      <View className="flex-row items-center justify-between">
        <Icon size={18} color={iconColor} />
        {change && (
          <Text className={cn('text-xs', change.isPositive ? 'text-emerald-400' : 'text-rose-400')}>
            {`${change.isPositive ? '+' : ''}${change.value}%`}
          </Text>
        )}
      </View>
      <Text className="mt-3 text-2xl font-bold text-white">{value}</Text>
      <Text className="mt-0.5 text-xs text-slate-500">{label}</Text>
    </View>
  );
}

// ==================== MAIN COMPONENT ====================

export default function AdminAuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<AuditCategory | 'all'>('all');
  const [actionFilter, setActionFilter] = useState<AuditAction | 'all'>('all');

  // Filter logs
  const filteredLogs = useMemo(() => {
    return MOCK_AUDIT_LOGS.filter((log) => {
      const matchesSearch =
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.performedBy.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (log.target?.name.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory = categoryFilter === 'all' || log.category === categoryFilter;
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;

      return matchesSearch && matchesCategory && matchesAction;
    });
  }, [searchQuery, categoryFilter, actionFilter]);

  // Statistics
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = MOCK_AUDIT_LOGS.filter((log) => new Date(log.timestamp) >= today);
    const approvals = MOCK_AUDIT_LOGS.filter((log) => log.action === 'approve').length;
    const rejections = MOCK_AUDIT_LOGS.filter((log) => log.action === 'reject').length;
    const modifications = MOCK_AUDIT_LOGS.filter(
      (log) => log.action === 'update' || log.action === 'override'
    ).length;

    return {
      total: MOCK_AUDIT_LOGS.length,
      today: todayLogs.length,
      approvals,
      rejections,
      modifications,
    };
  }, []);

  return (
    <View className="flex-1 p-6">
      {/* Page header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Audit Log</Text>
          <Text className="text-sm text-slate-400">
            Track all admin actions and system events
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Pressable className="flex-row items-center rounded-lg bg-slate-800 px-3 py-2">
            <Download size={16} color="#94a3b8" />
            <Text className="ml-2 text-sm text-slate-400">Export</Text>
          </Pressable>
          <Pressable className="flex-row items-center rounded-lg bg-slate-800 px-3 py-2">
            <RefreshCw size={16} color="#94a3b8" />
            <Text className="ml-2 text-sm text-slate-400">Refresh</Text>
          </Pressable>
        </View>
      </View>

      {/* Stats */}
      <View className="mb-6 flex-row gap-4">
        <StatsCard
          icon={History}
          iconColor="#a78bfa"
          label="Total Events"
          value={stats.total}
        />
        <StatsCard
          icon={Calendar}
          iconColor="#06b6d4"
          label="Today"
          value={stats.today}
          change={{ value: 12, isPositive: true }}
        />
        <StatsCard
          icon={CheckCircle}
          iconColor="#10b981"
          label="Approvals"
          value={stats.approvals}
        />
        <StatsCard
          icon={XCircle}
          iconColor="#ef4444"
          label="Rejections"
          value={stats.rejections}
        />
        <StatsCard
          icon={Edit}
          iconColor="#f59e0b"
          label="Modifications"
          value={stats.modifications}
        />
      </View>

      {/* Filters */}
      <View className="mb-4 flex-row items-center gap-3">
        {/* Search */}
        <View className="flex-1 flex-row items-center rounded-lg bg-slate-800 px-3 py-2">
          <Search size={16} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search logs by user, action, or target..."
            placeholderTextColor="#64748b"
            className="ml-2 flex-1 text-sm text-white"
          />
        </View>

        {/* Category filter */}
        <View className="flex-row items-center gap-2">
          <Filter size={14} color="#64748b" />
          {(['all', 'user', 'workout', 'meal', 'fasting', 'daily_plan', 'auth'] as const).map(
            (category) => (
              <Pressable
                key={category}
                onPress={() => setCategoryFilter(category)}
                className={cn(
                  'rounded-lg px-3 py-1.5',
                  categoryFilter === category ? 'bg-violet-500' : 'bg-slate-800'
                )}
              >
                <Text
                  className={cn(
                    'text-xs capitalize',
                    categoryFilter === category ? 'text-white' : 'text-slate-400'
                  )}
                >
                  {category === 'all' ? 'All' : category.replace('_', ' ')}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </View>

      {/* Action quick filters */}
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-xs text-slate-500">Actions:</Text>
        {(['all', 'create', 'update', 'delete', 'approve', 'reject', 'override'] as const).map(
          (action) => (
            <Pressable
              key={action}
              onPress={() => setActionFilter(action)}
              className={cn(
                'rounded-lg px-2.5 py-1',
                actionFilter === action ? 'bg-emerald-500' : 'bg-slate-800'
              )}
            >
              <Text
                className={cn(
                  'text-xs capitalize',
                  actionFilter === action ? 'text-white' : 'text-slate-400'
                )}
              >
                {action}
              </Text>
            </Pressable>
          )
        )}
      </View>

      {/* Audit log table */}
      <View className="flex-1 rounded-xl border border-slate-700 bg-slate-900">
        {/* Table header */}
        <View className="flex-row items-center border-b border-slate-700 bg-slate-800/50 px-4 py-3">
          <View className="mr-4 w-8" />
          <Text className="flex-1 text-xs font-medium uppercase text-slate-500">Event Details</Text>
          <Text className="mx-4 w-40 text-xs font-medium uppercase text-slate-500">Performed By</Text>
          <Text className="w-24 text-right text-xs font-medium uppercase text-slate-500">Time</Text>
        </View>

        {/* Log entries */}
        <ScrollView className="flex-1">
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => <AuditLogRow key={log.id} entry={log} />)
          ) : (
            <View className="items-center justify-center py-12">
              <History size={32} color="#64748b" />
              <Text className="mt-3 text-slate-500">No audit logs match your filters</Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

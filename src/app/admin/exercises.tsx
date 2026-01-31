/**
 * ADMIN EXERCISES SCREEN
 * Full CRUD interface for exercise library management
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  Plus,
  Search,
  Filter,
  Dumbbell,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  X,
  Youtube,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { useAdminPermissions } from '@/lib/hooks/use-admin';
import {
  exerciseService,
  MUSCLE_GROUP_LABELS,
  EXERCISE_TYPE_LABELS,
  DIFFICULTY_LABELS,
  MUSCLE_GROUP_COLORS,
  type Exercise,
  type ExerciseFilters,
  type ExerciseInsert,
  type ExerciseUpdate,
} from '@/lib/supabase/exercises';
import type { MuscleGroup, ExerciseType, FitnessLevel } from '@/lib/supabase/types';
import ExerciseForm from '@/components/admin/ExerciseForm';

// ==================== CONSTANTS ====================

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'core', 'glutes', 'full_body', 'cardio'
];

const EXERCISE_TYPES: ExerciseType[] = ['strength', 'cardio', 'flexibility', 'hiit'];

const DIFFICULTY_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

// ==================== COMPONENT ====================

export default function AdminExercisesScreen() {
  const permissions = useAdminPermissions();

  // Data state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  // Filters
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ExerciseFilters>({});

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Action menu
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load exercises
  const loadExercises = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await exerciseService.list({
        filters: { ...filters, search: search || undefined },
        page,
        pageSize,
        orderBy: 'name',
        orderDirection: 'asc',
      });
      setExercises(result.exercises);
      setTotalPages(result.totalPages);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  }, [filters, search, page]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Show toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // CRUD handlers
  const handleCreate = () => {
    setEditingExercise(null);
    setShowForm(true);
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowForm(true);
    setActionMenuId(null);
  };

  const handleSave = async (data: ExerciseInsert | ExerciseUpdate) => {
    setFormLoading(true);
    try {
      if (editingExercise) {
        await exerciseService.update(editingExercise.id, data as ExerciseUpdate);
        showToast('success', 'Exercise updated successfully');
      } else {
        await exerciseService.create(data as ExerciseInsert);
        showToast('success', 'Exercise created successfully');
      }
      setShowForm(false);
      setEditingExercise(null);
      loadExercises();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to save exercise');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await exerciseService.softDelete(id);
      showToast('success', 'Exercise deleted');
      loadExercises();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
    setActionMenuId(null);
  };

  const handleRestore = async (id: string) => {
    try {
      await exerciseService.restore(id);
      showToast('success', 'Exercise restored');
      loadExercises();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to restore');
    }
    setActionMenuId(null);
  };

  const handleDuplicate = async (id: string) => {
    try {
      await exerciseService.duplicate(id);
      showToast('success', 'Exercise duplicated');
      loadExercises();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to duplicate');
    }
    setActionMenuId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    try {
      await exerciseService.bulkSoftDelete(Array.from(selectedIds));
      showToast('success', `${selectedIds.size} exercises deleted`);
      setSelectedIds(new Set());
      loadExercises();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === exercises.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(exercises.map(e => e.id)));
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({});
    setSearch('');
    setPage(1);
  };

  const hasActiveFilters = Object.keys(filters).length > 0 || search;

  return (
    <View className="flex-1 p-6">
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Exercises</Text>
          <Text className="text-slate-400">
            {total} exercise{total !== 1 ? 's' : ''} in library
          </Text>
        </View>

        {permissions.canEdit && (
          <Pressable
            onPress={handleCreate}
            className="flex-row items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3"
          >
            <Plus size={18} color="#fff" />
            <Text className="font-semibold text-white">Add Exercise</Text>
          </Pressable>
        )}
      </View>

      {/* Search & Filters */}
      <View className="mb-4 flex-row items-center gap-3">
        {/* Search */}
        <View className="flex-1 flex-row items-center rounded-xl bg-slate-800 border border-slate-700 px-4 py-3">
          <Search size={18} color="#64748b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search exercises..."
            placeholderTextColor="#64748b"
            className="ml-3 flex-1 text-white"
          />
          {search && (
            <Pressable onPress={() => setSearch('')}>
              <X size={16} color="#64748b" />
            </Pressable>
          )}
        </View>

        {/* Filter button */}
        <Pressable
          onPress={() => setShowFilters(!showFilters)}
          className={cn(
            'flex-row items-center gap-2 rounded-xl border px-4 py-3',
            showFilters || hasActiveFilters
              ? 'bg-violet-500/20 border-violet-500'
              : 'bg-slate-800 border-slate-700'
          )}
        >
          <Filter size={18} color={showFilters || hasActiveFilters ? '#8b5cf6' : '#64748b'} />
          <Text className={showFilters || hasActiveFilters ? 'text-violet-400' : 'text-slate-400'}>
            Filters
          </Text>
          {hasActiveFilters && (
            <View className="h-2 w-2 rounded-full bg-violet-500" />
          )}
        </Pressable>

        {/* Bulk actions */}
        {selectedIds.size > 0 && permissions.canEdit && (
          <Pressable
            onPress={handleBulkDelete}
            className="flex-row items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500 px-4 py-3"
          >
            <Trash2 size={18} color="#f43f5e" />
            <Text className="text-rose-400">Delete ({selectedIds.size})</Text>
          </Pressable>
        )}
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View className="mb-4 rounded-xl bg-slate-800 border border-slate-700 p-4">
          {/* Difficulty */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-400">Difficulty</Text>
            <View className="flex-row flex-wrap gap-2">
              {DIFFICULTY_LEVELS.map(level => (
                <Pressable
                  key={level}
                  onPress={() => setFilters(f => ({
                    ...f,
                    difficulty: f.difficulty === level ? undefined : level
                  }))}
                  className={cn(
                    'rounded-lg px-3 py-2 border',
                    filters.difficulty === level
                      ? 'bg-violet-500/20 border-violet-500'
                      : 'bg-slate-700 border-transparent'
                  )}
                >
                  <Text className={filters.difficulty === level ? 'text-violet-400' : 'text-slate-300'}>
                    {DIFFICULTY_LABELS[level]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Exercise Type */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-400">Exercise Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {EXERCISE_TYPES.map(type => (
                <Pressable
                  key={type}
                  onPress={() => setFilters(f => ({
                    ...f,
                    exerciseType: f.exerciseType === type ? undefined : type
                  }))}
                  className={cn(
                    'rounded-lg px-3 py-2 border',
                    filters.exerciseType === type
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : 'bg-slate-700 border-transparent'
                  )}
                >
                  <Text className={filters.exerciseType === type ? 'text-emerald-400' : 'text-slate-300'}>
                    {EXERCISE_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Muscle Groups */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-400">Muscle Groups</Text>
            <View className="flex-row flex-wrap gap-2">
              {MUSCLE_GROUPS.map(mg => {
                const isSelected = filters.muscleGroups?.includes(mg);
                return (
                  <Pressable
                    key={mg}
                    onPress={() => setFilters(f => {
                      const current = f.muscleGroups || [];
                      return {
                        ...f,
                        muscleGroups: isSelected
                          ? current.filter(g => g !== mg)
                          : [...current, mg]
                      };
                    })}
                    className={cn(
                      'rounded-lg px-3 py-2 border',
                      isSelected
                        ? `${MUSCLE_GROUP_COLORS[mg].bg} border-transparent`
                        : 'bg-slate-700 border-transparent'
                    )}
                  >
                    <Text className={isSelected ? MUSCLE_GROUP_COLORS[mg].text : 'text-slate-300'}>
                      {MUSCLE_GROUP_LABELS[mg]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Status */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-medium text-slate-400">Status</Text>
            <View className="flex-row gap-2">
              <Pressable
                onPress={() => setFilters(f => ({ ...f, isActive: f.isActive === true ? undefined : true }))}
                className={cn(
                  'rounded-lg px-3 py-2 border',
                  filters.isActive === true
                    ? 'bg-emerald-500/20 border-emerald-500'
                    : 'bg-slate-700 border-transparent'
                )}
              >
                <Text className={filters.isActive === true ? 'text-emerald-400' : 'text-slate-300'}>
                  Active
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setFilters(f => ({ ...f, isActive: f.isActive === false ? undefined : false }))}
                className={cn(
                  'rounded-lg px-3 py-2 border',
                  filters.isActive === false
                    ? 'bg-rose-500/20 border-rose-500'
                    : 'bg-slate-700 border-transparent'
                )}
              >
                <Text className={filters.isActive === false ? 'text-rose-400' : 'text-slate-300'}>
                  Inactive
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Clear filters */}
          {hasActiveFilters && (
            <Pressable onPress={clearFilters} className="self-start">
              <Text className="text-violet-400">Clear all filters</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Error state */}
      {error && (
        <View className="mb-4 flex-row items-center gap-2 rounded-xl bg-rose-500/20 border border-rose-500 p-4">
          <AlertCircle size={18} color="#f43f5e" />
          <Text className="text-rose-400">{error}</Text>
        </View>
      )}

      {/* Loading state */}
      {loading ? (
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text className="mt-4 text-slate-400">Loading exercises...</Text>
        </View>
      ) : exercises.length === 0 ? (
        <View className="flex-1 items-center justify-center py-12">
          <Dumbbell size={48} color="#64748b" />
          <Text className="mt-4 text-lg text-slate-400">No exercises found</Text>
          <Text className="text-slate-500">
            {hasActiveFilters ? 'Try adjusting your filters' : 'Add your first exercise to get started'}
          </Text>
        </View>
      ) : (
        <>
          {/* Table Header */}
          <View className="flex-row items-center rounded-t-xl bg-slate-800 border border-slate-700 px-4 py-3">
            <Pressable onPress={toggleSelectAll} className="mr-4">
              <View className={cn(
                'h-5 w-5 rounded border',
                selectedIds.size === exercises.length
                  ? 'bg-violet-500 border-violet-500'
                  : 'border-slate-500'
              )}>
                {selectedIds.size === exercises.length && (
                  <CheckCircle size={18} color="#fff" />
                )}
              </View>
            </Pressable>
            <Text className="flex-1 text-sm font-medium text-slate-400">Exercise</Text>
            <Text className="w-24 text-sm font-medium text-slate-400">Type</Text>
            <Text className="w-28 text-sm font-medium text-slate-400">Difficulty</Text>
            <Text className="w-32 text-sm font-medium text-slate-400">Muscles</Text>
            <Text className="w-20 text-sm font-medium text-slate-400">Status</Text>
            <Text className="w-16 text-sm font-medium text-slate-400"></Text>
          </View>

          {/* Table Body */}
          <ScrollView className="flex-1 border-x border-slate-700">
            {exercises.map((exercise, index) => (
              <View
                key={exercise.id}
                className={cn(
                  'flex-row items-center border-b border-slate-700 px-4 py-3',
                  selectedIds.has(exercise.id) && 'bg-violet-500/10'
                )}
              >
                {/* Checkbox */}
                <Pressable onPress={() => toggleSelect(exercise.id)} className="mr-4">
                  <View className={cn(
                    'h-5 w-5 rounded border',
                    selectedIds.has(exercise.id)
                      ? 'bg-violet-500 border-violet-500'
                      : 'border-slate-500'
                  )}>
                    {selectedIds.has(exercise.id) && (
                      <CheckCircle size={18} color="#fff" />
                    )}
                  </View>
                </Pressable>

                {/* Name & Description */}
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="font-medium text-white">{exercise.name}</Text>
                    {exercise.youtube_video_id && (
                      <Youtube size={14} color="#ef4444" />
                    )}
                  </View>
                  <Text className="text-sm text-slate-400" numberOfLines={1}>
                    {exercise.description}
                  </Text>
                </View>

                {/* Type */}
                <View className="w-24">
                  <Text className="text-sm text-slate-300">
                    {EXERCISE_TYPE_LABELS[exercise.exercise_type]}
                  </Text>
                </View>

                {/* Difficulty */}
                <View className="w-28">
                  <View className={cn(
                    'self-start rounded-lg px-2 py-1',
                    exercise.difficulty === 'beginner' && 'bg-emerald-500/20',
                    exercise.difficulty === 'intermediate' && 'bg-yellow-500/20',
                    exercise.difficulty === 'advanced' && 'bg-rose-500/20'
                  )}>
                    <Text className={cn(
                      'text-xs font-medium',
                      exercise.difficulty === 'beginner' && 'text-emerald-400',
                      exercise.difficulty === 'intermediate' && 'text-yellow-400',
                      exercise.difficulty === 'advanced' && 'text-rose-400'
                    )}>
                      {DIFFICULTY_LABELS[exercise.difficulty]}
                    </Text>
                  </View>
                </View>

                {/* Muscles */}
                <View className="w-32 flex-row flex-wrap gap-1">
                  {exercise.muscle_groups.slice(0, 2).map(mg => (
                    <View key={mg} className={cn('rounded px-1.5 py-0.5', MUSCLE_GROUP_COLORS[mg].bg)}>
                      <Text className={cn('text-xs', MUSCLE_GROUP_COLORS[mg].text)}>
                        {MUSCLE_GROUP_LABELS[mg]}
                      </Text>
                    </View>
                  ))}
                  {exercise.muscle_groups.length > 2 && (
                    <Text className="text-xs text-slate-400">+{exercise.muscle_groups.length - 2}</Text>
                  )}
                </View>

                {/* Status */}
                <View className="w-20">
                  <View className={cn(
                    'self-start rounded-full px-2 py-1',
                    exercise.is_active ? 'bg-emerald-500/20' : 'bg-slate-700'
                  )}>
                    <Text className={cn(
                      'text-xs',
                      exercise.is_active ? 'text-emerald-400' : 'text-slate-400'
                    )}>
                      {exercise.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View className="w-16 relative">
                  <Pressable
                    onPress={() => setActionMenuId(actionMenuId === exercise.id ? null : exercise.id)}
                    className="p-2 rounded-lg hover:bg-slate-700"
                  >
                    <MoreVertical size={18} color="#94a3b8" />
                  </Pressable>

                  {/* Action menu */}
                  {actionMenuId === exercise.id && (
                    <View className="absolute right-0 top-10 z-10 w-40 rounded-xl bg-slate-800 border border-slate-700 shadow-lg overflow-hidden">
                      {permissions.canEdit && (
                        <>
                          <Pressable
                            onPress={() => handleEdit(exercise)}
                            className="flex-row items-center gap-2 px-4 py-3 hover:bg-slate-700"
                          >
                            <Edit3 size={16} color="#94a3b8" />
                            <Text className="text-slate-300">Edit</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleDuplicate(exercise.id)}
                            className="flex-row items-center gap-2 px-4 py-3 hover:bg-slate-700"
                          >
                            <Copy size={16} color="#94a3b8" />
                            <Text className="text-slate-300">Duplicate</Text>
                          </Pressable>
                        </>
                      )}
                      {permissions.canEdit && (
                        exercise.is_active ? (
                          <Pressable
                            onPress={() => handleDelete(exercise.id)}
                            className="flex-row items-center gap-2 px-4 py-3 hover:bg-rose-500/20"
                          >
                            <Trash2 size={16} color="#f43f5e" />
                            <Text className="text-rose-400">Delete</Text>
                          </Pressable>
                        ) : (
                          <Pressable
                            onPress={() => handleRestore(exercise.id)}
                            className="flex-row items-center gap-2 px-4 py-3 hover:bg-emerald-500/20"
                          >
                            <RotateCcw size={16} color="#10b981" />
                            <Text className="text-emerald-400">Restore</Text>
                          </Pressable>
                        )
                      )}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Pagination */}
          <View className="flex-row items-center justify-between rounded-b-xl bg-slate-800 border border-t-0 border-slate-700 px-4 py-3">
            <Text className="text-sm text-slate-400">
              Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, total)} of {total}
            </Text>
            <View className="flex-row items-center gap-2">
              <Pressable
                onPress={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={cn(
                  'p-2 rounded-lg',
                  page === 1 ? 'opacity-50' : 'hover:bg-slate-700'
                )}
              >
                <ChevronLeft size={18} color="#94a3b8" />
              </Pressable>
              <Text className="text-slate-300">
                Page {page} of {totalPages}
              </Text>
              <Pressable
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={cn(
                  'p-2 rounded-lg',
                  page === totalPages ? 'opacity-50' : 'hover:bg-slate-700'
                )}
              >
                <ChevronRight size={18} color="#94a3b8" />
              </Pressable>
            </View>
          </View>
        </>
      )}

      {/* Exercise Form Modal */}
      <Modal
        visible={showForm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowForm(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 p-4">
          <View className="w-full max-w-2xl" style={{ maxHeight: '90%' }}>
            <ExerciseForm
              exercise={editingExercise}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingExercise(null);
              }}
              isLoading={formLoading}
            />
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toast && (
        <View
          className={cn(
            'absolute bottom-6 right-6 flex-row items-center gap-2 rounded-xl px-4 py-3 shadow-lg',
            toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
          )}
        >
          {toast.type === 'success' ? (
            <CheckCircle size={18} color="#fff" />
          ) : (
            <AlertCircle size={18} color="#fff" />
          )}
          <Text className="text-white font-medium">{toast.message}</Text>
        </View>
      )}
    </View>
  );
}

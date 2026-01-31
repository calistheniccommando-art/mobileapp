/**
 * Workout Builder Component
 * 
 * Interactive workout builder for admin panel
 * Allows adding/removing/reordering exercises
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import {
  X,
  Save,
  Plus,
  Trash2,
  GripVertical,
  Search,
  Dumbbell,
  Clock,
  Flame,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Filter,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import type { WorkoutTemplate, WorkoutTemplateInsert, WorkoutTemplateUpdate } from '@/lib/supabase/workouts';
import type { Exercise } from '@/lib/supabase/exercises';
import { exerciseService, MUSCLE_GROUP_LABELS, DIFFICULTY_LABELS, MUSCLE_GROUP_COLORS } from '@/lib/supabase/exercises';
import type { MuscleGroup, FitnessLevel } from '@/lib/supabase/types';

// ==================== TYPES ====================

interface WorkoutBuilderProps {
  workout?: WorkoutTemplate | null;
  initialExercises?: Exercise[];
  onSave: (data: WorkoutTemplateInsert | WorkoutTemplateUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  exercises?: string;
}

// ==================== CONSTANTS ====================

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'core', 'glutes', 'full_body', 'cardio'
];

const DIFFICULTY_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

// ==================== COMPONENT ====================

export default function WorkoutBuilder({
  workout,
  initialExercises = [],
  onSave,
  onCancel,
  isLoading = false,
}: WorkoutBuilderProps) {
  const isEditing = !!workout;

  // Form state
  const [name, setName] = useState(workout?.name || '');
  const [description, setDescription] = useState(workout?.description || '');
  const [difficulty, setDifficulty] = useState<FitnessLevel>(workout?.difficulty || 'beginner');
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<MuscleGroup[]>(workout?.target_muscle_groups || []);
  const [estimatedDuration, setEstimatedDuration] = useState(String(workout?.estimated_duration_minutes || 30));
  const [estimatedCalories, setEstimatedCalories] = useState(String(workout?.estimated_calories || ''));
  const [isActive, setIsActive] = useState(workout?.is_active ?? true);

  // Exercise state
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>(initialExercises);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseFilter, setExerciseFilter] = useState<MuscleGroup | null>(null);
  const [loadingExercises, setLoadingExercises] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Load available exercises
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoadingExercises(true);
    try {
      const result = await exerciseService.list({
        filters: { isActive: true },
        pageSize: 100,
      });
      setAvailableExercises(result.exercises);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  };

  // Filter exercises for picker
  const filteredExercises = availableExercises.filter(exercise => {
    const matchesSearch = !exerciseSearch || 
      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
      exercise.description.toLowerCase().includes(exerciseSearch.toLowerCase());
    
    const matchesFilter = !exerciseFilter || 
      exercise.muscle_groups.includes(exerciseFilter);
    
    const notSelected = !selectedExercises.some(e => e.id === exercise.id);

    return matchesSearch && matchesFilter && notSelected;
  });

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (selectedExercises.length === 0) {
      newErrors.exercises = 'Add at least one exercise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    // Calculate target muscle groups from exercises if not set
    const muscleGroups = targetMuscleGroups.length > 0
      ? targetMuscleGroups
      : [...new Set(selectedExercises.flatMap(e => e.muscle_groups))];

    const data: WorkoutTemplateInsert | WorkoutTemplateUpdate = {
      name: name.trim(),
      description: description.trim(),
      difficulty,
      target_muscle_groups: muscleGroups,
      estimated_duration_minutes: parseInt(estimatedDuration) || 30,
      estimated_calories: estimatedCalories ? parseInt(estimatedCalories) : null,
      exercise_order: selectedExercises.map(e => e.id),
      is_active: isActive,
    };

    await onSave(data);
  };

  // Toggle muscle group
  const toggleMuscleGroup = (mg: MuscleGroup) => {
    setTargetMuscleGroups(prev =>
      prev.includes(mg)
        ? prev.filter(g => g !== mg)
        : [...prev, mg]
    );
  };

  // Exercise management
  const addExercise = (exercise: Exercise) => {
    setSelectedExercises(prev => [...prev, exercise]);
    setShowExercisePicker(false);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(prev => prev.filter((_, i) => i !== index));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= selectedExercises.length) return;

    setSelectedExercises(prev => {
      const updated = [...prev];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
      return updated;
    });
  };

  // Calculate stats from exercises
  const calculateStats = () => {
    let totalDuration = 0;
    let totalCalories = 0;

    for (const exercise of selectedExercises) {
      const setsTime = exercise.default_sets * 45;
      const restTime = (exercise.default_sets - 1) * exercise.default_rest_seconds;
      totalDuration += setsTime + restTime;

      if (exercise.calories_per_set) {
        totalCalories += exercise.calories_per_set * exercise.default_sets;
      }
    }

    return {
      duration: Math.round(totalDuration / 60),
      calories: totalCalories,
    };
  };

  const stats = calculateStats();

  return (
    <View className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-700 px-6 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-violet-500/20">
            <Dumbbell size={20} color="#8b5cf6" />
          </View>
          <Text className="text-lg font-bold text-white">
            {isEditing ? 'Edit Workout' : 'New Workout'}
          </Text>
        </View>
        <Pressable onPress={onCancel} className="p-2 rounded-lg hover:bg-slate-800">
          <X size={20} color="#94a3b8" />
        </Pressable>
      </View>

      <ScrollView className="flex-1 p-6">
        {/* Basic Info Section */}
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Basic Information
        </Text>

        {/* Name */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">
            Workout Name <Text className="text-rose-400">*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="e.g., Upper Body Blast"
            placeholderTextColor="#64748b"
            className={cn(
              'rounded-xl border bg-slate-800 px-4 py-3 text-white',
              errors.name && touched.name ? 'border-rose-500' : 'border-slate-600'
            )}
          />
          {errors.name && touched.name && (
            <View className="mt-1 flex-row items-center gap-1">
              <AlertCircle size={12} color="#f43f5e" />
              <Text className="text-xs text-rose-400">{errors.name}</Text>
            </View>
          )}
        </View>

        {/* Description */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">
            Description <Text className="text-rose-400">*</Text>
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            onBlur={() => setTouched(prev => ({ ...prev, description: true }))}
            placeholder="Brief description of the workout..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
            className={cn(
              'rounded-xl border bg-slate-800 px-4 py-3 text-white',
              errors.description && touched.description ? 'border-rose-500' : 'border-slate-600'
            )}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        {/* Difficulty */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-slate-300">Difficulty Level</Text>
          <View className="flex-row gap-2">
            {DIFFICULTY_LEVELS.map(level => (
              <Pressable
                key={level}
                onPress={() => setDifficulty(level)}
                className={cn(
                  'flex-1 rounded-lg px-3 py-3 border items-center',
                  difficulty === level
                    ? 'bg-violet-500/20 border-violet-500'
                    : 'bg-slate-800 border-slate-600'
                )}
              >
                <Text
                  className={cn(
                    'text-sm font-medium',
                    difficulty === level ? 'text-violet-400' : 'text-slate-400'
                  )}
                >
                  {DIFFICULTY_LABELS[level]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Target Muscle Groups */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-slate-300">
            Target Muscle Groups (optional)
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MUSCLE_GROUPS.map(mg => {
              const isSelected = targetMuscleGroups.includes(mg);
              const colors = MUSCLE_GROUP_COLORS[mg];
              return (
                <Pressable
                  key={mg}
                  onPress={() => toggleMuscleGroup(mg)}
                  className={cn(
                    'rounded-lg px-3 py-2 border',
                    isSelected
                      ? `${colors.bg} border-transparent`
                      : 'bg-slate-800 border-slate-600'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      isSelected ? colors.text : 'text-slate-400'
                    )}
                  >
                    {MUSCLE_GROUP_LABELS[mg]}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Exercises Section */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Exercises ({selectedExercises.length})
          </Text>
          <View className="flex-row items-center gap-4">
            <View className="flex-row items-center gap-1">
              <Clock size={14} color="#64748b" />
              <Text className="text-sm text-slate-400">~{stats.duration} min</Text>
            </View>
            {stats.calories > 0 && (
              <View className="flex-row items-center gap-1">
                <Flame size={14} color="#f97316" />
                <Text className="text-sm text-slate-400">~{stats.calories} cal</Text>
              </View>
            )}
          </View>
        </View>

        {/* Exercise List */}
        <View className="mb-4">
          {selectedExercises.length === 0 ? (
            <View className="items-center py-8 rounded-xl border border-dashed border-slate-600">
              <Dumbbell size={32} color="#64748b" />
              <Text className="mt-2 text-slate-400">No exercises added</Text>
              <Text className="text-sm text-slate-500">Add exercises to build your workout</Text>
            </View>
          ) : (
            selectedExercises.map((exercise, index) => (
              <View
                key={exercise.id}
                className="mb-2 flex-row items-center rounded-xl border border-slate-700 bg-slate-800 p-3"
              >
                {/* Drag handle & number */}
                <View className="flex-row items-center gap-2 mr-3">
                  <GripVertical size={16} color="#64748b" />
                  <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-700">
                    <Text className="text-xs font-bold text-slate-400">{index + 1}</Text>
                  </View>
                </View>

                {/* Exercise info */}
                <View className="flex-1">
                  <Text className="font-medium text-white">{exercise.name}</Text>
                  <View className="flex-row items-center gap-2 mt-1">
                    <Text className="text-xs text-slate-400">
                      {exercise.default_sets} sets × {exercise.default_reps} reps
                    </Text>
                    <View className="flex-row gap-1">
                      {exercise.muscle_groups.slice(0, 2).map(mg => (
                        <View
                          key={mg}
                          className={cn('rounded px-1.5 py-0.5', MUSCLE_GROUP_COLORS[mg].bg)}
                        >
                          <Text className={cn('text-xs', MUSCLE_GROUP_COLORS[mg].text)}>
                            {MUSCLE_GROUP_LABELS[mg]}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row items-center gap-1">
                  <Pressable
                    onPress={() => moveExercise(index, 'up')}
                    disabled={index === 0}
                    className={cn('p-2 rounded-lg', index === 0 ? 'opacity-30' : 'hover:bg-slate-700')}
                  >
                    <ChevronUp size={16} color="#94a3b8" />
                  </Pressable>
                  <Pressable
                    onPress={() => moveExercise(index, 'down')}
                    disabled={index === selectedExercises.length - 1}
                    className={cn('p-2 rounded-lg', index === selectedExercises.length - 1 ? 'opacity-30' : 'hover:bg-slate-700')}
                  >
                    <ChevronDown size={16} color="#94a3b8" />
                  </Pressable>
                  <Pressable
                    onPress={() => removeExercise(index)}
                    className="p-2 rounded-lg hover:bg-rose-500/20"
                  >
                    <Trash2 size={16} color="#f43f5e" />
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {/* Add Exercise Button */}
          <Pressable
            onPress={() => setShowExercisePicker(true)}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-slate-600 px-4 py-3 mt-2"
          >
            <Plus size={18} color="#64748b" />
            <Text className="text-sm font-medium text-slate-400">Add Exercise</Text>
          </Pressable>

          {errors.exercises && (
            <View className="mt-2 flex-row items-center gap-1">
              <AlertCircle size={12} color="#f43f5e" />
              <Text className="text-xs text-rose-400">{errors.exercises}</Text>
            </View>
          )}
        </View>

        {/* Duration & Calories Override */}
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Estimated Values
        </Text>

        <View className="mb-6 flex-row gap-4">
          <View className="flex-1">
            <View className="flex-row items-center gap-1 mb-2">
              <Clock size={14} color="#64748b" />
              <Text className="text-sm font-medium text-slate-300">Duration (min)</Text>
            </View>
            <TextInput
              value={estimatedDuration}
              onChangeText={setEstimatedDuration}
              placeholder={String(stats.duration)}
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1 mb-2">
              <Flame size={14} color="#f97316" />
              <Text className="text-sm font-medium text-slate-300">Calories</Text>
            </View>
            <TextInput
              value={estimatedCalories}
              onChangeText={setEstimatedCalories}
              placeholder={stats.calories > 0 ? String(stats.calories) : 'Optional'}
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>
        </View>

        {/* Active Toggle */}
        <View className="mb-6">
          <Pressable
            onPress={() => setIsActive(!isActive)}
            className="flex-row items-center justify-between rounded-xl border border-slate-600 bg-slate-800 px-4 py-4"
          >
            <Text className="text-sm font-medium text-slate-300">
              Workout is Active
            </Text>
            <View
              className={cn(
                'h-6 w-11 rounded-full p-1',
                isActive ? 'bg-emerald-500' : 'bg-slate-600'
              )}
            >
              <View
                className={cn(
                  'h-4 w-4 rounded-full bg-white',
                  isActive ? 'translate-x-5' : 'translate-x-0'
                )}
              />
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View className="flex-row gap-3 border-t border-slate-700 px-6 py-4">
        <Pressable
          onPress={onCancel}
          className="flex-1 rounded-xl border border-slate-600 bg-slate-800 py-3"
        >
          <Text className="text-center text-sm font-semibold text-slate-300">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSubmit}
          disabled={isLoading}
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3',
            isLoading ? 'bg-violet-500/50' : 'bg-violet-500'
          )}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text className="text-sm font-semibold text-white">
                {isEditing ? 'Update' : 'Create'} Workout
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* Exercise Picker Modal */}
      <Modal
        visible={showExercisePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExercisePicker(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/70 p-4">
          <View className="w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden" style={{ maxHeight: '80%' }}>
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-slate-700 px-4 py-3">
              <Text className="text-lg font-bold text-white">Add Exercise</Text>
              <Pressable onPress={() => setShowExercisePicker(false)} className="p-2">
                <X size={20} color="#94a3b8" />
              </Pressable>
            </View>

            {/* Search & Filter */}
            <View className="flex-row items-center gap-2 border-b border-slate-700 px-4 py-3">
              <View className="flex-1 flex-row items-center rounded-lg bg-slate-800 px-3 py-2">
                <Search size={16} color="#64748b" />
                <TextInput
                  value={exerciseSearch}
                  onChangeText={setExerciseSearch}
                  placeholder="Search exercises..."
                  placeholderTextColor="#64748b"
                  className="ml-2 flex-1 text-white"
                />
              </View>
              <Pressable
                onPress={() => setExerciseFilter(exerciseFilter ? null : 'chest')}
                className={cn(
                  'p-2 rounded-lg',
                  exerciseFilter ? 'bg-violet-500/20' : 'bg-slate-800'
                )}
              >
                <Filter size={18} color={exerciseFilter ? '#8b5cf6' : '#64748b'} />
              </Pressable>
            </View>

            {/* Muscle Group Filter */}
            {exerciseFilter !== null && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="border-b border-slate-700 px-4 py-2">
                <View className="flex-row gap-2">
                  {MUSCLE_GROUPS.map(mg => (
                    <Pressable
                      key={mg}
                      onPress={() => setExerciseFilter(exerciseFilter === mg ? null : mg)}
                      className={cn(
                        'rounded-lg px-3 py-1.5',
                        exerciseFilter === mg ? MUSCLE_GROUP_COLORS[mg].bg : 'bg-slate-800'
                      )}
                    >
                      <Text
                        className={cn(
                          'text-sm',
                          exerciseFilter === mg ? MUSCLE_GROUP_COLORS[mg].text : 'text-slate-400'
                        )}
                      >
                        {MUSCLE_GROUP_LABELS[mg]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            )}

            {/* Exercise List */}
            <ScrollView className="flex-1 p-4">
              {loadingExercises ? (
                <View className="items-center py-8">
                  <ActivityIndicator size="large" color="#8b5cf6" />
                </View>
              ) : filteredExercises.length === 0 ? (
                <View className="items-center py-8">
                  <Text className="text-slate-400">No exercises found</Text>
                </View>
              ) : (
                filteredExercises.map(exercise => (
                  <Pressable
                    key={exercise.id}
                    onPress={() => addExercise(exercise)}
                    className="mb-2 rounded-xl border border-slate-700 bg-slate-800 p-3 hover:bg-slate-700"
                  >
                    <Text className="font-medium text-white">{exercise.name}</Text>
                    <Text className="text-sm text-slate-400 mt-1" numberOfLines={1}>
                      {exercise.description}
                    </Text>
                    <View className="flex-row items-center gap-2 mt-2">
                      <Text className="text-xs text-slate-500">
                        {exercise.default_sets}×{exercise.default_reps}
                      </Text>
                      <View className="flex-row gap-1">
                        {exercise.muscle_groups.slice(0, 3).map(mg => (
                          <View key={mg} className={cn('rounded px-1.5 py-0.5', MUSCLE_GROUP_COLORS[mg].bg)}>
                            <Text className={cn('text-xs', MUSCLE_GROUP_COLORS[mg].text)}>
                              {MUSCLE_GROUP_LABELS[mg]}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

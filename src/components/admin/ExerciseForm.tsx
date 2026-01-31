/**
 * Exercise Form Component
 * 
 * Form for creating and editing exercises in admin panel
 * Supports all exercise fields with validation
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Save,
  Plus,
  Trash2,
  Youtube,
  Dumbbell,
  Clock,
  Flame,
  AlertCircle,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import type { Exercise, ExerciseInsert, ExerciseUpdate } from '@/lib/supabase/exercises';
import {
  MUSCLE_GROUP_LABELS,
  EXERCISE_TYPE_LABELS,
  DIFFICULTY_LABELS,
  MUSCLE_GROUP_COLORS,
} from '@/lib/supabase/exercises';
import type { MuscleGroup, ExerciseType, FitnessLevel } from '@/lib/supabase/types';

// ==================== TYPES ====================

interface ExerciseFormProps {
  exercise?: Exercise | null;
  onSave: (data: ExerciseInsert | ExerciseUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface FormErrors {
  name?: string;
  description?: string;
  muscleGroups?: string;
  instructions?: string;
}

// ==================== CONSTANTS ====================

const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'legs', 'core', 'glutes', 'full_body', 'cardio'
];

const EXERCISE_TYPES: ExerciseType[] = ['strength', 'cardio', 'flexibility', 'hiit'];

const DIFFICULTY_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

// ==================== COMPONENT ====================

export default function ExerciseForm({
  exercise,
  onSave,
  onCancel,
  isLoading = false,
}: ExerciseFormProps) {
  const isEditing = !!exercise;

  // Form state
  const [name, setName] = useState(exercise?.name || '');
  const [description, setDescription] = useState(exercise?.description || '');
  const [instructions, setInstructions] = useState<string[]>(exercise?.instructions || ['']);
  const [youtubeVideoId, setYoutubeVideoId] = useState(exercise?.youtube_video_id || '');
  const [thumbnailUrl, setThumbnailUrl] = useState(exercise?.thumbnail_url || '');
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>(exercise?.muscle_groups || []);
  const [exerciseType, setExerciseType] = useState<ExerciseType>(exercise?.exercise_type || 'strength');
  const [difficulty, setDifficulty] = useState<FitnessLevel>(exercise?.difficulty || 'beginner');
  const [defaultSets, setDefaultSets] = useState(String(exercise?.default_sets || 3));
  const [defaultReps, setDefaultReps] = useState(exercise?.default_reps || '10');
  const [defaultDuration, setDefaultDuration] = useState(String(exercise?.default_duration_seconds || ''));
  const [defaultRest, setDefaultRest] = useState(String(exercise?.default_rest_seconds || 60));
  const [caloriesPerSet, setCaloriesPerSet] = useState(String(exercise?.calories_per_set || ''));
  const [isActive, setIsActive] = useState(exercise?.is_active ?? true);

  // Validation state
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Extract YouTube video ID from URL
  const extractYoutubeId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return url; // Return as-is if already an ID
  };

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (muscleGroups.length === 0) {
      newErrors.muscleGroups = 'Select at least one muscle group';
    }
    if (instructions.filter(i => i.trim()).length === 0) {
      newErrors.instructions = 'Add at least one instruction';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!validate()) return;

    const data: ExerciseInsert | ExerciseUpdate = {
      name: name.trim(),
      description: description.trim(),
      instructions: instructions.filter(i => i.trim()),
      youtube_video_id: youtubeVideoId ? extractYoutubeId(youtubeVideoId) : null,
      thumbnail_url: thumbnailUrl || null,
      muscle_groups: muscleGroups,
      exercise_type: exerciseType,
      difficulty,
      default_sets: parseInt(defaultSets) || 3,
      default_reps: defaultReps || '10',
      default_duration_seconds: defaultDuration ? parseInt(defaultDuration) : null,
      default_rest_seconds: parseInt(defaultRest) || 60,
      calories_per_set: caloriesPerSet ? parseInt(caloriesPerSet) : null,
      is_active: isActive,
    };

    await onSave(data);
  };

  // Toggle muscle group
  const toggleMuscleGroup = (mg: MuscleGroup) => {
    setMuscleGroups(prev =>
      prev.includes(mg)
        ? prev.filter(g => g !== mg)
        : [...prev, mg]
    );
    setTouched(prev => ({ ...prev, muscleGroups: true }));
  };

  // Instruction handlers
  const addInstruction = () => {
    setInstructions(prev => [...prev, '']);
  };

  const updateInstruction = (index: number, value: string) => {
    setInstructions(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeInstruction = (index: number) => {
    setInstructions(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <View className="flex-1 bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-slate-700 px-6 py-4">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Dumbbell size={20} color="#10b981" />
          </View>
          <Text className="text-lg font-bold text-white">
            {isEditing ? 'Edit Exercise' : 'New Exercise'}
          </Text>
        </View>
        <Pressable onPress={onCancel} className="p-2 rounded-lg hover:bg-slate-800">
          <X size={20} color="#94a3b8" />
        </Pressable>
      </View>

      {/* Form */}
      <ScrollView className="flex-1 p-6">
        {/* Basic Info Section */}
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Basic Information
        </Text>

        {/* Name */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">
            Exercise Name <Text className="text-rose-400">*</Text>
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
            placeholder="e.g., Push-ups"
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
            placeholder="Brief description of the exercise..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={3}
            className={cn(
              'rounded-xl border bg-slate-800 px-4 py-3 text-white',
              errors.description && touched.description ? 'border-rose-500' : 'border-slate-600'
            )}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          {errors.description && touched.description && (
            <View className="mt-1 flex-row items-center gap-1">
              <AlertCircle size={12} color="#f43f5e" />
              <Text className="text-xs text-rose-400">{errors.description}</Text>
            </View>
          )}
        </View>

        {/* Muscle Groups */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-slate-300">
            Muscle Groups <Text className="text-rose-400">*</Text>
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {MUSCLE_GROUPS.map(mg => {
              const isSelected = muscleGroups.includes(mg);
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
          {errors.muscleGroups && touched.muscleGroups && (
            <View className="mt-2 flex-row items-center gap-1">
              <AlertCircle size={12} color="#f43f5e" />
              <Text className="text-xs text-rose-400">{errors.muscleGroups}</Text>
            </View>
          )}
        </View>

        {/* Exercise Type & Difficulty */}
        <View className="mb-4 flex-row gap-4">
          <View className="flex-1">
            <Text className="mb-2 text-sm font-medium text-slate-300">Exercise Type</Text>
            <View className="flex-row flex-wrap gap-2">
              {EXERCISE_TYPES.map(type => (
                <Pressable
                  key={type}
                  onPress={() => setExerciseType(type)}
                  className={cn(
                    'rounded-lg px-3 py-2 border',
                    exerciseType === type
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : 'bg-slate-800 border-slate-600'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      exerciseType === type ? 'text-emerald-400' : 'text-slate-400'
                    )}
                  >
                    {EXERCISE_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

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

        {/* Instructions Section */}
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Instructions
        </Text>

        <View className="mb-6">
          {instructions.map((instruction, index) => (
            <View key={index} className="mb-2 flex-row items-center gap-2">
              <View className="h-6 w-6 items-center justify-center rounded-full bg-slate-700">
                <Text className="text-xs font-bold text-slate-400">{index + 1}</Text>
              </View>
              <TextInput
                value={instruction}
                onChangeText={(value) => updateInstruction(index, value)}
                placeholder={`Step ${index + 1}...`}
                placeholderTextColor="#64748b"
                className="flex-1 rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
              />
              {instructions.length > 1 && (
                <Pressable
                  onPress={() => removeInstruction(index)}
                  className="p-2 rounded-lg hover:bg-rose-500/20"
                >
                  <Trash2 size={16} color="#f43f5e" />
                </Pressable>
              )}
            </View>
          ))}
          <Pressable
            onPress={addInstruction}
            className="mt-2 flex-row items-center gap-2 rounded-xl border border-dashed border-slate-600 px-4 py-3"
          >
            <Plus size={16} color="#64748b" />
            <Text className="text-sm text-slate-400">Add Step</Text>
          </Pressable>
        </View>

        {/* Defaults Section */}
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Default Values
        </Text>

        <View className="mb-6 flex-row flex-wrap gap-4">
          {/* Sets */}
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="mb-2 text-sm font-medium text-slate-300">Sets</Text>
            <TextInput
              value={defaultSets}
              onChangeText={setDefaultSets}
              placeholder="3"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>

          {/* Reps */}
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="mb-2 text-sm font-medium text-slate-300">Reps</Text>
            <TextInput
              value={defaultReps}
              onChangeText={setDefaultReps}
              placeholder="10"
              placeholderTextColor="#64748b"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>

          {/* Duration */}
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="mb-2 text-sm font-medium text-slate-300">Duration (sec)</Text>
            <TextInput
              value={defaultDuration}
              onChangeText={setDefaultDuration}
              placeholder="Optional"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>

          {/* Rest */}
          <View className="flex-1" style={{ minWidth: 100 }}>
            <Text className="mb-2 text-sm font-medium text-slate-300">Rest (sec)</Text>
            <TextInput
              value={defaultRest}
              onChangeText={setDefaultRest}
              placeholder="60"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>

          {/* Calories */}
          <View className="flex-1" style={{ minWidth: 100 }}>
            <View className="flex-row items-center gap-1 mb-2">
              <Flame size={14} color="#f97316" />
              <Text className="text-sm font-medium text-slate-300">Cal/Set</Text>
            </View>
            <TextInput
              value={caloriesPerSet}
              onChangeText={setCaloriesPerSet}
              placeholder="Optional"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>
        </View>

        {/* Media Section */}
        <Text className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Media
        </Text>

        <View className="mb-6">
          {/* YouTube Video */}
          <View className="mb-4">
            <View className="flex-row items-center gap-2 mb-2">
              <Youtube size={14} color="#ef4444" />
              <Text className="text-sm font-medium text-slate-300">YouTube Video</Text>
            </View>
            <TextInput
              value={youtubeVideoId}
              onChangeText={setYoutubeVideoId}
              placeholder="Video URL or ID (e.g., youtube.com/watch?v=...)"
              placeholderTextColor="#64748b"
              className="rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white"
            />
          </View>

          {/* Thumbnail */}
          <View>
            <Text className="mb-2 text-sm font-medium text-slate-300">Thumbnail URL</Text>
            <TextInput
              value={thumbnailUrl}
              onChangeText={setThumbnailUrl}
              placeholder="https://..."
              placeholderTextColor="#64748b"
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
              Exercise is Active
            </Text>
            <View
              className={cn(
                'h-6 w-11 rounded-full p-1',
                isActive ? 'bg-emerald-500' : 'bg-slate-600'
              )}
            >
              <View
                className={cn(
                  'h-4 w-4 rounded-full bg-white transition-transform',
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
            isLoading ? 'bg-emerald-500/50' : 'bg-emerald-500'
          )}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Save size={18} color="#fff" />
              <Text className="text-sm font-semibold text-white">
                {isEditing ? 'Update' : 'Create'} Exercise
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

/**
 * ADMIN - FASTING PLAN MANAGEMENT
 * Full CRUD for fasting protocols with personalization rules
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
import {
  Plus,
  Timer,
  Moon,
  Sun,
  Clock,
  Users,
  Edit,
  Trash2,
  Copy,
  RotateCcw,
  MoreVertical,
  Star,
  Check,
  X,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Droplet,
  GripVertical,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  fastingService,
  type FastingPlan,
  type FastingPlanInsert,
  type FastingPlanUpdate,
  type FastingProtocol,
  type FastingDifficulty,
  FASTING_PROTOCOL_LABELS,
  FASTING_PROTOCOL_DESCRIPTIONS,
  FASTING_DIFFICULTY_LABELS,
  FASTING_PROTOCOL_COLORS,
  FASTING_DIFFICULTY_COLORS,
  DEFAULT_FASTING_PLANS,
} from '@/lib/supabase/fasting';
import type { FitnessLevel } from '@/lib/supabase/types';

// ==================== COMPONENTS ====================

function ProtocolBadge({ protocol }: { protocol: FastingProtocol }) {
  const { bg, text } = FASTING_PROTOCOL_COLORS[protocol];
  
  return (
    <View className={cn('rounded-full px-3 py-1', bg)}>
      <Text className={cn('text-sm font-semibold', text)}>
        {protocol.toUpperCase()}
      </Text>
    </View>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: FastingDifficulty }) {
  const { bg, text } = FASTING_DIFFICULTY_COLORS[difficulty];
  
  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>
        {FASTING_DIFFICULTY_LABELS[difficulty]}
      </Text>
    </View>
  );
}

function StatusBadge({ isActive, isDefault }: { isActive: boolean; isDefault?: boolean }) {
  if (!isActive) {
    return (
      <View className="rounded-full px-2 py-1 bg-gray-200">
        <Text className="text-xs font-medium text-gray-600">Inactive</Text>
      </View>
    );
  }
  if (isDefault) {
    return (
      <View className="flex-row items-center rounded-full px-2 py-1 bg-blue-100">
        <Star size={10} color="#2563eb" fill="#2563eb" />
        <Text className="text-xs font-medium text-blue-700 ml-1">Default</Text>
      </View>
    );
  }
  return (
    <View className="rounded-full px-2 py-1 bg-green-100">
      <Text className="text-xs font-medium text-green-700">Active</Text>
    </View>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <Pressable
      onPress={onClose}
      className={cn(
        'absolute top-4 right-4 left-4 z-50 rounded-lg p-4 flex-row items-center',
        type === 'success' ? 'bg-green-600' : 'bg-red-600'
      )}
    >
      {type === 'success' ? (
        <Check size={20} color="white" />
      ) : (
        <X size={20} color="white" />
      )}
      <Text className="text-white font-medium ml-2 flex-1">{message}</Text>
    </Pressable>
  );
}

function ActionMenu({
  onEdit,
  onDuplicate,
  onSetDefault,
  onDelete,
  onRestore,
  isActive,
  isDefault,
  onClose,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isActive: boolean;
  isDefault: boolean;
  onClose: () => void;
}) {
  return (
    <Pressable
      onPress={onClose}
      className="absolute inset-0 z-40"
    >
      <View className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px] z-50">
        <Pressable
          onPress={() => { onEdit(); onClose(); }}
          className="flex-row items-center px-4 py-2"
        >
          <Edit size={16} color="#6B7280" />
          <Text className="text-gray-700 ml-3">Edit</Text>
        </Pressable>
        <Pressable
          onPress={() => { onDuplicate(); onClose(); }}
          className="flex-row items-center px-4 py-2"
        >
          <Copy size={16} color="#6B7280" />
          <Text className="text-gray-700 ml-3">Duplicate</Text>
        </Pressable>
        {!isDefault && isActive && (
          <Pressable
            onPress={() => { onSetDefault(); onClose(); }}
            className="flex-row items-center px-4 py-2"
          >
            <Star size={16} color="#2563eb" />
            <Text className="text-gray-700 ml-3">Set as Default</Text>
          </Pressable>
        )}
        <View className="h-px bg-gray-200 my-1" />
        {isActive ? (
          <Pressable
            onPress={() => { onDelete(); onClose(); }}
            className="flex-row items-center px-4 py-2"
            disabled={isDefault}
          >
            <Trash2 size={16} color={isDefault ? '#9CA3AF' : '#EF4444'} />
            <Text className={isDefault ? 'text-gray-400 ml-3' : 'text-red-500 ml-3'}>
              {isDefault ? 'Cannot delete default' : 'Delete'}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => { onRestore?.(); onClose(); }}
            className="flex-row items-center px-4 py-2"
          >
            <RotateCcw size={16} color="#10B981" />
            <Text className="text-green-600 ml-3">Restore</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

// ==================== FASTING FORM ====================

interface FastingFormProps {
  plan?: FastingPlan | null;
  onSubmit: (data: FastingPlanInsert | FastingPlanUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ALL_PROTOCOLS: FastingProtocol[] = ['12:12', '14:10', '16:8', '18:6', '20:4', 'omad'];
const ALL_DIFFICULTIES: FastingDifficulty[] = ['beginner', 'intermediate', 'advanced'];
const ALL_FITNESS_LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];
const ALL_GOALS = ['weight_loss', 'muscle_gain', 'maintenance', 'endurance'];

function FastingForm({ plan, onSubmit, onCancel, isLoading }: FastingFormProps) {
  const [name, setName] = useState(plan?.name || '');
  const [protocol, setProtocol] = useState<FastingProtocol>(plan?.protocol || '16:8');
  const [description, setDescription] = useState(plan?.description || '');
  const [difficulty, setDifficulty] = useState<FastingDifficulty>(plan?.difficulty || 'intermediate');
  
  const [fastingHours, setFastingHours] = useState(plan?.fasting_hours?.toString() || '16');
  const [eatingHours, setEatingHours] = useState(plan?.eating_hours?.toString() || '8');
  const [startTime, setStartTime] = useState(plan?.recommended_start_time || '20:00');
  const [endTime, setEndTime] = useState(plan?.recommended_end_time || '12:00');
  const [minExperience, setMinExperience] = useState(plan?.minimum_experience_days?.toString() || '0');
  
  const [suitableGoals, setSuitableGoals] = useState<string[]>(plan?.suitable_for_goals || []);
  const [suitableFitnessLevels, setSuitableFitnessLevels] = useState<FitnessLevel[]>(
    plan?.suitable_for_fitness_levels || []
  );
  
  const [benefits, setBenefits] = useState<string[]>(plan?.benefits || ['']);
  const [tips, setTips] = useState<string[]>(plan?.tips || ['']);
  const [warnings, setWarnings] = useState<string[]>(plan?.warnings || ['']);
  const [breakingFoods, setBreakingFoods] = useState<string[]>(plan?.recommended_breaking_foods || ['']);
  
  const [allowCoffee, setAllowCoffee] = useState(plan?.allow_coffee_during_fast ?? true);
  const [allowWaterAdditives, setAllowWaterAdditives] = useState(plan?.allow_water_additives ?? false);
  
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [isDefault, setIsDefault] = useState(plan?.is_default ?? false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-update hours when protocol changes
  useEffect(() => {
    const protocolHours: Record<FastingProtocol, { fasting: number; eating: number }> = {
      '12:12': { fasting: 12, eating: 12 },
      '14:10': { fasting: 14, eating: 10 },
      '16:8': { fasting: 16, eating: 8 },
      '18:6': { fasting: 18, eating: 6 },
      '20:4': { fasting: 20, eating: 4 },
      'omad': { fasting: 23, eating: 1 },
    };
    const hours = protocolHours[protocol];
    setFastingHours(hours.fasting.toString());
    setEatingHours(hours.eating.toString());
  }, [protocol]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!fastingHours || parseInt(fastingHours) <= 0) newErrors.fastingHours = 'Valid fasting hours required';
    if (!eatingHours || parseInt(eatingHours) <= 0) newErrors.eatingHours = 'Valid eating hours required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: FastingPlanInsert | FastingPlanUpdate = {
      name: name.trim(),
      protocol,
      description: description.trim() || null,
      fasting_hours: parseInt(fastingHours),
      eating_hours: parseInt(eatingHours),
      recommended_start_time: startTime,
      recommended_end_time: endTime,
      difficulty,
      suitable_for_goals: suitableGoals,
      suitable_for_fitness_levels: suitableFitnessLevels,
      minimum_experience_days: parseInt(minExperience) || 0,
      benefits: benefits.filter(b => b.trim()),
      tips: tips.filter(t => t.trim()),
      warnings: warnings.filter(w => w.trim()),
      allow_coffee_during_fast: allowCoffee,
      allow_water_additives: allowWaterAdditives,
      recommended_breaking_foods: breakingFoods.filter(f => f.trim()),
      is_active: isActive,
      is_default: isDefault,
    };

    await onSubmit(data);
  };

  const toggleArrayItem = <T extends string>(item: T, list: T[], setList: (l: T[]) => void) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const updateListItem = (list: string[], setList: (l: string[]) => void, index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const addListItem = (list: string[], setList: (l: string[]) => void) => {
    setList([...list, '']);
  };

  const removeListItem = (list: string[], setList: (l: string[]) => void, index: number) => {
    if (list.length > 1) {
      setList(list.filter((_, i) => i !== index));
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6 space-y-6">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            {plan ? 'Edit Fasting Plan' : 'Create Fasting Plan'}
          </Text>
          <Pressable onPress={onCancel} className="p-2">
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Basic Info */}
        <View className="space-y-4">
          <Text className="text-lg font-semibold text-gray-800">Basic Information</Text>
          
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Plan Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Standard Intermittent"
              className={cn(
                'border rounded-lg px-4 py-3 text-base',
                errors.name ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>}
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Protocol *</Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_PROTOCOLS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setProtocol(p)}
                  className={cn(
                    'px-4 py-2 rounded-lg border',
                    protocol === p
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'font-semibold',
                      protocol === p ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {p.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-sm text-gray-500 mt-2">
              {FASTING_PROTOCOL_DESCRIPTIONS[protocol]}
            </Text>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of this fasting plan..."
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Difficulty</Text>
            <View className="flex-row gap-2">
              {ALL_DIFFICULTIES.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDifficulty(d)}
                  className={cn(
                    'flex-1 py-3 rounded-lg border items-center',
                    difficulty === d
                      ? 'bg-purple-600 border-purple-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'font-medium',
                      difficulty === d ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {FASTING_DIFFICULTY_LABELS[d]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Timing */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Timing</Text>
          
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Fasting Hours</Text>
              <TextInput
                value={fastingHours}
                onChangeText={setFastingHours}
                placeholder="16"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50"
                editable={false}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Eating Hours</Text>
              <TextInput
                value={eatingHours}
                onChangeText={setEatingHours}
                placeholder="8"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base bg-gray-50"
                editable={false}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Fasting Starts (HH:MM)</Text>
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="20:00"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Eating Starts (HH:MM)</Text>
              <TextInput
                value={endTime}
                onChangeText={setEndTime}
                placeholder="12:00"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Minimum Experience (days)</Text>
            <TextInput
              value={minExperience}
              onChangeText={setMinExperience}
              placeholder="0"
              keyboardType="numeric"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
            <Text className="text-xs text-gray-500 mt-1">
              Days of fasting experience required before user can access this plan
            </Text>
          </View>
        </View>

        {/* Targeting */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Suitable For</Text>
          
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Goals</Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_GOALS.map((goal) => (
                <Pressable
                  key={goal}
                  onPress={() => toggleArrayItem(goal, suitableGoals, setSuitableGoals)}
                  className={cn(
                    'px-3 py-2 rounded-full border',
                    suitableGoals.includes(goal)
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      suitableGoals.includes(goal) ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {goal.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Fitness Levels</Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_FITNESS_LEVELS.map((level) => (
                <Pressable
                  key={level}
                  onPress={() => toggleArrayItem(level, suitableFitnessLevels, setSuitableFitnessLevels)}
                  className={cn(
                    'px-3 py-2 rounded-full border',
                    suitableFitnessLevels.includes(level)
                      ? 'bg-orange-600 border-orange-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      suitableFitnessLevels.includes(level) ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Options */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">During Fasting</Text>
          
          <Pressable
            onPress={() => setAllowCoffee(!allowCoffee)}
            className="flex-row items-center"
          >
            <View
              className={cn(
                'w-6 h-6 rounded border-2 mr-3 items-center justify-center',
                allowCoffee ? 'bg-green-600 border-green-600' : 'border-gray-300'
              )}
            >
              {allowCoffee && <Check size={14} color="white" />}
            </View>
            <Coffee size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-2">Allow black coffee during fast</Text>
          </Pressable>

          <Pressable
            onPress={() => setAllowWaterAdditives(!allowWaterAdditives)}
            className="flex-row items-center"
          >
            <View
              className={cn(
                'w-6 h-6 rounded border-2 mr-3 items-center justify-center',
                allowWaterAdditives ? 'bg-green-600 border-green-600' : 'border-gray-300'
              )}
            >
              {allowWaterAdditives && <Check size={14} color="white" />}
            </View>
            <Droplet size={20} color="#6B7280" />
            <Text className="text-gray-700 ml-2">Allow water additives (lemon, salt)</Text>
          </Pressable>
        </View>

        {/* Benefits */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Benefits</Text>
          {benefits.map((benefit, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <TextInput
                value={benefit}
                onChangeText={(value) => updateListItem(benefits, setBenefits, index, value)}
                placeholder={`Benefit ${index + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
              <Pressable
                onPress={() => removeListItem(benefits, setBenefits, index)}
                className="p-2"
              >
                <X size={20} color="#EF4444" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => addListItem(benefits, setBenefits)}
            className="flex-row items-center justify-center py-3 border border-dashed border-gray-300 rounded-lg"
          >
            <Plus size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-2">Add Benefit</Text>
          </Pressable>
        </View>

        {/* Tips */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Tips</Text>
          {tips.map((tip, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <TextInput
                value={tip}
                onChangeText={(value) => updateListItem(tips, setTips, index, value)}
                placeholder={`Tip ${index + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
              <Pressable
                onPress={() => removeListItem(tips, setTips, index)}
                className="p-2"
              >
                <X size={20} color="#EF4444" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => addListItem(tips, setTips)}
            className="flex-row items-center justify-center py-3 border border-dashed border-gray-300 rounded-lg"
          >
            <Plus size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-2">Add Tip</Text>
          </Pressable>
        </View>

        {/* Warnings */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Warnings</Text>
          {warnings.map((warning, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <TextInput
                value={warning}
                onChangeText={(value) => updateListItem(warnings, setWarnings, index, value)}
                placeholder={`Warning ${index + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
              <Pressable
                onPress={() => removeListItem(warnings, setWarnings, index)}
                className="p-2"
              >
                <X size={20} color="#EF4444" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => addListItem(warnings, setWarnings)}
            className="flex-row items-center justify-center py-3 border border-dashed border-gray-300 rounded-lg"
          >
            <Plus size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-2">Add Warning</Text>
          </Pressable>
        </View>

        {/* Status */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Status</Text>
          <View className="flex-row gap-4">
            <Pressable
              onPress={() => setIsActive(!isActive)}
              className="flex-row items-center"
            >
              <View
                className={cn(
                  'w-6 h-6 rounded border-2 mr-2 items-center justify-center',
                  isActive ? 'bg-green-600 border-green-600' : 'border-gray-300'
                )}
              >
                {isActive && <Check size={14} color="white" />}
              </View>
              <Text className="text-gray-700">Active</Text>
            </Pressable>

            <Pressable
              onPress={() => setIsDefault(!isDefault)}
              className="flex-row items-center"
            >
              <View
                className={cn(
                  'w-6 h-6 rounded border-2 mr-2 items-center justify-center',
                  isDefault ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                )}
              >
                {isDefault && <Star size={14} color="white" />}
              </View>
              <Text className="text-gray-700">Default Plan</Text>
            </Pressable>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row gap-4 pt-6 border-t border-gray-200">
          <Pressable
            onPress={onCancel}
            className="flex-1 py-4 rounded-lg border border-gray-300"
          >
            <Text className="text-center text-gray-700 font-semibold">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            className={cn(
              'flex-1 py-4 rounded-lg',
              isLoading ? 'bg-blue-400' : 'bg-blue-600'
            )}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-white font-semibold">
                {plan ? 'Update Plan' : 'Create Plan'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

// ==================== MAIN SCREEN ====================

export default function AdminFastingScreen() {
  // Data state
  const [plans, setPlans] = useState<FastingPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: Record<FastingDifficulty, number>;
    byProtocol: Record<FastingProtocol, number>;
  } | null>(null);

  // UI state
  const [showInactive, setShowInactive] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<FastingDifficulty | null>(null);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FastingPlan | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionMenuPlanId, setActionMenuPlanId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fastingService.list({
        filters: {
          difficulty: selectedDifficulty || undefined,
          isActive: showInactive ? undefined : true,
        },
        orderBy: 'display_order',
        orderDirection: 'asc',
      });
      setPlans(result.plans);
      setTotal(result.total);
    } catch (error) {
      setToast({ message: 'Failed to load fasting plans', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedDifficulty, showInactive]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await fastingService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Handlers
  const handleCreate = () => {
    setEditingPlan(null);
    setShowForm(true);
  };

  const handleEdit = (plan: FastingPlan) => {
    setEditingPlan(plan);
    setShowForm(true);
  };

  const handleSubmit = async (data: FastingPlanInsert | FastingPlanUpdate) => {
    try {
      setFormLoading(true);
      if (editingPlan) {
        await fastingService.update(editingPlan.id, data);
        setToast({ message: 'Plan updated successfully', type: 'success' });
      } else {
        await fastingService.create(data as FastingPlanInsert);
        setToast({ message: 'Plan created successfully', type: 'success' });
      }
      setShowForm(false);
      setEditingPlan(null);
      fetchPlans();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to save plan', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await fastingService.duplicate(id);
      setToast({ message: 'Plan duplicated successfully', type: 'success' });
      fetchPlans();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to duplicate plan', type: 'error' });
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fastingService.setDefault(id);
      setToast({ message: 'Default plan updated', type: 'success' });
      fetchPlans();
    } catch (error) {
      setToast({ message: 'Failed to set default plan', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fastingService.softDelete(id);
      setToast({ message: 'Plan deleted successfully', type: 'success' });
      fetchPlans();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to delete plan', type: 'error' });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await fastingService.restore(id);
      setToast({ message: 'Plan restored successfully', type: 'success' });
      fetchPlans();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to restore plan', type: 'error' });
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <ScrollView className="flex-1">
        <View className="p-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <View>
              <Text className="text-2xl font-bold text-gray-900">Fasting Protocols</Text>
              <Text className="text-gray-500">Manage intermittent fasting plans</Text>
            </View>
            <Pressable
              onPress={handleCreate}
              className="flex-row items-center bg-blue-600 px-4 py-2 rounded-lg"
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Plan</Text>
            </Pressable>
          </View>

          {/* Stats Cards */}
          {stats && (
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
                <Text className="text-sm text-gray-500">Total Plans</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-green-600">{stats.active}</Text>
                <Text className="text-sm text-gray-500">Active</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-blue-600">
                  {stats.byProtocol?.['16:8'] || 0}
                </Text>
                <Text className="text-sm text-gray-500">16:8 Plans</Text>
              </View>
            </View>
          )}

          {/* Filters */}
          <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {ALL_DIFFICULTIES.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => setSelectedDifficulty(selectedDifficulty === d ? null : d)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border',
                      selectedDifficulty === d
                        ? 'bg-purple-600 border-purple-600'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        selectedDifficulty === d ? 'text-white' : 'text-gray-700'
                      )}
                    >
                      {FASTING_DIFFICULTY_LABELS[d]}
                    </Text>
                  </Pressable>
                ))}

                <View className="w-px bg-gray-300 mx-2" />

                <Pressable
                  onPress={() => setShowInactive(!showInactive)}
                  className={cn(
                    'px-3 py-1.5 rounded-full border',
                    showInactive
                      ? 'bg-gray-600 border-gray-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm',
                      showInactive ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    Show Inactive
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>

          {/* Plans List */}
          <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {isLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-gray-500 mt-4">Loading plans...</Text>
              </View>
            ) : plans.length === 0 ? (
              <View className="py-12 items-center">
                <Timer size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4">No fasting plans found</Text>
                <Pressable
                  onPress={handleCreate}
                  className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Add First Plan</Text>
                </Pressable>
              </View>
            ) : (
              plans.map((plan) => (
                <View
                  key={plan.id}
                  className="flex-row items-center px-4 py-4 border-b border-gray-100"
                >
                  {/* Plan Info */}
                  <View className="flex-[2]">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="font-semibold text-gray-900">{plan.name}</Text>
                      {plan.is_default && (
                        <Star size={14} color="#2563eb" fill="#2563eb" />
                      )}
                    </View>
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {plan.description || FASTING_PROTOCOL_DESCRIPTIONS[plan.protocol]}
                    </Text>
                  </View>

                  {/* Protocol */}
                  <View className="flex-1">
                    <ProtocolBadge protocol={plan.protocol} />
                  </View>

                  {/* Timing */}
                  <View className="flex-1">
                    <Text className="text-sm text-gray-600">
                      {plan.fasting_hours}h fast / {plan.eating_hours}h eat
                    </Text>
                    <Text className="text-xs text-gray-400">
                      {plan.recommended_end_time} - {plan.recommended_start_time}
                    </Text>
                  </View>

                  {/* Difficulty */}
                  <View className="flex-1">
                    <DifficultyBadge difficulty={plan.difficulty} />
                  </View>

                  {/* Status */}
                  <View className="flex-1">
                    <StatusBadge isActive={plan.is_active} isDefault={plan.is_default} />
                  </View>

                  {/* Actions */}
                  <View className="w-12 relative">
                    <Pressable
                      onPress={() => setActionMenuPlanId(actionMenuPlanId === plan.id ? null : plan.id)}
                      className="p-2"
                    >
                      <MoreVertical size={20} color="#6B7280" />
                    </Pressable>
                    {actionMenuPlanId === plan.id && (
                      <ActionMenu
                        onEdit={() => handleEdit(plan)}
                        onDuplicate={() => handleDuplicate(plan.id)}
                        onSetDefault={() => handleSetDefault(plan.id)}
                        onDelete={() => handleDelete(plan.id)}
                        onRestore={() => handleRestore(plan.id)}
                        isActive={plan.is_active}
                        isDefault={plan.is_default}
                        onClose={() => setActionMenuPlanId(null)}
                      />
                    )}
                  </View>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={showForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <FastingForm
          plan={editingPlan}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingPlan(null);
          }}
          isLoading={formLoading}
        />
      </Modal>
    </View>
  );
}

/**
 * ADMIN - MEAL MANAGEMENT
 * Manage meals, meal plans, and meal prep videos
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Image } from 'expo-image';
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Utensils,
  Clock,
  Flame,
  Eye,
  Edit,
  Trash2,
  Video,
  Upload,
  Coffee,
  Sun,
  Moon,
  Cookie,
  Check,
  X,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { meals, mealPlans } from '@/data/mock-data';
import type { MealType, MealIntensity } from '@/types/fitness';
import type { ContentStatus } from '@/types/database';

// Tab type
type TabType = 'meals' | 'meal-plans';

// Meal type icons
const MEAL_TYPE_CONFIG: Record<MealType, { icon: typeof Coffee; color: string; label: string }> = {
  breakfast: { icon: Coffee, color: '#f59e0b', label: 'Breakfast' },
  lunch: { icon: Sun, color: '#06b6d4', label: 'Lunch' },
  dinner: { icon: Moon, color: '#8b5cf6', label: 'Dinner' },
  snack: { icon: Cookie, color: '#ec4899', label: 'Snack' },
};

// Intensity config
const INTENSITY_CONFIG: Record<MealIntensity, { bg: string; text: string; label: string }> = {
  light: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Light' },
  standard: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Standard' },
  high_energy: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'High Energy' },
};

// Status badge
function StatusBadge({ status }: { status: ContentStatus }) {
  const config: Record<ContentStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' },
    pending_review: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Approved' },
    rejected: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Rejected' },
    archived: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Archived' },
  };
  const { bg, text, label } = config[status];

  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>{label}</Text>
    </View>
  );
}

// Intensity badge
function IntensityBadge({ intensity }: { intensity: MealIntensity }) {
  const { bg, text, label } = INTENSITY_CONFIG[intensity];

  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>{label}</Text>
    </View>
  );
}

// Tab button
function TabButton({
  label,
  count,
  isActive,
  onPress,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        className={cn(
          'flex-row items-center rounded-lg px-4 py-2',
          isActive ? 'bg-emerald-500/10' : 'bg-transparent'
        )}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            isActive ? 'text-emerald-400' : 'text-slate-400'
          )}
        >
          {label}
        </Text>
        <View
          className={cn(
            'ml-2 rounded-full px-2 py-0.5',
            isActive ? 'bg-emerald-500/20' : 'bg-slate-800'
          )}
        >
          <Text
            className={cn(
              'text-xs',
              isActive ? 'text-emerald-400' : 'text-slate-500'
            )}
          >
            {count}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Meal card
function MealCard({
  meal,
  onEdit,
}: {
  meal: typeof meals[0];
  onEdit: () => void;
}) {
  const typeConfig = MEAL_TYPE_CONFIG[meal.type];
  const TypeIcon = typeConfig.icon;
  const hasVideo = !!meal.videoUrl;

  return (
    <View className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      {/* Image */}
      <View className="relative mb-3 h-32 overflow-hidden rounded-lg">
        <Image
          source={{ uri: meal.imageUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View className="absolute left-2 top-2 flex-row gap-1">
          <View
            className="flex-row items-center rounded-full px-2 py-0.5"
            style={{ backgroundColor: `${typeConfig.color}30` }}
          >
            <TypeIcon size={12} color={typeConfig.color} />
            <Text className="ml-1 text-xs" style={{ color: typeConfig.color }}>
              {typeConfig.label}
            </Text>
          </View>
        </View>
        <View className="absolute right-2 top-2">
          <StatusBadge status="approved" />
        </View>
        {hasVideo && (
          <View className="absolute bottom-2 right-2 flex-row items-center rounded-full bg-black/60 px-2 py-0.5">
            <Video size={10} color="white" />
            <Text className="ml-1 text-xs text-white">Prep video</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <Text className="mb-1 text-base font-semibold text-white">{meal.name}</Text>
      <Text className="mb-3 text-xs text-slate-400" numberOfLines={2}>
        {meal.description}
      </Text>

      {/* Nutrition stats */}
      <View className="mb-3 flex-row gap-3">
        <View className="flex-row items-center">
          <Flame size={12} color="#f97316" />
          <Text className="ml-1 text-xs text-orange-400">{meal.nutrition.calories} cal</Text>
        </View>
        <View className="flex-row items-center">
          <Text className="text-xs text-cyan-400">{meal.nutrition.protein}g protein</Text>
        </View>
      </View>

      {/* Dietary tags */}
      {meal.dietaryTags.length > 0 && (
        <View className="mb-3 flex-row flex-wrap gap-1">
          {meal.dietaryTags.slice(0, 3).map((tag) => (
            <View key={tag} className="rounded bg-slate-800 px-2 py-0.5">
              <Text className="text-xs capitalize text-slate-400">{tag.replace('_', ' ')}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onEdit}
          className="flex-1 flex-row items-center justify-center rounded-lg bg-slate-800 py-2"
        >
          <Edit size={14} color="#94a3b8" />
          <Text className="ml-2 text-xs text-slate-400">Edit</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg bg-slate-800 px-3 py-2">
          <Eye size={14} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  );
}

// Meal plan row
function MealPlanRow({
  mealPlan,
  onEdit,
}: {
  mealPlan: typeof mealPlans[0];
  onEdit: () => void;
}) {
  // Derive intensity from total calories
  const getIntensity = (calories: number): MealIntensity => {
    if (calories < 1600) return 'light';
    if (calories < 2000) return 'standard';
    return 'high_energy';
  };

  const intensity = getIntensity(mealPlan.totalNutrition.calories);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <View className="flex-row items-center border-b border-slate-800 py-4">
      {/* Day */}
      <View className="w-16">
        <View className="h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/20">
          <Text className="text-sm font-bold text-cyan-400">{dayNames[mealPlan.dayOfWeek]}</Text>
        </View>
      </View>

      {/* Name */}
      <View className="flex-1">
        <Text className="text-sm font-medium text-white">{dayNames[mealPlan.dayOfWeek]} Meal Plan</Text>
        <Text className="text-xs text-slate-400">{mealPlan.meals.length} meals</Text>
      </View>

      {/* Intensity */}
      <View className="w-28">
        <IntensityBadge intensity={intensity} />
      </View>

      {/* Total Nutrition */}
      <View className="w-32">
        <View className="flex-row items-center">
          <Flame size={12} color="#f97316" />
          <Text className="ml-1 text-sm text-white">{mealPlan.totalNutrition.calories} cal</Text>
        </View>
        <Text className="text-xs text-slate-400">{mealPlan.totalNutrition.protein}g protein</Text>
      </View>

      {/* Meals breakdown */}
      <View className="w-48 flex-row gap-1">
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
          const mealOfType = mealPlan.meals.find((m) => m.type === type);
          const config = MEAL_TYPE_CONFIG[type];
          const Icon = config.icon;

          return (
            <View
              key={type}
              className={cn(
                'h-7 w-7 items-center justify-center rounded',
                mealOfType ? 'bg-slate-700' : 'bg-slate-800/50'
              )}
            >
              <Icon size={14} color={mealOfType ? config.color : '#334155'} />
            </View>
          );
        })}
      </View>

      {/* Status */}
      <View className="w-24">
        <StatusBadge status="approved" />
      </View>

      {/* Actions */}
      <View className="w-20 flex-row justify-end gap-2">
        <Pressable onPress={onEdit} className="p-1">
          <Edit size={16} color="#64748b" />
        </Pressable>
        <Pressable className="p-1">
          <Eye size={16} color="#64748b" />
        </Pressable>
      </View>
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

export default function AdminMealsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('meals');
  const [searchQuery, setSearchQuery] = useState('');
  const [mealTypeFilter, setMealTypeFilter] = useState<string>('all');
  const [intensityFilter, setIntensityFilter] = useState<string>('all');

  // Filter meals
  const filteredMeals = useMemo(() => {
    return meals.filter((meal) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!meal.name.toLowerCase().includes(query)) return false;
      }
      if (mealTypeFilter !== 'all' && meal.type !== mealTypeFilter) return false;
      return true;
    });
  }, [searchQuery, mealTypeFilter]);

  // Filter meal plans
  const filteredMealPlans = useMemo(() => {
    return mealPlans.filter((plan) => {
      if (intensityFilter !== 'all') {
        // Derive intensity from calories
        const calories = plan.totalNutrition.calories;
        let intensity: MealIntensity;
        if (calories < 1600) intensity = 'light';
        else if (calories < 2000) intensity = 'standard';
        else intensity = 'high_energy';
        if (intensity !== intensityFilter) return false;
      }
      return true;
    });
  }, [intensityFilter]);

  return (
    <View className="flex-1 p-6">
      {/* Page header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Meal Management</Text>
          <Text className="text-sm text-slate-400">
            Manage meals, meal plans, and nutritional content
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable className="flex-row items-center rounded-lg bg-slate-800 px-4 py-2">
            <Upload size={16} color="#94a3b8" />
            <Text className="ml-2 text-sm text-slate-400">Upload Prep Video</Text>
          </Pressable>
          <Pressable className="flex-row items-center rounded-lg bg-emerald-500 px-4 py-2">
            <Plus size={16} color="white" />
            <Text className="ml-2 text-sm font-medium text-white">Add Meal</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className="mb-4 flex-row gap-2 border-b border-slate-800 pb-4">
        <TabButton
          label="Meals"
          count={meals.length}
          isActive={activeTab === 'meals'}
          onPress={() => setActiveTab('meals')}
        />
        <TabButton
          label="Meal Plans"
          count={mealPlans.length}
          isActive={activeTab === 'meal-plans'}
          onPress={() => setActiveTab('meal-plans')}
        />
      </View>

      {/* Search and filters */}
      <View className="mb-4 flex-row items-center gap-4">
        <View className="flex-1 flex-row items-center rounded-lg bg-slate-800 px-4 py-2">
          <Search size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab === 'meals' ? 'meals' : 'meal plans'}...`}
            placeholderTextColor="#64748b"
            className="ml-3 flex-1 text-sm text-white"
          />
        </View>

        {activeTab === 'meals' && (
          <FilterDropdown
            label="Type"
            value={mealTypeFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'breakfast', label: 'Breakfast' },
              { value: 'lunch', label: 'Lunch' },
              { value: 'dinner', label: 'Dinner' },
              { value: 'snack', label: 'Snack' },
            ]}
            onChange={setMealTypeFilter}
          />
        )}

        {activeTab === 'meal-plans' && (
          <FilterDropdown
            label="Intensity"
            value={intensityFilter}
            options={[
              { value: 'all', label: 'All' },
              { value: 'light', label: 'Light' },
              { value: 'standard', label: 'Standard' },
              { value: 'high_energy', label: 'High Energy' },
            ]}
            onChange={setIntensityFilter}
          />
        )}
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {/* Meals tab */}
        {activeTab === 'meals' && (
          <View className="flex-row flex-wrap gap-4">
            {filteredMeals.map((meal) => (
              <View key={meal.id} style={{ width: '23%' }}>
                <MealCard meal={meal} onEdit={() => {}} />
              </View>
            ))}
          </View>
        )}

        {/* Meal Plans tab */}
        {activeTab === 'meal-plans' && (
          <View className="rounded-2xl border border-slate-700 bg-slate-900">
            {/* Table header */}
            <View className="flex-row items-center border-b border-slate-700 px-4 py-3">
              <Text className="w-16 text-xs font-medium uppercase text-slate-500">Day</Text>
              <Text className="flex-1 text-xs font-medium uppercase text-slate-500">Plan</Text>
              <Text className="w-28 text-xs font-medium uppercase text-slate-500">Intensity</Text>
              <Text className="w-32 text-xs font-medium uppercase text-slate-500">Nutrition</Text>
              <Text className="w-48 text-xs font-medium uppercase text-slate-500">Meals</Text>
              <Text className="w-24 text-xs font-medium uppercase text-slate-500">Status</Text>
              <View className="w-20" />
            </View>

            {filteredMealPlans.map((plan) => (
              <MealPlanRow key={plan.id} mealPlan={plan} onEdit={() => {}} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

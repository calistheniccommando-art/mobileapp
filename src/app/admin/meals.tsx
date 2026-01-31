/**
 * ADMIN - MEAL MANAGEMENT
 * Full CRUD for Nigerian meals with nutrition tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, ActivityIndicator } from 'react-native';
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
  Copy,
  RotateCcw,
  MoreVertical,
  Star,
  Check,
  X,
  Coffee,
  Sun,
  Moon,
  Cookie,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { MealForm } from '@/components/admin/MealForm';
import { NutritionMini } from '@/components/admin/NutritionCalculator';
import {
  mealService,
  type Meal,
  type MealInsert,
  type MealUpdate,
  type MealType,
  type CalorieCategory,
  type MealRegion,
  type DietaryTag,
  MEAL_TYPE_LABELS,
  CALORIE_CATEGORY_LABELS,
  MEAL_REGION_LABELS,
  DIETARY_TAG_LABELS,
  MEAL_TYPE_COLORS,
  CALORIE_CATEGORY_COLORS,
} from '@/lib/supabase/meals';

// ==================== CONFIGS ====================

const MEAL_TYPE_ICONS: Record<MealType, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Cookie,
};

// ==================== COMPONENTS ====================

function MealTypeBadge({ type }: { type: MealType }) {
  const { bg, text } = MEAL_TYPE_COLORS[type];
  const Icon = MEAL_TYPE_ICONS[type];
  
  return (
    <View className={cn('flex-row items-center rounded-full px-2 py-1', bg)}>
      <Icon size={12} color={text.replace('text-', '#').replace('-800', '')} />
      <Text className={cn('text-xs font-medium ml-1', text)}>
        {MEAL_TYPE_LABELS[type]}
      </Text>
    </View>
  );
}

function CalorieCategoryBadge({ category }: { category: CalorieCategory }) {
  const { bg, text } = CALORIE_CATEGORY_COLORS[category];
  
  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>
        {CALORIE_CATEGORY_LABELS[category]}
      </Text>
    </View>
  );
}

function StatusBadge({ isActive, isFeatured }: { isActive: boolean; isFeatured?: boolean }) {
  if (!isActive) {
    return (
      <View className="rounded-full px-2 py-1 bg-gray-200">
        <Text className="text-xs font-medium text-gray-600">Inactive</Text>
      </View>
    );
  }
  if (isFeatured) {
    return (
      <View className="flex-row items-center rounded-full px-2 py-1 bg-yellow-100">
        <Star size={10} color="#ca8a04" fill="#ca8a04" />
        <Text className="text-xs font-medium text-yellow-700 ml-1">Featured</Text>
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
  onToggleFeatured,
  onDelete,
  onRestore,
  isActive,
  isFeatured,
  onClose,
}: {
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleFeatured: () => void;
  onDelete: () => void;
  onRestore?: () => void;
  isActive: boolean;
  isFeatured: boolean;
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
        <Pressable
          onPress={() => { onToggleFeatured(); onClose(); }}
          className="flex-row items-center px-4 py-2"
        >
          <Star size={16} color={isFeatured ? '#ca8a04' : '#6B7280'} fill={isFeatured ? '#ca8a04' : 'transparent'} />
          <Text className="text-gray-700 ml-3">{isFeatured ? 'Unfeature' : 'Feature'}</Text>
        </Pressable>
        <View className="h-px bg-gray-200 my-1" />
        {isActive ? (
          <Pressable
            onPress={() => { onDelete(); onClose(); }}
            className="flex-row items-center px-4 py-2"
          >
            <Trash2 size={16} color="#EF4444" />
            <Text className="text-red-500 ml-3">Delete</Text>
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

// ==================== MAIN SCREEN ====================

export default function AdminMealsScreen() {
  // Data state
  const [meals, setMeals] = useState<Meal[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    featured: number;
    averageCalories: number;
  } | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CalorieCategory | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<MealRegion | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [actionMenuMealId, setActionMenuMealId] = useState<string | null>(null);

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch meals
  const fetchMeals = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await mealService.list({
        filters: {
          search: searchQuery || undefined,
          mealType: selectedMealType || undefined,
          calorieCategory: selectedCategory || undefined,
          region: selectedRegion || undefined,
          isActive: showInactive ? undefined : true,
        },
        page,
        pageSize,
        orderBy: 'name',
        orderDirection: 'asc',
      });
      setMeals(result.meals);
      setTotal(result.total);
    } catch (error) {
      setToast({ message: 'Failed to load meals', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedMealType, selectedCategory, selectedRegion, showInactive, page, pageSize]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const data = await mealService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedMealType, selectedCategory, selectedRegion, showInactive]);

  // Handlers
  const handleCreate = () => {
    setEditingMeal(null);
    setShowForm(true);
  };

  const handleEdit = (meal: Meal) => {
    setEditingMeal(meal);
    setShowForm(true);
  };

  const handleSubmit = async (data: MealInsert | MealUpdate) => {
    try {
      setFormLoading(true);
      if (editingMeal) {
        await mealService.update(editingMeal.id, data);
        setToast({ message: 'Meal updated successfully', type: 'success' });
      } else {
        await mealService.create(data as MealInsert);
        setToast({ message: 'Meal created successfully', type: 'success' });
      }
      setShowForm(false);
      setEditingMeal(null);
      fetchMeals();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to save meal', type: 'error' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await mealService.duplicate(id);
      setToast({ message: 'Meal duplicated successfully', type: 'success' });
      fetchMeals();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to duplicate meal', type: 'error' });
    }
  };

  const handleToggleFeatured = async (id: string) => {
    try {
      await mealService.toggleFeatured(id);
      setToast({ message: 'Featured status updated', type: 'success' });
      fetchMeals();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to update featured status', type: 'error' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await mealService.softDelete(id);
      setToast({ message: 'Meal deleted successfully', type: 'success' });
      fetchMeals();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to delete meal', type: 'error' });
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await mealService.restore(id);
      setToast({ message: 'Meal restored successfully', type: 'success' });
      fetchMeals();
      fetchStats();
    } catch (error) {
      setToast({ message: 'Failed to restore meal', type: 'error' });
    }
  };

  const totalPages = Math.ceil(total / pageSize);

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
              <Text className="text-2xl font-bold text-gray-900">Nigerian Meal Database</Text>
              <Text className="text-gray-500">Manage meals, nutrition, and meal prep content</Text>
            </View>
            <Pressable
              onPress={handleCreate}
              className="flex-row items-center bg-green-600 px-4 py-2 rounded-lg"
            >
              <Plus size={20} color="white" />
              <Text className="text-white font-semibold ml-2">Add Meal</Text>
            </Pressable>
          </View>

          {/* Stats Cards */}
          {stats && (
            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-gray-900">{stats.total}</Text>
                <Text className="text-sm text-gray-500">Total Meals</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-green-600">{stats.active}</Text>
                <Text className="text-sm text-gray-500">Active</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-yellow-600">{stats.featured}</Text>
                <Text className="text-sm text-gray-500">Featured</Text>
              </View>
              <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
                <Text className="text-2xl font-bold text-blue-600">{stats.averageCalories}</Text>
                <Text className="text-sm text-gray-500">Avg Calories</Text>
              </View>
            </View>
          )}

          {/* Filters */}
          <View className="bg-white rounded-xl p-4 mb-6 border border-gray-200">
            <View className="flex-row items-center gap-4 mb-4">
              {/* Search */}
              <View className="flex-1 flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <Search size={20} color="#9CA3AF" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search meals..."
                  className="flex-1 ml-2 text-base"
                />
              </View>
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {/* Meal Type Filter */}
                {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setSelectedMealType(selectedMealType === type ? null : type)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border',
                      selectedMealType === type
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        selectedMealType === type ? 'text-white' : 'text-gray-700'
                      )}
                    >
                      {MEAL_TYPE_LABELS[type]}
                    </Text>
                  </Pressable>
                ))}
                
                <View className="w-px bg-gray-300 mx-2" />
                
                {/* Calorie Category Filter */}
                {(['light', 'standard', 'high_energy'] as CalorieCategory[]).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border',
                      selectedCategory === cat
                        ? 'bg-green-600 border-green-600'
                        : 'bg-white border-gray-300'
                    )}
                  >
                    <Text
                      className={cn(
                        'text-sm',
                        selectedCategory === cat ? 'text-white' : 'text-gray-700'
                      )}
                    >
                      {cat === 'light' ? 'Light' : cat === 'standard' ? 'Standard' : 'High Energy'}
                    </Text>
                  </Pressable>
                ))}

                <View className="w-px bg-gray-300 mx-2" />

                {/* Show Inactive Toggle */}
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

          {/* Meals Table */}
          <View className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <View className="flex-row items-center bg-gray-50 px-4 py-3 border-b border-gray-200">
              <Text className="flex-[2] text-sm font-semibold text-gray-600">Meal</Text>
              <Text className="flex-1 text-sm font-semibold text-gray-600">Type</Text>
              <Text className="flex-1 text-sm font-semibold text-gray-600">Category</Text>
              <Text className="flex-1 text-sm font-semibold text-gray-600">Nutrition</Text>
              <Text className="flex-1 text-sm font-semibold text-gray-600">Status</Text>
              <Text className="w-12 text-sm font-semibold text-gray-600"></Text>
            </View>

            {/* Table Body */}
            {isLoading ? (
              <View className="py-12 items-center">
                <ActivityIndicator size="large" color="#10B981" />
                <Text className="text-gray-500 mt-4">Loading meals...</Text>
              </View>
            ) : meals.length === 0 ? (
              <View className="py-12 items-center">
                <Utensils size={48} color="#9CA3AF" />
                <Text className="text-gray-500 mt-4">No meals found</Text>
                <Pressable
                  onPress={handleCreate}
                  className="mt-4 bg-green-600 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white font-semibold">Add First Meal</Text>
                </Pressable>
              </View>
            ) : (
              meals.map((meal) => (
                <View
                  key={meal.id}
                  className="flex-row items-center px-4 py-3 border-b border-gray-100"
                >
                  {/* Meal Info */}
                  <View className="flex-[2] flex-row items-center">
                    {meal.image_url ? (
                      <Image
                        source={{ uri: meal.image_url }}
                        className="w-12 h-12 rounded-lg"
                        contentFit="cover"
                      />
                    ) : (
                      <View className="w-12 h-12 rounded-lg bg-gray-200 items-center justify-center">
                        <Utensils size={20} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-gray-900" numberOfLines={1}>
                        {meal.name}
                      </Text>
                      <Text className="text-sm text-gray-500" numberOfLines={1}>
                        {meal.region ? MEAL_REGION_LABELS[meal.region] : 'Nigerian'}
                      </Text>
                    </View>
                  </View>

                  {/* Type */}
                  <View className="flex-1">
                    <MealTypeBadge type={meal.meal_type} />
                  </View>

                  {/* Category */}
                  <View className="flex-1">
                    <CalorieCategoryBadge category={meal.calorie_category} />
                  </View>

                  {/* Nutrition */}
                  <View className="flex-1">
                    <NutritionMini
                      nutrition={{
                        calories: meal.calories,
                        protein: meal.protein_grams,
                        carbs: meal.carbs_grams,
                        fat: meal.fat_grams,
                      }}
                    />
                  </View>

                  {/* Status */}
                  <View className="flex-1">
                    <StatusBadge isActive={meal.is_active} isFeatured={meal.is_featured} />
                  </View>

                  {/* Actions */}
                  <View className="w-12 relative">
                    <Pressable
                      onPress={() => setActionMenuMealId(actionMenuMealId === meal.id ? null : meal.id)}
                      className="p-2"
                    >
                      <MoreVertical size={20} color="#6B7280" />
                    </Pressable>
                    {actionMenuMealId === meal.id && (
                      <ActionMenu
                        onEdit={() => handleEdit(meal)}
                        onDuplicate={() => handleDuplicate(meal.id)}
                        onToggleFeatured={() => handleToggleFeatured(meal.id)}
                        onDelete={() => handleDelete(meal.id)}
                        onRestore={() => handleRestore(meal.id)}
                        isActive={meal.is_active}
                        isFeatured={meal.is_featured}
                        onClose={() => setActionMenuMealId(null)}
                      />
                    )}
                  </View>
                </View>
              ))
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <View className="flex-row items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-200">
                <Text className="text-sm text-gray-500">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total}
                </Text>
                <View className="flex-row items-center gap-2">
                  <Pressable
                    onPress={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={cn(
                      'p-2 rounded-lg',
                      page === 1 ? 'opacity-50' : 'bg-white border border-gray-300'
                    )}
                  >
                    <ChevronLeft size={20} color="#6B7280" />
                  </Pressable>
                  <Text className="text-sm text-gray-600 mx-2">
                    Page {page} of {totalPages}
                  </Text>
                  <Pressable
                    onPress={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      'p-2 rounded-lg',
                      page === totalPages ? 'opacity-50' : 'bg-white border border-gray-300'
                    )}
                  >
                    <ChevronRight size={20} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
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
        <MealForm
          meal={editingMeal}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingMeal(null);
          }}
          isLoading={formLoading}
        />
      </Modal>
    </View>
  );
}

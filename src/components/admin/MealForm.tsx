/**
 * MealForm Component
 * 
 * Form for creating/editing meals in the admin panel
 * Includes nutrition inputs, ingredients, instructions, and dietary tags
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  Image as ImageIcon,
  Video,
  Calculator,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import type {
  Meal,
  MealInsert,
  MealUpdate,
  MealType,
  CalorieCategory,
  MealRegion,
  DietaryTag,
} from '@/lib/supabase/meals';
import {
  MEAL_TYPE_LABELS,
  CALORIE_CATEGORY_LABELS,
  MEAL_REGION_LABELS,
  DIETARY_TAG_LABELS,
  GOAL_LABELS,
} from '@/lib/supabase/meals';

interface MealFormProps {
  meal?: Meal | null;
  onSubmit: (data: MealInsert | MealUpdate) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

const ALL_MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const ALL_CALORIE_CATEGORIES: CalorieCategory[] = ['light', 'standard', 'high_energy'];
const ALL_REGIONS: MealRegion[] = ['yoruba', 'igbo', 'hausa', 'general', 'fusion'];
const ALL_DIETARY_TAGS: DietaryTag[] = [
  'vegetarian', 'vegan', 'keto', 'low_carb', 'high_protein', 'gluten_free', 'dairy_free', 'halal'
];
const ALL_GOALS = ['weight_loss', 'muscle_gain', 'maintenance', 'endurance'];

export function MealForm({ meal, onSubmit, onCancel, isLoading }: MealFormProps) {
  // Basic info
  const [name, setName] = useState(meal?.name || '');
  const [description, setDescription] = useState(meal?.description || '');
  const [mealType, setMealType] = useState<MealType>(meal?.meal_type || 'lunch');
  const [calorieCategory, setCalorieCategory] = useState<CalorieCategory>(
    meal?.calorie_category || 'standard'
  );
  const [region, setRegion] = useState<MealRegion>(meal?.region || 'general');

  // Nutrition
  const [calories, setCalories] = useState(meal?.calories?.toString() || '');
  const [protein, setProtein] = useState(meal?.protein_grams?.toString() || '');
  const [carbs, setCarbs] = useState(meal?.carbs_grams?.toString() || '');
  const [fat, setFat] = useState(meal?.fat_grams?.toString() || '');
  const [fiber, setFiber] = useState(meal?.fiber_grams?.toString() || '');
  const [sodium, setSodium] = useState(meal?.sodium_mg?.toString() || '');

  // Content
  const [ingredients, setIngredients] = useState<string[]>(meal?.ingredients || ['']);
  const [instructions, setInstructions] = useState<string[]>(meal?.instructions || ['']);
  const [prepTime, setPrepTime] = useState(meal?.prep_time_minutes?.toString() || '15');
  const [cookTime, setCookTime] = useState(meal?.cook_time_minutes?.toString() || '30');
  const [servings, setServings] = useState(meal?.servings?.toString() || '2');

  // Media
  const [imageUrl, setImageUrl] = useState(meal?.image_url || '');
  const [videoUrl, setVideoUrl] = useState(meal?.video_url || '');

  // Tags
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>(meal?.dietary_tags || []);
  const [suitableGoals, setSuitableGoals] = useState<string[]>(meal?.suitable_for_goals || []);

  // Status
  const [isActive, setIsActive] = useState(meal?.is_active ?? true);
  const [isFeatured, setIsFeatured] = useState(meal?.is_featured ?? false);

  // Validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Name is required';
    if (!calories || parseInt(calories) <= 0) newErrors.calories = 'Valid calories required';
    if (!protein || parseInt(protein) < 0) newErrors.protein = 'Valid protein required';
    if (!carbs || parseInt(carbs) < 0) newErrors.carbs = 'Valid carbs required';
    if (!fat || parseInt(fat) < 0) newErrors.fat = 'Valid fat required';
    if (ingredients.filter(i => i.trim()).length === 0) {
      newErrors.ingredients = 'At least one ingredient required';
    }
    if (instructions.filter(i => i.trim()).length === 0) {
      newErrors.instructions = 'At least one instruction required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const data: MealInsert | MealUpdate = {
      name: name.trim(),
      description: description.trim() || null,
      meal_type: mealType,
      calorie_category: calorieCategory,
      region,
      calories: parseInt(calories),
      protein_grams: parseInt(protein),
      carbs_grams: parseInt(carbs),
      fat_grams: parseInt(fat),
      fiber_grams: fiber ? parseInt(fiber) : null,
      sodium_mg: sodium ? parseInt(sodium) : null,
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      prep_time_minutes: parseInt(prepTime) || 15,
      cook_time_minutes: parseInt(cookTime) || 30,
      servings: parseInt(servings) || 2,
      image_url: imageUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      dietary_tags: dietaryTags,
      suitable_for_goals: suitableGoals,
      is_active: isActive,
      is_featured: isFeatured,
    };

    await onSubmit(data);
  };

  // Calculate macros percentage
  const totalMacroGrams = (parseInt(protein) || 0) + (parseInt(carbs) || 0) + (parseInt(fat) || 0);
  const proteinPercent = totalMacroGrams > 0 ? Math.round(((parseInt(protein) || 0) / totalMacroGrams) * 100) : 0;
  const carbsPercent = totalMacroGrams > 0 ? Math.round(((parseInt(carbs) || 0) / totalMacroGrams) * 100) : 0;
  const fatPercent = totalMacroGrams > 0 ? Math.round(((parseInt(fat) || 0) / totalMacroGrams) * 100) : 0;

  // List management helpers
  const addListItem = (list: string[], setList: (l: string[]) => void) => {
    setList([...list, '']);
  };

  const updateListItem = (list: string[], setList: (l: string[]) => void, index: number, value: string) => {
    const newList = [...list];
    newList[index] = value;
    setList(newList);
  };

  const removeListItem = (list: string[], setList: (l: string[]) => void, index: number) => {
    if (list.length > 1) {
      setList(list.filter((_, i) => i !== index));
    }
  };

  const toggleTag = <T extends string>(tag: T, list: T[], setList: (l: T[]) => void) => {
    if (list.includes(tag)) {
      setList(list.filter(t => t !== tag));
    } else {
      setList([...list, tag]);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6 space-y-6">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            {meal ? 'Edit Meal' : 'Create Meal'}
          </Text>
          <Pressable onPress={onCancel} className="p-2">
            <X size={24} color="#6B7280" />
          </Pressable>
        </View>

        {/* Basic Info Section */}
        <View className="space-y-4">
          <Text className="text-lg font-semibold text-gray-800">Basic Information</Text>

          {/* Name */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Meal Name *</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g., Jollof Rice with Grilled Chicken"
              className={cn(
                'border rounded-lg px-4 py-3 text-base',
                errors.name ? 'border-red-500' : 'border-gray-300'
              )}
            />
            {errors.name && <Text className="text-red-500 text-sm mt-1">{errors.name}</Text>}
          </View>

          {/* Description */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-1">Description</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the meal..."
              multiline
              numberOfLines={3}
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              style={{ textAlignVertical: 'top' }}
            />
          </View>

          {/* Meal Type */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Meal Type *</Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_MEAL_TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setMealType(type)}
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    mealType === type
                      ? 'bg-blue-600 border-blue-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      mealType === type ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {MEAL_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Calorie Category */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Calorie Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_CALORIE_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setCalorieCategory(cat)}
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    calorieCategory === cat
                      ? 'bg-green-600 border-green-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      calorieCategory === cat ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {CALORIE_CATEGORY_LABELS[cat]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Region */}
          <View>
            <Text className="text-sm font-medium text-gray-700 mb-2">Nigerian Region</Text>
            <View className="flex-row flex-wrap gap-2">
              {ALL_REGIONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRegion(r)}
                  className={cn(
                    'px-4 py-2 rounded-full border',
                    region === r
                      ? 'bg-purple-600 border-purple-600'
                      : 'bg-white border-gray-300'
                  )}
                >
                  <Text
                    className={cn(
                      'text-sm font-medium',
                      region === r ? 'text-white' : 'text-gray-700'
                    )}
                  >
                    {MEAL_REGION_LABELS[r]}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Nutrition Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-gray-800">Nutrition Information</Text>
            <View className="flex-row items-center">
              <Calculator size={16} color="#6B7280" />
              <Text className="text-sm text-gray-500 ml-1">per serving</Text>
            </View>
          </View>

          {/* Main Macros Row */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Calories *</Text>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                placeholder="500"
                keyboardType="numeric"
                className={cn(
                  'border rounded-lg px-4 py-3 text-base',
                  errors.calories ? 'border-red-500' : 'border-gray-300'
                )}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Protein (g) *</Text>
              <TextInput
                value={protein}
                onChangeText={setProtein}
                placeholder="25"
                keyboardType="numeric"
                className={cn(
                  'border rounded-lg px-4 py-3 text-base',
                  errors.protein ? 'border-red-500' : 'border-gray-300'
                )}
              />
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Carbs (g) *</Text>
              <TextInput
                value={carbs}
                onChangeText={setCarbs}
                placeholder="60"
                keyboardType="numeric"
                className={cn(
                  'border rounded-lg px-4 py-3 text-base',
                  errors.carbs ? 'border-red-500' : 'border-gray-300'
                )}
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Fat (g) *</Text>
              <TextInput
                value={fat}
                onChangeText={setFat}
                placeholder="15"
                keyboardType="numeric"
                className={cn(
                  'border rounded-lg px-4 py-3 text-base',
                  errors.fat ? 'border-red-500' : 'border-gray-300'
                )}
              />
            </View>
          </View>

          {/* Optional Nutrition */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Fiber (g)</Text>
              <TextInput
                value={fiber}
                onChangeText={setFiber}
                placeholder="5"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Sodium (mg)</Text>
              <TextInput
                value={sodium}
                onChangeText={setSodium}
                placeholder="800"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
          </View>

          {/* Macro Breakdown Visual */}
          {totalMacroGrams > 0 && (
            <View className="bg-gray-50 rounded-lg p-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">Macro Breakdown</Text>
              <View className="flex-row h-4 rounded-full overflow-hidden">
                <View style={{ flex: proteinPercent }} className="bg-blue-500" />
                <View style={{ flex: carbsPercent }} className="bg-green-500" />
                <View style={{ flex: fatPercent }} className="bg-yellow-500" />
              </View>
              <View className="flex-row justify-between mt-2">
                <Text className="text-xs text-gray-600">
                  <Text className="text-blue-600">●</Text> Protein {proteinPercent}%
                </Text>
                <Text className="text-xs text-gray-600">
                  <Text className="text-green-600">●</Text> Carbs {carbsPercent}%
                </Text>
                <Text className="text-xs text-gray-600">
                  <Text className="text-yellow-600">●</Text> Fat {fatPercent}%
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Ingredients Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Ingredients *</Text>
          {errors.ingredients && (
            <Text className="text-red-500 text-sm">{errors.ingredients}</Text>
          )}
          {ingredients.map((ingredient, index) => (
            <View key={index} className="flex-row items-center gap-2">
              <GripVertical size={20} color="#9CA3AF" />
              <TextInput
                value={ingredient}
                onChangeText={(value) => updateListItem(ingredients, setIngredients, index, value)}
                placeholder={`Ingredient ${index + 1}`}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
              <Pressable
                onPress={() => removeListItem(ingredients, setIngredients, index)}
                className="p-2"
              >
                <Trash2 size={20} color="#EF4444" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => addListItem(ingredients, setIngredients)}
            className="flex-row items-center justify-center py-3 border border-dashed border-gray-300 rounded-lg"
          >
            <Plus size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-2">Add Ingredient</Text>
          </Pressable>
        </View>

        {/* Instructions Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Cooking Instructions *</Text>
          {errors.instructions && (
            <Text className="text-red-500 text-sm">{errors.instructions}</Text>
          )}
          {instructions.map((instruction, index) => (
            <View key={index} className="flex-row items-start gap-2">
              <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mt-2">
                <Text className="text-blue-600 font-semibold">{index + 1}</Text>
              </View>
              <TextInput
                value={instruction}
                onChangeText={(value) => updateListItem(instructions, setInstructions, index, value)}
                placeholder={`Step ${index + 1}`}
                multiline
                className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-base"
                style={{ textAlignVertical: 'top', minHeight: 60 }}
              />
              <Pressable
                onPress={() => removeListItem(instructions, setInstructions, index)}
                className="p-2 mt-2"
              >
                <Trash2 size={20} color="#EF4444" />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={() => addListItem(instructions, setInstructions)}
            className="flex-row items-center justify-center py-3 border border-dashed border-gray-300 rounded-lg"
          >
            <Plus size={20} color="#6B7280" />
            <Text className="text-gray-600 ml-2">Add Step</Text>
          </Pressable>
        </View>

        {/* Timing Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Preparation</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Prep Time (min)</Text>
              <TextInput
                value={prepTime}
                onChangeText={setPrepTime}
                placeholder="15"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Cook Time (min)</Text>
              <TextInput
                value={cookTime}
                onChangeText={setCookTime}
                placeholder="30"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-700 mb-1">Servings</Text>
              <TextInput
                value={servings}
                onChangeText={setServings}
                placeholder="2"
                keyboardType="numeric"
                className="border border-gray-300 rounded-lg px-4 py-3 text-base"
              />
            </View>
          </View>
        </View>

        {/* Media Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Media</Text>
          
          <View>
            <View className="flex-row items-center mb-1">
              <ImageIcon size={16} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700 ml-2">Image URL</Text>
            </View>
            <TextInput
              value={imageUrl}
              onChangeText={setImageUrl}
              placeholder="https://example.com/meal-image.jpg"
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>

          <View>
            <View className="flex-row items-center mb-1">
              <Video size={16} color="#6B7280" />
              <Text className="text-sm font-medium text-gray-700 ml-2">Video URL</Text>
            </View>
            <TextInput
              value={videoUrl}
              onChangeText={setVideoUrl}
              placeholder="https://youtube.com/watch?v=..."
              className="border border-gray-300 rounded-lg px-4 py-3 text-base"
            />
          </View>
        </View>

        {/* Tags Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Dietary Tags</Text>
          <View className="flex-row flex-wrap gap-2">
            {ALL_DIETARY_TAGS.map((tag) => (
              <Pressable
                key={tag}
                onPress={() => toggleTag(tag, dietaryTags, setDietaryTags)}
                className={cn(
                  'px-3 py-2 rounded-full border',
                  dietaryTags.includes(tag)
                    ? 'bg-teal-600 border-teal-600'
                    : 'bg-white border-gray-300'
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    dietaryTags.includes(tag) ? 'text-white' : 'text-gray-700'
                  )}
                >
                  {DIETARY_TAG_LABELS[tag]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Goals Section */}
        <View className="space-y-4 pt-4 border-t border-gray-200">
          <Text className="text-lg font-semibold text-gray-800">Suitable For Goals</Text>
          <View className="flex-row flex-wrap gap-2">
            {ALL_GOALS.map((goal) => (
              <Pressable
                key={goal}
                onPress={() => toggleTag(goal, suitableGoals, setSuitableGoals)}
                className={cn(
                  'px-3 py-2 rounded-full border',
                  suitableGoals.includes(goal)
                    ? 'bg-orange-600 border-orange-600'
                    : 'bg-white border-gray-300'
                )}
              >
                <Text
                  className={cn(
                    'text-sm',
                    suitableGoals.includes(goal) ? 'text-white' : 'text-gray-700'
                  )}
                >
                  {GOAL_LABELS[goal]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Status Section */}
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
                {isActive && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-gray-700">Active</Text>
            </Pressable>

            <Pressable
              onPress={() => setIsFeatured(!isFeatured)}
              className="flex-row items-center"
            >
              <View
                className={cn(
                  'w-6 h-6 rounded border-2 mr-2 items-center justify-center',
                  isFeatured ? 'bg-yellow-500 border-yellow-500' : 'border-gray-300'
                )}
              >
                {isFeatured && <Text className="text-white text-xs">★</Text>}
              </View>
              <Text className="text-gray-700">Featured</Text>
            </Pressable>
          </View>
        </View>

        {/* Action Buttons */}
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
                {meal ? 'Update Meal' : 'Create Meal'}
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * NutritionCalculator Component
 * 
 * Helper component to calculate and display macro breakdown
 * Shows calories, protein, carbs, fat percentages and daily value %
 */

import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/lib/cn';

interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sodium?: number;
}

interface NutritionCalculatorProps {
  nutrition: NutritionData;
  servings?: number;
  showDailyValues?: boolean;
  compact?: boolean;
  className?: string;
}

// Standard daily values for percentage calculation
const DAILY_VALUES = {
  calories: 2000,
  protein: 50, // grams
  carbs: 275, // grams
  fat: 78, // grams
  fiber: 28, // grams
  sodium: 2300, // mg
};

// Calories per gram of each macro
const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
};

export function NutritionCalculator({
  nutrition,
  servings = 1,
  showDailyValues = true,
  compact = false,
  className,
}: NutritionCalculatorProps) {
  // Calculate per-serving values
  const perServing = {
    calories: Math.round(nutrition.calories / servings),
    protein: Math.round(nutrition.protein / servings),
    carbs: Math.round(nutrition.carbs / servings),
    fat: Math.round(nutrition.fat / servings),
    fiber: nutrition.fiber ? Math.round(nutrition.fiber / servings) : undefined,
    sodium: nutrition.sodium ? Math.round(nutrition.sodium / servings) : undefined,
  };

  // Calculate calories from each macro
  const caloriesFromProtein = perServing.protein * CALORIES_PER_GRAM.protein;
  const caloriesFromCarbs = perServing.carbs * CALORIES_PER_GRAM.carbs;
  const caloriesFromFat = perServing.fat * CALORIES_PER_GRAM.fat;
  const totalMacroCalories = caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

  // Calculate percentages of total calories
  const proteinPercent = totalMacroCalories > 0 
    ? Math.round((caloriesFromProtein / totalMacroCalories) * 100) 
    : 0;
  const carbsPercent = totalMacroCalories > 0 
    ? Math.round((caloriesFromCarbs / totalMacroCalories) * 100) 
    : 0;
  const fatPercent = totalMacroCalories > 0 
    ? Math.round((caloriesFromFat / totalMacroCalories) * 100) 
    : 0;

  // Calculate daily value percentages
  const getDailyValuePercent = (value: number, daily: number) => 
    Math.round((value / daily) * 100);

  if (compact) {
    return (
      <View className={cn('flex-row items-center gap-4', className)}>
        <View className="items-center">
          <Text className="text-lg font-bold text-gray-900">{perServing.calories}</Text>
          <Text className="text-xs text-gray-500">cal</Text>
        </View>
        <View className="h-8 w-px bg-gray-200" />
        <View className="flex-row gap-3">
          <View className="items-center">
            <Text className="text-sm font-semibold text-blue-600">{perServing.protein}g</Text>
            <Text className="text-xs text-gray-500">protein</Text>
          </View>
          <View className="items-center">
            <Text className="text-sm font-semibold text-green-600">{perServing.carbs}g</Text>
            <Text className="text-xs text-gray-500">carbs</Text>
          </View>
          <View className="items-center">
            <Text className="text-sm font-semibold text-yellow-600">{perServing.fat}g</Text>
            <Text className="text-xs text-gray-500">fat</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className={cn('bg-white rounded-xl border border-gray-200 overflow-hidden', className)}>
      {/* Header */}
      <View className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <Text className="text-lg font-bold text-gray-900">Nutrition Facts</Text>
        {servings > 1 && (
          <Text className="text-sm text-gray-500">Per serving ({servings} servings total)</Text>
        )}
      </View>

      {/* Calories */}
      <View className="px-4 py-3 border-b border-gray-200">
        <View className="flex-row justify-between items-baseline">
          <Text className="text-2xl font-bold text-gray-900">{perServing.calories}</Text>
          <Text className="text-gray-600">Calories</Text>
        </View>
      </View>

      {/* Macro Breakdown Bar */}
      <View className="px-4 py-3 border-b border-gray-200">
        <Text className="text-sm font-medium text-gray-700 mb-2">Calorie Breakdown</Text>
        <View className="flex-row h-6 rounded-full overflow-hidden bg-gray-100">
          {proteinPercent > 0 && (
            <View 
              style={{ width: `${proteinPercent}%` }} 
              className="bg-blue-500 items-center justify-center"
            >
              {proteinPercent >= 15 && (
                <Text className="text-white text-xs font-medium">{proteinPercent}%</Text>
              )}
            </View>
          )}
          {carbsPercent > 0 && (
            <View 
              style={{ width: `${carbsPercent}%` }} 
              className="bg-green-500 items-center justify-center"
            >
              {carbsPercent >= 15 && (
                <Text className="text-white text-xs font-medium">{carbsPercent}%</Text>
              )}
            </View>
          )}
          {fatPercent > 0 && (
            <View 
              style={{ width: `${fatPercent}%` }} 
              className="bg-yellow-500 items-center justify-center"
            >
              {fatPercent >= 15 && (
                <Text className="text-white text-xs font-medium">{fatPercent}%</Text>
              )}
            </View>
          )}
        </View>
        <View className="flex-row justify-center gap-4 mt-2">
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-blue-500 mr-1" />
            <Text className="text-xs text-gray-600">Protein</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-green-500 mr-1" />
            <Text className="text-xs text-gray-600">Carbs</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-3 h-3 rounded-full bg-yellow-500 mr-1" />
            <Text className="text-xs text-gray-600">Fat</Text>
          </View>
        </View>
      </View>

      {/* Detailed Macros */}
      <View className="px-4 py-2">
        {/* Protein */}
        <MacroRow
          label="Protein"
          value={`${perServing.protein}g`}
          percent={showDailyValues ? getDailyValuePercent(perServing.protein, DAILY_VALUES.protein) : undefined}
          color="blue"
        />

        {/* Carbs */}
        <MacroRow
          label="Total Carbohydrates"
          value={`${perServing.carbs}g`}
          percent={showDailyValues ? getDailyValuePercent(perServing.carbs, DAILY_VALUES.carbs) : undefined}
          color="green"
        />

        {/* Fiber */}
        {perServing.fiber !== undefined && (
          <MacroRow
            label="Dietary Fiber"
            value={`${perServing.fiber}g`}
            percent={showDailyValues ? getDailyValuePercent(perServing.fiber, DAILY_VALUES.fiber) : undefined}
            indent
          />
        )}

        {/* Fat */}
        <MacroRow
          label="Total Fat"
          value={`${perServing.fat}g`}
          percent={showDailyValues ? getDailyValuePercent(perServing.fat, DAILY_VALUES.fat) : undefined}
          color="yellow"
        />

        {/* Sodium */}
        {perServing.sodium !== undefined && (
          <MacroRow
            label="Sodium"
            value={`${perServing.sodium}mg`}
            percent={showDailyValues ? getDailyValuePercent(perServing.sodium, DAILY_VALUES.sodium) : undefined}
          />
        )}
      </View>

      {/* Daily Value Note */}
      {showDailyValues && (
        <View className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <Text className="text-xs text-gray-500">
            * Percent Daily Values are based on a 2,000 calorie diet.
          </Text>
        </View>
      )}
    </View>
  );
}

interface MacroRowProps {
  label: string;
  value: string;
  percent?: number;
  color?: 'blue' | 'green' | 'yellow' | 'gray';
  indent?: boolean;
}

function MacroRow({ label, value, percent, color = 'gray', indent }: MacroRowProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    gray: 'text-gray-600',
  };

  return (
    <View className={cn('flex-row justify-between py-2 border-b border-gray-100', indent && 'pl-4')}>
      <Text className={cn('text-gray-700', indent && 'text-gray-500')}>{label}</Text>
      <View className="flex-row items-center gap-3">
        <Text className={cn('font-semibold', colorClasses[color])}>{value}</Text>
        {percent !== undefined && (
          <Text className="text-gray-500 text-sm w-12 text-right">{percent}%</Text>
        )}
      </View>
    </View>
  );
}

// Utility function to calculate total nutrition from multiple meals
export function calculateTotalNutrition(
  meals: Array<{ nutrition: NutritionData; quantity?: number }>
): NutritionData {
  return meals.reduce(
    (acc, { nutrition, quantity = 1 }) => ({
      calories: acc.calories + nutrition.calories * quantity,
      protein: acc.protein + nutrition.protein * quantity,
      carbs: acc.carbs + nutrition.carbs * quantity,
      fat: acc.fat + nutrition.fat * quantity,
      fiber: (acc.fiber || 0) + (nutrition.fiber || 0) * quantity,
      sodium: (acc.sodium || 0) + (nutrition.sodium || 0) * quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sodium: 0 }
  );
}

// Utility function to get macro rating (for meal recommendations)
export function getMacroRating(nutrition: NutritionData): {
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  notes: string[];
} {
  const notes: string[] = [];
  let score = 0;

  // Check protein content (should be at least 20% of calories)
  const proteinCaloriePercent = (nutrition.protein * 4 / nutrition.calories) * 100;
  if (proteinCaloriePercent >= 25) {
    score += 2;
    notes.push('High protein content');
  } else if (proteinCaloriePercent >= 20) {
    score += 1;
  } else {
    notes.push('Low protein content');
  }

  // Check fiber content (aim for 5g+ per meal)
  if (nutrition.fiber && nutrition.fiber >= 5) {
    score += 1;
    notes.push('Good fiber content');
  }

  // Check sodium (should be under 800mg per meal)
  if (nutrition.sodium && nutrition.sodium > 1000) {
    score -= 1;
    notes.push('High sodium content');
  }

  // Check fat balance (should be under 35% of calories)
  const fatCaloriePercent = (nutrition.fat * 9 / nutrition.calories) * 100;
  if (fatCaloriePercent > 40) {
    score -= 1;
    notes.push('High fat content');
  }

  if (score >= 3) return { rating: 'excellent', notes };
  if (score >= 2) return { rating: 'good', notes };
  if (score >= 1) return { rating: 'fair', notes };
  return { rating: 'poor', notes };
}

// Mini version for lists/cards
export function NutritionMini({ nutrition }: { nutrition: NutritionData }) {
  return (
    <View className="flex-row items-center gap-2">
      <Text className="text-sm font-semibold text-gray-900">{nutrition.calories} cal</Text>
      <Text className="text-gray-300">|</Text>
      <Text className="text-xs text-gray-500">
        P:{nutrition.protein}g C:{nutrition.carbs}g F:{nutrition.fat}g
      </Text>
    </View>
  );
}

/**
 * Meals CRUD Service
 * 
 * Full CRUD operations for Nigerian meal database
 * Includes nutrition tracking, dietary tags, and meal categorization
 */

import { supabase } from './client';
import type { MuscleGroup, FitnessLevel } from './types';

// ==================== TYPES ====================

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DietaryTag = 'vegetarian' | 'vegan' | 'keto' | 'low_carb' | 'high_protein' | 'gluten_free' | 'dairy_free' | 'halal';
export type CalorieCategory = 'light' | 'standard' | 'high_energy';
export type MealRegion = 'yoruba' | 'igbo' | 'hausa' | 'general' | 'fusion';

export interface Meal {
  id: string;
  name: string;
  description: string | null;
  meal_type: MealType;
  calorie_category: CalorieCategory;
  region: MealRegion;
  
  // Nutrition
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams: number | null;
  sodium_mg: number | null;
  
  // Content
  ingredients: string[];
  instructions: string[];
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  
  // Media
  image_url: string | null;
  video_url: string | null;
  
  // Categorization
  dietary_tags: DietaryTag[];
  suitable_for_goals: string[]; // weight_loss, muscle_gain, maintenance
  
  // Status
  is_active: boolean;
  is_featured: boolean;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface MealInsert {
  id?: string;
  name: string;
  description?: string | null;
  meal_type: MealType;
  calorie_category?: CalorieCategory;
  region?: MealRegion;
  
  calories: number;
  protein_grams: number;
  carbs_grams: number;
  fat_grams: number;
  fiber_grams?: number | null;
  sodium_mg?: number | null;
  
  ingredients?: string[];
  instructions?: string[];
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  
  image_url?: string | null;
  video_url?: string | null;
  
  dietary_tags?: DietaryTag[];
  suitable_for_goals?: string[];
  
  is_active?: boolean;
  is_featured?: boolean;
}

export interface MealUpdate {
  name?: string;
  description?: string | null;
  meal_type?: MealType;
  calorie_category?: CalorieCategory;
  region?: MealRegion;
  
  calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fat_grams?: number;
  fiber_grams?: number | null;
  sodium_mg?: number | null;
  
  ingredients?: string[];
  instructions?: string[];
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings?: number;
  
  image_url?: string | null;
  video_url?: string | null;
  
  dietary_tags?: DietaryTag[];
  suitable_for_goals?: string[];
  
  is_active?: boolean;
  is_featured?: boolean;
  updated_at?: string;
}

export interface MealFilters {
  mealType?: MealType;
  calorieCategory?: CalorieCategory;
  region?: MealRegion;
  dietaryTags?: DietaryTag[];
  suitableFor?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  minCalories?: number;
  maxCalories?: number;
}

export interface MealListOptions {
  filters?: MealFilters;
  page?: number;
  pageSize?: number;
  orderBy?: keyof Meal;
  orderDirection?: 'asc' | 'desc';
}

export interface MealListResult {
  meals: Meal[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ==================== MEAL SERVICE ====================

export const mealService = {
  /**
   * List meals with filtering, pagination, and sorting
   */
  async list(options: MealListOptions = {}): Promise<MealListResult> {
    const {
      filters = {},
      page = 1,
      pageSize = 20,
      orderBy = 'name',
      orderDirection = 'asc',
    } = options;

    let query = supabase
      .from('meals')
      .select('*', { count: 'exact' }) as any;

    // Apply filters
    if (filters.mealType) {
      query = query.eq('meal_type', filters.mealType);
    }
    if (filters.calorieCategory) {
      query = query.eq('calorie_category', filters.calorieCategory);
    }
    if (filters.region) {
      query = query.eq('region', filters.region);
    }
    if (filters.dietaryTags && filters.dietaryTags.length > 0) {
      query = query.overlaps('dietary_tags', filters.dietaryTags);
    }
    if (filters.suitableFor) {
      query = query.contains('suitable_for_goals', [filters.suitableFor]);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    if (filters.minCalories !== undefined) {
      query = query.gte('calories', filters.minCalories);
    }
    if (filters.maxCalories !== undefined) {
      query = query.lte('calories', filters.maxCalories);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list meals: ${error.message}`);
    }

    return {
      meals: (data || []) as Meal[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Get a single meal by ID
   */
  async getById(id: string): Promise<Meal | null> {
    const { data, error } = await (supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get meal: ${error.message}`);
    }

    return data as Meal;
  },

  /**
   * Create a new meal
   */
  async create(meal: MealInsert): Promise<Meal> {
    const { data, error } = await (supabase
      .from('meals')
      .insert(meal as any)
      .select()
      .single() as any);

    if (error) {
      throw new Error(`Failed to create meal: ${error.message}`);
    }

    return data as Meal;
  },

  /**
   * Update an existing meal
   */
  async update(id: string, updates: MealUpdate): Promise<Meal> {
    const { data, error } = await (supabase
      .from('meals') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update meal: ${error.message}`);
    }

    return data as Meal;
  },

  /**
   * Soft delete a meal
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('meals') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete meal: ${error.message}`);
    }
  },

  /**
   * Hard delete a meal
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('meals')
      .delete()
      .eq('id', id) as any);

    if (error) {
      throw new Error(`Failed to permanently delete meal: ${error.message}`);
    }
  },

  /**
   * Restore a soft-deleted meal
   */
  async restore(id: string): Promise<Meal> {
    const { data, error } = await (supabase
      .from('meals') as any)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to restore meal: ${error.message}`);
    }

    return data as Meal;
  },

  /**
   * Get meals by type
   */
  async getByType(mealType: MealType): Promise<Meal[]> {
    const { data, error } = await (supabase
      .from('meals')
      .select('*')
      .eq('meal_type', mealType)
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get meals by type: ${error.message}`);
    }

    return (data || []) as Meal[];
  },

  /**
   * Get meals by calorie category
   */
  async getByCalorieCategory(category: CalorieCategory): Promise<Meal[]> {
    const { data, error } = await (supabase
      .from('meals')
      .select('*')
      .eq('calorie_category', category)
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get meals by calorie category: ${error.message}`);
    }

    return (data || []) as Meal[];
  },

  /**
   * Get meals by region
   */
  async getByRegion(region: MealRegion): Promise<Meal[]> {
    const { data, error } = await (supabase
      .from('meals')
      .select('*')
      .eq('region', region)
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get meals by region: ${error.message}`);
    }

    return (data || []) as Meal[];
  },

  /**
   * Get meals suitable for a specific goal
   */
  async getByGoal(goal: string): Promise<Meal[]> {
    const { data, error } = await (supabase
      .from('meals')
      .select('*')
      .contains('suitable_for_goals', [goal])
      .eq('is_active', true)
      .order('calories') as any);

    if (error) {
      throw new Error(`Failed to get meals by goal: ${error.message}`);
    }

    return (data || []) as Meal[];
  },

  /**
   * Get featured meals
   */
  async getFeatured(): Promise<Meal[]> {
    const { data, error } = await (supabase
      .from('meals')
      .select('*')
      .eq('is_featured', true)
      .eq('is_active', true)
      .order('name') as any);

    if (error) {
      throw new Error(`Failed to get featured meals: ${error.message}`);
    }

    return (data || []) as Meal[];
  },

  /**
   * Toggle featured status
   */
  async toggleFeatured(id: string): Promise<Meal> {
    const meal = await this.getById(id);
    if (!meal) {
      throw new Error('Meal not found');
    }

    return this.update(id, { is_featured: !meal.is_featured });
  },

  /**
   * Get meal stats for admin dashboard
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    featured: number;
    byType: Record<MealType, number>;
    byCategory: Record<CalorieCategory, number>;
    byRegion: Record<MealRegion, number>;
    averageCalories: number;
  }> {
    const { data, error } = await (supabase
      .from('meals')
      .select('id, is_active, is_featured, meal_type, calorie_category, region, calories') as any);

    if (error) {
      throw new Error(`Failed to get meal stats: ${error.message}`);
    }

    const meals = (data || []) as Array<{
      id: string;
      is_active: boolean;
      is_featured: boolean;
      meal_type: MealType;
      calorie_category: CalorieCategory;
      region: MealRegion;
      calories: number;
    }>;

    const total = meals.length;
    const active = meals.filter(m => m.is_active).length;
    const inactive = total - active;
    const featured = meals.filter(m => m.is_featured).length;

    const byType = meals.reduce((acc, m) => {
      acc[m.meal_type] = (acc[m.meal_type] || 0) + 1;
      return acc;
    }, {} as Record<MealType, number>);

    const byCategory = meals.reduce((acc, m) => {
      acc[m.calorie_category] = (acc[m.calorie_category] || 0) + 1;
      return acc;
    }, {} as Record<CalorieCategory, number>);

    const byRegion = meals.reduce((acc, m) => {
      acc[m.region] = (acc[m.region] || 0) + 1;
      return acc;
    }, {} as Record<MealRegion, number>);

    const totalCalories = meals.reduce((sum, m) => sum + m.calories, 0);
    const averageCalories = total > 0 ? Math.round(totalCalories / total) : 0;

    return { total, active, inactive, featured, byType, byCategory, byRegion, averageCalories };
  },

  /**
   * Duplicate a meal
   */
  async duplicate(id: string): Promise<Meal> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Meal not found');
    }

    const { id: _, created_at, updated_at, ...rest } = original;
    const duplicate: MealInsert = {
      ...rest,
      name: `${original.name} (Copy)`,
      is_featured: false,
    };

    return this.create(duplicate);
  },

  /**
   * Bulk update meals
   */
  async bulkUpdate(ids: string[], updates: MealUpdate): Promise<Meal[]> {
    const { data, error } = await (supabase
      .from('meals') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .in('id', ids)
      .select();

    if (error) {
      throw new Error(`Failed to bulk update meals: ${error.message}`);
    }

    return (data || []) as Meal[];
  },

  /**
   * Bulk soft delete meals
   */
  async bulkSoftDelete(ids: string[]): Promise<void> {
    const { error } = await (supabase
      .from('meals') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to bulk delete meals: ${error.message}`);
    }
  },

  /**
   * Calculate nutrition totals for a meal plan
   */
  calculateNutritionTotals(meals: Meal[]): {
    totalCalories: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalFiber: number;
  } {
    return meals.reduce(
      (acc, meal) => ({
        totalCalories: acc.totalCalories + meal.calories,
        totalProtein: acc.totalProtein + meal.protein_grams,
        totalCarbs: acc.totalCarbs + meal.carbs_grams,
        totalFat: acc.totalFat + meal.fat_grams,
        totalFiber: acc.totalFiber + (meal.fiber_grams || 0),
      }),
      { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, totalFiber: 0 }
    );
  },
};

// ==================== HELPER EXPORTS ====================

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const CALORIE_CATEGORY_LABELS: Record<CalorieCategory, string> = {
  light: 'Light (Weight Loss)',
  standard: 'Standard (Maintenance)',
  high_energy: 'High Energy (Muscle Gain)',
};

export const MEAL_REGION_LABELS: Record<MealRegion, string> = {
  yoruba: 'Yoruba',
  igbo: 'Igbo',
  hausa: 'Hausa',
  general: 'General Nigerian',
  fusion: 'Fusion',
};

export const DIETARY_TAG_LABELS: Record<DietaryTag, string> = {
  vegetarian: 'Vegetarian',
  vegan: 'Vegan',
  keto: 'Keto',
  low_carb: 'Low Carb',
  high_protein: 'High Protein',
  gluten_free: 'Gluten Free',
  dairy_free: 'Dairy Free',
  halal: 'Halal',
};

export const GOAL_LABELS: Record<string, string> = {
  weight_loss: 'Weight Loss',
  muscle_gain: 'Muscle Gain',
  maintenance: 'Maintenance',
  endurance: 'Endurance',
};

export const MEAL_TYPE_COLORS: Record<MealType, { bg: string; text: string }> = {
  breakfast: { bg: 'bg-amber-100', text: 'text-amber-800' },
  lunch: { bg: 'bg-green-100', text: 'text-green-800' },
  dinner: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  snack: { bg: 'bg-pink-100', text: 'text-pink-800' },
};

export const CALORIE_CATEGORY_COLORS: Record<CalorieCategory, { bg: string; text: string }> = {
  light: { bg: 'bg-teal-100', text: 'text-teal-800' },
  standard: { bg: 'bg-blue-100', text: 'text-blue-800' },
  high_energy: { bg: 'bg-orange-100', text: 'text-orange-800' },
};

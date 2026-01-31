/**
 * Fasting Protocols CRUD Service
 * 
 * Full CRUD operations for fasting protocols
 * Includes 12:12, 14:10, 16:8, 18:6 intermittent fasting schedules
 * With personalization rules based on user profiles
 */

import { supabase } from './client';
import type { FitnessLevel } from './types';

// ==================== TYPES ====================

export type FastingProtocol = '12:12' | '14:10' | '16:8' | '18:6' | '20:4' | 'omad';
export type FastingDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface FastingPlan {
  id: string;
  name: string;
  protocol: FastingProtocol;
  description: string | null;
  
  // Timing
  fasting_hours: number;
  eating_hours: number;
  recommended_start_time: string; // HH:MM format
  recommended_end_time: string;
  
  // Targeting
  difficulty: FastingDifficulty;
  suitable_for_goals: string[]; // weight_loss, muscle_gain, maintenance
  suitable_for_fitness_levels: FitnessLevel[];
  minimum_experience_days: number; // Days of fasting experience required
  
  // Content
  benefits: string[];
  tips: string[];
  warnings: string[];
  
  // Customization rules
  allow_coffee_during_fast: boolean;
  allow_water_additives: boolean;
  recommended_breaking_foods: string[];
  
  // Status
  is_active: boolean;
  is_default: boolean; // Default plan for new users
  display_order: number;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface FastingPlanInsert {
  id?: string;
  name: string;
  protocol: FastingProtocol;
  description?: string | null;
  
  fasting_hours: number;
  eating_hours: number;
  recommended_start_time?: string;
  recommended_end_time?: string;
  
  difficulty?: FastingDifficulty;
  suitable_for_goals?: string[];
  suitable_for_fitness_levels?: FitnessLevel[];
  minimum_experience_days?: number;
  
  benefits?: string[];
  tips?: string[];
  warnings?: string[];
  
  allow_coffee_during_fast?: boolean;
  allow_water_additives?: boolean;
  recommended_breaking_foods?: string[];
  
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
}

export interface FastingPlanUpdate {
  name?: string;
  protocol?: FastingProtocol;
  description?: string | null;
  
  fasting_hours?: number;
  eating_hours?: number;
  recommended_start_time?: string;
  recommended_end_time?: string;
  
  difficulty?: FastingDifficulty;
  suitable_for_goals?: string[];
  suitable_for_fitness_levels?: FitnessLevel[];
  minimum_experience_days?: number;
  
  benefits?: string[];
  tips?: string[];
  warnings?: string[];
  
  allow_coffee_during_fast?: boolean;
  allow_water_additives?: boolean;
  recommended_breaking_foods?: string[];
  
  is_active?: boolean;
  is_default?: boolean;
  display_order?: number;
  updated_at?: string;
}

export interface FastingFilters {
  protocol?: FastingProtocol;
  difficulty?: FastingDifficulty;
  suitableForGoal?: string;
  suitableForFitnessLevel?: FitnessLevel;
  isActive?: boolean;
  search?: string;
}

export interface FastingListOptions {
  filters?: FastingFilters;
  page?: number;
  pageSize?: number;
  orderBy?: keyof FastingPlan;
  orderDirection?: 'asc' | 'desc';
}

export interface FastingListResult {
  plans: FastingPlan[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Personalization rule for auto-assigning fasting plans
export interface FastingPersonalizationRule {
  id: string;
  name: string;
  description: string | null;
  
  // Conditions
  target_goals: string[];
  target_fitness_levels: FitnessLevel[];
  min_fasting_experience_days: number;
  max_fasting_experience_days: number | null;
  
  // Result
  assigned_fasting_plan_id: string;
  priority: number; // Higher = evaluated first
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ==================== FASTING SERVICE ====================

export const fastingService = {
  /**
   * List fasting plans with filtering, pagination, and sorting
   */
  async list(options: FastingListOptions = {}): Promise<FastingListResult> {
    const {
      filters = {},
      page = 1,
      pageSize = 20,
      orderBy = 'display_order',
      orderDirection = 'asc',
    } = options;

    let query = supabase
      .from('fasting_plans')
      .select('*', { count: 'exact' }) as any;

    // Apply filters
    if (filters.protocol) {
      query = query.eq('protocol', filters.protocol);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.suitableForGoal) {
      query = query.contains('suitable_for_goals', [filters.suitableForGoal]);
    }
    if (filters.suitableForFitnessLevel) {
      query = query.contains('suitable_for_fitness_levels', [filters.suitableForFitnessLevel]);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Apply ordering
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Failed to list fasting plans: ${error.message}`);
    }

    return {
      plans: (data || []) as FastingPlan[],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  },

  /**
   * Get a single fasting plan by ID
   */
  async getById(id: string): Promise<FastingPlan | null> {
    const { data, error } = await (supabase
      .from('fasting_plans')
      .select('*')
      .eq('id', id)
      .single() as any);

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get fasting plan: ${error.message}`);
    }

    return data as FastingPlan;
  },

  /**
   * Get the default fasting plan
   */
  async getDefault(): Promise<FastingPlan | null> {
    const { data, error } = await (supabase
      .from('fasting_plans')
      .select('*')
      .eq('is_default', true)
      .eq('is_active', true)
      .single() as any);

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to get default fasting plan: ${error.message}`);
    }

    return data as FastingPlan;
  },

  /**
   * Create a new fasting plan
   */
  async create(plan: FastingPlanInsert): Promise<FastingPlan> {
    // If this is being set as default, unset other defaults first
    if (plan.is_default) {
      await (supabase
        .from('fasting_plans') as any)
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await (supabase
      .from('fasting_plans')
      .insert(plan as any)
      .select()
      .single() as any);

    if (error) {
      throw new Error(`Failed to create fasting plan: ${error.message}`);
    }

    return data as FastingPlan;
  },

  /**
   * Update an existing fasting plan
   */
  async update(id: string, updates: FastingPlanUpdate): Promise<FastingPlan> {
    // If this is being set as default, unset other defaults first
    if (updates.is_default) {
      await (supabase
        .from('fasting_plans') as any)
        .update({ is_default: false })
        .neq('id', id);
    }

    const { data, error } = await (supabase
      .from('fasting_plans') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update fasting plan: ${error.message}`);
    }

    return data as FastingPlan;
  },

  /**
   * Soft delete a fasting plan
   */
  async softDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('fasting_plans') as any)
      .update({ is_active: false, is_default: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete fasting plan: ${error.message}`);
    }
  },

  /**
   * Hard delete a fasting plan
   */
  async hardDelete(id: string): Promise<void> {
    const { error } = await (supabase
      .from('fasting_plans')
      .delete()
      .eq('id', id) as any);

    if (error) {
      throw new Error(`Failed to permanently delete fasting plan: ${error.message}`);
    }
  },

  /**
   * Restore a soft-deleted fasting plan
   */
  async restore(id: string): Promise<FastingPlan> {
    const { data, error } = await (supabase
      .from('fasting_plans') as any)
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to restore fasting plan: ${error.message}`);
    }

    return data as FastingPlan;
  },

  /**
   * Set a plan as the default
   */
  async setDefault(id: string): Promise<FastingPlan> {
    // Unset current default
    await (supabase
      .from('fasting_plans') as any)
      .update({ is_default: false })
      .eq('is_default', true);

    // Set new default
    return this.update(id, { is_default: true });
  },

  /**
   * Get plans by difficulty
   */
  async getByDifficulty(difficulty: FastingDifficulty): Promise<FastingPlan[]> {
    const { data, error } = await (supabase
      .from('fasting_plans')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('display_order') as any);

    if (error) {
      throw new Error(`Failed to get fasting plans by difficulty: ${error.message}`);
    }

    return (data || []) as FastingPlan[];
  },

  /**
   * Get plans suitable for a user's goal
   */
  async getByGoal(goal: string): Promise<FastingPlan[]> {
    const { data, error } = await (supabase
      .from('fasting_plans')
      .select('*')
      .contains('suitable_for_goals', [goal])
      .eq('is_active', true)
      .order('display_order') as any);

    if (error) {
      throw new Error(`Failed to get fasting plans by goal: ${error.message}`);
    }

    return (data || []) as FastingPlan[];
  },

  /**
   * Get recommended plan for a user based on their profile
   */
  async getRecommendedPlan(
    goal: string,
    fitnessLevel: FitnessLevel,
    fastingExperienceDays: number
  ): Promise<FastingPlan | null> {
    // Get all active plans suitable for this goal and fitness level
    const { data, error } = await (supabase
      .from('fasting_plans')
      .select('*')
      .contains('suitable_for_goals', [goal])
      .contains('suitable_for_fitness_levels', [fitnessLevel])
      .lte('minimum_experience_days', fastingExperienceDays)
      .eq('is_active', true)
      .order('fasting_hours', { ascending: true }) as any);

    if (error) {
      throw new Error(`Failed to get recommended plan: ${error.message}`);
    }

    const plans = (data || []) as FastingPlan[];
    
    // Return the most appropriate plan (hardest they can handle)
    // Plans are ordered by fasting_hours ascending, so we want the last suitable one
    if (plans.length === 0) {
      return this.getDefault();
    }

    // Find the hardest plan they qualify for
    let recommended = plans[0];
    for (const plan of plans) {
      if (plan.minimum_experience_days <= fastingExperienceDays) {
        recommended = plan;
      }
    }

    return recommended;
  },

  /**
   * Reorder fasting plans
   */
  async reorder(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) => ({
      id,
      display_order: index,
    }));

    for (const update of updates) {
      await (supabase
        .from('fasting_plans') as any)
        .update({ display_order: update.display_order })
        .eq('id', update.id);
    }
  },

  /**
   * Get fasting plan stats for admin dashboard
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byDifficulty: Record<FastingDifficulty, number>;
    byProtocol: Record<FastingProtocol, number>;
  }> {
    const { data, error } = await (supabase
      .from('fasting_plans')
      .select('id, is_active, difficulty, protocol') as any);

    if (error) {
      throw new Error(`Failed to get fasting plan stats: ${error.message}`);
    }

    const plans = (data || []) as Array<{
      id: string;
      is_active: boolean;
      difficulty: FastingDifficulty;
      protocol: FastingProtocol;
    }>;

    const total = plans.length;
    const active = plans.filter(p => p.is_active).length;
    const inactive = total - active;

    const byDifficulty = plans.reduce((acc, p) => {
      acc[p.difficulty] = (acc[p.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<FastingDifficulty, number>);

    const byProtocol = plans.reduce((acc, p) => {
      acc[p.protocol] = (acc[p.protocol] || 0) + 1;
      return acc;
    }, {} as Record<FastingProtocol, number>);

    return { total, active, inactive, byDifficulty, byProtocol };
  },

  /**
   * Duplicate a fasting plan
   */
  async duplicate(id: string): Promise<FastingPlan> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Fasting plan not found');
    }

    const { id: _, created_at, updated_at, ...rest } = original;
    const duplicate: FastingPlanInsert = {
      ...rest,
      name: `${original.name} (Copy)`,
      is_default: false,
    };

    return this.create(duplicate);
  },

  /**
   * Calculate eating window for a protocol
   */
  calculateEatingWindow(
    protocol: FastingProtocol,
    fastingStartTime: string // HH:MM
  ): { startTime: string; endTime: string } {
    const protocolHours: Record<FastingProtocol, { fasting: number; eating: number }> = {
      '12:12': { fasting: 12, eating: 12 },
      '14:10': { fasting: 14, eating: 10 },
      '16:8': { fasting: 16, eating: 8 },
      '18:6': { fasting: 18, eating: 6 },
      '20:4': { fasting: 20, eating: 4 },
      'omad': { fasting: 23, eating: 1 },
    };

    const { fasting, eating } = protocolHours[protocol];
    
    // Parse start time
    const [startHour, startMinute] = fastingStartTime.split(':').map(Number);
    
    // Calculate eating window start (end of fasting)
    let eatingStartHour = (startHour + fasting) % 24;
    
    // Calculate eating window end
    let eatingEndHour = (eatingStartHour + eating) % 24;

    const formatTime = (hour: number, minute: number) =>
      `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    return {
      startTime: formatTime(eatingStartHour, startMinute),
      endTime: formatTime(eatingEndHour, startMinute),
    };
  },
};

// ==================== HELPER EXPORTS ====================

export const FASTING_PROTOCOL_LABELS: Record<FastingProtocol, string> = {
  '12:12': '12:12 (Beginner)',
  '14:10': '14:10 (Easy)',
  '16:8': '16:8 (Standard)',
  '18:6': '18:6 (Advanced)',
  '20:4': '20:4 (Warrior)',
  'omad': 'OMAD (One Meal a Day)',
};

export const FASTING_PROTOCOL_DESCRIPTIONS: Record<FastingProtocol, string> = {
  '12:12': 'Fast for 12 hours, eat within 12 hours. Great for beginners.',
  '14:10': 'Fast for 14 hours, eat within 10 hours. Easy transition.',
  '16:8': 'Fast for 16 hours, eat within 8 hours. Most popular protocol.',
  '18:6': 'Fast for 18 hours, eat within 6 hours. More challenging.',
  '20:4': 'Fast for 20 hours, eat within 4 hours. Warrior diet style.',
  'omad': 'One meal a day. 23 hours fasting, 1 hour eating window.',
};

export const FASTING_DIFFICULTY_LABELS: Record<FastingDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
};

export const FASTING_PROTOCOL_COLORS: Record<FastingProtocol, { bg: string; text: string }> = {
  '12:12': { bg: 'bg-green-100', text: 'text-green-800' },
  '14:10': { bg: 'bg-teal-100', text: 'text-teal-800' },
  '16:8': { bg: 'bg-blue-100', text: 'text-blue-800' },
  '18:6': { bg: 'bg-purple-100', text: 'text-purple-800' },
  '20:4': { bg: 'bg-orange-100', text: 'text-orange-800' },
  'omad': { bg: 'bg-red-100', text: 'text-red-800' },
};

export const FASTING_DIFFICULTY_COLORS: Record<FastingDifficulty, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-800' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  advanced: { bg: 'bg-red-100', text: 'text-red-800' },
};

// Default fasting plans to seed the database
export const DEFAULT_FASTING_PLANS: FastingPlanInsert[] = [
  {
    name: 'Gentle Start',
    protocol: '12:12',
    description: 'Perfect for fasting beginners. Equal time fasting and eating.',
    fasting_hours: 12,
    eating_hours: 12,
    recommended_start_time: '20:00',
    recommended_end_time: '08:00',
    difficulty: 'beginner',
    suitable_for_goals: ['weight_loss', 'maintenance'],
    suitable_for_fitness_levels: ['beginner', 'intermediate', 'advanced'],
    minimum_experience_days: 0,
    benefits: [
      'Easy to follow',
      'No significant lifestyle changes needed',
      'Helps establish fasting habit',
      'Improves sleep quality',
    ],
    tips: [
      'Stop eating after dinner',
      'Drink water in the morning before eating',
      'Include breakfast in your eating window',
    ],
    warnings: [],
    allow_coffee_during_fast: true,
    allow_water_additives: true,
    recommended_breaking_foods: ['Eggs', 'Fruits', 'Oatmeal'],
    is_active: true,
    is_default: true,
    display_order: 0,
  },
  {
    name: 'Standard Intermittent',
    protocol: '16:8',
    description: 'The most popular fasting protocol. Skip breakfast, eat lunch and dinner.',
    fasting_hours: 16,
    eating_hours: 8,
    recommended_start_time: '20:00',
    recommended_end_time: '12:00',
    difficulty: 'intermediate',
    suitable_for_goals: ['weight_loss', 'muscle_gain', 'maintenance'],
    suitable_for_fitness_levels: ['intermediate', 'advanced'],
    minimum_experience_days: 14,
    benefits: [
      'Significant fat burning',
      'Improved insulin sensitivity',
      'Increased mental clarity',
      'Autophagy activation',
    ],
    tips: [
      'Black coffee can help with morning hunger',
      'Break fast with protein',
      'Eat nutrient-dense meals',
    ],
    warnings: [
      'May feel hungry first few days',
      'Not recommended for pregnant women',
    ],
    allow_coffee_during_fast: true,
    allow_water_additives: false,
    recommended_breaking_foods: ['Chicken', 'Fish', 'Vegetables', 'Rice'],
    is_active: true,
    is_default: false,
    display_order: 1,
  },
  {
    name: 'Extended Fast',
    protocol: '18:6',
    description: 'For experienced fasters. Two meals within a 6-hour window.',
    fasting_hours: 18,
    eating_hours: 6,
    recommended_start_time: '19:00',
    recommended_end_time: '13:00',
    difficulty: 'advanced',
    suitable_for_goals: ['weight_loss'],
    suitable_for_fitness_levels: ['advanced'],
    minimum_experience_days: 30,
    benefits: [
      'Maximum fat burning',
      'Deep autophagy',
      'Simplified eating schedule',
      'Strong metabolic benefits',
    ],
    tips: [
      'Stay hydrated',
      'Plan your two meals carefully',
      'Include all macros in each meal',
    ],
    warnings: [
      'Requires fasting experience',
      'May affect workout performance',
      'Monitor energy levels',
    ],
    allow_coffee_during_fast: true,
    allow_water_additives: false,
    recommended_breaking_foods: ['Bone broth', 'Avocado', 'Eggs', 'Leafy greens'],
    is_active: true,
    is_default: false,
    display_order: 2,
  },
];

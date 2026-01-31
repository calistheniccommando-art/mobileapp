/**
 * Supabase Database Service
 *
 * Provides typed CRUD operations for all database tables.
 * Uses the Supabase client for data access.
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  User,
  UserInsert,
  UserUpdate,
  UserOnboarding,
  UserOnboardingInsert,
  UserOnboardingUpdate,
  UserPlan,
  UserPlanInsert,
  UserPlanUpdate,
  Exercise,
  ExerciseInsert,
  ExerciseUpdate,
  WorkoutTemplate,
  WorkoutTemplateInsert,
  WorkoutTemplateUpdate,
  Meal,
  MealInsert,
  MealUpdate,
  UserDailyProgress,
  UserDailyProgressInsert,
  UserDailyProgressUpdate,
  Subscription,
  SubscriptionInsert,
  SubscriptionUpdate,
  AuditLogInsert,
  FitnessLevel,
  MealIntensity,
  MealType,
} from './types';

// ==================== ERROR HANDLING ====================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

function handleError(error: unknown, operation: string): never {
  if (error && typeof error === 'object' && 'message' in error) {
    throw new DatabaseError(
      `${operation} failed: ${(error as { message: string }).message}`,
      (error as { code?: string }).code,
      error
    );
  }
  throw new DatabaseError(`${operation} failed: Unknown error`, undefined, error);
}

// ==================== USER SERVICE ====================

export const userService = {
  async getById(id: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') handleError(error, 'getUser');
    return data;
  },

  async getByEmail(email: string): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') handleError(error, 'getUserByEmail');
    return data;
  },

  async create(user: UserInsert): Promise<User> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('users')
      .insert(user as any)
      .select()
      .single();

    if (error) handleError(error, 'createUser');
    return data!;
  },

  async update(id: string, updates: UserUpdate): Promise<User> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('users') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'updateUser');
    return data!;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) handleError(error, 'deleteUser');
  },
};

// ==================== ONBOARDING SERVICE ====================

export const onboardingService = {
  async getByUserId(userId: string): Promise<UserOnboarding | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('user_onboarding')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') handleError(error, 'getOnboarding');
    return data;
  },

  async create(onboarding: UserOnboardingInsert): Promise<UserOnboarding> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('user_onboarding')
      .insert(onboarding as any)
      .select()
      .single();

    if (error) handleError(error, 'createOnboarding');
    return data!;
  },

  async update(
    userId: string,
    updates: UserOnboardingUpdate
  ): Promise<UserOnboarding> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('user_onboarding') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) handleError(error, 'updateOnboarding');
    return data!;
  },
};

// ==================== PLAN SERVICE ====================

export const planService = {
  async getActiveByUserId(userId: string): Promise<UserPlan | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') handleError(error, 'getActivePlan');
    return data;
  },

  async getAllByUserId(userId: string): Promise<UserPlan[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('user_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) handleError(error, 'getAllPlans');
    return data || [];
  },

  async create(plan: UserPlanInsert): Promise<UserPlan> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    // Deactivate any existing active plans for this user
    await (supabase
      .from('user_plans') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', plan.user_id)
      .eq('is_active', true);

    const { data, error } = await (supabase
      .from('user_plans') as any)
      .insert({ ...plan, is_active: true })
      .select()
      .single();

    if (error) handleError(error, 'createPlan');
    return data!;
  },

  async update(id: string, updates: UserPlanUpdate): Promise<UserPlan> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('user_plans') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'updatePlan');
    return data!;
  },
};

// ==================== EXERCISE SERVICE ====================

export const exerciseService = {
  async getAll(activeOnly = true): Promise<Exercise[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('exercises').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name');

    if (error) handleError(error, 'getAllExercises');
    return data || [];
  },

  async getById(id: string): Promise<Exercise | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') handleError(error, 'getExercise');
    return data;
  },

  async getByDifficulty(difficulty: FitnessLevel): Promise<Exercise[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('name');

    if (error) handleError(error, 'getExercisesByDifficulty');
    return data || [];
  },

  async getByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .contains('muscle_groups', [muscleGroup])
      .eq('is_active', true)
      .order('name');

    if (error) handleError(error, 'getExercisesByMuscleGroup');
    return data || [];
  },

  async create(exercise: ExerciseInsert): Promise<Exercise> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('exercises') as any)
      .insert(exercise)
      .select()
      .single();

    if (error) handleError(error, 'createExercise');
    return data!;
  },

  async update(id: string, updates: ExerciseUpdate): Promise<Exercise> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('exercises') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'updateExercise');
    return data!;
  },

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    // Soft delete by marking as inactive
    const { error } = await (supabase
      .from('exercises') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) handleError(error, 'deleteExercise');
  },
};

// ==================== WORKOUT TEMPLATE SERVICE ====================

export const workoutTemplateService = {
  async getAll(activeOnly = true): Promise<WorkoutTemplate[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('workout_templates').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name');

    if (error) handleError(error, 'getAllWorkoutTemplates');
    return data || [];
  },

  async getById(id: string): Promise<WorkoutTemplate | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116')
      handleError(error, 'getWorkoutTemplate');
    return data;
  },

  async getByDifficulty(difficulty: FitnessLevel): Promise<WorkoutTemplate[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('difficulty', difficulty)
      .eq('is_active', true)
      .order('name');

    if (error) handleError(error, 'getWorkoutTemplatesByDifficulty');
    return data || [];
  },

  async create(template: WorkoutTemplateInsert): Promise<WorkoutTemplate> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('workout_templates') as any)
      .insert(template)
      .select()
      .single();

    if (error) handleError(error, 'createWorkoutTemplate');
    return data!;
  },

  async update(
    id: string,
    updates: WorkoutTemplateUpdate
  ): Promise<WorkoutTemplate> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('workout_templates') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'updateWorkoutTemplate');
    return data!;
  },
};

// ==================== MEAL SERVICE ====================

export const mealService = {
  async getAll(activeOnly = true): Promise<Meal[]> {
    if (!isSupabaseConfigured()) return [];

    let query = supabase.from('meals').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query.order('name');

    if (error) handleError(error, 'getAllMeals');
    return data || [];
  },

  async getById(id: string): Promise<Meal | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') handleError(error, 'getMeal');
    return data;
  },

  async getByIntensity(intensity: MealIntensity): Promise<Meal[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('intensity', intensity)
      .eq('is_active', true)
      .order('name');

    if (error) handleError(error, 'getMealsByIntensity');
    return data || [];
  },

  async getByType(mealType: MealType): Promise<Meal[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('meal_type', mealType)
      .eq('is_active', true)
      .order('name');

    if (error) handleError(error, 'getMealsByType');
    return data || [];
  },

  async create(meal: MealInsert): Promise<Meal> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('meals') as any)
      .insert(meal)
      .select()
      .single();

    if (error) handleError(error, 'createMeal');
    return data!;
  },

  async update(id: string, updates: MealUpdate): Promise<Meal> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('meals') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'updateMeal');
    return data!;
  },
};

// ==================== DAILY PROGRESS SERVICE ====================

export const dailyProgressService = {
  async getByDate(
    userId: string,
    date: string
  ): Promise<UserDailyProgress | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('user_daily_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116')
      handleError(error, 'getDailyProgress');
    return data;
  },

  async getRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<UserDailyProgress[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('user_daily_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) handleError(error, 'getDailyProgressRange');
    return data || [];
  },

  async createOrUpdate(
    progress: UserDailyProgressInsert
  ): Promise<UserDailyProgress> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('user_daily_progress') as any)
      .upsert(
        { ...progress, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) handleError(error, 'upsertDailyProgress');
    return data!;
  },

  async markWorkoutComplete(
    userId: string,
    date: string,
    workoutTemplateId: string,
    exercisesCompleted: string[],
    durationMinutes: number
  ): Promise<UserDailyProgress> {
    return this.createOrUpdate({
      user_id: userId,
      date,
      workout_completed: true,
      workout_template_id: workoutTemplateId,
      exercises_completed: exercisesCompleted,
      workout_duration_minutes: durationMinutes,
    });
  },

  async markMealComplete(
    userId: string,
    date: string,
    mealId: string
  ): Promise<UserDailyProgress> {
    const existing = await this.getByDate(userId, date);
    const mealsCompleted = existing?.meals_completed || [];

    if (!mealsCompleted.includes(mealId)) {
      mealsCompleted.push(mealId);
    }

    return this.createOrUpdate({
      user_id: userId,
      date,
      meals_completed: mealsCompleted,
    });
  },

  async updateFasting(
    userId: string,
    date: string,
    fastingStart: string | null,
    fastingEnd: string | null,
    completed: boolean
  ): Promise<UserDailyProgress> {
    return this.createOrUpdate({
      user_id: userId,
      date,
      fasting_start_time: fastingStart,
      fasting_end_time: fastingEnd,
      fasting_completed: completed,
    });
  },
};

// ==================== SUBSCRIPTION SERVICE ====================

export const subscriptionService = {
  async getActiveByUserId(userId: string): Promise<Subscription | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116')
      handleError(error, 'getActiveSubscription');
    return data;
  },

  async create(subscription: SubscriptionInsert): Promise<Subscription> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('subscriptions') as any)
      .insert(subscription)
      .select()
      .single();

    if (error) handleError(error, 'createSubscription');
    return data!;
  },

  async update(id: string, updates: SubscriptionUpdate): Promise<Subscription> {
    if (!isSupabaseConfigured()) {
      throw new DatabaseError('Supabase not configured');
    }

    const { data, error } = await (supabase
      .from('subscriptions') as any)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) handleError(error, 'updateSubscription');
    return data!;
  },

  async cancel(id: string): Promise<Subscription> {
    return this.update(id, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    });
  },
};

// ==================== AUDIT LOG SERVICE ====================

export const auditLogService = {
  async log(entry: AuditLogInsert): Promise<void> {
    if (!isSupabaseConfigured()) return;

    const { error } = await (supabase.from('audit_log') as any).insert(entry);

    if (error) {
      console.error('Failed to write audit log:', error);
      // Don't throw - audit logging failures shouldn't break the app
    }
  },

  async logAction(
    userId: string | null,
    action: string,
    entityType: string,
    entityId?: string,
    oldData?: unknown,
    newData?: unknown
  ): Promise<void> {
    await this.log({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_data: oldData as any,
      new_data: newData as any,
    });
  },
};

// ==================== EXPORT ALL SERVICES ====================

export const db = {
  users: userService,
  onboarding: onboardingService,
  plans: planService,
  exercises: exerciseService,
  workoutTemplates: workoutTemplateService,
  meals: mealService,
  dailyProgress: dailyProgressService,
  subscriptions: subscriptionService,
  auditLog: auditLogService,
};

export default db;

/**
 * DATABASE SERVICE LAYER
 *
 * Abstract database operations for the fitness app.
 * This layer provides:
 * - CRUD operations for all entities
 * - Query filtering and pagination
 * - Offline caching support
 * - Future-ready for Firebase/Supabase migration
 *
 * Currently uses mock data, but API is designed for real database integration.
 */

import type {
  DBUserProfile,
  DBExercise,
  DBWorkoutPlan,
  DBMeal,
  DBMealPlan,
  DBFastingPlan,
  DBDailyPlan,
  DBWorkoutProgress,
  DBFastingProgress,
  DBVideo,
  DBPdfTemplate,
  DBPersonalizationRule,
  DifficultyLevel,
  MealCategory,
  MealType,
  WorkType,
  FastingPattern,
  ContentStatus,
} from '@/types/database';

// ==================== TYPES ====================

/** Generic query options */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/** Generic query result with pagination */
export interface QueryResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

/** Filter operators */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';

/** Generic filter */
export interface Filter {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

// ==================== UTILITY FUNCTIONS ====================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const now = (): string => new Date().toISOString();

/** Apply filters to an array of items */
function applyFilters<T extends Record<string, unknown>>(items: T[], filters: Filter[]): T[] {
  return items.filter((item) => {
    return filters.every((filter) => {
      const value = item[filter.field];
      switch (filter.operator) {
        case 'eq':
          return value === filter.value;
        case 'neq':
          return value !== filter.value;
        case 'gt':
          return typeof value === 'number' && value > (filter.value as number);
        case 'gte':
          return typeof value === 'number' && value >= (filter.value as number);
        case 'lt':
          return typeof value === 'number' && value < (filter.value as number);
        case 'lte':
          return typeof value === 'number' && value <= (filter.value as number);
        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(value);
        case 'contains':
          return (
            typeof value === 'string' &&
            typeof filter.value === 'string' &&
            value.toLowerCase().includes(filter.value.toLowerCase())
          );
        default:
          return true;
      }
    });
  });
}

/** Apply sorting and pagination */
function applyQueryOptions<T extends Record<string, unknown>>(
  items: T[],
  options: QueryOptions
): QueryResult<T> {
  let result = [...items];

  // Sort
  if (options.orderBy) {
    const direction = options.orderDirection === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const aVal = a[options.orderBy!];
      const bVal = b[options.orderBy!];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * direction;
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * direction;
      }
      return 0;
    });
  }

  const total = result.length;

  // Paginate
  const offset = options.offset ?? 0;
  const limit = options.limit ?? result.length;
  result = result.slice(offset, offset + limit);

  return {
    data: result,
    total,
    hasMore: offset + result.length < total,
  };
}

// ==================== EXERCISE SERVICE ====================

export interface ExerciseFilters {
  difficulty?: DifficultyLevel;
  type?: string;
  muscleGroups?: string[];
  status?: ContentStatus;
  search?: string;
}

export const ExerciseService = {
  /** Get all exercises with optional filtering */
  async getAll(
    filters?: ExerciseFilters,
    options?: QueryOptions
  ): Promise<QueryResult<DBExercise>> {
    // In real implementation, this would query the database
    // For now, return empty result (to be populated with mock data)
    const items: DBExercise[] = [];

    let filtered = items;
    if (filters) {
      const filterList: Filter[] = [];
      if (filters.difficulty) {
        filterList.push({ field: 'difficulty', operator: 'eq', value: filters.difficulty });
      }
      if (filters.type) {
        filterList.push({ field: 'type', operator: 'eq', value: filters.type });
      }
      if (filters.status) {
        filterList.push({ field: 'status', operator: 'eq', value: filters.status });
      }
      if (filters.search) {
        filtered = filtered.filter(
          (e) =>
            e.name.toLowerCase().includes(filters.search!.toLowerCase()) ||
            e.description.toLowerCase().includes(filters.search!.toLowerCase())
        );
      }
      if (filters.muscleGroups?.length) {
        filtered = filtered.filter((e) =>
          e.muscleGroups.some((mg) => filters.muscleGroups!.includes(mg))
        );
      }
      filtered = applyFilters(filtered as unknown as Record<string, unknown>[], filterList) as unknown as DBExercise[];
    }

    return applyQueryOptions(filtered as unknown as Record<string, unknown>[], options ?? {}) as unknown as QueryResult<DBExercise>;
  },

  /** Get exercise by ID */
  async getById(exerciseId: string): Promise<DBExercise | null> {
    const result = await this.getAll();
    return result.data.find((e) => e.exerciseId === exerciseId) ?? null;
  },

  /** Create a new exercise */
  async create(data: Omit<DBExercise, 'exerciseId' | 'createdAt' | 'updatedAt'>): Promise<DBExercise> {
    const exercise: DBExercise = {
      ...data,
      exerciseId: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    // In real implementation, save to database
    return exercise;
  },

  /** Update an exercise */
  async update(exerciseId: string, data: Partial<DBExercise>): Promise<DBExercise | null> {
    const exercise = await this.getById(exerciseId);
    if (!exercise) return null;
    const updated: DBExercise = {
      ...exercise,
      ...data,
      exerciseId, // Preserve ID
      updatedAt: now(),
    };
    // In real implementation, save to database
    return updated;
  },

  /** Delete an exercise */
  async delete(exerciseId: string): Promise<boolean> {
    // In real implementation, delete from database
    return true;
  },
};

// ==================== WORKOUT PLAN SERVICE ====================

export interface WorkoutPlanFilters {
  difficulty?: DifficultyLevel;
  dayNumber?: number;
  status?: ContentStatus;
  search?: string;
}

export const WorkoutPlanService = {
  async getAll(
    filters?: WorkoutPlanFilters,
    options?: QueryOptions
  ): Promise<QueryResult<DBWorkoutPlan>> {
    const items: DBWorkoutPlan[] = [];

    let filtered = items;
    if (filters) {
      const filterList: Filter[] = [];
      if (filters.difficulty) {
        filterList.push({ field: 'difficulty', operator: 'eq', value: filters.difficulty });
      }
      if (filters.dayNumber) {
        filterList.push({ field: 'dayNumber', operator: 'eq', value: filters.dayNumber });
      }
      if (filters.status) {
        filterList.push({ field: 'status', operator: 'eq', value: filters.status });
      }
      filtered = applyFilters(filtered as unknown as Record<string, unknown>[], filterList) as unknown as DBWorkoutPlan[];
    }

    return applyQueryOptions(filtered as unknown as Record<string, unknown>[], options ?? {}) as unknown as QueryResult<DBWorkoutPlan>;
  },

  async getById(planId: string): Promise<DBWorkoutPlan | null> {
    const result = await this.getAll();
    return result.data.find((p) => p.planId === planId) ?? null;
  },

  async getForDay(dayNumber: number, difficulty: DifficultyLevel): Promise<DBWorkoutPlan | null> {
    const result = await this.getAll({ dayNumber, difficulty });
    return result.data[0] ?? null;
  },

  async create(data: Omit<DBWorkoutPlan, 'planId' | 'createdAt' | 'updatedAt'>): Promise<DBWorkoutPlan> {
    const plan: DBWorkoutPlan = {
      ...data,
      planId: generateId(),
      createdAt: now(),
      updatedAt: now(),
    };
    return plan;
  },

  async update(planId: string, data: Partial<DBWorkoutPlan>): Promise<DBWorkoutPlan | null> {
    const plan = await this.getById(planId);
    if (!plan) return null;
    return { ...plan, ...data, planId, updatedAt: now() };
  },

  async delete(planId: string): Promise<boolean> {
    return true;
  },
};

// ==================== MEAL SERVICE ====================

export interface MealFilters {
  mealType?: MealType;
  category?: MealCategory;
  dietaryTags?: string[];
  status?: ContentStatus;
  search?: string;
}

export const MealService = {
  async getAll(filters?: MealFilters, options?: QueryOptions): Promise<QueryResult<DBMeal>> {
    const items: DBMeal[] = [];

    let filtered = items;
    if (filters) {
      const filterList: Filter[] = [];
      if (filters.mealType) {
        filterList.push({ field: 'mealType', operator: 'eq', value: filters.mealType });
      }
      if (filters.category) {
        filterList.push({ field: 'category', operator: 'eq', value: filters.category });
      }
      if (filters.status) {
        filterList.push({ field: 'status', operator: 'eq', value: filters.status });
      }
      if (filters.dietaryTags?.length) {
        filtered = filtered.filter((m) =>
          filters.dietaryTags!.some((tag) => m.dietaryTags.includes(tag))
        );
      }
      filtered = applyFilters(filtered as unknown as Record<string, unknown>[], filterList) as unknown as DBMeal[];
    }

    return applyQueryOptions(filtered as unknown as Record<string, unknown>[], options ?? {}) as unknown as QueryResult<DBMeal>;
  },

  async getById(mealId: string): Promise<DBMeal | null> {
    const result = await this.getAll();
    return result.data.find((m) => m.mealId === mealId) ?? null;
  },

  async create(data: Omit<DBMeal, 'mealId' | 'createdAt' | 'updatedAt'>): Promise<DBMeal> {
    return { ...data, mealId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(mealId: string, data: Partial<DBMeal>): Promise<DBMeal | null> {
    const meal = await this.getById(mealId);
    if (!meal) return null;
    return { ...meal, ...data, mealId, updatedAt: now() };
  },

  async delete(mealId: string): Promise<boolean> {
    return true;
  },
};

// ==================== MEAL PLAN SERVICE ====================

export interface MealPlanFilters {
  dayNumber?: number;
  category?: MealCategory;
  status?: ContentStatus;
}

export const MealPlanService = {
  async getAll(filters?: MealPlanFilters, options?: QueryOptions): Promise<QueryResult<DBMealPlan>> {
    const items: DBMealPlan[] = [];

    let filtered = items;
    if (filters) {
      const filterList: Filter[] = [];
      if (filters.dayNumber) {
        filterList.push({ field: 'dayNumber', operator: 'eq', value: filters.dayNumber });
      }
      if (filters.category) {
        filterList.push({ field: 'category', operator: 'eq', value: filters.category });
      }
      if (filters.status) {
        filterList.push({ field: 'status', operator: 'eq', value: filters.status });
      }
      filtered = applyFilters(filtered as unknown as Record<string, unknown>[], filterList) as unknown as DBMealPlan[];
    }

    return applyQueryOptions(filtered as unknown as Record<string, unknown>[], options ?? {}) as unknown as QueryResult<DBMealPlan>;
  },

  async getById(mealPlanId: string): Promise<DBMealPlan | null> {
    const result = await this.getAll();
    return result.data.find((mp) => mp.mealPlanId === mealPlanId) ?? null;
  },

  async getForDay(dayNumber: number, category: MealCategory): Promise<DBMealPlan | null> {
    const result = await this.getAll({ dayNumber, category });
    return result.data[0] ?? null;
  },

  async create(data: Omit<DBMealPlan, 'mealPlanId' | 'createdAt' | 'updatedAt'>): Promise<DBMealPlan> {
    return { ...data, mealPlanId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(mealPlanId: string, data: Partial<DBMealPlan>): Promise<DBMealPlan | null> {
    const plan = await this.getById(mealPlanId);
    if (!plan) return null;
    return { ...plan, ...data, mealPlanId, updatedAt: now() };
  },

  async delete(mealPlanId: string): Promise<boolean> {
    return true;
  },
};

// ==================== FASTING PLAN SERVICE ====================

export interface FastingPlanFilters {
  pattern?: FastingPattern;
  workTypes?: WorkType[];
  status?: ContentStatus;
}

export const FastingPlanService = {
  async getAll(
    filters?: FastingPlanFilters,
    options?: QueryOptions
  ): Promise<QueryResult<DBFastingPlan>> {
    const items: DBFastingPlan[] = [];

    let filtered = items;
    if (filters) {
      const filterList: Filter[] = [];
      if (filters.pattern) {
        filterList.push({ field: 'pattern', operator: 'eq', value: filters.pattern });
      }
      if (filters.status) {
        filterList.push({ field: 'status', operator: 'eq', value: filters.status });
      }
      if (filters.workTypes?.length) {
        filtered = filtered.filter((fp) =>
          fp.assignedWorkTypes.some((wt) => filters.workTypes!.includes(wt))
        );
      }
      filtered = applyFilters(filtered as unknown as Record<string, unknown>[], filterList) as unknown as DBFastingPlan[];
    }

    return applyQueryOptions(filtered as unknown as Record<string, unknown>[], options ?? {}) as unknown as QueryResult<DBFastingPlan>;
  },

  async getById(fastingPlanId: string): Promise<DBFastingPlan | null> {
    const result = await this.getAll();
    return result.data.find((fp) => fp.fastingPlanId === fastingPlanId) ?? null;
  },

  async getForWorkType(workType: WorkType, weightKg?: number): Promise<DBFastingPlan | null> {
    const result = await this.getAll({ workTypes: [workType] });
    // Filter by weight threshold if provided
    if (weightKg !== undefined) {
      const matching = result.data.find((fp) => {
        if (!fp.weightThreshold) return true;
        if (fp.weightThreshold.operator === 'gte') {
          return weightKg >= fp.weightThreshold.valueKg;
        }
        return weightKg < fp.weightThreshold.valueKg;
      });
      return matching ?? null;
    }
    return result.data[0] ?? null;
  },

  async create(
    data: Omit<DBFastingPlan, 'fastingPlanId' | 'createdAt' | 'updatedAt'>
  ): Promise<DBFastingPlan> {
    return { ...data, fastingPlanId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(fastingPlanId: string, data: Partial<DBFastingPlan>): Promise<DBFastingPlan | null> {
    const plan = await this.getById(fastingPlanId);
    if (!plan) return null;
    return { ...plan, ...data, fastingPlanId, updatedAt: now() };
  },

  async delete(fastingPlanId: string): Promise<boolean> {
    return true;
  },
};

// ==================== DAILY PLAN SERVICE ====================

export interface DailyPlanFilters {
  userId?: string;
  date?: string;
  dateRange?: { start: string; end: string };
  isRestDay?: boolean;
  isCompleted?: boolean;
}

export const DailyPlanService = {
  async getAll(
    filters?: DailyPlanFilters,
    options?: QueryOptions
  ): Promise<QueryResult<DBDailyPlan>> {
    const items: DBDailyPlan[] = [];

    let filtered = items;
    if (filters) {
      const filterList: Filter[] = [];
      if (filters.userId) {
        filterList.push({ field: 'userId', operator: 'eq', value: filters.userId });
      }
      if (filters.date) {
        filterList.push({ field: 'date', operator: 'eq', value: filters.date });
      }
      if (filters.isRestDay !== undefined) {
        filterList.push({ field: 'isRestDay', operator: 'eq', value: filters.isRestDay });
      }
      if (filters.isCompleted !== undefined) {
        filterList.push({ field: 'isCompleted', operator: 'eq', value: filters.isCompleted });
      }
      if (filters.dateRange) {
        filtered = filtered.filter(
          (dp) => dp.date >= filters.dateRange!.start && dp.date <= filters.dateRange!.end
        );
      }
      filtered = applyFilters(filtered as unknown as Record<string, unknown>[], filterList) as unknown as DBDailyPlan[];
    }

    return applyQueryOptions(filtered as unknown as Record<string, unknown>[], options ?? {}) as unknown as QueryResult<DBDailyPlan>;
  },

  async getById(dailyPlanId: string): Promise<DBDailyPlan | null> {
    const result = await this.getAll();
    return result.data.find((dp) => dp.dailyPlanId === dailyPlanId) ?? null;
  },

  async getForUserAndDate(userId: string, date: string): Promise<DBDailyPlan | null> {
    const result = await this.getAll({ userId, date });
    return result.data[0] ?? null;
  },

  async getWeekForUser(userId: string, startDate: string): Promise<DBDailyPlan[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    const result = await this.getAll({
      userId,
      dateRange: { start: startDate, end: endDate.toISOString().split('T')[0] },
    });
    return result.data;
  },

  async create(
    data: Omit<DBDailyPlan, 'dailyPlanId' | 'createdAt' | 'updatedAt'>
  ): Promise<DBDailyPlan> {
    return { ...data, dailyPlanId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(dailyPlanId: string, data: Partial<DBDailyPlan>): Promise<DBDailyPlan | null> {
    const plan = await this.getById(dailyPlanId);
    if (!plan) return null;
    return { ...plan, ...data, dailyPlanId, updatedAt: now() };
  },

  async delete(dailyPlanId: string): Promise<boolean> {
    return true;
  },

  /** Generate daily plans for a user for a date range */
  async generateForUser(
    userId: string,
    startDate: string,
    days: number,
    settings: {
      workoutDifficulty: DifficultyLevel;
      mealCategory: MealCategory;
      fastingPlanId: string;
    }
  ): Promise<DBDailyPlan[]> {
    const plans: DBDailyPlan[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < days; i++) {
      const date = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const isRestDay = dayOfWeek === 0; // Sunday

      // Get appropriate workout and meal plan
      const workoutPlan = isRestDay
        ? null
        : await WorkoutPlanService.getForDay(dayOfWeek || 7, settings.workoutDifficulty);
      const mealPlan = await MealPlanService.getForDay(dayOfWeek || 7, settings.mealCategory);

      const plan = await this.create({
        userId,
        date,
        dayNumber: i + 1,
        workoutPlanId: workoutPlan?.planId ?? null,
        mealPlanId: mealPlan?.mealPlanId ?? '',
        fastingPlanId: settings.fastingPlanId,
        isRestDay,
        isCompleted: false,
      });

      plans.push(plan);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return plans;
  },
};

// ==================== USER PROFILE SERVICE ====================

export const UserProfileService = {
  async getById(userId: string): Promise<DBUserProfile | null> {
    // In real implementation, query database
    return null;
  },

  async getByEmail(email: string): Promise<DBUserProfile | null> {
    // In real implementation, query database
    return null;
  },

  async create(
    data: Omit<DBUserProfile, 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<DBUserProfile> {
    return { ...data, userId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(userId: string, data: Partial<DBUserProfile>): Promise<DBUserProfile | null> {
    const user = await this.getById(userId);
    if (!user) return null;
    return { ...user, ...data, userId, updatedAt: now() };
  },

  async delete(userId: string): Promise<boolean> {
    return true;
  },
};

// ==================== PROGRESS SERVICES ====================

export const WorkoutProgressService = {
  async getForUser(
    userId: string,
    dateRange?: { start: string; end: string }
  ): Promise<DBWorkoutProgress[]> {
    // In real implementation, query database
    return [];
  },

  async create(
    data: Omit<DBWorkoutProgress, 'progressId' | 'createdAt' | 'updatedAt'>
  ): Promise<DBWorkoutProgress> {
    return { ...data, progressId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(
    progressId: string,
    data: Partial<DBWorkoutProgress>
  ): Promise<DBWorkoutProgress | null> {
    // In real implementation, query and update database
    return null;
  },
};

export const FastingProgressService = {
  async getForUser(
    userId: string,
    dateRange?: { start: string; end: string }
  ): Promise<DBFastingProgress[]> {
    return [];
  },

  async create(
    data: Omit<DBFastingProgress, 'progressId' | 'createdAt' | 'updatedAt'>
  ): Promise<DBFastingProgress> {
    return { ...data, progressId: generateId(), createdAt: now(), updatedAt: now() };
  },

  async update(
    progressId: string,
    data: Partial<DBFastingProgress>
  ): Promise<DBFastingProgress | null> {
    return null;
  },
};

// ==================== PERSONALIZATION SERVICE ====================

export const PersonalizationService = {
  /** Get all active rules sorted by priority */
  async getRules(): Promise<DBPersonalizationRule[]> {
    // In real implementation, query database
    return [];
  },

  /** Calculate personalization for a user based on their attributes */
  async calculateForUser(attributes: {
    workType: WorkType;
    weightKg: number;
    heightCm?: number;
    age?: number;
    gender?: string;
    fitnessGoal?: string;
  }): Promise<{
    fastingPlanId: string | null;
    workoutDifficulty: DifficultyLevel;
    mealCategory: MealCategory;
  }> {
    // Default values based on work type (hardcoded rules for now)
    const difficultyMap: Record<WorkType, DifficultyLevel> = {
      sedentary: 'beginner',
      moderate: 'intermediate',
      active: 'advanced',
    };

    const mealCategoryMap: Record<WorkType, MealCategory> = {
      sedentary: 'light',
      moderate: 'standard',
      active: 'high_energy',
    };

    // Get fasting plan based on work type and weight
    const fastingPlan = await FastingPlanService.getForWorkType(
      attributes.workType,
      attributes.weightKg
    );

    return {
      fastingPlanId: fastingPlan?.fastingPlanId ?? null,
      workoutDifficulty: difficultyMap[attributes.workType],
      mealCategory: mealCategoryMap[attributes.workType],
    };
  },
};

// ==================== EXPORT ALL SERVICES ====================

export const DatabaseService = {
  exercises: ExerciseService,
  workoutPlans: WorkoutPlanService,
  meals: MealService,
  mealPlans: MealPlanService,
  fastingPlans: FastingPlanService,
  dailyPlans: DailyPlanService,
  userProfiles: UserProfileService,
  workoutProgress: WorkoutProgressService,
  fastingProgress: FastingProgressService,
  personalization: PersonalizationService,
};

export default DatabaseService;

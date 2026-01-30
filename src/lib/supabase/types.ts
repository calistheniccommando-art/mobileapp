/**
 * Supabase Database Types
 *
 * Auto-generated types for database tables.
 * These types match the schema defined in supabase/migrations/001_initial_schema.sql
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ==================== ENUMS ====================

export type UserGender = 'male' | 'female';
export type AgeCategory = '18-29' | '30-39' | '40-49' | '50+';
export type PrimaryGoal = 'build_muscle' | 'lose_weight' | 'gain_muscle_lose_weight' | 'get_fit_toned';
export type BodyType = 'slim' | 'average' | 'big' | 'heavy';
export type DesiredBody = 'fit' | 'strong' | 'athletic' | 'toned' | 'lean' | 'curvy_fit';
export type ExperienceLevel = 'never' | 'beginner' | 'some' | 'regular' | 'advanced';
export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active';
export type FastingPlan = '12:12' | '14:10' | '16:8' | '18:6';
export type MealIntensity = 'light' | 'standard' | 'high_energy';
export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'legs' | 'core' | 'glutes' | 'full_body' | 'cardio';
export type ExerciseType = 'strength' | 'cardio' | 'flexibility' | 'hiit';
export type MealType = 'meal_1' | 'meal_2' | 'snack';
export type SubscriptionTier = 'free' | 'monthly' | 'quarterly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trial';

// ==================== DATABASE INTERFACE ====================

export interface Database {
  public: {
    Tables: {
      // User profiles
      users: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          gender: UserGender | null;
          date_of_birth: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          target_weight_kg: number | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          gender?: UserGender | null;
          date_of_birth?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          target_weight_kg?: number | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          gender?: UserGender | null;
          date_of_birth?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          target_weight_kg?: number | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };

      // User onboarding data
      user_onboarding: {
        Row: {
          id: string;
          user_id: string;
          onboarding_data: Json;
          completed: boolean;
          current_step: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          onboarding_data?: Json;
          completed?: boolean;
          current_step?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          onboarding_data?: Json;
          completed?: boolean;
          current_step?: number;
          updated_at?: string;
        };
      };

      // Personalized plans
      user_plans: {
        Row: {
          id: string;
          user_id: string;
          plan_data: Json;
          fitness_level: FitnessLevel;
          fasting_plan: FastingPlan;
          meal_intensity: MealIntensity;
          training_frequency: string;
          workout_duration: string;
          daily_calorie_target: number | null;
          protein_target: number | null;
          water_target: number | null;
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_data?: Json;
          fitness_level: FitnessLevel;
          fasting_plan: FastingPlan;
          meal_intensity: MealIntensity;
          training_frequency: string;
          workout_duration: string;
          daily_calorie_target?: number | null;
          protein_target?: number | null;
          water_target?: number | null;
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_data?: Json;
          fitness_level?: FitnessLevel;
          fasting_plan?: FastingPlan;
          meal_intensity?: MealIntensity;
          training_frequency?: string;
          workout_duration?: string;
          daily_calorie_target?: number | null;
          protein_target?: number | null;
          water_target?: number | null;
          end_date?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };

      // Exercises library
      exercises: {
        Row: {
          id: string;
          name: string;
          description: string;
          instructions: string[];
          youtube_video_id: string | null;
          thumbnail_url: string | null;
          muscle_groups: MuscleGroup[];
          exercise_type: ExerciseType;
          difficulty: FitnessLevel;
          default_sets: number;
          default_reps: string;
          default_duration_seconds: number | null;
          default_rest_seconds: number;
          calories_per_set: number | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          instructions?: string[];
          youtube_video_id?: string | null;
          thumbnail_url?: string | null;
          muscle_groups?: MuscleGroup[];
          exercise_type?: ExerciseType;
          difficulty?: FitnessLevel;
          default_sets?: number;
          default_reps?: string;
          default_duration_seconds?: number | null;
          default_rest_seconds?: number;
          calories_per_set?: number | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          instructions?: string[];
          youtube_video_id?: string | null;
          thumbnail_url?: string | null;
          muscle_groups?: MuscleGroup[];
          exercise_type?: ExerciseType;
          difficulty?: FitnessLevel;
          default_sets?: number;
          default_reps?: string;
          default_duration_seconds?: number | null;
          default_rest_seconds?: number;
          calories_per_set?: number | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };

      // Workout templates
      workout_templates: {
        Row: {
          id: string;
          name: string;
          description: string;
          difficulty: FitnessLevel;
          target_muscle_groups: MuscleGroup[];
          estimated_duration_minutes: number;
          estimated_calories: number | null;
          exercise_order: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          difficulty?: FitnessLevel;
          target_muscle_groups?: MuscleGroup[];
          estimated_duration_minutes?: number;
          estimated_calories?: number | null;
          exercise_order?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          difficulty?: FitnessLevel;
          target_muscle_groups?: MuscleGroup[];
          estimated_duration_minutes?: number;
          estimated_calories?: number | null;
          exercise_order?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
      };

      // Meals library
      meals: {
        Row: {
          id: string;
          name: string;
          description: string;
          meal_type: MealType;
          intensity: MealIntensity;
          image_url: string | null;
          ingredients: Json;
          instructions: string[];
          prep_time_minutes: number | null;
          cook_time_minutes: number | null;
          servings: number;
          calories: number;
          protein_grams: number;
          carbs_grams: number;
          fat_grams: number;
          fiber_grams: number | null;
          dietary_tags: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          meal_type?: MealType;
          intensity?: MealIntensity;
          image_url?: string | null;
          ingredients?: Json;
          instructions?: string[];
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number;
          calories: number;
          protein_grams: number;
          carbs_grams: number;
          fat_grams: number;
          fiber_grams?: number | null;
          dietary_tags?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          meal_type?: MealType;
          intensity?: MealIntensity;
          image_url?: string | null;
          ingredients?: Json;
          instructions?: string[];
          prep_time_minutes?: number | null;
          cook_time_minutes?: number | null;
          servings?: number;
          calories?: number;
          protein_grams?: number;
          carbs_grams?: number;
          fat_grams?: number;
          fiber_grams?: number | null;
          dietary_tags?: string[];
          is_active?: boolean;
          updated_at?: string;
        };
      };

      // Daily user progress
      user_daily_progress: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          workout_completed: boolean;
          workout_template_id: string | null;
          exercises_completed: string[];
          workout_duration_minutes: number | null;
          meals_completed: string[];
          fasting_start_time: string | null;
          fasting_end_time: string | null;
          fasting_completed: boolean;
          water_intake_liters: number | null;
          weight_kg: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          workout_completed?: boolean;
          workout_template_id?: string | null;
          exercises_completed?: string[];
          workout_duration_minutes?: number | null;
          meals_completed?: string[];
          fasting_start_time?: string | null;
          fasting_end_time?: string | null;
          fasting_completed?: boolean;
          water_intake_liters?: number | null;
          weight_kg?: number | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          workout_completed?: boolean;
          workout_template_id?: string | null;
          exercises_completed?: string[];
          workout_duration_minutes?: number | null;
          meals_completed?: string[];
          fasting_start_time?: string | null;
          fasting_end_time?: string | null;
          fasting_completed?: boolean;
          water_intake_liters?: number | null;
          weight_kg?: number | null;
          notes?: string | null;
          updated_at?: string;
        };
      };

      // User subscriptions
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          tier: SubscriptionTier;
          status: SubscriptionStatus;
          paystack_customer_id: string | null;
          paystack_subscription_code: string | null;
          amount_kobo: number;
          currency: string;
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          paystack_customer_id?: string | null;
          paystack_subscription_code?: string | null;
          amount_kobo?: number;
          currency?: string;
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: SubscriptionTier;
          status?: SubscriptionStatus;
          paystack_customer_id?: string | null;
          paystack_subscription_code?: string | null;
          amount_kobo?: number;
          currency?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          updated_at?: string;
        };
      };

      // Admin audit log
      audit_log: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_gender: UserGender;
      age_category: AgeCategory;
      primary_goal: PrimaryGoal;
      body_type: BodyType;
      desired_body: DesiredBody;
      experience_level: ExperienceLevel;
      fitness_level: FitnessLevel;
      activity_level: ActivityLevel;
      fasting_plan: FastingPlan;
      meal_intensity: MealIntensity;
      muscle_group: MuscleGroup;
      exercise_type: ExerciseType;
      meal_type: MealType;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
    };
  };
}

// ==================== HELPER TYPES ====================

// Type helpers for tables
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Specific table types
export type User = Tables<'users'>;
export type UserInsert = Insertable<'users'>;
export type UserUpdate = Updatable<'users'>;

export type UserOnboarding = Tables<'user_onboarding'>;
export type UserOnboardingInsert = Insertable<'user_onboarding'>;
export type UserOnboardingUpdate = Updatable<'user_onboarding'>;

export type UserPlan = Tables<'user_plans'>;
export type UserPlanInsert = Insertable<'user_plans'>;
export type UserPlanUpdate = Updatable<'user_plans'>;

export type Exercise = Tables<'exercises'>;
export type ExerciseInsert = Insertable<'exercises'>;
export type ExerciseUpdate = Updatable<'exercises'>;

export type WorkoutTemplate = Tables<'workout_templates'>;
export type WorkoutTemplateInsert = Insertable<'workout_templates'>;
export type WorkoutTemplateUpdate = Updatable<'workout_templates'>;

export type Meal = Tables<'meals'>;
export type MealInsert = Insertable<'meals'>;
export type MealUpdate = Updatable<'meals'>;

export type UserDailyProgress = Tables<'user_daily_progress'>;
export type UserDailyProgressInsert = Insertable<'user_daily_progress'>;
export type UserDailyProgressUpdate = Updatable<'user_daily_progress'>;

export type Subscription = Tables<'subscriptions'>;
export type SubscriptionInsert = Insertable<'subscriptions'>;
export type SubscriptionUpdate = Updatable<'subscriptions'>;

export type AuditLog = Tables<'audit_log'>;
export type AuditLogInsert = Insertable<'audit_log'>;

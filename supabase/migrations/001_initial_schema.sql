-- ==========================================
-- CALISTHENIC COMMANDO DATABASE SCHEMA
-- Migration: 001_initial_schema.sql
-- ==========================================
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== ENUMS ====================

CREATE TYPE user_gender AS ENUM ('male', 'female');
CREATE TYPE age_category AS ENUM ('18-29', '30-39', '40-49', '50+');
CREATE TYPE primary_goal AS ENUM ('build_muscle', 'lose_weight', 'gain_muscle_lose_weight', 'get_fit_toned');
CREATE TYPE body_type AS ENUM ('slim', 'average', 'big', 'heavy');
CREATE TYPE desired_body AS ENUM ('fit', 'strong', 'athletic', 'toned', 'lean', 'curvy_fit');
CREATE TYPE experience_level AS ENUM ('never', 'beginner', 'some', 'regular', 'advanced');
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE activity_level AS ENUM ('sedentary', 'lightly_active', 'moderately_active', 'very_active');
CREATE TYPE fasting_plan AS ENUM ('12:12', '14:10', '16:8', '18:6');
CREATE TYPE meal_intensity AS ENUM ('light', 'standard', 'high_energy');
CREATE TYPE muscle_group AS ENUM ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'core', 'glutes', 'full_body', 'cardio');
CREATE TYPE exercise_type AS ENUM ('strength', 'cardio', 'flexibility', 'hiit');
CREATE TYPE meal_type AS ENUM ('meal_1', 'meal_2', 'snack');
CREATE TYPE subscription_tier AS ENUM ('free', 'monthly', 'quarterly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- ==================== USERS TABLE ====================

CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    gender user_gender,
    date_of_birth DATE,
    height_cm NUMERIC(5,2),
    weight_kg NUMERIC(5,2),
    target_weight_kg NUMERIC(5,2),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);

-- ==================== USER ONBOARDING ====================

CREATE TABLE user_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    onboarding_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    completed BOOLEAN DEFAULT FALSE NOT NULL,
    current_step INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id)
);

-- Index for user lookups
CREATE INDEX idx_user_onboarding_user ON user_onboarding(user_id);

-- ==================== USER PLANS ====================

CREATE TABLE user_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_data JSONB DEFAULT '{}'::jsonb NOT NULL,
    fitness_level fitness_level NOT NULL,
    fasting_plan fasting_plan NOT NULL,
    meal_intensity meal_intensity NOT NULL,
    training_frequency TEXT NOT NULL,
    workout_duration TEXT NOT NULL,
    daily_calorie_target INTEGER,
    protein_target INTEGER,
    water_target NUMERIC(3,1),
    start_date DATE DEFAULT CURRENT_DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for active plan lookups
CREATE INDEX idx_user_plans_user_active ON user_plans(user_id, is_active) WHERE is_active = TRUE;

-- ==================== EXERCISES LIBRARY ====================

CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT[] DEFAULT '{}' NOT NULL,
    youtube_video_id TEXT,
    thumbnail_url TEXT,
    muscle_groups muscle_group[] DEFAULT '{}' NOT NULL,
    exercise_type exercise_type DEFAULT 'strength' NOT NULL,
    difficulty fitness_level DEFAULT 'beginner' NOT NULL,
    default_sets INTEGER DEFAULT 3 NOT NULL,
    default_reps TEXT DEFAULT '10' NOT NULL,
    default_duration_seconds INTEGER,
    default_rest_seconds INTEGER DEFAULT 60 NOT NULL,
    calories_per_set INTEGER,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for exercise queries
CREATE INDEX idx_exercises_difficulty ON exercises(difficulty) WHERE is_active = TRUE;
CREATE INDEX idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups) WHERE is_active = TRUE;
CREATE INDEX idx_exercises_active ON exercises(is_active);

-- ==================== WORKOUT TEMPLATES ====================

CREATE TABLE workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    difficulty fitness_level DEFAULT 'beginner' NOT NULL,
    target_muscle_groups muscle_group[] DEFAULT '{}' NOT NULL,
    estimated_duration_minutes INTEGER DEFAULT 30 NOT NULL,
    estimated_calories INTEGER,
    exercise_order UUID[] DEFAULT '{}' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for workout template queries
CREATE INDEX idx_workout_templates_difficulty ON workout_templates(difficulty) WHERE is_active = TRUE;

-- ==================== MEALS LIBRARY ====================

CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    meal_type meal_type DEFAULT 'meal_1' NOT NULL,
    intensity meal_intensity DEFAULT 'standard' NOT NULL,
    image_url TEXT,
    ingredients JSONB DEFAULT '[]'::jsonb NOT NULL,
    instructions TEXT[] DEFAULT '{}' NOT NULL,
    prep_time_minutes INTEGER,
    cook_time_minutes INTEGER,
    servings INTEGER DEFAULT 1 NOT NULL,
    calories INTEGER NOT NULL,
    protein_grams NUMERIC(5,1) NOT NULL,
    carbs_grams NUMERIC(5,1) NOT NULL,
    fat_grams NUMERIC(5,1) NOT NULL,
    fiber_grams NUMERIC(5,1),
    dietary_tags TEXT[] DEFAULT '{}' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for meal queries
CREATE INDEX idx_meals_intensity ON meals(intensity) WHERE is_active = TRUE;
CREATE INDEX idx_meals_type ON meals(meal_type) WHERE is_active = TRUE;
CREATE INDEX idx_meals_calories ON meals(calories) WHERE is_active = TRUE;

-- ==================== USER DAILY PROGRESS ====================

CREATE TABLE user_daily_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_completed BOOLEAN DEFAULT FALSE NOT NULL,
    workout_template_id UUID REFERENCES workout_templates(id),
    exercises_completed UUID[] DEFAULT '{}' NOT NULL,
    workout_duration_minutes INTEGER,
    meals_completed UUID[] DEFAULT '{}' NOT NULL,
    fasting_start_time TIME,
    fasting_end_time TIME,
    fasting_completed BOOLEAN DEFAULT FALSE NOT NULL,
    water_intake_liters NUMERIC(3,1),
    weight_kg NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, date)
);

-- Indexes for progress queries
CREATE INDEX idx_daily_progress_user_date ON user_daily_progress(user_id, date);
CREATE INDEX idx_daily_progress_date ON user_daily_progress(date);

-- ==================== SUBSCRIPTIONS ====================

CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tier subscription_tier DEFAULT 'free' NOT NULL,
    status subscription_status DEFAULT 'active' NOT NULL,
    paystack_customer_id TEXT,
    paystack_subscription_code TEXT,
    amount_kobo INTEGER DEFAULT 0 NOT NULL,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for subscription queries
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_expires ON subscriptions(expires_at) WHERE status = 'active';

-- ==================== AUDIT LOG ====================

CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for audit log queries
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User Onboarding: Users can manage their own onboarding data
CREATE POLICY "Users can view own onboarding" ON user_onboarding
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON user_onboarding
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON user_onboarding
    FOR UPDATE USING (auth.uid() = user_id);

-- User Plans: Users can view their own plans
CREATE POLICY "Users can view own plans" ON user_plans
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON user_plans
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON user_plans
    FOR UPDATE USING (auth.uid() = user_id);

-- Exercises: Everyone can view active exercises
CREATE POLICY "Anyone can view active exercises" ON exercises
    FOR SELECT USING (is_active = TRUE);

-- Workout Templates: Everyone can view active templates
CREATE POLICY "Anyone can view active workout templates" ON workout_templates
    FOR SELECT USING (is_active = TRUE);

-- Meals: Everyone can view active meals
CREATE POLICY "Anyone can view active meals" ON meals
    FOR SELECT USING (is_active = TRUE);

-- Daily Progress: Users can manage their own progress
CREATE POLICY "Users can view own progress" ON user_daily_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_daily_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_daily_progress
    FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions: Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

-- Audit Log: Users can view their own audit entries
CREATE POLICY "Users can view own audit log" ON audit_log
    FOR SELECT USING (auth.uid() = user_id);

-- ==================== FUNCTIONS ====================

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_onboarding_updated_at BEFORE UPDATE ON user_onboarding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON user_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_progress_updated_at BEFORE UPDATE ON user_daily_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================== ADMIN ROLE ====================

-- Create admin role for content management
-- You'll need to assign this role to admin users in the Supabase dashboard

-- Admin policies for exercises
CREATE POLICY "Admins can manage exercises" ON exercises
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin policies for workout_templates
CREATE POLICY "Admins can manage workout templates" ON workout_templates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin policies for meals
CREATE POLICY "Admins can manage meals" ON meals
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin policies for subscriptions (full access)
CREATE POLICY "Admins can manage subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin policies for audit_log (read all)
CREATE POLICY "Admins can view all audit logs" ON audit_log
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Admin insert audit log
CREATE POLICY "Admins can insert audit logs" ON audit_log
    FOR INSERT WITH CHECK (TRUE);

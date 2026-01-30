-- ==========================================
-- CALISTHENIC COMMANDO STORAGE BUCKETS
-- Migration: 003_storage_buckets.sql
-- ==========================================
-- Run this in your Supabase SQL Editor
-- ==========================================

-- Create storage buckets for images

-- Exercise thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-thumbnails',
  'exercise-thumbnails',
  true,  -- Public bucket for exercise images
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Meal images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meal-images',
  'meal-images',
  true,  -- Public bucket for meal images
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-avatars',
  'user-avatars',
  true,  -- Public for profile pictures
  2097152,  -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Progress photos bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'progress-photos',
  'progress-photos',
  false,  -- Private - only user can see their photos
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- ==================== STORAGE POLICIES ====================

-- Exercise thumbnails - anyone can view, only admins can upload
CREATE POLICY "Public exercise thumbnails" ON storage.objects
  FOR SELECT USING (bucket_id = 'exercise-thumbnails');

CREATE POLICY "Admins can upload exercise thumbnails" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exercise-thumbnails' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update exercise thumbnails" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exercise-thumbnails' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete exercise thumbnails" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exercise-thumbnails' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Meal images - anyone can view, only admins can upload
CREATE POLICY "Public meal images" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-images');

CREATE POLICY "Admins can upload meal images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'meal-images' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can update meal images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'meal-images' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE POLICY "Admins can delete meal images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'meal-images' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- User avatars - anyone can view, users can manage their own
CREATE POLICY "Public avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Progress photos - private, only user can access their own
CREATE POLICY "Users can view own progress photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload own progress photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own progress photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own progress photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'progress-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==================== HELPER FUNCTION ====================

-- Function to get public URL for a storage object
CREATE OR REPLACE FUNCTION get_storage_url(bucket TEXT, path TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN format('%s/storage/v1/object/public/%s/%s',
    current_setting('app.settings.supabase_url', true),
    bucket,
    path
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==================== DONE ====================

SELECT 'Storage buckets created successfully!' AS status;

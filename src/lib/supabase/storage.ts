/**
 * SUPABASE STORAGE SERVICE
 * 
 * Handles file uploads to Supabase Storage.
 * Supports images for meals, exercises, and thumbnails.
 */

import { supabase } from '@/lib/api/client';

// ==================== TYPES ====================

export type StorageBucket = 'meal-images' | 'exercise-images' | 'thumbnails' | 'user-avatars';

export interface UploadOptions {
  bucket: StorageBucket;
  path: string;
  file: File | Blob;
  contentType?: string;
  upsert?: boolean;
  onProgress?: (progress: number) => void;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

export interface ImageMetadata {
  width?: number;
  height?: number;
  size: number;
  contentType: string;
  fileName: string;
}

// ==================== STORAGE BUCKETS ====================

export const STORAGE_BUCKETS: Record<StorageBucket, { maxSize: number; allowedTypes: string[] }> = {
  'meal-images': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'exercise-images': {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
  'thumbnails': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
  'user-avatars': {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  },
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Generate a unique file path for uploads
 */
export function generateFilePath(
  bucket: StorageBucket,
  fileName: string,
  prefix?: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = fileName.split('.').pop() || 'jpg';
  const safeName = fileName
    .split('.')[0]
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .substring(0, 30);
  
  const parts = [prefix, `${safeName}-${timestamp}-${random}.${extension}`]
    .filter(Boolean);
  
  return parts.join('/');
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File | Blob,
  bucket: StorageBucket
): { valid: boolean; error?: string } {
  const config = STORAGE_BUCKETS[bucket];

  // Check size
  if (file.size > config.maxSize) {
    const maxMB = config.maxSize / (1024 * 1024);
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxMB}MB`,
    };
  }

  // Check type
  const fileType = file.type || 'application/octet-stream';
  if (!config.allowedTypes.includes(fileType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Get the public URL for a file
 */
export function getPublicUrl(bucket: StorageBucket, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// ==================== UPLOAD FUNCTIONS ====================

/**
 * Upload a file to Supabase Storage
 */
export async function uploadFile({
  bucket,
  path,
  file,
  contentType,
  upsert = false,
  onProgress,
}: UploadOptions): Promise<UploadResult> {
  try {
    // Validate file
    const validation = validateFile(file, bucket);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Determine content type
    const fileContentType = contentType || (file as File).type || 'application/octet-stream';

    // Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        contentType: fileContentType,
        upsert,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const url = getPublicUrl(bucket, data.path);

    return {
      success: true,
      url,
      path: data.path,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload an image with automatic path generation
 */
export async function uploadImage(
  file: File | Blob,
  bucket: StorageBucket,
  options?: {
    prefix?: string;
    fileName?: string;
    upsert?: boolean;
    onProgress?: (progress: number) => void;
  }
): Promise<UploadResult> {
  const fileName = options?.fileName || (file as File).name || 'image.jpg';
  const path = generateFilePath(bucket, fileName, options?.prefix);

  return uploadFile({
    bucket,
    path,
    file,
    upsert: options?.upsert,
    onProgress: options?.onProgress,
  });
}

/**
 * Upload meal image
 */
export async function uploadMealImage(
  file: File | Blob,
  mealId?: string
): Promise<UploadResult> {
  return uploadImage(file, 'meal-images', {
    prefix: mealId || 'general',
  });
}

/**
 * Upload exercise image
 */
export async function uploadExerciseImage(
  file: File | Blob,
  exerciseId?: string
): Promise<UploadResult> {
  return uploadImage(file, 'exercise-images', {
    prefix: exerciseId || 'general',
  });
}

/**
 * Upload thumbnail image
 */
export async function uploadThumbnail(
  file: File | Blob,
  entityType: 'meal' | 'exercise' | 'workout',
  entityId?: string
): Promise<UploadResult> {
  return uploadImage(file, 'thumbnails', {
    prefix: `${entityType}/${entityId || 'general'}`,
  });
}

/**
 * Upload user avatar
 */
export async function uploadAvatar(
  file: File | Blob,
  userId: string
): Promise<UploadResult> {
  return uploadImage(file, 'user-avatars', {
    prefix: userId,
    upsert: true, // Replace existing avatar
  });
}

// ==================== DELETE FUNCTIONS ====================

/**
 * Delete a file from storage
 */
export async function deleteFile(
  bucket: StorageBucket,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error('Storage delete error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

/**
 * Delete multiple files from storage
 */
export async function deleteFiles(
  bucket: StorageBucket,
  paths: string[]
): Promise<{ success: boolean; deleted: number; errors: string[] }> {
  const errors: string[] = [];
  let deleted = 0;

  for (const path of paths) {
    const result = await deleteFile(bucket, path);
    if (result.success) {
      deleted++;
    } else if (result.error) {
      errors.push(`${path}: ${result.error}`);
    }
  }

  return {
    success: errors.length === 0,
    deleted,
    errors,
  };
}

// ==================== LIST FUNCTIONS ====================

/**
 * List files in a bucket folder
 */
export async function listFiles(
  bucket: StorageBucket,
  folder?: string
): Promise<{ files: string[]; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder || '', {
        limit: 100,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('Storage list error:', error);
      return { files: [], error: error.message };
    }

    const files = data
      .filter((item) => item.name && !item.name.endsWith('/'))
      .map((item) => (folder ? `${folder}/${item.name}` : item.name));

    return { files };
  } catch (error) {
    console.error('List error:', error);
    return {
      files: [],
      error: error instanceof Error ? error.message : 'List failed',
    };
  }
}

// ==================== URL UTILITIES ====================

/**
 * Extract storage path from a public URL
 */
export function extractPathFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)/);
    if (pathMatch) {
      return pathMatch[2];
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a URL is from Supabase Storage
 */
export function isSupabaseStorageUrl(url: string): boolean {
  return url.includes('supabase.co/storage/v1/object/public/');
}

/**
 * Transform image URL with resize parameters
 */
export function getResizedImageUrl(
  bucket: StorageBucket,
  path: string,
  options: { width?: number; height?: number; quality?: number }
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width: options.width,
      height: options.height,
      quality: options.quality || 80,
    },
  });
  return data.publicUrl;
}

// ==================== EXPORTS ====================

export const storage = {
  upload: uploadFile,
  uploadImage,
  uploadMealImage,
  uploadExerciseImage,
  uploadThumbnail,
  uploadAvatar,
  delete: deleteFile,
  deleteFiles,
  list: listFiles,
  getPublicUrl,
  getResizedImageUrl,
  validateFile,
  generateFilePath,
  extractPathFromUrl,
  isSupabaseStorageUrl,
};

export default storage;

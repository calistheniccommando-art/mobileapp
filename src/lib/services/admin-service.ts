/**
 * ADMIN VIDEO SERVICE
 *
 * Handles admin operations for video management:
 * - Video upload and validation
 * - Exercise video linking
 * - Approval workflow
 * - Content status management
 *
 * Note: This is a service layer for future admin dashboard integration.
 * Actual file upload would be handled by cloud storage (Firebase/Supabase).
 */

import type {
  ContentStatus,
  DBVideo,
  DBExercise,
  DBMeal,
  DBMealPlan,
  DBFastingPlan,
  NutritionInfo,
} from '@/types/database';

// ==================== TYPES ====================

export interface VideoUploadRequest {
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
  metadata: {
    name: string;
    description?: string;
    type: 'exercise_demo' | 'meal_prep' | 'tutorial' | 'other';
    linkedExerciseId?: string;
    linkedMealId?: string;
  };
  uploadedBy: string; // Admin ID
}

export interface VideoUploadResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export interface VideoValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VideoApprovalRequest {
  videoId: string;
  action: 'approve' | 'reject';
  reviewerId: string;
  notes?: string;
}

export interface VideoListFilters {
  status?: ContentStatus;
  type?: DBVideo['type'];
  linkedExerciseId?: string;
  uploadedBy?: string;
  search?: string;
}

// ==================== CONSTANTS ====================

const VIDEO_CONSTRAINTS = {
  maxSizeBytes: 100 * 1024 * 1024, // 100 MB
  maxDurationSeconds: 120, // 2 minutes
  allowedFormats: ['video/mp4', 'video/webm', 'video/quicktime'],
  minResolution: { width: 720, height: 480 },
  maxResolution: { width: 1920, height: 1080 },
  recommendedAspectRatio: 16 / 9,
};

// ==================== VALIDATION ====================

export const VideoValidation = {
  /**
   * Validate video file before upload
   */
  validateFile(file: VideoUploadRequest['file']): VideoValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > VIDEO_CONSTRAINTS.maxSizeBytes) {
      errors.push(
        `File size (${Math.round(file.size / 1024 / 1024)}MB) exceeds maximum allowed (${VIDEO_CONSTRAINTS.maxSizeBytes / 1024 / 1024}MB)`
      );
    }

    // Check format
    if (!VIDEO_CONSTRAINTS.allowedFormats.includes(file.type)) {
      errors.push(
        `File format (${file.type}) not supported. Allowed: ${VIDEO_CONSTRAINTS.allowedFormats.join(', ')}`
      );
    }

    // Warn about file name
    if (file.name.includes(' ')) {
      warnings.push('File name contains spaces, which may cause issues');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate video metadata
   */
  validateMetadata(metadata: VideoUploadRequest['metadata']): VideoValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!metadata.name || metadata.name.trim().length === 0) {
      errors.push('Video name is required');
    }

    if (metadata.name && metadata.name.length > 100) {
      errors.push('Video name must be 100 characters or less');
    }

    if (metadata.type === 'exercise_demo' && !metadata.linkedExerciseId) {
      warnings.push('Exercise demo video should be linked to an exercise');
    }

    if (metadata.type === 'meal_prep' && !metadata.linkedMealId) {
      warnings.push('Meal prep video should be linked to a meal');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  },
};

// ==================== ADMIN VIDEO SERVICE ====================

export const AdminVideoService = {
  /**
   * Upload a new video
   * Note: Actual upload would be to cloud storage
   */
  async upload(request: VideoUploadRequest): Promise<VideoUploadResult> {
    // Validate file
    const fileValidation = VideoValidation.validateFile(request.file);
    if (!fileValidation.isValid) {
      return {
        success: false,
        error: fileValidation.errors.join('; '),
      };
    }

    // Validate metadata
    const metadataValidation = VideoValidation.validateMetadata(request.metadata);
    if (!metadataValidation.isValid) {
      return {
        success: false,
        error: metadataValidation.errors.join('; '),
      };
    }

    // Mock upload - in production, would upload to cloud storage
    const videoId = `vid-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const videoUrl = `https://storage.example.com/videos/${videoId}.mp4`;
    const thumbnailUrl = `https://storage.example.com/thumbnails/${videoId}.jpg`;

    console.log(`[AdminVideoService] Video uploaded: ${videoId}`);

    return {
      success: true,
      videoId,
      videoUrl,
      thumbnailUrl,
    };
  },

  /**
   * Get all videos with optional filtering
   */
  async getVideos(filters?: VideoListFilters): Promise<DBVideo[]> {
    // Mock implementation - would query database
    console.log('[AdminVideoService] Getting videos with filters:', filters);
    return [];
  },

  /**
   * Get video by ID
   */
  async getVideoById(videoId: string): Promise<DBVideo | null> {
    console.log(`[AdminVideoService] Getting video: ${videoId}`);
    return null;
  },

  /**
   * Get videos pending approval
   */
  async getPendingVideos(): Promise<DBVideo[]> {
    return this.getVideos({ status: 'pending_review' });
  },

  /**
   * Approve or reject a video
   */
  async reviewVideo(request: VideoApprovalRequest): Promise<boolean> {
    console.log(
      `[AdminVideoService] ${request.action} video: ${request.videoId} by ${request.reviewerId}`
    );

    // Mock implementation - would update database
    return true;
  },

  /**
   * Link video to an exercise
   */
  async linkToExercise(videoId: string, exerciseId: string): Promise<boolean> {
    console.log(`[AdminVideoService] Linking video ${videoId} to exercise ${exerciseId}`);
    return true;
  },

  /**
   * Unlink video from exercise
   */
  async unlinkFromExercise(videoId: string): Promise<boolean> {
    console.log(`[AdminVideoService] Unlinking video ${videoId} from exercise`);
    return true;
  },

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminVideoService] Deleting video ${videoId} by admin ${adminId}`);
    return true;
  },

  /**
   * Generate thumbnail for video
   * Note: Would be done server-side or via cloud function
   */
  async generateThumbnail(videoUrl: string): Promise<string | null> {
    console.log(`[AdminVideoService] Generating thumbnail for: ${videoUrl}`);
    return null;
  },
};

// ==================== ADMIN EXERCISE SERVICE ====================

export const AdminExerciseService = {
  /**
   * Get all exercises for admin management
   */
  async getExercises(filters?: {
    status?: ContentStatus;
    difficulty?: string;
    hasVideo?: boolean;
    search?: string;
  }): Promise<DBExercise[]> {
    console.log('[AdminExerciseService] Getting exercises with filters:', filters);
    return [];
  },

  /**
   * Create a new exercise
   */
  async createExercise(
    data: Omit<DBExercise, 'exerciseId' | 'createdAt' | 'updatedAt'>,
    adminId: string
  ): Promise<DBExercise | null> {
    console.log(`[AdminExerciseService] Creating exercise by admin ${adminId}`);
    return null;
  },

  /**
   * Update an exercise
   */
  async updateExercise(
    exerciseId: string,
    data: Partial<DBExercise>,
    adminId: string
  ): Promise<DBExercise | null> {
    console.log(`[AdminExerciseService] Updating exercise ${exerciseId} by admin ${adminId}`);
    return null;
  },

  /**
   * Delete an exercise
   */
  async deleteExercise(exerciseId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminExerciseService] Deleting exercise ${exerciseId} by admin ${adminId}`);
    return true;
  },

  /**
   * Approve an exercise for publishing
   */
  async approveExercise(exerciseId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminExerciseService] Approving exercise ${exerciseId} by admin ${adminId}`);
    return true;
  },

  /**
   * Get exercises without videos (for admin to prioritize uploads)
   */
  async getExercisesWithoutVideos(): Promise<DBExercise[]> {
    return this.getExercises({ hasVideo: false });
  },
};

// ==================== ADMIN WORKOUT SERVICE ====================

export const AdminWorkoutService = {
  /**
   * Get all workout plans
   */
  async getWorkoutPlans(filters?: {
    status?: ContentStatus;
    difficulty?: string;
    dayNumber?: number;
  }): Promise<unknown[]> {
    console.log('[AdminWorkoutService] Getting workout plans with filters:', filters);
    return [];
  },

  /**
   * Create a workout plan
   */
  async createWorkoutPlan(
    data: {
      name: string;
      description: string;
      dayNumber: number;
      difficulty: string;
      exerciseIds: string[];
    },
    adminId: string
  ): Promise<unknown> {
    console.log(`[AdminWorkoutService] Creating workout plan by admin ${adminId}`);
    return null;
  },

  /**
   * Update a workout plan
   */
  async updateWorkoutPlan(
    planId: string,
    data: Partial<{
      name: string;
      description: string;
      exerciseIds: string[];
    }>,
    adminId: string
  ): Promise<unknown> {
    console.log(`[AdminWorkoutService] Updating workout plan ${planId} by admin ${adminId}`);
    return null;
  },

  /**
   * Duplicate a workout plan to another day
   */
  async duplicateWorkoutPlan(
    planId: string,
    targetDayNumber: number,
    adminId: string
  ): Promise<unknown> {
    console.log(
      `[AdminWorkoutService] Duplicating workout plan ${planId} to day ${targetDayNumber} by admin ${adminId}`
    );
    return null;
  },

  /**
   * Reorder exercises in a workout plan
   */
  async reorderExercises(
    planId: string,
    exerciseOrder: string[],
    adminId: string
  ): Promise<boolean> {
    console.log(`[AdminWorkoutService] Reordering exercises in plan ${planId} by admin ${adminId}`);
    return true;
  },

  /**
   * Delete a workout plan
   */
  async deleteWorkoutPlan(planId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminWorkoutService] Deleting workout plan ${planId} by admin ${adminId}`);
    return true;
  },
};

// ==================== ADMIN MEAL SERVICE ====================

export const AdminMealService = {
  /**
   * Get all meals for admin management
   */
  async getMeals(filters?: {
    status?: ContentStatus;
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    category?: 'light' | 'standard' | 'high_energy';
    hasVideo?: boolean;
    search?: string;
  }): Promise<DBMeal[]> {
    console.log('[AdminMealService] Getting meals with filters:', filters);
    return [];
  },

  /**
   * Create a new meal
   */
  async createMeal(
    data: Omit<DBMeal, 'mealId' | 'createdAt' | 'updatedAt'>,
    adminId: string
  ): Promise<DBMeal | null> {
    console.log(`[AdminMealService] Creating meal by admin ${adminId}`);
    return null;
  },

  /**
   * Update a meal
   */
  async updateMeal(
    mealId: string,
    data: Partial<DBMeal>,
    adminId: string
  ): Promise<DBMeal | null> {
    console.log(`[AdminMealService] Updating meal ${mealId} by admin ${adminId}`);
    return null;
  },

  /**
   * Delete a meal
   */
  async deleteMeal(mealId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminMealService] Deleting meal ${mealId} by admin ${adminId}`);
    return true;
  },

  /**
   * Approve a meal for publishing
   */
  async approveMeal(mealId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminMealService] Approving meal ${mealId} by admin ${adminId}`);
    return true;
  },

  /**
   * Link video to a meal (prep video)
   */
  async linkVideoToMeal(mealId: string, videoId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminMealService] Linking video ${videoId} to meal ${mealId} by admin ${adminId}`);
    return true;
  },

  /**
   * Get meals without prep videos
   */
  async getMealsWithoutVideos(): Promise<DBMeal[]> {
    return this.getMeals({ hasVideo: false });
  },

  /**
   * Update meal nutrition info
   */
  async updateNutrition(
    mealId: string,
    nutrition: NutritionInfo,
    adminId: string
  ): Promise<boolean> {
    console.log(`[AdminMealService] Updating nutrition for meal ${mealId} by admin ${adminId}`);
    return true;
  },

  /**
   * Categorize a meal (light/standard/high_energy)
   */
  async categorizeMeal(
    mealId: string,
    category: 'light' | 'standard' | 'high_energy',
    adminId: string
  ): Promise<boolean> {
    console.log(`[AdminMealService] Categorizing meal ${mealId} as ${category} by admin ${adminId}`);
    return true;
  },
};

// ==================== ADMIN MEAL PLAN SERVICE ====================

export const AdminMealPlanService = {
  /**
   * Get all meal plans
   */
  async getMealPlans(filters?: {
    status?: ContentStatus;
    category?: 'light' | 'standard' | 'high_energy';
    dayNumber?: number;
  }): Promise<DBMealPlan[]> {
    console.log('[AdminMealPlanService] Getting meal plans with filters:', filters);
    return [];
  },

  /**
   * Create a meal plan
   */
  async createMealPlan(
    data: {
      name: string;
      description?: string;
      dayNumber: number;
      category: 'light' | 'standard' | 'high_energy';
      meals: { mealId: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; orderIndex: number }[];
    },
    adminId: string
  ): Promise<DBMealPlan | null> {
    console.log(`[AdminMealPlanService] Creating meal plan by admin ${adminId}`);
    return null;
  },

  /**
   * Update a meal plan
   */
  async updateMealPlan(
    mealPlanId: string,
    data: Partial<{
      name: string;
      description: string;
      meals: { mealId: string; mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'; orderIndex: number }[];
    }>,
    adminId: string
  ): Promise<DBMealPlan | null> {
    console.log(`[AdminMealPlanService] Updating meal plan ${mealPlanId} by admin ${adminId}`);
    return null;
  },

  /**
   * Add meal to plan
   */
  async addMealToPlan(
    mealPlanId: string,
    mealId: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    adminId: string
  ): Promise<boolean> {
    console.log(`[AdminMealPlanService] Adding meal ${mealId} to plan ${mealPlanId} by admin ${adminId}`);
    return true;
  },

  /**
   * Remove meal from plan
   */
  async removeMealFromPlan(
    mealPlanId: string,
    mealId: string,
    adminId: string
  ): Promise<boolean> {
    console.log(`[AdminMealPlanService] Removing meal ${mealId} from plan ${mealPlanId} by admin ${adminId}`);
    return true;
  },

  /**
   * Duplicate meal plan to another day
   */
  async duplicateMealPlan(
    mealPlanId: string,
    targetDayNumber: number,
    adminId: string
  ): Promise<DBMealPlan | null> {
    console.log(`[AdminMealPlanService] Duplicating meal plan ${mealPlanId} to day ${targetDayNumber} by admin ${adminId}`);
    return null;
  },

  /**
   * Calculate and update total nutrition for a meal plan
   */
  async recalculateTotalNutrition(mealPlanId: string): Promise<NutritionInfo | null> {
    console.log(`[AdminMealPlanService] Recalculating nutrition for meal plan ${mealPlanId}`);
    return null;
  },

  /**
   * Delete a meal plan
   */
  async deleteMealPlan(mealPlanId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminMealPlanService] Deleting meal plan ${mealPlanId} by admin ${adminId}`);
    return true;
  },
};

// ==================== ADMIN FASTING SERVICE ====================

export const AdminFastingService = {
  /**
   * Get all fasting plans
   */
  async getFastingPlans(filters?: {
    status?: ContentStatus;
    pattern?: '12:12' | '14:10' | '16:8' | '18:6';
  }): Promise<DBFastingPlan[]> {
    console.log('[AdminFastingService] Getting fasting plans with filters:', filters);
    return [];
  },

  /**
   * Create a fasting plan
   */
  async createFastingPlan(
    data: Omit<DBFastingPlan, 'fastingPlanId' | 'createdAt' | 'updatedAt'>,
    adminId: string
  ): Promise<DBFastingPlan | null> {
    console.log(`[AdminFastingService] Creating fasting plan by admin ${adminId}`);
    return null;
  },

  /**
   * Update a fasting plan
   */
  async updateFastingPlan(
    fastingPlanId: string,
    data: Partial<DBFastingPlan>,
    adminId: string
  ): Promise<DBFastingPlan | null> {
    console.log(`[AdminFastingService] Updating fasting plan ${fastingPlanId} by admin ${adminId}`);
    return null;
  },

  /**
   * Delete a fasting plan
   */
  async deleteFastingPlan(fastingPlanId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminFastingService] Deleting fasting plan ${fastingPlanId} by admin ${adminId}`);
    return true;
  },

  /**
   * Approve a fasting plan for publishing
   */
  async approveFastingPlan(fastingPlanId: string, adminId: string): Promise<boolean> {
    console.log(`[AdminFastingService] Approving fasting plan ${fastingPlanId} by admin ${adminId}`);
    return true;
  },

  /**
   * Update personalization rules for a fasting plan
   */
  async updatePersonalizationRules(
    fastingPlanId: string,
    assignedWorkTypes: ('sedentary' | 'moderate' | 'active')[],
    weightThreshold: { operator: 'gte' | 'lt'; valueKg: number } | null,
    adminId: string
  ): Promise<boolean> {
    console.log(
      `[AdminFastingService] Updating personalization rules for plan ${fastingPlanId} by admin ${adminId}`
    );
    return true;
  },

  /**
   * Update eating window times
   */
  async updateEatingWindow(
    fastingPlanId: string,
    startTime: string, // HH:mm format
    endTime: string,
    adminId: string
  ): Promise<boolean> {
    console.log(
      `[AdminFastingService] Updating eating window for plan ${fastingPlanId} to ${startTime}-${endTime} by admin ${adminId}`
    );
    return true;
  },

  /**
   * Get fasting plans assigned to a specific work type
   */
  async getFastingPlansForWorkType(workType: 'sedentary' | 'moderate' | 'active'): Promise<DBFastingPlan[]> {
    console.log(`[AdminFastingService] Getting fasting plans for work type: ${workType}`);
    return [];
  },

  /**
   * Get recommended fasting plan based on user attributes
   */
  async getRecommendedFastingPlan(
    workType: 'sedentary' | 'moderate' | 'active',
    weightKg: number
  ): Promise<DBFastingPlan | null> {
    console.log(`[AdminFastingService] Getting recommended plan for ${workType}, ${weightKg}kg`);
    return null;
  },

  /**
   * Get default fasting plan patterns
   */
  getDefaultPatterns(): { pattern: string; fastingHours: number; eatingHours: number; description: string }[] {
    return [
      { pattern: '12:12', fastingHours: 12, eatingHours: 12, description: 'Beginner-friendly 12-hour fasting window' },
      { pattern: '14:10', fastingHours: 14, eatingHours: 10, description: 'Moderate 14-hour fasting window' },
      { pattern: '16:8', fastingHours: 16, eatingHours: 8, description: 'Popular 16-hour fasting window' },
      { pattern: '18:6', fastingHours: 18, eatingHours: 6, description: 'Advanced 18-hour fasting window' },
    ];
  },
};

export default {
  video: AdminVideoService,
  exercise: AdminExerciseService,
  workout: AdminWorkoutService,
  meal: AdminMealService,
  mealPlan: AdminMealPlanService,
  fasting: AdminFastingService,
};

import type {
  Exercise,
  WorkoutPlan,
  Meal,
  MealPlan,
  FastingWindow,
  FastingPlan,
  DailyPlan,
  DifficultyLevel,
  MealIntensity,
  NutritionInfo,
} from '@/types/fitness';

// ==================== EXERCISES ====================
export const exercises: Exercise[] = [
  {
    id: 'ex-1',
    name: 'Push-Ups',
    description: 'Classic bodyweight exercise targeting chest, shoulders, and triceps.',
    instructions: [
      'Start in a plank position with hands slightly wider than shoulder-width',
      'Keep your body in a straight line from head to heels',
      'Lower your chest toward the floor by bending your elbows',
      'Push back up to the starting position',
      'Keep core engaged throughout the movement',
    ],
    videoUrl: 'https://example.com/videos/pushups.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '10-15',
    restTime: 60,
    calories: 50,
  },
  {
    id: 'ex-2',
    name: 'Squats',
    description: 'Fundamental lower body exercise for legs and glutes.',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Keep your chest up and core engaged',
      'Lower your body as if sitting back into a chair',
      'Go down until thighs are parallel to the floor',
      'Push through heels to return to standing',
    ],
    videoUrl: 'https://example.com/videos/squats.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 15,
    restTime: 60,
    calories: 60,
  },
  {
    id: 'ex-3',
    name: 'Plank',
    description: 'Core stabilization exercise that strengthens the entire midsection.',
    instructions: [
      'Start in a forearm plank position',
      'Keep elbows directly under shoulders',
      'Maintain a straight line from head to heels',
      'Engage your core and squeeze your glutes',
      'Hold the position without letting hips sag',
    ],
    videoUrl: 'https://example.com/videos/plank.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    duration: 30,
    restTime: 45,
    calories: 25,
  },
  {
    id: 'ex-4',
    name: 'Lunges',
    description: 'Unilateral leg exercise for balance and lower body strength.',
    instructions: [
      'Stand tall with feet hip-width apart',
      'Step forward with one leg',
      'Lower your hips until both knees are bent at 90 degrees',
      'Keep front knee over ankle, not past toes',
      'Push back to starting position and alternate legs',
    ],
    videoUrl: 'https://example.com/videos/lunges.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '12 each leg',
    restTime: 60,
    calories: 55,
  },
  {
    id: 'ex-5',
    name: 'Mountain Climbers',
    description: 'High-intensity cardio exercise that also works the core.',
    instructions: [
      'Start in a high plank position',
      'Drive one knee toward your chest',
      'Quickly switch legs, running in place',
      'Keep hips low and core engaged',
      'Maintain a steady, controlled pace',
    ],
    videoUrl: 'https://example.com/videos/mountain-climbers.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
    muscleGroups: ['core', 'cardio'],
    type: 'hiit',
    difficulty: 'intermediate',
    sets: 3,
    duration: 30,
    restTime: 30,
    calories: 80,
  },
  {
    id: 'ex-6',
    name: 'Burpees',
    description: 'Full-body explosive exercise combining squat, plank, and jump.',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Drop into a squat and place hands on the floor',
      'Jump feet back into a plank position',
      'Perform a push-up (optional)',
      'Jump feet back to squat and explode upward',
    ],
    videoUrl: 'https://example.com/videos/burpees.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    muscleGroups: ['full_body', 'cardio'],
    type: 'hiit',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 60,
    calories: 100,
  },
  {
    id: 'ex-7',
    name: 'Dumbbell Rows',
    description: 'Back strengthening exercise using dumbbells.',
    instructions: [
      'Place one knee and hand on a bench',
      'Hold dumbbell in opposite hand, arm extended',
      'Pull dumbbell toward hip, squeezing shoulder blade',
      'Lower with control to starting position',
      'Complete all reps before switching sides',
    ],
    videoUrl: 'https://example.com/videos/rows.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400',
    muscleGroups: ['back', 'biceps'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 45,
  },
  {
    id: 'ex-8',
    name: 'Bicycle Crunches',
    description: 'Dynamic core exercise targeting obliques and abs.',
    instructions: [
      'Lie on your back with hands behind head',
      'Lift shoulders off the ground',
      'Bring one knee toward chest while extending other leg',
      'Rotate torso to bring opposite elbow to knee',
      'Alternate sides in a cycling motion',
    ],
    videoUrl: 'https://example.com/videos/bicycle-crunches.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 20,
    restTime: 45,
    calories: 35,
  },
];

// ==================== WORKOUT PLANS ====================
export const workoutPlans: WorkoutPlan[] = [
  {
    id: 'wp-1',
    name: 'Morning Energizer',
    description: 'Start your day with this full-body workout to boost energy and metabolism.',
    dayOfWeek: 1, // Monday
    exercises: [exercises[0], exercises[1], exercises[2], exercises[4]],
    totalDuration: 30,
    difficulty: 'beginner',
    muscleGroups: ['full_body', 'core', 'legs'],
    estimatedCalories: 215,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400',
  },
  {
    id: 'wp-2',
    name: 'Upper Body Strength',
    description: 'Build upper body strength with this targeted chest and back workout.',
    dayOfWeek: 2, // Tuesday
    exercises: [exercises[0], exercises[6], exercises[2]],
    totalDuration: 35,
    difficulty: 'intermediate',
    muscleGroups: ['chest', 'back', 'core'],
    estimatedCalories: 180,
    thumbnailUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400',
  },
  {
    id: 'wp-3',
    name: 'Lower Body Power',
    description: 'Sculpt and strengthen your legs and glutes with this powerful workout.',
    dayOfWeek: 3, // Wednesday
    exercises: [exercises[1], exercises[3], exercises[4]],
    totalDuration: 35,
    difficulty: 'intermediate',
    muscleGroups: ['legs', 'glutes', 'cardio'],
    estimatedCalories: 195,
    thumbnailUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400',
  },
  {
    id: 'wp-4',
    name: 'Core Crusher',
    description: 'Intense core-focused session to build a strong and stable midsection.',
    dayOfWeek: 4, // Thursday
    exercises: [exercises[2], exercises[7], exercises[4]],
    totalDuration: 25,
    difficulty: 'intermediate',
    muscleGroups: ['core', 'cardio'],
    estimatedCalories: 140,
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
  },
  {
    id: 'wp-5',
    name: 'HIIT Blast',
    description: 'High-intensity interval training to maximize calorie burn.',
    dayOfWeek: 5, // Friday
    exercises: [exercises[5], exercises[4], exercises[1], exercises[0]],
    totalDuration: 25,
    difficulty: 'advanced',
    muscleGroups: ['full_body', 'cardio'],
    estimatedCalories: 290,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400',
  },
  {
    id: 'wp-6',
    name: 'Active Recovery',
    description: 'Light stretching and mobility work for active rest day.',
    dayOfWeek: 6, // Saturday
    exercises: [exercises[2]],
    totalDuration: 20,
    difficulty: 'beginner',
    muscleGroups: ['full_body'],
    estimatedCalories: 50,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
  },
];

// ==================== MEALS ====================
export const meals: Meal[] = [
  // Breakfasts
  {
    id: 'meal-1',
    name: 'Protein Power Bowl',
    description: 'Greek yogurt with berries, nuts, and honey for sustained energy.',
    type: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400',
    ingredients: [
      { name: 'Greek yogurt', amount: '200g', calories: 130 },
      { name: 'Mixed berries', amount: '100g', calories: 50 },
      { name: 'Almonds', amount: '30g', calories: 170 },
      { name: 'Honey', amount: '1 tbsp', calories: 60 },
      { name: 'Chia seeds', amount: '1 tbsp', calories: 50 },
    ],
    instructions: [
      'Add Greek yogurt to a bowl',
      'Top with mixed berries',
      'Sprinkle almonds and chia seeds',
      'Drizzle with honey',
    ],
    prepTime: 5,
    servings: 1,
    nutrition: {
      calories: 460,
      protein: 25,
      carbs: 40,
      fat: 22,
      fiber: 8,
    },
    dietaryTags: ['vegetarian', 'high_protein'],
  },
  {
    id: 'meal-2',
    name: 'Avocado Toast with Eggs',
    description: 'Whole grain toast topped with smashed avocado and poached eggs.',
    type: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    ingredients: [
      { name: 'Whole grain bread', amount: '2 slices', calories: 160 },
      { name: 'Avocado', amount: '1/2', calories: 160 },
      { name: 'Eggs', amount: '2 large', calories: 140 },
      { name: 'Cherry tomatoes', amount: '6', calories: 20 },
      { name: 'Salt & pepper', amount: 'to taste', calories: 0 },
    ],
    instructions: [
      'Toast the bread until golden',
      'Mash avocado with salt and pepper',
      'Poach eggs in simmering water',
      'Spread avocado on toast, top with eggs',
      'Garnish with halved cherry tomatoes',
    ],
    prepTime: 10,
    cookTime: 5,
    servings: 1,
    nutrition: {
      calories: 480,
      protein: 20,
      carbs: 35,
      fat: 30,
      fiber: 10,
    },
    dietaryTags: ['vegetarian', 'high_protein'],
  },
  // Lunches
  {
    id: 'meal-3',
    name: 'Grilled Chicken Salad',
    description: 'Fresh mixed greens with grilled chicken, vegetables, and balsamic dressing.',
    type: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    ingredients: [
      { name: 'Chicken breast', amount: '150g', calories: 165 },
      { name: 'Mixed greens', amount: '100g', calories: 20 },
      { name: 'Cherry tomatoes', amount: '100g', calories: 18 },
      { name: 'Cucumber', amount: '100g', calories: 15 },
      { name: 'Feta cheese', amount: '30g', calories: 75 },
      { name: 'Balsamic vinaigrette', amount: '2 tbsp', calories: 90 },
    ],
    instructions: [
      'Season and grill chicken until cooked through',
      'Let chicken rest, then slice',
      'Arrange greens on a plate',
      'Add tomatoes, cucumber, and chicken',
      'Crumble feta on top and drizzle dressing',
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    nutrition: {
      calories: 383,
      protein: 40,
      carbs: 15,
      fat: 18,
      fiber: 4,
    },
    dietaryTags: ['high_protein', 'low_carb'],
  },
  {
    id: 'meal-4',
    name: 'Quinoa Buddha Bowl',
    description: 'Nutrient-packed bowl with quinoa, roasted vegetables, and tahini.',
    type: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ingredients: [
      { name: 'Quinoa', amount: '100g cooked', calories: 120 },
      { name: 'Chickpeas', amount: '100g', calories: 164 },
      { name: 'Sweet potato', amount: '100g', calories: 86 },
      { name: 'Kale', amount: '50g', calories: 25 },
      { name: 'Tahini', amount: '2 tbsp', calories: 180 },
    ],
    instructions: [
      'Cook quinoa according to package directions',
      'Roast chickpeas and sweet potato at 400°F',
      'Massage kale with olive oil',
      'Assemble bowl with all ingredients',
      'Drizzle tahini dressing on top',
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 1,
    nutrition: {
      calories: 575,
      protein: 18,
      carbs: 65,
      fat: 26,
      fiber: 14,
    },
    dietaryTags: ['vegan', 'vegetarian', 'high_protein'],
  },
  // Dinners
  {
    id: 'meal-5',
    name: 'Salmon with Asparagus',
    description: 'Pan-seared salmon with roasted asparagus and lemon butter.',
    type: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    ingredients: [
      { name: 'Salmon fillet', amount: '170g', calories: 350 },
      { name: 'Asparagus', amount: '150g', calories: 30 },
      { name: 'Lemon', amount: '1/2', calories: 10 },
      { name: 'Butter', amount: '1 tbsp', calories: 100 },
      { name: 'Garlic', amount: '2 cloves', calories: 8 },
    ],
    instructions: [
      'Season salmon with salt and pepper',
      'Pan-sear salmon skin-side down 4 min',
      'Flip and cook 3 more minutes',
      'Roast asparagus with garlic at 400°F',
      'Serve with lemon butter drizzle',
    ],
    prepTime: 10,
    cookTime: 20,
    servings: 1,
    nutrition: {
      calories: 498,
      protein: 42,
      carbs: 8,
      fat: 32,
      fiber: 3,
    },
    dietaryTags: ['high_protein', 'low_carb', 'keto'],
  },
  {
    id: 'meal-6',
    name: 'Turkey Stir-Fry',
    description: 'Lean turkey with colorful vegetables in a savory sauce.',
    type: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400',
    ingredients: [
      { name: 'Ground turkey', amount: '150g', calories: 195 },
      { name: 'Bell peppers', amount: '100g', calories: 30 },
      { name: 'Broccoli', amount: '100g', calories: 55 },
      { name: 'Brown rice', amount: '100g cooked', calories: 110 },
      { name: 'Soy sauce', amount: '2 tbsp', calories: 20 },
    ],
    instructions: [
      'Cook brown rice according to package',
      'Brown turkey in a hot wok',
      'Add vegetables and stir-fry 5 minutes',
      'Add soy sauce and toss to coat',
      'Serve over brown rice',
    ],
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    nutrition: {
      calories: 410,
      protein: 38,
      carbs: 35,
      fat: 12,
      fiber: 6,
    },
    dietaryTags: ['high_protein', 'dairy_free'],
  },
  // Snacks
  {
    id: 'meal-7',
    name: 'Protein Smoothie',
    description: 'Creamy banana and peanut butter protein shake.',
    type: 'snack',
    imageUrl: 'https://images.unsplash.com/photo-1553530666-ba11a90a0819?w=400',
    ingredients: [
      { name: 'Banana', amount: '1 medium', calories: 105 },
      { name: 'Peanut butter', amount: '2 tbsp', calories: 190 },
      { name: 'Protein powder', amount: '1 scoop', calories: 120 },
      { name: 'Almond milk', amount: '250ml', calories: 30 },
    ],
    instructions: [
      'Add all ingredients to blender',
      'Blend until smooth',
      'Add ice if desired',
      'Pour and enjoy immediately',
    ],
    prepTime: 5,
    servings: 1,
    nutrition: {
      calories: 445,
      protein: 32,
      carbs: 40,
      fat: 18,
      fiber: 5,
    },
    dietaryTags: ['vegetarian', 'high_protein', 'dairy_free'],
  },
  {
    id: 'meal-8',
    name: 'Mixed Nuts & Fruit',
    description: 'Energy-boosting mix of nuts and dried fruit.',
    type: 'snack',
    imageUrl: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400',
    ingredients: [
      { name: 'Almonds', amount: '20g', calories: 115 },
      { name: 'Walnuts', amount: '15g', calories: 98 },
      { name: 'Dried cranberries', amount: '15g', calories: 45 },
      { name: 'Dark chocolate chips', amount: '10g', calories: 50 },
    ],
    instructions: ['Mix all ingredients in a container', 'Portion and enjoy'],
    prepTime: 2,
    servings: 1,
    nutrition: {
      calories: 308,
      protein: 8,
      carbs: 20,
      fat: 23,
      fiber: 4,
    },
    dietaryTags: ['vegan', 'vegetarian'],
  },
];

// ==================== MEAL PLANS ====================
export const mealPlans: MealPlan[] = [
  {
    id: 'mp-1',
    dayOfWeek: 1, // Monday
    meals: [meals[0], meals[2], meals[4], meals[7]],
    totalNutrition: {
      calories: 1649,
      protein: 115,
      carbs: 83,
      fat: 95,
      fiber: 19,
    },
  },
  {
    id: 'mp-2',
    dayOfWeek: 2, // Tuesday
    meals: [meals[1], meals[3], meals[5], meals[6]],
    totalNutrition: {
      calories: 1910,
      protein: 108,
      carbs: 175,
      fat: 86,
      fiber: 35,
    },
  },
  {
    id: 'mp-3',
    dayOfWeek: 3, // Wednesday
    meals: [meals[0], meals[3], meals[4], meals[7]],
    totalNutrition: {
      calories: 1841,
      protein: 93,
      carbs: 133,
      fat: 103,
      fiber: 29,
    },
  },
  {
    id: 'mp-4',
    dayOfWeek: 4, // Thursday
    meals: [meals[1], meals[2], meals[5], meals[6]],
    totalNutrition: {
      calories: 1718,
      protein: 130,
      carbs: 125,
      fat: 78,
      fiber: 25,
    },
  },
  {
    id: 'mp-5',
    dayOfWeek: 5, // Friday
    meals: [meals[0], meals[2], meals[5], meals[7]],
    totalNutrition: {
      calories: 1561,
      protein: 121,
      carbs: 110,
      fat: 75,
      fiber: 22,
    },
  },
  {
    id: 'mp-6',
    dayOfWeek: 6, // Saturday
    meals: [meals[1], meals[3], meals[4], meals[6]],
    totalNutrition: {
      calories: 1998,
      protein: 112,
      carbs: 148,
      fat: 106,
      fiber: 32,
    },
  },
  {
    id: 'mp-7',
    dayOfWeek: 0, // Sunday
    meals: [meals[0], meals[3], meals[5], meals[7]],
    totalNutrition: {
      calories: 1753,
      protein: 99,
      carbs: 160,
      fat: 79,
      fiber: 32,
    },
  },
];

// ==================== FASTING WINDOWS ====================
export const fastingWindows: Record<FastingPlan, Omit<FastingWindow, 'plan'>> = {
  '12:12': {
    fastingHours: 12,
    eatingHours: 12,
    eatingStartTime: '08:00',
    eatingEndTime: '20:00',
    fastingStartTime: '20:00',
    fastingEndTime: '08:00',
  },
  '14:10': {
    fastingHours: 14,
    eatingHours: 10,
    eatingStartTime: '10:00',
    eatingEndTime: '20:00',
    fastingStartTime: '20:00',
    fastingEndTime: '10:00',
  },
  '16:8': {
    fastingHours: 16,
    eatingHours: 8,
    eatingStartTime: '12:00',
    eatingEndTime: '20:00',
    fastingStartTime: '20:00',
    fastingEndTime: '12:00',
  },
  '18:6': {
    fastingHours: 18,
    eatingHours: 6,
    eatingStartTime: '14:00',
    eatingEndTime: '20:00',
    fastingStartTime: '20:00',
    fastingEndTime: '14:00',
  },
};

// ==================== HELPER FUNCTIONS ====================
export function getWorkoutForDay(dayOfWeek: number): WorkoutPlan | null {
  return workoutPlans.find((wp) => wp.dayOfWeek === dayOfWeek) ?? null;
}

export function getMealPlanForDay(dayOfWeek: number): MealPlan | null {
  return mealPlans.find((mp) => mp.dayOfWeek === dayOfWeek) ?? null;
}

export function getFastingWindow(plan: FastingPlan): FastingWindow {
  return {
    plan,
    ...fastingWindows[plan],
  };
}

export function getDailyPlan(date: Date): DailyPlan {
  const dayOfWeek = date.getDay();
  const isRestDay = dayOfWeek === 0; // Sunday is rest day

  return {
    id: `daily-${date.toISOString().split('T')[0]}`,
    date: date.toISOString().split('T')[0],
    workout: isRestDay ? null : getWorkoutForDay(dayOfWeek),
    meals: getMealPlanForDay(dayOfWeek),
    fasting: null, // Will be set based on user profile
    isRestDay,
  };
}

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((ex) => ex.id === id);
}

export function getMealById(id: string): Meal | undefined {
  // First check in local meals array
  const localMeal = meals.find((m) => m.id === id);
  if (localMeal) return localMeal;

  // If not found, check in Nigerian meal database (used by personalized plan engine)
  // Dynamic import to avoid circular dependencies
  try {
    const { NIGERIAN_MEAL_DATABASE } = require('@/lib/services/personalized-plan-engine');
    return NIGERIAN_MEAL_DATABASE.find((m: Meal) => m.id === id);
  } catch {
    return undefined;
  }
}

export function getWorkoutById(id: string): WorkoutPlan | undefined {
  return workoutPlans.find((wp) => wp.id === id);
}

// Legacy function - kept for backward compatibility
// New code should use calculatePersonalization from user-store.ts
export function getRecommendedFastingPlan(
  weight: number,
  workType: 'sedentary' | 'moderate' | 'active'
): FastingPlan {
  // Use the rules defined in types/fitness.ts
  const thresholds = { sedentary: 80, moderate: 85, active: 90 };
  const isHigherWeight = weight >= thresholds[workType];

  const rules: Record<string, Record<string, FastingPlan>> = {
    sedentary: { higher: '14:10', lower: '16:8' },
    moderate: { higher: '14:10', lower: '16:8' },
    active: { higher: '12:12', lower: '12:12' },
  };

  return rules[workType][isHigherWeight ? 'higher' : 'lower'];
}

// ==================== PERSONALIZED DAILY PLAN GENERATOR ====================

// Difficulty mapping: which difficulty levels are allowed per user difficulty
const ALLOWED_DIFFICULTIES: Record<DifficultyLevel, DifficultyLevel[]> = {
  beginner: ['beginner'],
  intermediate: ['beginner', 'intermediate'],
  advanced: ['beginner', 'intermediate', 'advanced'],
};

// Calorie targets by meal intensity (per day)
const CALORIE_TARGETS: Record<MealIntensity, { min: number; max: number }> = {
  light: { min: 1400, max: 1700 },
  standard: { min: 1700, max: 2000 },
  high_energy: { min: 2000, max: 2500 },
};

/**
 * Get workouts filtered by user's workout difficulty
 */
export function getWorkoutsForDifficulty(userDifficulty?: DifficultyLevel): WorkoutPlan[] {
  const difficulty = userDifficulty ?? 'beginner';
  const allowedLevels = ALLOWED_DIFFICULTIES[difficulty];
  return workoutPlans.filter((wp) => allowedLevels.includes(wp.difficulty));
}

/**
 * Get a specific day's workout based on difficulty
 * Returns the best matching workout for the day, or null if rest day
 */
export function getWorkoutForDayWithDifficulty(
  dayOfWeek: number,
  userDifficulty?: DifficultyLevel
): WorkoutPlan | null {
  // Sunday is rest day
  if (dayOfWeek === 0) return null;

  const difficulty = userDifficulty ?? 'beginner';
  const allowedLevels = ALLOWED_DIFFICULTIES[difficulty];

  // First try exact day match with allowed difficulty
  const exactMatch = workoutPlans.find(
    (wp) => wp.dayOfWeek === dayOfWeek && allowedLevels.includes(wp.difficulty)
  );
  if (exactMatch) return exactMatch;

  // If no exact match, find any workout with allowed difficulty
  // This ensures users always get a workout they can do
  const fallback = workoutPlans.find((wp) => allowedLevels.includes(wp.difficulty));
  return fallback ?? null;
}

/**
 * Calculate total nutrition for a meal plan
 */
function calculateTotalNutrition(mealsArr: Meal[]): NutritionInfo {
  return mealsArr.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.nutrition.calories,
      protein: acc.protein + meal.nutrition.protein,
      carbs: acc.carbs + meal.nutrition.carbs,
      fat: acc.fat + meal.nutrition.fat,
      fiber: (acc.fiber ?? 0) + (meal.nutrition.fiber ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 }
  );
}

/**
 * Generate a meal plan based on meal intensity
 * Selects appropriate meals to hit calorie targets
 */
export function getMealPlanForIntensity(
  dayOfWeek: number,
  mealIntensity?: MealIntensity
): MealPlan {
  const intensity = mealIntensity ?? 'standard';

  // Get meals by type
  const breakfasts = meals.filter((m) => m.type === 'breakfast');
  const lunches = meals.filter((m) => m.type === 'lunch');
  const dinners = meals.filter((m) => m.type === 'dinner');
  const snacks = meals.filter((m) => m.type === 'snack');

  // Select meals based on intensity
  // For light: choose lower calorie options
  // For standard: balanced options
  // For high_energy: higher calorie, more protein

  let selectedBreakfast: Meal;
  let selectedLunch: Meal;
  let selectedDinner: Meal;
  let selectedSnack: Meal;

  if (intensity === 'light') {
    // Sort by calories ascending, pick lower calorie options
    selectedBreakfast = [...breakfasts].sort((a, b) => a.nutrition.calories - b.nutrition.calories)[dayOfWeek % breakfasts.length];
    selectedLunch = [...lunches].sort((a, b) => a.nutrition.calories - b.nutrition.calories)[dayOfWeek % lunches.length];
    selectedDinner = [...dinners].sort((a, b) => a.nutrition.calories - b.nutrition.calories)[dayOfWeek % dinners.length];
    selectedSnack = [...snacks].sort((a, b) => a.nutrition.calories - b.nutrition.calories)[dayOfWeek % snacks.length];
  } else if (intensity === 'high_energy') {
    // Sort by protein and calories descending, pick higher options
    selectedBreakfast = [...breakfasts].sort((a, b) => b.nutrition.protein - a.nutrition.protein)[dayOfWeek % breakfasts.length];
    selectedLunch = [...lunches].sort((a, b) => b.nutrition.protein - a.nutrition.protein)[dayOfWeek % lunches.length];
    selectedDinner = [...dinners].sort((a, b) => b.nutrition.protein - a.nutrition.protein)[dayOfWeek % dinners.length];
    selectedSnack = [...snacks].sort((a, b) => b.nutrition.protein - a.nutrition.protein)[dayOfWeek % snacks.length];
  } else {
    // Standard: use default meal plans
    selectedBreakfast = breakfasts[dayOfWeek % breakfasts.length];
    selectedLunch = lunches[dayOfWeek % lunches.length];
    selectedDinner = dinners[dayOfWeek % dinners.length];
    selectedSnack = snacks[dayOfWeek % snacks.length];
  }

  const selectedMeals = [selectedBreakfast, selectedLunch, selectedDinner, selectedSnack];

  return {
    id: `mp-personalized-${dayOfWeek}-${intensity}`,
    dayOfWeek,
    meals: selectedMeals,
    totalNutrition: calculateTotalNutrition(selectedMeals),
  };
}

/**
 * Generate a personalized daily plan based on user's settings
 */
export function getPersonalizedDailyPlan(
  date: Date,
  userDifficulty?: DifficultyLevel,
  mealIntensity?: MealIntensity,
  fastingPlan?: FastingPlan
): DailyPlan {
  const dayOfWeek = date.getDay();
  const isRestDay = dayOfWeek === 0;
  const fasting = fastingPlan ?? '16:8';

  return {
    id: `daily-${date.toISOString().split('T')[0]}`,
    date: date.toISOString().split('T')[0],
    workout: isRestDay ? null : getWorkoutForDayWithDifficulty(dayOfWeek, userDifficulty),
    meals: getMealPlanForIntensity(dayOfWeek, mealIntensity),
    fasting: getFastingWindow(fasting),
    isRestDay,
  };
}

/**
 * Get a week's worth of personalized daily plans
 */
export function getPersonalizedWeeklyPlan(
  startDate: Date,
  userDifficulty?: DifficultyLevel,
  mealIntensity?: MealIntensity,
  fastingPlan?: FastingPlan
): DailyPlan[] {
  const plans: DailyPlan[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    plans.push(
      getPersonalizedDailyPlan(
        currentDate,
        userDifficulty,
        mealIntensity,
        fastingPlan
      )
    );
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return plans;
}

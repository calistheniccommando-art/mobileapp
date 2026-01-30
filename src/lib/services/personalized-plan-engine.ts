/**
 * PERSONALIZED PLAN ENGINE
 *
 * Generates personalized exercises, fasting plans, and meal assignments
 * based on comprehensive user onboarding data including:
 * - Gender, age, BMI, body type
 * - Fitness level (strength & stamina scores)
 * - Primary goal (build muscle, lose weight, etc.)
 * - Metabolic tendencies and obstacles
 * - Training frequency and duration preferences
 *
 * Key Rules:
 * - Never recommend 3 meals/day
 * - Very overweight users: 1-2 meals/day with intermittent fasting
 * - Exercises are categorized into difficulty tiers
 * - Sequential execution enforced (no skipping)
 * - Progressive overload over weeks
 */

import type {
  Exercise,
  WorkoutPlan,
  Meal,
  MealPlan,
  FastingPlan,
  FastingWindow,
  NutritionInfo,
  DifficultyLevel,
  MealIntensity,
  MuscleGroup,
} from '@/types/fitness';
import type {
  CommandoOnboardingData,
  FitnessAssessment,
  UserGender,
  PrimaryGoal,
  BodyType,
  ProblemArea,
  ActivityLevel,
  MetabolicType,
  TrainingFrequency,
  WorkoutDuration,
  WorkoutTime,
} from '@/types/commando';

// ==================== EXERCISE DATA ====================

/**
 * Comprehensive exercise database with difficulty tiers
 * - Beginner: 25+ exercises
 * - Intermediate: 20 exercises
 * - Advanced: 20+ exercises
 */
export const EXERCISE_DATABASE: Exercise[] = [
  // ==================== BEGINNER EXERCISES (25+) ====================
  // Upper Body - Beginner
  {
    id: 'beg-pushup-wall',
    name: 'Wall Push-Ups',
    description: 'Beginner-friendly push-up against a wall.',
    instructions: [
      'Stand arm\'s length from wall',
      'Place hands on wall at shoulder height',
      'Lean forward and push back',
      'Keep body straight throughout',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 45,
    calories: 25,
  },
  {
    id: 'beg-pushup-knee',
    name: 'Knee Push-Ups',
    description: 'Modified push-up on knees for building strength.',
    instructions: [
      'Start on hands and knees',
      'Walk hands forward, keep hips lowered',
      'Lower chest toward floor',
      'Push back up to starting position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 10,
    restTime: 45,
    calories: 30,
  },
  {
    id: 'beg-pushup-incline',
    name: 'Incline Push-Ups',
    description: 'Push-ups with hands elevated on a bench or step.',
    instructions: [
      'Place hands on elevated surface',
      'Body forms a straight line',
      'Lower chest toward surface',
      'Push back to start',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 45,
    calories: 35,
  },
  {
    id: 'beg-tricep-dip-bench',
    name: 'Bench Tricep Dips',
    description: 'Tricep dips using a bench or chair for support.',
    instructions: [
      'Sit on edge of bench, hands beside hips',
      'Slide forward, supporting weight on arms',
      'Lower body by bending elbows',
      'Push back up to start',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['triceps', 'shoulders'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 10,
    restTime: 45,
    calories: 30,
  },
  // Core - Beginner
  {
    id: 'beg-plank-forearm',
    name: 'Forearm Plank',
    description: 'Core stabilization on forearms.',
    instructions: [
      'Rest on forearms and toes',
      'Keep body in straight line',
      'Engage core and glutes',
      'Hold position without sagging',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    duration: 20,
    restTime: 30,
    calories: 20,
  },
  {
    id: 'beg-dead-bug',
    name: 'Dead Bug',
    description: 'Core exercise maintaining neutral spine.',
    instructions: [
      'Lie on back, arms toward ceiling',
      'Lift legs to 90-degree angle',
      'Lower opposite arm and leg',
      'Return and alternate sides',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '8 each side',
    restTime: 30,
    calories: 25,
  },
  {
    id: 'beg-bird-dog',
    name: 'Bird Dog',
    description: 'Core and back stabilization exercise.',
    instructions: [
      'Start on hands and knees',
      'Extend opposite arm and leg',
      'Keep back flat, hold briefly',
      'Return and switch sides',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core', 'back'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '10 each side',
    restTime: 30,
    calories: 20,
  },
  {
    id: 'beg-crunch',
    name: 'Basic Crunch',
    description: 'Classic abdominal exercise.',
    instructions: [
      'Lie on back, knees bent',
      'Hands behind head or across chest',
      'Lift shoulders off floor',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 15,
    restTime: 30,
    calories: 25,
  },
  {
    id: 'beg-side-plank-knee',
    name: 'Side Plank (Knee)',
    description: 'Modified side plank with knee support.',
    instructions: [
      'Lie on side, prop on elbow',
      'Bottom knee bent for support',
      'Lift hips off floor',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 2,
    duration: 15,
    restTime: 30,
    calories: 15,
  },
  // Lower Body - Beginner
  {
    id: 'beg-squat-bodyweight',
    name: 'Bodyweight Squat',
    description: 'Fundamental lower body movement.',
    instructions: [
      'Stand feet shoulder-width apart',
      'Lower as if sitting in chair',
      'Keep chest up, knees over toes',
      'Stand back up',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 45,
    calories: 40,
  },
  {
    id: 'beg-wall-sit',
    name: 'Wall Sit',
    description: 'Isometric leg exercise against wall.',
    instructions: [
      'Lean against wall, slide down',
      'Thighs parallel to floor',
      'Knees at 90 degrees',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    duration: 30,
    restTime: 45,
    calories: 30,
  },
  {
    id: 'beg-glute-bridge',
    name: 'Glute Bridge',
    description: 'Hip thrust for glute activation.',
    instructions: [
      'Lie on back, knees bent',
      'Feet flat on floor',
      'Lift hips toward ceiling',
      'Squeeze glutes at top',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['glutes', 'core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 15,
    restTime: 30,
    calories: 30,
  },
  {
    id: 'beg-calf-raise',
    name: 'Standing Calf Raises',
    description: 'Simple calf strengthening exercise.',
    instructions: [
      'Stand on flat surface',
      'Rise up on toes',
      'Hold briefly at top',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 15,
    restTime: 30,
    calories: 20,
  },
  {
    id: 'beg-step-up',
    name: 'Step Ups',
    description: 'Functional leg exercise using a step.',
    instructions: [
      'Stand facing step or bench',
      'Step up with one leg',
      'Bring other leg up',
      'Step down and alternate',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '10 each leg',
    restTime: 45,
    calories: 40,
  },
  {
    id: 'beg-lying-leg-raise',
    name: 'Lying Leg Raises',
    description: 'Lower ab exercise lying on back.',
    instructions: [
      'Lie flat on back',
      'Legs straight, hands under hips',
      'Lift legs toward ceiling',
      'Lower slowly without touching floor',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 10,
    restTime: 30,
    calories: 25,
  },
  {
    id: 'beg-hip-circle',
    name: 'Hip Circles',
    description: 'Hip mobility exercise on all fours.',
    instructions: [
      'Start on hands and knees',
      'Lift one knee to the side',
      'Draw circles with knee',
      'Switch directions, then legs',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['glutes'],
    type: 'flexibility',
    difficulty: 'beginner',
    sets: 2,
    reps: '10 each direction',
    restTime: 30,
    calories: 15,
  },
  {
    id: 'beg-superman',
    name: 'Superman',
    description: 'Back extension exercise on floor.',
    instructions: [
      'Lie face down, arms extended',
      'Lift arms, chest, and legs',
      'Hold briefly at top',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['back', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: 12,
    restTime: 30,
    calories: 25,
  },
  {
    id: 'beg-reverse-lunge',
    name: 'Reverse Lunges',
    description: 'Step-back lunge for balance and strength.',
    instructions: [
      'Stand tall, feet together',
      'Step one leg back',
      'Lower until both knees at 90°',
      'Push back to start',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '10 each leg',
    restTime: 45,
    calories: 40,
  },
  // Cardio - Beginner
  {
    id: 'beg-march-in-place',
    name: 'March in Place',
    description: 'Low-impact cardio warm-up.',
    instructions: [
      'Stand tall with good posture',
      'Lift knees alternately',
      'Pump arms naturally',
      'Maintain steady pace',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
    muscleGroups: ['cardio'],
    type: 'cardio',
    difficulty: 'beginner',
    sets: 1,
    duration: 60,
    restTime: 30,
    calories: 30,
  },
  {
    id: 'beg-jumping-jacks-low',
    name: 'Low-Impact Jacks',
    description: 'Modified jumping jacks without jumping.',
    instructions: [
      'Stand with feet together',
      'Step one foot out, raise arms',
      'Return to center',
      'Alternate sides',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
    muscleGroups: ['cardio', 'full_body'],
    type: 'cardio',
    difficulty: 'beginner',
    sets: 3,
    duration: 30,
    restTime: 30,
    calories: 35,
  },
  {
    id: 'beg-high-knees-slow',
    name: 'Slow High Knees',
    description: 'Controlled high knee march.',
    instructions: [
      'Stand tall, core engaged',
      'Lift knees to hip height',
      'Alternate legs at moderate pace',
      'Pump arms for balance',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
    muscleGroups: ['cardio', 'core'],
    type: 'cardio',
    difficulty: 'beginner',
    sets: 3,
    duration: 30,
    restTime: 30,
    calories: 40,
  },
  {
    id: 'beg-standing-oblique',
    name: 'Standing Oblique Crunch',
    description: 'Standing core exercise for obliques.',
    instructions: [
      'Stand with hands behind head',
      'Lift knee to side',
      'Bring elbow toward knee',
      'Alternate sides',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    reps: '12 each side',
    restTime: 30,
    calories: 25,
  },
  {
    id: 'beg-arm-circle',
    name: 'Arm Circles',
    description: 'Shoulder warm-up and mobility.',
    instructions: [
      'Stand with arms extended',
      'Make small circles forward',
      'Gradually increase size',
      'Reverse direction',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['shoulders'],
    type: 'flexibility',
    difficulty: 'beginner',
    sets: 2,
    duration: 30,
    restTime: 15,
    calories: 10,
  },
  {
    id: 'beg-squat-pulse',
    name: 'Squat Pulses',
    description: 'Isometric squat with small pulses.',
    instructions: [
      'Lower into squat position',
      'Pulse up and down slightly',
      'Keep tension in legs',
      'Stay low throughout',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'beginner',
    sets: 3,
    duration: 20,
    restTime: 45,
    calories: 35,
  },

  // ==================== INTERMEDIATE EXERCISES (20) ====================
  {
    id: 'int-pushup-standard',
    name: 'Standard Push-Ups',
    description: 'Classic push-up with full range of motion.',
    instructions: [
      'Hands slightly wider than shoulders',
      'Body forms straight line',
      'Lower chest to floor',
      'Push back up powerfully',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 15,
    restTime: 60,
    calories: 50,
  },
  {
    id: 'int-pushup-diamond',
    name: 'Diamond Push-Ups',
    description: 'Close-grip push-up targeting triceps.',
    instructions: [
      'Form diamond with hands under chest',
      'Keep elbows close to body',
      'Lower chest toward hands',
      'Push back up',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['triceps', 'chest'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 45,
  },
  {
    id: 'int-pushup-wide',
    name: 'Wide Push-Ups',
    description: 'Wide-grip push-up for chest emphasis.',
    instructions: [
      'Hands wider than shoulder width',
      'Keep core tight throughout',
      'Lower chest between hands',
      'Press back up',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 45,
  },
  {
    id: 'int-pike-pushup',
    name: 'Pike Push-Ups',
    description: 'Shoulder-focused push-up variation.',
    instructions: [
      'Start in downward dog position',
      'Bend elbows, lower head toward floor',
      'Push back up to pike',
      'Keep hips high throughout',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 10,
    restTime: 60,
    calories: 40,
  },
  {
    id: 'int-tricep-dip',
    name: 'Parallel Bar Dips',
    description: 'Full tricep dips on parallel bars.',
    instructions: [
      'Grip bars, arms straight',
      'Lower body by bending elbows',
      'Go until upper arms parallel',
      'Push back up',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['triceps', 'chest', 'shoulders'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 10,
    restTime: 60,
    calories: 50,
  },
  {
    id: 'int-pullup-assisted',
    name: 'Assisted Pull-Ups',
    description: 'Pull-ups with band or jump assistance.',
    instructions: [
      'Hang from bar, use resistance band',
      'Pull chest toward bar',
      'Squeeze shoulder blades',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['back', 'biceps'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 8,
    restTime: 90,
    calories: 55,
  },
  {
    id: 'int-inverted-row',
    name: 'Inverted Rows',
    description: 'Bodyweight row under a bar or table.',
    instructions: [
      'Hang under bar, body straight',
      'Pull chest toward bar',
      'Squeeze shoulder blades',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['back', 'biceps'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 45,
  },
  {
    id: 'int-plank-standard',
    name: 'High Plank',
    description: 'Full plank on hands.',
    instructions: [
      'Support on hands and toes',
      'Arms straight, wrists under shoulders',
      'Keep body in straight line',
      'Hold without sagging',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    duration: 45,
    restTime: 45,
    calories: 30,
  },
  {
    id: 'int-side-plank',
    name: 'Side Plank',
    description: 'Full side plank for obliques.',
    instructions: [
      'Lie on side, stack feet',
      'Prop on elbow or hand',
      'Lift hips, form straight line',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 2,
    duration: 30,
    restTime: 30,
    calories: 25,
  },
  {
    id: 'int-mountain-climber',
    name: 'Mountain Climbers',
    description: 'Dynamic plank with knee drives.',
    instructions: [
      'Start in high plank',
      'Drive one knee toward chest',
      'Quickly switch legs',
      'Maintain steady pace',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
    muscleGroups: ['core', 'cardio'],
    type: 'hiit',
    difficulty: 'intermediate',
    sets: 3,
    duration: 30,
    restTime: 30,
    calories: 60,
  },
  {
    id: 'int-bicycle-crunch',
    name: 'Bicycle Crunches',
    description: 'Rotational ab exercise.',
    instructions: [
      'Lie on back, hands behind head',
      'Lift shoulders, bring knee to chest',
      'Rotate elbow toward opposite knee',
      'Alternate sides in cycling motion',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 20,
    restTime: 45,
    calories: 35,
  },
  {
    id: 'int-squat-jump',
    name: 'Jump Squats',
    description: 'Explosive squat with jump.',
    instructions: [
      'Lower into squat position',
      'Explode upward, jump',
      'Land softly, absorb impact',
      'Immediately lower into next rep',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes', 'cardio'],
    type: 'hiit',
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 70,
  },
  {
    id: 'int-lunge-walking',
    name: 'Walking Lunges',
    description: 'Continuous lunges moving forward.',
    instructions: [
      'Step forward into lunge',
      'Lower until both knees at 90°',
      'Step through with back leg',
      'Continue walking pattern',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: '12 each leg',
    restTime: 60,
    calories: 55,
  },
  {
    id: 'int-split-squat',
    name: 'Bulgarian Split Squat',
    description: 'Single-leg squat with rear foot elevated.',
    instructions: [
      'Rear foot on bench behind you',
      'Lower until front thigh parallel',
      'Keep torso upright',
      'Push through front heel',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: '10 each leg',
    restTime: 60,
    calories: 50,
  },
  {
    id: 'int-single-leg-bridge',
    name: 'Single-Leg Glute Bridge',
    description: 'Unilateral glute bridge.',
    instructions: [
      'Lie on back, one leg extended',
      'Drive through grounded heel',
      'Lift hips, squeeze glute',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['glutes'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: '12 each leg',
    restTime: 45,
    calories: 35,
  },
  {
    id: 'int-burpee-no-jump',
    name: 'Burpees (No Jump)',
    description: 'Full burpee without the jump.',
    instructions: [
      'Squat down, hands on floor',
      'Step or jump feet back to plank',
      'Do a push-up (optional)',
      'Step or jump feet to hands, stand',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    muscleGroups: ['full_body', 'cardio'],
    type: 'hiit',
    difficulty: 'intermediate',
    sets: 3,
    reps: 10,
    restTime: 60,
    calories: 80,
  },
  {
    id: 'int-high-knees',
    name: 'High Knees',
    description: 'Fast-paced running in place.',
    instructions: [
      'Run in place, driving knees high',
      'Pump arms in running motion',
      'Stay on balls of feet',
      'Maintain quick tempo',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1601422407692-ec4eeec1d9b3?w=400',
    muscleGroups: ['cardio', 'core'],
    type: 'hiit',
    difficulty: 'intermediate',
    sets: 3,
    duration: 30,
    restTime: 30,
    calories: 50,
  },
  {
    id: 'int-plank-shoulder-tap',
    name: 'Plank Shoulder Taps',
    description: 'Plank with alternating shoulder touches.',
    instructions: [
      'Start in high plank',
      'Tap left shoulder with right hand',
      'Return, tap right with left',
      'Minimize hip rotation',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    muscleGroups: ['core', 'shoulders'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: '10 each side',
    restTime: 45,
    calories: 40,
  },
  {
    id: 'int-v-up',
    name: 'V-Ups',
    description: 'Full sit-up touching toes.',
    instructions: [
      'Lie flat, arms overhead',
      'Simultaneously lift legs and torso',
      'Touch toes at top',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'intermediate',
    sets: 3,
    reps: 12,
    restTime: 45,
    calories: 40,
  },

  // ==================== ADVANCED EXERCISES (20+) ====================
  {
    id: 'adv-pushup-archer',
    name: 'Archer Push-Ups',
    description: 'One-arm dominant push-up.',
    instructions: [
      'Wide grip, one arm extended to side',
      'Lower toward the bent arm',
      'Push back up',
      'Alternate sides',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'triceps'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: '8 each side',
    restTime: 90,
    calories: 60,
  },
  {
    id: 'adv-pushup-clap',
    name: 'Clap Push-Ups',
    description: 'Explosive push-up with clap.',
    instructions: [
      'Lower into push-up',
      'Explode up, clap hands',
      'Land softly, absorb impact',
      'Immediately lower into next rep',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'triceps'],
    type: 'hiit',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 90,
    calories: 70,
  },
  {
    id: 'adv-pushup-pseudo',
    name: 'Pseudo Planche Push-Ups',
    description: 'Hands positioned toward hips.',
    instructions: [
      'Place hands by lower chest/hips',
      'Lean forward significantly',
      'Lower chest toward floor',
      'Push back up',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'shoulders'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 8,
    restTime: 90,
    calories: 55,
  },
  {
    id: 'adv-handstand-wall',
    name: 'Wall Handstand Hold',
    description: 'Handstand against wall.',
    instructions: [
      'Kick up to handstand against wall',
      'Arms straight, core tight',
      'Look at hands',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['shoulders', 'core'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    duration: 30,
    restTime: 90,
    calories: 45,
  },
  {
    id: 'adv-handstand-pushup',
    name: 'Wall Handstand Push-Ups',
    description: 'Push-ups in handstand position.',
    instructions: [
      'Kick up to wall handstand',
      'Lower head toward floor',
      'Push back up',
      'Maintain balance throughout',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['shoulders', 'triceps'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 6,
    restTime: 120,
    calories: 65,
  },
  {
    id: 'adv-pullup',
    name: 'Pull-Ups',
    description: 'Full bodyweight pull-up.',
    instructions: [
      'Hang from bar, palms away',
      'Pull chest toward bar',
      'Squeeze shoulder blades',
      'Lower with full control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['back', 'biceps'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 90,
    calories: 70,
  },
  {
    id: 'adv-chinup',
    name: 'Chin-Ups',
    description: 'Pull-up with palms facing you.',
    instructions: [
      'Hang from bar, palms toward you',
      'Pull chin above bar',
      'Squeeze biceps at top',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['back', 'biceps'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 90,
    calories: 65,
  },
  {
    id: 'adv-muscle-up',
    name: 'Muscle-Ups',
    description: 'Pull-up transitioning to dip.',
    instructions: [
      'Generate explosive pull',
      'Transition hands over bar',
      'Push up into support',
      'Lower with control',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['back', 'chest', 'triceps'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 5,
    restTime: 120,
    calories: 80,
  },
  {
    id: 'adv-l-sit',
    name: 'L-Sit Hold',
    description: 'Legs extended hold on parallettes.',
    instructions: [
      'Support on hands, arms straight',
      'Lift legs parallel to floor',
      'Keep core tight, legs straight',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    muscleGroups: ['core', 'triceps'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    duration: 20,
    restTime: 60,
    calories: 40,
  },
  {
    id: 'adv-dragon-flag',
    name: 'Dragon Flags',
    description: 'Advanced core exercise on bench.',
    instructions: [
      'Lie on bench, grip behind head',
      'Lift entire body vertical',
      'Lower with straight body',
      'Stop just above bench',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 8,
    restTime: 90,
    calories: 55,
  },
  {
    id: 'adv-hanging-leg-raise',
    name: 'Hanging Leg Raises',
    description: 'Leg raises from pull-up bar.',
    instructions: [
      'Hang from bar, arms straight',
      'Raise legs to parallel or higher',
      'Lower with control',
      'Avoid swinging',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400',
    muscleGroups: ['core'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 50,
  },
  {
    id: 'adv-burpee-full',
    name: 'Full Burpees',
    description: 'Complete burpee with push-up and jump.',
    instructions: [
      'Drop to squat, hands on floor',
      'Jump feet to plank, do push-up',
      'Jump feet to hands',
      'Explode into jump, arms overhead',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    muscleGroups: ['full_body', 'cardio'],
    type: 'hiit',
    difficulty: 'advanced',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 100,
  },
  {
    id: 'adv-pistol-squat',
    name: 'Pistol Squats',
    description: 'Single-leg squat to full depth.',
    instructions: [
      'Stand on one leg',
      'Extend other leg forward',
      'Squat all the way down',
      'Stand back up without assistance',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: '6 each leg',
    restTime: 90,
    calories: 60,
  },
  {
    id: 'adv-box-jump',
    name: 'Box Jumps',
    description: 'Explosive jump onto elevated surface.',
    instructions: [
      'Stand facing box/platform',
      'Swing arms and jump',
      'Land softly on box',
      'Step down and repeat',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'glutes', 'cardio'],
    type: 'hiit',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 60,
    calories: 75,
  },
  {
    id: 'adv-tuck-jump',
    name: 'Tuck Jumps',
    description: 'Explosive jump tucking knees.',
    instructions: [
      'Jump as high as possible',
      'Tuck knees to chest at peak',
      'Land softly, absorb impact',
      'Immediately jump again',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    muscleGroups: ['legs', 'cardio'],
    type: 'hiit',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 60,
    calories: 80,
  },
  {
    id: 'adv-planche-lean',
    name: 'Planche Lean',
    description: 'Planche progression exercise.',
    instructions: [
      'High plank position',
      'Lean shoulders past wrists',
      'Keep arms straight',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['shoulders', 'core'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    duration: 20,
    restTime: 60,
    calories: 35,
  },
  {
    id: 'adv-front-lever-tuck',
    name: 'Front Lever (Tucked)',
    description: 'Horizontal hold from bar with tucked legs.',
    instructions: [
      'Hang from bar',
      'Tuck knees to chest',
      'Pull body horizontal',
      'Hold position',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['back', 'core'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    duration: 15,
    restTime: 90,
    calories: 45,
  },
  {
    id: 'adv-back-lever-tuck',
    name: 'Back Lever (Tucked)',
    description: 'Horizontal hold facing down.',
    instructions: [
      'Hang from bar',
      'Rotate backward, tuck knees',
      'Hold horizontal position',
      'Maintain core tension',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['shoulders', 'back', 'core'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    duration: 15,
    restTime: 90,
    calories: 45,
  },
  {
    id: 'adv-ring-dip',
    name: 'Ring Dips',
    description: 'Dips on gymnastic rings.',
    instructions: [
      'Support on rings, arms straight',
      'Lower by bending elbows',
      'Go to 90 degrees or below',
      'Push back up, stabilize',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'triceps', 'shoulders'],
    type: 'strength',
    difficulty: 'advanced',
    sets: 3,
    reps: 10,
    restTime: 90,
    calories: 65,
  },
  {
    id: 'adv-plyo-pushup',
    name: 'Plyometric Push-Ups',
    description: 'Explosive push-ups with hand lift.',
    instructions: [
      'Lower into push-up',
      'Explode up, hands leave floor',
      'Land softly',
      'Immediately lower into next rep',
    ],
    videoUrl: '',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=400',
    muscleGroups: ['chest', 'triceps'],
    type: 'hiit',
    difficulty: 'advanced',
    sets: 3,
    reps: 12,
    restTime: 60,
    calories: 75,
  },
];

// ==================== NIGERIAN MEAL DATABASE ====================

/**
 * Nigerian-focused meal database with local ingredients
 * - High protein, locally available foods
 * - Aligned with intermittent fasting
 */
export const NIGERIAN_MEAL_DATABASE: Meal[] = [
  // HIGH PROTEIN MEALS
  {
    id: 'ng-meal-1',
    name: 'Grilled Suya Chicken',
    description: 'Spicy grilled chicken with suya spice and vegetables.',
    type: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    ingredients: [
      { name: 'Chicken breast', amount: '200g', calories: 220 },
      { name: 'Suya spice (yaji)', amount: '2 tbsp', calories: 30 },
      { name: 'Onions', amount: '1 medium', calories: 40 },
      { name: 'Tomatoes', amount: '2 medium', calories: 30 },
      { name: 'Cabbage', amount: '100g', calories: 25 },
    ],
    instructions: [
      'Marinate chicken in suya spice for 2 hours',
      'Grill until cooked through',
      'Slice onions and tomatoes',
      'Serve with fresh cabbage salad',
    ],
    prepTime: 15,
    cookTime: 20,
    servings: 1,
    nutrition: {
      calories: 345,
      protein: 45,
      carbs: 15,
      fat: 12,
      fiber: 4,
    },
    dietaryTags: ['high_protein', 'low_carb', 'dairy_free'],
  },
  {
    id: 'ng-meal-2',
    name: 'Moi Moi (Steamed Bean Pudding)',
    description: 'Traditional protein-rich bean pudding with eggs.',
    type: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    ingredients: [
      { name: 'Black-eyed beans', amount: '200g', calories: 200 },
      { name: 'Eggs', amount: '2 large', calories: 140 },
      { name: 'Palm oil', amount: '2 tbsp', calories: 120 },
      { name: 'Onions', amount: '1 small', calories: 30 },
      { name: 'Crayfish', amount: '2 tbsp', calories: 40 },
    ],
    instructions: [
      'Soak and blend beans until smooth',
      'Mix with oil, onions, and crayfish',
      'Add eggs and seasonings',
      'Steam in moi moi leaves or containers',
    ],
    prepTime: 30,
    cookTime: 45,
    servings: 2,
    nutrition: {
      calories: 530,
      protein: 28,
      carbs: 35,
      fat: 30,
      fiber: 10,
    },
    dietaryTags: ['vegetarian', 'high_protein'],
  },
  {
    id: 'ng-meal-3',
    name: 'Pepper Soup with Fish',
    description: 'Light, spicy fish soup with Nigerian herbs.',
    type: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400',
    ingredients: [
      { name: 'Catfish', amount: '250g', calories: 230 },
      { name: 'Pepper soup spice', amount: '2 tbsp', calories: 20 },
      { name: 'Uziza leaves', amount: '1 handful', calories: 10 },
      { name: 'Scent leaf', amount: '1 handful', calories: 5 },
      { name: 'Onions', amount: '1 medium', calories: 40 },
    ],
    instructions: [
      'Clean and cut fish into portions',
      'Boil with pepper soup spice and onions',
      'Simmer until fish is cooked',
      'Add uziza and scent leaves before serving',
    ],
    prepTime: 10,
    cookTime: 25,
    servings: 1,
    nutrition: {
      calories: 305,
      protein: 42,
      carbs: 8,
      fat: 10,
      fiber: 2,
    },
    dietaryTags: ['high_protein', 'low_carb', 'dairy_free'],
  },
  {
    id: 'ng-meal-4',
    name: 'Efo Riro with Protein',
    description: 'Nutrient-dense spinach stew with assorted meat.',
    type: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ingredients: [
      { name: 'Spinach (efo)', amount: '200g', calories: 45 },
      { name: 'Assorted meat', amount: '150g', calories: 200 },
      { name: 'Stockfish', amount: '50g', calories: 80 },
      { name: 'Palm oil', amount: '2 tbsp', calories: 120 },
      { name: 'Locust beans (iru)', amount: '1 tbsp', calories: 30 },
    ],
    instructions: [
      'Boil and shred assorted meat',
      'Cook spinach briefly in palm oil',
      'Add meat, stockfish, and locust beans',
      'Season and simmer',
    ],
    prepTime: 20,
    cookTime: 30,
    servings: 1,
    nutrition: {
      calories: 475,
      protein: 38,
      carbs: 12,
      fat: 30,
      fiber: 6,
    },
    dietaryTags: ['high_protein', 'low_carb'],
  },
  {
    id: 'ng-meal-5',
    name: 'Grilled Tilapia',
    description: 'Whole grilled tilapia with pepper sauce.',
    type: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
    ingredients: [
      { name: 'Whole tilapia', amount: '400g', calories: 260 },
      { name: 'Scotch bonnet peppers', amount: '3', calories: 15 },
      { name: 'Onions', amount: '2 medium', calories: 80 },
      { name: 'Vegetable oil', amount: '1 tbsp', calories: 90 },
      { name: 'Plantain (optional)', amount: '1 small', calories: 90 },
    ],
    instructions: [
      'Score fish and season well',
      'Grill over charcoal or oven',
      'Blend peppers and onions for sauce',
      'Serve with roasted plantain',
    ],
    prepTime: 15,
    cookTime: 30,
    servings: 1,
    nutrition: {
      calories: 535,
      protein: 48,
      carbs: 30,
      fat: 22,
      fiber: 4,
    },
    dietaryTags: ['high_protein', 'dairy_free'],
  },
  {
    id: 'ng-meal-6',
    name: 'Akara (Bean Cakes)',
    description: 'Crispy fried bean cakes - Nigerian breakfast classic.',
    type: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400',
    ingredients: [
      { name: 'Black-eyed beans', amount: '250g', calories: 250 },
      { name: 'Onions', amount: '1 medium', calories: 40 },
      { name: 'Scotch bonnet', amount: '1', calories: 5 },
      { name: 'Vegetable oil', amount: '3 tbsp', calories: 270 },
      { name: 'Salt', amount: 'to taste', calories: 0 },
    ],
    instructions: [
      'Soak beans overnight, remove skins',
      'Blend with onions and pepper',
      'Whisk until fluffy',
      'Deep fry spoonfuls until golden',
    ],
    prepTime: 20,
    cookTime: 15,
    servings: 2,
    nutrition: {
      calories: 565,
      protein: 22,
      carbs: 45,
      fat: 32,
      fiber: 12,
    },
    dietaryTags: ['vegetarian', 'high_protein'],
  },
  {
    id: 'ng-meal-7',
    name: 'Egusi Soup (Lite)',
    description: 'Melon seed soup with leafy greens, less oil.',
    type: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ingredients: [
      { name: 'Ground egusi', amount: '100g', calories: 180 },
      { name: 'Pumpkin leaves (ugu)', amount: '150g', calories: 25 },
      { name: 'Chicken', amount: '150g', calories: 165 },
      { name: 'Palm oil', amount: '1 tbsp', calories: 60 },
      { name: 'Crayfish', amount: '2 tbsp', calories: 40 },
    ],
    instructions: [
      'Cook chicken until tender',
      'Mix egusi with a little water',
      'Add to pot and stir',
      'Add vegetables and simmer',
    ],
    prepTime: 15,
    cookTime: 35,
    servings: 1,
    nutrition: {
      calories: 470,
      protein: 35,
      carbs: 15,
      fat: 30,
      fiber: 5,
    },
    dietaryTags: ['high_protein', 'low_carb'],
  },
  {
    id: 'ng-meal-8',
    name: 'Boiled Eggs & Vegetables',
    description: 'Simple protein-rich breakfast.',
    type: 'breakfast',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400',
    ingredients: [
      { name: 'Eggs', amount: '3 large', calories: 210 },
      { name: 'Tomatoes', amount: '2 medium', calories: 30 },
      { name: 'Cucumber', amount: '1 medium', calories: 30 },
      { name: 'Avocado', amount: '1/2', calories: 160 },
      { name: 'Salt & pepper', amount: 'to taste', calories: 0 },
    ],
    instructions: [
      'Boil eggs to preferred doneness',
      'Slice vegetables',
      'Arrange on plate with avocado',
      'Season and serve',
    ],
    prepTime: 5,
    cookTime: 10,
    servings: 1,
    nutrition: {
      calories: 430,
      protein: 22,
      carbs: 15,
      fat: 32,
      fiber: 8,
    },
    dietaryTags: ['vegetarian', 'high_protein', 'keto'],
  },
  {
    id: 'ng-meal-9',
    name: 'Ofada Rice with Ayamase',
    description: 'Local brown rice with green pepper sauce.',
    type: 'lunch',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ingredients: [
      { name: 'Ofada rice', amount: '150g cooked', calories: 180 },
      { name: 'Green bell peppers', amount: '3 large', calories: 45 },
      { name: 'Assorted meat', amount: '100g', calories: 150 },
      { name: 'Palm oil', amount: '2 tbsp', calories: 120 },
      { name: 'Locust beans', amount: '1 tbsp', calories: 30 },
    ],
    instructions: [
      'Cook ofada rice until soft',
      'Roast and blend green peppers',
      'Fry in palm oil with locust beans',
      'Add meat and serve with rice',
    ],
    prepTime: 20,
    cookTime: 40,
    servings: 1,
    nutrition: {
      calories: 525,
      protein: 28,
      carbs: 42,
      fat: 26,
      fiber: 5,
    },
    dietaryTags: ['high_protein', 'dairy_free'],
  },
  {
    id: 'ng-meal-10',
    name: 'Vegetable Yam Porridge',
    description: 'Yam cooked with leafy vegetables.',
    type: 'dinner',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400',
    ingredients: [
      { name: 'Yam', amount: '200g', calories: 240 },
      { name: 'Spinach', amount: '100g', calories: 25 },
      { name: 'Palm oil', amount: '1 tbsp', calories: 60 },
      { name: 'Dried fish', amount: '50g', calories: 80 },
      { name: 'Crayfish', amount: '1 tbsp', calories: 20 },
    ],
    instructions: [
      'Peel and cube yam',
      'Boil until soft',
      'Mash slightly, add oil and fish',
      'Fold in vegetables and serve',
    ],
    prepTime: 15,
    cookTime: 25,
    servings: 1,
    nutrition: {
      calories: 425,
      protein: 22,
      carbs: 50,
      fat: 16,
      fiber: 6,
    },
    dietaryTags: ['dairy_free'],
  },
];

// ==================== HELPER TYPES ====================

export interface PersonalizedExercisePlan {
  exercises: Exercise[];
  dayNumber: number;
  totalSets: number;
  totalReps: number;
  estimatedDuration: number;
  estimatedCalories: number;
  difficulty: DifficultyLevel;
  focusAreas: MuscleGroup[];
}

export interface PersonalizedMealPlan {
  meals: Meal[];
  mealsPerDay: 1 | 2;
  totalCalories: number;
  totalProtein: number;
  eatingWindow: { start: string; end: string };
}

export interface PersonalizedFastingPlan {
  plan: FastingPlan;
  window: FastingWindow;
  mealsPerDay: 1 | 2;
  reasoning: string;
}

export interface DailySchedule {
  exercises: PersonalizedExercisePlan;
  meals: PersonalizedMealPlan;
  fasting: PersonalizedFastingPlan;
  date: string;
  dayNumber: number;
  isRestDay: boolean;
}

// ==================== EXERCISE GENERATION ENGINE ====================

/**
 * Generate personalized exercises based on user profile
 */
export class ExerciseGenerationEngine {
  /**
   * Get exercises filtered by difficulty
   */
  static getExercisesByDifficulty(difficulty: DifficultyLevel): Exercise[] {
    return EXERCISE_DATABASE.filter((ex) => ex.difficulty === difficulty);
  }

  /**
   * Get exercises targeting specific muscle groups
   */
  static getExercisesByMuscleGroups(
    muscleGroups: MuscleGroup[],
    difficulty: DifficultyLevel
  ): Exercise[] {
    return EXERCISE_DATABASE.filter(
      (ex) =>
        ex.difficulty === difficulty &&
        ex.muscleGroups.some((mg) => muscleGroups.includes(mg as MuscleGroup))
    );
  }

  /**
   * Map problem areas to muscle groups
   */
  static problemAreasToMuscleGroups(problemAreas: ProblemArea[]): MuscleGroup[] {
    const mapping: Record<ProblemArea, MuscleGroup[]> = {
      weak_chest: ['chest', 'shoulders'],
      slim_arms: ['biceps', 'triceps', 'shoulders'],
      beer_belly: ['core'],
      slim_legs: ['legs', 'glutes'],
      flabby_arms: ['triceps', 'biceps'],
      belly_fat: ['core', 'cardio'],
      hip_fat: ['glutes', 'core'],
      thigh_fat: ['legs', 'glutes', 'cardio'],
    };

    const muscleGroups = new Set<MuscleGroup>();
    problemAreas.forEach((area) => {
      mapping[area]?.forEach((mg) => muscleGroups.add(mg));
    });

    return Array.from(muscleGroups);
  }

  /**
   * Map goals to muscle group priorities
   */
  static goalToMuscleGroups(goal: PrimaryGoal, gender: UserGender): MuscleGroup[] {
    const maleMapping: Record<PrimaryGoal, MuscleGroup[]> = {
      build_muscle: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs'],
      lose_weight: ['cardio', 'full_body', 'core'],
      gain_muscle_lose_weight: ['chest', 'back', 'legs', 'core', 'cardio'],
      get_fit_toned: ['full_body', 'core', 'cardio'],
    };

    const femaleMapping: Record<PrimaryGoal, MuscleGroup[]> = {
      build_muscle: ['glutes', 'legs', 'core', 'shoulders'],
      lose_weight: ['cardio', 'full_body', 'glutes'],
      gain_muscle_lose_weight: ['glutes', 'legs', 'core', 'cardio'],
      get_fit_toned: ['glutes', 'core', 'legs', 'full_body'],
    };

    return gender === 'male' ? maleMapping[goal] : femaleMapping[goal];
  }

  /**
   * Determine exercise difficulty based on fitness assessment
   */
  static determineDifficulty(assessment: FitnessAssessment): DifficultyLevel {
    return assessment.overallLevel;
  }

  /**
   * Calculate exercise count based on duration preference
   */
  static getExerciseCount(duration: WorkoutDuration): number {
    const counts: Record<WorkoutDuration, number> = {
      '15-20': 4,
      '20-30': 6,
      '30-45': 8,
      '45-60': 10,
    };
    return counts[duration] ?? 6;
  }

  /**
   * Generate a personalized workout for a specific day
   */
  static generateWorkout(
    data: CommandoOnboardingData,
    dayNumber: number
  ): PersonalizedExercisePlan {
    const difficulty = data.fitnessAssessment?.overallLevel ?? 'beginner';
    const exerciseCount = this.getExerciseCount(data.workoutDuration ?? '20-30');

    // Get target muscle groups based on goal and problem areas
    const goalMuscles = this.goalToMuscleGroups(
      data.primaryGoal ?? 'get_fit_toned',
      data.gender ?? 'male'
    );
    const problemMuscles = this.problemAreasToMuscleGroups(data.problemAreas ?? []);
    const targetMuscles = [...new Set([...goalMuscles, ...problemMuscles])];

    // Day-specific muscle group rotation
    const dayFocus = this.getDayFocus(dayNumber, targetMuscles);

    // Get exercises for the day's focus
    let exercises = this.getExercisesByMuscleGroups(dayFocus, difficulty);

    // If not enough exercises, add from similar difficulty
    if (exercises.length < exerciseCount) {
      const additionalExercises = this.getExercisesByDifficulty(difficulty).filter(
        (ex) => !exercises.includes(ex)
      );
      exercises = [...exercises, ...additionalExercises];
    }

    // Select exercises ensuring variety
    const selectedExercises = this.selectExercises(exercises, exerciseCount, dayNumber);

    // Apply progressive overload based on day
    const progressedExercises = this.applyProgression(selectedExercises, dayNumber);

    // Calculate totals
    const totalSets = progressedExercises.reduce((sum, ex) => sum + (ex.sets ?? 3), 0);
    const totalReps = progressedExercises.reduce((sum, ex) => {
      if (typeof ex.reps === 'number') return sum + ex.reps * (ex.sets ?? 3);
      if (typeof ex.duration === 'number') return sum + ex.duration * (ex.sets ?? 3);
      return sum + 10 * (ex.sets ?? 3);
    }, 0);
    const estimatedDuration = progressedExercises.reduce(
      (sum, ex) => sum + (ex.duration ?? 2) * (ex.sets ?? 3) + (ex.restTime ?? 45) * ((ex.sets ?? 3) - 1),
      0
    ) / 60; // Convert to minutes
    const estimatedCalories = progressedExercises.reduce((sum, ex) => sum + (ex.calories ?? 30), 0);

    return {
      exercises: progressedExercises,
      dayNumber,
      totalSets,
      totalReps,
      estimatedDuration: Math.round(estimatedDuration),
      estimatedCalories,
      difficulty,
      focusAreas: dayFocus,
    };
  }

  /**
   * Get day-specific muscle group focus
   */
  private static getDayFocus(dayNumber: number, targetMuscles: MuscleGroup[]): MuscleGroup[] {
    // Rotate focus through the week
    const weekDay = ((dayNumber - 1) % 7) + 1;

    const dayTemplates: Record<number, MuscleGroup[]> = {
      1: ['chest', 'triceps', 'shoulders'], // Push day
      2: ['back', 'biceps'], // Pull day
      3: ['legs', 'glutes'], // Legs
      4: ['core', 'cardio'], // Active recovery / cardio
      5: ['chest', 'back', 'full_body'], // Upper body
      6: ['legs', 'glutes', 'core'], // Lower body + core
      7: ['full_body'], // Light full body or rest
    };

    // Prioritize target muscles within the day template
    const dayBase = dayTemplates[weekDay] ?? ['full_body'];
    return dayBase.filter((mg) => targetMuscles.includes(mg) || mg === 'full_body' || mg === 'cardio');
  }

  /**
   * Select exercises with variety
   */
  private static selectExercises(
    exercises: Exercise[],
    count: number,
    dayNumber: number
  ): Exercise[] {
    // Shuffle based on day number for variety
    const shuffled = [...exercises].sort(() => Math.sin(dayNumber * 1000) - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Apply progressive overload
   */
  private static applyProgression(exercises: Exercise[], dayNumber: number): Exercise[] {
    const weekNumber = Math.floor((dayNumber - 1) / 7) + 1;

    return exercises.map((ex) => {
      const progressed = { ...ex };

      // Increase sets every 2 weeks
      if (weekNumber >= 2 && typeof progressed.sets === 'number') {
        progressed.sets = Math.min(progressed.sets + 1, 5);
      }

      // Increase reps every week
      if (typeof progressed.reps === 'number') {
        progressed.reps = Math.min(progressed.reps + weekNumber, progressed.reps + 5);
      }

      // Increase duration for timed exercises
      if (typeof progressed.duration === 'number') {
        progressed.duration = Math.min(progressed.duration + weekNumber * 5, progressed.duration + 30);
      }

      return progressed;
    });
  }
}

// ==================== FASTING PLAN ENGINE ====================

/**
 * Generate personalized fasting plan based on user profile
 */
export class FastingPlanEngine {
  /**
   * Calculate BMI category
   */
  static getBMICategory(bmi: number): 'underweight' | 'normal' | 'overweight' | 'obese' {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
  }

  /**
   * Determine optimal fasting plan
   */
  static determineFastingPlan(data: CommandoOnboardingData): PersonalizedFastingPlan {
    const bmi = data.bmi ?? 25;
    const bmiCategory = this.getBMICategory(bmi);
    const activityLevel = data.activityLevel ?? 'lightly_active';
    const metabolicType = data.metabolicType ?? 'normal';
    const goal = data.primaryGoal ?? 'get_fit_toned';

    let plan: FastingPlan = '16:8';
    let mealsPerDay: 1 | 2 = 2;
    let reasoning = '';

    // Very overweight: More aggressive fasting
    if (bmiCategory === 'obese') {
      plan = '18:6';
      mealsPerDay = 1;
      reasoning = 'Aggressive intermittent fasting recommended for significant weight loss. One meal per day within a 6-hour window.';
    } else if (bmiCategory === 'overweight') {
      if (goal === 'lose_weight' || goal === 'gain_muscle_lose_weight') {
        plan = '18:6';
        mealsPerDay = 2;
        reasoning = 'Extended fasting window to accelerate fat loss while maintaining muscle.';
      } else {
        plan = '16:8';
        mealsPerDay = 2;
        reasoning = 'Standard intermittent fasting for gradual weight management.';
      }
    } else if (bmiCategory === 'normal') {
      if (goal === 'build_muscle') {
        plan = '14:10';
        mealsPerDay = 2;
        reasoning = 'Shorter fasting window to support muscle growth with adequate nutrition timing.';
      } else {
        plan = '16:8';
        mealsPerDay = 2;
        reasoning = 'Balanced fasting protocol for maintenance and general fitness.';
      }
    } else {
      // Underweight
      plan = '12:12';
      mealsPerDay = 2;
      reasoning = 'Minimal fasting to allow maximum nutrient intake for healthy weight gain.';
    }

    // Adjust based on activity level
    if (activityLevel === 'very_active' && plan === '18:6') {
      plan = '16:8';
      reasoning += ' Adjusted for high activity level to ensure adequate energy intake.';
    }

    // Adjust based on metabolism
    if (metabolicType === 'slow' && plan === '12:12') {
      plan = '14:10';
      reasoning += ' Extended slightly due to slower metabolism.';
    }

    const window = this.getFastingWindow(plan);

    return {
      plan,
      window,
      mealsPerDay,
      reasoning,
    };
  }

  /**
   * Get fasting window times
   */
  static getFastingWindow(plan: FastingPlan): FastingWindow {
    const windows: Record<FastingPlan, FastingWindow> = {
      '12:12': {
        plan: '12:12',
        eatingStartTime: '08:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '08:00',
        eatingHours: 12,
        fastingHours: 12,
      },
      '14:10': {
        plan: '14:10',
        eatingStartTime: '10:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '10:00',
        eatingHours: 10,
        fastingHours: 14,
      },
      '16:8': {
        plan: '16:8',
        eatingStartTime: '12:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '12:00',
        eatingHours: 8,
        fastingHours: 16,
      },
      '18:6': {
        plan: '18:6',
        eatingStartTime: '14:00',
        eatingEndTime: '20:00',
        fastingStartTime: '20:00',
        fastingEndTime: '14:00',
        eatingHours: 6,
        fastingHours: 18,
      },
    };

    return windows[plan];
  }
}

// ==================== MEAL PLAN ENGINE ====================

/**
 * Generate personalized meal plans based on user profile
 */
export class MealPlanEngine {
  /**
   * Calculate daily calorie target
   */
  static calculateCalorieTarget(data: CommandoOnboardingData): number {
    const weight = data.weightKg ?? 70;
    const height = data.heightCm ?? 170;
    const gender = data.gender ?? 'male';
    const activityLevel = data.activityLevel ?? 'lightly_active';
    const goal = data.primaryGoal ?? 'get_fit_toned';

    // Calculate age from DOB
    const age = data.dateOfBirth
      ? Math.floor(
          (Date.now() - new Date(data.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        )
      : 30;

    // Basal Metabolic Rate (Mifflin-St Jeor)
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    const multipliers: Record<string, number> = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
    };
    const tdee = bmr * (multipliers[activityLevel] ?? 1.375);

    // Goal adjustment
    const goalMultipliers: Record<string, number> = {
      lose_weight: 0.8,
      build_muscle: 1.15,
      gain_muscle_lose_weight: 0.95,
      get_fit_toned: 1.0,
    };

    return Math.round(tdee * (goalMultipliers[goal] ?? 1.0));
  }

  /**
   * Calculate protein target
   */
  static calculateProteinTarget(data: CommandoOnboardingData): number {
    const weight = data.weightKg ?? 70;
    const goal = data.primaryGoal ?? 'get_fit_toned';

    // Protein per kg of body weight
    const proteinMultipliers: Record<string, number> = {
      build_muscle: 2.0,
      gain_muscle_lose_weight: 1.8,
      lose_weight: 1.5,
      get_fit_toned: 1.4,
    };

    return Math.round(weight * (proteinMultipliers[goal] ?? 1.4));
  }

  /**
   * Get meals matching calorie and macro targets
   */
  static getMealsForTargets(
    mealsPerDay: 1 | 2,
    dailyCalories: number,
    dailyProtein: number,
    mealType: 'breakfast' | 'lunch' | 'dinner'
  ): Meal[] {
    const caloriesPerMeal = dailyCalories / mealsPerDay;
    const proteinPerMeal = dailyProtein / mealsPerDay;

    // Filter meals by type and calorie range (±20%)
    const minCals = caloriesPerMeal * 0.8;
    const maxCals = caloriesPerMeal * 1.2;

    const matchingMeals = NIGERIAN_MEAL_DATABASE.filter(
      (meal) =>
        meal.type === mealType &&
        meal.nutrition.calories >= minCals &&
        meal.nutrition.calories <= maxCals
    );

    // If no exact matches, get closest options
    if (matchingMeals.length === 0) {
      return NIGERIAN_MEAL_DATABASE.filter((meal) => meal.type === mealType)
        .sort(
          (a, b) =>
            Math.abs(a.nutrition.calories - caloriesPerMeal) -
            Math.abs(b.nutrition.calories - caloriesPerMeal)
        )
        .slice(0, 3);
    }

    return matchingMeals;
  }

  /**
   * Generate personalized meal plan for the day
   */
  /**
   * Generate 3 meal options for a given meal slot
   * Returns 3 different meals that meet the calorie/protein targets
   */
  static generateMealOptions(
    mealType: 'lunch' | 'dinner',
    targetCalories: number,
    targetProtein: number,
    dayNumber: number
  ): Meal[] {
    const allOptions = this.getMealsForTargets(2, targetCalories, targetProtein, mealType);

    // Return up to 3 different options, ensuring uniqueness
    const uniqueOptions: Meal[] = [];
    const usedIds = new Set<string>();

    for (let i = 0; i < allOptions.length && uniqueOptions.length < 3; i++) {
      const idx = (dayNumber + i) % allOptions.length;
      const meal = allOptions[idx];
      if (meal && !usedIds.has(meal.id)) {
        usedIds.add(meal.id);
        uniqueOptions.push(meal);
      }
    }

    return uniqueOptions;
  }

  static generateMealPlan(
    data: CommandoOnboardingData,
    fastingPlan: PersonalizedFastingPlan,
    dayNumber: number
  ): PersonalizedMealPlan {
    const dailyCalories = this.calculateCalorieTarget(data);
    const dailyProtein = this.calculateProteinTarget(data);
    const mealsPerDay = fastingPlan.mealsPerDay;

    const meals: Meal[] = [];

    // CRITICAL: We ALWAYS do 2 meals per day, never 1, never 3+
    // First meal: Lighter (30-35% of daily calories)
    // Second meal: Main meal (65-70% of daily calories)

    // First meal (lighter) - typically lunch
    const lightMealOptions = this.getMealsForTargets(2, dailyCalories * 0.35, dailyProtein * 0.35, 'lunch');
    const lightMeal = lightMealOptions[dayNumber % lightMealOptions.length] ?? lightMealOptions[0];
    if (lightMeal) meals.push(lightMeal);

    // Second meal (main) - typically dinner
    const mainMealOptions = this.getMealsForTargets(2, dailyCalories * 0.65, dailyProtein * 0.65, 'dinner');
    const mainMeal = mainMealOptions[dayNumber % mainMealOptions.length] ?? mainMealOptions[0];
    if (mainMeal) meals.push(mainMeal);

    const totalCalories = meals.reduce((sum, m) => sum + m.nutrition.calories, 0);
    const totalProtein = meals.reduce((sum, m) => sum + m.nutrition.protein, 0);

    return {
      meals,
      mealsPerDay: 2, // Always 2 meals
      totalCalories,
      totalProtein,
      eatingWindow: {
        start: fastingPlan.window.eatingStartTime,
        end: fastingPlan.window.eatingEndTime,
      },
    };
  }
}

// ==================== MAIN ENGINE ====================

/**
 * Main engine for generating complete personalized daily schedules
 */
export class PersonalizedPlanEngine {
  /**
   * Generate a complete daily schedule
   */
  static generateDailySchedule(
    data: CommandoOnboardingData,
    dayNumber: number
  ): DailySchedule {
    // Determine rest day (every 7th day or based on frequency)
    const frequency = data.trainingFrequency ?? '4-5';
    const restDays = frequency === '2-3' ? [3, 6, 7] : frequency === '4-5' ? [4, 7] : [7];
    const isRestDay = restDays.includes((dayNumber % 7) || 7);

    // Generate fasting plan
    const fasting = FastingPlanEngine.determineFastingPlan(data);

    // Generate meal plan
    const meals = MealPlanEngine.generateMealPlan(data, fasting, dayNumber);

    // Generate exercises (empty if rest day)
    const exercises = isRestDay
      ? {
          exercises: [],
          dayNumber,
          totalSets: 0,
          totalReps: 0,
          estimatedDuration: 0,
          estimatedCalories: 0,
          difficulty: (data.fitnessAssessment?.overallLevel ?? 'beginner') as DifficultyLevel,
          focusAreas: [],
        }
      : ExerciseGenerationEngine.generateWorkout(data, dayNumber);

    return {
      exercises,
      meals,
      fasting,
      date: new Date().toISOString().split('T')[0],
      dayNumber,
      isRestDay,
    };
  }

  /**
   * Generate a full week of schedules
   */
  static generateWeekSchedule(
    data: CommandoOnboardingData,
    startDayNumber: number = 1
  ): DailySchedule[] {
    const week: DailySchedule[] = [];

    for (let i = 0; i < 7; i++) {
      week.push(this.generateDailySchedule(data, startDayNumber + i));
    }

    return week;
  }
}

export default PersonalizedPlanEngine;

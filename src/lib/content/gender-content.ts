/**
 * GENDER-SPECIFIC CONTENT
 *
 * Copy, motivational content, and styling for male vs female onboarding flows.
 * Male: High-energy, challenge-oriented, military-style
 * Female: Encouraging, nurturing, confidence-focused
 */

import type { CommandoOnboardingStep, UserGender } from '@/types/commando';

// ==================== HEADLINES ====================

export const HEADLINES: Record<UserGender, Partial<Record<CommandoOnboardingStep, string>>> = {
  male: {
    gender: 'Welcome, Soldier',
    age: 'How Old Are You, Warrior?',
    primary_goal: 'What\'s Your Mission?',
    body_type: 'Assess Your Current State',
    problem_areas: 'Identify Your Weak Points',
    desired_body: 'Visualize Your Victory',
    experience: 'Combat Experience',
    philosophy: 'The Commando Way',
    fitness_history: 'When Were You at Peak?',
    metabolism: 'Know Your Engine',
    obstacles: 'What\'s Holding You Back?',
    pushup_assessment: 'Drop and Give Me Your Max!',
    pullup_assessment: 'Show Me What You\'ve Got!',
    fitness_summary: 'Your Battle Readiness',
    philosophy_comparison: 'Why Military Training Wins',
    training_frequency: 'How Often Can You Train?',
    workout_duration: 'Time to Commit',
    workout_time: 'When Do You Fight?',
    hormonal_info: 'Optimize Your Performance',
    height_weight: 'Body Stats',
    target_weight: 'Set Your Target',
    success_story: 'Warriors Who Transformed',
    water_intake: 'Fuel Your Body',
    activity_level: 'Daily Operations',
    energy_level: 'Power Status',
    sleep_habits: 'Recovery Protocol',
    motivation: 'What Drives You?',
    health_insights: 'Your Performance Report',
    potential: 'Unlock Your Potential',
    personalization: 'Final Calibration',
    name: 'State Your Name, Soldier',
    date_of_birth: 'Date of Birth',
    fitness_age: 'Your True Combat Age',
    email: 'Secure Communication',
    marketing: 'Stay Briefed',
    results_prediction: 'Your Transformation Timeline',
    processing: 'Generating Your Battle Plan...',
    quote: 'Your Mission Begins',
  },
  female: {
    gender: 'Welcome, Beautiful',
    age: 'What\'s Your Age?',
    primary_goal: 'What\'s Your Goal?',
    body_type: 'How Would You Describe Yourself?',
    problem_areas: 'What Would You Like to Improve?',
    desired_body: 'Your Dream Body',
    experience: 'Your Fitness Journey',
    philosophy: 'Our Approach to Wellness',
    fitness_history: 'Your Fitness Story',
    metabolism: 'Understanding Your Body',
    obstacles: 'What\'s Been Challenging?',
    pushup_assessment: 'Let\'s See Your Strength',
    pullup_assessment: 'You\'re Doing Great!',
    fitness_summary: 'Your Fitness Profile',
    philosophy_comparison: 'Why This Works',
    training_frequency: 'Your Ideal Schedule',
    workout_duration: 'Time for Yourself',
    workout_time: 'Best Time for You',
    hormonal_info: 'Balancing Your Body',
    height_weight: 'Your Measurements',
    target_weight: 'Your Wellness Goal',
    success_story: 'Women Who Transformed',
    water_intake: 'Hydration Goals',
    activity_level: 'Your Daily Activity',
    energy_level: 'How Do You Feel?',
    sleep_habits: 'Rest & Recovery',
    motivation: 'Your Why',
    health_insights: 'Your Wellness Insights',
    potential: 'Believe in Yourself',
    personalization: 'Almost There!',
    name: 'What Should We Call You?',
    date_of_birth: 'Your Birthday',
    fitness_age: 'Your Body\'s True Age',
    email: 'Stay Connected',
    marketing: 'Join Our Community',
    results_prediction: 'Your Transformation Journey',
    processing: 'Creating Your Personal Plan...',
    quote: 'Your Journey Begins',
  },
};

// ==================== DESCRIPTIONS ====================

export const DESCRIPTIONS: Record<UserGender, Partial<Record<CommandoOnboardingStep, string>>> = {
  male: {
    gender: 'Select your gender to receive a personalized military-style training program.',
    age: 'Your age determines the intensity and progression of your combat training.',
    primary_goal: 'Choose your primary objective. We\'ll build your plan around this mission.',
    body_type: 'Be honest. This helps us tailor the perfect assault plan.',
    problem_areas: 'Select the areas that need the most work. We\'ll target them.',
    desired_body: 'What does victory look like to you?',
    experience: 'Have you trained with military-style calisthenics before?',
    philosophy: 'No equipment needed. No excuses accepted. Just you and your body.',
    fitness_history: 'When was the last time you felt in peak combat shape?',
    metabolism: 'Understanding your metabolism helps optimize your nutrition strategy.',
    obstacles: 'Identify what\'s been keeping you from achieving your goals.',
    pushup_assessment: 'Do as many push-ups as you can with proper form. This is your baseline.',
    pullup_assessment: 'Show your upper body strength. Every rep counts.',
    fitness_summary: 'Based on your assessment, here\'s your current combat readiness.',
    philosophy_comparison: 'Why military-style training beats the gym every time.',
    training_frequency: 'How many days per week can you commit to training?',
    workout_duration: 'How much time can you dedicate to each session?',
    workout_time: 'When do you perform at your best?',
    hormonal_info: 'Optimize testosterone and reduce cortisol for maximum gains.',
    height_weight: 'We need these stats to calculate your BMI and calorie targets.',
    target_weight: 'Set a realistic target. We\'ll create a timeline to get you there.',
    success_story: 'Real men who transformed their bodies with this program.',
    water_intake: 'Hydration is crucial for performance and recovery.',
    activity_level: 'How active are you outside of training?',
    energy_level: 'How do you typically feel throughout the day?',
    sleep_habits: 'Sleep is when your body rebuilds stronger.',
    motivation: 'Understanding what drives you helps us keep you accountable.',
    health_insights: 'Key insights to maximize your performance.',
    potential: 'How much do you believe in your ability to transform?',
    personalization: 'Final questions to perfect your plan.',
    name: 'How should we address you, warrior?',
    date_of_birth: 'This helps us calculate your fitness age.',
    fitness_age: 'Your body\'s true age based on your fitness level.',
    email: 'We\'ll send your personalized plan and progress updates.',
    marketing: 'Get tips, motivation, and exclusive content.',
    results_prediction: 'Based on your data, here\'s what you can achieve.',
    processing: 'Our AI is building your personalized commando training program.',
    quote: 'The pain you feel today will be the strength you feel tomorrow.',
  },
  female: {
    gender: 'Let us personalize your wellness journey.',
    age: 'This helps us create an age-appropriate fitness plan.',
    primary_goal: 'What do you want to achieve? We\'re here to help you get there.',
    body_type: 'No judgment here. Just understanding where you\'re starting from.',
    problem_areas: 'Which areas would you like to focus on?',
    desired_body: 'Envision your healthiest, most confident self.',
    experience: 'Tell us about your fitness background.',
    philosophy: 'Effective, equipment-free workouts designed for real women.',
    fitness_history: 'When did you last feel your best?',
    metabolism: 'Every body is different. Let\'s understand yours.',
    obstacles: 'What\'s been getting in the way? We\'ll help you overcome it.',
    pushup_assessment: 'Do your best! This helps us customize your workouts.',
    pullup_assessment: 'Any amount is great! We\'ll build from here.',
    fitness_summary: 'Here\'s your personalized fitness profile.',
    philosophy_comparison: 'Why this approach works better for lasting results.',
    training_frequency: 'How often would you like to work out?',
    workout_duration: 'Find time that works for your schedule.',
    workout_time: 'When do you feel most energized?',
    hormonal_info: 'Understanding your hormones for better results.',
    height_weight: 'Basic measurements for your personalized plan.',
    target_weight: 'Set a healthy, achievable goal.',
    success_story: 'Women who found their confidence and strength.',
    water_intake: 'Hydration is self-care.',
    activity_level: 'Tell us about your typical day.',
    energy_level: 'How are your energy levels?',
    sleep_habits: 'Quality sleep is essential for wellness.',
    motivation: 'What inspires you to keep going?',
    health_insights: 'Personalized insights for your wellness journey.',
    potential: 'You have more potential than you know.',
    personalization: 'Just a few more questions!',
    name: 'What\'s your name?',
    date_of_birth: 'When\'s your birthday?',
    fitness_age: 'See how fit your body really is!',
    email: 'We\'ll send you your personalized plan.',
    marketing: 'Get weekly tips and encouragement.',
    results_prediction: 'See what\'s possible for you.',
    processing: 'Creating your personalized wellness plan.',
    quote: 'You are stronger than you think.',
  },
};

// ==================== MOTIVATIONAL QUOTES ====================

export const MOTIVATIONAL_QUOTES: Record<UserGender, string[]> = {
  male: [
    'Pain is weakness leaving the body.',
    'The only easy day was yesterday.',
    'Sweat in training or bleed in combat.',
    'Discipline equals freedom.',
    'Winners train, losers complain.',
    'The body achieves what the mind believes.',
    'No excuses. No shortcuts. No surrender.',
    'Every rep counts. Every set matters.',
    'You don\'t find willpower. You create it.',
    'Be the weapon you were born to be.',
  ],
  female: [
    'She believed she could, so she did.',
    'Strong is the new beautiful.',
    'Progress, not perfection.',
    'Your only competition is yourself.',
    'Confidence is your best outfit.',
    'Embrace the journey, love the process.',
    'You\'re one workout away from a good mood.',
    'Strong women lift each other up.',
    'Fall in love with taking care of yourself.',
    'You are worthy of your own time.',
  ],
};

// ==================== BUTTON TEXT ====================

export const BUTTON_TEXT: Record<UserGender, Record<string, string>> = {
  male: {
    continue: 'Continue Mission',
    start: 'Begin Assessment',
    complete: 'Complete Training',
    next: 'Next',
    back: 'Retreat',
    submit: 'Lock It In',
    skip: 'Skip (Weak Move)',
    getStarted: 'Start Your Mission',
    generatePlan: 'Deploy My Plan',
  },
  female: {
    continue: 'Continue',
    start: 'Let\'s Begin',
    complete: 'Complete',
    next: 'Next Step',
    back: 'Go Back',
    submit: 'Save',
    skip: 'Skip for Now',
    getStarted: 'Get Started',
    generatePlan: 'Create My Plan',
  },
};

// ==================== COLOR THEMES ====================

export const COLOR_THEMES: Record<UserGender, {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string[];
  background: string[];
}> = {
  male: {
    primary: '#10b981', // Emerald/military green
    secondary: '#f59e0b', // Amber/warning
    accent: '#ef4444', // Red/intensity
    gradient: ['#10b981', '#059669'],
    background: ['#0f172a', '#1e293b', '#0f172a'],
  },
  female: {
    primary: '#ec4899', // Pink
    secondary: '#8b5cf6', // Purple
    accent: '#06b6d4', // Cyan
    gradient: ['#ec4899', '#db2777'],
    background: ['#1e1b4b', '#312e81', '#1e1b4b'],
  },
};

// ==================== HELPER FUNCTIONS ====================

export function getHeadline(gender: UserGender, step: CommandoOnboardingStep): string {
  return HEADLINES[gender][step] ?? 'Continue';
}

export function getDescription(gender: UserGender, step: CommandoOnboardingStep): string {
  return DESCRIPTIONS[gender][step] ?? '';
}

export function getRandomQuote(gender: UserGender): string {
  const quotes = MOTIVATIONAL_QUOTES[gender];
  return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getButtonText(gender: UserGender, action: string): string {
  return BUTTON_TEXT[gender][action] ?? action;
}

export function getColorTheme(gender: UserGender) {
  return COLOR_THEMES[gender];
}

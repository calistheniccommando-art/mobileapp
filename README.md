# Calisthenic Commando - Military-Style Fitness & Transformation App

A comprehensive mobile fitness application featuring **highly visual, gender-specific onboarding**, bodyweight training programs, meal planning (1-2 meals/day), and intermittent fasting with sequential exercise progression.

## Product Overview

Calisthenic Commando provides users with:
- **Login screen** for App Review: Demo credentials (demo@calistheniccommando.co.uk / Demo@12345)
- **Visual, emotion-driven onboarding**: Highly visual 37-step onboarding with gender-specific imagery, interactive body maps, and inspiring victory visualizations
- **Gender-specific experience**: Male (military-style, challenge-oriented) vs Female (empowering, nurturing) with differentiated visuals and tone
- **37-step comprehensive onboarding** collecting detailed fitness assessments and personalization data
- **Bodyweight-only workouts** with sequential exercise completion (no skipping)
- **Meal planning** with 1-2 meals per day (never 3), aligned to fasting windows
- **Intermittent fasting** schedules based on activity level and metabolic type
- **Fitness assessments** including push-up testing and wall-sit endurance (no equipment required)
- **PDF export** for daily and weekly plans
- **30-day trial** at ₦3,000 (one-time only per user)

## Visual Onboarding Experience

The onboarding has been refactored to be **highly visual and emotionally engaging**:

### Step 1: Gender Selection
- **Large visual cards** with gradient backgrounds
- Male card: Dark military tones (emerald green gradients)
- Female card: Confident feminine imagery (pink gradients)
- Height: 224px cards with prominent icons and imagery placeholders

### Step 2: Mission/Goal Selection
- **Visual mission cards** with unique gradient backgrounds for each goal
- Each card is 144px tall with:
  - Custom gradient based on goal type (blue for muscle, red for fat loss, etc.)
  - Large icons (28px) in white
  - Motivational copy tailored to gender
  - Selection indicators

### Step 3: Body Type Assessment
- **Visual body silhouettes** using Unicode characters and shapes
- Interactive cards showing body type representations
- Width variations representing different body types (slim → heavy)
- Gender-specific descriptions and encouragement

### Step 4: Problem Areas (Interactive Body Map)
- **Interactive body visualization** with clickable markers
- Illustrated body silhouette with head, torso, and legs
- Tappable problem area markers that highlight on selection
- Both visual map AND list view for accessibility
- Gender-specific problem areas (male: chest, arms, belly, legs; female: arms, belly, hips, thighs)

### Step 5: Victory Visualization (Desired Body)
- **Emotional, inspiring physique cards** at 192px height
- Each option features:
  - Unique gradient background representing the physique type
  - Motivational quotes and descriptions
  - Trophy icon watermark for inspiration
  - Gender-specific copy (male: "Combat Ready", female: "Toned & Defined")
- Encouraging message at bottom with heart icon

### Gender-Specific Tone & Copy
- **Male**: Direct, commanding, military-inspired ("MISSION ACTIVATED", "Visualize Your Victory")
- **Female**: Encouraging, supportive, confidence-building ("Your Journey Begins", "Your Dream Body")
- All copy is emotionally resonant and makes users feel "seen"

## Architecture

### User App (Mobile)

Built with Expo SDK 53 and React Native, the app follows a modular component-based architecture designed for scalability.

```
src/
├── app/                    # Expo Router file-based routes
│   ├── (tabs)/            # Tab navigation screens
│   │   ├── index.tsx      # Today - Daily plan dashboard
│   │   ├── workouts.tsx   # Workouts list
│   │   ├── meals.tsx      # Meals list
│   │   └── profile.tsx    # User profile & settings
│   ├── login.tsx          # Login screen (App Review - demo@calistheniccommando.co.uk)
│   ├── workout/[id].tsx   # Workout detail with exercises
│   ├── exercise/[id].tsx  # Exercise detail with video
│   ├── meal/[id].tsx      # Meal detail with nutrition
│   ├── weekly-plan.tsx    # Weekly plan overview with PDF export
│   ├── onboarding.tsx     # 37-step Commando onboarding wizard
│   ├── paywall.tsx        # Gender-aware subscription paywall
│   ├── welcome.tsx        # Post-payment welcome with Day 1 plan
│   ├── exercise-session.tsx # Full-screen exercise with timers
│   ├── fasting-detail.tsx # Fasting detail with health benefits
│   └── pdf-preview.tsx    # PDF generation & export (daily + weekly)
├── components/            # Reusable UI components
├── data/                  # Mock data (to be replaced with API)
│   └── mock-data.ts       # Workouts, meals, exercises, plan generators
├── lib/
│   ├── state/             # Zustand stores
│   │   ├── user-store.ts         # User profile, auth, legacy personalization
│   │   ├── commando-store.ts     # Commando onboarding state & plan generation
│   │   ├── subscription-store.ts # Subscription, trial, payment, welcome state
│   │   ├── progress-store.ts     # Daily/weekly progress tracking, milestones
│   │   └── app-store.ts          # App state & personalized daily plan
│   ├── content/           # Gender-specific content
│   │   └── gender-content.ts  # Headlines, descriptions, quotes by gender
│   ├── services/          # Business logic services
│   │   ├── daily-plan-engine.ts        # Daily Plan Engine core
│   │   ├── personalized-plan-engine.ts # Exercise, fasting, meal generation
│   │   ├── progression-engine.ts       # Difficulty adaptation over time
│   │   ├── email-service.ts            # Confirmation email generation
│   │   ├── admin-content-service.ts    # Admin CRUD for exercises/meals/fasting
│   │   ├── admin-onboarding-service.ts # Admin hooks for onboarding data
│   │   ├── admin-dashboard-service.ts  # Admin overrides and messaging
│   │   ├── pdf-service.ts              # PDF generation with templates
│   │   ├── meal-service.ts             # Meal scheduling
│   │   └── fasting-service.ts          # Fasting status calculation
│   ├── hooks/             # React hooks
│   │   └── use-daily-plan.ts     # Hooks for Daily Plan Engine
│   └── cn.ts              # Tailwind class merge utility
├── components/
│   └── MilestoneCelebration.tsx # Milestone celebration modal
└── types/
    ├── fitness.ts         # Core fitness TypeScript definitions
    ├── commando.ts        # Commando onboarding & personalization types
    └── subscription.ts    # Subscription plans, payment, email types
```

### Data Flow

1. **User Profile** (persisted in AsyncStorage via Zustand)
   - Basic info: email, first name, last name, gender, date of birth
   - Physical: weight, height
   - Activity level (sedentary, moderate, active)
   - Personalized settings (auto-assigned): fasting plan, workout difficulty, meal intensity
   - Legal: terms & privacy acceptance timestamps

2. **Personalization System** (rule-based)
   - Fasting plan assignment based on weight + activity level
   - Workout difficulty scaling (beginner/intermediate/advanced)
   - Meal intensity categorization (light/standard/high-energy)

3. **Daily Plans** (personalized from user settings)
   - Workout filtered by user's difficulty level
   - Meals selected based on calorie intensity
   - Fasting window from assigned plan

4. **Meal System** (plan-driven, not browsable)
   - **Users ONLY see meals assigned for today and tomorrow**
   - **No global meal browsing** - meals are personalized and time-bound
   - **3-Option Selection System**:
     - When a meal window opens, users see exactly 3 meal options
     - Options are pre-selected by AI based on goal, Nigerian food availability, calorie target, and fasting plan
     - User selects one, which becomes locked for that meal window
     - Other options disappear after selection
   - **Meal Count Rules**:
     - 0 meals (24-hour fast days)
     - 1 meal (OMAD - One Meal A Day)
     - 2 meals (most common)
     - **Never 3 meals** - enforced by fasting logic
   - **Meal Completion Flow**:
     - User marks meal as "Meal eaten"
     - System logs completion and activates next meal countdown
     - Completed meals show visual completion state
   - **Tomorrow's Preview**:
     - Meals tab shows tomorrow's meals as locked preview
     - Reduces anxiety and improves commitment
     - Helps users plan ahead

5. **Progress Tracking** (persisted in Zustand)
   - Completed exercises
   - Meal selection and completion with timestamps
   - Fasting compliance
   - Workout history

### Key Features

#### Commando Onboarding Wizard (37 Steps)

The onboarding is gender-specific with identical data collection but different tone:

**Male Tone**: Military-style, challenge-oriented, discipline-focused
- Headlines: "Welcome, Soldier", "What's Your Mission?", "Drop and Give Me Your Max!"
- Button text: "Continue Mission", "Deploy My Plan"
- Colors: Emerald green (#10b981), amber, red

**Female Tone**: Empowering, nurturing, confidence-building
- Headlines: "Welcome, Beautiful", "What's Your Goal?", "Let's See Your Strength"
- Button text: "Continue", "Create My Plan"
- Colors: Pink (#ec4899), purple, cyan

**Steps 1-13 (Prompt 1A - Implemented)**:
1. **Gender** - "I am a Male" / "I am a Female" (determines tone for entire flow)
2. **Age Category** - 18-29, 30-39, 40-49, 50+
3. **Primary Goal** - Build Muscle, Lose Weight, Both, Get Fit & Toned
4. **Body Type** - Slim, Average, Big/Curvy, Heavy
5. **Problem Areas** - Multi-select (gender-specific options)
6. **Desired Body** - Fit, Strong, Athletic (male) / Toned, Lean, Curvy & Fit (female)
7. **Experience Level** - Never, Beginner, Some, Regular, Advanced
8. **Philosophy Intro** - The Commando Way (male) / Our Wellness Philosophy (female)
9. **Fitness History** - Last peak shape: <1yr, 1-3yrs, >3yrs, Never
10. **Metabolism** - Fast, Balanced, Slow
11. **Obstacles** - Multi-select: Time, Motivation, Knowledge, Consistency, Injuries
12. **Push-up Assessment** - None, 1-10, 11-25, 25+
13. **Pull-up Assessment** - None, 1-5, 6-10, 10+
14. **Fitness Summary** - Shows calculated Strength & Stamina scores

**Steps 15-27 (Prompt 1B - Implemented)**:
15. **Philosophy Comparison** - Gym vs Military Calisthenics benefits
16. **Training Frequency** - 3, 4-5, or 6 days per week
17. **Workout Duration** - 20-30, 30-45, or 45-60 minutes
18. **Workout Time** - Morning, Afternoon, Evening, or Flexible
19. **Hormonal Info** - Education on testosterone/estrogen and cortisol optimization
20. **Height Input** - Height in cm for BMI calculation
21. **Weight Input** - Current weight in kg
22. **Target Weight** - Goal weight with difference calculation
23. **BMI Results** - Visual BMI scale with category and motivational message
24. **Success Story** - Gender-specific transformation story with stats
25. **Water Intake** - Daily hydration habits (<1L, 1-2L, 2-3L, 3+L)
26. **Activity Level** - Sedentary, Lightly Active, Moderately Active, Very Active
27. **Energy Level** - Low, Moderate, High, Variable
28. **Sleep Habits** - Hours per night (5-9h) + quality (Poor, Fair, Good, Excellent)

**Steps 28-37 (Prompt 1C - Implemented)**:
28. **Motivation Type** - Self-driven, Needs push, Accountability partner, Rewards-focused
29. **Health Insights** - Summary of BMI, sleep, energy, metabolism, activity level with personalized tips
30. **Potential Assessment** - Motivational screen showing user's transformation potential
31. **Confidence Level** - Not sure, Somewhat confident, Confident, Very confident
32. **Name Entry** - First name and last name fields
33. **Date of Birth** - Date picker for birthday (calculates actual age)
34. **Fitness Age** - Shows body's "true" fitness age based on assessment data
35. **Email Registration** - Email input with validation
36. **Marketing Preferences** - Opt-in toggle for tips, motivation, and exclusive content
37. **Results Prediction** - Timeline showing expected weight change and transformation milestones
38. **Processing Screen** - Animated loading with status updates (analyzing profile, building plan, etc.)
39. **Motivational Quote** - Gender-specific quote with "Begin Your Journey" CTA, completes onboarding

#### Fitness Assessment System

Based on push-up and pull-up tests:

| Push-ups | Strength Score |
|----------|---------------|
| 25+ | 90% |
| 11-25 | 70% |
| 1-10 | 45% |
| 0 | 20% |

| Pull-ups | Stamina Score |
|----------|--------------|
| 10+ | 90% |
| 6-10 | 70% |
| 1-5 | 50% |
| 0 | 25% |

**Overall Fitness Level**:
- Advanced (Combat Ready/Advanced): Average >= 75%
- Intermediate (Solid Foundation/Intermediate): Average >= 50%
- Beginner (New Recruit/Beginner): Average < 50%

#### Personalization Rules

| Activity Level | Weight (kg) | Fasting Plan | Workout Difficulty | Meal Intensity |
|---------------|-------------|--------------|-------------------|----------------|
| Sedentary     | >= 80       | 14:10        | Beginner          | Light          |
| Sedentary     | < 80        | 16:8         | Beginner          | Light          |
| Moderate      | >= 85       | 14:10        | Intermediate      | Standard       |
| Moderate      | < 85        | 16:8         | Intermediate      | Standard       |
| Active        | Any         | 12:12        | Advanced          | High Energy    |

#### Personalized Plan Engine

The app uses a comprehensive personalized plan engine (`src/lib/services/personalized-plan-engine.ts`) that generates exercises, fasting plans, and meals based on onboarding data.

**Exercise Generation Logic**:
- Exercises selected based on gender, age, BMI, body type, fitness level, and primary goal
- Three difficulty tiers: Beginner (25+ exercises), Intermediate (20 exercises), Advanced (20+ exercises)
- Day-specific muscle group rotation (Push/Pull/Legs/Core pattern)
- Progressive overload: Sets increase every 2 weeks, reps increase weekly
- Sequential execution enforced (no skipping)
- Countdown timers for timed exercises with audio/visual cues
- Collapsible exercise cards: Name visible, expand for details, Start/Complete buttons

#### Full Exercise Library

The exercise library (`src/lib/data/exercise-library.ts`) contains 80+ comprehensive calisthenic military exercises with AI generation prompts.

**Exercise Categories**:

| Difficulty | Count | Examples |
|------------|-------|----------|
| **Beginner** | 36+ | Wall push-ups, Knee push-ups, Glute bridges, Bodyweight squats, Dead bugs, Marching in place, Cat-cow stretch, Butt kicks, Chair tricep dips |
| **Intermediate** | 25+ | Standard push-ups, Diamond push-ups, Mountain climbers, Jump squats, Burpees, Inverted rows, Flutter kicks, Skater jumps, Lateral lunges |
| **Advanced** | 30+ | Archer push-ups, One-arm push-ups, Pistol squats, Muscle-ups, Dragon flags, Handstand push-ups, Nordic curls, Hindu push-ups, Explosive pull-ups |

**Exercise Data Structure**:
```typescript
interface ExerciseDefinition {
  id: string;
  name: string;
  shortDescription: string; // <15 words
  detailedInstructions: string[];
  difficulty: DifficultyLevel;
  muscleGroups: MuscleGroup[];
  type: ExerciseType; // strength, cardio, flexibility, hiit

  // Base parameters (adjusted by progression engine)
  baseSets: number;
  baseReps: number | string;
  baseDuration?: number;
  baseRestTime: number;

  // Progression
  progressionRate: number; // 0.5-1.5
  difficultyScore: number; // 1-10

  // AI Generation Prompts (ADMIN ONLY - users never see these)
  videoPrompt: string;
  imagePrompt: string;

  // Metadata
  caloriesPerMinute: number;
  equipmentNeeded: string[];
  contraindications: string[];
  alternatives: string[];
}
```

**AI Video/Image Prompt Examples** (Admin Use Only):
```
// Video Prompt
"Military fitness instructor demonstrating wall push-ups with proper form, side angle view, indoor gym setting, professional lighting"

// Image Prompt
"Athletic person performing wall push-up at the bottom position, showing proper arm and body alignment, gym background"
```

**IMPORTANT: AI Prompt Visibility**
- AI prompts are for **admin use only**
- Users **never** see AI prompts
- Admin copies prompts to video/image generators
- Admin uploads finished media for users to view
- The `AdminExerciseService` provides methods to access and manage prompts

**Admin AI Prompt Features** (`src/lib/services/admin-exercise-service.ts`):
- `getExerciseAIPrompts(id)`: Get video/image prompts for specific exercise
- `getAllAIPrompts()`: Get all prompts for batch media generation
- `updateAIPrompts(id, prompts)`: Update prompts for any exercise
- `getPromptForCopy(id, type)`: Get prompt text ready for copying
- `generateEnhancedVideoPrompt(exercise, options)`: Generate detailed video prompt
- `generateEnhancedImagePrompt(exercise, options)`: Generate detailed image prompt

**Exercise Selection Service** (`src/lib/services/exercise-selection-service.ts`):
- Dynamic workout generation based on user profile
- Day-specific muscle group rotation (Push/Pull/Legs/Core)
- Automatic difficulty adjustment based on BMI, goal, experience
- Warmup and cooldown exercise selection
- Sequential exercise enforcement (no skipping)
- Progress-based adaptation

**Admin Exercise Management** (`src/lib/services/admin-exercise-service.ts`):
- Create, update, deactivate exercises
- Exercise validation with error/warning feedback
- Bulk operations (activate/deactivate multiple)
- Import/export exercises as JSON
- Custom exercise support with persistent storage
- Exercise override system for built-in exercises
- Statistics and reporting

**Fasting Plan Logic**:
- Adapts to BMI category, goal, activity level, and metabolic type
- Very overweight (BMI ≥ 30): 18:6 fasting, 1 meal/day
- Overweight (BMI 25-30): 16:8 or 18:6 based on goal
- Normal weight: 14:10 to 16:8 based on goal
- Underweight: 12:12 for maximum nutrient intake
- Never recommends 3 meals/day
- Real-time countdown timers for fasting/eating windows

**Meal Plan Logic**:
- **Plan-driven, not browsable**: Users ONLY see meals assigned for today and tomorrow
- **No global meal catalog**: No "Browse All Meals" section - all meals are time-bound and personalized
- **3-Option Selection System**:
  - When meal window opens, system shows exactly 3 meal options
  - Options pre-selected by AI based on: goal, Nigerian food availability, calorie target, fasting plan
  - User selects one option, which locks for that meal window
  - Other 2 options disappear after selection
- **Meal Count Rules** (enforced by fasting logic):
  - 0 meals on 24-hour fast days
  - 1 meal for OMAD (One Meal A Day)
  - 2 meals (most common)
  - **Never 3 meals** - hard limit
- **Nigerian food database** with locally available ingredients
- Calorie targets calculated using Mifflin-St Jeor equation
- Protein targets: 1.4-2.0g per kg based on goal
- Meal timing integrated with fasting schedule
- **Meal Completion Flow**:
  - Next meal countdown with "Mark as Eaten" button
  - Completed meals show visual state (checked, dimmed)
  - System logs completion timestamp and activates next meal countdown
- **Tomorrow's Preview**:
  - Meals tab shows tomorrow's meals as locked preview
  - Reduces anxiety and improves commitment
  - Helps users plan ahead without allowing interaction

#### Subscription & Payment System

The app uses a subscription-based model with gender-aware paywall screens (`src/app/paywall.tsx`).

**Pricing Plans**:
| Plan | Duration | Price (₦) | Daily Cost | Features |
|------|----------|-----------|------------|----------|
| Monthly | 1 month | ₦10,000 | ₦333/day | Full app access, personalized workouts, meals, fasting |
| 3-Month | 3 months | ₦28,000 | ₦311/day | Everything in Monthly + lower daily cost |
| Hero (6-Month) | 6 months | ₦50,000 | ₦278/day | Everything + physical guidebook shipped |
| Ultimate (12-Month) | 12 months | ₦96,000 | ₦263/day | Everything + book + monthly trainer check-ins |

**Trial Option**:
- ₦3,000 for 3 days trial (monthly plan only)
- After trial: ₦7,000 to continue for remaining month
- Full monthly price: ₦10,000

**Gender-Specific Paywall Content**:
- Male: Military-style messaging ("Deploy My Plan", "Recon Mission")
- Female: Empowering messaging ("Start My Journey", "Try 3 Days Free")

**Payment Flow**:
1. User completes 37-step onboarding → redirected to paywall
2. User selects plan (or trial) → shown price summary
3. Plans with physical book → shipping address form
4. Payment processing → confirmation email sent
5. Navigation to main app dashboard

**Email Confirmation**:
- Gender-specific email templates with personalized content
- Plan details, start/end dates, features included
- Motivational quotes and call-to-action buttons
- Service: `src/lib/services/email-service.ts`

**State Management** (`src/lib/state/subscription-store.ts`):
- Plan selection and trial tracking
- Payment processing status
- Subscription status checks (`canAccessApp()`, `isSubscriptionActive()`)
- Shipping address storage for physical book plans
- Payment history
- Welcome flow tracking (`hasSeenWelcome`, `markWelcomeSeen()`)
- Subscription day calculation (`getSubscriptionDay()`)

#### Post-Payment Welcome Flow

After payment completion, users see a personalized welcome screen (`src/app/welcome.tsx`) before accessing the main dashboard.

**Gender-Specific Welcome Content**:
| Element | Male | Female |
|---------|------|--------|
| Headline | "MISSION ACTIVATED" | "Your Journey Begins" |
| Encouragement | Military, challenge-oriented | Supportive, empowering |
| CTA Button | "BEGIN MISSION" | "Start My Journey" |
| Icons | Shield, Trophy | Heart, Sparkles |

**Welcome Screen Features**:
- Day number badge (Day 1, Day 2, etc.) with trial indicator
- Personalized greeting with user's first name
- Encouragement message based on gender tone
- Day 1 plan preview showing:
  - Exercise list (first 3 exercises with "more" count)
  - Fasting schedule with eating/fasting windows
  - Meal plan with calorie information
- Quick stats: estimated calories, workout duration, exercise count
- Daily motivational quote
- CTA button to enter main dashboard

**Flow Logic**:
1. User completes onboarding → navigates to paywall
2. User completes payment → `completePayment()` called
3. Layout checks `canAccessApp()` = true, `hasSeenWelcome` = false → redirects to `/welcome`
4. User views welcome screen → taps "Begin Mission" / "Start My Journey"
5. `markWelcomeSeen()` called → `hasSeenWelcome` = true
6. Layout redirects to `/(tabs)` (main dashboard)

**Admin Service** (`src/lib/services/admin-onboarding-service.ts`):
- Transform onboarding data to admin profile format
- Validate onboarding data completeness
- Get AI plan assignment summary
- Generate admin reports for users
- Hooks: `useAdminUserProfile()`, `useOnboardingValidation()`, `usePlanAssignment()`

#### Daily Dashboard & Day-by-Day Progression

The daily dashboard (`src/app/(tabs)/index.tsx`) provides a fully interactive daily experience with sequential exercise flow.

**Dashboard Structure**:
- Date and day number display (Day 1, Day 2, etc.)
- Personalized greeting with user's name and goal badge
- Gender-specific theme (male: emerald, female: pink)
- Daily progress bar showing completion percentage
- Milestone celebrations on achievements

**Workout Display Logic**:
- Collapsible exercise list with sequential enforcement
- Cannot skip exercises - must complete in order
- Exercise cards show: name, sets/reps, difficulty
- Expand for: description, AI guidance, Start button
- "Start Now" begins exercise session with countdown timers
- 60-second rest timer between exercises (with audio/haptic feedback)
- Complete button marks exercise done and advances to next

**Exercise Session Screen** (`src/app/exercise-session.tsx`):
- Full-screen exercise view with progress indicator
- Timed exercises: circular countdown with pause/resume
- Rep-based exercises: set counter with completion tracking
- Visual and haptic feedback during countdown
- Rest timer screen between exercises
- Session complete celebration

**Meal Display Logic**:
- **Today Screen**:
  - Shows clear statement: "You can eat X meal(s) today"
  - Displays only the next available meal window
  - Examples: "Meal 1 available now", "Meal 2 available in 4h 12m"
  - On fasting days: "Today is a full fasting day" with countdown
- **Meals Tab** (ONLY today + tomorrow):
  - Today's scheduled meals with completion tracking
  - Tomorrow's meals shown as locked preview (not selectable)
  - **NO global meal browsing** - removed "Browse All Meals" section
  - Fasting days show: "No meals today" with explanation
- **Meal Selection Flow**:
  - When meal window opens: 3 AI-selected options appear
  - User selects 1 option → becomes current meal
  - Other 2 options disappear
  - Selected meal locks and shows "Mark as Eaten" button
- **Meal Detail Page**:
  - Meal name, description, ingredients
  - Cooking instructions
  - Protein/fiber emphasis
  - Why this meal supports user's goal
  - Reflects user's portion size, goal, and current phase
- **Meal Completion**:
  - "Meal eaten" button logs completion
  - System marks meal as completed in progress tracking
  - Activates next meal countdown or fasting countdown
  - Completed meals show visual state (checked icon, dimmed)

**Fasting System** (`src/lib/state/fasting-store.ts` + `src/lib/hooks/use-fasting-countdown.ts`):
- **Comprehensive State Management**:
  - Supports 6 fasting types: 12:12, 14:10, 16:8, 18:6, 20:4, 24:0
  - Each type has fastingHours, eatingHours, label, and description
  - Persistent state survives app reload, backgrounding, and device restart
- **Daily Fasting Cycle Tracking**:
  - Automatic daily reset based on device date
  - Tracks: fastingStartedAt, fastingEndedAt, eatingWindowStartedAt, eatingWindowEndedAt
  - Marks cycles as completed, broken, or missed
  - Stores cycle history for compliance tracking
- **Persistent Countdown Timers**:
  - Updates every second with accurate remaining time
  - Recalculates correctly using stored timestamps (not intervals)
  - Handles timezone changes and manual device time changes gracefully
  - Prevents negative countdown values
  - Shows hours, minutes, and seconds remaining
- **Fasting Detail Screen** (`src/app/fasting-detail.tsx`):
  - Live countdown timer with circular progress indicator
  - Current status: "FASTING ACTIVE" or "EATING WINDOW OPEN"
  - Eating window start/end times with AM/PM formatting
  - Health benefits based on user's goal (weight loss, muscle gain, general)
  - Gender-specific tips and encouragement
  - Plan info with difficulty level
  - Shows if plan is locked (cannot change mid-cycle)
- **Visibility Rules**:
  - Fasting UI always visible for active users
  - Read-only during active fasting cycle
  - Plan changes blocked mid-fast (canChangePlan() check)
  - Informative error messages for restricted actions
- **Edge Case Handling**:
  - Detects large time jumps (>5 seconds) and recalculates
  - Handles overnight eating windows correctly
  - Auto-recovers from missed fasting windows
  - Continues correctly even if app not opened for days
- **Compliance & Streak Tracking**:
  - Weekly compliance percentage (completed cycles / total days)
  - Current streak calculation (consecutive completed days)
  - Cycle history persisted in AsyncStorage
- **Admin Ready**:
  - Extensible structure for admin dashboard control
  - Custom window support (setCustomWindow)
  - Force reset capability (forceResetCycle)
  - All state centralized and easily queryable

**Progress Tracking Store** (`src/lib/state/progress-store.ts`):
- Sequential exercise tracking (cannot skip)
- Meal completion with timestamps
- Fasting compliance percentage
- Daily/weekly/monthly statistics
- Milestone achievement tracking
- Streak calculation

**Progression Engine** (`src/lib/services/progression-engine.ts`):
- Adapts workout difficulty based on:
  - User's BMI and weight
  - Goal (weight loss, muscle gain, toning)
  - Experience level and fitness assessment
  - Completion rate and streak
- Adjusts:
  - Sets increase every 2 weeks
  - Reps increase weekly
  - Rest time reduction for advanced users
  - Calorie targets based on goal and progress
  - Fasting hours based on compliance
- Difficulty upgrade recommendations after 4 weeks of 80%+ completion

**Milestone Celebrations** (`src/components/MilestoneCelebration.tsx`):
- First workout completion
- 3, 7, 14, 30 day milestones
- Exercise count milestones (50, 100)
- Streak achievements
- Gender-specific celebration messaging
- Confetti animation effect

**Admin Dashboard Service** (`src/lib/services/admin-dashboard-service.ts`):
- Review daily plan assignments per user
- Override AI recommendations for:
  - Exercise sets/reps/difficulty
  - Meal portions and types
  - Fasting schedules
- Push motivational messages per user
- Schedule reminders and tips
- Track override history
- Generate user progress reports

#### Today Dashboard
- Personalized greeting with user's name and goal badge
- Gender-specific theme (male: emerald/slate, female: pink/purple)
- Real-time fasting status with countdown timer
- Collapsible exercise list with Start/Complete workflow
- Timed exercise countdown with progress bar
- Next meal countdown with nutritional info
- Meal tracking with "Mark as Eaten" buttons
- Quick actions for PDF export and weekly plan

#### Profile Screen
- User name and email display
- Personalization badges (workout difficulty, meal intensity)
- Physical stats (weight, height, activity level)
- Fasting plan selector with manual override option
- Reset profile option

#### Workouts
- Weekly workout schedule (filtered by user's difficulty level)
- Difficulty filter (All, Beginner, Intermediate, Advanced)
- Exercise list with sets, reps, rest times
- Video demonstrations with streaming playback
- Progress tracking per exercise with completion toggles
- Workout stats (total duration, calories, exercise count)

#### Exercise Details
- Full-screen video player with play/pause controls
- Exercise instructions with step-by-step guide
- Stats display (sets, reps, duration, rest, calories)
- Muscle group and difficulty tags
- Mark as complete functionality

#### Meals
- Daily meal plans with 4 meals (breakfast, lunch, dinner, snack)
- **Meals aligned to fasting windows** with scheduled times
- Calorie targets adjusted by meal intensity
- Detailed nutrition information (calories, protein, carbs, fat)
- Ingredient lists and cooking instructions
- Dietary tags (vegan, keto, high-protein, etc.)
- **Prep videos** for guided meal preparation
- Meal completion tracking

#### Meal Detail Screen
- Hero image with meal type badge and scheduled time
- **Fasting window alignment indicator** (within/outside eating window)
- Nutrition facts with macro breakdown
- **Prep video player** for guided cooking
- Ingredient checklist
- Step-by-step cooking instructions

#### Intermittent Fasting
- Four fasting plans: 12:12, 14:10, 16:8, 18:6
- **Real-time fasting status** with circular progress indicator
- **Compact fasting schedule** component for headers/cards
- Meal timing badges showing alignment with eating window
- Auto-assigned based on profile, with manual override
- Eating window notifications (future)

#### PDF Export
- Select what to include (workout, meals, fasting)
- **Daily or Weekly export** - toggle between export types
- **Meal schedule with scheduled times** aligned to fasting window
- Professional dark-themed PDF design with branding
- Weekly PDF includes 7-day overview with summary stats
- Native share functionality

#### Weekly Plan Screen
- Week selector showing Mon-Sun
- **Weekly summary stats** (total workouts, rest days, avg calories, total protein)
- Day-by-day breakdown with fasting window, workout, and meals
- Visual indicators for rest days vs workout days
- **Export Weekly PDF** button
- Tap any day to see detailed breakdown

## User Experience Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         UX FLOW DIAGRAM                             │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  App Launch  │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐      ┌────────────────────┐
│  First Time User?    │──Yes─▶│  Onboarding Wizard │
└──────┬───────────────┘      └─────────┬──────────┘
       │No                              │
       │                                │ 7 Steps:
       │                                │ 1. Welcome
       │                                │ 2. Auth (email/social)
       │                                │ 3. Profile info
       │                                │ 4. Physical stats
       │                                │ 5. Activity level
       │                                │ 6. Fasting preview
       │                                │ 7. Review & confirm
       │                                │
       ▼                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         HOME (Today Dashboard)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐       │
│  │ Fasting Status  │  │ Today's Workout │  │ Today's Meals   │       │
│  │ (tap to expand) │  │ (tap for detail)│  │ (tap for detail)│       │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘       │
│  ┌─────────────────────────────────────────┐                         │
│  │ Quick Actions: Export PDF | Weekly Plan │                         │
│  └─────────────────────────────────────────┘                         │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
         ┌───────────┬───────────┴───────────┬───────────┐
         │           │                       │           │
         ▼           ▼                       ▼           ▼
┌──────────────┐ ┌──────────────┐    ┌──────────────┐ ┌──────────────┐
│   Workout    │ │ Meal Detail  │    │  PDF Export  │ │ Weekly Plan  │
│   Detail     │ │   Screen     │    │   Screen     │ │   Screen     │
│              │ │              │    │              │ │              │
│ • Exercises  │ │ • Nutrition  │    │ • Daily/Week │ │ • Day Picker │
│ • Progress   │ │ • Ingredients│    │ • Options    │ │ • Summary    │
│ • Video      │ │ • Timing     │    │ • Generate   │ │ • Details    │
│              │ │ • Prep Video │    │ • Share      │ │ • Export     │
└──────┬───────┘ └──────────────┘    └──────────────┘ └──────────────┘
       │
       ▼
┌──────────────┐
│   Exercise   │
│   Detail     │
│              │
│ • Full video │
│ • Stats      │
│ • Complete   │
└──────────────┘

TAB NAVIGATION:
┌─────────┬─────────┬─────────┬─────────┐
│  Today  │ Workouts│  Meals  │ Profile │
│  (Home) │  List   │  List   │ Settings│
└─────────┴─────────┴─────────┴─────────┘
```

### Screen Descriptions

| Screen | Purpose | Key Features |
|--------|---------|--------------|
| **Onboarding** | First-time user setup | 7-step wizard with progress bar, auth, personalization |
| **Today (Home)** | Daily plan dashboard | Fasting status, workout card, meals overview, quick actions |
| **Workout Detail** | View workout exercises | Exercise list, progress tracking, reset option |
| **Exercise Detail** | Individual exercise | Video player, instructions, mark complete |
| **Meal Detail** | Individual meal info | Nutrition, ingredients, prep video, fasting alignment |
| **Meals Tab** | Daily meal schedule | Meals with scheduled times, fasting window indicator |
| **Weekly Plan** | 7-day overview | Day selector, summary stats, day details, PDF export |
| **PDF Export** | Generate shareable PDFs | Daily/weekly toggle, include options, share button |
| **Profile** | User settings | Stats, fasting plan selector, reset option |

### Navigation Patterns

- **Tab Navigation**: Home, Workouts, Meals, Profile (bottom tabs)
- **Stack Navigation**: Detail screens push on top of tabs
- **Modal Presentation**: PDF export slides up as modal
- **Deep Linking**: Workout/meal/exercise by ID from any screen

## Tech Stack

- **Framework**: Expo SDK 53, React Native 0.76.7
- **Navigation**: Expo Router (file-based)
- **Styling**: NativeWind (Tailwind for RN)
- **State**: Zustand with AsyncStorage persistence
- **Validation**: Zod schemas
- **Animations**: React Native Reanimated v3
- **Icons**: Lucide React Native
- **Video**: expo-video
- **PDF**: expo-print + expo-sharing

## Database Schema

The app uses a document-based data model (Firebase/Supabase compatible) with the following entities:

### Core Entities

```
src/types/database.ts       # Full schema definitions
src/lib/validation/         # Zod validation schemas
src/lib/database/           # Database service layer
src/lib/services/           # Business logic services
  ├── workout-service.ts    # Workout & exercise logic
  ├── meal-service.ts       # Meal scheduling & fasting integration
  ├── daily-plan-engine.ts  # Daily Plan Engine - core plan generation
  └── admin-service.ts      # Admin video, meal, fasting & content management
src/lib/hooks/              # React hooks for mobile
  └── use-daily-plan.ts     # Hooks for Daily Plan Engine integration
```

### Entity Relationship Diagram

```
User (1) ──────────────────── (N) DailyPlan
  │                                  │
  │                                  ├── (1) WorkoutPlan ── (N) Exercise
  │                                  │
  │                                  ├── (1) MealPlan ───── (N) Meal
  │                                  │
  └── assigned ── (1) FastingPlan ──┘

User (1) ──── (N) WorkoutProgress
User (1) ──── (N) FastingProgress

Exercise (0..1) ──── (1) Video
Meal (0..1) ──────── (1) Video

AdminUser (1) ──── (N) ContentAuditLog

PersonalizationRule ──── determines ──── User assignments
```

### Data Models

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| **UserProfile** | userId, email, firstName, lastName, weightKg, workType, assignedFastingPlanId, workoutDifficulty, mealCategory | Has many DailyPlans, WorkoutProgress, FastingProgress |
| **Exercise** | exerciseId, name, description, type, muscleGroups, difficulty, defaultSets, defaultReps, videoId | Belongs to many WorkoutPlans |
| **WorkoutPlan** | planId, name, dayNumber, difficulty, exercises[], totalDurationMinutes | Has many Exercises, belongs to many DailyPlans |
| **Meal** | mealId, name, mealType, category, ingredients[], nutrition, dietaryTags | Belongs to many MealPlans |
| **MealPlan** | mealPlanId, dayNumber, category, meals[], totalNutrition | Has many Meals, belongs to many DailyPlans |
| **FastingPlan** | fastingPlanId, pattern, fastingHours, eatingHours, eatingWindowStartTime, assignedWorkTypes | Assigned to many Users |
| **DailyPlan** | dailyPlanId, userId, date, workoutPlanId, mealPlanId, fastingPlanId, isRestDay | Belongs to User, references plans |
| **WorkoutProgress** | progressId, userId, dailyPlanId, completed, exercisesCompleted[] | Belongs to User and DailyPlan |
| **FastingProgress** | progressId, userId, date, scheduledTimes, actualTimes, completed | Belongs to User and DailyPlan |
| **Video** | videoId, name, type, videoUrl, linkedExerciseId/linkedMealId, status | Linked to Exercise or Meal |
| **PdfTemplate** | templateId, name, type, layout{}, isDefault | Used for PDF generation |
| **PersonalizationRule** | ruleId, conditions[], assignFastingPlanId, assignWorkoutDifficulty, assignMealCategory | Determines user assignments |

### Admin Entities

| Entity | Purpose |
|--------|---------|
| **AdminUser** | Staff accounts with roles (super_admin, admin, editor, viewer) |
| **ContentAuditLog** | Tracks all content changes for review |
| **Video** | Admin-uploaded exercise demos and meal prep videos |

### Service Layer

| Service | Purpose |
|---------|---------|
| **DailyPlanEngine** | Core engine for generating personalized daily plans |
| **PlanValidation** | Validates plan components with error/warning tracking |
| **PlanEnrichment** | Enriches workouts and meals with detailed metadata |
| **PDFService** | Generate HTML for daily/weekly PDFs with templates |
| **PDFFormatter** | Formats daily plans for PDF export |
| **AdminPDFService** | Create, update, delete custom PDF templates |
| **AdminOverrideService** | Create and apply admin overrides to plans |
| **MealService** | Meal filtering, scheduling, nutrition calculation |
| **FastingService** | Fasting status calculation, eating window management |
| **MealProgressService** | Track meal completion and daily progress |
| **AdminMealService** | CRUD for meals with video linking, categorization |
| **AdminMealPlanService** | CRUD for meal plans with nutrition recalculation |
| **AdminFastingService** | CRUD for fasting plans with personalization rules |
| **AdminVideoService** | Video upload, validation, approval workflow |
| **AdminExerciseService** | CRUD for exercises with video linking |
| **AdminWorkoutService** | CRUD for workout plans with exercise ordering |

### React Hooks

| Hook | Purpose |
|------|---------|
| **useEnrichedDailyPlan** | Main hook for accessing enriched daily plans |
| **useFastingStatus** | Real-time fasting status with auto-update |
| **useScheduledMeals** | Meals with timing and window alignment |
| **useWorkout** | Today's workout with completion tracking |
| **usePDFExport** | PDF data for export |
| **useWeekPlan** | Generate plans for entire week |
| **usePlanValidation** | Access validation errors and warnings |
| **useDailyStats** | Quick stats for dashboard display |

### Offline Caching Strategy

| Cache Type | Data |
|------------|------|
| **Permanent** | Exercises, WorkoutPlans, Meals, MealPlans, FastingPlans |
| **TTL (daily)** | User's DailyPlans for current week |
| **Always Fetch** | Progress data, User profile updates |

### Index Recommendations

- Users: `userId` (primary), `email` (unique), `workType + weightKg`
- DailyPlans: `dailyPlanId` (primary), `userId + date` (unique)
- WorkoutPlans: `planId` (primary), `difficulty`, `dayNumber + difficulty`
- Meals: `mealId` (primary), `mealType + category`, `dietaryTags` (array)

## Future Expansion (V2+)

The architecture is designed to support:

### User App
- Push notifications for fasting windows
- Workout timers and rest countdowns
- Progress photos and measurements
- Social sharing and challenges
- Apple Health / Google Fit integration
- Offline-first with sync
- Premium subscription via RevenueCat

## Admin Dashboard (Desktop Web Only)

The admin dashboard provides centralized content management for all app data. Access it at `/admin`.

### Features

#### Dashboard Overview (`/admin`)
- Quick stats: total users, content counts, pending approvals
- Content overview table with recent items
- Recent activity feed
- Quick action buttons

#### User Management (`/admin/users`)
- Search and filter users by status, work type, fasting plan
- View user details including personalization settings
- Bulk actions (activate, deactivate, export)
- User plan override capabilities

#### Workout Management (`/admin/workouts`)
- Three tabs: Workouts, Exercises, Videos
- Create, edit, delete workout plans
- Manage individual exercises with video links
- **Video approval workflow**: review pending uploads, approve/reject with notes
- Status tracking: Draft → Pending Review → Approved → Archived

#### Meal Management (`/admin/meals`)
- Two tabs: Meals, Meal Plans
- Create, edit, delete individual meals
- Nutrition information management
- Dietary tag assignment
- Meal plan composition by day

#### Fasting Plan Management (`/admin/fasting`)
- Visual timeline showing eating/fasting windows
- Assignment rules configuration by work type and weight
- Default plan designation
- Usage statistics per plan
- Personalization rules summary

#### Daily Plan Oversight (`/admin/daily-plans`)
- Date navigation to view any day's plans
- View all users' generated daily plans
- Status indicators: Auto-generated, Modified, Override
- Plan assignment history tracking
- Filter by status and search by user
- Edit/view individual plans
- Download plan PDFs

#### PDF Template Management (`/admin/pdf-templates`)
- Create and edit PDF export templates
- Configure layout: orientation, margins, font size
- Branding settings: logo, colors, footer text
- Section toggles: workout, meals, fasting, nutrition
- Style options: header style, icons, images
- Set default templates for daily/weekly exports

#### Audit Log (`/admin/audit-log`)
- Track all admin actions with timestamps
- Filter by category: user, workout, meal, fasting, system, auth
- Filter by action: create, update, delete, approve, reject, override
- Search by user, action, or target
- Export audit data for compliance

### Admin File Structure

```
src/app/admin/
├── _layout.tsx       # Admin shell with sidebar navigation
├── index.tsx         # Dashboard overview
├── users.tsx         # User management
├── workouts.tsx      # Workout & exercise management
├── meals.tsx         # Meal & meal plan management
├── fasting.tsx       # Fasting plan management
├── daily-plans.tsx   # Daily plan oversight
├── pdf-templates.tsx # PDF template editor
└── audit-log.tsx     # Audit log viewer
```

### Admin Roles

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access, delete users, system settings |
| **Admin** | Content management, approvals, overrides |
| **Editor** | Create/edit content, no approvals |
| **Viewer** | Read-only access for support |

### Content Status Flow

```
Draft → Pending Review → Approved → (optional) Archived
                      ↘ Rejected
```

## System Architecture

### Modular Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FITLIFE SYSTEM ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   MOBILE APP    │    │  ADMIN DASHBOARD │    │    BACKEND      │
│   (iOS/Web)     │    │  (Desktop Web)   │    │    (API)        │
└────────┬────────┘    └────────┬─────────┘    └────────┬────────┘
         │                      │                       │
         │  ┌───────────────────┴───────────────────┐   │
         └──┤           API LAYER                   ├───┘
            │  • REST endpoints                     │
            │  • Authentication (JWT)               │
            │  • Rate limiting                      │
            │  • Caching layer                      │
            └───────────────────┬───────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │           SERVICE LAYER               │
            │  • Daily Plan Engine                  │
            │  • PDF Generation                     │
            │  • Meal Scheduling                    │
            │  • Fasting Status                     │
            │  • Personalization Rules              │
            │  • Admin Override Service             │
            └───────────────────┬───────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            │           DATA LAYER                  │
            │  • User Profiles                      │
            │  • Workouts & Exercises               │
            │  • Meals & Meal Plans                 │
            │  • Fasting Plans                      │
            │  • Daily Plans                        │
            │  • Progress Tracking                  │
            │  • Audit Logs                         │
            └───────────────────────────────────────┘
```

### Component Responsibilities

| Component | Handles | Connects To |
|-----------|---------|-------------|
| **Mobile App** | User interface, offline mode, video playback, PDF viewing | API Layer via REST |
| **Admin Dashboard** | Content management, approvals, user oversight | API Layer via REST |
| **API Layer** | Authentication, request routing, caching | Service Layer |
| **Service Layer** | Business logic, plan generation, personalization | Data Layer |
| **Data Layer** | Data persistence, queries, migrations | Database |

### API Integration

```typescript
// src/lib/api/
├── types.ts       # Typed API request/response interfaces
├── client.ts      # Central API client with auth, retry, caching
└── index.ts       # Exports

// Key API endpoints:
POST /auth/login           # User authentication
GET  /user/profile         # Fetch user profile
GET  /plans/daily?date=    # Fetch daily plan
GET  /plans/weekly?start=  # Fetch weekly plan
POST /progress/workout     # Log workout completion
POST /progress/meal        # Log meal completion
POST /pdf/generate         # Generate PDF export
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW DIAGRAM                               │
└──────────────────────────────────────────────────────────────────────────┘

1. ONBOARDING FLOW
   User Input → Validation → Profile Creation → Personalization Rules → Assignments

2. DAILY PLAN GENERATION
   User Profile → Daily Plan Engine → Fetch Workout + Meals + Fasting → Enrich Data → Cache

3. CONTENT DISPLAY
   Cache Check → API Fetch (if needed) → Transform → Render → Track Progress

4. PDF GENERATION
   Plan Data → Template Selection → HTML Generation → PDF Conversion → Share

5. ADMIN CONTENT FLOW
   Upload → Validation → Draft Status → Review → Approve/Reject → Published
```

### Error Handling & Fallbacks

```typescript
// src/lib/services/error-handling.ts

// Fallback hierarchy:
1. Return cached data if available
2. Generate fallback from local mock data
3. Show placeholder content
4. Display user-friendly error message

// Error categories:
- Network: Offline, timeout, server errors
- Auth: Session expired, invalid token
- Content: Missing workout/meal/fasting
- Validation: Profile incomplete, invalid params
- System: Storage full, permissions
```

### Offline Support

| Data Type | Caching Strategy | TTL |
|-----------|-----------------|-----|
| User Profile | Persist in AsyncStorage | Permanent |
| Daily Plans (current week) | React Query cache | 1 hour |
| Workouts & Exercises | Prefetch + persist | 7 days |
| Meals & Meal Plans | Prefetch + persist | 7 days |
| Fasting Plans | Cache on first load | 7 days |
| Videos | Stream only (no offline) | N/A |

## Future-Proofing

### Feature Flags

```typescript
// src/lib/config/system-config.ts

// Current features (enabled):
enableOfflineMode: true
enablePDFExport: true
enableVideoStreaming: true
enableProgressTracking: true

// Future features (ready but disabled):
enableAISuggestions: false
enableAIWorkoutGeneration: false
enableAIMealSuggestions: false
enableVoiceCoaching: false
enableDietaryPreferences: false
enableSocialSharing: false
enableChallenges: false
enablePremiumFeatures: false
```

### AI Integration Ready

The architecture supports future AI integration:

```typescript
// AI suggestion interface
interface AISuggestion {
  id: string;
  type: 'workout' | 'meal' | 'fasting' | 'general';
  title: string;
  description: string;
  confidence: number;
  reasoning?: string;
  data?: unknown;
}

// Daily Plan Engine supports AI override
interface AdminOverride {
  component: 'workout' | 'meal' | 'fasting';
  reason: string;
  newValue: unknown;
  source: 'admin' | 'ai' | 'user';
}
```

### Expansion Points

| Future Feature | Ready In | Requires |
|---------------|----------|----------|
| **AI Workout Suggestions** | Daily Plan Engine | AI API integration |
| **AI Meal Recommendations** | Meal Service | AI API + dietary prefs |
| **Voice Coaching** | Mobile app | Audio API + TTS |
| **Dietary Restrictions** | User Profile | UI + meal filtering |
| **Progress Analytics** | Progress tracking | Analytics dashboard |
| **Social Challenges** | User system | Challenge service |
| **Premium Tiers** | Feature flags | Payment integration |
| **Wearable Sync** | Progress tracking | HealthKit/Fit APIs |

### Personalization Rules Engine

Rules are configurable via admin dashboard:

```typescript
interface PersonalizationRule {
  id: string;
  conditions: [{
    field: 'workType' | 'weight' | 'age' | 'fitnessGoal';
    operator: 'equals' | 'greaterThan' | 'lessThan' | 'in';
    value: unknown;
  }];
  assignments: {
    fastingPlan?: FastingPlan;
    workoutDifficulty?: DifficultyLevel;
    mealIntensity?: MealIntensity;
  };
  enabled: boolean;
}
```

## Integration Architecture

### File Structure for Integration

```
src/lib/
├── api/
│   ├── types.ts           # API request/response types
│   ├── client.ts          # API client with auth, retry, cache
│   └── index.ts           # Exports
├── hooks/
│   ├── use-daily-plan.ts  # Local plan generation hooks
│   └── use-api.ts         # React Query hooks for API
├── services/
│   ├── daily-plan-engine.ts  # Core plan generation
│   ├── meal-service.ts       # Meal scheduling
│   ├── pdf-service.ts        # PDF generation
│   ├── admin-service.ts      # Admin operations
│   └── error-handling.ts     # Error + fallback system
├── config/
│   └── system-config.ts      # Feature flags + config
└── state/
    ├── user-store.ts         # User profile + auth
    └── app-store.ts          # App state + daily plan
```

### Module Integration Flow

```
Mobile App
    │
    ├─→ use-api.ts (React Query hooks)
    │       │
    │       └─→ api/client.ts (API calls)
    │               │
    │               └─→ Backend API
    │
    ├─→ use-daily-plan.ts (Local generation)
    │       │
    │       └─→ daily-plan-engine.ts
    │               │
    │               ├─→ mock-data.ts (fallback)
    │               ├─→ meal-service.ts
    │               └─→ error-handling.ts
    │
    └─→ state stores (Zustand)
            │
            ├─→ user-store.ts (profile, auth)
            └─→ app-store.ts (daily plan, progress)
```

## Development Notes

### Running the App
The app runs automatically on port 8081 via Vibecode.

### Adding New Screens
1. Create file in `src/app/` directory
2. Register in `_layout.tsx` if needed
3. Use `router.push()` or `router.navigate()` to navigate

### State Management
- Use selectors with Zustand: `useUserStore(s => s.profile)`
- Persist critical data: user profile, progress
- Keep ephemeral state separate: active workout session

### Styling
- Use NativeWind classes for View/Text components
- Use inline styles for LinearGradient, CameraView, etc.
- Use `cn()` helper for conditional classes

### Adding New API Endpoints

1. Add types in `src/lib/api/types.ts`
2. Add method in `src/lib/api/client.ts`
3. Create React Query hook in `src/lib/hooks/use-api.ts`
4. Add error handling in `src/lib/services/error-handling.ts`

### Adding New Features

1. Add feature flag in `src/lib/config/system-config.ts`
2. Check flag with `isFeatureEnabled('featureName')`
3. Implement feature behind flag
4. Test with flag enabled/disabled

## Non-Goals for V1

- Live calorie tracking
- Medical diagnostics
- Real-time coaching chats
- Wearable integrations
- Android-specific features

-- ==========================================
-- CALISTHENIC COMMANDO SEED DATA
-- Migration: 002_seed_data.sql
-- ==========================================
-- Run this in your Supabase SQL Editor AFTER 001_initial_schema.sql
-- ==========================================

-- ==================== BEGINNER EXERCISES ====================

INSERT INTO exercises (id, name, description, instructions, youtube_video_id, muscle_groups, exercise_type, difficulty, default_sets, default_reps, default_duration_seconds, default_rest_seconds, calories_per_set)
VALUES
-- Wall Push-ups
(uuid_generate_v4(), 'Wall Push-ups', 'Stand facing wall, push body away using arms. Perfect starting point for building push-up strength.', 
 ARRAY['Stand arm''s length from a wall', 'Place palms flat on the wall at shoulder height', 'Bend elbows and lean toward the wall', 'Push back to starting position', 'Keep body straight throughout movement'],
 NULL, ARRAY['chest', 'shoulders', 'triceps']::muscle_group[], 'strength', 'beginner', 3, '12', NULL, 45, 3),

-- Incline Push-ups
(uuid_generate_v4(), 'Incline Push-ups', 'Push-ups with hands elevated on bench or step. Easier progression than floor push-ups.',
 ARRAY['Place hands on elevated surface (bench, step, or sturdy chair)', 'Walk feet back until body forms straight line', 'Lower chest toward the surface', 'Push back up to starting position', 'Keep core engaged throughout'],
 NULL, ARRAY['chest', 'shoulders', 'triceps']::muscle_group[], 'strength', 'beginner', 3, '10', NULL, 45, 4),

-- Knee Push-ups
(uuid_generate_v4(), 'Knee Push-ups', 'Modified push-ups performed on knees for easier execution while building strength.',
 ARRAY['Start on all fours with knees on the ground', 'Walk hands forward until body forms a straight line from knees to head', 'Lower chest toward the floor', 'Push back up until arms are straight', 'Keep hips from sagging or piking up'],
 NULL, ARRAY['chest', 'shoulders', 'triceps']::muscle_group[], 'strength', 'beginner', 3, '10', NULL, 45, 5),

-- Dead Bug
(uuid_generate_v4(), 'Dead Bug', 'Lying on back, extend opposite arm and leg alternately. Excellent for core stability.',
 ARRAY['Lie on back with arms extended toward ceiling', 'Lift legs with knees bent at 90 degrees', 'Lower right arm behind head while extending left leg', 'Return to start and repeat on opposite side', 'Keep lower back pressed into floor throughout'],
 NULL, ARRAY['core']::muscle_group[], 'strength', 'beginner', 3, '8 each side', NULL, 30, 4),

-- Bird Dog
(uuid_generate_v4(), 'Bird Dog', 'On all fours, extend opposite arm and leg simultaneously. Great for balance and core.',
 ARRAY['Start on hands and knees in tabletop position', 'Extend right arm forward and left leg back', 'Hold for 2-3 seconds', 'Return to start and repeat on opposite side', 'Keep hips level and core engaged'],
 NULL, ARRAY['core', 'back', 'glutes']::muscle_group[], 'strength', 'beginner', 3, '8 each side', NULL, 30, 3),

-- Glute Bridge
(uuid_generate_v4(), 'Glute Bridge', 'Lying on back, lift hips by squeezing glutes. Builds glute and core strength.',
 ARRAY['Lie on back with knees bent, feet flat on floor', 'Arms at sides, palms down', 'Push through heels to lift hips toward ceiling', 'Squeeze glutes at the top', 'Lower with control and repeat'],
 NULL, ARRAY['glutes', 'core']::muscle_group[], 'strength', 'beginner', 3, '12', NULL, 30, 4),

-- Forearm Plank
(uuid_generate_v4(), 'Forearm Plank Hold', 'Hold body straight in plank position on forearms. Core stability essential.',
 ARRAY['Place forearms on the ground with elbows under shoulders', 'Extend legs back, toes on the floor', 'Keep body in a straight line from head to heels', 'Engage core and squeeze glutes', 'Hold position without letting hips sag or pike'],
 NULL, ARRAY['core', 'shoulders', 'back']::muscle_group[], 'strength', 'beginner', 3, '1', 20, 45, 5),

-- Bodyweight Squat
(uuid_generate_v4(), 'Bodyweight Squat', 'Stand, lower hips back and down, then stand up. Fundamental lower body exercise.',
 ARRAY['Stand with feet shoulder-width apart', 'Push hips back and bend knees', 'Lower until thighs are parallel to floor (or as low as comfortable)', 'Keep chest up and weight in heels', 'Push through heels to stand back up'],
 NULL, ARRAY['legs', 'glutes']::muscle_group[], 'strength', 'beginner', 3, '12', NULL, 45, 6),

-- Standing Calf Raises
(uuid_generate_v4(), 'Standing Calf Raises', 'Rise up on toes, hold, then lower heels down. Builds calf strength.',
 ARRAY['Stand with feet hip-width apart', 'Rise up onto the balls of your feet', 'Squeeze calves at the top', 'Slowly lower heels back to the ground', 'Hold a wall for balance if needed'],
 NULL, ARRAY['legs']::muscle_group[], 'strength', 'beginner', 3, '15', NULL, 30, 3),

-- Lying Leg Raises
(uuid_generate_v4(), 'Lying Leg Raises', 'Lie flat, raise legs to 90 degrees, lower with control. Targets lower abs.',
 ARRAY['Lie flat on your back with legs extended', 'Place hands under lower back for support', 'Keeping legs straight, raise them to 90 degrees', 'Lower legs slowly without touching floor', 'Keep lower back pressed into the ground'],
 NULL, ARRAY['core']::muscle_group[], 'strength', 'beginner', 3, '10', NULL, 30, 5);

-- ==================== INTERMEDIATE EXERCISES ====================

INSERT INTO exercises (id, name, description, instructions, youtube_video_id, muscle_groups, exercise_type, difficulty, default_sets, default_reps, default_duration_seconds, default_rest_seconds, calories_per_set)
VALUES
-- Standard Push-ups
(uuid_generate_v4(), 'Standard Push-ups', 'Classic floor push-ups. Foundation of upper body calisthenics.',
 ARRAY['Start in high plank with hands slightly wider than shoulders', 'Keep body in a straight line from head to heels', 'Lower chest toward the floor by bending elbows', 'Elbows at 45-degree angle from body', 'Push back up to starting position'],
 NULL, ARRAY['chest', 'shoulders', 'triceps']::muscle_group[], 'strength', 'intermediate', 3, '15', NULL, 60, 7),

-- Diamond Push-ups
(uuid_generate_v4(), 'Diamond Push-ups', 'Close-grip push-ups with hands forming a diamond shape. Triceps emphasis.',
 ARRAY['Form a diamond with index fingers and thumbs touching', 'Position hands under chest', 'Lower chest toward hands', 'Keep elbows close to body', 'Push back up explosively'],
 NULL, ARRAY['triceps', 'chest', 'shoulders']::muscle_group[], 'strength', 'intermediate', 3, '10', NULL, 60, 8),

-- Pike Push-ups
(uuid_generate_v4(), 'Pike Push-ups', 'Push-ups in an inverted V position. Targets shoulders like a handstand push-up progression.',
 ARRAY['Start in downward dog position, hips high', 'Walk feet closer to hands to increase angle', 'Bend elbows and lower head toward the ground', 'Keep hips elevated throughout', 'Push back to starting position'],
 NULL, ARRAY['shoulders', 'triceps', 'chest']::muscle_group[], 'strength', 'intermediate', 3, '8', NULL, 60, 7),

-- Full Plank
(uuid_generate_v4(), 'Full Plank', 'Extended plank hold for building core endurance.',
 ARRAY['Start in push-up position, arms straight', 'Keep body in a straight line', 'Engage core and squeeze glutes', 'Look at a spot on the floor just ahead of hands', 'Breathe steadily throughout'],
 NULL, ARRAY['core', 'shoulders']::muscle_group[], 'strength', 'intermediate', 3, '1', 45, 60, 6),

-- Side Plank
(uuid_generate_v4(), 'Side Plank', 'Full side plank on hand or forearm. Builds oblique strength.',
 ARRAY['Lie on side with feet stacked', 'Prop up on forearm with elbow under shoulder', 'Lift hips creating a straight line from head to feet', 'Top arm can rest on hip or extend upward', 'Hold, then switch sides'],
 NULL, ARRAY['core']::muscle_group[], 'strength', 'intermediate', 2, '1', 30, 45, 5),

-- Jump Squats
(uuid_generate_v4(), 'Jump Squats', 'Explosive squat with jump at the top. Builds power and burns calories.',
 ARRAY['Start in squat position', 'Explode upward into a jump', 'Land softly and immediately go into next squat', 'Use arms for momentum', 'Keep core engaged for stability'],
 NULL, ARRAY['legs', 'glutes', 'cardio']::muscle_group[], 'hiit', 'intermediate', 3, '12', NULL, 60, 10),

-- Lunges
(uuid_generate_v4(), 'Forward Lunges', 'Alternating forward lunges for leg strength and balance.',
 ARRAY['Stand tall with feet hip-width apart', 'Step forward with one leg into a lunge', 'Lower until both knees are at 90 degrees', 'Keep front knee over ankle', 'Push back to starting position and alternate'],
 NULL, ARRAY['legs', 'glutes']::muscle_group[], 'strength', 'intermediate', 3, '10 each leg', NULL, 45, 6),

-- Mountain Climbers
(uuid_generate_v4(), 'Mountain Climbers', 'High-intensity running in plank position. Cardio and core combo.',
 ARRAY['Start in high plank position', 'Drive one knee toward chest', 'Quickly switch legs in a running motion', 'Keep hips low and stable', 'Maintain rapid pace'],
 NULL, ARRAY['core', 'cardio']::muscle_group[], 'hiit', 'intermediate', 3, '1', 30, 45, 12),

-- Bicycle Crunches
(uuid_generate_v4(), 'Bicycle Crunches', 'Rotating crunch targeting obliques. Elbow to opposite knee.',
 ARRAY['Lie on back with hands behind head', 'Lift shoulders and legs off the ground', 'Bring right elbow to left knee while extending right leg', 'Alternate in a cycling motion', 'Keep lower back pressed into floor'],
 NULL, ARRAY['core']::muscle_group[], 'strength', 'intermediate', 3, '15 each side', NULL, 30, 6),

-- Inverted Rows
(uuid_generate_v4(), 'Inverted Rows', 'Pull-up progression using a low bar or sturdy table. Horizontal pulling.',
 ARRAY['Position yourself under a low bar or sturdy table', 'Grab with overhand grip, arms extended', 'Keep body straight from heels to head', 'Pull chest to the bar by squeezing back', 'Lower with control'],
 NULL, ARRAY['back', 'biceps', 'shoulders']::muscle_group[], 'strength', 'intermediate', 3, '8', NULL, 60, 7);

-- ==================== ADVANCED EXERCISES ====================

INSERT INTO exercises (id, name, description, instructions, youtube_video_id, muscle_groups, exercise_type, difficulty, default_sets, default_reps, default_duration_seconds, default_rest_seconds, calories_per_set)
VALUES
-- Pull-ups
(uuid_generate_v4(), 'Pull-ups', 'Overhand grip pull-up. The king of back exercises.',
 ARRAY['Grip bar with hands slightly wider than shoulders, palms facing away', 'Hang with arms fully extended', 'Pull yourself up until chin clears the bar', 'Lower with control to full extension', 'Avoid swinging or kipping'],
 NULL, ARRAY['back', 'biceps', 'shoulders']::muscle_group[], 'strength', 'advanced', 4, '8', NULL, 90, 12),

-- Chin-ups
(uuid_generate_v4(), 'Chin-ups', 'Underhand grip pull-up. More bicep emphasis than standard pull-ups.',
 ARRAY['Grip bar with hands shoulder-width, palms facing you', 'Hang with arms fully extended', 'Pull up until chin clears the bar', 'Focus on squeezing biceps at the top', 'Lower with full control'],
 NULL, ARRAY['biceps', 'back', 'shoulders']::muscle_group[], 'strength', 'advanced', 4, '8', NULL, 90, 11),

-- Muscle-ups
(uuid_generate_v4(), 'Muscle-ups', 'Explosive pull-up transitioning to dip. Advanced pulling and pushing combo.',
 ARRAY['Start with a strong explosive pull-up', 'At the top, lean forward and transition hands over the bar', 'Push up into a dip position', 'Lock out arms at the top', 'Lower with control back to hang'],
 NULL, ARRAY['back', 'chest', 'shoulders', 'triceps']::muscle_group[], 'strength', 'advanced', 3, '5', NULL, 120, 20),

-- Dips
(uuid_generate_v4(), 'Parallel Bar Dips', 'Triceps and chest dips on parallel bars. Upper body pushing power.',
 ARRAY['Grip parallel bars and lift body with arms straight', 'Lean slightly forward for chest emphasis', 'Lower until upper arms are parallel to ground', 'Push back up to full extension', 'Keep core tight throughout'],
 NULL, ARRAY['triceps', 'chest', 'shoulders']::muscle_group[], 'strength', 'advanced', 4, '10', NULL, 90, 10),

-- Pistol Squats
(uuid_generate_v4(), 'Pistol Squats', 'Single-leg squat to full depth. Ultimate leg strength and balance test.',
 ARRAY['Stand on one leg, other leg extended in front', 'Lower your body by bending the standing knee', 'Go as deep as possible while keeping balance', 'Push through heel to stand back up', 'Use arms for counterbalance'],
 NULL, ARRAY['legs', 'glutes', 'core']::muscle_group[], 'strength', 'advanced', 3, '5 each leg', NULL, 90, 12),

-- Handstand Push-ups (Wall)
(uuid_generate_v4(), 'Handstand Push-ups', 'Wall-supported handstand push-ups. Builds incredible shoulder strength.',
 ARRAY['Kick up into a handstand against a wall', 'Hands shoulder-width apart, fingers spread', 'Lower head toward the ground by bending arms', 'Push back up to full extension', 'Keep core tight and legs together'],
 NULL, ARRAY['shoulders', 'triceps']::muscle_group[], 'strength', 'advanced', 3, '6', NULL, 120, 15),

-- Dragon Flags
(uuid_generate_v4(), 'Dragon Flags', 'Full body lever from bench. Bruce Lee''s legendary core exercise.',
 ARRAY['Lie on bench and grip behind your head', 'Lift entire body keeping it perfectly straight', 'Lower body as a single unit toward bench', 'Stop before touching and raise back up', 'Keep only shoulders on the bench'],
 NULL, ARRAY['core', 'full_body']::muscle_group[], 'strength', 'advanced', 3, '5', NULL, 90, 12),

-- Planche Lean
(uuid_generate_v4(), 'Planche Lean', 'Leaning plank pushing shoulders past hands. Planche progression.',
 ARRAY['Start in push-up position', 'Lean forward pushing shoulders past wrists', 'Keep arms locked and body straight', 'Hold the lean position', 'Only lean as far as you can maintain form'],
 NULL, ARRAY['shoulders', 'chest', 'core']::muscle_group[], 'strength', 'advanced', 3, '1', 15, 60, 10),

-- L-Sit
(uuid_generate_v4(), 'L-Sit', 'Hold body in L-shape supported by arms. Core and triceps burner.',
 ARRAY['Place hands on parallettes or floor beside hips', 'Press down to lift entire body off the ground', 'Extend legs straight out in front at 90 degrees', 'Keep arms locked and shoulders depressed', 'Hold position as long as possible'],
 NULL, ARRAY['core', 'triceps', 'shoulders']::muscle_group[], 'strength', 'advanced', 3, '1', 15, 60, 10),

-- Burpees
(uuid_generate_v4(), 'Burpees', 'Full-body explosive movement combining squat, plank, push-up, and jump.',
 ARRAY['Stand with feet shoulder-width apart', 'Drop into a squat, hands on floor', 'Jump feet back into plank', 'Perform a push-up', 'Jump feet to hands and explode upward with hands overhead'],
 NULL, ARRAY['full_body', 'cardio']::muscle_group[], 'hiit', 'advanced', 4, '15', NULL, 60, 15);

-- ==================== MEAL_1 (First Eating Window Meal) ====================

INSERT INTO meals (id, name, description, meal_type, intensity, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories, protein_grams, carbs_grams, fat_grams, fiber_grams, dietary_tags)
VALUES
-- Light Intensity Meal 1
(uuid_generate_v4(), 'Jollof Rice with Grilled Chicken', 'Classic Nigerian Jollof with lean grilled chicken. Perfectly balanced for your first meal.',
 'meal_1', 'light',
 '[{"name": "Long grain rice", "amount": "1 cup", "calories": 200}, {"name": "Tomato paste", "amount": "2 tbsp", "calories": 30}, {"name": "Grilled chicken breast", "amount": "150g", "calories": 165}, {"name": "Bell peppers", "amount": "1/2 cup", "calories": 15}, {"name": "Onion", "amount": "1 medium", "calories": 45}]'::jsonb,
 ARRAY['Season chicken with suya spice and grill until cooked through', 'Blend tomatoes, peppers, and onions for the base', 'Fry paste in oil until reduced', 'Add rice and stock, cook until tender', 'Serve rice topped with sliced grilled chicken'],
 15, 30, 1, 455, 38, 55, 8, 4, ARRAY['high_protein']),

(uuid_generate_v4(), 'Pepper Soup with Fish', 'Spicy Nigerian pepper soup with fresh fish. Light yet satisfying.',
 'meal_1', 'light',
 '[{"name": "Catfish or tilapia", "amount": "200g", "calories": 180}, {"name": "Uziza leaves", "amount": "handful", "calories": 5}, {"name": "Scent leaves", "amount": "handful", "calories": 5}, {"name": "Pepper soup spice", "amount": "2 tbsp", "calories": 15}]'::jsonb,
 ARRAY['Clean and season fish with salt and spices', 'Boil fish in seasoned water with pepper soup spice', 'Add fresh herbs near the end', 'Simmer until flavors meld', 'Serve hot in a deep bowl'],
 10, 25, 1, 205, 35, 5, 5, 1, ARRAY['high_protein', 'low_carb']),

-- Standard Intensity Meal 1
(uuid_generate_v4(), 'Eba with Egusi Soup', 'Smooth garri eba served with rich egusi soup loaded with protein.',
 'meal_1', 'standard',
 '[{"name": "Garri (eba)", "amount": "1.5 cups", "calories": 330}, {"name": "Ground egusi", "amount": "1/2 cup", "calories": 250}, {"name": "Assorted meat", "amount": "150g", "calories": 200}, {"name": "Stockfish", "amount": "50g", "calories": 80}, {"name": "Spinach/Ugu", "amount": "1 cup", "calories": 25}]'::jsonb,
 ARRAY['Blend egusi with water to make paste', 'Fry in palm oil until cooked', 'Add stock, meat, and fish', 'Add vegetables and simmer', 'Make eba with hot water and garri', 'Serve eba with egusi soup'],
 15, 35, 1, 885, 55, 70, 42, 8, ARRAY['high_protein']),

(uuid_generate_v4(), 'Amala with Ewedu and Gbegiri', 'Traditional Yoruba trio - amala swallow with ewedu and gbegiri soups.',
 'meal_1', 'standard',
 '[{"name": "Yam flour (amala)", "amount": "1.5 cups", "calories": 280}, {"name": "Ewedu leaves", "amount": "1 bunch", "calories": 30}, {"name": "Gbegiri (bean soup)", "amount": "1 cup", "calories": 220}, {"name": "Assorted meat/fish", "amount": "150g", "calories": 180}]'::jsonb,
 ARRAY['Blend ewedu leaves and cook with locust beans', 'Prepare gbegiri by blending cooked beans', 'Season gbegiri with palm oil and crayfish', 'Make amala by adding yam flour to boiling water', 'Serve amala with both soups combined'],
 20, 40, 1, 710, 45, 85, 18, 12, ARRAY['high_protein']),

-- High Energy Intensity Meal 1
(uuid_generate_v4(), 'Pounded Yam with Oha Soup', 'Hearty pounded yam with protein-rich oha soup. Maximum energy for training.',
 'meal_1', 'high_energy',
 '[{"name": "Pounded yam", "amount": "2 cups", "calories": 400}, {"name": "Oha leaves", "amount": "1 cup", "calories": 20}, {"name": "Assorted meat", "amount": "200g", "calories": 280}, {"name": "Stockfish", "amount": "80g", "calories": 130}, {"name": "Palm oil", "amount": "3 tbsp", "calories": 360}, {"name": "Cocoyam (thickener)", "amount": "100g", "calories": 120}]'::jsonb,
 ARRAY['Boil assorted meat until tender with seasonings', 'Add blended cocoyam to thicken soup', 'Add palm oil, stockfish, and more stock', 'Stir in oha leaves and simmer', 'Prepare pounded yam until smooth', 'Serve pounded yam with oha soup'],
 25, 50, 1, 1310, 72, 110, 62, 10, ARRAY['high_protein']);

-- ==================== MEAL_2 (Second Eating Window Meal) ====================

INSERT INTO meals (id, name, description, meal_type, intensity, ingredients, instructions, prep_time_minutes, cook_time_minutes, servings, calories, protein_grams, carbs_grams, fat_grams, fiber_grams, dietary_tags)
VALUES
-- Light Intensity Meal 2
(uuid_generate_v4(), 'Moi Moi with Boiled Eggs', 'Steamed bean pudding with eggs. Light protein-packed dinner option.',
 'meal_2', 'light',
 '[{"name": "Black-eyed peas", "amount": "1 cup", "calories": 180}, {"name": "Eggs", "amount": "2", "calories": 140}, {"name": "Bell peppers", "amount": "1/2", "calories": 15}, {"name": "Onion", "amount": "1/2", "calories": 20}, {"name": "Palm oil", "amount": "2 tbsp", "calories": 240}]'::jsonb,
 ARRAY['Soak and blend beans to smooth paste', 'Add blended peppers, onions, and seasoning', 'Mix in palm oil thoroughly', 'Pour into moi moi leaves or containers', 'Steam for 45 minutes until set', 'Serve with boiled eggs on top'],
 30, 45, 1, 595, 28, 38, 35, 8, ARRAY['high_protein', 'vegetarian']),

(uuid_generate_v4(), 'Grilled Suya with Salad', 'Classic street-style suya with fresh vegetable salad. Low carb, high protein.',
 'meal_2', 'light',
 '[{"name": "Beef strips", "amount": "200g", "calories": 280}, {"name": "Suya spice", "amount": "3 tbsp", "calories": 45}, {"name": "Mixed greens", "amount": "2 cups", "calories": 20}, {"name": "Tomatoes", "amount": "1 medium", "calories": 25}, {"name": "Onions", "amount": "1/2", "calories": 20}]'::jsonb,
 ARRAY['Slice beef into thin strips', 'Season generously with suya spice', 'Thread onto skewers', 'Grill over hot coals or in oven', 'Prepare fresh salad with sliced tomatoes and onions', 'Serve suya hot over salad'],
 15, 15, 1, 390, 42, 15, 18, 4, ARRAY['high_protein', 'low_carb', 'keto']),

-- Standard Intensity Meal 2
(uuid_generate_v4(), 'Beans and Plantain (Ewa Riro)', 'Honey beans cooked in palm oil with fried plantain. Nigerian comfort food.',
 'meal_2', 'standard',
 '[{"name": "Honey beans", "amount": "1.5 cups", "calories": 340}, {"name": "Ripe plantain", "amount": "1 large", "calories": 200}, {"name": "Palm oil", "amount": "3 tbsp", "calories": 360}, {"name": "Onion", "amount": "1 medium", "calories": 45}, {"name": "Crayfish", "amount": "2 tbsp", "calories": 30}]'::jsonb,
 ARRAY['Wash and boil beans until soft', 'Add palm oil, onions, and crayfish', 'Season with salt and pepper', 'Slice plantain diagonally', 'Fry plantain until golden', 'Serve beans topped with fried plantain'],
 15, 60, 1, 975, 35, 105, 42, 18, ARRAY['high_protein']),

(uuid_generate_v4(), 'Yam Porridge with Turkey', 'Chunky yam porridge cooked with peppers and lean turkey pieces.',
 'meal_2', 'standard',
 '[{"name": "Yam", "amount": "400g", "calories": 470}, {"name": "Turkey", "amount": "150g", "calories": 180}, {"name": "Tomatoes", "amount": "2 medium", "calories": 50}, {"name": "Palm oil", "amount": "2 tbsp", "calories": 240}, {"name": "Spinach", "amount": "1 cup", "calories": 25}]'::jsonb,
 ARRAY['Peel and cube yam into chunks', 'Boil turkey pieces until tender', 'Add yam to turkey stock', 'Blend tomatoes and add to pot', 'Stir in palm oil and cook until yam is soft', 'Add spinach and serve hot'],
 15, 35, 1, 965, 42, 110, 38, 8, ARRAY['high_protein']),

-- High Energy Intensity Meal 2
(uuid_generate_v4(), 'Ofada Rice with Ayamase', 'Nigerian brown rice with spicy green pepper sauce. Authentic Lagos style.',
 'meal_2', 'high_energy',
 '[{"name": "Ofada rice", "amount": "2 cups", "calories": 440}, {"name": "Green bell peppers", "amount": "4 large", "calories": 80}, {"name": "Assorted meat", "amount": "200g", "calories": 280}, {"name": "Ponmo", "amount": "100g", "calories": 150}, {"name": "Palm oil", "amount": "1/2 cup", "calories": 480}, {"name": "Locust beans", "amount": "2 tbsp", "calories": 40}]'::jsonb,
 ARRAY['Roast green peppers over open flame', 'Blend roasted peppers with scotch bonnets', 'Bleach palm oil until pale', 'Fry blended peppers in bleached oil', 'Add locust beans, meat, and ponmo', 'Cook Ofada rice and serve with ayamase'],
 30, 50, 1, 1470, 58, 130, 78, 6, ARRAY['high_protein']);

-- ==================== WORKOUT TEMPLATES ====================

INSERT INTO workout_templates (id, name, description, difficulty, target_muscle_groups, estimated_duration_minutes, estimated_calories)
VALUES
-- Beginner Templates
(uuid_generate_v4(), 'Beginner Full Body A', 'Foundational full body workout focusing on proper form and basic movements.',
 'beginner', ARRAY['chest', 'back', 'legs', 'core']::muscle_group[], 25, 150),

(uuid_generate_v4(), 'Beginner Full Body B', 'Second beginner workout alternating with Full Body A.',
 'beginner', ARRAY['shoulders', 'glutes', 'core', 'legs']::muscle_group[], 25, 145),

(uuid_generate_v4(), 'Beginner Core Focus', 'Core-focused beginner workout building foundation strength.',
 'beginner', ARRAY['core']::muscle_group[], 20, 100),

-- Intermediate Templates
(uuid_generate_v4(), 'Intermediate Push Day', 'Pushing exercises for chest, shoulders, and triceps.',
 'intermediate', ARRAY['chest', 'shoulders', 'triceps']::muscle_group[], 35, 220),

(uuid_generate_v4(), 'Intermediate Pull Day', 'Pulling exercises for back and biceps.',
 'intermediate', ARRAY['back', 'biceps']::muscle_group[], 35, 210),

(uuid_generate_v4(), 'Intermediate Leg Day', 'Lower body focused training.',
 'intermediate', ARRAY['legs', 'glutes']::muscle_group[], 35, 250),

(uuid_generate_v4(), 'Intermediate HIIT Blast', 'High intensity interval training for cardio and conditioning.',
 'intermediate', ARRAY['full_body', 'cardio']::muscle_group[], 25, 300),

-- Advanced Templates
(uuid_generate_v4(), 'Advanced Upper Body Power', 'Intense upper body workout with advanced calisthenics.',
 'advanced', ARRAY['chest', 'back', 'shoulders', 'biceps', 'triceps']::muscle_group[], 45, 350),

(uuid_generate_v4(), 'Advanced Lower Body Power', 'Challenging leg workout including single-leg exercises.',
 'advanced', ARRAY['legs', 'glutes', 'core']::muscle_group[], 40, 320),

(uuid_generate_v4(), 'Advanced Full Body Warrior', 'Complete full body challenge for experienced athletes.',
 'advanced', ARRAY['full_body']::muscle_group[], 50, 400);

-- ==================== DONE ====================

-- Verify counts
SELECT 'Exercises inserted: ' || COUNT(*) FROM exercises;
SELECT 'Meals inserted: ' || COUNT(*) FROM meals;
SELECT 'Workout templates inserted: ' || COUNT(*) FROM workout_templates;

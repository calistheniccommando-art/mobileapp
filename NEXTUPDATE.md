# Calisthenic Commando - Complete Development Roadmap

**Document Created**: January 30, 2026  
**Status**: Planning Complete - Ready to Execute  
**Estimated Total Duration**: 8-10 weeks

---

## 🔒 Technical Architecture Decisions (LOCKED)

> **⚠️ IMPORTANT**: The following architecture decisions are **finalized and locked**. All future development must adhere to these choices. Do not deviate without explicit approval and documentation update.

### Platform & Hosting Architecture

| Component | Platform | Purpose |
|-----------|----------|---------|
| **Frontend (User App)** | Vercel | React Native Web + Expo hosting |
| **Frontend (Admin Dashboard)** | Vercel | Web-only admin panel at `/admin` |
| **Landing Pages** | Vercel | Marketing pages at `/landing` |
| **Database** | Supabase (PostgreSQL) | All application data |
| **Authentication** | Supabase Auth | User & admin authentication |
| **Image Storage** | Supabase Storage | All images (thumbnails, banners, profile pics) |
| **Video Hosting** | YouTube (Unlisted) | All exercise & meal prep videos |
| **Payments** | Paystack | Nigerian Naira transactions |

### Video Hosting Strategy

**Decision**: YouTube is the **official and only** video hosting platform.

| Rule | Details |
|------|---------|
| **Upload Location** | All videos uploaded to YouTube |
| **Video Visibility** | Set as **Unlisted** (not public, not private) |
| **Database Storage** | Only YouTube video ID or URL stored (NOT video files) |
| **No Video Files** | Zero video files stored in Supabase, Vercel, or any server |
| **Playback** | Client apps use YouTube embedded player or YouTube API |

**Why YouTube?**
- ✅ Free unlimited storage
- ✅ Automatic transcoding (all resolutions)
- ✅ Global CDN for fast streaming
- ✅ No bandwidth costs
- ✅ Reliable uptime
- ✅ Works on all platforms (iOS, Android, Web)

**Admin Workflow for Videos:**
1. Record exercise/meal video
2. Upload to YouTube channel as **Unlisted**
3. Copy the video ID (e.g., `dQw4w9WgXcQ` from `youtube.com/watch?v=dQw4w9WgXcQ`)
4. Paste video ID into admin dashboard when creating/editing exercise or meal
5. System stores only the video ID in database

**Client Playback:**
- App uses `react-native-youtube-iframe` or similar YouTube player
- Constructs embed URL from stored video ID
- Streams directly from YouTube CDN

### Image Storage Strategy

**Decision**: Supabase Storage is the **official and only** image hosting platform.

| Asset Type | Storage Location | Bucket Name |
|------------|------------------|-------------|
| Exercise thumbnails | Supabase Storage | `exercise-images` |
| Meal photos | Supabase Storage | `meal-images` |
| User profile pictures | Supabase Storage | `profile-images` |
| App banners/marketing | Supabase Storage | `marketing-images` |
| Admin uploads | Supabase Storage | `admin-uploads` |

**Admin Workflow for Images:**
1. In admin dashboard, click "Upload Image"
2. Select image file from computer
3. Image uploads directly to Supabase Storage
4. Public URL is automatically stored in database
5. Images served via Supabase CDN

**Client Display:**
- App loads images directly from Supabase Storage URLs
- Use `expo-image` for caching and optimization
- URLs format: `https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>`

### Database Schema for Media

```sql
-- Exercises table (video = YouTube ID only)
CREATE TABLE exercises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  youtube_video_id TEXT,          -- e.g., "dQw4w9WgXcQ"
  thumbnail_url TEXT,             -- Supabase Storage URL
  -- ... other fields
);

-- Meals table (video = YouTube ID only)
CREATE TABLE meals (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  youtube_video_id TEXT,          -- Optional prep video
  image_url TEXT,                 -- Supabase Storage URL
  -- ... other fields
);
```

### Environment Variables for Media

```env
# Supabase (database + images)
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# YouTube (no API key needed for unlisted embeds)
# Videos are embedded using video ID directly

# Vercel (auto-configured during deployment)
# No manual env vars needed for hosting
```

### What This Architecture Means

| ✅ DO | ❌ DON'T |
|-------|----------|
| Store YouTube video IDs in database | Store video files anywhere |
| Upload images to Supabase Storage | Use external image CDNs |
| Embed YouTube player in app | Stream videos from custom server |
| Use Supabase public URLs for images | Upload images to YouTube |
| Deploy all web assets to Vercel | Use separate hosting for admin |

---

## Executive Summary

This document outlines the 10 phases required to transform the Calisthenic Commando app from a frontend prototype into a production-ready fitness application with:
- Real user authentication
- Cloud database (Supabase)
- Payment processing (Paystack)
- Functional admin panel
- Real exercise/meal videos
- Push notifications
- Analytics & crash reporting

---

## Phase Overview

| Phase | Name | Duration | Priority |
|-------|------|----------|----------|
| 1 | Supabase Setup & Database Schema | 2-3 days | 🔴 Critical |
| 2 | User Authentication | 2-3 days | 🔴 Critical |
| 3 | Admin Authentication & Protection | 1-2 days | 🔴 Critical |
| 4 | Admin CRUD - Exercises & Workouts | 3-4 days | 🔴 Critical |
| 5 | Admin CRUD - Meals & Fasting | 2-3 days | 🔴 Critical |
| 6 | Payment Integration (Paystack) | 3-5 days | 🔴 Critical |
| 7 | Video Management (YouTube Integration) | 2-3 days | 🟠 High |
| 8 | User Data Sync & Progress Tracking | 2-3 days | 🟠 High |
| 9 | Push Notifications & Email | 2-3 days | 🟡 Medium |
| 10 | Analytics, Crash Reporting & Polish | 2-3 days | 🟢 Low |

---

## Phase 1: Supabase Setup & Database Schema

> **📌 Reference**: See "🔒 Technical Architecture Decisions" section for locked-in hosting strategy.

### What Needs to Be Done
Set up Supabase as the backend-as-a-service providing:
- PostgreSQL database
- Authentication system
- File storage for **images only** (thumbnails, meal photos, profile pics)
- Row Level Security (RLS) for data protection
- Real-time subscriptions for live updates

**Note**: Videos are hosted on YouTube. Supabase only stores YouTube video IDs, not video files.

### Database Tables to Create

```sql
-- Core User Tables
users                    -- User accounts & profiles
user_onboarding          -- 37-step onboarding data
user_subscriptions       -- Payment & subscription status
user_progress            -- Daily workout/meal/fasting progress

-- Content Tables (Admin Managed)
exercises                -- Exercise library (80+ exercises) + youtube_video_id
workouts                 -- Workout plans by difficulty
meals                    -- Meal database with nutrition + youtube_video_id
fasting_plans            -- Fasting protocols (12:12, 16:8, etc.)
daily_plan_templates     -- Template plans for each day

-- NOTE: No video files table - YouTube video IDs stored directly in exercises/meals tables
-- Images stored in Supabase Storage buckets, URLs stored in respective tables

-- Admin Tables
admin_users              -- Admin accounts with roles
audit_log                -- Content change history
admin_overrides          -- Per-user plan overrides

-- Generated Tables
user_daily_plans         -- Generated daily plans per user
```

### Supabase Storage Buckets to Create

| Bucket Name | Purpose | Access |
|-------------|---------|--------|
| `exercise-images` | Exercise thumbnails | Public |
| `meal-images` | Meal photos | Public |
| `profile-images` | User profile pictures | Authenticated |
| `marketing-images` | Banners, app assets | Public |

### What I Will Do
1. Create Supabase client configuration file
2. Create TypeScript types matching database schema
3. Create database service layer with CRUD operations
4. Set up Row Level Security policies
5. Create migration SQL files for all tables
6. Create Storage buckets for images
7. Update existing stores to use Supabase instead of mock data

### What You Need to Do
1. **Create a Supabase account** at https://supabase.com (free tier is fine)
2. **Create a new project** called "calisthenic-commando"
3. **Copy your project credentials**:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public key
   - Service Role key (for admin operations)
4. **Add these to your `.env` file**:
   ```
   EXPO_PUBLIC_SUPABASE_URL=your_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```
5. **Run the migration SQL** I will provide in Supabase SQL editor

### Deliverables
- [x] `src/lib/supabase/client.ts` - Supabase client setup ✅
- [x] `src/lib/supabase/types.ts` - Database TypeScript types ✅
- [x] `src/lib/supabase/database.ts` - Database service layer ✅
- [x] `src/lib/supabase/index.ts` - Module exports ✅
- [x] `supabase/migrations/001_initial_schema.sql` - Database schema ✅
- [x] `supabase/migrations/002_seed_data.sql` - Initial exercise/meal data ✅
- [x] `supabase/migrations/003_storage_buckets.sql` - Image storage buckets ✅
- [x] `.env.example` - Environment variable template ✅

### ✅ PHASE 1 COMPLETE
**Completed**: All database schema, types, and services created. User must now:
1. Create Supabase project at https://supabase.com
2. Copy credentials to `.env` file
3. Run the three migration SQL files in order

---

## Phase 2: User Authentication

### What Needs to Be Done
Replace the fake login (hardcoded demo credentials) with real Supabase Auth:
- Email/password signup and login
- Password reset via email
- Session management (auto-refresh tokens)
- Secure token storage

### What I Will Do
1. Create auth service with signup/login/logout functions
2. Update login screen to use real authentication
3. Create signup screen for new users
4. Create password reset flow
5. Update `_layout.tsx` to check real auth state
6. Migrate user store to sync with Supabase auth
7. Add auth state persistence across app restarts

### What You Need to Do
1. **Enable Email Auth** in Supabase Dashboard:
   - Go to Authentication → Providers → Email
   - Enable "Email" provider
   - Optionally customize email templates
2. **Test the auth flow** after I implement it
3. **Decide on social auth** (optional):
   - Google login?
   - Apple login? (required for iOS App Store if any social login)

### Deliverables
- [x] `src/lib/supabase/auth.ts` - Auth service ✅
- [x] `src/app/signup.tsx` - New signup screen ✅
- [x] `src/app/forgot-password.tsx` - Password reset screen ✅
- [x] Updated `src/app/login.tsx` - Real auth integration ✅
- [x] Updated `src/app/_layout.tsx` - Real auth state checking ✅
- [x] Updated `src/lib/state/user-store.ts` - Supabase sync ✅
- [x] `src/lib/auth/auth-context.tsx` - Auth context provider ✅
- [x] `src/lib/hooks/use-supabase.ts` - React Query hooks for data ✅

### ✅ PHASE 2 COMPLETE
**Completed**: All authentication features implemented. User must now:
1. Enable Email Auth in Supabase Dashboard (Authentication → Providers → Email)
2. Test signup, login, and password reset flows
3. Optionally configure social auth providers

---

## Phase 3: Admin Authentication & Protection

### What Needs to Be Done
Currently anyone can access `/admin`. We need:
- Separate admin login
- Role-based access (super_admin, admin, editor, viewer)
- Protected admin routes
- Admin session management

### Admin Roles

| Role | Permissions |
|------|-------------|
| **super_admin** | Everything + manage other admins |
| **admin** | Full CRUD on all content |
| **editor** | Edit content, cannot delete |
| **viewer** | Read-only access |

### What I Will Do
1. Create admin authentication flow
2. Create admin login screen at `/admin/login`
3. Add admin route protection in `src/app/admin/_layout.tsx`
4. Create admin role checking utilities
5. Add role-based UI (hide buttons based on permissions)
6. Create admin user management screen

### What You Need to Do
1. **Create your first admin account** via SQL:
   ```sql
   INSERT INTO admin_users (email, password_hash, role, name)
   VALUES ('your@email.com', 'hashed_password', 'super_admin', 'Your Name');
   ```
   (I'll provide a script to hash the password)
2. **Define who else needs admin access** and their roles
3. **Test each role** to ensure permissions work correctly

### Deliverables
- [ ] `src/app/admin/login.tsx` - Admin login screen
- [ ] `src/lib/supabase/admin-auth.ts` - Admin auth service
- [ ] Updated `src/app/admin/_layout.tsx` - Route protection
- [ ] `src/lib/hooks/use-admin.ts` - Admin role hooks
- [ ] `src/app/admin/team.tsx` - Admin user management

---

## Phase 4: Admin CRUD - Exercises & Workouts

### What Needs to Be Done
Make the admin panel functional for exercise and workout management:
- Create, edit, delete exercises
- Upload exercise demonstration videos
- Create workout plans
- Assign exercises to workouts
- Reorder exercises within workouts
- Bulk operations (activate/deactivate)
- Change tracking (audit log)

### What I Will Do
1. Create exercise CRUD service connected to Supabase
2. Build exercise creation/edit modal with form validation
3. Build exercise list with search, filter, pagination
4. Create workout plan builder with drag-and-drop exercise ordering
5. Implement video upload to Supabase storage
6. Add audit logging for all changes
7. Build bulk action UI (select multiple → activate/deactivate)

### What You Need to Do
1. **Prepare exercise content**:
   - Review the 80+ exercises in the library
   - Note any exercises that need updating
   - Prepare descriptions/instructions for any new exercises
2. **Record or source exercise videos** (Phase 7 covers uploading)
3. **Define workout templates** for each difficulty level:
   - Beginner: Which exercises? How many per workout?
   - Intermediate: Progression from beginner
   - Advanced: Challenge exercises
4. **Test the admin interface** and report any issues

### Deliverables
- [ ] `src/lib/supabase/exercises.ts` - Exercise CRUD service
- [ ] `src/lib/supabase/workouts.ts` - Workout CRUD service
- [ ] Updated `src/app/admin/workouts.tsx` - Full CRUD UI
- [ ] `src/app/admin/exercises.tsx` - Exercise management screen
- [ ] `src/components/admin/ExerciseForm.tsx` - Create/edit form
- [ ] `src/components/admin/WorkoutBuilder.tsx` - Workout builder

---

## Phase 5: Admin CRUD - Meals & Fasting

### What Needs to Be Done
Complete the admin panel for meal and fasting management:
- Create, edit, delete meals
- Set nutrition information (calories, protein, carbs, fat)
- Upload meal prep videos
- Create meal plans by calorie category
- Manage fasting protocols
- Set personalization rules

### Nigerian Meal Database
The app focuses on Nigerian cuisine. Need to ensure:
- Local ingredients available
- Culturally appropriate meals
- Proper nutritional data

### What I Will Do
1. Create meal CRUD service connected to Supabase
2. Build meal creation/edit form with nutrition calculator
3. Create meal plan builder (group meals by time/type)
4. Build fasting plan manager
5. Create personalization rule editor
6. Add meal image upload
7. Implement dietary tag management (vegan, keto, etc.)

### What You Need to Do
1. **Prepare meal database**:
   - List all Nigerian meals to include
   - Get accurate nutrition data for each
   - Write cooking instructions
   - Take photos of meals (or source stock images)
2. **Define meal categories**:
   - Light meals (for weight loss goals)
   - Standard meals (maintenance)
   - High-energy meals (muscle gain)
3. **Define fasting protocols**:
   - Confirm 12:12, 14:10, 16:8, 18:6 are correct
   - Set which protocol for which user profile
4. **Record meal prep videos** (or decide to skip videos)

### Deliverables
- [ ] `src/lib/supabase/meals.ts` - Meal CRUD service
- [ ] `src/lib/supabase/fasting.ts` - Fasting CRUD service
- [ ] Updated `src/app/admin/meals.tsx` - Full CRUD UI
- [ ] Updated `src/app/admin/fasting.tsx` - Fasting management
- [ ] `src/components/admin/MealForm.tsx` - Create/edit form
- [ ] `src/components/admin/NutritionCalculator.tsx` - Nutrition helper

---

## Phase 6: Payment Integration (Paystack)

### What Needs to Be Done
Integrate Paystack for Nigerian Naira payments:
- Accept card payments in Naira (₦)
- Handle subscription plans (monthly, 3-month, 6-month, yearly)
- Process trial payments (₦3,000 for 3 days)
- Manage recurring payments
- Handle payment webhooks for status updates
- Send payment confirmation emails

### Pricing Recap

| Plan | Price (₦) | Duration | Features |
|------|-----------|----------|----------|
| Trial | ₦3,000 | 3 days | Full access, one-time only |
| Monthly | ₦10,000 | 1 month | Full access |
| 3-Month | ₦28,000 | 3 months | Full access, save 7% |
| Hero (6-Month) | ₦50,000 | 6 months | + Physical guidebook |
| Ultimate (12-Month) | ₦96,000 | 12 months | + Book + trainer check-ins |

### What I Will Do
1. Install Paystack React Native SDK
2. Create payment service with plan selection
3. Update paywall screen with real payment buttons
4. Implement payment verification
5. Create webhook endpoint for payment confirmations
6. Update subscription store to sync with Supabase
7. Add payment history to user profile
8. Implement subscription expiry checking

### What You Need to Do
1. **Create a Paystack account** at https://paystack.com
2. **Complete business verification** (required for live payments)
3. **Get your API keys**:
   - Test Public Key
   - Test Secret Key
   - Live Public Key (after verification)
   - Live Secret Key (after verification)
4. **Add keys to `.env`**:
   ```
   EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   ```
5. **Set up webhook URL** in Paystack dashboard:
   - Will need a serverless function (Supabase Edge Function)
6. **Test payments** in test mode before going live
7. **For physical book plans**: Set up shipping logistics

### Deliverables
- [ ] `src/lib/payments/paystack.ts` - Paystack service
- [ ] Updated `src/app/paywall.tsx` - Real payment integration
- [ ] `supabase/functions/paystack-webhook/` - Webhook handler
- [ ] Updated `src/lib/state/subscription-store.ts` - Supabase sync
- [ ] Payment confirmation emails (via email service)

---

## Phase 7: Video Management (YouTube Integration)

> **📌 Reference**: See "🔒 Technical Architecture Decisions" section for locked-in video hosting strategy.

### What Needs to Be Done
Implement YouTube-based video infrastructure:
- YouTube video ID input in admin panel
- YouTube player integration in user app
- Image upload to Supabase Storage for thumbnails
- Video management screen in admin

### Architecture Recap (LOCKED)

| Component | Platform | Storage |
|-----------|----------|---------|
| Exercise/Meal Videos | YouTube (Unlisted) | Only video ID in database |
| Thumbnails | Supabase Storage | Full URL in database |
| Meal Photos | Supabase Storage | Full URL in database |

### What I Will Do
1. Create YouTube video ID input component for admin
2. Implement `react-native-youtube-iframe` player for user app
3. Build image upload component for Supabase Storage
4. Create video management screen showing all exercises with video status
5. Add video validation (check if YouTube ID is valid)
6. Update exercise/meal forms to include video ID field
7. Create thumbnail upload with preview

### What You Need to Do
1. **Create a YouTube channel** for Calisthenic Commando
2. **Record exercise demonstration videos**:
   - 80+ exercises need videos
   - Recommended: 15-30 seconds each
   - Format: MP4, 720p or 1080p
   - Show proper form from multiple angles
3. **Upload each video to YouTube as Unlisted**:
   - Go to YouTube Studio
   - Upload video
   - Set visibility to "Unlisted"
   - Copy the video ID from the URL
4. **Record meal prep videos** (optional):
   - Cooking instructions for each meal
   - 1-3 minutes each
   - Upload as Unlisted
5. **Create thumbnails** for each exercise:
   - 1280x720 recommended
   - Clear image showing the exercise position
   - Upload via admin panel to Supabase

### Admin Workflow

```
1. Create/Edit Exercise
   ├── Enter exercise details (name, description, etc.)
   ├── Paste YouTube Video ID: [dQw4w9WgXcQ]
   ├── Upload Thumbnail Image: [Choose File] → Supabase Storage
   └── Save

2. Video Preview
   └── Admin sees embedded YouTube player preview before saving
```

### Deliverables
- [ ] `src/lib/youtube/player.ts` - YouTube player utilities
- [ ] `src/components/YouTubePlayer.tsx` - User-facing YouTube player
- [ ] `src/components/admin/YouTubeInput.tsx` - Video ID input with validation
- [ ] `src/components/admin/ImageUploader.tsx` - Supabase image upload
- [ ] `src/lib/supabase/storage.ts` - Supabase Storage service
- [ ] Updated exercise/meal forms with video ID field
- [ ] Video status dashboard in admin

---

## Phase 8: User Data Sync & Progress Tracking

### What Needs to Be Done
Sync all user data to the cloud:
- Workout progress (completed exercises)
- Meal completion tracking
- Fasting compliance
- Onboarding data
- User preferences
- Daily plan history

### Benefits
- User can switch devices and keep progress
- Admin can see user progress for coaching
- Analytics on user behavior
- Data backup

### What I Will Do
1. Create sync service for all user stores
2. Update progress store to sync with Supabase
3. Add offline support (queue changes when offline)
4. Create conflict resolution for offline edits
5. Add real-time sync using Supabase subscriptions
6. Build progress dashboard for admin

### What You Need to Do
1. **Test sync functionality** on multiple devices
2. **Test offline mode**: Make changes offline, go online, verify sync
3. **Review admin progress view** and suggest improvements
4. **Decide on data retention**: How long to keep history?

### Deliverables
- [ ] `src/lib/supabase/sync.ts` - Sync service
- [ ] Updated `src/lib/state/progress-store.ts` - Cloud sync
- [ ] Updated `src/lib/state/fasting-store.ts` - Cloud sync
- [ ] `src/lib/hooks/use-sync.ts` - Sync status hook
- [ ] `src/app/admin/user-progress.tsx` - User progress view
- [ ] Offline queue with retry logic

---

## Phase 9: Push Notifications & Email

### What Needs to Be Done

**Push Notifications:**
- Fasting window reminders ("Time to start eating!")
- Workout reminders
- Streak encouragement
- Milestone celebrations
- Admin announcements

**Email:**
- Welcome email after signup
- Payment confirmation
- Password reset
- Weekly progress summary (optional)
- Subscription expiry warning

### What I Will Do
1. Set up Expo Push Notifications
2. Create notification service
3. Add notification preferences in settings
4. Set up scheduled notifications for fasting/workouts
5. Integrate email provider (Resend or SendGrid)
6. Create email templates
7. Add email triggers for key events

### What You Need to Do
1. **For Push Notifications**:
   - Test on real device (not simulator)
   - iOS: Set up Apple Push Notification service (APN)
   - Android: Set up Firebase Cloud Messaging (FCM)
2. **For Email**:
   - Create account on Resend (https://resend.com) or SendGrid
   - Verify your sending domain
   - Get API key
   - Add to `.env`:
     ```
     RESEND_API_KEY=re_xxxxx
     ```
3. **Review email templates** I create
4. **Test all notification types**

### Deliverables
- [ ] `src/lib/notifications/push.ts` - Push notification service
- [ ] `src/lib/notifications/scheduler.ts` - Scheduled notifications
- [ ] `src/lib/email/resend.ts` - Email service
- [ ] `src/lib/email/templates/` - Email HTML templates
- [ ] Updated settings screen with notification preferences
- [ ] `supabase/functions/send-email/` - Email sending function

---

## Phase 10: Analytics, Crash Reporting & Polish

### What Needs to Be Done

**Analytics:**
- Track screen views
- Track key events (signup, payment, workout complete)
- Funnel analysis (onboarding drop-off)
- User engagement metrics

**Crash Reporting:**
- Automatic crash detection
- Error logging with context
- Performance monitoring

**Polish:**
- Delete unused files (`two.tsx`)
- Add loading skeletons
- Add error boundaries
- Improve error messages
- Accessibility improvements
- Performance optimization

### What I Will Do
1. Integrate Amplitude or Mixpanel for analytics
2. Add Sentry for crash reporting
3. Create analytics service with event tracking
4. Add error boundaries to all screens
5. Clean up unused code
6. Add skeleton loading states
7. Performance profiling and optimization
8. Final code review and cleanup

### What You Need to Do
1. **Create Amplitude account** (https://amplitude.com) - Free tier
2. **Create Sentry account** (https://sentry.io) - Free tier
3. **Get API keys** and add to `.env`:
   ```
   EXPO_PUBLIC_AMPLITUDE_API_KEY=xxxxx
   EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
   ```
4. **Define key events to track**:
   - Which user actions matter most?
   - What funnels to measure?
5. **Final testing** of entire app flow
6. **Prepare for app store submission**:
   - App icons
   - Screenshots
   - App description
   - Privacy policy

### Deliverables
- [ ] `src/lib/analytics/amplitude.ts` - Analytics service
- [ ] `src/lib/monitoring/sentry.ts` - Crash reporting
- [ ] `src/components/ErrorBoundary.tsx` - Error handling
- [ ] `src/components/SkeletonLoader.tsx` - Loading states
- [ ] Deleted unused files
- [ ] Final code cleanup

---

## Summary Checklist

### Your Account Setup (Do Before Phase 1)

- [ ] Supabase account created
- [ ] Supabase project created
- [ ] YouTube channel created for Calisthenic Commando
- [ ] Paystack account created
- [ ] Paystack business verification started
- [ ] Email provider account (Resend/SendGrid)
- [ ] Amplitude account created
- [ ] Sentry account created
- [ ] Vercel account created (for deployment)

### Environment Variables Needed

```env
# Supabase (Database + Auth + Image Storage)
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Paystack (Payments)
EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

# Email (Resend)
RESEND_API_KEY=

# Analytics
EXPO_PUBLIC_AMPLITUDE_API_KEY=

# Crash Reporting
EXPO_PUBLIC_SENTRY_DSN=

# NOTE: No YouTube API key needed - videos are embedded using video ID
# NOTE: No Cloudinary - images stored in Supabase Storage
# NOTE: No video file storage - only YouTube video IDs stored
```

### Content You Need to Prepare

- [ ] 80+ exercise demonstration videos (15-30 sec each)
  - Upload to YouTube as **Unlisted**
  - Record video IDs for each
- [ ] Exercise thumbnails (upload to Supabase Storage via admin)
- [ ] Meal photos (upload to Supabase Storage via admin)
- [ ] Meal prep videos (optional, upload to YouTube as Unlisted)
- [ ] Nigerian meal nutrition data
- [ ] App store assets (icons, screenshots, description)
- [ ] Privacy policy
- [ ] Terms of service

---

## Ready to Start?

Once you've:
1. Read through this document
2. Created your Supabase account
3. Created your Supabase project
4. Shared the project URL and keys

We'll begin **Phase 1: Supabase Setup & Database Schema**.

---

*Document will be updated as phases are completed.*

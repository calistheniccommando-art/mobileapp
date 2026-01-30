/**
 * ADMIN - WORKOUT MANAGEMENT
 * Manage workouts, exercises, and video approvals
 */

import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Image } from 'expo-image';
import {
  Search,
  Plus,
  Filter,
  ChevronDown,
  Dumbbell,
  Play,
  Clock,
  Flame,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Video,
  Upload,
  AlertCircle,
  CheckCircle,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import { workoutPlans, exercises } from '@/data/mock-data';
import type { ContentStatus } from '@/types/database';
import type { DifficultyLevel } from '@/types/fitness';

// Tab type
type TabType = 'workouts' | 'exercises' | 'videos';

// Mock video data
interface AdminVideo {
  id: string;
  name: string;
  type: 'exercise_demo' | 'meal_prep';
  videoUrl: string;
  thumbnailUrl: string;
  linkedExerciseId?: string;
  status: ContentStatus;
  uploadedBy: string;
  uploadedAt: Date;
  duration: number; // seconds
}

const MOCK_VIDEOS: AdminVideo[] = [
  {
    id: 'vid-1',
    name: 'Push-up Demo',
    type: 'exercise_demo',
    videoUrl: 'https://example.com/pushup.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400',
    linkedExerciseId: 'ex-1',
    status: 'approved',
    uploadedBy: 'Admin',
    uploadedAt: new Date('2024-01-10'),
    duration: 45,
  },
  {
    id: 'vid-2',
    name: 'Squat Form Guide',
    type: 'exercise_demo',
    videoUrl: 'https://example.com/squat.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=400',
    status: 'pending_review',
    uploadedBy: 'Admin',
    uploadedAt: new Date('2024-03-15'),
    duration: 60,
  },
  {
    id: 'vid-3',
    name: 'Plank Technique',
    type: 'exercise_demo',
    videoUrl: 'https://example.com/plank.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1566241142559-40e1dab266c6?w=400',
    status: 'pending_review',
    uploadedBy: 'Admin',
    uploadedAt: new Date('2024-03-20'),
    duration: 30,
  },
];

// Status badge
function StatusBadge({ status }: { status: ContentStatus }) {
  const config: Record<ContentStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' },
    pending_review: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    approved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Approved' },
    rejected: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Rejected' },
    archived: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Archived' },
  };
  const { bg, text, label } = config[status];

  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium', text)}>{label}</Text>
    </View>
  );
}

// Difficulty badge
function DifficultyBadge({ difficulty }: { difficulty: DifficultyLevel }) {
  const config: Record<DifficultyLevel, { bg: string; text: string }> = {
    beginner: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
    intermediate: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
    advanced: { bg: 'bg-rose-500/20', text: 'text-rose-400' },
  };
  const { bg, text } = config[difficulty];

  return (
    <View className={cn('rounded-full px-2 py-1', bg)}>
      <Text className={cn('text-xs font-medium capitalize', text)}>{difficulty}</Text>
    </View>
  );
}

// Tab button
function TabButton({
  label,
  count,
  isActive,
  onPress,
}: {
  label: string;
  count: number;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <View
        className={cn(
          'flex-row items-center rounded-lg px-4 py-2',
          isActive ? 'bg-emerald-500/10' : 'bg-transparent'
        )}
      >
        <Text
          className={cn(
            'text-sm font-medium',
            isActive ? 'text-emerald-400' : 'text-slate-400'
          )}
        >
          {label}
        </Text>
        <View
          className={cn(
            'ml-2 rounded-full px-2 py-0.5',
            isActive ? 'bg-emerald-500/20' : 'bg-slate-800'
          )}
        >
          <Text
            className={cn(
              'text-xs',
              isActive ? 'text-emerald-400' : 'text-slate-500'
            )}
          >
            {count}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Workout card
function WorkoutCard({
  workout,
  onEdit,
}: {
  workout: typeof workoutPlans[0];
  onEdit: () => void;
}) {
  return (
    <View className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      {/* Thumbnail */}
      <View className="relative mb-3 h-32 overflow-hidden rounded-lg">
        <Image
          source={{ uri: workout.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View className="absolute bottom-2 left-2">
          <DifficultyBadge difficulty={workout.difficulty} />
        </View>
        <View className="absolute right-2 top-2">
          <StatusBadge status="approved" />
        </View>
      </View>

      {/* Info */}
      <Text className="mb-1 text-base font-semibold text-white">{workout.name}</Text>
      <Text className="mb-3 text-xs text-slate-400" numberOfLines={2}>
        {workout.description}
      </Text>

      {/* Stats */}
      <View className="mb-3 flex-row gap-4">
        <View className="flex-row items-center">
          <Clock size={12} color="#64748b" />
          <Text className="ml-1 text-xs text-slate-400">{workout.totalDuration} min</Text>
        </View>
        <View className="flex-row items-center">
          <Flame size={12} color="#f97316" />
          <Text className="ml-1 text-xs text-orange-400">{workout.estimatedCalories} cal</Text>
        </View>
        <View className="flex-row items-center">
          <Dumbbell size={12} color="#64748b" />
          <Text className="ml-1 text-xs text-slate-400">{workout.exercises.length} ex</Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2">
        <Pressable
          onPress={onEdit}
          className="flex-1 flex-row items-center justify-center rounded-lg bg-slate-800 py-2"
        >
          <Edit size={14} color="#94a3b8" />
          <Text className="ml-2 text-xs text-slate-400">Edit</Text>
        </Pressable>
        <Pressable className="items-center justify-center rounded-lg bg-slate-800 px-3 py-2">
          <Eye size={14} color="#94a3b8" />
        </Pressable>
      </View>
    </View>
  );
}

// Exercise row
function ExerciseRow({
  exercise,
  onEdit,
}: {
  exercise: typeof exercises[0];
  onEdit: () => void;
}) {
  const hasVideo = !!exercise.videoUrl;

  return (
    <View className="flex-row items-center border-b border-slate-800 py-4">
      {/* Thumbnail */}
      <View className="relative mr-4 h-16 w-24 overflow-hidden rounded-lg">
        <Image
          source={{ uri: exercise.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        {hasVideo && (
          <View className="absolute inset-0 items-center justify-center bg-black/40">
            <Play size={16} color="white" fill="white" />
          </View>
        )}
      </View>

      {/* Info */}
      <View className="flex-1">
        <Text className="text-sm font-medium text-white">{exercise.name}</Text>
        <Text className="text-xs text-slate-400">{exercise.muscleGroups.join(', ')}</Text>
      </View>

      {/* Type */}
      <View className="w-24">
        <Text className="text-xs capitalize text-slate-400">{exercise.type}</Text>
      </View>

      {/* Difficulty */}
      <View className="w-28">
        <DifficultyBadge difficulty={exercise.difficulty} />
      </View>

      {/* Video status */}
      <View className="w-24">
        {hasVideo ? (
          <View className="flex-row items-center">
            <CheckCircle size={14} color="#10b981" />
            <Text className="ml-1 text-xs text-emerald-400">Linked</Text>
          </View>
        ) : (
          <View className="flex-row items-center">
            <AlertCircle size={14} color="#f59e0b" />
            <Text className="ml-1 text-xs text-amber-400">No video</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      <View className="w-24 flex-row justify-end gap-2">
        <Pressable onPress={onEdit} className="p-1">
          <Edit size={16} color="#64748b" />
        </Pressable>
        <Pressable className="p-1">
          <Video size={16} color="#64748b" />
        </Pressable>
      </View>
    </View>
  );
}

// Video approval card
function VideoApprovalCard({
  video,
  onApprove,
  onReject,
}: {
  video: AdminVideo;
  onApprove: () => void;
  onReject: () => void;
}) {
  const linkedExercise = video.linkedExerciseId
    ? exercises.find((e) => e.id === video.linkedExerciseId)
    : null;

  return (
    <View className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      {/* Thumbnail with play */}
      <View className="relative mb-3 h-40 overflow-hidden rounded-lg">
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View className="absolute inset-0 items-center justify-center bg-black/40">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Play size={24} color="white" fill="white" />
          </View>
        </View>
        <View className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-0.5">
          <Text className="text-xs text-white">
            {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </Text>
        </View>
        <View className="absolute left-2 top-2">
          <StatusBadge status={video.status} />
        </View>
      </View>

      {/* Info */}
      <Text className="mb-1 text-base font-semibold text-white">{video.name}</Text>
      <Text className="mb-1 text-xs text-slate-400">
        Uploaded by {video.uploadedBy} • {video.uploadedAt.toLocaleDateString()}
      </Text>

      {linkedExercise && (
        <View className="mb-3 flex-row items-center rounded-lg bg-slate-800 p-2">
          <Dumbbell size={14} color="#64748b" />
          <Text className="ml-2 text-xs text-slate-400">
            Linked to: <Text className="text-white">{linkedExercise.name}</Text>
          </Text>
        </View>
      )}

      {!linkedExercise && (
        <View className="mb-3 flex-row items-center rounded-lg bg-amber-500/10 p-2">
          <AlertCircle size={14} color="#f59e0b" />
          <Text className="ml-2 text-xs text-amber-400">Not linked to any exercise</Text>
        </View>
      )}

      {/* Approval actions */}
      {video.status === 'pending_review' && (
        <View className="flex-row gap-2">
          <Pressable
            onPress={onApprove}
            className="flex-1 flex-row items-center justify-center rounded-lg bg-emerald-500 py-2.5"
          >
            <Check size={16} color="white" />
            <Text className="ml-2 text-sm font-medium text-white">Approve</Text>
          </Pressable>
          <Pressable
            onPress={onReject}
            className="flex-1 flex-row items-center justify-center rounded-lg bg-rose-500/20 py-2.5"
          >
            <X size={16} color="#f43f5e" />
            <Text className="ml-2 text-sm font-medium text-rose-400">Reject</Text>
          </Pressable>
        </View>
      )}

      {video.status === 'approved' && (
        <View className="flex-row gap-2">
          <Pressable className="flex-1 flex-row items-center justify-center rounded-lg bg-slate-800 py-2.5">
            <Eye size={16} color="#94a3b8" />
            <Text className="ml-2 text-sm text-slate-400">Preview</Text>
          </Pressable>
          <Pressable className="flex-row items-center justify-center rounded-lg bg-slate-800 px-4 py-2.5">
            <Edit size={16} color="#94a3b8" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function AdminWorkoutsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('workouts');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  // Filter data
  const filteredWorkouts = useMemo(() => {
    return workoutPlans.filter((workout) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!workout.name.toLowerCase().includes(query)) return false;
      }
      if (difficultyFilter !== 'all' && workout.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [searchQuery, difficultyFilter]);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!exercise.name.toLowerCase().includes(query)) return false;
      }
      if (difficultyFilter !== 'all' && exercise.difficulty !== difficultyFilter) return false;
      return true;
    });
  }, [searchQuery, difficultyFilter]);

  const pendingVideos = MOCK_VIDEOS.filter((v) => v.status === 'pending_review');

  const handleApproveVideo = (videoId: string) => {
    console.log('[Admin] Approving video:', videoId);
    // TODO: Implement approval logic
  };

  const handleRejectVideo = (videoId: string) => {
    console.log('[Admin] Rejecting video:', videoId);
    // TODO: Implement rejection logic
  };

  return (
    <View className="flex-1 p-6">
      {/* Page header */}
      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-bold text-white">Workout Management</Text>
          <Text className="text-sm text-slate-400">
            Manage workouts, exercises, and video content
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable className="flex-row items-center rounded-lg bg-slate-800 px-4 py-2">
            <Upload size={16} color="#94a3b8" />
            <Text className="ml-2 text-sm text-slate-400">Upload Video</Text>
          </Pressable>
          <Pressable className="flex-row items-center rounded-lg bg-emerald-500 px-4 py-2">
            <Plus size={16} color="white" />
            <Text className="ml-2 text-sm font-medium text-white">Add Workout</Text>
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className="mb-4 flex-row gap-2 border-b border-slate-800 pb-4">
        <TabButton
          label="Workouts"
          count={workoutPlans.length}
          isActive={activeTab === 'workouts'}
          onPress={() => setActiveTab('workouts')}
        />
        <TabButton
          label="Exercises"
          count={exercises.length}
          isActive={activeTab === 'exercises'}
          onPress={() => setActiveTab('exercises')}
        />
        <TabButton
          label="Videos"
          count={MOCK_VIDEOS.length}
          isActive={activeTab === 'videos'}
          onPress={() => setActiveTab('videos')}
        />
        {pendingVideos.length > 0 && (
          <View className="ml-auto flex-row items-center rounded-lg bg-amber-500/10 px-3 py-1.5">
            <AlertCircle size={14} color="#f59e0b" />
            <Text className="ml-2 text-xs text-amber-400">
              {pendingVideos.length} video(s) pending approval
            </Text>
          </View>
        )}
      </View>

      {/* Search and filters */}
      <View className="mb-4 flex-row items-center gap-4">
        <View className="flex-1 flex-row items-center rounded-lg bg-slate-800 px-4 py-2">
          <Search size={18} color="#64748b" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab}...`}
            placeholderTextColor="#64748b"
            className="ml-3 flex-1 text-sm text-white"
          />
        </View>

        <Pressable className="flex-row items-center rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
          <Filter size={16} color="#64748b" />
          <Text className="ml-2 text-sm text-slate-400">Difficulty:</Text>
          <Text className="ml-1 text-sm capitalize text-white">
            {difficultyFilter === 'all' ? 'All' : difficultyFilter}
          </Text>
          <ChevronDown size={14} color="#64748b" style={{ marginLeft: 4 }} />
        </Pressable>
      </View>

      {/* Content */}
      <ScrollView className="flex-1">
        {/* Workouts tab */}
        {activeTab === 'workouts' && (
          <View className="flex-row flex-wrap gap-4">
            {filteredWorkouts.map((workout) => (
              <View key={workout.id} style={{ width: '23%' }}>
                <WorkoutCard workout={workout} onEdit={() => {}} />
              </View>
            ))}
          </View>
        )}

        {/* Exercises tab */}
        {activeTab === 'exercises' && (
          <View className="rounded-2xl border border-slate-700 bg-slate-900">
            {/* Table header */}
            <View className="flex-row items-center border-b border-slate-700 px-4 py-3">
              <View className="mr-4 w-24" />
              <Text className="flex-1 text-xs font-medium uppercase text-slate-500">Exercise</Text>
              <Text className="w-24 text-xs font-medium uppercase text-slate-500">Type</Text>
              <Text className="w-28 text-xs font-medium uppercase text-slate-500">Difficulty</Text>
              <Text className="w-24 text-xs font-medium uppercase text-slate-500">Video</Text>
              <View className="w-24" />
            </View>

            {filteredExercises.map((exercise) => (
              <ExerciseRow key={exercise.id} exercise={exercise} onEdit={() => {}} />
            ))}
          </View>
        )}

        {/* Videos tab */}
        {activeTab === 'videos' && (
          <View>
            {/* Pending approvals section */}
            {pendingVideos.length > 0 && (
              <View className="mb-6">
                <Text className="mb-3 text-lg font-semibold text-white">Pending Approval</Text>
                <View className="flex-row flex-wrap gap-4">
                  {pendingVideos.map((video) => (
                    <View key={video.id} style={{ width: '31%' }}>
                      <VideoApprovalCard
                        video={video}
                        onApprove={() => handleApproveVideo(video.id)}
                        onReject={() => handleRejectVideo(video.id)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* All videos */}
            <Text className="mb-3 text-lg font-semibold text-white">All Videos</Text>
            <View className="flex-row flex-wrap gap-4">
              {MOCK_VIDEOS.map((video) => (
                <View key={video.id} style={{ width: '31%' }}>
                  <VideoApprovalCard
                    video={video}
                    onApprove={() => handleApproveVideo(video.id)}
                    onReject={() => handleRejectVideo(video.id)}
                  />
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

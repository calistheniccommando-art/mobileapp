/**
 * EXERCISE VIDEO PLAYER
 *
 * A video player component optimized for exercise demonstrations:
 * - Play/pause controls
 * - Progress indicator
 * - Fullscreen support
 * - Error handling with fallback
 * - Offline-ready (shows cached indicator)
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  WifiOff,
  AlertCircle,
} from 'lucide-react-native';

interface ExerciseVideoPlayerProps {
  videoUrl?: string;
  thumbnailUrl?: string;
  title: string;
  onFullscreen?: () => void;
  isCached?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  showControls?: boolean;
}

type VideoStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'ended' | 'error';

export function ExerciseVideoPlayer({
  videoUrl,
  thumbnailUrl,
  title,
  onFullscreen,
  isCached = false,
  autoPlay = false,
  loop = true,
  showControls = true,
}: ExerciseVideoPlayerProps) {
  const [status, setStatus] = useState<VideoStatus>('idle');
  const [isMuted, setIsMuted] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hideOverlayTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buttonScale = useSharedValue(1);
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Initialize video player
  const player = useVideoPlayer(videoUrl ?? '', (p) => {
    p.loop = loop;
    p.muted = true;
    if (autoPlay && videoUrl) {
      p.play();
    }
  });

  // Handle play/pause
  const handlePlayPause = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    buttonScale.value = withSpring(0.9, { damping: 15 });
    setTimeout(() => {
      buttonScale.value = withSpring(1, { damping: 15 });
    }, 100);

    if (!videoUrl) {
      setErrorMessage('No video available');
      setStatus('error');
      return;
    }

    if (player.playing) {
      player.pause();
      setStatus('paused');
    } else {
      player.play();
      setStatus('playing');
      scheduleHideOverlay();
    }
  }, [player, videoUrl, buttonScale]);

  // Handle replay
  const handleReplay = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (player) {
      player.currentTime = 0;
      player.play();
      setStatus('playing');
      scheduleHideOverlay();
    }
  }, [player]);

  // Handle mute toggle
  const handleMuteToggle = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (player) {
      player.muted = newMuted;
    }
  }, [isMuted, player]);

  // Schedule hiding the overlay
  const scheduleHideOverlay = useCallback(() => {
    if (hideOverlayTimeout.current) {
      clearTimeout(hideOverlayTimeout.current);
    }
    hideOverlayTimeout.current = setTimeout(() => {
      if (status === 'playing') {
        setShowOverlay(false);
      }
    }, 3000);
  }, [status]);

  // Show overlay on tap
  const handleVideoTap = useCallback(() => {
    setShowOverlay(true);
    if (status === 'playing') {
      scheduleHideOverlay();
    }
  }, [status, scheduleHideOverlay]);

  // Render error state
  if (status === 'error' || !videoUrl) {
    return (
      <View className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-800">
        {thumbnailUrl ? (
          <Image
            source={{ uri: thumbnailUrl }}
            style={{ width: '100%', height: '100%', position: 'absolute' }}
            contentFit="cover"
          />
        ) : null}
        <LinearGradient
          colors={['rgba(15,23,42,0.7)', 'rgba(15,23,42,0.9)']}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View className="items-center p-6">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-rose-500/20">
              <AlertCircle size={32} color="#f43f5e" />
            </View>
            <Text className="mb-1 text-center text-lg font-semibold text-white">
              Video Unavailable
            </Text>
            <Text className="text-center text-sm text-white/60">
              {errorMessage ?? 'Please follow the written instructions below'}
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <Pressable onPress={handleVideoTap} className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-800">
      {/* Video View */}
      <VideoView
        player={player}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        nativeControls={false}
      />

      {/* Overlay Controls */}
      {showOverlay && showControls && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        >
          {/* Gradient overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.5)']}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />

          {/* Top bar */}
          <View className="absolute left-0 right-0 top-0 flex-row items-center justify-between p-3">
            <View className="flex-row items-center">
              {isCached && (
                <View className="mr-2 flex-row items-center rounded-full bg-emerald-500/20 px-2 py-1">
                  <WifiOff size={12} color="#10b981" />
                  <Text className="ml-1 text-xs text-emerald-400">Offline</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={onFullscreen}
              className="h-8 w-8 items-center justify-center rounded-full bg-black/30"
            >
              <Maximize2 size={16} color="white" />
            </Pressable>
          </View>

          {/* Center play button */}
          <View className="absolute inset-0 items-center justify-center">
            {status === 'loading' ? (
              <View className="h-16 w-16 items-center justify-center rounded-full bg-black/40">
                <ActivityIndicator size="large" color="white" />
              </View>
            ) : (
              <Animated.View style={animatedButtonStyle}>
                <Pressable
                  onPress={handlePlayPause}
                  className="h-16 w-16 items-center justify-center rounded-full bg-white/20"
                  style={{ backdropFilter: 'blur(10px)' }}
                >
                  {status === 'playing' ? (
                    <Pause size={28} color="white" fill="white" />
                  ) : status === 'ended' ? (
                    <RotateCcw size={28} color="white" />
                  ) : (
                    <Play size={28} color="white" fill="white" />
                  )}
                </Pressable>
              </Animated.View>
            )}
          </View>

          {/* Bottom bar */}
          <View className="absolute bottom-0 left-0 right-0 flex-row items-center justify-between p-3">
            <Text className="flex-1 text-sm font-medium text-white" numberOfLines={1}>
              {title}
            </Text>
            <Pressable
              onPress={handleMuteToggle}
              className="h-8 w-8 items-center justify-center rounded-full bg-black/30"
            >
              {isMuted ? (
                <VolumeX size={16} color="white" />
              ) : (
                <Volume2 size={16} color="white" />
              )}
            </Pressable>
          </View>
        </Animated.View>
      )}

      {/* Loading indicator */}
      {status === 'loading' && (
        <View className="absolute inset-0 items-center justify-center bg-black/30">
          <ActivityIndicator size="large" color="white" />
        </View>
      )}
    </Pressable>
  );
}

export default ExerciseVideoPlayer;

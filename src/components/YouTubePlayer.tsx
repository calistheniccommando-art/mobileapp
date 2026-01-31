/**
 * YOUTUBE PLAYER COMPONENT
 * 
 * Cross-platform YouTube video player for exercise demonstrations.
 * Uses react-native-youtube-iframe for native, iframe for web.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import { Play, Pause, Volume2, VolumeX, Maximize2, ExternalLink, AlertCircle } from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  isValidVideoId,
  getEmbedUrl,
  getWatchUrl,
  getBestThumbnail,
  EXERCISE_VIDEO_CONFIG,
  type YouTubePlayerConfig,
} from '@/lib/youtube';

// ==================== TYPES ====================

export interface YouTubePlayerProps {
  videoId: string;
  config?: YouTubePlayerConfig;
  height?: number;
  autoPlay?: boolean;
  showThumbnail?: boolean;
  onReady?: () => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void;
  className?: string;
}

interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  isLoading: boolean;
  hasError: boolean;
  showPlayer: boolean;
}

// ==================== WEB PLAYER (IFRAME) ====================

function WebPlayer({
  videoId,
  config,
  height,
  onReady,
  onError,
}: {
  videoId: string;
  config: YouTubePlayerConfig;
  height: number;
  onReady?: () => void;
  onError?: (error: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl = getEmbedUrl(videoId, config);

  const handleLoad = () => {
    setIsLoading(false);
    onReady?.();
  };

  const handleError = () => {
    setIsLoading(false);
    onError?.('Failed to load video');
  };

  return (
    <View style={{ height, position: 'relative' }}>
      {isLoading && (
        <View className="absolute inset-0 items-center justify-center bg-black/80 z-10">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      )}
      {Platform.OS === 'web' && (
        <iframe
          ref={iframeRef as any}
          src={embedUrl}
          width="100%"
          height={height}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={handleLoad}
          onError={handleError}
          style={{
            borderRadius: 12,
            backgroundColor: '#000',
          }}
        />
      )}
    </View>
  );
}

// ==================== NATIVE PLAYER (WEBVIEW BASED) ====================

function NativePlayer({
  videoId,
  config,
  height,
  onReady,
  onError,
  onStateChange,
}: {
  videoId: string;
  config: YouTubePlayerConfig;
  height: number;
  onReady?: () => void;
  onError?: (error: string) => void;
  onStateChange?: (state: 'playing' | 'paused' | 'ended' | 'buffering') => void;
}) {
  const [isLoading, setIsLoading] = useState(true);

  // For native, we use a WebView-based approach
  // In production, use react-native-youtube-iframe for better control
  const embedUrl = getEmbedUrl(videoId, config);

  useEffect(() => {
    // Simulate load delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      onReady?.();
    }, 1000);
    return () => clearTimeout(timer);
  }, [videoId]);

  // For now, render a placeholder that opens YouTube
  // In production, integrate react-native-youtube-iframe
  return (
    <View style={{ height }} className="bg-black rounded-xl overflow-hidden">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-white/60 text-sm mb-2">YouTube Player</Text>
          <Pressable
            onPress={() => Linking.openURL(getWatchUrl(videoId))}
            className="bg-red-600 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Play size={16} color="white" fill="white" />
            <Text className="text-white font-medium ml-2">Watch on YouTube</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ==================== THUMBNAIL OVERLAY ====================

function ThumbnailOverlay({
  videoId,
  height,
  onPlay,
}: {
  videoId: string;
  height: number;
  onPlay: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const thumbnailUrl = getBestThumbnail(videoId);

  return (
    <Pressable
      onPress={onPlay}
      style={{ height }}
      className="relative rounded-xl overflow-hidden bg-black"
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        onLoad={() => setImageLoaded(true)}
      />
      
      {/* Play button overlay */}
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-16 h-16 rounded-full bg-red-600 items-center justify-center shadow-lg">
          <Play size={28} color="white" fill="white" style={{ marginLeft: 3 }} />
        </View>
      </View>

      {/* YouTube branding */}
      <View className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded">
        <Text className="text-white text-xs font-medium">YouTube</Text>
      </View>
    </Pressable>
  );
}

// ==================== ERROR STATE ====================

function ErrorState({
  message,
  videoId,
  height,
  onRetry,
}: {
  message: string;
  videoId: string;
  height: number;
  onRetry?: () => void;
}) {
  return (
    <View
      style={{ height }}
      className="bg-slate-800 rounded-xl items-center justify-center px-4"
    >
      <AlertCircle size={32} color="#ef4444" />
      <Text className="text-white font-medium mt-3 text-center">{message}</Text>
      <Text className="text-white/40 text-sm mt-1">Video ID: {videoId}</Text>
      
      <View className="flex-row gap-3 mt-4">
        {onRetry && (
          <Pressable
            onPress={onRetry}
            className="bg-slate-700 px-4 py-2 rounded-lg"
          >
            <Text className="text-white">Retry</Text>
          </Pressable>
        )}
        <Pressable
          onPress={() => Linking.openURL(getWatchUrl(videoId))}
          className="bg-red-600 px-4 py-2 rounded-lg flex-row items-center"
        >
          <ExternalLink size={14} color="white" />
          <Text className="text-white ml-2">Open YouTube</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== MAIN COMPONENT ====================

export function YouTubePlayer({
  videoId,
  config = EXERCISE_VIDEO_CONFIG,
  height = 200,
  autoPlay = false,
  showThumbnail = true,
  onReady,
  onError,
  onStateChange,
  className,
}: YouTubePlayerProps) {
  const [state, setState] = useState<PlayerState>({
    isPlaying: autoPlay,
    isMuted: config.mute || false,
    isLoading: false,
    hasError: false,
    showPlayer: autoPlay || !showThumbnail,
  });

  // Validate video ID
  if (!isValidVideoId(videoId)) {
    return (
      <ErrorState
        message="Invalid video ID"
        videoId={videoId}
        height={height}
      />
    );
  }

  const handlePlay = useCallback(() => {
    setState((prev) => ({ ...prev, showPlayer: true, isPlaying: true }));
  }, []);

  const handleReady = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: false }));
    onReady?.();
  }, [onReady]);

  const handleError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, hasError: true, isLoading: false }));
    onError?.(error);
  }, [onError]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasError: false,
      isLoading: true,
      showPlayer: true,
    }));
  }, []);

  // Show error state
  if (state.hasError) {
    return (
      <View className={className}>
        <ErrorState
          message="Failed to load video"
          videoId={videoId}
          height={height}
          onRetry={handleRetry}
        />
      </View>
    );
  }

  // Show thumbnail with play button
  if (!state.showPlayer && showThumbnail) {
    return (
      <View className={className}>
        <ThumbnailOverlay
          videoId={videoId}
          height={height}
          onPlay={handlePlay}
        />
      </View>
    );
  }

  // Show player
  return (
    <View className={cn('rounded-xl overflow-hidden', className)}>
      {Platform.OS === 'web' ? (
        <WebPlayer
          videoId={videoId}
          config={{ ...config, autoplay: state.isPlaying }}
          height={height}
          onReady={handleReady}
          onError={handleError}
        />
      ) : (
        <NativePlayer
          videoId={videoId}
          config={{ ...config, autoplay: state.isPlaying }}
          height={height}
          onReady={handleReady}
          onError={handleError}
          onStateChange={onStateChange}
        />
      )}
    </View>
  );
}

// ==================== COMPACT PLAYER ====================

export function YouTubePlayerMini({
  videoId,
  size = 120,
  onPress,
}: {
  videoId: string;
  size?: number;
  onPress?: () => void;
}) {
  if (!isValidVideoId(videoId)) {
    return (
      <View
        style={{ width: size, height: size * 0.5625 }}
        className="bg-slate-800 rounded-lg items-center justify-center"
      >
        <AlertCircle size={16} color="#ef4444" />
      </View>
    );
  }

  const thumbnailUrl = getBestThumbnail(videoId);

  return (
    <Pressable
      onPress={onPress || (() => Linking.openURL(getWatchUrl(videoId)))}
      style={{ width: size, height: size * 0.5625 }}
      className="relative rounded-lg overflow-hidden bg-black"
    >
      <Image
        source={{ uri: thumbnailUrl }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
      />
      <View className="absolute inset-0 items-center justify-center">
        <View className="w-8 h-8 rounded-full bg-red-600/90 items-center justify-center">
          <Play size={14} color="white" fill="white" style={{ marginLeft: 1 }} />
        </View>
      </View>
    </Pressable>
  );
}

// ==================== EXPORTS ====================

export default YouTubePlayer;

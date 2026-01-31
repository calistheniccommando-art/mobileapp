/**
 * YOUTUBE INPUT COMPONENT (ADMIN)
 * 
 * Input component for admin to enter YouTube video IDs.
 * Supports pasting full URLs and extracting the video ID.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import {
  Youtube,
  Check,
  X,
  Link,
  Play,
  AlertCircle,
  Clipboard,
  RefreshCw,
  ExternalLink,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  extractVideoId,
  isValidVideoId,
  validateVideoOembed,
  getBestThumbnail,
  getWatchUrl,
  fetchVideoTitle,
} from '@/lib/youtube';

// ==================== TYPES ====================

// Local VideoInfo interface for this component's needs
interface VideoInfo {
  id: string;
  title: string;
  thumbnailUrl: string;
  watchUrl: string;
}

export interface YouTubeInputProps {
  value: string;
  onChange: (videoId: string) => void;
  onVideoInfo?: (info: VideoInfo | null) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  showPreview?: boolean;
  validateOnChange?: boolean;
  className?: string;
}

interface ValidationState {
  isValidating: boolean;
  isValid: boolean | null;
  videoInfo: VideoInfo | null;
  errorMessage: string | null;
}

// ==================== MAIN COMPONENT ====================

export function YouTubeInput({
  value,
  onChange,
  onVideoInfo,
  label = 'YouTube Video',
  placeholder = 'Paste YouTube URL or video ID',
  required = false,
  disabled = false,
  showPreview = true,
  validateOnChange = true,
  className,
}: YouTubeInputProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    isValid: null,
    videoInfo: null,
    errorMessage: null,
  });

  // Update input when value prop changes
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value || '');
    }
  }, [value]);

  // Handle input change
  const handleInputChange = useCallback(
    async (text: string) => {
      setInputValue(text);

      // Try to extract video ID from input
      const extractedId = extractVideoId(text);
      
      if (!text.trim()) {
        // Clear validation and value
        setValidation({
          isValidating: false,
          isValid: null,
          videoInfo: null,
          errorMessage: null,
        });
        onChange('');
        onVideoInfo?.(null);
        return;
      }

      if (extractedId && isValidVideoId(extractedId)) {
        // Valid format, update immediately
        onChange(extractedId);

        // Validate with oEmbed if enabled
        if (validateOnChange) {
          setValidation((prev) => ({ ...prev, isValidating: true }));
          
          try {
            const isAccessible = await validateVideoOembed(extractedId);
            
            if (isAccessible) {
              const title = await fetchVideoTitle(extractedId);
              const videoInfo: VideoInfo = {
                id: extractedId,
                title: title || 'Video',
                thumbnailUrl: getBestThumbnail(extractedId),
                watchUrl: getWatchUrl(extractedId),
              };
              
              setValidation({
                isValidating: false,
                isValid: true,
                videoInfo,
                errorMessage: null,
              });
              onVideoInfo?.(videoInfo);
            } else {
              setValidation({
                isValidating: false,
                isValid: false,
                videoInfo: null,
                errorMessage: 'Video not accessible (may be private or deleted)',
              });
              onVideoInfo?.(null);
            }
          } catch (error) {
            // Network error, still show as potentially valid
            setValidation({
              isValidating: false,
              isValid: true,
              videoInfo: {
                id: extractedId,
                title: 'Video',
                thumbnailUrl: getBestThumbnail(extractedId),
                watchUrl: getWatchUrl(extractedId),
              },
              errorMessage: null,
            });
          }
        } else {
          // Just show as valid format without checking
          setValidation({
            isValidating: false,
            isValid: true,
            videoInfo: {
              id: extractedId,
              title: 'Video',
              thumbnailUrl: getBestThumbnail(extractedId),
              watchUrl: getWatchUrl(extractedId),
            },
            errorMessage: null,
          });
        }
      } else {
        // Invalid format
        setValidation({
          isValidating: false,
          isValid: false,
          videoInfo: null,
          errorMessage: 'Invalid YouTube URL or video ID',
        });
      }
    },
    [onChange, onVideoInfo, validateOnChange]
  );

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      // Web clipboard API
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        handleInputChange(text);
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
    }
  }, [handleInputChange]);

  // Clear input
  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
    onVideoInfo?.(null);
    setValidation({
      isValidating: false,
      isValid: null,
      videoInfo: null,
      errorMessage: null,
    });
  }, [onChange, onVideoInfo]);

  // Retry validation
  const handleRetry = useCallback(() => {
    if (inputValue) {
      handleInputChange(inputValue);
    }
  }, [inputValue, handleInputChange]);

  return (
    <View className={cn('gap-2', className)}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center gap-2">
          <Youtube size={16} color="#ef4444" />
          <Text className="text-white font-medium">
            {label}
            {required && <Text className="text-red-500"> *</Text>}
          </Text>
        </View>
      )}

      {/* Input Field */}
      <View className="relative">
        <View
          className={cn(
            'flex-row items-center bg-slate-800 rounded-lg border px-3',
            disabled && 'opacity-50',
            validation.isValid === true && 'border-emerald-500',
            validation.isValid === false && 'border-red-500',
            validation.isValid === null && 'border-slate-700'
          )}
        >
          <Link size={16} color="#64748b" />
          
          <TextInput
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder={placeholder}
            placeholderTextColor="#64748b"
            editable={!disabled}
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 py-3 px-3 text-white"
          />

          {/* Status indicators */}
          <View className="flex-row items-center gap-2">
            {validation.isValidating && (
              <ActivityIndicator size="small" color="#10b981" />
            )}
            
            {!validation.isValidating && validation.isValid === true && (
              <Check size={18} color="#10b981" />
            )}
            
            {!validation.isValidating && validation.isValid === false && (
              <AlertCircle size={18} color="#ef4444" />
            )}

            {inputValue && !disabled && (
              <Pressable onPress={handleClear} className="p-1">
                <X size={16} color="#64748b" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Paste button */}
        <Pressable
          onPress={handlePaste}
          disabled={disabled}
          className="absolute right-12 top-1/2 -translate-y-1/2 p-2"
        >
          <Clipboard size={14} color="#64748b" />
        </Pressable>
      </View>

      {/* Error message */}
      {validation.errorMessage && (
        <View className="flex-row items-center gap-2">
          <AlertCircle size={14} color="#ef4444" />
          <Text className="text-red-400 text-sm">{validation.errorMessage}</Text>
          <Pressable onPress={handleRetry} className="ml-auto">
            <RefreshCw size={14} color="#64748b" />
          </Pressable>
        </View>
      )}

      {/* Video Preview */}
      {showPreview && validation.isValid && validation.videoInfo && (
        <VideoPreview videoInfo={validation.videoInfo} />
      )}

      {/* Help text */}
      <Text className="text-slate-500 text-xs">
        Paste a YouTube URL or enter just the video ID (e.g., dQw4w9WgXcQ)
      </Text>
    </View>
  );
}

// ==================== VIDEO PREVIEW ====================

function VideoPreview({ videoInfo }: { videoInfo: VideoInfo }) {
  return (
    <View className="bg-slate-800/50 rounded-lg p-3 flex-row gap-3">
      {/* Thumbnail */}
      <View className="relative rounded-lg overflow-hidden" style={{ width: 120, height: 68 }}>
        <Image
          source={{ uri: videoInfo.thumbnailUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
        />
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-8 h-8 rounded-full bg-red-600/90 items-center justify-center">
            <Play size={14} color="white" fill="white" style={{ marginLeft: 1 }} />
          </View>
        </View>
      </View>

      {/* Info */}
      <View className="flex-1 justify-center">
        <Text className="text-white font-medium" numberOfLines={2}>
          {videoInfo.title}
        </Text>
        <Text className="text-slate-500 text-xs mt-1">ID: {videoInfo.id}</Text>
        
        <Pressable
          onPress={() => {
            if (typeof window !== 'undefined') {
              window.open(videoInfo.watchUrl, '_blank');
            }
          }}
          className="flex-row items-center gap-1 mt-2"
        >
          <ExternalLink size={12} color="#10b981" />
          <Text className="text-emerald-500 text-xs">Preview on YouTube</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== COMPACT VARIANT ====================

export function YouTubeInputCompact({
  value,
  onChange,
  placeholder = 'Video ID',
  disabled = false,
}: {
  value: string;
  onChange: (videoId: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [inputValue, setInputValue] = useState(value || '');

  const handleChange = (text: string) => {
    setInputValue(text);
    const extractedId = extractVideoId(text);
    if (extractedId && isValidVideoId(extractedId)) {
      onChange(extractedId);
    } else if (!text.trim()) {
      onChange('');
    }
  };

  const isValid = value && isValidVideoId(value);

  return (
    <View
      className={cn(
        'flex-row items-center bg-slate-800 rounded-lg border px-3 py-2',
        isValid ? 'border-emerald-500/50' : 'border-slate-700'
      )}
    >
      <Youtube size={14} color="#ef4444" />
      <TextInput
        value={inputValue}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor="#64748b"
        editable={!disabled}
        autoCapitalize="none"
        className="flex-1 px-2 text-white text-sm"
      />
      {isValid && <Check size={14} color="#10b981" />}
    </View>
  );
}

// ==================== EXPORTS ====================

export default YouTubeInput;

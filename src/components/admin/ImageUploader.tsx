/**
 * IMAGE UPLOADER COMPONENT (ADMIN)
 * 
 * Image picker and upload component for admin forms.
 * Supports drag-and-drop, file picker, and shows upload progress.
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import {
  Upload,
  Image as ImageIcon,
  X,
  Check,
  AlertCircle,
  Camera,
  Folder,
  RefreshCw,
  Trash2,
} from 'lucide-react-native';
import { cn } from '@/lib/cn';
import {
  uploadImage,
  validateFile,
  deleteFile,
  type StorageBucket,
  type UploadResult,
  STORAGE_BUCKETS,
} from '@/lib/supabase/storage';

// ==================== TYPES ====================

export interface ImageUploaderProps {
  value?: string;
  onChange: (url: string | null) => void;
  bucket: StorageBucket;
  prefix?: string;
  label?: string;
  placeholder?: string;
  aspectRatio?: number;
  maxWidth?: number;
  required?: boolean;
  disabled?: boolean;
  showPreview?: boolean;
  onUploadStart?: () => void;
  onUploadComplete?: (result: UploadResult) => void;
  className?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  uploadedUrl: string | null;
}

// ==================== MAIN COMPONENT ====================

export function ImageUploader({
  value,
  onChange,
  bucket,
  prefix,
  label = 'Image',
  placeholder = 'Click or drag to upload',
  aspectRatio = 16 / 9,
  maxWidth = 400,
  required = false,
  disabled = false,
  showPreview = true,
  onUploadStart,
  onUploadComplete,
  className,
}: ImageUploaderProps) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    uploadedUrl: value || null,
  });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bucketConfig = STORAGE_BUCKETS[bucket];
  const maxSizeMB = bucketConfig.maxSize / (1024 * 1024);

  // Handle file selection (native)
  const handlePickImage = async () => {
    if (disabled || state.isUploading) return;

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          error: 'Permission to access photos was denied',
        }));
        return;
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio === 1 ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFromUri(asset.uri, asset.fileName || 'image.jpg');
      }
    } catch (error) {
      console.error('Image picker error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to pick image',
      }));
    }
  };

  // Handle camera capture (native)
  const handleTakePhoto = async () => {
    if (disabled || state.isUploading) return;

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setState((prev) => ({
          ...prev,
          error: 'Permission to access camera was denied',
        }));
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: aspectRatio === 1 ? [1, 1] : [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        await uploadFromUri(asset.uri, 'photo.jpg');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setState((prev) => ({
        ...prev,
        error: 'Failed to take photo',
      }));
    }
  };

  // Upload from URI (native)
  const uploadFromUri = async (uri: string, fileName: string) => {
    setState((prev) => ({ ...prev, isUploading: true, error: null, progress: 0 }));
    onUploadStart?.();

    try {
      // Fetch the file
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload
      const result = await uploadImage(blob, bucket, {
        prefix,
        fileName,
        onProgress: (progress) => {
          setState((prev) => ({ ...prev, progress }));
        },
      });

      if (result.success && result.url) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          uploadedUrl: result.url,
          error: null,
        }));
        onChange(result.url);
      } else {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: result.error || 'Upload failed',
        }));
      }

      onUploadComplete?.(result);
    } catch (error) {
      console.error('Upload error:', error);
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  // Handle file selection (web)
  const handleWebFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await uploadFile(file);
  };

  // Handle drag and drop (web)
  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (!file) return;

    await uploadFile(file);
  };

  // Upload file (web)
  const uploadFile = async (file: File) => {
    // Validate
    const validation = validateFile(file, bucket);
    if (!validation.valid) {
      setState((prev) => ({ ...prev, error: validation.error || 'Invalid file' }));
      return;
    }

    setState((prev) => ({ ...prev, isUploading: true, error: null, progress: 0 }));
    onUploadStart?.();

    try {
      const result = await uploadImage(file, bucket, {
        prefix,
        fileName: file.name,
        onProgress: (progress) => {
          setState((prev) => ({ ...prev, progress }));
        },
      });

      if (result.success && result.url) {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          progress: 100,
          uploadedUrl: result.url,
          error: null,
        }));
        onChange(result.url);
      } else {
        setState((prev) => ({
          ...prev,
          isUploading: false,
          error: result.error || 'Upload failed',
        }));
      }

      onUploadComplete?.(result);
    } catch (error) {
      console.error('Upload error:', error);
      setState((prev) => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      }));
    }
  };

  // Clear image
  const handleClear = useCallback(() => {
    setState({
      isUploading: false,
      progress: 0,
      error: null,
      uploadedUrl: null,
    });
    onChange(null);
  }, [onChange]);

  // Retry upload
  const handleRetry = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
    if (Platform.OS === 'web') {
      fileInputRef.current?.click();
    } else {
      handlePickImage();
    }
  }, []);

  const currentUrl = state.uploadedUrl || value;
  const height = maxWidth / aspectRatio;

  return (
    <View className={cn('gap-2', className)}>
      {/* Label */}
      {label && (
        <View className="flex-row items-center gap-2">
          <ImageIcon size={16} color="#64748b" />
          <Text className="text-white font-medium">
            {label}
            {required && <Text className="text-red-500"> *</Text>}
          </Text>
        </View>
      )}

      {/* Preview or Upload Area */}
      {currentUrl && showPreview ? (
        <ImagePreview
          url={currentUrl}
          height={height}
          onRemove={handleClear}
          disabled={disabled || state.isUploading}
        />
      ) : (
        <UploadArea
          height={height}
          isDragOver={isDragOver}
          isUploading={state.isUploading}
          progress={state.progress}
          error={state.error}
          disabled={disabled}
          placeholder={placeholder}
          onPickImage={handlePickImage}
          onTakePhoto={handleTakePhoto}
          onRetry={handleRetry}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          fileInputRef={fileInputRef}
          onFileSelect={handleWebFileSelect}
        />
      )}

      {/* Help text */}
      <Text className="text-slate-500 text-xs">
        Supported: {bucketConfig.allowedTypes.map((t) => t.split('/')[1]).join(', ')} •
        Max {maxSizeMB}MB
      </Text>
    </View>
  );
}

// ==================== UPLOAD AREA ====================

function UploadArea({
  height,
  isDragOver,
  isUploading,
  progress,
  error,
  disabled,
  placeholder,
  onPickImage,
  onTakePhoto,
  onRetry,
  onDrop,
  onDragOver,
  onDragLeave,
  fileInputRef,
  onFileSelect,
}: {
  height: number;
  isDragOver: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  disabled: boolean;
  placeholder: string;
  onPickImage: () => void;
  onTakePhoto: () => void;
  onRetry: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  // Error state
  if (error) {
    return (
      <View
        style={{ height }}
        className="bg-red-500/10 border-2 border-dashed border-red-500/50 rounded-xl items-center justify-center px-4"
      >
        <AlertCircle size={24} color="#ef4444" />
        <Text className="text-red-400 text-center mt-2">{error}</Text>
        <Pressable
          onPress={onRetry}
          className="bg-red-500/20 px-4 py-2 rounded-lg mt-3"
        >
          <Text className="text-red-400">Try Again</Text>
        </Pressable>
      </View>
    );
  }

  // Uploading state
  if (isUploading) {
    return (
      <View
        style={{ height }}
        className="bg-emerald-500/10 border-2 border-dashed border-emerald-500/50 rounded-xl items-center justify-center"
      >
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-emerald-400 mt-2">Uploading... {Math.round(progress)}%</Text>
        
        {/* Progress bar */}
        <View className="w-48 h-2 bg-slate-700 rounded-full mt-3 overflow-hidden">
          <View
            className="h-full bg-emerald-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </View>
      </View>
    );
  }

  // Default upload area
  if (Platform.OS === 'web') {
    return (
      <View
        style={{ height }}
        className={cn(
          'border-2 border-dashed rounded-xl items-center justify-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-emerald-500 bg-emerald-500/10'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        // @ts-ignore - web props
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        <input
          ref={fileInputRef as any}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        <Pressable
          onPress={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="items-center"
        >
          <Upload size={32} color={isDragOver ? '#10b981' : '#64748b'} />
          <Text className="text-slate-400 mt-2">
            {isDragOver ? 'Drop image here' : placeholder}
          </Text>
          <Text className="text-slate-500 text-sm mt-1">or click to browse</Text>
        </Pressable>
      </View>
    );
  }

  // Native upload area with buttons
  return (
    <View
      style={{ height }}
      className={cn(
        'border-2 border-dashed border-slate-700 rounded-xl items-center justify-center bg-slate-800/50',
        disabled && 'opacity-50'
      )}
    >
      <Text className="text-slate-400 mb-4">{placeholder}</Text>
      
      <View className="flex-row gap-4">
        <Pressable
          onPress={onPickImage}
          disabled={disabled}
          className="bg-slate-700 px-4 py-3 rounded-lg flex-row items-center gap-2"
        >
          <Folder size={18} color="#94a3b8" />
          <Text className="text-white">Gallery</Text>
        </Pressable>
        
        <Pressable
          onPress={onTakePhoto}
          disabled={disabled}
          className="bg-slate-700 px-4 py-3 rounded-lg flex-row items-center gap-2"
        >
          <Camera size={18} color="#94a3b8" />
          <Text className="text-white">Camera</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ==================== IMAGE PREVIEW ====================

function ImagePreview({
  url,
  height,
  onRemove,
  disabled,
}: {
  url: string;
  height: number;
  onRemove: () => void;
  disabled: boolean;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <View
      style={{ height }}
      className="relative rounded-xl overflow-hidden bg-slate-800"
    >
      <Image
        source={{ uri: url }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        onLoad={() => setLoaded(true)}
      />
      
      {/* Loading overlay */}
      {!loaded && (
        <View className="absolute inset-0 items-center justify-center bg-slate-800">
          <ActivityIndicator size="small" color="#10b981" />
        </View>
      )}
      
      {/* Success badge */}
      <View className="absolute top-2 left-2 bg-emerald-500 px-2 py-1 rounded-full flex-row items-center gap-1">
        <Check size={12} color="white" />
        <Text className="text-white text-xs font-medium">Uploaded</Text>
      </View>
      
      {/* Remove button */}
      {!disabled && (
        <Pressable
          onPress={onRemove}
          className="absolute top-2 right-2 bg-red-500 p-2 rounded-full"
        >
          <Trash2 size={16} color="white" />
        </Pressable>
      )}
    </View>
  );
}

// ==================== COMPACT VARIANT ====================

export function ImageUploaderCompact({
  value,
  onChange,
  bucket,
  prefix,
  size = 80,
  disabled = false,
}: {
  value?: string;
  onChange: (url: string | null) => void;
  bucket: StorageBucket;
  prefix?: string;
  size?: number;
  disabled?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handlePick = async () => {
    if (disabled || isUploading) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploading(true);
        const asset = result.assets[0];
        const response = await fetch(asset.uri);
        const blob = await response.blob();

        const uploadResult = await uploadImage(blob, bucket, {
          prefix,
          fileName: asset.fileName || 'image.jpg',
        });

        if (uploadResult.success && uploadResult.url) {
          onChange(uploadResult.url);
        }
        setIsUploading(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
    }
  };

  return (
    <Pressable
      onPress={handlePick}
      disabled={disabled || isUploading}
      style={{ width: size, height: size }}
      className={cn(
        'rounded-lg overflow-hidden border-2 border-dashed items-center justify-center',
        value ? 'border-transparent' : 'border-slate-700 bg-slate-800'
      )}
    >
      {value ? (
        <>
          <Image
            source={{ uri: value }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
          {!disabled && (
            <View className="absolute inset-0 bg-black/50 items-center justify-center opacity-0 hover:opacity-100">
              <RefreshCw size={20} color="white" />
            </View>
          )}
        </>
      ) : isUploading ? (
        <ActivityIndicator size="small" color="#10b981" />
      ) : (
        <Upload size={20} color="#64748b" />
      )}
    </Pressable>
  );
}

// ==================== EXPORTS ====================

export default ImageUploader;

/**
 * YOUTUBE PLAYER UTILITIES
 * 
 * Handles YouTube video ID extraction, validation, and URL generation.
 * Used for exercise demonstration videos stored as YouTube unlisted videos.
 */

// ==================== TYPES ====================

export interface YouTubeVideoInfo {
  videoId: string;
  title?: string;
  thumbnail: {
    default: string;
    medium: string;
    high: string;
    maxres?: string;
  };
  embedUrl: string;
  watchUrl: string;
}

export interface YouTubePlayerConfig {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  mute?: boolean;
  playsinline?: boolean;
  showinfo?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
  start?: number;
  end?: number;
}

// ==================== CONSTANTS ====================

/**
 * YouTube URL patterns for video ID extraction
 */
const YOUTUBE_PATTERNS = [
  // Standard watch URLs
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
  // Short URLs
  /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
  // Embed URLs
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  // YouTube Shorts
  /(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  // Just the video ID
  /^([a-zA-Z0-9_-]{11})$/,
];

/**
 * YouTube thumbnail URL templates
 */
const THUMBNAIL_URLS = {
  default: (videoId: string) => `https://img.youtube.com/vi/${videoId}/default.jpg`,
  medium: (videoId: string) => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
  high: (videoId: string) => `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  maxres: (videoId: string) => `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
};

/**
 * YouTube API endpoints
 */
const YOUTUBE_API = {
  embed: (videoId: string) => `https://www.youtube.com/embed/${videoId}`,
  watch: (videoId: string) => `https://www.youtube.com/watch?v=${videoId}`,
  oembed: (videoId: string) => 
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
};

// ==================== EXTRACTION ====================

/**
 * Extract YouTube video ID from various URL formats or raw ID
 */
export function extractVideoId(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a string is a valid YouTube video ID format
 */
export function isValidVideoId(videoId: string): boolean {
  if (!videoId) return false;
  return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
}

/**
 * Validate a YouTube video ID by checking if the thumbnail exists
 * This is a lightweight validation without API key
 */
export async function validateVideoId(videoId: string): Promise<boolean> {
  if (!isValidVideoId(videoId)) return false;

  try {
    // Check if thumbnail exists (works for public/unlisted videos)
    const response = await fetch(THUMBNAIL_URLS.default(videoId), {
      method: 'HEAD',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Validate video by checking oembed endpoint (more reliable)
 */
export async function validateVideoOembed(videoId: string): Promise<{
  valid: boolean;
  title?: string;
}> {
  if (!isValidVideoId(videoId)) {
    return { valid: false };
  }

  try {
    const response = await fetch(YOUTUBE_API.oembed(videoId));
    if (!response.ok) {
      return { valid: false };
    }
    const data = await response.json();
    return {
      valid: true,
      title: data.title,
    };
  } catch {
    return { valid: false };
  }
}

// ==================== URL GENERATION ====================

/**
 * Get all thumbnail URLs for a video
 */
export function getThumbnailUrls(videoId: string): YouTubeVideoInfo['thumbnail'] {
  return {
    default: THUMBNAIL_URLS.default(videoId),
    medium: THUMBNAIL_URLS.medium(videoId),
    high: THUMBNAIL_URLS.high(videoId),
    maxres: THUMBNAIL_URLS.maxres(videoId),
  };
}

/**
 * Get the best quality thumbnail URL
 */
export function getBestThumbnail(videoId: string): string {
  return THUMBNAIL_URLS.high(videoId);
}

/**
 * Get embed URL for iframe player
 */
export function getEmbedUrl(videoId: string, config?: YouTubePlayerConfig): string {
  const baseUrl = YOUTUBE_API.embed(videoId);
  const params = new URLSearchParams();

  if (config) {
    if (config.autoplay) params.set('autoplay', '1');
    if (config.controls === false) params.set('controls', '0');
    if (config.loop) params.set('loop', '1');
    if (config.mute) params.set('mute', '1');
    if (config.playsinline) params.set('playsinline', '1');
    if (config.showinfo === false) params.set('showinfo', '0');
    if (config.modestbranding) params.set('modestbranding', '1');
    if (config.rel === false) params.set('rel', '0');
    if (config.start) params.set('start', config.start.toString());
    if (config.end) params.set('end', config.end.toString());
  }

  // Default settings for app embed
  if (!params.has('modestbranding')) params.set('modestbranding', '1');
  if (!params.has('rel')) params.set('rel', '0');
  if (!params.has('playsinline')) params.set('playsinline', '1');

  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get watch URL for opening in browser/YouTube app
 */
export function getWatchUrl(videoId: string, timestamp?: number): string {
  const url = YOUTUBE_API.watch(videoId);
  return timestamp ? `${url}&t=${timestamp}` : url;
}

// ==================== VIDEO INFO ====================

/**
 * Get complete video info for a video ID
 */
export function getVideoInfo(videoId: string): YouTubeVideoInfo {
  return {
    videoId,
    thumbnail: getThumbnailUrls(videoId),
    embedUrl: getEmbedUrl(videoId),
    watchUrl: getWatchUrl(videoId),
  };
}

/**
 * Fetch video title using oembed (no API key required)
 */
export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  const result = await validateVideoOembed(videoId);
  return result.valid ? result.title || null : null;
}

// ==================== PLAYER CONFIG ====================

/**
 * Default player config for exercise demonstrations
 */
export const EXERCISE_VIDEO_CONFIG: YouTubePlayerConfig = {
  autoplay: false,
  controls: true,
  loop: true,
  mute: false,
  playsinline: true,
  modestbranding: true,
  rel: false,
};

/**
 * Default player config for meal prep videos
 */
export const MEAL_VIDEO_CONFIG: YouTubePlayerConfig = {
  autoplay: false,
  controls: true,
  loop: false,
  mute: false,
  playsinline: true,
  modestbranding: true,
  rel: false,
};

/**
 * Config for admin preview (muted autoplay)
 */
export const PREVIEW_CONFIG: YouTubePlayerConfig = {
  autoplay: true,
  controls: true,
  loop: true,
  mute: true,
  playsinline: true,
  modestbranding: true,
  rel: false,
};

// ==================== UTILITIES ====================

/**
 * Format video duration from seconds
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Parse YouTube timestamp from URL (e.g., t=1m30s or t=90)
 */
export function parseTimestamp(input: string): number | null {
  // Format: 1m30s
  const minuteSecond = input.match(/(\d+)m(\d+)s/);
  if (minuteSecond) {
    return parseInt(minuteSecond[1]) * 60 + parseInt(minuteSecond[2]);
  }

  // Format: 90 (seconds)
  const seconds = input.match(/^(\d+)$/);
  if (seconds) {
    return parseInt(seconds[1]);
  }

  return null;
}

/**
 * Check if device can play YouTube videos (for web/native)
 */
export function canPlayYouTube(): boolean {
  // YouTube iframe works everywhere, but native player needs WebView
  return true;
}

// ==================== EXPORTS ====================

export const youtubeUtils = {
  extractVideoId,
  isValidVideoId,
  validateVideoId,
  validateVideoOembed,
  getThumbnailUrls,
  getBestThumbnail,
  getEmbedUrl,
  getWatchUrl,
  getVideoInfo,
  fetchVideoTitle,
  formatDuration,
  parseTimestamp,
  canPlayYouTube,
};

export default youtubeUtils;

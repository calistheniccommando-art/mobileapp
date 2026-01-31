/**
 * YOUTUBE MODULE INDEX
 */

export {
  youtubeUtils,
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
  EXERCISE_VIDEO_CONFIG,
  MEAL_VIDEO_CONFIG,
  PREVIEW_CONFIG,
} from './player';

export type {
  YouTubeVideoInfo,
  YouTubePlayerConfig,
} from './player';

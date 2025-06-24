/**
 * @file Audio utilities for FoodieSnap.
 * Provides audio playback and recording functionality using expo-audio.
 * This file serves as a foundation for future audio features.
 */

import { useAudioPlayer, useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';

/**
 * Audio playback utilities
 */
export const AudioUtils = {
  /**
   * Request audio recording permissions
   */
  async requestRecordingPermissions() {
    try {
      const { granted } = await AudioModule.requestRecordingPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Failed to request recording permissions:', error);
      return false;
    }
  },

  /**
   * Get current recording permissions status
   */
  async getRecordingPermissions() {
    try {
      const { granted } = await AudioModule.getRecordingPermissionsAsync();
      return granted;
    } catch (error) {
      console.error('Failed to get recording permissions:', error);
      return false;
    }
  },
};

/**
 * Hook for audio recording with common settings
 * @returns Audio recorder instance and recording state
 */
export function useAudioRecording() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  
  const startRecording = async () => {
    const hasPermission = await AudioUtils.requestRecordingPermissions();
    if (!hasPermission) {
      throw new Error('Recording permission not granted');
    }
    
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    return recorder.uri;
  };

  return {
    recorder,
    startRecording,
    stopRecording,
    isRecording: recorder.isRecording,
    recordingUri: recorder.uri,
  };
}

/**
 * Hook for audio playback
 * @param audioSource - Audio source (URI or require())
 * @returns Audio player instance and controls
 */
export function useAudioPlayback(audioSource?: string | number) {
  const player = useAudioPlayer(audioSource);

  const playAudio = () => {
    player.play();
  };

  const pauseAudio = () => {
    player.pause();
  };

  const stopAudio = () => {
    player.pause();
    player.seekTo(0);
  };

  const replayAudio = () => {
    player.seekTo(0);
    player.play();
  };

  return {
    player,
    playAudio,
    pauseAudio,
    stopAudio,
    replayAudio,
    isPlaying: player.playing,
    isPaused: player.paused,
    currentTime: player.currentTime,
    duration: player.duration,
  };
}

/**
 * Common audio file types and extensions
 */
export const AudioFormats = {
  MP3: '.mp3',
  MP4: '.mp4',
  M4A: '.m4a',
  WAV: '.wav',
  AAC: '.aac',
} as const;

/**
 * Audio quality presets for easy use
 */
export const AudioQualityPresets = {
  HIGH: RecordingPresets.HIGH_QUALITY,
  LOW: RecordingPresets.LOW_QUALITY,
} as const; 
/**
 * @file Haptic feedback utilities for FoodieSnap
 * Provides tactile feedback for key user interactions to enhance UX
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptic feedback types with descriptions
 */
export enum HapticType {
  // Light feedback for subtle interactions
  LIGHT = 'light',
  // Medium feedback for standard interactions
  MEDIUM = 'medium', 
  // Heavy feedback for important actions
  HEAVY = 'heavy',
  // Success feedback for completed actions
  SUCCESS = 'success',
  // Warning feedback for caution
  WARNING = 'warning',
  // Error feedback for failed actions
  ERROR = 'error',
  // Selection feedback for choosing items
  SELECTION = 'selection',
}

/**
 * Settings for controlling haptic feedback
 */
interface HapticSettings {
  enabled: boolean;
  intensity: number; // 0.0 to 1.0
}

let hapticSettings: HapticSettings = {
  enabled: true,
  intensity: 1.0,
};

/**
 * Update haptic feedback settings
 * @param settings - New haptic settings
 */
export function updateHapticSettings(settings: Partial<HapticSettings>) {
  hapticSettings = { ...hapticSettings, ...settings };
}

/**
 * Get current haptic settings
 * @returns Current haptic settings
 */
export function getHapticSettings(): HapticSettings {
  return { ...hapticSettings };
}

/**
 * Trigger haptic feedback based on type
 * @param type - Type of haptic feedback
 * @param force - Force trigger even if disabled (for accessibility)
 */
export async function triggerHaptic(type: HapticType, force: boolean = false) {
  // Only trigger if enabled or forced
  if (!hapticSettings.enabled && !force) return;
  
  // Skip on unsupported platforms
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return;

  try {
    switch (type) {
      case HapticType.LIGHT:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
        
      case HapticType.MEDIUM:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
        
      case HapticType.HEAVY:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
        
      case HapticType.SUCCESS:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
        
      case HapticType.WARNING:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
        
      case HapticType.ERROR:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
        
      case HapticType.SELECTION:
        await Haptics.selectionAsync();
        break;
        
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Silently handle haptic errors - not critical for app function
    console.warn('Haptic feedback failed:', error);
  }
}

/**
 * Specialized haptic functions for common app interactions
 */

/**
 * Haptic feedback for photo capture
 */
export const hapticPhotoCapture = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for message send
 */
export const hapticMessageSend = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for button press
 */
export const hapticButtonPress = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for navigation/tab switch
 */
export const hapticNavigation = () => triggerHaptic(HapticType.SELECTION);

/**
 * Haptic feedback for successful action completion
 */
export const hapticSuccess = () => triggerHaptic(HapticType.SUCCESS);

/**
 * Haptic feedback for errors or failures
 */
export const hapticError = () => triggerHaptic(HapticType.ERROR);

/**
 * Haptic feedback for warnings
 */
export const hapticWarning = () => triggerHaptic(HapticType.WARNING);

/**
 * Haptic feedback for like/heart reaction
 */
export const hapticLike = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for friend request sent
 */
export const hapticFriendRequest = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for story view start
 */
export const hapticStoryStart = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for snap view start
 */
export const hapticSnapStart = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for screenshot detection
 */
export const hapticScreenshot = () => triggerHaptic(HapticType.WARNING);

/**
 * Haptic feedback for video recording start
 */
export const hapticVideoStart = () => triggerHaptic(HapticType.HEAVY);

/**
 * Haptic feedback for video recording stop
 */
export const hapticVideoStop = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for pull-to-refresh
 */
export const hapticRefresh = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for long press actions
 */
export const hapticLongPress = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for swipe actions
 */
export const hapticSwipe = () => triggerHaptic(HapticType.LIGHT);

/**
 * Haptic feedback for deletion actions
 */
export const hapticDelete = () => triggerHaptic(HapticType.HEAVY);

/**
 * Haptic feedback for blocked user action
 */
export const hapticBlock = () => triggerHaptic(HapticType.WARNING);

/**
 * Haptic feedback for archive action
 */
export const hapticArchive = () => triggerHaptic(HapticType.MEDIUM);

/**
 * Haptic feedback for notification
 */
export const hapticNotification = () => triggerHaptic(HapticType.LIGHT);

/**
 * Context-aware haptic feedback for list items
 * @param isImportant - Whether this is an important action
 */
export const hapticListItem = (isImportant: boolean = false) => {
  triggerHaptic(isImportant ? HapticType.MEDIUM : HapticType.LIGHT);
};

/**
 * Pattern-based haptic feedback for complex interactions
 * @param pattern - Array of haptic types to trigger in sequence
 * @param delay - Delay between each haptic (ms)
 */
export async function triggerHapticPattern(
  pattern: HapticType[], 
  delay: number = 100
) {
  for (let i = 0; i < pattern.length; i++) {
    await triggerHaptic(pattern[i]);
    if (i < pattern.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Specialized pattern for snap replay
 */
export const hapticSnapReplay = () => {
  triggerHapticPattern([HapticType.LIGHT, HapticType.MEDIUM], 50);
};

/**
 * Specialized pattern for story completion
 */
export const hapticStoryComplete = () => {
  triggerHapticPattern([HapticType.LIGHT, HapticType.LIGHT], 30);
};

/**
 * Specialized pattern for friend request accepted
 */
export const hapticFriendAccepted = () => {
  triggerHapticPattern([HapticType.SUCCESS, HapticType.LIGHT], 80);
}; 
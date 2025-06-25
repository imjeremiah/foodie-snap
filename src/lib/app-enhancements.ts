/**
 * @file App Enhancement Integration Layer for FoodieSnap
 * Demonstrates comprehensive usage of all security, validation, haptic, offline, and error handling utilities
 * This file serves as the integration layer showing how all Phase 2.1 features work together
 */

import { Alert } from 'react-native';
import { 
  validateDisplayName, 
  validateBio, 
  validatePassword,
  validateMessageContent,
  validateImageFile,
  validateUserContent,
  checkRateLimit,
  sanitizeText 
} from './validation';
import { 
  triggerHaptic, 
  HapticType,
  hapticSuccess,
  hapticError,
  hapticWarning,
  hapticPhotoCapture,
  hapticMessageSend,
  hapticButtonPress,
  hapticNavigation,
  hapticLike,
  hapticBlock,
  hapticDelete
} from './haptics';
import { 
  queueOfflineAction,
  isOnline,
  isExpensiveConnection,
  useNetworkState,
  cacheData,
  getCachedData
} from './offline';

/**
 * Enhanced message sending with full validation, haptics, and offline support
 * @param messageContent - Raw message content from user
 * @param conversationId - Target conversation ID
 * @param senderId - Sender user ID
 * @param sendMessageMutation - RTK Query mutation function
 */
export async function enhancedMessageSend(
  messageContent: string,
  conversationId: string,
  senderId: string,
  sendMessageMutation: any
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Validate and sanitize input
    const sanitizedContent = validateMessageContent(messageContent);
    if (!sanitizedContent.trim()) {
      hapticError();
      return { success: false, error: 'Message cannot be empty' };
    }

    // Step 2: Rate limiting check
    const rateCheck = checkRateLimit(senderId, 'send_message', 10, 60000); // 10 messages per minute
    if (!rateCheck.allowed) {
      hapticWarning();
      const resetTime = rateCheck.resetTime ? new Date(rateCheck.resetTime).toLocaleTimeString() : 'soon';
      return { success: false, error: `Rate limit exceeded. Try again at ${resetTime}` };
    }

    // Step 3: Check network and handle offline
    if (!isOnline()) {
      // Queue for offline processing
      await queueOfflineAction('SEND_MESSAGE', {
        content: sanitizedContent,
        conversationId,
        senderId,
        timestamp: Date.now()
      }, 'high');
      
      hapticMessageSend();
      return { success: true }; // Optimistically report success
    }

    // Step 4: Send message with haptic feedback
    const result = await sendMessageMutation({
      content: sanitizedContent,
      conversationId,
      senderId
    }).unwrap();

    // Step 5: Success haptics and caching
    hapticMessageSend();
    await cacheData(`message_${result.id}`, result);
    
    return { success: true };

  } catch (error) {
    console.error('Enhanced message send failed:', error);
    hapticError();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send message'
    };
  }
}

/**
 * Enhanced photo capture with validation and haptics
 * @param photoUri - Photo URI from camera
 * @param uploadPhoto - Photo upload function
 * @param maxSize - Maximum file size in bytes
 */
export async function enhancedPhotoCapture(
  photoUri: string,
  uploadPhoto: (uri: string, options?: any) => Promise<any>,
  maxSize: number = 10 * 1024 * 1024 // 10MB default
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Step 1: Validate image file
    const validation = validateImageFile(photoUri, maxSize);
    if (!validation.isValid) {
      hapticError();
      return { success: false, error: validation.error };
    }

    // Step 2: Check network conditions
    if (!isOnline()) {
      // Queue for offline upload
      await queueOfflineAction('UPLOAD_PHOTO', {
        uri: photoUri,
        timestamp: Date.now()
      }, 'medium');
      
      hapticPhotoCapture();
      return { success: true, data: { uri: photoUri, queued: true } };
    }

    // Step 3: Check if expensive connection and warn user
    if (isExpensiveConnection()) {
      hapticWarning();
      // In a real app, you might show a confirmation dialog here
    }

    // Step 4: Upload with haptic feedback
    hapticPhotoCapture();
    const result = await uploadPhoto(photoUri, {
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080
    });

    if (result.success) {
      hapticSuccess();
      return { success: true, data: result.data };
    } else {
      hapticError();
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error('Enhanced photo capture failed:', error);
    hapticError();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to capture photo'
    };
  }
}

/**
 * Enhanced profile update with comprehensive validation
 * @param profileData - Profile update data
 * @param userId - User ID
 * @param updateProfileMutation - RTK Query mutation
 */
export async function enhancedProfileUpdate(
  profileData: {
    displayName?: string;
    bio?: string;
    avatarUri?: string;
  },
  userId: string,
  updateProfileMutation: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: any = {};

    // Step 1: Validate display name if provided
    if (profileData.displayName !== undefined) {
      const nameValidation = validateDisplayName(profileData.displayName);
      if (!nameValidation.isValid) {
        hapticError();
        return { success: false, error: nameValidation.error };
      }
      updates.display_name = nameValidation.sanitized;
    }

    // Step 2: Validate bio if provided
    if (profileData.bio !== undefined) {
      const bioValidation = validateBio(profileData.bio);
      if (!bioValidation.isValid) {
        hapticError();
        return { success: false, error: bioValidation.error };
      }
      updates.bio = bioValidation.sanitized;
    }

    // Step 3: Validate avatar if provided
    if (profileData.avatarUri) {
      const avatarValidation = validateImageFile(profileData.avatarUri);
      if (!avatarValidation.isValid) {
        hapticError();
        return { success: false, error: avatarValidation.error };
      }
      // Avatar upload would be handled separately
    }

    // Step 4: Rate limiting
    const rateCheck = checkRateLimit(userId, 'update_profile', 5, 300000); // 5 updates per 5 minutes
    if (!rateCheck.allowed) {
      hapticWarning();
      return { success: false, error: 'Profile update limit exceeded. Please wait before updating again.' };
    }

    // Step 5: Handle offline state
    if (!isOnline()) {
      await queueOfflineAction('UPDATE_PROFILE', {
        userId,
        updates,
        timestamp: Date.now()
      }, 'medium');
      
      hapticSuccess();
      return { success: true };
    }

    // Step 6: Execute update
    await updateProfileMutation({ id: userId, ...updates }).unwrap();
    hapticSuccess();
    
    return { success: true };

  } catch (error) {
    console.error('Enhanced profile update failed:', error);
    hapticError();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update profile'
    };
  }
}

/**
 * Enhanced form submission with validation and rate limiting
 * @param formData - Form data to validate
 * @param formType - Type of form for specific validation rules
 * @param userId - User ID for rate limiting
 * @param submitFunction - Function to submit the form
 */
export async function enhancedFormSubmit(
  formData: Record<string, any>,
  formType: 'comment' | 'post' | 'report' | 'contact',
  userId: string,
  submitFunction: (data: any) => Promise<any>
): Promise<{ success: boolean; sanitizedData?: any; error?: string }> {
  try {
    const sanitizedData: Record<string, any> = {};

    // Step 1: Validate and sanitize all text fields
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string') {
        // Apply content validation based on form type
        const validation = validateUserContent(value, formType === 'comment' ? 'comment' : 'post');
        if (!validation.isValid) {
          hapticError();
          return { success: false, error: validation.error };
        }
        
        sanitizedData[key] = validation.sanitized;
        
        // Check for flags
        if (validation.flags?.includes('potential_spam')) {
          hapticWarning();
          // In a real app, you might flag this for review
        }
      } else {
        sanitizedData[key] = value;
      }
    }

    // Step 2: Rate limiting based on form type
    const rateLimits = {
      comment: { limit: 20, window: 300000 }, // 20 comments per 5 minutes
      post: { limit: 5, window: 3600000 },    // 5 posts per hour
      report: { limit: 10, window: 3600000 }, // 10 reports per hour
      contact: { limit: 3, window: 3600000 }  // 3 contact forms per hour
    };

    const rateLimit = rateLimits[formType];
    const rateCheck = checkRateLimit(userId, `submit_${formType}`, rateLimit.limit, rateLimit.window);
    
    if (!rateCheck.allowed) {
      hapticWarning();
      return { success: false, error: `${formType} submission limit exceeded. Please wait before trying again.` };
    }

    // Step 3: Handle offline state
    if (!isOnline()) {
      await queueOfflineAction(`SUBMIT_${formType.toUpperCase()}`, {
        userId,
        data: sanitizedData,
        timestamp: Date.now()
      }, 'medium');
      
      hapticButtonPress();
      return { success: true, sanitizedData };
    }

    // Step 4: Submit with haptic feedback
    hapticButtonPress();
    const result = await submitFunction(sanitizedData);
    hapticSuccess();
    
    return { success: true, sanitizedData };

  } catch (error) {
    console.error('Enhanced form submit failed:', error);
    hapticError();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Failed to submit ${formType}`
    };
  }
}

/**
 * Enhanced data fetching with offline support and caching
 * @param key - Cache key
 * @param fetchFunction - Function to fetch data
 * @param options - Fetch options including cache timeout
 */
export async function enhancedDataFetch<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    cacheTimeout?: number;
    retryOnError?: boolean;
    showHapticFeedback?: boolean;
  } = {}
): Promise<{ data: T | null; error?: string; fromCache?: boolean }> {
  try {
    // Step 1: Try cache first if offline
    if (!isOnline()) {
      const cachedData = await getCachedData(key);
      if (cachedData) {
        if (options.showHapticFeedback) hapticSuccess();
        return { data: cachedData, fromCache: true };
      }
      
      if (options.showHapticFeedback) hapticError();
      return { data: null, error: 'No cached data available offline' };
    }

    // Step 2: Fetch fresh data
    const data = await fetchFunction();
    
    // Step 3: Cache the result
    await cacheData(key, data, options.cacheTimeout);
    
    if (options.showHapticFeedback) hapticSuccess();
    return { data };

  } catch (error) {
    console.error('Enhanced data fetch failed:', error);
    
    // Step 4: Try cache as fallback on error
    if (options.retryOnError) {
      const cachedData = await getCachedData(key);
      if (cachedData) {
        if (options.showHapticFeedback) hapticWarning();
        return { 
          data: cachedData, 
          error: 'Using cached data due to network error',
          fromCache: true 
        };
      }
    }
    
    if (options.showHapticFeedback) hapticError();
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to fetch data'
    };
  }
}

/**
 * Enhanced user action with safety checks
 * @param action - Action to perform
 * @param actionType - Type of action for rate limiting and validation
 * @param userId - User ID
 * @param targetId - Target entity ID (optional)
 */
export async function enhancedUserAction(
  action: () => Promise<any>,
  actionType: 'like' | 'block' | 'delete' | 'archive' | 'report',
  userId: string,
  targetId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Step 1: Rate limiting
    const rateLimits = {
      like: { limit: 100, window: 300000 },    // 100 likes per 5 minutes
      block: { limit: 10, window: 3600000 },   // 10 blocks per hour
      delete: { limit: 20, window: 3600000 },  // 20 deletes per hour
      archive: { limit: 50, window: 3600000 }, // 50 archives per hour
      report: { limit: 10, window: 3600000 }   // 10 reports per hour
    };

    const rateLimit = rateLimits[actionType];
    const rateCheck = checkRateLimit(userId, actionType, rateLimit.limit, rateLimit.window);
    
    if (!rateCheck.allowed) {
      hapticWarning();
      return { success: false, error: `${actionType} action limit exceeded` };
    }

    // Step 2: Safety confirmation for destructive actions
    if (['block', 'delete'].includes(actionType)) {
      // In a real app, you'd show a confirmation dialog here
      // For now, we'll just add a warning haptic
      hapticWarning();
    }

    // Step 3: Handle offline state for non-critical actions
    if (!isOnline() && !['delete', 'block'].includes(actionType)) {
      await queueOfflineAction(`USER_ACTION_${actionType.toUpperCase()}`, {
        actionType,
        userId,
        targetId,
        timestamp: Date.now()
      }, actionType === 'like' ? 'low' : 'medium');
      
      // Provide appropriate haptic feedback
      switch (actionType) {
        case 'like':
          hapticLike();
          break;
        case 'archive':
          hapticButtonPress();
          break;
        case 'report':
          hapticWarning();
          break;
      }
      
      return { success: true };
    }

    // Step 4: Execute action with appropriate haptic feedback
    switch (actionType) {
      case 'like':
        hapticLike();
        break;
      case 'block':
        hapticBlock();
        break;
      case 'delete':
        hapticDelete();
        break;
      case 'archive':
        hapticButtonPress();
        break;
      case 'report':
        hapticWarning();
        break;
    }

    await action();
    
    // Success haptic for destructive actions
    if (['block', 'delete'].includes(actionType)) {
      hapticSuccess();
    }
    
    return { success: true };

  } catch (error) {
    console.error('Enhanced user action failed:', error);
    hapticError();
    return { 
      success: false, 
      error: error instanceof Error ? error.message : `Failed to ${actionType}`
    };
  }
}

/**
 * App state management with persistence and offline support
 */
export class AppStateManager {
  private static instance: AppStateManager;
  private state: Record<string, any> = {};

  static getInstance(): AppStateManager {
    if (!AppStateManager.instance) {
      AppStateManager.instance = new AppStateManager();
    }
    return AppStateManager.instance;
  }

  /**
   * Set app state with automatic persistence
   */
  async setState(key: string, value: any): Promise<void> {
    this.state[key] = value;
    await cacheData(`app_state_${key}`, value, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Get app state with cache fallback
   */
  async getState(key: string): Promise<any> {
    if (this.state[key] !== undefined) {
      return this.state[key];
    }
    
    const cached = await getCachedData(`app_state_${key}`);
    if (cached !== null) {
      this.state[key] = cached;
      return cached;
    }
    
    return null;
  }

  /**
   * Clear app state
   */
  clearState(key?: string): void {
    if (key) {
      delete this.state[key];
    } else {
      this.state = {};
    }
  }
}

/**
 * Create enhanced button with haptic feedback
 * @param onPress - Button press handler
 * @param hapticType - Type of haptic feedback
 * @param disabled - Whether button is disabled
 */
export function createHapticButton(
  onPress: () => void | Promise<void>,
  hapticType: HapticType = HapticType.LIGHT,
  disabled: boolean = false
) {
  return async () => {
    if (disabled) return;
    
    await triggerHaptic(hapticType);
    await onPress();
  };
}

/**
 * Navigation with haptic feedback
 * @param navigationFunction - Navigation function to call
 */
export function enhancedNavigation(navigationFunction: () => void | Promise<void>) {
  return async () => {
    hapticNavigation();
    await navigationFunction();
  };
}

/**
 * Global error handler with haptic feedback and reporting
 * @param error - Error object
 * @param context - Error context information
 * @param showAlert - Whether to show user alert
 */
export async function handleGlobalError(
  error: Error,
  context: string,
  showAlert: boolean = true
): Promise<void> {
  console.error(`Global error in ${context}:`, error);
  
  // Haptic feedback for error
  hapticError();
  
  // Cache error for offline reporting
  await cacheData(`error_${Date.now()}`, {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: Date.now()
  });
  
  // Show user alert if requested
  if (showAlert) {
    Alert.alert(
      'Something went wrong',
      'We encountered an error. The issue has been logged and will be resolved.',
      [{ text: 'OK', onPress: () => hapticButtonPress() }]
    );
  }
}

/**
 * Example usage patterns and integration demonstrations
 */
export const USAGE_EXAMPLES = {
  MESSAGE_SEND: `
    // Example: Enhanced message sending
    const result = await enhancedMessageSend(
      messageText,
      conversationId,
      userId,
      sendMessageMutation
    );
    
    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  `,
  
  PHOTO_CAPTURE: `
    // Example: Enhanced photo capture
    const result = await enhancedPhotoCapture(
      photoUri,
      uploadPhotoFunction
    );
    
    if (result.success && result.data?.queued) {
      // Photo queued for offline upload
      showToast('Photo will be uploaded when online');
    }
  `,
  
  PROFILE_UPDATE: `
    // Example: Enhanced profile update
    const result = await enhancedProfileUpdate(
      { displayName: newName, bio: newBio },
      userId,
      updateProfileMutation
    );
  `,
  
  USER_ACTION: `
    // Example: Enhanced user action
    const result = await enhancedUserAction(
      () => likePostMutation(postId),
      'like',
      userId,
      postId
    );
  `
}; 
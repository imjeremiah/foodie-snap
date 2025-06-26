/**
 * @file Storage utilities for FoodieSnap.
 * Handles photo and video uploads, compression, and Supabase Storage operations.
 */

import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";

export interface MediaUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  folder?: string; // Custom folder name for organizing uploads
}

export interface PhotoUploadOptions extends MediaUploadOptions {
  // Photo-specific options can be added here
}

export interface VideoUploadOptions extends MediaUploadOptions {
  maxDuration?: number;
  // Video-specific options can be added here
}

export interface MediaUploadResult {
  success: boolean;
  data?: {
    publicUrl: string;
    path: string;
    fullUrl: string;
  };
  error?: string;
}

export interface PhotoUploadResult extends MediaUploadResult {}
export interface VideoUploadResult extends MediaUploadResult {}

/**
 * Generate a unique filename for media
 * @param userId - The user's ID
 * @param mediaType - The media type ('photo' or 'video')
 * @param fileExtension - The file extension (e.g., 'jpg', 'mp4')
 * @param customFolder - Optional custom folder name for organizing uploads
 * @returns Formatted filename with user folder structure
 */
function generateMediaPath(
  userId: string, 
  mediaType: 'photo' | 'video', 
  fileExtension: string, 
  customFolder?: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  
  if (customFolder) {
    return `${userId}/${customFolder}/${timestamp}-${randomId}.${fileExtension}`;
  }
  
  return `${userId}/${mediaType}s/${timestamp}-${randomId}.${fileExtension}`;
}

/**
 * Compress and optimize image for mobile performance
 * @param imageUri - Local image URI
 * @param options - Compression options
 * @returns Compressed image URI or original if compression fails
 */
async function compressImage(
  imageUri: string, 
  options: PhotoUploadOptions = {}
): Promise<string> {
  try {
    const { quality = 0.8, maxWidth = 1080, maxHeight = 1920 } = options;
    
    // Use expo-image-manipulator to compress and resize
    const manipResult = await manipulateAsync(
      imageUri,
      [{ resize: { width: maxWidth, height: maxHeight } }],
      { 
        compress: quality, 
        format: SaveFormat.JPEG,
        base64: false
      }
    );
    
    return manipResult.uri;
  } catch (error) {
    console.warn("Image compression failed, using original:", error);
    return imageUri;
  }
}

/**
 * Get file info including size
 * @param fileUri - The file URI
 * @returns File info with size
 */
async function getFileInfo(fileUri: string) {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    return fileInfo;
  } catch (error) {
    console.warn("Failed to get file info:", error);
    return null;
  }
}

/**
 * Upload a photo to Supabase Storage
 * @param imageUri - Local image file URI
 * @param options - Upload options for compression and optimization
 * @returns Upload result with public URL or error
 */
export async function uploadPhoto(
  imageUri: string,
  options: PhotoUploadOptions = {}
): Promise<PhotoUploadResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Compress image if needed
    const optimizedUri = await compressImage(imageUri, options);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(optimizedUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Generate unique file path
    const filePath = generateMediaPath(user.id, 'photo', 'jpg', options.folder);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos')
      .upload(filePath, arrayBuffer, {
        contentType: 'image/jpeg',
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    const fullUrl = urlData.publicUrl;

    return {
      success: true,
      data: {
        publicUrl: urlData.publicUrl,
        path: filePath,
        fullUrl,
      },
    };
  } catch (error) {
    console.error("Photo upload failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Upload failed" 
    };
  }
}

/**
 * Upload a video to Supabase Storage
 * @param videoUri - Local video file URI
 * @param options - Upload options
 * @returns Upload result with public URL or error
 */
export async function uploadVideo(
  videoUri: string,
  options: VideoUploadOptions = {}
): Promise<VideoUploadResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get file info to check size
    const fileInfo = await getFileInfo(videoUri);
    if (!fileInfo || !fileInfo.exists) {
      return { success: false, error: "Video file not found" };
    }

    // Check file size (limit to 50MB for now)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (fileInfo.size && fileInfo.size > maxSize) {
      return { success: false, error: "Video file too large (max 50MB)" };
    }

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer
    const arrayBuffer = decode(base64);

    // Generate unique file path
    const filePath = generateMediaPath(user.id, 'video', 'mp4', options.folder);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('photos') // Using same bucket for now, could create separate 'videos' bucket
      .upload(filePath, arrayBuffer, {
        contentType: 'video/mp4',
      });

    if (uploadError) {
      console.error("Video storage upload error:", uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    const fullUrl = urlData.publicUrl;

    return {
      success: true,
      data: {
        publicUrl: urlData.publicUrl,
        path: filePath,
        fullUrl,
      },
    };
  } catch (error) {
    console.error("Video upload failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Video upload failed" 
    };
  }
}

/**
 * Upload media (photo or video) based on file type
 * @param mediaUri - Local media file URI
 * @param mediaType - The type of media ('photo' or 'video')
 * @param options - Upload options
 * @returns Upload result with public URL or error
 */
export async function uploadMedia(
  mediaUri: string,
  mediaType: 'photo' | 'video',
  options: MediaUploadOptions = {}
): Promise<MediaUploadResult> {
  if (mediaType === 'video') {
    return uploadVideo(mediaUri, options);
  } else {
    return uploadPhoto(mediaUri, options);
  }
}

/**
 * Delete a media file from Supabase Storage
 * @param filePath - The file path in storage
 * @returns Success status
 */
export async function deleteMedia(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('photos')
      .remove([filePath]);

    if (error) {
      console.error("Storage delete error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Media deletion failed:", error);
    return false;
  }
}

/**
 * Delete a photo from Supabase Storage (legacy function, use deleteMedia instead)
 * @param filePath - The file path in storage
 * @returns Success status
 */
export async function deletePhoto(filePath: string): Promise<boolean> {
  return deleteMedia(filePath);
}

/**
 * Get a signed URL for a private media file (if needed for future features)
 * @param filePath - The file path in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if failed
 */
export async function getSignedMediaUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from('photos')
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Signed URL error:", error);
      return null;
    }

    return data.signedUrl;
  } catch (error) {
    console.error("Signed URL creation failed:", error);
    return null;
  }
}

/**
 * Get a signed URL for a private photo (legacy function, use getSignedMediaUrl instead)
 * @param filePath - The file path in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if failed
 */
export async function getSignedPhotoUrl(
  filePath: string,
  expiresIn: number = 3600
): Promise<string | null> {
  return getSignedMediaUrl(filePath, expiresIn);
} 
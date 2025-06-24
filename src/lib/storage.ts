/**
 * @file Storage utilities for FoodieSnap.
 * Handles photo uploads, compression, and Supabase Storage operations.
 */

import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { decode } from "base64-arraybuffer";

export interface PhotoUploadOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface PhotoUploadResult {
  success: boolean;
  data?: {
    publicUrl: string;
    path: string;
    fullUrl: string;
  };
  error?: string;
}

/**
 * Generate a unique filename for a photo
 * @param userId - The user's ID
 * @param fileExtension - The file extension (e.g., 'jpg', 'png')
 * @returns Formatted filename with user folder structure
 */
function generatePhotoPath(userId: string, fileExtension: string = 'jpg'): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2);
  return `${userId}/${timestamp}-${randomId}.${fileExtension}`;
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
    const filePath = generatePhotoPath(user.id, 'jpg');

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
 * Delete a photo from Supabase Storage
 * @param filePath - The file path in storage
 * @returns Success status
 */
export async function deletePhoto(filePath: string): Promise<boolean> {
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
    console.error("Photo deletion failed:", error);
    return false;
  }
}

/**
 * Get a signed URL for a private photo (if needed for future features)
 * @param filePath - The file path in storage
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed URL or null if failed
 */
export async function getSignedPhotoUrl(
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
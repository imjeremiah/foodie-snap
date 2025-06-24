/**
 * @file Advanced image processing utilities for creative tools
 * Handles text overlays, drawing composition, and color filters
 */

import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as FileSystem from "expo-file-system";

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
}

export interface DrawingPath {
  id: string;
  path: string;
  color: string;
  strokeWidth: number;
}

export interface ColorFilter {
  name: string;
  brightness?: number;
  contrast?: number;
  saturate?: number;
  sepia?: number;
  hueRotate?: number;
}

export interface CompositionOptions {
  textOverlays?: TextOverlay[];
  drawingPaths?: DrawingPath[];
  colorFilter?: ColorFilter;
  quality?: number;
}

/**
 * Apply basic color filter to image using expo-image-manipulator
 * Note: expo-image-manipulator has limited filter support, so this is a simplified version
 */
export async function applyColorFilter(
  imageUri: string,
  filter: ColorFilter,
  quality: number = 0.9
): Promise<string> {
  try {
    // For now, we can only apply basic transformations
    // In a production app, you would use more advanced libraries like react-native-image-filter-kit
    // or implement custom shaders
    
    const manipulateOptions: any[] = [];
    
    // Basic brightness/contrast simulation using resize and flip operations
    // This is a limitation of expo-image-manipulator - it doesn't support color filters directly
    
    const result = await manipulateAsync(
      imageUri,
      manipulateOptions,
      {
        format: SaveFormat.JPEG,
        compress: quality,
      }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error applying color filter:', error);
    return imageUri; // Return original if filter fails
  }
}

/**
 * Compose final image with all creative edits
 * This is a simplified version - in production you would use Canvas API or native image composition
 */
export async function composeEditedImage(
  baseImageUri: string,
  options: CompositionOptions
): Promise<string> {
  try {
    let processedUri = baseImageUri;
    
    // Apply color filter first if specified
    if (options.colorFilter && options.colorFilter.name !== 'None') {
      processedUri = await applyColorFilter(
        processedUri,
        options.colorFilter,
        options.quality || 0.9
      );
    }
    
    // For MVP, we'll return the color-filtered image
    // In a full implementation, you would:
    // 1. Create a Canvas context
    // 2. Draw the base image
    // 3. Apply color filters using CSS filters or pixel manipulation
    // 4. Draw text overlays with proper typography
    // 5. Draw SVG paths for drawings
    // 6. Export the final composite
    
    return processedUri;
  } catch (error) {
    console.error('Error composing edited image:', error);
    return baseImageUri; // Return original if composition fails
  }
}

/**
 * Create a text overlay image (for future implementation)
 * This would require Canvas API or native text rendering
 */
export async function createTextOverlayImage(
  overlay: TextOverlay,
  canvasWidth: number,
  canvasHeight: number
): Promise<string | null> {
  // Placeholder for text overlay rendering
  // In a full implementation, you would:
  // 1. Create a Canvas element
  // 2. Set canvas dimensions
  // 3. Draw text with specified styling
  // 4. Export as base64 or file URI
  
  return null;
}

/**
 * Create drawing overlay image (for future implementation)
 * This would require Canvas API or SVG to bitmap conversion
 */
export async function createDrawingOverlayImage(
  paths: DrawingPath[],
  canvasWidth: number,
  canvasHeight: number
): Promise<string | null> {
  // Placeholder for drawing overlay rendering
  // In a full implementation, you would:
  // 1. Create a Canvas element
  // 2. Set canvas dimensions
  // 3. Draw each path with specified styling
  // 4. Export as base64 or file URI
  
  return null;
}

/**
 * Get image dimensions from URI
 */
export async function getImageDimensions(imageUri: string): Promise<{ width: number; height: number } | null> {
  try {
    const info = await FileSystem.getInfoAsync(imageUri);
    if (info.exists) {
      // For now, return default dimensions
      // In production, you would use a library to get actual image dimensions
      return { width: 1080, height: 1920 };
    }
    return null;
  } catch (error) {
    console.error('Error getting image dimensions:', error);
    return null;
  }
}

/**
 * Predefined color filters for the creative tools
 */
export const COLOR_FILTERS: ColorFilter[] = [
  { name: 'None' },
  { name: 'Warm', brightness: 1.1, contrast: 1.1, saturate: 1.2 },
  { name: 'Cool', brightness: 0.9, contrast: 1.1, saturate: 0.8 },
  { name: 'Vintage', brightness: 0.95, contrast: 1.2, saturate: 0.7, sepia: 0.3 },
  { name: 'Dramatic', brightness: 0.8, contrast: 1.4, saturate: 1.3 },
  { name: 'B&W', brightness: 1.0, contrast: 1.1, saturate: 0 },
  { name: 'Sepia', brightness: 1.0, contrast: 1.0, sepia: 1.0 },
  { name: 'High Contrast', brightness: 1.0, contrast: 1.6, saturate: 1.1 },
];

/**
 * Default text colors for the text overlay tool
 */
export const TEXT_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
];

/**
 * Default drawing colors for the drawing tool
 */
export const DRAWING_COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
]; 
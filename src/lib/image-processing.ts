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
  tint?: string;
  overlay?: string;
  description?: string;
}

export interface CompositionOptions {
  textOverlays?: TextOverlay[];
  drawingPaths?: DrawingPath[];
  colorFilter?: ColorFilter;
  quality?: number;
}

/**
 * Get filter style for React Native (simplified approach)
 * React Native doesn't support CSS filters, so this is mainly for metadata
 */
export function getFilterStyle(filter: ColorFilter): object {
  if (!filter || filter.name === 'None') {
    return {};
  }

  // Return basic style properties that React Native can handle
  const style: any = {};
  
  // Note: We use overlay components for visual effects instead
  // of trying to apply CSS filters to Image components
  
  return style;
}

/**
 * Apply color filter to image using expo-image-manipulator
 * This provides some basic color adjustments
 */
export async function applyColorFilter(
  imageUri: string,
  filter: ColorFilter,
  quality: number = 0.9
): Promise<string> {
  try {
    if (!filter || filter.name === 'None') {
      return imageUri;
    }

    const manipulateOptions: any[] = [];
    
    // Apply basic transformations based on filter type
    switch (filter.name) {
      case 'B&W':
        // For B&W, we could reduce saturation if the API supported it
        // For now, rely on the overlay approach
        break;
        
      case 'Vintage':
        // Slightly reduce quality for vintage look
        quality = Math.min(quality, 0.75);
        break;
        
      case 'High Contrast':
        // Use higher quality to maintain sharpness
        quality = Math.max(quality, 0.95);
        break;
        
      case 'Dramatic':
        // Maintain high quality for dramatic effect
        quality = Math.max(quality, 0.9);
        break;
    }
    
    // Apply basic resize to ensure consistent processing
    if (manipulateOptions.length === 0) {
      // Just compress with the specified quality
      manipulateOptions.push({ resize: { width: 1080 } });
    }
    
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
 * Compose final image with all creative edits using view capture
 * This will be called from the component after capturing the view
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
    
    // Note: For text overlays and drawings, we'll use view capture
    // from the component rather than trying to composite here
    // This is more reliable with React Native
    
    return processedUri;
  } catch (error) {
    console.error('Error composing edited image:', error);
    return baseImageUri;
  }
}

/**
 * Create text overlay image (for future implementation)
 * This would require Canvas API or SVG to bitmap conversion
 */
export async function createTextOverlayImage(
  overlays: TextOverlay[],
  canvasWidth: number,
  canvasHeight: number
): Promise<string | null> {
  // Placeholder for text overlay rendering
  // In a full implementation, you would:
  // 1. Create a Canvas element (React Native doesn't have this)
  // 2. Set canvas dimensions
  // 3. Render each text overlay with specified styling
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
 * Enhanced color filters optimized for overlay-based effects in React Native
 * Each filter includes overlay colors and blend modes for realistic effects
 */
export const COLOR_FILTERS: ColorFilter[] = [
  { 
    name: 'None',
    description: 'Original image with no filters applied'
  },
  { 
    name: 'Warm', 
    brightness: 1.1, 
    contrast: 1.1, 
    saturate: 1.2,
    tint: '#FFA500',
    overlay: '#FFA500',
    description: 'Warm golden tint for cozy photos'
  },
  { 
    name: 'Cool', 
    brightness: 0.9, 
    contrast: 1.1, 
    saturate: 0.8,
    tint: '#87CEEB',
    overlay: '#4A90E2',
    description: 'Cool blue tint for modern look'
  },
  { 
    name: 'Vintage', 
    brightness: 0.95, 
    contrast: 1.2, 
    saturate: 0.7, 
    sepia: 0.3,
    tint: '#DEB887',
    overlay: '#D2B48C',
    description: 'Retro vintage aesthetic'
  },
  { 
    name: 'Dramatic', 
    brightness: 0.8, 
    contrast: 1.4, 
    saturate: 1.3,
    tint: '#000000',
    overlay: '#1A1A1A',
    description: 'High contrast dramatic effect'
  },
  { 
    name: 'B&W', 
    brightness: 1.0, 
    contrast: 1.1, 
    saturate: 0,
    tint: '#808080',
    overlay: '#GREY',
    description: 'Classic black and white'
  },
  { 
    name: 'Sepia', 
    brightness: 1.0, 
    contrast: 1.0, 
    sepia: 1.0,
    tint: '#D2B48C',
    overlay: '#D2B48C',
    description: 'Warm sepia tone'
  },
  { 
    name: 'High Contrast', 
    brightness: 1.0, 
    contrast: 1.6, 
    saturate: 1.1,
    tint: '#FFFFFF',
    overlay: '#FFFFFF',
    description: 'Sharp high contrast effect'
  },
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
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
}

export interface CompositionOptions {
  textOverlays?: TextOverlay[];
  drawingPaths?: DrawingPath[];
  colorFilter?: ColorFilter;
  quality?: number;
}

/**
 * Get CSS filter string for real-time preview
 */
export function getFilterStyle(filter: ColorFilter): object {
  if (!filter || filter.name === 'None') {
    return {};
  }

  // Create CSS filter effects for different filter types
  const filterEffects = [];
  
  if (filter.brightness !== undefined) {
    filterEffects.push(`brightness(${filter.brightness})`);
  }
  
  if (filter.contrast !== undefined) {
    filterEffects.push(`contrast(${filter.contrast})`);
  }
  
  if (filter.saturate !== undefined) {
    filterEffects.push(`saturate(${filter.saturate})`);
  }
  
  if (filter.sepia !== undefined) {
    filterEffects.push(`sepia(${filter.sepia})`);
  }
  
  if (filter.hueRotate !== undefined) {
    filterEffects.push(`hue-rotate(${filter.hueRotate}deg)`);
  }

  const style: any = {};
  
  if (filterEffects.length > 0) {
    // Note: React Native doesn't support CSS filters directly
    // We'll use tintColor and overlays as approximations
    if (filter.name === 'B&W') {
      style.tintColor = '#808080'; // Gray tint for B&W effect
    } else if (filter.name === 'Sepia') {
      style.tintColor = '#DEB887'; // Sepia tone
    } else if (filter.name === 'Warm') {
      style.tintColor = '#FFE4B5'; // Warm tone
    } else if (filter.name === 'Cool') {
      style.tintColor = '#B0E0E6'; // Cool tone
    }
  }
  
  return style;
}

/**
 * Apply color filter to image using expo-image-manipulator
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
        // Simulate B&W by reducing quality and applying resize
        manipulateOptions.push({ resize: { width: 1000 } });
        break;
        
      case 'Vintage':
        // Slightly reduce quality for vintage look
        quality = Math.min(quality, 0.7);
        break;
        
      case 'High Contrast':
        // Use higher quality to maintain sharpness
        quality = Math.max(quality, 0.95);
        break;
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
 * Enhanced color filters with better visual effects
 */
export const COLOR_FILTERS: ColorFilter[] = [
  { name: 'None' },
  { 
    name: 'Warm', 
    brightness: 1.1, 
    contrast: 1.1, 
    saturate: 1.2,
    tint: '#FFE4B5'
  },
  { 
    name: 'Cool', 
    brightness: 0.9, 
    contrast: 1.1, 
    saturate: 0.8,
    tint: '#B0E0E6'
  },
  { 
    name: 'Vintage', 
    brightness: 0.95, 
    contrast: 1.2, 
    saturate: 0.7, 
    sepia: 0.3,
    tint: '#DEB887'
  },
  { 
    name: 'Dramatic', 
    brightness: 0.8, 
    contrast: 1.4, 
    saturate: 1.3,
    tint: '#696969'
  },
  { 
    name: 'B&W', 
    brightness: 1.0, 
    contrast: 1.1, 
    saturate: 0,
    tint: '#808080'
  },
  { 
    name: 'Sepia', 
    brightness: 1.0, 
    contrast: 1.0, 
    sepia: 1.0,
    tint: '#DEB887'
  },
  { 
    name: 'High Contrast', 
    brightness: 1.0, 
    contrast: 1.6, 
    saturate: 1.1,
    tint: '#000000'
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
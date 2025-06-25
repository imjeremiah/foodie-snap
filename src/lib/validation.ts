/**
 * @file Input validation and sanitization utilities for FoodieSnap
 * Provides comprehensive validation and sanitization for all user inputs to prevent XSS, injection attacks, and ensure data integrity
 */

/**
 * Sanitize text input by removing potentially harmful characters and scripts
 * @param input - Raw text input from user
 * @returns Sanitized text safe for storage and display
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script-like content
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove potentially dangerous characters
    .replace(/[<>'"]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize email input
 * @param email - Raw email input
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null;
  
  const cleaned = email.toLowerCase().trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(cleaned)) return null;
  
  // Additional security checks
  if (cleaned.length > 254) return null; // RFC 5321 limit
  if (cleaned.includes('..')) return null; // Consecutive dots not allowed
  
  return cleaned;
}

/**
 * Validate display name with security considerations
 * @param name - Display name input
 * @returns Validation result with sanitized name or error
 */
export function validateDisplayName(name: string | null | undefined): {
  isValid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!name || typeof name !== 'string') {
    return { isValid: false, error: 'Display name is required' };
  }

  const sanitized = sanitizeText(name);
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters' };
  }
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'Display name must be less than 50 characters' };
  }
  
  // Check for inappropriate patterns
  const inappropriatePatterns = [
    /admin/i,
    /moderator/i,
    /support/i,
    /system/i,
    /null/i,
    /undefined/i,
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(sanitized)) {
      return { isValid: false, error: 'Display name contains restricted terms' };
    }
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate and sanitize bio text
 * @param bio - Bio text input
 * @returns Validation result
 */
export function validateBio(bio: string | null | undefined): {
  isValid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!bio) return { isValid: true, sanitized: '' };
  
  const sanitized = sanitizeText(bio);
  
  if (sanitized.length > 300) {
    return { isValid: false, error: 'Bio must be less than 300 characters' };
  }
  
  return { isValid: true, sanitized };
}

/**
 * Validate password strength
 * @param password - Password input
 * @returns Validation result with strength score
 */
export function validatePassword(password: string | null | undefined): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  error?: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
} {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      strength: 'weak',
      error: 'Password is required',
      requirements: {
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
        special: false,
      },
    };
  }

  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const metRequirements = Object.values(requirements).filter(Boolean).length;
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  if (metRequirements >= 4) strength = 'strong';
  else if (metRequirements >= 3) strength = 'medium';

  const isValid = requirements.length && metRequirements >= 3;

  return {
    isValid,
    strength,
    error: !isValid ? 'Password must be at least 8 characters with uppercase, lowercase, and number' : undefined,
    requirements,
  };
}

/**
 * Sanitize message content for chat messages
 * @param content - Message content
 * @returns Sanitized content
 */
export function sanitizeMessageContent(content: string | null | undefined): string {
  if (!content || typeof content !== 'string') return '';
  
  return content
    .trim()
    // Remove HTML tags but preserve basic formatting
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    // Remove potentially dangerous URLs
    .replace(/javascript:/gi, '')
    // Limit length
    .substring(0, 1000)
    .trim();
}

/**
 * Validate image file safety
 * @param uri - Image URI
 * @param maxSizeBytes - Maximum file size in bytes
 * @returns Validation result
 */
export function validateImageFile(uri: string | null | undefined, maxSizeBytes: number = 10 * 1024 * 1024): {
  isValid: boolean;
  error?: string;
} {
  if (!uri || typeof uri !== 'string') {
    return { isValid: false, error: 'Image URI is required' };
  }

  // Check for valid image extensions
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = validExtensions.some(ext => 
    uri.toLowerCase().includes(ext)
  );

  if (!hasValidExtension && !uri.startsWith('data:image/')) {
    return { isValid: false, error: 'Invalid image format' };
  }

  // Basic URI format validation
  if (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('data:')) {
    return { isValid: false, error: 'Invalid image URI format' };
  }

  return { isValid: true };
}

/**
 * Rate limiting check for user actions
 * @param userId - User ID
 * @param action - Action type
 * @param limit - Max actions per time window
 * @param windowMs - Time window in milliseconds
 * @returns Whether action is allowed
 */
const actionCounts = new Map<string, { count: number; timestamp: number }>();

export function checkRateLimit(
  userId: string,
  action: string,
  limit: number = 10,
  windowMs: number = 60000
): { allowed: boolean; resetTime?: number } {
  const key = `${userId}:${action}`;
  const now = Date.now();
  const existing = actionCounts.get(key);

  if (!existing || now - existing.timestamp > windowMs) {
    actionCounts.set(key, { count: 1, timestamp: now });
    return { allowed: true };
  }

  if (existing.count >= limit) {
    return { 
      allowed: false, 
      resetTime: existing.timestamp + windowMs 
    };
  }

  existing.count++;
  return { allowed: true };
}

/**
 * Validate search query for safety
 * @param query - Search query
 * @returns Validation result
 */
export function validateSearchQuery(query: string | null | undefined): {
  isValid: boolean;
  sanitized?: string;
  error?: string;
} {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Search query is required' };
  }

  const sanitized = sanitizeText(query);
  
  if (sanitized.length < 2) {
    return { isValid: false, error: 'Search query must be at least 2 characters' };
  }

  if (sanitized.length > 100) {
    return { isValid: false, error: 'Search query must be less than 100 characters' };
  }

  return { isValid: true, sanitized };
}

/**
 * Comprehensive content validation for user-generated content
 * @param content - Content to validate
 * @param type - Type of content (post, comment, bio, etc.)
 * @returns Validation result
 */
export function validateUserContent(
  content: string | null | undefined,
  type: 'post' | 'comment' | 'bio' | 'message' | 'caption'
): {
  isValid: boolean;
  sanitized?: string;
  error?: string;
  flags?: string[];
} {
  if (!content) {
    return { isValid: true, sanitized: '' };
  }

  const sanitized = sanitizeText(content);
  const flags: string[] = [];
  
  // Length validation based on type
  const maxLengths = {
    post: 2000,
    comment: 500,
    bio: 300,
    message: 1000,
    caption: 200,
  };

  if (sanitized.length > maxLengths[type]) {
    return { 
      isValid: false, 
      error: `Content must be less than ${maxLengths[type]} characters` 
    };
  }

  // Basic profanity detection (can be enhanced with external service)
  const profanityPatterns = [
    /\b(spam|scam|fake|bot)\b/gi,
    /\b(click here|visit now|buy now)\b/gi,
  ];

  for (const pattern of profanityPatterns) {
    if (pattern.test(sanitized)) {
      flags.push('potential_spam');
    }
  }

  // URL detection for security
  if (/https?:\/\//.test(sanitized)) {
    flags.push('contains_url');
  }

  return {
    isValid: true,
    sanitized,
    flags: flags.length > 0 ? flags : undefined,
  };
} 
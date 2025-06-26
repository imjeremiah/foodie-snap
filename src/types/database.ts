/**
 * @file Database types for FoodieSnap application.
 * Defines TypeScript interfaces for all database tables and relationships.
 */

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  snap_score?: number;
  current_streak?: number;
  longest_streak?: number;
  last_snap_date?: string;
  created_at: string;
  updated_at: string;
  
  // Nutrition-focused preferences for RAG personalization
  primary_fitness_goal?: 'muscle_gain' | 'fat_loss' | 'clean_eating' | 'maintenance' | 'athletic_performance' | 'general_health' | null;
  secondary_fitness_goals?: string[] | null;
  dietary_restrictions?: string[] | null;
  allergies?: string[] | null;
  preferred_cuisines?: string[] | null;
  preferred_content_style?: 'inspirational' | 'scientific' | 'quick_easy' | 'humorous' | 'detailed' | 'casual' | null;
  content_tone_preferences?: string[] | null;
  meal_timing_preference?: 'early_bird' | 'standard' | 'night_owl' | 'flexible' | 'intermittent_fasting' | null;
  cooking_skill_level?: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  meal_prep_frequency?: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'rarely' | null;
  daily_calorie_goal?: number | null;
  protein_goal_grams?: number | null;
  carb_preference?: 'low_carb' | 'moderate_carb' | 'high_carb' | 'flexible' | null;
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extremely_active' | null;
  workout_frequency?: 'never' | '1-2_per_week' | '3-4_per_week' | '5-6_per_week' | 'daily' | null;
  onboarding_completed?: boolean;
  onboarding_completed_at?: string | null;
  preferences_last_updated?: string | null;
}

export interface UserStats {
  id: string;
  user_id: string;
  snaps_sent: number;
  snaps_received: number;
  photos_shared: number;
  messages_sent: number;
  friends_added: number;
  stories_posted: number;
  total_reactions_given: number;
  total_reactions_received: number;
  created_at: string;
  updated_at: string;
}

export interface CompleteUserStats {
  snap_score: number;
  current_streak: number;
  longest_streak: number;
  last_snap_date: string | null;
  snaps_sent: number;
  snaps_received: number;
  photos_shared: number;
  messages_sent: number;
  friends_count: number;
  friends_added: number;
  stories_posted: number;
  total_reactions_given: number;
  total_reactions_received: number;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Notification Settings
  push_notifications_enabled: boolean;
  message_notifications: boolean;
  friend_request_notifications: boolean;
  story_notifications: boolean;
  group_notifications: boolean;
  reaction_notifications: boolean;
  mention_notifications: boolean;
  
  // Privacy Settings
  allow_friend_requests: boolean;
  discoverable_by_email: boolean;
  discoverable_by_username: boolean;
  show_mutual_friends: boolean;
  show_friends_count: boolean;
  show_last_seen: boolean;
  profile_visibility: 'public' | 'friends' | 'private';
  
  // App Behavior Settings
  auto_save_to_journal: boolean;
  auto_download_media: boolean;
  read_receipts_enabled: boolean;
  typing_indicators_enabled: boolean;
  screenshot_notifications: boolean;
  
  // Display Settings
  dark_mode_enabled: boolean;
  reduce_motion: boolean;
  high_contrast: boolean;
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  
  // Content Settings
  mature_content_filter: boolean;
  auto_play_videos: boolean;
  data_saver_mode: boolean;
  
  // Language and Region
  language_code: string;
  timezone: string;
  
  created_at: string;
  updated_at: string;
}

export interface BlockedUser {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  
  // Joined data
  blocked_profile?: Profile;
}

export interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
  
  // Joined data from profiles table
  friend?: Profile;
  user?: Profile; // For incoming requests
  is_incoming_request?: boolean; // Flag to identify incoming requests
}

export interface Conversation {
  id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  archived_by?: string[]; // Array of user IDs who archived this conversation
  
  // Joined data
  participants?: ConversationParticipant[];
  last_message?: Message;
  participant_profiles?: Profile[];
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
  
  // Joined data
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  image_url: string | null;
  message_type: 'text' | 'image' | 'snap' | 'system';
  created_at: string;
  expires_at: string | null;
  read_by: Record<string, string>; // user_id -> timestamp
  
  // Enhanced snap viewing fields (Phase 2.1 Step 10)
  viewed_by?: Record<string, { timestamp: string; replay_count: number; first_viewed_at: string }>; // user_id -> view data
  screenshot_by?: Record<string, string>; // user_id -> timestamp when screenshot was taken
  max_replays?: number; // How many times this snap can be replayed (default 1)
  viewing_duration?: number; // How long the snap should be displayed in seconds (default 5)
  
  // Joined data
  sender?: Profile;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  
  // Content metadata
  image_url: string;
  thumbnail_url?: string | null;
  content_type: 'photo' | 'video';
  caption?: string | null;
  
  // Sharing metadata
  shared_to_chat: boolean;
  shared_to_story: boolean;
  shared_to_spotlight: boolean;
  original_message_id?: string | null;
  
  // Content categorization and search
  tags?: string[] | null;
  extracted_text?: string | null;
  
  // Technical metadata
  file_size?: number | null;
  dimensions?: { width: number; height: number } | null;
  location_data?: { lat: number; lng: number; name: string } | null;
  
  // Organization
  is_favorite: boolean;
  is_archived: boolean;
  folder_name?: string | null;
  
  created_at: string;
  updated_at: string;
}

// Helper types for UI components
export interface ConversationWithDetails extends Conversation {
  other_participant: Profile;
  last_message_preview: string;
  last_message_time: string;
  unread_count: number;
  is_archived?: boolean; // Computed field based on current user
  conversation_type?: 'individual' | 'group';
  participant_count?: number;
}

export interface SpotlightPost {
  id: string;
  user_id: string;
  journal_entry_id?: string | null;
  
  // Content metadata
  image_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  content_type: 'photo' | 'video';
  
  // Engagement metrics
  like_count: number;
  view_count: number;
  share_count: number;
  
  // Content categorization
  tags?: string[] | null;
  
  // Moderation and safety
  is_flagged: boolean;
  is_approved: boolean;
  moderation_reason?: string | null;
  
  // Privacy and visibility controls
  is_public: boolean;
  audience_restriction: 'public' | 'friends' | 'friends_of_friends';
  
  // Technical metadata
  dimensions?: { width: number; height: number } | null;
  location_data?: { lat: number; lng: number; name: string } | null;
  
  created_at: string;
  updated_at: string;
  
  // Joined data from API calls
  user?: Profile;
  user_has_liked?: boolean;
}

export interface SpotlightReaction {
  id: string;
  post_id: string;
  user_id: string;
  reaction_type: 'like' | 'heart' | 'fire' | 'wow';
  created_at: string;
  
  // Joined data
  user?: Profile;
}

export interface SpotlightReport {
  id: string;
  post_id: string;
  reporter_id: string;
  report_reason: 'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'other';
  description?: string | null;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  created_at: string;
  
  // Joined data
  reporter?: Profile;
  post?: SpotlightPost;
}

export interface SpotlightFeedItem extends SpotlightPost {
  display_name: string;
  avatar_url: string | null;
  user_has_liked: boolean;
}

export interface Story {
  id: string;
  user_id: string;
  
  // Content metadata
  image_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  content_type: 'photo' | 'video';
  
  // Technical metadata
  file_size?: number | null;
  dimensions?: { width: number; height: number } | null;
  
  // Stories-specific settings
  viewing_duration: number; // seconds, default 5
  background_color?: string | null; // hex color for text-only stories
  
  // Expiration (24 hours)
  expires_at: string;
  
  // View tracking
  view_count: number;
  viewed_by: Record<string, { timestamp: string; first_viewed_at: string }>; // user_id -> view data
  
  // Timestamps
  created_at: string;
  updated_at: string;
  
  // Joined data from API calls
  user?: Profile;
}

export interface StoryFeedItem extends Story {
  display_name: string;
  avatar_url: string | null;
  user_has_viewed: boolean;
  is_own_story: boolean;
  total_stories: number; // Number of stories this user has
}

// Types for Enhanced Onboarding and Nutrition Preferences
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface NutritionPreferences {
  primary_fitness_goal?: string;
  secondary_fitness_goals?: string[];
  dietary_restrictions?: string[];
  allergies?: string[];
  preferred_cuisines?: string[];
  preferred_content_style?: string;
  content_tone_preferences?: string[];
  meal_timing_preference?: string;
  cooking_skill_level?: string;
  meal_prep_frequency?: string;
  daily_calorie_goal?: number;
  protein_goal_grams?: number;
  carb_preference?: string;
  activity_level?: string;
  workout_frequency?: string; // Optional - not collected in onboarding
}

export interface OnboardingFormData extends NutritionPreferences {
  display_name?: string;
  bio?: string;
}

// Predefined options for dropdowns and multi-select components
export const FITNESS_GOALS = [
  { value: 'muscle_gain', label: 'Muscle Gain', emoji: '💪', description: 'Build lean muscle mass' },
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥', description: 'Lose body fat and get lean' },
  { value: 'clean_eating', label: 'Clean Eating', emoji: '🥗', description: 'Focus on whole, unprocessed foods' },
  { value: 'maintenance', label: 'Maintenance', emoji: '⚖️', description: 'Maintain current fitness level' },
  { value: 'athletic_performance', label: 'Athletic Performance', emoji: '🏃', description: 'Enhance sports performance' },
  { value: 'general_health', label: 'General Health', emoji: '❤️', description: 'Overall health and wellness' },
] as const;

export const DIETARY_RESTRICTIONS = [
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🌱' },
  { value: 'vegan', label: 'Vegan', emoji: '🌿' },
  { value: 'pescatarian', label: 'Pescatarian', emoji: '🐟' },
  { value: 'keto', label: 'Keto', emoji: '🥑' },
  { value: 'paleo', label: 'Paleo', emoji: '🥩' },
  { value: 'gluten_free', label: 'Gluten-Free', emoji: '🚫🌾' },
  { value: 'dairy_free', label: 'Dairy-Free', emoji: '🚫🥛' },
  { value: 'low_sodium', label: 'Low Sodium', emoji: '🧂' },
  { value: 'diabetic_friendly', label: 'Diabetic-Friendly', emoji: '📊' },
] as const;

export const COMMON_ALLERGIES = [
  { value: 'nuts', label: 'Tree Nuts', emoji: '🥜' },
  { value: 'peanuts', label: 'Peanuts', emoji: '🥜' },
  { value: 'shellfish', label: 'Shellfish', emoji: '🦐' },
  { value: 'fish', label: 'Fish', emoji: '🐟' },
  { value: 'dairy', label: 'Dairy', emoji: '🥛' },
  { value: 'eggs', label: 'Eggs', emoji: '🥚' },
  { value: 'soy', label: 'Soy', emoji: '🫘' },
  { value: 'gluten', label: 'Gluten', emoji: '🌾' },
  { value: 'sesame', label: 'Sesame', emoji: '🌰' },
] as const;

export const CONTENT_STYLES = [
  { value: 'inspirational', label: 'Inspirational', emoji: '✨', description: 'Motivational and uplifting' },
  { value: 'scientific', label: 'Scientific', emoji: '🔬', description: 'Evidence-based and detailed' },
  { value: 'quick_easy', label: 'Quick & Easy', emoji: '⚡', description: 'Simple and to-the-point' },
  { value: 'humorous', label: 'Humorous', emoji: '😄', description: 'Fun and entertaining' },
  { value: 'detailed', label: 'Detailed', emoji: '📝', description: 'Comprehensive explanations' },
  { value: 'casual', label: 'Casual', emoji: '😊', description: 'Relaxed and friendly' },
] as const;

export const COOKING_SKILL_LEVELS = [
  { value: 'beginner', label: 'Beginner', emoji: '👶', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', emoji: '👍', description: 'Some experience cooking' },
  { value: 'advanced', label: 'Advanced', emoji: '👨‍🍳', description: 'Comfortable with complex recipes' },
  { value: 'expert', label: 'Expert', emoji: '🎯', description: 'Professional-level skills' },
] as const;

export const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary', emoji: '💺', description: 'Mostly sitting/desk work' },
  { value: 'lightly_active', label: 'Lightly Active', emoji: '🚶', description: 'Light exercise 1-3 days/week' },
  { value: 'moderately_active', label: 'Moderately Active', emoji: '🏃', description: 'Moderate exercise 3-5 days/week' },
  { value: 'very_active', label: 'Very Active', emoji: '💪', description: 'Hard exercise 6-7 days/week' },
  { value: 'extremely_active', label: 'Extremely Active', emoji: '🔥', description: 'Very hard exercise or physical job' },
] as const;

// RAG and AI-related types
export interface ContentEmbedding {
  id: string;
  user_id: string;
  journal_entry_id?: string;
  content_type: 'caption' | 'image_metadata' | 'nutrition_data';
  content_text: string;
  embedding: number[]; // Vector embedding
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AiFeedback {
  id: string;
  user_id: string;
  suggestion_type: 'caption' | 'nutrition' | 'recipe' | 'prompt';
  suggestion_id: string;
  feedback_type: 'thumbs_up' | 'thumbs_down' | 'edited' | 'ignored';
  original_suggestion: string;
  edited_version?: string;
  context_metadata: Record<string, any>;
  created_at: string;
}

export interface CaptionGenerationRequest {
  imageUri?: string;
  imageDescription?: string;
  contentType?: 'photo' | 'video';
  context?: any;
}

export interface CaptionGenerationResponse {
  success: boolean;
  captions?: string[];
  error?: string;
  metadata?: {
    processingTime: number;
    similarContentCount: number;
    contextUsed: boolean;
  };
}

export interface EmbeddingGenerationRequest {
  journalEntryId: string;
  imageUri?: string;
  caption?: string;
  forceRegenerate?: boolean;
}

export interface EmbeddingGenerationResponse {
  success: boolean;
  embeddingsGenerated?: number;
  error?: string;
  processingTime?: number;
}

export interface SimilarContent {
  id: string;
  journal_entry_id: string;
  content_text: string;
  content_type: string;
  metadata: Record<string, any>;
  similarity: number;
  created_at: string;
}
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
  message_type: 'text' | 'image' | 'snap';
  created_at: string;
  expires_at: string | null;
  read_by: Record<string, string>; // user_id -> timestamp
  
  // Joined data
  sender?: Profile;
}

// Helper types for UI components
export interface ConversationWithDetails extends Conversation {
  other_participant: Profile;
  last_message_preview: string;
  last_message_time: string;
  unread_count: number;
  is_archived?: boolean; // Computed field based on current user
} 
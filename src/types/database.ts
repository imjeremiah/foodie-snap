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
  created_at: string;
  updated_at: string;
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
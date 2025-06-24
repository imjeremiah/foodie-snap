export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blocked_users_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocked_users_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_by: Json | null
          created_at: string | null
          created_by: string
          id: string
          updated_at: string | null
        }
        Insert: {
          archived_by?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          updated_at?: string | null
        }
        Update: {
          archived_by?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friends_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          caption: string | null
          content_type: string | null
          created_at: string | null
          dimensions: Json | null
          extracted_text: string | null
          file_size: number | null
          folder_name: string | null
          id: string
          image_url: string
          is_archived: boolean | null
          is_favorite: boolean | null
          location_data: Json | null
          original_message_id: string | null
          shared_to_chat: boolean | null
          shared_to_spotlight: boolean | null
          shared_to_story: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          dimensions?: Json | null
          extracted_text?: string | null
          file_size?: number | null
          folder_name?: string | null
          id?: string
          image_url: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          location_data?: Json | null
          original_message_id?: string | null
          shared_to_chat?: boolean | null
          shared_to_spotlight?: boolean | null
          shared_to_story?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          dimensions?: Json | null
          extracted_text?: string | null
          file_size?: number | null
          folder_name?: string | null
          id?: string
          image_url?: string
          is_archived?: boolean | null
          is_favorite?: boolean | null
          location_data?: Json | null
          original_message_id?: string | null
          shared_to_chat?: boolean | null
          shared_to_spotlight?: boolean | null
          shared_to_story?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_original_message_id_fkey"
            columns: ["original_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          message_type: string | null
          read_by: Json | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string | null
          read_by?: Json | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          message_type?: string | null
          read_by?: Json | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversation_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          current_streak: number | null
          display_name: string | null
          email: string
          id: string
          last_snap_date: string | null
          longest_streak: number | null
          snap_score: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email: string
          id: string
          last_snap_date?: string | null
          longest_streak?: number | null
          snap_score?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          current_streak?: number | null
          display_name?: string | null
          email?: string
          id?: string
          last_snap_date?: string | null
          longest_streak?: number | null
          snap_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      spotlight_posts: {
        Row: {
          audience_restriction: string | null
          caption: string | null
          content_type: string | null
          created_at: string | null
          dimensions: Json | null
          id: string
          image_url: string
          is_approved: boolean | null
          is_flagged: boolean | null
          is_public: boolean | null
          journal_entry_id: string | null
          like_count: number | null
          location_data: Json | null
          moderation_reason: string | null
          share_count: number | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          audience_restriction?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          image_url: string
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_public?: boolean | null
          journal_entry_id?: string | null
          like_count?: number | null
          location_data?: Json | null
          moderation_reason?: string | null
          share_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          audience_restriction?: string | null
          caption?: string | null
          content_type?: string | null
          created_at?: string | null
          dimensions?: Json | null
          id?: string
          image_url?: string
          is_approved?: boolean | null
          is_flagged?: boolean | null
          is_public?: boolean | null
          journal_entry_id?: string | null
          like_count?: number | null
          location_data?: Json | null
          moderation_reason?: string | null
          share_count?: number | null
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_posts_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          reaction_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          reaction_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          reaction_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "spotlight_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      spotlight_reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          post_id: string
          report_reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          post_id: string
          report_reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string
          report_reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spotlight_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "spotlight_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "spotlight_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          allow_friend_requests: boolean | null
          auto_download_media: boolean | null
          auto_play_videos: boolean | null
          auto_save_to_journal: boolean | null
          created_at: string | null
          dark_mode_enabled: boolean | null
          data_saver_mode: boolean | null
          discoverable_by_email: boolean | null
          discoverable_by_username: boolean | null
          font_size: string | null
          friend_request_notifications: boolean | null
          group_notifications: boolean | null
          high_contrast: boolean | null
          id: string
          language_code: string | null
          mature_content_filter: boolean | null
          mention_notifications: boolean | null
          message_notifications: boolean | null
          profile_visibility: string | null
          push_notifications_enabled: boolean | null
          reaction_notifications: boolean | null
          read_receipts_enabled: boolean | null
          reduce_motion: boolean | null
          screenshot_notifications: boolean | null
          show_friends_count: boolean | null
          show_last_seen: boolean | null
          show_mutual_friends: boolean | null
          story_notifications: boolean | null
          timezone: string | null
          typing_indicators_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_friend_requests?: boolean | null
          auto_download_media?: boolean | null
          auto_play_videos?: boolean | null
          auto_save_to_journal?: boolean | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          data_saver_mode?: boolean | null
          discoverable_by_email?: boolean | null
          discoverable_by_username?: boolean | null
          font_size?: string | null
          friend_request_notifications?: boolean | null
          group_notifications?: boolean | null
          high_contrast?: boolean | null
          id?: string
          language_code?: string | null
          mature_content_filter?: boolean | null
          mention_notifications?: boolean | null
          message_notifications?: boolean | null
          profile_visibility?: string | null
          push_notifications_enabled?: boolean | null
          reaction_notifications?: boolean | null
          read_receipts_enabled?: boolean | null
          reduce_motion?: boolean | null
          screenshot_notifications?: boolean | null
          show_friends_count?: boolean | null
          show_last_seen?: boolean | null
          show_mutual_friends?: boolean | null
          story_notifications?: boolean | null
          timezone?: string | null
          typing_indicators_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_friend_requests?: boolean | null
          auto_download_media?: boolean | null
          auto_play_videos?: boolean | null
          auto_save_to_journal?: boolean | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          data_saver_mode?: boolean | null
          discoverable_by_email?: boolean | null
          discoverable_by_username?: boolean | null
          font_size?: string | null
          friend_request_notifications?: boolean | null
          group_notifications?: boolean | null
          high_contrast?: boolean | null
          id?: string
          language_code?: string | null
          mature_content_filter?: boolean | null
          mention_notifications?: boolean | null
          message_notifications?: boolean | null
          profile_visibility?: string | null
          push_notifications_enabled?: boolean | null
          reaction_notifications?: boolean | null
          read_receipts_enabled?: boolean | null
          reduce_motion?: boolean | null
          screenshot_notifications?: boolean | null
          show_friends_count?: boolean | null
          show_last_seen?: boolean | null
          show_mutual_friends?: boolean | null
          story_notifications?: boolean | null
          timezone?: string | null
          typing_indicators_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          app_sessions: number | null
          created_at: string | null
          friends_added: number | null
          id: string
          last_active_date: string | null
          messages_sent: number | null
          notifications_opened: number | null
          photos_shared: number | null
          snaps_received: number | null
          snaps_sent: number | null
          stories_posted: number | null
          total_reactions_given: number | null
          total_reactions_received: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_sessions?: number | null
          created_at?: string | null
          friends_added?: number | null
          id?: string
          last_active_date?: string | null
          messages_sent?: number | null
          notifications_opened?: number | null
          photos_shared?: number | null
          snaps_received?: number | null
          snaps_sent?: number | null
          stories_posted?: number | null
          total_reactions_given?: number | null
          total_reactions_received?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_sessions?: number | null
          created_at?: string | null
          friends_added?: number | null
          id?: string
          last_active_date?: string | null
          messages_sent?: number | null
          notifications_opened?: number | null
          photos_shared?: number | null
          snaps_received?: number | null
          snaps_sent?: number | null
          stories_posted?: number | null
          total_reactions_given?: number | null
          total_reactions_received?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      conversation_details: {
        Row: {
          archived_by: Json | null
          created_at: string | null
          created_by: string | null
          id: string | null
          last_message_content: string | null
          last_message_time: string | null
          last_message_type: string | null
          updated_at: string | null
        }
        Insert: {
          archived_by?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          last_message_content?: never
          last_message_time?: never
          last_message_type?: never
          updated_at?: string | null
        }
        Update: {
          archived_by?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string | null
          last_message_content?: never
          last_message_time?: never
          last_message_type?: never
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_cleanup_expired_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      block_user: {
        Args: { target_user_id: string; reason_text?: string }
        Returns: undefined
      }
      cleanup_expired_messages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_journal_entries: {
        Args: {
          filter_type?: string
          search_term?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          caption: string | null
          content_type: string | null
          created_at: string | null
          dimensions: Json | null
          extracted_text: string | null
          file_size: number | null
          folder_name: string | null
          id: string
          image_url: string
          is_archived: boolean | null
          is_favorite: boolean | null
          location_data: Json | null
          original_message_id: string | null
          shared_to_chat: boolean | null
          shared_to_spotlight: boolean | null
          shared_to_story: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string | null
          user_id: string
        }[]
      }
      get_last_message_time: {
        Args: { conv_id: string }
        Returns: string
      }
      get_spotlight_feed: {
        Args: {
          feed_type?: string
          limit_count?: number
          offset_count?: number
        }
        Returns: {
          id: string
          user_id: string
          display_name: string
          avatar_url: string
          image_url: string
          thumbnail_url: string
          caption: string
          content_type: string
          like_count: number
          view_count: number
          tags: string[]
          created_at: string
          user_has_liked: boolean
        }[]
      }
      get_unread_count: {
        Args: { conv_id: string; user_id: string }
        Returns: number
      }
      get_user_complete_stats: {
        Args: { user_id_param: string }
        Returns: {
          snap_score: number
          current_streak: number
          longest_streak: number
          last_snap_date: string
          snaps_sent: number
          snaps_received: number
          photos_shared: number
          messages_sent: number
          friends_count: number
          friends_added: number
          stories_posted: number
          total_reactions_given: number
          total_reactions_received: number
        }[]
      }
      get_user_preferences: {
        Args: { user_id_param: string }
        Returns: {
          push_notifications_enabled: boolean
          message_notifications: boolean
          friend_request_notifications: boolean
          story_notifications: boolean
          group_notifications: boolean
          reaction_notifications: boolean
          mention_notifications: boolean
          allow_friend_requests: boolean
          discoverable_by_email: boolean
          discoverable_by_username: boolean
          show_mutual_friends: boolean
          show_friends_count: boolean
          show_last_seen: boolean
          profile_visibility: string
          auto_save_to_journal: boolean
          auto_download_media: boolean
          read_receipts_enabled: boolean
          typing_indicators_enabled: boolean
          screenshot_notifications: boolean
          dark_mode_enabled: boolean
          reduce_motion: boolean
          high_contrast: boolean
          font_size: string
          mature_content_filter: boolean
          auto_play_videos: boolean
          data_saver_mode: boolean
          language_code: string
          timezone: string
        }[]
      }
      increment_user_stat: {
        Args: {
          user_id_param: string
          stat_name: string
          increment_by?: number
        }
        Returns: undefined
      }
      is_user_blocked: {
        Args: { blocker_id_param: string; blocked_id_param: string }
        Returns: boolean
      }
      mark_messages_as_read: {
        Args: { message_updates: Json[] } | { message_updates: Json }
        Returns: undefined
      }
      organize_journal_entry: {
        Args: { entry_id: string; new_folder_name: string }
        Returns: boolean
      }
      report_spotlight_post: {
        Args: {
          post_id_param: string
          report_reason_param: string
          description_param?: string
        }
        Returns: string
      }
      reset_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      seed_demo_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      share_to_spotlight: {
        Args: {
          journal_entry_id_param: string
          caption_param?: string
          audience_restriction_param?: string
        }
        Returns: string
      }
      toggle_journal_favorite: {
        Args: { entry_id: string }
        Returns: boolean
      }
      toggle_spotlight_reaction: {
        Args: { post_id_param: string; reaction_type_param?: string }
        Returns: boolean
      }
      unblock_user: {
        Args: { target_user_id: string }
        Returns: undefined
      }
      update_snap_stats: {
        Args: { user_id_param: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

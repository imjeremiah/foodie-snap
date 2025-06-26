/**
 * @file RTK Query API slice for FoodieSnap Supabase integration.
 * Handles all database operations with caching, real-time updates, and proper joins.
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../lib/supabase";
import { 
  uploadPhoto, 
  uploadVideo, 
  uploadMedia, 
  PhotoUploadOptions, 
  VideoUploadOptions,
  MediaUploadOptions,
  PhotoUploadResult,
  VideoUploadResult,
  MediaUploadResult 
} from "../../lib/storage";
import type { 
  Profile, 
  Friend, 
  Conversation, 
  ConversationWithDetails, 
  Message, 
  ConversationParticipant,
  UserStats,
  CompleteUserStats,
  UserPreferences,
  BlockedUser,
  JournalEntry,
  SpotlightPost,
  SpotlightFeedItem,
  SpotlightReaction,
  SpotlightReport,
  Story,
  StoryFeedItem,
  ContentEmbedding,
  AiFeedback,
  CaptionGenerationRequest,
  CaptionGenerationResponse,
  EmbeddingGenerationRequest,
  EmbeddingGenerationResponse,
  SimilarContent,
  NutritionScanRequest,
  NutritionScanResponse
} from "../../types/database";

/**
 * Base query function for Supabase operations
 */
const supabaseBaseQuery = fetchBaseQuery({
  baseUrl: "/", // Not used for Supabase operations
  prepareHeaders: async (headers) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers.set("authorization", `Bearer ${session.access_token}`);
    }
    return headers;
  },
});

// Custom query function for direct Supabase operations

/**
 * Main API slice for all database operations
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: supabaseBaseQuery,
  tagTypes: ["Profile", "Friend", "Conversation", "Message", "Journal", "Spotlight", "Story"],
  endpoints: (builder) => ({
    // Profile endpoints
    getCurrentProfile: builder.query<Profile, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      providesTags: ["Profile"],
    }),

    updateProfile: builder.mutation<Profile, Partial<Profile> & { id: string }>({
      queryFn: async ({ id, ...updates }) => {
        const { data, error } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Profile"],
    }),

    // Enhanced nutrition preferences endpoints for RAG personalization
    updateNutritionPreferences: builder.mutation<Profile, Partial<Profile>>({
      queryFn: async (preferences) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("profiles")
          .update(preferences)
          .eq("id", user.id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Profile"],
    }),

    completeOnboarding: builder.mutation<Profile, { preferences: Partial<Profile> }>({
      queryFn: async ({ preferences }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("profiles")
          .update({
            ...preferences,
            onboarding_completed: true,
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Profile"],
    }),

    getUserPreferencesForRag: builder.query<any, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .rpc('get_user_preferences_for_rag');

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      providesTags: ["Profile"],
    }),

    resetOnboarding: builder.mutation<Profile, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("profiles")
          .update({
            onboarding_completed: false,
            onboarding_completed_at: null,
            // Clear nutrition preferences for fresh start
            primary_fitness_goal: null,
            secondary_fitness_goals: null,
            dietary_restrictions: [],
            allergies: [],
            preferred_cuisines: [],
            preferred_content_style: null,
            content_tone_preferences: [],
            meal_timing_preference: null,
            cooking_skill_level: null,
            meal_prep_frequency: null,
            daily_calorie_goal: null,
            protein_goal_grams: null,
            carb_preference: null,
            activity_level: null,
            workout_frequency: null,
          })
          .eq("id", user.id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Profile"],
    }),

    // User Statistics endpoints
    getUserStats: builder.query<CompleteUserStats, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .rpc('get_user_complete_stats', { user_id_param: user.id });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data[0] || {} };
      },
      providesTags: ["Profile"],
    }),

    updateSnapStats: builder.mutation<void, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { error } = await supabase
          .rpc('update_snap_stats', { user_id_param: user.id });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: ["Profile"],
    }),

    incrementUserStat: builder.mutation<void, { stat_name: string; increment_by?: number }>({
      queryFn: async ({ stat_name, increment_by = 1 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { error } = await supabase
          .rpc('increment_user_stat', { 
            user_id_param: user.id,
            stat_name: stat_name,
            increment_by: increment_by
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: ["Profile"],
    }),

    // User Preferences endpoints
    getUserPreferences: builder.query<UserPreferences, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("user_preferences")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      providesTags: ["Profile"],
    }),

    updateUserPreferences: builder.mutation<UserPreferences, Partial<UserPreferences> & { user_id: string }>({
      queryFn: async ({ user_id, ...updates }) => {
        const { data, error } = await supabase
          .from("user_preferences")
          .update(updates)
          .eq("user_id", user_id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Profile"],
    }),

    // User Blocking endpoints
    getBlockedUsers: builder.query<BlockedUser[], void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("blocked_users")
          .select(`
            *,
            blocked_profile:blocked_id (
              id,
              email,
              display_name,
              avatar_url
            )
          `)
          .eq("blocker_id", user.id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Friend"],
    }),

    blockUserAdvanced: builder.mutation<void, { user_id: string; reason?: string }>({
      queryFn: async ({ user_id, reason }) => {
        const { error } = await supabase
          .rpc('block_user', { 
            target_user_id: user_id,
            reason_text: reason || null
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: ["Friend", "Conversation"],
    }),

    unblockUserAdvanced: builder.mutation<void, { user_id: string }>({
      queryFn: async ({ user_id }) => {
        const { error } = await supabase
          .rpc('unblock_user', { target_user_id: user_id });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: ["Friend"],
    }),

    isUserBlocked: builder.query<boolean, string>({
      queryFn: async (user_id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .rpc('is_user_blocked', { 
            blocker_id_param: user.id,
            blocked_id_param: user_id
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || false };
      },
      providesTags: ["Friend"],
    }),

    // Friends endpoints
    getFriends: builder.query<Friend[], void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get outgoing friend relationships (user_id = current user)
        const { data: outgoingFriends, error: outgoingError } = await supabase
          .from("friends")
          .select(`
            *,
            friend:friend_id (
              id,
              email,
              display_name,
              avatar_url,
              bio
            )
          `)
          .eq("user_id", user.id);

        if (outgoingError) return { error: { status: "CUSTOM_ERROR", error: outgoingError.message } };

        // Get incoming friend requests (friend_id = current user, status = pending)
        const { data: incomingRequests, error: incomingError } = await supabase
          .from("friends")
          .select(`
            *,
            user:user_id (
              id,
              email,
              display_name,
              avatar_url,
              bio
            )
          `)
          .eq("friend_id", user.id)
          .eq("status", "pending");

        if (incomingError) return { error: { status: "CUSTOM_ERROR", error: incomingError.message } };

        // Combine outgoing friends and incoming requests
        // Transform incoming requests to match the Friend interface
        const transformedIncoming = (incomingRequests || []).map(request => ({
          ...request,
          friend: request.user, // Map user to friend for consistent interface
          is_incoming_request: true // Flag to identify incoming requests
        }));

        const allFriends = [...(outgoingFriends || []), ...transformedIncoming];
        
        return { data: allFriends };
      },
      providesTags: ["Friend"],
    }),

    sendFriendRequest: builder.mutation<Friend, { friend_id: string }>({
      queryFn: async ({ friend_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("friends")
          .insert({
            user_id: user.id,
            friend_id,
            status: "pending"
          })
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Friend"],
    }),

    acceptFriendRequest: builder.mutation<Friend, { id: string }>({
      queryFn: async ({ id }) => {
        const { data, error } = await supabase
          .from("friends")
          .update({ status: "accepted" })
          .eq("id", id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Friend"],
    }),

    // Reject friend request
    rejectFriendRequest: builder.mutation<string, { id: string }>({
      queryFn: async ({ id }) => {
        const { error } = await supabase
          .from("friends")
          .delete()
          .eq("id", id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Friend request rejected" };
      },
      invalidatesTags: ["Friend"],
    }),

    // Remove friend (delete friendship both ways)
    removeFriend: builder.mutation<string, { friend_id: string }>({
      queryFn: async ({ friend_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Remove both directions of the friendship
        const { error: error1 } = await supabase
          .from("friends")
          .delete()
          .eq("user_id", user.id)
          .eq("friend_id", friend_id);

        if (error1) return { error: { status: "CUSTOM_ERROR", error: error1.message } };

        const { error: error2 } = await supabase
          .from("friends")
          .delete()
          .eq("user_id", friend_id)
          .eq("friend_id", user.id);

        if (error2) return { error: { status: "CUSTOM_ERROR", error: error2.message } };

        return { data: "Friend removed successfully" };
      },
      invalidatesTags: ["Friend", "Conversation"],
    }),

    // Block user
    blockUser: builder.mutation<Friend, { friend_id: string }>({
      queryFn: async ({ friend_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Update existing friendship to blocked or create new blocked relationship
        const { data, error } = await supabase
          .from("friends")
          .upsert({
            user_id: user.id,
            friend_id,
            status: "blocked"
          })
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Friend", "Conversation"],
    }),

    // Unblock user
    unblockUser: builder.mutation<string, { friend_id: string }>({
      queryFn: async ({ friend_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { error } = await supabase
          .from("friends")
          .delete()
          .eq("user_id", user.id)
          .eq("friend_id", friend_id)
          .eq("status", "blocked");

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "User unblocked successfully" };
      },
      invalidatesTags: ["Friend"],
    }),

    // Search users by username or email
    searchUsers: builder.query<Profile[], string>({
      queryFn: async (searchTerm) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        if (!searchTerm || searchTerm.trim().length < 2) {
          return { data: [] };
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .or(`display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .neq("id", user.id) // Exclude current user
          .limit(20);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
    }),

    // Get mutual friends between current user and another user
    getMutualFriends: builder.query<Profile[], string>({
      queryFn: async (user_id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get friends of current user (accepted only)
        const { data: myFriends, error: myError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user.id)
          .eq("status", "accepted");

        if (myError) return { error: { status: "CUSTOM_ERROR", error: myError.message } };

        // Get friends of other user (accepted only)
        const { data: theirFriends, error: theirError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user_id)
          .eq("status", "accepted");

        if (theirError) return { error: { status: "CUSTOM_ERROR", error: theirError.message } };

        // Find mutual friends
        const myFriendIds = new Set(myFriends?.map(f => f.friend_id) || []);
        const mutualFriendIds = theirFriends?.filter(f => myFriendIds.has(f.friend_id)).map(f => f.friend_id) || [];

        if (mutualFriendIds.length === 0) {
          return { data: [] };
        }

        // Get profiles of mutual friends
        const { data: mutualProfiles, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .in("id", mutualFriendIds);

        if (profileError) return { error: { status: "CUSTOM_ERROR", error: profileError.message } };
        return { data: mutualProfiles || [] };
      },
      providesTags: ["Friend"],
    }),

    // Get friend suggestions based on mutual connections
    getFriendSuggestions: builder.query<Array<Profile & { mutual_friends_count: number }>, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get current friends
        const { data: currentFriends, error: friendsError } = await supabase
          .from("friends")
          .select("friend_id")
          .eq("user_id", user.id)
          .in("status", ["accepted", "pending", "blocked"]);

        if (friendsError) return { error: { status: "CUSTOM_ERROR", error: friendsError.message } };

        const friendIds = new Set([user.id, ...(currentFriends?.map(f => f.friend_id) || [])]);

        // Get friends of friends (potential suggestions)
        const { data: friendsOfFriends, error: fofError } = await supabase
          .from("friends")
          .select(`
            friend_id,
            user_id,
            friend:friend_id (
              id,
              email,
              display_name,
              avatar_url,
              bio
            )
          `)
          .in("user_id", Array.from(currentFriends?.map(f => f.friend_id) || []))
          .eq("status", "accepted");

        if (fofError) return { error: { status: "CUSTOM_ERROR", error: fofError.message } };

        // Count mutual friends for each suggestion
        const suggestionCounts = new Map<string, number>();
        const suggestions = new Map<string, Profile>();

        friendsOfFriends?.forEach((fof: any) => {
          if (!friendIds.has(fof.friend_id) && fof.friend) {
            suggestions.set(fof.friend_id, fof.friend);
            suggestionCounts.set(fof.friend_id, (suggestionCounts.get(fof.friend_id) || 0) + 1);
          }
        });

        // Convert to array and sort by mutual friends count
        const suggestionsArray = Array.from(suggestions.values())
          .map(profile => ({
            ...profile,
            mutual_friends_count: suggestionCounts.get(profile.id) || 0
          }))
          .sort((a, b) => b.mutual_friends_count - a.mutual_friends_count)
          .slice(0, 10); // Limit to top 10 suggestions

        return { data: suggestionsArray };
      },
      providesTags: ["Friend"],
    }),

    // Check friendship status with another user
    getFriendshipStatus: builder.query<{
      status: 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'blocked';
      friendship_id?: string;
    }, string>({
      queryFn: async (user_id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Check if there's a friendship from current user to target user
        const { data: outgoing, error: outgoingError } = await supabase
          .from("friends")
          .select("id, status")
          .eq("user_id", user.id)
          .eq("friend_id", user_id)
          .maybeSingle();

        if (outgoingError) return { error: { status: "CUSTOM_ERROR", error: outgoingError.message } };

        if (outgoing) {
          return { 
            data: { 
              status: outgoing.status === 'pending' ? 'pending_sent' : outgoing.status as any,
              friendship_id: outgoing.id
            } 
          };
        }

        // Check if there's a friendship from target user to current user
        const { data: incoming, error: incomingError } = await supabase
          .from("friends")
          .select("id, status")
          .eq("user_id", user_id)
          .eq("friend_id", user.id)
          .maybeSingle();

        if (incomingError) return { error: { status: "CUSTOM_ERROR", error: incomingError.message } };

        if (incoming) {
          return { 
            data: { 
              status: incoming.status === 'pending' ? 'pending_received' : incoming.status as any,
              friendship_id: incoming.id
            } 
          };
        }

        return { data: { status: 'none' } };
      },
      providesTags: ["Friend"],
    }),

    // Conversations endpoints
    getConversations: builder.query<ConversationWithDetails[], void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // First, get conversation IDs where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (participantError) return { error: { status: "CUSTOM_ERROR", error: participantError.message } };

        // If no conversations, return empty array
        if (!participantData || participantData.length === 0) {
          return { data: [] };
        }

        // Extract conversation IDs
        const conversationIds = participantData.map(p => p.conversation_id);

        // Get conversations with all related data
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            *,
            participants:conversation_participants (
              user_id,
              profile:profiles (
                id,
                email,
                display_name,
                avatar_url
              )
            ),
            messages (
              id,
              content,
              created_at,
              sender_id,
              message_type
            )
          `)
          .in("id", conversationIds)
          .order("updated_at", { ascending: false });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Transform data to ConversationWithDetails format
        const transformedData: ConversationWithDetails[] = (data || []).map(conv => {
          const participants = conv.participants || [];
          const otherParticipants = participants.filter((p: any) => p.user_id !== user.id);
          
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const unreadCount = (conv.messages || []).filter(
            (m: any) => m.sender_id !== user.id && !(m.read_by || {})[user.id]
          ).length;

          // Check if conversation is archived by current user
          const isArchived = (conv.archived_by || []).includes(user.id);

          // For 1-on-1 conversations, use the other participant
          // For group conversations, create a group display name
          let displayParticipant;
          let conversationType: 'individual' | 'group' = 'individual';
          
          if (otherParticipants.length === 1) {
            // 1-on-1 conversation
            displayParticipant = otherParticipants[0].profile;
            conversationType = 'individual';
          } else if (otherParticipants.length > 1) {
            // Group conversation
            conversationType = 'group';
            const participantNames = otherParticipants
              .map((p: any) => p.profile?.display_name || p.profile?.email?.split('@')[0] || 'Unknown')
              .slice(0, 3) // Show max 3 names
              .join(', ');
            
            const remainingCount = otherParticipants.length - 3;
            const groupName = remainingCount > 0 
              ? `${participantNames} and ${remainingCount} other${remainingCount > 1 ? 's' : ''}`
              : participantNames;

            displayParticipant = {
              id: `group-${conv.id}`,
              email: '',
              display_name: groupName,
              avatar_url: null,
              bio: `Group conversation with ${otherParticipants.length + 1} participants`,
              created_at: conv.created_at,
              updated_at: conv.updated_at
            };
          } else {
            // Fallback for edge cases
            displayParticipant = {
              id: 'unknown',
              email: 'unknown@example.com',
              display_name: 'Unknown User',
              avatar_url: null,
              bio: null,
              created_at: '',
              updated_at: ''
            };
          }

          // Generate appropriate preview text
          let lastMessagePreview = "No messages yet";
          if (lastMessage) {
            if (lastMessage.message_type === 'image') {
              lastMessagePreview = "📷 Photo";
            } else if (lastMessage.message_type === 'snap') {
              lastMessagePreview = "⚡ Snap";
            } else {
              lastMessagePreview = lastMessage.content || "Message";
            }
          }

          return {
            ...conv,
            other_participant: displayParticipant,
            last_message_preview: lastMessagePreview,
            last_message_time: lastMessage?.created_at || conv.created_at,
            unread_count: unreadCount,
            is_archived: isArchived,
            conversation_type: conversationType,
            participant_count: participants.length
          };
        });

        // Filter out archived conversations by default (can be made configurable)
        const activeConversations = transformedData.filter(conv => !conv.is_archived);
        
        return { data: activeConversations };
      },
      providesTags: ["Conversation"],
    }),

    getArchivedConversations: builder.query<ConversationWithDetails[], void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get conversation IDs where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        if (participantError) return { error: { status: "CUSTOM_ERROR", error: participantError.message } };

        if (!participantData || participantData.length === 0) {
          return { data: [] };
        }

        const conversationIds = participantData.map(p => p.conversation_id);

        // Get conversations with archived_by containing current user
        const { data, error } = await supabase
          .from("conversations")
          .select(`
            *,
            participants:conversation_participants (
              user_id,
              profile:profiles (
                id,
                email,
                display_name,
                avatar_url
              )
            ),
            messages (
              id,
              content,
              created_at,
              sender_id,
              message_type
            )
          `)
          .in("id", conversationIds)
          .contains("archived_by", [user.id]) // Only archived conversations
          .order("updated_at", { ascending: false });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Transform data similar to getConversations
        const transformedData: ConversationWithDetails[] = (data || []).map(conv => {
          const participants = conv.participants || [];
          const otherParticipants = participants.filter((p: any) => p.user_id !== user.id);
          
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const unreadCount = (conv.messages || []).filter(
            (m: any) => m.sender_id !== user.id && !(m.read_by || {})[user.id]
          ).length;

          // For 1-on-1 conversations, use the other participant
          // For group conversations, create a group display name
          let displayParticipant;
          let conversationType: 'individual' | 'group' = 'individual';
          
          if (otherParticipants.length === 1) {
            // 1-on-1 conversation
            displayParticipant = otherParticipants[0].profile;
            conversationType = 'individual';
          } else if (otherParticipants.length > 1) {
            // Group conversation
            conversationType = 'group';
            const participantNames = otherParticipants
              .map((p: any) => p.profile?.display_name || p.profile?.email?.split('@')[0] || 'Unknown')
              .slice(0, 3) // Show max 3 names
              .join(', ');
            
            const remainingCount = otherParticipants.length - 3;
            const groupName = remainingCount > 0 
              ? `${participantNames} and ${remainingCount} other${remainingCount > 1 ? 's' : ''}`
              : participantNames;

            displayParticipant = {
              id: `group-${conv.id}`,
              email: '',
              display_name: groupName,
              avatar_url: null,
              bio: `Group conversation with ${otherParticipants.length + 1} participants`,
              created_at: conv.created_at,
              updated_at: conv.updated_at
            };
          } else {
            // Fallback for edge cases
            displayParticipant = {
              id: 'unknown',
              email: 'unknown@example.com',
              display_name: 'Unknown User',
              avatar_url: null,
              bio: null,
              created_at: '',
              updated_at: ''
            };
          }

          let lastMessagePreview = "No messages yet";
          if (lastMessage) {
            if (lastMessage.message_type === 'image') {
              lastMessagePreview = "📷 Photo";
            } else if (lastMessage.message_type === 'snap') {
              lastMessagePreview = "⚡ Snap";
            } else {
              lastMessagePreview = lastMessage.content || "Message";
            }
          }

          return {
            ...conv,
            other_participant: displayParticipant,
            last_message_preview: lastMessagePreview,
            last_message_time: lastMessage?.created_at || conv.created_at,
            unread_count: unreadCount,
            is_archived: true,
            conversation_type: conversationType,
            participant_count: participants.length
          };
        });

        return { data: transformedData };
      },
      providesTags: ["Conversation"],
    }),

    createConversation: builder.mutation<Conversation, { participant_id: string }>({
      queryFn: async ({ participant_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Check if conversation already exists between these users
        const { data: existingConversations, error: checkError } = await supabase
          .from("conversation_participants")
          .select(`
            conversation_id,
            conversations!inner (
              id,
              created_by,
              created_at,
              updated_at,
              archived_by
            )
          `)
          .eq("user_id", user.id);

        if (checkError) return { error: { status: "CUSTOM_ERROR", error: checkError.message } };

        // Check if any of these conversations already include the target participant
        for (const conv of existingConversations || []) {
          const { data: otherParticipants, error: otherError } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conv.conversation_id)
            .neq("user_id", user.id);

          if (otherError) return { error: { status: "CUSTOM_ERROR", error: otherError.message } };

          if (otherParticipants?.some(p => p.user_id === participant_id)) {
            // Conversation already exists, return it
            return { data: conv.conversations };
          }
        }

        // Create new conversation
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .insert({ created_by: user.id })
          .select()
          .single();

        if (convError) return { error: { status: "CUSTOM_ERROR", error: convError.message } };

        // Add participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversation.id, user_id: user.id },
            { conversation_id: conversation.id, user_id: participant_id }
          ]);

        if (participantsError) return { error: { status: "CUSTOM_ERROR", error: participantsError.message } };

        return { data: conversation };
      },
      invalidatesTags: ["Conversation"],
    }),

    // Create group conversation with multiple participants
    createGroupConversation: builder.mutation<Conversation, { 
      participant_ids: string[]; 
      group_name?: string;
    }>({
      queryFn: async ({ participant_ids, group_name }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        if (participant_ids.length < 1) {
          return { error: { status: "CUSTOM_ERROR", error: "At least one participant is required" } };
        }

        // Create new conversation
        const { data: conversation, error: convError } = await supabase
          .from("conversations")
          .insert({ 
            created_by: user.id,
            // Store group name in a metadata field if needed - for now we'll handle naming in the UI
          })
          .select()
          .single();

        if (convError) return { error: { status: "CUSTOM_ERROR", error: convError.message } };

        // Add all participants (including creator)
        const participantInserts = [
          { conversation_id: conversation.id, user_id: user.id },
          ...participant_ids.map(id => ({ conversation_id: conversation.id, user_id: id }))
        ];

        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .insert(participantInserts);

        if (participantsError) return { error: { status: "CUSTOM_ERROR", error: participantsError.message } };

        return { data: conversation };
      },
      invalidatesTags: ["Conversation"],
    }),

    // Add participant to existing conversation
    addParticipantToConversation: builder.mutation<string, { 
      conversation_id: string; 
      user_id: string;
    }>({
      queryFn: async ({ conversation_id, user_id }) => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Check if current user is in the conversation
        const { data: isParticipant, error: checkError } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", conversation_id)
          .eq("user_id", currentUser.id)
          .single();

        if (checkError || !isParticipant) {
          return { error: { status: "CUSTOM_ERROR", error: "You are not authorized to add participants to this conversation" } };
        }

        // Check if user is already in the conversation
        const { data: existingParticipant, error: existingError } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", conversation_id)
          .eq("user_id", user_id)
          .single();

        if (!existingError && existingParticipant) {
          return { error: { status: "CUSTOM_ERROR", error: "User is already in this conversation" } };
        }

        // Add participant
        const { error: insertError } = await supabase
          .from("conversation_participants")
          .insert({ conversation_id, user_id });

        if (insertError) return { error: { status: "CUSTOM_ERROR", error: insertError.message } };

        // Send system message about new participant
        const { data: newParticipant } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user_id)
          .single();

        await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: currentUser.id,
            content: `${newParticipant?.display_name || "Someone"} was added to the conversation`,
            message_type: "system"
          });

        return { data: "Participant added successfully" };
      },
      invalidatesTags: ["Conversation", "Message"],
    }),

    // Remove participant from conversation
    removeParticipantFromConversation: builder.mutation<string, { 
      conversation_id: string; 
      user_id: string;
    }>({
      queryFn: async ({ conversation_id, user_id }) => {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Check if current user is in the conversation
        const { data: isParticipant, error: checkError } = await supabase
          .from("conversation_participants")
          .select("id")
          .eq("conversation_id", conversation_id)
          .eq("user_id", currentUser.id)
          .single();

        if (checkError || !isParticipant) {
          return { error: { status: "CUSTOM_ERROR", error: "You are not authorized to remove participants from this conversation" } };
        }

        // Remove participant
        const { error: deleteError } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversation_id)
          .eq("user_id", user_id);

        if (deleteError) return { error: { status: "CUSTOM_ERROR", error: deleteError.message } };

        // Send system message about removed participant
        const { data: removedParticipant } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user_id)
          .single();

        await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: currentUser.id,
            content: `${removedParticipant?.display_name || "Someone"} was removed from the conversation`,
            message_type: "system"
          });

        // Check if conversation has any remaining participants
        const { data: remainingParticipants, error: remainingError } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversation_id);

        if (remainingError) return { error: { status: "CUSTOM_ERROR", error: remainingError.message } };

        // If no participants left, delete the entire conversation
        if (!remainingParticipants || remainingParticipants.length === 0) {
          // Delete messages first
          await supabase
            .from("messages")
            .delete()
            .eq("conversation_id", conversation_id);

          // Delete conversation
          await supabase
            .from("conversations")
            .delete()
            .eq("id", conversation_id);
        }

        return { data: "Participant removed successfully" };
      },
      invalidatesTags: ["Conversation", "Message"],
    }),

    // Get conversation participants with details
    getConversationParticipants: builder.query<Array<Profile & { joined_at: string }>, string>({
      queryFn: async (conversation_id) => {
        const { data, error } = await supabase
          .from("conversation_participants")
          .select(`
            joined_at,
            profile:profiles (
              id,
              email,
              display_name,
              avatar_url,
              bio
            )
          `)
          .eq("conversation_id", conversation_id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        const participants = (data || []).map((p: any) => {
          const profile = p.profile as Profile;
          return {
            id: profile.id,
            email: profile.email,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            created_at: profile.created_at,
            updated_at: profile.updated_at,
            joined_at: p.joined_at
          };
        });

        return { data: participants };
      },
      providesTags: (_result, _error, conversation_id) => [
        { type: "Conversation", id: conversation_id }
      ],
    }),

    deleteConversation: builder.mutation<string, string>({
      queryFn: async (conversation_id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // First, delete all messages in the conversation
        const { error: messagesError } = await supabase
          .from("messages")
          .delete()
          .eq("conversation_id", conversation_id);

        if (messagesError) return { error: { status: "CUSTOM_ERROR", error: messagesError.message } };

        // Then, delete conversation participants
        const { error: participantsError } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversation_id);

        if (participantsError) return { error: { status: "CUSTOM_ERROR", error: participantsError.message } };

        // Finally, delete the conversation itself
        const { error: conversationError } = await supabase
          .from("conversations")
          .delete()
          .eq("id", conversation_id);

        if (conversationError) return { error: { status: "CUSTOM_ERROR", error: conversationError.message } };

        return { data: "Conversation deleted successfully" };
      },
      invalidatesTags: ["Conversation", "Message"],
    }),

    archiveConversation: builder.mutation<Conversation, { 
      conversation_id: string; 
      is_archived: boolean;
    }>({
      queryFn: async ({ conversation_id, is_archived }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // For now, we'll use a simple approach - add archived_by field to conversations table
        // In a production app, you might want a separate user_conversation_settings table
        const updateData = is_archived 
          ? { archived_by: [user.id] } // Store as array to support per-user archiving
          : { archived_by: [] };

        const { data, error } = await supabase
          .from("conversations")
          .update(updateData)
          .eq("id", conversation_id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        return { data };
      },
      invalidatesTags: ["Conversation"],
    }),

    leaveConversation: builder.mutation<string, string>({
      queryFn: async (conversation_id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Remove user from conversation participants
        const { error: participantError } = await supabase
          .from("conversation_participants")
          .delete()
          .eq("conversation_id", conversation_id)
          .eq("user_id", user.id);

        if (participantError) return { error: { status: "CUSTOM_ERROR", error: participantError.message } };

        // Check if conversation has any remaining participants
        const { data: remainingParticipants, error: checkError } = await supabase
          .from("conversation_participants")
          .select("user_id")
          .eq("conversation_id", conversation_id);

        if (checkError) return { error: { status: "CUSTOM_ERROR", error: checkError.message } };

        // If no participants left, delete the entire conversation
        if (!remainingParticipants || remainingParticipants.length === 0) {
          // Delete messages first
          await supabase
            .from("messages")
            .delete()
            .eq("conversation_id", conversation_id);

          // Delete conversation
          await supabase
            .from("conversations")
            .delete()
            .eq("id", conversation_id);
        }

        return { data: "Left conversation successfully" };
      },
      invalidatesTags: ["Conversation", "Message"],
    }),

    // Messages endpoints
    getMessages: builder.query<Message[], string>({
      queryFn: async (conversationId) => {
        const { data, error } = await supabase
          .from("messages")
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: (_result, _error, conversationId) => [
        { type: "Message", id: conversationId }
      ],
    }),

    sendMessage: builder.mutation<Message, {
      conversation_id: string;
      content?: string;
      image_url?: string;
      message_type?: "text" | "image" | "snap";
    }>({
      queryFn: async (messageData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("messages")
          .insert({
            ...messageData,
            sender_id: user.id,
            message_type: messageData.message_type || "text"
          })
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", messageData.conversation_id);

        return { data };
      },
      invalidatesTags: (_result, _error, { conversation_id }) => [
        { type: "Message", id: conversation_id },
        "Conversation"
      ],
    }),

    // Demo data management
    resetDemoData: builder.mutation<string, void>({
      queryFn: async () => {
        const { error } = await supabase.rpc("reset_demo_data");
        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Demo data reset successfully" };
      },
      invalidatesTags: ["Profile", "Friend", "Conversation", "Message"],
    }),

    cleanMyDemoData: builder.mutation<string, void>({
      queryFn: async () => {
        const { data, error } = await supabase.rpc("clean_my_demo_data");
        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || "Demo data cleaned successfully" };
      },
      invalidatesTags: ["Profile", "Friend", "Conversation", "Message", "Spotlight"],
    }),

    // Photo upload endpoint
    uploadPhoto: builder.mutation<PhotoUploadResult, { 
      imageUri: string; 
      options?: PhotoUploadOptions 
    }>({
      queryFn: async ({ imageUri, options }) => {
        const result = await uploadPhoto(imageUri, options);
        if (!result.success) {
          return { error: { status: "CUSTOM_ERROR", error: result.error || "Upload failed" } };
        }
        return { data: result };
      },
    }),

    // Send media message endpoint (photos and videos)
    sendPhotoMessage: builder.mutation<Message, {
      conversation_id: string;
      imageUri: string;
      content?: string;
      mediaType?: 'photo' | 'video';
      options?: MediaUploadOptions;
    }>({
      queryFn: async ({ conversation_id, imageUri, content, mediaType = 'photo', options }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Handle text-only messages (like nutrition cards)
        if (!imageUri || imageUri.trim() === '') {
          if (!content) {
            return { error: { status: "CUSTOM_ERROR", error: "No content or media provided" } };
          }
          
          // Send as text message
          const { data, error } = await supabase
            .from("messages")
            .insert({
              conversation_id,
              sender_id: user.id,
              content,
              message_type: "text"
            })
            .select(`
              *,
              sender:profiles (
                id,
                display_name,
                avatar_url
              )
            `)
            .single();

          if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

          // Update conversation timestamp
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversation_id);

          return { data };
        }

        // First upload the media
        const uploadResult = await uploadMedia(imageUri, mediaType, options);
        if (!uploadResult.success) {
          return { error: { status: "CUSTOM_ERROR", error: uploadResult.error || `${mediaType} upload failed` } };
        }

        // Then create the message with the media URL
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: user.id,
            content,
            image_url: uploadResult.data!.fullUrl,
            message_type: mediaType === 'video' ? "video" : "image"
          })
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation_id);

        return { data };
      },
      invalidatesTags: (_result, _error, { conversation_id }) => [
        { type: "Message", id: conversation_id },
        "Conversation"
      ],
    }),

    // Send media message endpoint (alias for better naming)
    sendMediaMessage: builder.mutation<Message, {
      conversation_id: string;
      mediaUri: string;
      mediaType: 'photo' | 'video';
      options?: MediaUploadOptions;
    }>({
      queryFn: async ({ conversation_id, mediaUri, mediaType, options }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // First upload the media
        const uploadResult = await uploadMedia(mediaUri, mediaType, options);
        if (!uploadResult.success) {
          return { error: { status: "CUSTOM_ERROR", error: uploadResult.error || `${mediaType} upload failed` } };
        }

        // Then create the message with the media URL
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: user.id,
            image_url: uploadResult.data!.fullUrl,
            message_type: mediaType === 'video' ? "video" : "image"
          })
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation_id);

        return { data };
      },
      invalidatesTags: (_result, _error, { conversation_id }) => [
        { type: "Message", id: conversation_id },
        "Conversation"
      ],
    }),

    // Mark message as read
    markMessageAsRead: builder.mutation<string, { 
      message_id: string; 
      conversation_id: string;
    }>({
      queryFn: async ({ message_id, conversation_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // First get the current message to update read_by
        const { data: message, error: fetchError } = await supabase
          .from("messages")
          .select("read_by")
          .eq("id", message_id)
          .single();

        if (fetchError) return { error: { status: "CUSTOM_ERROR", error: fetchError.message } };

        // Update read_by with current user and timestamp
        const updatedReadBy = {
          ...message.read_by,
          [user.id]: new Date().toISOString()
        };

        const { error } = await supabase
          .from("messages")
          .update({ read_by: updatedReadBy })
          .eq("id", message_id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        return { data: "Message marked as read" };
      },
      invalidatesTags: (_result, _error, { conversation_id }) => [
        { type: "Message", id: conversation_id },
        "Conversation"
      ],
    }),

    // Mark all messages in conversation as read
    markConversationAsRead: builder.mutation<string, string>({
      queryFn: async (conversation_id) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get all unread messages in the conversation
        const { data: messages, error: fetchError } = await supabase
          .from("messages")
          .select("id, read_by")
          .eq("conversation_id", conversation_id)
          .neq("sender_id", user.id); // Don't mark own messages as read

        if (fetchError) return { error: { status: "CUSTOM_ERROR", error: fetchError.message } };

        // Update each unread message
        const updates = messages
          .filter(message => !message.read_by[user.id]) // Only unread messages
          .map(message => ({
            id: message.id,
            read_by: {
              ...message.read_by,
              [user.id]: new Date().toISOString()
            }
          }));

        if (updates.length === 0) return { data: "No unread messages to mark" };

        // Use RPC function for bulk update
        const { error } = await supabase.rpc("mark_messages_as_read", {
          message_updates: updates
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        return { data: "Conversation marked as read" };
      },
      invalidatesTags: (_result, _error, conversation_id) => [
        { type: "Message", id: conversation_id },
        "Conversation"
      ],
    }),

    // Send typing indicator
    setTypingStatus: builder.mutation<string, {
      conversation_id: string;
      is_typing: boolean;
    }>({
      queryFn: async ({ conversation_id, is_typing }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Use Supabase presence for typing status
        const channel = supabase.channel(`typing:${conversation_id}`);
        
        if (is_typing) {
          await channel.track({
            user_id: user.id,
            display_name: user.user_metadata?.display_name || "User",
            typing: true,
            timestamp: Date.now()
          });
        } else {
          await channel.untrack();
        }

        return { data: is_typing ? "Typing status set" : "Typing status cleared" };
      },
    }),

    // Get typing status for conversation (placeholder - handled via real-time subscriptions)
    getTypingStatus: builder.query<Array<{
      user_id: string;
      display_name: string;
      typing: boolean;
    }>, string>({
      queryFn: async () => {
        // This is handled via real-time subscriptions in components
        return { data: [] };
      },
    }),

    // Send disappearing message (snap)
    sendSnapMessage: builder.mutation<Message, {
      conversation_id: string;
      content?: string;
      image_url?: string;
      expires_in_seconds?: number;
    }>({
      queryFn: async ({ conversation_id, content, image_url, expires_in_seconds = 10 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Calculate expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expires_in_seconds);

        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: user.id,
            content,
            image_url,
            message_type: "snap",
            expires_at: expiresAt.toISOString()
          })
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation_id);

        return { data };
      },
      invalidatesTags: (_result, _error, { conversation_id }) => [
        { type: "Message", id: conversation_id },
        "Conversation"
      ],
    }),

    // Clean up expired messages
    cleanupExpiredMessages: builder.mutation<string, void>({
      queryFn: async () => {
        const { error } = await supabase.rpc("cleanup_expired_messages");
        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Expired messages cleaned up" };
      },
      invalidatesTags: ["Message", "Conversation"],
    }),

    // Journal endpoints
    getJournalEntries: builder.query<JournalEntry[], {
      filter?: 'all' | 'favorites' | 'photos' | 'videos' | 'shared';
      search?: string;
      limit?: number;
      offset?: number;
    }>({
      queryFn: async ({ filter = 'all', search, limit = 20, offset = 0 }) => {
        const { data, error } = await supabase
          .rpc('get_journal_entries', {
            filter_type: filter,
            search_term: search || null,
            limit_count: limit,
            offset_count: offset
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Journal"],
    }),

    saveToJournal: builder.mutation<JournalEntry, {
      imageUri: string;
      caption?: string;
      content_type?: 'photo' | 'video';
      shared_to_chat?: boolean;
      shared_to_story?: boolean;
      shared_to_spotlight?: boolean;
      tags?: string[];
      options?: MediaUploadOptions;
    }>({
      queryFn: async ({ 
        imageUri, 
        caption, 
        content_type = 'photo',
        shared_to_chat = false,
        shared_to_story = false,
        shared_to_spotlight = false,
        tags = [],
        options 
      }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // First upload the photo/video
        const uploadResult = await uploadMedia(imageUri, content_type, options);
        if (!uploadResult.success) {
          return { error: { status: "CUSTOM_ERROR", error: uploadResult.error || "Upload failed" } };
        }

        // Create journal entry
        const { data, error } = await supabase
          .from("journal_entries")
          .insert({
            user_id: user.id,
            image_url: uploadResult.data!.fullUrl,
            caption,
            content_type,
            shared_to_chat,
            shared_to_story,
            shared_to_spotlight,
            tags: tags.length > 0 ? tags : null,
          })
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update user stats
        await supabase.rpc('increment_user_stat', {
          user_id_param: user.id,
          stat_name: 'photos_shared',
          increment_by: 1
        });

        return { data };
      },
      invalidatesTags: ["Journal", "Profile"],
    }),

    updateJournalEntry: builder.mutation<JournalEntry, {
      id: string;
      caption?: string;
      tags?: string[];
      folder_name?: string;
    }>({
      queryFn: async ({ id, ...updates }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("journal_entries")
          .update({
            ...updates,
            tags: updates.tags ? updates.tags : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", id)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: ["Journal"],
    }),

    deleteJournalEntry: builder.mutation<string, string>({
      queryFn: async (entryId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get the entry to check if we need to delete the image
        const { data: entry, error: fetchError } = await supabase
          .from("journal_entries")
          .select("image_url")
          .eq("id", entryId)
          .eq("user_id", user.id)
          .single();

        if (fetchError) return { error: { status: "CUSTOM_ERROR", error: fetchError.message } };

        // Delete from database
        const { error } = await supabase
          .from("journal_entries")
          .delete()
          .eq("id", entryId)
          .eq("user_id", user.id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Optional: Delete image from storage if it's not used elsewhere
        // For now, we'll keep images in storage for safety

        return { data: "Journal entry deleted successfully" };
      },
      invalidatesTags: ["Journal"],
    }),

    toggleJournalFavorite: builder.mutation<boolean, string>({
      queryFn: async (entryId) => {
        const { data, error } = await supabase.rpc('toggle_journal_favorite', {
          entry_id: entryId
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || false };
      },
      invalidatesTags: ["Journal"],
    }),

    organizeJournalEntry: builder.mutation<boolean, {
      entryId: string;
      folderName: string;
    }>({
      queryFn: async ({ entryId, folderName }) => {
        const { data, error } = await supabase.rpc('organize_journal_entry', {
          entry_id: entryId,
          new_folder_name: folderName
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || false };
      },
      invalidatesTags: ["Journal"],
    }),

    reshareFromJournal: builder.mutation<string, {
      entryId: string;
      destination: 'chat' | 'story' | 'spotlight';
      conversationId?: string; // Required if destination is 'chat'
    }>({
      queryFn: async ({ entryId, destination, conversationId }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Get the journal entry
        const { data: entry, error: fetchError } = await supabase
          .from("journal_entries")
          .select("*")
          .eq("id", entryId)
          .eq("user_id", user.id)
          .single();

        if (fetchError) return { error: { status: "CUSTOM_ERROR", error: fetchError.message } };

        if (destination === 'chat' && conversationId) {
          // Send as message
          const { error: messageError } = await supabase
            .from("messages")
            .insert({
              conversation_id: conversationId,
              sender_id: user.id,
              image_url: entry.image_url,
              content: entry.caption,
              message_type: "image"
            });

          if (messageError) return { error: { status: "CUSTOM_ERROR", error: messageError.message } };

          // Update conversation timestamp
          await supabase
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);

          // Update sharing metadata
          await supabase
            .from("journal_entries")
            .update({ shared_to_chat: true })
            .eq("id", entryId);

          return { data: "Reshared to chat successfully" };
        }

        // For story and spotlight, we'll implement these when those features are ready
        // For now, just update the sharing metadata
        const updateData = destination === 'story' 
          ? { shared_to_story: true }
          : { shared_to_spotlight: true };

        await supabase
          .from("journal_entries")
          .update(updateData)
          .eq("id", entryId);

        return { data: `Reshared to ${destination} successfully` };
      },
      invalidatesTags: ["Journal", "Message", "Conversation"],
    }),

    getJournalStats: builder.query<{
      total_entries: number;
      favorites_count: number;
      photos_count: number;
      videos_count: number;
      shared_count: number;
    }, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("journal_entries")
          .select("content_type, is_favorite, shared_to_chat, shared_to_story, shared_to_spotlight")
          .eq("user_id", user.id)
          .eq("is_archived", false);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        const stats = {
          total_entries: data?.length || 0,
          favorites_count: data?.filter(entry => entry.is_favorite).length || 0,
          photos_count: data?.filter(entry => entry.content_type === 'photo').length || 0,
          videos_count: data?.filter(entry => entry.content_type === 'video').length || 0,
          shared_count: data?.filter(entry => 
            entry.shared_to_chat || entry.shared_to_story || entry.shared_to_spotlight
          ).length || 0,
        };

        return { data: stats };
      },
      providesTags: ["Journal"],
    }),

    // Seed demo data for single-device testing
    seedDemoData: builder.mutation<string, void>({
      queryFn: async () => {
        const { data, error } = await supabase.rpc("reseed_demo_data");
        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || "Demo data seeded successfully" };
      },
      invalidatesTags: ["Profile", "Friend", "Conversation", "Message", "Spotlight"],
    }),

    // Spotlight endpoints
    getSpotlightFeed: builder.query<SpotlightFeedItem[], {
      feedType?: 'recent' | 'popular';
      limit?: number;
      offset?: number;
    }>({
      queryFn: async ({ feedType = 'recent', limit = 20, offset = 0 }) => {
        const { data, error } = await supabase.rpc('get_spotlight_feed', {
          feed_type: feedType,
          limit_count: limit,
          offset_count: offset
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Spotlight"],
    }),

    shareToSpotlight: builder.mutation<string, {
      journalEntryId: string;
      caption?: string;
      audienceRestriction?: 'public' | 'friends' | 'friends_of_friends';
    }>({
      queryFn: async ({ journalEntryId, caption, audienceRestriction = 'public' }) => {
        const { data, error } = await supabase.rpc('share_to_spotlight', {
          journal_entry_id_param: journalEntryId,
          caption_param: caption || null,
          audience_restriction_param: audienceRestriction
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || "Shared to spotlight successfully" };
      },
      invalidatesTags: ["Spotlight", "Journal"],
    }),

    toggleSpotlightReaction: builder.mutation<boolean, {
      postId: string;
      reactionType?: 'like' | 'heart' | 'fire' | 'wow';
    }>({
      queryFn: async ({ postId, reactionType = 'like' }) => {
        const { data, error } = await supabase.rpc('toggle_spotlight_reaction', {
          post_id_param: postId,
          reaction_type_param: reactionType
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || false };
      },
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Spotlight", id: postId },
        "Spotlight"
      ],
    }),

    reportSpotlightPost: builder.mutation<string, {
      postId: string;
      reason: 'inappropriate' | 'spam' | 'harassment' | 'copyright' | 'other';
      description?: string;
    }>({
      queryFn: async ({ postId, reason, description }) => {
        const { data, error } = await supabase.rpc('report_spotlight_post', {
          post_id_param: postId,
          report_reason_param: reason,
          description_param: description || null
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Post reported successfully" };
      },
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Spotlight", id: postId }
      ],
    }),

    getSpotlightPost: builder.query<SpotlightPost, string>({
      queryFn: async (postId) => {
        const { data, error } = await supabase
          .from("spotlight_posts")
          .select(`
            *,
            user:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("id", postId)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      providesTags: (_result, _error, postId) => [
        { type: "Spotlight", id: postId }
      ],
    }),

    getUserSpotlightPosts: builder.query<SpotlightPost[], {
      userId?: string;
      limit?: number;
      offset?: number;
    }>({
      queryFn: async ({ userId, limit = 20, offset = 0 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        const targetUserId = userId || user?.id;
        
        if (!targetUserId) return { error: { status: "CUSTOM_ERROR", error: "No user ID provided" } };

        const { data, error } = await supabase
          .from("spotlight_posts")
          .select(`
            *,
            user:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .eq("user_id", targetUserId)
          .eq("is_public", true)
          .eq("is_approved", true)
          .eq("is_flagged", false)
          .order("created_at", { ascending: false })
          .limit(limit)
          .range(offset, offset + limit - 1);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Spotlight"],
    }),

    deleteSpotlightPost: builder.mutation<string, string>({
      queryFn: async (postId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { error } = await supabase
          .from("spotlight_posts")
          .delete()
          .eq("id", postId)
          .eq("user_id", user.id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Post deleted successfully" };
      },
      invalidatesTags: (_result, _error, postId) => [
        { type: "Spotlight", id: postId },
        "Spotlight"
      ],
    }),

    updateSpotlightPost: builder.mutation<SpotlightPost, {
      postId: string;
      caption?: string;
      tags?: string[];
      audienceRestriction?: 'public' | 'friends' | 'friends_of_friends';
    }>({
      queryFn: async ({ postId, ...updates }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .from("spotlight_posts")
          .update({
            ...updates,
            tags: updates.tags ? updates.tags : null,
            updated_at: new Date().toISOString()
          })
          .eq("id", postId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: (_result, _error, { postId }) => [
        { type: "Spotlight", id: postId },
        "Spotlight"
      ],
    }),

    // Snap Viewing endpoints for Phase 2.1 Step 10
    canViewSnap: builder.query<{
      can_view: boolean;
      is_first_view: boolean;
      replay_count: number;
      max_replays: number;
      viewing_duration: number;
      error?: string;
    }, {
      message_id: string;
      viewer_id: string;
    }>({
      queryFn: async ({ message_id, viewer_id }) => {
        const { data, error } = await supabase.rpc('can_view_snap', {
          message_id_param: message_id,
          viewer_id_param: viewer_id
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      providesTags: (_result, _error, { message_id }) => [
        { type: "Message", id: message_id }
      ],
    }),

    recordSnapView: builder.mutation<{
      success: boolean;
      replay_count: number;
      can_replay: boolean;
      error?: string;
    }, {
      message_id: string;
      viewing_started_at: string;
      is_replay?: boolean;
    }>({
      queryFn: async ({ message_id, viewing_started_at, is_replay = false }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase.rpc('record_snap_view', {
          message_id_param: message_id,
          viewer_id_param: user.id,
          viewing_started_at_param: viewing_started_at,
          is_replay_param: is_replay
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || { success: true, replay_count: 0, can_replay: true } };
      },
      invalidatesTags: (_result, _error, { message_id }) => [
        { type: "Message", id: message_id },
        "Message"
      ],
    }),

    incrementSnapReplay: builder.mutation<{
      success: boolean;
      replay_count: number;
      can_replay: boolean;
    }, {
      message_id: string;
    }>({
      queryFn: async ({ message_id }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase.rpc('increment_snap_replay', {
          message_id_param: message_id,
          viewer_id_param: user.id
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || { success: true, replay_count: 1, can_replay: false } };
      },
      invalidatesTags: (_result, _error, { message_id }) => [
        { type: "Message", id: message_id },
        "Message"
      ],
    }),

    recordSnapScreenshot: builder.mutation<void, {
      message_id: string;
      screenshot_timestamp: string;
    }>({
      queryFn: async ({ message_id, screenshot_timestamp }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { error } = await supabase.rpc('record_snap_screenshot', {
          message_id_param: message_id,
          screenshotter_id_param: user.id,
          screenshot_timestamp_param: screenshot_timestamp
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: (_result, _error, { message_id }) => [
        { type: "Message", id: message_id }
      ],
    }),

    recordScreenshot: builder.mutation<void, {
      message_id: string;
      screenshotter_id: string;
    }>({
      queryFn: async ({ message_id, screenshotter_id }) => {
        const { error } = await supabase.rpc('record_screenshot', {
          message_id_param: message_id,
          screenshotter_id_param: screenshotter_id
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: (_result, _error, { message_id }) => [
        { type: "Message", id: message_id }
      ],
    }),

    getScreenshotNotifications: builder.query<Array<{
      message_id: string;
      conversation_id: string;
      content_preview: string;
      screenshot_by: string;
      screenshot_at: string;
      screenshotter_name: string;
    }>, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase.rpc('get_screenshot_notifications', {
          user_id_param: user.id
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Message"],
    }),

    // Enhanced snap sending with viewing duration and replay settings
    sendSnapMessageEnhanced: builder.mutation<Message, {
      conversation_id: string;
      content?: string;
      imageUri?: string;
      viewing_duration?: number; // 3-10 seconds
      max_replays?: number; // Default 1
      expires_in_seconds?: number; // When the snap expires completely
      options?: PhotoUploadOptions;
    }>({
      queryFn: async ({
        conversation_id,
        content,
        imageUri,
        viewing_duration = 5,
        max_replays = 1,
        expires_in_seconds = 86400, // 24 hours default
        options
      }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        let image_url = null;
        
        // Upload image if provided
        if (imageUri) {
          const uploadResult = await uploadPhoto(imageUri, options);
          if (!uploadResult.success) {
            return { error: { status: "CUSTOM_ERROR", error: uploadResult.error || "Upload failed" } };
          }
          image_url = uploadResult.data!.fullUrl;
        }

        // Calculate expiration time
        const expires_at = new Date(Date.now() + expires_in_seconds * 1000).toISOString();

        // Insert snap message
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: user.id,
            content: content || null,
            image_url,
            message_type: "snap",
            expires_at,
            viewing_duration,
            max_replays,
          })
          .select(`
            *,
            sender:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update conversation timestamp
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversation_id);

        // Update user stats
        await supabase.rpc('update_snap_stats', { user_id_param: user.id });

        return { data };
      },
      invalidatesTags: ["Message", "Conversation"],
    }),

    // Stories endpoints
    getStoriesFeed: builder.query<StoryFeedItem[], void>({
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_stories_feed');

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Story"],
    }),

    getUserStories: builder.query<Story[], string>({
      queryFn: async (userId) => {
        const { data, error } = await supabase.rpc('get_user_stories', {
          target_user_id: userId
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: (_result, _error, userId) => [
        { type: "Story", id: userId }
      ],
    }),

    createStory: builder.mutation<Story, {
      imageUri: string;
      caption?: string;
      content_type?: 'photo' | 'video';
      viewing_duration?: number;
      background_color?: string;
      options?: MediaUploadOptions;
    }>({
      queryFn: async ({
        imageUri,
        caption,
        content_type = 'photo',
        viewing_duration = 5,
        background_color,
        options
      }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Upload media
        const uploadResult = await uploadMedia(imageUri, content_type, options);
        if (!uploadResult.success) {
          return { error: { status: "CUSTOM_ERROR", error: uploadResult.error || "Upload failed" } };
        }

        // Create story
        const { data, error } = await supabase
          .from("stories")
          .insert({
            user_id: user.id,
            image_url: uploadResult.data!.fullUrl,
            thumbnail_url: uploadResult.data!.fullUrl, // Use same URL for now
            caption,
            content_type,
            viewing_duration,
            background_color,
            file_size: null, // Will be calculated later if needed
          })
          .select(`
            *,
            user:profiles (
              id,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        // Update user stats
        await supabase.rpc('increment_user_stat', {
          user_id_param: user.id,
          stat_name: 'stories_posted',
          increment_by: 1
        });

        return { data };
      },
      invalidatesTags: ["Story", "Profile"],
    }),

    createStoryFromJournal: builder.mutation<string, {
      journalEntryId: string;
      caption?: string;
      viewing_duration?: number;
    }>({
      queryFn: async ({ journalEntryId, caption, viewing_duration = 5 }) => {
        const { data, error } = await supabase.rpc('create_story_from_journal', {
          journal_entry_id_param: journalEntryId,
          caption_param: caption || null,
          viewing_duration_param: viewing_duration
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || "Story created successfully" };
      },
      invalidatesTags: ["Story", "Journal", "Profile"],
    }),

    recordStoryView: builder.mutation<{
      success: boolean;
      is_first_view: boolean;
      view_count: number;
      is_owner?: boolean;
      error?: string;
    }, {
      story_id: string;
      viewer_id: string;
    }>({
      queryFn: async ({ story_id, viewer_id }) => {
        const { data, error } = await supabase.rpc('record_story_view', {
          story_id_param: story_id,
          viewer_id_param: viewer_id
        });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data };
      },
      invalidatesTags: (_result, _error, { story_id }) => [
        { type: "Story", id: story_id },
        "Story"
      ],
    }),

    deleteStory: builder.mutation<string, string>({
      queryFn: async (storyId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { error } = await supabase
          .from("stories")
          .delete()
          .eq("id", storyId)
          .eq("user_id", user.id);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Story deleted successfully" };
      },
      invalidatesTags: (_result, _error, storyId) => [
        { type: "Story", id: storyId },
        "Story"
      ],
    }),

    cleanupExpiredStories: builder.mutation<number, void>({
      queryFn: async () => {
        const { data, error } = await supabase.rpc('cleanup_expired_stories');

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || 0 };
      },
      invalidatesTags: ["Story"],
    }),

    // RAG & AI Caption Generation endpoints
    generateSmartCaptions: builder.mutation<CaptionGenerationResponse, CaptionGenerationRequest>({
      queryFn: async (request) => {
        console.log('🔵 Starting smart caption generation...');
        
        // Get current user and fresh session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('❌ User authentication failed:', userError);
          return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };
        }

        // Get fresh session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          console.error('❌ Session authentication failed:', sessionError);
          return { error: { status: "CUSTOM_ERROR", error: "No authenticated session" } };
        }

        console.log('🔵 User and session authenticated, calling Edge Function...');

        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-smart-captions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify(request),
          });

          console.log('🔵 Edge Function response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Edge Function error response:', errorText);
            
            // Try to parse as JSON if possible for better error messages
            try {
              const errorJson = JSON.parse(errorText);
              return { error: { status: "CUSTOM_ERROR", error: errorJson.error || errorText } };
            } catch {
              return { error: { status: "CUSTOM_ERROR", error: `Caption generation failed: ${errorText}` } };
            }
          }

          const data = await response.json();
          console.log('✅ Smart caption generation successful');
          return { data };
          
        } catch (networkError) {
          console.error('❌ Network error calling Edge Function:', networkError);
          return { error: { status: "CUSTOM_ERROR", error: `Network error: ${networkError.message}` } };
        }
      },
      // Don't invalidate any tags since this doesn't modify persistent data
    }),

    generateContentEmbeddings: builder.mutation<EmbeddingGenerationResponse, EmbeddingGenerationRequest>({
      queryFn: async (request) => {
        console.log('🔵 Starting content embedding generation...');
        
        // Get current user and fresh session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('❌ User authentication failed:', userError);
          return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };
        }

        // Get fresh session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          console.error('❌ Session authentication failed:', sessionError);
          return { error: { status: "CUSTOM_ERROR", error: "No authenticated session" } };
        }

        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-content-embeddings`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify(request),
          });

          console.log('🔵 Embedding function response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Embedding function error:', errorText);
            return { error: { status: "CUSTOM_ERROR", error: `Embedding generation failed: ${errorText}` } };
          }

          const data = await response.json();
          console.log('✅ Content embedding generation successful');
          return { data };
          
        } catch (networkError) {
          console.error('❌ Network error calling embedding function:', networkError);
          return { error: { status: "CUSTOM_ERROR", error: `Network error: ${networkError.message}` } };
        }
      },
      // Don't invalidate tags since embeddings are background processing
    }),

    scanNutritionLabel: builder.mutation<NutritionScanResponse, NutritionScanRequest>({
      queryFn: async (request) => {
        console.log('🔵 Starting nutrition scan...');
        
        // Get current user and fresh session
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('❌ User authentication failed:', userError);
          return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };
        }

        // Get fresh session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          console.error('❌ Session authentication failed:', sessionError);
          return { error: { status: "CUSTOM_ERROR", error: "No authenticated session" } };
        }

        console.log('🔵 User and session authenticated, calling nutrition scan function...');

        try {
          const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/scan-nutrition-label`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
            },
            body: JSON.stringify(request),
          });

          console.log('🔵 Nutrition scan function response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Nutrition scan function error response:', errorText);
            
            // Try to parse as JSON if possible for better error messages
            try {
              const errorJson = JSON.parse(errorText);
              return { error: { status: "CUSTOM_ERROR", error: errorJson.error || errorText } };
            } catch {
              return { error: { status: "CUSTOM_ERROR", error: `Nutrition scan failed: ${errorText}` } };
            }
          }

          const data = await response.json();
          console.log('✅ Nutrition scan successful');
          return { data };
          
        } catch (networkError) {
          console.error('❌ Network error calling nutrition scan function:', networkError);
          return { error: { status: "CUSTOM_ERROR", error: `Network error: ${networkError.message}` } };
        }
      },
      // Don't invalidate any tags since this doesn't modify persistent data
    }),

    storeAiFeedback: builder.mutation<string, {
      suggestion_type: 'caption' | 'nutrition' | 'recipe' | 'prompt';
      suggestion_id: string;
      feedback_type: 'thumbs_up' | 'thumbs_down' | 'edited' | 'ignored';
      original_suggestion: string;
      edited_version?: string;
      context_metadata?: Record<string, any>;
    }>({
      queryFn: async (feedbackData) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .rpc('store_ai_feedback', {
            suggestion_type_param: feedbackData.suggestion_type,
            suggestion_id_param: feedbackData.suggestion_id,
            feedback_type_param: feedbackData.feedback_type,
            original_suggestion_param: feedbackData.original_suggestion,
            edited_version_param: feedbackData.edited_version || null,
            context_metadata_param: feedbackData.context_metadata || {}
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || "Feedback stored successfully" };
      },
      // Don't invalidate tags since feedback is background data
    }),

    searchSimilarContent: builder.query<SimilarContent[], {
      content_text: string;
      content_types?: string[];
      similarity_threshold?: number;
      max_results?: number;
    }>({
      queryFn: async ({ content_text, content_types = ['caption', 'image_metadata'], similarity_threshold = 0.7, max_results = 10 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // Use simple text search for now - semantic search would require Edge Function
        // This provides basic functionality while maintaining security
        let query = supabase
          .from('content_embeddings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(max_results);

        if (content_types && content_types.length > 0) {
          query = query.in('content_type', content_types);
        }

        // Use text search on content_text column
        if (content_text.trim()) {
          query = query.ilike('content_text', `%${content_text}%`);
        }

        const { data, error } = await query;

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        
        // Transform to match SimilarContent interface
        const transformedData = (data || []).map((item, index) => ({
          ...item,
          similarity: Math.max(0.5, 1 - (index * 0.1)) // Decreasing similarity score
        }));

        return { data: transformedData };
      },
      providesTags: ["Journal"], // Related to journal content
    }),

    getUserContentEmbeddings: builder.query<ContentEmbedding[], {
      content_types?: string[];
      limit?: number;
    }>({
      queryFn: async ({ content_types, limit = 50 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        let query = supabase
          .from('content_embeddings')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (content_types && content_types.length > 0) {
          query = query.in('content_type', content_types);
        }

        const { data, error } = await query;

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      providesTags: ["Journal"], // Related to journal content
    }),

    getUserAiFeedback: builder.query<AiFeedback[], {
      suggestion_types?: string[];
      limit?: number;
    }>({
      queryFn: async ({ suggestion_types, limit = 100 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        let query = supabase
          .from('ai_feedback')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (suggestion_types && suggestion_types.length > 0) {
          query = query.in('suggestion_type', suggestion_types);
        }

        const { data, error } = await query;

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || [] };
      },
      // No specific tag needed for feedback data
    }),

    getAiFeedbackAnalytics: builder.query<any, {
      time_range_days?: number;
    }>({
      queryFn: async ({ time_range_days = 30 }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .rpc('get_ai_feedback_analytics', {
            user_id_param: user.id,
            time_range_days: time_range_days
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || {} };
      },
      // No specific tag needed for analytics data
    }),

    getUserContentPreferencesFromFeedback: builder.query<any, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        const { data, error } = await supabase
          .rpc('get_user_content_preferences_from_feedback', {
            user_id_param: user.id
          });

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: data || {} };
      },
      // No specific tag needed for preferences data
    }),

  }),
});

// Export hooks for use in components
export const {
  useGetCurrentProfileQuery,
  useUpdateProfileMutation,
  // Enhanced nutrition preferences endpoints
  useUpdateNutritionPreferencesMutation,
  useCompleteOnboardingMutation,
  useGetUserPreferencesForRagQuery,
  useResetOnboardingMutation,
  useGetUserStatsQuery,
  useUpdateSnapStatsMutation,
  useIncrementUserStatMutation,
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useGetBlockedUsersQuery,
  useBlockUserAdvancedMutation,
  useUnblockUserAdvancedMutation,
  useIsUserBlockedQuery,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useUploadPhotoMutation,
  useSendPhotoMessageMutation,
  useSendMediaMessageMutation,
  useMarkMessageAsReadMutation,
  useMarkConversationAsReadMutation,
  useSetTypingStatusMutation,
  useGetTypingStatusQuery,
  useSendSnapMessageMutation,
  useCleanupExpiredMessagesMutation,
  useResetDemoDataMutation,
  useSeedDemoDataMutation,
  useCleanMyDemoDataMutation,
  useRejectFriendRequestMutation,
  useRemoveFriendMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useSearchUsersQuery,
  useGetMutualFriendsQuery,
  useGetFriendSuggestionsQuery,
  useGetFriendshipStatusQuery,
  useDeleteConversationMutation,
  useArchiveConversationMutation,
  useLeaveConversationMutation,
  useGetArchivedConversationsQuery,
  // Journal hooks
  useGetJournalEntriesQuery,
  useSaveToJournalMutation,
  useUpdateJournalEntryMutation,
  useDeleteJournalEntryMutation,
  useToggleJournalFavoriteMutation,
  useOrganizeJournalEntryMutation,
  useReshareFromJournalMutation,
  useGetJournalStatsQuery,
  // Spotlight hooks
  useGetSpotlightFeedQuery,
  useShareToSpotlightMutation,
  useToggleSpotlightReactionMutation,
  useReportSpotlightPostMutation,
  useGetSpotlightPostQuery,
  useGetUserSpotlightPostsQuery,
  useDeleteSpotlightPostMutation,
  useUpdateSpotlightPostMutation,
  // Snap viewing hooks
  useCanViewSnapQuery,
  useRecordSnapViewMutation,
  useIncrementSnapReplayMutation,
  useRecordSnapScreenshotMutation,
  useRecordScreenshotMutation,
  useGetScreenshotNotificationsQuery,
  useSendSnapMessageEnhancedMutation,
  // Stories hooks
  useGetStoriesFeedQuery,
  useGetUserStoriesQuery,
  useCreateStoryMutation,
  useCreateStoryFromJournalMutation,
  useRecordStoryViewMutation,
  useDeleteStoryMutation,
  useCleanupExpiredStoriesMutation,
  useGetConversationParticipantsQuery,
  useCreateGroupConversationMutation,
  useAddParticipantToConversationMutation,
  useRemoveParticipantFromConversationMutation,
  // RAG & AI hooks
  useGenerateSmartCaptionsMutation,
  useGenerateContentEmbeddingsMutation,
  useScanNutritionLabelMutation,
  useStoreAiFeedbackMutation,
  useSearchSimilarContentQuery,
  useGetUserContentEmbeddingsQuery,
  useGetUserAiFeedbackQuery,
  useGetAiFeedbackAnalyticsQuery,
  useGetUserContentPreferencesFromFeedbackQuery,
} = apiSlice; 
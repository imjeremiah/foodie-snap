/**
 * @file RTK Query API slice for FoodieSnap Supabase integration.
 * Handles all database operations with caching, real-time updates, and proper joins.
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../lib/supabase";
import { uploadPhoto, PhotoUploadOptions, PhotoUploadResult } from "../../lib/storage";
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
  JournalEntry
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
  tagTypes: ["Profile", "Friend", "Conversation", "Message", "Journal"],
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
          const otherParticipant = conv.participants?.find(
            (p: any) => p.user_id !== user.id
          )?.profile;
          
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const unreadCount = (conv.messages || []).filter(
            (m: any) => m.sender_id !== user.id && !(m.read_by || {})[user.id]
          ).length;

          // Check if conversation is archived by current user
          const isArchived = (conv.archived_by || []).includes(user.id);

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
            other_participant: otherParticipant || {
              id: "unknown",
              email: "unknown@example.com",
              display_name: "Unknown User",
              avatar_url: null,
              bio: null,
              created_at: "",
              updated_at: "",
            },
            last_message_preview: lastMessagePreview,
            last_message_time: lastMessage?.created_at || conv.created_at,
            unread_count: unreadCount,
            is_archived: isArchived,
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
          const otherParticipant = conv.participants?.find(
            (p: any) => p.user_id !== user.id
          )?.profile;
          
          const lastMessage = conv.messages?.[conv.messages.length - 1];
          const unreadCount = (conv.messages || []).filter(
            (m: any) => m.sender_id !== user.id && !(m.read_by || {})[user.id]
          ).length;

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
            other_participant: otherParticipant || {
              id: "unknown",
              email: "unknown@example.com",
              display_name: "Unknown User",
              avatar_url: null,
              bio: null,
              created_at: "",
              updated_at: "",
            },
            last_message_preview: lastMessagePreview,
            last_message_time: lastMessage?.created_at || conv.created_at,
            unread_count: unreadCount,
            is_archived: true,
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
              created_at
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

          if (otherError) continue;

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
        const { error: participantError } = await supabase
          .from("conversation_participants")
          .insert([
            { conversation_id: conversation.id, user_id: user.id },
            { conversation_id: conversation.id, user_id: participant_id }
          ]);

        if (participantError) return { error: { status: "CUSTOM_ERROR", error: participantError.message } };

        return { data: conversation };
      },
      invalidatesTags: ["Conversation"],
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

    // Send photo message endpoint
    sendPhotoMessage: builder.mutation<Message, {
      conversation_id: string;
      imageUri: string;
      options?: PhotoUploadOptions;
    }>({
      queryFn: async ({ conversation_id, imageUri, options }) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        // First upload the photo
        const uploadResult = await uploadPhoto(imageUri, options);
        if (!uploadResult.success) {
          return { error: { status: "CUSTOM_ERROR", error: uploadResult.error || "Photo upload failed" } };
        }

        // Then create the message with the photo URL
        const { data, error } = await supabase
          .from("messages")
          .insert({
            conversation_id,
            sender_id: user.id,
            image_url: uploadResult.data!.fullUrl,
            message_type: "image"
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
      options?: PhotoUploadOptions;
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
        const uploadResult = await uploadPhoto(imageUri, options);
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
        const { error } = await supabase.rpc("seed_demo_data");
        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: "Demo data seeded successfully" };
      },
      invalidatesTags: ["Profile", "Friend", "Conversation", "Message"],
    }),


  }),
});

// Export hooks for use in components
export const {
  useGetCurrentProfileQuery,
  useUpdateProfileMutation,
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
  useMarkMessageAsReadMutation,
  useMarkConversationAsReadMutation,
  useSetTypingStatusMutation,
  useGetTypingStatusQuery,
  useSendSnapMessageMutation,
  useCleanupExpiredMessagesMutation,
  useResetDemoDataMutation,
  useSeedDemoDataMutation,
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
} = apiSlice; 
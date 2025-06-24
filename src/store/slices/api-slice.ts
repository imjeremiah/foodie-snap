/**
 * @file RTK Query API slice for FoodieSnap Supabase integration.
 * Handles all database operations with caching, real-time updates, and proper joins.
 */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { supabase } from "../../lib/supabase";
import type { 
  Profile, 
  Friend, 
  Conversation, 
  ConversationWithDetails, 
  Message, 
  ConversationParticipant 
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

/**
 * Custom base query that uses Supabase client directly
 */
const supabaseQuery = async (args: any) => {
  const { table, operation, select, filters, data, id } = args;

  try {
    let query = supabase.from(table);

    switch (operation) {
      case "select":
        query = query.select(select || "*");
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        break;
      case "insert":
        query = query.insert(data);
        break;
      case "update":
        query = query.update(data);
        if (id) query = query.eq("id", id);
        break;
      case "delete":
        query = query.delete();
        if (id) query = query.eq("id", id);
        break;
    }

    const { data: result, error } = await query;

    if (error) {
      return { error: { status: "CUSTOM_ERROR", error: error.message, data: error } };
    }

    return { data: result };
  } catch (error) {
    return { error: { status: "FETCH_ERROR", error: String(error) } };
  }
};

/**
 * Main API slice for all database operations
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: supabaseQuery,
  tagTypes: ["Profile", "Friend", "Conversation", "Message"],
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
          const unreadCount = conv.messages?.filter(
            (m: any) => m.sender_id !== user.id && !m.read_by?.[user.id]
          ).length || 0;

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
            last_message_preview: lastMessage?.content || "No messages yet",
            last_message_time: lastMessage?.created_at || conv.created_at,
            unread_count,
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

        // Create conversation
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
    resetDemoData: builder.mutation<void, void>({
      queryFn: async () => {
        const { error } = await supabase.rpc("reset_demo_data");
        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };
        return { data: undefined };
      },
      invalidatesTags: ["Profile", "Friend", "Conversation", "Message"],
    }),

    // Debug conversations - temporary for debugging
    debugConversations: builder.query<any, void>({
      queryFn: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: { status: "CUSTOM_ERROR", error: "No authenticated user" } };

        console.log("🔍 Debug: Starting conversations query for user:", user.id);

        // First, get conversation IDs where user is a participant
        const { data: participantData, error: participantError } = await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

        console.log("🔍 Debug: Participant data:", participantData, "Error:", participantError);

        if (participantError) return { error: { status: "CUSTOM_ERROR", error: participantError.message } };

        // If no conversations, return empty array
        if (!participantData || participantData.length === 0) {
          console.log("🔍 Debug: No conversations found");
          return { data: [] };
        }

        // Extract conversation IDs
        const conversationIds = participantData.map(p => p.conversation_id);
        console.log("🔍 Debug: Conversation IDs:", conversationIds);

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

        console.log("🔍 Debug: Raw conversations data:", data, "Error:", error);

        if (error) return { error: { status: "CUSTOM_ERROR", error: error.message } };

        return { data: data || [] };
      },
      providesTags: ["Conversation"],
    }),
  }),
});

// Export hooks for use in components
export const {
  useGetCurrentProfileQuery,
  useUpdateProfileMutation,
  useGetFriendsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useGetMessagesQuery,
  useSendMessageMutation,
  useResetDemoDataMutation,
  useDebugConversationsQuery,
} = apiSlice; 
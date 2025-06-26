/**
 * @file Real-time subscription utilities for FoodieSnap.
 * Handles Supabase real-time subscriptions and integrates with RTK Query cache invalidation.
 */

import { supabase } from "./supabase";
import { store } from "../store";
import { apiSlice } from "../store/slices/api-slice";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Active subscription channels with improved management
 */
const activeChannels: Map<string, RealtimeChannel> = new Map();
let isInitializing = false;
let isCleaningUp = false;

/**
 * Subscribe to real-time messages for a specific conversation
 * @param conversationId - The conversation ID to subscribe to
 */
export function subscribeToMessages(conversationId: string) {
  const channelName = `messages:${conversationId}`;
  
  // Don't create duplicate subscriptions
  if (activeChannels.has(channelName)) {
    return;
  }

  console.log(`Subscribing to messages for conversation: ${conversationId}`);

  const channel = supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log("New message received:", payload);
        
        // Invalidate messages query for this conversation
        store.dispatch(
          apiSlice.util.invalidateTags([{ type: "Message", id: conversationId }])
        );
        
        // Also invalidate conversations to update last message preview
        store.dispatch(
          apiSlice.util.invalidateTags(["Conversation"])
        );
      }
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        console.log("Message updated:", payload);
        
        // Invalidate messages query for this conversation
        store.dispatch(
          apiSlice.util.invalidateTags([{ type: "Message", id: conversationId }])
        );
      }
    )
    .subscribe();

  activeChannels.set(channelName, channel);
}

/**
 * Unsubscribe from messages for a specific conversation
 * @param conversationId - The conversation ID to unsubscribe from
 */
export function unsubscribeFromMessages(conversationId: string) {
  const channelName = `messages:${conversationId}`;
  const channel = activeChannels.get(channelName);
  
  if (channel) {
    console.log(`Unsubscribing from messages for conversation: ${conversationId}`);
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
}

/**
 * Subscribe to friend requests for the current user
 */
export function subscribeToFriendRequests() {
  const channelName = "friend-requests";
  
  // Don't create duplicate subscriptions
  if (activeChannels.has(channelName)) {
    return;
  }

  // Get current user
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;

    console.log("Subscribing to friend requests");

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friends",
          filter: `friend_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New friend request received:", payload);
          
          // Invalidate friends query
          store.dispatch(
            apiSlice.util.invalidateTags(["Friend"])
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friends",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Friend request updated:", payload);
          
          // Invalidate friends query
          store.dispatch(
            apiSlice.util.invalidateTags(["Friend"])
          );
        }
      )
      .subscribe();

    activeChannels.set(channelName, channel);
  });
}

/**
 * Subscribe to conversations for the current user
 */
export function subscribeToConversations() {
  const channelName = "conversations";
  
  // Don't create duplicate subscriptions
  if (activeChannels.has(channelName)) {
    return;
  }

  // Get current user
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (!user) return;

    console.log("Subscribing to conversations");

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "conversation_participants",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Added to new conversation:", payload);
          
          // Invalidate conversations query
          store.dispatch(
            apiSlice.util.invalidateTags(["Conversation"])
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversations",
        },
        (payload) => {
          console.log("Conversation updated:", payload);
          
          // Invalidate conversations query
          store.dispatch(
            apiSlice.util.invalidateTags(["Conversation"])
          );
        }
      )
      .subscribe();

    activeChannels.set(channelName, channel);
  });
}

/**
 * Initialize all real-time subscriptions for the current user
 */
export function initializeRealTimeSubscriptions() {
  // Prevent multiple simultaneous initializations
  if (isInitializing || isCleaningUp) {
    console.log("📡 Subscription initialization already in progress or cleaning up, skipping");
    return;
  }
  
  isInitializing = true;
  console.log("📡 Initializing real-time subscriptions");
  
  try {
    subscribeToFriendRequests();
    subscribeToConversations();
    console.log("✅ Real-time subscriptions initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize real-time subscriptions:", error);
  } finally {
    isInitializing = false;
  }
}

/**
 * Clean up all active subscriptions
 */
export function cleanupRealTimeSubscriptions() {
  // Prevent multiple simultaneous cleanups
  if (isCleaningUp) {
    console.log("🧹 Subscription cleanup already in progress, skipping");
    return;
  }
  
  isCleaningUp = true;
  console.log("🧹 Cleaning up real-time subscriptions");
  
  try {
    if (activeChannels.size === 0) {
      console.log("📭 No active subscriptions to clean up");
      return;
    }
    
    activeChannels.forEach((channel, channelName) => {
      console.log(`🗑️ Removing channel: ${channelName}`);
      try {
        supabase.removeChannel(channel);
      } catch (error) {
        console.error(`❌ Failed to remove channel ${channelName}:`, error);
      }
    });
    
    activeChannels.clear();
    console.log("✅ Real-time subscriptions cleaned up successfully");
  } catch (error) {
    console.error("❌ Failed to cleanup real-time subscriptions:", error);
  } finally {
    isCleaningUp = false;
  }
}

/**
 * Get the status of active subscriptions (for debugging)
 */
export function getActiveSubscriptions() {
  return Array.from(activeChannels.keys());
}

/**
 * Subscribe to typing indicators for a specific conversation
 * @param conversationId - The conversation ID to subscribe to
 * @param callback - Callback function to handle typing status updates
 */
export function subscribeToTypingIndicators(
  conversationId: string, 
  callback: (typingUsers: Array<{user_id: string, display_name: string, typing: boolean}>) => void
) {
  const channelName = `typing:${conversationId}`;
  
  // Don't create duplicate subscriptions
  if (activeChannels.has(channelName)) {
    return;
  }

  console.log(`Subscribing to typing indicators for conversation: ${conversationId}`);

  const channel = supabase
    .channel(channelName)
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      const typingUsers = Object.values(state)
        .flat()
        .filter((user: any) => user.typing && Date.now() - user.timestamp < 5000) // 5 second timeout
        .map((user: any) => ({
          user_id: user.user_id,
          display_name: user.display_name,
          typing: user.typing
        }));
      
      callback(typingUsers);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('User started typing:', key, newPresences);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('User stopped typing:', key, leftPresences);
    })
    .subscribe();

  activeChannels.set(channelName, channel);
}

/**
 * Unsubscribe from typing indicators for a specific conversation
 * @param conversationId - The conversation ID to unsubscribe from
 */
export function unsubscribeFromTypingIndicators(conversationId: string) {
  const channelName = `typing:${conversationId}`;
  const channel = activeChannels.get(channelName);
  
  if (channel) {
    console.log(`Unsubscribing from typing indicators for conversation: ${conversationId}`);
    supabase.removeChannel(channel);
    activeChannels.delete(channelName);
  }
} 
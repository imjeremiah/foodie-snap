/**
 * @file Chat screen - displays conversations and messaging functionality.
 * Shows a list of chat conversations with message previews.
 */

import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGetConversationsQuery, useDebugConversationsQuery, apiSlice } from "../../store/slices/api-slice";
import { formatTimeAgo } from "../../lib/utils";
import { useDispatch } from "react-redux";

export default function ChatScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { data: conversations = [], isLoading } = useGetConversationsQuery();
  
  // Temporary debug query (keeping for troubleshooting)
  const { data: debugData, isLoading: debugLoading } = useDebugConversationsQuery();

  /**
   * Force refresh data
   */
  const handleRefresh = () => {
    console.log("🔄 Forcing cache invalidation...");
    dispatch(apiSlice.util.invalidateTags(["Conversation"]));
  };

  /**
   * Navigate to individual chat thread
   */
  const handleChatPress = (conversation: any) => {
    router.push({
      pathname: "/chat/[id]",
      params: { 
        id: conversation.id,
        participantName: conversation.other_participant.display_name,
      },
    });
  };

  /**
   * Handle new chat creation
   */
  const handleNewChat = () => {
    // This will be implemented in next phases
    console.log("New chat functionality will be implemented in next phase");
  };



  /**
   * Render conversation item
   */
  const renderConversationItem = ({ item: conversation }: { item: any }) => (
    <TouchableOpacity
      className="flex-row items-center border-b border-border bg-background px-4 py-4"
      onPress={() => handleChatPress(conversation)}
    >
      {/* Avatar with online indicator */}
      <View className="relative">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-bold text-primary-foreground">
            {conversation.other_participant.display_name?.charAt(0) || "?"}
          </Text>
        </View>
      </View>

      {/* Chat content */}
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-foreground">
            {conversation.other_participant.display_name || "Unknown User"}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {formatTimeAgo(conversation.last_message_time)}
          </Text>
        </View>
        
        <View className="mt-1 flex-row items-center justify-between">
          <Text 
            className="flex-1 text-sm text-muted-foreground"
            numberOfLines={1}
          >
            {conversation.last_message_preview}
          </Text>
          
          {conversation.unread_count > 0 && (
            <View className="ml-2 min-w-[20px] items-center justify-center rounded-full bg-primary px-2 py-1">
              <Text className="text-xs font-bold text-primary-foreground">
                {conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Ionicons name="chatbubbles-outline" size={40} color="gray" />
        </View>
        <Text className="mt-4 text-lg font-semibold text-foreground">
          No conversations yet
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          Start chatting with friends to see your conversations here
        </Text>
        <TouchableOpacity 
          className="mt-6 rounded-full bg-primary px-6 py-3"
          onPress={handleNewChat}
        >
          <Text className="font-semibold text-primary-foreground">
            Start a Chat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border px-4 py-4">
        <Text className="text-2xl font-bold text-foreground">Chats</Text>
        <View className="flex-row space-x-3">
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Ionicons name="search-outline" size={20} color="gray" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-orange-500"
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-primary"
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading conversations...</Text>
        </View>
      ) : conversations.length > 0 ? (
        <FlatList
          data={conversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
    </SafeAreaView>
  );
}

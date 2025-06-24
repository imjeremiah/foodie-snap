/**
 * @file Chat screen - displays conversations and messaging functionality.
 * Shows a list of chat conversations with message previews.
 */

import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock conversations data for UI demonstration
const mockConversations = [
  {
    id: "1",
    other_participant: {
      id: "user1",
      display_name: "Alex Chen",
      email: "alex@example.com",
      avatar_url: null,
    },
    last_message_preview: "Just finished my morning protein smoothie! 🥤",
    last_message_time: "2m",
    unread_count: 2,
    online: true,
  },
  {
    id: "2", 
    other_participant: {
      id: "user2",
      display_name: "Sarah Johnson",
      email: "sarah@example.com",
      avatar_url: null,
    },
    last_message_preview: "Thanks for the recipe! I tried it last night",
    last_message_time: "1h",
    unread_count: 0,
    online: false,
  },
  {
    id: "3",
    other_participant: {
      id: "user3",
      display_name: "Mike Rodriguez", 
      email: "mike@example.com",
      avatar_url: null,
    },
    last_message_preview: "🔥 That workout was intense!",
    last_message_time: "3h",
    unread_count: 1,
    online: true,
  },
  {
    id: "4",
    other_participant: {
      id: "user4",
      display_name: "Emma Wilson",
      email: "emma@example.com",
      avatar_url: null,
    },
    last_message_preview: "Can you share your meal prep schedule?",
    last_message_time: "1d",
    unread_count: 0,
    online: false,
  },
  {
    id: "5",
    other_participant: {
      id: "user5",
      display_name: "David Kim",
      email: "david@example.com",
      avatar_url: null,
    },
    last_message_preview: "Photo",
    last_message_time: "2d",
    unread_count: 0,
    online: false,
  },
];

export default function ChatScreen() {
  const router = useRouter();

  /**
   * Navigate to individual chat thread
   */
  const handleChatPress = (conversation: typeof mockConversations[0]) => {
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
  const renderConversationItem = ({ item: conversation }: { item: typeof mockConversations[0] }) => (
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
        {conversation.online && (
          <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background bg-green-500" />
        )}
      </View>

      {/* Chat content */}
      <View className="ml-3 flex-1">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-foreground">
            {conversation.other_participant.display_name || "Unknown User"}
          </Text>
          <Text className="text-xs text-muted-foreground">
            {conversation.last_message_time}
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
            className="h-10 w-10 items-center justify-center rounded-full bg-primary"
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conversations List */}
      {mockConversations.length > 0 ? (
        <FlatList
          data={mockConversations}
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

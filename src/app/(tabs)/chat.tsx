/**
 * @file Chat screen - displays conversations and messaging functionality.
 * Shows a list of chat conversations with message previews.
 */

import { View, Text, TouchableOpacity, FlatList, TextInput, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { 
  useGetConversationsQuery, 
  useSeedDemoDataMutation, 
  useDeleteConversationMutation,
  useArchiveConversationMutation,
  apiSlice 
} from "../../store/slices/api-slice";
import { formatTimeAgo } from "../../lib/utils";
import { useDispatch } from "react-redux";
import React, { useState, useMemo } from "react";
import ConversationManagementModal from "../../components/conversation/ConversationManagementModal";
import StoriesCarousel from "../../components/stories/StoriesCarousel";

export default function ChatScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [searchText, setSearchText] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);
  
  const { data: conversations = [], isLoading } = useGetConversationsQuery();
  const [seedDemoData, { isLoading: isSeeding }] = useSeedDemoDataMutation();
  const [deleteConversation, { isLoading: isDeleting }] = useDeleteConversationMutation();
  const [archiveConversation, { isLoading: isArchiving }] = useArchiveConversationMutation();

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
    router.push("/new-chat");
  };

  /**
   * Toggle search functionality
   */
  const toggleSearch = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      setSearchText("");
    }
  };

  /**
   * Filter conversations based on search text
   */
  const filteredConversations = useMemo(() => {
    if (!searchText.trim()) {
      return conversations;
    }
    
    return conversations.filter(conversation => {
      const participantName = conversation.other_participant.display_name?.toLowerCase() || "";
      const participantEmail = conversation.other_participant.email?.toLowerCase() || "";
      const lastMessage = conversation.last_message_preview?.toLowerCase() || "";
      const search = searchText.toLowerCase();
      
      return participantName.includes(search) || 
             participantEmail.includes(search) || 
             lastMessage.includes(search);
    });
  }, [conversations, searchText]);

  /**
   * Handle conversation deletion
   */
  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      "Delete Conversation",
      "Are you sure you want to delete this conversation? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              await deleteConversation(conversationId).unwrap();
              Alert.alert("Success", "Conversation deleted successfully");
            } catch (error) {
              console.error("Failed to delete conversation:", error);
              Alert.alert("Error", "Failed to delete conversation. Please try again.");
            }
          }
        }
      ]
    );
  };

  /**
   * Handle conversation options menu
   */
  const handleConversationOptions = (conversation: any) => {
    setSelectedConversation(conversation);
    setShowManagementModal(true);
  };

  /**
   * Handle navigating to chat from modal
   */
  const handleNavigateToChat = () => {
    if (selectedConversation) {
      handleChatPress(selectedConversation);
    }
  };

  /**
   * Handle conversation archiving
   */
  const handleArchiveConversation = async (conversationId: string) => {
    try {
      await archiveConversation({ 
        conversation_id: conversationId, 
        is_archived: true 
      }).unwrap();
      Alert.alert("Success", "Conversation archived");
    } catch (error) {
      console.error("Failed to archive conversation:", error);
      Alert.alert("Error", "Failed to archive conversation. Please try again.");
    }
  };

  /**
   * Handle seeding demo data for testing
   */
  const handleSeedDemo = async () => {
    try {
      await seedDemoData().unwrap();
      console.log("✅ Demo data seeded successfully!");
    } catch (error) {
      console.error("❌ Failed to seed demo data:", error);
    }
  };



  /**
   * Render conversation item
   */
  const renderConversationItem = ({ item: conversation }: { item: any }) => (
    <View className="flex-row items-center border-b border-border bg-background">
      <TouchableOpacity
        className="flex-1 flex-row items-center px-4 py-4"
        onPress={() => handleChatPress(conversation)}
      >
        {/* Avatar with group indicator */}
        <View className="relative">
          <View className={`h-14 w-14 items-center justify-center rounded-full ${
            conversation.conversation_type === 'group' ? 'bg-green-500' : 'bg-primary'
          }`}>
            {conversation.conversation_type === 'group' ? (
              <Ionicons name="people" size={24} color="white" />
            ) : (
              <Text className="text-lg font-bold text-primary-foreground">
                {conversation.other_participant.display_name?.charAt(0) || "?"}
              </Text>
            )}
          </View>
          {conversation.conversation_type === 'group' && (
            <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-background">
              <Text className="text-xs font-bold text-green-600">
                {conversation.participant_count}
              </Text>
            </View>
          )}
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
      
      {/* Options Button */}
      <TouchableOpacity
        className="px-4 py-4"
        onPress={() => handleConversationOptions(conversation)}
        disabled={isDeleting || isArchiving}
      >
        <Ionicons 
          name="ellipsis-vertical" 
          size={20} 
          color={isDeleting || isArchiving ? "#9CA3AF" : "#6B7280"} 
        />
      </TouchableOpacity>
    </View>
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
      <View className="border-b border-border">
        <View className="flex-row items-center justify-between px-4 py-4">
          <Text className="text-2xl font-bold text-foreground">Chats</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity 
              className={`h-10 w-10 items-center justify-center rounded-full ${
                showSearch ? "bg-primary" : "bg-muted"
              }`}
              onPress={toggleSearch}
            >
              <Ionicons 
                name="search-outline" 
                size={20} 
                color={showSearch ? "white" : "gray"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              className="h-10 w-10 items-center justify-center rounded-full bg-yellow-100"
              onPress={() => router.push("/archived-chats")}
            >
              <Ionicons name="archive" size={20} color="#eab308" />
            </TouchableOpacity>
          <TouchableOpacity 
            className={`h-10 w-10 items-center justify-center rounded-full ${
              isSeeding ? "bg-gray-400" : "bg-green-500"
            }`}
            onPress={handleSeedDemo}
            disabled={isSeeding}
          >
            <Ionicons 
              name={isSeeding ? "hourglass" : "flask"} 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-orange-500"
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-green-500 mr-2"
            onPress={() => router.push("/new-group-chat")}
          >
            <Ionicons name="people" size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="h-10 w-10 items-center justify-center rounded-full bg-primary"
            onPress={handleNewChat}
          >
            <Ionicons name="add" size={20} color="white" />
          </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        {showSearch && (
          <View className="px-4 pb-4">
            <View className="flex-row items-center rounded-full bg-muted px-4 py-3">
              <Ionicons name="search-outline" size={20} color="gray" />
              <TextInput
                className="ml-3 flex-1 text-foreground"
                placeholder="Search conversations..."
                placeholderTextColor="gray"
                value={searchText}
                onChangeText={setSearchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchText.length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Stories Carousel */}
      <StoriesCarousel />

      {/* Separator */}
      <View className="border-t border-border" />

      {/* Conversations List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading conversations...</Text>
        </View>
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        />
      ) : searchText.length > 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
              <Ionicons name="search-outline" size={40} color="gray" />
            </View>
            <Text className="mt-4 text-lg font-semibold text-foreground">
              No conversations found
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Try searching with different keywords
            </Text>
          </View>
        </View>
      ) : (
        renderEmptyState()
      )}

      {/* Conversation Management Modal */}
      <ConversationManagementModal
        visible={showManagementModal}
        onClose={() => {
          setShowManagementModal(false);
          setSelectedConversation(null);
        }}
        conversation={selectedConversation}
        onNavigateToChat={handleNavigateToChat}
      />
    </SafeAreaView>
  );
}

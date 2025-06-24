/**
 * @file Archived Chats screen - displays archived conversations.
 * Allows users to view and manage their archived conversations.
 */

import React, { useState } from "react";
import { View, Text, TouchableOpacity, FlatList, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { 
  useGetArchivedConversationsQuery,
  useArchiveConversationMutation,
} from "../store/slices/api-slice";
import { formatTimeAgo } from "../lib/utils";
import ConversationManagementModal from "../components/conversation/ConversationManagementModal";

export default function ArchivedChatsScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [showManagementModal, setShowManagementModal] = useState(false);

  const { data: archivedConversations = [], isLoading } = useGetArchivedConversationsQuery();
  const [unarchiveConversation] = useArchiveConversationMutation();

  /**
   * Filter archived conversations based on search text
   */
  const filteredConversations = React.useMemo(() => {
    if (!searchText.trim()) {
      return archivedConversations;
    }
    
    return archivedConversations.filter(conversation => {
      const participantName = conversation.other_participant.display_name?.toLowerCase() || "";
      const participantEmail = conversation.other_participant.email?.toLowerCase() || "";
      const lastMessage = conversation.last_message_preview?.toLowerCase() || "";
      const search = searchText.toLowerCase();
      
      return participantName.includes(search) || 
             participantEmail.includes(search) || 
             lastMessage.includes(search);
    });
  }, [archivedConversations, searchText]);

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
   * Handle conversation options
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
   * Quick unarchive action
   */
  const handleQuickUnarchive = async (conversationId: string, event: any) => {
    event.stopPropagation(); // Prevent chat navigation
    try {
      await unarchiveConversation({ 
        conversation_id: conversationId, 
        is_archived: false 
      }).unwrap();
    } catch (error) {
      console.error("Failed to unarchive conversation:", error);
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
        {/* Avatar */}
        <View className="relative">
          <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Text className="text-lg font-bold text-muted-foreground">
              {conversation.other_participant.display_name?.charAt(0) || "?"}
            </Text>
          </View>
          {/* Archived indicator */}
          <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full bg-yellow-500">
            <Ionicons name="archive" size={12} color="white" />
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
      
      {/* Quick unarchive button */}
      <TouchableOpacity
        className="px-3 py-4"
        onPress={(e) => handleQuickUnarchive(conversation.id, e)}
      >
        <Ionicons name="arrow-up-circle-outline" size={20} color="#eab308" />
      </TouchableOpacity>

      {/* Options Button */}
      <TouchableOpacity
        className="px-4 py-4"
        onPress={() => handleConversationOptions(conversation)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
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
          <Ionicons name="archive-outline" size={40} color="gray" />
        </View>
        <Text className="mt-4 text-lg font-semibold text-foreground">
          {searchText.length > 0 ? "No archived conversations found" : "No archived conversations"}
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          {searchText.length > 0 
            ? "Try searching with different keywords"
            : "Conversations you archive will appear here"
          }
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="border-b border-border">
        <View className="flex-row items-center justify-between px-4 py-4">
          <TouchableOpacity
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="gray" />
          </TouchableOpacity>
          
          <Text className="flex-1 text-xl font-bold text-foreground">
            Archived Chats
          </Text>

          <View className="flex-row space-x-3">
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Ionicons name="search-outline" size={20} color="gray" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Search Bar */}
        <View className="px-4 pb-4">
          <View className="flex-row items-center rounded-full bg-muted px-4 py-3">
            <Ionicons name="search-outline" size={20} color="gray" />
            <TextInput
              className="ml-3 flex-1 text-foreground"
              placeholder="Search archived conversations..."
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
      </View>

      {/* Archived Conversations List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading archived conversations...</Text>
        </View>
      ) : filteredConversations.length > 0 ? (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Info Footer */}
      <View className="border-t border-border px-4 py-3">
        <Text className="text-center text-xs text-muted-foreground">
          Tap ↑ to unarchive • Tap ⋮ for more options
        </Text>
      </View>

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
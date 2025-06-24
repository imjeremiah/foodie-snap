/**
 * @file New Chat screen - allows users to select friends to start new conversations.
 * Integrates with friend search and conversation creation functionality.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useGetFriendsQuery,
  useSearchUsersQuery,
  useCreateConversationMutation,
  useGetConversationsQuery,
} from "../store/slices/api-slice";
import type { Profile, Friend } from "../types/database";

export default function NewChatScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  // Queries
  const { data: friends = [], isLoading: isLoadingFriends } = useGetFriendsQuery();
  const { data: searchResults = [], isLoading: isSearching } = useSearchUsersQuery(searchText, {
    skip: searchText.length < 2
  });
  const { data: existingConversations = [] } = useGetConversationsQuery();

  // Mutations
  const [createConversation, { isLoading: isCreating }] = useCreateConversationMutation();

  /**
   * Get accepted friends for display
   */
  const acceptedFriends = friends.filter(friend => friend.status === 'accepted');

  /**
   * Get display data combining friends and search results
   */
  const getDisplayData = (): Array<Profile & { isFromSearch?: boolean; friendshipId?: string }> => {
    if (searchText.length >= 2) {
      // Show search results
      return searchResults.map(user => ({
        ...user,
        isFromSearch: true
      }));
    } else {
      // Show accepted friends
      return acceptedFriends.map(friend => ({
        ...friend.friend!,
        friendshipId: friend.id
      }));
    }
  };

  /**
   * Check if conversation already exists with this user
   */
  const conversationExists = (userId: string): boolean => {
    return existingConversations.some(conv => conv.other_participant.id === userId);
  };

  /**
   * Handle friend selection toggle
   */
  const toggleFriendSelection = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    if (newSelected.has(friendId)) {
      newSelected.delete(friendId);
    } else {
      newSelected.add(friendId);
    }
    setSelectedFriends(newSelected);
  };

  /**
   * Create conversation with selected friend
   */
  const handleCreateConversation = async (participantId: string) => {
    try {
      const result = await createConversation({ participant_id: participantId }).unwrap();
      
      // Find the friend's display name for navigation
      const displayData = getDisplayData();
      const selectedUser = displayData.find(user => user.id === participantId);
      const participantName = selectedUser?.display_name || "Unknown User";
      
      // Navigate to the new conversation
      router.replace({
        pathname: "/chat/[id]",
        params: { 
          id: result.id,
          participantName,
        },
      });
    } catch (error) {
      console.error("Failed to create conversation:", error);
      Alert.alert("Error", "Failed to create conversation. Please try again.");
    }
  };

  /**
   * Handle start chat with single user
   */
  const handleStartChat = (userId: string) => {
    // Check if conversation already exists
    const existingConv = existingConversations.find(conv => conv.other_participant.id === userId);
    if (existingConv) {
      // Navigate to existing conversation
      router.replace({
        pathname: "/chat/[id]",
        params: { 
          id: existingConv.id,
          participantName: existingConv.other_participant.display_name || "Unknown User",
        },
      });
    } else {
      // Create new conversation
      handleCreateConversation(userId);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Render friend item
   */
  const renderFriendItem = ({ item: user }: { item: Profile & { isFromSearch?: boolean; friendshipId?: string } }) => {
    const isSelected = selectedFriends.has(user.id);
    const hasExistingConv = conversationExists(user.id);
    
    return (
      <TouchableOpacity
        className="flex-row items-center border-b border-border bg-background px-4 py-4"
        onPress={() => handleStartChat(user.id)}
        disabled={isCreating}
      >
        {/* Avatar */}
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-bold text-primary-foreground">
            {user.display_name?.charAt(0) || user.email.charAt(0) || "?"}
          </Text>
        </View>

        {/* User Info */}
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-foreground">
            {user.display_name || user.email.split('@')[0]}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {user.email}
          </Text>
          {user.bio && (
            <Text className="text-xs text-muted-foreground" numberOfLines={1}>
              {user.bio}
            </Text>
          )}
        </View>

        {/* Status Indicator */}
        <View className="ml-3">
          {hasExistingConv ? (
            <View className="flex-row items-center">
              <Ionicons name="chatbubble" size={16} color="#10b981" />
              <Text className="ml-1 text-xs text-green-600">Chat exists</Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
              <Text className="ml-1 text-xs text-primary">Start chat</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="items-center">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-muted">
          <Ionicons name="people-outline" size={40} color="gray" />
        </View>
        <Text className="mt-4 text-lg font-semibold text-foreground">
          {searchText.length >= 2 ? "No users found" : "No friends yet"}
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          {searchText.length >= 2 
            ? "Try searching for a different name or email"
            : "Add friends to start chatting with them"
          }
        </Text>
      </View>
    </View>
  );

  const displayData = getDisplayData();
  const isLoading = isLoadingFriends || (searchText.length >= 2 && isSearching);

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center border-b border-border px-4 py-4">
        <TouchableOpacity
          className="mr-3 h-10 w-10 items-center justify-center rounded-full"
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        
        <Text className="flex-1 text-xl font-bold text-foreground">
          New Chat
        </Text>

        {isCreating && (
          <ActivityIndicator size="small" color="#6366f1" />
        )}
      </View>

      {/* Search Bar */}
      <View className="border-b border-border px-4 py-3">
        <View className="flex-row items-center rounded-full bg-muted px-4 py-3">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="ml-3 flex-1 text-foreground"
            placeholder="Search friends or add new..."
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

      {/* Results List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-2 text-muted-foreground">
            {searchText.length >= 2 ? "Searching..." : "Loading friends..."}
          </Text>
        </View>
      ) : displayData.length > 0 ? (
        <FlatList
          data={displayData}
          renderItem={renderFriendItem}
          keyExtractor={(item) => item.id}
          className="flex-1"
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}

      {/* Help Text */}
      <View className="border-t border-border px-4 py-3">
        <Text className="text-center text-xs text-muted-foreground">
          {searchText.length >= 2 
            ? "Search for users by name or email to start a conversation"
            : "Select a friend to start a new conversation"
          }
        </Text>
      </View>
    </SafeAreaView>
  );
} 
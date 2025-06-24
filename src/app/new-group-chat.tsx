/**
 * @file New Group Chat screen - allows users to select multiple friends to create group conversations.
 * Provides multi-select functionality and group creation interface.
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
  useCreateGroupConversationMutation,
} from "../store/slices/api-slice";
import type { Profile, Friend } from "../types/database";

export default function NewGroupChatScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");

  // Queries
  const { data: friends = [], isLoading: isLoadingFriends } = useGetFriendsQuery();
  const { data: searchResults = [], isLoading: isSearching } = useSearchUsersQuery(searchText, {
    skip: searchText.length < 2
  });

  // Mutations
  const [createGroupConversation, { isLoading: isCreating }] = useCreateGroupConversationMutation();

  /**
   * Get accepted friends for display
   */
  const acceptedFriends = friends.filter(friend => friend.status === 'accepted');

  /**
   * Get display data combining friends and search results
   */
  const getDisplayData = (): Array<Profile & { isFromSearch?: boolean; friendshipId?: string }> => {
    if (searchText.length >= 2) {
      // Show search results, filter out already selected ones
      return searchResults.filter(user => !selectedFriends.has(user.id)).map(user => ({
        ...user,
        isFromSearch: true
      }));
    } else {
      // Show accepted friends, filter out already selected ones
      return acceptedFriends
        .filter(friend => !selectedFriends.has(friend.friend!.id))
        .map(friend => ({
          ...friend.friend!,
          friendshipId: friend.id
        }));
    }
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
   * Get selected friends data for display
   */
  const getSelectedFriendsData = (): Profile[] => {
    const allFriends = [...acceptedFriends.map(f => f.friend!), ...searchResults];
    return Array.from(selectedFriends)
      .map(id => allFriends.find(f => f.id === id))
      .filter(Boolean) as Profile[];
  };

  /**
   * Create group conversation
   */
  const handleCreateGroupConversation = async () => {
    if (selectedFriends.size < 2) {
      Alert.alert("Minimum Participants", "Please select at least 2 friends to create a group conversation.");
      return;
    }

    try {
      const result = await createGroupConversation({ 
        participant_ids: Array.from(selectedFriends),
        group_name: groupName.trim() || undefined
      }).unwrap();
      
      // Navigate to the new group conversation
      const selectedFriendsData = getSelectedFriendsData();
      const participantNames = selectedFriendsData
        .map(f => f.display_name || f.email.split('@')[0])
        .slice(0, 2)
        .join(', ');
      
      const displayName = groupName.trim() || 
        (selectedFriendsData.length > 2 
          ? `${participantNames} and ${selectedFriendsData.length - 2} others`
          : participantNames);
      
      router.replace({
        pathname: "/chat/[id]",
        params: { 
          id: result.id,
          participantName: displayName,
          isGroup: "true"
        },
      });
    } catch (error) {
      console.error("Failed to create group conversation:", error);
      Alert.alert("Error", "Failed to create group conversation. Please try again.");
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Remove selected friend
   */
  const removeSelectedFriend = (friendId: string) => {
    const newSelected = new Set(selectedFriends);
    newSelected.delete(friendId);
    setSelectedFriends(newSelected);
  };

  /**
   * Render friend item
   */
  const renderFriendItem = ({ item: user }: { item: Profile & { isFromSearch?: boolean; friendshipId?: string } }) => {
    const isSelected = selectedFriends.has(user.id);
    
    return (
      <TouchableOpacity
        className="flex-row items-center border-b border-border bg-background px-4 py-4"
        onPress={() => toggleFriendSelection(user.id)}
        disabled={isCreating}
      >
        {/* Selection Indicator */}
        <View className={`h-6 w-6 rounded-full border-2 mr-3 items-center justify-center ${
          isSelected ? 'bg-primary border-primary' : 'border-gray-300'
        }`}>
          {isSelected && (
            <Ionicons name="checkmark" size={16} color="white" />
          )}
        </View>

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

        {/* Add indicator */}
        {!isSelected && (
          <View className="ml-3">
            <Ionicons name="add-circle-outline" size={20} color="#6366f1" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  /**
   * Render selected friend chip
   */
  const renderSelectedFriend = (friend: Profile) => (
    <View key={friend.id} className="flex-row items-center bg-primary rounded-full px-3 py-2 mr-2 mb-2">
      <Text className="text-sm font-medium text-primary-foreground mr-2">
        {friend.display_name || friend.email.split('@')[0]}
      </Text>
      <TouchableOpacity onPress={() => removeSelectedFriend(friend.id)}>
        <Ionicons name="close-circle" size={16} color="white" />
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
          <Ionicons name="people-outline" size={40} color="gray" />
        </View>
        <Text className="mt-4 text-lg font-semibold text-foreground">
          {searchText.length >= 2 ? "No users found" : "No friends available"}
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          {searchText.length >= 2 
            ? "Try searching for a different name or email"
            : "Add friends to create group conversations with them"
          }
        </Text>
      </View>
    </View>
  );

  const displayData = getDisplayData();
  const selectedFriendsData = getSelectedFriendsData();
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
        
        <View className="flex-1">
          <Text className="text-xl font-bold text-foreground">
            New Group Chat
          </Text>
          <Text className="text-sm text-muted-foreground">
            {selectedFriends.size} participant{selectedFriends.size !== 1 ? 's' : ''} selected
          </Text>
        </View>

        {selectedFriends.size >= 2 && (
          <TouchableOpacity 
            className={`rounded-full px-4 py-2 ${
              isCreating ? 'bg-gray-400' : 'bg-primary'
            }`}
            onPress={handleCreateGroupConversation}
            disabled={isCreating}
          >
            <Text className="text-sm font-semibold text-white">
              {isCreating ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Group Name Input */}
      <View className="border-b border-border px-4 py-3">
        <TextInput
          className="bg-muted rounded-full px-4 py-3 text-foreground"
          placeholder="Group name (optional)"
          placeholderTextColor="gray"
          value={groupName}
          onChangeText={setGroupName}
          maxLength={50}
        />
      </View>

      {/* Selected Friends */}
      {selectedFriendsData.length > 0 && (
        <View className="border-b border-border px-4 py-3">
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            Selected ({selectedFriends.size})
          </Text>
          <View className="flex-row flex-wrap">
            {selectedFriendsData.map(renderSelectedFriend)}
          </View>
        </View>
      )}

      {/* Search Bar */}
      <View className="border-b border-border px-4 py-3">
        <View className="flex-row items-center rounded-full bg-muted px-4 py-3">
          <Ionicons name="search-outline" size={20} color="gray" />
          <TextInput
            className="ml-3 flex-1 text-foreground"
            placeholder="Search friends to add..."
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

      {/* Friends List */}
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
          Select at least 2 friends to create a group conversation
        </Text>
      </View>
    </SafeAreaView>
  );
} 
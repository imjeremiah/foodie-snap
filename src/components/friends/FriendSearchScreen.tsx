/**
 * @file Friend Search Screen - comprehensive friend management interface.
 * Provides user search, friend requests, suggestions, and friend management.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useDebounce } from "use-debounce";
import {
  useSearchUsersQuery,
  useGetFriendSuggestionsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useRemoveFriendMutation,
  useBlockUserMutation,
  useUnblockUserMutation,
  useGetFriendshipStatusQuery,
  useGetMutualFriendsQuery,
} from "../../store/slices/api-slice";
import type { Profile } from "../../types/database";

interface FriendSearchScreenProps {
  onClose?: () => void;
}

interface UserItemProps {
  user: Profile;
  onUserPress?: (user: Profile) => void;
}

/**
 * Individual user item component with friend management actions
 */
function UserItem({ user, onUserPress }: UserItemProps) {
  const { data: friendshipStatus } = useGetFriendshipStatusQuery(user.id);
  const { data: mutualFriends = [] } = useGetMutualFriendsQuery(user.id);
  
  const [sendFriendRequest, { isLoading: isSending }] = useSendFriendRequestMutation();
  const [acceptFriendRequest, { isLoading: isAccepting }] = useAcceptFriendRequestMutation();
  const [rejectFriendRequest, { isLoading: isRejecting }] = useRejectFriendRequestMutation();
  const [removeFriend, { isLoading: isRemoving }] = useRemoveFriendMutation();
  const [blockUser, { isLoading: isBlocking }] = useBlockUserMutation();
  const [unblockUser, { isLoading: isUnblocking }] = useUnblockUserMutation();

  /**
   * Handle friend request action
   */
  const handleFriendAction = useCallback(async (action: string) => {
    try {
      switch (action) {
        case "send_request":
          await sendFriendRequest({ friend_id: user.id }).unwrap();
          Alert.alert("Success", `Friend request sent to ${user.display_name}`);
          break;
        case "accept":
          if (friendshipStatus?.friendship_id) {
            await acceptFriendRequest({ id: friendshipStatus.friendship_id }).unwrap();
            Alert.alert("Success", `${user.display_name} is now your friend!`);
          }
          break;
        case "reject":
          if (friendshipStatus?.friendship_id) {
            await rejectFriendRequest({ id: friendshipStatus.friendship_id }).unwrap();
            Alert.alert("Success", "Friend request rejected");
          }
          break;
        case "remove":
          Alert.alert(
            "Remove Friend",
            `Are you sure you want to remove ${user.display_name} as a friend?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Remove",
                style: "destructive",
                onPress: async () => {
                  await removeFriend({ friend_id: user.id }).unwrap();
                  Alert.alert("Success", `${user.display_name} has been removed from your friends`);
                }
              }
            ]
          );
          break;
        case "block":
          Alert.alert(
            "Block User",
            `Are you sure you want to block ${user.display_name}?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Block",
                style: "destructive",
                onPress: async () => {
                  await blockUser({ friend_id: user.id }).unwrap();
                  Alert.alert("Success", `${user.display_name} has been blocked`);
                }
              }
            ]
          );
          break;
        case "unblock":
          await unblockUser({ friend_id: user.id }).unwrap();
          Alert.alert("Success", `${user.display_name} has been unblocked`);
          break;
        default:
          break;
      }
    } catch (error) {
      Alert.alert("Error", "Failed to perform action. Please try again.");
    }
  }, [user, friendshipStatus, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend, blockUser, unblockUser]);

  // Calculate loading state
  const isLoading = isSending || isAccepting || isRejecting || isRemoving || isBlocking || isUnblocking;

  /**
   * Get action button configuration based on friendship status
   */
  const getActionButton = () => {
    const status = friendshipStatus?.status || "none";

    switch (status) {
      case "none":
        return {
          label: "Add Friend",
          action: "send_request",
          style: "bg-primary",
          textStyle: "text-primary-foreground",
          icon: "person-add" as const,
        };
      case "pending_sent":
        return {
          label: "Request Sent",
          action: null,
          style: "bg-muted",
          textStyle: "text-muted-foreground",
          icon: "hourglass" as const,
        };
      case "pending_received":
        return {
          label: "Accept",
          action: "accept",
          style: "bg-green-500",
          textStyle: "text-white",
          icon: "checkmark" as const,
        };
      case "accepted":
        return {
          label: "Friends",
          action: "remove",
          style: "bg-muted",
          textStyle: "text-muted-foreground",
          icon: "people" as const,
        };
      case "blocked":
        return {
          label: "Unblock",
          action: "unblock",
          style: "bg-red-500",
          textStyle: "text-white",
          icon: "ban" as const,
        };
      default:
        return null;
    }
  };

  const actionButton = getActionButton();

  return (
    <TouchableOpacity
      className="flex-row items-center border-b border-border bg-card p-4"
      onPress={() => onUserPress?.(user)}
    >
      {/* Avatar */}
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Text className="text-lg font-bold text-primary-foreground">
          {user.display_name?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>

      {/* User Info */}
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-foreground">
          {user.display_name || "Unknown User"}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {user.email}
        </Text>
        {mutualFriends.length > 0 && (
          <Text className="text-xs text-blue-500">
            {mutualFriends.length} mutual friend{mutualFriends.length > 1 ? "s" : ""}
          </Text>
        )}
      </View>

      {/* Action Buttons */}
      <View className="flex-row items-center space-x-2">
        {friendshipStatus?.status === "pending_received" && (
          <TouchableOpacity
            className="rounded-md bg-red-500 p-2"
            onPress={() => handleFriendAction("reject")}
            disabled={isRejecting}
          >
            <Ionicons name="close" size={16} color="white" />
          </TouchableOpacity>
        )}
        
        {actionButton && (
          <TouchableOpacity
            className={`rounded-md px-3 py-2 ${actionButton.style} ${
              !actionButton.action ? "opacity-50" : ""
            }`}
            onPress={actionButton.action ? () => handleFriendAction(actionButton.action!) : undefined}
            disabled={!actionButton.action || isLoading}
          >
            <View className="flex-row items-center space-x-1">
              <Ionicons 
                name={actionButton.icon} 
                size={14} 
                color={actionButton.textStyle.includes("white") ? "white" : "gray"} 
              />
              <Text className={`text-sm font-medium ${actionButton.textStyle}`}>
                {actionButton.label}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        
        {friendshipStatus?.status === "accepted" && (
          <TouchableOpacity
            className="rounded-md bg-red-500 p-2"
            onPress={() => handleFriendAction("block")}
            disabled={isBlocking}
          >
            <Ionicons name="ban" size={16} color="white" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

/**
 * Main friend search screen component
 */
export default function FriendSearchScreen({ onClose }: FriendSearchScreenProps) {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText] = useDebounce(searchText, 300);
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const { data: searchResults = [], isLoading: isSearching } = useSearchUsersQuery(
    debouncedSearchText,
    { skip: debouncedSearchText.length < 2 }
  );
  const { data: suggestions = [], isLoading: isLoadingSuggestions, refetch: refetchSuggestions } = useGetFriendSuggestionsQuery();

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetchSuggestions();
    } finally {
      setRefreshing(false);
    }
  }, [refetchSuggestions]);

  /**
   * Handle user profile press
   */
  const handleUserPress = useCallback((user: Profile) => {
    // Navigate to user profile or show user details
    Alert.alert(
      user.display_name || "User Profile",
      user.bio || "No bio available",
      [
        { text: "Close", style: "cancel" },
        { text: "View Profile", onPress: () => {
          // TODO: Navigate to user profile screen
          console.log("Navigate to user profile:", user.id);
        }}
      ]
    );
  }, []);

  /**
   * Render search results
   */
  const renderSearchResults = () => {
    if (isSearching) {
      return (
        <View className="p-4">
          <Text className="text-center text-muted-foreground">Searching...</Text>
        </View>
      );
    }

    if (debouncedSearchText.length >= 2 && searchResults.length === 0) {
      return (
        <View className="p-4">
          <Text className="text-center text-muted-foreground">
            No users found matching "{debouncedSearchText}"
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserItem user={item} onUserPress={handleUserPress} />
        )}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  /**
   * Render friend suggestions
   */
  const renderSuggestions = () => {
    if (isLoadingSuggestions) {
      return (
        <View className="p-4">
          <Text className="text-center text-muted-foreground">Loading suggestions...</Text>
        </View>
      );
    }

    if (suggestions.length === 0) {
      return (
        <View className="p-4">
          <Text className="text-center text-muted-foreground">
            No friend suggestions available
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={suggestions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <UserItem user={item} onUserPress={handleUserPress} />
        )}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-card px-4 py-3">
        <TouchableOpacity onPress={onClose || (() => router.back())}>
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-bold text-foreground">Find Friends</Text>
      </View>

      {/* Search Bar */}
      <View className="border-b border-border bg-card p-4">
        <View className="flex-row items-center rounded-lg bg-muted px-3 py-2">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            className="ml-2 flex-1 text-foreground"
            placeholder="Search by name or email..."
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

      {/* Content */}
      <View className="flex-1">
        {debouncedSearchText.length >= 2 ? (
          <View className="flex-1">
            <View className="border-b border-border bg-card px-4 py-2">
              <Text className="font-semibold text-foreground">Search Results</Text>
            </View>
            {renderSearchResults()}
          </View>
        ) : (
          <View className="flex-1">
            <View className="border-b border-border bg-card px-4 py-2">
              <Text className="font-semibold text-foreground">Suggested Friends</Text>
            </View>
            {renderSuggestions()}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
} 
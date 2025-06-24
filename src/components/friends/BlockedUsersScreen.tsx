/**
 * @file Blocked Users Screen - manage blocked users.
 * Displays list of blocked users with unblock functionality.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useGetFriendsQuery,
  useUnblockUserMutation,
} from "../../store/slices/api-slice";
import type { Friend } from "../../types/database";

/**
 * Blocked user item component
 */
function BlockedUserItem({ friend }: { friend: Friend }) {
  const [unblockUser, { isLoading }] = useUnblockUserMutation();

  /**
   * Handle unblock user
   */
  const handleUnblock = () => {
    if (!friend.friend) return;

    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${friend.friend.display_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              await unblockUser({ friend_id: friend.friend_id }).unwrap();
              Alert.alert("Success", `${friend.friend?.display_name} has been unblocked`);
            } catch (error) {
              Alert.alert("Error", "Failed to unblock user");
            }
          }
        }
      ]
    );
  };

  if (!friend.friend) return null;

  return (
    <View className="flex-row items-center border-b border-border bg-card p-4">
      {/* Avatar */}
      <View className="h-12 w-12 items-center justify-center rounded-full bg-red-500">
        <Text className="text-lg font-bold text-white">
          {friend.friend.display_name?.charAt(0)?.toUpperCase() || "?"}
        </Text>
      </View>

      {/* User Info */}
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-foreground">
          {friend.friend.display_name || "Unknown User"}
        </Text>
        <Text className="text-sm text-muted-foreground">
          {friend.friend.email}
        </Text>
        <Text className="text-xs text-red-500">Blocked</Text>
      </View>

      {/* Unblock Button */}
      <TouchableOpacity
        className={`rounded-md bg-primary px-4 py-2 ${isLoading ? "opacity-50" : ""}`}
        onPress={handleUnblock}
        disabled={isLoading}
      >
        <Text className="text-sm font-medium text-primary-foreground">
          {isLoading ? "..." : "Unblock"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Main blocked users screen component
 */
export default function BlockedUsersScreen() {
  const { data: friends = [], isLoading } = useGetFriendsQuery();
  
  // Filter only blocked users
  const blockedUsers = friends.filter(friend => friend.status === "blocked");

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center p-8">
      <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
        <Ionicons name="shield-checkmark" size={32} color="gray" />
      </View>
      <Text className="mt-4 text-lg font-semibold text-foreground">No Blocked Users</Text>
      <Text className="mt-2 text-center text-muted-foreground">
        You haven't blocked anyone yet. Blocked users won't be able to send you messages or see your profile.
      </Text>
    </View>
  );

  /**
   * Render blocked user item
   */
  const renderItem = ({ item }: { item: Friend }) => (
    <BlockedUserItem friend={item} />
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-card px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-bold text-foreground">Blocked Users</Text>
      </View>

      {/* Content */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading...</Text>
        </View>
      ) : blockedUsers.length === 0 ? (
        renderEmptyState()
      ) : (
        <View className="flex-1">
          {/* Info Banner */}
          <View className="border-b border-border bg-yellow-50 p-4">
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={20} color="#F59E0B" />
              <Text className="ml-2 text-sm text-yellow-800">
                Blocked users cannot send you messages, see your profile, or add you as a friend.
              </Text>
            </View>
          </View>

          {/* Blocked Users List */}
          <FlatList
            data={blockedUsers}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View className="h-px bg-border" />}
          />
        </View>
      )}
    </SafeAreaView>
  );
} 
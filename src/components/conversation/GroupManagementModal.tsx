/**
 * @file Group Management Modal - provides options for managing group conversations.
 * Includes features like viewing participants, adding/removing members, and group settings.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useGetConversationParticipantsQuery,
  useAddParticipantToConversationMutation,
  useRemoveParticipantFromConversationMutation,
  useGetFriendsQuery,
  useLeaveConversationMutation,
} from "../../store/slices/api-slice";
import { useAuth } from "../../contexts/AuthContext";
import type { Profile } from "../../types/database";

interface GroupManagementModalProps {
  visible: boolean;
  onClose: () => void;
  conversationId: string;
  groupName: string;
}

export default function GroupManagementModal({
  visible,
  onClose,
  conversationId,
  groupName,
}: GroupManagementModalProps) {
  const { user } = useAuth();
  const [showAddMembers, setShowAddMembers] = useState(false);
  
  const { data: participants = [], refetch: refetchParticipants } = useGetConversationParticipantsQuery(conversationId);
  const { data: friends = [] } = useGetFriendsQuery();
  const [addParticipant, { isLoading: isAdding }] = useAddParticipantToConversationMutation();
  const [removeParticipant, { isLoading: isRemoving }] = useRemoveParticipantFromConversationMutation();
  const [leaveConversation, { isLoading: isLeaving }] = useLeaveConversationMutation();

  /**
   * Get friends who are not already in the group
   */
  const getAvailableFriends = () => {
    const participantIds = new Set(participants.map(p => p.id));
    return friends
      .filter(friend => friend.status === 'accepted' && !participantIds.has(friend.friend!.id))
      .map(friend => friend.friend!);
  };

  /**
   * Handle adding a participant
   */
  const handleAddParticipant = async (userId: string) => {
    try {
      await addParticipant({ conversation_id: conversationId, user_id: userId }).unwrap();
      refetchParticipants();
      Alert.alert("Success", "Participant added to the group");
    } catch (error) {
      console.error("Failed to add participant:", error);
      Alert.alert("Error", "Failed to add participant. Please try again.");
    }
  };

  /**
   * Handle removing a participant
   */
  const handleRemoveParticipant = (participant: Profile) => {
    if (participant.id === user?.id) {
      // User is trying to remove themselves - show leave confirmation
      handleLeaveGroup();
      return;
    }

    Alert.alert(
      "Remove Participant",
      `Remove ${participant.display_name || participant.email} from the group?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeParticipant({ conversation_id: conversationId, user_id: participant.id }).unwrap();
              refetchParticipants();
              Alert.alert("Success", "Participant removed from the group");
            } catch (error) {
              console.error("Failed to remove participant:", error);
              Alert.alert("Error", "Failed to remove participant. Please try again.");
            }
          },
        },
      ]
    );
  };

  /**
   * Handle leaving the group
   */
  const handleLeaveGroup = () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group conversation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveConversation(conversationId).unwrap();
              Alert.alert("Success", "Left group successfully");
              onClose();
            } catch (error) {
              console.error("Failed to leave group:", error);
              Alert.alert("Error", "Failed to leave group. Please try again.");
            }
          },
        },
      ]
    );
  };

  /**
   * Render participant item
   */
  const renderParticipant = ({ item: participant }: { item: Profile }) => {
    const isCurrentUser = participant.id === user?.id;
    
    return (
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        {/* Avatar */}
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
          <Text className="text-lg font-bold text-primary-foreground">
            {participant.display_name?.charAt(0) || participant.email.charAt(0) || "?"}
          </Text>
        </View>

        {/* User Info */}
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-foreground">
            {participant.display_name || participant.email.split('@')[0]}
            {isCurrentUser && " (You)"}
          </Text>
          <Text className="text-sm text-muted-foreground" numberOfLines={1}>
            {participant.email}
          </Text>
        </View>

        {/* Remove Button */}
        <TouchableOpacity
          className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-red-100"
          onPress={() => handleRemoveParticipant(participant)}
          disabled={isRemoving}
        >
          <Ionicons 
            name={isCurrentUser ? "exit-outline" : "close"} 
            size={16} 
            color="#ef4444" 
          />
        </TouchableOpacity>
      </View>
    );
  };

  /**
   * Render available friend for adding
   */
  const renderAvailableFriend = ({ item: friend }: { item: Profile }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-border"
      onPress={() => handleAddParticipant(friend.id)}
      disabled={isAdding}
    >
      {/* Avatar */}
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Text className="text-lg font-bold text-primary-foreground">
          {friend.display_name?.charAt(0) || friend.email.charAt(0) || "?"}
        </Text>
      </View>

      {/* User Info */}
      <View className="ml-3 flex-1">
        <Text className="font-semibold text-foreground">
          {friend.display_name || friend.email.split('@')[0]}
        </Text>
        <Text className="text-sm text-muted-foreground" numberOfLines={1}>
          {friend.email}
        </Text>
      </View>

      {/* Add Button */}
      <View className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-green-100">
        <Ionicons name="add" size={16} color="#22c55e" />
      </View>
    </TouchableOpacity>
  );

  const availableFriends = getAvailableFriends();
  const isLoading = isAdding || isRemoving || isLeaving;

  if (showAddMembers) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddMembers(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-xl bg-background pb-8 max-h-[80%]">
            {/* Header */}
            <View className="flex-row items-center justify-between border-b border-border px-4 py-4">
              <TouchableOpacity onPress={() => setShowAddMembers(false)}>
                <Ionicons name="arrow-back" size={24} color="gray" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">
                Add Members
              </Text>
              <View style={{ width: 24 }} />
            </View>

            {/* Available Friends List */}
            {availableFriends.length > 0 ? (
              <FlatList
                data={availableFriends}
                renderItem={renderAvailableFriend}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View className="flex-1 items-center justify-center px-8">
                <View className="items-center">
                  <Ionicons name="people-outline" size={40} color="gray" />
                  <Text className="mt-4 text-lg font-semibold text-foreground">
                    No friends to add
                  </Text>
                  <Text className="mt-2 text-center text-muted-foreground">
                    All your friends are already in this group
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-xl bg-background pb-8 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border px-4 py-4">
            <Text className="text-lg font-semibold text-foreground">
              Group Info
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Group Info */}
            <View className="flex-row items-center border-b border-border px-4 py-4">
              <View className="h-16 w-16 items-center justify-center rounded-full bg-green-500">
                <Ionicons name="people" size={32} color="white" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xl font-bold text-foreground">
                  {groupName}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {participants.length} participants
                </Text>
              </View>
            </View>

            {/* Add Members Button */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 border-b border-border"
              onPress={() => setShowAddMembers(true)}
              disabled={availableFriends.length === 0}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Ionicons name="person-add" size={20} color="#22c55e" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-foreground">Add Members</Text>
                <Text className="text-sm text-muted-foreground">
                  {availableFriends.length} friends available
                </Text>
              </View>
            </TouchableOpacity>

            {/* Participants Section */}
            <View className="px-4 py-3 border-b border-border">
              <Text className="text-sm font-medium text-muted-foreground">
                PARTICIPANTS ({participants.length})
              </Text>
            </View>

            {/* Participants List */}
            {participants.map((participant) => (
              <View key={participant.id}>
                {renderParticipant({ item: participant })}
              </View>
            ))}

            {/* Leave Group Button */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4 mt-4"
              onPress={handleLeaveGroup}
              disabled={isLeaving}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Ionicons name="exit" size={20} color="#ef4444" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-red-600">Leave Group</Text>
                <Text className="text-sm text-muted-foreground">
                  Remove yourself from this group
                </Text>
              </View>
              {isLeaving && (
                <View className="ml-2">
                  <Ionicons name="hourglass" size={16} color="#ef4444" />
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* Loading Overlay */}
          {isLoading && (
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <View className="rounded-lg bg-background p-4">
                <Text className="text-muted-foreground">Processing...</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
} 
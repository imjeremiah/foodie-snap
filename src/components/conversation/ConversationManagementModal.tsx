/**
 * @file Conversation Management Modal - provides options for managing conversations.
 * Includes features like archiving, deleting, muting, and other conversation settings.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useDeleteConversationMutation,
  useArchiveConversationMutation,
  useLeaveConversationMutation,
} from "../../store/slices/api-slice";
import type { ConversationWithDetails } from "../../types/database";

interface ConversationManagementModalProps {
  visible: boolean;
  onClose: () => void;
  conversation: ConversationWithDetails | null;
  onNavigateToChat?: () => void;
}

export default function ConversationManagementModal({
  visible,
  onClose,
  conversation,
  onNavigateToChat,
}: ConversationManagementModalProps) {
  const [deleteConversation, { isLoading: isDeleting }] = useDeleteConversationMutation();
  const [archiveConversation, { isLoading: isArchiving }] = useArchiveConversationMutation();
  const [leaveConversation, { isLoading: isLeaving }] = useLeaveConversationMutation();

  if (!conversation) return null;

  /**
   * Handle conversation archiving
   */
  const handleArchive = async () => {
    try {
      await archiveConversation({
        conversation_id: conversation.id,
        is_archived: !conversation.is_archived,
      }).unwrap();
      
      Alert.alert(
        "Success",
        conversation.is_archived ? "Conversation unarchived" : "Conversation archived"
      );
      onClose();
    } catch (error) {
      console.error("Failed to archive conversation:", error);
      Alert.alert("Error", "Failed to archive conversation. Please try again.");
    }
  };

  /**
   * Handle conversation deletion with confirmation
   */
  const handleDelete = () => {
    Alert.alert(
      "Delete Conversation",
      `Are you sure you want to delete your conversation with ${conversation.other_participant.display_name}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteConversation(conversation.id).unwrap();
              Alert.alert("Success", "Conversation deleted successfully");
              onClose();
            } catch (error) {
              console.error("Failed to delete conversation:", error);
              Alert.alert("Error", "Failed to delete conversation. Please try again.");
            }
          },
        },
      ]
    );
  };

  /**
   * Handle leaving conversation
   */
  const handleLeave = () => {
    Alert.alert(
      "Leave Conversation",
      `Are you sure you want to leave this conversation with ${conversation.other_participant.display_name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              await leaveConversation(conversation.id).unwrap();
              Alert.alert("Success", "Left conversation successfully");
              onClose();
            } catch (error) {
              console.error("Failed to leave conversation:", error);
              Alert.alert("Error", "Failed to leave conversation. Please try again.");
            }
          },
        },
      ]
    );
  };

  /**
   * Handle viewing conversation details
   */
  const handleViewDetails = () => {
    Alert.alert(
      "Conversation Details",
      `Conversation with ${conversation.other_participant.display_name}\n\n` +
      `Email: ${conversation.other_participant.email}\n` +
      `Created: ${new Date(conversation.created_at).toLocaleDateString()}\n` +
      `Last active: ${new Date(conversation.last_message_time).toLocaleDateString()}\n` +
      `Unread messages: ${conversation.unread_count}`,
      [{ text: "OK" }]
    );
  };

  /**
   * Handle opening conversation
   */
  const handleOpenConversation = () => {
    onClose();
    onNavigateToChat?.();
  };

  const isLoading = isDeleting || isArchiving || isLeaving;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="rounded-t-xl bg-background pb-8">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border px-4 py-4">
            <Text className="text-lg font-semibold text-foreground">
              Conversation Options
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="gray" />
            </TouchableOpacity>
          </View>

          {/* Conversation Info */}
          <View className="flex-row items-center border-b border-border px-4 py-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
              <Text className="text-lg font-bold text-primary-foreground">
                {conversation.other_participant.display_name?.charAt(0) || "?"}
              </Text>
            </View>
            <View className="ml-3 flex-1">
              <Text className="font-semibold text-foreground">
                {conversation.other_participant.display_name || "Unknown User"}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {conversation.other_participant.email}
              </Text>
            </View>
            {conversation.unread_count > 0 && (
              <View className="min-w-[20px] items-center justify-center rounded-full bg-primary px-2 py-1">
                <Text className="text-xs font-bold text-primary-foreground">
                  {conversation.unread_count}
                </Text>
              </View>
            )}
          </View>

          {/* Options */}
          <ScrollView className="max-h-96">
            {/* Open Conversation */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={handleOpenConversation}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Ionicons name="chatbubble" size={20} color="#3b82f6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-foreground">Open Conversation</Text>
                <Text className="text-sm text-muted-foreground">
                  View and send messages
                </Text>
              </View>
            </TouchableOpacity>

            {/* View Details */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={handleViewDetails}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Ionicons name="information-circle" size={20} color="#6b7280" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-foreground">View Details</Text>
                <Text className="text-sm text-muted-foreground">
                  See conversation information
                </Text>
              </View>
            </TouchableOpacity>

            {/* Archive/Unarchive */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={handleArchive}
              disabled={isArchiving}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <Ionicons 
                  name={conversation.is_archived ? "archive" : "archive-outline"} 
                  size={20} 
                  color="#eab308" 
                />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-foreground">
                  {conversation.is_archived ? "Unarchive" : "Archive"}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  {conversation.is_archived 
                    ? "Move back to active conversations"
                    : "Hide from main conversation list"
                  }
                </Text>
              </View>
              {isArchiving && (
                <View className="ml-2">
                  <Ionicons name="hourglass" size={16} color="#eab308" />
                </View>
              )}
            </TouchableOpacity>

            {/* Mute (Placeholder) */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={() => Alert.alert("Coming Soon", "Mute functionality will be added in a future update.")}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Ionicons name="notifications-off" size={20} color="#8b5cf6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-foreground">Mute</Text>
                <Text className="text-sm text-muted-foreground">
                  Turn off notifications for this conversation
                </Text>
              </View>
            </TouchableOpacity>

            {/* Leave Conversation */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={handleLeave}
              disabled={isLeaving}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                <Ionicons name="exit" size={20} color="#f97316" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-foreground">Leave Conversation</Text>
                <Text className="text-sm text-muted-foreground">
                  Remove yourself from this conversation
                </Text>
              </View>
              {isLeaving && (
                <View className="ml-2">
                  <Ionicons name="hourglass" size={16} color="#f97316" />
                </View>
              )}
            </TouchableOpacity>

            {/* Delete Conversation */}
            <TouchableOpacity
              className="flex-row items-center px-4 py-4"
              onPress={handleDelete}
              disabled={isDeleting}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Ionicons name="trash" size={20} color="#ef4444" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-medium text-red-600">Delete Conversation</Text>
                <Text className="text-sm text-muted-foreground">
                  Permanently delete this conversation
                </Text>
              </View>
              {isDeleting && (
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
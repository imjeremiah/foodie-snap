/**
 * @file Preview screen - displays captured photo with action buttons.
 * Shows the captured image and provides Send/Discard functionality.
 */

import React, { useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useGetConversationsQuery, useSendPhotoMessageMutation, useSaveToJournalMutation } from "../store/slices/api-slice";
import type { ConversationWithDetails } from "../types/database";

export default function PreviewScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  
  // State for send modal and journal saving
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingToJournal, setSavingToJournal] = useState(false);

  // API hooks
  const { data: conversations = [], isLoading: loadingConversations } = useGetConversationsQuery();
  const [sendPhotoMessage] = useSendPhotoMessageMutation();
  const [saveToJournal] = useSaveToJournalMutation();

  /**
   * Handle discard action - return to camera
   */
  const handleDiscard = () => {
    Alert.alert(
      "Discard Photo",
      "Are you sure you want to discard this photo?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive",
          onPress: () => router.back()
        },
      ]
    );
  };

  /**
   * Handle send action - show conversation selection modal
   */
  const handleSend = () => {
    if (conversations.length === 0) {
      Alert.alert(
        "No Conversations",
        "You need to have at least one conversation to send photos. Start a conversation first!",
        [{ text: "OK" }]
      );
      return;
    }
    setShowSendModal(true);
  };

  /**
   * Send photo to a specific conversation
   */
  const sendToConversation = async (conversation: ConversationWithDetails) => {
    if (!imageUri) return;

    setSending(true);
    try {
      await sendPhotoMessage({
        conversation_id: conversation.id,
        imageUri,
        options: { quality: 0.8 }
      }).unwrap();

      Alert.alert(
        "Photo Sent!",
        `Photo sent to ${conversation.other_participant.display_name || 'your friend'}`,
        [{ text: "OK", onPress: () => router.back() }]
      );
      setShowSendModal(false);
    } catch (error) {
      console.error("Failed to send photo:", error);
      Alert.alert(
        "Send Failed",
        "Failed to send photo. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle saving to journal
   */
  const handleSaveToJournal = async () => {
    if (!imageUri) return;

    setSavingToJournal(true);
    try {
      await saveToJournal({
        imageUri,
        content_type: 'photo',
        options: { quality: 0.8 }
      }).unwrap();

      Alert.alert(
        "Saved to Journal!",
        "Your photo has been saved to your journal.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to save to journal:", error);
      Alert.alert(
        "Save Failed",
        "Failed to save photo to journal. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSavingToJournal(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  if (!imageUri) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="text-center text-xl font-semibold text-foreground">
              No Image Found
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Please go back and take a photo
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-md bg-primary px-4 py-3"
              onPress={handleBack}
            >
              <Text className="text-center font-semibold text-primary-foreground">
                Back to Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header with back button */}
      <View className="absolute top-0 left-0 right-0 z-10 pt-12 pb-4">
        <View className="flex-row items-center justify-between px-4">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">Preview</Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Image display */}
      <View className="flex-1 items-center justify-center">
        <Image
          source={{ uri: imageUri }}
          className="h-full w-full"
          resizeMode="contain"
        />
      </View>

      {/* Bottom action buttons */}
      <View className="absolute bottom-0 left-0 right-0 pb-8">
        <View className="flex-row items-center justify-center space-x-4 px-4">
          {/* Discard button */}
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-black/50 py-4"
            onPress={handleDiscard}
          >
            <View className="items-center">
              <Ionicons name="trash-outline" size={24} color="white" />
              <Text className="mt-1 text-sm font-medium text-white">
                Discard
              </Text>
            </View>
          </TouchableOpacity>

          {/* Save to Journal button */}
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-green-600 py-4"
            onPress={handleSaveToJournal}
            disabled={savingToJournal}
          >
            <View className="items-center">
              {savingToJournal ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="bookmark-outline" size={24} color="white" />
              )}
              <Text className="mt-1 text-sm font-medium text-white">
                {savingToJournal ? "Saving..." : "Journal"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Send button */}
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-primary py-4"
            onPress={handleSend}
            disabled={sending}
          >
            <View className="items-center">
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={24} color="white" />
              )}
              <Text className="mt-1 text-sm font-medium text-white">
                {sending ? "Sending..." : "Send"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSendModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Text className="text-primary">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">Send Photo</Text>
              <View className="w-12" />
            </View>

            {/* Conversations List */}
            <View className="flex-1">
              {loadingConversations ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" />
                  <Text className="mt-2 text-muted-foreground">Loading conversations...</Text>
                </View>
              ) : conversations.length === 0 ? (
                <View className="flex-1 items-center justify-center px-4">
                  <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                  <Text className="mt-4 text-center text-xl font-semibold text-foreground">
                    No Conversations
                  </Text>
                  <Text className="mt-2 text-center text-muted-foreground">
                    Start a conversation from the Chat tab to send photos
                  </Text>
                </View>
              ) : (
                <ScrollView className="flex-1">
                  {conversations.map((conversation) => (
                    <TouchableOpacity
                      key={conversation.id}
                      className="flex-row items-center border-b border-border px-4 py-4"
                      onPress={() => sendToConversation(conversation)}
                      disabled={sending}
                    >
                      {/* Avatar */}
                      <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-primary">
                        {conversation.other_participant.avatar_url ? (
                          <Image
                            source={{ uri: conversation.other_participant.avatar_url }}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <Text className="text-lg font-semibold text-primary-foreground">
                            {(conversation.other_participant.display_name || conversation.other_participant.email)
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {/* Conversation Info */}
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {conversation.other_participant.display_name || 
                           conversation.other_participant.email.split('@')[0]}
                        </Text>
                        <Text className="mt-1 text-sm text-muted-foreground" numberOfLines={1}>
                          {conversation.last_message_preview}
                        </Text>
                      </View>

                      {/* Send indicator */}
                      {sending ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
} 
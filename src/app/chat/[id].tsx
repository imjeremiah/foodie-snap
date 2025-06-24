/**
 * @file Individual chat thread screen - displays messages and messaging interface.
 * Shows conversation history with chat bubbles and provides text input for new messages.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";

// Mock messages data for UI demonstration
const mockMessages = [
  {
    id: "1",
    content: "Hey! Just saw your latest food post 🔥",
    sender_id: "other",
    created_at: "2023-12-23T10:30:00Z",
    message_type: "text" as const,
  },
  {
    id: "2",
    content: "Thanks! It was my first time making overnight oats",
    sender_id: "me",
    created_at: "2023-12-23T10:32:00Z", 
    message_type: "text" as const,
  },
  {
    id: "3",
    content: "They look amazing! Can you share the recipe?",
    sender_id: "other",
    created_at: "2023-12-23T10:35:00Z",
    message_type: "text" as const,
  },
  {
    id: "4",
    content: "Of course! 1 cup oats, 1 cup almond milk, 1 tbsp chia seeds, 1 tsp honey, berries on top 😋",
    sender_id: "me",
    created_at: "2023-12-23T10:37:00Z",
    message_type: "text" as const,
  },
  {
    id: "5",
    content: "Perfect! I'll try this tomorrow morning",
    sender_id: "other",
    created_at: "2023-12-23T10:40:00Z",
    message_type: "text" as const,
  },
  {
    id: "6",
    content: "Let me know how it turns out! 👍",
    sender_id: "me",
    created_at: "2023-12-23T10:42:00Z",
    message_type: "text" as const,
  },
];

export default function ChatThreadScreen() {
  const router = useRouter();
  const { id, participantName } = useLocalSearchParams<{
    id: string;
    participantName: string;
  }>();
  
  const [messageText, setMessageText] = useState("");

  /**
   * Handle sending a new message
   */
  const handleSendMessage = () => {
    if (messageText.trim()) {
      // This will be implemented with real message sending in next phase
      console.log("Sending message:", messageText);
      setMessageText("");
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Render individual message bubble
   */
  const renderMessage = ({ item: message }: { item: typeof mockMessages[0] }) => {
    const isMe = message.sender_id === "me";
    
    return (
      <View
        className={`mb-3 flex-row ${isMe ? "justify-end" : "justify-start"} px-4`}
      >
        <View className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
          {/* Message bubble */}
          <View
            className={`rounded-2xl px-4 py-3 ${
              isMe
                ? "rounded-br-md bg-primary"
                : "rounded-bl-md bg-muted"
            }`}
          >
            <Text
              className={`text-sm ${
                isMe ? "text-primary-foreground" : "text-foreground"
              }`}
            >
              {message.content}
            </Text>
          </View>
          
          {/* Timestamp */}
          <Text className="mt-1 text-xs text-muted-foreground">
            {formatTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-8">
      <View className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-primary">
          <Text className="text-xl font-bold text-primary-foreground">
            {participantName?.charAt(0) || "?"}
          </Text>
        </View>
        <Text className="mt-4 text-lg font-semibold text-foreground">
          Start the conversation
        </Text>
        <Text className="mt-2 text-center text-muted-foreground">
          Send a message to {participantName} to get started
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center border-b border-border bg-background px-4 py-4">
          <TouchableOpacity
            className="mr-3 h-10 w-10 items-center justify-center rounded-full"
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="gray" />
          </TouchableOpacity>
          
          <View className="h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Text className="font-bold text-primary-foreground">
              {participantName?.charAt(0) || "?"}
            </Text>
          </View>
          
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-foreground">
              {participantName || "Unknown User"}
            </Text>
            <Text className="text-xs text-green-500">Online</Text>
          </View>
          
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full">
            <Ionicons name="videocam-outline" size={24} color="gray" />
          </TouchableOpacity>
          
          <TouchableOpacity className="ml-2 h-10 w-10 items-center justify-center rounded-full">
            <Ionicons name="call-outline" size={24} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Messages List */}
        {mockMessages.length > 0 ? (
          <FlatList
            data={mockMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingVertical: 16 }}
          />
        ) : (
          renderEmptyState()
        )}

        {/* Message Input */}
        <View className="border-t border-border bg-background px-4 py-4">
          <View className="flex-row items-center space-x-3">
            {/* Camera button */}
            <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Ionicons name="camera-outline" size={20} color="gray" />
            </TouchableOpacity>
            
            {/* Text input */}
            <View className="flex-1 flex-row items-center rounded-full border border-border bg-muted px-4 py-2">
              <TextInput
                className="flex-1 text-sm text-foreground"
                placeholder="Type a message..."
                placeholderTextColor="gray"
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={500}
              />
              
              {messageText.trim() && (
                <TouchableOpacity
                  className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-primary"
                  onPress={handleSendMessage}
                >
                  <Ionicons name="send" size={16} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Emoji button */}
            {!messageText.trim() && (
              <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Ionicons name="happy-outline" size={20} color="gray" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 
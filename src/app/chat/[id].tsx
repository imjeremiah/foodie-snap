/**
 * @file Individual chat thread screen - displays messages and messaging interface.
 * Shows conversation history with chat bubbles and provides text input for new messages.
 */

import React, { useState, useEffect } from "react";
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
import { 
  useGetMessagesQuery, 
  useSendMessageMutation 
} from "../../store/slices/api-slice";
import { useSession } from "../../hooks/use-session";
import { subscribeToMessages, unsubscribeFromMessages } from "../../lib/realtime";

export default function ChatThreadScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { id, participantName } = useLocalSearchParams<{
    id: string;
    participantName: string;
  }>();
  
  const [messageText, setMessageText] = useState("");
  const { data: messages = [], isLoading } = useGetMessagesQuery(id!);
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();

  // Subscribe to real-time messages for this conversation
  useEffect(() => {
    if (id) {
      subscribeToMessages(id);
      return () => unsubscribeFromMessages(id);
    }
  }, [id]);

  /**
   * Handle sending a new message
   */
  const handleSendMessage = async () => {
    if (messageText.trim() && id && user) {
      try {
        await sendMessage({
          conversation_id: id,
          content: messageText.trim(),
          message_type: "text"
        }).unwrap();
        setMessageText("");
      } catch (error) {
        console.error("Failed to send message:", error);
      }
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
  const renderMessage = ({ item: message }: { item: any }) => {
    const isMe = message.sender_id === user?.id;
    
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
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Loading messages...</Text>
          </View>
        ) : messages.length > 0 ? (
          <FlatList
            data={messages}
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
                  className={`ml-2 h-8 w-8 items-center justify-center rounded-full ${
                    isSending ? "bg-muted" : "bg-primary"
                  }`}
                  onPress={handleSendMessage}
                  disabled={isSending}
                >
                  <Ionicons 
                    name={isSending ? "hourglass" : "send"} 
                    size={16} 
                    color="white" 
                  />
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
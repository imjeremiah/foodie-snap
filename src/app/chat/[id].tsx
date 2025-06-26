/**
 * @file Individual chat thread screen - displays messages and messaging interface.
 * Shows conversation history with chat bubbles and provides text input for new messages.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Image,
  Dimensions,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { 
  useGetMessagesQuery, 
  useSendMessageMutation,
  useMarkConversationAsReadMutation,
  useSetTypingStatusMutation,
  useSendSnapMessageMutation,
  useCleanupExpiredMessagesMutation,
  useGetConversationParticipantsQuery,
} from "../../store/slices/api-slice";
import { useAuth } from "../../contexts/AuthContext";
import { 
  subscribeToMessages, 
  unsubscribeFromMessages,
  subscribeToTypingIndicators,
  unsubscribeFromTypingIndicators,
} from "../../lib/realtime";
import SnapViewer from "../../components/messaging/SnapViewer";
import GroupManagementModal from "../../components/conversation/GroupManagementModal";

export default function ChatThreadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, participantName, isGroup } = useLocalSearchParams<{
    id: string;
    participantName: string;
    isGroup?: string;
  }>();
  
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [expiredMessages, setExpiredMessages] = useState<Set<string>>(new Set());
  const [showSnapViewer, setShowSnapViewer] = useState(false);
  const [selectedSnap, setSelectedSnap] = useState<any>(null);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { data: messages = [], isLoading } = useGetMessagesQuery(id!);
  const { data: participants = [] } = useGetConversationParticipantsQuery(id!, {
    skip: !id || isGroup !== "true"
  });
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation();
  const [markConversationAsRead] = useMarkConversationAsReadMutation();
  const [setTypingStatus] = useSetTypingStatusMutation();
  const [sendSnapMessage] = useSendSnapMessageMutation();
  const [cleanupExpiredMessages] = useCleanupExpiredMessagesMutation();

  // Subscribe to real-time messages and typing indicators
  useEffect(() => {
    if (id) {
      subscribeToMessages(id);
      subscribeToTypingIndicators(id, (typingUsers) => {
        // Check if other user is typing (not current user)
        const othersTyping = typingUsers.some(u => u.user_id !== user?.id && u.typing);
        setOtherUserTyping(othersTyping);
      });
      
      return () => {
        unsubscribeFromMessages(id);
        unsubscribeFromTypingIndicators(id);
      };
    }
  }, [id, user?.id]);

  // Mark conversation as read when messages are loaded
  useEffect(() => {
    if (messages.length > 0 && id) {
      markConversationAsRead(id);
    }
  }, [messages.length, id, markConversationAsRead]);

  // Handle message expiration
  useEffect(() => {
    const checkExpiredMessages = () => {
      const now = new Date();
      const newExpiredMessages = new Set(expiredMessages);
      
      messages.forEach(message => {
        if (message.expires_at && new Date(message.expires_at) < now) {
          newExpiredMessages.add(message.id);
        }
      });
      
      if (newExpiredMessages.size !== expiredMessages.size) {
        setExpiredMessages(newExpiredMessages);
      }
    };

    const interval = setInterval(checkExpiredMessages, 1000); // Check every second
    return () => clearInterval(interval);
  }, [messages, expiredMessages]);

  // Cleanup expired messages periodically
  useEffect(() => {
    const cleanup = setInterval(() => {
      cleanupExpiredMessages();
    }, 60000); // Cleanup every minute
    
    return () => clearInterval(cleanup);
  }, [cleanupExpiredMessages]);

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
        handleStopTyping();
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  /**
   * Handle sending a snap message
   */
  const handleSendSnap = () => {
    Alert.alert(
      "Send Snap",
      "Choose snap duration",
      [
        { text: "3 seconds", onPress: () => sendSnap(3) },
        { text: "5 seconds", onPress: () => sendSnap(5) },
        { text: "10 seconds", onPress: () => sendSnap(10) },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  /**
   * Send a snap message with expiration
   */
  const sendSnap = async (seconds: number) => {
    if (messageText.trim() && id && user) {
      try {
        await sendSnapMessage({
          conversation_id: id,
          content: messageText.trim(),
          expires_in_seconds: seconds
        }).unwrap();
        setMessageText("");
        handleStopTyping();
      } catch (error) {
        console.error("Failed to send snap:", error);
      }
    }
  };

  /**
   * Handle typing status
   */
  const handleStartTyping = () => {
    if (!isTyping && id) {
      setIsTyping(true);
      setTypingStatus({ conversation_id: id, is_typing: true });
    }
    
    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping();
    }, 3000) as unknown as NodeJS.Timeout; // Stop typing after 3 seconds of inactivity
  };

  /**
   * Handle stop typing
   */
  const handleStopTyping = () => {
    if (isTyping && id) {
      setIsTyping(false);
      setTypingStatus({ conversation_id: id, is_typing: false });
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  /**
   * Handle text input changes
   */
  const handleTextChange = (text: string) => {
    setMessageText(text);
    
    if (text.trim()) {
      handleStartTyping();
    } else {
      handleStopTyping();
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    handleStopTyping();
    router.back();
  };

  /**
   * Handle snap tap to open snap viewer
   */
  const handleSnapTap = useCallback((tappedMessage: any) => {
    if (tappedMessage.message_type !== 'snap') return;
    
    // Check if snap is still valid (not expired)
    if (expiredMessages.has(tappedMessage.id) || 
        (tappedMessage.expires_at && new Date(tappedMessage.expires_at) < new Date())) {
      Alert.alert("Snap Expired", "This snap has expired and can no longer be viewed.");
      return;
    }
    
    setSelectedSnap(tappedMessage);
    setShowSnapViewer(true);
  }, [expiredMessages]);

  /**
   * Handle snap viewer close
   */
  const handleSnapViewerClose = useCallback(() => {
    setShowSnapViewer(false);
    setSelectedSnap(null);
  }, []);

  /**
   * Handle snap completion - when viewing is finished
   */
  const handleSnapComplete = useCallback(() => {
    // Mark the message as expired locally since it was viewed
    if (selectedSnap) {
      setExpiredMessages(prev => new Set([...prev, selectedSnap.id]));
    }
  }, [selectedSnap]);

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  /**
   * Check if message is read by other user
   */
  const isMessageRead = (message: any) => {
    if (message.sender_id === user?.id) {
      // Check if other participants have read this message
      const readByOthers = Object.keys(message.read_by || {}).some(
        userId => userId !== user?.id
      );
      return readByOthers;
    }
    return false;
  };

  /**
   * Get time remaining for expiring message
   */
  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
    return remaining;
  };

  /**
   * Render individual message bubble
   */
  const renderMessage = ({ item: message }: { item: any }) => {
    const isMe = message.sender_id === user?.id;
    const isImage = message.message_type === 'image' && message.image_url;
    const isSnap = message.message_type === 'snap';
    const isExpired = expiredMessages.has(message.id);
    const isRead = isMessageRead(message);
    const screenWidth = Dimensions.get('window').width;
    const imageMaxWidth = screenWidth * 0.6;
    
    // Don't render expired messages
    if (isExpired || (message.expires_at && new Date(message.expires_at) < new Date())) {
      return null;
    }

    const timeRemaining = message.expires_at ? getTimeRemaining(message.expires_at) : null;
    
    return (
      <View
        className={`mb-3 flex-row ${isMe ? "justify-end" : "justify-start"} px-4`}
      >
        <View className={`max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
          {/* Message bubble */}
          <TouchableOpacity
            className={`rounded-2xl ${
              isImage ? "overflow-hidden p-0" : "px-4 py-3"
            } ${
              isMe
                ? `rounded-br-md ${isSnap ? 'bg-purple-500' : 'bg-primary'}`
                : `rounded-bl-md ${isSnap ? 'bg-purple-100' : 'bg-muted'}`
            }`}
            onPress={() => isSnap ? handleSnapTap(message) : undefined}
            disabled={!isSnap}
          >
            {isImage ? (
              <Image
                source={{ uri: message.image_url }}
                style={{ 
                  width: imageMaxWidth, 
                  height: imageMaxWidth * 0.75,
                  borderRadius: 16
                }}
                resizeMode="cover"
              />
            ) : (
              <View>
                <Text
                  className={`text-sm ${
                    isMe 
                      ? (isSnap ? "text-white" : "text-primary-foreground")
                      : (isSnap ? "text-purple-800" : "text-foreground")
                  }`}
                >
                  {message.content}
                </Text>
                {isSnap && timeRemaining !== null && (
                  <Text className={`text-xs mt-1 ${isMe ? "text-purple-200" : "text-purple-600"}`}>
                    ⏱️ {timeRemaining}s
                  </Text>
                )}
              </View>
            )}
          </TouchableOpacity>
          
          {/* Timestamp and read status */}
          <View className="mt-1 flex-row items-center space-x-1">
            <Text className="text-xs text-muted-foreground">
              {formatTime(message.created_at)}
            </Text>
            {isMe && isRead && (
              <Ionicons name="checkmark-done" size={12} color="#10b981" />
            )}
            {isMe && !isRead && (
              <Ionicons name="checkmark" size={12} color="gray" />
            )}
          </View>
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
          
          <View className={`h-10 w-10 items-center justify-center rounded-full ${
            isGroup === "true" ? "bg-green-500" : "bg-primary"
          }`}>
            {isGroup === "true" ? (
              <Ionicons name="people" size={20} color="white" />
            ) : (
              <Text className="font-bold text-primary-foreground">
                {participantName?.charAt(0) || "?"}
              </Text>
            )}
          </View>
          
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-foreground">
              {participantName || "Unknown User"}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {isGroup === "true" && participants.length > 0 
                ? `${participants.length} participants`
                : "Online"
              }
            </Text>
          </View>
          
          {isGroup === "true" ? (
            <TouchableOpacity 
              className="h-10 w-10 items-center justify-center rounded-full"
              onPress={() => setShowGroupManagement(true)}
            >
              <Ionicons name="information-circle-outline" size={24} color="gray" />
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full">
                <Ionicons name="videocam-outline" size={24} color="gray" />
              </TouchableOpacity>
              
              <TouchableOpacity className="ml-2 h-10 w-10 items-center justify-center rounded-full">
                <Ionicons name="call-outline" size={24} color="gray" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Messages List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <Text className="text-muted-foreground">Loading messages...</Text>
          </View>
        ) : messages.length > 0 ? (
          <View className="flex-1">
            <FlatList
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 16 }}
            />
            
            {/* Typing Indicator */}
            {otherUserTyping && (
              <View className="px-4 py-2">
                <View className="flex-row items-center">
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-primary mr-3">
                    <Text className="text-xs font-bold text-primary-foreground">
                      {participantName?.charAt(0) || "?"}
                    </Text>
                  </View>
                  <View className="flex-row items-center space-x-1">
                    <View className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                    <View className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                    <View className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                    <Text className="ml-2 text-xs text-muted-foreground">typing...</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
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
                onChangeText={handleTextChange}
                multiline
                maxLength={500}
              />
              
              {messageText.trim() && (
                <View className="ml-2 flex-row space-x-2">
                  {/* Snap button */}
                  <TouchableOpacity
                    className="h-8 w-8 items-center justify-center rounded-full bg-purple-500"
                    onPress={handleSendSnap}
                  >
                    <Ionicons name="flash" size={16} color="white" />
                  </TouchableOpacity>
                  
                  {/* Regular send button */}
                  <TouchableOpacity
                    className={`h-8 w-8 items-center justify-center rounded-full ${
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
                </View>
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

      {/* Snap Viewer */}
      <SnapViewer
        visible={showSnapViewer}
        onClose={handleSnapViewerClose}
        snap={selectedSnap}
        senderName={selectedSnap?.sender?.display_name || "Someone"}
        canReplay={true}
        onSnapComplete={handleSnapComplete}
      />

      {/* Group Management Modal */}
      {isGroup === "true" && (
        <GroupManagementModal
          visible={showGroupManagement}
          onClose={() => setShowGroupManagement(false)}
          conversationId={id!}
          groupName={participantName || "Group Chat"}
        />
      )}
    </SafeAreaView>
  );
} 
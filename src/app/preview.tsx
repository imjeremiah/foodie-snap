/**
 * @file Preview screen - displays captured photo with action buttons.
 * Shows the captured image and provides Send/Discard functionality.
 */

import React from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function PreviewScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();

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
   * Handle send action - placeholder for now
   */
  const handleSend = () => {
    Alert.alert(
      "Send Photo",
      "Send functionality will be implemented in the next phase!",
      [
        { text: "OK", onPress: () => router.back() }
      ]
    );
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
        <View className="flex-row items-center justify-center space-x-8 px-8">
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

          {/* Send button */}
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-primary py-4"
            onPress={handleSend}
          >
            <View className="items-center">
              <Ionicons name="send" size={24} color="white" />
              <Text className="mt-1 text-sm font-medium text-white">
                Send
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
} 
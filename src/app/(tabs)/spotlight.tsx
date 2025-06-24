/**
 * @file Spotlight screen - displays public content feed and discovery.
 * Features scrollable feed of public posts with infinite loading and user interactions.
 */

import React from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import SpotlightFeed from "../../components/spotlight/SpotlightFeed";
import { SpotlightFeedItem } from "../../types/database";

/**
 * Main spotlight screen component with public content discovery feed
 */
export default function SpotlightScreen() {
  /**
   * Handle user profile press - navigate to user profile or show options
   */
  function handleUserPress(userId: string) {
    // For now, show a simple alert. In the future, navigate to user profile
    Alert.alert(
      "User Profile",
      "User profile feature coming soon!",
      [
        { text: "OK", style: "default" }
      ]
    );
  }

  /**
   * Handle image press - show full screen image view
   */
  function handleImagePress(post: SpotlightFeedItem) {
    // For now, show a simple alert. In the future, open full screen image viewer
    Alert.alert(
      "Full Screen View",
      "Full screen image viewer coming soon!",
      [
        { text: "OK", style: "default" }
      ]
    );
  }

  return (
    <SpotlightFeed
      onUserPress={handleUserPress}
      onImagePress={handleImagePress}
    />
  );
}

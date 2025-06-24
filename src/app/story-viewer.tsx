/**
 * @file Story viewer screen - handles routing to display stories for a specific user.
 * Acts as a bridge between navigation and the StoryViewer component.
 */

import React from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import StoryViewer from "../components/stories/StoryViewer";

export default function StoryViewerScreen() {
  const router = useRouter();
  const { userId, userName } = useLocalSearchParams<{
    userId: string;
    userName?: string;
  }>();

  /**
   * Handle closing the story viewer
   */
  const handleClose = () => {
    router.back();
  };

  if (!userId) {
    // If no userId provided, go back
    router.back();
    return null;
  }

  return (
    <StoryViewer
      visible={true}
      onClose={handleClose}
      initialUserId={userId}
      initialUserName={userName}
    />
  );
} 
/**
 * @file StoryViewer component - displays individual stories with timed viewing and navigation.
 * Handles automatic progression, manual navigation, and view tracking.
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Modal, 
  Dimensions,
  Alert,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { useGetUserStoriesQuery, useRecordStoryViewMutation } from "../../store/slices/api-slice";
import type { Story, StoryFeedItem } from "../../types/database";

interface StoryViewerProps {
  visible: boolean;
  onClose: () => void;
  initialUserId: string;
  initialUserName?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StoryViewer({ 
  visible, 
  onClose, 
  initialUserId, 
  initialUserName 
}: StoryViewerProps) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const viewingStartTime = useRef<number>(0);

  // API hooks
  const { data: stories = [], isLoading } = useGetUserStoriesQuery(initialUserId);
  const [recordStoryView] = useRecordStoryViewMutation();

  const currentStory = stories[currentStoryIndex];
  const totalStories = stories.length;

  // Video player for video stories
  const videoPlayer = useVideoPlayer(
    currentStory?.content_type === 'video' && currentStory?.image_url ? currentStory.image_url : null,
    player => {
      if (player) {
        player.loop = false;
        if (!isPaused && visible) {
          player.play();
        }
      }
    }
  );

  /**
   * Record story view when viewing starts
   */
  const recordView = async (story: Story) => {
    try {
      await recordStoryView({
        story_id: story.id,
        viewer_id: story.user_id // This will be replaced with actual viewer ID in the API
      }).unwrap();
    } catch (error) {
      console.error("Failed to record story view:", error);
    }
  };

  /**
   * Start progress timer
   */
  const startProgress = () => {
    if (!currentStory) return;
    
    const duration = (currentStory.viewing_duration || 5) * 1000; // Convert to milliseconds
    const interval = 50; // Update every 50ms for smooth animation
    
    viewingStartTime.current = Date.now();
    
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - viewingStartTime.current;
      const newProgress = Math.min(elapsed / duration, 1);
      
      setProgress(newProgress);
      
      if (newProgress >= 1) {
        nextStory();
      }
    }, interval);
  };

  /**
   * Stop progress timer
   */
  const stopProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  };

  /**
   * Navigate to next story
   */
  const nextStory = () => {
    if (currentStoryIndex < totalStories - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  /**
   * Navigate to previous story
   */
  const previousStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  /**
   * Toggle pause state
   */
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  /**
   * Handle tap zones for navigation
   */
  const handleTapLeft = () => {
    previousStory();
  };

  const handleTapRight = () => {
    nextStory();
  };

  // Effect to manage progress timer and story viewing
  useEffect(() => {
    if (!visible || !currentStory || isPaused || isLoading) {
      stopProgress();
      return;
    }

    // Record view for this story
    recordView(currentStory);
    
    // Start progress timer
    startProgress();

    return () => {
      stopProgress();
    };
  }, [visible, currentStory, isPaused, isLoading, currentStoryIndex]);

  // Effect to handle video playback state
  useEffect(() => {
    if (!videoPlayer) return;
    
    if (isPaused || !visible) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
  }, [isPaused, visible, videoPlayer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopProgress();
    };
  }, []);

  if (!visible) return null;

  if (isLoading) {
    return (
      <Modal visible={true} animationType="fade">
        <View className="flex-1 bg-black items-center justify-center">
          <ActivityIndicator size="large" color="white" />
          <Text className="text-white mt-4">Loading stories...</Text>
        </View>
      </Modal>
    );
  }

  if (!currentStory) {
    return (
      <Modal visible={true} animationType="fade">
        <View className="flex-1 bg-black items-center justify-center">
          <Text className="text-white text-lg">No stories found</Text>
          <TouchableOpacity 
            className="mt-4 bg-white/20 px-6 py-3 rounded-lg"
            onPress={onClose}
          >
            <Text className="text-white">Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={true} animationType="fade">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View className="flex-1 bg-black">
          {/* Progress bars */}
          <SafeAreaView className="absolute top-0 left-0 right-0 z-20">
            <View className="flex-row px-2 pt-2 space-x-1">
              {stories.map((_, index) => (
                <View key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <View 
                    className="h-full bg-white rounded-full"
                    style={{
                      width: `${
                        index < currentStoryIndex 
                          ? 100 
                          : index === currentStoryIndex 
                            ? progress * 100 
                            : 0
                      }%`
                    }}
                  />
                </View>
              ))}
            </View>
          </SafeAreaView>

          {/* Header */}
          <SafeAreaView className="absolute top-0 left-0 right-0 z-10">
            <View className="flex-row items-center justify-between px-4 pt-8">
              <View className="flex-row items-center">
                {/* User avatar */}
                <View className="h-8 w-8 rounded-full overflow-hidden mr-2">
                  {currentStory.user?.avatar_url ? (
                    <Image
                      source={{ uri: currentStory.user.avatar_url }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="h-full w-full bg-primary items-center justify-center">
                      <Text className="text-xs font-bold text-primary-foreground">
                        {(currentStory.user?.display_name || initialUserName || "?").charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* User name and time */}
                <View>
                  <Text className="text-white font-semibold text-sm">
                    {currentStory.user?.display_name || initialUserName || "Unknown User"}
                  </Text>
                  <Text className="text-white/70 text-xs">
                    {new Date(currentStory.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
              </View>

              {/* Close button */}
              <TouchableOpacity
                className="h-8 w-8 items-center justify-center"
                onPress={onClose}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>

          {/* Story content */}
          <View className="flex-1 items-center justify-center">
            {currentStory.content_type === 'video' ? (
              <VideoView
                player={videoPlayer}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                contentFit="contain"
                allowsFullscreen={false}
                nativeControls={false}
              />
            ) : (
              <Image
                source={{ uri: currentStory.image_url }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Caption */}
          {currentStory.caption && (
            <View className="absolute bottom-0 left-0 right-0 p-4">
              <SafeAreaView>
                <Text className="text-white text-base text-center">
                  {currentStory.caption}
                </Text>
              </SafeAreaView>
            </View>
          )}

          {/* Tap zones for navigation */}
          <View className="absolute inset-0 flex-row">
            {/* Left tap zone - previous story */}
            <TouchableOpacity
              className="flex-1"
              onPress={handleTapLeft}
              onLongPress={togglePause}
              activeOpacity={1}
            />
            
            {/* Right tap zone - next story */}
            <TouchableOpacity
              className="flex-1"
              onPress={handleTapRight}
              onLongPress={togglePause}
              activeOpacity={1}
            />
          </View>

          {/* Pause indicator */}
          {isPaused && (
            <View className="absolute inset-0 items-center justify-center bg-black/30">
              <View className="bg-white/20 rounded-full p-4">
                <Ionicons name="pause" size={32} color="white" />
              </View>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
} 
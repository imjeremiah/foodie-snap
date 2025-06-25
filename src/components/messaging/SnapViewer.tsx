/**
 * @file SnapViewer component - handles the core snap viewing experience
 * Features timed viewing, screenshot detection, replay functionality, and tap-to-progress navigation
 * This is the authentic Snapchat-style snap viewing experience
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { addScreenshotListener, removeScreenshotListener } from "expo-screen-capture";
import { 
  useRecordSnapViewMutation, 
  useIncrementSnapReplayMutation,
  useRecordSnapScreenshotMutation 
} from "../../store/slices/api-slice";
import type { Message } from "../../types/database";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SnapViewerProps {
  visible: boolean;
  onClose: () => void;
  snap: Message | null;
  senderName: string;
  canReplay?: boolean;
  onSnapComplete?: () => void;
}

export default function SnapViewer({
  visible,
  onClose,
  snap,
  senderName,
  canReplay = true,
  onSnapComplete
}: SnapViewerProps) {
  // State
  const [progress, setProgress] = useState(0);
  const [isPaused, setPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasStartedViewing, setHasStartedViewing] = useState(false);
  const [replayCount, setReplayCount] = useState(0);
  const [showReplayButton, setShowReplayButton] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Refs
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const viewingStartTime = useRef<number>(0);
  const screenshotListener = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // API hooks
  const [recordSnapView] = useRecordSnapViewMutation();
  const [incrementSnapReplay] = useIncrementSnapReplayMutation();
  const [recordSnapScreenshot] = useRecordSnapScreenshotMutation();

  // Video player for video snaps
  const videoPlayer = useVideoPlayer(
    snap?.message_type === 'snap' && snap?.image_url && snap?.image_url.includes('.mp4') 
      ? snap.image_url 
      : null,
    player => {
      if (player) {
        player.loop = false;
        player.volume = 1.0;
      }
    }
  );

  // Viewing duration (default 5 seconds, max 10)
  const viewingDuration = Math.min(snap?.viewing_duration || 5, 10) * 1000; // Convert to milliseconds
  const maxReplays = snap?.max_replays || 1;

  /**
   * Initialize screenshot detection
   */
  useEffect(() => {
    if (!visible || !snap) return;

    // Set up screenshot listener
    screenshotListener.current = addScreenshotListener(() => {
      handleScreenshotDetected();
    });

    return () => {
      if (screenshotListener.current) {
        removeScreenshotListener(screenshotListener.current);
      }
    };
  }, [visible, snap]);

  /**
   * Handle screenshot detection
   */
  const handleScreenshotDetected = useCallback(async () => {
    if (!snap) return;

    try {
      await recordSnapScreenshot({
        message_id: snap.id,
        screenshot_timestamp: new Date().toISOString()
      }).unwrap();

      // Show screenshot notification to user
      Alert.alert(
        "Screenshot Detected",
        `${senderName} will be notified that you took a screenshot.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("Failed to record screenshot:", error);
    }
  }, [snap, senderName, recordSnapScreenshot]);

  /**
   * Start the viewing progress timer
   */
  const startProgress = useCallback(() => {
    if (!snap || hasStartedViewing) return;

    setHasStartedViewing(true);
    viewingStartTime.current = Date.now();

    // Record the view
    recordSnapView({
      message_id: snap.id,
      viewing_started_at: new Date().toISOString(),
      is_replay: replayCount > 0
    });

    // Start progress animation
    progressInterval.current = setInterval(() => {
      const elapsed = Date.now() - viewingStartTime.current;
      const newProgress = Math.min(elapsed / viewingDuration, 1);
      
      setProgress(newProgress);
      
      if (newProgress >= 1) {
        completeViewing();
      }
    }, 50); // Update every 50ms for smooth animation
  }, [snap, hasStartedViewing, replayCount, viewingDuration, recordSnapView]);

  /**
   * Stop the progress timer
   */
  const stopProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  /**
   * Complete the viewing session
   */
  const completeViewing = useCallback(() => {
    stopProgress();
    setIsCompleted(true);
    
    // Show replay button if replays are available
    const canShowReplay = canReplay && replayCount < maxReplays;
    setShowReplayButton(canShowReplay);

    // Fade out after a brief delay if no replay available
    if (!canShowReplay) {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onSnapComplete?.();
          onClose();
        });
      }, 1000);
    }
  }, [stopProgress, canReplay, replayCount, maxReplays, fadeAnim, onSnapComplete, onClose]);

  /**
   * Handle replay functionality
   */
  const handleReplay = useCallback(async () => {
    if (!snap || replayCount >= maxReplays) return;

    try {
      await incrementSnapReplay({
        message_id: snap.id
      }).unwrap();

      // Reset viewing state for replay
      setReplayCount(prev => prev + 1);
      setProgress(0);
      setIsCompleted(false);
      setShowReplayButton(false);
      setHasStartedViewing(false);
      fadeAnim.setValue(1);

      // Restart viewing
      setTimeout(startProgress, 100);
    } catch (error) {
      console.error("Failed to record replay:", error);
      Alert.alert("Error", "Failed to replay snap. Please try again.");
    }
  }, [snap, replayCount, maxReplays, incrementSnapReplay, fadeAnim, startProgress]);

  /**
   * Handle tap to start viewing
   */
  const handleTapToStart = useCallback(() => {
    if (!hasStartedViewing && !isCompleted) {
      startProgress();
    }
  }, [hasStartedViewing, isCompleted, startProgress]);

  /**
   * Handle long press to pause/resume
   */
  const handleLongPress = useCallback(() => {
    if (!hasStartedViewing || isCompleted) return;
    
    if (isPaused) {
      // Resume
      setPaused(false);
      viewingStartTime.current = Date.now() - (progress * viewingDuration);
      startProgress();
    } else {
      // Pause
      setPaused(true);
      stopProgress();
    }
  }, [hasStartedViewing, isCompleted, isPaused, progress, viewingDuration, startProgress, stopProgress]);

  /**
   * Pan responder for swipe gestures
   */
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 20;
      },
      onPanResponderMove: (evt, gestureState) => {
        // Handle swipe down to close
        if (gestureState.dy > 100) {
          onClose();
        }
      },
    })
  ).current;

  /**
   * Handle video load
   */
  useEffect(() => {
    if (videoPlayer) {
      videoPlayer.addListener('statusChange', (status) => {
        if (status.isLoaded) {
          setIsLoading(false);
        }
      });
    }
  }, [videoPlayer]);

  /**
   * Reset state when modal opens/closes
   */
  useEffect(() => {
    if (visible && snap) {
      // Reset all state
      setProgress(0);
      setPaused(false);
      setIsLoading(true);
      setHasStartedViewing(false);
      setReplayCount(0);
      setShowReplayButton(false);
      setIsCompleted(false);
      fadeAnim.setValue(1);
      
      // For images, set loading to false immediately
      if (snap.message_type === 'snap' && snap.image_url && !snap.image_url.includes('.mp4')) {
        setIsLoading(false);
      }
    } else {
      // Cleanup
      stopProgress();
    }
  }, [visible, snap, fadeAnim, stopProgress]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      stopProgress();
      if (screenshotListener.current) {
        removeScreenshotListener(screenshotListener.current);
      }
    };
  }, [stopProgress]);

  if (!visible || !snap) return null;

  const isVideo = snap.image_url?.includes('.mp4') || false;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: 'black' }} {...panResponder.panHandlers}>
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header with progress bar */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            paddingTop: 50,
            paddingHorizontal: 16,
            paddingBottom: 16
          }}>
            {/* Progress bar */}
            <View style={{
              height: 4,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: 2,
              marginBottom: 16
            }}>
              <View style={{
                height: '100%',
                backgroundColor: 'white',
                borderRadius: 2,
                width: `${progress * 100}%`
              }} />
            </View>

            {/* Header info */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#4F46E5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                    {senderName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                  {senderName}
                </Text>
              </View>

              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main content area */}
          <Animated.View style={{ 
            flex: 1, 
            opacity: fadeAnim,
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {isLoading ? (
              <View style={{ alignItems: 'center' }}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ color: 'white', marginTop: 16 }}>
                  Loading snap...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={{ flex: 1, width: '100%' }}
                onPress={handleTapToStart}
                onLongPress={handleLongPress}
                activeOpacity={1}
              >
                {isVideo ? (
                  <VideoView
                    player={videoPlayer}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                    contentFit="contain"
                    allowsFullscreen={false}
                    nativeControls={false}
                  />
                ) : (
                  <Image
                    source={{ uri: snap.image_url! }}
                    style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
                    resizeMode="contain"
                  />
                )}
              </TouchableOpacity>
            )}

            {/* Pause indicator */}
            {isPaused && hasStartedViewing && (
              <View style={{
                position: 'absolute',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: 50,
                width: 80,
                height: 80
              }}>
                <Ionicons name="pause" size={32} color="white" />
              </View>
            )}

            {/* Tap to start indicator */}
            {!hasStartedViewing && !isLoading && (
              <View style={{
                position: 'absolute',
                bottom: 100,
                alignItems: 'center'
              }}>
                <View style={{
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 20
                }}>
                  <Text style={{ color: 'white', fontSize: 16 }}>
                    Tap to view • Hold to pause
                  </Text>
                </View>
              </View>
            )}

            {/* Replay button */}
            {showReplayButton && (
              <View style={{
                position: 'absolute',
                bottom: 100,
                alignItems: 'center'
              }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 25,
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                  onPress={handleReplay}
                >
                  <Ionicons name="refresh" size={20} color="black" />
                  <Text style={{ 
                    color: 'black', 
                    fontSize: 16, 
                    fontWeight: '600',
                    marginLeft: 8 
                  }}>
                    Replay ({maxReplays - replayCount} left)
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* Bottom instructions */}
          <View style={{
            position: 'absolute',
            bottom: 50,
            left: 16,
            right: 16,
            alignItems: 'center'
          }}>
            <Text style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: 14,
              textAlign: 'center'
            }}>
              Swipe down to close
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
} 
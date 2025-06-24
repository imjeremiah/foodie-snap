/**
 * @file SnapViewer component - Full-screen snap viewing experience.
 * Provides timed viewing, screenshot detection, replay functionality, and tap-to-progress navigation.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
  Pressable,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ScreenCapture from 'expo-screen-capture';
import { 
  useCanViewSnapQuery, 
  useRecordSnapViewMutation, 
  useRecordScreenshotMutation 
} from '../../store/slices/api-slice';
import type { Message } from '../../types/database';

interface SnapViewerProps {
  snaps: Message[];
  initialIndex: number;
  onClose: () => void;
  currentUserId: string;
}



export default function SnapViewer({ snaps, initialIndex, onClose, currentUserId }: SnapViewerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasStartedViewing, setHasStartedViewing] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;
  
  const [recordSnapView] = useRecordSnapViewMutation();
  const [recordScreenshot] = useRecordScreenshotMutation();
  
  const currentSnap = snaps[currentIndex];

  // Create video player for current snap
  const videoPlayer = useVideoPlayer(
    currentSnap?.message_type === 'image' && currentSnap?.image_url ? null : 
    currentSnap?.image_url || null,
    player => {
      if (player) {
        player.loop = false;
        if (isPlaying) {
          player.play();
        }
      }
    }
  );

  // Use RTK Query to check snap viewability
  const { 
    data: snapViewInfo, 
    isLoading, 
    error: viewError 
  } = useCanViewSnapQuery({
    message_id: currentSnap?.id || '',
    viewer_id: currentUserId,
  }, {
    skip: !currentSnap || !currentUserId,
  });

  // Handle view error
  useEffect(() => {
    if (viewError) {
      console.error('Error checking snap viewability:', viewError);
      Alert.alert('Error', 'Failed to load snap');
      onClose();
    }
  }, [viewError, onClose]);

  // Handle snap that cannot be viewed
  useEffect(() => {
    if (snapViewInfo && !snapViewInfo.can_view) {
      Alert.alert('Cannot View Snap', snapViewInfo.error || 'This snap cannot be viewed');
      onClose();
    }
  }, [snapViewInfo, onClose]);

  // Set time remaining when snap info is available
  useEffect(() => {
    if (snapViewInfo?.can_view) {
      setTimeRemaining(snapViewInfo.viewing_duration);
    }
  }, [snapViewInfo]);



  /**
   * Record that the snap has been viewed
   */
  const recordView = useCallback(async () => {
    if (!currentSnap || !snapViewInfo?.can_view) return;
    
    try {
      await recordSnapView({
        message_id: currentSnap.id,
        viewer_id: currentUserId,
      });
    } catch (error) {
      console.error('Error recording snap view:', error);
    }
  }, [currentSnap, snapViewInfo, currentUserId, recordSnapView]);

  /**
   * Start the viewing timer and progress animation
   */
  const startViewing = useCallback(() => {
    if (!snapViewInfo?.can_view || hasStartedViewing) return;
    
    setHasStartedViewing(true);
    recordView();
    
    // Start progress animation
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: snapViewInfo.viewing_duration * 1000,
      useNativeDriver: false,
    }).start();
    
    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSnapComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as NodeJS.Timeout;
  }, [snapViewInfo, hasStartedViewing, recordView, progressAnim]);

  /**
   * Handle snap viewing completion
   */
  const handleSnapComplete = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Move to next snap or close if no more snaps
    if (currentIndex < snaps.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setHasStartedViewing(false);
      progressAnim.setValue(0);
    } else {
      onClose();
    }
  }, [currentIndex, snaps.length, onClose, progressAnim]);

  /**
   * Handle tap to progress to next snap
   */
  const handleTapToProgress = useCallback(() => {
    if (hasStartedViewing) {
      handleSnapComplete();
    }
  }, [hasStartedViewing, handleSnapComplete]);

  /**
   * Handle screenshot detection
   */
  const handleScreenshotDetected = useCallback(async () => {
    if (!currentSnap) return;
    
    try {
      await recordScreenshot({
        message_id: currentSnap.id,
        screenshotter_id: currentUserId,
      });
      
      // Show a subtle notification that screenshot was detected
      Alert.alert(
        'Screenshot Detected',
        'The sender will be notified that you took a screenshot.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error recording screenshot:', error);
    }
  }, [currentSnap, currentUserId, recordScreenshot]);

  /**
   * Handle replay functionality
   */
  const handleReplay = useCallback(() => {
    if (!snapViewInfo || snapViewInfo.replay_count >= snapViewInfo.max_replays) {
      Alert.alert('No Replays Left', 'You have used all available replays for this snap.');
      return;
    }
    
    // Reset viewing state for replay
    setHasStartedViewing(false);
    setTimeRemaining(snapViewInfo.viewing_duration);
    progressAnim.setValue(0);
    
    // Restart viewing
    setTimeout(() => startViewing(), 100);
  }, [snapViewInfo, progressAnim, startViewing]);

  /**
   * Setup screenshot detection
   */
  useEffect(() => {
    let subscription: any;
    
    const setupScreenshotDetection = async () => {
      try {
        // Request screenshot notification permissions
        const { status } = await ScreenCapture.requestPermissionsAsync();
        
        if (status === 'granted') {
          subscription = ScreenCapture.addScreenshotListener(() => {
            handleScreenshotDetected();
          });
        }
      } catch (error) {
        console.error('Screenshot detection setup failed:', error);
      }
    };
    
    setupScreenshotDetection();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [handleScreenshotDetected]);

  /**
   * Listen for video end event
   */
  useEffect(() => {
    if (!videoPlayer) return;
    
    const subscription = videoPlayer.addListener('playToEnd', () => {
      if (currentSnap?.message_type !== 'image') {
        handleSnapComplete();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [videoPlayer, currentSnap, handleSnapComplete]);



  /**
   * Start viewing when snap info is available
   */
  useEffect(() => {
    if (snapViewInfo?.can_view && !isLoading && !hasStartedViewing) {
      startViewing();
    }
  }, [snapViewInfo, isLoading, hasStartedViewing, startViewing]);

  /**
   * Update video player playback state
   */
  useEffect(() => {
    if (videoPlayer && currentSnap?.message_type !== 'image') {
      if (isPlaying) {
        videoPlayer.play();
      } else {
        videoPlayer.pause();
      }
    }
  }, [videoPlayer, isPlaying, currentSnap]);

  /**
   * Cleanup timer on unmount
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (isLoading || !snapViewInfo) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <Text className="text-white text-lg">Loading snap...</Text>
      </View>
    );
  }

  if (!snapViewInfo.can_view) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-6">
        <Ionicons name="eye-off" size={64} color="white" />
        <Text className="text-white text-xl font-bold mt-4 text-center">
          Can't View Snap
        </Text>
        <Text className="text-white/70 text-center mt-2">
          {snapViewInfo.error}
        </Text>
        <TouchableOpacity
          className="mt-6 bg-white/20 px-6 py-3 rounded-full"
          onPress={onClose}
        >
          <Text className="text-white font-semibold">Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar hidden />
      
      {/* Progress Bar */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row px-2 pt-2 pb-1 space-x-1">
          {snaps.map((_, index) => (
            <View key={index} className="flex-1 h-1 bg-white/30 rounded">
              {index === currentIndex && (
                <Animated.View
                  className="h-full bg-white rounded"
                  style={{
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  }}
                />
              )}
              {index < currentIndex && (
                <View className="h-full bg-white rounded" />
              )}
            </View>
          ))}
        </View>
      </SafeAreaView>

      {/* Snap Content */}
      <Pressable 
        className="flex-1" 
        onPress={handleTapToProgress}
        style={{ backgroundColor: 'black' }}
      >
        {currentSnap.message_type === 'image' && currentSnap.image_url ? (
          <Image
            source={{ uri: currentSnap.image_url }}
            className="flex-1 w-full"
            resizeMode="contain"
          />
        ) : (
          <VideoView
            player={videoPlayer}
            style={{ flex: 1, width: '100%' }}
            contentFit="contain"
            allowsFullscreen={false}
            showsTimecodes={false}
            nativeControls={false}
          />
        )}
      </Pressable>

      {/* Header with time and sender info */}
      <View className="absolute top-16 left-0 right-0 flex-row items-center justify-between px-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center mr-2">
            <Text className="text-white text-xs font-bold">
              {currentSnap.sender?.display_name?.charAt(0) || '?'}
            </Text>
          </View>
          <Text className="text-white font-semibold">
            {currentSnap.sender?.display_name || 'Someone'}
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Text className="text-white font-bold text-lg mr-3">
            {timeRemaining}s
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom overlay with snap info */}
      {currentSnap.content && (
        <View className="absolute bottom-20 left-0 right-0 px-4">
          <View className="bg-black/50 rounded-lg p-3">
            <Text className="text-white text-center">
              {currentSnap.content}
            </Text>
          </View>
        </View>
      )}

      {/* Replay button (shown after snap ends if replays available) */}
      {!hasStartedViewing && snapViewInfo.replay_count < snapViewInfo.max_replays && (
        <View className="absolute bottom-8 left-0 right-0 items-center">
          <TouchableOpacity
            className="bg-white/20 px-6 py-3 rounded-full flex-row items-center"
            onPress={handleReplay}
          >
            <Ionicons name="refresh" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">
              Replay ({snapViewInfo.max_replays - snapViewInfo.replay_count} left)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tap hint */}
      <View className="absolute bottom-8 right-4">
        <Text className="text-white/60 text-xs">
          Tap to skip
        </Text>
      </View>
    </View>
  );
} 
/**
 * @file Camera screen - the central hub of the FoodieSnap application.
 * Provides camera functionality for capturing photos and recording videos with permissions handling.
 */

import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet, Animated, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useScanNutritionLabelMutation, useStoreAiFeedbackMutation } from "../../store/slices/api-slice";
import { uploadMedia } from "../../lib/storage";
import NutritionCard from "../../components/nutrition/NutritionCard";
import type { NutritionCard as NutritionCardType } from "../../types/database";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingAnimValue = useRef(new Animated.Value(1)).current;
  
  // Touch handling refs for tap vs hold detection
  const pressStartTimeRef = useRef<number>(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isHoldingRef = useRef<boolean>(false);

  // Scan mode state
  const [scanMode, setScanMode] = useState<'camera' | 'scan' | 'processing'>('camera');
  const [nutritionCard, setNutritionCard] = useState<NutritionCardType | null>(null);
  const [showNutritionModal, setShowNutritionModal] = useState(false);

  // API hooks
  const [scanNutritionLabel] = useScanNutritionLabelMutation();
  const [storeAiFeedback] = useStoreAiFeedbackMutation();

  /**
   * Cleanup timers on component unmount
   */
  useEffect(() => {
    return () => {
      // Clean up recording timer
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Clean up hold detection timer
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
      
      // Stop any ongoing animations
      recordingAnimValue.stopAnimation();
    };
  }, [recordingAnimValue]);

  /**
   * Handle camera permission request
   */
  if (!cameraPermission) {
    // Camera permissions are still loading
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="text-center text-xl font-semibold text-foreground">
              Loading Camera...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted) {
    // Camera permissions are not granted yet
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="mb-4 text-center text-xl font-semibold text-foreground">
              Camera Access Required
            </Text>
            <Text className="mb-6 text-center text-muted-foreground">
              FoodieSnap needs camera access to capture your food moments
            </Text>
            <TouchableOpacity
              className="rounded-md bg-primary px-4 py-3"
              onPress={requestCameraPermission}
            >
              <Text className="text-center font-semibold text-primary-foreground">
                Grant Camera Permission
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Check microphone permissions for video recording
   */
  const checkMicrophonePermission = async (): Promise<boolean> => {
    if (!microphonePermission) {
      const permission = await requestMicrophonePermission();
      return permission.granted;
    }
    
    if (!microphonePermission.granted) {
      const permission = await requestMicrophonePermission();
      return permission.granted;
    }
    
    return true;
  };

  /**
   * Toggle between front and back camera
   */
  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  /**
   * Capture a photo and navigate to preview screen
   */
  async function takePicture() {
    if (cameraRef.current && !isRecording) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          // Navigate to preview screen with photo URI
          router.push({
            pathname: "/preview",
            params: { 
              mediaUri: photo.uri,
              mediaType: 'photo'
            },
          });
        }
      } catch (error) {
        Alert.alert("Error", "Failed to capture photo. Please try again.");
        console.error("Camera capture error:", error);
      }
    }
  }

  /**
   * Start video recording
   */
  async function startVideoRecording() {
    if (!cameraRef.current || isRecording) return;

    // Check microphone permission
    const hasMicPermission = await checkMicrophonePermission();
    if (!hasMicPermission) {
      Alert.alert(
        "Microphone Permission Required",
        "Video recording requires microphone access for audio.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      setIsRecording(true);
      setRecordingDuration(0);

      // Start pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingAnimValue, {
            toValue: 0.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(recordingAnimValue, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop at 60 seconds
          if (newDuration >= 60) {
            stopVideoRecording();
          }
          return newDuration;
        });
      }, 1000) as unknown as NodeJS.Timeout;

      // Start recording
      const video = await cameraRef.current.recordAsync({
        maxDuration: 60, // 60 seconds max
      });

      if (video) {
        // Navigate to preview screen with video URI
        router.push({
          pathname: "/preview",
          params: { 
            mediaUri: video.uri,
            mediaType: 'video'
          },
        });
      }
    } catch (error) {
      setIsRecording(false);
      setRecordingDuration(0);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      recordingAnimValue.stopAnimation();
      recordingAnimValue.setValue(1);
      
      Alert.alert("Error", "Failed to start video recording. Please try again.");
      console.error("Video recording error:", error);
    }
  }

  /**
   * Stop video recording
   */
  async function stopVideoRecording() {
    if (!cameraRef.current || !isRecording) return;

    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
      setRecordingDuration(0);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Stop animation
      recordingAnimValue.stopAnimation();
      recordingAnimValue.setValue(1);
    } catch (error) {
      console.error("Stop recording error:", error);
    }
  }

  /**
   * Format recording duration for display
   */
  function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Handle press in - start timer to detect tap vs hold
   */
  function handlePressIn() {
    if (isRecording) return; // Don't allow new actions while recording
    
    pressStartTimeRef.current = Date.now();
    isHoldingRef.current = false;
    
    // Set timer for hold detection (300ms threshold)
    holdTimerRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      startVideoRecording();
    }, 300) as unknown as NodeJS.Timeout;
  }

  /**
   * Handle press out - determine if it was a tap or hold
   */
  function handlePressOut() {
    const pressDuration = Date.now() - pressStartTimeRef.current;
    
    // Clear the hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    if (isRecording) {
      // If we're recording, stop the recording
      stopVideoRecording();
    } else if (!isHoldingRef.current && pressDuration < 300) {
      // If it was a quick tap (< 300ms) and we're not recording, take appropriate action
      if (scanMode === 'scan') {
        scanCurrentView();
      } else {
        takePicture();
      }
    }
    
    // Reset hold state
    isHoldingRef.current = false;
  }

  /**
   * Toggle scan mode
   */
  function toggleScanMode() {
    if (isRecording) return; // Don't allow mode changes while recording
    
    setScanMode(current => current === 'scan' ? 'camera' : 'scan');
    setNutritionCard(null);
  }

  /**
   * Scan current camera view for nutrition information
   */
  async function scanCurrentView() {
    if (!cameraRef.current || isRecording) return;

    try {
      setScanMode('processing');
      
      // Take a photo for scanning
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (!photo) {
        throw new Error('Failed to capture photo for scanning');
      }

      console.log('📸 Photo captured, uploading to storage...');

      // Upload image to Supabase Storage to get a public URL
      const uploadResult = await uploadMedia(photo.uri, 'photo', {
        quality: 0.8,
        folder: 'nutrition-scans' // Use a specific folder for nutrition scans
      });

      if (!uploadResult.success || !uploadResult.data) {
        throw new Error(uploadResult.error || 'Failed to upload image for scanning');
      }

      console.log('✅ Image uploaded, public URL:', uploadResult.data.fullUrl);

      // Call nutrition scan API with the public URL
      const result = await scanNutritionLabel({
        imageUri: uploadResult.data.fullUrl, // Use the public URL instead of local file path
        context: {
          scanType: 'food_item', // Default to food item, could be made configurable
        }
      }).unwrap();

      if (result.success && result.nutritionCard) {
        setNutritionCard(result.nutritionCard);
        setShowNutritionModal(true);
      } else {
        throw new Error(result.error || 'Nutrition scan failed');
      }
    } catch (error) {
      console.error('Nutrition scan error:', error);
      
      let errorMessage = "Unable to analyze this image. Please ensure the food item or nutrition label is clearly visible and try again.";
      
      // Provide more specific error messages
      if (error && typeof error === 'object' && 'error' in error) {
        const errorStr = String(error.error);
        if (errorStr.includes('upload')) {
          errorMessage = "Failed to upload image for analysis. Please check your internet connection and try again.";
        } else if (errorStr.includes('OpenAI')) {
          errorMessage = "AI analysis service is temporarily unavailable. Please try again in a moment.";
        }
      }
      
      Alert.alert(
        "Scan Failed",
        errorMessage,
        [{ text: "OK" }]
      );
    } finally {
      setScanMode('scan'); // Return to scan mode
    }
  }

  /**
   * Handle nutrition card feedback
   */
  function handleNutritionFeedback(type: 'thumbs_up' | 'thumbs_down', section: string) {
    if (!nutritionCard) return;

    const suggestionId = `nutrition_${Date.now()}_${section}`;
    storeAiFeedback({
      suggestion_type: 'nutrition',
      suggestion_id: suggestionId,
      feedback_type: type,
      original_suggestion: section === 'health_insights' 
        ? nutritionCard.healthInsights.join('; ')
        : nutritionCard.recipeIdeas.join('; '),
      context_metadata: {
        food_name: nutritionCard.foodName,
        section,
        confidence: nutritionCard.confidence,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('Failed to store nutrition feedback:', error);
    });
  }

  /**
   * Handle sharing nutrition card
   */
  function handleShareNutritionCard() {
    if (!nutritionCard) return;
    
    // Close the modal first
    setShowNutritionModal(false);
    
    // Navigate to preview screen with nutrition card data for sharing
    router.push({
      pathname: "/preview",
      params: { 
        mediaUri: 'nutrition-card', // Special flag for nutrition card
        mediaType: 'nutrition-card',
        nutritionCardData: JSON.stringify(nutritionCard)
      },
    });
  }

  return (
    <View style={styles.container}>
      {/* Camera View - Full screen */}
      <CameraView 
        style={styles.camera}
        facing={facing} 
        ref={cameraRef}
        mode="video"
      />
      
      {/* UI Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top bar with app title and recording indicator */}
          <View style={styles.topBar}>
            <Text style={styles.title}>
              📸 FoodieSnap
            </Text>
            {isRecording && (
              <View style={styles.recordingIndicator}>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingText}>
                  REC {formatDuration(recordingDuration)}
                </Text>
              </View>
            )}
          </View>

          {/* Scan mode overlay */}
          {scanMode === 'scan' && (
            <View style={styles.scanOverlay}>
              <View style={styles.scanFrameContainer}>
                <View style={styles.scanFrame} />
                <View style={styles.scanCorners}>
                  <View style={[styles.scanCorner, styles.scanCornerTL]} />
                  <View style={[styles.scanCorner, styles.scanCornerTR]} />
                  <View style={[styles.scanCorner, styles.scanCornerBL]} />
                  <View style={[styles.scanCorner, styles.scanCornerBR]} />
                </View>
              </View>
              <Text style={styles.scanHint}>
                🔍 Tap to scan nutrition info
              </Text>
            </View>
          )}

          {/* Instructions */}
          {!isRecording && scanMode !== 'scan' && (
            <View style={styles.instructionsContainer}>
              <Text style={styles.instructionsText}>
                {scanMode === 'processing'
                  ? "🤖 Analyzing with AI..."
                  : "Tap for photo • Hold for video"
                }
              </Text>
            </View>
          )}

          {/* Processing overlay */}
          {scanMode === 'processing' && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingContainer}>
                <View style={styles.processingSpinner}>
                  <Ionicons name="nutrition" size={32} color="#22C55E" />
                </View>
                <Text style={styles.processingText}>
                  Scanning nutrition...
                </Text>
              </View>
            </View>
          )}

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <View style={styles.controlsRow}>
              {/* Scan button */}
              <TouchableOpacity
                style={[styles.flipButton, scanMode === 'scan' && styles.scanButtonActive]}
                onPress={toggleScanMode}
                disabled={isRecording || scanMode === 'processing'}
              >
                <Ionicons 
                  name={scanMode === 'scan' ? "scan" : "nutrition"} 
                  size={26} 
                  color={scanMode === 'scan' ? "#22C55E" : "white"} 
                />
              </TouchableOpacity>

              {/* Capture button */}
              <View style={styles.captureContainer}>
                <TouchableOpacity
                  style={[
                    styles.captureButton,
                    isRecording && styles.captureButtonRecording
                  ]}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={false} // Always allow interaction
                  activeOpacity={0.8}
                >
                  <Animated.View 
                    style={[
                      styles.captureInner,
                      isRecording && styles.captureInnerRecording,
                      { transform: [{ scale: recordingAnimValue }] }
                    ]} 
                  />
                </TouchableOpacity>
              </View>

              {/* Flip camera button */}
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
                disabled={isRecording}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Nutrition Card Modal */}
      <Modal
        visible={showNutritionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowNutritionModal(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
            {nutritionCard && (
              <NutritionCard
                nutritionCard={nutritionCard}
                onShare={handleShareNutritionCard}
                onClose={() => setShowNutritionModal(false)}
                onFeedback={handleNutritionFeedback}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 16,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  recordingIndicator: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
    marginRight: 6,
  },
  recordingText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructionsContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  instructionsText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomControls: {
    paddingBottom: 32,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  flipButton: {
    height: 52,
    width: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 26,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  captureContainer: {
    flex: 1,
    alignItems: 'center',
  },
  captureButton: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    backgroundColor: 'white',
  },
  captureButtonRecording: {
    borderColor: '#ff0000',
    backgroundColor: '#ff0000',
  },
  captureInner: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  captureInnerRecording: {
    backgroundColor: '#ff0000',
    borderRadius: 8,
    width: 24,
    height: 24,
  },
  scanButtonActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    borderColor: '#22C55E',
    borderWidth: 2,
    shadowColor: '#22C55E',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  scanFrameContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 240,
    height: 240,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  scanCorners: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scanCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#22C55E',
    borderWidth: 3,
  },
  scanCornerTL: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 20,
  },
  scanCornerTR: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 20,
  },
  scanCornerBL: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 20,
  },
  scanCornerBR: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 20,
  },
  scanHint: {
    marginTop: 32,
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    overflow: 'hidden',
  },
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  processingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  processingSpinner: {
    marginBottom: 12,
  },
  processingText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
});

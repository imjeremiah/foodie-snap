/**
 * @file Camera screen - the central hub of the FoodieSnap application.
 * Provides camera functionality for capturing photos with permissions handling.
 */

import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function CameraScreen() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  /**
   * Handle camera permission request
   */
  if (!permission) {
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

  if (!permission.granted) {
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
              onPress={requestPermission}
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
   * Toggle between front and back camera
   */
  function toggleCameraFacing() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  /**
   * Capture a photo and navigate to preview screen
   */
  async function takePicture() {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        if (photo) {
          // Navigate to preview screen with photo URI
          router.push({
            pathname: "/preview",
            params: { imageUri: photo.uri },
          });
        }
      } catch (error) {
        Alert.alert("Error", "Failed to capture photo. Please try again.");
        console.error("Camera capture error:", error);
      }
    }
  }

  return (
    <View style={styles.container}>
      {/* Camera View - Full screen */}
      <CameraView 
        style={styles.camera}
        facing={facing} 
        ref={cameraRef}
      />
      
      {/* UI Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          {/* Top bar with app title */}
          <View style={styles.topBar}>
            <Text style={styles.title}>
              📸 FoodieSnap
            </Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottomControls}>
            <View style={styles.controlsRow}>
              {/* Flip camera button */}
              <TouchableOpacity
                style={styles.flipButton}
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>

              {/* Capture button */}
              <View style={styles.captureContainer}>
                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={takePicture}
                >
                  <View style={styles.captureInner} />
                </TouchableOpacity>
              </View>

              {/* Placeholder for future features */}
              <View style={styles.placeholder} />
            </View>
          </View>
        </SafeAreaView>
      </View>
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
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
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
    height: 48,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
  captureInner: {
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  placeholder: {
    height: 48,
    width: 48,
  },
});

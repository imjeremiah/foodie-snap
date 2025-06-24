/**
 * @file Camera screen - the central hub of the FoodieSnap application.
 * Provides camera functionality for capturing photos with permissions handling.
 */

import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
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
    <SafeAreaView className="flex-1 bg-black">
      <CameraView 
        className="flex-1" 
        facing={facing} 
        ref={cameraRef}
      >
        {/* Camera UI Overlay */}
        <View className="flex-1 justify-between">
          {/* Top bar with app title */}
          <View className="flex-row items-center justify-center pt-4">
            <Text className="text-lg font-bold text-white">
              📸 FoodieSnap
            </Text>
          </View>

          {/* Bottom controls */}
          <View className="pb-8">
            <View className="flex-row items-center justify-center px-8">
              {/* Flip camera button */}
              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full bg-black/30"
                onPress={toggleCameraFacing}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>

              {/* Capture button */}
              <View className="flex-1 items-center">
                <TouchableOpacity
                  className="h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white"
                  onPress={takePicture}
                >
                  <View className="h-16 w-16 rounded-full bg-white" />
                </TouchableOpacity>
              </View>

              {/* Placeholder for future features */}
              <View className="h-12 w-12" />
            </View>
          </View>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}

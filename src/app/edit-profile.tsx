/**
 * @file Edit Profile screen - allows users to update their profile information.
 * Includes display name, bio, and avatar editing with image upload functionality.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  useGetCurrentProfileQuery,
  useUpdateProfileMutation,
} from "../store/slices/api-slice";
import { uploadPhoto } from "../lib/storage";
import { useSession } from "../hooks/use-session";

/**
 * Edit Profile Screen Component
 */
export default function EditProfileScreen() {
  const { user } = useSession();
  const { data: profile, isLoading: profileLoading } = useGetCurrentProfileQuery();
  const [updateProfile, { isLoading: updating }] = useUpdateProfileMutation();

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [avatarChanged, setAvatarChanged] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Initialize form with current profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setAvatarUri(profile.avatar_url);
    }
  }, [profile]);

  /**
   * Handle image picking for avatar
   */
  const handlePickImage = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library to update your avatar.");
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Resize image for avatar use
        const resizedImage = await manipulateAsync(
          imageUri,
          [{ resize: { width: 200, height: 200 } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        setAvatarUri(resizedImage.uri);
        setAvatarChanged(true);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  /**
   * Handle taking photo for avatar
   */
  const handleTakePhoto = async () => {
    try {
      // Request permissions
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow camera access to take a photo for your avatar.");
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Resize image for avatar use
        const resizedImage = await manipulateAsync(
          imageUri,
          [{ resize: { width: 200, height: 200 } }],
          { compress: 0.8, format: SaveFormat.JPEG }
        );

        setAvatarUri(resizedImage.uri);
        setAvatarChanged(true);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  /**
   * Show avatar options
   */
  const showAvatarOptions = () => {
    Alert.alert(
      "Update Avatar",
      "Choose how you'd like to update your profile picture",
      [
        { text: "Camera", onPress: handleTakePhoto },
        { text: "Photo Library", onPress: handlePickImage },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  /**
   * Handle form submission
   */
  const handleSave = async () => {
    if (!profile || !user) return;

    // Validate input
    if (!displayName.trim()) {
      Alert.alert("Error", "Display name is required");
      return;
    }

    if (displayName.trim().length < 2) {
      Alert.alert("Error", "Display name must be at least 2 characters");
      return;
    }

    if (bio.length > 300) {
      Alert.alert("Error", "Bio must be less than 300 characters");
      return;
    }

    try {
      setUploading(true);

      let avatarUrl = profile.avatar_url;

      // Upload new avatar if changed
      if (avatarChanged && avatarUri) {
        const uploadResult = await uploadPhoto(avatarUri, {
          quality: 0.8,
          maxWidth: 200,
          maxHeight: 200,
        });

        if (uploadResult.success && uploadResult.data) {
          avatarUrl = uploadResult.data.publicUrl;
        } else {
          throw new Error(uploadResult.error || "Failed to upload avatar");
        }
      }

      // Update profile
      await updateProfile({
        id: profile.id,
        display_name: displayName.trim(),
        bio: bio.trim() || null,
        avatar_url: avatarUrl,
      }).unwrap();

      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  /**
   * Handle cancel with unsaved changes check
   */
  const handleCancel = () => {
    const hasChanges = 
      displayName !== (profile?.display_name || "") ||
      bio !== (profile?.bio || "") ||
      avatarChanged;

    if (hasChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to cancel?",
        [
          { text: "Keep Editing", style: "cancel" },
          { text: "Discard", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-border bg-card px-4 py-3">
        <TouchableOpacity onPress={handleCancel}>
          <Text className="text-primary">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-foreground">Edit Profile</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={updating || uploading}
          className={`${updating || uploading ? "opacity-50" : ""}`}
        >
          <Text className="font-semibold text-primary">
            {updating || uploading ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
          {/* Avatar Section */}
          <View className="mb-8 items-center">
            <TouchableOpacity
              onPress={showAvatarOptions}
              className="relative mb-4"
              disabled={uploading}
            >
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  className="h-24 w-24 rounded-full"
                  style={{ backgroundColor: '#f0f0f0' }}
                />
              ) : (
                <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
                  <Text className="text-2xl font-bold text-primary-foreground">
                    {displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              
              {/* Camera icon overlay */}
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full bg-primary">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>

            <Text className="text-sm text-muted-foreground">
              Tap to change your profile picture
            </Text>
          </View>

          {/* Form Fields */}
          <View className="space-y-6">
            {/* Display Name */}
            <View>
              <Text className="mb-2 text-sm font-medium text-foreground">
                Display Name *
              </Text>
              <TextInput
                className="rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                placeholder="Enter your display name"
                placeholderTextColor="hsl(var(--muted-foreground))"
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={50}
                autoCapitalize="words"
              />
              <Text className="mt-1 text-xs text-muted-foreground">
                {displayName.length}/50 characters
              </Text>
            </View>

            {/* Bio */}
            <View>
              <Text className="mb-2 text-sm font-medium text-foreground">
                Bio
              </Text>
              <TextInput
                className="rounded-lg border border-border bg-background px-4 py-3 text-foreground"
                placeholder="Tell people about yourself..."
                placeholderTextColor="hsl(var(--muted-foreground))"
                value={bio}
                onChangeText={setBio}
                maxLength={300}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Text className="mt-1 text-xs text-muted-foreground">
                {bio.length}/300 characters
              </Text>
            </View>

            {/* Account Info (Read-only) */}
            <View>
              <Text className="mb-2 text-sm font-medium text-foreground">
                Email
              </Text>
              <View className="rounded-lg border border-border bg-muted px-4 py-3">
                <Text className="text-muted-foreground">
                  {profile?.email || user?.email}
                </Text>
              </View>
              <Text className="mt-1 text-xs text-muted-foreground">
                Email cannot be changed
              </Text>
            </View>
          </View>

          {/* Tips */}
          <View className="mt-8 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <View className="mb-2 flex-row items-center">
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text className="ml-2 font-semibold text-blue-900">Profile Tips</Text>
            </View>
            <Text className="text-sm text-blue-800">
              • Use a clear profile picture to help friends recognize you{"\n"}
              • Keep your display name friendly and recognizable{"\n"}
              • Your bio is a great place to share your interests{"\n"}
              • You can change these details anytime
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
} 
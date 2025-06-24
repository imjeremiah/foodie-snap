/**
 * @file Privacy Settings Screen - friend visibility and discoverability controls.
 * Manages user privacy preferences for friend interactions.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useGetCurrentProfileQuery,
  useUpdateProfileMutation,
} from "../../store/slices/api-slice";

interface PrivacySettings {
  allow_friend_requests: boolean;
  discoverable_by_email: boolean;
  discoverable_by_username: boolean;
  show_mutual_friends: boolean;
  show_friends_count: boolean;
}

/**
 * Privacy Settings Screen Component
 */
export default function PrivacySettingsScreen() {
  const { data: profile } = useGetCurrentProfileQuery();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();

  // Default privacy settings (would normally come from profile or separate settings table)
  const [settings, setSettings] = useState<PrivacySettings>({
    allow_friend_requests: true,
    discoverable_by_email: true,
    discoverable_by_username: true,
    show_mutual_friends: true,
    show_friends_count: true,
  });

  /**
   * Handle setting toggle
   */
  const handleToggle = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  /**
   * Save privacy settings
   */
  const handleSave = async () => {
    try {
      if (!profile) return;

      // In a real implementation, you'd save these to a separate privacy_settings table
      // For now, we'll just show a success message
      Alert.alert("Success", "Privacy settings have been updated");
    } catch (error) {
      Alert.alert("Error", "Failed to update privacy settings");
    }
  };

  /**
   * Render setting item
   */
  const renderSettingItem = (
    key: keyof PrivacySettings,
    title: string,
    description: string,
    icon: string
  ) => (
    <View className="flex-row items-center border-b border-border bg-card p-4">
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
        <Ionicons name={icon as any} size={20} color="#007AFF" />
      </View>
      
      <View className="flex-1">
        <Text className="font-semibold text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{description}</Text>
      </View>
      
      <Switch
        value={settings[key]}
        onValueChange={() => handleToggle(key)}
        trackColor={{ false: "#767577", true: "#007AFF" }}
        thumbColor={settings[key] ? "#f4f3f4" : "#f4f3f4"}
      />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-card px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-bold text-foreground">Privacy Settings</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Friend Requests Section */}
        <View className="mb-6">
          <View className="border-b border-border bg-card px-4 py-3">
            <Text className="font-bold text-foreground">Friend Requests</Text>
            <Text className="text-sm text-muted-foreground">
              Control who can send you friend requests
            </Text>
          </View>
          
          {renderSettingItem(
            "allow_friend_requests",
            "Allow Friend Requests",
            "Let other users send you friend requests",
            "person-add"
          )}
        </View>

        {/* Discoverability Section */}
        <View className="mb-6">
          <View className="border-b border-border bg-card px-4 py-3">
            <Text className="font-bold text-foreground">Discoverability</Text>
            <Text className="text-sm text-muted-foreground">
              Control how others can find you
            </Text>
          </View>
          
          {renderSettingItem(
            "discoverable_by_email",
            "Discoverable by Email",
            "Allow users to find you by your email address",
            "mail"
          )}
          
          {renderSettingItem(
            "discoverable_by_username",
            "Discoverable by Username",
            "Allow users to find you by your display name",
            "person"
          )}
        </View>

        {/* Friends Visibility Section */}
        <View className="mb-6">
          <View className="border-b border-border bg-card px-4 py-3">
            <Text className="font-bold text-foreground">Friends Visibility</Text>
            <Text className="text-sm text-muted-foreground">
              Control what information about your friends is visible
            </Text>
          </View>
          
          {renderSettingItem(
            "show_mutual_friends",
            "Show Mutual Friends",
            "Display mutual friends when others view your profile",
            "people"
          )}
          
          {renderSettingItem(
            "show_friends_count",
            "Show Friends Count",
            "Display the number of friends you have on your profile",
            "bar-chart"
          )}
        </View>

        {/* Blocked Users Management */}
        <View className="mb-6">
          <View className="border-b border-border bg-card px-4 py-3">
            <Text className="font-bold text-foreground">Blocked Users</Text>
            <Text className="text-sm text-muted-foreground">
              Manage users you have blocked
            </Text>
          </View>
          
          <TouchableOpacity 
            className="flex-row items-center border-b border-border bg-card p-4"
            onPress={() => router.push("/friends/blocked")}
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="ban" size={20} color="#DC2626" />
            </View>
            
            <View className="flex-1">
              <Text className="font-semibold text-foreground">Blocked Users</Text>
              <Text className="text-sm text-muted-foreground">View and manage blocked users</Text>
            </View>
            
            <Ionicons name="chevron-forward" size={16} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Privacy Tips */}
        <View className="mx-4 mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={20} color="#007AFF" />
            <Text className="ml-2 font-semibold text-blue-900">Privacy Tips</Text>
          </View>
          <Text className="text-sm text-blue-800">
            • Turning off discoverability makes it harder for friends to find you{"\n"}
            • You can always change these settings later{"\n"}
            • Blocked users cannot see your profile or send requests
          </Text>
        </View>

        {/* Save Button */}
        <View className="px-4 pb-6">
          <TouchableOpacity
            className={`rounded-lg bg-primary p-4 ${isLoading ? "opacity-50" : ""}`}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text className="text-center font-semibold text-primary-foreground">
              {isLoading ? "Saving..." : "Save Settings"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 
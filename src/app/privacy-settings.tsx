/**
 * @file Privacy & Settings screen - comprehensive user preferences and privacy controls.
 * Manages all user preferences including privacy, notifications, and app behavior.
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useGetUserPreferencesQuery,
  useUpdateUserPreferencesMutation,
  useGetBlockedUsersQuery,
} from "../store/slices/api-slice";
import { useSession } from "../hooks/use-session";

interface SettingItem {
  key: string;
  title: string;
  description: string;
  icon: string;
  type: 'switch' | 'select' | 'navigation';
  value?: boolean | string;
  options?: { label: string; value: string }[];
  navigation?: string;
}

interface SettingSection {
  title: string;
  data: SettingItem[];
}

/**
 * Privacy & Settings Screen Component
 */
export default function PrivacySettingsScreen() {
  const { user } = useSession();
  const { data: preferences, isLoading: preferencesLoading } = useGetUserPreferencesQuery();
  const { data: blockedUsers = [] } = useGetBlockedUsersQuery();
  const [updatePreferences, { isLoading: updating }] = useUpdateUserPreferencesMutation();

  const [localPreferences, setLocalPreferences] = useState<any>({});

  // Initialize local preferences when data loads
  useEffect(() => {
    if (preferences) {
      setLocalPreferences(preferences);
    }
  }, [preferences]);

  /**
   * Handle preference toggle
   */
  const handlePreferenceToggle = async (key: string, value: boolean) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);

    try {
      if (user) {
        await updatePreferences({
          user_id: user.id,
          [key]: value,
        }).unwrap();
      }
    } catch (error) {
      // Revert on error
      setLocalPreferences(localPreferences);
      Alert.alert("Error", "Failed to update setting. Please try again.");
    }
  };

  /**
   * Handle preference selection
   */
  const handlePreferenceSelect = async (key: string, value: string) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);

    try {
      if (user) {
        await updatePreferences({
          user_id: user.id,
          [key]: value,
        }).unwrap();
      }
    } catch (error) {
      setLocalPreferences(localPreferences);
      Alert.alert("Error", "Failed to update setting. Please try again.");
    }
  };

  /**
   * Navigate to blocked users screen
   */
  const navigateToBlockedUsers = () => {
    router.push("/friends/blocked");
  };

  /**
   * Show profile visibility options
   */
  const showProfileVisibilityOptions = () => {
    const options = [
      { label: "Public", value: "public" },
      { label: "Friends Only", value: "friends" },
      { label: "Private", value: "private" },
    ];

    Alert.alert(
      "Profile Visibility",
      "Who can see your profile information?",
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => handlePreferenceSelect("profile_visibility", option.value),
        })),
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  /**
   * Show font size options
   */
  const showFontSizeOptions = () => {
    const options = [
      { label: "Small", value: "small" },
      { label: "Medium", value: "medium" },
      { label: "Large", value: "large" },
      { label: "Extra Large", value: "extra_large" },
    ];

    Alert.alert(
      "Font Size",
      "Choose your preferred text size",
      [
        ...options.map(option => ({
          text: option.label,
          onPress: () => handlePreferenceSelect("font_size", option.value),
        })),
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  /**
   * Render setting item
   */
  const renderSettingItem = ({ item }: { item: SettingItem }) => {
    if (item.type === 'navigation') {
      return (
        <TouchableOpacity
          className="flex-row items-center border-b border-border bg-card p-4"
          onPress={() => {
            if (item.key === 'blocked_users') {
              navigateToBlockedUsers();
            } else if (item.navigation) {
              router.push(item.navigation as any);
            }
          }}
        >
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name={item.icon as any} size={20} color="#007AFF" />
          </View>
          
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{item.title}</Text>
            <Text className="text-sm text-muted-foreground">{item.description}</Text>
          </View>

          {item.key === 'blocked_users' && blockedUsers.length > 0 && (
            <View className="mr-2 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-2 py-1">
              <Text className="text-xs font-bold text-white">{blockedUsers.length}</Text>
            </View>
          )}
          
          <Ionicons name="chevron-forward" size={16} color="gray" />
        </TouchableOpacity>
      );
    }

    if (item.type === 'select') {
      return (
        <TouchableOpacity
          className="flex-row items-center border-b border-border bg-card p-4"
          onPress={() => {
            if (item.key === 'profile_visibility') {
              showProfileVisibilityOptions();
            } else if (item.key === 'font_size') {
              showFontSizeOptions();
            }
          }}
        >
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Ionicons name={item.icon as any} size={20} color="#007AFF" />
          </View>
          
          <View className="flex-1">
            <Text className="font-semibold text-foreground">{item.title}</Text>
            <Text className="text-sm text-muted-foreground">{item.description}</Text>
          </View>
          
          <Text className="mr-2 text-primary">
            {item.key === 'profile_visibility' && 
              (localPreferences.profile_visibility === 'public' ? 'Public' :
               localPreferences.profile_visibility === 'friends' ? 'Friends' : 'Private')}
            {item.key === 'font_size' && 
              (localPreferences.font_size === 'small' ? 'Small' :
               localPreferences.font_size === 'medium' ? 'Medium' :
               localPreferences.font_size === 'large' ? 'Large' : 'Extra Large')}
          </Text>
          
          <Ionicons name="chevron-forward" size={16} color="gray" />
        </TouchableOpacity>
      );
    }

    return (
      <View className="flex-row items-center border-b border-border bg-card p-4">
        <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Ionicons name={item.icon as any} size={20} color="#007AFF" />
        </View>
        
        <View className="flex-1">
          <Text className="font-semibold text-foreground">{item.title}</Text>
          <Text className="text-sm text-muted-foreground">{item.description}</Text>
        </View>
        
        <Switch
          value={localPreferences[item.key] || false}
          onValueChange={(value) => handlePreferenceToggle(item.key, value)}
          trackColor={{ false: "#767577", true: "#007AFF" }}
          thumbColor={localPreferences[item.key] ? "#f4f3f4" : "#f4f3f4"}
          disabled={updating}
        />
      </View>
    );
  };

  /**
   * Render section header
   */
  const renderSectionHeader = ({ section }: { section: SettingSection }) => (
    <View className="border-b border-border bg-card px-4 py-3">
      <Text className="font-bold text-foreground">{section.title}</Text>
    </View>
  );

  const settingSections: SettingSection[] = [
    {
      title: "Privacy",
      data: [
        {
          key: "profile_visibility",
          title: "Profile Visibility",
          description: "Who can see your profile information",
          icon: "eye",
          type: "select",
        },
        {
          key: "allow_friend_requests",
          title: "Allow Friend Requests",
          description: "Let other users send you friend requests",
          icon: "person-add",
          type: "switch",
        },
        {
          key: "discoverable_by_email",
          title: "Discoverable by Email",
          description: "Allow users to find you by your email address",
          icon: "mail",
          type: "switch",
        },
        {
          key: "discoverable_by_username",
          title: "Discoverable by Username",
          description: "Allow users to find you by your display name",
          icon: "person",
          type: "switch",
        },
        {
          key: "show_mutual_friends",
          title: "Show Mutual Friends",
          description: "Display mutual friends to other users",
          icon: "people",
          type: "switch",
        },
        {
          key: "show_last_seen",
          title: "Show Last Seen",
          description: "Let friends see when you were last active",
          icon: "time",
          type: "switch",
        },
        {
          key: "blocked_users",
          title: "Blocked Users",
          description: `Manage blocked users ${blockedUsers.length > 0 ? `(${blockedUsers.length})` : ''}`,
          icon: "ban",
          type: "navigation",
        },
      ],
    },
    {
      title: "Notifications",
      data: [
        {
          key: "push_notifications_enabled",
          title: "Push Notifications",
          description: "Receive notifications when the app is closed",
          icon: "notifications",
          type: "switch",
        },
        {
          key: "message_notifications",
          title: "Message Notifications",
          description: "Get notified about new messages",
          icon: "chatbox",
          type: "switch",
        },
        {
          key: "friend_request_notifications",
          title: "Friend Request Notifications",
          description: "Get notified about new friend requests",
          icon: "person-add",
          type: "switch",
        },
        {
          key: "story_notifications",
          title: "Story Notifications",
          description: "Get notified when friends post stories",
          icon: "camera",
          type: "switch",
        },
        {
          key: "reaction_notifications",
          title: "Reaction Notifications",
          description: "Get notified when someone reacts to your content",
          icon: "heart",
          type: "switch",
        },
      ],
    },
    {
      title: "Chat & Media",
      data: [
        {
          key: "read_receipts_enabled",
          title: "Read Receipts",
          description: "Show when you've read messages",
          icon: "checkmark-done",
          type: "switch",
        },
        {
          key: "typing_indicators_enabled",
          title: "Typing Indicators",
          description: "Show when you're typing a message",
          icon: "create",
          type: "switch",
        },
        {
          key: "screenshot_notifications",
          title: "Screenshot Notifications",
          description: "Notify others when you screenshot their snaps",
          icon: "camera",
          type: "switch",
        },
        {
          key: "auto_download_media",
          title: "Auto-Download Media",
          description: "Automatically download photos and videos",
          icon: "download",
          type: "switch",
        },
        {
          key: "auto_play_videos",
          title: "Auto-Play Videos",
          description: "Automatically play videos in chat",
          icon: "play",
          type: "switch",
        },
      ],
    },
    {
      title: "Display & Accessibility",
      data: [
        {
          key: "font_size",
          title: "Font Size",
          description: "Choose your preferred text size",
          icon: "text",
          type: "select",
        },
        {
          key: "dark_mode_enabled",
          title: "Dark Mode",
          description: "Use dark theme throughout the app",
          icon: "moon",
          type: "switch",
        },
        {
          key: "reduce_motion",
          title: "Reduce Motion",
          description: "Minimize animations and transitions",
          icon: "accessibility",
          type: "switch",
        },
        {
          key: "high_contrast",
          title: "High Contrast",
          description: "Increase contrast for better visibility",
          icon: "contrast",
          type: "switch",
        },
      ],
    },
    {
      title: "Content & Data",
      data: [
        {
          key: "auto_save_to_journal",
          title: "Auto-Save to Journal",
          description: "Automatically save your snaps to journal",
          icon: "journal",
          type: "switch",
        },
        {
          key: "mature_content_filter",
          title: "Mature Content Filter",
          description: "Filter potentially mature content",
          icon: "shield",
          type: "switch",
        },
        {
          key: "data_saver_mode",
          title: "Data Saver Mode",
          description: "Reduce data usage for media content",
          icon: "cellular",
          type: "switch",
        },
      ],
    },
  ];

  if (preferencesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">Loading preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center border-b border-border bg-card px-4 py-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="gray" />
        </TouchableOpacity>
        <Text className="ml-3 text-lg font-bold text-foreground">Privacy & Settings</Text>
      </View>

      <SectionList
        sections={settingSections}
        keyExtractor={(item) => item.key}
        renderItem={renderSettingItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        className="flex-1"
      />

      {/* Privacy Info */}
      <View className="mx-4 mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <View className="mb-2 flex-row items-center">
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text className="ml-2 font-semibold text-blue-900">Privacy Tips</Text>
        </View>
        <Text className="text-sm text-blue-800">
          • Your privacy settings are saved automatically{"\n"}
          • You can change these settings anytime{"\n"}
          • Some features may require certain permissions{"\n"}
          • Blocked users cannot see your profile or send requests
        </Text>
      </View>
    </SafeAreaView>
  );
} 
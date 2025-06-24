/**
 * @file StoriesCarousel component - displays friends' stories in a horizontal scrollable carousel.
 * Shows story previews with user avatars and indicates viewed/unviewed states.
 */

import React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useGetStoriesFeedQuery } from "../../store/slices/api-slice";
import type { StoryFeedItem } from "../../types/database";

interface StoriesCarouselProps {
  onStoryPress?: (story: StoryFeedItem) => void;
}

export default function StoriesCarousel({ onStoryPress }: StoriesCarouselProps) {
  const router = useRouter();
  const { data: stories = [], isLoading, error } = useGetStoriesFeedQuery();

  /**
   * Handle story press - navigate to story viewer
   */
  const handleStoryPress = (story: StoryFeedItem) => {
    if (onStoryPress) {
      onStoryPress(story);
    } else {
      router.push({
        pathname: "/story-viewer",
        params: {
          userId: story.user_id,
          userName: story.display_name,
        }
      });
    }
  };

  /**
   * Handle add story press (for current user)
   */
  const handleAddStory = () => {
    router.push("/camera");
  };

  /**
   * Render individual story item
   */
  const renderStoryItem = ({ item }: { item: StoryFeedItem }) => {
    const isViewed = item.user_has_viewed;
    const isOwnStory = item.is_own_story;
    
    return (
      <TouchableOpacity
        className="items-center mr-4"
        onPress={() => handleStoryPress(item)}
        activeOpacity={0.7}
      >
        {/* Story Circle */}
        <View className="relative">
          {/* Gradient Ring for Unviewed Stories */}
          {!isViewed && !isOwnStory && (
            <View className="absolute -inset-1 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-0.5">
              <View className="rounded-full bg-background p-1">
                <View className="h-16 w-16 rounded-full bg-gray-200" />
              </View>
            </View>
          )}
          
          {/* Story Avatar */}
          <View 
            className={`h-16 w-16 rounded-full overflow-hidden border-2 ${
              isViewed || isOwnStory 
                ? 'border-gray-300' 
                : 'border-transparent'
            }`}
          >
            {item.avatar_url ? (
              <Image
                source={{ uri: item.avatar_url }}
                className="h-full w-full"
                resizeMode="cover"
              />
            ) : (
              <View className="h-full w-full bg-primary items-center justify-center">
                <Text className="text-lg font-bold text-primary-foreground">
                  {item.display_name?.charAt(0).toUpperCase() || "?"}
                </Text>
              </View>
            )}
          </View>

          {/* Story Count Indicator */}
          {item.total_stories > 1 && (
            <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-xs font-bold text-white">
                {item.total_stories}
              </Text>
            </View>
          )}
        </View>

        {/* Username */}
        <Text 
          className={`mt-2 text-xs text-center max-w-[70px] ${
            isViewed ? 'text-muted-foreground' : 'text-foreground font-semibold'
          }`}
          numberOfLines={1}
        >
          {isOwnStory ? 'Your Story' : (item.display_name || 'Unknown')}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render add story button (for current user)
   */
  const renderAddStoryButton = () => (
    <TouchableOpacity
      className="items-center mr-4"
      onPress={handleAddStory}
      activeOpacity={0.7}
    >
      {/* Add Story Circle */}
      <View className="h-16 w-16 rounded-full bg-gray-200 border-2 border-dashed border-gray-400 items-center justify-center">
        <Ionicons name="add" size={24} color="#6B7280" />
      </View>
      
      {/* Label */}
      <Text className="mt-2 text-xs text-center text-muted-foreground max-w-[70px]" numberOfLines={1}>
        Add Story
      </Text>
    </TouchableOpacity>
  );

  if (error) {
    console.error("Stories feed error:", error);
    return null; // Fail silently for better UX
  }

  if (isLoading) {
    return (
      <View className="py-4 px-4">
        <View className="flex-row items-center space-x-4">
          <ActivityIndicator size="small" />
          <Text className="text-muted-foreground">Loading stories...</Text>
        </View>
      </View>
    );
  }

  // If no stories, show just the add story button
  if (stories.length === 0) {
    return (
      <View className="py-4 px-4">
        <FlatList
          data={[{ id: 'add-story' }]}
          renderItem={renderAddStoryButton}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 0 }}
        />
      </View>
    );
  }

  // Separate own stories and friends' stories
  const ownStories = stories.filter(story => story.is_own_story);
  const friendsStories = stories.filter(story => !story.is_own_story);
  
  // Combine: Add Story button (if no own stories) + Own Stories + Friends' Stories
  const displayData = [
    ...(ownStories.length === 0 ? [{ id: 'add-story', isAddButton: true }] : []),
    ...ownStories,
    ...friendsStories
  ];

  return (
    <View className="py-4">
      <FlatList
        data={displayData}
        renderItem={({ item }) => {
          if ('isAddButton' in item) {
            return renderAddStoryButton();
          }
          return renderStoryItem({ item: item as StoryFeedItem });
        }}
        keyExtractor={(item) => 'isAddButton' in item ? 'add-story' : item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
} 
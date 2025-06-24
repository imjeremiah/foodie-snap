/**
 * @file SpotlightPost component - displays individual public posts in the spotlight feed.
 * Features image display, user information, captions, like/reaction buttons, and action menu.
 */

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpotlightFeedItem } from "../../types/database";
import { useToggleSpotlightReactionMutation, useReportSpotlightPostMutation } from "../../store/slices/api-slice";

interface SpotlightPostProps {
  post: SpotlightFeedItem;
  onUserPress?: (userId: string) => void;
  onImagePress?: (post: SpotlightFeedItem) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * SpotlightPost component displays individual posts in the spotlight feed
 * with engagement features and user interaction options
 */
export default function SpotlightPost({ post, onUserPress, onImagePress }: SpotlightPostProps) {
  const [showActions, setShowActions] = useState(false);
  const [toggleReaction, { isLoading: isReacting }] = useToggleSpotlightReactionMutation();
  const [reportPost] = useReportSpotlightPostMutation();

  /**
   * Handle like/unlike post reaction
   */
  function handleToggleLike() {
    if (isReacting) return;
    
    toggleReaction({
      postId: post.id,
      reactionType: 'like'
    });
  }

  /**
   * Handle user profile press
   */
  function handleUserPress() {
    onUserPress?.(post.user_id);
  }

  /**
   * Handle image press for full screen view
   */
  function handleImagePress() {
    onImagePress?.(post);
  }

  /**
   * Handle post reporting with reason selection
   */
  function handleReportPost() {
    Alert.alert(
      "Report Post",
      "Why are you reporting this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Inappropriate Content",
          onPress: () => reportPost({
            postId: post.id,
            reason: 'inappropriate',
            description: 'Inappropriate content reported by user'
          })
        },
        {
          text: "Spam",
          onPress: () => reportPost({
            postId: post.id,
            reason: 'spam',
            description: 'Spam content reported by user'
          })
        },
        {
          text: "Harassment",
          onPress: () => reportPost({
            postId: post.id,
            reason: 'harassment',
            description: 'Harassment reported by user'
          })
        },
        {
          text: "Other",
          onPress: () => reportPost({
            postId: post.id,
            reason: 'other',
            description: 'Other issue reported by user'
          })
        }
      ]
    );
    setShowActions(false);
  }

  /**
   * Format timestamp for display
   */
  function formatTimeAgo(timestamp: string): string {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }

  return (
    <View className="bg-card mb-4 rounded-xl overflow-hidden border border-border shadow-sm">
      {/* User Header */}
      <View className="flex-row items-center justify-between p-4 pb-2">
        <TouchableOpacity 
          onPress={handleUserPress}
          className="flex-row items-center flex-1"
        >
          <View className="w-10 h-10 rounded-full bg-muted items-center justify-center mr-3">
            {post.avatar_url ? (
              <Image 
                source={{ uri: post.avatar_url }} 
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Ionicons name="person" size={20} className="text-muted-foreground" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-foreground font-semibold text-base">
              {post.display_name || 'Unknown User'}
            </Text>
            <Text className="text-muted-foreground text-sm">
              {formatTimeAgo(post.created_at)}
            </Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => setShowActions(!showActions)}
          className="p-2"
        >
          <Ionicons name="ellipsis-horizontal" size={20} className="text-muted-foreground" />
        </TouchableOpacity>
      </View>

      {/* Actions Menu */}
      {showActions && (
        <View className="absolute top-16 right-4 bg-card border border-border rounded-lg shadow-lg z-10 min-w-[120px]">
          <TouchableOpacity
            onPress={handleReportPost}
            className="flex-row items-center px-4 py-3 border-b border-border"
          >
            <Ionicons name="flag-outline" size={16} className="text-destructive mr-2" />
            <Text className="text-destructive">Report</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowActions(false)}
            className="flex-row items-center px-4 py-3"
          >
            <Ionicons name="close-outline" size={16} className="text-muted-foreground mr-2" />
            <Text className="text-muted-foreground">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Post Image */}
      <TouchableOpacity onPress={handleImagePress} activeOpacity={0.9}>
        <Image
          source={{ uri: post.thumbnail_url || post.image_url }}
          style={{ 
            width: SCREEN_WIDTH - 32, 
            height: SCREEN_WIDTH - 32,
            marginHorizontal: 16
          }}
          className="rounded-lg"
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* Engagement Section */}
      <View className="p-4 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center space-x-4">
            <TouchableOpacity 
              onPress={handleToggleLike}
              disabled={isReacting}
              className="flex-row items-center"
            >
              <Ionicons 
                name={post.user_has_liked ? "heart" : "heart-outline"}
                size={24}
                className={post.user_has_liked ? "text-red-500" : "text-muted-foreground"}
              />
              <Text className="text-muted-foreground ml-1 text-sm">
                {post.like_count}
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Ionicons name="eye-outline" size={24} className="text-muted-foreground" />
              <Text className="text-muted-foreground ml-1 text-sm">
                {post.view_count}
              </Text>
            </View>
          </View>

          <TouchableOpacity className="p-2">
            <Ionicons name="share-outline" size={20} className="text-muted-foreground" />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {post.caption && (
          <View className="mt-3">
            <Text className="text-foreground text-base">
              <Text className="font-semibold">{post.display_name}</Text>
              <Text className="ml-2">{post.caption}</Text>
            </Text>
          </View>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <View className="flex-row flex-wrap mt-2">
            {post.tags.map((tag, index) => (
              <Text key={index} className="text-primary text-sm mr-2">
                #{tag}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
} 
/**
 * @file SpotlightFeed component - displays scrollable feed of public posts with infinite loading.
 * Features pull-to-refresh, feed type switching (recent/popular), and performance optimizations.
 */

import React, { useState, useCallback, useMemo } from "react";
import { 
  View, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator, 
  Text,
  TouchableOpacity,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useGetSpotlightFeedQuery } from "../../store/slices/api-slice";
import { SpotlightFeedItem } from "../../types/database";
import SpotlightPost from "./SpotlightPost";

interface SpotlightFeedProps {
  onUserPress?: (userId: string) => void;
  onImagePress?: (post: SpotlightFeedItem) => void;
}

/**
 * SpotlightFeed component displays an infinite scrolling feed of public posts
 * with pull-to-refresh and feed type switching capabilities
 */
export default function SpotlightFeed({ onUserPress, onImagePress }: SpotlightFeedProps) {
  const [feedType, setFeedType] = useState<'recent' | 'popular'>('recent');
  const [loadedPosts, setLoadedPosts] = useState<SpotlightFeedItem[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const POSTS_PER_PAGE = 10;

  const { 
    data: newPosts, 
    error, 
    isFetching, 
    refetch 
  } = useGetSpotlightFeedQuery({
    feedType,
    limit: POSTS_PER_PAGE,
    offset: currentOffset
  });

  /**
   * Update loaded posts when new data arrives
   */
  React.useEffect(() => {
    if (newPosts) {
      if (currentOffset === 0) {
        // Fresh data - replace all posts
        setLoadedPosts(newPosts);
        setHasReachedEnd(newPosts.length < POSTS_PER_PAGE);
      } else {
        // Pagination - append new posts
        const uniqueNewPosts = newPosts.filter(
          newPost => !loadedPosts.some(existingPost => existingPost.id === newPost.id)
        );
        
        if (uniqueNewPosts.length === 0) {
          setHasReachedEnd(true);
        } else {
          setLoadedPosts(prev => [...prev, ...uniqueNewPosts]);
          setHasReachedEnd(uniqueNewPosts.length < POSTS_PER_PAGE);
        }
      }
    }
  }, [newPosts, currentOffset]);

  /**
   * Reset feed and switch type
   */
  function handleFeedTypeChange(newType: 'recent' | 'popular') {
    if (newType === feedType) return;
    
    setFeedType(newType);
    setCurrentOffset(0);
    setLoadedPosts([]);
    setHasReachedEnd(false);
  }

  /**
   * Handle pull-to-refresh
   */
  function handleRefresh() {
    setCurrentOffset(0);
    setLoadedPosts([]);
    setHasReachedEnd(false);
    refetch();
  }

  /**
   * Handle infinite scroll - load more posts
   */
  function handleLoadMore() {
    if (!isFetching && !hasReachedEnd && loadedPosts.length >= POSTS_PER_PAGE) {
      setCurrentOffset(loadedPosts.length);
    }
  }

  /**
   * Handle user profile press
   */
  function handleUserPress(userId: string) {
    onUserPress?.(userId);
  }

  /**
   * Handle image press for full screen view
   */
  function handleImagePress(post: SpotlightFeedItem) {
    onImagePress?.(post);
  }

  /**
   * Render individual post item
   */
  const renderPost = useCallback(({ item }: { item: SpotlightFeedItem }) => (
    <SpotlightPost
      post={item}
      onUserPress={handleUserPress}
      onImagePress={handleImagePress}
    />
  ), []);

  /**
   * Render loading footer for infinite scroll
   */
  const renderFooter = useCallback(() => {
    if (!isFetching || currentOffset === 0) return null;
    
    return (
      <View className="py-4 items-center">
        <ActivityIndicator size="small" className="text-primary" />
        <Text className="text-muted-foreground text-sm mt-2">Loading more posts...</Text>
      </View>
    );
  }, [isFetching, currentOffset]);

  /**
   * Render empty state
   */
  const renderEmpty = useCallback(() => {
    if (isFetching && loadedPosts.length === 0) {
      return (
        <View className="flex-1 items-center justify-center py-8">
          <ActivityIndicator size="large" className="text-primary" />
          <Text className="text-muted-foreground text-lg mt-4">Loading posts...</Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-8">
        <Ionicons name="images-outline" size={64} className="text-muted-foreground mb-4" />
        <Text className="text-foreground text-xl font-semibold mb-2">No Posts Yet</Text>
        <Text className="text-muted-foreground text-center px-8">
          Be the first to share something amazing with the community! 
          Posts you create will appear here.
        </Text>
      </View>
    );
  }, [isFetching, loadedPosts.length]);

  /**
   * Handle error state
   */
  if (error && loadedPosts.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="warning-outline" size={64} className="text-destructive mb-4" />
          <Text className="text-foreground text-xl font-semibold mb-2">Unable to Load Posts</Text>
          <Text className="text-muted-foreground text-center mb-6">
            There was a problem loading the spotlight feed. Please check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={handleRefresh}
            className="bg-primary px-6 py-3 rounded-lg"
          >
            <Text className="text-primary-foreground font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header with Feed Type Selector */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
        <Text className="text-foreground text-2xl font-bold">Spotlight</Text>
        
        <View className="flex-row bg-muted rounded-lg p-1">
          <TouchableOpacity
            onPress={() => handleFeedTypeChange('recent')}
            className={`px-4 py-2 rounded-md ${
              feedType === 'recent' 
                ? 'bg-background shadow-sm' 
                : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${
              feedType === 'recent'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}>
              Recent
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleFeedTypeChange('popular')}
            className={`px-4 py-2 rounded-md ${
              feedType === 'popular' 
                ? 'bg-background shadow-sm' 
                : 'bg-transparent'
            }`}
          >
            <Text className={`text-sm font-medium ${
              feedType === 'popular'
                ? 'text-foreground'
                : 'text-muted-foreground'
            }`}>
              Popular
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Posts Feed */}
      <FlatList
        data={loadedPosts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && currentOffset === 0}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={10}
        initialNumToRender={5}
        getItemLayout={(data, index) => ({
          length: 500, // Approximate height of a post
          offset: 500 * index,
          index,
        })}
      />
    </SafeAreaView>
  );
} 
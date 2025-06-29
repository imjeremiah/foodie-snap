/**
 * @file Content Spark screen - displays weekly personalized content prompts (User Story #2).
 * This screen shows 3 AI-generated prompts to inspire content creation based on user preferences.
 */

import React, { useEffect, useState } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  useGetCurrentContentSparkQuery,
  useGenerateWeeklyContentSparksMutation,
  useMarkContentSparkViewedMutation,
  useRecordPromptUsageMutation
} from "../store/slices/api-slice";
import { useAuth } from "../contexts/AuthContext";
import type { PromptData } from "../types/database";

interface PromptCardProps {
  prompt: PromptData;
  index: number;
  onUsePrompt: (prompt: PromptData, index: number) => void;
  isUsed: boolean;
}

/**
 * Individual prompt card component
 */
function PromptCard({ prompt, index, onUsePrompt, isUsed }: PromptCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-700 bg-green-200 border-green-300';
      case 'medium': return 'text-orange-700 bg-orange-200 border-orange-300';
      case 'advanced': return 'text-red-700 bg-red-200 border-red-300';
      default: return 'text-gray-700 bg-gray-200 border-gray-300';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'video' ? 'videocam' : 'camera';
  };

  const getCategoryEmoji = (category: string) => {
    const categoryMap: Record<string, string> = {
      'meal_prep': '🥘',
      'workout': '💪',
      'nutrition': '🥗',
      'lifestyle': '🌱',
      'recipe': '👨‍🍳',
      'wellness': '✨',
      'fitness': '🏃‍♂️'
    };
    return categoryMap[category] || '📸';
  };

  return (
    <View className={`p-4 rounded-lg border-2 mb-4 shadow-sm ${
      isUsed 
        ? 'border-green-300 bg-green-50' 
        : 'border-border bg-card'
    }`}>
      {/* Header with difficulty and type */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center space-x-2">
          <Text className="text-2xl">{getCategoryEmoji(prompt.category)}</Text>
          <View className={`px-3 py-1.5 rounded-full border ${getDifficultyColor(prompt.difficulty)}`}>
            <Text className="text-xs font-semibold capitalize">
              {prompt.difficulty}
            </Text>
          </View>
          <View className="px-2 py-1 rounded-full bg-blue-100">
            <Text className="text-xs font-medium text-blue-600 capitalize">
              {prompt.type}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center space-x-1">
          <Ionicons name="time-outline" size={14} color="#6B7280" />
          <Text className="text-xs text-muted-foreground">
            {prompt.estimated_time}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text className="text-lg font-bold text-foreground mb-2">
        {prompt.title}
      </Text>

      {/* Description */}
      <Text className="text-sm text-muted-foreground leading-6 mb-4">
        {prompt.description}
      </Text>

      {/* Action button */}
      <TouchableOpacity
        className={`flex-row items-center justify-center px-4 py-3 rounded-lg ${
          isUsed
            ? 'bg-green-500'
            : 'bg-primary'
        }`}
        onPress={() => onUsePrompt(prompt, index)}
      >
        <Ionicons 
          name={isUsed ? "checkmark" : getTypeIcon(prompt.type)} 
          size={16} 
          color="white" 
        />
        <Text className="text-primary-foreground font-medium ml-2">
          {isUsed ? "Used" : `Create ${prompt.type}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

/**
 * Success toast component for subtle feedback
 */
function SuccessToast({ visible, onHide }: { visible: boolean; onHide: () => void }) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <SafeAreaView className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
      <View className="px-4 pt-2">
        <View className="bg-green-500 px-4 py-3 rounded-lg shadow-lg flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color="white" />
          <Text className="text-white font-medium ml-2">
            ✨ New content sparks generated!
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function ContentSparkScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // API hooks
  const { 
    data: contentSpark, 
    isLoading, 
    error, 
    refetch 
  } = useGetCurrentContentSparkQuery(undefined, {
    // Skip cache for more reliable fresh data after mutations
    refetchOnMountOrArgChange: 30, // Refetch if query was made more than 30 seconds ago
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  // Debug logging
  console.log('🔍 Content Spark Debug:', {
    contentSpark,
    isLoading,
    error,
    user: user?.id
  });
  
  const [generateWeeklyContentSparks, { isLoading: isGenerating }] = useGenerateWeeklyContentSparksMutation();
  const [markContentSparkViewed] = useMarkContentSparkViewedMutation();
  const [recordPromptUsage] = useRecordPromptUsageMutation();

  /**
   * Mark as viewed when component mounts if this is a new spark
   */
  useEffect(() => {
    if (contentSpark && contentSpark.is_new && contentSpark.id) {
      markContentSparkViewed(contentSpark.id)
        .catch(error => {
          console.error('Failed to mark content spark as viewed:', error);
        });
    }
  }, [contentSpark, markContentSparkViewed]);

  /**
   * Handle pull-to-refresh with force refetch
   */
  const onRefresh = async () => {
    console.log('🔄 Force refreshing content spark...');
    setRefreshing(true);
    try {
      await refetch();
      console.log('✅ Content spark refresh completed');
    } catch (error) {
      console.error('❌ Content spark refresh failed:', error);
    }
    setRefreshing(false);
  };

  /**
   * Force refresh content spark data (bypasses cache)
   */
  const forceRefreshContentSpark = async () => {
    console.log('🔄 Force refreshing content spark data...');
    try {
      await refetch();
      console.log('✅ Force refresh completed');
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
    }
  };

  /**
   * Generate new content sparks with immediate feedback
   */
  const handleGenerateNew = async () => {
    if (!user) return;

    Alert.alert(
      "Generate New Content Sparks",
      "This will generate new personalized prompts for this week. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate",
          onPress: async () => {
            try {
              const result = await generateWeeklyContentSparks({ 
                userId: user.id 
              }).unwrap();
              
              console.log('✅ Generation result:', result);
              
              if (result.success) {
                // Force refetch with a small delay to ensure data is written
                setTimeout(async () => {
                  console.log('🔄 Force refetching content spark...');
                  await refetch();
                  console.log('✅ Refetch completed');
                }, 1000);
                
                // Show subtle success feedback
                setShowSuccessToast(true);
              } else {
                console.error('❌ Generation reported failure:', result.error);
                throw new Error(result.error || 'Generation failed');
              }
            } catch (error) {
              console.error('Failed to generate content sparks:', error);
              Alert.alert(
                "Generation Failed",
                "Failed to generate new content sparks. Please try again later.",
                [{ text: "OK" }]
              );
            }
          }
        }
      ]
    );
  };

  /**
   * Handle using a prompt - navigate to camera and record usage
   */
  const handleUsePrompt = async (prompt: PromptData, index: number) => {
    // Record prompt usage
    if (contentSpark?.id) {
      try {
        await recordPromptUsage({
          contentSparkId: contentSpark.id,
          promptIndex: index
        }).unwrap();
      } catch (error) {
        console.error('Failed to record prompt usage:', error);
      }
    }

    // Navigate to camera with prompt context
    router.push({
      pathname: "/(tabs)/camera",
      params: {
        promptTitle: prompt.title,
        promptDescription: prompt.description,
        promptType: prompt.type,
        promptCategory: prompt.category
      }
    });
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  // Loading state
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366F1" />
          <Text className="mt-4 text-center text-muted-foreground">
            Loading your content sparks...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-xl font-semibold text-foreground">
            Error Loading Content Sparks
          </Text>
          <Text className="mt-2 text-center text-muted-foreground">
            Please try again later
          </Text>
          <TouchableOpacity
            className="mt-4 rounded-md bg-primary px-6 py-3"
            onPress={() => refetch()}
          >
            <Text className="font-semibold text-primary-foreground">
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No content spark available
  if (!contentSpark) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <TouchableOpacity onPress={handleBack}>
            <Ionicons name="chevron-back" size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Content Spark</Text>
          <View style={{ width: 24 }} />
        </View>

        <View className="flex-1 items-center justify-center px-4">
          <View className="items-center">
            <Text className="text-6xl mb-4">🔥</Text>
            <Text className="text-xl font-bold text-foreground mb-2">
              No Content Spark Yet
            </Text>
            <Text className="text-center text-muted-foreground mb-6">
              Your weekly content sparks will appear here. Generate your first set of personalized prompts!
            </Text>
            <TouchableOpacity
              className={`px-6 py-3 rounded-lg ${
                isGenerating ? 'bg-muted' : 'bg-primary'
              }`}
              onPress={handleGenerateNew}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="font-semibold text-primary-foreground ml-2">
                    Generating...
                  </Text>
                </View>
              ) : (
                <Text className="font-semibold text-primary-foreground">
                  Generate Content Sparks
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const prompts = contentSpark.prompts || [];
  const usedPrompts = contentSpark.prompts_used || [];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Success Toast */}
      <SuccessToast 
        visible={showSuccessToast} 
        onHide={() => setShowSuccessToast(false)} 
      />

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
        <TouchableOpacity onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#6B7280" />
        </TouchableOpacity>
        <View className="flex-row items-center space-x-2">
          <Text className="text-lg font-semibold text-foreground">Content Spark</Text>
          <Text className="text-2xl">🔥</Text>
        </View>
        <View className="flex-row items-center space-x-3">
          <TouchableOpacity onPress={forceRefreshContentSpark}>
            <Ionicons name="reload" size={24} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGenerateNew} disabled={isGenerating}>
            {isGenerating ? (
              <ActivityIndicator size={24} color="#6B7280" />
            ) : (
              <Ionicons name="refresh" size={24} color="#6B7280" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Week info */}
        <View className="px-4 py-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-2xl font-bold text-foreground">
              This Week's Sparks
            </Text>
            {contentSpark.is_new && (
              <View className="px-2 py-1 rounded-full bg-red-100">
                <Text className="text-xs font-medium text-red-600">NEW</Text>
              </View>
            )}
          </View>
          <Text className="text-sm text-muted-foreground">
            Personalized prompts to inspire your health and fitness content
          </Text>
        </View>

        {/* Prompts */}
        <View className="px-4 pb-6">
          {prompts.map((prompt, index) => (
            <PromptCard
              key={index}
              prompt={prompt}
              index={index}
              onUsePrompt={handleUsePrompt}
              isUsed={usedPrompts.includes(index)}
            />
          ))}
        </View>

        {/* Footer info */}
        <View className="px-4 pb-8">
          <View className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-sm font-medium text-blue-800 ml-2">
                About Content Sparks
              </Text>
            </View>
            <Text className="text-sm text-blue-700 leading-5">
              These prompts are personalized based on your fitness goals, dietary preferences, 
              and content style. New sparks are generated weekly to keep your content fresh and engaging.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 
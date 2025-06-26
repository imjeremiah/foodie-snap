/**
 * @file Preview screen - displays captured photo or video with action buttons.
 * Shows the captured media and provides Send/Discard functionality for both photos and videos.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ScrollView,
  ActivityIndicator,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { VideoView, useVideoPlayer } from "expo-video";
import { 
  useGetConversationsQuery, 
  useSendPhotoMessageMutation, 
  useSaveToJournalMutation, 
  useSendSnapMessageEnhancedMutation, 
  useCreateStoryMutation,
  useGenerateSmartCaptionsMutation,
  useStoreAiFeedbackMutation,
  useGenerateContentEmbeddingsMutation
} from "../store/slices/api-slice";
import type { ConversationWithDetails, NutritionCard as NutritionCardType } from "../types/database";
import CreativeToolsModal from "../components/creative/CreativeToolsModal";
import NutritionCard from "../components/nutrition/NutritionCard";
import { useAuth } from "../contexts/AuthContext";

type MediaType = 'photo' | 'video';

export default function PreviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { mediaUri, mediaType = 'photo', nutritionCardData } = useLocalSearchParams<{ 
    mediaUri: string; 
    mediaType: string;
    nutritionCardData?: string;
  }>();
  
  // State for send modal and journal saving
  const [showSendModal, setShowSendModal] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingToJournal, setSavingToJournal] = useState(false);
  const [postingToStory, setPostingToStory] = useState(false);
  const [sendMode, setSendMode] = useState<'regular' | 'snap'>('regular');
  const [snapSettings, setSnapSettings] = useState({
    viewingDuration: 5,
    maxReplays: 1,
    expiresIn: 86400 // 24 hours
  });

  // Creative tools state
  const [showCreativeTools, setShowCreativeTools] = useState(false);
  const [editedMediaUri, setEditedMediaUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  // AI Caption state
  const [showAiCaptionModal, setShowAiCaptionModal] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string>('');
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);

  // Nutrition card state
  const [nutritionCard, setNutritionCard] = useState<NutritionCardType | null>(null);
  const isNutritionCard = mediaType === 'nutrition-card';

  // API hooks - only fetch conversations when user is authenticated
  const { data: conversations = [], isLoading: loadingConversations } = useGetConversationsQuery(undefined, {
    skip: !user
  });
  const [sendPhotoMessage] = useSendPhotoMessageMutation();
  const [saveToJournal] = useSaveToJournalMutation();
  const [sendSnapMessage] = useSendSnapMessageEnhancedMutation();
  const [createStory] = useCreateStoryMutation();
  
  // RAG AI hooks
  const [generateSmartCaptions] = useGenerateSmartCaptionsMutation();
  const [storeAiFeedback] = useStoreAiFeedbackMutation();
  const [generateContentEmbeddings] = useGenerateContentEmbeddingsMutation();

  // Determine if this is a video
  const isVideo = mediaType === 'video';

  // Parse nutrition card data on mount
  useEffect(() => {
    if (nutritionCardData && isNutritionCard) {
      try {
        const parsedCard = JSON.parse(nutritionCardData);
        setNutritionCard(parsedCard);
      } catch (error) {
        console.error('Failed to parse nutrition card data:', error);
        Alert.alert('Error', 'Failed to load nutrition card data');
        router.back();
      }
    }
  }, [nutritionCardData, isNutritionCard]);

  // Track when editedMediaUri changes (removed excessive logging)
  useEffect(() => {
    // Reset error state when media URI changes
    if (editedMediaUri) {
      setImageLoadError(false);
    }
  }, [editedMediaUri]);

  // Create video player for preview
  const videoPlayer = useVideoPlayer(
    isVideo && mediaUri ? mediaUri : null,
    player => {
      if (player) {
        player.loop = true;
        player.play();
      }
    }
  );

  /**
   * Handle discard action - return to camera
   */
  const handleDiscard = () => {
    Alert.alert(
      `Discard ${isVideo ? 'Video' : 'Photo'}`,
      `Are you sure you want to discard this ${isVideo ? 'video' : 'photo'}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Discard", 
          style: "destructive",
          onPress: () => router.back()
        },
      ]
    );
  };

  /**
   * Handle send action - show conversation selection modal
   */
  const handleSend = () => {
    if (conversations.length === 0) {
      Alert.alert(
        "No Conversations",
        `You need to have at least one conversation to send ${isVideo ? 'videos' : 'photos'}. Start a conversation first!`,
        [{ text: "OK" }]
      );
      return;
    }
    setShowSendModal(true);
  };

  /**
   * Send media to a specific conversation
   */
  const sendToConversation = async (conversation: ConversationWithDetails) => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert("Authentication Error", "Please sign in to send messages.");
      return;
    }

    // Handle nutrition card sharing
    if (isNutritionCard && nutritionCard) {
      setSending(true);
      try {
        // Create a formatted nutrition summary message
        const nutritionSummary = `🍎 **${nutritionCard.foodName}**

📊 **Nutrition Facts:**
• Calories: ${nutritionCard.nutritionFacts.calories}
• Protein: ${nutritionCard.nutritionFacts.protein}g
• Carbs: ${nutritionCard.nutritionFacts.carbs}g
• Fat: ${nutritionCard.nutritionFacts.fat}g

💡 **Health Insights:**
${nutritionCard.healthInsights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

🍳 **Recipe Ideas:**
${nutritionCard.recipeIdeas.map((recipe, i) => `${i + 1}. ${recipe}`).join('\n')}

🤖 *AI-powered nutrition analysis*`;

        // Send as text message (we could create a visual card in the future)
        const result = await sendPhotoMessage({
          conversation_id: conversation.id,
          content: nutritionSummary,
          imageUri: '', // No image for nutrition card sharing
          mediaType: 'photo', // Use photo type but without actual image
          options: { quality: 0.8 }
        }).unwrap();

        Alert.alert(
          "Nutrition Card Sent!",
          `Nutrition analysis sent to ${conversation.other_participant.display_name || 'your friend'}`,
          [{ text: "OK", onPress: () => router.back() }]
        );
        setShowSendModal(false);
      } catch (error) {
        console.error('Failed to send nutrition card:', error);
        Alert.alert("Send Failed", "Failed to send nutrition card. Please try again.", [{ text: "OK" }]);
      } finally {
        setSending(false);
      }
      return;
    }

    // Regular media sending
    if (!currentMediaUri) {
      Alert.alert("Error", "No media found to send.");
      return;
    }

    console.log('Sending to conversation:', conversation.id, 'Mode:', sendMode, 'User:', user.id);
    setSending(true);
    
    try {
      if (sendMode === 'snap') {
        // Send as snap with enhanced features
        console.log('Sending snap with settings:', snapSettings);
        const result = await sendSnapMessage({
          conversation_id: conversation.id,
          content: selectedCaption || undefined,
          imageUri: currentMediaUri,
          viewing_duration: snapSettings.viewingDuration,
          max_replays: snapSettings.maxReplays,
          expires_in_seconds: snapSettings.expiresIn,
          options: { quality: 0.8 }
        }).unwrap();

        console.log('Snap sent successfully:', result);
        Alert.alert(
          "Snap Sent!",
          `Snap sent to ${conversation.other_participant.display_name || 'your friend'} (${snapSettings.viewingDuration}s viewing time)`,
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        // Send as regular photo/video
        console.log('Sending regular message');
        const result = await sendPhotoMessage({
          conversation_id: conversation.id,
          content: selectedCaption || undefined,
          imageUri: currentMediaUri,
          mediaType: mediaType as 'photo' | 'video',
          options: { quality: 0.8 }
        }).unwrap();

        console.log('Photo/video sent successfully:', result);
        Alert.alert(
          `${isVideo ? 'Video' : 'Photo'} Sent!`,
          `${isVideo ? 'Video' : 'Photo'} sent to ${conversation.other_participant.display_name || 'your friend'}`,
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
      
      setShowSendModal(false);
    } catch (error) {
      console.error(`Failed to send ${sendMode === 'snap' ? 'snap' : mediaType}:`, error);
      
      // More detailed error logging
      if (error && typeof error === 'object') {
        console.error('Error details:', JSON.stringify(error, null, 2));
      }
      
      let errorMessage = `Failed to send ${sendMode === 'snap' ? 'snap' : (isVideo ? 'video' : 'photo')}.`;
      
      // Provide more specific error messages
      if (error && typeof error === 'object' && 'error' in error) {
        const errorObj = error as any;
        if (errorObj.error === "No authenticated user") {
          errorMessage = "Authentication error. Please try signing out and back in.";
        } else if (errorObj.error) {
          errorMessage = `Send failed: ${errorObj.error}`;
        }
      }
      
      Alert.alert("Send Failed", errorMessage, [{ text: "OK" }]);
    } finally {
      setSending(false);
    }
  };

  /**
   * Handle saving to journal
   */
      const handleSaveToJournal = async () => {
    if (!currentMediaUri) return;

    setSavingToJournal(true);
    try {
      const result = await saveToJournal({
        imageUri: currentMediaUri,
        caption: selectedCaption || undefined,
        content_type: mediaType as 'photo' | 'video',
        options: { quality: 0.8 }
      }).unwrap();

      Alert.alert(
        "Saved to Journal!",
        `Your ${isVideo ? 'video' : 'photo'} has been saved to your journal.`,
        [{ text: "OK" }]
      );

      // Trigger asynchronous embedding generation for RAG
      if (result && result.id) {
        generateContentEmbeddings({
          journalEntryId: result.id,
          imageUri: currentMediaUri,
          caption: selectedCaption || undefined
        }).catch(error => {
          console.error('Failed to generate embeddings:', error);
          // Don't show user error - this is background processing
        });
      }
    } catch (error) {
      console.error(`Failed to save ${mediaType} to journal:`, error);
      Alert.alert(
        "Save Failed",
        `Failed to save ${isVideo ? 'video' : 'photo'} to journal. Please try again.`,
        [{ text: "OK" }]
      );
    } finally {
      setSavingToJournal(false);
    }
  };

  /**
   * Handle posting to story
   */
  const handlePostToStory = async () => {
    if (!currentMediaUri) return;

    setPostingToStory(true);
    try {
      await createStory({
        imageUri: currentMediaUri,
        caption: selectedCaption || undefined,
        content_type: mediaType as 'photo' | 'video',
        viewing_duration: 5, // Default 5 seconds
        options: { quality: 0.8 }
      }).unwrap();

      Alert.alert(
        "Posted to Story!",
        `Your ${isVideo ? 'video' : 'photo'} has been posted to your story. It will disappear after 24 hours.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error(`Failed to post ${mediaType} to story:`, error);
      Alert.alert(
        "Post Failed",
        `Failed to post ${isVideo ? 'video' : 'photo'} to story. Please try again.`,
        [{ text: "OK" }]
      );
    } finally {
      setPostingToStory(false);
    }
  };

  /**
   * Handle back navigation
   */
  const handleBack = () => {
    router.back();
  };

  /**
   * Handle opening creative tools
   */
  const handleOpenCreativeTools = () => {
    setShowCreativeTools(true);
  };

  /**
   * Handle saving edited media from creative tools
   */
  const handleSaveEditedMedia = (newEditedUri: string) => {
    setEditedMediaUri(newEditedUri);
    setImageLoadError(false); // Reset error state
    setShowCreativeTools(false);
  };

  // Memoize the current media URI to prevent unnecessary re-renders
  const currentMediaUri = useMemo(() => {
    return editedMediaUri || mediaUri;
  }, [editedMediaUri, mediaUri]);

  /**
   * Generate AI captions for the current media
   */
  const handleGenerateAiCaptions = async () => {
    if (!currentMediaUri) {
      Alert.alert("Error", "No media found to analyze.");
      return;
    }

    setIsGeneratingCaptions(true);
    try {
      const result = await generateSmartCaptions({
        imageUri: currentMediaUri,
        contentType: mediaType as 'photo' | 'video',
        context: {
          selectedCaption,
          captionCount: generatedCaptions.length
        }
      }).unwrap();

      if (result.success && result.captions) {
        setGeneratedCaptions(result.captions);
        setShowAiCaptionModal(true);
      } else {
        throw new Error(result.error || 'Failed to generate captions');
      }
    } catch (error) {
      console.error('Caption generation failed:', error);
      Alert.alert(
        "Caption Generation Failed",
        "Unable to generate AI captions at this time. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  /**
   * Handle caption selection
   */
  const handleCaptionSelect = (caption: string, index: number) => {
    setSelectedCaption(caption);
    setShowAiCaptionModal(false);
    
    // Store positive feedback for selected caption
    const suggestionId = `caption_${Date.now()}_${index}`;
    storeAiFeedback({
      suggestion_type: 'caption',
      suggestion_id: suggestionId,
      feedback_type: 'thumbs_up',
      original_suggestion: caption,
      context_metadata: {
        media_type: mediaType,
        selection_index: index,
        total_options: generatedCaptions.length,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('Failed to store caption feedback:', error);
    });
  };

  /**
   * Handle caption feedback (thumbs up/down)
   */
  const handleCaptionFeedback = (caption: string, index: number, feedbackType: 'thumbs_up' | 'thumbs_down') => {
    const suggestionId = `caption_${Date.now()}_${index}`;
    storeAiFeedback({
      suggestion_type: 'caption',
      suggestion_id: suggestionId,
      feedback_type: feedbackType,
      original_suggestion: caption,
      context_metadata: {
        media_type: mediaType,
        feedback_index: index,
        total_options: generatedCaptions.length,
        timestamp: new Date().toISOString()
      }
    }).catch(error => {
      console.error('Failed to store caption feedback:', error);
    });
  };

  if (!mediaUri && !isNutritionCard) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="text-center text-xl font-semibold text-foreground">
              No Media Found
            </Text>
            <Text className="mt-2 text-center text-muted-foreground">
              Please go back and capture a photo or video
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-md bg-primary px-4 py-3"
              onPress={handleBack}
            >
              <Text className="text-center font-semibold text-primary-foreground">
                Back to Camera
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isNutritionCard && !nutritionCard) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <View className="rounded-lg border border-border bg-card p-6 shadow-lg">
            <Text className="text-center text-xl font-semibold text-foreground">
              Loading Nutrition Card...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Header with back button */}
      <View className="absolute top-0 left-0 right-0 z-10 pt-12 pb-4">
        <View className="flex-row items-center justify-between px-4">
          <TouchableOpacity
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white">
            {isNutritionCard ? 'Nutrition Card' : (isVideo ? 'Video Preview' : 'Photo Preview')}
          </Text>
          <View className="h-10 w-10" />
        </View>
      </View>

      {/* Media display */}
      <View className="flex-1 items-center justify-center">
        {isNutritionCard && nutritionCard ? (
          <View className="flex-1 items-center justify-center w-full px-4">
            <NutritionCard
              nutritionCard={nutritionCard}
              onFeedback={(type, section) => {
                // Handle feedback if needed
                console.log('Nutrition card feedback:', type, section);
              }}
            />
          </View>
        ) : isVideo ? (
          <VideoView
            player={videoPlayer}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            allowsFullscreen={false}
            showsTimecodes={true}
            nativeControls={true}
          />
        ) : (
          <View className="flex-1 items-center justify-center w-full">
            <Image
              key={currentMediaUri} // Use memoized URI to prevent unnecessary re-renders
              source={{ uri: currentMediaUri }}
              className="h-full w-full"
              resizeMode="contain"
              onLoad={() => {
                setImageLoading(false);
                setImageLoadError(false);
              }}
              onError={(error) => {
                console.error('Preview: Image load error:', error);
                setImageLoading(false);
                setImageLoadError(true);
              }}
              onLoadStart={() => {
                setImageLoading(true);
                setImageLoadError(false);
              }}
              onLoadEnd={() => {
                // Only set loading to false if not already handled by onLoad
                setTimeout(() => setImageLoading(false), 100);
              }}
            />
            {imageLoading && (
              <View className="absolute inset-0 items-center justify-center bg-black/50">
                <ActivityIndicator size="large" color="white" />
                <Text className="mt-2 text-white">Loading image...</Text>
              </View>
            )}
            {imageLoadError && (
              <View className="absolute inset-0 items-center justify-center bg-black/70">
                <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
                <Text className="mt-4 text-white text-lg font-semibold">Failed to Load Image</Text>
                <Text className="mt-2 text-white/70 text-center px-4">
                  The edited image could not be loaded. Using original image.
                </Text>
                <TouchableOpacity
                  className="mt-4 bg-primary px-6 py-3 rounded-lg"
                  onPress={() => {
                    setEditedMediaUri(null);
                    setImageLoadError(false);
                  }}
                >
                  <Text className="text-white font-semibold">Use Original</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Edit and AI buttons (floating) - hidden for nutrition cards */}
      {!isNutritionCard && (
        <View className="absolute top-20 right-4 space-y-3">
          {/* AI Caption button */}
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-full bg-purple-500"
            onPress={handleGenerateAiCaptions}
            disabled={isGeneratingCaptions}
          >
            {isGeneratingCaptions ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="sparkles" size={20} color="white" />
            )}
          </TouchableOpacity>
          
          {/* Edit button */}
          <TouchableOpacity
            className="h-12 w-12 items-center justify-center rounded-full bg-blue-500"
            onPress={handleOpenCreativeTools}
          >
            <Ionicons name="brush" size={20} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom action buttons */}
      <View className="absolute bottom-0 left-0 right-0 pb-8">
        <View className="flex-row items-center justify-center space-x-3 px-4">
          {/* Discard button */}
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-black/50 py-4"
            onPress={handleDiscard}
          >
            <View className="items-center">
              <Ionicons name="trash-outline" size={20} color="white" />
              <Text className="mt-1 text-xs font-medium text-white">
                Discard
              </Text>
            </View>
          </TouchableOpacity>

          {/* Save to Journal button - disabled for nutrition cards */}
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-full py-4 ${
              isNutritionCard ? 'bg-gray-500' : 'bg-green-600'
            }`}
            onPress={isNutritionCard ? undefined : handleSaveToJournal}
            disabled={savingToJournal || isNutritionCard}
          >
            <View className="items-center">
              {savingToJournal ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="bookmark-outline" size={20} color="white" />
              )}
              <Text className="mt-1 text-xs font-medium text-white">
                {savingToJournal ? "Saving..." : "Journal"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Story button - disabled for nutrition cards */}
          <TouchableOpacity
            className={`flex-1 items-center justify-center rounded-full py-4 ${
              isNutritionCard ? 'bg-gray-500' : 'bg-purple-600'
            }`}
            onPress={isNutritionCard ? undefined : handlePostToStory}
            disabled={postingToStory || isNutritionCard}
          >
            <View className="items-center">
              {postingToStory ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="time-outline" size={20} color="white" />
              )}
              <Text className="mt-1 text-xs font-medium text-white">
                {postingToStory ? "Posting..." : "Story"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Send button */}
          <TouchableOpacity
            className="flex-1 items-center justify-center rounded-full bg-primary py-4"
            onPress={handleSend}
            disabled={sending}
          >
            <View className="items-center">
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="send" size={20} color="white" />
              )}
              <Text className="mt-1 text-xs font-medium text-white">
                {sending ? "Sending..." : "Send"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Send Modal */}
      <Modal
        visible={showSendModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSendModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <TouchableOpacity onPress={() => setShowSendModal(false)}>
                <Text className="text-primary">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">
                Send {isNutritionCard ? 'Nutrition Card' : (sendMode === 'snap' ? 'Snap' : (isVideo ? 'Video' : 'Photo'))}
              </Text>
              <View className="w-12" />
            </View>

            {/* Send Mode Toggle - hide for nutrition cards */}
            {!isNutritionCard && (
              <View className="flex-row border-b border-border">
                <TouchableOpacity
                  className={`flex-1 py-3 items-center ${sendMode === 'regular' ? 'border-b-2 border-primary' : ''}`}
                  onPress={() => setSendMode('regular')}
                >
                  <Text className={`font-semibold ${sendMode === 'regular' ? 'text-primary' : 'text-muted-foreground'}`}>
                    Regular
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-3 items-center ${sendMode === 'snap' ? 'border-b-2 border-purple-500' : ''}`}
                  onPress={() => setSendMode('snap')}
                >
                  <Text className={`font-semibold ${sendMode === 'snap' ? 'text-purple-500' : 'text-muted-foreground'}`}>
                    Snap
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Snap Settings (only show when snap mode is selected and not nutrition card) */}
            {sendMode === 'snap' && !isNutritionCard && (
              <View className="border-b border-border bg-purple-50 px-4 py-4">
                <Text className="text-sm font-semibold text-purple-800 mb-3">Snap Settings</Text>
                
                {/* Viewing Duration */}
                <View className="mb-3">
                  <Text className="text-xs text-purple-600 mb-1">Viewing Duration</Text>
                  <View className="flex-row space-x-2">
                    {[3, 5, 7, 10].map((duration) => (
                      <TouchableOpacity
                        key={duration}
                        className={`px-3 py-2 rounded-full ${
                          snapSettings.viewingDuration === duration 
                            ? 'bg-purple-500' 
                            : 'bg-purple-200'
                        }`}
                        onPress={() => setSnapSettings(prev => ({ ...prev, viewingDuration: duration }))}
                      >
                        <Text className={`text-xs font-semibold ${
                          snapSettings.viewingDuration === duration 
                            ? 'text-white' 
                            : 'text-purple-700'
                        }`}>
                          {duration}s
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Replay Settings */}
                <View className="mb-3">
                  <Text className="text-xs text-purple-600 mb-1">Replays Allowed</Text>
                  <View className="flex-row space-x-2">
                    {[1, 2, 3].map((replays) => (
                      <TouchableOpacity
                        key={replays}
                        className={`px-3 py-2 rounded-full ${
                          snapSettings.maxReplays === replays 
                            ? 'bg-purple-500' 
                            : 'bg-purple-200'
                        }`}
                        onPress={() => setSnapSettings(prev => ({ ...prev, maxReplays: replays }))}
                      >
                        <Text className={`text-xs font-semibold ${
                          snapSettings.maxReplays === replays 
                            ? 'text-white' 
                            : 'text-purple-700'
                        }`}>
                          {replays}x
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <Text className="text-xs text-purple-600">
                  ⏱️ Recipients can view for {snapSettings.viewingDuration} seconds, {snapSettings.maxReplays} time{snapSettings.maxReplays > 1 ? 's' : ''}
                </Text>
              </View>
            )}

            {/* Conversations List */}
            <View className="flex-1">
              {loadingConversations ? (
                <View className="flex-1 items-center justify-center">
                  <ActivityIndicator size="large" />
                  <Text className="mt-2 text-muted-foreground">Loading conversations...</Text>
                </View>
              ) : conversations.length === 0 ? (
                <View className="flex-1 items-center justify-center px-4">
                  <Ionicons name="chatbubbles-outline" size={64} color="#9CA3AF" />
                  <Text className="mt-4 text-center text-xl font-semibold text-foreground">
                    No Conversations
                  </Text>
                  <Text className="mt-2 text-center text-muted-foreground">
                    Start a conversation from the Chat tab to send {isNutritionCard ? 'nutrition cards' : (isVideo ? 'videos' : 'photos')}
                  </Text>
                </View>
              ) : (
                <ScrollView className="flex-1">
                  {conversations.map((conversation) => (
                    <TouchableOpacity
                      key={conversation.id}
                      className="flex-row items-center border-b border-border px-4 py-4"
                      onPress={() => sendToConversation(conversation)}
                      disabled={sending}
                    >
                      {/* Avatar */}
                      <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-primary">
                        {conversation.other_participant.avatar_url ? (
                          <Image
                            source={{ uri: conversation.other_participant.avatar_url }}
                            className="h-12 w-12 rounded-full"
                          />
                        ) : (
                          <Text className="text-lg font-semibold text-primary-foreground">
                            {(conversation.other_participant.display_name || conversation.other_participant.email)
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        )}
                      </View>

                      {/* Conversation Info */}
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {conversation.other_participant.display_name || 
                           conversation.other_participant.email.split('@')[0]}
                        </Text>
                        <Text className="mt-1 text-sm text-muted-foreground" numberOfLines={1}>
                          {conversation.last_message_preview}
                        </Text>
                      </View>

                      {/* Send indicator */}
                      {sending ? (
                        <ActivityIndicator size="small" />
                      ) : (
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      {/* AI Caption Modal */}
      <Modal
        visible={showAiCaptionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAiCaptionModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-1">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
              <TouchableOpacity onPress={() => setShowAiCaptionModal(false)}>
                <Text className="text-primary">Cancel</Text>
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-foreground">AI Caption Suggestions</Text>
              <View className="w-16" />
            </View>

            {/* Caption Options */}
            <ScrollView className="flex-1 px-4 py-6">
              <Text className="mb-4 text-center text-muted-foreground">
                Choose a caption or tap thumbs up/down to help improve suggestions
              </Text>
              
              {generatedCaptions.map((caption, index) => (
                <View key={index} className="mb-4 rounded-lg border border-border bg-card p-4">
                  <TouchableOpacity
                    className="mb-3"
                    onPress={() => handleCaptionSelect(caption, index)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-base text-foreground leading-6">
                      {caption}
                    </Text>
                  </TouchableOpacity>
                  
                  {/* Feedback buttons */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row space-x-3">
                      <TouchableOpacity
                        className="flex-row items-center space-x-1 rounded-full bg-green-100 px-3 py-1"
                        onPress={() => handleCaptionFeedback(caption, index, 'thumbs_up')}
                      >
                        <Ionicons name="thumbs-up" size={16} color="#059669" />
                        <Text className="text-sm text-green-700">Good</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="flex-row items-center space-x-1 rounded-full bg-red-100 px-3 py-1"
                        onPress={() => handleCaptionFeedback(caption, index, 'thumbs_down')}
                      >
                        <Ionicons name="thumbs-down" size={16} color="#DC2626" />
                        <Text className="text-sm text-red-700">Improve</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      className="rounded-full bg-primary px-4 py-2"
                      onPress={() => handleCaptionSelect(caption, index)}
                    >
                      <Text className="text-sm font-medium text-primary-foreground">
                        Use This
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              
              {generatedCaptions.length === 0 && (
                <View className="items-center py-8">
                  <Ionicons name="chatbubble-outline" size={48} color="#9CA3AF" />
                  <Text className="mt-2 text-center text-muted-foreground">
                    No captions generated yet
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Selected caption preview */}
            {selectedCaption.length > 0 && (
              <View className="border-t border-border bg-muted/50 px-4 py-3">
                <Text className="text-sm font-medium text-foreground mb-1">Selected Caption:</Text>
                <Text className="text-sm text-muted-foreground">{selectedCaption}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Creative Tools Modal */}
      <CreativeToolsModal
        visible={showCreativeTools}
        onClose={() => setShowCreativeTools(false)}
        mediaUri={mediaUri || ''}
        mediaType={mediaType as 'photo' | 'video'}
        onSave={handleSaveEditedMedia}
      />
    </SafeAreaView>
  );
} 
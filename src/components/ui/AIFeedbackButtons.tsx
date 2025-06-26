/**
 * @file AIFeedbackButtons - Comprehensive feedback component for AI suggestions
 * Used throughout the app for consistent feedback collection and analytics
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStoreAiFeedbackMutation } from "../../store/slices/api-slice";

export interface FeedbackMetadata {
  suggestion_type: 'caption' | 'nutrition' | 'recipe' | 'prompt';
  suggestion_id: string;
  original_suggestion: string;
  context_metadata?: Record<string, any>;
}

interface AIFeedbackButtonsProps {
  metadata: FeedbackMetadata;
  onFeedbackSubmitted?: (feedbackType: string) => void;
  showExplainer?: boolean;
  size?: 'small' | 'medium' | 'large';
  layout?: 'horizontal' | 'vertical';
  style?: 'minimal' | 'default' | 'prominent';
}

/**
 * Comprehensive AI feedback component with explanations and detailed feedback
 */
export default function AIFeedbackButtons({
  metadata,
  onFeedbackSubmitted,
  showExplainer = false,
  size = 'medium',
  layout = 'horizontal',
  style = 'default'
}: AIFeedbackButtonsProps) {
  const [showExplainerModal, setShowExplainerModal] = useState(false);
  const [showDetailedFeedbackModal, setShowDetailedFeedbackModal] = useState(false);
  const [selectedFeedbackType, setSelectedFeedbackType] = useState<'thumbs_up' | 'thumbs_down' | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const [storeAiFeedback] = useStoreAiFeedbackMutation();

  /**
   * Get button styling based on props
   */
  const getButtonSize = () => {
    switch (size) {
      case 'small': return { iconSize: 14, padding: 'px-2 py-1' };
      case 'large': return { iconSize: 20, padding: 'px-4 py-2' };
      default: return { iconSize: 16, padding: 'px-3 py-1.5' };
    }
  };

  const getButtonStyle = (type: 'positive' | 'negative') => {
    const baseStyle = getButtonSize();
    
    switch (style) {
      case 'minimal':
        return `${baseStyle.padding} rounded-full`;
      case 'prominent':
        return `${baseStyle.padding} rounded-lg border ${
          type === 'positive' 
            ? 'border-green-200 bg-green-50' 
            : 'border-red-200 bg-red-50'
        }`;
      default:
        return `${baseStyle.padding} rounded-lg ${
          type === 'positive' 
            ? 'bg-green-100' 
            : 'bg-red-100'
        }`;
    }
  };

  /**
   * Handle quick feedback (thumbs up/down)
   */
  const handleQuickFeedback = async (feedbackType: 'thumbs_up' | 'thumbs_down') => {
    setSubmittingFeedback(true);
    
    try {
      await storeAiFeedback({
        suggestion_type: metadata.suggestion_type,
        suggestion_id: metadata.suggestion_id,
        feedback_type: feedbackType,
        original_suggestion: metadata.original_suggestion,
        context_metadata: {
          ...metadata.context_metadata,
          feedback_method: 'quick_buttons',
          timestamp: new Date().toISOString(),
        }
      }).unwrap();

      onFeedbackSubmitted?.(feedbackType);
      
      // Show brief success indicator
      Alert.alert(
        "Thanks for your feedback! 👍",
        "This helps us improve AI suggestions for you.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  /**
   * Handle detailed feedback submission
   */
  const handleDetailedFeedback = async () => {
    if (!selectedFeedbackType) return;

    setSubmittingFeedback(true);
    
    try {
      await storeAiFeedback({
        suggestion_type: metadata.suggestion_type,
        suggestion_id: metadata.suggestion_id,
        feedback_type: selectedFeedbackType,
        original_suggestion: metadata.original_suggestion,
        edited_version: feedbackComment.trim() || undefined,
        context_metadata: {
          ...metadata.context_metadata,
          feedback_method: 'detailed_modal',
          has_comment: !!feedbackComment.trim(),
          comment_length: feedbackComment.trim().length,
          timestamp: new Date().toISOString(),
        }
      }).unwrap();

      onFeedbackSubmitted?.(selectedFeedbackType);
      setShowDetailedFeedbackModal(false);
      setFeedbackComment('');
      setSelectedFeedbackType(null);
      
      Alert.alert(
        "Feedback Submitted! 🎉",
        "Your detailed feedback helps us personalize AI suggestions better.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Failed to submit detailed feedback:', error);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  /**
   * Show explainer modal
   */
  const handleShowExplainer = () => {
    setShowExplainerModal(true);
  };

  /**
   * Show detailed feedback modal
   */
  const showDetailedFeedback = (type: 'thumbs_up' | 'thumbs_down') => {
    setSelectedFeedbackType(type);
    setShowDetailedFeedbackModal(true);
  };

  const buttonSize = getButtonSize();

  return (
    <>
      <View className={layout === 'horizontal' ? 'flex-row items-center space-x-2' : 'space-y-2'}>
        {/* Thumbs Up Button */}
        <TouchableOpacity
          className={getButtonStyle('positive')}
          onPress={() => handleQuickFeedback('thumbs_up')}
          onLongPress={() => showDetailedFeedback('thumbs_up')}
          disabled={submittingFeedback}
        >
          <View className="flex-row items-center space-x-1">
            {submittingFeedback ? (
              <ActivityIndicator size="small" color="#22C55E" />
            ) : (
              <Ionicons name="thumbs-up" size={buttonSize.iconSize} color="#22C55E" />
            )}
            {style === 'prominent' && (
              <Text className="text-green-600 text-xs font-medium">Helpful</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Thumbs Down Button */}
        <TouchableOpacity
          className={getButtonStyle('negative')}
          onPress={() => handleQuickFeedback('thumbs_down')}
          onLongPress={() => showDetailedFeedback('thumbs_down')}
          disabled={submittingFeedback}
        >
          <View className="flex-row items-center space-x-1">
            <Ionicons name="thumbs-down" size={buttonSize.iconSize} color="#EF4444" />
            {style === 'prominent' && (
              <Text className="text-red-600 text-xs font-medium">Not Helpful</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Explainer Button */}
        {showExplainer && (
          <TouchableOpacity
            className="p-1.5 rounded-full"
            onPress={handleShowExplainer}
          >
            <Ionicons name="help-circle-outline" size={buttonSize.iconSize} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Explainer Modal */}
      <Modal
        visible={showExplainerModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowExplainerModal(false)}
      >
        <View className="flex-1 bg-black/50 items-center justify-center p-4">
          <View className="bg-card rounded-xl p-6 max-w-sm w-full">
            <View className="flex-row items-center mb-4">
              <Ionicons name="sparkles" size={24} color="#6366F1" />
              <Text className="text-lg font-bold text-foreground ml-2">
                Why This Suggestion?
              </Text>
            </View>
            
            <Text className="text-muted-foreground leading-6 mb-4">
              This AI suggestion was generated based on:
            </Text>
            
            <View className="space-y-2 mb-6">
              <View className="flex-row items-center">
                <Ionicons name="person" size={16} color="#6366F1" />
                <Text className="text-sm text-foreground ml-2">Your fitness goals and preferences</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="time" size={16} color="#6366F1" />
                <Text className="text-sm text-foreground ml-2">Your past content and style</Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="library" size={16} color="#6366F1" />
                <Text className="text-sm text-foreground ml-2">Nutrition knowledge database</Text>
              </View>
            </View>

            <Text className="text-xs text-muted-foreground mb-4">
              Your feedback helps us personalize future suggestions better!
            </Text>

            <TouchableOpacity
              className="bg-primary rounded-lg px-4 py-3"
              onPress={() => setShowExplainerModal(false)}
            >
              <Text className="text-primary-foreground font-medium text-center">
                Got it!
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Detailed Feedback Modal */}
      <Modal
        visible={showDetailedFeedbackModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailedFeedbackModal(false)}
      >
        <View className="flex-1 bg-background">
          <View className="p-4 border-b border-border">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-foreground">
                Share Detailed Feedback
              </Text>
              <TouchableOpacity
                onPress={() => setShowDetailedFeedbackModal(false)}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-1 p-4">
            <View className="mb-6">
              <Text className="text-sm font-medium text-foreground mb-2">
                AI Suggestion:
              </Text>
              <View className="bg-muted p-3 rounded-lg">
                <Text className="text-muted-foreground italic">
                  "{metadata.original_suggestion}"
                </Text>
              </View>
            </View>

            <Text className="text-sm font-medium text-foreground mb-2">
              How can we improve this suggestion? (Optional)
            </Text>
            <TextInput
              className="border border-border rounded-lg p-3 bg-card text-foreground h-24"
              placeholder={
                selectedFeedbackType === 'thumbs_up' 
                  ? "What did you like about this suggestion?"
                  : "How could this suggestion be better?"
              }
              placeholderTextColor="#9CA3AF"
              value={feedbackComment}
              onChangeText={setFeedbackComment}
              multiline
              textAlignVertical="top"
            />

            <View className="flex-row items-center mt-6 p-3 bg-blue-50 rounded-lg">
              <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
              <Text className="text-blue-800 text-xs ml-2 flex-1">
                Your feedback is anonymous and helps improve AI for everyone
              </Text>
            </View>
          </View>

          <View className="p-4 border-t border-border">
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-muted rounded-lg px-4 py-3"
                onPress={() => setShowDetailedFeedbackModal(false)}
              >
                <Text className="text-muted-foreground font-medium text-center">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-lg px-4 py-3"
                onPress={handleDetailedFeedback}
                disabled={submittingFeedback}
              >
                {submittingFeedback ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-primary-foreground font-medium text-center">
                    Submit Feedback
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
} 
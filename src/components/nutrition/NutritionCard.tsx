/**
 * @file NutritionCard component - displays nutrition scan results with facts, insights, and recipes.
 * Features interactive sharing capabilities and confidence indicators for AI-generated content.
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { NutritionCard as NutritionCardType } from "../../types/database";
import AIFeedbackButtons from "../ui/AIFeedbackButtons";

interface NutritionCardProps {
  nutritionCard: NutritionCardType;
  onShare?: () => void;
  onClose?: () => void;
  onFeedback?: (type: 'thumbs_up' | 'thumbs_down', section: string) => void;
}

/**
 * Individual nutrition fact row component
 */
interface NutritionFactRowProps {
  label: string;
  value: number | undefined;
  unit: string;
  color?: string;
}

function NutritionFactRow({ label, value, unit, color = "text-foreground" }: NutritionFactRowProps) {
  if (value === undefined) return null;

  return (
    <View className="flex-row justify-between items-center py-2 border-b border-border/50">
      <Text className="text-muted-foreground font-medium">{label}</Text>
      <Text className={`font-bold ${color}`}>
        {value}{unit}
      </Text>
    </View>
  );
}

/**
 * Confidence indicator component
 */
interface ConfidenceIndicatorProps {
  confidence: number;
}

function ConfidenceIndicator({ confidence }: ConfidenceIndicatorProps) {
  const percentage = Math.round(confidence * 100);
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceText = () => {
    if (confidence >= 0.8) return "High Confidence";
    if (confidence >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <View className="flex-row items-center">
      <View className="flex-1 h-2 bg-muted rounded-full overflow-hidden mr-2">
        <View 
          className={`h-full ${getConfidenceColor()} rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </View>
      <Text className="text-xs text-muted-foreground font-medium">
        {getConfidenceText()} ({percentage}%)
      </Text>
    </View>
  );
}

/**
 * Enhanced feedback component using AIFeedbackButtons
 */
interface FeedbackButtonsProps {
  onFeedback?: (type: 'thumbs_up' | 'thumbs_down') => void;
  suggestionType: 'nutrition' | 'recipe';
  originalSuggestion: string;
  section: string;
}

function FeedbackButtons({ onFeedback, suggestionType, originalSuggestion, section }: FeedbackButtonsProps) {
  if (!onFeedback) return null;

  return (
    <AIFeedbackButtons
      metadata={{
        suggestion_type: suggestionType,
        suggestion_id: `${suggestionType}_${Date.now()}_${section}`,
        original_suggestion: originalSuggestion,
        context_metadata: {
          section,
          suggestion_source: 'nutrition_analysis',
          timestamp: new Date().toISOString()
        }
      }}
      onFeedbackSubmitted={(feedbackType) => {
        onFeedback(feedbackType as 'thumbs_up' | 'thumbs_down');
      }}
      showExplainer={true}
      style="prominent"
      size="small"
    />
  );
}

/**
 * Main Nutrition Card component
 */
export default function NutritionCard({ 
  nutritionCard, 
  onShare, 
  onClose,
  onFeedback 
}: NutritionCardProps) {
  const { 
    foodName, 
    nutritionFacts, 
    healthInsights, 
    recipeIdeas, 
    confidence 
  } = nutritionCard;

  return (
    <View className="bg-card rounded-xl border border-border shadow-lg overflow-hidden">
      {/* Header */}
      <View className="px-6 py-4 border-b border-border">
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground mb-1">
              {foodName}
            </Text>
            <ConfidenceIndicator confidence={confidence} />
          </View>
          
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              className="ml-4 p-2 rounded-full bg-muted"
            >
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        className="max-h-96" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        {/* Nutrition Facts */}
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="nutrition" size={20} color="#6366F1" />
            <Text className="text-lg font-bold text-foreground ml-2">
              Nutrition Facts
            </Text>
          </View>
          
          <View className="bg-background rounded-lg p-4 border border-border">
            <NutritionFactRow 
              label="Calories" 
              value={nutritionFacts.calories} 
              unit=""
              color="text-blue-600"
            />
            <NutritionFactRow 
              label="Protein" 
              value={nutritionFacts.protein} 
              unit="g"
              color="text-green-600"
            />
            <NutritionFactRow 
              label="Carbohydrates" 
              value={nutritionFacts.carbs} 
              unit="g"
              color="text-orange-600"
            />
            <NutritionFactRow 
              label="Fat" 
              value={nutritionFacts.fat} 
              unit="g"
              color="text-purple-600"
            />
            {nutritionFacts.fiber && (
              <NutritionFactRow 
                label="Fiber" 
                value={nutritionFacts.fiber} 
                unit="g"
              />
            )}
            {nutritionFacts.sugar && (
              <NutritionFactRow 
                label="Sugar" 
                value={nutritionFacts.sugar} 
                unit="g"
              />
            )}
            {nutritionFacts.sodium && (
              <NutritionFactRow 
                label="Sodium" 
                value={nutritionFacts.sodium} 
                unit="mg"
              />
            )}
          </View>
        </View>

        {/* Health Insights */}
        {healthInsights.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text className="text-lg font-bold text-foreground ml-2">
                  Health Insights
                </Text>
              </View>
              <FeedbackButtons 
                onFeedback={onFeedback ? (type) => onFeedback(type, 'health_insights') : undefined}
                suggestionType="nutrition"
                originalSuggestion={healthInsights.join('; ')}
                section="health_insights"
              />
            </View>
            
            <View>
              {healthInsights.map((insight, index) => (
                <View 
                  key={index} 
                  className={`flex-row p-3 bg-blue-50 rounded-lg ${index < healthInsights.length - 1 ? 'mb-3' : ''}`}
                >
                  <Ionicons name="bulb" size={16} color="#3B82F6" />
                  <Text className="flex-1 text-blue-800 leading-5 ml-3">
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Recipe Ideas */}
        {recipeIdeas.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="restaurant" size={20} color="#F59E0B" />
                <Text className="text-lg font-bold text-foreground ml-2">
                  Recipe Ideas
                </Text>
              </View>
              <FeedbackButtons 
                onFeedback={onFeedback ? (type) => onFeedback(type, 'recipe_ideas') : undefined}
                suggestionType="recipe"
                originalSuggestion={recipeIdeas.join('; ')}
                section="recipe_ideas"
              />
            </View>
            
            <View>
              {recipeIdeas.map((recipe, index) => (
                <View 
                  key={index} 
                  className={`flex-row p-3 bg-green-50 rounded-lg ${index < recipeIdeas.length - 1 ? 'mb-3' : ''}`}
                >
                  <Ionicons name="leaf" size={16} color="#10B981" />
                  <Text className="flex-1 text-green-800 leading-5 ml-3">
                    {recipe}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View className="px-6 py-4 border-t border-border bg-muted/30">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="sparkles" size={16} color="#6B7280" />
            <Text className="text-xs text-muted-foreground ml-1">
              Powered by AI nutrition analysis
            </Text>
          </View>
          
          {onShare && (
            <TouchableOpacity
              onPress={onShare}
              className="flex-row items-center bg-primary px-4 py-2 rounded-lg"
            >
              <Ionicons name="share" size={16} color="white" />
              <Text className="text-primary-foreground font-medium ml-2">
                Share Card
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
} 
/**
 * @file JournalAnalyticsModal - Displays AI-powered analytics and insights about user's journal content
 * Features nutrition trends, meal patterns, and personalized recommendations
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useGetJournalAnalyticsWithInsightsQuery } from "../../store/slices/api-slice";

interface JournalAnalyticsModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Metric card component for displaying analytics values
 */
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
  color?: string;
}

function MetricCard({ title, value, subtitle, icon, color = "#6366F1" }: MetricCardProps) {
  return (
    <View className="bg-card rounded-lg p-4 border border-border flex-1 mx-1">
      <View className="flex-row items-center justify-between mb-2">
        <Ionicons name={icon as any} size={20} color={color} />
        <Text className="text-2xl font-bold text-foreground">{value}</Text>
      </View>
      <Text className="text-sm font-medium text-foreground">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-muted-foreground mt-1">{subtitle}</Text>
      )}
    </View>
  );
}

/**
 * Meal type distribution chart component
 */
interface MealDistributionProps {
  distribution: Record<string, number>;
}

function MealDistribution({ distribution }: MealDistributionProps) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  const mealTypes = [
    { key: 'breakfast', label: 'Breakfast', emoji: '🌅', color: '#F59E0B' },
    { key: 'lunch', label: 'Lunch', emoji: '☀️', color: '#10B981' },
    { key: 'dinner', label: 'Dinner', emoji: '🌙', color: '#6366F1' },
    { key: 'snack', label: 'Snacks', emoji: '🍎', color: '#EF4444' },
    { key: 'other', label: 'Other', emoji: '🍽️', color: '#6B7280' },
  ];

  if (total === 0) {
    return (
      <View className="bg-muted rounded-lg p-4">
        <Text className="text-muted-foreground text-center">No meal data available yet</Text>
      </View>
    );
  }

  return (
    <View>
      {mealTypes.map((mealType) => {
        const count = distribution[mealType.key] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        if (count === 0) return null;
        
        return (
          <View key={mealType.key} className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center flex-1">
              <Text className="mr-2">{mealType.emoji}</Text>
              <Text className="text-foreground font-medium">{mealType.label}</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-20 h-2 bg-muted rounded-full mr-3">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: mealType.color 
                  }}
                />
              </View>
              <Text className="text-sm font-bold text-foreground w-12 text-right">
                {count}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/**
 * AI insights component
 */
interface AIInsightsProps {
  insights: string[];
}

function AIInsights({ insights }: AIInsightsProps) {
  if (!insights || insights.length === 0) {
    return (
      <View className="bg-muted rounded-lg p-4">
        <Text className="text-muted-foreground text-center">
          Add more meals to get personalized insights
        </Text>
      </View>
    );
  }

  return (
    <View>
      {insights.map((insight, index) => (
        <View key={index} className="flex-row p-3 bg-blue-50 rounded-lg mb-3">
          <Ionicons name="sparkles" size={16} color="#3B82F6" />
          <Text className="flex-1 text-blue-800 leading-5 ml-3">
            {insight}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Top ingredients component
 */
interface TopIngredientsProps {
  ingredients: string[];
}

function TopIngredients({ ingredients }: TopIngredientsProps) {
  if (!ingredients || ingredients.length === 0) {
    return (
      <View className="bg-muted rounded-lg p-4">
        <Text className="text-muted-foreground text-center">
          No ingredient data available yet
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row flex-wrap gap-2">
      {ingredients.slice(0, 10).map((ingredient, index) => (
        <View key={index} className="bg-green-100 rounded-full px-3 py-1">
          <Text className="text-green-800 text-sm font-medium capitalize">
            {ingredient}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function JournalAnalyticsModal({ visible, onClose }: JournalAnalyticsModalProps) {
  const { data: analytics, isLoading, error } = useGetJournalAnalyticsWithInsightsQuery(
    { time_range_days: 30 },
    { skip: !visible } // Only fetch when modal is visible
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border">
          <View className="flex-row items-center">
            <Ionicons name="analytics" size={24} color="#6366F1" />
            <Text className="text-xl font-bold text-foreground ml-2">
              Journal Insights
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-muted-foreground mt-2">Analyzing your journal...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-4">
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text className="text-foreground text-lg font-semibold mt-4">
              Unable to Load Analytics
            </Text>
            <Text className="text-muted-foreground text-center mt-2">
              Please check your connection and try again
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
            {/* Overview Metrics */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">
                30-Day Overview
              </Text>
              <View className="flex-row mb-3">
                <MetricCard
                  title="Total Meals"
                  value={analytics?.total_entries || 0}
                  subtitle="Last 30 days"
                  icon="restaurant"
                  color="#10B981"
                />
                <MetricCard
                  title="Analyzed"
                  value={analytics?.nutrition_trends?.total_meals_analyzed || 0}
                  subtitle="With AI insights"
                  icon="sparkles"
                  color="#6366F1"
                />
              </View>
              <View className="flex-row">
                <MetricCard
                  title="Avg Calories"
                  value={analytics?.nutrition_trends?.avg_calories || '-'}
                  subtitle="Per meal"
                  icon="flame"
                  color="#F59E0B"
                />
                <MetricCard
                  title="Avg Protein"
                  value={analytics?.nutrition_trends?.avg_protein ? `${analytics.nutrition_trends.avg_protein}g` : '-'}
                  subtitle="Per meal"
                  icon="fitness"
                  color="#8B5CF6"
                />
              </View>
            </View>

            {/* Meal Distribution */}
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-4">
                Meal Type Distribution
              </Text>
              <MealDistribution distribution={analytics?.meal_type_distribution || {}} />
            </View>

            {/* Nutrition Trends */}
            {analytics?.nutrition_trends && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-foreground mb-4">
                  Nutrition Trends
                </Text>
                <View className="bg-card rounded-lg p-4 border border-border">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-muted-foreground">Average Macros</Text>
                    <Text className="text-xs text-muted-foreground">Per Meal</Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text className="text-foreground">Carbohydrates</Text>
                    <Text className="font-bold text-orange-600">
                      {analytics.nutrition_trends.avg_carbs || 0}g
                    </Text>
                  </View>
                  <View className="flex-row justify-between py-2">
                    <Text className="text-foreground">Fat</Text>
                    <Text className="font-bold text-purple-600">
                      {analytics.nutrition_trends.avg_fat || 0}g
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Top Ingredients */}
            {analytics?.top_ingredients && analytics.top_ingredients.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-bold text-foreground mb-4">
                  Most Used Ingredients
                </Text>
                <TopIngredients ingredients={analytics.top_ingredients} />
              </View>
            )}

            {/* AI Insights */}
            <View className="mb-6">
              <View className="flex-row items-center mb-4">
                <Ionicons name="sparkles" size={20} color="#6366F1" />
                <Text className="text-lg font-bold text-foreground ml-2">
                  AI Insights & Recommendations
                </Text>
              </View>
              <AIInsights insights={analytics?.ai_insights || []} />
            </View>

            {/* Analysis Info */}
            <View className="bg-muted rounded-lg p-4">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={16} color="#6B7280" />
                <Text className="text-muted-foreground font-medium ml-2">
                  About These Insights
                </Text>
              </View>
              <Text className="text-muted-foreground text-sm leading-5">
                Insights are generated by AI analysis of your journal entries, considering your fitness goals, dietary preferences, and eating patterns. Analysis improves as you add more meals.
              </Text>
              {analytics?.analysis_date && (
                <Text className="text-xs text-muted-foreground mt-2">
                  Last updated: {new Date(analytics.analysis_date).toLocaleDateString()}
                </Text>
              )}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
} 
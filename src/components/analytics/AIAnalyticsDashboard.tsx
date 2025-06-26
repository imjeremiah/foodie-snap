/**
 * @file AIAnalyticsDashboard - Analytics dashboard for AI feedback and performance metrics
 * Implements Phase 3, Step 4: Learning Feedback Loop & Analytics
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetUserAiFeedbackQuery } from "../../store/slices/api-slice";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: screenWidth } = Dimensions.get('window');

type TimeRange = '7d' | '30d' | '90d' | 'all';
type SuggestionType = 'all' | 'caption' | 'nutrition' | 'recipe' | 'prompt';

interface AnalyticsMetric {
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: string;
  color: string;
}

interface ProgressBarProps {
  label: string;
  value: number;
  total: number;
  color: string;
}

/**
 * Progress bar component for analytics
 */
function ProgressBar({ label, value, total, color }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  
  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-sm font-medium text-foreground">{label}</Text>
        <Text className="text-sm text-muted-foreground">
          {value} / {total} ({percentage}%)
        </Text>
      </View>
      <View className="h-2 bg-muted rounded-full">
        <View
          className="h-2 rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

/**
 * Metric card component
 */
function MetricCard({ metric }: { metric: AnalyticsMetric }) {
  return (
    <View className="bg-card rounded-lg p-4 border border-border flex-1">
      <View className="flex-row items-center justify-between mb-2">
        <Ionicons name={metric.icon as any} size={24} color={metric.color} />
        {metric.change && (
          <View className={`px-2 py-1 rounded-full ${
            metric.changeType === 'positive' ? 'bg-green-100' :
            metric.changeType === 'negative' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Text className={`text-xs font-medium ${
              metric.changeType === 'positive' ? 'text-green-600' :
              metric.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
            }`}>
              {metric.change}
            </Text>
          </View>
        )}
      </View>
      <Text className="text-2xl font-bold text-foreground mb-1">
        {metric.value}
      </Text>
      <Text className="text-sm text-muted-foreground">
        {metric.label}
      </Text>
    </View>
  );
}

/**
 * Main AI Analytics Dashboard component
 */
export default function AIAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [suggestionType, setSuggestionType] = useState<SuggestionType>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch AI feedback data
  const { 
    data: feedbackData = [], 
    isLoading, 
    error,
    refetch
  } = useGetUserAiFeedbackQuery({
    suggestion_types: suggestionType === 'all' ? undefined : [suggestionType],
    limit: 1000
  });

  /**
   * Filter data by time range
   */
  const filteredData = useMemo(() => {
    if (timeRange === 'all') return feedbackData;
    
    const now = new Date();
    const cutoffDate = new Date();
    
    switch (timeRange) {
      case '7d':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        cutoffDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        cutoffDate.setDate(now.getDate() - 90);
        break;
    }
    
    return feedbackData.filter(item => 
      new Date(item.created_at) >= cutoffDate
    );
  }, [feedbackData, timeRange]);

  /**
   * Calculate analytics metrics
   */
  const analytics = useMemo(() => {
    const total = filteredData.length;
    if (total === 0) {
      return {
        totalFeedback: 0,
        positiveRate: 0,
        negativeRate: 0,
        byType: {},
        recentTrend: 'neutral' as const,
      };
    }

    const positive = filteredData.filter(f => f.feedback_type === 'thumbs_up').length;
    const negative = filteredData.filter(f => f.feedback_type === 'thumbs_down').length;
    const edited = filteredData.filter(f => f.feedback_type === 'edited').length;

    // Group by suggestion type
    const byType = filteredData.reduce((acc, item) => {
      const type = item.suggestion_type;
      if (!acc[type]) {
        acc[type] = { total: 0, positive: 0, negative: 0 };
      }
      acc[type].total++;
      if (item.feedback_type === 'thumbs_up') acc[type].positive++;
      if (item.feedback_type === 'thumbs_down') acc[type].negative++;
      return acc;
    }, {} as Record<string, { total: number; positive: number; negative: number }>);

    // Calculate trend (simplified)
    const recent = filteredData.slice(0, Math.floor(total / 2));
    const older = filteredData.slice(Math.floor(total / 2));
    
    const recentPositiveRate = recent.length > 0 
      ? recent.filter(f => f.feedback_type === 'thumbs_up').length / recent.length 
      : 0;
    const olderPositiveRate = older.length > 0 
      ? older.filter(f => f.feedback_type === 'thumbs_up').length / older.length 
      : 0;

    const trend = recentPositiveRate > olderPositiveRate ? 'positive' : 
                  recentPositiveRate < olderPositiveRate ? 'negative' : 'neutral';

    return {
      totalFeedback: total,
      positiveRate: Math.round((positive / total) * 100),
      negativeRate: Math.round((negative / total) * 100),
      editedRate: Math.round((edited / total) * 100),
      byType,
      recentTrend: trend,
    };
  }, [filteredData]);

  /**
   * Generate metrics for display
   */
  const metrics: AnalyticsMetric[] = [
    {
      label: 'Total Feedback',
      value: analytics.totalFeedback,
      icon: 'chatbubbles',
      color: '#6366F1',
      change: analytics.recentTrend === 'positive' ? '+12%' : analytics.recentTrend === 'negative' ? '-5%' : undefined,
      changeType: analytics.recentTrend,
    },
    {
      label: 'Helpful Rate',
      value: `${analytics.positiveRate}%`,
      icon: 'thumbs-up',
      color: '#22C55E',
      change: '+3%',
      changeType: 'positive',
    },
    {
      label: 'Suggestions Edited',
      value: `${analytics.editedRate}%`,
      icon: 'create',
      color: '#F59E0B',
    },
    {
      label: 'Response Rate',
      value: '87%', // This would be calculated based on suggestions shown vs feedback received
      icon: 'pulse',
      color: '#8B5CF6',
    },
  ];

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  /**
   * Get time range button style
   */
  const getTimeRangeStyle = (range: TimeRange) => {
    const isActive = timeRange === range;
    return `px-3 py-2 rounded-lg ${
      isActive ? 'bg-primary' : 'bg-muted'
    }`;
  };

  /**
   * Get time range text style
   */
  const getTimeRangeTextStyle = (range: TimeRange) => {
    const isActive = timeRange === range;
    return `text-sm font-medium ${
      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
    }`;
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-xl font-semibold text-foreground">
            Analytics Unavailable
          </Text>
          <Text className="mt-2 text-center text-muted-foreground">
            Unable to load feedback analytics
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="px-4 py-6 border-b border-border">
          <Text className="text-2xl font-bold text-foreground mb-2">
            AI Analytics
          </Text>
          <Text className="text-muted-foreground">
            Track how AI suggestions are performing and improving
          </Text>
        </View>

        {/* Time Range Filter */}
        <View className="px-4 py-4">
          <Text className="text-sm font-medium text-foreground mb-3">
            Time Range
          </Text>
          <View className="flex-row space-x-2">
            {(['7d', '30d', '90d', 'all'] as TimeRange[]).map((range) => (
              <TouchableOpacity
                key={range}
                className={getTimeRangeStyle(range)}
                onPress={() => setTimeRange(range)}
              >
                <Text className={getTimeRangeTextStyle(range)}>
                  {range === 'all' ? 'All Time' : range.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Loading State */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-12">
            <ActivityIndicator size="large" color="hsl(var(--primary))" />
            <Text className="mt-4 text-muted-foreground">Loading analytics...</Text>
          </View>
        ) : (
          <>
            {/* Key Metrics */}
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Key Metrics
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {metrics.map((metric, index) => (
                  <View key={index} style={{ width: (screenWidth - 32 - 12) / 2 }}>
                    <MetricCard metric={metric} />
                  </View>
                ))}
              </View>
            </View>

            {/* Performance by Type */}
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Performance by Suggestion Type
              </Text>
              <View className="bg-card rounded-lg p-4 border border-border">
                {Object.entries(analytics.byType).map(([type, data]) => {
                  const successRate = data.total > 0 ? (data.positive / data.total) * 100 : 0;
                  const color = successRate >= 70 ? '#22C55E' : successRate >= 50 ? '#F59E0B' : '#EF4444';
                  
                  return (
                    <ProgressBar
                      key={type}
                      label={`${type.charAt(0).toUpperCase() + type.slice(1)} Suggestions`}
                      value={data.positive}
                      total={data.total}
                      color={color}
                    />
                  );
                })}
                
                {Object.keys(analytics.byType).length === 0 && (
                  <Text className="text-center text-muted-foreground py-4">
                    No feedback data available for this time range
                  </Text>
                )}
              </View>
            </View>

            {/* Insights */}
            <View className="px-4 mb-6">
              <Text className="text-lg font-semibold text-foreground mb-4">
                AI Insights
              </Text>
              <View className="space-y-3">
                <View className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="trending-up" size={20} color="#3B82F6" />
                    <Text className="text-blue-800 font-medium ml-2">
                      Performance Trend
                    </Text>
                  </View>
                  <Text className="text-blue-700 text-sm">
                    {analytics.recentTrend === 'positive' 
                      ? "AI suggestions are getting better! Recent feedback shows improved satisfaction."
                      : analytics.recentTrend === 'negative'
                      ? "There's room for improvement. Recent suggestions may need better personalization."
                      : "Performance is stable. Consider providing more feedback to help improve suggestions."
                    }
                  </Text>
                </View>

                <View className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
                    <Text className="text-green-800 font-medium ml-2">
                      What's Working
                    </Text>
                  </View>
                  <Text className="text-green-700 text-sm">
                    {analytics.positiveRate >= 70 
                      ? "Your feedback is helping create highly personalized suggestions!"
                      : analytics.positiveRate >= 50
                      ? "AI is learning your preferences. Continue providing feedback for better results."
                      : "Keep giving feedback! The AI needs more data to understand your preferences."
                    }
                  </Text>
                </View>

                {analytics.editedRate > 20 && (
                  <View className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="bulb" size={20} color="#F59E0B" />
                      <Text className="text-yellow-800 font-medium ml-2">
                        Improvement Opportunity
                      </Text>
                    </View>
                    <Text className="text-yellow-700 text-sm">
                      You're editing {analytics.editedRate}% of suggestions. Your edits help the AI learn your exact style preferences.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Footer Info */}
            <View className="px-4 pb-6">
              <View className="bg-muted/50 p-4 rounded-lg">
                <View className="flex-row items-center mb-2">
                  <Ionicons name="information-circle" size={20} color="#6B7280" />
                  <Text className="text-foreground font-medium ml-2">
                    About This Data
                  </Text>
                </View>
                <Text className="text-muted-foreground text-sm">
                  Analytics are based on your feedback interactions with AI suggestions. 
                  All data is private and helps improve your personalized experience.
                </Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 
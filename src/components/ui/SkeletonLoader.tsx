/**
 * @file Skeleton loading components for FoodieSnap
 * Provides reusable skeleton loaders for better loading states and perceived performance
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Base skeleton component with shimmer animation
 */
interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style,
  children 
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const shimmer = () => {
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => shimmer());
    };

    shimmer();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={[{ width, height, borderRadius }, style]}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: '#E1E5E9',
          borderRadius,
          opacity,
        }}
      />
      {children}
    </View>
  );
}

/**
 * Profile avatar skeleton
 */
interface AvatarSkeletonProps {
  size?: number;
  style?: any;
}

export function AvatarSkeleton({ size = 40, style }: AvatarSkeletonProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={size / 2}
      style={style}
    />
  );
}

/**
 * Message skeleton for chat loading
 */
interface MessageSkeletonProps {
  isMe?: boolean;
  showAvatar?: boolean;
}

export function MessageSkeleton({ isMe = false, showAvatar = true }: MessageSkeletonProps) {
  return (
    <View className={`flex-row mb-4 ${isMe ? 'justify-end' : 'justify-start'} px-4`}>
      {!isMe && showAvatar && (
        <AvatarSkeleton size={32} style={{ marginRight: 8 }} />
      )}
      
      <View className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
        <Skeleton
          width={Math.random() * 120 + 80} // Random width for variety
          height={16}
          borderRadius={12}
        />
        <Skeleton
          width={60}
          height={12}
          style={{ marginTop: 4 }}
        />
      </View>
      
      {isMe && showAvatar && (
        <AvatarSkeleton size={32} style={{ marginLeft: 8 }} />
      )}
    </View>
  );
}

/**
 * Conversation item skeleton for chat list
 */
export function ConversationSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 bg-card">
      <AvatarSkeleton size={48} style={{ marginRight: 12 }} />
      
      <View className="flex-1">
        <Skeleton width="60%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="80%" height={14} />
      </View>
      
      <View className="items-end">
        <Skeleton width={40} height={12} style={{ marginBottom: 4 }} />
        <Skeleton width={20} height={20} borderRadius={10} />
      </View>
    </View>
  );
}

/**
 * Friend item skeleton for friend list
 */
export function FriendSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 bg-card">
      <AvatarSkeleton size={44} style={{ marginRight: 12 }} />
      
      <View className="flex-1">
        <Skeleton width="50%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="70%" height={14} />
      </View>
      
      <Skeleton width={80} height={32} borderRadius={16} />
    </View>
  );
}

/**
 * Spotlight post skeleton
 */
export function SpotlightPostSkeleton() {
  return (
    <View className="bg-card rounded-lg p-4 mb-4">
      {/* Header */}
      <View className="flex-row items-center mb-3">
        <AvatarSkeleton size={36} style={{ marginRight: 8 }} />
        <View className="flex-1">
          <Skeleton width="40%" height={16} style={{ marginBottom: 4 }} />
          <Skeleton width="30%" height={12} />
        </View>
        <Skeleton width={24} height={24} borderRadius={12} />
      </View>
      
      {/* Image placeholder */}
      <Skeleton
        width="100%"
        height={200}
        borderRadius={8}
        style={{ marginBottom: 12 }}
      />
      
      {/* Caption */}
      <Skeleton width="90%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="60%" height={14} style={{ marginBottom: 12 }} />
      
      {/* Actions */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row space-x-4">
          <Skeleton width={60} height={28} borderRadius={14} />
          <Skeleton width={60} height={28} borderRadius={14} />
        </View>
        <Skeleton width={40} height={12} />
      </View>
    </View>
  );
}

/**
 * Journal grid item skeleton
 */
export function JournalItemSkeleton() {
  const itemSize = (SCREEN_WIDTH - 48) / 3; // 3 columns with padding
  
  return (
    <Skeleton
      width={itemSize}
      height={itemSize}
      borderRadius={8}
    />
  );
}

/**
 * Story item skeleton for stories carousel
 */
export function StorySkeleton() {
  return (
    <View className="items-center mr-3">
      <View className="relative">
        <AvatarSkeleton size={64} />
        <Skeleton
          width={20}
          height={20}
          borderRadius={10}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: '#FFF',
          }}
        />
      </View>
      <Skeleton width={50} height={12} style={{ marginTop: 4 }} />
    </View>
  );
}

/**
 * Profile header skeleton
 */
export function ProfileHeaderSkeleton() {
  return (
    <View className="items-center p-6 bg-card">
      <AvatarSkeleton size={80} style={{ marginBottom: 16 }} />
      <Skeleton width={120} height={20} style={{ marginBottom: 8 }} />
      <Skeleton width={180} height={14} style={{ marginBottom: 16 }} />
      
      {/* Stats */}
      <View className="flex-row space-x-8">
        <View className="items-center">
          <Skeleton width={40} height={18} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
        <View className="items-center">
          <Skeleton width={40} height={18} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
        <View className="items-center">
          <Skeleton width={40} height={18} style={{ marginBottom: 4 }} />
          <Skeleton width={50} height={12} />
        </View>
      </View>
    </View>
  );
}

/**
 * Settings item skeleton
 */
export function SettingsItemSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-4 bg-card border-b border-border">
      <Skeleton width={40} height={40} borderRadius={20} style={{ marginRight: 12 }} />
      
      <View className="flex-1">
        <Skeleton width="60%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="80%" height={12} />
      </View>
      
      <Skeleton width={50} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Search result skeleton
 */
export function SearchResultSkeleton() {
  return (
    <View className="flex-row items-center px-4 py-3 bg-card">
      <AvatarSkeleton size={40} style={{ marginRight: 12 }} />
      
      <View className="flex-1">
        <Skeleton width="50%" height={16} style={{ marginBottom: 4 }} />
        <Skeleton width="70%" height={12} />
      </View>
      
      <Skeleton width={24} height={24} borderRadius={12} />
    </View>
  );
}

/**
 * Comment skeleton
 */
export function CommentSkeleton() {
  return (
    <View className="flex-row px-4 py-2">
      <AvatarSkeleton size={24} style={{ marginRight: 8 }} />
      
      <View className="flex-1">
        <Skeleton width="30%" height={12} style={{ marginBottom: 2 }} />
        <Skeleton width="85%" height={14} style={{ marginBottom: 2 }} />
        <Skeleton width="20%" height={10} />
      </View>
    </View>
  );
}

/**
 * List of skeleton components for repeated content
 */
interface SkeletonListProps {
  count?: number;
  component: React.ComponentType<any>;
  componentProps?: any;
}

export function SkeletonList({ 
  count = 5, 
  component: Component, 
  componentProps = {} 
}: SkeletonListProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <Component key={index} {...componentProps} />
      ))}
    </>
  );
}

/**
 * Analytics dashboard skeleton
 */
export function AnalyticsDashboardSkeleton() {
  return (
    <View className="flex-1 bg-background p-4">
      {/* Metric cards */}
      <View className="flex-row space-x-3 mb-6">
        <View className="flex-1 bg-card rounded-lg p-4 border border-border shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={40} height={16} />
          </View>
          <Skeleton width={60} height={24} style={{ marginBottom: 4 }} />
          <Skeleton width={80} height={12} />
        </View>
        
        <View className="flex-1 bg-card rounded-lg p-4 border border-border shadow-sm">
          <View className="flex-row items-center justify-between mb-2">
            <Skeleton width={24} height={24} borderRadius={12} />
            <Skeleton width={40} height={16} />
          </View>
          <Skeleton width={60} height={24} style={{ marginBottom: 4 }} />
          <Skeleton width={80} height={12} />
        </View>
      </View>
      
      {/* Performance section */}
      <View className="bg-card rounded-lg p-6 border border-border shadow-sm">
        <Skeleton width={200} height={20} style={{ marginBottom: 24 }} />
        
        {/* Progress bars */}
        {Array.from({ length: 4 }, (_, i) => (
          <View key={i} className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Skeleton width={100} height={14} />
              <Skeleton width={40} height={14} />
            </View>
            <Skeleton width="100%" height={12} borderRadius={6} />
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * AI Processing indicator with enhanced messaging
 */
interface AIProcessingSkeletonProps {
  message?: string;
  subMessage?: string;
}

export function AIProcessingSkeleton({ 
  message = "🤖 AI is thinking...",
  subMessage = "This may take a few moments"
}: AIProcessingSkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [pulseAnim]);

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <View className="items-center justify-center p-8">
      <Animated.View style={{ transform: [{ scale }] }}>
        <View className="w-16 h-16 bg-primary/20 rounded-full items-center justify-center mb-4">
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </Animated.View>
      
      <Skeleton width={200} height={16} style={{ marginBottom: 8 }} />
      <Skeleton width={160} height={12} />
    </View>
  );
}

/**
 * Full page skeleton for initial app loading
 */
export function AppLoadingSkeleton() {
  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-card border-b border-border">
        <Skeleton width={100} height={24} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
      
      {/* Content */}
      <View className="flex-1 p-4">
        <SkeletonList count={8} component={ConversationSkeleton} />
      </View>
      
      {/* Bottom navigation */}
      <View className="flex-row justify-around items-center py-2 bg-card border-t border-border">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} width={24} height={24} borderRadius={12} />
        ))}
      </View>
    </View>
  );
} 
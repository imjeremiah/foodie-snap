/**
 * @file Enhanced Error Boundary component for FoodieSnap
 * Provides comprehensive error handling with recovery options and crash reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { hapticError } from '../../lib/haptics';

/**
 * Error boundary props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  enableCrashReporting?: boolean;
  showErrorDetails?: boolean;
}

/**
 * Error boundary state
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  isRecovering: boolean;
  errorHistory: ErrorHistoryItem[];
}

/**
 * Error history item for tracking patterns
 */
interface ErrorHistoryItem {
  id: string;
  error: string;
  stack?: string;
  timestamp: number;
  component?: string;
  userAgent?: string;
  appVersion?: string;
}

/**
 * Error fallback component props
 */
export interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  onRetry: () => void;
  onReportError: () => void;
  onResetApp: () => void;
  errorId: string;
  showDetails: boolean;
  onToggleDetails: () => void;
}

/**
 * Storage keys for error management
 */
const ERROR_STORAGE_KEYS = {
  ERROR_HISTORY: 'error_history',
  CRASH_COUNT: 'crash_count',
  LAST_CRASH: 'last_crash',
};

/**
 * Default error fallback component
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  onReportError,
  onResetApp,
  errorId,
  showDetails,
  onToggleDetails,
}: ErrorFallbackProps) {
  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-6">
        <View className="w-full max-w-md">
          {/* Error Icon */}
          <View className="items-center mb-6">
            <View className="h-20 w-20 items-center justify-center rounded-full bg-red-100">
              <Ionicons name="warning" size={40} color="#DC2626" />
            </View>
          </View>

          {/* Error Message */}
          <View className="mb-8">
            <Text className="text-center text-2xl font-bold text-foreground mb-3">
              Something went wrong
            </Text>
            <Text className="text-center text-muted-foreground text-base leading-6">
              We encountered an unexpected error. Don't worry, your data is safe. 
              You can try refreshing or restart the app.
            </Text>
          </View>

          {/* Error Details Toggle */}
          <TouchableOpacity
            className="mb-6 p-3 border border-border rounded-lg bg-card"
            onPress={onToggleDetails}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-foreground font-medium">
                {showDetails ? 'Hide' : 'Show'} Error Details
              </Text>
              <Ionicons 
                name={showDetails ? "chevron-up" : "chevron-down"} 
                size={16} 
                color="gray" 
              />
            </View>
          </TouchableOpacity>

          {/* Error Details */}
          {showDetails && (
            <ScrollView 
              className="mb-6 max-h-40 p-3 bg-red-50 border border-red-200 rounded-lg"
              showsVerticalScrollIndicator={true}
            >
              <Text className="text-sm font-mono text-red-800 mb-2">
                Error ID: {errorId}
              </Text>
              <Text className="text-sm font-mono text-red-800 mb-2">
                {error.name}: {error.message}
              </Text>
              {error.stack && (
                <Text className="text-xs font-mono text-red-600">
                  {error.stack}
                </Text>
              )}
            </ScrollView>
          )}

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              className="w-full bg-primary p-4 rounded-lg"
              onPress={onRetry}
            >
              <Text className="text-center font-semibold text-primary-foreground">
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full border border-border p-4 rounded-lg bg-card"
              onPress={onReportError}
            >
              <Text className="text-center font-medium text-foreground">
                Report This Issue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-full border border-red-300 p-4 rounded-lg bg-red-50"
              onPress={onResetApp}
            >
              <Text className="text-center font-medium text-red-600">
                Reset App
              </Text>
            </TouchableOpacity>
          </View>

          {/* Help Text */}
          <Text className="text-center text-xs text-muted-foreground mt-6">
            If this problem persists, try restarting your device or contact support.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Enhanced Error Boundary Component
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      isRecovering: false,
      errorHistory: [],
    };
  }

  /**
   * Static method to derive state from error
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36)}`,
    };
  }

  /**
   * Component did catch error
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Trigger haptic feedback
    hapticError();

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Log error to error history
    this.logErrorToHistory(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Report crash if enabled
    if (this.props.enableCrashReporting) {
      this.reportCrash(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  /**
   * Log error to persistent history for pattern analysis
   */
  private async logErrorToHistory(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorItem: ErrorHistoryItem = {
        id: this.state.errorId || `error_${Date.now()}`,
        error: error.message,
        stack: error.stack,
        timestamp: Date.now(),
        component: errorInfo.componentStack?.split('\n')[1]?.trim(),
      };

      // Get existing history
      const existingHistory = await AsyncStorage.getItem(ERROR_STORAGE_KEYS.ERROR_HISTORY);
      const history: ErrorHistoryItem[] = existingHistory ? JSON.parse(existingHistory) : [];

      // Add new error and limit to last 50 errors
      history.unshift(errorItem);
      const limitedHistory = history.slice(0, 50);

      // Save back to storage
      await AsyncStorage.setItem(
        ERROR_STORAGE_KEYS.ERROR_HISTORY, 
        JSON.stringify(limitedHistory)
      );

      // Update crash count
      const crashCount = await this.incrementCrashCount();
      
      // Save last crash timestamp
      await AsyncStorage.setItem(
        ERROR_STORAGE_KEYS.LAST_CRASH,
        Date.now().toString()
      );

      this.setState({ errorHistory: limitedHistory });
    } catch (historyError) {
      console.error('Failed to log error to history:', historyError);
    }
  }

  /**
   * Increment crash count for monitoring
   */
  private async incrementCrashCount(): Promise<number> {
    try {
      const existingCount = await AsyncStorage.getItem(ERROR_STORAGE_KEYS.CRASH_COUNT);
      const count = existingCount ? parseInt(existingCount, 10) + 1 : 1;
      await AsyncStorage.setItem(ERROR_STORAGE_KEYS.CRASH_COUNT, count.toString());
      return count;
    } catch (error) {
      console.error('Failed to increment crash count:', error);
      return 0;
    }
  }

  /**
   * Report crash to external service (placeholder for analytics service)
   */
  private async reportCrash(error: Error, errorInfo: ErrorInfo) {
    try {
      // In a real app, you would send this to a crash reporting service
      // like Sentry, Crashlytics, or Bugsnag
      const crashReport = {
        errorId: this.state.errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        // Add more context as needed
      };

      console.log('Crash report:', crashReport);
      
      // Example: await crashReportingService.report(crashReport);
    } catch (reportError) {
      console.error('Failed to report crash:', reportError);
    }
  }

  /**
   * Handle retry action
   */
  private handleRetry = () => {
    this.setState({ isRecovering: true });
    
    // Add small delay for better UX
    this.retryTimeoutId = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        isRecovering: false,
      });
    }, 500);
  };

  /**
   * Handle error reporting
   */
  private handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    if (!error || !errorId) return;

    Alert.alert(
      "Report Error",
      "Thank you for helping us improve the app. The error details will be sent to our development team.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send Report", 
          onPress: () => {
            this.reportCrash(error, errorInfo!);
            Alert.alert("Report Sent", "Thank you! We'll investigate this issue.");
          }
        },
      ]
    );
  };

  /**
   * Handle app reset
   */
  private handleResetApp = () => {
    Alert.alert(
      "Reset App",
      "This will clear all app data and return to a fresh state. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          style: "destructive",
          onPress: async () => {
            try {
              // Clear all app storage (be careful with this!)
              await AsyncStorage.clear();
              
              // Reset error boundary state
              this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
                errorId: null,
                isRecovering: false,
                errorHistory: [],
              });
              
              Alert.alert("App Reset", "The app has been reset. Please restart the app.");
            } catch (resetError) {
              console.error('Failed to reset app:', resetError);
              Alert.alert("Reset Failed", "Unable to reset the app. Please restart manually.");
            }
          }
        },
      ]
    );
  };

  /**
   * Toggle error details visibility
   */
  private handleToggleDetails = () => {
    // This would be managed by local state in the fallback component
    // Implementation depends on how the fallback manages its own state
  };

  /**
   * Cleanup on unmount
   */
  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  /**
   * Render method
   */
  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      if (!this.state.error) return null;

      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo!}
          onRetry={this.handleRetry}
          onReportError={this.handleReportError}
          onResetApp={this.handleResetApp}
          errorId={this.state.errorId!}
          showDetails={this.props.showErrorDetails || false}
          onToggleDetails={this.handleToggleDetails}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to get error boundary utilities
 */
export function useErrorHandler() {
  const throwError = (error: Error | string) => {
    if (typeof error === 'string') {
      throw new Error(error);
    }
    throw error;
  };

  const handleAsyncError = (asyncFn: () => Promise<any>) => {
    return asyncFn().catch((error) => {
      console.error('Async error caught:', error);
      // In React, async errors need to be thrown in a render cycle to be caught by error boundaries
      // For now, we'll just log them
    });
  };

  return {
    throwError,
    handleAsyncError,
  };
}

/**
 * Higher-order component for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<ErrorBoundaryProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
} 
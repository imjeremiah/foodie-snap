/**
 * @file Offline detection and behavior handling for FoodieSnap
 * Provides network connectivity monitoring and offline-first behavior patterns
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Network connection types
 */
export enum ConnectionType {
  WIFI = 'wifi',
  CELLULAR = 'cellular',
  ETHERNET = 'ethernet',
  NONE = 'none',
  UNKNOWN = 'unknown',
}

/**
 * Connection quality levels
 */
export enum ConnectionQuality {
  EXCELLENT = 'excellent',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor',
  OFFLINE = 'offline',
}

/**
 * Network state interface
 */
export interface NetworkState {
  isConnected: boolean;
  type: ConnectionType;
  quality: ConnectionQuality;
  isInternetReachable: boolean;
  isExpensive: boolean; // Indicates cellular/metered connection
}

/**
 * Offline action for queue processing
 */
export interface OfflineAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Offline storage keys
 */
const STORAGE_KEYS = {
  OFFLINE_QUEUE: 'offline_queue',
  CACHED_DATA: 'cached_data',
  NETWORK_STATS: 'network_stats',
};

/**
 * Global network state
 */
let currentNetworkState: NetworkState = {
  isConnected: false,
  type: ConnectionType.NONE,
  quality: ConnectionQuality.OFFLINE,
  isInternetReachable: false,
  isExpensive: false,
};

/**
 * Offline action queue
 */
let offlineQueue: OfflineAction[] = [];

/**
 * Network state listeners
 */
const networkListeners = new Set<(state: NetworkState) => void>();

/**
 * Initialize offline detection and management
 */
export function initializeOfflineSupport() {
  // Load cached offline queue
  loadOfflineQueue();
  
  // Set up network state monitoring
  const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    const networkState = parseNetInfoState(state);
    updateNetworkState(networkState);
  });

  // Initial network state check
  NetInfo.fetch().then((state: NetInfoState) => {
    const networkState = parseNetInfoState(state);
    updateNetworkState(networkState);
  });

  return unsubscribe;
}

/**
 * Parse NetInfo state to our NetworkState format
 */
function parseNetInfoState(state: NetInfoState): NetworkState {
  const type = mapConnectionType(state.type);
  const quality = assessConnectionQuality(state);
  
  return {
    isConnected: state.isConnected || false,
    type,
    quality,
    isInternetReachable: state.isInternetReachable || false,
    isExpensive: state.details?.isConnectionExpensive || false,
  };
}

/**
 * Map NetInfo connection type to our enum
 */
function mapConnectionType(type: string): ConnectionType {
  switch (type.toLowerCase()) {
    case 'wifi':
      return ConnectionType.WIFI;
    case 'cellular':
      return ConnectionType.CELLULAR;
    case 'ethernet':
      return ConnectionType.ETHERNET;
    case 'none':
      return ConnectionType.NONE;
    default:
      return ConnectionType.UNKNOWN;
  }
}

/**
 * Assess connection quality based on NetInfo details
 */
function assessConnectionQuality(state: NetInfoState): ConnectionQuality {
  if (!state.isConnected) return ConnectionQuality.OFFLINE;
  
  // For WiFi connections, use signal strength if available
  if (state.type === 'wifi' && state.details) {
    const strength = (state.details as any).strength;
    if (strength !== undefined) {
      if (strength > 75) return ConnectionQuality.EXCELLENT;
      if (strength > 50) return ConnectionQuality.GOOD;
      if (strength > 25) return ConnectionQuality.FAIR;
      return ConnectionQuality.POOR;
    }
  }
  
  // For cellular, use generation info if available
  if (state.type === 'cellular' && state.details) {
    const generation = (state.details as any).cellularGeneration;
    if (generation === '5g') return ConnectionQuality.EXCELLENT;
    if (generation === '4g') return ConnectionQuality.GOOD;
    if (generation === '3g') return ConnectionQuality.FAIR;
    return ConnectionQuality.POOR;
  }
  
  // Default to good for connected state
  return ConnectionQuality.GOOD;
}

/**
 * Update global network state and notify listeners
 */
function updateNetworkState(newState: NetworkState) {
  const wasOffline = !currentNetworkState.isConnected;
  const isNowOnline = newState.isConnected;
  
  currentNetworkState = newState;
  
  // Notify all listeners
  networkListeners.forEach(listener => listener(newState));
  
  // Process offline queue if we came back online
  if (wasOffline && isNowOnline) {
    processOfflineQueue();
  }
}

/**
 * Hook for monitoring network state
 */
export function useNetworkState() {
  const [networkState, setNetworkState] = useState<NetworkState>(currentNetworkState);

  useEffect(() => {
    const listener = (state: NetworkState) => setNetworkState(state);
    networkListeners.add(listener);
    
    return () => {
      networkListeners.delete(listener);
    };
  }, []);

  return networkState;
}

/**
 * Get current network state synchronously
 */
export function getCurrentNetworkState(): NetworkState {
  return { ...currentNetworkState };
}

/**
 * Check if device is currently online
 */
export function isOnline(): boolean {
  return currentNetworkState.isConnected && currentNetworkState.isInternetReachable;
}

/**
 * Check if connection is expensive (cellular/metered)
 */
export function isExpensiveConnection(): boolean {
  return currentNetworkState.isExpensive;
}

/**
 * Add action to offline queue
 */
export async function queueOfflineAction(
  type: string,
  payload: any,
  priority: 'low' | 'medium' | 'high' = 'medium',
  maxRetries: number = 3
) {
  const action: OfflineAction = {
    id: `${Date.now()}_${Math.random().toString(36)}`,
    type,
    payload,
    timestamp: Date.now(),
    retryCount: 0,
    maxRetries,
    priority,
  };

  offlineQueue.push(action);
  await saveOfflineQueue();
  
  // Try to process immediately if online
  if (isOnline()) {
    processOfflineQueue();
  }
  
  return action.id;
}

/**
 * Process offline action queue
 */
async function processOfflineQueue() {
  if (!isOnline() || offlineQueue.length === 0) return;

  // Sort by priority and timestamp
  const sortedQueue = [...offlineQueue].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return a.timestamp - b.timestamp; // Older first
  });

  const processedActions: string[] = [];
  
  for (const action of sortedQueue) {
    try {
      await executeOfflineAction(action);
      processedActions.push(action.id);
    } catch (error) {
      console.warn('Failed to process offline action:', action, error);
      
      // Increment retry count
      action.retryCount++;
      
      // Remove if max retries exceeded
      if (action.retryCount >= action.maxRetries) {
        processedActions.push(action.id);
        console.error('Max retries exceeded for offline action:', action);
      }
    }
  }

  // Remove processed actions from queue
  if (processedActions.length > 0) {
    offlineQueue = offlineQueue.filter(action => !processedActions.includes(action.id));
    await saveOfflineQueue();
  }
}

/**
 * Execute an offline action (to be implemented by app-specific handlers)
 */
async function executeOfflineAction(action: OfflineAction) {
  // This is where we would dispatch actions to RTK Query or other handlers
  // For now, we'll use a simple event system
  const event = new CustomEvent('offline-action', { detail: action });
  // In React Native, we'd use a different mechanism, but this shows the concept
  
  // Example implementation:
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Re-attempt to send message
      console.log('Retrying message send:', action.payload);
      break;
    case 'UPLOAD_PHOTO':
      // Re-attempt photo upload
      console.log('Retrying photo upload:', action.payload);
      break;
    case 'SEND_FRIEND_REQUEST':
      // Re-attempt friend request
      console.log('Retrying friend request:', action.payload);
      break;
    default:
      console.warn('Unknown offline action type:', action.type);
  }
}

/**
 * Save offline queue to persistent storage
 */
async function saveOfflineQueue() {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(offlineQueue));
  } catch (error) {
    console.error('Failed to save offline queue:', error);
  }
}

/**
 * Load offline queue from persistent storage
 */
async function loadOfflineQueue() {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    if (stored) {
      offlineQueue = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load offline queue:', error);
    offlineQueue = [];
  }
}

/**
 * Clear offline queue (for testing or manual cleanup)
 */
export async function clearOfflineQueue() {
  offlineQueue = [];
  await saveOfflineQueue();
}

/**
 * Get current offline queue status
 */
export function getOfflineQueueStatus() {
  return {
    total: offlineQueue.length,
    byPriority: {
      high: offlineQueue.filter(a => a.priority === 'high').length,
      medium: offlineQueue.filter(a => a.priority === 'medium').length,
      low: offlineQueue.filter(a => a.priority === 'low').length,
    },
    oldestAction: offlineQueue.length > 0 ? Math.min(...offlineQueue.map(a => a.timestamp)) : null,
  };
}

/**
 * Cache data for offline access
 */
export async function cacheData(key: string, data: any, ttl?: number) {
  try {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || (24 * 60 * 60 * 1000), // 24 hours default
    };
    
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
    const cacheMap = cached ? JSON.parse(cached) : {};
    cacheMap[key] = cacheEntry;
    
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cacheMap));
  } catch (error) {
    console.error('Failed to cache data:', error);
  }
}

/**
 * Retrieve cached data
 */
export async function getCachedData(key: string): Promise<any | null> {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_DATA);
    if (!cached) return null;
    
    const cacheMap = JSON.parse(cached);
    const entry = cacheMap[key];
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      // Clean up expired entry
      delete cacheMap[key];
      await AsyncStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cacheMap));
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
}

/**
 * Hook for offline-aware data fetching
 */
export function useOfflineData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  options: {
    cacheTimeout?: number;
    fallbackData?: T;
    refetchOnOnline?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(options.fallbackData || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const networkState = useNetworkState();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (isOnline()) {
        // Fetch fresh data
        const freshData = await fetchFunction();
        setData(freshData);
        
        // Cache the result
        await cacheData(key, freshData, options.cacheTimeout);
      } else {
        // Try to get cached data
        const cachedData = await getCachedData(key);
        if (cachedData) {
          setData(cachedData);
        } else if (options.fallbackData) {
          setData(options.fallbackData);
        } else {
          setError('No cached data available offline');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      
      // Try cached data as fallback
      const cachedData = await getCachedData(key);
      if (cachedData) {
        setData(cachedData);
      } else if (options.fallbackData) {
        setData(options.fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetchFunction, options.cacheTimeout, options.fallbackData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when coming back online
  useEffect(() => {
    if (networkState.isConnected && options.refetchOnOnline) {
      fetchData();
    }
  }, [networkState.isConnected, options.refetchOnOnline, fetchData]);

  return { data, loading, error, refetch: fetchData };
} 
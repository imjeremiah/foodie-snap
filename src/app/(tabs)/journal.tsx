/**
 * @file Journal screen - displays user's content history with grid layout and functionality.
 * Implements Phase 2.1 Step 7: Content Journal Implementation
 */

import React, { useState, useCallback } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { 
  useGetJournalEntriesQuery, 
  useDeleteJournalEntryMutation,
  useToggleJournalFavoriteMutation,
  useGetJournalStatsQuery,
  useReshareFromJournalMutation,
  useGetConversationsQuery,
  useShareToSpotlightMutation,
  useFindSimilarMealsQuery
} from "../../store/slices/api-slice";
import type { JournalEntry, ConversationWithDetails } from "../../types/database";
import SemanticSearchModal from "../../components/journal/SemanticSearchModal";
import JournalAnalyticsModal from "../../components/journal/JournalAnalyticsModal";

const { width: screenWidth } = Dimensions.get('window');
const ITEM_SIZE = (screenWidth - 32 - 20) / 3; // 3 columns with padding

type FilterType = 'all' | 'favorites' | 'photos' | 'videos' | 'shared';

interface JournalItemProps {
  item: JournalEntry;
  onPress: (item: JournalEntry) => void;
  onLongPress: (item: JournalEntry) => void;
}

/**
 * Individual journal grid item component
 */
function JournalItem({ item, onPress, onLongPress }: JournalItemProps) {
  return (
    <TouchableOpacity
      className="relative bg-muted rounded-lg overflow-hidden shadow-sm"
      style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.image_url }}
        style={{ width: ITEM_SIZE, height: ITEM_SIZE }}
        resizeMode="cover"
      />
      
      {/* Overlay indicators */}
      <View className="absolute top-1 right-1 flex-row space-x-1">
        {item.is_favorite && (
          <View className="bg-red-500 rounded-full p-1">
            <Ionicons name="heart" size={12} color="white" />
          </View>
        )}
        {(item.shared_to_chat || item.shared_to_story || item.shared_to_spotlight) && (
          <View className="bg-blue-500 rounded-full p-1">
            <Ionicons name="share" size={12} color="white" />
          </View>
        )}
        {item.content_type === 'video' && (
          <View className="bg-black/50 rounded-full p-1">
            <Ionicons name="play" size={12} color="white" />
          </View>
        )}
      </View>

      {/* Caption preview with overlay */}
      {item.caption && (
        <View className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-2">
          <Text className="text-white text-xs font-medium" numberOfLines={2}>
            {item.caption}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function JournalScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReshareModal, setShowReshareModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // New semantic search and analytics states
  const [showSemanticSearchModal, setShowSemanticSearchModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSimilarMealsModal, setShowSimilarMealsModal] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // API hooks
  const { 
    data: journalEntries = [], 
    isLoading, 
    error,
    refetch 
  } = useGetJournalEntriesQuery({
    filter: activeFilter,
    search: searchQuery.trim() || undefined,
    limit: 100
  });

  const { data: journalStats } = useGetJournalStatsQuery();
  const { data: conversations = [] } = useGetConversationsQuery();
  const [deleteJournalEntry] = useDeleteJournalEntryMutation();
  const [toggleFavorite] = useToggleJournalFavoriteMutation();
  const [reshareFromJournal] = useReshareFromJournalMutation();
  const [shareToSpotlight] = useShareToSpotlightMutation();

  // Similar meals query (only fetch when entry is selected)
  const { data: similarMeals = [], isLoading: loadingSimilarMeals } = useFindSimilarMealsQuery(
    { entry_id: selectedEntry?.id || '' },
    { skip: !selectedEntry?.id || !showSimilarMealsModal }
  );

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  /**
   * Handle filter changes
   */
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter);
    setSearchQuery(''); // Clear search when changing filters
  };

  /**
   * Handle entry press (show detail modal)
   */
  const handleEntryPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setShowDetailModal(true);
  };

  /**
   * Handle entry long press (show action menu)
   */
  const handleEntryLongPress = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    showActionMenu();
  };

  /**
   * Show action menu for entry
   */
  const showActionMenu = () => {
    if (!selectedEntry) return;

    Alert.alert(
      "Journal Entry Actions",
      `What would you like to do with this ${selectedEntry.content_type}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: selectedEntry.is_favorite ? "Remove from Favorites" : "Add to Favorites",
          onPress: handleToggleFavorite
        },
        {
          text: "Find Similar Meals",
          onPress: () => setShowSimilarMealsModal(true)
        },
        {
          text: "Reshare",
          onPress: () => setShowReshareModal(true)
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: handleDeleteEntry
        }
      ]
    );
  };

  /**
   * Handle semantic search results
   */
  const handleSemanticSearchResults = (results: any[]) => {
    setSearchResults(results);
    setIsSearchMode(true);
    console.log('Search results:', results);
  };

  /**
   * Clear search mode and return to normal journal view
   */
  const clearSearchMode = () => {
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchQuery('');
  };

  /**
   * Handle entry press for similar meals
   */
  const handleSimilarMealPress = (mealEntry: any) => {
    // Find the full entry data and set it as selected
    const fullEntry = journalEntries.find(entry => entry.id === mealEntry.id);
    if (fullEntry) {
      setSelectedEntry(fullEntry);
      setShowSimilarMealsModal(false);
      setShowDetailModal(true);
    }
  };

  /**
   * Toggle favorite status
   */
  const handleToggleFavorite = async () => {
    if (!selectedEntry) return;

    try {
      await toggleFavorite(selectedEntry.id).unwrap();
      Alert.alert(
        "Success",
        selectedEntry.is_favorite ? "Removed from favorites" : "Added to favorites"
      );
    } catch (error) {
      console.error('Toggle favorite failed:', error);
      Alert.alert("Error", "Failed to update favorite status");
    }
  };

  /**
   * Delete entry
   */
  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;

    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteJournalEntry(selectedEntry.id).unwrap();
              Alert.alert("Success", "Entry deleted successfully");
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert("Error", "Failed to delete entry");
            }
          }
        }
      ]
    );
  };

  /**
   * Handle reshare to conversation
   */
  const handleReshareToChat = async (conversation: ConversationWithDetails) => {
    if (!selectedEntry) return;

    try {
      await reshareFromJournal({
        entryId: selectedEntry.id,
        destination: 'chat',
        conversationId: conversation.id
      }).unwrap();

      Alert.alert(
        "Success",
        `Reshared to ${conversation.other_participant.display_name || 'chat'}`
      );
      setShowReshareModal(false);
    } catch (error) {
      console.error('Reshare failed:', error);
      Alert.alert("Error", "Failed to reshare content");
    }
  };

  /**
   * Handle share to spotlight
   */
  const handleShareToSpotlight = async () => {
    if (!selectedEntry) return;

    Alert.alert(
      "Share to Spotlight",
      "Share this photo with the public community?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Share",
          onPress: async () => {
            try {
              await shareToSpotlight({
                journalEntryId: selectedEntry.id,
                caption: selectedEntry.caption || undefined,
                audienceRestriction: 'public'
              }).unwrap();

              Alert.alert("Success", "Shared to Spotlight!");
              setShowReshareModal(false);
            } catch (error) {
              console.error('Share to spotlight failed:', error);
              Alert.alert("Error", "Failed to share to spotlight");
            }
          }
        }
      ]
    );
  };

  /**
   * Get filter button style
   */
  const getFilterButtonStyle = (filter: FilterType) => {
    const isActive = activeFilter === filter;
    return `px-4 py-2 rounded-full ${
      isActive 
        ? 'bg-primary shadow-sm border border-primary' 
        : 'bg-card border border-border shadow-sm'
    }`;
  };

  /**
   * Get filter button text style
   */
  const getFilterTextStyle = (filter: FilterType) => {
    const isActive = activeFilter === filter;
    return `text-sm font-medium ${
      isActive ? 'text-primary-foreground' : 'text-foreground'
    }`;
  };

  /**
   * Render empty state
   */
  const renderEmptyState = () => (
    <View className="flex-1 items-center justify-center px-4">
      <Ionicons name="book-outline" size={64} color="#9CA3AF" />
      <Text className="mt-4 text-center text-xl font-semibold text-foreground">
        {searchQuery ? 'No Results Found' : 'Your Journal is Empty'}
      </Text>
      <Text className="mt-2 text-center text-muted-foreground">
        {searchQuery 
          ? `No entries match "${searchQuery}"`
          : 'Capture and share photos to start building your content history'
        }
      </Text>
    </View>
  );

  /**
   * Render journal stats
   */
  const renderStats = () => {
    if (!journalStats) return null;

    return (
      <View className="flex-row justify-around bg-card p-4 mx-4 rounded-lg shadow-sm">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary">
            {journalStats.total_entries}
          </Text>
          <Text className="text-xs text-muted-foreground">Total</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-red-500">
            {journalStats.favorites_count}
          </Text>
          <Text className="text-xs text-muted-foreground">Favorites</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-blue-500">
            {journalStats.shared_count}
          </Text>
          <Text className="text-xs text-muted-foreground">Shared</Text>
        </View>
      </View>
    );
  };

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-4">
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text className="mt-4 text-center text-xl font-semibold text-foreground">
            Error Loading Journal
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

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="px-4 pb-4">
        <Text className="text-2xl font-bold text-foreground">Journal</Text>
        <Text className="text-sm text-muted-foreground">
          Your content history
        </Text>
      </View>

      {/* Stats */}
      {renderStats()}

      {/* Search Bar and Smart Actions */}
      <View className="mx-4 mt-4 mb-2">
        {/* Search Bar */}
        <View className="flex-row items-center bg-muted rounded-lg px-3 py-2 mb-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-foreground"
            placeholder="Search your journal..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Smart Search and Analytics Buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-primary rounded-lg px-4 py-3"
            onPress={() => setShowSemanticSearchModal(true)}
          >
            <Ionicons name="sparkles" size={16} color="white" />
            <Text className="text-primary-foreground font-medium ml-2">Smart Search</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center bg-card border border-border rounded-lg px-4 py-3"
            onPress={() => setShowAnalyticsModal(true)}
          >
            <Ionicons name="analytics" size={16} color="#6366F1" />
            <Text className="text-foreground font-medium ml-2">Insights</Text>
          </TouchableOpacity>
        </View>

        {/* Search Mode Indicator */}
        {isSearchMode && (
          <View className="flex-row items-center justify-between bg-blue-50 rounded-lg px-3 py-2 mt-3">
            <View className="flex-row items-center">
              <Ionicons name="sparkles" size={16} color="#3B82F6" />
              <Text className="text-blue-800 font-medium ml-2">
                Smart Search Results ({searchResults.length})
              </Text>
            </View>
            <TouchableOpacity onPress={clearSearchMode}>
              <Ionicons name="close-circle" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Filter Tabs */}
      <View className="px-4 mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'all', label: 'All' },
            { key: 'favorites', label: 'Favorites' },
            { key: 'photos', label: 'Photos' },
            { key: 'videos', label: 'Videos' },
            { key: 'shared', label: 'Shared' }
          ]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={getFilterButtonStyle(item.key as FilterType)}
              onPress={() => handleFilterChange(item.key as FilterType)}
            >
              <Text className={getFilterTextStyle(item.key as FilterType)}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Content Grid */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="hsl(var(--primary))" />
          <Text className="mt-2 text-muted-foreground">Loading journal...</Text>
        </View>
      ) : (isSearchMode ? searchResults : journalEntries).length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={isSearchMode ? searchResults : journalEntries}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          columnWrapperStyle={{ gap: 10 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["hsl(var(--primary))"]}
            />
          }
          renderItem={({ item }) => (
            <JournalItem
              item={item}
              onPress={handleEntryPress}
              onLongPress={handleEntryLongPress}
            />
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="fade"
        presentationStyle="overFullScreen"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View className="flex-1 bg-black">
          <SafeAreaView className="flex-1">
            {/* Header */}
            <View className="absolute top-0 left-0 right-0 z-10 p-4" style={{ paddingTop: 50 }}>
              <View className="flex-row items-center justify-between">
                <TouchableOpacity
                  className="h-12 w-12 items-center justify-center rounded-full bg-black/70"
                  onPress={() => setShowDetailModal(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={28} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="h-12 w-12 items-center justify-center rounded-full bg-black/70"
                  onPress={() => {
                    setShowDetailModal(false);
                    setTimeout(() => showActionMenu(), 100);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="ellipsis-horizontal" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Image */}
            {selectedEntry && (
              <TouchableOpacity 
                className="flex-1 items-center justify-center"
                onPress={() => setShowDetailModal(false)}
                activeOpacity={1}
              >
                <Image
                  source={{ uri: selectedEntry.image_url }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
              </TouchableOpacity>
            )}

            {/* Caption */}
            {selectedEntry?.caption && (
              <View className="absolute bottom-0 left-0 right-0 bg-black/70 p-4" style={{ paddingBottom: 40 }}>
                <Text className="text-white text-base">
                  {selectedEntry.caption}
                </Text>
                <Text className="text-white/70 text-sm mt-1">
                  {new Date(selectedEntry.created_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </SafeAreaView>
        </View>
      </Modal>

      {/* Reshare Modal */}
      <Modal
        visible={showReshareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowReshareModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
            <TouchableOpacity onPress={() => setShowReshareModal(false)}>
              <Text className="text-primary">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-foreground">Reshare</Text>
            <View className="w-12" />
          </View>

          {/* Share Options */}
          <View className="p-4 border-b border-border">
            <TouchableOpacity
              className="flex-row items-center bg-primary/10 p-4 rounded-lg mb-3"
              onPress={handleShareToSpotlight}
            >
              <View className="w-12 h-12 bg-primary rounded-full items-center justify-center mr-3">
                <Ionicons name="globe" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-foreground font-semibold text-base">Share to Spotlight</Text>
                <Text className="text-muted-foreground text-sm">Share with the public community</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} className="text-muted-foreground" />
            </TouchableOpacity>
          </View>

          {/* Conversations List */}
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="flex-row items-center border-b border-border py-4"
                onPress={() => handleReshareToChat(item)}
              >
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-primary">
                  {item.other_participant.avatar_url ? (
                    <Image
                      source={{ uri: item.other_participant.avatar_url }}
                      className="h-12 w-12 rounded-full"
                    />
                  ) : (
                    <Text className="text-lg font-semibold text-primary-foreground">
                      {(item.other_participant.display_name || item.other_participant.email)
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">
                    {item.other_participant.display_name || 
                     item.other_participant.email.split('@')[0]}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                    Tap to reshare
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-8">
                <Text className="text-muted-foreground">No conversations available</Text>
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Semantic Search Modal */}
      <SemanticSearchModal
        visible={showSemanticSearchModal}
        onClose={() => setShowSemanticSearchModal(false)}
        onResultsFound={handleSemanticSearchResults}
      />

      {/* Analytics Modal */}
      <JournalAnalyticsModal
        visible={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
      />

      {/* Similar Meals Modal */}
      <Modal
        visible={showSimilarMealsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSimilarMealsModal(false)}
      >
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center">
              <Ionicons name="restaurant" size={24} color="#6366F1" />
              <Text className="text-xl font-bold text-foreground ml-2">
                Similar Meals
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowSimilarMealsModal(false)}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loadingSimilarMeals ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#6366F1" />
              <Text className="text-muted-foreground mt-2">Finding similar meals...</Text>
            </View>
          ) : similarMeals.length === 0 ? (
            <View className="flex-1 items-center justify-center px-4">
              <Ionicons name="search" size={48} color="#9CA3AF" />
              <Text className="text-foreground text-lg font-semibold mt-4">
                No Similar Meals Found
              </Text>
              <Text className="text-muted-foreground text-center mt-2">
                Try adding more meals to your journal to find similar content
              </Text>
            </View>
          ) : (
            <FlatList
              data={similarMeals}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row bg-card rounded-lg p-4 mb-3 border border-border"
                  onPress={() => handleSimilarMealPress(item)}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    className="w-16 h-16 rounded-lg"
                    resizeMode="cover"
                  />
                  <View className="flex-1 ml-4">
                    <Text className="font-semibold text-foreground mb-1" numberOfLines={2}>
                      {item.caption || 'Untitled meal'}
                    </Text>
                    <View className="flex-row items-center mb-2">
                      <View className="bg-primary/10 rounded-full px-2 py-1">
                        <Text className="text-primary text-xs font-medium">
                          {Math.round(item.similarity * 100)}% similar
                        </Text>
                      </View>
                      {item.meal_type && (
                        <View className="bg-muted rounded-full px-2 py-1 ml-2">
                          <Text className="text-muted-foreground text-xs capitalize">
                            {item.meal_type}
                          </Text>
                        </View>
                      )}
                    </View>
                    {item.similarity_reasons && item.similarity_reasons.length > 0 && (
                      <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                        {item.similarity_reasons.filter(Boolean).slice(0, 2).join(', ')}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

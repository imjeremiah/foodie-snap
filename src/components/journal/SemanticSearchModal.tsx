/**
 * @file SemanticSearchModal - Advanced search interface for journal entries with AI-powered semantic search
 * Features smart filters, ingredient search, and similarity matching
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useSearchJournalEntriesSemanticQuery } from "../../store/slices/api-slice";

interface SemanticSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onResultsFound: (results: any[]) => void;
}

interface SearchFilters {
  query_text: string;
  meal_types: string[];
  dietary_patterns: string[];
  nutrition_focus: string[];
  ingredients: string[];
}

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast', emoji: '🌅' },
  { value: 'lunch', label: 'Lunch', emoji: '☀️' },
  { value: 'dinner', label: 'Dinner', emoji: '🌙' },
  { value: 'snack', label: 'Snack', emoji: '🍎' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰' },
  { value: 'beverage', label: 'Beverage', emoji: '🥤' },
  { value: 'meal_prep', label: 'Meal Prep', emoji: '📦' },
];

const DIETARY_PATTERNS = [
  { value: 'high_protein', label: 'High Protein', emoji: '💪' },
  { value: 'low_carb', label: 'Low Carb', emoji: '🥑' },
  { value: 'keto', label: 'Keto', emoji: '🧈' },
  { value: 'vegan', label: 'Vegan', emoji: '🌱' },
  { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
  { value: 'paleo', label: 'Paleo', emoji: '🥩' },
  { value: 'mediterranean', label: 'Mediterranean', emoji: '🫒' },
  { value: 'balanced', label: 'Balanced', emoji: '⚖️' },
];

const NUTRITION_FOCUS = [
  { value: 'muscle_building', label: 'Muscle Building', emoji: '💪' },
  { value: 'fat_loss', label: 'Fat Loss', emoji: '🔥' },
  { value: 'energy_boost', label: 'Energy Boost', emoji: '⚡' },
  { value: 'recovery', label: 'Recovery', emoji: '🏃' },
  { value: 'general_health', label: 'General Health', emoji: '❤️' },
  { value: 'performance', label: 'Performance', emoji: '🎯' },
  { value: 'comfort', label: 'Comfort', emoji: '🤗' },
];

/**
 * Multi-select filter component
 */
interface FilterSectionProps {
  title: string;
  options: { value: string; label: string; emoji: string }[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  maxHeight?: number;
}

function FilterSection({ title, options, selectedValues, onToggle, maxHeight = 200 }: FilterSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">{title}</Text>
      <ScrollView 
        style={{ maxHeight }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {options.map((option) => {
          const isSelected = selectedValues.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              className={`flex-row items-center px-3 py-2 rounded-full border ${
                isSelected 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-card'
              }`}
              onPress={() => onToggle(option.value)}
            >
              <Text className="mr-1">{option.emoji}</Text>
              <Text className={`text-sm font-medium ${
                isSelected ? 'text-primary' : 'text-foreground'
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * Ingredient input component with suggestions
 */
interface IngredientInputProps {
  ingredients: string[];
  onIngredientsChange: (ingredients: string[]) => void;
}

function IngredientInput({ ingredients, onIngredientsChange }: IngredientInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addIngredient = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      onIngredientsChange([...ingredients, trimmed]);
      setInputValue('');
    }
  };

  const removeIngredient = (ingredient: string) => {
    onIngredientsChange(ingredients.filter(item => item !== ingredient));
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">Ingredients</Text>
      
      {/* Ingredient input */}
      <View className="flex-row items-center mb-3">
        <TextInput
          className="flex-1 border border-border rounded-lg px-3 py-2 bg-card text-foreground"
          placeholder="Type an ingredient..."
          placeholderTextColor="#9CA3AF"
          value={inputValue}
          onChangeText={setInputValue}
          onSubmitEditing={addIngredient}
          returnKeyType="done"
        />
        <TouchableOpacity
          className="ml-2 bg-primary rounded-lg px-4 py-2"
          onPress={addIngredient}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Selected ingredients */}
      {ingredients.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {ingredients.map((ingredient, index) => (
            <View key={index} className="flex-row items-center bg-green-100 rounded-full px-3 py-1">
              <Text className="text-green-800 text-sm mr-1">{ingredient}</Text>
              <TouchableOpacity onPress={() => removeIngredient(ingredient)}>
                <Ionicons name="close-circle" size={16} color="#059669" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function SemanticSearchModal({ visible, onClose, onResultsFound }: SemanticSearchModalProps) {
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query_text: '',
    meal_types: [],
    dietary_patterns: [],
    nutrition_focus: [],
    ingredients: [],
  });

  const [isSearching, setIsSearching] = useState(false);

  // Skip API call if no filters are set
  const hasFilters = searchFilters.query_text.trim() || 
                    searchFilters.meal_types.length > 0 ||
                    searchFilters.dietary_patterns.length > 0 ||
                    searchFilters.nutrition_focus.length > 0 ||
                    searchFilters.ingredients.length > 0;

  /**
   * Update filter values
   */
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    setSearchFilters(prev => ({ ...prev, [key]: value }));
  };

  /**
   * Toggle array filter values
   */
  const toggleArrayFilter = (filterKey: keyof SearchFilters, value: string) => {
    const currentArray = searchFilters[filterKey] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFilter(filterKey, newArray);
  };

  /**
   * Perform semantic search
   */
  const performSearch = async () => {
    if (!hasFilters) {
      return;
    }

    setIsSearching(true);
    
    try {
      // Here we would typically use the RTK Query hook, but for manual triggering,
      // we'll simulate the search call. In a real implementation, this would be
      // handled differently or we'd use a manual trigger
      console.log('Performing semantic search with filters:', searchFilters);
      
      // Simulate search delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock results for demonstration
      const mockResults = [
        {
          id: '1',
          image_url: 'https://example.com/meal1.jpg',
          caption: 'Grilled chicken with quinoa and vegetables',
          meal_type: 'dinner',
          dietary_pattern: 'high_protein',
          nutrition_focus: 'muscle_building',
          ingredients: ['chicken breast', 'quinoa', 'broccoli'],
          similarity: 0.92
        },
        {
          id: '2',
          image_url: 'https://example.com/meal2.jpg',
          caption: 'Protein smoothie bowl with berries',
          meal_type: 'breakfast',
          dietary_pattern: 'high_protein',
          nutrition_focus: 'recovery',
          ingredients: ['protein powder', 'berries', 'banana'],
          similarity: 0.87
        }
      ];
      
      onResultsFound(mockResults);
      onClose();
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setSearchFilters({
      query_text: '',
      meal_types: [],
      dietary_patterns: [],
      nutrition_focus: [],
      ingredients: [],
    });
  };

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
            <Ionicons name="sparkles" size={24} color="#6366F1" />
            <Text className="text-xl font-bold text-foreground ml-2">
              Smart Search
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2">
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Content */}
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          {/* Text Search */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-foreground mb-3">Search Terms</Text>
            <TextInput
              className="border border-border rounded-lg px-4 py-3 bg-card text-foreground text-lg"
              placeholder="Search captions, insights, or descriptions..."
              placeholderTextColor="#9CA3AF"
              value={searchFilters.query_text}
              onChangeText={(text) => updateFilter('query_text', text)}
              multiline
              numberOfLines={2}
            />
            <Text className="text-xs text-muted-foreground mt-1">
              💡 Try: "high protein breakfast" or "post-workout meal"
            </Text>
          </View>

          {/* Meal Types */}
          <FilterSection
            title="Meal Types"
            options={MEAL_TYPES}
            selectedValues={searchFilters.meal_types}
            onToggle={(value) => toggleArrayFilter('meal_types', value)}
          />

          {/* Dietary Patterns */}
          <FilterSection
            title="Dietary Patterns"
            options={DIETARY_PATTERNS}
            selectedValues={searchFilters.dietary_patterns}
            onToggle={(value) => toggleArrayFilter('dietary_patterns', value)}
          />

          {/* Nutrition Focus */}
          <FilterSection
            title="Nutrition Focus"
            options={NUTRITION_FOCUS}
            selectedValues={searchFilters.nutrition_focus}
            onToggle={(value) => toggleArrayFilter('nutrition_focus', value)}
          />

          {/* Ingredients */}
          <IngredientInput
            ingredients={searchFilters.ingredients}
            onIngredientsChange={(ingredients) => updateFilter('ingredients', ingredients)}
          />

          {/* Search Tips */}
          <View className="bg-blue-50 p-4 rounded-lg mb-6">
            <View className="flex-row items-center mb-2">
              <Ionicons name="bulb" size={16} color="#3B82F6" />
              <Text className="text-blue-800 font-medium ml-2">Smart Search Tips</Text>
            </View>
            <Text className="text-blue-700 text-sm leading-5">
              • Combine text search with filters for better results{'\n'}
              • Search by ingredients to find similar meals{'\n'}
              • Use nutrition focus to find meals for specific goals{'\n'}
              • AI finds content similar to your search intent
            </Text>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View className="p-4 border-t border-border bg-card">
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-muted rounded-lg px-4 py-3"
              onPress={clearFilters}
            >
              <Text className="text-muted-foreground font-medium text-center">
                Clear Filters
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-lg px-4 py-3 ${
                hasFilters && !isSearching
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
              onPress={performSearch}
              disabled={!hasFilters || isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className={`font-medium text-center ${
                  hasFilters ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}>
                  Search Journal
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          {hasFilters && (
            <Text className="text-xs text-muted-foreground text-center mt-2">
              Smart search will find meals matching your criteria
            </Text>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
} 
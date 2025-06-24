/**
 * @file Creative Tools Modal - provides basic editing tools for photos and videos
 * Includes text overlays, drawing tools, and color filters with final composition
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { manipulateAsync, SaveFormat, FlipType } from "expo-image-manipulator";
import { 
  PanGestureHandler,
  GestureHandlerRootView,
  State,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Svg, { Path } from "react-native-svg";
import { 
  composeEditedImage, 
  COLOR_FILTERS,
  TEXT_COLORS,
  DRAWING_COLORS,
  type TextOverlay as TextOverlayType,
  type DrawingPath as DrawingPathType,
  type ColorFilter,
  type CompositionOptions
} from "../../lib/image-processing";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface TextOverlay extends TextOverlayType {
  backgroundColor?: string;
}

interface DrawingPath extends DrawingPathType {}

interface CreativeToolsModalProps {
  visible: boolean;
  onClose: () => void;
  mediaUri: string;
  mediaType: 'photo' | 'video';
  onSave: (editedUri: string) => void;
}

type ToolMode = 'none' | 'text' | 'draw' | 'filter';

export default function CreativeToolsModal({
  visible,
  onClose,
  mediaUri,
  mediaType,
  onSave
}: CreativeToolsModalProps) {
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Text editing state
  const [editingText, setEditingText] = useState<TextOverlay | null>(null);
  const [textInput, setTextInput] = useState('');
  const [selectedTextColor, setSelectedTextColor] = useState('#FFFFFF');
  const [textSize, setTextSize] = useState(24);
  const [showTextEditor, setShowTextEditor] = useState(false);
  
  // Drawing state
  const [currentPath, setCurrentPath] = useState('');
  const [selectedDrawingColor, setSelectedDrawingColor] = useState('#FFFFFF');
  const [brushSize, setBrushSize] = useState(5);
  const [isDrawing, setIsDrawing] = useState(false);

  /**
   * Add a new text overlay at center of screen
   */
  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: textInput,
      x: SCREEN_WIDTH / 2 - 100,
      y: SCREEN_HEIGHT / 2 - 50,
      fontSize: textSize,
      color: selectedTextColor,
      fontWeight: 'bold'
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setTextInput('');
    setShowTextEditor(false);
  };

  /**
   * Remove a text overlay
   */
  const removeTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  };

  /**
   * Handle drawing gesture
   */
  const handleDrawingGesture = (event: PanGestureHandlerGestureEvent) => {
    const { state, x, y } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      setIsDrawing(true);
      setCurrentPath(`M${x},${y}`);
    } else if (state === State.ACTIVE && isDrawing) {
      setCurrentPath(prev => `${prev} L${x},${y}`);
    } else if (state === State.END || state === State.CANCELLED) {
      if (currentPath) {
        const newPath: DrawingPath = {
          id: Date.now().toString(),
          path: currentPath,
          color: selectedDrawingColor,
          strokeWidth: brushSize
        };
        setDrawingPaths(prev => [...prev, newPath]);
      }
      setIsDrawing(false);
      setCurrentPath('');
    }
  };

  /**
   * Clear all drawings
   */
  const clearDrawings = () => {
    setDrawingPaths([]);
    setCurrentPath('');
  };

  /**
   * Apply all edits and compose final image
   */
  const applyEditsAndSave = async () => {
    setIsProcessing(true);
    
    try {
      // Check if any edits were made
      const hasEdits = textOverlays.length > 0 || drawingPaths.length > 0 || selectedFilter > 0;
      
      if (!hasEdits) {
        // No edits made, just return original
        onSave(mediaUri);
        Alert.alert(
          "No Edits Applied",
          "No changes were made to your photo.",
          [{ text: "OK", onPress: onClose }]
        );
        return;
      }
      
      // Prepare composition options
      const compositionOptions: CompositionOptions = {
        textOverlays: textOverlays.length > 0 ? textOverlays : undefined,
        drawingPaths: drawingPaths.length > 0 ? drawingPaths : undefined,
        colorFilter: selectedFilter > 0 ? COLOR_FILTERS[selectedFilter] : undefined,
        quality: 0.9
      };
      
      // Compose the final image
      const editedUri = await composeEditedImage(mediaUri, compositionOptions);
      
      onSave(editedUri);
      
      Alert.alert(
        "Edits Applied!",
        "Your photo has been edited and is ready to send or save.",
        [{ text: "OK", onPress: onClose }]
      );
      
    } catch (error) {
      console.error('Error applying edits:', error);
      Alert.alert("Error", "Failed to apply edits. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Reset all edits
   */
  const resetEdits = () => {
    setTextOverlays([]);
    setDrawingPaths([]);
    setSelectedFilter(0);
    setCurrentPath('');
    setToolMode('none');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView className="flex-1 bg-black">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3 bg-black/80">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-white">Edit</Text>
            <TouchableOpacity
              onPress={applyEditsAndSave}
              disabled={isProcessing}
              className={`${isProcessing ? 'opacity-50' : ''}`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Main editing area */}
          <View className="flex-1 relative">
            {/* Base image with filter */}
            <Image
              source={{ uri: mediaUri }}
              style={{
                width: SCREEN_WIDTH,
                height: SCREEN_HEIGHT - 200,
                resizeMode: 'contain'
              }}
            />
            
            {/* Text overlays */}
            {textOverlays.map((overlay) => (
              <TouchableOpacity
                key={overlay.id}
                style={{
                  position: 'absolute',
                  left: overlay.x,
                  top: overlay.y,
                }}
                onPress={() => removeTextOverlay(overlay.id)}
              >
                <Text
                  style={{
                    fontSize: overlay.fontSize,
                    color: overlay.color,
                    fontWeight: overlay.fontWeight,
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: 1, height: 1 },
                    textShadowRadius: 2,
                  }}
                >
                  {overlay.text}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Drawing overlay */}
            {(drawingPaths.length > 0 || currentPath) && (
              <Svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: SCREEN_WIDTH,
                  height: SCREEN_HEIGHT - 200,
                }}
                pointerEvents={toolMode === 'draw' ? 'auto' : 'none'}
              >
                {drawingPaths.map((pathData) => (
                  <Path
                    key={pathData.id}
                    d={pathData.path}
                    stroke={pathData.color}
                    strokeWidth={pathData.strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
                {currentPath && (
                  <Path
                    d={currentPath}
                    stroke={selectedDrawingColor}
                    strokeWidth={brushSize}
                    fill="transparent"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
              </Svg>
            )}
            
            {/* Drawing gesture handler */}
            {toolMode === 'draw' && (
              <PanGestureHandler onGestureEvent={handleDrawingGesture}>
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: SCREEN_WIDTH,
                    height: SCREEN_HEIGHT - 200,
                  }}
                />
              </PanGestureHandler>
            )}
          </View>

          {/* Tool selection */}
          <View className="bg-black/80 p-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-4">
                {/* Text tool */}
                <TouchableOpacity
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    toolMode === 'text' ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                  onPress={() => {
                    setToolMode(toolMode === 'text' ? 'none' : 'text');
                    if (toolMode !== 'text') setShowTextEditor(true);
                  }}
                >
                  <Ionicons name="text" size={20} color="white" />
                </TouchableOpacity>

                {/* Drawing tool */}
                <TouchableOpacity
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    toolMode === 'draw' ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                  onPress={() => setToolMode(toolMode === 'draw' ? 'none' : 'draw')}
                >
                  <Ionicons name="brush" size={20} color="white" />
                </TouchableOpacity>

                {/* Filter tool */}
                <TouchableOpacity
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    toolMode === 'filter' ? 'bg-purple-500' : 'bg-gray-700'
                  }`}
                  onPress={() => setToolMode(toolMode === 'filter' ? 'none' : 'filter')}
                >
                  <Ionicons name="color-filter" size={20} color="white" />
                </TouchableOpacity>

                {/* Clear/Reset */}
                <TouchableOpacity
                  className="h-12 w-12 items-center justify-center rounded-full bg-red-500"
                  onPress={resetEdits}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Tool-specific controls */}
            {toolMode === 'text' && (
              <View className="mt-4 space-y-3">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {TEXT_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 ${
                          selectedTextColor === color ? 'border-white' : 'border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        onPress={() => setSelectedTextColor(color)}
                      />
                    ))}
                  </View>
                </ScrollView>

                <View className="flex-row items-center space-x-4">
                  <Text className="text-white">Size:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row space-x-2">
                      {[16, 20, 24, 32, 40, 48].map((size) => (
                        <TouchableOpacity
                          key={size}
                          className={`px-3 py-1 rounded ${
                            textSize === size ? 'bg-blue-500' : 'bg-gray-700'
                          }`}
                          onPress={() => setTextSize(size)}
                        >
                          <Text className="text-white text-xs">{size}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            {toolMode === 'draw' && (
              <View className="mt-4 space-y-3">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-2">
                    {DRAWING_COLORS.map((color) => (
                      <TouchableOpacity
                        key={color}
                        className={`h-8 w-8 rounded-full border-2 ${
                          selectedDrawingColor === color ? 'border-white' : 'border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                        onPress={() => setSelectedDrawingColor(color)}
                      />
                    ))}
                  </View>
                </ScrollView>

                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center space-x-4">
                    <Text className="text-white">Brush:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row space-x-2">
                        {[2, 5, 10, 15, 25].map((size) => (
                          <TouchableOpacity
                            key={size}
                            className={`px-3 py-1 rounded ${
                              brushSize === size ? 'bg-green-500' : 'bg-gray-700'
                            }`}
                            onPress={() => setBrushSize(size)}
                          >
                            <Text className="text-white text-xs">{size}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                  
                  <TouchableOpacity
                    className="bg-red-500 px-3 py-1 rounded"
                    onPress={clearDrawings}
                  >
                    <Text className="text-white text-xs">Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {toolMode === 'filter' && (
              <View className="mt-4">
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-3">
                    {COLOR_FILTERS.map((filter, index) => (
                      <TouchableOpacity
                        key={filter.name}
                        className={`px-4 py-2 rounded ${
                          selectedFilter === index ? 'bg-purple-500' : 'bg-gray-700'
                        }`}
                        onPress={() => setSelectedFilter(index)}
                      >
                        <Text className="text-white text-xs">{filter.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>

          {/* Text input modal */}
          <Modal
            visible={showTextEditor}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowTextEditor(false)}
          >
            <SafeAreaView className="flex-1 bg-background">
              <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
                <TouchableOpacity onPress={() => setShowTextEditor(false)}>
                  <Text className="text-primary">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-foreground">Add Text</Text>
                <TouchableOpacity
                  onPress={addTextOverlay}
                  disabled={!textInput.trim()}
                  className={`${!textInput.trim() ? 'opacity-50' : ''}`}
                >
                  <Text className="text-primary font-semibold">Add</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-1 p-4">
                <TextInput
                  className="rounded-lg border border-border bg-background px-4 py-3 text-foreground text-lg"
                  placeholder="Enter your text..."
                  placeholderTextColor="gray"
                  value={textInput}
                  onChangeText={setTextInput}
                  multiline
                  autoFocus
                  maxLength={100}
                />
                <Text className="mt-2 text-sm text-muted-foreground">
                  {textInput.length}/100 characters
                </Text>
              </View>
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
} 
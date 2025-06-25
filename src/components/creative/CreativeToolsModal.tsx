/**
 * @file Creative Tools Modal - provides basic editing tools for photos and videos
 * Includes text overlays, drawing tools, and color filters with final composition
 */

import React, { useState, useRef, useCallback, useEffect } from "react";
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
import * as FileSystem from "expo-file-system";
import { 
  PanGestureHandler,
  GestureHandlerRootView,
  State,
  PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedGestureHandler,
  runOnJS,
  withSpring
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { captureRef } from "react-native-view-shot";
import { 
  composeEditedImage, 
  COLOR_FILTERS,
  TEXT_COLORS,
  DRAWING_COLORS,
  getFilterStyle,
  type TextOverlay as TextOverlayType,
  type DrawingPath as DrawingPathType,
  type ColorFilter,
  type CompositionOptions
} from "../../lib/image-processing";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CANVAS_HEIGHT = SCREEN_HEIGHT - 250; // Adjust for controls

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
  // All state hooks declared unconditionally at the top
  const [toolMode, setToolMode] = useState<ToolMode>('none');
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [drawingPaths, setDrawingPaths] = useState<DrawingPath[]>([]);
  const [selectedFilter, setSelectedFilter] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
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

  // All refs declared unconditionally
  const canvasRef = useRef<View>(null);
  const drawingContainerRef = useRef<View>(null);
  
  // Track initial positions for text dragging - simplified approach
  const [dragStartPositions, setDragStartPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Reset image loaded state when modal visibility changes
  useEffect(() => {
    if (visible) {
      setImageLoaded(false);
    }
  }, [visible]);

  /**
   * Add a new text overlay at center of screen
   */
  const addTextOverlay = useCallback(() => {
    if (!textInput.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: textInput,
      x: SCREEN_WIDTH / 2 - 50,
      y: CANVAS_HEIGHT / 2 - 20,
      fontSize: textSize,
      color: selectedTextColor,
      fontWeight: 'bold'
    };
    
    setTextOverlays(prev => [...prev, newOverlay]);
    setTextInput('');
    setShowTextEditor(false);
  }, [textInput, textSize, selectedTextColor]);

  /**
   * Remove a text overlay
   */
  const removeTextOverlay = useCallback((id: string) => {
    setTextOverlays(prev => prev.filter(overlay => overlay.id !== id));
  }, []);

  /**
   * Handle text drag gesture - Simplified implementation
   */
  const handleTextDrag = useCallback((event: PanGestureHandlerGestureEvent, overlayId: string) => {
    const { state, translationX, translationY } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      // Store initial position when drag starts
      const currentOverlay = textOverlays.find(o => o.id === overlayId);
      if (currentOverlay) {
        setDragStartPositions(prev => ({
          ...prev,
          [overlayId]: { x: currentOverlay.x, y: currentOverlay.y }
        }));
      }
    } else if (state === State.ACTIVE) {
      // Update position during drag
      const startPos = dragStartPositions[overlayId];
      if (startPos) {
        const newX = Math.max(0, Math.min(SCREEN_WIDTH - 100, startPos.x + translationX));
        const newY = Math.max(0, Math.min(CANVAS_HEIGHT - 40, startPos.y + translationY));
        
        setTextOverlays(prev => prev.map(overlay => {
          if (overlay.id === overlayId) {
            return { ...overlay, x: newX, y: newY };
          }
          return overlay;
        }));
      }
    } else if (state === State.END || state === State.CANCELLED) {
      // Clean up drag state
      setDragStartPositions(prev => {
        const newPositions = { ...prev };
        delete newPositions[overlayId];
        return newPositions;
      });
    }
  }, [textOverlays, dragStartPositions]);

  /**
   * Handle drawing gesture - Fixed coordinate handling
   */
  const handleDrawingGesture = useCallback((event: PanGestureHandlerGestureEvent) => {
    const { state, x, y } = event.nativeEvent;
    
    // Ensure coordinates are within bounds
    const drawX = Math.max(0, Math.min(SCREEN_WIDTH, x));
    const drawY = Math.max(0, Math.min(CANVAS_HEIGHT, y));
    
    if (state === State.BEGAN) {
      setIsDrawing(true);
      setCurrentPath(`M${drawX},${drawY}`);
    } else if (state === State.ACTIVE && isDrawing) {
      setCurrentPath(prev => `${prev} L${drawX},${drawY}`);
    } else if (state === State.END || state === State.CANCELLED) {
      if (currentPath && isDrawing) {
        const newPath: DrawingPath = {
          id: Date.now().toString(),
          path: currentPath,
          color: selectedDrawingColor,
          strokeWidth: brushSize
        };
        setDrawingPaths(prev => [...prev, newPath]);
      }
      setCurrentPath('');
      setIsDrawing(false);
    }
  }, [currentPath, isDrawing, selectedDrawingColor, brushSize]);

  /**
   * Clear all drawings
   */
  const clearDrawings = useCallback(() => {
    setDrawingPaths([]);
    setCurrentPath('');
    setIsDrawing(false);
  }, []);

  /**
   * Apply all edits and compose final image using view capture - Fixed implementation
   */
  const applyEditsAndSave = useCallback(async () => {
    if (isProcessing) return;
    
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
      
      // Ensure image is loaded before capture
      if (!imageLoaded) {
        throw new Error('Image not loaded yet');
      }
      
      // Give a small delay to ensure the view is fully rendered
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Capture the edited view as an image
      if (canvasRef.current) {
        console.log('Starting capture process...', { 
          imageLoaded, 
          hasEdits, 
          mediaUri,
          textOverlaysCount: textOverlays.length,
          drawingPathsCount: drawingPaths.length,
          selectedFilter,
          canvasWidth: SCREEN_WIDTH,
          canvasHeight: CANVAS_HEIGHT
        });
        
        const uri = await captureRef(canvasRef.current, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
          width: SCREEN_WIDTH,
          height: CANVAS_HEIGHT,
        });
        
        console.log('Captured image URI:', uri);
        
        // Verify the file exists
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) {
          throw new Error('Captured image file does not exist');
        }
        
        console.log('File verified, size:', fileInfo.size, 'bytes');
        onSave(uri);
        
        Alert.alert(
          "Edits Applied!",
          "Your photo has been edited and is ready to send or save.",
          [{ text: "OK", onPress: onClose }]
        );
      } else {
        throw new Error('Canvas reference not available');
      }
      
    } catch (error) {
      console.error('Error applying edits:', error);
      Alert.alert(
        "Error", 
        `Failed to apply edits: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`
      );
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, textOverlays.length, drawingPaths.length, selectedFilter, mediaUri, onSave, onClose]);

  /**
   * Reset all edits
   */
  const resetEdits = useCallback(() => {
    setTextOverlays([]);
    setDrawingPaths([]);
    setSelectedFilter(0);
    setCurrentPath('');
    setIsDrawing(false);
    setToolMode('none');
    setDragStartPositions({});
    // Don't reset imageLoaded - keep the image visible
    // setImageLoaded(false);
  }, []);

  /**
   * Get current filter style for real-time preview
   */
  const getImageStyle = useCallback(() => {
    return {
      width: SCREEN_WIDTH,
      height: CANVAS_HEIGHT,
      resizeMode: 'contain' as const
    };
  }, []);

  /**
   * Get filter overlay for more realistic visual effects
   */
  const getFilterOverlay = useCallback(() => {
    if (selectedFilter === 0) return null;
    
    const filter = COLOR_FILTERS[selectedFilter];
    
    switch (filter.name) {
      case 'Warm':
        return (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundColor: '#FFA500',
              opacity: 0.25,
              pointerEvents: 'none',
            }}
          />
        );
    
      case 'Cool':
        return (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundColor: '#4A90E2',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />
        );
    
      case 'Vintage':
        return (
          <>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SCREEN_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: '#D2B48C',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SCREEN_WIDTH,
                height: CANVAS_HEIGHT,
                backgroundColor: '#8B4513',
                opacity: 0.15,
                pointerEvents: 'none',
              }}
            />
          </>
        );
    
      case 'Dramatic':
        return (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundColor: '#1A1A1A',
              opacity: 0.3,
              pointerEvents: 'none',
            }}
          />
        );
    
      case 'B&W':
        return (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundColor: '#000000',
              opacity: 0.6,
              pointerEvents: 'none',
            }}
          />
        );
    
      case 'Sepia':
        return (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundColor: '#D2B48C',
              opacity: 0.5,
              pointerEvents: 'none',
            }}
          />
        );
    
      case 'High Contrast':
        return (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              backgroundColor: '#FFFFFF',
              opacity: 0.2,
              pointerEvents: 'none',
            }}
          />
        );
    
      default:
        return null;
    }
  }, [selectedFilter]);

  // Don't render if not visible
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
              disabled={isProcessing || !imageLoaded}
              className={`${(isProcessing || !imageLoaded) ? 'opacity-50' : ''}`}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons name="checkmark" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>

          {/* Main editing area - This will be captured */}
          <View 
            ref={canvasRef} 
            style={{ 
              backgroundColor: '#000000',
              width: SCREEN_WIDTH,
              height: CANVAS_HEIGHT,
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* Base image */}
            <Image
              source={{ uri: mediaUri }}
              style={{
                width: SCREEN_WIDTH,
                height: CANVAS_HEIGHT,
                resizeMode: 'contain',
                position: 'absolute',
                top: 0,
                left: 0
              }}
              onLoad={() => {
                console.log('Image loaded successfully');
                setImageLoaded(true);
              }}
              onError={(error) => {
                console.error('Image load error:', error);
                setImageLoaded(false);
              }}
            />
            
            {/* Loading indicator */}
            {!imageLoaded && (
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SCREEN_WIDTH,
                height: CANVAS_HEIGHT,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.5)'
              }}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ color: 'white', marginTop: 10 }}>Loading image...</Text>
              </View>
            )}
            
            {/* Filter overlay for visual effects */}
            {getFilterOverlay()}
            
            {/* Text overlays - Draggable and interactive */}
            {textOverlays.map((overlay) => (
              <PanGestureHandler
                key={overlay.id}
                onGestureEvent={(event) => handleTextDrag(event, overlay.id)}
                enabled={toolMode === 'text'}
              >
                <Animated.View
                  style={{
                    position: 'absolute',
                    left: overlay.x,
                    top: overlay.y,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => toolMode === 'text' && removeTextOverlay(overlay.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={{
                        fontSize: overlay.fontSize,
                        color: overlay.color,
                        fontWeight: overlay.fontWeight,
                        textShadowColor: 'rgba(0, 0, 0, 0.75)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                        backgroundColor: toolMode === 'text' ? 'rgba(0, 100, 255, 0.2)' : 'transparent',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        borderWidth: toolMode === 'text' ? 1 : 0,
                        borderColor: toolMode === 'text' ? '#0064FF' : 'transparent',
                      }}
                    >
                      {overlay.text}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </PanGestureHandler>
            ))}
            
            {/* Drawing SVG overlay */}
            <Svg
              width={SCREEN_WIDTH}
              height={CANVAS_HEIGHT}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
              }}
              pointerEvents="none"
            >
              {/* Render completed paths */}
              {drawingPaths.map((pathData) => (
                <Path
                  key={pathData.id}
                  d={pathData.path}
                  stroke={pathData.color}
                  strokeWidth={pathData.strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
              {/* Render current drawing path */}
              {currentPath && isDrawing && (
                <Path
                  d={currentPath}
                  stroke={selectedDrawingColor}
                  strokeWidth={brushSize}
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </Svg>
            
            {/* Drawing gesture handler */}
            {toolMode === 'draw' && (
              <PanGestureHandler 
                onGestureEvent={handleDrawingGesture}
                shouldCancelWhenOutside={false}
                minDist={0}
              >
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: SCREEN_WIDTH,
                    height: CANVAS_HEIGHT,
                    backgroundColor: 'transparent',
                  }}
                />
              </PanGestureHandler>
            )}
          </View>

          {/* Tool selection */}
          <View className="bg-black/90 p-4">
            <View className="flex-row items-center justify-between">
              {/* Main tools */}
              <View className="flex-row space-x-4">
                {/* Text tool */}
                <TouchableOpacity
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    toolMode === 'text' ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                  onPress={() => {
                    const newMode = toolMode === 'text' ? 'none' : 'text';
                    setToolMode(newMode);
                    if (newMode === 'text') setShowTextEditor(true);
                  }}
                >
                  <Ionicons name="text" size={20} color="white" />
                </TouchableOpacity>

                {/* Drawing tool */}
                <TouchableOpacity
                  className={`h-12 w-12 items-center justify-center rounded-full ${
                    toolMode === 'draw' ? 'bg-green-500' : 'bg-gray-700'
                  }`}
                  onPress={() => {
                    const newMode = toolMode === 'draw' ? 'none' : 'draw';
                    setToolMode(newMode);
                  }}
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
              </View>

              {/* Clear/Reset - Always visible */}
              <TouchableOpacity
                className="h-12 w-12 items-center justify-center rounded-full bg-red-500"
                onPress={resetEdits}
              >
                <Ionicons name="refresh" size={20} color="white" />
              </TouchableOpacity>
            </View>

            {/* Tool-specific controls */}
            {toolMode === 'text' && (
              <View className="mt-4 space-y-3">
                <Text className="text-white text-sm">
                  💡 Drag text to move • Tap to delete
                </Text>
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
                <Text className="text-white text-sm">
                  🎨 Draw on the image above
                </Text>
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
                <Text className="text-white text-sm mb-3">
                  🎭 Current: {COLOR_FILTERS[selectedFilter].name} {selectedFilter > 0 && '(Applied)'}
                </Text>
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
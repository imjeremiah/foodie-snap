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
  GestureEvent,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
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

  // Refs for view capture
  const canvasRef = useRef<View>(null);

  /**
   * Add a new text overlay at center of screen
   */
  const addTextOverlay = () => {
    if (!textInput.trim()) return;
    
    const newOverlay: TextOverlay = {
      id: Date.now().toString(),
      text: textInput,
      x: SCREEN_WIDTH / 2 - 100,
      y: CANVAS_HEIGHT / 2 - 50,
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
   * Handle text drag gesture
   */
  const handleTextDrag = (event: GestureEvent<PanGestureHandlerEventPayload>, overlayId: string) => {
    const { state, translationX, translationY } = event.nativeEvent;
    
    if (state === State.ACTIVE) {
      setTextOverlays(prev => prev.map(overlay => {
        if (overlay.id === overlayId) {
          return {
            ...overlay,
            x: Math.max(0, Math.min(SCREEN_WIDTH - 200, overlay.x + translationX)),
            y: Math.max(0, Math.min(CANVAS_HEIGHT - 50, overlay.y + translationY))
          };
        }
        return overlay;
      }));
    }
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
      if (currentPath && isDrawing) {
        const newPath: DrawingPath = {
          id: Date.now().toString(),
          path: currentPath,
          color: selectedDrawingColor,
          strokeWidth: brushSize
        };
        setDrawingPaths(prev => [...prev, newPath]);
        setCurrentPath('');
      }
      setIsDrawing(false);
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
   * Apply all edits and compose final image using view capture
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
      
      // Capture the edited view as an image
      if (canvasRef.current) {
        const uri = await captureRef(canvasRef.current, {
          format: 'jpg',
          quality: 0.9,
          result: 'tmpfile',
        });
        
        onSave(uri);
        
        Alert.alert(
          "Edits Applied!",
          "Your photo has been edited and is ready to send or save.",
          [{ text: "OK", onPress: onClose }]
        );
      } else {
        throw new Error('Unable to capture edited image');
      }
      
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

  /**
   * Get current filter style for real-time preview
   */
  const getImageStyle = () => {
    const baseStyle = {
      width: SCREEN_WIDTH,
      height: CANVAS_HEIGHT,
      resizeMode: 'contain' as const
    };

    return baseStyle;
  };

  /**
   * Get filter overlay for visual effects that actually work
   */
  const getFilterOverlay = () => {
    if (selectedFilter === 0) return null;
    
    const filter = COLOR_FILTERS[selectedFilter];
    let overlayColor = 'transparent';
    let overlayOpacity = 0;
    let blendMode: any = 'normal';
    
    switch (filter.name) {
      case 'Warm':
        overlayColor = '#FFA500';
        overlayOpacity = 0.2;
        blendMode = 'multiply';
        break;
      case 'Cool':
        overlayColor = '#87CEEB';
        overlayOpacity = 0.2;
        blendMode = 'multiply';
        break;
      case 'Vintage':
        overlayColor = '#DEB887';
        overlayOpacity = 0.3;
        blendMode = 'overlay';
        break;
      case 'Dramatic':
        overlayColor = '#000000';
        overlayOpacity = 0.15;
        blendMode = 'multiply';
        break;
      case 'B&W':
        // For B&W, we'll use a more drastic overlay
        overlayColor = '#808080';
        overlayOpacity = 0.8;
        blendMode = 'saturation';
        break;
      case 'Sepia':
        overlayColor = '#DEB887';
        overlayOpacity = 0.4;
        blendMode = 'multiply';
        break;
      case 'High Contrast':
        overlayColor = '#FFFFFF';
        overlayOpacity = 0.1;
        blendMode = 'overlay';
        break;
    }
    
    if (overlayOpacity > 0) {
      return (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: SCREEN_WIDTH,
            height: CANVAS_HEIGHT,
            backgroundColor: overlayColor,
            opacity: overlayOpacity,
            pointerEvents: 'none',
          }}
        />
      );
    }
    
    return null;
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

          {/* Main editing area - This will be captured */}
          <View 
            ref={canvasRef} 
            className="flex-1 relative"
            style={{ backgroundColor: '#000000' }}
          >
            {/* Base image */}
            <Image
              source={{ uri: mediaUri }}
              style={getImageStyle()}
            />
            
            {/* Filter overlay for visual effects */}
            {getFilterOverlay()}
            
            {/* Text overlays - Now draggable! */}
            {textOverlays.map((overlay) => (
              <PanGestureHandler
                key={overlay.id}
                onGestureEvent={(event) => handleTextDrag(event, overlay.id)}
                enabled={toolMode === 'text'}
              >
                <View
                  style={{
                    position: 'absolute',
                    left: overlay.x,
                    top: overlay.y,
                  }}
                >
                  <TouchableOpacity onPress={() => removeTextOverlay(overlay.id)}>
                    <Text
                      style={{
                        fontSize: overlay.fontSize,
                        color: overlay.color,
                        fontWeight: overlay.fontWeight,
                        textShadowColor: 'rgba(0, 0, 0, 0.75)',
                        textShadowOffset: { width: 1, height: 1 },
                        textShadowRadius: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                      }}
                    >
                      {overlay.text}
                    </Text>
                  </TouchableOpacity>
                </View>
              </PanGestureHandler>
            ))}
            
            {/* Drawing overlay - Fixed SVG implementation */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: SCREEN_WIDTH,
                height: CANVAS_HEIGHT,
              }}
              pointerEvents={toolMode === 'draw' ? 'auto' : 'none'}
            >
              <Svg
                width={SCREEN_WIDTH}
                height={CANVAS_HEIGHT}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                }}
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
              
              {/* Drawing gesture handler - Fixed */}
              {toolMode === 'draw' && (
                <PanGestureHandler 
                  onGestureEvent={handleDrawingGesture}
                  shouldCancelWhenOutside={false}
                >
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: SCREEN_WIDTH,
                      height: CANVAS_HEIGHT,
                    }}
                  />
                </PanGestureHandler>
              )}
            </View>
          </View>

          {/* Tool selection */}
          <View className="bg-black/90 p-4">
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
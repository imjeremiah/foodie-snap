/**
 * @file Enhanced Onboarding screen - nutrition-focused user preference capture for RAG personalization.
 * This implements Phase 3, Step 1: Enhanced User Preferences & Onboarding.
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { 
  useCompleteOnboardingMutation
} from "../../store/slices/api-slice";
import {
  FITNESS_GOALS,
  DIETARY_RESTRICTIONS,
  COMMON_ALLERGIES,
  CONTENT_STYLES,
  COOKING_SKILL_LEVELS,
  ACTIVITY_LEVELS,
  type OnboardingFormData,
} from "../../types/database";

interface OnboardingStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack?: () => void;
  nextButtonText?: string;
  isLastStep?: boolean;
  canProceed?: boolean;
  loading?: boolean;
}

/**
 * Individual onboarding step wrapper component
 */
function OnboardingStep({
  title,
  description,
  children,
  onNext,
  onBack,
  nextButtonText = "Continue",
  isLastStep = false,
  canProceed = true,
  loading = false,
}: OnboardingStepProps) {
  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">{title}</Text>
          <Text className="text-lg text-muted-foreground leading-6">{description}</Text>
        </View>

        {/* Content */}
        <View className="flex-1">
          {children}
        </View>

        {/* Navigation */}
        <View className="flex-row items-center justify-between pt-6">
          {onBack ? (
            <TouchableOpacity
              className="flex-row items-center space-x-2 px-4 py-3 rounded-lg"
              onPress={onBack}
            >
              <Ionicons name="chevron-back" size={20} color="#6B7280" />
              <Text className="text-muted-foreground font-medium">Back</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          <TouchableOpacity
            className={`px-6 py-4 rounded-lg flex-row items-center space-x-2 ${
              canProceed && !loading
                ? "bg-primary"
                : "bg-muted"
            }`}
            onPress={onNext}
            disabled={!canProceed || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Text className={`font-semibold ${
                  canProceed ? "text-primary-foreground" : "text-muted-foreground"
                }`}>
                  {nextButtonText}
                </Text>
                {!isLastStep && (
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={canProceed ? "white" : "#6B7280"} 
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

/**
 * Multi-select option component
 */
interface OptionItemProps {
  option: { value: string; label: string; emoji: string; description?: string };
  selected: boolean;
  onToggle: () => void;
  multiSelect?: boolean;
}

function OptionItem({ option, selected, onToggle, multiSelect = false }: OptionItemProps) {
  return (
    <TouchableOpacity
      className={`p-5 rounded-lg border-2 mb-4 shadow-sm ${
        selected 
          ? "border-primary bg-primary/10" 
          : "border-border bg-card"
      }`}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center space-x-3">
        <Text className="text-2xl">{option.emoji}</Text>
        <View className="flex-1">
          <Text className={`font-semibold ${
            selected ? "text-primary" : "text-foreground"
          }`}>
            {option.label}
          </Text>
          {option.description && (
            <Text className="text-sm text-muted-foreground mt-1">
              {option.description}
            </Text>
          )}
        </View>
        {multiSelect && (
          <View className={`w-6 h-6 rounded-full border-2 ${
            selected 
              ? "border-primary bg-primary" 
              : "border-muted-foreground"
          } items-center justify-center`}>
            {selected && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Current step tracking
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState<OnboardingFormData>({
    display_name: "",
    bio: "",
    primary_fitness_goal: "",
    secondary_fitness_goals: [],
    dietary_restrictions: [],
    allergies: [],
    preferred_content_style: "",
    cooking_skill_level: "",
    activity_level: "",
    daily_calorie_goal: undefined,
    protein_goal_grams: undefined,
  });

  // API mutations
  const [completeOnboarding, { isLoading: completingOnboarding }] = useCompleteOnboardingMutation();

  /**
   * Handle form field updates
   */
  const updateFormData = (updates: Partial<OnboardingFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  /**
   * Handle multi-select toggles
   */
  const toggleArrayValue = (field: keyof OnboardingFormData, value: string) => {
    const currentArray = (formData[field] as string[]) || [];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    updateFormData({ [field]: newArray });
  };

  /**
   * Navigate to next step
   */
  const nextStep = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  /**
   * Navigate to previous step
   */
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  /**
   * Complete onboarding and save preferences
   */
  const handleCompleteOnboarding = async () => {
    try {
      console.log("Submitting onboarding data:", formData);
      await completeOnboarding({ preferences: formData }).unwrap();
      
      Alert.alert(
        "Welcome to FoodieSnap! 🎉",
        "Your preferences have been saved. You're all set to start creating amazing content with AI assistance!",
        [
          {
            text: "Let's Go!",
            onPress: () => router.replace("/(tabs)/camera"),
          },
        ]
      );
    } catch (error) {
      console.error("Onboarding completion failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      // Show more detailed error message
      const errorMessage = error && typeof error === 'object' && 'error' in error 
        ? String(error.error)
        : "Unknown error occurred";
        
      Alert.alert(
        "Setup Error",
        `Failed to save your preferences:\n\n${errorMessage}\n\nPlease try again.`,
        [{ text: "OK" }]
      );
    }
  };

  /**
   * Calculate progress percentage based on completed steps
   */
  const getProgressPercentage = () => {
    const totalSteps = onboardingSteps.length;
    const completedSteps = currentStep; // Steps that are fully completed (behind current step)
    const currentStepProgress = onboardingSteps[currentStep]?.canProceed ? 1 : 0; // Current step completion
    
    return Math.round(((completedSteps + currentStepProgress) / totalSteps) * 100);
  };

  /**
   * Onboarding steps configuration
   */
  const onboardingSteps = [
    // Step 1: Welcome & Basic Info
    {
      title: "Welcome to FoodieSnap! 👋",
      description: "Let's personalize your experience with AI-powered content suggestions",
      content: (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-6">
            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                What should we call you?
              </Text>
              <TextInput
                className="border border-border rounded-lg px-4 py-3 bg-card text-foreground text-lg"
                placeholder="Your display name"
                placeholderTextColor="#9CA3AF"
                value={formData.display_name}
                onChangeText={(text) => updateFormData({ display_name: text })}
                autoCapitalize="words"
              />
            </View>

            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                Tell us about yourself (optional)
              </Text>
              <TextInput
                className="border border-border rounded-lg px-4 py-3 bg-card text-foreground text-lg h-24"
                placeholder="Share a bit about your fitness journey..."
                placeholderTextColor="#9CA3AF"
                value={formData.bio}
                onChangeText={(text) => updateFormData({ bio: text })}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View className="bg-blue-50 p-4 rounded-lg">
              <Text className="text-blue-800 font-medium mb-2">
                🤖 AI-Powered Personalization
              </Text>
              <Text className="text-blue-700 text-sm leading-5">
                FoodieSnap will use your preferences to generate personalized captions, 
                nutrition insights, and content suggestions that match your goals and style.
              </Text>
            </View>
          </View>
        </ScrollView>
      ),
      canProceed: formData.display_name.trim().length > 0,
    },

    // Step 2: Primary Fitness Goal
    {
      title: "What's Your Main Goal? 🎯",
      description: "Choose your primary fitness objective to get tailored content suggestions",
      content: (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {FITNESS_GOALS.map((goal) => (
              <OptionItem
                key={goal.value}
                option={goal}
                selected={formData.primary_fitness_goal === goal.value}
                onToggle={() => updateFormData({ primary_fitness_goal: goal.value })}
              />
            ))}
          </View>
        </ScrollView>
      ),
      canProceed: !!formData.primary_fitness_goal,
    },

    // Step 3: Dietary Restrictions
    {
      title: "Dietary Preferences 🥗",
      description: "Help us understand your dietary needs and restrictions",
      content: (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {DIETARY_RESTRICTIONS.map((restriction) => (
              <OptionItem
                key={restriction.value}
                option={restriction}
                selected={formData.dietary_restrictions?.includes(restriction.value) || false}
                onToggle={() => toggleArrayValue('dietary_restrictions', restriction.value)}
                multiSelect
              />
            ))}
          </View>
        </ScrollView>
      ),
      canProceed: true, // Optional step
    },

    // Step 4: Allergies
    {
      title: "Food Allergies 🚨",
      description: "Let us know about any food allergies for safe nutrition advice",
      content: (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {COMMON_ALLERGIES.map((allergy) => (
              <OptionItem
                key={allergy.value}
                option={allergy}
                selected={formData.allergies?.includes(allergy.value) || false}
                onToggle={() => toggleArrayValue('allergies', allergy.value)}
                multiSelect
              />
            ))}
          </View>
        </ScrollView>
      ),
      canProceed: true, // Optional step
    },

    // Step 5: Content Style
    {
      title: "Content Style 📝",
      description: "How would you like your AI-generated captions and suggestions to sound?",
      content: (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-4">
            {CONTENT_STYLES.map((style) => (
              <OptionItem
                key={style.value}
                option={style}
                selected={formData.preferred_content_style === style.value}
                onToggle={() => updateFormData({ preferred_content_style: style.value })}
              />
            ))}
          </View>
        </ScrollView>
      ),
      canProceed: !!formData.preferred_content_style,
    },

    // Step 6: Activity Level & Cooking Skills
    {
      title: "Almost Done! 🏃‍♀️👨‍🍳",
      description: "Just a few more details to perfect your AI recommendations",
      content: (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="space-y-6">
            <View>
              <Text className="text-lg font-semibold text-foreground mb-4">
                Activity Level
              </Text>
              <View className="space-y-4">
                {ACTIVITY_LEVELS.map((level) => (
                  <OptionItem
                    key={level.value}
                    option={level}
                    selected={formData.activity_level === level.value}
                    onToggle={() => updateFormData({ activity_level: level.value })}
                  />
                ))}
              </View>
            </View>

            <View>
              <Text className="text-lg font-semibold text-foreground mb-4">
                Cooking Skill Level
              </Text>
              <View className="space-y-4">
                {COOKING_SKILL_LEVELS.map((skill) => (
                  <OptionItem
                    key={skill.value}
                    option={skill}
                    selected={formData.cooking_skill_level === skill.value}
                    onToggle={() => updateFormData({ cooking_skill_level: skill.value })}
                  />
                ))}
              </View>
            </View>

            <View className="bg-green-50 p-4 rounded-lg">
              <Text className="text-green-800 font-medium mb-2">
                🎉 You're All Set!
              </Text>
              <Text className="text-green-700 text-sm leading-5">
                Based on your preferences, FoodieSnap will generate personalized content suggestions, 
                nutrition insights, and caption ideas that match your unique goals and style.
              </Text>
            </View>
          </View>
        </ScrollView>
      ),
      canProceed: !!formData.activity_level && !!formData.cooking_skill_level,
    },
  ];

  const currentStepData = onboardingSteps[currentStep];

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Progress bar */}
      <View className="px-6 py-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {onboardingSteps.length}
          </Text>
          <Text className="text-sm text-muted-foreground">
            {getProgressPercentage()}%
          </Text>
        </View>
        <View className="h-2 bg-muted rounded-full">
          <View
            className="h-full bg-primary rounded-full"
            style={{ 
              width: `${getProgressPercentage()}%`
            }}
          />
        </View>
        {/* Progress description */}
        <View className="mt-2">
          <Text className="text-xs text-muted-foreground text-center">
            {currentStep === onboardingSteps.length - 1 && onboardingSteps[currentStep]?.canProceed
              ? "Ready to complete setup!"
              : currentStep === onboardingSteps.length - 1
              ? "Complete this step to finish setup"
              : onboardingSteps[currentStep]?.canProceed
              ? "Step completed - continue to next"
              : "Complete this step to continue"
            }
          </Text>
        </View>
      </View>

      {/* Step content */}
      <ScrollView 
        ref={scrollViewRef}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        <OnboardingStep
          title={currentStepData.title}
          description={currentStepData.description}
          onNext={currentStep === onboardingSteps.length - 1 ? handleCompleteOnboarding : nextStep}
          onBack={currentStep > 0 ? prevStep : undefined}
          nextButtonText={currentStep === onboardingSteps.length - 1 ? "Complete Setup" : "Continue"}
          isLastStep={currentStep === onboardingSteps.length - 1}
          canProceed={currentStepData.canProceed}
          loading={completingOnboarding}
        >
          {currentStepData.content}
        </OnboardingStep>
      </ScrollView>
    </SafeAreaView>
  );
} 
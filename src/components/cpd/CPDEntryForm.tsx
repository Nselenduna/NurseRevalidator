import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { CPDEntry, CPDType, NMCCategory } from '../../types/cpd.types';
import { COLORS } from '../../utils/constants/colors';
import TextField from '../forms/TextField';
import DropdownField from '../forms/DropdownField';
import PrimaryButton from '../forms/PrimaryButton';
import BackButton from '../forms/BackButton';
import MultiSelectChips from '../forms/MultiSelectChips';
import useReducedMotion from '../../hooks/useReducedMotion';

interface CPDEntryFormProps {
  entry?: CPDEntry | null;
  onSave: (entry: Partial<CPDEntry>) => Promise<void>;
  onCancel: () => void;
  isVisible: boolean;
}

interface FormData {
  title: string;
  type: CPDType | '';
  duration: string;
  date: Date;
  description: string;
  learningOutcomes: string[];
  nmcCategories: string[];
  venue?: string;
  provider?: string;
  certificateNumber?: string;
}

interface FormErrors {
  title?: string;
  type?: string;
  duration?: string;
  description?: string;
  learningOutcomes?: string;
}

const CPD_TYPES = [
  { label: 'Training Course', value: 'course' },
  { label: 'Conference/Seminar', value: 'conference' },
  { label: 'Reflection/Study', value: 'reflection' },
  { label: 'Mentoring/Supervision', value: 'mentoring' },
  { label: 'Other Activity', value: 'other' },
];

const NMC_CATEGORIES = [
  'Patient Care & Safety',
  'Evidence-Based Practice',
  'Communication & Teamwork',
  'Leadership & Management',
  'Continuing Education',
  'Professional Standards',
  'Technology & Innovation',
  'Quality Improvement',
];

const LEARNING_OUTCOMES_SUGGESTIONS = [
  'Enhanced patient care skills',
  'Improved clinical knowledge',
  'Better understanding of evidence-based practice',
  'Developed leadership capabilities',
  'Strengthened communication skills',
  'Increased awareness of safety protocols',
  'Updated knowledge of current guidelines',
  'Improved problem-solving abilities',
  'Enhanced reflective practice skills',
  'Better understanding of ethical considerations',
];

const CPDEntryForm: React.FC<CPDEntryFormProps> = ({
  entry,
  onSave,
  onCancel,
  isVisible,
}) => {
  const navigation = useNavigation();
  const isReducedMotion = useReducedMotion();
  
  // Refs
  const titleRef = useRef<TextInput>(null);
  const durationRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const venueRef = useRef<TextInput>(null);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    title: '',
    type: '',
    duration: '',
    date: new Date(),
    description: '',
    learningOutcomes: [],
    nmcCategories: [],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOutcomeSuggestions, setShowOutcomeSuggestions] = useState(false);
  const [customOutcome, setCustomOutcome] = useState('');

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  // Initialize form data when entry changes
  useEffect(() => {
    if (entry) {
      setFormData({
        title: entry.title,
        type: entry.type,
        duration: entry.duration.toString(),
        date: entry.date,
        description: entry.description || '',
        learningOutcomes: entry.learningOutcomes || [],
        nmcCategories: entry.nmcCategories?.map(cat => cat.name) || [],
        venue: entry.venue,
        provider: entry.provider,
        certificateNumber: entry.certificateNumber,
      });
    } else {
      // Reset form for new entry
      setFormData({
        title: '',
        type: '',
        duration: '',
        date: new Date(),
        description: '',
        learningOutcomes: [],
        nmcCategories: [],
      });
    }
    setErrors({});
    setTouched(new Set());
  }, [entry]);

  // Animate form appearance
  useEffect(() => {
    if (isVisible && !isReducedMotion) {
      fadeAnim.value = withTiming(1, { duration: 300 });
      slideAnim.value = withSpring(0);
    } else if (isVisible) {
      fadeAnim.value = 1;
      slideAnim.value = 0;
    }
  }, [isVisible, isReducedMotion]);

  // Validation
  const validateField = (field: keyof FormData, value: any): string | undefined => {
    switch (field) {
      case 'title':
        return !value || value.trim().length < 3 ? 'Title must be at least 3 characters' : undefined;
      case 'type':
        return !value ? 'Please select an activity type' : undefined;
      case 'duration':
        const hours = parseFloat(value);
        if (!value || isNaN(hours) || hours <= 0) {
          return 'Duration must be a positive number';
        }
        if (hours > 100) {
          return 'Duration seems too high. Please check.';
        }
        return undefined;
      case 'description':
        return !value || value.trim().length < 10 ? 'Description must be at least 10 characters' : undefined;
      case 'learningOutcomes':
        return !value || value.length === 0 ? 'At least one learning outcome is required' : undefined;
      default:
        return undefined;
    }
  };

  // Handle field changes
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (touched.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => new Set(prev).add(field));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle learning outcome selection
  const handleOutcomeToggle = (outcome: string) => {
    const isSelected = formData.learningOutcomes.includes(outcome);
    const newOutcomes = isSelected
      ? formData.learningOutcomes.filter(o => o !== outcome)
      : [...formData.learningOutcomes, outcome];
    
    handleFieldChange('learningOutcomes', newOutcomes);
  };

  // Add custom learning outcome
  const handleAddCustomOutcome = () => {
    if (customOutcome.trim() && !formData.learningOutcomes.includes(customOutcome.trim())) {
      handleFieldChange('learningOutcomes', [...formData.learningOutcomes, customOutcome.trim()]);
      setCustomOutcome('');
    }
  };

  // Handle NMC category toggle
  const handleNMCCategoryToggle = (category: string) => {
    const isSelected = formData.nmcCategories.includes(category);
    const newCategories = isSelected
      ? formData.nmcCategories.filter(c => c !== category)
      : [...formData.nmcCategories, category];
    
    handleFieldChange('nmcCategories', newCategories);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    let isValid = true;

    // Validate required fields
    (Object.keys(formData) as Array<keyof FormData>).forEach(field => {
      if (['title', 'type', 'duration', 'description', 'learningOutcomes'].includes(field)) {
        const error = validateField(field, formData[field]);
        if (error) {
          newErrors[field as keyof FormErrors] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    setTouched(new Set(Object.keys(formData) as Array<keyof FormData>));
    return isValid;
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm()) {
      if (!isReducedMotion) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const entryData: Partial<CPDEntry> = {
        ...entry, // Keep existing data if editing
        title: formData.title.trim(),
        type: formData.type as CPDType,
        duration: parseFloat(formData.duration),
        date: formData.date,
        description: formData.description.trim(),
        learningOutcomes: formData.learningOutcomes,
        nmcCategories: formData.nmcCategories.map(name => ({ name, points: 1 })),
        venue: formData.venue?.trim(),
        provider: formData.provider?.trim(),
        certificateNumber: formData.certificateNumber?.trim(),
        updatedAt: new Date(),
      };

      await onSave(entryData);

      if (!isReducedMotion) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

    } catch (error) {
      console.error('Failed to save CPD entry:', error);
      Alert.alert('Error', 'Failed to save CPD entry. Please try again.');
      
      if (!isReducedMotion) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animation styles
  const formAnimatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={onCancel} />
            <Text style={styles.title}>
              {entry ? 'Edit CPD Entry' : 'New CPD Entry'}
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <ScrollView
              style={styles.scrollContainer}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
                {/* Basic Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Basic Information</Text>
                  
                  <TextField
                    ref={titleRef}
                    label="Activity Title *"
                    value={formData.title}
                    onChangeText={(value) => handleFieldChange('title', value)}
                    onBlur={() => handleFieldBlur('title')}
                    error={errors.title}
                    placeholder="Enter activity title"
                    returnKeyType="next"
                    onSubmitEditing={() => durationRef.current?.focus()}
                    accessibilityLabel="Activity title"
                    accessibilityHint="Enter the title of your CPD activity"
                  />

                  <DropdownField
                    label="Activity Type *"
                    value={formData.type}
                    options={CPD_TYPES}
                    onChange={(value) => handleFieldChange('type', value)}
                    onBlur={() => handleFieldBlur('type')}
                    error={errors.type}
                    placeholder="Select activity type"
                    accessibilityLabel="Activity type"
                    accessibilityHint="Select the type of CPD activity"
                  />

                  <TextField
                    ref={durationRef}
                    label="Duration (hours) *"
                    value={formData.duration}
                    onChangeText={(value) => handleFieldChange('duration', value)}
                    onBlur={() => handleFieldBlur('duration')}
                    error={errors.duration}
                    placeholder="e.g., 2.5"
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => descriptionRef.current?.focus()}
                    accessibilityLabel="Duration in hours"
                    accessibilityHint="Enter the duration of the activity in hours"
                  />
                </View>

                {/* Description */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description *</Text>
                  <TextField
                    ref={descriptionRef}
                    label="Activity Description"
                    value={formData.description}
                    onChangeText={(value) => handleFieldChange('description', value)}
                    onBlur={() => handleFieldBlur('description')}
                    error={errors.description}
                    placeholder="Describe what you learned or did during this activity"
                    multiline
                    numberOfLines={4}
                    style={styles.textArea}
                    accessibilityLabel="Activity description"
                    accessibilityHint="Provide a detailed description of your CPD activity"
                  />
                </View>

                {/* Learning Outcomes */}
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Learning Outcomes *</Text>
                    <TouchableOpacity
                      style={styles.suggestionsButton}
                      onPress={() => setShowOutcomeSuggestions(!showOutcomeSuggestions)}
                    >
                      <Ionicons name="bulb-outline" size={16} color={COLORS.white} />
                      <Text style={styles.suggestionsButtonText}>Suggestions</Text>
                    </TouchableOpacity>
                  </View>

                  {showOutcomeSuggestions && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsTitle}>Tap to add:</Text>
                      <View style={styles.suggestionsChips}>
                        {LEARNING_OUTCOMES_SUGGESTIONS.map((suggestion) => (
                          <TouchableOpacity
                            key={suggestion}
                            style={[
                              styles.suggestionChip,
                              formData.learningOutcomes.includes(suggestion) && styles.suggestionChipSelected
                            ]}
                            onPress={() => handleOutcomeToggle(suggestion)}
                          >
                            <Text style={[
                              styles.suggestionChipText,
                              formData.learningOutcomes.includes(suggestion) && styles.suggestionChipTextSelected
                            ]}>
                              {suggestion}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Selected Learning Outcomes */}
                  {formData.learningOutcomes.length > 0 && (
                    <View style={styles.selectedOutcomes}>
                      <Text style={styles.selectedTitle}>Selected Learning Outcomes:</Text>
                      {formData.learningOutcomes.map((outcome, index) => (
                        <View key={outcome} style={styles.selectedOutcome}>
                          <Text style={styles.selectedOutcomeText}>• {outcome}</Text>
                          <TouchableOpacity
                            style={styles.removeOutcome}
                            onPress={() => handleOutcomeToggle(outcome)}
                          >
                            <Ionicons name="close" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Custom Learning Outcome */}
                  <View style={styles.customOutcomeContainer}>
                    <TextField
                      label="Add Custom Learning Outcome"
                      value={customOutcome}
                      onChangeText={setCustomOutcome}
                      placeholder="Enter custom learning outcome"
                      rightIcon={
                        <TouchableOpacity
                          style={styles.addOutcomeButton}
                          onPress={handleAddCustomOutcome}
                          disabled={!customOutcome.trim()}
                        >
                          <Ionicons name="add" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                      }
                    />
                  </View>

                  {errors.learningOutcomes && (
                    <Text style={styles.errorText}>{errors.learningOutcomes}</Text>
                  )}
                </View>

                {/* NMC Categories */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>NMC Categories (Optional)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select relevant professional standard categories
                  </Text>
                  <View style={styles.nmcCategories}>
                    {NMC_CATEGORIES.map((category) => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.nmcCategoryChip,
                          formData.nmcCategories.includes(category) && styles.nmcCategoryChipSelected
                        ]}
                        onPress={() => handleNMCCategoryToggle(category)}
                      >
                        <Text style={[
                          styles.nmcCategoryText,
                          formData.nmcCategories.includes(category) && styles.nmcCategoryTextSelected
                        ]}>
                          {category}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Additional Information */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Information (Optional)</Text>
                  
                  <TextField
                    ref={venueRef}
                    label="Venue/Location"
                    value={formData.venue || ''}
                    onChangeText={(value) => handleFieldChange('venue', value)}
                    placeholder="Where did this activity take place?"
                    accessibilityLabel="Venue or location"
                  />

                  <TextField
                    label="Training Provider"
                    value={formData.provider || ''}
                    onChangeText={(value) => handleFieldChange('provider', value)}
                    placeholder="Who provided this training?"
                    accessibilityLabel="Training provider"
                  />

                  <TextField
                    label="Certificate Number"
                    value={formData.certificateNumber || ''}
                    onChangeText={(value) => handleFieldChange('certificateNumber', value)}
                    placeholder="Certificate or reference number"
                    accessibilityLabel="Certificate number"
                  />
                </View>
              </Animated.View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <View style={styles.saveButtonContainer}>
                <PrimaryButton
                  label={isSubmitting ? "Saving..." : "Save Entry"}
                  onPress={handleSave}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  shimmer={!isSubmitting}
                />
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for action buttons
  },
  formContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  suggestionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  suggestionsButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  suggestionsTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  suggestionsChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  suggestionChipSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  suggestionChipText: {
    color: COLORS.white,
    fontSize: 12,
  },
  suggestionChipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  selectedOutcomes: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectedTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  selectedOutcome: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  selectedOutcomeText: {
    color: COLORS.white,
    fontSize: 14,
    flex: 1,
  },
  removeOutcome: {
    padding: 4,
  },
  customOutcomeContainer: {
    marginTop: 12,
  },
  addOutcomeButton: {
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nmcCategories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  nmcCategoryChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  nmcCategoryChipSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  nmcCategoryText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '500',
  },
  nmcCategoryTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    marginTop: 4,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 20,
    backgroundColor: 'rgba(107, 70, 193, 0.95)',
    gap: 12,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonContainer: {
    flex: 1,
  },
});

export default CPDEntryForm;
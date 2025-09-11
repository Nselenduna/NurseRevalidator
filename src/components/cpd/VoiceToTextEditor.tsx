import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { VoiceToTextEditorProps, TranscriptMetadata } from '../../types/cpd.types';
import TranscriptionService from '../../services/transcription/TranscriptionService';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';
import PrimaryButton from '../forms/PrimaryButton';
import BackButton from '../forms/BackButton';

const VoiceToTextEditor: React.FC<VoiceToTextEditorProps> = ({
  audioRecording,
  initialTranscript = '',
  onSave,
  onCancel,
}) => {
  const isReducedMotion = useReducedMotion();
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);

  // State
  const [transcript, setTranscript] = useState(initialTranscript);
  const [originalTranscript, setOriginalTranscript] = useState(initialTranscript);
  const [confidence, setConfidence] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(!initialTranscript);
  const [medicalTerms, setMedicalTerms] = useState<string[]>([]);
  const [editHistory, setEditHistory] = useState<Array<{ timestamp: Date; changes: string }>>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validation, setValidation] = useState<{
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  }>({ isValid: true, issues: [], suggestions: [] });

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);
  const confidenceAnim = useSharedValue(0);

  // Auto-transcribe if no initial transcript
  useEffect(() => {
    if (!initialTranscript && audioRecording) {
      performTranscription();
    } else {
      setIsTranscribing(false);
      if (initialTranscript) {
        validateTranscript(initialTranscript);
      }
    }
  }, [audioRecording, initialTranscript]);

  // Screen entry animation
  useEffect(() => {
    if (!isReducedMotion) {
      fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
      slideAnim.value = withDelay(300, withTiming(0, { duration: 600 }));
    } else {
      fadeAnim.value = 1;
      slideAnim.value = 0;
    }
  }, [isReducedMotion]);

  // Confidence animation
  useEffect(() => {
    if (!isReducedMotion) {
      confidenceAnim.value = withTiming(confidence / 100, { duration: 1000 });
    } else {
      confidenceAnim.value = confidence / 100;
    }
  }, [confidence, isReducedMotion]);

  const performTranscription = async () => {
    try {
      setIsTranscribing(true);
      const result = await TranscriptionService.transcribeAudio(audioRecording.uri);
      
      const correctedTranscript = TranscriptionService.correctMedicalTerms(result.transcript);
      setTranscript(correctedTranscript);
      setOriginalTranscript(correctedTranscript);
      setConfidence(result.confidence);
      setMedicalTerms(result.metadata.medicalTermsDetected || []);
      
      // Validate transcript
      validateTranscript(correctedTranscript);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Transcription failed:', error);
      Alert.alert(
        'Transcription Failed',
        'Unable to transcribe the audio. You can still enter your reflection manually.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsTranscribing(false);
    }
  };

  const validateTranscript = (text: string) => {
    const validation = TranscriptionService.validateTranscript(text);
    setValidation(validation);
  };

  const handleTextChange = (text: string) => {
    setTranscript(text);
    setHasUnsavedChanges(text !== originalTranscript);
    
    // Track changes for history
    if (text !== originalTranscript) {
      const newChange = {
        timestamp: new Date(),
        changes: `Modified transcript (${text.length - originalTranscript.length > 0 ? '+' : ''}${text.length - originalTranscript.length} chars)`,
      };
      setEditHistory(prev => [...prev.slice(-9), newChange]); // Keep last 10 changes
    }
    
    // Re-validate
    validateTranscript(text);
    
    // Update medical terms detection
    const detectedTerms = TranscriptionService.detectMedicalTerms(text);
    setMedicalTerms(detectedTerms);
  };

  const handleAutoCorrect = () => {
    const corrected = TranscriptionService.correctMedicalTerms(transcript);
    if (corrected !== transcript) {
      setTranscript(corrected);
      setHasUnsavedChanges(true);
      validateTranscript(corrected);
      
      Alert.alert(
        'Text Corrected',
        'Medical terminology has been automatically corrected.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'No Corrections',
        'No medical term corrections were needed.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleSave = () => {
    if (!transcript.trim()) {
      Alert.alert(
        'Empty Transcript',
        'Please add some content to your reflection before saving.',
        [{ text: 'OK' }]
      );
      return;
    }

    const metadata: TranscriptMetadata = {
      confidence,
      language: 'en-GB',
      medicalTermsDetected: medicalTerms,
      editHistory,
    };

    onSave(transcript, metadata);
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      Alert.alert(
        'Unsaved Changes',
        'You have unsaved changes. Are you sure you want to cancel?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard Changes', style: 'destructive', onPress: onCancel },
        ]
      );
    } else {
      onCancel();
    }
  };

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const confidenceBarStyle = useAnimatedStyle(() => ({
    width: `${confidenceAnim.value * 100}%`,
  }));

  const getConfidenceColor = () => {
    if (confidence >= 90) return COLORS.secondary;
    if (confidence >= 75) return '#F59E0B';
    return COLORS.error;
  };

  const getConfidenceText = () => {
    if (confidence >= 90) return 'High Confidence';
    if (confidence >= 75) return 'Medium Confidence';
    if (confidence >= 60) return 'Low Confidence';
    return 'Very Low Confidence';
  };

  if (isTranscribing) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.loadingGradient}>
          <Text style={styles.loadingTitle}>Transcribing Audio</Text>
          <Text style={styles.loadingSubtitle}>Converting your voice to text...</Text>
          <View style={styles.loadingIndicator}>
            <Text style={styles.loadingEmoji}>🎤</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.gradient}>
        <Animated.View style={[styles.content, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <BackButton onPress={handleCancel} />
            <Text style={styles.headerTitle}>Voice to Text</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Audio Info */}
          <View style={styles.audioInfo}>
            <Text style={styles.audioInfoText}>
              Duration: {Math.floor(audioRecording.duration / 60)}:{(audioRecording.duration % 60).toString().padStart(2, '0')}
            </Text>
            <Text style={styles.audioInfoText}>
              Size: {(audioRecording.fileSize / 1024 / 1024).toFixed(1)} MB
            </Text>
          </View>

          {/* Confidence Indicator */}
          {confidence > 0 && (
            <View style={styles.confidenceContainer}>
              <View style={styles.confidenceHeader}>
                <Text style={styles.confidenceLabel}>Transcription Accuracy</Text>
                <Text style={[styles.confidenceText, { color: getConfidenceColor() }]}>
                  {Math.round(confidence)}% - {getConfidenceText()}
                </Text>
              </View>
              <View style={styles.confidenceBar}>
                <Animated.View
                  style={[
                    styles.confidenceBarFill,
                    { backgroundColor: getConfidenceColor() },
                    confidenceBarStyle,
                  ]}
                />
              </View>
            </View>
          )}

          {/* Medical Terms Detected */}
          {medicalTerms.length > 0 && (
            <View style={styles.medicalTermsContainer}>
              <Text style={styles.medicalTermsTitle}>Medical Terms Detected:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.medicalTermsList}>
                  {medicalTerms.slice(0, 8).map((term, index) => (
                    <View key={index} style={styles.medicalTermChip}>
                      <Text style={styles.medicalTermText}>{term}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Validation Issues */}
          {!validation.isValid && (
            <View style={styles.validationContainer}>
              <Text style={styles.validationTitle}>Suggestions for Improvement:</Text>
              {validation.suggestions.map((suggestion, index) => (
                <Text key={index} style={styles.validationText}>• {suggestion}</Text>
              ))}
            </View>
          )}

          {/* Text Editor */}
          <View style={styles.editorContainer}>
            <Text style={styles.editorLabel}>Your CPD Reflection</Text>
            <ScrollView style={styles.textContainer} ref={scrollViewRef}>
              <TextInput
                ref={textInputRef}
                style={styles.textInput}
                value={transcript}
                onChangeText={handleTextChange}
                multiline
                placeholder="Your transcribed reflection will appear here... You can edit it directly."
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                textAlignVertical="top"
                autoCapitalize="sentences"
                autoCorrect
                spellCheck
              />
            </ScrollView>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <View style={styles.secondaryActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleAutoCorrect}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Auto-Correct</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => textInputRef.current?.focus()}
                activeOpacity={0.8}
              >
                <Text style={styles.secondaryButtonText}>Edit Text</Text>
              </TouchableOpacity>
            </View>

            <PrimaryButton
              label="Save Reflection"
              onPress={handleSave}
              disabled={!transcript.trim()}
              style={styles.saveButton}
            />
          </View>
        </Animated.View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  loadingEmoji: {
    fontSize: 48,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  audioInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 16,
  },
  audioInfoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  confidenceContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  confidenceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  medicalTermsContainer: {
    marginBottom: 16,
  },
  medicalTermsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  medicalTermsList: {
    flexDirection: 'row',
    gap: 8,
  },
  medicalTermChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  medicalTermText: {
    fontSize: 12,
    color: '#D1FAE5',
    fontWeight: '500',
  },
  validationContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  validationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FEF3C7',
    marginBottom: 6,
  },
  validationText: {
    fontSize: 13,
    color: '#FEF3C7',
    opacity: 0.9,
    marginBottom: 2,
  },
  editorContainer: {
    flex: 1,
    marginBottom: 20,
  },
  editorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 8,
  },
  textContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textInput: {
    color: COLORS.white,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  actionsContainer: {
    paddingBottom: 20,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  saveButton: {
    marginTop: 0,
  },
});

export default VoiceToTextEditor;
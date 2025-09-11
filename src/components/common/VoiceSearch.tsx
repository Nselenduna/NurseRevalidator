import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Animated as RNAnimated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VoiceSearchProps {
  onResult: (transcript: string, confidence: number) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  isVisible: boolean;
  enabled?: boolean; // Future flag
  language?: string;
  maxDuration?: number; // in seconds
  showTranscript?: boolean;
}

interface VoiceSearchState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  confidence: number;
  duration: number;
  audioLevels: number[];
  error: string | null;
}

// Mock transcription service for demonstration
// In production, this would connect to a real STT service like:
// - OpenAI Whisper
// - Google Cloud Speech-to-Text
// - Azure Speech Services
// - AWS Transcribe
class MockTranscriptionService {
  static async transcribe(audioUri: string): Promise<{ text: string; confidence: number }> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock responses based on common nursing/medical terms
    const mockResponses = [
      { text: "blood pressure monitoring", confidence: 0.95 },
      { text: "medication administration", confidence: 0.92 },
      { text: "patient assessment", confidence: 0.89 },
      { text: "wound care management", confidence: 0.91 },
      { text: "infection control procedures", confidence: 0.94 },
      { text: "CPD professional development", confidence: 0.87 },
      { text: "nursing standards compliance", confidence: 0.90 },
      { text: "clinical supervision meeting", confidence: 0.93 },
      { text: "evidence based practice", confidence: 0.88 },
      { text: "patient safety protocols", confidence: 0.96 },
    ];
    
    // Return random mock response
    const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    return randomResponse;
  }
}

const VoiceSearch: React.FC<VoiceSearchProps> = ({
  onResult,
  onError,
  onClose,
  isVisible,
  enabled = true, // Future flag - can be controlled by app settings
  language = 'en-US',
  maxDuration = 30,
  showTranscript = true,
}) => {
  const isReducedMotion = useReducedMotion();
  
  // State
  const [state, setState] = useState<VoiceSearchState>({
    isRecording: false,
    isProcessing: false,
    transcript: '',
    confidence: 0,
    duration: 0,
    audioLevels: [],
    error: null,
  });
  
  // Refs
  const recording = useRef<Audio.Recording | null>(null);
  const durationTimer = useRef<NodeJS.Timeout | null>(null);
  const audioLevelTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Animations
  const pulseAnim = useSharedValue(1);
  const microphoneScale = useSharedValue(1);
  const waveformOpacity = useSharedValue(0);
  const modalAnim = useSharedValue(0);
  
  // Initialize modal animation
  useEffect(() => {
    if (isVisible && !isReducedMotion) {
      modalAnim.value = withTiming(1, { duration: 300 });
    } else if (isVisible) {
      modalAnim.value = 1;
    } else {
      modalAnim.value = 0;
    }
  }, [isVisible, isReducedMotion]);
  
  // Start recording
  const startRecording = async () => {
    if (!enabled) {
      Alert.alert(
        'Voice Search Disabled',
        'Voice search is currently disabled. Enable it in settings to use this feature.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      // Request permissions
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Microphone permission denied');
      }
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Create recording
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY
      );
      
      recording.current = newRecording;
      
      // Update state
      setState(prev => ({
        ...prev,
        isRecording: true,
        error: null,
        duration: 0,
        audioLevels: [],
        transcript: '',
      }));
      
      // Start animations
      if (!isReducedMotion) {
        pulseAnim.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 500 }),
            withTiming(1, { duration: 500 })
          ),
          -1,
          true
        );
        
        microphoneScale.value = withTiming(1.1, { duration: 200 });
        waveformOpacity.value = withTiming(1, { duration: 300 });
      }
      
      // Start duration timer
      durationTimer.current = setInterval(() => {
        setState(prev => {
          const newDuration = prev.duration + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          
          return { ...prev, duration: newDuration };
        });
      }, 1000);
      
      // Mock audio level updates for visualization
      audioLevelTimer.current = setInterval(() => {
        setState(prev => ({
          ...prev,
          audioLevels: [
            ...prev.audioLevels.slice(-20), // Keep last 20 levels
            Math.random() * 0.8 + 0.1 // Random level between 0.1 and 0.9
          ]
        }));
      }, 100);
      
      // Haptic feedback
      if (!isReducedMotion) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      handleError(`Failed to start recording: ${error.message}`);
    }
  };
  
  // Stop recording
  const stopRecording = async () => {
    if (!recording.current) return;
    
    try {
      // Stop recording
      await recording.current.stopAndUnloadAsync();
      const uri = recording.current.getURI();
      recording.current = null;
      
      // Clear timers
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      
      if (audioLevelTimer.current) {
        clearInterval(audioLevelTimer.current);
        audioLevelTimer.current = null;
      }
      
      // Stop animations
      cancelAnimation(pulseAnim);
      cancelAnimation(microphoneScale);
      cancelAnimation(waveformOpacity);
      
      if (!isReducedMotion) {
        pulseAnim.value = withTiming(1);
        microphoneScale.value = withTiming(1);
        waveformOpacity.value = withTiming(0);
      }
      
      // Update state to processing
      setState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: true,
      }));
      
      // Process audio
      if (uri) {
        await processAudio(uri);
      } else {
        throw new Error('No audio recorded');
      }
      
    } catch (error) {
      console.error('Failed to stop recording:', error);
      handleError(`Failed to process recording: ${error.message}`);
    }
  };
  
  // Process audio for transcription
  const processAudio = async (audioUri: string) => {
    try {
      // Call transcription service (mock in this case)
      const result = await MockTranscriptionService.transcribe(audioUri);
      
      // Update state with results
      setState(prev => ({
        ...prev,
        isProcessing: false,
        transcript: result.text,
        confidence: result.confidence,
      }));
      
      // Return result to parent
      onResult(result.text, result.confidence);
      
      // Haptic feedback
      if (!isReducedMotion) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Auto-close after short delay
      setTimeout(() => {
        handleClose();
      }, 2000);
      
    } catch (error) {
      console.error('Transcription failed:', error);
      handleError(`Transcription failed: ${error.message}`);
    }
  };
  
  // Handle error
  const handleError = (errorMessage: string) => {
    setState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      error: errorMessage,
    }));
    
    onError?.(errorMessage);
    
    // Reset animations
    cancelAnimation(pulseAnim);
    cancelAnimation(microphoneScale);
    cancelAnimation(waveformOpacity);
    
    if (!isReducedMotion) {
      pulseAnim.value = withTiming(1);
      microphoneScale.value = withTiming(1);
      waveformOpacity.value = withTiming(0);
    }
  };
  
  // Handle close
  const handleClose = () => {
    // Stop any ongoing recording
    if (state.isRecording) {
      stopRecording();
    }
    
    // Reset state
    setState({
      isRecording: false,
      isProcessing: false,
      transcript: '',
      confidence: 0,
      duration: 0,
      audioLevels: [],
      error: null,
    });
    
    onClose?.();
  };
  
  // Format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Animation styles
  const modalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: modalAnim.value,
    transform: [{ scale: 0.9 + modalAnim.value * 0.1 }],
  }));
  
  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));
  
  const microphoneAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: microphoneScale.value }],
  }));
  
  const waveformAnimatedStyle = useAnimatedStyle(() => ({
    opacity: waveformOpacity.value,
  }));
  
  // Render waveform visualization
  const renderWaveform = () => {
    if (state.audioLevels.length === 0) return null;
    
    return (
      <Animated.View style={[styles.waveform, waveformAnimatedStyle]}>
        {state.audioLevels.slice(-20).map((level, index) => (
          <View
            key={index}
            style={[
              styles.waveformBar,
              {
                height: Math.max(4, level * 60),
                backgroundColor: `rgba(255, 255, 255, ${0.3 + level * 0.7})`,
              },
            ]}
          />
        ))}
      </Animated.View>
    );
  };
  
  // Render status text
  const renderStatusText = () => {
    if (state.error) {
      return (
        <View style={styles.statusContainer}>
          <Ionicons name="alert-circle" size={20} color="#FCA5A5" />
          <Text style={[styles.statusText, styles.errorText]}>{state.error}</Text>
        </View>
      );
    }
    
    if (state.isProcessing) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Processing your voice...</Text>
        </View>
      );
    }
    
    if (state.isRecording) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Listening...</Text>
          <Text style={styles.durationText}>{formatDuration(state.duration)}</Text>
        </View>
      );
    }
    
    if (state.transcript) {
      return (
        <View style={styles.statusContainer}>
          <Text style={styles.successText}>Voice Search Result:</Text>
          <Text style={styles.transcriptText}>"{state.transcript}"</Text>
          <Text style={styles.confidenceText}>
            Confidence: {Math.round(state.confidence * 100)}%
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>Tap to start voice search</Text>
        <Text style={styles.subtitleText}>Speak clearly for best results</Text>
      </View>
    );
  };
  
  if (!isVisible) return null;
  
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modal, modalAnimatedStyle]}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.purple2]}
            style={styles.modalGradient}
          >
            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityRole="button"
              accessibilityLabel="Close voice search"
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            
            {/* Microphone Button */}
            <View style={styles.microphoneContainer}>
              <Animated.View style={pulseAnimatedStyle}>
                <TouchableOpacity
                  style={[
                    styles.microphoneButton,
                    state.isRecording && styles.microphoneButtonRecording,
                    state.isProcessing && styles.microphoneButtonProcessing,
                  ]}
                  onPress={state.isRecording ? stopRecording : startRecording}
                  disabled={state.isProcessing}
                  accessibilityRole="button"
                  accessibilityLabel={
                    state.isRecording ? 'Stop recording' : 'Start voice recording'
                  }
                  accessibilityState={{
                    disabled: state.isProcessing,
                    busy: state.isProcessing,
                  }}
                >
                  <Animated.View style={microphoneAnimatedStyle}>
                    <Ionicons
                      name={
                        state.isProcessing
                          ? 'hourglass'
                          : state.isRecording
                          ? 'stop'
                          : 'mic'
                      }
                      size={32}
                      color={COLORS.white}
                    />
                  </Animated.View>
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            {/* Waveform Visualization */}
            {state.isRecording && renderWaveform()}
            
            {/* Status Text */}
            {renderStatusText()}
            
            {/* Instructions */}
            {!state.transcript && !state.error && (
              <Text style={styles.instructions}>
                Speak naturally about nursing topics, CPD activities, or professional standards
              </Text>
            )}
            
            {/* Future Flag Notice */}
            {!enabled && (
              <View style={styles.disabledNotice}>
                <Ionicons name="information-circle" size={20} color="#FCA5A5" />
                <Text style={styles.disabledText}>
                  Voice search is currently disabled. Enable in app settings.
                </Text>
              </View>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    overflow: 'hidden',
  },
  modalGradient: {
    padding: 32,
    alignItems: 'center',
    minHeight: 300,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  microphoneContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  microphoneButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  microphoneButtonRecording: {
    backgroundColor: '#EF4444',
  },
  microphoneButtonProcessing: {
    backgroundColor: '#F59E0B',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginVertical: 16,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    minHeight: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  statusContainer: {
    alignItems: 'center',
    marginVertical: 16,
    gap: 8,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  durationText: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 16,
  },
  successText: {
    color: '#86EFAC',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  confidenceText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  instructions: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
  },
  disabledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    gap: 8,
  },
  disabledText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
});

export default VoiceSearch;
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

// Import STT components
import STTManager from '../../services/stt/STTManager';
import STTConsentModal from '../../services/stt/STTConsentModal';
import { useSTT } from '../../services/stt/useSTT';
import { COLORS } from '../../utils/constants/colors';

interface EnhancedVoiceSearchProps {
  onResult: (transcript: string, confidence: number) => void;
  onClose?: () => void;
  isVisible: boolean;
  language?: string;
  maxDuration?: number; // in seconds
  showTranscript?: boolean;
}

const EnhancedVoiceSearch: React.FC<EnhancedVoiceSearchProps> = ({
  onResult,
  onClose,
  isVisible,
  language = 'en',
  maxDuration = 30,
  showTranscript = true,
}) => {
  // Use STT hook
  const {
    isSTTAvailable,
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    showConsentModal,
    setShowConsentModal,
    handleConsentResult
  } = useSTT({
    onTranscriptionResult: onResult,
    language,
  });
  
  // Component state
  const [transcript, setTranscript] = useState('');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Handle modal visibility changes
  useEffect(() => {
    if (isVisible) {
      // Reset state when modal is shown
      setTranscript('');
      setRecordingDuration(0);
      
      // Check if STT is available, if not, show consent modal
      if (isSTTAvailable === false) {
        setShowConsentModal(true);
      }
    } else {
      // Clean up when modal is hidden
      if (isRecording) {
        stopRecording();
      }
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [isVisible]);
  
  // Update recording duration
  useEffect(() => {
    if (isRecording) {
      // Start timer
      const interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1;
          
          // Auto-stop at max duration
          if (newDuration >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          
          return newDuration;
        });
      }, 1000);
      
      setTimerInterval(interval);
      
      return () => {
        clearInterval(interval);
        setTimerInterval(null);
      };
    } else {
      // Clear timer when not recording
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
  }, [isRecording]);
  
  // Handle start recording button press
  const handleStartRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await startRecording();
    } catch (err) {
      console.error('Error starting recording:', err);
    }
  };
  
  // Handle stop recording button press
  const handleStopRecording = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await stopRecording();
      
      if (result) {
        setTranscript(result.text);
      }
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Render recording button based on state
  const renderRecordButton = () => {
    if (isProcessing) {
      return (
        <View style={styles.recordButtonContainer}>
          <View style={[styles.recordButton, styles.processingButton]}>
            <Text style={styles.recordButtonIcon}>⏳</Text>
          </View>
          <Text style={styles.buttonLabel}>Processing...</Text>
        </View>
      );
    } else if (isRecording) {
      return (
        <View style={styles.recordButtonContainer}>
          <TouchableOpacity
            style={[styles.recordButton, styles.stopButton]}
            onPress={handleStopRecording}
            accessibilityRole="button"
            accessibilityLabel="Stop recording"
            accessibilityHint="Stops the voice recording and processes the transcript"
          >
            <Text style={styles.recordButtonIcon}>⏹️</Text>
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>
            {formatDuration(recordingDuration)} / {formatDuration(maxDuration)}
          </Text>
        </View>
      );
    } else {
      return (
        <View style={styles.recordButtonContainer}>
          <TouchableOpacity
            style={[styles.recordButton, styles.startButton]}
            onPress={handleStartRecording}
            disabled={isSTTAvailable === false || isSTTAvailable === null}
            accessibilityRole="button"
            accessibilityLabel="Start recording"
            accessibilityHint="Starts voice recording for transcription"
          >
            <Text style={styles.recordButtonIcon}>🎤</Text>
          </TouchableOpacity>
          <Text style={styles.buttonLabel}>
            {isSTTAvailable === false
              ? 'Voice transcription disabled'
              : isSTTAvailable === null
              ? 'Initializing...'
              : 'Tap to start speaking'}
          </Text>
        </View>
      );
    }
  };

  return (
    <>
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onClose?.()}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* Header */}
            <LinearGradient
              colors={[COLORS.primary, COLORS.purple2]}
              style={styles.header}
            >
              <Text style={styles.title}>Voice Search</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => onClose?.()}
                accessibilityRole="button"
                accessibilityLabel="Close voice search"
              >
                <Ionicons name="close" size={24} color={COLORS.white} />
              </TouchableOpacity>
            </LinearGradient>
            
            {/* Content */}
            <View style={styles.content}>
              {/* Error display */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              
              {/* Record button */}
              {renderRecordButton()}
              
              {/* Transcript display */}
              {showTranscript && transcript && (
                <View style={styles.transcriptContainer}>
                  <Text style={styles.transcriptLabel}>Transcript:</Text>
                  <Text style={styles.transcriptText}>{transcript}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Consent Modal */}
      <STTConsentModal
        isVisible={showConsentModal}
        onClose={handleConsentResult}
      />
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#F87171',
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 14,
    textAlign: 'center',
  },
  recordButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  stopButton: {
    backgroundColor: '#EF4444',
  },
  processingButton: {
    backgroundColor: '#F59E0B',
  },
  recordButtonIcon: {
    fontSize: 32,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#4B5563',
  },
  transcriptContainer: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  transcriptLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B5563',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: '#1F2937',
    fontStyle: 'italic',
  },
});

export default EnhancedVoiceSearch;

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  interpolate,
} from 'react-native-reanimated';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import * as Haptics from 'expo-haptics';

import { AudioRecorderProps, RecordingStatus } from '../../types/cpd.types';
import AudioService from '../../services/audio/AudioService';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth } = Dimensions.get('window');

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDuration = 3600, // 1 hour default
  onStatusChange,
  disabled = false,
}) => {
  const isReducedMotion = useReducedMotion();
  
  // State
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Animations
  const pulseScale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const waveformOpacity = useSharedValue(0);

  // Refs
  const durationTimer = useRef<NodeJS.Timeout | null>(null);
  const audioLevelTimer = useRef<NodeJS.Timeout | null>(null);

  // Update parent with status changes
  useEffect(() => {
    onStatusChange?.(recordingStatus);
  }, [recordingStatus, onStatusChange]);

  // Duration timer
  useEffect(() => {
    if (recordingStatus === 'recording') {
      durationTimer.current = setInterval(() => {
        const currentDuration = AudioService.getRecordingDuration();
        setDuration(currentDuration);
        
        // Auto-stop at max duration
        if (currentDuration >= maxDuration) {
          handleStop();
        }
      }, 1000);
      
      // Mock audio level updates
      audioLevelTimer.current = setInterval(() => {
        const level = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
        setAudioLevels(prev => [...prev.slice(-50), level]); // Keep last 50 levels
      }, 100);
    } else {
      if (durationTimer.current) {
        clearInterval(durationTimer.current);
        durationTimer.current = null;
      }
      if (audioLevelTimer.current) {
        clearInterval(audioLevelTimer.current);
        audioLevelTimer.current = null;
      }
    }

    return () => {
      if (durationTimer.current) clearInterval(durationTimer.current);
      if (audioLevelTimer.current) clearInterval(audioLevelTimer.current);
    };
  }, [recordingStatus, maxDuration]);

  // Recording animations
  useEffect(() => {
    if (!isReducedMotion) {
      switch (recordingStatus) {
        case 'recording':
          pulseScale.value = withRepeat(
            withSequence(
              withTiming(1.1, { duration: 800 }),
              withTiming(1, { duration: 800 })
            ),
            -1,
            false
          );
          waveformOpacity.value = withTiming(1, { duration: 300 });
          break;
        case 'paused':
          cancelAnimation(pulseScale);
          pulseScale.value = withTiming(1, { duration: 300 });
          break;
        case 'processing':
          cancelAnimation(pulseScale);
          pulseScale.value = withRepeat(
            withTiming(1.05, { duration: 500 }),
            -1,
            true
          );
          break;
        default:
          cancelAnimation(pulseScale);
          pulseScale.value = withTiming(1, { duration: 300 });
          waveformOpacity.value = withTiming(0, { duration: 300 });
      }
    }
  }, [recordingStatus, isReducedMotion]);

  // Handle start recording
  const handleStart = async () => {
    try {
      setError(null);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Check permissions
      const hasPermission = await AudioService.checkPermissions();
      if (!hasPermission) {
        const granted = await AudioService.requestPermissions();
        if (!granted) {
          throw new Error('Microphone permission is required to record audio');
        }
      }

      await AudioService.startRecording();
      setRecordingStatus('recording');
      setDuration(0);
      setAudioLevels([]);
      
      // Ripple effect
      if (!isReducedMotion) {
        rippleScale.value = 0;
        rippleOpacity.value = 0.5;
        rippleScale.value = withTiming(2, { duration: 600 });
        rippleOpacity.value = withTiming(0, { duration: 600 });
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      Alert.alert('Recording Error', message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Handle stop recording
  const handleStop = async () => {
    try {
      setRecordingStatus('processing');
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      const recording = await AudioService.stopRecording();
      setRecordingStatus('idle');
      setDuration(0);
      setAudioLevels([]);
      
      onRecordingComplete(recording);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.error('Failed to stop recording:', err);
      setRecordingStatus('idle');
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(message);
      Alert.alert('Recording Error', message);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Handle pause/resume
  const handlePauseResume = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      if (recordingStatus === 'recording') {
        await AudioService.pauseRecording();
        setRecordingStatus('paused');
      } else if (recordingStatus === 'paused') {
        await AudioService.resumeRecording();
        setRecordingStatus('recording');
      }
    } catch (err) {
      console.error('Failed to pause/resume recording:', err);
      const message = err instanceof Error ? err.message : 'Failed to pause/resume recording';
      Alert.alert('Recording Error', message);
    }
  };

  // Format duration
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get primary button config
  const getPrimaryButtonConfig = () => {
    switch (recordingStatus) {
      case 'recording':
        return {
          icon: '⏹️',
          color: [COLORS.error, '#B91C1C'],
          text: 'Stop Recording',
          onPress: handleStop,
        };
      case 'paused':
        return {
          icon: '▶️',
          color: ['#F59E0B', '#D97706'],
          text: 'Resume',
          onPress: handlePauseResume,
        };
      case 'processing':
        return {
          icon: '⏳',
          color: [COLORS.primary, COLORS.purple2],
          text: 'Processing...',
          onPress: () => {},
        };
      default:
        return {
          icon: '🎤',
          color: [COLORS.primary, COLORS.purple2],
          text: 'Start Recording',
          onPress: handleStart,
        };
    }
  };

  const buttonConfig = getPrimaryButtonConfig();

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  const waveformStyle = useAnimatedStyle(() => ({
    opacity: waveformOpacity.value,
  }));

  // Create waveform path
  const createWaveformPath = () => {
    if (audioLevels.length < 2) return null;
    
    const path = Skia.Path.Make();
    const width = screenWidth - 80;
    const height = 60;
    const stepX = width / (audioLevels.length - 1);
    
    // Start from bottom center
    path.moveTo(0, height / 2);
    
    // Draw waveform
    audioLevels.forEach((level, index) => {
      const x = index * stepX;
      const y = height / 2 + (level - 0.5) * height * 0.8;
      if (index === 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    });
    
    return path;
  };

  return (
    <View style={styles.container}>
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Recording Status */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {recordingStatus === 'idle' ? 'Ready to Record' :
           recordingStatus === 'recording' ? 'Recording' :
           recordingStatus === 'paused' ? 'Paused' :
           'Processing...'}
        </Text>
        
        {duration > 0 && (
          <Text style={styles.durationText}>
            {formatDuration(duration)}
            {maxDuration && ` / ${formatDuration(maxDuration)}`}
          </Text>
        )}
      </View>

      {/* Waveform Visualization */}
      <Animated.View style={[styles.waveformContainer, waveformStyle]}>
        {audioLevels.length > 1 && (
          <Canvas style={styles.waveform}>
            <Path
              path={createWaveformPath()}
              strokeWidth={2}
              style="stroke"
              color={COLORS.white}
            />
          </Canvas>
        )}
      </Animated.View>

      {/* Recording Controls */}
      <View style={styles.controlsContainer}>
        {/* Ripple Effect */}
        {recordingStatus !== 'idle' && !isReducedMotion && (
          <Animated.View style={[styles.ripple, rippleStyle]}>
            <LinearGradient
              colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0)']}
              style={styles.rippleGradient}
            />
          </Animated.View>
        )}

        {/* Primary Button */}
        <Animated.View style={[styles.primaryButtonContainer, pulseStyle]}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={buttonConfig.onPress}
            disabled={disabled || recordingStatus === 'processing'}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={buttonConfig.color}
              style={styles.primaryButtonGradient}
            >
              <Text style={styles.primaryButtonIcon}>{buttonConfig.icon}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.buttonLabel}>{buttonConfig.text}</Text>

        {/* Secondary Controls */}
        {(recordingStatus === 'recording' || recordingStatus === 'paused') && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handlePauseResume}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryButtonIcon}>
              {recordingStatus === 'recording' ? '⏸️' : '▶️'}
            </Text>
            <Text style={styles.secondaryButtonText}>
              {recordingStatus === 'recording' ? 'Pause' : 'Resume'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recording Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          {recordingStatus === 'idle' ? 'Tap the microphone to start recording your CPD reflection' :
           recordingStatus === 'recording' ? 'Speak clearly. Your voice will be transcribed automatically.' :
           recordingStatus === 'paused' ? 'Recording paused. Tap resume to continue.' :
           'Processing your recording...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorContainer: {
    backgroundColor: 'rgba(220, 38, 38, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.3)',
  },
  errorText: {
    color: '#FEE2E2',
    fontSize: 14,
    textAlign: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  durationText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'monospace',
  },
  waveformContainer: {
    height: 80,
    width: screenWidth - 80,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveform: {
    flex: 1,
    width: '100%',
  },
  controlsContainer: {
    alignItems: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  ripple: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  rippleGradient: {
    flex: 1,
    borderRadius: 60,
  },
  primaryButtonContainer: {
    marginBottom: 12,
  },
  primaryButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  primaryButtonGradient: {
    flex: 1,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonIcon: {
    fontSize: 32,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 16,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoContainer: {
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AudioRecorder;
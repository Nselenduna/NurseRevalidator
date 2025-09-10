import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import {
  AudioServiceInterface,
  AudioRecording,
  AudioRecordingOptions,
  RecordingStatus,
} from '../../types/cpd.types';

class AudioService implements AudioServiceInterface {
  private recording: Audio.Recording | null = null;
  private recordingStatus: RecordingStatus = 'idle';
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private recordingUri: string | null = null;

  private defaultOptions: AudioRecordingOptions = {
    quality: 'medium',
    format: 'aac',
    sampleRate: 44100,
    bitRate: 128000,
    channels: 2,
  };

  async startRecording(options: Partial<AudioRecordingOptions> = {}): Promise<void> {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio recording permission not granted');
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
      });

      // Merge options with defaults
      const recordingOptions = { ...this.defaultOptions, ...options };

      // Create recording options for Expo
      const expoRecordingOptions = {
        android: {
          extension: `.${recordingOptions.format}`,
          outputFormat: Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.android.outputFormat,
          audioEncoder: Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.android.audioEncoder,
          sampleRate: recordingOptions.sampleRate,
          numberOfChannels: recordingOptions.channels,
          bitRate: recordingOptions.bitRate,
        },
        ios: {
          extension: `.${recordingOptions.format}`,
          outputFormat: Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.ios.outputFormat,
          audioQuality: Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY.ios.audioQuality,
          sampleRate: recordingOptions.sampleRate,
          numberOfChannels: recordingOptions.channels,
          bitRate: recordingOptions.bitRate,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      this.recording = new Audio.Recording();
      await this.recording.prepareToRecordAsync(expoRecordingOptions);
      
      this.startTime = Date.now();
      this.pausedDuration = 0;
      this.recordingStatus = 'recording';
      
      await this.recording.startAsync();
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recordingStatus = 'idle';
      throw error;
    }
  }

  async stopRecording(): Promise<AudioRecording> {
    try {
      if (!this.recording || this.recordingStatus === 'idle') {
        throw new Error('No active recording to stop');
      }

      this.recordingStatus = 'processing';
      
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (!uri) {
        throw new Error('Recording failed - no file created');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const duration = Math.floor((Date.now() - this.startTime - this.pausedDuration) / 1000);
      
      // Generate waveform data (mock implementation)
      const waveformData = this.generateMockWaveform(duration);

      const audioRecording: AudioRecording = {
        id: `recording_${Date.now()}`,
        uri,
        duration,
        waveformData,
        createdAt: new Date(),
        fileSize: fileInfo.exists ? fileInfo.size || 0 : 0,
      };

      // Store recording reference
      this.recordingUri = uri;
      this.recording = null;
      this.recordingStatus = 'idle';

      return audioRecording;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recordingStatus = 'idle';
      throw error;
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      if (!this.recording || this.recordingStatus !== 'recording') {
        throw new Error('No active recording to pause');
      }

      await this.recording.pauseAsync();
      this.recordingStatus = 'paused';
      this.pausedDuration += Date.now() - this.startTime;
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      if (!this.recording || this.recordingStatus !== 'paused') {
        throw new Error('No paused recording to resume');
      }

      await this.recording.startAsync();
      this.recordingStatus = 'recording';
      this.startTime = Date.now();
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  getRecordingStatus(): RecordingStatus {
    return this.recordingStatus;
  }

  getRecordingDuration(): number {
    if (this.recordingStatus === 'idle' || !this.startTime) {
      return 0;
    }
    
    const currentTime = Date.now();
    return Math.floor((currentTime - this.startTime - this.pausedDuration) / 1000);
  }

  async deleteRecording(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Failed to delete recording:', error);
      throw error;
    }
  }

  async generateWaveform(uri: string): Promise<number[]> {
    // Mock implementation - in real app would analyze audio file
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) {
      throw new Error('Audio file not found');
    }

    // Generate mock waveform based on file size
    const dataPoints = 100;
    const waveform: number[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      // Create realistic waveform pattern
      const base = Math.sin(i * 0.1) * 0.5 + 0.5;
      const noise = Math.random() * 0.3;
      const value = Math.max(0, Math.min(1, base + noise));
      waveform.push(value);
    }
    
    return waveform;
  }

  private generateMockWaveform(durationSeconds: number): number[] {
    // Generate waveform data points (1 per second)
    const dataPoints = Math.max(10, durationSeconds);
    const waveform: number[] = [];
    
    for (let i = 0; i < dataPoints; i++) {
      // Create realistic waveform pattern
      const time = i / dataPoints;
      const base = Math.sin(time * Math.PI * 4) * 0.4 + 0.5;
      const detail = Math.sin(time * Math.PI * 20) * 0.2;
      const noise = (Math.random() - 0.5) * 0.1;
      const value = Math.max(0.1, Math.min(0.9, base + detail + noise));
      waveform.push(value);
    }
    
    return waveform;
  }

  // Utility method to format duration
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Check if device has microphone access
  static async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }

  // Request microphone permissions
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  }
}

export default new AudioService();
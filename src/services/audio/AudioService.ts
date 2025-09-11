import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export interface AudioRecording {
  uri: string;
  duration: number;
  size: number;
}

class AudioServiceClass {
  private recording: Audio.Recording | null = null;
  private recordingDuration: number = 0;
  private durationTimer: NodeJS.Timeout | null = null;

  async checkPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error checking audio permissions:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting audio permissions:', error);
      return false;
    }
  }

  async startRecording(): Promise<void> {
    try {
      // Stop any existing recording
      if (this.recording) {
        await this.stopRecording();
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create new recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.recordingDuration = 0;

      // Start duration timer
      this.durationTimer = setInterval(() => {
        this.recordingDuration += 1;
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording');
    }
  }

  async stopRecording(): Promise<AudioRecording> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      // Clear timer
      if (this.durationTimer) {
        clearInterval(this.durationTimer);
        this.durationTimer = null;
      }

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (!uri) {
        throw new Error('Recording failed - no URI available');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      const size = fileInfo.exists ? fileInfo.size || 0 : 0;

      const result: AudioRecording = {
        uri,
        duration: this.recordingDuration,
        size,
      };

      // Reset state
      this.recording = null;
      this.recordingDuration = 0;

      return result;
    } catch (error) {
      console.error('Error stopping recording:', error);
      this.recording = null;
      this.recordingDuration = 0;
      throw new Error('Failed to stop recording');
    }
  }

  async pauseRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.pauseAsync();

      // Pause timer
      if (this.durationTimer) {
        clearInterval(this.durationTimer);
        this.durationTimer = null;
      }
    } catch (error) {
      console.error('Error pausing recording:', error);
      throw new Error('Failed to pause recording');
    }
  }

  async resumeRecording(): Promise<void> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      await this.recording.startAsync();

      // Resume timer
      this.durationTimer = setInterval(() => {
        this.recordingDuration += 1;
      }, 1000);
    } catch (error) {
      console.error('Error resuming recording:', error);
      throw new Error('Failed to resume recording');
    }
  }

  getRecordingDuration(): number {
    return this.recordingDuration;
  }

  async deleteRecording(uri: string): Promise<void> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists) {
        await FileSystem.deleteAsync(uri);
      }
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  }
}

// Export both the class and a singleton instance
export { AudioServiceClass };
const AudioService = new AudioServiceClass();
export default AudioService;
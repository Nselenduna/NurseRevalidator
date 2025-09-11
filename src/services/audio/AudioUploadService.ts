// #scope:transcript
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../config/supabase';
import ENV from '../../config/environment';

export interface TranscriptionResult {
  id: string;
  transcript: string;
  confidence: number;
  audio_url: string;
  metadata: {
    duration?: number;
    language?: string;
    medical_terms?: string[];
  };
}

export class AudioUploadService {
  /**
   * Upload audio file and trigger transcription
   */
  async uploadAndTranscribe(audioUri: string, cpdId: string): Promise<TranscriptionResult> {
    if (!ENV.features.voiceTranscription) {
      throw new Error('Voice transcription feature is disabled');
    }

    const user = await supabase.auth.getUser();
    if (!user.data.user) {
      throw new Error('User not authenticated');
    }

    // Upload audio to Supabase Storage
    const audioUrl = await this.uploadAudioFile(audioUri, user.data.user.id);
    
    // Trigger transcription via Edge Function
    const transcriptionResult = await this.triggerTranscription(audioUrl, cpdId);
    
    return transcriptionResult;
  }

  /**
   * Upload audio file to Supabase Storage
   */
  private async uploadAudioFile(audioUri: string, userId: string): Promise<string> {
    // Read the audio file
    const fileInfo = await FileSystem.getInfoAsync(audioUri);
    if (!fileInfo.exists) {
      throw new Error('Audio file does not exist');
    }

    // Convert to base64 for upload
    const audioBase64 = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to blob
    const audioBlob = Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0));
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/audio/${timestamp}.m4a`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('audio')
      .upload(filename, audioBlob, {
        contentType: 'audio/m4a',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload audio: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('audio')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  }

  /**
   * Trigger transcription via Supabase Edge Function
   */
  private async triggerTranscription(audioUrl: string, cpdId: string): Promise<TranscriptionResult> {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        throw new Error('User not authenticated');
      }
      
      // Extract audio path from the URL
      const url = new URL(audioUrl);
      const pathParts = url.pathname.split('/');
      const audioPath = pathParts.slice(pathParts.indexOf('audio') + 1).join('/');
      
      const { data, error } = await supabase.functions.invoke('transcribe', {
        body: {
          audioPath: audioPath,
          cpdId: cpdId,
          userId: user.data.user.id,
          language: 'en-GB' // UK English for nursing context
        }
      });

      if (error) {
        throw new Error(`Transcription failed: ${error.message}`);
      }

      return data as TranscriptionResult;
    } catch (error) {
      // Fallback to mock transcription for development
      if (ENV.isDevelopment) {
        return this.getMockTranscription(audioUrl, cpdId);
      }
      throw error;
    }
  }

  /**
   * Mock transcription for development/offline mode
   */
  private getMockTranscription(audioUrl: string, cpdId: string): TranscriptionResult {
    const mockTranscripts = [
      "Today I attended a clinical skills workshop focused on advanced patient assessment techniques. I learned about systematic approaches to physical examination and how to identify subtle signs of deterioration. The session emphasized the importance of holistic patient care and effective communication with patients and their families.",
      "During my mentoring session with a junior colleague, I reflected on my leadership style and how I can better support new team members. We discussed challenging patient scenarios and I shared evidence-based strategies for managing complex clinical situations.",
      "I completed an online course on infection control protocols and updated my knowledge of the latest guidelines. The training covered hand hygiene practices, personal protective equipment use, and strategies for preventing healthcare-associated infections in various clinical settings.",
      "Today's reflection focuses on a challenging ethical dilemma I encountered in practice. I considered the principles of beneficence and autonomy while making decisions about patient care. This experience has reinforced the importance of involving patients in their care decisions and maintaining professional boundaries."
    ];

    const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
    const confidence = 85 + Math.random() * 10; // 85-95%
    
    return {
      id: `mock_${Date.now()}`,
      transcript,
      confidence,
      audio_url: audioUrl,
      metadata: {
        duration: 30 + Math.random() * 120, // 30-150 seconds
        language: 'en-GB',
        medical_terms: this.extractMedicalTerms(transcript),
      },
    };
  }

  /**
   * Extract medical terms from transcript
   */
  private extractMedicalTerms(text: string): string[] {
    const medicalTerms = [
      'assessment', 'patient', 'clinical', 'diagnosis', 'treatment', 'medication',
      'symptoms', 'nursing', 'healthcare', 'protocol', 'guidelines', 'infection',
      'hygiene', 'sterile', 'vital signs', 'blood pressure', 'temperature',
      'respiratory', 'cardiovascular', 'neurological', 'gastrointestinal',
      'musculoskeletal', 'dermatological', 'psychiatric', 'pediatric', 'geriatric',
      'emergency', 'intensive care', 'surgery', 'anesthesia', 'pharmacy',
      'laboratory', 'radiology', 'pathology', 'rehabilitation', 'palliative',
      'wound care', 'catheter', 'IV', 'injection', 'prescription', 'dosage',
      'allergy', 'adverse reaction', 'contraindication', 'efficacy', 'therapeutic'
    ];
    
    const lowerText = text.toLowerCase();
    const detectedTerms: string[] = [];
    
    medicalTerms.forEach(term => {
      if (lowerText.includes(term.toLowerCase())) {
        detectedTerms.push(term);
      }
    });
    
    return Array.from(new Set(detectedTerms));
  }

  /**
   * Get transcription status
   */
  async getTranscriptionStatus(transcriptionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed';
    result?: TranscriptionResult;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single();

      if (error) {
        return { status: 'failed', error: error.message };
      }

      return {
        status: data.status,
        result: data.status === 'completed' ? data : undefined,
      };
    } catch (error) {
      return { status: 'failed', error: 'Failed to check transcription status' };
    }
  }

  /**
   * Delete audio file and transcription
   */
  async deleteAudioAndTranscription(audioUrl: string, transcriptionId?: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = audioUrl.split('/');
      const filePath = urlParts.slice(-3).join('/'); // user_id/audio/filename.m4a

      // Delete from storage
      await supabase.storage
        .from('audio')
        .remove([filePath]);

      // Delete transcription record if provided
      if (transcriptionId) {
        await supabase
          .from('transcriptions')
          .delete()
          .eq('id', transcriptionId);
      }
    } catch (error) {
      // Log but don't throw - deletion failure shouldn't break the app
      console.warn('Failed to delete audio/transcription:', error);
    }
  }
}

// Singleton instance
export const audioUploadService = new AudioUploadService();
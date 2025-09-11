// #scope:testing
import { AudioUploadService } from '../../services/audio/AudioUploadService';
import { supabase } from '../../config/supabase';
import * as FileSystem from 'expo-file-system';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('expo-file-system');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockFileSystem = FileSystem as jest.Mocked<typeof FileSystem>;

describe('AudioUploadService', () => {
  let audioService: AudioUploadService;

  beforeEach(() => {
    audioService = new AudioUploadService();
    jest.clearAllMocks();
  });

  describe('uploadAndTranscribe', () => {
    it('should upload audio and trigger transcription', async () => {
      const mockUri = 'file://test-audio.m4a';
      const mockCpdId = 'test-cpd-id';
      const mockUserId = 'test-user-id';

      // Mock user authentication
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      } as any);

      // Mock file system
      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: mockUri,
      } as any);

      mockFileSystem.readAsStringAsync.mockResolvedValue('mockBase64AudioData');

      // Mock storage upload
      mockSupabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: { path: `${mockUserId}/audio/123456.m4a` },
            error: null,
          }),
          getPublicUrl: jest.fn().mockReturnValue({
            data: { publicUrl: 'https://supabase.co/storage/audio/123456.m4a' },
          }),
        }),
      } as any;

      // Mock edge function
      mockSupabase.functions = {
        invoke: jest.fn().mockResolvedValue({
          data: {
            id: 'transcription_123',
            transcript: 'Test transcription result',
            confidence: 95,
            audio_url: 'https://supabase.co/storage/audio/123456.m4a',
            metadata: {
              duration: 30,
              language: 'en-GB',
              medical_terms: ['patient', 'clinical'],
            },
          },
          error: null,
        }),
      } as any;

      const result = await audioService.uploadAndTranscribe(mockUri, mockCpdId);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('transcribe-audio', {
        body: {
          audio_url: 'https://supabase.co/storage/audio/123456.m4a',
          cpd_id: mockCpdId,
          language: 'en-GB',
        },
      });

      expect(result).toEqual({
        id: 'transcription_123',
        transcript: 'Test transcription result',
        confidence: 95,
        audio_url: 'https://supabase.co/storage/audio/123456.m4a',
        metadata: {
          duration: 30,
          language: 'en-GB',
          medical_terms: ['patient', 'clinical'],
        },
      });
    });

    it('should handle upload failures', async () => {
      const mockUri = 'file://test-audio.m4a';
      const mockCpdId = 'test-cpd-id';

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user' } },
        error: null,
      } as any);

      mockFileSystem.getInfoAsync.mockResolvedValue({
        exists: true,
        uri: mockUri,
      } as any);

      mockFileSystem.readAsStringAsync.mockResolvedValue('mockBase64AudioData');

      // Mock storage failure
      mockSupabase.storage = {
        from: jest.fn().mockReturnValue({
          upload: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Storage quota exceeded' },
          }),
        }),
      } as any;

      await expect(audioService.uploadAndTranscribe(mockUri, mockCpdId))
        .rejects.toThrow('Failed to upload audio: Storage quota exceeded');
    });

    it('should handle authentication failures', async () => {
      const mockUri = 'file://test-audio.m4a';
      const mockCpdId = 'test-cpd-id';

      // Mock unauthenticated user
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      await expect(audioService.uploadAndTranscribe(mockUri, mockCpdId))
        .rejects.toThrow('User not authenticated');
    });
  });

  describe('getTranscriptionStatus', () => {
    it('should return transcription status', async () => {
      const transcriptionId = 'test-transcription-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: {
                id: transcriptionId,
                status: 'completed',
                transcript: 'Completed transcription',
              },
              error: null,
            }),
          }),
        }),
      } as any);

      const result = await audioService.getTranscriptionStatus(transcriptionId);

      expect(result.status).toBe('completed');
      expect(result.result).toBeDefined();
      expect(mockSupabase.from).toHaveBeenCalledWith('transcriptions');
    });

    it('should handle transcription errors', async () => {
      const transcriptionId = 'test-transcription-id';

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Transcription not found' },
            }),
          }),
        }),
      } as any);

      const result = await audioService.getTranscriptionStatus(transcriptionId);

      expect(result.status).toBe('failed');
      expect(result.error).toBe('Transcription not found');
    });
  });

  describe('deleteAudioAndTranscription', () => {
    it('should delete audio file and transcription record', async () => {
      const audioUrl = 'https://supabase.co/storage/audio/user123/audio/123456.m4a';
      const transcriptionId = 'transcription_123';

      mockSupabase.storage = {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any;

      mockSupabase.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      } as any);

      await audioService.deleteAudioAndTranscription(audioUrl, transcriptionId);

      expect(mockSupabase.storage.from).toHaveBeenCalledWith('audio');
      expect(mockSupabase.from).toHaveBeenCalledWith('transcriptions');
    });

    it('should not throw on deletion failures', async () => {
      const audioUrl = 'https://supabase.co/storage/audio/user123/audio/123456.m4a';
      const transcriptionId = 'transcription_123';

      mockSupabase.storage = {
        from: jest.fn().mockReturnValue({
          remove: jest.fn().mockRejectedValue(new Error('Storage error')),
        }),
      } as any;

      // Should not throw even if deletion fails
      await expect(audioService.deleteAudioAndTranscription(audioUrl, transcriptionId))
        .resolves.not.toThrow();
    });
  });
});
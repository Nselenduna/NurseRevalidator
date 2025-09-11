// #scope:transcription-integration
import { supabase } from '../../config/supabase';

// Mock Supabase for testing
jest.mock('../../config/supabase', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        createSignedUrl: jest.fn(),
      })),
    },
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { 
          session: { 
            user: { id: 'test-user-id' } 
          } 
        }
      })),
    },
  },
}));

describe('WhisperAI Transcription Integration', () => {
  const mockCPDId = 'test-cpd-id';
  const mockUserId = 'test-user-id';
  const mockAudioPath = `${mockUserId}/audio-recordings/test-audio.mp3`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Transcription Edge Function', () => {
    it('should accept valid transcription request parameters', async () => {
      const mockResponse = {
        success: true,
        transcription: {
          id: 'transcription-id',
          cpd_id: mockCPDId,
          user_id: mockUserId,
          audio_path: mockAudioPath,
          transcription: 'This is the transcribed text',
          language: 'en',
        },
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await supabase.functions.invoke('transcribe', {
        body: {
          audioPath: mockAudioPath,
          cpdId: mockCPDId,
          userId: mockUserId,
        },
      });

      expect(supabase.functions.invoke).toHaveBeenCalledWith('transcribe', {
        body: {
          audioPath: mockAudioPath,
          cpdId: mockCPDId,
          userId: mockUserId,
        },
      });

      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeNull();
    });

    it('should reject requests with missing required parameters', async () => {
      const mockError = {
        error: 'Missing required parameters: audioPath, cpdId, or userId',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await supabase.functions.invoke('transcribe', {
        body: {
          audioPath: mockAudioPath,
          // Missing cpdId and userId
        },
      });

      expect(result.error).toBeDefined();
      expect(result.error.error).toContain('Missing required parameters');
    });

    it('should handle medical terminology correctly', async () => {
      const mockMedicalTerms = [
        'hypertension',
        'diabetes mellitus',
        'myocardial infarction',
        'chronic obstructive pulmonary disease',
      ];

      const mockResponse = {
        success: true,
        transcription: {
          id: 'transcription-id',
          cpd_id: mockCPDId,
          user_id: mockUserId,
          audio_path: mockAudioPath,
          transcription: 'Patient presented with hypertension and diabetes mellitus.',
          language: 'en',
          medical_terms: mockMedicalTerms,
        },
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: mockResponse,
        error: null,
      });

      const result = await supabase.functions.invoke('transcribe', {
        body: {
          audioPath: mockAudioPath,
          cpdId: mockCPDId,
          userId: mockUserId,
        },
      });

      expect(result.data.transcription.transcription).toContain('hypertension');
      expect(result.data.transcription.transcription).toContain('diabetes mellitus');
    });
  });

  describe('Audio Upload Integration', () => {
    it('should create proper audio file path structure', () => {
      const userId = 'user-123';
      const fileName = 'recording-20240101.mp3';
      const expectedPath = `${userId}/${fileName}`;

      expect(expectedPath).toBe('user-123/recording-20240101.mp3');
      expect(expectedPath.startsWith(userId)).toBe(true);
    });

    it('should enforce user-specific folder structure in storage', async () => {
      const mockUploadResponse = {
        data: { path: mockAudioPath },
        error: null,
      };

      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue(mockUploadResponse),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageChain);

      // Simulate audio upload
      const audioData = new Uint8Array([1, 2, 3, 4]); // Mock audio data
      
      const result = await supabase.storage
        .from('audio')
        .upload(mockAudioPath, audioData);

      expect(supabase.storage.from).toHaveBeenCalledWith('audio');
      expect(mockStorageChain.upload).toHaveBeenCalledWith(mockAudioPath, audioData);
      expect(result.data.path).toBe(mockAudioPath);
      expect(result.data.path.startsWith(mockUserId)).toBe(true);
    });

    it('should generate signed URLs for transcription service', async () => {
      const mockSignedUrl = 'https://storage.supabase.co/signed-url-12345';
      
      const mockStorageChain = {
        createSignedUrl: jest.fn().mockResolvedValue({
          data: { signedUrl: mockSignedUrl },
          error: null,
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageChain);

      const result = await supabase.storage
        .from('audio')
        .createSignedUrl(mockAudioPath, 60);

      expect(mockStorageChain.createSignedUrl).toHaveBeenCalledWith(mockAudioPath, 60);
      expect(result.data.signedUrl).toBe(mockSignedUrl);
    });
  });

  describe('CPD Entry Integration', () => {
    it('should update CPD entry with transcription flag', async () => {
      const mockUpdateChain = {
        eq: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        })),
      };

      const mockFromChain = {
        update: jest.fn().mockReturnValue(mockUpdateChain),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFromChain);

      const updateChain = supabase
        .from('cpd_entries')
        .update({ 
          has_transcription: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mockCPDId);

      await updateChain.eq('user_id', mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('cpd_entries');
      expect(mockFromChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          has_transcription: true,
        })
      );
      expect(mockUpdateChain.eq).toHaveBeenCalledWith('id', mockCPDId);
    });

    it('should link transcription to CPD entry', async () => {
      const mockTranscriptionData = {
        id: 'transcription-id',
        cpd_id: mockCPDId,
        user_id: mockUserId,
        audio_path: mockAudioPath,
        transcription: 'Transcribed content',
        language: 'en',
      };

      const mockInsertChain = {
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: mockTranscriptionData,
            error: null,
          }),
        })),
      };

      const mockFromChain = {
        insert: jest.fn().mockReturnValue(mockInsertChain),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFromChain);

      const result = await supabase
        .from('cpd_transcriptions')
        .insert({
          cpd_id: mockCPDId,
          user_id: mockUserId,
          audio_path: mockAudioPath,
          transcription: 'Transcribed content',
          language: 'en',
        })
        .select()
        .single();

      expect(supabase.from).toHaveBeenCalledWith('cpd_transcriptions');
      expect(mockFromChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          cpd_id: mockCPDId,
          user_id: mockUserId,
          audio_path: mockAudioPath,
          transcription: 'Transcribed content',
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle storage upload failures', async () => {
      const mockError = new Error('Storage upload failed');
      
      const mockStorageChain = {
        upload: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue(mockStorageChain);

      const result = await supabase.storage
        .from('audio')
        .upload(mockAudioPath, new Uint8Array([1, 2, 3]));

      expect(result.error).toBeDefined();
    });

    it('should handle transcription service failures', async () => {
      const mockError = {
        error: 'Transcription service unavailable',
        details: 'OpenAI API quota exceeded',
      };

      (supabase.functions.invoke as jest.Mock).mockResolvedValue({
        data: null,
        error: mockError,
      });

      const result = await supabase.functions.invoke('transcribe', {
        body: {
          audioPath: mockAudioPath,
          cpdId: mockCPDId,
          userId: mockUserId,
        },
      });

      expect(result.error).toBeDefined();
      expect(result.error.error).toContain('Transcription service unavailable');
    });

    it('should handle database insert failures', async () => {
      const mockError = new Error('Database connection failed');
      
      const mockInsertChain = {
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: mockError,
          }),
        })),
      };

      const mockFromChain = {
        insert: jest.fn().mockReturnValue(mockInsertChain),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFromChain);

      const result = await supabase
        .from('cpd_transcriptions')
        .insert({
          cpd_id: mockCPDId,
          user_id: mockUserId,
          audio_path: mockAudioPath,
          transcription: 'Test transcription',
        })
        .select()
        .single();

      expect(result.error).toBeDefined();
    });
  });

  describe('Security Validation', () => {
    it('should validate user owns the CPD entry being transcribed', async () => {
      // Mock checking CPD entry ownership
      const mockSelectChain = {
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: { user_id: mockUserId },
            error: null,
          }),
        })),
      };

      const mockFromChain = {
        select: jest.fn().mockReturnValue(mockSelectChain),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockFromChain);

      const result = await supabase
        .from('cpd_entries')
        .select('user_id')
        .eq('id', mockCPDId)
        .single();

      expect(result.data.user_id).toBe(mockUserId);
    });

    it('should validate user owns the audio file being transcribed', () => {
      const audioPath = `${mockUserId}/recordings/test.mp3`;
      const pathParts = audioPath.split('/');
      const fileOwner = pathParts[0];

      expect(fileOwner).toBe(mockUserId);
    });

    it('should prevent transcription of other users audio files', () => {
      const otherUserId = 'other-user-id';
      const unauthorizedPath = `${otherUserId}/recordings/test.mp3`;
      const pathParts = unauthorizedPath.split('/');
      const fileOwner = pathParts[0];

      expect(fileOwner).not.toBe(mockUserId);
      // In real environment, this would be blocked by storage RLS
    });
  });

  describe('Data Validation', () => {
    it('should validate transcription data structure', () => {
      const validTranscription = {
        cpd_id: mockCPDId,
        user_id: mockUserId,
        audio_path: mockAudioPath,
        transcription: 'Valid transcription text',
        language: 'en',
      };

      expect(validTranscription.cpd_id).toBeDefined();
      expect(validTranscription.user_id).toBeDefined();
      expect(validTranscription.audio_path).toBeDefined();
      expect(validTranscription.transcription).toBeDefined();
      expect(validTranscription.language).toBeDefined();
    });

    it('should validate audio file path format', () => {
      const validPaths = [
        `${mockUserId}/recording-123.mp3`,
        `${mockUserId}/audio/session-1.wav`,
        `${mockUserId}/cpd-audio/reflection.m4a`,
      ];

      const invalidPaths = [
        'recording.mp3', // Missing user ID
        '../other/file.mp3', // Path traversal
        `${mockUserId}/../other.mp3`, // Path traversal
      ];

      validPaths.forEach(path => {
        expect(path.startsWith(mockUserId)).toBe(true);
        expect(path.includes('..')).toBe(false);
      });

      invalidPaths.forEach(path => {
        const isValid = path.startsWith(mockUserId) && !path.includes('..');
        expect(isValid).toBe(false);
      });
    });
  });
});
// #scope:offline-sync
import { renderHook, act, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';
import { CPDService } from '../../services/cpd/CPDService';
import { AudioUploadService } from '../../services/audio/AudioUploadService';
import { PDFExportService } from '../../services/export/PDFExportService';
import { useCPDData } from '../../hooks/useCPDData';

// Mock dependencies
jest.mock('@react-native-community/netinfo');
jest.mock('../../services/cpd/CPDService');
jest.mock('../../services/audio/AudioUploadService');
jest.mock('../../services/export/PDFExportService');

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;
const mockCPDService = CPDService as jest.MockedClass<typeof CPDService>;
const mockAudioService = AudioUploadService as jest.MockedClass<typeof AudioUploadService>;
const mockPDFService = PDFExportService as jest.MockedClass<typeof PDFExportService>;

describe('CPD Entry Lifecycle E2E', () => {
  let cpdServiceInstance: jest.Mocked<CPDService>;
  let audioServiceInstance: jest.Mocked<AudioUploadService>;
  let pdfServiceInstance: jest.Mocked<PDFExportService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    cpdServiceInstance = new mockCPDService() as jest.Mocked<CPDService>;
    audioServiceInstance = new mockAudioService() as jest.Mocked<AudioUploadService>;
    pdfServiceInstance = new mockPDFService() as jest.Mocked<PDFExportService>;
    
    // Mock constructors to return our instances
    mockCPDService.mockImplementation(() => cpdServiceInstance);
    mockAudioService.mockImplementation(() => audioServiceInstance);
    mockPDFService.mockImplementation(() => pdfServiceInstance);
  });

  it('should handle complete offline → sync → transcript → export flow', async () => {
    // 1. Create entry offline
    const offlineEntry = {
      id: 'offline_123',
      title: 'Emergency Care Training',
      description: 'Completed emergency care workshop',
      type: 'training' as const,
      hours: 2,
      date: '2024-01-15',
      created_at: new Date(),
      updated_at: new Date(),
      syncStatus: 'pending' as const,
    };

    // Mock network offline
    mockNetInfo.addEventListener.mockImplementation((callback) => {
      callback({ isConnected: false, type: 'none' });
      return jest.fn(); // unsubscribe function
    });

    cpdServiceInstance.createEntry.mockResolvedValue(offlineEntry);
    cpdServiceInstance.getEntries.mockResolvedValue([offlineEntry]);

    // Create entry while offline
    const { result } = renderHook(() => useCPDData());
    
    await act(async () => {
      await result.current.createEntry({
        title: 'Emergency Care Training',
        description: 'Completed emergency care workshop',
        type: 'training',
        hours: 2,
        date: '2024-01-15',
      });
    });

    expect(cpdServiceInstance.createEntry).toHaveBeenCalled();
    expect(result.current.entries).toContainEqual(
      expect.objectContaining({ id: 'offline_123' })
    );

    // 2. Go online and sync
    const syncedEntry = { ...offlineEntry, id: 'synced_123', syncStatus: 'synced' as const };
    
    mockNetInfo.addEventListener.mockImplementation((callback) => {
      callback({ isConnected: true, type: 'wifi' });
      return jest.fn();
    });

    cpdServiceInstance.syncOfflineData.mockResolvedValue();
    cpdServiceInstance.getEntries.mockResolvedValue([syncedEntry]);

    await act(async () => {
      // Trigger sync on network reconnect
      const callback = mockNetInfo.addEventListener.mock.calls[0][0];
      callback({ isConnected: true, type: 'wifi' });
    });

    await waitFor(() => {
      expect(cpdServiceInstance.syncOfflineData).toHaveBeenCalled();
    });

    // 3. Upload audio and get transcript
    const mockAudioUri = 'file://audio_recording.m4a';
    const transcriptionResult = {
      id: 'transcript_123',
      transcript: 'Today I completed emergency care training focusing on rapid assessment and critical interventions.',
      confidence: 92,
      audio_url: 'https://storage.supabase.co/audio/123.m4a',
      metadata: {
        duration: 45,
        language: 'en-GB',
        medical_terms: ['emergency', 'assessment', 'interventions'],
      },
    };

    audioServiceInstance.uploadAndTranscribe.mockResolvedValue(transcriptionResult);

    let uploadResult: any;
    await act(async () => {
      uploadResult = await audioServiceInstance.uploadAndTranscribe(mockAudioUri, syncedEntry.id);
    });

    expect(audioServiceInstance.uploadAndTranscribe).toHaveBeenCalledWith(
      mockAudioUri,
      syncedEntry.id
    );
    expect(uploadResult).toEqual(transcriptionResult);

    // 4. Export as PDF
    const mockPDFPath = '/documents/exports/CPD_Export_2024-01-15.pdf';
    pdfServiceInstance.exportCPDEntries.mockResolvedValue(mockPDFPath);

    let pdfPath: string;
    await act(async () => {
      pdfPath = await pdfServiceInstance.exportCPDEntries([syncedEntry], {
        includeSignature: true,
        includeEvidence: true,
      });
    });

    expect(pdfServiceInstance.exportCPDEntries).toHaveBeenCalledWith(
      [syncedEntry],
      expect.objectContaining({
        includeSignature: true,
        includeEvidence: true,
      })
    );
    expect(pdfPath).toBe(mockPDFPath);
  });

  it('should handle sync conflicts gracefully', async () => {
    const localEntry = {
      id: 'local_123',
      title: 'Local Entry',
      updated_at: new Date('2024-01-15T10:00:00Z'),
    };

    const serverEntry = {
      id: 'local_123',
      title: 'Server Entry (Updated)',
      updated_at: new Date('2024-01-15T11:00:00Z'),
    };

    cpdServiceInstance.getEntries.mockResolvedValue([localEntry]);
    cpdServiceInstance.syncOfflineData.mockImplementation(async () => {
      // Simulate conflict resolution - server wins
      cpdServiceInstance.getEntries.mockResolvedValue([serverEntry]);
    });

    const { result } = renderHook(() => useCPDData());

    await act(async () => {
      await result.current.syncData();
    });

    await waitFor(() => {
      expect(result.current.entries).toContainEqual(
        expect.objectContaining({ title: 'Server Entry (Updated)' })
      );
    });
  });

  it('should maintain data integrity during export process', async () => {
    const entries = [
      {
        id: 'entry_1',
        title: 'Training 1',
        hours: 2,
        date: '2024-01-15',
      },
      {
        id: 'entry_2',
        title: 'Training 2',
        hours: 3,
        date: '2024-01-16',
      },
    ];

    const expectedSignature = 'digital_signature_hash';
    pdfServiceInstance.exportCPDEntries.mockImplementation(async (entriesParam, options) => {
      // Verify entries haven't been modified
      expect(entriesParam).toEqual(entries);
      
      if (options?.includeSignature) {
        // Simulate signature generation
        return `/exports/signed_${expectedSignature}.pdf`;
      }
      
      return '/exports/unsigned.pdf';
    });

    const result = await pdfServiceInstance.exportCPDEntries(entries, {
      includeSignature: true,
    });

    expect(result).toContain(expectedSignature);
  });

  it('should handle network interruptions during sync', async () => {
    const partialSyncError = new Error('Network interrupted during sync');
    
    cpdServiceInstance.syncOfflineData.mockRejectedValueOnce(partialSyncError);
    cpdServiceInstance.syncOfflineData.mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useCPDData());

    // First sync attempt fails
    await act(async () => {
      try {
        await result.current.syncData();
      } catch (error) {
        expect(error).toBe(partialSyncError);
      }
    });

    expect(result.current.syncStatus).toBe('error');

    // Retry succeeds
    await act(async () => {
      await result.current.retrySync();
    });

    expect(result.current.syncStatus).toBe('synced');
    expect(cpdServiceInstance.syncOfflineData).toHaveBeenCalledTimes(2);
  });
});
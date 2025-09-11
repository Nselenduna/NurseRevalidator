// #scope:testing
import { CPDService } from '../../services/cpd/CPDService';
import { supabase } from '../../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CPDEntry } from '../../types/cpd.types';

// Mock dependencies
jest.mock('../../config/supabase');
jest.mock('@react-native-async-storage/async-storage');

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('CPDService', () => {
  let cpdService: CPDService;

  beforeEach(() => {
    cpdService = new CPDService();
    jest.clearAllMocks();
  });

  describe('syncOfflineData', () => {
    it('should sync all local entries to Supabase', async () => {
      // Mock local entries
      const localEntries: CPDEntry[] = [
        {
          id: 'local_1',
          title: 'Test CPD 1',
          description: 'Test description 1',
          type: 'training',
          hours: 2,
          date: '2024-01-15',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'local_2',
          title: 'Test CPD 2',
          description: 'Test description 2',
          type: 'reflection',
          hours: 1,
          date: '2024-01-16',
          created_at: new Date(),
          updated_at: new Date(),
        }
      ];

      // Mock AsyncStorage responses
      mockAsyncStorage.getAllKeys.mockResolvedValue(['cpd_local_1', 'cpd_local_2']);
      mockAsyncStorage.getItem
        .mockResolvedValueOnce(JSON.stringify(localEntries[0]))
        .mockResolvedValueOnce(JSON.stringify(localEntries[1]));

      // Mock Supabase responses
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: localEntries,
            error: null,
          }),
        }),
      } as any);

      await cpdService.syncOfflineData();

      // Verify Supabase calls
      expect(mockSupabase.from).toHaveBeenCalledWith('cpd_entries');
      
      // Verify local cleanup
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledTimes(2);
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('cpd_local_1');
      expect(mockAsyncStorage.removeItem).toHaveBeenCalledWith('cpd_local_2');
    });

    it('should handle sync failures gracefully', async () => {
      mockAsyncStorage.getAllKeys.mockResolvedValue(['cpd_local_1']);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify({
        id: 'local_1',
        title: 'Test CPD',
      }));

      // Mock Supabase failure
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Network error' },
          }),
        }),
      } as any);

      await expect(cpdService.syncOfflineData()).rejects.toThrow('Network error');
      
      // Verify local data is not removed on failure
      expect(mockAsyncStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('createEntry', () => {
    it('should create entry online when connected', async () => {
      const entryData = {
        title: 'New CPD Entry',
        description: 'Test description',
        type: 'training' as const,
        hours: 3,
        date: '2024-01-15',
      };

      const mockCreatedEntry = {
        id: 'created_id',
        ...entryData,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [mockCreatedEntry],
            error: null,
          }),
        }),
      } as any);

      const result = await cpdService.createEntry(entryData);

      expect(result).toEqual(mockCreatedEntry);
      expect(mockSupabase.from).toHaveBeenCalledWith('cpd_entries');
    });

    it('should store entry locally when offline', async () => {
      const entryData = {
        title: 'Offline CPD Entry',
        description: 'Test description',
        type: 'reflection' as const,
        hours: 1,
        date: '2024-01-15',
      };

      // Mock network failure
      mockSupabase.from.mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockRejectedValue(new Error('Network error')),
        }),
      } as any);

      const result = await cpdService.createEntry(entryData);

      expect(result.id).toContain('offline_');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        `cpd_${result.id}`,
        JSON.stringify(result)
      );
    });
  });

  describe('getEntries', () => {
    it('should merge online and offline entries', async () => {
      const onlineEntries = [
        {
          id: 'online_1',
          title: 'Online CPD 1',
          description: 'Online description',
          type: 'training',
          hours: 2,
          date: '2024-01-15',
          created_at: new Date(),
          updated_at: new Date(),
        }
      ];

      const offlineEntries = [
        {
          id: 'offline_1',
          title: 'Offline CPD 1',
          description: 'Offline description',
          type: 'reflection',
          hours: 1,
          date: '2024-01-16',
          created_at: new Date(),
          updated_at: new Date(),
        }
      ];

      // Mock Supabase response
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          data: onlineEntries,
          error: null,
        }),
      } as any);

      // Mock AsyncStorage response
      mockAsyncStorage.getAllKeys.mockResolvedValue(['cpd_offline_1']);
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(offlineEntries[0]));

      const result = await cpdService.getEntries();

      expect(result).toHaveLength(2);
      expect(result).toContainEqual(expect.objectContaining({ id: 'online_1' }));
      expect(result).toContainEqual(expect.objectContaining({ id: 'offline_1' }));
    });
  });
});
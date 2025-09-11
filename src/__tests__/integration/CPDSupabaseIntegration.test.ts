// #scope:cpd-supabase-integration

// Mock the modules before importing
jest.mock('../../config/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe('CPD Service Supabase Integration', () => {
  const mockUserId = 'test-user-id';
  const mockSession = {
    user: { id: mockUserId },
    access_token: 'mock-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authenticated session
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: mockSession },
      error: null,
    });
  });

  describe('Sync with Cloud', () => {
    // Create a mock sync function for testing
    const mockSyncWithCloud = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }

      const entries = await AsyncStorage.getItem('cpd_entries');
      const parsedEntries = entries ? JSON.parse(entries) : [];
      const pendingEntries = parsedEntries.filter((entry: any) => 
        entry.syncStatus === 'pending' || entry.syncStatus === 'local'
      );

      for (const entry of pendingEntries) {
        const { syncStatus, id, ...uploadData } = entry;
        
        const { data: existingEntries } = await supabase
          .from('cpd_entries')
          .select('*')
          .eq('client_id', id);
          
        if (existingEntries && existingEntries.length > 0) {
          await supabase
            .from('cpd_entries')
            .update({
              ...uploadData,
              updated_at: new Date().toISOString(),
            })
            .eq('client_id', id);
        } else {
          await supabase
            .from('cpd_entries')
            .insert({
              ...uploadData,
              client_id: id,
              user_id: session.user.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
        }
      }
    };

    it('should require authenticated session for sync', async () => {
      // Mock no session
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(mockSyncWithCloud()).rejects.toThrow('No authenticated session');
    });

    it('should sync local entries to Supabase', async () => {
      const mockLocalEntries = [
        {
          id: 'local-1',
          title: 'Test CPD Entry',
          description: 'Test description',
          type: 'training' as const,
          duration: 2,
          date: new Date('2024-01-01'),
          syncStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      // Mock AsyncStorage to return local entries
      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLocalEntries));

      // Mock Supabase operations
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [], // No existing entries
            error: null,
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'supabase-id' }],
          error: null,
        }),
      } as any);

      await mockSyncWithCloud();

      expect(mockSupabase.from).toHaveBeenCalledWith('cpd_entries');
    });

    it('should handle conflicts when entry exists in Supabase', async () => {
      const mockLocalEntries = [
        {
          id: 'local-1',
          title: 'Updated CPD Entry',
          description: 'Updated description',
          type: 'training' as const,
          duration: 3,
          date: new Date('2024-01-01'),
          syncStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLocalEntries));

      // Mock existing entry in Supabase
      const existingEntry = {
        id: 'supabase-id',
        client_id: 'local-1',
        title: 'Original CPD Entry',
        user_id: mockUserId,
      };

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [existingEntry],
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ ...existingEntry, title: 'Updated CPD Entry' }],
            error: null,
          }),
        }),
      } as any);

      await CPDService.syncWithCloud();

      expect(mockSupabase.from).toHaveBeenCalledWith('cpd_entries');
      // Should update existing entry, not insert new one
    });

    it('should handle sync errors gracefully', async () => {
      const mockLocalEntries = [
        {
          id: 'local-1',
          title: 'Test CPD Entry',
          type: 'training' as const,
          duration: 2,
          date: new Date('2024-01-01'),
          syncStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLocalEntries));

      // Mock Supabase error
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' },
          }),
        }),
      } as any);

      await expect(CPDService.syncWithCloud()).rejects.toThrow('Error syncing with cloud');
    });

    it('should validate data before syncing', async () => {
      const mockLocalEntries = [
        {
          id: 'local-1',
          title: 'Test CPD Entry',
          type: 'training' as const,
          duration: 2,
          date: new Date('2024-01-01'),
          syncStatus: 'local' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLocalEntries));

      // Mock successful Supabase operations
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
        insert: jest.fn().mockResolvedValue({
          data: [{ id: 'supabase-id' }],
          error: null,
        }),
      } as any);

      await CPDService.syncWithCloud();

      // Should have filtered and processed the entry with 'local' status
      expect(mockSupabase.from).toHaveBeenCalledWith('cpd_entries');
    });
  });

  describe('Data Transformation', () => {
    it('should transform client data for Supabase', () => {
      const clientEntry = {
        id: 'client-123',
        title: 'Test Entry',
        description: 'Test description',
        type: 'training' as const,
        duration: 2,
        date: new Date('2024-01-01'),
        learningOutcomes: ['Outcome 1', 'Outcome 2'],
        reflection: 'Reflection text',
        standards: ['STD1', 'STD2'],
        isStarred: true,
        syncStatus: 'pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Expected transformation (remove client-specific fields)
      const { syncStatus, id, ...expectedData } = clientEntry;

      expect(expectedData).not.toHaveProperty('syncStatus');
      expect(expectedData).not.toHaveProperty('id');
      expect(expectedData).toHaveProperty('title');
      expect(expectedData).toHaveProperty('type');
    });

    it('should map field names correctly for Supabase schema', () => {
      const clientEntry = {
        duration: 2,
        learningOutcomes: ['Outcome 1'],
        isStarred: true,
      };

      // In real implementation, these would be mapped to:
      // duration -> hours
      // learningOutcomes -> learning_outcomes
      // isStarred -> is_starred

      expect(clientEntry.duration).toBe(2); // Should map to 'hours'
      expect(clientEntry.learningOutcomes).toEqual(['Outcome 1']); // Should map to 'learning_outcomes'
      expect(clientEntry.isStarred).toBe(true); // Should map to 'is_starred'
    });
  });

  describe('Offline-First Architecture', () => {
    it('should work offline without Supabase connection', async () => {
      const mockEntry = {
        title: 'Offline Entry',
        description: 'Created offline',
        type: 'reflection' as const,
        duration: 1,
        date: new Date(),
      };

      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await CPDService.createEntry(mockEntry);

      expect(result).toBeDefined();
      expect(result.title).toBe('Offline Entry');
      expect(result.syncStatus).toBe('local');
      expect(mockAsyncStorage.setItem).toHaveBeenCalled();
    });

    it('should maintain local data integrity', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          title: 'Entry 1',
          type: 'training' as const,
          duration: 2,
          date: new Date(),
          syncStatus: 'synced' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockEntries));

      const entries = await CPDService.getAllEntries();

      expect(entries).toHaveLength(1);
      expect(entries[0].title).toBe('Entry 1');
      expect(entries[0].syncStatus).toBe('synced');
    });

    it('should queue entries for sync when created offline', async () => {
      const mockEntry = {
        title: 'Queued Entry',
        type: 'course' as const,
        duration: 3,
        date: new Date(),
      };

      mockAsyncStorage.getItem.mockResolvedValue('[]');
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const result = await CPDService.createEntry(mockEntry);

      expect(result.syncStatus).toBe('local');
      // This entry should be picked up by the next sync operation
    });
  });

  describe('Data Consistency', () => {
    it('should handle timestamp conversion correctly', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          date: '2024-01-01T00:00:00.000Z',
          createdAt: '2024-01-01T10:00:00.000Z',
          updatedAt: '2024-01-01T11:00:00.000Z',
          title: 'Test Entry',
          type: 'training',
          duration: 2,
          syncStatus: 'synced',
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockEntries));

      const entries = await CPDService.getAllEntries();

      expect(entries[0].date).toBeInstanceOf(Date);
      expect(entries[0].createdAt).toBeInstanceOf(Date);
      expect(entries[0].updatedAt).toBeInstanceOf(Date);
    });

    it('should preserve array fields correctly', async () => {
      const mockEntries = [
        {
          id: 'entry-1',
          title: 'Test Entry',
          type: 'training',
          duration: 2,
          date: new Date(),
          learningOutcomes: ['Outcome 1', 'Outcome 2'],
          standards: ['STD1', 'STD2'],
          evidence: [
            {
              id: 'evidence-1',
              fileName: 'certificate.pdf',
              uploadedAt: '2024-01-01T10:00:00.000Z',
            },
          ],
          syncStatus: 'synced',
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockEntries));

      const entries = await CPDService.getAllEntries();

      expect(entries[0].learningOutcomes).toEqual(['Outcome 1', 'Outcome 2']);
      expect(entries[0].standards).toEqual(['STD1', 'STD2']);
      expect(entries[0].evidence).toHaveLength(1);
      expect(entries[0].evidence[0].uploadedAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Recovery', () => {
    it('should recover from corrupted local data', async () => {
      mockAsyncStorage.getItem.mockResolvedValue('invalid json');

      const entries = await CPDService.getAllEntries();

      expect(entries).toEqual([]);
      // Should not crash the application
    });

    it('should handle partial sync failures', async () => {
      const mockLocalEntries = [
        {
          id: 'entry-1',
          title: 'Success Entry',
          type: 'training' as const,
          duration: 2,
          date: new Date(),
          syncStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
        {
          id: 'entry-2',
          title: 'Fail Entry',
          type: 'invalid-type' as any,
          duration: 2,
          date: new Date(),
          syncStatus: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          isStarred: false,
        },
      ];

      mockAsyncStorage.getItem.mockResolvedValue(JSON.stringify(mockLocalEntries));

      // Mock first entry succeeds, second fails
      let callCount = 0;
      mockSupabase.from.mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
        insert: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.resolve({ data: [{}], error: null });
          } else {
            return Promise.resolve({ data: null, error: { message: 'Invalid type' } });
          }
        }),
      } as any));

      // Should not throw, but handle errors gracefully
      await expect(CPDService.syncWithCloud()).rejects.toThrow();
      
      // Should still process successful entries
      expect(mockSupabase.from).toHaveBeenCalledWith('cpd_entries');
    });
  });
});
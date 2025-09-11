import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../config/supabase';
import { 
  CPDEntry, 
  CPDServiceInterface, 
  CPDType, 
  CPDStats,
  CPDFilters,
  CPDSearchOptions
} from '../../types/cpd.types';

const CPD_ENTRIES_KEY = 'cpd_entries';
const CPD_STATS_KEY = 'cpd_stats';

class CPDService implements CPDServiceInterface {
  
  async getAllEntries(): Promise<CPDEntry[]> {
    try {
      const data = await AsyncStorage.getItem(CPD_ENTRIES_KEY);
      if (!data) return [];
      
      const entries = JSON.parse(data);
      return entries.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
        audioRecording: entry.audioRecording ? {
          ...entry.audioRecording,
          createdAt: new Date(entry.audioRecording.createdAt),
        } : undefined,
        evidence: entry.evidence?.map((evidence: any) => ({
          ...evidence,
          uploadedAt: new Date(evidence.uploadedAt),
        })) || [],
      }));
    } catch (error) {
      console.error('Error getting CPD entries:', error);
      return [];
    }
  }

  async getEntry(id: string): Promise<CPDEntry | null> {
    try {
      const entries = await this.getAllEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Error getting CPD entry:', error);
      return null;
    }
  }

  async createEntry(entryData: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<CPDEntry> {
    try {
      const entries = await this.getAllEntries();
      const newEntry: CPDEntry = {
        id: this.generateId(),
        ...entryData,
        createdAt: new Date(),
        updatedAt: new Date(),
        syncStatus: entryData.syncStatus || 'local',
        isStarred: entryData.isStarred || false,
      };
      
      entries.push(newEntry);
      await AsyncStorage.setItem(CPD_ENTRIES_KEY, JSON.stringify(entries));
      
      return newEntry;
    } catch (error) {
      console.error('Error creating CPD entry:', error);
      throw error;
    }
  }

  async updateEntry(id: string, updates: Partial<CPDEntry>): Promise<CPDEntry> {
    try {
      const entries = await this.getAllEntries();
      const index = entries.findIndex(entry => entry.id === id);
      
      if (index === -1) {
        throw new Error('CPD entry not found');
      }
      
      const updatedEntry = {
        ...entries[index],
        ...updates,
        id, // Preserve original ID
        updatedAt: new Date(),
      };
      
      entries[index] = updatedEntry;
      await AsyncStorage.setItem(CPD_ENTRIES_KEY, JSON.stringify(entries));
      
      return updatedEntry;
    } catch (error) {
      console.error('Error updating CPD entry:', error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const filteredEntries = entries.filter(entry => entry.id !== id);
      await AsyncStorage.setItem(CPD_ENTRIES_KEY, JSON.stringify(filteredEntries));
    } catch (error) {
      console.error('Error deleting CPD entry:', error);
      throw error;
    }
  }

  async searchEntries(query: string): Promise<CPDEntry[]> {
    try {
      const entries = await this.getAllEntries();
      const lowerQuery = query.toLowerCase();
      
      return entries.filter(entry =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.description?.toLowerCase().includes(lowerQuery) ||
        entry.learningOutcomes?.some(outcome => 
          outcome.toLowerCase().includes(lowerQuery)
        ) ||
        entry.type.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching CPD entries:', error);
      return [];
    }
  }

  async getEntriesByType(type: CPDType): Promise<CPDEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => entry.type === type);
    } catch (error) {
      console.error('Error getting entries by type:', error);
      return [];
    }
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<CPDEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting entries by date range:', error);
      return [];
    }
  }

  async exportEntries(format: 'pdf' | 'csv'): Promise<string> {
    try {
      // This would be implemented with actual export libraries
      const entries = await this.getAllEntries();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `cpd_entries_${timestamp}.${format}`;
      
      console.log(`Exporting ${entries.length} CPD entries to ${format.toUpperCase()}`);
      return `file:///exports/${filename}`;
    } catch (error) {
      console.error('Error exporting CPD entries:', error);
      throw error;
    }
  }

  async syncWithCloud(): Promise<void> {
    try {
      // Real cloud sync with Supabase
      const entries = await this.getAllEntries();
      const pendingEntries = entries.filter(entry => entry.syncStatus === 'pending' || entry.syncStatus === 'local');
      
      // Check Supabase connection before attempting sync
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No authenticated session');
      }
      
      let syncedCount = 0;
      const errors = [];
      
      // Process each pending entry
      for (const entry of pendingEntries) {
        try {
          // Remove client-specific fields before uploading
          const { syncStatus, id, ...uploadData } = entry;
          
          // Check if entry already exists in Supabase (for conflict resolution)
          const { data: existingEntries, error: fetchError } = await supabase
            .from('cpd_entries')
            .select('*')
            .eq('client_id', id);
            
          if (fetchError) {
            errors.push({ id, error: fetchError.message });
            continue;
          }
          
          let result;
          
          if (existingEntries && existingEntries.length > 0) {
            // Update existing entry
            result = await supabase
              .from('cpd_entries')
              .update({
                ...uploadData,
                updated_at: new Date().toISOString(),
              })
              .eq('client_id', id);
          } else {
            // Insert new entry
            result = await supabase
              .from('cpd_entries')
              .insert({
                ...uploadData,
                client_id: id,
                user_id: session.user.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
          }
          
          if (result.error) {
            errors.push({ id, error: result.error.message });
            continue;
          }
          
          // Update local entry status
          await this.updateEntry(entry.id, { syncStatus: 'synced' });
          syncedCount++;
        } catch (entryError) {
          errors.push({ id: entry.id, error: entryError instanceof Error ? entryError.message : 'Unknown error' });
        }
      }
      
      console.log(`Synced ${syncedCount}/${pendingEntries.length} CPD entries with cloud`);
    } catch (error) {
      console.error('Error syncing with cloud:', error);
      throw error;
    }
  }

  // Helper method to generate unique IDs
  private generateId(): string {
    return `cpd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Additional method for screens - getStats() (not in interface but used by screens)
  async getStats(): Promise<CPDStats> {
    try {
      const entries = await this.getAllEntries();
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
      const entriesCount = entries.length;
      
      const thisYearEntries = entries.filter(entry => 
        new Date(entry.date).getFullYear() === currentYear
      );
      const hoursThisYear = thisYearEntries.reduce((sum, entry) => sum + entry.duration, 0);
      
      const lastYearEntries = entries.filter(entry => 
        new Date(entry.date).getFullYear() === lastYear
      );
      const hoursLastYear = lastYearEntries.reduce((sum, entry) => sum + entry.duration, 0);
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      const recentEntries = entries.filter(entry => new Date(entry.date) >= twelveMonthsAgo);
      const averageHoursPerMonth = recentEntries.reduce((sum, entry) => sum + entry.duration, 0) / 12;
      
      const typeDistribution: CPDStats['typeDistribution'] = {
        course: 0,
        conference: 0,
        reflection: 0,
        mentoring: 0,
        other: 0,
      };
      
      entries.forEach(entry => {
        typeDistribution[entry.type] += entry.duration;
      });
      
      const requiredHours = 35;
      const compliancePercentage = Math.min(100, Math.round((hoursThisYear / requiredHours) * 100));
      const hoursNeeded = Math.max(0, requiredHours - hoursThisYear);
      
      const nextRevalidationDate = new Date();
      nextRevalidationDate.setFullYear(nextRevalidationDate.getFullYear() + 3);
      
      return {
        totalHours,
        entriesCount,
        hoursThisYear,
        hoursLastYear,
        averageHoursPerMonth,
        typeDistribution,
        compliancePercentage,
        nextRevalidationDate,
        hoursNeeded,
      };
    } catch (error) {
      console.error('Error calculating CPD stats:', error);
      
      return {
        totalHours: 0,
        entriesCount: 0,
        hoursThisYear: 0,
        hoursLastYear: 0,
        averageHoursPerMonth: 0,
        typeDistribution: {
          course: 0,
          conference: 0,
          reflection: 0,
          mentoring: 0,
          other: 0,
        },
        compliancePercentage: 0,
        nextRevalidationDate: new Date(),
        hoursNeeded: 35,
      };
    }
  }
}

// Create a singleton instance
const cpdServiceInstance = new CPDService();

// Export the class and static wrapper methods for backward compatibility
class CPDServiceStatic {
  static async getAllEntries(): Promise<CPDEntry[]> {
    return cpdServiceInstance.getAllEntries();
  }

  static async getEntry(id: string): Promise<CPDEntry | null> {
    return cpdServiceInstance.getEntry(id);
  }

  static async createEntry(entryData: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<CPDEntry> {
    return cpdServiceInstance.createEntry(entryData);
  }

  static async updateEntry(id: string, updates: Partial<CPDEntry>): Promise<CPDEntry>;
  static async updateEntry(entry: CPDEntry): Promise<CPDEntry>;
  static async updateEntry(idOrEntry: string | CPDEntry, updates?: Partial<CPDEntry>): Promise<CPDEntry> {
    if (typeof idOrEntry === 'string') {
      return cpdServiceInstance.updateEntry(idOrEntry, updates!);
    } else {
      return cpdServiceInstance.updateEntry(idOrEntry.id, idOrEntry);
    }
  }

  static async deleteEntry(id: string): Promise<void> {
    return cpdServiceInstance.deleteEntry(id);
  }

  static async searchEntries(query: string): Promise<CPDEntry[]> {
    return cpdServiceInstance.searchEntries(query);
  }

  static async getEntriesByType(type: CPDType): Promise<CPDEntry[]> {
    return cpdServiceInstance.getEntriesByType(type);
  }

  static async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<CPDEntry[]> {
    return cpdServiceInstance.getEntriesByDateRange(startDate, endDate);
  }

  static async exportEntries(format: 'pdf' | 'csv'): Promise<string> {
    return cpdServiceInstance.exportEntries(format);
  }

  static async syncWithCloud(): Promise<void> {
    return cpdServiceInstance.syncWithCloud();
  }

  static async getStats(): Promise<CPDStats> {
    return cpdServiceInstance.getStats();
  }
}

export default CPDServiceStatic;
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import TranscriptionService from '../transcription/TranscriptionService';
import { 
  CPDEntry, 
  CPDServiceInterface, 
  CPDType, 
  CPDFilters,
  CPDSearchOptions,
  CPDStats,
  NMCCategory 
} from '../../types/cpd.types';

const CPD_ENTRIES_KEY = '@cpd_entries';
const CPD_CATEGORIES_KEY = '@cpd_categories';

class CPDService implements CPDServiceInterface {
  
  private entries: CPDEntry[] = [];
  private categories: NMCCategory[] = [];
  
  constructor() {
    this.initializeCategories();
  }

  // Initialize NMC categories
  private initializeCategories() {
    this.categories = [
      {
        id: 'prioritise_people',
        name: 'Prioritise People',
        description: 'Put the interests of people using services first',
        requiredHours: 12,
      },
      {
        id: 'practise_effectively',
        name: 'Practise Effectively',
        description: 'Practise in a way that is evidence-based and person-centered',
        requiredHours: 12,
      },
      {
        id: 'preserve_safety',
        name: 'Preserve Safety',
        description: 'Be aware of safety and how to respond to risk',
        requiredHours: 6,
      },
      {
        id: 'promote_professionalism',
        name: 'Promote Professionalism',
        description: 'Uphold the reputation of the profession at all times',
        requiredHours: 5,
      },
    ];
  }

  async getAllEntries(): Promise<CPDEntry[]> {
    try {
      if (this.entries.length === 0) {
        await this.loadEntries();
      }
      return [...this.entries].sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Failed to get CPD entries:', error);
      return [];
    }
  }

  async getEntry(id: string): Promise<CPDEntry | null> {
    try {
      const entries = await this.getAllEntries();
      return entries.find(entry => entry.id === id) || null;
    } catch (error) {
      console.error('Failed to get CPD entry:', error);
      return null;
    }
  }

  async createEntry(entryData: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<CPDEntry> {
    try {
      const now = new Date();
      const entry: CPDEntry = {
        ...entryData,
        id: `cpd_${now.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };

      // Auto-generate learning outcomes if not provided and we have a transcript
      if (entry.learningOutcomes.length === 0 && entry.description) {
        const extractedOutcomes = TranscriptionService.extractLearningOutcomes(entry.description);
        if (extractedOutcomes.length > 0) {
          entry.learningOutcomes = extractedOutcomes;
        }
      }

      // Auto-generate title if not provided
      if (!entry.title.trim() && entry.description) {
        entry.title = TranscriptionService.generateSummary(entry.description, 50);
      }

      await this.loadEntries();
      this.entries.push(entry);
      await this.saveEntries();

      return entry;
    } catch (error) {
      console.error('Failed to create CPD entry:', error);
      throw new Error('Failed to save CPD entry');
    }
  }

  async updateEntry(id: string, updates: Partial<CPDEntry>): Promise<CPDEntry> {
    try {
      await this.loadEntries();
      const index = this.entries.findIndex(entry => entry.id === id);
      
      if (index === -1) {
        throw new Error('CPD entry not found');
      }

      const updatedEntry = {
        ...this.entries[index],
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date(),
      };

      this.entries[index] = updatedEntry;
      await this.saveEntries();

      return updatedEntry;
    } catch (error) {
      console.error('Failed to update CPD entry:', error);
      throw error;
    }
  }

  async deleteEntry(id: string): Promise<void> {
    try {
      await this.loadEntries();
      const entryIndex = this.entries.findIndex(entry => entry.id === id);
      
      if (entryIndex === -1) {
        throw new Error('CPD entry not found');
      }

      const entry = this.entries[entryIndex];
      
      // Delete associated audio file if exists
      if (entry.audioRecording?.uri) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(entry.audioRecording.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(entry.audioRecording.uri);
          }
        } catch (fileError) {
          console.warn('Failed to delete audio file:', fileError);
        }
      }

      // Delete evidence files
      for (const evidence of entry.evidence) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(evidence.uri);
          if (fileInfo.exists) {
            await FileSystem.deleteAsync(evidence.uri);
          }
        } catch (fileError) {
          console.warn('Failed to delete evidence file:', fileError);
        }
      }

      this.entries.splice(entryIndex, 1);
      await this.saveEntries();
    } catch (error) {
      console.error('Failed to delete CPD entry:', error);
      throw error;
    }
  }

  async searchEntries(query: string): Promise<CPDEntry[]> {
    try {
      const entries = await this.getAllEntries();
      const lowerQuery = query.toLowerCase();

      return entries.filter(entry =>
        entry.title.toLowerCase().includes(lowerQuery) ||
        entry.description.toLowerCase().includes(lowerQuery) ||
        entry.learningOutcomes.some(outcome => 
          outcome.toLowerCase().includes(lowerQuery)
        ) ||
        entry.audioRecording?.transcript?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Failed to search CPD entries:', error);
      return [];
    }
  }

  async getEntriesByType(type: CPDType): Promise<CPDEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => entry.type === type);
    } catch (error) {
      console.error('Failed to get entries by type:', error);
      return [];
    }
  }

  async getEntriesByDateRange(startDate: Date, endDate: Date): Promise<CPDEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => 
        entry.date >= startDate && entry.date <= endDate
      );
    } catch (error) {
      console.error('Failed to get entries by date range:', error);
      return [];
    }
  }

  async exportEntries(format: 'pdf' | 'csv'): Promise<string> {
    // Mock implementation - in real app would generate actual files
    const entries = await this.getAllEntries();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `cpd_export_${timestamp}.${format}`;
    
    // For now, just return a mock file path
    // In real implementation, would generate PDF/CSV and save to FileSystem
    return `${FileSystem.documentDirectory}${fileName}`;
  }

  async syncWithCloud(): Promise<void> {
    // Mock implementation - in real app would sync with cloud service
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
      
      // Update sync status for all entries
      await this.loadEntries();
      this.entries = this.entries.map(entry => ({
        ...entry,
        syncStatus: 'synced',
        updatedAt: new Date(),
      }));
      await this.saveEntries();
    } catch (error) {
      console.error('Failed to sync with cloud:', error);
      throw new Error('Cloud sync failed. Please try again later.');
    }
  }

  // Get CPD statistics
  async getStats(): Promise<CPDStats> {
    try {
      const entries = await this.getAllEntries();
      const currentYear = new Date().getFullYear();
      const lastYear = currentYear - 1;
      
      const currentYearEntries = entries.filter(entry => 
        entry.date.getFullYear() === currentYear
      );
      
      const lastYearEntries = entries.filter(entry => 
        entry.date.getFullYear() === lastYear
      );

      const totalHours = entries.reduce((sum, entry) => sum + entry.duration, 0);
      const hoursThisYear = currentYearEntries.reduce((sum, entry) => sum + entry.duration, 0);
      const hoursLastYear = lastYearEntries.reduce((sum, entry) => sum + entry.duration, 0);

      // Calculate type distribution
      const typeDistribution: { [key in CPDType]: number } = {
        course: 0,
        conference: 0,
        reflection: 0,
        mentoring: 0,
        other: 0,
      };

      entries.forEach(entry => {
        typeDistribution[entry.type] += entry.duration;
      });

      // Calculate compliance (35 hours per year for NMC)
      const requiredHoursPerYear = 35;
      const compliancePercentage = Math.min(100, (hoursThisYear / requiredHoursPerYear) * 100);

      // Next revalidation date (3 years from registration)
      const nextRevalidationDate = new Date();
      nextRevalidationDate.setFullYear(nextRevalidationDate.getFullYear() + 3);

      const monthsInYear = 12;
      const averageHoursPerMonth = entries.length > 0 ? 
        totalHours / Math.max(1, this.getMonthsSinceFirstEntry(entries)) : 0;

      return {
        totalHours: Math.round(totalHours * 10) / 10,
        entriesCount: entries.length,
        hoursThisYear: Math.round(hoursThisYear * 10) / 10,
        hoursLastYear: Math.round(hoursLastYear * 10) / 10,
        averageHoursPerMonth: Math.round(averageHoursPerMonth * 10) / 10,
        typeDistribution,
        compliancePercentage: Math.round(compliancePercentage),
        nextRevalidationDate,
        hoursNeeded: Math.max(0, requiredHoursPerYear - hoursThisYear),
      };
    } catch (error) {
      console.error('Failed to calculate CPD stats:', error);
      throw error;
    }
  }

  // Filter entries
  async filterEntries(filters: CPDFilters): Promise<CPDEntry[]> {
    try {
      let entries = await this.getAllEntries();

      if (filters.type) {
        entries = entries.filter(entry => entry.type === filters.type);
      }

      if (filters.dateFrom) {
        entries = entries.filter(entry => entry.date >= filters.dateFrom!);
      }

      if (filters.dateTo) {
        entries = entries.filter(entry => entry.date <= filters.dateTo!);
      }

      if (filters.hasAudio !== undefined) {
        entries = entries.filter(entry => 
          filters.hasAudio ? !!entry.audioRecording : !entry.audioRecording
        );
      }

      if (filters.hasEvidence !== undefined) {
        entries = entries.filter(entry => 
          filters.hasEvidence ? entry.evidence.length > 0 : entry.evidence.length === 0
        );
      }

      if (filters.starred !== undefined) {
        entries = entries.filter(entry => entry.isStarred === filters.starred);
      }

      if (filters.syncStatus) {
        entries = entries.filter(entry => entry.syncStatus === filters.syncStatus);
      }

      return entries;
    } catch (error) {
      console.error('Failed to filter entries:', error);
      return [];
    }
  }

  // Get NMC categories
  getNMCCategories(): NMCCategory[] {
    return [...this.categories];
  }

  // Private helper methods
  private async loadEntries(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(CPD_ENTRIES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.entries = parsed.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
          createdAt: new Date(entry.createdAt),
          updatedAt: new Date(entry.updatedAt),
        }));
      } else {
        this.entries = this.getMockEntries();
        await this.saveEntries();
      }
    } catch (error) {
      console.error('Failed to load CPD entries:', error);
      this.entries = this.getMockEntries();
    }
  }

  private async saveEntries(): Promise<void> {
    try {
      await AsyncStorage.setItem(CPD_ENTRIES_KEY, JSON.stringify(this.entries));
    } catch (error) {
      console.error('Failed to save CPD entries:', error);
      throw error;
    }
  }

  private getMonthsSinceFirstEntry(entries: CPDEntry[]): number {
    if (entries.length === 0) return 1;
    
    const firstEntry = entries.reduce((earliest, entry) => 
      entry.createdAt < earliest.createdAt ? entry : earliest
    );
    
    const now = new Date();
    const months = (now.getFullYear() - firstEntry.createdAt.getFullYear()) * 12 + 
                   (now.getMonth() - firstEntry.createdAt.getMonth());
    
    return Math.max(1, months);
  }

  // Mock data for demonstration
  private getMockEntries(): CPDEntry[] {
    const now = new Date();
    const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    return [
      {
        id: 'mock_1',
        title: 'Medication Safety Workshop',
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        duration: 2.5,
        type: 'course',
        description: 'Attended a comprehensive workshop on medication safety protocols and error prevention strategies. The session covered high-risk medications, double-checking procedures, and the importance of clear communication during medication administration.',
        learningOutcomes: [
          'Enhanced understanding of high-risk medication protocols',
          'Improved awareness of common medication errors',
          'Developed better communication skills for medication safety'
        ],
        evidence: [],
        nmcCategories: [this.categories[1], this.categories[2]],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        syncStatus: 'synced',
        isStarred: true,
      },
      {
        id: 'mock_2',
        title: 'Patient Communication Reflection',
        date: lastMonth,
        duration: 1,
        type: 'reflection',
        description: 'Reflected on a challenging patient interaction where effective communication was crucial. The situation involved explaining complex treatment options to an anxious patient and their family.',
        learningOutcomes: [
          'Improved active listening skills',
          'Better understanding of patient anxiety management',
          'Enhanced ability to explain complex information clearly'
        ],
        evidence: [],
        nmcCategories: [this.categories[0], this.categories[3]],
        createdAt: lastMonth,
        updatedAt: lastMonth,
        syncStatus: 'synced',
        isStarred: false,
      },
      {
        id: 'mock_3',
        title: 'Infection Control Update',
        date: twoMonthsAgo,
        duration: 3,
        type: 'conference',
        description: 'Attended the annual infection control conference focusing on the latest evidence-based practices and emerging pathogens. Learned about updated PPE protocols and hand hygiene techniques.',
        learningOutcomes: [
          'Updated knowledge of infection control protocols',
          'Understanding of new PPE guidelines',
          'Awareness of emerging infection risks'
        ],
        evidence: [],
        nmcCategories: [this.categories[1], this.categories[2]],
        createdAt: twoMonthsAgo,
        updatedAt: twoMonthsAgo,
        syncStatus: 'synced',
        isStarred: false,
      },
    ];
  }
}

export default new CPDService();
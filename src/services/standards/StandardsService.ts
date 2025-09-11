import AsyncStorage from '@react-native-async-storage/async-storage';
import { Standard, StandardCategory, SearchResult, StandardsServiceInterface, OfflineData } from '../../types/standards.types';

const standardsData = require('../../data/nmcStandards.json');

const OFFLINE_DATA_KEY = 'standards_offline_data';
const LAST_SYNC_KEY = 'standards_last_sync';

class StandardsService implements StandardsServiceInterface {
  
  async getStandards(): Promise<Standard[]> {
    try {
      // First try to get from offline storage
      const offlineData = await this.getOfflineData();
      if (offlineData && offlineData.standards.length > 0) {
        return offlineData.standards;
      }
      
      // Fallback to bundled data
      return this.transformStandardsFromJson();
    } catch (error) {
      console.error('Error getting standards:', error);
      return this.transformStandardsFromJson();
    }
  }

  async getCategories(): Promise<StandardCategory[]> {
    try {
      const offlineData = await this.getOfflineData();
      if (offlineData && offlineData.categories.length > 0) {
        return offlineData.categories;
      }
      
      return this.transformCategoriesFromJson();
    } catch (error) {
      console.error('Error getting categories:', error);
      return this.transformCategoriesFromJson();
    }
  }

  async searchStandards(query: string, categoryId?: string): Promise<SearchResult[]> {
    try {
      const standards = await this.getStandards();
      const lowerQuery = query.toLowerCase();
      
      let filteredStandards = standards;
      if (categoryId) {
        filteredStandards = standards.filter(s => s.category.id === categoryId);
      }
      
      const results = filteredStandards
        .map(standard => {
          const relevanceScore = this.calculateRelevanceScore(standard, lowerQuery);
          const matchedKeywords = standard.keywords.filter(k => 
            k.toLowerCase().includes(lowerQuery)
          );
          const matchedSections = [];
          
          if (standard.title.toLowerCase().includes(lowerQuery)) {
            matchedSections.push('title');
          }
          if (standard.description.toLowerCase().includes(lowerQuery)) {
            matchedSections.push('description');
          }
          if (standard.content.toLowerCase().includes(lowerQuery)) {
            matchedSections.push('content');
          }
          
          return {
            standard,
            relevanceScore,
            matchedKeywords,
            matchedSections,
          };
        })
        .filter(result => result.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return results;
    } catch (error) {
      console.error('Error searching standards:', error);
      return [];
    }
  }

  async getStandardById(id: string): Promise<Standard | null> {
    try {
      const standards = await this.getStandards();
      return standards.find(s => s.id === id) || null;
    } catch (error) {
      console.error('Error getting standard by id:', error);
      return null;
    }
  }

  async syncOfflineData(): Promise<void> {
    try {
      // In a real app, this would sync with a remote API
      const offlineData: OfflineData = {
        standards: this.transformStandardsFromJson(),
        categories: this.transformCategoriesFromJson(),
        lastSynced: new Date(),
        version: standardsData.version,
      };
      
      await AsyncStorage.setItem(OFFLINE_DATA_KEY, JSON.stringify(offlineData));
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
    } catch (error) {
      console.error('Error syncing offline data:', error);
      throw error;
    }
  }

  async getOfflineStatus(): Promise<{ isOffline: boolean; lastSync: Date | null }> {
    try {
      const lastSyncStr = await AsyncStorage.getItem(LAST_SYNC_KEY);
      const lastSync = lastSyncStr ? new Date(lastSyncStr) : null;
      const isOffline = !lastSync || (Date.now() - lastSync.getTime()) > 24 * 60 * 60 * 1000; // 24 hours
      
      return { isOffline, lastSync };
    } catch (error) {
      console.error('Error getting offline status:', error);
      return { isOffline: true, lastSync: null };
    }
  }

  private async getOfflineData(): Promise<OfflineData | null> {
    try {
      const data = await AsyncStorage.getItem(OFFLINE_DATA_KEY);
      if (!data) return null;
      
      const parsed = JSON.parse(data);
      return {
        ...parsed,
        lastSynced: new Date(parsed.lastSynced),
        standards: parsed.standards.map((s: any) => ({
          ...s,
          lastUpdated: new Date(s.lastUpdated),
        })),
      };
    } catch (error) {
      console.error('Error getting offline data:', error);
      return null;
    }
  }

  private transformStandardsFromJson(): Standard[] {
    return standardsData.standards.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      category: this.findCategoryById(item.categoryId),
      priority: this.determinePriority(item.isCritical),
      lastUpdated: new Date(item.lastUpdated),
      content: this.buildContent(item),
      keywords: item.keywords,
      relatedStandards: [], // Could be populated from relatedGuidance
    }));
  }

  private transformCategoriesFromJson(): StandardCategory[] {
    return standardsData.categories.map(cat => ({
      id: cat.id,
      name: cat.title,
      description: cat.description,
      color: cat.color,
      icon: cat.icon,
    }));
  }

  private findCategoryById(categoryId: string): StandardCategory {
    const category = standardsData.categories.find(c => c.id === categoryId);
    return category ? {
      id: category.id,
      name: category.title,
      description: category.description,
      color: category.color,
      icon: category.icon,
    } : {
      id: 'unknown',
      name: 'Unknown',
      description: 'Unknown category',
      color: '#666666',
      icon: '❓',
    };
  }

  private determinePriority(isCritical: boolean): 'high' | 'medium' | 'low' {
    return isCritical ? 'high' : 'medium';
  }

  private buildContent(item: any): string {
    let content = item.description + '\n\n';
    
    if (item.examples?.length) {
      content += 'Examples:\n' + item.examples.map((e: string) => `• ${e}`).join('\n') + '\n\n';
    }
    
    if (item.practicalApplications?.length) {
      content += 'Practical Applications:\n' + item.practicalApplications.map((p: string) => `• ${p}`).join('\n') + '\n\n';
    }
    
    if (item.relatedGuidance?.length) {
      content += 'Related Guidance:\n' + item.relatedGuidance.map((g: string) => `• ${g}`).join('\n');
    }
    
    return content.trim();
  }

  private calculateRelevanceScore(standard: Standard, query: string): number {
    let score = 0;
    
    // Title match (highest weight)
    if (standard.title.toLowerCase().includes(query)) {
      score += 10;
    }
    
    // Description match
    if (standard.description.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // Keywords match
    const matchingKeywords = standard.keywords.filter(k => 
      k.toLowerCase().includes(query)
    ).length;
    score += matchingKeywords * 3;
    
    // Content match
    if (standard.content.toLowerCase().includes(query)) {
      score += 2;
    }
    
    // Category match
    if (standard.category.name.toLowerCase().includes(query)) {
      score += 1;
    }
    
    return score;
  }

  // Legacy static methods for backwards compatibility
  static getAll(): Standard[] {
    const service = new StandardsService();
    return service.transformStandardsFromJson();
  }

  static filterByCategory(category: StandardCategory): Standard[] {
    const service = new StandardsService();
    return service.transformStandardsFromJson().filter(s => s.category.id === category.id);
  }

  static search(query: string): Standard[] {
    const service = new StandardsService();
    const results = service.transformStandardsFromJson().filter(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.description.toLowerCase().includes(query.toLowerCase()) ||
      s.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
    );
    return results;
  }
}

// Export both class and instance for different usage patterns
export default StandardsService;